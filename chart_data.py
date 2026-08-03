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

from db import get_conn

# Registry mirror. `enabled` must agree with frontend/src/charts/registry.js --
# a chart enabled here but not there simply renders nothing, and vice versa.
CHART_SPECS = {
    "EndpointsTable": {
        "label": "Endpoint outcomes table",
        "use_when": (
            "the question asks about trial endpoints, outcomes, ORR/PFS/OS values, "
            "or primary vs secondary endpoint results"
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
        "label": "Population / case-volume density map",
        "use_when": (
            "the question is about PATIENT or CASE VOLUMES, epidemiology, "
            "incidence, addressable population, or comparing countries/markets "
            "(e.g. 'annual new cancer cases in the US, China and Germany')"
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
    """
    if not oncosuite_ids:
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
def build_site_map(oncosuite_ids: list, limit: int = 4000) -> dict | None:
    """Props for SiteMap: {points:[{longitude, latitude, name, value}], title}.

    facility_info carries real coordinates for 30,393 of its 31,222 rows, so the
    heat map is plotted from actual site locations. Rows without coordinates are
    excluded by the WHERE clause rather than defaulted to (0, 0).

    `value` is the number of trials at that coordinate, which drives heatmap
    weight -- so density reflects real site concentration.
    """
    if not oncosuite_ids:
        return None

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT f.latitude, f.longitude,
                   MIN(f.name) AS name,
                   COUNT(DISTINCT f.oncosuite_id) AS trials
              FROM oncosuite_gold.facility_info f
             WHERE f.oncosuite_id IN %s
               AND f.latitude IS NOT NULL
               AND f.longitude IS NOT NULL
             GROUP BY f.latitude, f.longitude
             ORDER BY trials DESC
             LIMIT %s
            """,
            (tuple(oncosuite_ids), limit),
        )
        rows = cur.fetchall()

    points = [
        {
            "latitude": float(lat),
            "longitude": float(lon),
            "name": _txt(name),
            "value": int(trials or 1),
        }
        for lat, lon, name, trials in rows
    ]
    if not points:
        return None

    return {"points": points, "title": "Site density", "metric": "trial sites"}


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


def build_population_map(oncosuite_ids: list):
    """Props for ctsearch's MapView -- see map_data.build_map_points."""
    from map_data import build_map_points
    return build_map_points(oncosuite_ids or None)


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
