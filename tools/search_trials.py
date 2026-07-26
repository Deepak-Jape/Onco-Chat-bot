"""
Piece 1, Tool 1 -- search_trials.

NORMALIZATION (rewritten to mirror the Manticore normalization queries):
Instead of resolving each user term to a canonical vocab_terms row (which
silently failed on word-form / suffix mismatches -- e.g. "lung cancer" never
matched the stored value "Lungs" because exact/alias/levenshtein/trigram all
missed once the " cancer" suffix was attached), we now match each user term
DIRECTLY against the unnested jsonb array values, exactly the way the Manticore
query unnests them with jsonb_array_elements_text:

  - condition   -> organ  OR  (histology UNION sub_histology UNION histology_variant)
  - biomarkers  -> biomarkers UNION biomarker_variant
  - cancer_stage / line_of_therapy / prior_therapy -> their own unnested column

Matching per unnested value uses pg_trgm similarity() with a threshold, PLUS a
bidirectional substring guard so short/contained forms still hit even when the
trigram score is dragged down by filler words:
    val %sim% term  OR  val ILIKE %term%  OR  term ILIKE %val%
so "lung cancer" -> "Lungs" matches (substring 'lung' <-> 'lungs' + trigram),
and typos like "lng cancer" still catch via trigram.

Nothing is silently dropped: a term that matches zero rows in every target
column for its group is reported back in unmatched_terms so the router can ask
the user to disambiguate rather than returning a wrong zero-result answer.
"""
from db import query

# Trigram threshold for fuzzy matching against unnested values. Kept modest so
# multi-word user input ("lung cancer") still clears it against a single-word
# stored value ("Lungs") when combined with the substring guard below.
TRIGRAM_THRESHOLD = 0.3

# Each user-facing filter group -> the list of jsonb array columns on cohort_info
# whose UNNESTED text values it should be matched against. This is the same
# column grouping the Manticore query uses (histology folds in sub_histology and
# histology_variant; biomarkers folds in biomarker_variant).
FILTER_GROUP_COLUMNS = {
    "condition":       ["organ", "histology", "sub_histology", "histology_variant"],
    "biomarkers":      ["biomarkers", "biomarker_variant"],
    "cancer_stage":    ["cancer_stage"],
    "line_of_therapy": ["line_of_therapy"],
    "prior_therapy":   ["prior_therapy"],
}

# Synonym expansion for terms whose natural-language form is SEMANTICALLY (not
# textually) different from how the value is coded in the data -- pure string
# matching (trigram/substring) can never bridge these, so we expand the user's
# term into its known coded equivalents BEFORE matching. Keys and values are
# matched case-insensitively; each expansion is added as an ADDITIONAL term to
# try, the original is always kept too. Extend freely as you spot new phrasings.
SYNONYM_EXPANSIONS = {
    "first line":  ["1L"],
    "1st line":    ["1L"],
    "second line": ["2L", "2L+"],
    "2nd line":    ["2L", "2L+"],
    "third line":  ["3L", "3L+"],
    "3rd line":    ["3L", "3L+"],
    "relapsed":    ["Refractory/Relapsed"],
    "refractory":  ["Refractory/Relapsed"],
    # Drug-class shorthands. ONLY put terms here where the user's word does NOT
    # appear anywhere in the data. The real fix for class/modality queries is the
    # drug_name_or_target clause below now searching modality/class/moa_category
    # -- so "ADC", "bispecific", "checkpoint", "immunotherapy" already match
    # directly (the modality value is literally "Antibody-Drug Conjugate (ADC)")
    # and need NO synonym. Do not re-add those; they'd be redundant. Anything
    # phrased loosely that isn't in the data at all is caught by the semantic
    # vector-search fallback, so this table stays tiny by design.
    "tki":         ["kinase inhibitor"],          # data says "...Kinase Inhibitor", never "TKI"
    "tkis":        ["kinase inhibitor"],
    "car-t":       ["cell therapy"],              # data says "Cell Therapy" / "Adoptive Cell Immunotherapy"
    "car t":       ["cell therapy"],
}


def _expand_synonyms(term):
    """Return [term, *any coded equivalents]. Case-insensitive on the key.

    Also handles simple plurals generically so we don't have to list both forms:
    a trailing "s" is stripped and the singular is searched too (so "ADCs" finds
    the "ADC" in the data, "bispecifics" -> "bispecific", etc.) and the singular's
    synonyms are pulled in as well.
    """
    key = term.strip().lower()
    out = [term]
    singular = key[:-1] if len(key) > 3 and key.endswith("s") else None
    if singular and singular != key:
        out.append(singular)                       # search the singular form too
    out.extend(SYNONYM_EXPANSIONS.get(key, []))
    if singular:
        out.extend(SYNONYM_EXPANSIONS.get(singular, []))
    # de-dupe, preserve order
    seen, uniq = set(), []
    for x in out:
        if x.lower() not in seen:
            seen.add(x.lower()); uniq.append(x)
    return uniq


def _term_matches_any_column(term, columns):
    """
    True if `term` fuzzily matches at least one unnested array value in any of
    the given cohort_info jsonb columns, for at least one trial. Used only to
    decide whether a term is 'matched' (vs. reported as unmatched); the actual
    row filtering happens inline in the main query via _group_predicate().
    """
    union_parts = []
    for col in columns:
        union_parts.append(f"""
            SELECT val FROM oncosuite_gold.cohort_info ci
            CROSS JOIN LATERAL jsonb_array_elements_text(
                CASE WHEN jsonb_typeof(ci.{col}) = 'array' THEN ci.{col} ELSE '[]'::jsonb END
            ) AS e(val)
        """)
    union_sql = " UNION ALL ".join(union_parts)
    rows = query(
        f"""
        SELECT 1
        FROM ( {union_sql} ) vals(val)
        WHERE val IS NOT NULL
          AND ( similarity(val, %(term)s) >= %(thr)s
                OR val ILIKE %(like)s
                OR %(term)s ILIKE '%%' || val || '%%' )
        LIMIT 1
        """,
        {"term": term, "like": f"%{term}%", "thr": TRIGRAM_THRESHOLD},
    )
    return bool(rows)


def _group_predicate(columns, param_key):
    """
    Build a SQL WHERE fragment (bound to the outer trial `t`) that is TRUE when
    the trial has at least one cohort whose unnested values in any of `columns`
    fuzzily match ANY of the user's terms for this group. Terms are passed as a
    single text[] param (%(param_key)s) and matched with = ANY over the array.
    """
    exists_blocks = []
    for col in columns:
        exists_blocks.append(f"""
            EXISTS (
                SELECT 1
                FROM oncosuite_gold.cohort_info ci
                CROSS JOIN LATERAL jsonb_array_elements_text(
                    CASE WHEN jsonb_typeof(ci.{col}) = 'array' THEN ci.{col} ELSE '[]'::jsonb END
                ) AS e(val)
                CROSS JOIN LATERAL unnest(%({param_key})s::text[]) AS q(term)
                WHERE ci.oncosuite_id = t.oncosuite_id
                  AND val IS NOT NULL
                  AND (
                        similarity(val, q.term) >= {TRIGRAM_THRESHOLD}
                        OR val ILIKE '%%' || q.term || '%%'
                        OR q.term ILIKE '%%' || val || '%%'
                      )
            )
        """)
    return "(" + " OR ".join(exists_blocks) + ")"


# Name patterns that identify an ACADEMIC / non-industry sponsor. There is no clean
# sponsor-type column in trial_info, so we classify by the sponsor NAME -- universities,
# hospitals, institutes, cancer centers, cooperative groups and government bodies. This
# is a heuristic (not an authoritative field); callers should surface it as such.
ACADEMIC_SPONSOR_PATTERNS = [
    "univers", "college", "school of medicine", "hospital", "hôpital", "klinik", "clinic",
    "institut", "cancer center", "cancer centre", "medical center", "medical centre",
    "health system", "foundation", "national institute", "nih", "nci ", "ministry",
    "cooperative group", "academ", "faculty", "polyclinic", "clinique",
]


def _academic_exclusion_sql(param_key):
    """SQL fragment that is TRUE when the trial's sponsor name looks ACADEMIC (so the
    caller can negate it to EXCLUDE academia). Bound to a text[] of ILIKE patterns."""
    return f"(t.sponsor_name ILIKE ANY(%({param_key})s))"


def search_trials(condition=None, biomarkers=None, cancer_stage=None, line_of_therapy=None,
                   prior_therapy=None, drug_name_or_target=None, phase=None, study_status=None,
                   sponsor=None, exclude_sponsor_type=None, limit=50, offset=0):
    """
    exclude_sponsor_type: "academic" to strictly filter OUT university/hospital/institute/
    government sponsors (for queries like "not interested in academia"). Classification is
    heuristic, by sponsor name (no authoritative sponsor-type field exists in the schema).
    """
    raw_filters = {
        "condition": condition,
        "biomarkers": biomarkers,
        "cancer_stage": cancer_stage,
        "line_of_therapy": line_of_therapy,
        "prior_therapy": prior_therapy,
    }

    where_clauses = ["1=1"]
    params = {"limit": limit, "offset": offset}
    unmatched_terms = []
    filters_extracted = False

    for group, terms in raw_filters.items():
        if not terms:
            continue
        columns = FILTER_GROUP_COLUMNS[group]

        # Expand each user term into itself + any coded synonyms, then keep every
        # expansion that actually hits a value in the data. A user term counts as
        # matched if ANY of its expansions matched. This bridges semantic gaps
        # (e.g. "first line" -> "1L") that string matching alone cannot.
        matched = []
        for t in terms:
            hits = [e for e in _expand_synonyms(t) if _term_matches_any_column(e, columns)]
            if hits:
                matched.extend(hits)
            else:
                unmatched_terms.append({"group": group, "term": t})

        if matched:
            filters_extracted = True
            pkey = f"g_{group}"
            params[pkey] = matched
            where_clauses.append(_group_predicate(columns, pkey))
        else:
            # The user asked for a condition/biomarker/etc. that exists NOWHERE in
            # the data. Do NOT silently drop the clause -- that would run the query
            # unfiltered and return every trial as if they all matched. Force an
            # empty result and let the caller surface unmatched_terms for a
            # clarification prompt.
            filters_extracted = True
            where_clauses.append("FALSE")

    if phase:
        where_clauses.append("t.trial_phase = ANY(%(phase)s)")
        params["phase"] = phase
        filters_extracted = True
    if study_status:
        where_clauses.append("t.study_status = ANY(%(study_status)s)")
        params["study_status"] = study_status
        filters_extracted = True
    if sponsor:
        where_clauses.append("t.sponsor_name ILIKE ANY(%(sponsor)s)")
        params["sponsor"] = [f"%{s}%" for s in sponsor]
    if exclude_sponsor_type == "academic":
        # Strictly exclude academic/non-industry sponsors by name. Also drop rows with
        # NULL sponsor (can't confirm industry -> exclude to honor the user's intent).
        where_clauses.append(
            f"(t.sponsor_name IS NOT NULL AND NOT {_academic_exclusion_sql('excl_acad')})"
        )
        params["excl_acad"] = [f"%{p}%" for p in ACADEMIC_SPONSOR_PATTERNS]
        filters_extracted = True
        filters_extracted = True
    if drug_name_or_target:
        # Match a drug by NAME/target OR by CLASS/modality. A user term like "ADC"
        # is recorded in the data as a modality ("...conjugate"), not a drug name,
        # so we expand each term through SYNONYM_EXPANSIONS and search the class-
        # level columns (modality, class, moa_category, mechanism_of_action) in
        # addition to name/target/brand. Without this, "ADCs" matched only ~4
        # trials (name contains "ADC") instead of ~72 (modality is a conjugate).
        expanded = []
        for d in drug_name_or_target:
            expanded.extend(_expand_synonyms(d))
        where_clauses.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.arms_info a2 "
            "JOIN oncosuite_gold.stratification_info s2 ON s2.arm_id = a2.arm_id "
            "JOIN oncosuite_gold.treatment_info tr2 ON tr2.strata_id = s2.strata_id "
            "LEFT JOIN oncosuite_gold.drug_info d2 ON d2.drug_id = tr2.drug_id "
            "JOIN oncosuite_gold.cohort_info c2 ON c2.cohort_id = a2.cohort_id "
            "WHERE c2.oncosuite_id = t.oncosuite_id "
            "AND (d2.name ILIKE ANY(%(drug)s) OR d2.target ILIKE ANY(%(drug)s) "
            "OR d2.brand_name ILIKE ANY(%(drug)s) OR d2.modality ILIKE ANY(%(drug)s) "
            "OR d2.class ILIKE ANY(%(drug)s) OR d2.moa_category ILIKE ANY(%(drug)s) "
            "OR d2.mechanism_of_action ILIKE ANY(%(drug)s)))"
        )
        params["drug"] = [f"%{d}%" for d in expanded]
        filters_extracted = True

    where_sql = " AND ".join(where_clauses)

    sql = f"""
        SELECT DISTINCT t.oncosuite_id, t.official_title, t.trial_phase, t.study_status,
               t.sponsor_name, t.enrollment_count, t.start_date
        FROM oncosuite_gold.trial_info t
        WHERE {where_sql}
        ORDER BY t.start_date DESC NULLS LAST
        LIMIT %(limit)s OFFSET %(offset)s
    """
    rows = query(sql, params)

    count_sql = f"""
        SELECT count(DISTINCT t.oncosuite_id) AS total
        FROM oncosuite_gold.trial_info t
        WHERE {where_sql}
    """
    total = query(count_sql, params)[0]["total"]

    ids = [r["oncosuite_id"] for r in rows]
    nct_map = {}
    if ids:
        nct_rows = query(
            "SELECT oncosuite_id, source_unique_id FROM oncosuite_gold.source_mapping "
            "WHERE oncosuite_id = ANY(%(ids)s) AND source_name = 'clinicaltrials.gov'",
            {"ids": ids},
        )
        nct_map = {r["oncosuite_id"]: r["source_unique_id"] for r in nct_rows}

    results = [
        {
            "oncosuite_id": r["oncosuite_id"],
            "nct_id": nct_map.get(r["oncosuite_id"]),
            "title": r["official_title"],
            "phase": r["trial_phase"],
            "status": r["study_status"],
            "sponsor": r["sponsor_name"],
            "enrollment": r["enrollment_count"],
            "start_date": str(r["start_date"]) if r["start_date"] else None,
        }
        for r in rows
    ]

    return {
        "results": results,
        "total_matches": total,
        "returned": len(results),
        "unmatched_terms": unmatched_terms,
        "filters_extracted": filters_extracted,
    }
