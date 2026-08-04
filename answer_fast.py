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
    return (f'<button type="button" class="trial-link" '
            f'data-trial-id="{ident}" title="Open executive summary">{ident}</button>')


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
    ("TreatmentStrategiesTable", (
        r"mechanism[s]?\s+of\s+action", r"\bmoa\b", r"treatment strateg",
        r"\bmodalit", r"\bbackbone\b",
    )),
    ("CompetitionVsEnrollment", (
        r"competition intensity.*(enrol|recruit)", r"(enrol|recruit).*competition intensity",
    )),
    ("TrialDurationByCountry", (
        r"trial duration", r"how long.*trial", r"study start[- ]?up.*countr",
        r"duration by country",
    )),
    ("AmendmentRisk", (
        r"amendment", r"protocol change",
    )),
    ("FeasibilityTable", (
        r"\bfeasibilit", r"start[- ]?up", r"recruitment window",
        r"enrollment speed", r"enrolment speed",
    )),
    ("CompetitionTable", (
        r"competition intensity", r"competitive intensity",
        r"\bcompetition\b.*\bcountr", r"recruitment speed",
    )),
)


def detect_analytics(question: str):
    """Analytics chart name for this question, or None."""
    q = (question or "").lower()
    for name, patterns in _ANALYTICS_CUES:
        if any(re.search(p, q) for p in patterns):
            return name
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
    ("CaseBurdenMap", _EPIDEMIOLOGY_CUES),
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
    return None


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


def _fmt_count(n):
    return f"{n:,}"


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

            out = [
                {"type": "intro", "text": text},
                {"type": "chart", "chart": analytics_chart, "props": props},
            ]
            charts = [analytics_chart]

            # The raw-rows table is the data BEHIND the scatter, so show the
            # chart alongside it rather than making the user ask twice.
            if analytics_chart == "EfficacySafetyRows":
                scatter = build_chart("EfficacySafetyScatter", oncosuite_ids or [],
                                      question=question)
                if scatter:
                    arms = len(scatter.get("liveData") or [])
                    out[0]["text"] = (
                        f"Answering from the analytics dataset: **{n}** endpoint "
                        f"rows across **{arms}** arms."
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
    # Narrative framing before the data, Key Insights after -- both computed
    # from the returned rows (see answer_insights), so they cost nothing and
    # cannot state anything the result set does not support.
    intro = None
    insights = []
    try:
        from answer_insights import build_intro, build_key_insights
        intro = build_intro(question, tool_result)
        insights = build_key_insights(question, tool_result)
    except Exception:
        pass

    if intro:
        blocks.append({"type": "intro", "text": intro})

    if resp:
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
    total = tool_result.get("total_matches") if isinstance(tool_result, dict) else None

    # Lead line: stated directly from the query result, never written by a model.
    if total is not None:
        shown = len(oncosuite_ids)
        text = f"Found {_fmt_count(total)} matching trial(s)"
        if shown and shown < total:
            text += f"; showing {_fmt_count(shown)}"
        blocks.append({"type": "summary", "text": text + "."})

    # Map/geography charts (PopulationMap, CaseBurdenMap, SiteMap) answer
    # database-wide questions and don't need a matched trial id list -- do NOT
    # gate detection behind `oncosuite_ids`, or every geography question with
    # zero matched trials (the normal case) silently gets no chart at all.
    t_select = time.time()
    map_chart = detect_map_chart(question)
    if map_chart:
        names = [map_chart]
    else:
        names = select_charts(question)
    t_select = time.time() - t_select

    t_build = time.time()
    for name in names:
        props = build_chart(name, oncosuite_ids, question=question)
        if props:
            blocks.append({"type": "chart", "chart": name, "props": props})
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
