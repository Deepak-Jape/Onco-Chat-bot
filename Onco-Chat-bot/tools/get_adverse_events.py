"""
Piece 1, Tool 5 -- get_adverse_events
Real-schema addition: there's a separate `safety` table (deaths, withdrawals,
protocol violations) distinct from `adverse_events` (graded AEs). This tool
surfaces both, clearly labeled, rather than silently dropping `safety` --
that decision (one tool vs two) was flagged as open in the reconciliation
notes; exposing both here is the safer default until a product call is made.
"""
from db import query

def get_adverse_events(oncosuite_id: str, arm_id: int = None, min_grade_3_4_count: int = None):
    arm_where = ["a.cohort_id IN (SELECT cohort_id FROM oncosuite_gold.cohort_info WHERE oncosuite_id = %(id)s)"]
    params = {"id": oncosuite_id}
    if arm_id:
        arm_where.append("a.arm_id = %(arm_id)s")
        params["arm_id"] = arm_id

    ae_where = list(arm_where)
    if min_grade_3_4_count is not None:
        ae_where.append("ae.grade_3_4 >= %(min_g34)s")
        params["min_g34"] = min_grade_3_4_count

    adverse_events = query(
        f"""
        SELECT a.arm_id, a.arm_name, ae.name_and_organ, ae.all_grades, ae.grade_3_4
        FROM oncosuite_gold.adverse_events ae
        JOIN oncosuite_gold.arms_info a ON a.arm_id = ae.arm_id
        WHERE {' AND '.join(ae_where)}
        ORDER BY ae.grade_3_4 DESC NULLS LAST
        """,
        params,
    )

    safety_events = query(
        f"""
        SELECT a.arm_id, a.arm_name, s.safety_name, s.value
        FROM oncosuite_gold.safety s
        JOIN oncosuite_gold.arms_info a ON a.arm_id = s.arm_id
        WHERE {' AND '.join(arm_where)}
        """,
        params,
    )

    return {
        "oncosuite_id": oncosuite_id,
        "adverse_events": adverse_events,
        "safety_events": safety_events,
        "_note": "safety_events (deaths, withdrawals, protocol violations) is a separate table "
                 "not covered by the original tool design -- surfaced here rather than dropped.",
    }
