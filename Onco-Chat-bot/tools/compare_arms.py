"""
Piece 1, Tool 6 -- compare_arms
Composite tool: internally reuses get_endpoints_and_outcomes and get_adverse_events
logic, scoped to a specific set of arm_ids, plus hazard ratios for the trial
(hazard_ratio_info has no arm_id FK, so all trial-level HRs are included rather
than filtered to the requested arms -- see get_hazard_ratios note).
"""
from db import query
from tools.get_hazard_ratios import get_hazard_ratios

def compare_arms(oncosuite_id: str, arm_ids: list):
    arms = query(
        "SELECT arm_id, arm_name, arm_type, arm_status FROM oncosuite_gold.arms_info "
        "WHERE arm_id = ANY(%(arm_ids)s)",
        {"arm_ids": arm_ids},
    )

    endpoints = query(
        """
        SELECT e.endpoint_id, e.endpoint_name, e.endpoint_abbreviation,
               r.arm_id, r.value_and_evaluator, r.value
        FROM oncosuite_gold.study_endpoints_info e
        JOIN oncosuite_gold.results_outcomes_basic_info r ON r.endpoint_id = e.endpoint_id
        WHERE e.oncosuite_id = %(id)s AND r.arm_id = ANY(%(arm_ids)s)
        ORDER BY e.endpoint_abbreviation
        """,
        {"id": oncosuite_id, "arm_ids": arm_ids},
    )

    adverse_events = query(
        """
        SELECT ae.arm_id, ae.name_and_organ, ae.all_grades, ae.grade_3_4
        FROM oncosuite_gold.adverse_events ae
        WHERE ae.arm_id = ANY(%(arm_ids)s)
        ORDER BY ae.grade_3_4 DESC NULLS LAST
        """,
        {"arm_ids": arm_ids},
    )

    hr_result = get_hazard_ratios(oncosuite_id)

    return {
        "oncosuite_id": oncosuite_id,
        "arms": arms,
        "endpoints_by_arm": endpoints,
        "adverse_events_by_arm": adverse_events,
        "hazard_ratios": hr_result["hazard_ratios"],
        "_note": hr_result.get("hazard_ratios") and hr_result["hazard_ratios"][0].get("_note"),
    }
