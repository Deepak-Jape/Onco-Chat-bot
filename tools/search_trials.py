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
from column_catalog import TRIAL_COLUMNS, extra_keys_with, resolve_keys
from db import query, resolve_nct_ids

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


def expand_and_pattern(terms):
    """Expand each term through _expand_synonyms, then wrap every expansion as
    an ILIKE '%...%' pattern. Shared by search_trials/search_cohorts' drug
    filter, which both expand-then-pattern the same way."""
    expanded = []
    for t in terms:
        expanded.extend(_expand_synonyms(t))
    return [f"%{e}%" for e in expanded]


# The drug-match columns widened past name/target so a class/modality query
# (e.g. "ADC", "bispecific") resolves via modality/class/moa_category too, not
# just literal name hits. Shared by search_trials/search_cohorts' drug EXISTS
# subqueries -- the join chain around it differs per caller (trials anchor on
# oncosuite_id, cohorts on cohort_id) so only the predicate itself is shared.
DRUG_MATCH_COLUMNS = ["name", "target", "brand_name", "modality", "class",
                      "moa_category", "mechanism_of_action"]


def drug_match_predicate(alias, param):
    ors = " OR ".join(f"{alias}.{c} ILIKE ANY(%({param})s)" for c in DRUG_MATCH_COLUMNS)
    return f"({ors})"


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


def _classify_sponsor(name):
    """Same heuristic as get_competitive_landscape.py's _classify_sponsor -- there is
    no authoritative sponsor-type column, so this backs the opt-in "sponsor_type"
    column in column_catalog.py."""
    if not name:
        return "Unknown"
    s = name.lower()
    return "Academic" if any(p in s for p in ACADEMIC_SPONSOR_PATTERNS) else "Industry"


def search_trials(condition=None, biomarkers=None, cancer_stage=None, line_of_therapy=None,
                   prior_therapy=None, drug_name_or_target=None, phase=None, study_status=None,
                   sponsor=None, exclude_sponsor_type=None, reported_outcomes=None, limit=50,
                   offset=0, columns=None):
    """
    exclude_sponsor_type: "academic" to strictly filter OUT university/hospital/institute/
    government sponsors (for queries like "not interested in academia"). Classification is
    heuristic, by sponsor name (no authoritative sponsor-type field exists in the schema).

    reported_outcomes: list of endpoint abbreviations (e.g. ["OS", "ORR", "PFS"]) --
    OR logic, restricts to trials with at least one arm carrying a NON-NULL posted
    value for ANY of these metrics in results_outcomes_basic_info. Without this,
    "trials that have OS/ORR/PFS reported" has no way to be expressed and silently
    gets dropped, returning the same unfiltered set as a bare condition search.

    columns: extra column_catalog.TRIAL_COLUMNS keys to include ON TOP OF the
    default row shape (see resolve_keys) -- e.g. ["lead_organization", "sponsor_type"]
    when the user asked for more detail than the baseline columns. None/[] reproduces
    exactly today's row shape.
    """
    active_keys = resolve_keys(TRIAL_COLUMNS, columns)
    extra_trial_cols = extra_keys_with(TRIAL_COLUMNS, active_keys, "trial_col")
    want_sponsor_type = "sponsor_type" in active_keys
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
    if drug_name_or_target:
        # Match a drug by NAME/target OR by CLASS/modality. A user term like "ADC"
        # is recorded in the data as a modality ("...conjugate"), not a drug name,
        # so we expand each term through SYNONYM_EXPANSIONS and search the class-
        # level columns (modality, class, moa_category, mechanism_of_action) in
        # addition to name/target/brand. Without this, "ADCs" matched only ~4
        # trials (name contains "ADC") instead of ~72 (modality is a conjugate).
        where_clauses.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.arms_info a2 "
            "JOIN oncosuite_gold.stratification_info s2 ON s2.arm_id = a2.arm_id "
            "JOIN oncosuite_gold.treatment_info tr2 ON tr2.strata_id = s2.strata_id "
            "LEFT JOIN oncosuite_gold.drug_info d2 ON d2.drug_id = tr2.drug_id "
            "JOIN oncosuite_gold.cohort_info c2 ON c2.cohort_id = a2.cohort_id "
            "WHERE c2.oncosuite_id = t.oncosuite_id "
            f"AND {drug_match_predicate('d2', 'drug')})"
        )
        params["drug"] = expand_and_pattern(drug_name_or_target)
        filters_extracted = True
    if reported_outcomes:
        where_clauses.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.cohort_info c3 "
            "JOIN oncosuite_gold.arms_info a3 ON a3.cohort_id = c3.cohort_id "
            "JOIN oncosuite_gold.results_outcomes_basic_info r3 ON r3.arm_id = a3.arm_id "
            "JOIN oncosuite_gold.study_endpoints_info e3 ON e3.endpoint_id = r3.endpoint_id "
            "WHERE c3.oncosuite_id = t.oncosuite_id "
            "AND UPPER(e3.endpoint_abbreviation) = ANY(%(reported_outcomes)s) "
            "AND r3.value IS NOT NULL)"
        )
        params["reported_outcomes"] = [m.upper() for m in reported_outcomes]
        filters_extracted = True

    where_sql = " AND ".join(where_clauses)

    extra_select = "".join(
        f", t.{TRIAL_COLUMNS[k]['trial_col']}" for k in extra_trial_cols
    )
    sql = f"""
        SELECT DISTINCT t.oncosuite_id, t.official_title, t.trial_phase, t.study_status,
               t.sponsor_name, t.enrollment_count, t.start_date{extra_select}
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
    nct_map = resolve_nct_ids(ids)

    # When reported_outcomes filtered the search, show WHICH of those metrics
    # each trial actually has -- the filter alone doesn't say why a given row
    # qualified, and a trial can have some but not all of the requested metrics.
    reported_map = {}
    if reported_outcomes and ids:
        metric_order = [m.upper() for m in reported_outcomes]
        metric_rows = query(
            """
            SELECT c4.oncosuite_id, UPPER(e4.endpoint_abbreviation) AS metric
              FROM oncosuite_gold.cohort_info c4
              JOIN oncosuite_gold.arms_info a4 ON a4.cohort_id = c4.cohort_id
              JOIN oncosuite_gold.results_outcomes_basic_info r4 ON r4.arm_id = a4.arm_id
              JOIN oncosuite_gold.study_endpoints_info e4 ON e4.endpoint_id = r4.endpoint_id
             WHERE c4.oncosuite_id = ANY(%(ids)s)
               AND UPPER(e4.endpoint_abbreviation) = ANY(%(metrics)s)
               AND r4.value IS NOT NULL
             GROUP BY c4.oncosuite_id, UPPER(e4.endpoint_abbreviation)
            """,
            {"ids": ids, "metrics": metric_order},
        )
        found_by_id = {}
        for r in metric_rows:
            found_by_id.setdefault(r["oncosuite_id"], set()).add(r["metric"])
        reported_map = {
            oid: ", ".join(m for m in metric_order if m in metrics)
            for oid, metrics in found_by_id.items()
        }

    def _extra_fields(r):
        out = {}
        for k in extra_trial_cols:
            v = r.get(TRIAL_COLUMNS[k]["trial_col"])
            # date/datetime values (e.g. primary_completion_date) -> ISO string,
            # matching how start_date is already stringified above.
            out[k] = str(v) if hasattr(v, "isoformat") else v
        if want_sponsor_type:
            out["sponsor_type"] = _classify_sponsor(r["sponsor_name"])
        return out

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
            **({"reported_outcomes": reported_map.get(r["oncosuite_id"], "")}
               if reported_outcomes else {}),
            **_extra_fields(r),
        }
        for r in rows
    ]

    return {
        "results": results,
        "columns": active_keys + (["reported_outcomes"] if reported_outcomes else []),
        "total_matches": total,
        "returned": len(results),
        "unmatched_terms": unmatched_terms,
        "filters_extracted": filters_extracted,
        # The exact kwargs this call was made with (minus limit/offset/paging
        # state) -- so a caller can persist this in session memory and re-run
        # the SAME search later (e.g. "show me a map for the same trials")
        # without having to re-derive filters from the original phrasing.
        "filters_applied": {
            "condition": condition, "biomarkers": biomarkers, "cancer_stage": cancer_stage,
            "line_of_therapy": line_of_therapy, "prior_therapy": prior_therapy,
            "drug_name_or_target": drug_name_or_target, "phase": phase,
            "study_status": study_status, "sponsor": sponsor,
            "exclude_sponsor_type": exclude_sponsor_type,
            "reported_outcomes": reported_outcomes,
            "columns": columns,
        },
    }
