"""
Cohort-level search -- the grain the client's spec asks for:
"We found N cohorts within M trials", one row per COHORT with columns
    OncoSuite ID | Indication | Regimen | Phase | Status
(and, on request, endpoints). search_trials returns one row per TRIAL; this
returns one row per cohort so the answer matches the design in the spec.

Indication is composed from the cohort's line_of_therapy + biomarkers +
histology/organ (e.g. "1L EGFR NSCLC"). Regimen is the distinct drug names on
the cohort's arms joined with " + ". Phase/Status come from the cohort/trial.

Reuses search_trials' synonym expansion + the widened drug-class match (modality
/ class / moa_category ...) so a class query like "ADC" resolves to the right
cohorts (modality "Antibody-Drug Conjugate (ADC)"), not just literal name hits.
"""
import re

from column_catalog import COHORT_COLUMNS, extra_keys_with, resolve_keys
from db import query, resolve_nct_ids
from tools.search_trials import drug_match_predicate, expand_and_pattern

# The ONLY hardcoded entries allowed here: acronyms/aliases whose expansion does
# NOT literally appear in the data, so no amount of matching against DB values
# could find them (same principle as search_trials.SYNONYM_EXPANSIONS being tiny).
# e.g. the data says "Tyrosine Kinase Inhibitor", never "TKI"; "Cell Therapy",
# never "CAR-T". Everything else is discovered from the data at runtime below --
# NOT hardcoded -- so any class the DB actually contains is matched automatically.
_CLASS_ALIASES = {
    "tki": "kinase inhibitor", "tkis": "kinase inhibitor",
    "car-t": "cell therapy", "car t": "cell therapy",
    "mab": "monoclonal antibody",
}

_VOCAB_CACHE = None


def _class_vocab():
    """Distinct modality / class / moa_category values from drug_info, lowercased.
    This is the data-driven vocabulary we match the user's words against -- it
    covers every class the DB actually holds and updates itself as data changes,
    so we never hardcode a class list. Cached after first load."""
    global _VOCAB_CACHE
    if _VOCAB_CACHE is None:
        rows = query(
            "SELECT DISTINCT lower(v) AS v FROM oncosuite_gold.drug_info d, "
            "LATERAL (VALUES (d.modality), (d.class), (d.moa_category)) AS x(v) "
            "WHERE v IS NOT NULL AND length(v) > 2"
        )
        _VOCAB_CACHE = [r["v"] for r in rows]
    return _VOCAB_CACHE


_CLASS_WORDS_CACHE = None


def _distinctive_class_words():
    """Words that identify a drug CLASS, derived from the data: every word used in
    a modality/class/moa value, MINUS (a) generic filler and (b) any word that
    also appears in condition/histology/organ vocabulary (so disease words like
    'cancer', 'lung', 'breast' can never be mistaken for a drug class). No
    hardcoded class list -- the vocabulary is whatever the DB actually contains."""
    global _CLASS_WORDS_CACHE
    if _CLASS_WORDS_CACHE is not None:
        return _CLASS_WORDS_CACHE
    # generic/filler words that are never a drug CLASS on their own. 'cancer',
    # 'tumor', 'solid' are disease words that can appear inside a class value
    # (e.g. "Cancer Vaccine") but must not be treated as a class by themselves.
    _GENERIC = {"inhibitor", "agent", "therapy", "other", "small", "molecule",
                "cell", "protein", "enzyme", "modulator", "receptor", "based",
                "supportive", "adjunctive", "symptomatic", "pathway", "anti",
                "cancer", "tumor", "tumour", "solid", "disease", "metastatic"}
    def words_of(rows):
        s = set()
        for r in rows:
            for w in re.findall(r"[a-z][a-z\-]{3,}", (r["v"] or "").lower()):
                s.add(w)
        return s
    class_w = words_of(query(
        "SELECT DISTINCT v FROM oncosuite_gold.drug_info d, "
        "LATERAL (VALUES (d.modality),(d.class),(d.moa_category)) x(v) WHERE v IS NOT NULL"))
    # disease vocabulary -- words here are NOT drug classes
    disease_w = words_of(query(
        "SELECT DISTINCT v FROM oncosuite_gold.cohort_info c, "
        "LATERAL (SELECT jsonb_array_elements_text(col) v FROM (VALUES (c.organ),(c.histology)) t(col) "
        "WHERE col IS NOT NULL) s"))
    _CLASS_WORDS_CACHE = (class_w - disease_w) - _GENERIC
    return _CLASS_WORDS_CACHE


def extract_drug_class(text):
    """Find a drug-class/modality the user named, WITHOUT a hardcoded class list.
    Strategy: (1) expand a few acronyms the data doesn't spell out (TKI, CAR-T);
    (2) match the message against the DB's own distinct modality/class values.
    Returns a drug filter list (the matched phrase) or None. Deterministic, so a
    cohort request finds its filter even when the LLM classifier returns nothing.
    """
    lm = (text or "").lower()

    # (1) acronyms the data never spells out
    for alias, canonical in _CLASS_ALIASES.items():
        # word-ish boundary so 'mab' doesn't fire inside 'trastuzumab'
        if re.search(rf"(?<![a-z]){re.escape(alias)}(?![a-z])", lm):
            return [canonical]

    # (2) the "(ADC)"-style acronym embedded in a modality value, e.g. user typed
    # "ADC" and the DB value is "Antibody-Drug Conjugate (ADC)". Check first so the
    # crisp acronym wins over a longer fuzzy phrase match.
    for val in _class_vocab():
        m = re.search(r"\(([a-z0-9\-]{2,6})\)", val)
        if m and re.search(rf"(?<![a-z]){re.escape(m.group(1))}(?![a-z])", lm):
            return [m.group(1)]

    # (3) data-driven: match a DISTINCTIVE class phrase the user typed against the
    # DB's real class values. We build the set of distinctive class words FROM THE
    # DATA (every word appearing in a modality/class value, minus generic filler
    # and any word that also appears in non-class vocabulary like 'cancer'), then
    # return the user's word only if it's one of those class words. This is
    # data-driven (no hardcoded class list) yet avoids the false positives of raw
    # word-overlap (e.g. 'cancer' in "HER2 breast cancer" must NOT match).
    class_words = _distinctive_class_words()
    hit = None
    for w in re.findall(r"[a-z][a-z\-]{3,}", lm):
        if w in class_words and (hit is None or len(w) > len(hit)):
            hit = w
    return [hit] if hit else None


def _clean_list(val):
    """cohort jsonb-array columns come back as a Python list (or None). Join the
    non-empty string items; strip bracket/quote noise if it's raw text."""
    if val is None:
        return ""
    if isinstance(val, list):
        parts = [str(v).strip() for v in val if v is not None and str(v).strip()]
        return " ".join(parts)
    return str(val).strip("[]{}\"'").strip()


def _indication(row):
    """Compose 'line biomarker histology' e.g. '1L EGFR NSCLC'. Skips blanks."""
    line = _clean_list(row.get("line_of_therapy"))
    bio = _clean_list(row.get("biomarkers"))
    hist = _clean_list(row.get("histology")) or _clean_list(row.get("organ"))
    parts = [p for p in (line, bio, hist) if p]
    return " ".join(parts) or "Not specified"


def _fmt_dosage(value, unit):
    if value is None:
        return None
    num = f"{value:g}" if isinstance(value, float) else str(value)
    return f"{num} {unit}".strip() if unit else num


def regimen_drug_details(cohort_ids):
    """Per-drug treatment detail for each cohort's regimen -- dosage, schedule,
    duration, treatment status and route -- straight from oncosuite_gold.treatment_info,
    joined the SAME way (arms_info -> stratification_info -> treatment_info) the
    regimen string above is built, so drug names line up exactly with what's
    displayed. Returns {cohort_id: {drug_name: {...}}}; a drug with more than one
    treatment_info row in a cohort (e.g. two arms dosing it differently) keeps the
    first (lowest treatment_id) -- the regimen cell shows one name, not one per arm."""
    if not cohort_ids:
        return {}
    rows = query(
        "SELECT a.cohort_id, tr.drug_name, tr.dosage_value, tr.dosage_unit, "
        "tr.schedule, tr.duration, tr.treatment_status, tr.mode_of_administration "
        "FROM oncosuite_gold.arms_info a "
        "JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id "
        "JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id "
        "WHERE a.cohort_id = ANY(%(ids)s) AND tr.drug_name IS NOT NULL "
        "ORDER BY a.cohort_id, tr.drug_name, tr.treatment_id",
        {"ids": list(set(cohort_ids))},
    )
    out = {}
    for r in rows:
        bucket = out.setdefault(r["cohort_id"], {})
        name = str(r["drug_name"]).strip()
        if name in bucket:
            continue
        route = r.get("mode_of_administration")
        if isinstance(route, list):
            route = ", ".join(str(x) for x in route if x) or None
        bucket[name] = {
            "dosage": _fmt_dosage(r.get("dosage_value"), r.get("dosage_unit")),
            "schedule": r.get("schedule"),
            "duration": r.get("duration"),
            "treatment_status": r.get("treatment_status"),
            "mode_of_administration": route,
        }
    return out


def search_cohorts(drug_name_or_target=None, condition=None, biomarkers=None,
                   line_of_therapy=None, phase=None, study_status=None,
                   limit=200, offset=0, columns=None):
    """Return cohort-level rows for the given filters. Currently supports the
    filters the spec needs (drug/class, condition, biomarker, line, phase,
    status); extend as needed. Returns:
        {"results": [...], "total_cohorts": n, "total_trials": m, "returned": k}
    Each result: oncosuite_id, indication, regimen, phase, status, cohort_id,
    plus any extra column_catalog.COHORT_COLUMNS keys requested via `columns`
    (see resolve_keys) -- None/[] reproduces exactly today's row shape.
    """
    active_keys = resolve_keys(COHORT_COLUMNS, columns)
    extra_cohort_cols = extra_keys_with(COHORT_COLUMNS, active_keys, "cohort_col")
    extra_drug_cols = extra_keys_with(COHORT_COLUMNS, active_keys, "drug_col")

    where = ["1=1"]
    params = {"limit": limit, "offset": offset}

    if drug_name_or_target:
        params["drug"] = expand_and_pattern(drug_name_or_target)
        where.append(
            "EXISTS (SELECT 1 FROM oncosuite_gold.arms_info a2 "
            "JOIN oncosuite_gold.stratification_info s2 ON s2.arm_id = a2.arm_id "
            "JOIN oncosuite_gold.treatment_info tr2 ON tr2.strata_id = s2.strata_id "
            "JOIN oncosuite_gold.drug_info d ON d.drug_id = tr2.drug_id "
            f"WHERE a2.cohort_id = c.cohort_id AND {drug_match_predicate('d', 'drug')})"
        )
    if phase:
        where.append("c.phase = ANY(%(phase)s)")
        params["phase"] = phase
    if study_status:
        where.append("t.study_status = ANY(%(status)s)")
        params["status"] = study_status
    # condition / biomarker / line filters: match against the cohort's own jsonb
    # columns with a simple ILIKE-any over the unnested text (kept lightweight;
    # search_trials has the full fuzzy path if we need it later).
    for key, cols in (("condition", ["organ", "histology", "sub_histology"]),
                      ("biomarkers", ["biomarkers", "biomarker_variant"]),
                      ("line_of_therapy", ["line_of_therapy"])):
        vals = {"condition": condition, "biomarkers": biomarkers,
                "line_of_therapy": line_of_therapy}[key]
        if not vals:
            continue
        pk = f"f_{key}"
        params[pk] = [f"%{v}%" for v in vals]
        ors = " OR ".join(
            f"EXISTS (SELECT 1 FROM jsonb_array_elements_text(c.{col}) e "
            f"WHERE e ILIKE ANY(%({pk})s))" for col in cols
        )
        where.append(f"({ors})")

    where_sql = " AND ".join(where)

    extra_cohort_select = "".join(f", c.{COHORT_COLUMNS[k]['cohort_col']}" for k in extra_cohort_cols)
    extra_drug_select = "".join(
        f""",
               (SELECT string_agg(DISTINCT d.{COHORT_COLUMNS[k]['drug_col']}, ' + ')
                  FROM oncosuite_gold.arms_info a
                  JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
                  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
                  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
                 WHERE a.cohort_id = c.cohort_id
                   AND d.{COHORT_COLUMNS[k]['drug_col']} IS NOT NULL) AS {k}"""
        for k in extra_drug_cols
    )
    rows = query(f"""
        SELECT c.cohort_id, c.oncosuite_id, c.line_of_therapy, c.biomarkers,
               c.histology, c.organ, c.phase, t.study_status,
               (SELECT string_agg(DISTINCT d.name, ' + ')
                  FROM oncosuite_gold.arms_info a
                  JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
                  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
                  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
                 WHERE a.cohort_id = c.cohort_id AND d.name IS NOT NULL) AS regimen
               {extra_cohort_select}{extra_drug_select}
        FROM oncosuite_gold.cohort_info c
        JOIN oncosuite_gold.trial_info t ON t.oncosuite_id = c.oncosuite_id
        WHERE {where_sql}
        ORDER BY t.start_date DESC NULLS LAST, c.cohort_id
        LIMIT %(limit)s OFFSET %(offset)s
    """, params)

    totals = query(f"""
        SELECT count(*) AS total_cohorts,
               count(DISTINCT c.oncosuite_id) AS total_trials
        FROM oncosuite_gold.cohort_info c
        JOIN oncosuite_gold.trial_info t ON t.oncosuite_id = c.oncosuite_id
        WHERE {where_sql}
    """, params)[0]

    # map oncosuite_id -> NCT id for display/linking
    ids = list({r["oncosuite_id"] for r in rows})
    nct_map = resolve_nct_ids(ids)
    regimen_details = regimen_drug_details([r["cohort_id"] for r in rows])

    def _extra_fields(r):
        out = {}
        for k in extra_cohort_cols:
            v = r.get(COHORT_COLUMNS[k]["cohort_col"])
            out[k] = _clean_list(v) if COHORT_COLUMNS[k].get("is_list") else v
        for k in extra_drug_cols:
            out[k] = r.get(k) or "Not specified"
        return out

    results = [{
        "cohort_id": r["cohort_id"],
        "oncosuite_id": r["oncosuite_id"],
        "nct_id": nct_map.get(r["oncosuite_id"]),
        "indication": _indication(r),
        "regimen": r["regimen"] or "Not specified",
        "regimen_detail": regimen_details.get(r["cohort_id"], {}),
        "phase": r["phase"] or (r.get("study_status") and "") or "—",
        "status": r["study_status"] or "—",
        **_extra_fields(r),
    } for r in rows]

    return {
        "results": results,
        "columns": active_keys,
        "total_cohorts": totals["total_cohorts"],
        "total_trials": totals["total_trials"],
        "returned": len(results),
    }
