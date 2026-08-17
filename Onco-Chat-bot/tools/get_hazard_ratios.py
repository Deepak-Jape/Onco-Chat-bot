"""
Piece 1, Tool 4 -- get_hazard_ratios
Real-schema note: hazard_ratio_info has NO main_arm_id/compared_arm_id FKs, unlike
the original doc assumed. arm_comparison is unstructured text (e.g. "Alectinib vs
Crizotinib"). There's nothing to resolve via join, so this tool returns the label
as-is rather than pretending to have structured arm IDs.
"""
from db import query

def get_hazard_ratios(oncosuite_id: str, endpoint_id: int = None):
    where = ["e.oncosuite_id = %(id)s"]
    params = {"id": oncosuite_id}
    if endpoint_id:
        where.append("hr.endpoint_id = %(eid)s")
        params["eid"] = endpoint_id

    rows = query(
        f"""
        SELECT hr.hr_id, hr.endpoint_id, e.endpoint_name, e.endpoint_abbreviation,
               hr.arm_comparison, hr.hr_value_and_range, hr.hr_ci, hr.p_value
        FROM oncosuite_gold.hazard_ratio_info hr
        JOIN oncosuite_gold.study_endpoints_info e ON e.endpoint_id = hr.endpoint_id
        WHERE {' AND '.join(where)}
        """,
        params,
    )
    for r in rows:
        r["_note"] = "arm_comparison is free text, not resolved against arm_id -- see reconciliation notes"
    return {"oncosuite_id": oncosuite_id, "hazard_ratios": rows}
