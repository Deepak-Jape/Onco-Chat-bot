"""
Piece 1, Tool 3 -- get_endpoints_and_outcomes
Real-schema fixes vs. the original doc:
  - ORR/PFS/OS/etc live in endpoint_abbreviation, NOT endpoint_category
    (endpoint_category is a broad bucket: 'Efficacy-based', 'Survival-based', ...)
  - study_endpoints_info has NO arm_id -- endpoints are trial-level.
    Arm-level linkage only exists via results_outcomes_basic_info.arm_id.
  - No v_outcomes_standardized view exists. results_outcomes_basic_info only has a
    free-text value_and_evaluator plus a parsed numeric `value`, no unit column.
    Standardization is NOT implemented here -- flagged as open work; this tool
    returns the raw value + value_and_evaluator text as-is rather than pretending
    to have standardized units.
"""
from db import query

def get_endpoints_and_outcomes(oncosuite_id: str, arm_ids=None, endpoint_abbreviation=None):
    ep_where = ["e.oncosuite_id = %(id)s"]
    params = {"id": oncosuite_id}
    if endpoint_abbreviation:
        ep_where.append("e.endpoint_abbreviation = ANY(%(abbrs)s)")
        params["abbrs"] = endpoint_abbreviation

    endpoints = query(
        f"""
        SELECT endpoint_id, endpoint_name, endpoint_type, endpoint_category,
               endpoint_abbreviation, measurement_and_criteria, timing_and_evaluator
        FROM oncosuite_gold.study_endpoints_info e
        WHERE {' AND '.join(ep_where)}
        """,
        params,
    )

    for ep in endpoints:
        out_where = ["endpoint_id = %(eid)s"]
        out_params = {"eid": ep["endpoint_id"]}
        if arm_ids:
            out_where.append("arm_id = ANY(%(arm_ids)s)")
            out_params["arm_ids"] = arm_ids
        outcomes = query(
            f"""
            SELECT r.arm_id, a.arm_name, r.phase, r.endpoint_type,
                   r.value_and_evaluator, r.value
            FROM oncosuite_gold.results_outcomes_basic_info r
            LEFT JOIN oncosuite_gold.arms_info a ON a.arm_id = r.arm_id
            WHERE {' AND '.join(out_where)}
            """,
            out_params,
        )
        ep["outcomes"] = outcomes
        ep["_caveat"] = (
            "value is a best-effort parsed number from free-text value_and_evaluator; "
            "no standardized unit is available yet, so cross-trial numeric comparison "
            "is not yet safe -- see reconciliation notes on the missing v_outcomes_standardized view."
        )

    return {"oncosuite_id": oncosuite_id, "endpoints": endpoints}
