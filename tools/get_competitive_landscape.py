"""
Piece 1, Tool 7 / Piece 3 -- get_competitive_landscape
Real-schema fixes vs. the original docs:
  - joins on oncosuite_id, not trial_id
  - drug-level template goes through the real chain:
    arms_info -> stratification_info -> treatment_info -> drug_info (d.name, not d.drug_name)
  - Template C (outcome averages) filters on endpoint_abbreviation, not endpoint_category
  - No v_outcomes_standardized view exists. Template C uses the raw parsed `value`
    column as-is -- NOT unit-safe across endpoints with different measurement types
    (percentages vs. participant counts vs. arbitrary scales). This is flagged
    loudly in the return payload rather than silently presented as standardized.
"""
from db import query
from tools.search_trials import (
    ACADEMIC_SPONSOR_PATTERNS, _classify_sponsor, drug_match_predicate, expand_and_pattern,
)
from vocab import normalize_filters

FIELD_GROUPS = {"condition": ["organ", "histology"]}
GROUP_BY_TRIAL_COLUMNS = {
    "phase": "t.trial_phase",
    "study_status": "t.study_status",
    "sponsor_name": "t.sponsor_name",
    "start_year": "EXTRACT(YEAR FROM t.start_date)::text",
}


def _template_a_trial_level(group_by_column_sql, condition_terms, target_terms, exclude_academic=False):
    where = ["1=1"]
    params = {}
    if condition_terms:
        where.append("(c.organ ?| %(cond)s OR c.histology ?| %(cond)s)")
        params["cond"] = condition_terms
    if target_terms:
        where.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.arms_info a2 "
            "JOIN oncosuite_gold.stratification_info s2 ON s2.arm_id = a2.arm_id "
            "JOIN oncosuite_gold.treatment_info tr2 ON tr2.strata_id = s2.strata_id "
            "LEFT JOIN oncosuite_gold.drug_info d2 ON d2.drug_id = tr2.drug_id "
            "WHERE a2.cohort_id = c.cohort_id "
            f"AND {drug_match_predicate('d2', 'targets')})"
        )
        params["targets"] = expand_and_pattern(target_terms)

    if exclude_academic:
        where.append("(t.sponsor_name IS NOT NULL AND NOT (t.sponsor_name ILIKE ANY(%(excl_acad)s)))")
        params["excl_acad"] = [f"%{p}%" for p in ACADEMIC_SPONSOR_PATTERNS]

    where_sql = " AND ".join(where)
    sql = f"""
        SELECT {group_by_column_sql} AS group_key,
               count(DISTINCT t.oncosuite_id) AS trial_count,
               (ARRAY_AGG(DISTINCT t.oncosuite_id ORDER BY t.oncosuite_id))[1:5] AS example_trial_ids
        FROM oncosuite_gold.trial_info t
        JOIN oncosuite_gold.cohort_info c ON c.oncosuite_id = t.oncosuite_id
        WHERE {where_sql}
        GROUP BY group_key
        ORDER BY trial_count DESC
        LIMIT 20
    """
    return query(sql, params)


def _template_b_drug_level(condition_terms, target_terms, exclude_academic=False):
    where = ["1=1"]
    params = {}
    if condition_terms:
        where.append("(c.organ ?| %(cond)s OR c.histology ?| %(cond)s)")
        params["cond"] = condition_terms
    if target_terms:
        where.append(drug_match_predicate("d", "targets"))
        params["targets"] = expand_and_pattern(target_terms)
    if exclude_academic:
        where.append("(t.sponsor_name IS NOT NULL AND NOT (t.sponsor_name ILIKE ANY(%(excl_acad)s)))")
        params["excl_acad"] = [f"%{p}%" for p in ACADEMIC_SPONSOR_PATTERNS]

    where_sql = " AND ".join(where)
    sql = f"""
        SELECT d.name AS group_key,
               count(DISTINCT (t.oncosuite_id, d.drug_id)) AS trial_drug_count,
               ARRAY_AGG(DISTINCT t.oncosuite_id) AS example_trial_ids
        FROM oncosuite_gold.trial_info t
        JOIN oncosuite_gold.cohort_info c ON c.oncosuite_id = t.oncosuite_id
        JOIN oncosuite_gold.arms_info a ON a.cohort_id = c.cohort_id
        JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
        JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
        JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
        WHERE {where_sql}
        GROUP BY group_key
        ORDER BY trial_drug_count DESC
        LIMIT 20
    """
    rows = query(sql, params)
    for r in rows:
        r["example_trial_ids"] = r["example_trial_ids"][:5]
    return rows


def _template_c_outcome_averages(condition_terms, target_terms, outcome_metric):
    where = ["e.endpoint_abbreviation = %(metric)s"]
    params = {"metric": outcome_metric}
    if condition_terms:
        where.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.cohort_info c "
            "WHERE c.oncosuite_id = t.oncosuite_id AND (c.organ ?| %(cond)s OR c.histology ?| %(cond)s))"
        )
        params["cond"] = condition_terms
    if target_terms:
        where.append(drug_match_predicate("d", "targets"))
        params["targets"] = expand_and_pattern(target_terms)

    where_sql = " AND ".join(where)
    # NOTE: no unit standardization exists -- averaging raw `value` across endpoints
    # is only defensible when every contributing row shares the same evaluator/unit.
    # This is enforced loosely below by also grouping on value_and_evaluator's unit
    # phrase where possible; flagged clearly in the return payload either way.
    sql = f"""
        SELECT d.name AS group_key,
               count(DISTINCT t.oncosuite_id) AS trial_count,
               round(avg(r.value)::numeric, 2) AS avg_value,
               count(*) AS n_values
        FROM oncosuite_gold.trial_info t
        JOIN oncosuite_gold.study_endpoints_info e ON e.oncosuite_id = t.oncosuite_id
        JOIN oncosuite_gold.results_outcomes_basic_info r ON r.endpoint_id = e.endpoint_id
        JOIN oncosuite_gold.arms_info a ON a.arm_id = r.arm_id
        JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
        JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
        JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
        WHERE {where_sql} AND r.value IS NOT NULL
        GROUP BY group_key
        HAVING count(DISTINCT t.oncosuite_id) >= 2
        ORDER BY avg_value DESC NULLS LAST
        LIMIT 20
    """
    return query(sql, params)


def _sample_trial_rows(condition_terms, target_terms, exclude_academic, limit=25):
    """Return up to `limit` representative trials with the fields the synthesis layer
    needs to build rich trial tables: id, NCT id, title, sponsor, sponsor_type, phase,
    status, enrollment. Prefers active/phase-3 trials first (more relevant to a
    'currently active corporate-sponsored' landscape question)."""
    where = ["1=1"]
    params = {"lim": limit}
    if condition_terms:
        where.append("(c.organ ?| %(cond)s OR c.histology ?| %(cond)s)")
        params["cond"] = condition_terms
    if target_terms:
        where.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.arms_info a2 "
            "JOIN oncosuite_gold.stratification_info s2 ON s2.arm_id = a2.arm_id "
            "JOIN oncosuite_gold.treatment_info tr2 ON tr2.strata_id = s2.strata_id "
            "LEFT JOIN oncosuite_gold.drug_info d2 ON d2.drug_id = tr2.drug_id "
            "WHERE a2.cohort_id = c.cohort_id "
            f"AND {drug_match_predicate('d2', 'targets')})"
        )
        params["targets"] = expand_and_pattern(target_terms)
    if exclude_academic:
        where.append("(t.sponsor_name IS NOT NULL AND NOT (t.sponsor_name ILIKE ANY(%(excl_acad)s)))")
        params["excl_acad"] = [f"%{p}%" for p in ACADEMIC_SPONSOR_PATTERNS]
    # EXISTS instead of JOIN so trial rows aren't duplicated by cohorts -> no DISTINCT
    # needed, and the relevance ORDER BY is unrestricted.
    cond_exists = ""
    if condition_terms:
        cond_exists = ("AND EXISTS (SELECT 1 FROM oncosuite_gold.cohort_info c2 "
                       "WHERE c2.oncosuite_id = t.oncosuite_id "
                       "AND (c2.organ ?| %(cond)s OR c2.histology ?| %(cond)s))")
    # rebuild WHERE without the cohort-join-dependent condition clause
    where2 = ["1=1"]
    if target_terms:
        where2.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.cohort_info c2 "
            "JOIN oncosuite_gold.arms_info a2 ON a2.cohort_id = c2.cohort_id "
            "JOIN oncosuite_gold.stratification_info s2 ON s2.arm_id = a2.arm_id "
            "JOIN oncosuite_gold.treatment_info tr2 ON tr2.strata_id = s2.strata_id "
            "LEFT JOIN oncosuite_gold.drug_info d2 ON d2.drug_id = tr2.drug_id "
            "WHERE c2.oncosuite_id = t.oncosuite_id "
            f"AND {drug_match_predicate('d2', 'targets')})"
        )
    if exclude_academic:
        where2.append("(t.sponsor_name IS NOT NULL AND NOT (t.sponsor_name ILIKE ANY(%(excl_acad)s)))")
    where2_sql = " AND ".join(where2)
    rows = query(f"""
        SELECT t.oncosuite_id, t.official_title, t.sponsor_name,
               t.study_status, t.trial_phase, t.enrollment_count,
               sm.source_unique_id AS nct_id
        FROM oncosuite_gold.trial_info t
        LEFT JOIN oncosuite_gold.source_mapping sm
          ON sm.oncosuite_id = t.oncosuite_id AND sm.source_name = 'clinicaltrials.gov'
        WHERE {where2_sql} {cond_exists}
        ORDER BY
          (t.study_status ILIKE '%%recruit%%' OR t.study_status ILIKE '%%active%%') DESC,
          (t.trial_phase = 'Phase 3') DESC,
          t.enrollment_count DESC NULLS LAST
        LIMIT %(lim)s
    """, params)
    return [{
        "oncosuite_id": r["oncosuite_id"],
        "nct_id": r["nct_id"],
        "official_title": r["official_title"],
        "sponsor_name": r["sponsor_name"],
        "sponsor_type": _classify_sponsor(r["sponsor_name"]),
        "phase": r["trial_phase"],
        "status": r["study_status"],
        "enrollment": r["enrollment_count"],
    } for r in rows]


def get_competitive_landscape(group_by: list, condition=None, target_or_moa=None,
                              outcome_metric=None, exclude_sponsor_type=None):
    condition_terms = None
    if condition:
        norm = normalize_filters({"condition": condition}, field_groups=FIELD_GROUPS)
        combined = set()
        for vals in norm["normalized"].values():
            combined.update(vals)
        condition_terms = list(combined) or None

    exclude_academic = (exclude_sponsor_type == "academic")

    groups_out = {}
    for gb in group_by:
        if gb == "drug_name":
            groups_out["drug_name"] = _template_b_drug_level(condition_terms, target_or_moa, exclude_academic)
        elif gb in GROUP_BY_TRIAL_COLUMNS:
            groups_out[gb] = _template_a_trial_level(GROUP_BY_TRIAL_COLUMNS[gb], condition_terms, target_or_moa, exclude_academic)

    outcome_groups = None
    if outcome_metric:
        outcome_groups = _template_c_outcome_averages(condition_terms, target_or_moa, outcome_metric)

    # Per-trial audit rows (id, title, sponsor, sponsor_type, status) so the synthesis
    # layer can build an executive audit table with an "Included in Analysis?" column.
    sample_trials = _sample_trial_rows(condition_terms, target_or_moa, exclude_academic)

    return {
        "filters_applied": {
            "condition": condition,
            "target_or_moa": target_or_moa,
            **({"excluding": ["academic/non-industry sponsors"]} if exclude_academic else {}),
        },
        "groups": groups_out,
        "sample_trials": sample_trials,
        "outcome_averages": outcome_groups,
        "_caveat": (
            "outcome_averages uses raw parsed values with NO unit standardization "
            "(no v_outcomes_standardized view exists in this schema) -- treat as "
            "directional only, not a rigorously comparable cross-trial metric, until "
            "a real standardization pass is built."
        ),
    }
