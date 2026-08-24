"""Chart data builders: oncosuite_gold rows -> the exact props each ctsearch
component already expects.

This module is the Python half of the chart contract. The UI half is
frontend/src/charts/registry.js; the names here MUST match the names there.

Design rule: the LLM chooses WHICH chart to show, this module decides WHAT the
numbers are. Every value below comes from a query against oncosuite_gold -- no
builder invents, interpolates or estimates data. A builder that cannot satisfy
its component's required props returns None, and the caller drops the chart
rather than rendering a half-empty one.
"""

import json
import re
import statistics

from db import get_conn

# Registry mirror. `enabled` must agree with frontend/src/charts/registry.js --
# a chart enabled here but not there simply renders nothing, and vice versa.
CHART_SPECS = {
    "EndpointsTable": {
        "label": "Endpoint outcomes table",
        "use_when": (
            "the question asks about ONE SPECIFIC TRIAL's endpoints, outcomes, "
            "ORR/PFS/OS values, or primary vs secondary endpoint results -- NOT "
            "for a broad multi-trial search/list, where arms and endpoints from "
            "unrelated trials would be shown side by side and mean nothing"
        ),
        "enabled": True,
    },
    # --- analytics schema: pre-computed views behind the Analytics section ---
    "EfficacySafetyScatter": {
        "label": "Efficacy vs safety",
        "use_when": (
            "the question compares response rates against toxicity/safety, or "
            "asks about the efficacy-safety trade-off across arms"
        ),
        "enabled": True,
    },
    "EfficacySafetyRows": {
        "label": "Efficacy / safety endpoint rows",
        "use_when": (
            "the question asks for the raw endpoint rows behind the efficacy vs "
            "safety chart, or to audit / list every measurement"
        ),
        "enabled": True,
    },
    "CompetitionVsEnrollment": {
        "label": "Competition intensity vs enrollment speed",
        "use_when": (
            "the question compares competition intensity against enrollment or "
            "recruitment speed across countries"
        ),
        "enabled": True,
    },
    "TrialDurationByCountry": {
        "label": "Trial duration by country",
        "use_when": (
            "the question asks how long trials take -- study start-up, "
            "recruitment window or data lock duration by country"
        ),
        "enabled": True,
    },
    "AmendmentRisk": {
        "label": "Amendment risk vs enrollment speed",
        "use_when": (
            "the question asks about protocol amendments, amendment risk or "
            "how amendments relate to recruitment speed"
        ),
        "enabled": True,
    },
    "DimensionFactsTable": {
        "label": "Ranked figures behind the chart",
        # Never chosen by the model: narrate_dimension emits it directly
        # alongside the prose, so the reader can check the numbers.
        "use_when": "never picked directly",
        "enabled": True,
    },
    "TopBiomarkers": {
        "label": "Top biomarkers / targets by phase",
        "use_when": (
            "the question asks which biomarkers or molecular targets are most "
            "common, or names a biomarker (EGFR, ALK, KRAS, HER2, PD-L1, ...)"
        ),
        "enabled": True,
    },
    "ModeOfAdministration": {
        "label": "Mode of administration by phase",
        "use_when": (
            "the question asks how treatments are administered -- route of "
            "administration, oral vs intravenous, IV/PO/SC"
        ),
        "enabled": True,
    },
    "TopBackbones": {
        "label": "Top backbones / mechanisms by phase",
        "use_when": (
            "the question asks which treatment backbones, mechanisms of action, "
            "drug classes or drugs are most common, or asks for those broken "
            "down by phase"
        ),
        "enabled": True,
    },
    "TreatmentStrategiesTable": {
        "label": "Treatment strategies",
        "use_when": (
            "the question asks about treatment strategies, mechanisms of "
            "action, drug modality or backbone combinations"
        ),
        "enabled": True,
    },
    "FeasibilityTable": {
        "label": "Feasibility by country",
        "use_when": (
            "the question asks about feasibility, site start-up time, "
            "recruitment windows or planned patients per country"
        ),
        "enabled": True,
    },
    "CompetitionTable": {
        "label": "Competition intensity",
        "use_when": (
            "the question asks about competition, competitive intensity or "
            "recruitment speed between countries"
        ),
        "enabled": True,
    },
    "PopulationMap": {
        "label": "Trial site density map (by country/region)",
        "use_when": (
            "the question asks where trial SITES are concentrated geographically, "
            "or wants a density/heatmap view of trial site distribution across "
            "countries or regions -- NOT for real cancer case counts/incidence, "
            "see CaseBurdenMap for that"
        ),
        "enabled": True,
    },
    "CancerCasesMap": {
        "label": "New cancer cases per year (map)",
        "use_when": (
            "the question asks about new cancer cases, incidence or case burden "
            "for a country or region -- rendered on ctsearch's own population "
            "map from /analytics/population"
        ),
        "enabled": True,
    },
    "CaseBurdenMap": {
        "label": "Cancer case burden map (by country/city)",
        "use_when": (
            "the question asks about real cancer incidence, new/annual cancer "
            "case counts, case burden, or population/case-ratio by country or "
            "city (e.g. 'new cancer cases in Germany', 'case burden by country', "
            "'population density of cities in Australia') -- backed by real "
            "epidemiology data (map_view_population), NOT trial site locations"
        ),
        "enabled": True,
    },
    "SiteMap": {
        "label": "Trial site heat map",
        "use_when": (
            "the question asks WHERE SPECIFIC TRIALS or their SITES/FACILITIES "
            "are located or running (e.g. 'where are the sites for NSCLC trials')"
        ),
        "enabled": True,
    },
    "CaseStageBreakdownTable": {
        "label": "Cancer cases by stage (by country, for a named biomarker)",
        "use_when": (
            "the question asks for annual new cancer case counts broken down "
            "BY CANCER STAGE for a named lung-cancer driver biomarker (EGFR, "
            "ALK, KRAS, ...) across one or more countries -- backed by "
            "oncosuite_gold.case_filters, which has no data for any organ "
            "other than lung"
        ),
        "enabled": True,
    },
    "EfficacyByMoATable": {
        "label": "PFS / OS / ORR by mechanism of action (verified)",
        "use_when": (
            "the question asks to COMPARE EFFECTIVENESS (PFS/OS/ORR) across "
            "drug mechanisms of action for a named condition (NSCLC or SCLC) "
            "-- backed by verified oncosuite_gold outcomes joined to drug_info."
            "moa_category, NOT the analytics schema (which has zero OS/PFS "
            "rows for any condition)"
        ),
        "enabled": True,
    },
    "EfficacyByBackboneTable": {
        "label": "PFS / OS / ORR by treatment backbone (verified)",
        "use_when": (
            "the question asks to COMPARE EFFECTIVENESS (PFS/OS/ORR) across "
            "treatment backbones (chemo/IO/targeted/hormonal) for a named "
            "condition (NSCLC or SCLC) -- backed by verified oncosuite_gold "
            "outcomes joined to drug_info.backbone"
        ),
        "enabled": True,
    },
    "DifferentiationMatrixTable": {
        "label": "Competing programs -- design & strategy comparison",
        "use_when": (
            "the question asks how competing trials/programs DIFFER or "
            "COMPARE on trial design, patient selection, biomarker strategy, "
            "line of therapy or combination regimen -- e.g. 'how do these "
            "trials differ in design and biomarker strategy', 'compare "
            "competing programs' -- NOT a plain trial list/search"
        ),
        "enabled": True,
    },
    "KMCurve": {
        "label": "Kaplan-Meier survival curve",
        "use_when": (
            "the question asks about survival over time -- KM curves, median "
            "PFS/OS across a time axis, or at-risk counts per interval"
        ),
        # Backed by oncosuite_gold.results_analytics (analytics_type = 'KM
        # Curve') -- see build_km_curve for the dedup/junk-filtering this
        # source needs before it's shown.
        "enabled": True,
    },
}


def enabled_specs() -> dict:
    """Charts the LLM may pick from. Gated charts are never offered."""
    return {k: v for k, v in CHART_SPECS.items() if v.get("enabled")}


def _txt(v) -> str:
    return "" if v is None else str(v).strip()


# --------------------------------------------------------------------------
# EndpointsTable
# --------------------------------------------------------------------------
def build_endpoints_table(oncosuite_ids: list) -> dict | None:
    """Props for ctsearch's EndpointsTable: {arms, primaryRows, secondaryRows}.

    Row shape is dictated by the component (see EndpointsTable.jsx): each row is
    {endpoint, popn, assessor, dataCut[], arms[{top, bottom}], effect, ciRange,
    pValue}. Arm values come from results_outcomes_basic_info, which the schema
    documents as sparse -- endpoints with no posted outcomes still render, with
    the arm cells falling back to the component's own "N/A" placeholder.

    Scoped to exactly ONE trial: arms and endpoints only cohere within a
    shared protocol. Given many trials (e.g. a broad search's full result
    set), the arm columns and endpoint rows below are picked from DIFFERENT,
    unrelated trials -- seen directly: a 78-trial search produced a table
    with arm columns "Abemaciclib"/"Alectinib"/"Antroquinonol" side by side,
    each from a different, unrelated trial, against endpoint rows from yet
    other trials, so almost every cell was empty by construction. Returning
    None here (rather than that near-empty, meaningless cross-trial table)
    lets the caller drop the chart instead of rendering it.
    """
    if not oncosuite_ids or len(oncosuite_ids) > 1:
        return None

    ids = tuple(oncosuite_ids)
    with get_conn() as conn, conn.cursor() as cur:
        # Arms are cohort-scoped; collect the distinct set across these trials so
        # every row can address them by a stable column index.
        cur.execute(
            """
            SELECT DISTINCT a.arm_id, a.arm_name
              FROM oncosuite_gold.arms_info a
              JOIN oncosuite_gold.cohort_info c ON c.cohort_id = a.cohort_id
             WHERE c.oncosuite_id IN %s
             ORDER BY a.arm_name
             LIMIT 6
            """,
            (ids,),
        )
        arm_rows = cur.fetchall()
        if not arm_rows:
            return None
        arm_ids = [r[0] for r in arm_rows]
        arms = [{"label": _txt(r[1]) or "Arm", "n": None} for r in arm_rows]
        arm_pos = {aid: i for i, aid in enumerate(arm_ids)}

        cur.execute(
            """
            SELECT e.endpoint_id, e.endpoint_name, e.endpoint_type,
                   e.endpoint_abbreviation, e.timing_and_evaluator
              FROM oncosuite_gold.study_endpoints_info e
             WHERE e.oncosuite_id IN %s
             ORDER BY CASE WHEN e.endpoint_type = 'Primary' THEN 0 ELSE 1 END,
                      e.endpoint_name
             LIMIT 40
            """,
            (ids,),
        )
        endpoints = cur.fetchall()
        if not endpoints:
            return None

        ep_ids = tuple(e[0] for e in endpoints)
        cur.execute(
            """
            SELECT endpoint_id, arm_id, value, value_and_evaluator
              FROM oncosuite_gold.results_outcomes_basic_info
             WHERE endpoint_id IN %s
            """,
            (ep_ids,),
        )
        outcomes = {}
        for ep_id, arm_id, value, raw in cur.fetchall():
            outcomes.setdefault(ep_id, {})[arm_id] = _txt(value) or _txt(raw)

        # Hazard ratios supply the "Effect" column where a comparison exists.
        cur.execute(
            """
            SELECT endpoint_id, hr_value_and_range, hr_ci, p_value
              FROM oncosuite_gold.hazard_ratio_info
             WHERE endpoint_id IN %s
            """,
            (ep_ids,),
        )
        hrs = {r[0]: r for r in cur.fetchall()}

    primary, secondary = [], []
    for ep_id, name, ep_type, abbrev, timing in endpoints:
        vals = outcomes.get(ep_id, {})
        row = {
            "endpoint": _txt(name) or _txt(abbrev),
            "popn": "",
            "assessor": _txt(timing),
            "dataCut": [""],
            "arms": [
                {"top": _txt(vals.get(aid)), "bottom": ""} for aid in arm_ids
            ],
        }
        hr = hrs.get(ep_id)
        if hr:
            row["effect"] = _txt(hr[1])
            row["ciRange"] = _txt(hr[2])
            row["pValue"] = _txt(hr[3])

        (primary if _txt(ep_type).lower() == "primary" else secondary).append(row)

    if not primary and not secondary:
        return None

    return {
        "arms": arms,
        "primaryRows": primary,
        "secondaryRows": secondary,
        "primaryLabel": "Primary endpoints",
        "secondaryLabel": "Secondary endpoints",
        "showPrimarySection": bool(primary),
    }


# --------------------------------------------------------------------------
# SiteMap
# --------------------------------------------------------------------------
def build_site_map(oncosuite_ids: list, question: str = "") -> dict | None:
    """Props for MapView (via MapOrTable) -- delegates to map_data.build_map_points,
    the SAME real trial-site-density logic PopulationMap uses, scoped to
    whichever trials this question resolved to.

    Previously built its own {points:[{longitude, latitude, name, value}]}
    shape for a DIFFERENT vendored component (ctsearch's UsHeatMap), which
    ignored the title/metric passed in and rendered its own hardcoded
    "Population Density" legend regardless -- a real trial-site-density
    answer was shown under a wrong, generic label. Reusing build_map_points
    puts this on the same MapView component as PopulationMap/CaseBurdenMap,
    which does respect the legendTitle/totalLabel this data carries, and
    picks up the Table View toggle those two already have.
    """
    from map_data import build_map_points
    return build_map_points(oncosuite_ids or None, question=question)


# --------------------------------------------------------------------------
# KMCurve -- gated
# --------------------------------------------------------------------------
# A real KM step-curve in this table runs 200-450 points; a handful of rows
# alongside them are junk partial extractions of the same chart (3-7 points --
# seen directly, e.g. 3 real curves each duplicated plus four ~3-7 point
# fragments for the same trial/endpoint). This threshold is set well below the
# real curves and well above the junk ones so it only drops the latter.
_MIN_KM_POINTS = 15


def _km_disease_labels(oncosuite_ids):
    """{oncosuite_id: 'Histology -- OncoSuite id'} for the Efficacy Explorer's
    'disease' dropdown -- gives each trial's curves their own bucket (rather
    than grouping by histology alone) so two different trials sharing a
    histology never collide onto one dropdown entry and silently hide one
    trial's curves (EfficacyExplorerCard shows only the first entry matching
    a given disease+endpoint+graph_type triple)."""
    if not oncosuite_ids:
        return {}
    ids = tuple(oncosuite_ids)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT oncosuite_id, histology FROM oncosuite_gold.cohort_info "
            "WHERE oncosuite_id IN %s AND histology IS NOT NULL",
            (ids,),
        )
        histology = {}
        for oid, hist in cur.fetchall():
            if oid not in histology and isinstance(hist, list) and hist:
                histology[oid] = str(hist[0])

    return {
        oid: " -- ".join(filter(None, [histology.get(oid), oid]))
        for oid in oncosuite_ids
    }


def build_km_curve(oncosuite_ids: list):
    """Props for ctsearch's EfficacyExplorerCard: {"explorer": [...]}, one
    dropdown entry (disease/endpoint/graph_type -> a KM step chart) per real
    curve group in oncosuite_gold.results_analytics (analytics_type = 'KM
    Curve', the only value that table carries).

    Grain and cleanup, both confirmed directly against the data:
      - A row is ONE arm's curve, not a whole chart -- the same
        (oncosuite_id, endpoint) can have several rows, one per arm. Rows are
        first grouped by (oncosuite_id, endpoint, the arms/risk table's exact
        content) so unrelated sub-analyses sharing a generic endpoint label
        (e.g. two different OS breakdowns both just called "Overall
        survival") are never merged into one chart.
      - Within a group, rows are exact-duplicated by the extraction pipeline
        (identical graph_data under a different id) and also include a few
        near-empty junk fragments (3-7 points) of the same curve alongside
        the real one (200+ points). Deduped by exact graph_data match, then
        anything under _MIN_KM_POINTS is dropped as junk, not shown.
      - The shared risk table lists every arm's at-risk counts but never
        says which row's curve belongs to which arm. When the number of
        surviving curves matches the number of listed arms exactly, curves
        are matched to names by ascending id (the order the rows -- and
        presumably the source chart's own arms -- were extracted in).
        Otherwise (counts don't line up -- seen directly for some
        garbled/partial extractions) arms are labelled generically ("Arm
        1", "Arm 2", ...) rather than asserting an unverified name match.
    """
    with get_conn() as conn, conn.cursor() as cur:
        if oncosuite_ids:
            cur.execute(
                "SELECT id, oncosuite_id, endpoint_analyzed, x_axis, y_axis, "
                "graph_data, risk_table FROM oncosuite_gold.results_analytics "
                "WHERE oncosuite_id IN %s AND analytics_type = 'KM Curve' "
                "ORDER BY oncosuite_id, endpoint_analyzed, id",
                (tuple(oncosuite_ids),),
            )
        else:
            cur.execute(
                "SELECT id, oncosuite_id, endpoint_analyzed, x_axis, y_axis, "
                "graph_data, risk_table FROM oncosuite_gold.results_analytics "
                "WHERE analytics_type = 'KM Curve' "
                "ORDER BY oncosuite_id, endpoint_analyzed, id"
            )
        rows = cur.fetchall()
    if not rows:
        return None

    groups = {}
    order = []
    for _id, oid, endpoint, x_axis, y_axis, graph_data, risk_table in rows:
        key = (oid, endpoint, json.dumps(risk_table, sort_keys=True))
        if key not in groups:
            groups[key] = {"oid": oid, "endpoint": endpoint, "x_axis": x_axis,
                           "y_axis": y_axis, "risk_table": risk_table, "curves": []}
            order.append(key)
        groups[key]["curves"].append(graph_data or [])

    disease_labels = _km_disease_labels(sorted({oid for oid, _e, _r in order}))

    explorer = []
    # EfficacyExplorerCard picks ONE entry per (disease, endpoint, graph_type)
    # triple -- graph_type is always "KM Curve" (the only analytics_type this
    # table carries), so two genuinely distinct sub-analyses that happen to
    # share a disease+endpoint (e.g. two different risk-table groupings both
    # just labelled "Overall survival" -- seen directly) would silently
    # collide onto one dropdown selection and hide the other. Suffixing
    # graph_type on repeat keeps every group reachable via that dropdown.
    _disease_endpoint_seen = {}
    for key in order:
        g = groups[key]
        seen, curves = [], []
        for c in g["curves"]:
            if c in seen:
                continue
            seen.append(c)
            if len(c) >= _MIN_KM_POINTS:
                curves.append(c)
        if not curves:
            continue

        arm_names = [a.get("name") for a in (g["risk_table"] or {}).get("arms") or []]

        def _sane(name):
            # Real drug/arm names always carry at least one 3+ letter word
            # ("Docetaxel", "NIVO chemo"); the extraction garbage seen
            # directly ("I i) I I i) I I i) I I I I i)") is single letters and
            # punctuation only, with no such run -- reject that rather than
            # show it as if it were a real arm label.
            return (name if name and 0 < len(str(name)) <= 80
                    and re.search(r"[A-Za-z]{3,}", str(name)) else None)

        if len(arm_names) == len(curves):
            labels = [_sane(nm) or f"Arm {i + 1}" for i, nm in enumerate(arm_names)]
        elif len(curves) == 1:
            labels = [(_sane(arm_names[0]) if arm_names else None) or "Overall"]
        else:
            labels = [f"Arm {i + 1}" for i in range(len(curves))]

        points = []
        for label, curve in zip(labels, curves):
            for pt in curve:
                t, s = pt.get("time"), pt.get("survival")
                if t is None or s is None:
                    continue
                points.append({"time": t, "arms": {label: s}})
        if not points:
            continue

        # Strip a stray leading artifact number ("2 Overall survival" -> "Overall
        # survival") but otherwise pass the endpoint label through as extracted
        # -- some values here (A/B/C/PSF) are themselves garbled and there is no
        # reliable way to know what they should say, so they are shown as-is
        # rather than guessed at.
        endpoint_label = re.sub(r"^\d+\s+", "", (g["endpoint"] or "").strip()) or "Endpoint"
        disease_label = disease_labels.get(g["oid"]) or g["oid"]

        dedupe_key = (disease_label, endpoint_label)
        _disease_endpoint_seen[dedupe_key] = _disease_endpoint_seen.get(dedupe_key, 0) + 1
        n = _disease_endpoint_seen[dedupe_key]
        graph_type = "KM Curve" if n == 1 else f"KM Curve ({n})"

        explorer.append({
            "graph_type": graph_type,
            "endpoint": endpoint_label,
            "disease": disease_label,
            "data": {
                "x_axis": g["x_axis"] or {},
                "y_axis": g["y_axis"] or {},
                "points": points,
            },
        })

    if not explorer:
        return None
    return {"explorer": explorer[:30]}


def build_population_map(oncosuite_ids: list, question: str = ""):
    """Props for ctsearch's MapView -- see map_data.build_map_points.

    Zooms to a single country's cities when the question names one (e.g.
    "show trials in Germany"), otherwise the global country-density view.
    """
    from map_data import build_map_points
    return build_map_points(oncosuite_ids or None, question=question)


def build_case_burden_map(oncosuite_ids: list, question: str = ""):
    """Props for ctsearch's MapView -- REAL cancer case-burden data (annual
    new cases, population, density) from oncosuite_gold.map_view_population,
    as opposed to build_population_map's trial-site density. `oncosuite_ids`
    is accepted for signature parity with the other chart builders but unused
    -- this map answers a geography question, not a trial-scoped one.
    See map_data.build_case_burden_map."""
    from map_data import build_case_burden_map as _build
    return _build(question=question)


def build_case_stage_breakdown(oncosuite_ids: list, question: str = ""):
    """Props for PanelTable -- country x cancer-stage annual new-case counts
    for a named lung-cancer driver biomarker (EGFR, ALK, KRAS, ...), from
    oncosuite_gold.case_filters. `oncosuite_ids` unused (signature parity),
    same as build_case_burden_map. See map_data.build_case_stage_breakdown."""
    from map_data import build_case_stage_breakdown as _build
    return _build(question=question)


# --------------------------------------------------------------------------
# EfficacyByMoATable / EfficacyByBackboneTable -- PFS/OS/ORR compared across
# drug mechanism/backbone groups for a named condition, from VERIFIED
# oncosuite_gold outcomes. Built because the analytics schema (efficacy_vs_
# safety and its dimension views) has NO OS or PFS rows at all, for any
# condition or dimension -- checked directly. oncosuite_gold has real
# coverage once drug_info.moa_category/backbone is joined in.
# --------------------------------------------------------------------------

# The only two histology values this DB carries (checked directly).
_ONCOLOGY_CONDITIONS = ("NSCLC", "SCLC")

# A group needs at least this many reporting arms per metric to be shown --
# below this (e.g. Agonist/Modulator at NSCLC, 1 arm each) a "median" is just
# that one trial's result dressed up as a class-wide figure.
_MIN_ARMS_FOR_MEDIAN = 10

_EFFECTIVENESS_METRICS = ("PFS", "OS", "ORR")

_EFFICACY_BY_DIM_SQL = """
    SELECT d.{col} AS grp, UPPER(e.endpoint_abbreviation) AS metric,
           MIN(r.value) AS value
      FROM oncosuite_gold.trial_info t
      JOIN oncosuite_gold.cohort_info co ON co.oncosuite_id = t.oncosuite_id
      JOIN oncosuite_gold.arms_info a ON a.cohort_id = co.cohort_id
      JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
      JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
      JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
      JOIN oncosuite_gold.results_outcomes_basic_info r ON r.arm_id = a.arm_id
      JOIN oncosuite_gold.study_endpoints_info e ON e.endpoint_id = r.endpoint_id
     WHERE co.histology @> %s::jsonb
       AND UPPER(e.endpoint_abbreviation) IN ('OS', 'ORR', 'PFS')
       AND r.value IS NOT NULL
       AND d.{col} IS NOT NULL
     -- one row per arm+group+metric: some arms carry several duplicate result
     -- rows for the same endpoint (up to 11, checked directly), which would
     -- otherwise let one arm's repeated posting dominate the group's median.
     GROUP BY a.arm_id, d.{col}, UPPER(e.endpoint_abbreviation)
"""


def _condition_in_question(question):
    """'NSCLC' or 'SCLC' named in the question, or None."""
    q = str(question or "")
    for c in _ONCOLOGY_CONDITIONS:
        if re.search(rf"\b{c}\b", q, re.IGNORECASE):
            return c
    return None


def _median_label(values, metric):
    med = statistics.median(values)
    unit = "%" if metric == "ORR" else " mo"
    return f"{med:.1f}{unit} (n={len(values)})"


def _build_efficacy_by_dimension_gold(column, dimension_label, condition):
    """One PanelTable spec ({title, columns, data}) comparing median PFS/OS/
    ORR across every value of `column` (moa_category or backbone) for
    `condition`, or None if no group clears _MIN_ARMS_FOR_MEDIAN on any
    metric."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(_EFFICACY_BY_DIM_SQL.format(col=column),
                   (json.dumps([condition]),))
        rows = cur.fetchall()
    if not rows:
        return None

    groups = {}
    for grp, metric, value in rows:
        g = groups.setdefault(grp, {m: [] for m in _EFFECTIVENESS_METRICS})
        g[metric].append(float(value))

    table_rows = []
    for grp, metrics in groups.items():
        row = {"group": grp}
        total_arms = 0
        any_shown = False
        for m in _EFFECTIVENESS_METRICS:
            vals = metrics[m]
            total_arms += len(vals)
            if len(vals) >= _MIN_ARMS_FOR_MEDIAN:
                row[m.lower()] = _median_label(vals, m)
                any_shown = True
            else:
                row[m.lower()] = None
        if any_shown:
            row["_sort"] = total_arms
            table_rows.append(row)
    if not table_rows:
        return None

    table_rows.sort(key=lambda r: -r.pop("_sort"))

    return {
        "title": f"{condition}: PFS / OS / ORR by {dimension_label}",
        "columns": [
            {"key": "group", "label": dimension_label},
            {"key": "pfs", "label": "PFS (median)"},
            {"key": "os", "label": "OS (median)"},
            {"key": "orr", "label": "ORR (median)"},
        ],
        "data": table_rows,
    }


def build_efficacy_by_moa(oncosuite_ids: list, question: str = ""):
    """See _build_efficacy_by_dimension_gold. Returns None when no condition
    is named or no MoA group has enough arms to show a median."""
    condition = _condition_in_question(question)
    if not condition:
        return None
    return _build_efficacy_by_dimension_gold("moa_category", "Mechanism of Action", condition)


def build_efficacy_by_backbone(oncosuite_ids: list, question: str = ""):
    """See _build_efficacy_by_dimension_gold."""
    condition = _condition_in_question(question)
    if not condition:
        return None
    return _build_efficacy_by_dimension_gold("backbone", "Backbone", condition)


# --------------------------------------------------------------------------
# DifferentiationMatrixTable -- one row per COHORT (not per trial: biomarker,
# stage, line-of-therapy and regimen genuinely vary by cohort within a single
# basket/umbrella trial), comparing competing programs across trial design,
# patient selection, biomarker strategy, line of therapy and combination
# regimen -- scoped to whichever trials the question already resolved
# (`oncosuite_ids`), same set the rest of the answer is about.
# --------------------------------------------------------------------------
_DIFFERENTIATION_MATRIX_SQL = """
    SELECT t.oncosuite_id, t.sponsor_name, t.trial_phase, t.study_design,
           t.blinding_info, t.trial_architecture, t.study_status,
           co.cohort_id, co.histology, co.biomarkers, co.biomarker_variant,
           co.cancer_stage, co.line_of_therapy,
           STRING_AGG(DISTINCT d.name, ' + ') AS regimen
      FROM oncosuite_gold.trial_info t
      JOIN oncosuite_gold.cohort_info co ON co.oncosuite_id = t.oncosuite_id
      JOIN oncosuite_gold.arms_info a ON a.cohort_id = co.cohort_id
      JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
      JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
      JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
     WHERE t.oncosuite_id IN %s
     GROUP BY t.oncosuite_id, t.sponsor_name, t.trial_phase, t.study_design,
              t.blinding_info, t.trial_architecture, t.study_status,
              co.cohort_id, co.histology, co.biomarkers, co.biomarker_variant,
              co.cancer_stage, co.line_of_therapy
     ORDER BY t.sponsor_name, t.oncosuite_id, co.cohort_id
     LIMIT 300
"""

# Cap on distinct trials scoped in: this compares a bounded set of "competing
# programs" -- a broad, unfiltered search (hundreds/thousands of trials) would
# make this an unreadable dump rather than a comparison, so above the cap the
# builder returns None and the caller falls back to the normal search answer.
_MAX_DIFFERENTIATION_TRIALS = 60


def _jsonb_join(val):
    """jsonb array column -> comma-joined string, or None (mirrors the shape
    every jsonb array column in cohort_info actually carries -- checked
    directly against real rows)."""
    if isinstance(val, list):
        vals = [str(v) for v in val if v]
        return ", ".join(vals) if vals else None
    return None


def build_differentiation_matrix(oncosuite_ids: list, question: str = "") -> dict | None:
    """Props for PanelTable -- one row per cohort, comparing competing trials
    on design (phase/randomization/blinding/architecture), patient selection
    (biomarker/variant/stage/line of therapy), combination regimen and primary
    endpoint. Scoped to `oncosuite_ids` (the trial set this answer already
    resolved), not re-derived from the question -- so it compares exactly the
    programs the user is already looking at, whatever named the scope
    (target, biomarker, indication, sponsor, ...).

    Returns None with nothing to compare (no ids), or when the scope is too
    broad to be a meaningful side-by-side (see _MAX_DIFFERENTIATION_TRIALS) --
    that case is a plain trial list, not a differentiation question.
    """
    if not oncosuite_ids:
        return None
    ids = tuple(str(i) for i in oncosuite_ids)
    if len(ids) > _MAX_DIFFERENTIATION_TRIALS:
        return None

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(_DIFFERENTIATION_MATRIX_SQL, (ids,))
        rows = cur.fetchall()
    if not rows:
        return None

    trial_ids = tuple({r[0] for r in rows})
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT oncosuite_id, STRING_AGG(DISTINCT endpoint_name, '; ') AS primary_endpoints
              FROM oncosuite_gold.study_endpoints_info
             WHERE oncosuite_id IN %s AND endpoint_type = 'Primary'
             GROUP BY oncosuite_id
            """,
            (trial_ids,),
        )
        endpoints_by_trial = {r[0]: r[1] for r in cur.fetchall()}

    data = []
    for (oid, sponsor, phase, design, blinding, architecture, status,
         cohort_id, histology, biomarkers, biomarker_variant,
         cancer_stage, line_of_therapy, regimen) in rows:
        data.append({
            "trial": _txt(oid),
            "sponsor": _txt(sponsor) or None,
            "phase": _txt(phase) or None,
            "design": _txt(design) or None,
            "blinding": _txt(blinding) or None,
            "architecture": _jsonb_join(architecture),
            "histology": _jsonb_join(histology),
            "biomarker": _jsonb_join(biomarkers),
            "variant": _jsonb_join(biomarker_variant),
            "stage": _jsonb_join(cancer_stage),
            "line_of_therapy": _jsonb_join(line_of_therapy),
            "regimen": _txt(regimen) or None,
            "primary_endpoint": _txt(endpoints_by_trial.get(oid)) or None,
            "status": _txt(status) or None,
        })
    if not data:
        return None

    return {
        "title": f"Competing programs -- trial design & strategy comparison ({len(trial_ids)} trials)",
        "columns": [
            {"key": "trial", "label": "Trial"},
            {"key": "sponsor", "label": "Sponsor", "filter": True},
            {"key": "phase", "label": "Phase", "filter": True},
            {"key": "design", "label": "Design", "filter": True},
            {"key": "blinding", "label": "Blinding", "filter": True},
            {"key": "architecture", "label": "Architecture", "filter": True},
            {"key": "histology", "label": "Histology", "filter": True},
            {"key": "biomarker", "label": "Biomarker", "filter": True},
            {"key": "variant", "label": "Variant"},
            {"key": "stage", "label": "Stage", "filter": True},
            {"key": "line_of_therapy", "label": "Line of Therapy", "filter": True},
            {"key": "regimen", "label": "Regimen"},
            {"key": "primary_endpoint", "label": "Primary Endpoint"},
            {"key": "status", "label": "Status", "filter": True},
        ],
        "data": data,
    }


def _analytics(fn_name):
    """Late-bound analytics builder (keeps the import off the hot path)."""
    def _run(oncosuite_ids):
        import analytics_data
        return getattr(analytics_data, fn_name)(oncosuite_ids or None)
    return _run


# Which grouping a "top ..." question is asking for. The values are the
# dimension_type keys ctsearch's treatment API accepts (metrics.dimension_type =
# ["backbone", "drug", "drug_class", "moa"]).
_TREATMENT_DIMENSION_CUES = (
    ("moa", (r"mechanism[s]?\s+of\s+action", r"\bmoa\b", r"\bmechanism")),
    ("drug_class", (r"drug\s*class", r"\bclass(es)?\s+of\s+drug")),
    ("backbone", (r"\bbackbone", r"treatment\s+strateg", r"\bregimen\b")),
    ("drug", (r"\btop\s+drugs?\b", r"most\s+common\s+drugs?")),
)


# The treatment API accepts exactly two arm-type values. Each is matched from
# the words people actually use -- "control arm", "comparator", "placebo arm" all
# mean Control; "experimental", "investigational", "treatment arm" mean
# Experimental.
_ARM_TYPE_CUES = (
    ("Control", (r"\bcontrol\s+arms?\b", r"\bcontrol\b(?!\w)",
                 r"\bcomparator\b", r"\bplacebo\s+arms?\b",
                 r"\bstandard\s+of\s+care\s+arms?\b", r"\bsoc\s+arms?\b")),
    ("Experimental", (r"\bexperimental\b", r"\binvestigational\b",
                      r"\btreatment\s+arms?\b", r"\bactive\s+arms?\b",
                      r"\bintervention\s+arms?\b")),
)


def _arm_type_in_question(question):
    """"Control" | "Experimental" | None, per the words the question uses.

    Control is tested FIRST: "control arm" also contains "arm", and a question
    naming the control arm must never be read as the experimental one.
    """
    import re as _re
    q = (question or "").lower()
    for value, patterns in _ARM_TYPE_CUES:
        if any(_re.search(p, q) for p in patterns):
            return value
    return None


def build_efficacy_safety_props(oncosuite_ids: list, question: str = ""):
    """Intent-only props for the Efficacy vs Safety scatter.

    The chart fetches its own points from ctsearch's /analytics/treatment
    (graph: efficacy_vs_safety_scatter) and maps them with ctsearch's own
    mapEfficacyVsSafetyToScatter, so no rows are built here.

    It used to be handed `liveData` shaped in Python, which rendered an EMPTY
    chart: the component plots from d.x / d.y and that payload carried orr / sae
    instead, so every point was filtered out. Sourcing the data the same way the
    Treatment tab does removes the second shape entirely.
    """
    return _treatment_graph_props(question, "efficacy_vs_safety_scatter", "", ())


def _treatment_graph_props(question, graph, dimension, panel_kinds):
    """Shared props for the three phase-bar graphs.

    `panel_kinds` names which biomarker_vocabulary() kinds pre-tick this graph's
    left panel -- a question naming EGFR should open the biomarker panel with
    EGFR ticked, the same state a user would reach by clicking it.
    """
    from analytics_data import (filters_from_question, biomarkers_from_question,
                                _FILTER_COLUMNS)
    from map_data import country_filter_value

    filters = filters_from_question(question)
    api_filters = {
        _FILTER_COLUMNS[col]: vals
        for col, vals in filters.items() if col in _FILTER_COLUMNS
    }
    # The treatment API spells the country filter `locations`, and matches on the
    # "Name ( CODE )" form -- the bare name returns an empty result set.
    country = country_filter_value(question)
    if country:
        api_filters["locations"] = [country]

    # ARM TYPE. The treatment API scopes every graph to one arm type, and it
    # changes the answer completely -- Control returns 163 arms where
    # Experimental returns 1,296. It was never extracted, so "top backbones for
    # the control arms" silently answered about the experimental arms instead.
    #
    # The API's own vocabulary is exactly two values ("Control",
    # "Experimental"), matched here from however the user phrased it. Left unset
    # when the question says nothing, so the backend keeps its own default
    # rather than us guessing.
    arm_type = _arm_type_in_question(question)
    if arm_type:
        api_filters["arm_type"] = [arm_type]

    named = biomarkers_from_question(question)
    # De-duplicated, order preserved: a name like "EGFR" is both a biomarker and
    # a target, so it would otherwise be listed twice.
    categories = list(
        dict.fromkeys(v for kind in panel_kinds for v in named.get(kind, []))
    )

    # No rows here: the chart calls ctsearch's /analytics/treatment itself, so
    # the answer's intro must not try to count this payload.
    props = {"graph": graph, "dimension": dimension, "selfFetching": True}
    if api_filters:
        props["apiFilters"] = api_filters
    if categories:
        props["categories"] = categories
    return props


def build_top_biomarkers(oncosuite_ids: list, question: str = ""):
    """Top Biomarkers / Top Targets phase-bar chart."""
    import re
    q = (question or "").lower()
    dimension = "target" if re.search(r"\btarget", q) else "biomarker"
    return _treatment_graph_props(question, "biomarker_dimension", dimension,
                                  ("biomarker", "target"))


def build_mode_of_administration(oncosuite_ids: list, question: str = ""):
    """Mode of Administration phase-bar chart (fixed grouping, no dropdown)."""
    return _treatment_graph_props(question, "mode_of_administration", "",
                                  ("mode",))


def build_top_backbones(oncosuite_ids: list, question: str = ""):
    """Props for the Top Backbones / MOA / Drugs phase-bar chart.

    The chart fetches its own data from ctsearch's /analytics/treatment (so the
    numbers match the Treatment tab), which is why no rows are read here. What
    this builder contributes is the INTENT: which dimension the question asked
    to group by, and which filters it named -- both keyed the way that API
    spells them, so the frontend passes them straight through.
    """
    import re

    q = (question or "").lower()
    dimension = next(
        (dim for dim, patterns in _TREATMENT_DIMENSION_CUES
         if any(re.search(p, q) for p in patterns)),
        "backbone",
    )
    return _treatment_graph_props(question, "treatment_dimension", dimension,
                                  ())


def build_competition_vs_enrollment_scoped(oncosuite_ids: list, question: str = ""):
    """Competition-vs-enrollment props, scoped to a country named in the question.

    "competition intensity vs enrollment speed for usa" should plot the USA
    alone, not all 75 countries. The country is resolved here and passed to the
    frontend as `country`; ctsearch's card sends it back to the feasibility API
    as the `counties` filter, which is what actually narrows the response (the
    chart's own country panel uses the same request), so the scoping happens in
    ONE place rather than being duplicated client- and server-side.
    """
    from analytics_data import (build_competition_vs_enrollment,
                                filters_from_question, _FILTER_COLUMNS)
    from map_data import _country_in_question, country_filter_value

    # Any filter the question names -- phase, line of therapy, cancer stage --
    # matched against the column's real vocabulary, plus the country.
    filters = filters_from_question(question)
    # Bare name here: our own SQL matches on a name prefix (see _filters).
    country = _country_in_question(question)
    if country:
        filters["country"] = [country]

    props = build_competition_vs_enrollment(oncosuite_ids or None,
                                            filters=filters or None)
    if props:
        # Hand the frontend the request-key spelling ctsearch's API expects, so
        # it can pass the same scoping through without re-deriving it.
        api_filters = {
            _FILTER_COLUMNS[col]: vals
            for col, vals in filters.items() if col in _FILTER_COLUMNS
        }
        # `country` is NOT included here: the card sends it separately as the
        # `counties` filter (which the client renames to `countries`), and it
        # doubles as the initial country-panel selection.
        if api_filters:
            props["apiFilters"] = api_filters
    if props and country:
        # Send the name WITH its short form -- "United States ( USA )" -- because
        # that is the only spelling ctsearch's feasibility API matches; the bare
        # name comes back with zero points. Prefer our own row's spelling (so the
        # two sources can't disagree about the code) and fall back to the
        # vocabulary's, which is correct even when the DB has no matching row.
        props["country"] = next(
            (p["countryRaw"] for p in (props.get("points") or [])
             if p.get("name") == country and p.get("countryRaw")),
            country_filter_value(question) or country,
        )
    return props


def build_efficacy_safety_scatter(oncosuite_ids: list, question: str = ""):
    """Efficacy-vs-safety scatter, grouped by whichever dimension the question
    implies (backbone / MoA / modality / target / ...).

    The analytics schema keeps one efficacyvssafety_* table per grouping, so the
    dimension decides which table is read. Falls back to backbone, the broadest
    grouping, when the question does not name one.
    """
    import re
    from analytics_data import EFFICACY_DIMENSIONS, build_efficacy_safety_by_dimension

    cues = (
        (r"\bbackbone\b", "backbone"),
        (r"combination modalit", "combination_modality"),
        (r"mechanism of action|\bmoa\b", "moa_category"),
        (r"\bmodalit", "modality"),
        (r"\btarget\b|targeted", "target"),
        (r"mode of admin|route of admin|\boral\b|\bintravenous\b|\biv\b",
         "mode_of_administration"),
    )
    q = (question or "").lower()
    dimension = next((d for pattern, d in cues if re.search(pattern, q)), None)

    if not dimension:
        # Default to the full arm-level table -- it carries every arm (153),
        # while each efficacyvssafety_* view is a narrower slice grouped for one
        # dimension. Those are only read when the question names that grouping.
        from analytics_data import build_efficacy_safety_wide
        return build_efficacy_safety_wide(oncosuite_ids or None)

    result = build_efficacy_safety_by_dimension(dimension, oncosuite_ids or None)
    if result:
        # Offer the other groupings so the chart's "Color by" can switch.
        result["colorOptions"] = [
            {"label": spec["label"], "field": "strategy", "dimension": key}
            for key, spec in EFFICACY_DIMENSIONS.items()
        ]
    return result


BUILDERS = {
    "EndpointsTable": build_endpoints_table,
    "PopulationMap": build_population_map,
    "CaseBurdenMap": build_case_burden_map,
    "CaseStageBreakdownTable": build_case_stage_breakdown,
    "EfficacyByMoATable": build_efficacy_by_moa,
    "EfficacyByBackboneTable": build_efficacy_by_backbone,
    "DifferentiationMatrixTable": build_differentiation_matrix,
    "SiteMap": build_site_map,
    # Registered after definition (see the assignment below BUILDERS):
    # this dict is built before build_cancer_cases_map exists.
    "KMCurve": build_km_curve,
    # analytics schema
    "EfficacySafetyScatter": build_efficacy_safety_props,
    "EfficacySafetyRows": _analytics("build_efficacy_safety_rows"),
    "CompetitionVsEnrollment": build_competition_vs_enrollment_scoped,
    "TopBackbones": build_top_backbones,
    "TopBiomarkers": build_top_biomarkers,
    "ModeOfAdministration": build_mode_of_administration,
    "TrialDurationByCountry": _analytics("build_trial_duration_by_country"),
    "AmendmentRisk": _analytics("build_amendment_risk"),
    "TreatmentStrategiesTable": _analytics("build_treatment_strategies"),
    "FeasibilityTable": _analytics("build_feasibility"),
    "CompetitionTable": _analytics("build_competition"),
}


def build_chart(name: str, oncosuite_ids: list, question: str = ""):
    """Build one chart's props, or None if it is gated or has no data.

    `question` is passed to builders that accept it -- the efficacy scatter uses
    it to choose which efficacyvssafety_* grouping to read.
    """
    spec = CHART_SPECS.get(name)
    if not spec or not spec.get("enabled"):
        return None
    builder = BUILDERS.get(name)
    if not builder:
        return None
    try:
        import inspect
        if "question" in inspect.signature(builder).parameters:
            return builder(oncosuite_ids, question=question)
        return builder(oncosuite_ids)
    except Exception:
        # A chart is never worth failing the whole answer over.
        return None


# ---------------------------------------------------------------------------
# Narrated answers for the dimension charts.
#
# A question like "what are the top MoA" deserves the same shape a person would
# give: say what the data shows, show the numbers, then the chart. Answering
# with a bare chart makes the reader do the interpreting; answering with only
# prose hides the evidence. So each of these produces
#   intro (1-2 short paragraphs) -> table of the ranked facts -> chart
# and every number in the prose is read from the same view the chart is built
# from, so the two can never disagree.
# ---------------------------------------------------------------------------

_DIMENSION_NOUNS = {
    "backbone": ("treatment backbone", "treatment backbones"),
    "moa": ("mechanism of action", "mechanisms of action"),
    "drug": ("drug", "drugs"),
    "drug_class": ("drug class", "drug classes"),
    "biomarker": ("biomarker", "biomarkers"),
    "target": ("molecular target", "molecular targets"),
    "mode": ("route of administration", "routes of administration"),
}


def _dominant_phase(phases):
    """The phase label carrying the most arms, ignoring unlabelled buckets."""
    real = {k: v for k, v in (phases or {}).items()
            if k and k != "Not Specified" and "," not in k}
    if not real:
        return None
    return max(real.items(), key=lambda kv: kv[1])[0]


def _describe_filters(api_filters):
    """"in Phase 2, 1L, United States" for the filters actually applied."""
    if not api_filters:
        return ""
    # arm_type first: "for Control arms in Phase 2" reads the way the scope was
    # actually applied, and stating it matters -- the totals change completely
    # between Control and Experimental.
    order = ("arm_type", "phases", "line_intent", "stage", "locations")
    parts = []
    for key in order:
        for value in api_filters.get(key) or []:
            if key == "arm_type":
                parts.append(f"{value} arms")
                continue
            # Countries arrive as "United States ( USA )"; the code is noise in
            # a sentence.
            parts.append(re.sub(r"\s*\([^)]*\)\s*$", "", str(value)).strip())
    if not parts:
        return ""
    if len(parts) == 1:
        return f" for {parts[0]}"
    return f" for {', '.join(parts[:-1])} and {parts[-1]}"


def narrate_dimension(graph, dimension, api_filters=None, filters=None):
    """[intro, table] blocks describing a dimension chart, or [] if no data."""
    import re as _re
    from analytics_data import dimension_facts

    # The chart is scoped to one arm type; the prose must be too. api_filters is
    # what the chart actually sends, so read it from there rather than
    # re-deriving it from the question.
    _arm = (api_filters or {}).get("arm_type") or []
    facts = dimension_facts(graph, dimension or None, filters,
                            arm_type=(_arm[0] if _arm else None))
    if not facts or not facts["rows"]:
        return []

    singular, plural = _DIMENSION_NOUNS.get(
        dimension or "mode", ("category", "categories"))
    rows = facts["rows"]
    total = facts["total"]
    scope = _describe_filters(api_filters)
    top = rows[0]
    share = round(100.0 * top["arms"] / total) if total else 0

    # Paragraph 1 -- the headline ranking, which is what was actually asked.
    lead = (
        f"Across **{total:,}** trial arms{scope}, **{facts['distinct']}** "
        f"distinct {plural} appear. **{top['name']}** leads with "
        f"**{top['arms']:,}** arms ({share}% of the total)"
    )
    if len(rows) > 1:
        runners = ", ".join(f"{r['name']} ({r['arms']:,})" for r in rows[1:3])
        lead += f", followed by {runners}."
    else:
        lead += "."

    # Paragraph 2 -- the shape behind the ranking: where it sits in development,
    # and how concentrated the field is.
    detail = []
    phase = _dominant_phase(top["phases"])
    if phase:
        detail.append(
            f"{top['name']} activity is concentrated in {phase}"
        )
    head = sum(r["arms"] for r in rows[:3])
    if total and len(rows) >= 3:
        detail.append(
            f"the top three {plural} account for {round(100.0 * head / total)}% "
            f"of all arms"
        )
    if facts["years"]:
        first, last = facts["years"]
        detail.append(f"the data spans {first}-{last}")
    # Only the first character is forced -- .capitalize() would lower-case the
    # rest, turning "Phase 2" into "phase 2" and "EGFR" into "egfr".
    second = ""
    if detail:
        joined = "; ".join(detail) + "."
        second = joined[0].upper() + joined[1:]

    blocks = [{"type": "intro", "text": lead}]
    if second:
        blocks.append({"type": "intro", "text": second})

    # The numbers behind the prose, so a reader can check it rather than trust
    # it. Phase columns are the ones the chart stacks.
    phase_cols = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"]
    blocks.append({
        "type": "chart",
        "chart": "DimensionFactsTable",
        "props": {
            "title": f"{plural.title()} by trial arms",
            "columns": (
                [{"key": "name", "label": singular.title()},
                 {"key": "arms", "label": "Arms"}]
                + [{"key": p, "label": p} for p in phase_cols]
            ),
            "data": [
                {"name": r["name"], "arms": r["arms"],
                 **{p: r["phases"].get(p, 0) for p in phase_cols}}
                for r in rows
            ],
        },
    })

    # Key takeaways.
    #
    # These must earn their place: restating the chart ("X leads with N arms")
    # is worthless, because the reader can see that. What they CANNOT see from a
    # stacked bar is how each category is progressing and which way it is
    # moving. So every item below compares categories on a DERIVED measure --
    # late-phase conversion, recency, phase-3 depth -- and is only emitted when
    # the numbers actually make the point.
    takeaways = []
    ranked_late = [r for r in rows if r["arms"] >= 20]

    # 1. Late-phase conversion. Volume and maturity are different things: a
    #    category can lead on arm count and still be stuck in Phase 1.
    if len(ranked_late) >= 2:
        best = max(ranked_late, key=lambda r: r["late_share"])
        worst = min(ranked_late, key=lambda r: r["late_share"])
        if best["late_share"] - worst["late_share"] >= 0.08:
            takeaways.append(
                f"**{best['name']}** converts to late-phase work most often -- "
                f"{round(100 * best['late_share'])}% of its arms are Phase 3/4 "
                f"({best['late']:,} of {best['arms']:,}), versus "
                f"{round(100 * worst['late_share'])}% for {worst['name']}. "
                f"Volume and maturity are not the same thing here."
            )
        # The leader failing to convert is the more actionable version of this.
        if top["arms"] >= 20 and top["late_share"] < 0.10:
            takeaways.append(
                f"Despite leading on volume, only "
                f"{round(100 * top['late_share'])}% of **{top['name']}** arms "
                f"have reached Phase 3/4 -- the activity is concentrated in "
                f"early development, not confirmatory trials."
            )

    # 2. Momentum. Which categories are recent arrivals versus legacy volume.
    cutoff = facts.get("recent_cutoff")
    if cutoff:
        emerging = [r for r in rows
                    if r["arms"] >= 5 and r["recent_share"] >= 0.6]
        fading = [r for r in rows
                  if r["arms"] >= 20 and r["recent_share"] <= 0.2]
        if emerging:
            names = ", ".join(f"**{r['name']}**" for r in emerging[:3])
            takeaways.append(
                f"{names} {'is' if len(emerging) == 1 else 'are'} newly active "
                f"-- {round(100 * emerging[0]['recent_share'])}%+ of "
                f"{'its' if len(emerging) == 1 else 'their'} arms started from "
                f"{cutoff} onward, so the field is still forming."
            )
        if fading:
            names = ", ".join(f"**{r['name']}**" for r in fading[:3])
            takeaways.append(
                f"{names} {'shows' if len(fading) == 1 else 'show'} little "
                f"recent activity -- under "
                f"{round(100 * max(r['recent_share'] for r in fading))}% of "
                f"{'its' if len(fading) == 1 else 'their'} arms are from "
                f"{cutoff} or later."
            )

    # 3. Concentration. How exposed the field is to a single category.
    if total and len(rows) >= 3:
        head = sum(r["arms"] for r in rows[:2])
        if head / total >= 0.75:
            takeaways.append(
                f"The field is concentrated: **{rows[0]['name']}** and "
                f"**{rows[1]['name']}** alone cover "
                f"{round(100 * head / total)}% of all arms, leaving "
                f"{facts['distinct'] - 2} other {plural} to share the rest."
            )

    # 4. Where the deepest Phase 3 evidence actually sits -- not necessarily the
    #    volume leader, which is the point worth surfacing.
    with_late = [r for r in rows if r["late"] > 0]
    if with_late:
        deepest = max(with_late, key=lambda r: r["late"])
        if deepest["name"] != top["name"]:
            takeaways.append(
                f"The most Phase 3/4 evidence sits with **{deepest['name']}** "
                f"({deepest['late']:,} arms), not the volume leader "
                f"{top['name']}."
            )

    if takeaways:
        blocks.append({"type": "insights", "title": "Key Takeaways",
                       "items": takeaways[:4]})
    return blocks


def narrate_efficacy_safety(api_filters=None, filters=None):
    """[intro, table, takeaways] for the Efficacy vs Safety scatter.

    This chart is the one most likely to be misread: it can only plot an arm
    reporting BOTH an efficacy and a safety endpoint, so a scatter with a handful
    of bubbles over a "124 Cohorts" badge looks broken when it is simply the
    coverage in the data. Saying that outright is the single most useful thing
    the prose can do here.
    """
    from analytics_data import efficacy_safety_facts

    _arm = (api_filters or {}).get("arm_type") or []
    facts = efficacy_safety_facts(filters, arm_type=(_arm[0] if _arm else None))
    if not facts or not facts["rows"]:
        return []

    scope = _describe_filters(api_filters)
    arms = facts.get("arms") or 0
    plottable = facts.get("plottable")
    eff, saf = facts.get("efficacy") or [], facts.get("safety") or []
    rows = facts["rows"]

    lead = (
        f"Across **{arms:,}** trial arms{scope}, **{len(eff)}** efficacy and "
        f"**{len(saf)}** safety endpoints are reported."
    )
    if plottable is not None:
        share = round(100.0 * plottable / arms) if arms else 0
        lead += (
            f" Only **{plottable:,}** arms ({share}%) report BOTH kinds, and "
            f"those are the only ones this chart can plot -- a point needs an "
            f"efficacy value AND a safety value."
        )
    blocks = [{"type": "intro", "text": lead}]

    top_eff = next((r for r in rows if "efficacy" in r["category"].lower()), None)
    top_saf = next((r for r in rows if "safety" in r["category"].lower()), None)
    detail = []
    if top_eff:
        detail.append(
            f"{top_eff['name']} is the most reported efficacy endpoint "
            f"({top_eff['arms']} arms"
            + (f", averaging {top_eff['avg']}%" if top_eff['avg'] is not None else "")
            + ")"
        )
    if top_saf:
        detail.append(
            f"{top_saf['name']} leads on the safety side ({top_saf['arms']} arms"
            + (f", averaging {top_saf['avg']}%" if top_saf['avg'] is not None else "")
            + ")"
        )
    if detail:
        text = "; ".join(detail) + "."
        blocks.append({"type": "intro", "text": text[0].upper() + text[1:]})

    blocks.append({
        "type": "chart",
        "chart": "DimensionFactsTable",
        "props": {
            "title": "Endpoint coverage by arm",
            "columns": [
                {"key": "name", "label": "Endpoint"},
                {"key": "category", "label": "Category"},
                {"key": "arms", "label": "Arms reporting"},
                {"key": "avg", "label": "Mean value"},
            ],
            "data": [
                {"name": r["name"], "category": r["category"],
                 "arms": r["arms"],
                 "avg": ("—" if r["avg"] is None else r["avg"])}
                for r in rows
            ],
        },
    })

    # Takeaways: what the reader cannot see from a sparse scatter.
    takeaways = []
    if plottable is not None and arms and plottable / arms < 0.5:
        takeaways.append(
            f"**Reporting coverage, not activity, is the limit here** -- "
            f"{arms - plottable:,} of {arms:,} arms report only one side of the "
            f"trade-off, so they cannot appear on the chart at all."
        )
    if top_eff and top_saf and top_eff["arms"] and top_saf["arms"]:
        ratio = top_eff["arms"] / top_saf["arms"]
        if ratio >= 1.5:
            takeaways.append(
                f"Efficacy is reported far more consistently than safety "
                f"({top_eff['name']}: {top_eff['arms']} arms vs "
                f"{top_saf['name']}: {top_saf['arms']}), so the safety axis is "
                f"the binding constraint on what can be compared."
            )
    thin = [r for r in rows if r["arms"] <= 5]
    if thin:
        takeaways.append(
            f"{len(thin)} endpoints appear on 5 or fewer arms "
            f"({', '.join(r['name'] for r in thin[:3])}"
            f"{', …' if len(thin) > 3 else ''}) -- too thin to compare on, and "
            f"pinning one will empty the chart."
        )
    if takeaways:
        blocks.append({"type": "insights", "title": "Key Takeaways",
                       "items": takeaways[:3]})
    return blocks


# Population-API filter vocabularies, read from the data. The endpoint accepts
# country / organ / histology / biomarkers / stage / line_intent -- the same set
# the Patient Intelligence funnel exposes -- so a question naming any of them
# scopes the map exactly as clicking that funnel would.
_POPULATION_VOCAB_CACHE = None


def _population_vocab():
    global _POPULATION_VOCAB_CACHE
    if _POPULATION_VOCAB_CACHE is None:
        vocab = {"organ": [], "histology": []}
        try:
            from db import get_conn
            with get_conn() as conn, conn.cursor() as cur:
                for col in ("organ", "histology"):
                    cur.execute(
                        "SELECT DISTINCT jsonb_array_elements_text(%s) "
                        "FROM oncosuite_gold.cohort_info WHERE %s IS NOT NULL"
                        % (col, col)
                    )
                    vocab[col] = sorted(
                        (r[0] for r in cur.fetchall() if r[0]),
                        key=len, reverse=True,
                    )
        except Exception:
            pass
        _POPULATION_VOCAB_CACHE = vocab
    return _POPULATION_VOCAB_CACHE


def build_cancer_cases_map(oncosuite_ids: list, question: str = ""):
    """Intent-only props for the new-cancer-cases map.

    The chart fetches its own points from ctsearch's /analytics/population and
    maps them with ctsearch's own buildPopulationMapPoints, so no rows are read
    here. What this contributes is the SCOPE: the country, and any of the other
    funnel filters the question named.
    """
    from analytics_data import (filters_from_question, biomarkers_from_question,
                                _FILTER_COLUMNS)
    from map_data import _country_in_question

    api_filters = {}

    # Reuse the shared extractors: phase/line/stage come from the analytics
    # vocabulary, biomarkers from the biomarker vocabulary.
    named = filters_from_question(question)
    if named.get("cancer_stage"):
        api_filters["stage"] = named["cancer_stage"]
    if named.get("line_of_therapy"):
        api_filters["line_intent"] = named["line_of_therapy"]

    bio = biomarkers_from_question(question)
    if bio.get("biomarker"):
        api_filters["biomarkers"] = bio["biomarker"]

    q = (question or "").lower()
    for key, values in _population_vocab().items():
        hits = [v for v in values
                if re.search(rf"(?<!\w){re.escape(v.lower())}(?!\w)", q)]
        if hits:
            api_filters[key] = hits

    # The population API takes the BARE country name ("Germany"), unlike the
    # feasibility/treatment APIs which want "Germany ( DEU )".
    country = _country_in_question(question)

    props = {"selfFetching": True, "graph": "new_cancer_cases_map"}
    if country:
        props["country"] = country
    if api_filters:
        props["apiFilters"] = api_filters
    return props


# Late registration: BUILDERS is defined above this function.
BUILDERS["CancerCasesMap"] = build_cancer_cases_map


def narrate_population(country=None, api_filters=None):
    """[intro, table] + takeaways for the new-cancer-cases map.

    A map alone shows WHERE without saying HOW MANY or how the burden compares,
    which is most of what a reader wants from an incidence question.
    """
    from analytics_data import population_facts

    facts = population_facts(country)
    if not facts:
        return []

    scope = _describe_filters(api_filters)
    blocks = []

    if facts.get("country"):
        pop = facts["population"]
        cases = facts["annual_cases"]
        per100k = round(100000.0 * cases / pop, 1) if pop else None
        lead = (
            f"**{facts['country']}** has a population of "
            f"**{pop:,}** and around **{cases:,}** new cancer cases a year"
            + (f" — roughly **{per100k}** per 100,000 people" if per100k else "")
            + f"{scope}."
        )
        if facts.get("cities"):
            lead += (f" The map plots **{facts['cities']:,}** localities, shaded "
                     f"by population density.")
        blocks.append({"type": "intro", "text": lead})

        cities = facts.get("top_cities") or []
        if cities:
            blocks.append({
                "type": "chart",
                "chart": "DimensionFactsTable",
                "props": {
                    "title": f"Largest population centres in {facts['country']}",
                    "columns": [
                        {"key": "city", "label": "City"},
                        {"key": "population", "label": "Population"},
                        {"key": "area", "label": "Area (km²)"},
                    ],
                    "data": [
                        {"city": c["city"], "population": c["population"],
                         "area": ("—" if c["area"] is None else c["area"])}
                        for c in cities
                    ],
                },
            })

        takeaways = []
        if cities and pop:
            top = cities[0]
            share = round(100.0 * top["population"] / pop, 1)
            takeaways.append(
                f"**{top['city']}** is the largest centre at "
                f"{top['population']:,} people ({share}% of the country) — the "
                f"densest single catchment for site placement."
            )
            head = sum(c["population"] for c in cities[:5])
            takeaways.append(
                f"The top five cities hold {head:,} people "
                f"({round(100.0 * head / pop)}% of the population), so a small "
                f"number of sites can reach a large share of the addressable pool."
            )
        if per100k:
            takeaways.append(
                f"At {per100k} cases per 100,000, an enrolling site drawing from "
                f"a 1-million catchment sees roughly "
                f"{round(cases / pop * 1000000):,} new cases a year before any "
                f"eligibility filtering."
            )
        if takeaways:
            blocks.append({"type": "insights", "title": "Key Takeaways",
                           "items": takeaways[:3]})
        return blocks

    # No country named -> compare countries.
    rows = facts.get("countries") or []
    if not rows:
        return []
    named = [r for r in rows if (r["country"] or "").lower() != "global"]
    lead = (f"Comparing **{len(named)}** countries by annual new cancer "
            f"cases{scope}.")
    if named:
        top = named[0]
        lead += (f" **{top['country']}** leads with **{top['annual_cases']:,}** "
                 f"cases a year.")
    blocks.append({"type": "intro", "text": lead})
    blocks.append({
        "type": "chart",
        "chart": "DimensionFactsTable",
        "props": {
            "title": "New cancer cases by country",
            "columns": [
                {"key": "country", "label": "Country"},
                {"key": "annual_cases", "label": "Cases / year"},
                {"key": "population", "label": "Population"},
                {"key": "per100k", "label": "Per 100,000"},
            ],
            "data": [
                {"country": r["country"], "annual_cases": r["annual_cases"],
                 "population": r["population"],
                 "per100k": (round(100000.0 * r["annual_cases"] / r["population"], 1)
                             if r["population"] else "—")}
                for r in rows
            ],
        },
    })

    # Takeaways for the country comparison: incidence RATE is the comparable
    # figure, not raw case count -- a large country leads on volume by size
    # alone, which tells a reader very little.
    rated = [
        (r["country"], round(100000.0 * r["annual_cases"] / r["population"], 1))
        for r in named if r["population"]
    ]
    takeaways = []
    if rated:
        rated.sort(key=lambda kv: kv[1], reverse=True)
        takeaways.append(
            f"By incidence RATE, **{rated[0][0]}** is highest at "
            f"{rated[0][1]} cases per 100,000 — {named[0]['country']} leads on "
            f"raw volume largely because of population size."
        )
        if len(rated) > 1:
            takeaways.append(
                f"**{rated[-1][0]}** has the lowest rate at {rated[-1][1]} per "
                f"100,000, a {round(rated[0][1] / rated[-1][1], 1)}x spread "
                f"across the set."
            )
    if takeaways:
        blocks.append({"type": "insights", "title": "Key Takeaways",
                       "items": takeaways[:3]})
    return blocks


def narrate_generic(chart_name, props, question=""):
    """Prose + takeaways for any chart that has no bespoke narrator.

    Every answer should read the same way -- a paragraph saying what the data
    shows, the figures, the chart, then the takeaways -- and wiring that per
    chart would leave most of the 20+ charts as a bare picture forever. So this
    works from the SHAPE the chart already returns:

      {columns, data}  -- a table: describe the leading rows and the spread
      {points}         -- a scatter/bar set: describe the range and the leaders

    Nothing is invented: every number is read from the props the chart itself is
    rendering, so the prose cannot disagree with the picture. Returns [] when the
    props carry nothing worth stating, which is better than padding.
    """
    if not props:
        return []
    label = (CHART_SPECS.get(chart_name) or {}).get("label") or chart_name
    blocks = []

    rows = props.get("data")
    cols = props.get("columns")
    points = props.get("points")

    def _num(v):
        try:
            return float(str(v).replace(",", "").replace("%", ""))
        except Exception:
            return None

    # ---- table-shaped charts -------------------------------------------------
    if isinstance(rows, list) and rows and isinstance(cols, list) and cols:
        first_key = (cols[0] or {}).get("key")
        first_label = (cols[0] or {}).get("label") or "row"
        # The first numeric column is what the table is really ranked by.
        metric = None
        for c in cols[1:]:
            k = c.get("key")
            if k and any(_num(r.get(k)) is not None for r in rows):
                metric = c
                break

        lead = f"**{label}** — {len(rows):,} {first_label.lower()} rows."
        if metric:
            vals = [(r.get(first_key), _num(r.get(metric["key"])))
                    for r in rows if _num(r.get(metric["key"])) is not None]
            if vals:
                vals.sort(key=lambda kv: kv[1], reverse=True)
                top, top_v = vals[0]
                total = sum(v for _, v in vals)
                share = round(100.0 * top_v / total) if total else None
                lead = (
                    f"**{label}** — **{len(rows):,}** rows. "
                    f"**{top}** leads on {metric['label'].lower()} at "
                    f"**{top_v:,.0f}**"
                    + (f" ({share}% of the total)" if share else "")
                    + "."
                )
                if len(vals) > 2:
                    runners = ", ".join(f"{n} ({v:,.0f})" for n, v in vals[1:3])
                    lead += f" Then {runners}."
                blocks.append({"type": "intro", "text": lead})

                takeaways = []
                head = sum(v for _, v in vals[:3])
                if total and len(vals) >= 3:
                    takeaways.append(
                        f"The top three account for "
                        f"{round(100.0 * head / total)}% of the total "
                        f"{metric['label'].lower()}."
                    )
                tail = [n for n, v in vals if total and v / total < 0.02]
                if tail:
                    takeaways.append(
                        f"{len(tail)} row{'' if len(tail) == 1 else 's'} "
                        f"sit{'s' if len(tail) == 1 else ''} below 2% each "
                        f"({', '.join(str(t) for t in tail[:3])}"
                        f"{', …' if len(tail) > 3 else ''}) — too thin to draw "
                        f"conclusions from individually."
                    )
                if len(vals) >= 2 and vals[-1][1]:
                    spread = round(vals[0][1] / vals[-1][1], 1)
                    if spread >= 3:
                        takeaways.append(
                            f"The range is wide: {vals[0][0]} is {spread}× "
                            f"{vals[-1][0]} on {metric['label'].lower()}."
                        )
                if takeaways:
                    blocks.append({"type": "insights",
                                   "title": "Key Takeaways",
                                   "items": takeaways[:3]})
                return blocks
        blocks.append({"type": "intro", "text": lead})
        return blocks

    # ---- point-shaped charts ------------------------------------------------
    if isinstance(points, list) and points:
        named = [p for p in points if isinstance(p, dict)]
        xs = [_num(p.get("x")) for p in named]
        ys = [_num(p.get("y")) for p in named]
        xs = [v for v in xs if v is not None]
        ys = [v for v in ys if v is not None]
        lead = f"**{label}** — **{len(named):,}** points plotted."
        if xs and ys:
            xl = props.get("xLabel") or "x"
            yl = props.get("yLabel") or "y"
            lead += (f" {xl} spans {min(xs):,.4g}–{max(xs):,.4g}; "
                     f"{yl} spans {min(ys):,.4g}–{max(ys):,.4g}.")
        blocks.append({"type": "intro", "text": lead})

        # Some point sets carry no x/y at all (trial-duration points hold
        # {country, total_trials, *_stats}), so rank on whichever numeric field
        # they DO have rather than giving up and emitting no takeaways.
        rank_field = "y"
        if not ys:
            for cand in ("total_trials", "trials", "value", "count", "size"):
                if any(_num(p.get(cand)) is not None for p in named):
                    rank_field = cand
                    break

        # Whichever field carries the label, name the extremes -- that is the
        # thing a reader looks for first in a scatter.
        key = next((k for k in ("name", "country", "label")
                    if any(k in p for p in named)), None)
        if key:
            ranked = sorted(
                ((p.get(key), _num(p.get(rank_field))) for p in named
                 if _num(p.get(rank_field)) is not None),
                key=lambda kv: kv[1], reverse=True,
            )
            if len(ranked) >= 2:
                blocks.append({
                    "type": "insights", "title": "Key Takeaways",
                    "items": [
                        f"**{ranked[0][0]}** is highest at "
                        f"{ranked[0][1]:,.4g}; **{ranked[-1][0]}** lowest at "
                        f"{ranked[-1][1]:,.4g}.",
                        (f"{len(ranked):,} entries carry a value on both axes "
                         f"— the rest of the set cannot be plotted."
                         if ys else
                         f"{len(ranked):,} entries are plotted, ranked by "
                         f"{rank_field.replace('_', ' ')}."),
                    ],
                })
        return blocks

    return []
