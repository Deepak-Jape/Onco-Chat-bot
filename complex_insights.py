"""Cross-table relationship insights: facts that only exist once several
oncosuite_gold tables are joined and aggregated together (drug co-occurrence,
biomarker-vs-hazard-ratio, sponsor-vs-mechanism concentration, trial-site
density vs. real epidemiology) -- the kind of thing that takes a spreadsheet
and a lot of manual cross-referencing to work out by hand, but is one grouped
query plus a small aggregation here.

Every function accepts an optional `trial_ids` to scope the analysis to a
result set already in hand (e.g. the cohort dashboard's trial set); called
with no argument, it runs across the whole database. Each returns
{"bullets": [...], "table": [...]} -- bullets are fact + "so what", the table
is the full ranked data behind the bullet for a PanelTable-style chart block.
"""

import re
from itertools import combinations

from db import query

_NUM_RE = re.compile(r"-?\d+\.?\d*")


def _parse_number(text):
    """First plausible number out of a free-text field like
    '0.65 (95% CI 0.45-0.94)'. Bounded to (0, 20) as a sanity check against
    stray digits from unrelated text (dates, ids) -- hazard ratios in these
    trials never fall outside that range."""
    if text is None:
        return None
    m = _NUM_RE.search(str(text))
    if not m:
        return None
    try:
        v = float(m.group())
    except ValueError:
        return None
    return v if 0 < v < 20 else None


# ---------------------------------------------------------------------------
# 1. Drug combination network -- which drug pairs recur together across
#    regimens, only visible by joining treatment -> stratification -> drug.
# ---------------------------------------------------------------------------

_COMBO_DELIM = "|~|"

# STRING_AGG, not ARRAY_AGG: drug_info.name is `citext`, whose array type has
# no built-in psycopg2 caster, so ARRAY_AGG comes back as the raw Postgres
# array literal string ('{Drug A,Drug B}') instead of a Python list. Same
# reason dashboard.py's regimen column uses STRING_AGG.
_COMBO_SQL = """
SELECT co.oncosuite_id,
       STRING_AGG(DISTINCT d.name::text, %(delim)s ORDER BY d.name::text) AS drugs
  FROM oncosuite_gold.stratification_info s
  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
  JOIN oncosuite_gold.arms_info a ON a.arm_id = s.arm_id
  JOIN oncosuite_gold.cohort_info co ON co.cohort_id = a.cohort_id
 WHERE d.name IS NOT NULL
   {scope}
 GROUP BY s.strata_id, co.oncosuite_id
HAVING COUNT(DISTINCT d.name) >= 2
"""


def drug_combination_insights(trial_ids=None, limit=10):
    scope = "AND co.oncosuite_id = ANY(%(trial_ids)s)" if trial_ids else ""
    params = {"delim": _COMBO_DELIM}
    if trial_ids:
        params["trial_ids"] = list(trial_ids)
    rows = query(_COMBO_SQL.format(scope=scope), params)

    pair_trials = {}
    for r in rows:
        drugs = sorted(set((r["drugs"] or "").split(_COMBO_DELIM)))
        for a, b in combinations(drugs, 2):
            pair_trials.setdefault((a, b), set()).add(r["oncosuite_id"])

    if not pair_trials:
        return {"bullets": [], "table": []}

    ranked = sorted(pair_trials.items(), key=lambda kv: -len(kv[1]))[:limit]
    table = [{"drug_a": a, "drug_b": b, "trials": len(oids)} for (a, b), oids in ranked]

    bullets = []
    (top_a, top_b), top_oids = ranked[0]
    bullets.append(
        f"**{top_a} + {top_b}** is the most-repeated drug combination in the "
        f"database, appearing together across **{len(top_oids)}** distinct trials -- "
        "a pattern only visible by joining treatment, stratification and drug "
        "records across every regimen."
    )
    novel = sum(1 for oids in pair_trials.values() if len(oids) == 1)
    bullets.append(
        f"{len(pair_trials)} distinct drug-pair combinations exist in this set; "
        f"{novel} ({round(100 * novel / len(pair_trials))}%) have been tried in only "
        "one trial, so the combination landscape here is still largely experimental "
        "rather than standardized."
    )
    return {"bullets": bullets, "table": table}


# ---------------------------------------------------------------------------
# 2. Biomarker-stratified outcomes -- average hazard ratio per biomarker,
#    joining cohort_info's jsonb biomarker array against hazard_ratio_info.
# ---------------------------------------------------------------------------

_BIOMARKER_HR_SQL = """
SELECT co.biomarkers, hr.hr_value_and_range
  FROM oncosuite_gold.cohort_info co
  JOIN oncosuite_gold.hazard_ratio_info hr ON hr.cohort_id = co.cohort_id
 WHERE hr.hr_value_and_range IS NOT NULL
   AND co.biomarkers IS NOT NULL
   {scope}
"""


def biomarker_outcome_insights(trial_ids=None, limit=8, min_n=3):
    scope = "AND co.oncosuite_id = ANY(%(trial_ids)s)" if trial_ids else ""
    params = {"trial_ids": list(trial_ids)} if trial_ids else None
    rows = query(_BIOMARKER_HR_SQL.format(scope=scope), params)

    biomarker_hrs = {}
    all_hrs = []
    for r in rows:
        hr = _parse_number(r["hr_value_and_range"])
        if hr is None:
            continue
        all_hrs.append(hr)
        markers = r["biomarkers"] if isinstance(r["biomarkers"], list) else []
        for m in markers:
            biomarker_hrs.setdefault(str(m), []).append(hr)

    if not all_hrs or not biomarker_hrs:
        return {"bullets": [], "table": []}

    baseline = sum(all_hrs) / len(all_hrs)
    stats = []
    for marker, hrs in biomarker_hrs.items():
        if len(hrs) < min_n:
            continue
        avg = sum(hrs) / len(hrs)
        stats.append({
            "biomarker": marker, "n": len(hrs),
            "avg_hr": round(avg, 2), "vs_db_avg": round(avg - baseline, 2),
        })

    if not stats:
        return {"bullets": [], "table": []}

    stats.sort(key=lambda s: s["avg_hr"])
    table = stats[:limit]

    bullets = []
    best = stats[0]
    bullets.append(
        f"Cohorts positive for **{best['biomarker']}** show the lowest average "
        f"hazard ratio ({best['avg_hr']}) across {best['n']} reported comparisons, "
        f"versus a database-wide average of {round(baseline, 2)} -- a signal only "
        "visible by cross-referencing biomarker status against hazard-ratio results, "
        "which live in separate tables joined only through cohort_id."
    )
    worst = max(stats, key=lambda s: s["avg_hr"])
    if worst["biomarker"] != best["biomarker"]:
        bullets.append(
            f"**{worst['biomarker']}** cohorts report the highest average hazard "
            f"ratio ({worst['avg_hr']}) of any biomarker with at least {min_n} "
            "reported comparisons, suggesting weaker relative benefit in that subgroup."
        )
    return {"bullets": bullets, "table": table}


# ---------------------------------------------------------------------------
# 3. Sponsor x mechanism-of-action specialization -- concentration (HHI) of
#    each sponsor's trials across drug mechanism categories.
# ---------------------------------------------------------------------------

_SPONSOR_MOA_SQL = """
SELECT DISTINCT t.sponsor_name, d.moa_category, t.oncosuite_id
  FROM oncosuite_gold.trial_info t
  JOIN oncosuite_gold.cohort_info co ON co.oncosuite_id = t.oncosuite_id
  JOIN oncosuite_gold.arms_info a ON a.cohort_id = co.cohort_id
  JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
 WHERE t.sponsor_name IS NOT NULL AND d.moa_category IS NOT NULL
   {scope}
"""


def sponsor_moa_insights(trial_ids=None, limit=8, min_trials=3):
    scope = "AND t.oncosuite_id = ANY(%(trial_ids)s)" if trial_ids else ""
    params = {"trial_ids": list(trial_ids)} if trial_ids else None
    rows = query(_SPONSOR_MOA_SQL.format(scope=scope), params)

    sponsor_moa = {}
    for r in rows:
        moa_map = sponsor_moa.setdefault(r["sponsor_name"], {})
        moa_map.setdefault(r["moa_category"], set()).add(r["oncosuite_id"])

    stats = []
    for sponsor, moa_map in sponsor_moa.items():
        total = len(set().union(*moa_map.values()))
        if total < min_trials:
            continue
        # A trial can touch more than one MOA category (a combo regimen mixes
        # drug classes), so per-MOA trial sets overlap -- shares are taken
        # over the sum of associations, not the union of trials, otherwise
        # they can exceed 1 and the HHI stops being a valid [0,1] index.
        assoc_total = sum(len(oids) for oids in moa_map.values())
        hhi = sum((len(oids) / assoc_total) ** 2 for oids in moa_map.values())
        top_moa, top_oids = max(moa_map.items(), key=lambda kv: len(kv[1]))
        stats.append({
            "sponsor": sponsor, "trials": total, "n_moa": len(moa_map),
            "top_moa": top_moa, "top_moa_share": round(100 * len(top_oids) / assoc_total),
            "hhi": round(hhi, 2),
        })

    if not stats:
        return {"bullets": [], "table": []}

    specialized = sorted(stats, key=lambda s: (-s["hhi"], -s["trials"]))
    diversified = sorted(stats, key=lambda s: (s["hhi"], -s["trials"]))

    bullets = []
    sp = specialized[0]
    bullets.append(
        f"**{sp['sponsor']}** is the most mechanistically concentrated sponsor here: "
        f"{sp['top_moa_share']}% of its drug-mechanism links across {sp['trials']} "
        f"trials target **{sp['top_moa']}** (concentration index HHI={sp['hhi']}, "
        "from 0=fully diversified to 1=single mechanism) -- a measure that requires "
        "joining sponsor, drug and mechanism data across five tables."
    )
    dv = diversified[0]
    if dv["sponsor"] != sp["sponsor"]:
        bullets.append(
            f"**{dv['sponsor']}** is the most diversified sponsor, spreading its "
            f"{dv['trials']} trials across **{dv['n_moa']}** distinct mechanism-of-"
            f"action categories (HHI={dv['hhi']})."
        )
    return {"bullets": bullets, "table": specialized[:limit]}


# ---------------------------------------------------------------------------
# 4. Epidemiology-weighted site feasibility -- trial-site density
#    (facility_info) against real disease burden (map_view_population),
#    two tables the schema explicitly says are never joined for querying.
# ---------------------------------------------------------------------------

_FACILITY_COUNTRY_SQL = """
SELECT TRIM(SPLIT_PART(country, '(', 1)) AS country, COUNT(DISTINCT oncosuite_id) AS trials
  FROM oncosuite_gold.facility_info
 WHERE country IS NOT NULL
   {scope}
 GROUP BY 1
"""

_POP_COUNTRY_SQL = """
SELECT country, MAX(annual_cases) AS annual_cases
  FROM oncosuite_gold.map_view_population
 WHERE country IS NOT NULL AND annual_cases IS NOT NULL
   AND country <> 'Global'
 GROUP BY country
"""


def site_feasibility_insights(trial_ids=None, limit=8, min_cases=1000):
    scope = "AND oncosuite_id = ANY(%(trial_ids)s)" if trial_ids else ""
    params = {"trial_ids": list(trial_ids)} if trial_ids else None
    trial_rows = query(_FACILITY_COUNTRY_SQL.format(scope=scope), params)
    pop_rows = query(_POP_COUNTRY_SQL)

    trials_by_country = {r["country"]: r["trials"] for r in trial_rows}
    stats = []
    for r in pop_rows:
        cases = r["annual_cases"]
        if not cases or cases < min_cases:
            continue
        country = r["country"]
        trials = trials_by_country.get(country, 0)
        stats.append({
            "country": country, "trials": trials, "annual_cases": int(cases),
            "trials_per_100k_cases": round(trials / (cases / 100000.0), 3),
        })

    if not stats:
        return {"bullets": [], "table": []}

    stats.sort(key=lambda s: s["trials_per_100k_cases"])
    underserved = stats[0]
    saturated = max(stats, key=lambda s: s["trials_per_100k_cases"])

    bullets = [
        f"**{underserved['country']}** is the most under-served market relative to "
        f"disease burden in this set: an estimated {underserved['annual_cases']:,} "
        f"annual cancer cases but only {underserved['trials']} trial site country-"
        f"presence in the database ({underserved['trials_per_100k_cases']} trial "
        "sites per 100k annual cases) -- a gap only visible by joining trial-site "
        "locations against independent epidemiology data that the schema keeps "
        "deliberately unjoined."
    ]
    if saturated["country"] != underserved["country"]:
        bullets.append(
            f"**{saturated['country']}** has the highest trial-site density relative "
            f"to its disease burden ({saturated['trials_per_100k_cases']} sites per "
            f"100k annual cases across {saturated['trials']} trial sites)."
        )
    return {"bullets": bullets, "table": stats[:limit]}


# ---------------------------------------------------------------------------
# 5. Payload mechanism vs. safety profile -- classifies each drug's free-text
#    mechanism of action into a payload class (the schema has no dedicated
#    payload/linker column) and cross-references it against arm-level
#    adverse-event rates, incl. two clinically-named patterns: interstitial
#    lung disease and cytopenias.
# ---------------------------------------------------------------------------

_PAYLOAD_PATTERNS = (
    (re.compile(r"topoisomerase", re.I), "Topoisomerase I inhibitor payload"),
    (re.compile(r"auristatin|maytansin|vinca alkaloid|microtubule disruption", re.I),
     "Microtubule-disrupting payload (auristatin/maytansinoid/vinca-class)"),
    (re.compile(r"dna crosslink", re.I), "DNA-crosslinking payload"),
    (re.compile(r"cytotoxic payload", re.I), "Unspecified cytotoxic payload"),
)

_CYTOPENIA_TERMS = ("cytopenia", "neutropenia", "thrombocytopenia", "anemia", "anaemia", "leukopenia")


def _classify_payload(mechanism_text):
    text = mechanism_text or ""
    for pattern, label in _PAYLOAD_PATTERNS:
        if pattern.search(text):
            return label
    return None


_PAYLOAD_AE_SQL = """
SELECT d.mechanism_of_action, ae.name_and_organ, ae.all_grades, ae.grade_3_4, ae.arm_id
  FROM oncosuite_gold.adverse_events ae
  JOIN oncosuite_gold.arms_info a ON a.arm_id = ae.arm_id
  JOIN oncosuite_gold.cohort_info co ON co.cohort_id = a.cohort_id
  JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
 WHERE d.mechanism_of_action IS NOT NULL
   AND co.oncosuite_id = ANY(%(trial_ids)s)
"""


def payload_safety_insights(trial_ids, limit=10):
    """Requires trial_ids -- the payload classification only means something
    for a scoped set of trials (e.g. one modality's cohort dashboard), not a
    database-wide scan across every drug class."""
    if not trial_ids:
        return {"bullets": [], "table": []}

    rows = query(_PAYLOAD_AE_SQL, {"trial_ids": list(trial_ids)})

    stats = {}
    for r in rows:
        payload = _classify_payload(r["mechanism_of_action"])
        if not payload:
            continue
        g = stats.setdefault(payload, {
            "arms": set(), "sae_num": 0.0, "sae_den": 0,
            "ild_arms": set(), "cytopenia_arms": set(),
        })
        g["arms"].add(r["arm_id"])
        if r["grade_3_4"] is not None:
            g["sae_num"] += float(r["grade_3_4"])
            g["sae_den"] += 1
        name = (r["name_and_organ"] or "").lower()
        if "interstitial lung disease" in name or "pneumonitis" in name:
            g["ild_arms"].add(r["arm_id"])
        if any(term in name for term in _CYTOPENIA_TERMS):
            g["cytopenia_arms"].add(r["arm_id"])

    if not stats:
        return {"bullets": [], "table": []}

    table = []
    for payload, g in stats.items():
        table.append({
            "payload_class": payload,
            "arms": len(g["arms"]),
            "avg_grade_3_4_pct": round(g["sae_num"] / g["sae_den"], 1) if g["sae_den"] else None,
            "ild_arms": len(g["ild_arms"]),
            "cytopenia_arms": len(g["cytopenia_arms"]),
        })
    table.sort(key=lambda t: -(t["avg_grade_3_4_pct"] or 0))

    bullets = []
    with_sae = [t for t in table if t["avg_grade_3_4_pct"] is not None]
    if with_sae:
        top = with_sae[0]
        bullets.append(
            f"**{top['payload_class']}** shows the highest severe (Grade 3-4) "
            f"adverse-event rate of any payload class in this set, averaging "
            f"{top['avg_grade_3_4_pct']}% across {top['arms']} arms -- a comparison "
            "only possible by classifying each drug's free-text mechanism of action "
            "and joining it against arm-level safety data, since the schema has no "
            "dedicated payload/linker column."
        )
    ild = sorted((t for t in table if t["ild_arms"] > 0), key=lambda t: -t["ild_arms"])
    if ild:
        top = ild[0]
        other = sum(t["ild_arms"] for t in table if t is not top)
        note = (
            " -- consistent with the interstitial lung disease signal reported for "
            "topoisomerase-I-payload ADCs" if "Topoisomerase" in top["payload_class"] else ""
        )
        bullets.append(
            f"Interstitial lung disease is reported in {top['ild_arms']} arm(s) using "
            f"a **{top['payload_class']}**, versus {other} arm(s) across every other "
            f"payload class{note}."
        )
    cyto = sorted((t for t in table if t["cytopenia_arms"] > 0), key=lambda t: -t["cytopenia_arms"])
    if cyto:
        top = cyto[0]
        bullets.append(
            f"Cytopenias (neutropenia/thrombocytopenia/anemia) are most reported "
            f"with **{top['payload_class']}**, appearing in {top['cytopenia_arms']} "
            f"of its {top['arms']} arms."
        )
    return {"bullets": bullets[:limit], "table": table[:limit]}


# ---------------------------------------------------------------------------
# 6. Region / site footprint -- facility_info country names bucketed into
#    trial regions (the schema stores raw country strings only, no region
#    column), scoped to a trial set.
# ---------------------------------------------------------------------------

_REGION_MAP = {
    "United States": "North America", "Canada": "North America", "Mexico": "North America",
    "Puerto Rico": "North America",
    "Argentina": "Latin America", "Brazil": "Latin America", "Chile": "Latin America",
    "Colombia": "Latin America", "Peru": "Latin America",
    "Austria": "Europe", "Belgium": "Europe", "Bulgaria": "Europe", "Czechia": "Europe",
    "Denmark": "Europe", "Estonia": "Europe", "Finland": "Europe", "France": "Europe",
    "Germany": "Europe", "Greece": "Europe", "Hungary": "Europe", "Italy": "Europe",
    "Latvia": "Europe", "Lithuania": "Europe", "Netherlands": "Europe", "Norway": "Europe",
    "Poland": "Europe", "Portugal": "Europe", "Romania": "Europe", "Slovakia": "Europe",
    "Spain": "Europe", "Sweden": "Europe", "Switzerland": "Europe", "United Kingdom": "Europe",
    "Australia": "Asia-Pacific", "China": "Asia-Pacific", "Hong Kong": "Asia-Pacific",
    "India": "Asia-Pacific", "Japan": "Asia-Pacific", "Malaysia": "Asia-Pacific",
    "Philippines": "Asia-Pacific", "Singapore": "Asia-Pacific", "South Korea": "Asia-Pacific",
    "Taiwan": "Asia-Pacific", "Thailand": "Asia-Pacific", "Vietnam": "Asia-Pacific",
    "Israel": "Middle East & Africa", "South Africa": "Middle East & Africa",
    "Turkey": "Middle East & Africa",
}

_SITE_COUNTRY_SQL = """
SELECT DISTINCT TRIM(SPLIT_PART(f.country, '(', 1)) AS country, f.oncosuite_id
  FROM oncosuite_gold.facility_info f
 WHERE f.country IS NOT NULL
   AND f.oncosuite_id = ANY(%(trial_ids)s)
"""


def region_site_breakdown(trial_ids, limit=10):
    if not trial_ids:
        return {"bullets": [], "table": []}

    rows = query(_SITE_COUNTRY_SQL, {"trial_ids": list(trial_ids)})
    region_map = {}
    for r in rows:
        country = (r["country"] or "").strip()
        if not country:
            continue
        g = region_map.setdefault(_REGION_MAP.get(country, "Other"), {"trials": set(), "countries": set()})
        g["trials"].add(r["oncosuite_id"])
        g["countries"].add(country)

    if not region_map:
        return {"bullets": [], "table": []}

    total_trials = len(set(trial_ids))
    table = []
    for region, g in region_map.items():
        table.append({
            "region": region,
            "trials": len(g["trials"]),
            "pct_of_trials": round(100 * len(g["trials"]) / total_trials) if total_trials else None,
            "countries": len(g["countries"]),
        })
    table.sort(key=lambda t: -t["trials"])

    # Trials commonly run sites in more than one region at once, so these
    # percentages are "share of trials present in this region" and can add to
    # more than 100% across regions -- not a partition, by design.
    bullets = []
    top = table[0]
    bullets.append(
        f"**{top['region']}** has the widest footprint in this set: sites in "
        f"{top['trials']} of {total_trials} trials ({top['pct_of_trials']}%) across "
        f"{top['countries']} distinct countries -- built by mapping each trial's raw "
        "site-country strings into region groups, since the database stores no "
        "region column directly."
    )
    if len(table) > 1:
        bottom = table[-1]
        bullets.append(
            f"**{bottom['region']}** has the smallest footprint here, with sites in "
            f"only {bottom['trials']} trial(s) ({bottom['pct_of_trials']}%)."
        )
    return {"bullets": bullets, "table": table[:limit]}


# ---------------------------------------------------------------------------
# Orchestrator for the dedicated "relationship insights" answer.
# ---------------------------------------------------------------------------

def build_relationship_dashboard(trial_ids=None):
    """Blocks for a database-wide (or trial_ids-scoped) relationship report.
    Returns {"blocks": [...], "meta": {...}} or None when nothing computed."""
    combo = drug_combination_insights(trial_ids)
    biomarker = biomarker_outcome_insights(trial_ids)
    sponsor = sponsor_moa_insights(trial_ids)
    site = site_feasibility_insights(trial_ids)

    blocks = [{
        "type": "summary",
        "text": (
            "Cross-database relationship analysis — drug combinations, "
            "biomarker-linked outcomes, sponsor mechanism specialization and "
            "site-vs-epidemiology feasibility, each computed by joining across "
            "the full oncosuite_gold schema rather than reading a single table."
        ),
    }]

    if combo["table"]:
        blocks.append({
            "type": "chart", "chart": "DrugCombinationTable",
            "props": {
                "title": "Most-repeated drug combinations",
                "columns": [
                    {"key": "drug_a", "label": "Drug A"},
                    {"key": "drug_b", "label": "Drug B"},
                    {"key": "trials", "label": "Trials"},
                ],
                "data": combo["table"],
            },
        })
    if biomarker["table"]:
        blocks.append({
            "type": "chart", "chart": "BiomarkerOutcomeTable",
            "props": {
                "title": "Hazard ratio by biomarker",
                "columns": [
                    {"key": "biomarker", "label": "Biomarker"},
                    {"key": "n", "label": "Comparisons"},
                    {"key": "avg_hr", "label": "Avg HR"},
                    {"key": "vs_db_avg", "label": "vs DB avg"},
                ],
                "data": biomarker["table"],
            },
        })
    if sponsor["table"]:
        blocks.append({
            "type": "chart", "chart": "SponsorMoATable",
            "props": {
                "title": "Sponsor mechanism-of-action specialization",
                "columns": [
                    {"key": "sponsor", "label": "Sponsor"},
                    {"key": "trials", "label": "Trials"},
                    {"key": "n_moa", "label": "Distinct MOAs"},
                    {"key": "top_moa", "label": "Top MOA"},
                    {"key": "top_moa_share", "label": "Top MOA %"},
                    {"key": "hhi", "label": "Concentration (HHI)"},
                ],
                "data": sponsor["table"],
            },
        })
    if site["table"]:
        blocks.append({
            "type": "chart", "chart": "SiteFeasibilityTable",
            "props": {
                "title": "Trial-site density vs. disease burden by country",
                "columns": [
                    {"key": "country", "label": "Country"},
                    {"key": "trials", "label": "Trial sites"},
                    {"key": "annual_cases", "label": "Annual cases"},
                    {"key": "trials_per_100k_cases", "label": "Sites / 100k cases"},
                ],
                "data": site["table"],
            },
        })

    all_bullets = combo["bullets"] + biomarker["bullets"] + sponsor["bullets"] + site["bullets"]
    if all_bullets:
        blocks.append({"type": "insights", "title": "Key Relationship Insights", "items": all_bullets})

    if len(blocks) <= 1:
        return None

    return {
        "blocks": blocks,
        "meta": {
            "combos": len(combo["table"]), "biomarkers": len(biomarker["table"]),
            "sponsors": len(sponsor["table"]), "countries": len(site["table"]),
        },
    }
