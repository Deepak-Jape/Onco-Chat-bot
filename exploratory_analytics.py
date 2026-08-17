"""Automated exploratory analytics -- Phase 1: dataset assembly + column
profiling. Foundation for the candidate-generation and scoring phases that
will build on top of this (see the architecture proposal this implements).

This deliberately does NOT try to replace key_learnings.py / complex_insights.py
yet -- it's the systematic column-typing layer those hand-written candidate
functions never had. A future phase will generate cross-tab candidates BY
WALKING THIS PROFILE (every pair of "usable" categorical columns, etc.)
instead of one hardcoded relationship at a time.

Grain: one row per COHORT (same grain dashboard.py's CohortTable already
uses), joining trial_info + cohort_info directly, and regimen/mechanism
facts aggregated per cohort via a second query (arms -> stratification ->
treatment -> drug), merged in Python -- same two-query-then-merge pattern
dashboard.py already uses for outcomes/safety, rather than correlated
subqueries per row.

Column profiling classifies every column into one of:
  - identifier       -- excluded from analysis entirely (oncosuite_id, cohort_id)
  - categorical       -- single-valued, low cardinality, usable as a pivot axis
  - multi_label       -- jsonb-array columns (biomarkers, histology, ...);
                         a cohort can carry more than one value, so any
                         cross-tab must explode to tag-instance level and say
                         so explicitly (see complex_insights.py's sponsor/MOA
                         HHI calc for the same caveat already applied once)
  - numeric           -- usable only if well-populated enough to trust
  - unusable          -- high-cardinality categorical, too-sparse numeric, or
                         constant/empty -- flagged with WHY, never silently
                         dropped, so the profile itself is inspectable

Thresholds are deliberately simple (sample-size and cardinality cutoffs, no
statistical machinery yet) -- see the architecture proposal's pushback on
not over-engineering ranking before the candidate-generation layer exists to
need it.
"""

import time

import pandas as pd

from db import query

# Above this many distinct values, a plain categorical column needs top-N /
# min-n filtering before it's usable as a pivot axis -- unfiltered use on a
# 700+-value field like sponsor_name is pure noise, not a candidate.
_MAX_CATEGORICAL_CARDINALITY = 50
# Below this, a numeric column's missingness makes any cross-tab built on it
# untrustworthy (e.g. max_age is only 29% populated in this dataset).
_MIN_NUMERIC_COVERAGE_PCT = 50.0
# Below this, an exploded multi-label column's non-null coverage is too thin
# to support cross-tabbing (most cohorts would just be "no tag").
_MIN_MULTI_LABEL_COVERAGE_PCT = 20.0

_IDENTIFIER_COLUMNS = {"oncosuite_id", "cohort_id"}

_COHORT_TRIAL_SQL = """
SELECT t.oncosuite_id, t.trial_phase, t.study_status, t.sponsor_name,
       t.enrollment_count, t.planned_enrollment_count,
       EXTRACT(YEAR FROM t.start_date)::int AS start_year,
       co.cohort_id, co.histology, co.sub_histology, co.organ, co.cancer_stage,
       co.biomarkers, co.biomarker_variant, co.line_of_therapy, co.sex,
       co.min_age, co.max_age
  FROM oncosuite_gold.cohort_info co
  JOIN oncosuite_gold.trial_info t ON t.oncosuite_id = co.oncosuite_id
 {scope}
"""

# Regimen/mechanism facts aggregated PER COHORT -- a cohort can have several
# arms, each with its own drug(s). `regimen` (drug NAMES combined with " + ")
# is intentionally kept as ONE label -- "Carboplatin + Paclitaxel" is a
# specific, meaningful combination in its own right (same semantics
# complex_insights.py's drug-combination analysis already relies on).
# comb_modality/drug_modality/moa_category/drug_target are different: a
# combination's constituent drugs can genuinely have different mechanisms/
# targets, so these are real MULTI-LABEL attributes, not one scalar --
# verified individual drug_info rows never contain a comma in these fields,
# so any comma seen after STRING_AGG is purely this aggregation combining
# several drugs, not pre-existing multi-valued data. Aggregated with a safe
# delimiter (not ", ", which several target names contain e.g. "Β-tubulin"
# combos) and split back into a list in Python -- same
# aggregate-then-explode pattern complex_insights.py uses for drug pairs.
_MULTI_DELIM = "|~|"

_COHORT_REGIMEN_SQL = """
SELECT a.cohort_id,
       STRING_AGG(DISTINCT d.name::text, ' + ' ORDER BY d.name::text) AS regimen,
       STRING_AGG(DISTINCT s.comb_modality::text, %(delim)s) AS comb_modality,
       AVG(s.regimen_complexity) AS regimen_complexity,
       STRING_AGG(DISTINCT d.modality::text, %(delim)s) AS drug_modality,
       STRING_AGG(DISTINCT d.moa_category::text, %(delim)s) AS moa_category,
       STRING_AGG(DISTINCT d.target::text, %(delim)s) AS drug_target
  FROM oncosuite_gold.arms_info a
  JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
 {scope}
 GROUP BY a.cohort_id
"""

_MULTI_LABEL_AGG_COLUMNS = ("comb_modality", "drug_modality", "moa_category", "drug_target")


def _split_multi(value):
    if not value:
        return None
    return value.split(_MULTI_DELIM)


def build_dataset(trial_ids=None):
    """One pandas DataFrame, one row per cohort, columns from trial_info +
    cohort_info + per-cohort regimen/mechanism aggregates. trial_ids=None
    means the whole database (cheap at current scale -- ~1,900 cohorts)."""
    if trial_ids:
        trial_scope = "WHERE t.oncosuite_id = ANY(%(ids)s)"
        cohort_scope = ("WHERE a.cohort_id IN (SELECT cohort_id FROM "
                         "oncosuite_gold.cohort_info WHERE oncosuite_id = ANY(%(ids)s))")
        params = {"ids": list(set(trial_ids)), "delim": _MULTI_DELIM}
    else:
        trial_scope = cohort_scope = ""
        params = {"delim": _MULTI_DELIM}

    main_rows = query(_COHORT_TRIAL_SQL.format(scope=trial_scope), params)
    regimen_rows = query(_COHORT_REGIMEN_SQL.format(scope=cohort_scope), params)
    regimen_by_cohort = {r["cohort_id"]: r for r in regimen_rows}

    records = []
    for r in main_rows:
        rec = dict(r)
        agg = regimen_by_cohort.get(r["cohort_id"], {})
        rec["regimen"] = agg.get("regimen")
        for col in _MULTI_LABEL_AGG_COLUMNS:
            rec[col] = _split_multi(agg.get(col))
        # Decimal -> float: psycopg2 returns AVG() as Decimal, which pandas/
        # numpy numeric ops don't handle as cleanly as a plain float.
        complexity = agg.get("regimen_complexity")
        rec["regimen_complexity"] = float(complexity) if complexity is not None else None
        records.append(rec)

    return pd.DataFrame.from_records(records)


def _is_list_valued(series):
    """True for jsonb-array columns (biomarkers, histology, ...) -- psycopg2
    already deserializes those into Python lists, so this is a dtype check
    on the actual values, not the SQL column type."""
    non_null = series.dropna()
    if non_null.empty:
        return False
    return non_null.map(lambda v: isinstance(v, list)).all()


def _numeric_summary(non_null):
    if non_null.empty:
        return None
    return {
        "min": float(non_null.min()),
        "median": float(non_null.median()),
        "max": float(non_null.max()),
    }


def profile_columns(df):
    """Classify every column into identifier / categorical / multi_label /
    numeric / unusable, with the reason stated whenever a column can't be
    used as-is for a cross-tab. Returns a list of dicts (JSON-shaped, so this
    can be logged, returned from an API, or fed straight to the next phase's
    candidate generator)."""
    n_rows = len(df)
    out = []

    for col in df.columns:
        series = df[col]
        missing_pct = round(100 * series.isna().mean(), 1) if n_rows else 0.0
        non_null = series.dropna()

        if col in _IDENTIFIER_COLUMNS:
            out.append({
                "column": col, "kind": "identifier", "usable": False,
                "missing_pct": missing_pct,
                "reason": "identifier column -- excluded from analysis",
            })
            continue

        if _is_list_valued(series):
            exploded = non_null.explode().dropna()
            distinct = int(exploded.nunique())
            coverage_pct = round(100 * len(non_null) / n_rows, 1) if n_rows else 0.0
            usable = (distinct >= 2 and distinct <= _MAX_CATEGORICAL_CARDINALITY
                      and coverage_pct >= _MIN_MULTI_LABEL_COVERAGE_PCT)
            reason = None
            if distinct > _MAX_CATEGORICAL_CARDINALITY:
                reason = (f"{distinct} distinct tag values -- needs top-N/min-n "
                          "filtering before use as a pivot axis")
            elif distinct < 2:
                reason = "constant or empty -- no variation to analyze"
            elif coverage_pct < _MIN_MULTI_LABEL_COVERAGE_PCT:
                reason = f"only {coverage_pct}% of rows carry any tag -- too sparse"
            out.append({
                "column": col, "kind": "multi_label", "usable": usable,
                "distinct_values": distinct, "missing_pct": missing_pct,
                "reason": reason,
                "top_values": exploded.value_counts().head(10).to_dict(),
                "note": "multi-label -- a row can carry more than one value; "
                        "any share/enrichment must be computed over tag-"
                        "instances, not distinct rows",
            })
            continue

        if pd.api.types.is_numeric_dtype(series):
            coverage_pct = round(100 - missing_pct, 1)
            usable = coverage_pct >= _MIN_NUMERIC_COVERAGE_PCT
            reason = None if usable else (
                f"only {coverage_pct}% populated -- too sparse to trust in a "
                "cross-tab or comparison"
            )
            out.append({
                "column": col, "kind": "numeric", "usable": usable,
                "missing_pct": missing_pct, "reason": reason,
                "summary": _numeric_summary(non_null),
            })
            continue

        # Plain single-valued categorical (text/object dtype).
        distinct = int(non_null.nunique())
        usable = 2 <= distinct <= _MAX_CATEGORICAL_CARDINALITY
        reason = None
        if distinct > _MAX_CATEGORICAL_CARDINALITY:
            reason = (f"{distinct} distinct values -- high-cardinality, needs "
                      "top-N/min-n filtering before use as a pivot axis")
        elif distinct < 2:
            reason = "constant or empty -- no variation to analyze"
        out.append({
            "column": col, "kind": "categorical", "usable": usable,
            "distinct_values": distinct, "missing_pct": missing_pct,
            "reason": reason,
            "top_values": non_null.value_counts().head(10).to_dict(),
        })

    return out


# Lightweight module-level cache for the unscoped (whole-database) dataset --
# same convention tools/search_cohorts.py already uses for its vocabulary
# cache, not new infrastructure. A trial_ids-scoped call always builds fresh
# (cheap at this scale, and correctness matters more than caching a subset
# that changes with every different query).
_FULL_CACHE = {"df": None, "profile": None, "built_at": 0.0}
_FULL_CACHE_TTL_S = 900  # 15 minutes -- the DB is not updated in real time


def get_dataset_and_profile(trial_ids=None):
    """(DataFrame, profile) for the given scope. Caches only the unscoped
    (full-database) case."""
    if trial_ids:
        df = build_dataset(trial_ids)
        return df, profile_columns(df)

    now = time.time()
    if _FULL_CACHE["df"] is not None and (now - _FULL_CACHE["built_at"]) < _FULL_CACHE_TTL_S:
        return _FULL_CACHE["df"], _FULL_CACHE["profile"]

    df = build_dataset(None)
    profile = profile_columns(df)
    _FULL_CACHE.update(df=df, profile=profile, built_at=now)
    return df, profile
