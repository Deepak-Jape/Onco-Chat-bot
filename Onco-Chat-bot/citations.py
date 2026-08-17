# """
# Piece 4 -- citation / traceability attachment
# Tier 1: cheap stub (confidence + source link), attached to every extracted field
# by default. Tier 2: full snippet, via tools.get_trial_sources.get_trial_sources,
# called on demand.

# Confidence thresholds below are informed by the real distribution pulled from
# data_traceability (Phase 0 finding): 'Clinical Trials' and 'Rule Based (SQL)'
# rows are always exactly 1.0; only 'LLM based' rows vary, and they're bimodal --
# ~74% at 1.0, ~16% clustered near 0. The 0.85/0.5 cutoffs below slice off that
# real low tail rather than being pure placeholders.
# """
# from db import query

# CONFIDENCE_HIGH = 0.85
# CONFIDENCE_LOW = 0.5


# def get_citation_stubs(oncosuite_id: str, table_name: str, record_id: int, field_names: list):
#     """Tier 1 -- cheap stub, no snippet text. Attach to every tool response by default."""
#     rows = query(
#         "SELECT field_name, confidence_score, source_link, extraction_method "
#         "FROM oncosuite_gold.data_traceability "
#         "WHERE oncosuite_id = %(id)s AND table_name = %(table)s AND record_id = %(rid)s "
#         "AND field_name = ANY(%(fields)s)",
#         {"id": oncosuite_id, "table": table_name, "rid": record_id, "fields": field_names},
#     )
#     return rows


# def hedge_language_for(confidence_score: float) -> str:
#     """
#     Returns the instruction tier the synthesis model should follow for a given
#     confidence score -- this is prompt-engineering guidance, not user-facing text.
#     """
#     if confidence_score is None:
#         return "no confidence score available -- treat as unverified, flag explicitly"
#     if confidence_score >= CONFIDENCE_HIGH:
#         return "state as fact, cite normally"
#     if confidence_score >= CONFIDENCE_LOW:
#         return "hedge explicitly (e.g. 'appears to...', 'extracted with moderate confidence')"
#     return "do not state as fact -- omit or flag explicitly as low-confidence, suggest checking the source link"


# def annotate_with_hedging(citation_stubs: list) -> list:
#     """Attach the hedging instruction to each stub so the synthesis model doesn't have
#     to look up thresholds itself -- keeps the system prompt simpler."""
#     for stub in citation_stubs:
#         stub["hedge_instruction"] = hedge_language_for(stub.get("confidence_score"))
#     return citation_stubs


"""
Piece 4 -- citation / traceability attachment
Tier 1: cheap stub (confidence + source link), attached to every extracted field
by default. Tier 2: full snippet, via tools.get_trial_sources.get_trial_sources,
called on demand.

Confidence thresholds below are informed by the real distribution pulled from
data_traceability (Phase 0 finding): 'Clinical Trials' and 'Rule Based (SQL)'
rows are always exactly 1.0; only 'LLM based' rows vary, and they're bimodal --
~74% at 1.0, ~16% clustered near 0. The 0.85/0.5 cutoffs below slice off that
real low tail rather than being pure placeholders.
"""
from db import query

CONFIDENCE_HIGH = 0.85
CONFIDENCE_LOW = 0.5


def get_citation_stubs(oncosuite_id: str, table_name: str, field_names: list, record_id: int = None):
    """
    Tier 1 -- cheap stub, no snippet text. Attach to every tool response by default.
    FIX: record_id is NULL for trial_info-level fields (trial_info's own key is
    oncosuite_id, not an integer PK) -- `record_id = %(rid)s` never matches those
    rows in SQL, since NULL is never equal to anything, even another NULL.
    Branch the query instead of silently returning nothing for trial-level fields.
    """
    if record_id is None:
        rows = query(
            "SELECT field_name, confidence_score, source_link, extraction_method "
            "FROM oncosuite_gold.data_traceability "
            "WHERE oncosuite_id = %(id)s AND table_name = %(table)s AND record_id IS NULL "
            "AND field_name = ANY(%(fields)s)",
            {"id": oncosuite_id, "table": table_name, "fields": field_names},
        )
    else:
        rows = query(
            "SELECT field_name, confidence_score, source_link, extraction_method "
            "FROM oncosuite_gold.data_traceability "
            "WHERE oncosuite_id = %(id)s AND table_name = %(table)s AND record_id = %(rid)s "
            "AND field_name = ANY(%(fields)s)",
            {"id": oncosuite_id, "table": table_name, "rid": record_id, "fields": field_names},
        )
    return rows


def hedge_language_for(confidence_score: float) -> str:
    """
    Returns the instruction tier the synthesis model should follow for a given
    confidence score -- this is prompt-engineering guidance, not user-facing text.
    """
    if confidence_score is None:
        return "no confidence score available -- treat as unverified, flag explicitly"
    if confidence_score >= CONFIDENCE_HIGH:
        return "state as fact, cite normally"
    if confidence_score >= CONFIDENCE_LOW:
        return "hedge explicitly (e.g. 'appears to...', 'extracted with moderate confidence')"
    return "do not state as fact -- omit or flag explicitly as low-confidence, suggest checking the source link"


def annotate_with_hedging(citation_stubs: list) -> list:
    """Attach the hedging instruction to each stub so the synthesis model doesn't have
    to look up thresholds itself -- keeps the system prompt simpler."""
    for stub in citation_stubs:
        stub["hedge_instruction"] = hedge_language_for(stub.get("confidence_score"))
    return citation_stubs