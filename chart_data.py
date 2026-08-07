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
        # oncosuite_gold has no time-series survival table: there is no source
        # for per-timepoint probabilities or at-risk counts. Extracted and
        # wired, but gated -- flip to True (here and in registry.js) when the
        # data exists. Never synthesise the curve.
        "enabled": False,
        "disabled_reason": (
            "No time-series survival data in oncosuite_gold (no per-timepoint "
            "probabilities or at-risk counts)."
        ),
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
def build_km_curve(oncosuite_ids: list):
    """Always None: oncosuite_gold holds no per-timepoint survival data.

    Kept as an explicit stub so the wiring is complete and obvious. When a
    time-series source lands, populate `efficacy_explorer` in the shape
    EfficacyExplorerCard already reads -- {graph_type, endpoint, disease,
    data:{x_axis, y_axis, points:[{time, arms:{name: probability}}]}} -- and
    flip `enabled` in CHART_SPECS and registry.js.
    """
    return None


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
    "KMCurve": build_km_curve,
    # analytics schema
    "EfficacySafetyScatter": build_efficacy_safety_scatter,
    "EfficacySafetyRows": _analytics("build_efficacy_safety_rows"),
    "CompetitionVsEnrollment": _analytics("build_competition_vs_enrollment"),
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
