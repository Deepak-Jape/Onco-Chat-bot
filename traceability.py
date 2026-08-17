"""Field-level source traceability, for two Excel presentations:
  1. A short plain-text comment/note on the cell (format_comment) -- unchanged
     from the original implementation.
  2. A full "Source Evidence" sheet row (to_evidence_records) -- the fuller
     excerpt/reasoning/confidence/method/link, for a click-through from the
     data cell rather than a cramped hover popup. See excel_export.py.

Both are built from the SAME oncosuite_gold.data_traceability rows -- the
same table tools/get_trial_sources.py and citations.py already read -- so
there is one canonical source of "why was this value assigned" regardless of
which of the two views a caller wants. Callers fetch the raw rows ONCE
(raw_trace_by_oncosuite_id / raw_trace_by_record_id) and derive both views
locally, rather than querying twice.

NOTE on highlighting: data_traceability's source_text/source_snippet/
reasoning are plain, unmarked text -- no highlight-position data (which
words/phrases were "the reason") exists anywhere in this table today. Sampled
directly to confirm: no HTML, no markdown, no bracket/mark conventions, just
raw copied excerpts. If/when that becomes available upstream, feed it into
to_evidence_records() so the Excel side reuses it rather than re-deriving its
own guess at what to bold.
"""

from db import query

# How many source rows to fold into one comment when a field has more than
# one -- Excel comments are meant to be skimmed, not read as a document. Rows
# are already ordered by confidence DESC, so 1 means "the best-supported
# source"; ties (the common case: multiple extraction passes agreeing on the
# same value) would otherwise just repeat the same fact two or three times.
_MAX_SOURCES_PER_COMMENT = 1

# The evidence sheet has room to be more thorough than a hover comment, but
# still caps per cell so one noisy field can't blow the sheet up.
_MAX_SOURCES_PER_EVIDENCE_CELL = 3

_TRACE_COLUMNS = (
    "source_text, reasoning, confidence_score, extraction_method, "
    "source_type, source_name, source_link"
)


def format_comment(rows):
    """One or more data_traceability rows -> a short multi-line comment body.
    Returns None for an empty list so callers can skip attaching a comment
    rather than attaching an empty one."""
    if not rows:
        return None

    sections = []
    for r in rows[:_MAX_SOURCES_PER_COMMENT]:
        lines = []
        if r.get("source_text"):
            lines.append(f"Extracted value: {r['source_text']}")
        if r.get("reasoning"):
            lines.append(f"Reasoning: {r['reasoning']}")
        conf = r.get("confidence_score")
        if conf is not None:
            lines.append(f"Confidence: {round(float(conf) * 100)}%")
        if r.get("extraction_method"):
            lines.append(f"Method: {r['extraction_method']}")
        source_bits = [b for b in (r.get("source_type"), r.get("source_name")) if b]
        if source_bits:
            lines.append(f"Source: {' / '.join(source_bits)}")
        if r.get("source_link"):
            lines.append(f"Link: {r['source_link']}")
        if lines:
            sections.append("\n".join(lines))

    if not sections:
        return None
    return "\n\n".join(sections)


# The ONLY extraction method whose reasoning is genuinely content-specific --
# confirmed against the live data: 'Clinical Trials' and 'Rule Based (SQL)'
# rows ALWAYS carry generic, canned reasoning text ("Direct extraction from
# CT.gov study", "This fields comes from the historical records of the
# trial") repeated identically across the entire database, because they're
# a straight structured-field copy -- the extracted value IS the evidence,
# there is no excerpt to show beyond it. Also confirmed source_snippet ==
# source_text for 100% of ALL 1,046,403 rows regardless of method, so that
# pair can never be used to detect "is there more detail here" -- method is
# the only real signal. 'LLM based' rows are where a value was actually
# interpreted from unstructured prose (eligibility criteria, descriptions),
# which is the only case where clicking through to a fuller excerpt teaches
# the reader something a comment's one-line summary didn't already say.
_INTERPRETIVE_METHOD = "llm based"


def to_evidence_records(rows, field_label=None):
    """One or more data_traceability rows -> clean dicts for a Source
    Evidence sheet row each (excel_export.py owns the actual cell/hyperlink
    layout). Unlike format_comment, this isn't capped to the single best
    source -- the evidence sheet has room to show corroborating extractions,
    up to _MAX_SOURCES_PER_EVIDENCE_CELL.

    Deliberately NOT one row per trace record: only rows whose extraction
    required real interpretation are promoted here (see _INTERPRETIVE_METHOD
    above) -- a direct/rule-based field (Phase, Status, N, dates, ...) gets
    NO evidence-sheet entry and NO hyperlink at all, since there is nothing
    to show beyond what its comment already says. Returning [] here is what
    tells the caller "don't hyperlink this cell."

    Deduplicated by CONTENT, not trace_id: the source table can (and does --
    confirmed live, e.g. two identical 'Rule Based (SQL)' rows for the same
    trial's planned_enrollment_count under different trace_ids) carry more
    than one row with the exact same text/reasoning/method/link. Showing
    both is not "two sources agreeing", it's the same fact printed twice --
    reads as a bug, not corroboration."""
    if not rows:
        return []
    seen = set()
    out = []
    for r in rows:
        if (r.get("extraction_method") or "").strip().lower() != _INTERPRETIVE_METHOD:
            continue
        key = (r.get("source_text"), r.get("reasoning"),
               r.get("extraction_method"), r.get("source_link"))
        if key in seen:
            continue
        seen.add(key)
        conf = r.get("confidence_score")
        out.append({
            "field_label": field_label,
            "extracted_value": r.get("source_text"),
            "full_evidence": r.get("source_snippet") or r.get("source_text"),
            "reasoning": r.get("reasoning"),
            "confidence_pct": round(float(conf) * 100) if conf is not None else None,
            "extraction_method": r.get("extraction_method"),
            "source_type": r.get("source_type"),
            "source_name": r.get("source_name"),
            "source_link": r.get("source_link"),
        })
        if len(out) >= _MAX_SOURCES_PER_EVIDENCE_CELL:
            break
    return out


def fetch_one(oncosuite_id, table_name, field_name, record_id=None):
    """Formatted comment text for one field on one row, or None when the
    database holds no traceability for it (e.g. a derived/computed column)."""
    if record_id is None:
        rows = query(
            f"SELECT {_TRACE_COLUMNS} FROM oncosuite_gold.data_traceability "
            "WHERE oncosuite_id = %(id)s AND table_name = %(table)s "
            "AND record_id IS NULL AND field_name = %(field)s "
            "ORDER BY confidence_score DESC",
            {"id": oncosuite_id, "table": table_name, "field": field_name},
        )
    else:
        rows = query(
            f"SELECT {_TRACE_COLUMNS} FROM oncosuite_gold.data_traceability "
            "WHERE oncosuite_id = %(id)s AND table_name = %(table)s "
            "AND record_id = %(rid)s AND field_name = %(field)s "
            "ORDER BY confidence_score DESC",
            {"id": oncosuite_id, "table": table_name, "rid": record_id, "field": field_name},
        )
    return format_comment(rows)


def raw_trace_by_oncosuite_id(oncosuite_ids, table_name, field_names):
    """For table-level fields (record_id IS NULL, e.g. trial_info's own
    columns -- trial_info has no integer PK, only oncosuite_id). One query
    for every (id, field) combination needed. Returns
    {(oncosuite_id, field_name): [raw_row, ...]} sorted by confidence DESC --
    feed a group into format_comment() and/or to_evidence_records()."""
    if not oncosuite_ids or not field_names:
        return {}
    rows = query(
        f"SELECT oncosuite_id, field_name, {_TRACE_COLUMNS} "
        "FROM oncosuite_gold.data_traceability "
        "WHERE table_name = %(table)s AND record_id IS NULL "
        "AND oncosuite_id = ANY(%(ids)s) AND field_name = ANY(%(fields)s) "
        "ORDER BY confidence_score DESC",
        {"table": table_name, "ids": list(set(oncosuite_ids)), "fields": list(field_names)},
    )
    grouped = {}
    for r in rows:
        grouped.setdefault((r["oncosuite_id"], r["field_name"]), []).append(r)
    return grouped


def raw_trace_by_record_id(record_ids, table_name, field_names):
    """For row-level fields keyed by the target table's own integer PK (e.g.
    cohort_info.cohort_id, arms_info.arm_id). Returns
    {(record_id, field_name): [raw_row, ...]} sorted by confidence DESC."""
    if not record_ids or not field_names:
        return {}
    rows = query(
        f"SELECT record_id, field_name, {_TRACE_COLUMNS} "
        "FROM oncosuite_gold.data_traceability "
        "WHERE table_name = %(table)s AND record_id = ANY(%(ids)s) "
        "AND field_name = ANY(%(fields)s) "
        "ORDER BY confidence_score DESC",
        {"table": table_name, "ids": list(set(record_ids)), "fields": list(field_names)},
    )
    grouped = {}
    for r in rows:
        grouped.setdefault((r["record_id"], r["field_name"]), []).append(r)
    return grouped


# Thin convenience wrappers kept for callers that only need the comment text
# (not the fuller evidence-sheet records) -- same one query either way.
def batch_fetch_by_oncosuite_id(oncosuite_ids, table_name, field_names):
    grouped = raw_trace_by_oncosuite_id(oncosuite_ids, table_name, field_names)
    return {k: format_comment(v) for k, v in grouped.items()}


def batch_fetch_by_record_id(record_ids, table_name, field_names):
    grouped = raw_trace_by_record_id(record_ids, table_name, field_names)
    return {k: format_comment(v) for k, v in grouped.items()}
