"""Fast answer path: data -> chart choice -> rendered blocks. No prose synthesis.

The original pipeline ends by asking the LLM to WRITE the answer: the whole tool
result is stuffed into a prompt and the model produces several paragraphs. That
call is the slow part -- ~6,800 prompt tokens, and with a reasoning model
(deepseek-v4-flash) it spends its entire budget on reasoning tokens and either
times out or returns empty content.

This path removes that call. The LLM is used for ONE cheap decision -- which
chart fits the question, ~200 tokens in, ~10 tokens out -- and everything the
user sees is built deterministically from oncosuite_gold rows. Facts come from
SQL, so nothing here can hallucinate; the model only picks a visualisation.
"""

import re
import time

from chart_data import build_chart, enabled_specs
from chart_select import select_charts

# Questions of the form "list all <modality> trials ..." get the multi-panel
# cohort dashboard (table + adverse events + scatter) rather than a single
# chart, matching how the ctsearch app presents a cohort landscape.
_MODALITY_CUES = {
    "Antibody-Drug Conjugate (ADC)": (r"\badc\b", r"antibody[- ]drug conjugate"),
    "Bispecific Antibody": (r"\bbispecific",),
    "Cell Therapy": (r"\bcell therapy\b", r"\bcar[- ]?t\b"),
    "Cancer Vaccine": (r"\bvaccine",),
    "Radiopharmaceutical": (r"\bradiopharmaceutical",),
}


# NCT ids (NCT + 8 digits) and OncoSuite ids (three dash-separated 3-char
# groups, e.g. 8bN-3eH-W5g). Both appear as plain text throughout the rendered
# answers.
_ID_RE = re.compile(
    r"(?<![\w>-])(NCT\d{8}|[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3})(?![\w<-])"
)

# Anything inside a tag, an existing anchor, or a data attribute must be left
# alone -- rewriting those would corrupt the markup or double-wrap a link.
# Order matters: the anchor alternative must come FIRST, otherwise the generic
# tag pattern matches "<a ...>" alone and the link text is left exposed to
# rewriting, producing a button nested inside an anchor.
_SKIP_RE = re.compile(r"<a\b[^>]*>.*?</a>|<[^>]*>", re.S | re.I)


def linkify_trial_ids(html: str) -> str:
    """Wrap trial ids in the rendered answer so clicking one opens the drawer.

    The front-end delegates on `.trial-link` and reads data-trial-id; NCT ids
    are resolved to their oncosuite_id server-side when the drawer is fetched,
    so either form can be passed through as-is here.
    """
    if not html:
        return html

    out, pos = [], 0
    for skip in _SKIP_RE.finditer(html):
        out.append(_ID_RE.sub(_wrap_id, html[pos:skip.start()]))
        out.append(skip.group(0))          # tags / existing links untouched
        pos = skip.end()
    out.append(_ID_RE.sub(_wrap_id, html[pos:]))
    return "".join(out)


def _wrap_id(m):
    ident = m.group(1)
    # The tooltip has to match where the click actually goes (see App.jsx's
    # onServerAnswerClick): an NCT number opens its ClinicalTrials.gov record,
    # an OncoSuite id opens our own summary drawer. One shared label was
    # promising an executive summary for both.
    is_nct = bool(re.fullmatch(r"NCT\d{8}", ident, re.IGNORECASE))
    title = ("Open on ClinicalTrials.gov" if is_nct
             else "Open executive summary")
    return (f'<button type="button" class="trial-link" '
            f'data-trial-id="{ident}" title="{title}">{ident}</button>')


# Analytics questions answer straight from the analytics schema. The router
# classifies these as out-of-scope or sends them to a tool that returns nothing
# (mechanisms of action -> get_competitive_landscape -> 0 rows), so they are
# matched here BEFORE routing and answered from the pre-computed views.
_ANALYTICS_CUES = (
    # Checked before the scatter: these ask for the underlying rows, not a chart.
    ("EfficacySafetyRows", (
        r"(raw|all|every|list|audit).*(endpoint row|endpoint value|measurement)",
        r"endpoint rows",
        r"(efficacy|safety).*(raw data|row level|all rows)",
    )),
    ("EfficacySafetyScatter", (
        r"efficacy\s*(vs\.?|versus|and)\s*safety",
        r"\bsafety\s*(vs\.?|versus)\s*efficacy",
        r"\b(orr|response rate)\b.*\b(safety|toxicity|ae|sae)\b",
        r"\b(safety|toxicity)\b.*\b(orr|response rate)\b",
    )),
    # Route of administration -- checked first because "oral"/"IV" questions
    # carry no other cue that would match.
    ("ModeOfAdministration", (
        r"mode\s+of\s+administration", r"route\s+of\s+administration",
        r"\b(administered|administration)\b",
        r"\b(intravenous|subcutaneous|per\s*oral|intramuscular|intratumoral)\b",
        r"\b(iv|po|sc|im)\s+(vs\.?|versus)\s+\w+",
    )),
    # Biomarkers / molecular targets, before the backbone cues so a question
    # naming EGFR opens the biomarker panel rather than the backbone one.
    ("TopBiomarkers", (
        r"\btop\s+(biomarker|target)", r"\bbiomarker",
        r"\btop\s+targets?\b", r"\bmolecular\s+target",
    )),
    # Checked BEFORE TreatmentStrategiesTable: these ask WHICH backbones /
    # mechanisms dominate (or want them split by phase), which is the phase-bar
    # chart -- ctsearch's own Top Backbones panel. The table below answers the
    # narrower "list the strategies" ask.
    ("TopBackbones", (
        r"\btop\s+(backbone|moa|mechanism|drug|drug\s*class)",
        r"\b(backbone|mechanism[s]?\s+of\s+action|\bmoa\b|drug\s*class)\b"
        r".*\bby\s+phase\b",
        r"\bby\s+phase\b.*\b(backbone|mechanism|moa|drug\s*class)",
        # Either order: "most common backbones" and "which backbones are most
        # common" are the same question.
        r"\b(most|which)\b.*\b(backbone|mechanism|moa|drug\s*class|regimen)",
        r"\b(backbone|mechanism|moa|drug\s*class)\b.*\bdistribution\b",
    )),
    ("TreatmentStrategiesTable", (
        r"mechanism[s]?\s+of\s+action", r"\bmoa\b", r"treatment strateg",
        r"\bmodalit", r"\bbackbone\b",
    )),
    # The chart owns "competition intensity" and "enrollment/recruitment speed"
    # outright -- either concept alone is enough. Two earlier problems:
    #   * the patterns required BOTH concepts in one regex, so a typo in either
    #     half ("competition intsity vs enrollment speed") fell through; and
    #   * FeasibilityTable/CompetitionTable below also claimed those phrases and
    #     were listed FIRST, so detect_analytics -- which returns the first
    #     match in tuple order -- answered with a table instead of the chart.
    # `intensity` is matched loosely (`int\w*sity`) because it is the word users
    # most often mistype. The tables keep only the phrases unique to them.
    # Checked BEFORE CompetitionVsEnrollment: "amendment risk vs enrollment
    # speed" names both concepts, and amendment is the more specific signal --
    # otherwise the enrollment-speed pattern below claims it.
    ("AmendmentRisk", (
        r"amendment", r"protocol change",
    )),
    ("CompetitionVsEnrollment", (
        r"compet\w*\s+int\w*sity", r"competitive\s+int\w*sity",
        r"\bcompetition\b.*\bcountr",
        r"(enrol|enroll|recruit)\w*\s+speed",
        r"speed\s+of\s+(enrol|enroll|recruit)",
    )),
    ("TrialDurationByCountry", (
        r"trial duration", r"how long.*trial", r"study start[- ]?up.*countr",
        r"duration by country",
    )),
    ("FeasibilityTable", (
        r"\bfeasibilit", r"start[- ]?up", r"recruitment window",
    )),
    ("CompetitionTable", (
        # Only the explicit "as a table" ask -- the bare concepts now go to the
        # chart above.
        r"competit\w*.*\b(table|rows|list)\b",
        r"\b(table|rows|list)\b.*competit\w*",
    )),
)


def detect_analytics(question: str):
    """Analytics chart name for this question, or None."""
    q = (question or "").lower()
    for name, patterns in _ANALYTICS_CUES:
        if any(re.search(p, q) for p in patterns):
            return name

    # No keyword matched, but the question may name a biomarker, target or route
    # of administration outright ("HER2 trials", "EGFR in phase 2"). Those are
    # only recognisable against the real vocabulary, so this check is last --
    # after every explicit cue has had its say.
    try:
        from analytics_data import biomarkers_from_question
        named = biomarkers_from_question(question)
        if named.get("mode"):
            return "ModeOfAdministration"
        if named.get("biomarker") or named.get("target"):
            return "TopBiomarkers"
    except Exception:
        pass
    return None


# Map questions have an unambiguous keyword signal ("map", "where are the
# sites", ...), so route them the same deterministic way as the analytics
# cues above rather than spending the LLM chart-pick call on them.
_EPIDEMIOLOGY_CUES = (
    r"case volume", r"cancer case", r"\bepidemiolog", r"\bincidence\b",
    r"annual new case", r"new cancer case", r"addressable population",
)

_MAP_CUES = (
    # Checked before SiteMap: "site density map" etc. would otherwise match
    # SiteMap's broader "site...map" pattern first. PopulationMap answers
    # trial-SITE density-by-country/region; SiteMap answers "where are the
    # individual sites" -- keep the cues on the word that distinguishes them.
    ("PopulationMap", (
        r"density.*\bmap\b", r"\bmap\b.*density",
        r"\bconcentrat(ion|ed)\b.*\b(site|trial)", r"\b(site|trial).*\bconcentrat",
        r"distribution.*(site|trial).*countr", r"(site|trial).*distribution.*countr",
        r"density by countr", r"by countr.*density",
    )),
    # Epidemiology / case-volume phrasing IS backed by real data now
    # (oncosuite_gold.map_view_population) -- route it to CaseBurdenMap, not
    # the trial-site PopulationMap. Listed as its own entry (not folded into
    # _EPIDEMIOLOGY_CUES's tuple directly) so this stays the single source of
    # truth for the map-cue -> chart-name mapping.
    # Epidemiology questions now go to ctsearch's OWN population map, fetched
    # from /analytics/population and mapped by its own buildPopulationMapPoints
    # -- the same picture the Patient Intelligence tab shows, and it honours the
    # same country / organ / histology / biomarker / stage / line filters.
    # CaseBurdenMap (our own map_view_population build) stays available as a
    # named chart but is no longer what these cues select.
    ("CancerCasesMap", _EPIDEMIOLOGY_CUES),
    ("SiteMap", (
        r"\bsite(s)?\b.*\bmap\b", r"\bmap\b.*\bsite(s)?\b", r"\bmap view\b",
        r"where\s+(are|is).*(sites?|facilit(y|ies))",
        r"(sites?|facilit(y|ies)).*\b(located|running)\b",
        r"(sites?|facilit(y|ies)).*\blocat",
    )),
)


def detect_map_chart(question: str):
    """Map chart name for this question, or None."""
    q = (question or "").lower()

    # Checked first: a named country + "map" ("show me the map for China and
    # its trial sites") is a stronger, more specific signal than SiteMap's
    # generic "map...site(s)" pattern below, which would otherwise catch
    # phrasings like this too (it only means "sites" appears somewhere after
    # "map", not that a whole-country drill-down was intended). Epidemiology
    # phrasing is checked by the loop below (CaseBurdenMap), so this default
    # to PopulationMap only applies to a bare "map" + country with no other cue.
    if re.search(r"\bmap\b", q) and not is_epidemiology_question(q):
        from map_data import _country_in_question
        if _country_in_question(question):
            return "PopulationMap"

    for name, patterns in _MAP_CUES:
        if any(re.search(p, q) for p in patterns):
            return name

    # The word "map" was named explicitly (often a short follow-up, e.g. "show
    # me map for the same"), but nothing more specific matched -- no country,
    # no site/density/epidemiology cue. That's still an unambiguous request
    # for SOME map, not a reason to show nothing: default to PopulationMap,
    # which already renders a sensible view with no country named (the full
    # world view) or scoped to whatever trial ids the question resolved to.
    if re.search(r"\bmap\b", q):
        return "PopulationMap"
    return None


_STAGE_BREAKDOWN_CUES = (
    r"\bby\s+(cancer\s+)?stage\b", r"\bstage[- ]wise\b",
    r"broken\s+down.*\bstage\b", r"\bstage\s+breakdown\b",
)


def detect_case_stage_breakdown(question: str):
    """CaseStageBreakdownTable when the question asks for real case-burden
    numbers broken down by cancer stage for a named lung-cancer driver
    biomarker (EGFR, ALK, KRAS, ...) -- oncosuite_gold.case_filters is the
    only table with a stage dimension; map_view_population (CaseBurdenMap)
    has none. Returns the chart name or None."""
    q = (question or "").lower()
    if not is_epidemiology_question(q):
        return None
    if not any(re.search(p, q) for p in _STAGE_BREAKDOWN_CUES):
        return None
    from map_data import _lung_biomarker_in_question
    if not _lung_biomarker_in_question(question):
        return None
    return "CaseStageBreakdownTable"


def is_epidemiology_question(question: str) -> bool:
    """True if the question asks for real case-volume/incidence numbers --
    now backed by real data (oncosuite_gold.map_view_population, routed to
    CaseBurdenMap). Kept as a helper for any caller that still wants to detect
    this phrasing (e.g. to caveat PopulationMap if the LLM fallback ever picks
    it for an epidemiology-flavored question instead)."""
    q = (question or "").lower()
    return any(re.search(p, q) for p in _EPIDEMIOLOGY_CUES)


def detect_dashboard(question: str):
    """Modality for a cohort-landscape question, or None."""
    q = (question or "").lower()
    if not re.search(r"\b(list|show|all|landscape|overview)\b", q):
        return None
    for modality, patterns in _MODALITY_CUES.items():
        if any(re.search(p, q) for p in patterns):
            return modality
    return None


# Questions asking for cross-table patterns rather than a specific trial list --
# answered with complex_insights.build_relationship_dashboard instead of a
# single chart, since no single-table query captures a drug-combination
# network, a biomarker/hazard-ratio comparison, a sponsor concentration index,
# or a site-vs-epidemiology gap.
_RELATIONSHIP_CUES = (
    r"\brelationship", r"\bcorrelat", r"\bpattern", r"\bconnection",
    r"drug combination", r"combination network", r"\bnetwork\b",
    r"sponsor.*(mechanism|moa|specializ)", r"\bhazard ratio\b.*biomarker",
    r"biomarker.*\bhazard ratio\b", r"under[- ]?served", r"feasibility.*(epidemiolog|case burden)",
    r"complex.*(insight|analysis)", r"\bcross[- ]?trial\b",
)


def detect_relationship_insights(question: str) -> bool:
    """True for questions asking about cross-table relationships/patterns
    rather than a specific trial, cohort or country lookup."""
    q = (question or "").lower()
    return any(re.search(p, q) for p in _RELATIONSHIP_CUES)


def _fmt_count(n):
    return f"{n:,}"


def _build_map_insights(props):
    """Fact + so-what bullets computed from a geography chart's own country-
    level points (SiteMap/PopulationMap: `sites`; CaseBurdenMap: `caseCount`)
    -- which countries dominate, how concentrated the footprint is. Returns
    [] rather than guessing when there's nothing meaningful to compare (fewer
    than 2 countries, or no numeric metric on the points at all)."""
    points = props.get("data") or []
    if len(points) < 2:
        return []

    metric_key = ("sites" if any(p.get("sites") is not None for p in points)
                 else "caseCount" if any(p.get("caseCount") is not None for p in points)
                 else None)
    if not metric_key:
        return []

    ranked = sorted((p for p in points if p.get(metric_key) is not None),
                    key=lambda p: p[metric_key], reverse=True)
    total = sum(p[metric_key] for p in ranked)
    if len(ranked) < 2 or total <= 0:
        return []

    label = "trial sites" if metric_key == "sites" else "annual cases"
    so_what = ("recruitment competition among sites will likely be highest here"
              if metric_key == "sites"
              else "the largest share of the underlying patient population sits here")
    top = ranked[0]
    top_pct = round(100 * top[metric_key] / total)
    items = [
        f"**{top.get('name')}** leads with {top[metric_key]:,} {label} "
        f"({top_pct}% of the total across all {len(ranked)} countries shown) -- {so_what}."
    ]
    if len(ranked) >= 3:
        top3 = ranked[:3]
        top3_pct = round(100 * sum(p[metric_key] for p in top3) / total)
        names = ", ".join(p.get("name") for p in top3)
        spread = "a concentrated" if top3_pct >= 60 else "a fairly spread-out"
        items.append(
            f"The top 3 countries ({names}) account for {top3_pct}% of all {label} -- "
            f"{spread} geographic footprint across the {len(ranked)} countries represented."
        )
    return items


# Session memory for case-burden map follow-ups. This app uses one shared
# session (web_app.SESSION_ID) for everyone -- see that module's own comment
# -- so reusing router._sessions here (rather than adding new session-plumbing)
# matches the app's existing single-session design instead of inventing a
# second one.
def _remember_case_burden_countries(countries):
    if not countries:
        return
    from router import _sessions
    from web_app import SESSION_ID
    ws = _sessions.get(SESSION_ID)
    ws["last_case_burden_countries"] = list(countries)
    _sessions.set(SESSION_ID, ws)


def _recall_case_burden_countries():
    from router import _sessions
    from web_app import SESSION_ID
    return _sessions.get(SESSION_ID).get("last_case_burden_countries") or []


# A bare "show me for Hamburg" carries no map/epidemiology keyword at all --
# detect_map_chart returns None for it, and it fell straight through to
# text-to-SQL, which (with no session context) searched map_view_population
# for ANY city named Hamburg worldwide: the real Hamburg, Germany (~1.9M)
# alongside six unrelated small US towns also named Hamburg, presented
# side by side with no ordering and no chart (the auto-chart drew the
# SAME country repeated once per matching city instead of one bar per
# country -- see web_app._auto_bar_chart's dedup fix). This resolves the
# follow-up against the session's last-named case-burden countries instead.
_CITY_FOLLOWUP_CUES = (
    r"^show\s+me\s+for\s+(.+)$", r"^show\s+for\s+(.+)$",
    r"^what\s+about\s+(.+)$", r"^and\s+for\s+(.+)$", r"^for\s+(.+)$",
)


def detect_case_burden_city_followup(question: str):
    """The city name from a bare "show me for X"/"what about X" follow-up
    naming just a place, when this session has a remembered case-burden
    country scope to resolve it against -- else None. Deliberately narrow
    (a handful of fixed lead-in phrases, not "any short message") so a real
    new question naming its own condition/drug/etc. is never mistaken for
    this."""
    q = (question or "").strip()
    if not q or len(q.split()) > 6:
        return None
    remembered = _recall_case_burden_countries()
    if not remembered:
        return None
    for pattern in _CITY_FOLLOWUP_CUES:
        m = re.match(pattern, q, re.IGNORECASE)
        if m:
            city = m.group(1).strip(" ?.!")
            return city, remembered
    return None


# Checked BEFORE _ANALYTICS_CUES: "mechanism of action"/"backbone" alone would
# otherwise match TreatmentStrategiesTable's pattern (raw trial/arm COUNTS by
# MoA) even when the question is actually asking to compare EFFECTIVENESS
# (PFS/OS/ORR) across those groups -- a materially different question that
# table can't answer at all.
_EFFECTIVENESS_MECHANISM_CUES = (
    r"mechanism[s]?\s+of\s+action", r"\bmoa\b", r"\bbackbone[s]?\b", r"drug class",
)
_EFFECTIVENESS_CUES = (
    r"\bpfs\b", r"\bos\b", r"\borr\b", r"\beffective", r"\befficacy\b",
)


def detect_efficacy_by_mechanism(question: str):
    """'NSCLC'/'SCLC' when the question asks to compare PFS/OS/ORR
    effectiveness across drug mechanism/backbone groups for that condition,
    else None. See chart_data.build_efficacy_by_moa/_backbone."""
    q = (question or "").lower()
    if not any(re.search(p, q) for p in _EFFECTIVENESS_MECHANISM_CUES):
        return None
    if not any(re.search(p, q) for p in _EFFECTIVENESS_CUES):
        return None
    from chart_data import _condition_in_question
    return _condition_in_question(question)


# Requires BOTH a differentiation/comparison verb AND a named dimension, so a
# bare "trials for EGFR NSCLC" (no comparison intent) or a generic "compare X
# vs Y" arm comparison (already handled elsewhere) isn't mistaken for this.
_DIFFERENTIATION_VERB_CUES = (
    r"\bdiffer(?:s|ing|entiat\w*)?\b", r"compar\w*\s+(?:program|trial)",
    r"how\s+(?:do|are)\s+.*\b(?:trials?|programs?)\b.*\bdiffer",
    r"\bdifferentiat\w*\b", r"competing\s+program",
)
_DIFFERENTIATION_DIMENSION_CUES = (
    r"trial design", r"patient selection", r"biomarker strategy",
    r"\bendpoints?\b", r"line of therapy", r"combination regimen",
    r"\bregimen", r"\barchitecture\b", r"\bblinding\b", r"\brandomi[sz]",
    r"\bdesign\b",
)


def detect_differentiation_matrix(question: str) -> bool:
    """True when the question asks how competing trials/programs DIFFER --
    trial design, patient selection, biomarker strategy, endpoints, line of
    therapy, combination regimens -- rather than just listing/counting them.
    See chart_data.build_differentiation_matrix."""
    q = (question or "").lower()
    if not any(re.search(p, q) for p in _DIFFERENTIATION_VERB_CUES):
        return False
    return any(re.search(p, q) for p in _DIFFERENTIATION_DIMENSION_CUES)


def build_fast_answer(question: str, tool_result: dict, oncosuite_ids: list,
                      resp: dict = None) -> dict:
    """Blocks for one answer: the existing rendered answer, then the charts.

    `resp` is the full handle_turn response. When supplied, web_app's renderers
    produce the trial detail / search results / landscape / comparison output as
    an html block, so the React UI covers every answer type the server-rendered
    page did -- not just the ones with a native chart.

    Returns {"blocks": [...], "timings": {...}} -- timings are reported so the
    cost of each stage stays visible rather than hiding inside one opaque call.
    """
    t0 = time.time()

    # Bare "show me for Hamburg"-style follow-up naming just a city, against
    # this session's last case-burden country scope -- checked FIRST since
    # `resp` at this point is whatever the router's normal cascade produced
    # for a message like this with no context (usually a bad text-to-SQL
    # guess), which this replaces outright rather than layering on top of.
    city_followup = detect_case_burden_city_followup(question)
    if city_followup:
        city, countries = city_followup
        from map_data import build_case_burden_city
        props = build_case_burden_city(city, countries=countries)
        if props:
            return {
                "blocks": [
                    {"type": "intro",
                     "text": f"Showing case-burden data for **{city.title()}** within "
                             f"your last search's countries ({', '.join(c.title() for c in countries)})."},
                    {"type": "chart", "chart": "CaseBurdenMap", "props": props},
                ],
                "timings": {"select_s": 0.0, "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": ["CaseBurdenMap"],
                "available": list(enabled_specs()),
            }

    # Cohort-landscape questions ("list all ADC trials ...") answer with the
    # multi-panel dashboard built straight from SQL -- no chart-selection call.
    modality = detect_dashboard(question)
    if modality:
        from dashboard import build_cohort_dashboard
        years = 10
        m = re.search(r"last\s+(\d{1,2})\s+years?", (question or "").lower())
        if m:
            years = int(m.group(1))
        dash = build_cohort_dashboard(modality=modality, years=years)
        if dash:
            return {
                "blocks": dash["blocks"],
                "timings": {"select_s": 0.0, "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": [b["chart"] for b in dash["blocks"] if b["type"] == "chart"],
                "meta": dash["meta"],
                "available": list(enabled_specs()),
            }

    # Cross-table relationship questions ("drug combination patterns",
    # "sponsor specialization", "under-served countries by case burden") get a
    # database-wide relationship report -- these facts don't live in any one
    # table, so there's no single SQL result to hand to chart selection.
    if detect_relationship_insights(question):
        from complex_insights import build_relationship_dashboard
        rel = build_relationship_dashboard()
        if rel:
            return {
                "blocks": rel["blocks"],
                "timings": {"select_s": 0.0, "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": [b["chart"] for b in rel["blocks"] if b["type"] == "chart"],
                "meta": rel["meta"],
                "available": list(enabled_specs()),
            }

    # "Which MoA/backbone is most effective" -- checked before _ANALYTICS_CUES
    # so it isn't swallowed by TreatmentStrategiesTable's plain "mechanism of
    # action"/"backbone" keyword match, which only answers trial/arm counts,
    # not effectiveness.
    condition = detect_efficacy_by_mechanism(question)
    if condition:
        from chart_data import (build_efficacy_by_moa, build_efficacy_by_backbone,
                                _MIN_ARMS_FOR_MEDIAN)
        moa_props = build_efficacy_by_moa([], question=question)
        backbone_props = build_efficacy_by_backbone([], question=question)
        out = []
        if moa_props or backbone_props:
            out.append({
                "type": "intro",
                "text": (
                    f"Comparing PFS/OS/ORR across drug mechanism and backbone "
                    f"groups for **{condition}**, from verified oncosuite_gold "
                    f"outcomes (analytics schema has no OS/PFS data for any "
                    f"condition). Only groups with at least "
                    f"{_MIN_ARMS_FOR_MEDIAN} reporting arms per metric are shown."
                ),
            })
        if moa_props:
            out.append({"type": "chart", "chart": "EfficacyByMoATable", "props": moa_props})
        if backbone_props:
            out.append({"type": "chart", "chart": "EfficacyByBackboneTable", "props": backbone_props})
        if out:
            out.append({
                "type": "note",
                "title": "Reading this comparison",
                "items": [
                    "These are medians pooled across different trials, not a "
                    "head-to-head randomized comparison -- differing patient "
                    "populations, lines of therapy, and trial eras all "
                    "influence ORR/OS/PFS. A higher median here is "
                    "descriptive, not proof one group is more effective.",
                ],
            })
            return {
                "blocks": out,
                "timings": {"select_s": 0.0, "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": [b["chart"] for b in out if b["type"] == "chart"],
                "available": list(enabled_specs()),
            }

    # "How do these competing trials differ in design/biomarker strategy/..."
    # -- checked before _ANALYTICS_CUES for the same reason as the efficacy
    # block above: TreatmentStrategiesTable's plain "mechanism of action" match
    # would otherwise swallow this and answer with trial/arm counts instead of
    # the side-by-side comparison actually asked for.
    if detect_differentiation_matrix(question):
        from chart_data import build_differentiation_matrix, _MAX_DIFFERENTIATION_TRIALS
        props = build_differentiation_matrix(oncosuite_ids or [], question=question)
        if props:
            n_trials = len({row["trial"] for row in props["data"]})
            out = [
                {
                    "type": "intro",
                    "text": (
                        f"Comparing **{n_trials}** competing trial(s) on design, "
                        f"patient selection, biomarker strategy, line of therapy "
                        f"and combination regimen -- one row per cohort, since "
                        f"these can vary by cohort within a single trial (e.g. a "
                        f"basket or umbrella design)."
                    ),
                },
                {"type": "chart", "chart": "DifferentiationMatrixTable", "props": props},
                {
                    "type": "note",
                    "title": "Reading this comparison",
                    "items": [
                        "Each row is one cohort, not one trial -- a trial with "
                        "several cohorts (e.g. a basket trial) appears once per "
                        "cohort, since biomarker/stage/line-of-therapy/regimen "
                        "genuinely differ between them.",
                        "Use the column filters (Sponsor, Phase, Biomarker, "
                        "Stage, Line of Therapy, ...) to narrow to the programs "
                        "you're comparing head-to-head.",
                    ],
                },
            ]
            return {
                "blocks": out,
                "timings": {"select_s": 0.0, "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": ["DifferentiationMatrixTable"],
                "available": list(enabled_specs()),
            }
        elif oncosuite_ids and len(oncosuite_ids) > _MAX_DIFFERENTIATION_TRIALS:
            # Too broad a scope for a side-by-side comparison -- say so rather
            # than silently falling through to a plain search answer with no
            # explanation of why the requested comparison view didn't appear.
            blocks_note = {
                "type": "intro",
                "text": (
                    f"This search matched **{len(oncosuite_ids)}** trials -- too "
                    f"many to show as a single side-by-side comparison. Narrow "
                    f"the search (e.g. by sponsor, phase, or line of therapy) "
                    f"to compare a smaller set of competing programs."
                ),
            }
            # Fall through to the normal answer below, with this note prepended.
            blocks = [blocks_note]

    # Analytics questions are served straight from the analytics schema: the
    # router either marks them out of scope or picks a tool that returns no rows
    # ("mechanisms of action" -> get_competitive_landscape -> 0 rows), so
    # deferring to its result would lose the answer entirely.
    analytics_chart = detect_analytics(question)
    if analytics_chart:
        props = build_chart(analytics_chart, oncosuite_ids or [], question=question)
        if props:
            # Each chart names its payload differently: liveData (scatter, per
            # arm), data (table), rows (trial-duration bars), points (feasibility
            # scatters). Count whichever is present so the intro is never "0".
            items = (props.get("liveData") or props.get("data")
                     or props.get("rows") or props.get("points") or [])
            n = len(items)
            label = ("arms" if props.get("liveData")
                     else "countries" if analytics_chart in (
                         "TrialDurationByCountry", "CompetitionVsEnrollment")
                     else "trials" if analytics_chart == "AmendmentRisk"
                     else "rows")

            # The chart's own badge counts only what the CURRENT axis pair can
            # plot, so state both numbers rather than let the intro contradict
            # the badge.
            text = f"Answering from the analytics dataset: **{n}** {label}."
            dx, dy = props.get("defaultX"), props.get("defaultY")
            plotted = (props.get("pairCounts") or {}).get(f"{dx}|{dy}")
            if plotted is not None and plotted < n:
                text = (f"Answering from the analytics dataset: **{n}** {label}, "
                        f"of which **{plotted}** report both {dx} and {dy}.")
            elif analytics_chart == "EfficacySafetyScatter" and dx and dy:
                # ctsearch's EfficacyVsSafety component (vendored, unmodified)
                # has no title slot at all, so this is the only place the
                # reader learns what's actually plotted on each axis.
                text += f" Comparing {dx} (efficacy) against {dy} (safety) by default."

            out = [
                {"type": "intro", "text": text},
                {"type": "chart", "chart": analytics_chart, "props": props},
            ]
            # Charts that fetch their own data from ctsearch's analytics API
            # carry only the question's intent (dimension/filters), so there is
            # nothing here to count. Answer in words and numbers FIRST -- what
            # the data shows, then the figures behind it -- and let the chart
            # close the answer, rather than dropping a bare chart on the reader.
            if props.get("selfFetching"):
                from analytics_data import filters_from_question
                _qf = filters_from_question(question)
                if props.get("graph") == "efficacy_vs_safety_scatter":
                    # Endpoint COVERAGE is the story for this chart, not a
                    # ranked dimension -- it can only plot arms reporting both
                    # an efficacy and a safety value, which is why a sparse
                    # scatter sits under a large cohort count.
                    from chart_data import narrate_efficacy_safety
                    narration = narrate_efficacy_safety(
                        props.get("apiFilters"), _qf)
                else:
                    from chart_data import narrate_dimension
                    narration = narrate_dimension(
                        props.get("graph"), props.get("dimension"),
                        props.get("apiFilters"),
                        # Same filters the chart is scoped to, so the prose and
                        # the chart describe the same slice.
                        _qf,
                    )
                # Order the answer the way a person would give it: say what the
                # data shows, show the figures, then the chart, and close with
                # the takeaways -- so the conclusions land after the reader has
                # seen the evidence, not before.
                lead = [b for b in (narration or []) if b["type"] != "insights"]
                closing = [b for b in (narration or []) if b["type"] == "insights"]
                out = lead + out[1:] + closing
            else:
                # Charts that DO carry their own rows get the same shape, from
                # the generic narrator. Without this, only the self-fetching
                # charts read as full answers and the rest stayed a one-line
                # intro plus a bare picture.
                try:
                    from chart_data import narrate_generic
                    _gen = narrate_generic(analytics_chart, props, question)
                except Exception:
                    _gen = []
                if _gen:
                    _lead = [b for b in _gen if b["type"] != "insights"]
                    _close = [b for b in _gen if b["type"] == "insights"]
                    # The generic paragraph replaces the bare "Answering from
                    # the analytics dataset: N rows" line, which said nothing
                    # about what the data actually shows.
                    out = _lead + out[1:] + _close
            charts = [analytics_chart]

            # The raw-rows table is the data BEHIND the scatter, so show the
            # chart alongside it rather than making the user ask twice.
            if analytics_chart == "EfficacySafetyRows":
                scatter = build_chart("EfficacySafetyScatter", oncosuite_ids or [],
                                      question=question)
                if scatter:
                    arms = len(scatter.get("liveData") or [])
                    sdx, sdy = scatter.get("defaultX"), scatter.get("defaultY")
                    out[0]["text"] = (
                        f"Answering from the analytics dataset: **{n}** endpoint "
                        f"rows across **{arms}** arms"
                        + (f", comparing {sdx} (efficacy) against {sdy} (safety) "
                           "by default." if sdx and sdy else ".")
                    )
                    out.insert(1, {"type": "chart",
                                   "chart": "EfficacySafetyScatter",
                                   "props": scatter})
                    charts.insert(0, "EfficacySafetyScatter")

            return {
                "blocks": out,
                "timings": {"select_s": 0.0, "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": charts,
                "available": list(enabled_specs()),
            }

    blocks = []

    # Everything web_app.py can already render -- trial detail, search results,
    # competitive landscape, arm comparison, locations, endpoints, contacts,
    # ranking, eligibility criteria, SQL results, clarifications -- comes back as
    # one html block. Reimplementing those sixteen renderers in React would
    # duplicate working, tested output; the dashboard adds native chart blocks on
    # top for the cases it covers.
    # Map/geography charts (PopulationMap, CaseBurdenMap, SiteMap) answer
    # database-wide questions and don't need a matched trial id list -- do NOT
    # gate detection behind `oncosuite_ids`, or every geography question with
    # zero matched trials (the normal case) silently gets no chart at all.
    # Detected up front (pure function of the question text) so the html block
    # below can tell a real chart is about to answer the question.
    # Checked first: a stage breakdown is a strictly more specific answer than
    # the country-only CaseBurdenMap when the question names a biomarker and
    # asks for a by-stage split -- see detect_case_stage_breakdown.
    map_chart = detect_case_stage_breakdown(question) or detect_map_chart(question)

    # router._same_search_response resolved a pure follow-up ("show in map")
    # back to a search the user already saw rendered in full on a PREVIOUS
    # turn -- re-rendering that same intro/table/insights here would just
    # repeat what's already above in the conversation. When a map chart is
    # about to answer the actual new content of this turn, replace all of
    # that with one short line instead of the full repeat.
    same_search_recap = bool(resp and resp.get("same_search_followup") and map_chart)

    # A question phrased PURELY as a location ask ("where are the sites for
    # NSCLC trials?") is not asking for a trial-by-trial breakdown at all --
    # "NSCLC" there is just the map's scope, not a request to also see a phase
    # donut and sponsor-concentration bullets. Seen directly: this generic
    # search-summary content got shown as if it were the answer to a purely
    # geographic question, with nothing about phase/sponsor/status relevant
    # to "where." Only suppress it when the question does NOT also carry
    # explicit listing intent ("show all/list every trial ..."), since THAT
    # phrasing means the user wants the full breakdown AND the map together.
    _LISTING_INTENT_CUES = ("show all", "show me all", "list all", "list every",
                            "all the trials", "all trials", "every trial",
                            "full list", "entire list", "show everything")
    map_only = (bool(map_chart) and not same_search_recap
               and not any(c in question.lower() for c in _LISTING_INTENT_CUES))

    # Narrative framing before the data, Key Insights after -- both computed
    # from the returned rows (see answer_insights), so they cost nothing and
    # cannot state anything the result set does not support.
    intro = None
    insights = []
    if same_search_recap:
        total = tool_result.get("total_matches") if isinstance(tool_result, dict) else None
        if total is not None:
            blocks.append({"type": "intro",
                           "text": f"Showing the same **{_fmt_count(total)}** trial(s) on the map below."})
    elif map_only:
        total = tool_result.get("total_matches") if isinstance(tool_result, dict) else None
        if total is not None:
            blocks.append({"type": "intro",
                           "text": f"Showing site locations for **{_fmt_count(total)}** matching trial(s)."})
    else:
        try:
            from answer_insights import build_intro, build_key_insights
            intro = build_intro(question, tool_result)
            insights = build_key_insights(question, tool_result)
        except Exception:
            pass

        # One extra cross-table relationship bullet (drug-combination
        # network), scoped to just the trials this answer matched -- capped
        # so a broad, low-selectivity search doesn't turn an otherwise-instant
        # per-answer bullet into a full-database scan.
        if oncosuite_ids and len(oncosuite_ids) <= 300:
            try:
                from complex_insights import drug_combination_insights
                combo = drug_combination_insights(oncosuite_ids, limit=1)
                if combo["bullets"]:
                    insights = list(insights) + combo["bullets"][:1]
            except Exception:
                pass

        if intro:
            blocks.append({"type": "intro", "text": intro})

    # TRIAL COMPARISON -> its own component, not the generic HTML render. A
    # markdown table leaves the reader diffing two columns by eye; the component
    # highlights the differing rows, collapses the identical ones and bars the
    # numeric gaps. Returns immediately: the generic path below would also emit
    # a "Found N matching trial(s)" line, where N is the number of comparison
    # FIELDS -- which is where the nonsensical "Found 16 matching trial(s)" over
    # a two-trial comparison came from.
    # POSTED-RESULTS CHECK -> the router already built the prose, the "what is
    # known" detail and the next-step suggestions. Return them directly: the
    # generic path would add a trial table and a "Found N" line, neither of which
    # this question asked for.
    if resp and resp.get("intent") == "posted_results_check":
        _nb = resp.get("narration") or []
        if _nb:
            lead = [b for b in _nb if b["type"] != "insights"]
            closing = [b for b in _nb if b["type"] == "insights"]
            return {
                "blocks": lead + closing,
                "timings": {"select_s": 0.0,
                            "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": [],
                "available": list(enabled_specs()),
            }

    if resp and resp.get("intent") == "trial_comparison":
        _cmp = resp.get("tool_result") or {}
        if _cmp.get("trials") and _cmp.get("rows"):
            return {
                "blocks": [{"type": "chart", "chart": "TrialComparison",
                            "props": _cmp}],
                "timings": {"select_s": 0.0,
                            "build_s": round(time.time() - t0, 2),
                            "total_s": round(time.time() - t0, 2)},
                "charts": ["TrialComparison"],
                "available": list(enabled_specs()),
            }

    if resp and not same_search_recap and not map_only:
        # The router's "couldn't derive that" note is router.py's own dead-end
        # for this question -- it has no idea answer_fast's regex is about to
        # answer it for real via map_chart below. Showing both reads as a
        # flat contradiction ("out of scope" directly above real data), so
        # skip the note once a map chart will actually answer the question.
        skip_html = (map_chart and resp.get("response_mode") == "out_of_scope_policy_needed")
        if not skip_html:
            try:
                from web_app import render_answer
                html = render_answer(resp, question)
                if html and html.strip():
                    blocks.append({"type": "html", "html": linkify_trial_ids(html)})
            except Exception:
                pass  # a rendering failure must not lose the chart blocks below

    if insights:
        blocks.append({"type": "insights", "title": "Key Insights", "items": insights})

    # "Found N matching trial(s)" only makes sense for an actual trial search
    # (search_trials/search_cohorts, which report total_matches). A generic
    # SQL/other-table answer (e.g. text-to-SQL over map_view_population) still
    # has `rows`, but they are not trials -- and the html block above already
    # states that answer, so skip this line rather than mislabel the rows.
    #
    # This is a FALLBACK, only shown when `intro` (above) is missing: build_intro
    # already states the same total_matches (and, unlike this block, counts
    # "shown" from the actual result rows rather than oncosuite_ids -- which is
    # separately capped for id-linking/map purposes and doesn't reflect how many
    # rows the answer above actually displays). Stating both was not just
    # redundant, oncosuite_ids' cap made this block claim a smaller "showing N"
    # than the table actually rendered.
    total = tool_result.get("total_matches") if isinstance(tool_result, dict) else None

    # Lead line: stated directly from the query result, never written by a model.
    if total is not None and not intro and not same_search_recap and not map_only:
        shown = len(oncosuite_ids)
        text = f"Found {_fmt_count(total)} matching trial(s)"
        if shown and shown < total:
            text += f"; showing {_fmt_count(shown)}"
        blocks.append({"type": "summary", "text": text + "."})

    t_select = time.time()
    if map_chart:
        names = [map_chart]
    else:
        names = select_charts(question)
    t_select = time.time() - t_select

    t_build = time.time()
    for name in names:
        props = build_chart(name, oncosuite_ids, question=question)
        if props:
            # NARRATE THE MAP. A map shows WHERE without saying how many or how
            # the burden compares, which is most of what an incidence question
            # is asking. Same shape as the other charts: prose, then the figures,
            # then the map, then the takeaways.
            _map_narration = []
            try:
                if name == "CancerCasesMap":
                    from chart_data import narrate_population
                    _map_narration = narrate_population(
                        props.get("country"), props.get("apiFilters"))
                else:
                    # EVERY chart gets the same treatment. narrate_generic works
                    # from the SHAPE the chart already returns ({columns,data} or
                    # {points}), so a chart with no bespoke narrator still gets
                    # prose and takeaways instead of being a bare picture --
                    # and returns [] when the props carry nothing worth stating.
                    from chart_data import narrate_generic
                    _map_narration = narrate_generic(name, props, question)
            except Exception:
                _map_narration = []
            blocks.extend(
                b for b in _map_narration if b["type"] != "insights")

            blocks.append({"type": "chart", "chart": name, "props": props})

            # Takeaways close the answer, after the map they describe.
            blocks.extend(b for b in _map_narration if b["type"] == "insights")
            if name == "CaseBurdenMap":
                # Remember which countries this question named, so a later
                # bare "show me for Hamburg" can resolve against them instead
                # of falling through to a context-less worldwide text-to-SQL
                # search -- see detect_case_burden_city_followup.
                from map_data import _case_burden_countries_in_question
                named = _case_burden_countries_in_question(question)
                if named:
                    _remember_case_burden_countries(named)
            if name in ("SiteMap", "PopulationMap", "CaseBurdenMap"):
                # The generic phase/sponsor Key Insights (built from tool_result)
                # say nothing about the geography a map actually answers with --
                # this reads the map's OWN country-level points instead, so a
                # map question isn't left with just a bare count and no "so what."
                map_insights = _build_map_insights(props)
                if map_insights:
                    # Own title (not "Key Insights") so this reads as a distinct
                    # panel rather than a confusing duplicate when it appears
                    # alongside the generic phase/sponsor Key Insights (the
                    # combined-request case, e.g. "show all trials ... on map").
                    blocks.append({"type": "insights", "title": "Geographic Insights",
                                   "items": map_insights})
            if name == "PopulationMap" and is_epidemiology_question(question):
                blocks.append({
                    "type": "note",
                    "title": "Shown as a proxy — not real epidemiology data",
                    "items": [
                        "This map shows trial-site density, not real epidemiological "
                        "case-volume data -- oncosuite_gold has no incidence/case-count "
                        "table. Numbers reflect where trial sites are concentrated, not "
                        "actual patient case volumes.",
                    ],
                })
    t_build = time.time() - t_build

    return {
        "blocks": blocks,
        "timings": {
            "select_s": round(t_select, 2),
            "build_s": round(t_build, 2),
            "total_s": round(time.time() - t0, 2),
        },
        "charts": names,
        "available": list(enabled_specs()),
    }


# ---------------------------------------------------------------------------
# Follow-up questions.
#
# "top MoA" then "what about phase 2?" is one line of thought, not two
# unrelated questions. A fragment like that names a filter but no subject, so
# answering it alone finds nothing. Resolving it means carrying the SUBJECT
# forward from the last real question in this session and letting the new
# fragment override the filters it names.
# ---------------------------------------------------------------------------

# A question is treated as a follow-up when it is short AND either opens with a
# continuation phrase or consists only of filter values. Deliberately narrow: a
# new question that names its own subject must never be merged into the old one.
_FOLLOWUP_OPENERS = (
    r"^\s*(what|how)\s+about\b",
    r"^\s*(and|but|also)\b",
    r"^\s*(now|then)\s+(show|for|in|what)\b",
    r"^\s*(just|only)\b",
    r"^\s*same\b.*\b(for|in|with)\b",
    r"^\s*(for|in|with|by)\b",          # "for phase 2", "in japan"
    r"^\s*(that|those|it|them)\b",
)


def _looks_like_followup(question):
    q = (question or "").strip()
    if not q or len(q.split()) > 8:
        return False
    return any(re.search(p, q, re.IGNORECASE) for p in _FOLLOWUP_OPENERS)


def resolve_followup(question, session_id):
    """The question to actually answer, given this session's history.

    A fragment ("what about phase 2?") is expanded with the subject of the last
    substantive question, so it routes and filters as the user intends. Anything
    that stands on its own is returned unchanged.
    """
    if not session_id or not _looks_like_followup(question):
        return question
    try:
        from conversation import Conversations
        history = Conversations().history(session_id) or []
    except Exception:
        return question

    # The most recent user turn that was NOT itself a fragment -- that is the
    # subject still under discussion.
    for turn in reversed(history):
        if turn.get("role") != "user":
            continue
        prev = (turn.get("content") or "").strip()
        if not prev or _looks_like_followup(prev):
            continue
        # Filters named in the follow-up win; the subject comes from the prior
        # question. Concatenating is enough because every downstream detector
        # (chart routing, filter extraction) reads the whole string.
        return f"{prev} {question.strip()}"
    return question


# ---------------------------------------------------------------------------
# Typo tolerance.
#
# People mistype. "top bimoarkers", "mode of adminstration", "amendmnt risk"
# all clearly mean something, and answering "no match" for a one-character slip
# is the wrong behaviour. So before routing, each word of the question is
# compared against the vocabulary this app actually understands, and a close
# misspelling is corrected.
#
# Two guards keep this from doing damage:
#   * only words of 5+ characters are considered. Short tokens collide far too
#     easily -- "ad" scores 0.80 against "adc", "ma" against "moa" -- and a
#     wrong correction is worse than no correction.
#   * a high similarity floor (0.82). Real typos score 0.90+ ("bimoarkers" vs
#     "biomarkers" = 0.90); genuinely different words score far lower
#     ("biomarkers" vs "backbone" = 0.33), so the gap is wide and safe.
# ---------------------------------------------------------------------------

# The domain words worth correcting TO. Only terms that actually drive routing
# or filtering -- correcting toward a word the app ignores would be noise.
_VOCAB_TERMS = (
    "biomarkers", "biomarker", "backbones", "backbone", "mechanism",
    "mechanisms", "administration", "intravenous", "subcutaneous",
    "intramuscular", "intratumoral", "competition", "competitive", "intensity",
    "enrollment", "enrolment", "recruitment", "amendment", "amendments",
    "duration", "efficacy", "safety", "toxicity", "feasibility", "targets",
    "target", "modality", "classes", "strategies", "distribution", "phase",
    "country", "countries", "trials", "trial", "arms", "cohorts", "endpoint",
    "endpoints", "response", "protocol", "administered", "oral", "speed",
    # Words the "do any of these have published results?" follow-up turns on --
    # without them "publised" (0.94 similar to "published") went uncorrected and
    # the question was not recognised at all.
    "published", "publish", "posted", "results", "result", "outcomes",
    "outcome", "readout", "available", "reported",
)

_MIN_FUZZY_LEN = 5
_FUZZY_THRESHOLD = 0.82


# Misspellings that are themselves real English words, so fuzzy matching either
# scores them below the floor ("trail" vs "trial" = 0.80) or cannot be trusted to
# fire at all. Listed explicitly because the intent is unambiguous in this
# domain -- nobody asks an oncology trial database about a hiking trail.
_REAL_WORD_CONFUSIONS = {
    "trail": "trial",
    "trails": "trials",
    "tail": "trial",
    "phas": "phase",
    "sfaety": "safety",
    "efficay": "efficacy",
}


def _build_protected_words():
    """Every literal word that appears in a routing pattern.

    Derived from the cue tables rather than listed by hand, so a word added to a
    pattern is protected automatically instead of becoming the next
    "cases" -> "classes" bug. Anything a detector matches on is, by definition,
    already spelled the way this app expects.
    """
    import re as _re
    sources = []
    for _name, pats in _ANALYTICS_CUES:
        sources.extend(pats)
    for group in (_EPIDEMIOLOGY_CUES,):
        sources.extend(group)
    for _name, pats in _MAP_CUES:
        sources.extend(pats)
    words = set()
    for pat in sources:
        # Strip regex syntax, keep the plain alphabetic runs.
        for w in _re.findall(r"[a-z]{3,}", str(pat).lower()):
            words.add(w)
    # Plurals/singulars of those words too: a pattern may say "case" while the
    # question says "cases".
    for w in list(words):
        words.add(w + "s")
        if w.endswith("s"):
            words.add(w[:-1])
    return words


_PROTECTED_WORDS = None


def _closest_term(word):
    """The vocabulary term this word is a misspelling of, or None."""
    from difflib import SequenceMatcher

    global _PROTECTED_WORDS
    if _PROTECTED_WORDS is None:
        try:
            _PROTECTED_WORDS = _build_protected_words()
        except Exception:
            _PROTECTED_WORDS = set()

    lowered = word.lower()
    if lowered in _REAL_WORD_CONFUSIONS:
        return _REAL_WORD_CONFUSIONS[lowered]
    # NEVER "correct" a word this app already understands. "cases" scored 0.833
    # against "classes" -- over the threshold -- so "new cancer cases for
    # germany" was rewritten to "new cancer classes" and the case-burden map
    # stopped being detected. A wrong correction is worse than none, and any word
    # that already drives routing is by definition spelled correctly.
    if lowered in _PROTECTED_WORDS:
        return None
    if len(lowered) < _MIN_FUZZY_LEN or lowered in _VOCAB_TERMS:
        return None
    best, best_score = None, 0.0
    for term in _VOCAB_TERMS:
        # Length gate first: comparing "biomarkers" to "oral" is wasted work and
        # a length mismatch of more than 2 is never a typo of this kind.
        if abs(len(term) - len(lowered)) > 2:
            continue
        score = SequenceMatcher(None, lowered, term).ratio()
        if score > best_score:
            best, best_score = term, score
    return best if best_score >= _FUZZY_THRESHOLD else None


# Short domain acronyms, which the length gate above deliberately excludes --
# fuzzy-matching 2-3 character tokens in isolation is unsafe ("ad" scores 0.80
# against "adc", "ma" against "may"/"man"/"map"). They ARE safe to correct when
# the surrounding words say a dimension is expected: in "top mo" or "which moa",
# nothing else could be meant. Keyed by the word that licenses the correction.
_DIMENSION_LEAD_INS = ("top", "which", "common", "about", "the")

# The dimension words a "top ..." question can name. Read from the DB's own
# dimension_type values plus the graph names this app routes on, so the list
# tracks the data instead of being maintained by hand.
_DIMENSION_TERMS_CACHE = None


def _dimension_terms():
    """Vocabulary for short-form correction, from the data where possible."""
    global _DIMENSION_TERMS_CACHE
    if _DIMENSION_TERMS_CACHE is None:
        terms = {"moa", "backbone", "drug", "drug_class", "biomarker",
                 "target", "mechanism", "modality", "regimen"}
        try:
            from db import query
            rows = query(
                "SELECT DISTINCT dimension_type FROM "
                "analytics.treatment_dimension_over_time "
                "WHERE dimension_type IS NOT NULL"
            )
            terms |= {r["dimension_type"] for r in rows if r["dimension_type"]}
            rows = query(
                "SELECT DISTINCT dimension_type FROM "
                "analytics.biomarker_dimension_over_time "
                "WHERE dimension_type IS NOT NULL"
            )
            terms |= {r["dimension_type"] for r in rows if r["dimension_type"]}
        except Exception:
            pass  # DB unreachable -> the built-in set still covers the routing
        _DIMENSION_TERMS_CACHE = sorted(terms)
    return _DIMENSION_TERMS_CACHE


_SHORT_FORMS_CACHE = None


def _short_forms():
    """{typed fragment: real term} generated from the vocabulary.

    Hardcoding a handful of misspellings ("mo", "ma", "bakbone") only ever
    covered the slips someone thought of. Instead each real term generates the
    fragments a person plausibly types:

      * truncations   -- "mo", "back", "backbo"  (stopped typing early)
      * one deletion  -- "ma" from "moa", "bakbone" from "backbone"

    A fragment that could mean two different terms is DROPPED rather than
    guessed: answering the wrong question confidently is worse than not
    correcting. Measured against the real vocabulary, no fragment is ambiguous,
    and the only everyday words generated ("ad", "me") are already excluded by
    the stop-word list and the lead-in requirement in _fix_short_acronyms.
    """
    global _SHORT_FORMS_CACHE
    if _SHORT_FORMS_CACHE is None:
        owners = {}
        for term in _dimension_terms():
            forms = set()
            for i in range(2, len(term)):
                forms.add(term[:i])                      # truncation
            for i in range(len(term)):
                forms.add(term[:i] + term[i + 1:])       # single deletion
            forms.add(term + "s")                        # plural
            for f in forms:
                if len(f) >= 2 and f != term:
                    owners.setdefault(f, set()).add(term)
        resolved = {}
        for f, ts in owners.items():
            if len(ts) == 1:
                resolved[f] = next(iter(ts))
                continue
            # Ambiguous fragment. Resolve it ONLY when one candidate is a clear
            # winner: the fragment is a truncation and one term is markedly
            # shorter, so it is the far likelier intent ("mo" -> "moa", not
            # "modality", because someone typing "mo" for a 8-letter word would
            # usually have typed more). Otherwise drop it -- guessing between two
            # real dimensions answers the wrong question confidently.
            by_len = sorted(ts, key=len)
            if all(t.startswith(f) for t in ts) and len(by_len[1]) - len(by_len[0]) >= 3:
                resolved[f] = by_len[0]
        _SHORT_FORMS_CACHE = resolved
    return _SHORT_FORMS_CACHE

# "vs" is the connector half of several chart names ("efficacy vs safety",
# "competition intensity vs enrollment speed"), and mistyping it breaks the
# routing regexes even when both concept words are spelled correctly --
# "efrficacy vgs safety" corrected to "efficacy vgs safety" and then matched
# nothing. Too short to fuzzy-match safely (2 characters: "vx" scores 0.50
# against "vs", "is"/"as"/"us" would collide), so the variants are listed. No
# lead-in word is required, unlike _SHORT_ACRONYMS -- "vs" can appear anywhere.
_CONNECTOR_TYPOS = {
    "vgs": "vs", "vss": "vs", "vsa": "vs", "vd": "vs", "vz": "vs",
    "v/s": "vs", "vs.": "vs",
    "versu": "versus", "verses": "versus", "verus": "versus",
    "versos": "versus", "vursus": "versus",
}


def _fix_short_acronyms(question):
    """Repair short acronyms only where the preceding word licenses it."""
    words = re.split(r"(\W+)", question)
    prev_word = ""
    for i, token in enumerate(words):
        if not token or not token.isalpha():
            continue
        lowered = token.lower()
        # Connector typos need no lead-in word: "vs" is unambiguous wherever it
        # appears, and it is what the chart-routing regexes match on.
        connector = _CONNECTOR_TYPOS.get(lowered)
        if connector:
            words[i] = connector
            prev_word = connector
            continue
        fixed = _short_forms().get(lowered)
        # The lead-in is what makes this safe: "top mo" is unambiguous, a bare
        # "mo" anywhere in a sentence is not.
        if fixed and prev_word in _DIMENSION_LEAD_INS:
            words[i] = fixed.upper() if token.isupper() else fixed
        prev_word = lowered
    return "".join(words)


def correct_typos(question):
    """The question with close misspellings of domain terms repaired.

    Returns the input unchanged when nothing is confidently correctable, so a
    question using words this app doesn't know is never mangled.
    """
    if not question:
        return question
    question = _fix_short_acronyms(question)

    def repair(match):
        word = match.group(0)
        fixed = _closest_term(word)
        if not fixed:
            return word
        # Preserve the writer's capitalisation so the echoed question still
        # reads as theirs.
        if word.isupper():
            return fixed.upper()
        if word[:1].isupper():
            return fixed.capitalize()
        return fixed

    return re.sub(r"[A-Za-z]+", repair, question)
