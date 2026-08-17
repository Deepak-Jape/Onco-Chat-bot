"""
Piece 2 -- vocabulary normalization, implemented against real vocab_terms.
Three cascading passes: exact match -> alias match -> fuzzy fallback.

FIX (found during Phase 1 testing): pg_trgm similarity is too strict for short
canonical values (gene-symbol-style biomarkers like "KRAS", 4-5 chars) -- a
one-letter typo scores ~0.11, well under any reasonable threshold, because a
4-char string only yields 2 trigrams total. Fix: for canonical values under
LEVENSHTEIN_LEN_CUTOFF characters, use edit distance (fuzzystrmatch) instead
of trigram similarity. Longer free-text values (histology_variant, prior_therapy
phrases) still use trigram, which handles word-level rearrangement better.

Never silently drops a term: unmatched terms are returned separately so the
caller (router) can ask the user to disambiguate instead of reporting a
possibly-wrong zero-result answer.
"""
from db import query

LEVENSHTEIN_LEN_CUTOFF = 6      # canonical values shorter than this use edit distance
LEVENSHTEIN_MAX_DISTANCE = 2    # allow up to 2-character edits for short codes
TRIGRAM_THRESHOLD = 0.35        # similarity threshold for longer free-text values


def normalize_term(field_name: str, term: str):
    """Return the canonical value for one term, or None if nothing matched confidently."""
    rows = query(
        "SELECT canonical_value FROM oncosuite_gold.vocab_terms "
        "WHERE field_name = %(field)s AND lower(canonical_value) = lower(%(term)s)",
        {"field": field_name, "term": term},
    )
    if rows:
        return {"canonical_value": rows[0]["canonical_value"], "match_type": "exact"}

    rows = query(
        "SELECT canonical_value FROM oncosuite_gold.vocab_terms "
        "WHERE field_name = %(field)s AND %(term)s = ANY(aliases)",
        {"field": field_name, "term": term},
    )
    if rows:
        return {"canonical_value": rows[0]["canonical_value"], "match_type": "alias"}

    rows = query(
        "SELECT canonical_value, levenshtein(lower(canonical_value), lower(%(term)s)) AS dist "
        "FROM oncosuite_gold.vocab_terms "
        "WHERE field_name = %(field)s AND length(canonical_value) < %(cutoff)s "
        "ORDER BY dist ASC LIMIT 3",
        {"field": field_name, "term": term, "cutoff": LEVENSHTEIN_LEN_CUTOFF},
    )
    if rows and rows[0]["dist"] <= LEVENSHTEIN_MAX_DISTANCE:
        return {
            "canonical_value": rows[0]["canonical_value"],
            "match_type": "fuzzy_edit_distance",
            "distance": rows[0]["dist"],
            "alternate_candidates": [r["canonical_value"] for r in rows[1:] if r["dist"] <= LEVENSHTEIN_MAX_DISTANCE],
        }

    rows = query(
        "SELECT canonical_value, similarity(canonical_value, %(term)s) AS sim "
        "FROM oncosuite_gold.vocab_terms "
        "WHERE field_name = %(field)s AND length(canonical_value) >= %(cutoff)s "
        "AND similarity(canonical_value, %(term)s) > %(threshold)s "
        "ORDER BY sim DESC LIMIT 3",
        {"field": field_name, "term": term, "cutoff": LEVENSHTEIN_LEN_CUTOFF, "threshold": TRIGRAM_THRESHOLD},
    )
    if rows:
        return {
            "canonical_value": rows[0]["canonical_value"],
            "match_type": "fuzzy_trigram",
            "similarity": float(rows[0]["sim"]),
            "alternate_candidates": [r["canonical_value"] for r in rows[1:]],
        }
    return None


def normalize_field_group(field_names: list, term: str):
    """
    FIX (found during Phase 1 testing): when a user-facing concept like 'condition'
    maps to multiple underlying fields (organ OR histology), a term should only be
    reported as unmatched if it fails under EVERY field in the group.
    Returns {field_name: canonical_value} for every field where it matched, or None.
    """
    matches = {}
    for field_name in field_names:
        m = normalize_term(field_name, term)
        if m:
            matches[field_name] = m["canonical_value"]
    return matches or None


def normalize_filters(filters: dict, field_groups: dict = None):
    """
    filters: {group_name: [term, term, ...]}
    field_groups: {group_name: [underlying_field_name, ...]}
    Returns: {normalized: {field_name: [canonical_value, ...]}, unmatched_terms: [{group, term}]}
    """
    field_groups = field_groups or {}
    normalized = {}
    unmatched = []
    for group_name, terms in filters.items():
        if not terms:
            continue
        target_fields = field_groups.get(group_name, [group_name])
        for term in terms:
            field_matches = normalize_field_group(target_fields, term)
            if field_matches:
                for field_name, canon in field_matches.items():
                    normalized.setdefault(field_name, [])
                    if canon not in normalized[field_name]:
                        normalized[field_name].append(canon)
            else:
                unmatched.append({"group": group_name, "term": term})
    return {"normalized": normalized, "unmatched_terms": unmatched}
