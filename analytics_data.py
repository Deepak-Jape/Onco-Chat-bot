"""Builders for the `analytics` schema -- the pre-computed views behind the
Analytics section (efficacy vs safety, treatment strategies, feasibility,
competition intensity, enrollment speed).

These are the tables that were missing when the cohort dashboard was first
wired: oncosuite_gold holds almost no posted outcome values, but
analytics.efficacy_vs_safety carries real ORR and adverse-event figures per arm,
and analytics.trial_duration_country carries real country populations.

Every builder accepts an optional `oncosuite_ids` scope so the same query serves
both a drill-down from a trial list and a direct analytics question. A builder
returns None when the scope has no rows, so the caller can drop the panel rather
than render an empty frame.
"""

import re

from db import get_conn


def _clean_country(name):
    """'United States ( USA )' -> 'United States'."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", str(name or "")).strip()


def _country_code(name):
    """The parenthesised code: 'Italy ( ITA )' -> 'ITA'."""
    m = re.search(r"\(\s*([A-Za-z]{2,4})\s*\)\s*$", str(name or ""))
    return m.group(1).upper() if m else None


# ISO alpha-2 for the flag icons the chart renders beside each bar. Only the
# countries that actually appear in these views need an entry; anything missing
# simply renders without a flag.
_ISO2 = {
    "USA": "US", "CHN": "CN", "ESP": "ES", "FRA": "FR", "ITA": "IT",
    "GER": "DE", "DEU": "DE", "JPN": "JP", "KOR": "KR", "ROK": "KR",
    "GBR": "GB", "UK": "GB", "CAN": "CA", "AUS": "AU", "TWN": "TW",
    "IND": "IN", "BRA": "BR", "POL": "PL", "NLD": "NL", "BEL": "BE",
    "SWE": "SE", "DNK": "DK", "NOR": "NO", "FIN": "FI", "AUT": "AT",
    "CHE": "CH", "ISR": "IL", "TUR": "TR", "RUS": "RU", "MEX": "MX",
    "ARG": "AR", "CZE": "CZ", "HUN": "HU", "PRT": "PT", "GRC": "GR",
    "SGP": "SG", "HKG": "HK", "THA": "TH", "MYS": "MY", "NZL": "NZ",
    "ZAF": "ZA", "UKR": "UA", "ROU": "RO", "BGR": "BG", "IRL": "IE",
}


def _country_iso2(name):
    return _ISO2.get(_country_code(name) or "")


def _scope(alias, oncosuite_ids, where=None, params=None):
    """Shared WHERE builder: optionally restrict a query to a set of trials.

    `params` are the placeholder values already implied by `where` (e.g. from
    _filters), in the same order; the trial-id tuple is appended after them.
    """
    where = list(where or [])
    params = list(params or [])
    if oncosuite_ids:
        where.append(f"{alias}.oncosuite_id IN %s")
        params.append(tuple(oncosuite_ids))
    clause = (" WHERE " + " AND ".join(where)) if where else ""
    return clause, params


def _population(v):
    """These views store population as display text ("9 million", "1.4 billion").

    Returns an int, or None when the value cannot be parsed -- never a guess.
    """
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).strip().lower().replace(",", "")
    mult = 1
    for word, factor in (("billion", 1_000_000_000), ("million", 1_000_000),
                         ("thousand", 1_000), ("bn", 1_000_000_000), ("m", 1_000_000)):
        if s.endswith(word):
            mult = factor
            s = s[: -len(word)].strip()
            break
    try:
        return int(float(s) * mult)
    except ValueError:
        return None


def _first(v):
    """First value of a list-ish column.

    These views store such columns as a real jsonb array, as jsonb-array text
    like "['Phase 2']", OR (efficacyvssafety_table's line_of_therapy/cancer_stage/
    phase/country, native postgres ARRAY columns of an unregistered element
    type) as postgres's own array literal text, e.g. '{"Phase 2"}' -- psycopg2
    has no typecaster for that element type, so it comes back as the raw
    driver text rather than a Python list. All three shapes are handled here.
    """
    if isinstance(v, list):
        return str(v[0]).strip() if v else None
    s = str(v or "").strip()
    if (s.startswith("[") and s.endswith("]")) or (s.startswith("{") and s.endswith("}")):
        s = s[1:-1]
    return s.replace('"', "").replace("'", "").split(",")[0].strip() or None


# --------------------------------------------------------------------------
# Efficacy vs Safety
# --------------------------------------------------------------------------
# Safety-side metrics the chart's `sae` point field (and its y-axis option
# list) may draw from, in priority order. Kept as ONE shared list so the
# y-axis options offered and the field actually populated below never drift
# apart -- whichever of these wins as the default is guaranteed to be the one
# reflected in `sae`, so "N plotted" never claims points the chart then
# renders as empty (see NewTreatment.jsx's EfficacyVsSafety, vendored/
# unmodified, which always plots the literal `orr`/`sae` fields regardless of
# its own dropdowns). All five are genuine safety/toxicity measures -- DLT for
# dose-escalation designs, TEAE more broadly -- just labelled differently by
# trial design; excluded on purpose are this table's combined/ambiguous
# labels ("TEAES, TESAES", "OR, CR, PR", ...) from its extraction pipeline,
# which never match any single metric and are correctly left out rather than
# guessed at.
_SAFETY_METRICS = ("SAE", "AE", "AES", "DLT", "TEAE")


def _safety_value(metrics):
    return next((metrics[m] for m in _SAFETY_METRICS if m in metrics), None)


# The efficacyvssafety_* family is the same measurements grouped a different
# way -- one table per "Color by" dimension. Each is keyed by oncosuite_id and
# carries endpoint_abbr / endpoint_value plus its own grouping column, so the
# dimension the user picks decides which table is read.
EFFICACY_DIMENSIONS = {
    "backbone": {
        "table": "efficacyvssafety_backbone",
        "field": "backbone",
        "label": "Color by Backbone",
    },
    "combination_modality": {
        "table": "efficacyvssafety_backbone",
        "field": "combination_modality",
        "label": "Color by Combination Modality",
    },
    "moa_category": {
        "table": "efficacyvssafety_moa",
        "field": "moa_category",
        "label": "Color by Mechanism of Action",
    },
    "mechanism_of_action": {
        "table": "efficacyvssafety_moa",
        "field": "mechanism_of_action",
        "label": "Color by Mechanism (detailed)",
    },
    "modality": {
        "table": "efficacyvssafety_modality",
        "field": "modality",
        "label": "Color by Modality",
    },
    "target": {
        "table": "efficacyvssafety_modality",
        "field": "target",
        "label": "Color by Target",
    },
    "mode_of_administration": {
        "table": "efficacyvssafety_modality",
        "field": "mode_of_administration",
        "label": "Color by Mode of Administration",
    },
}


def _filters(alias, filters):
    """Optional line_of_therapy / phase / cancer_stage / country narrowing.

    These columns are jsonb arrays in the analytics views, so membership is
    tested with the containment operator rather than equality.
    """
    where, params = [], []
    for key in ("line_of_therapy", "phase", "cancer_stage", "country"):
        value = (filters or {}).get(key)
        if not value:
            continue
        values = value if isinstance(value, list) else [value]
        where.append(f"{alias}.{key} ?| %s")
        params.append(list(values))
    return where, params


def build_competition_vs_enrollment(oncosuite_ids=None, filters=None, limit=2000):
    """Competition Intensity vs Enrollment Speed -- one point per country.

    x = planned patients as a share of population (competition intensity),
    y = recruitment speed. Mirrors the Feasibility tab's scatter.
    """
    extra, extra_params = _filters("g", filters)
    clause, params = _scope(
        "g", oncosuite_ids,
        ["g.country IS NOT NULL",
         "g.competition_intensity IS NOT NULL",
         "g.recruitment_speed IS NOT NULL"] + extra,
        extra_params,
    )
    sql = f"""
        SELECT g.country,
               AVG(g.competition_intensity) AS intensity,
               AVG(g.recruitment_speed)     AS speed,
               MAX(g.active_trials)         AS trials,
               MAX(g.planned_patients)      AS planned
          FROM analytics.competitionintensity_graph g
          {clause}
         GROUP BY g.country
         ORDER BY trials DESC NULLS LAST
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    points = [
        {
            "name": _clean_country(country),
            "x": round(float(intensity), 4),
            "y": round(float(speed), 3),
            "trials": int(trials or 0),
            "planned": int(planned or 0),
        }
        for country, intensity, speed, trials, planned in rows
    ]
    return {
        "title": "Competition Intensity vs Enrollment Speed",
        "points": points,
        "xLabel": "Planned Patients / Population (%)",
        "yLabel": "Recruitment speed (patients/site/month)",
    }


def build_trial_duration_by_country(oncosuite_ids=None, filters=None, limit=25):
    """Trial Duration by Country -- stacked start-up / recruitment / data-lock."""
    extra, extra_params = _filters("d", filters)
    clause, params = _scope(
        "d", oncosuite_ids, ["d.country IS NOT NULL"] + extra, extra_params,
    )
    # Every percentile the chart's tooltip shows, per phase. ctsearch's own
    # buildTrialDurationRows consumes exactly these column groups.
    sql = f"""
        SELECT d.country,
               MAX(d.total_trials) AS trials,
               AVG(d.study_startup_min_months)          AS su_min,
               AVG(d.study_startup_p25_months)          AS su_p25,
               AVG(d.study_startup_median_months)       AS su_med,
               AVG(d.study_startup_p75_months)          AS su_p75,
               AVG(d.study_startup_max_months)          AS su_max,
               AVG(d.recruitment_window_min_months)     AS rw_min,
               AVG(d.recruitment_window_p25_months)     AS rw_p25,
               AVG(d.recruitment_window_median_months)  AS rw_med,
               AVG(d.recruitment_window_p75_months)     AS rw_p75,
               AVG(d.recruitment_window_max_months)     AS rw_max,
               AVG(d.analytics_datalock_min_months)     AS dl_min,
               AVG(d.analytics_datalock_p25_months)     AS dl_p25,
               AVG(d.analytics_datalock_median_months)  AS dl_med,
               AVG(d.analytics_datalock_p75_months)     AS dl_p75,
               AVG(d.analytics_datalock_max_months)     AS dl_max
          FROM analytics.trial_duration_country d
          {clause}
         GROUP BY d.country
         ORDER BY trials DESC NULLS LAST
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    def _m(v):
        return round(float(v), 1) if v is not None else None

    # Emit the RAW API point shape (country string with its code, total_trials
    # and the three *_stats blocks). ctsearch's own buildTrialDurationRows then
    # derives the ISO codes, flags, risk band and tooltip percentiles -- so the
    # chart matches its app exactly rather than approximately.
    points = []
    for r in rows:
        country, trials = r[0], int(r[1] or 0)
        su, rw, dl = r[2:7], r[7:12], r[12:17]

        def _stats(group):
            lo, p25, med, p75, hi = (_m(v) for v in group)
            return {
                "trials": trials,
                "min": lo, "25_perc": p25, "median": med,
                "75_perc": p75, "max": hi,
            }

        points.append({
            "country": country,          # e.g. "United States ( USA )"
            "total_trials": trials,
            "study_startup_stats": _stats(su),
            "recruitment_window_stats": _stats(rw),
            "analytics_datalock_stats": _stats(dl),
        })

    counts = [p["total_trials"] for p in points] or [0]
    return {
        "title": "Trial Duration by Country",
        "points": points,
        "minTrials": min(counts),
        "maxTrials": max(counts),
    }


def build_amendment_risk(oncosuite_ids=None, filters=None, limit=2000):
    """Amendment Risk vs Enrollment Speed -- one point per trial."""
    extra, extra_params = _filters("a", filters)
    clause, params = _scope(
        "a", oncosuite_ids,
        ["a.amendment_count IS NOT NULL",
         "a.recruitment_speed_count IS NOT NULL"] + extra,
        extra_params,
    )
    sql = f"""
        SELECT a.oncosuite_id,
               MAX(a.amendment_count)          AS amendments,
               AVG(a.recruitment_speed_count)  AS speed,
               MAX(a.total_enrollment)         AS enrollment
          FROM analytics.amendment_graph a
          {clause}
         GROUP BY a.oncosuite_id
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    points = [
        {
            "name": oid,
            "x": int(amendments or 0),
            "y": round(float(speed), 3),
            "size": int(enrollment or 1) or 1,
        }
        for oid, amendments, speed, enrollment in rows
    ]
    return {
        "title": "Amendment Risk vs Enrollment Speed",
        "points": points,
        "xLabel": "Amendments",
        "yLabel": "Recruitment speed",
    }


def build_efficacy_safety_rows(oncosuite_ids=None, limit=1000):
    """Every endpoint row in analytics.efficacy_vs_safety, unaggregated.

    The scatter shows one point per ARM (153 of them); this is the underlying
    row-per-arm-per-endpoint view the production API query returns -- 452 rows,
    because an arm reporting seven endpoints contributes seven rows. Useful for
    auditing what the chart aggregates.

    NOTE: no per-cent signs in the SQL -- psycopg2 reads them as placeholders.
    """
    clause, params = _scope("x", oncosuite_ids, ["x.endpoint_value IS NOT NULL"])
    sql = f"""
        SELECT x.arm_id, x.oncosuite_id, x.arm_type, x.treatment_strategy,
               x.endpoint_category, x.endpoint_abbreviation, x.endpoint_value,
               f.phase::text, x.year
          FROM analytics.efficacy_vs_safety x
          LEFT JOIN analytics.filters_table f ON f.arm_id = x.arm_id
          {clause}
         ORDER BY x.arm_id, x.endpoint_abbreviation
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    return {
        "title": f"Efficacy / safety endpoint rows ({len(rows)})",
        "useFigmaStyles": True,
        "columns": [
            {"key": "arm", "label": "Arm"},
            {"key": "trial", "label": "Trial"},
            {"key": "strategy", "label": "Strategy"},
            {"key": "category", "label": "Category"},
            {"key": "endpoint", "label": "Endpoint"},
            {"key": "value", "label": "Value"},
            {"key": "phase", "label": "Phase"},
            {"key": "year", "label": "Year"},
        ],
        "data": [
            {
                "arm": str(arm_id),
                "trial": oid,
                "strategy": strategy or arm_type or "—",
                "category": (category or "").replace("-based", ""),
                "endpoint": abbrev or "—",
                "value": round(float(value), 2) if value is not None else None,
                "phase": _first(phase) or "—",
                "year": year,
            }
            for (arm_id, oid, arm_type, strategy, category, abbrev, value,
                 phase, year) in rows
        ],
    }


def build_efficacy_safety_wide(oncosuite_ids=None, limit=5000):
    """Scatter from analytics.efficacy_vs_safety -- the full arm-level table.

    Mirrors the production API query: every endpoint row is kept and bucketed by
    phase and by year, so the UI can slice the same arms either way. One point
    per arm; `buckets` on each point lists the phase/year buckets it belongs to.

    NOTE: no per-cent signs in the SQL below -- psycopg2 reads them as
    parameter placeholders.
    """
    clause, params = _scope(
        "x", oncosuite_ids,
        # Values outside 0-100 are participant counts sharing a column with
        # percentages (ORR up to 159, AE up to 599). Plotting them as rates is
        # what stretched the axes to 159 and 518.
        ["x.endpoint_value BETWEEN 0 AND 100",
         "x.endpoint_abbreviation IS NOT NULL"],
    )
    sql = f"""
        SELECT x.arm_id,
               MIN(x.oncosuite_id)        AS oncosuite_id,
               MIN(x.treatment_strategy)  AS strategy,
               MIN(x.arm_type)            AS arm_type,
               MIN(f.phase::text)         AS phase,
               MIN(x.year)                AS year,
               UPPER(x.endpoint_abbreviation) AS metric,
               MAX(x.endpoint_value)      AS value
          FROM analytics.efficacy_vs_safety x
          LEFT JOIN analytics.filters_table f ON f.arm_id = x.arm_id
          {clause}
         GROUP BY x.arm_id, UPPER(x.endpoint_abbreviation)
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    arms = {}
    for arm_id, oid, strategy, arm_type, phase, year, metric, value in rows:
        entry = arms.setdefault(arm_id, {
            "oncosuite_id": oid,
            "strategy": strategy or arm_type or "Unknown",
            "phase": _first(phase) or "Unknown",
            "year": str(year) if year else None,
            "metrics": {},
        })
        if value is not None:
            entry["metrics"][metric] = float(value)

    points = [
        {
            "name": str(arm_id),
            "metrics": info["metrics"],
            "orr": info["metrics"].get("ORR"),
            "sae": _safety_value(info["metrics"]),
            "n": 1,
            "strategy": info["strategy"],
            "biomarker": info["phase"],
            "mode": info["year"] or "Unknown",
            "phase": info["phase"],
            "year": info["year"],
            "lineOfTherapy": [],
            "stage": [],
            "country": [],
            "oncosuite_id": info["oncosuite_id"],
        }
        for arm_id, info in arms.items()
    ]

    def _have(m):
        return sum(1 for p in points if p["metrics"].get(m) is not None)

    def _pair_count(x, y):
        return sum(1 for p in points
                   if p["metrics"].get(x) is not None
                   and p["metrics"].get(y) is not None)

    # The chart component this feeds (NewTreatment.jsx's EfficacyVsSafety,
    # vendored/unmodified) always plots the literal `orr`/`sae` point fields --
    # its axis dropdowns are cosmetic and never re-key the plotted data. Only
    # ORR populates `orr` and only SAE/AE/AES populate `sae` (see the point
    # construction above), so those are the only metrics that can ever be
    # offered as a default: picking e.g. DLT here would report "N plotted"
    # while the chart actually renders nothing for any of them.
    x_all = ["ORR"]
    y_all = list(_SAFETY_METRICS)
    x_options = [m for m in x_all if _have(m) >= 3]
    y_options = [m for m in y_all if _have(m) >= 3]
    if not x_options or not y_options:
        return None

    default_x, default_y = max(
        ((x, y) for x in x_options for y in y_options),
        key=lambda pair: _pair_count(*pair),
    )

    return {
        "liveData": points,
        "xOptions": x_options,
        "yOptions": y_options,
        "defaultX": default_x,
        "defaultY": default_y,
        "pairCounts": {f"{x}|{y}": _pair_count(x, y)
                       for x in x_options for y in y_options},
        "colorOptions": [
            {"label": "Color by Treatment Strategy", "field": "strategy"},
            {"label": "Color by Phase", "field": "phase"},
            {"label": "Color by Year", "field": "year"},
        ],
    }


def build_efficacy_safety_by_dimension(dimension="backbone", oncosuite_ids=None,
                                       limit=2000):
    """Scatter points grouped by one of the efficacyvssafety_* dimensions.

    Each row in these tables is (trial, grouping value, endpoint), so a point is
    a trial+group pair carrying every endpoint it reported. Arms are not
    identified here -- the grouping value is the unit of comparison.
    """
    spec = EFFICACY_DIMENSIONS.get(dimension)
    if not spec:
        return None

    clause, params = _scope(
        "t", oncosuite_ids,
        [f"t.{spec['field']} IS NOT NULL",
         "t.endpoint_abbr IS NOT NULL",
         "t.endpoint_value BETWEEN 0 AND 100"],
    )
    sql = f"""
        SELECT t.oncosuite_id,
               t.{spec['field']} AS grp,
               UPPER(t.endpoint_abbr) AS metric,
               MAX(t.endpoint_value) AS value,
               MAX(t.n) AS n
          FROM analytics.{spec['table']} t
          {clause}
         GROUP BY 1, 2, 3
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    units = {}
    for oid, grp, metric, value, n in rows:
        # Some grouping columns are jsonb arrays (mode_of_administration), which
        # are unhashable -- collapse to their first value for the group key.
        if isinstance(grp, list):
            grp = _first(grp) or "Unknown"
        entry = units.setdefault((oid, str(grp)), {"metrics": {}, "n": n})
        if value is not None:
            entry["metrics"][metric] = float(value)

    points = [
        {
            "name": f"{oid} · {grp}",
            "metrics": info["metrics"],
            "orr": info["metrics"].get("ORR"),
            "sae": _safety_value(info["metrics"]),
            "n": int(info["n"] or 1) or 1,
            # Every grouping key is mirrored onto `strategy` so the chart's
            # default "Color by" field groups correctly whichever table is used.
            "strategy": str(grp),
            "biomarker": str(grp),
            "mode": str(grp),
            "lineOfTherapy": [],
            "stage": [],
            "country": [],
            "oncosuite_id": oid,
        }
        for (oid, grp), info in units.items()
    ]

    def _pair_count(x, y):
        return sum(1 for p in points
                   if p["metrics"].get(x) is not None
                   and p["metrics"].get(y) is not None)

    def _have(m):
        return sum(1 for p in points if p["metrics"].get(m) is not None)

    # An axis option is offered when enough units report that metric on its own.
    # Requiring a metric to PAIR with the other axis hid ORR-only units, which
    # are still worth plotting -- the chart shows them against whichever axis
    # they do have.
    # Restricted to what the chart's fixed `orr`/`sae` point fields actually
    # carry (see the point construction above) -- NewTreatment.jsx's
    # EfficacyVsSafety (vendored, unmodified) always plots those two literal
    # fields, so a default of e.g. DLT would report points as "plotted" while
    # rendering nothing.
    x_all = ["ORR"]
    y_all = list(_SAFETY_METRICS)
    x_options = [x for x in x_all if _have(x) >= 3]
    y_options = [y for y in y_all if _have(y) >= 3]
    if not x_options or not y_options:
        return None

    default_x, default_y = max(
        ((x, y) for x in x_options for y in y_options),
        key=lambda pair: _pair_count(*pair),
    )

    # Keep every unit that reports EITHER axis; the chart plots each against the
    # metric it has.
    points = [
        p for p in points
        if any(p["metrics"].get(m) is not None for m in x_options + y_options)
    ]

    return {
        "liveData": points,
        "xOptions": x_options,
        "yOptions": y_options,
        "defaultX": default_x,
        "defaultY": default_y,
        "pairCounts": {f"{x}|{y}": _pair_count(x, y)
                       for x in x_options for y in y_options},
        "dimension": dimension,
        "dimensionLabel": spec["label"],
    }


def build_efficacy_safety(oncosuite_ids=None, limit=400):
    """Scatter points: ORR against the safety rate for the same arm.

    Only arms carrying BOTH readings are plotted -- a point with a missing axis
    would misrepresent the trade-off the chart exists to show.

    Both axes are rates, but endpoint_value mixes percentages with raw
    participant counts in one column (ORR values up to 159, "AEs" up to 599)
    and there is no unit column to tell them apart. Values outside 0-100 are
    therefore excluded rather than plotted as if they were percentages -- that
    is what pushed points to ORR 159 and SAE 518 on the chart. Safety is
    likewise narrowed to SAE/AE, since the category also holds ECOG scores and
    MTD levels that share no scale with a rate.

    NOTE: keep literal per-cent signs out of the SQL string below -- psycopg2
    treats them as parameter placeholders.
    """
    clause, params = _scope(
        "e", oncosuite_ids,
        ["e.endpoint_abbreviation IS NOT NULL",
         "e.endpoint_value BETWEEN 0 AND 100"],
    )
    sql = f"""
        SELECT e.arm_id,
               MIN(e.oncosuite_id) AS oncosuite_id,
               MIN(e.treatment_strategy) AS strategy,
               MIN(e.arm_type) AS arm_type,
               -- phase isn't on efficacy_vs_safety itself; filters_table carries
               -- it (jsonb array) keyed by the same arm_id.
               MIN(f.phase::text) AS phase,
               UPPER(e.endpoint_abbreviation) AS metric,
               MAX(e.endpoint_value) AS value
          FROM analytics.efficacy_vs_safety e
          LEFT JOIN analytics.filters_table f ON f.arm_id = e.arm_id
          {clause}
         GROUP BY e.arm_id, UPPER(e.endpoint_abbreviation)
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    # Shape matches ctsearch's mapEfficacyVsSafetyToScatter output, which its
    # EfficacyVsSafety chart consumes as `liveData`: orr / sae drive the axes,
    # n is the bubble size, and strategy / biomarker / mode back the
    # "Color by" dropdown.
    # One row per (arm, metric) -> collapse to one record per arm holding every
    # metric it reported.
    arms = {}
    for arm_id, oid, strategy, arm_type, _phase, metric, value in rows:
        entry = arms.setdefault(arm_id, {
            "oncosuite_id": oid,
            "strategy": strategy or arm_type,
            "metrics": {},
        })
        if value is not None:
            entry["metrics"][metric] = float(value)

    # The chart's "Color by" dropdown groups on strategy / biomarker / mode, so
    # the last two have to carry real values or two of the three options do
    # nothing. Both live in sibling analytics views keyed by a jsonb arm_ids
    # array, which is unnested here to map arm -> value.
    arm_ids = list(arms)
    dims = {}          # {dimension_key: {arm_id: value}}
    if arm_ids:
        with get_conn() as conn, conn.cursor() as cur:
            # biomarker_dimension_over_time and treatment_dimension_over_time
            # each hold several dimensions in one table, keyed by
            # dimension_type: biomarker/target and drug/moa/drug_class/backbone.
            # arm_id is a plain int column here (one row per arm), not a jsonb
            # array, so this is a direct membership filter, no unnesting.
            for table in ("biomarker_dimension_over_time",
                          "treatment_dimension_over_time"):
                cur.execute(
                    f"""
                    SELECT d.dimension_type, d.arm_id, MIN(d.dimension_value) AS v
                      FROM analytics.{table} d
                     WHERE d.dimension_value IS NOT NULL
                       AND d.dimension_type IS NOT NULL
                       AND d.arm_id = ANY(%s)
                     GROUP BY 1, 2
                    """,
                    (arm_ids,),
                )
                for dim_type, arm, value in cur.fetchall():
                    dims.setdefault(str(dim_type), {})[arm] = value

            cur.execute(
                """
                SELECT m.arm_id, MIN(m.mode_of_admin) AS v
                  FROM analytics.mode_of_administration_over_time m
                 WHERE m.mode_of_admin IS NOT NULL
                   AND m.arm_id = ANY(%s)
                 GROUP BY 1
                """,
                (arm_ids,),
            )
            dims["mode"] = {r[0]: r[1] for r in cur.fetchall()}

    biomarkers = dims.get("biomarker", {})
    modes = dims.get("mode", {})

    points = []
    for arm_id, meta in arms.items():
        metrics = meta["metrics"]
        points.append({
            "name": str(arm_id),
            # orr / sae are the chart's default axes; `metrics` carries every
            # endpoint this arm has so the axis dropdowns can re-plot without a
            # round-trip.
            "orr": metrics.get("ORR"),
            "sae": _safety_value(metrics),
            "metrics": metrics,
            "n": 1,
            "strategy": meta["strategy"] or "Unknown",
            "biomarker": biomarkers.get(arm_id) or "Unknown",
            "mode": modes.get(arm_id) or "Unknown",
            # Every other dimension the analytics views carry (target, moa,
            # drug, drug_class, backbone) so "Color by" can group on any of
            # them, not just the original three.
            **{k: (v.get(arm_id) or "Unknown") for k, v in dims.items()},
            "lineOfTherapy": [],
            "stage": [],
            "country": [],
            "oncosuite_id": meta["oncosuite_id"],
        })

    if not points:
        return None

    # Only offer axis options the data can actually plot: an option that yields
    # an empty chart is worse than not offering it. A metric qualifies once at
    # least three arms carry it.
    def _available(names):
        out = []
        for m in names:
            if sum(1 for p in points if p["metrics"].get(m) is not None) >= 3:
                out.append(m)
        return out

    # Restricted to ORR/SAE-family: the chart's `orr`/`sae` point fields (set
    # above) are the only ones NewTreatment.jsx's EfficacyVsSafety (vendored,
    # unmodified) ever plots, regardless of which metric is "selected" here.
    x_options = _available(["ORR"])
    y_options = _available(_SAFETY_METRICS)
    if not x_options or not y_options:
        return None

    # Default to the pair the most arms actually report. Picking the first of
    # each list gave ORR+SAE -- only 2 arms of 140 -- so the chart opened almost
    # empty even though ORR+AE covers 26.
    def _pair_count(x, y):
        return sum(
            1 for p in points
            if p["metrics"].get(x) is not None and p["metrics"].get(y) is not None
        )

    default_x, default_y = max(
        ((x, y) for x in x_options for y in y_options),
        key=lambda pair: _pair_count(*pair),
    )

    # "Color by" options: only dimensions where at least two distinct real
    # values exist -- grouping everything into a single "Unknown" bucket tells
    # the reader nothing.
    LABELS = {
        "strategy": "Color by Treatment Strategy",
        "biomarker": "Color by Biomarker",
        "target": "Color by Target",
        "moa": "Color by Mechanism of Action",
        "drug_class": "Color by Drug Class",
        "backbone": "Color by Backbone",
        "mode": "Color by Mode of Administration",
    }
    color_options = []
    for field, label in LABELS.items():
        values = {p.get(field) for p in points if p.get(field) and p[field] != "Unknown"}
        if len(values) >= 2:
            color_options.append({"label": label, "field": field})

    return {
        "liveData": points,
        "xOptions": x_options,
        "yOptions": y_options,
        "defaultX": default_x,
        "defaultY": default_y,
        # Arm counts per pair, so the UI can show how many points a combination
        # will plot before the user picks it.
        "pairCounts": {
            f"{x}|{y}": _pair_count(x, y)
            for x in x_options for y in y_options
        },
        "colorOptions": color_options,
    }


# --------------------------------------------------------------------------
# Treatment strategies
# --------------------------------------------------------------------------
def build_treatment_strategies(oncosuite_ids=None, limit=15):
    """Arm counts by mechanism of action."""
    clause, params = _scope("t", oncosuite_ids, ["t.moa_category IS NOT NULL"])
    sql = f"""
        SELECT t.moa_category,
               SUM(COALESCE(t.arm_count, 1)) AS arms,
               COUNT(DISTINCT t.oncosuite_id) AS trials
          FROM analytics.treatment_strategies_moa t
          {clause}
         GROUP BY t.moa_category
         ORDER BY arms DESC
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None
    return {
        "title": "Treatment Strategies",
        "useFigmaStyles": True,
        "columns": [
            {"key": "moa", "label": "Mechanism of action"},
            {"key": "trials", "label": "Trials"},
            {"key": "arms", "label": "Arms"},
        ],
        "data": [
            {"moa": moa, "trials": int(trials or 0), "arms": int(arms or 0)}
            for moa, arms, trials in rows
        ],
    }


# --------------------------------------------------------------------------
# Feasibility -- country enrolment and start-up timelines
# --------------------------------------------------------------------------
def build_feasibility(oncosuite_ids=None, limit=20):
    """Per-country trial counts, planned patients and median start-up months."""
    clause, params = _scope("d", oncosuite_ids, ["d.country IS NOT NULL"])
    sql = f"""
        -- total_trials / actively_recruiting_trials / planned_patients are
        -- COUNTRY-level figures repeated on every trial row, so they are taken
        -- with MAX. Only the trial count itself is a true per-row aggregate.
        SELECT d.country,
               MAX(COALESCE(d.total_trials, 0))              AS trials,
               MAX(COALESCE(d.actively_recruiting_trials, 0)) AS recruiting,
               MAX(COALESCE(d.planned_patients, 0))          AS planned,
               AVG(d.study_startup_median_months)            AS startup,
               AVG(d.recruitment_window_median_months)       AS window,
               MAX(d.population)                             AS population
          FROM analytics.trial_duration_country d
          {clause}
         GROUP BY d.country
         ORDER BY trials DESC
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    def _m(v):
        return f"{float(v):.1f} mo" if v is not None else None

    return {
        "title": "Feasibility by Country",
        "useFigmaStyles": True,
        "columns": [
            {"key": "country", "label": "Country"},
            {"key": "trials", "label": "Trials"},
            {"key": "recruiting", "label": "Recruiting"},
            {"key": "planned", "label": "Planned patients"},
            {"key": "startup", "label": "Median start-up"},
            {"key": "window", "label": "Recruitment window"},
        ],
        "data": [
            {
                "country": country,
                "trials": int(trials or 0),
                "recruiting": int(recruiting or 0),
                "planned": int(planned or 0) or None,
                "startup": _m(startup),
                "window": _m(window),
            }
            for country, trials, recruiting, planned, startup, window, _pop in rows
        ],
    }


# --------------------------------------------------------------------------
# Competition intensity
# --------------------------------------------------------------------------
def build_competition(oncosuite_ids=None, limit=20):
    """Competition intensity and recruitment speed per country."""
    clause, params = _scope("g", oncosuite_ids, ["g.country IS NOT NULL"])
    sql = f"""
        SELECT g.country,
               AVG(g.competition_intensity) AS intensity,
               AVG(g.recruitment_speed)     AS speed,
               SUM(COALESCE(g.active_trials, 0))    AS active,
               SUM(COALESCE(g.planned_patients, 0)) AS planned,
               MAX(g.population)            AS population
          FROM analytics.competitionintensity_graph g
          {clause}
         GROUP BY g.country
         ORDER BY active DESC
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    def _n(v, places=2):
        return round(float(v), places) if v is not None else None

    return {
        "title": "Competition Intensity",
        "useFigmaStyles": True,
        "columns": [
            {"key": "country", "label": "Country"},
            {"key": "active", "label": "Active trials"},
            {"key": "intensity", "label": "Competition intensity"},
            {"key": "speed", "label": "Recruitment speed"},
            {"key": "planned", "label": "Planned patients"},
        ],
        "data": [
            {
                "country": country,
                "active": int(active or 0),
                "intensity": _n(intensity),
                "speed": _n(speed),
                "planned": int(planned or 0) or None,
            }
            for country, intensity, speed, active, planned, _pop in rows
        ],
    }


# --------------------------------------------------------------------------
# Population map -- real country populations from the analytics views
# --------------------------------------------------------------------------
def build_population_by_country(oncosuite_ids=None, limit=60):
    """Country population plus trial activity, for the density map and tables."""
    clause, params = _scope(
        "d", oncosuite_ids, ["d.country IS NOT NULL", "d.population IS NOT NULL"]
    )
    sql = f"""
        SELECT d.country,
               MAX(d.population::text)             AS population,
               MAX(COALESCE(d.total_trials, 0))    AS trials,
               MAX(COALESCE(d.planned_patients, 0)) AS planned
          FROM analytics.trial_duration_country d
          {clause}
         GROUP BY d.country
         -- population is display text ("9 million"), so it cannot be sorted in
         -- SQL; the caller re-sorts once _population has parsed it.
         ORDER BY trials DESC
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None
    out = [
        {
            "country": country,
            "population": _population(population),
            "trials": int(trials or 0),
            "planned_patients": int(planned or 0),
        }
        for country, population, trials, planned in rows
    ]
    out.sort(key=lambda r: r["population"] or 0, reverse=True)
    return out


# Known clean metric tokens -- matches the vocabulary build_efficacy_safety_wide
# already plots. analytics.efficacyvssafety_table also carries combined/messy
# labels (e.g. "TEAES, TESAES") from its extraction pipeline; those never match
# an UPPER() equality check here, so they are excluded rather than mislabeled
# as one metric.
_EXTRACTED_X = ("ORR", "DCR", "DOR", "DCB", "PCR", "TTR", "SD", "SOD", "PFS", "OS")
_EXTRACTED_Y = ("AE", "SAE", "AES", "DLT", "TEAE")


def build_efficacy_safety_extracted(oncosuite_ids=None, limit=1000):
    """Efficacy-vs-safety scatter from analytics.efficacyvssafety_table --
    an LLM-extraction table that has NOT been deduplicated: the same arm can
    carry several conflicting values for the same metric (seen directly: one
    arm's DLT reported as 0.0, 10.45, 22.0 and 47.8). There's no way to pick
    the "right" one -- confidence_score and source_text are NULL on every one
    of these rows (checked directly), so AVG() is used rather than MAX(): MAX
    would systematically bias every point toward the worst-looking safety
    rate and best-looking efficacy rate, which isn't neutral, it's cherry-
    picking the extreme in a specific direction. AVG is still not a verified
    value, just an unbiased one.

    Callers MUST treat a non-None result as extracted/unverified and caveat it
    visibly -- this is a last-resort fallback for when the clean sources
    (oncosuite_gold outcomes, analytics.efficacy_vs_safety) have no coverage at
    all for the trial set in question, not a general-purpose data source.
    """
    clause, params = _scope(
        "t", oncosuite_ids,
        ["t.endpoint_value IS NOT NULL",
         "UPPER(t.endpoint_abbr) = ANY(%s)"],
        params=[list(_EXTRACTED_X + _EXTRACTED_Y)],
    )
    sql = f"""
        SELECT t.oncosuite_id, t.arm_name,
               MIN(t.backbone::text)             AS backbone,
               MIN(t.combination_modality::text)  AS modality,
               MIN(t.phase::text)                 AS phase,
               UPPER(t.endpoint_abbr)              AS metric,
               AVG(t.endpoint_value)               AS value
          FROM analytics.efficacyvssafety_table t
          {clause}
         GROUP BY t.oncosuite_id, t.arm_name, UPPER(t.endpoint_abbr)
         LIMIT %s
    """
    params.append(limit)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
    if not rows:
        return None

    arms = {}
    for oid, arm_name, backbone, modality, phase, metric, value in rows:
        key = (oid, arm_name)
        entry = arms.setdefault(key, {
            "oncosuite_id": oid, "arm_name": arm_name,
            "strategy": backbone or modality or "Unknown",
            "phase": _first(phase) or "Unknown",
            "metrics": {},
        })
        if value is not None:
            entry["metrics"][metric] = float(value)

    points = [
        {
            "name": info["arm_name"] or info["oncosuite_id"],
            "metrics": info["metrics"],
            "orr": info["metrics"].get("ORR"),
            "sae": _safety_value(info["metrics"]),
            "n": 1,
            "strategy": info["strategy"],
            "biomarker": info["phase"],
            "mode": "Unknown",
            "phase": info["phase"],
            "year": None,
            "lineOfTherapy": [],
            "stage": [],
            "country": [],
            "oncosuite_id": info["oncosuite_id"],
        }
        for info in arms.values()
    ]

    def _have(m):
        return sum(1 for p in points if p["metrics"].get(m) is not None)

    def _pair_count(x, y):
        return sum(1 for p in points
                   if p["metrics"].get(x) is not None and p["metrics"].get(y) is not None)

    # _EXTRACTED_X/_EXTRACTED_Y widen the SQL fetch to every metric worth
    # carrying in `metrics` for the tooltip, but the chart itself (NewTreatment
    # .jsx's EfficacyVsSafety, vendored/unmodified) only ever plots the literal
    # `orr`/`sae` point fields set above -- so only ORR/SAE-family may be
    # offered as the default axis, or "N plotted" would claim points that
    # never actually render (e.g. DLT, which has no `sae`-field mapping).
    x_options = [m for m in _EXTRACTED_X if m == "ORR" and _have(m) >= 3]
    y_options = [m for m in _EXTRACTED_Y if m in _SAFETY_METRICS and _have(m) >= 3]
    if not x_options or not y_options:
        return None

    default_x, default_y = max(
        ((x, y) for x in x_options for y in y_options),
        key=lambda pair: _pair_count(*pair),
    )
    if _pair_count(default_x, default_y) < 3:
        return None

    return {
        "liveData": points,
        "xOptions": x_options,
        "yOptions": y_options,
        "defaultX": default_x,
        "defaultY": default_y,
        "pairCounts": {f"{x}|{y}": _pair_count(x, y)
                       for x in x_options for y in y_options},
        "colorOptions": [
            {"label": "Color by Backbone/Modality", "field": "strategy"},
            {"label": "Color by Phase", "field": "phase"},
        ],
    }
