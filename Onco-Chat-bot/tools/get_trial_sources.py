"""
Piece 1, Tool 8 -- get_trial_sources
Tier-2 citation support: full snippet/reasoning/confidence, fetched on demand
(Piece 4). Straightforward single-table query against data_traceability.
"""
from db import query

def get_trial_sources(oncosuite_id: str, field_name: str = None):
    where = ["oncosuite_id = %(id)s"]
    params = {"id": oncosuite_id}
    if field_name:
        where.append("field_name = %(field)s")
        params["field"] = field_name

    rows = query(
        f"""
        SELECT table_name, record_id, field_name, source_name, source_type,
               source_snippet, reasoning, confidence_score, extraction_method, source_link
        FROM oncosuite_gold.data_traceability
        WHERE {' AND '.join(where)}
        ORDER BY confidence_score DESC
        """,
        params,
    )
    return {"oncosuite_id": oncosuite_id, "sources": rows}
