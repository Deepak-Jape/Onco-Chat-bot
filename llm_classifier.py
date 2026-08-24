"""
Dynamic, LLM-driven intent classifier + filter extractor.

This REPLACES the hardcoded keyword matching in router.classify_and_extract for the
primary path. Instead of a fixed bag of keywords ("kras"/"egfr"/"phase 3"/...), we ask
the LLM to read the question and return a small JSON object: the intent plus any filter
terms it found. The existing vocab layer (vocab.normalize_filters) then validates those
raw terms against the real DB values, so we never need to hardcode the valid biomarkers,
conditions, etc. -- they come from the data.

Design:
  - classify(question, working_set) -> dict  (same shape router expects) OR None if the
    LLM is unavailable / returns something unusable. router falls back to keywords then.
  - The enumerable value sets that ARE small and stable (phase, status) are loaded LIVE
    from the DB once and injected into the prompt so the model maps "phase III"/"late
    stage" to the exact stored strings.
  - temperature 0, strict JSON, defensive parsing -- never raises.
"""
import json
import re

import llm_client
from column_catalog import COHORT_COLUMNS, TRIAL_COLUMNS

_VOCAB_CACHE = None


def _load_vocab():
    """Load the small, enumerable value sets (phase, status) live from the DB so the
    prompt always reflects real data. Cached after first call. Never raises."""
    global _VOCAB_CACHE
    if _VOCAB_CACHE is not None:
        return _VOCAB_CACHE
    phases, statuses = [], []
    try:
        from db import query
        phases = [r["trial_phase"] for r in query(
            "SELECT DISTINCT trial_phase FROM oncosuite_gold.trial_info "
            "WHERE trial_phase IS NOT NULL ORDER BY 1")]
        statuses = [r["study_status"] for r in query(
            "SELECT DISTINCT study_status FROM oncosuite_gold.trial_info "
            "WHERE study_status IS NOT NULL ORDER BY 1")]
    except Exception:
        pass  # DB unreachable at prompt-build time -> prompt just omits the enumerations
    _VOCAB_CACHE = {"phases": phases, "statuses": statuses}
    return _VOCAB_CACHE


_INTENTS = (
    "single_trial_lookup",   # about ONE specific trial (named by NCT id or 'this'/'it')
    "filtered_search",       # find trials matching filters (condition/biomarker/phase/...)
    "landscape_or_trend",    # competitive landscape / trends across a drug or target
    "outcome_deep_dive",     # endpoints/outcomes/efficacy for a specific trial
    "arm_comparison",        # compare the ARMS within one trial
    "aggregate_query",       # counts/averages/rankings/breakdowns ACROSS many trials,
                             #   or any comparative/analytic question the fixed tools
                             #   can't compute -> will be answered via text-to-SQL
    "out_of_scope",          # not answerable from a clinical-trials database
)


def _extra_column_keys():
    """Opt-in column_catalog keys the model is allowed to request via
    filters.columns -- everything downstream (resolve_keys/validate_keys)
    ignores anything else, but listing the real set here means the model
    rarely wastes a guess on a column that doesn't exist."""
    trial_extra = [k for k, v in TRIAL_COLUMNS.items() if not v.get("default")]
    cohort_extra = [k for k, v in COHORT_COLUMNS.items() if not v.get("default")]
    seen, out = set(), []
    for k in trial_extra + cohort_extra:
        if k not in seen:
            seen.add(k)
            out.append(k)
    return out


def _system_prompt():
    v = _load_vocab()
    phases = ", ".join(v["phases"]) or "Phase 1, Phase 2, Phase 3, Phase 4"
    statuses = ", ".join(v["statuses"]) or "Recruiting, Completed, Terminated"
    extra_cols = ", ".join(_extra_column_keys())
    return (
        "You are the intent classifier for a clinical-trials assistant backed by a "
        "PostgreSQL database (oncosuite_gold). Read the user's question and output ONLY a "
        "JSON object (no prose, no markdown fences) with this shape:\n"
        '{\n'
        '  "intent": one of ' + " | ".join(_INTENTS) + ",\n"
        '  "nct_id": "NCT########" or null,\n'
        '  "refers_to_active_trial": true|false,   // question uses this/it/that trial\n'
        '  "filters": {\n'
        '     "condition": [..], "biomarkers": [..], "cancer_stage": [..],\n'
        '     "line_of_therapy": [..], "phase": [..], "study_status": [..],\n'
        '     "sponsor": [..], "drug_name_or_target": [..],\n'
        '     "prior_therapy": [..], "reported_outcomes": [..], "columns": [..]\n'
        '  }\n'
        "}\n\n"
        "RULES:\n"
        "- Extract filter TERMS as the user means them; do not invent values. Leave a "
        "filter out entirely if not mentioned.\n"
        "- \"condition\" is the DISEASE filter and it fans out across four columns: "
        "organ, histology, sub_histology and histology_variant. So put ANY disease term "
        "here, at whatever level the user used -- the ORGAN ('lung', 'breast', "
        "'ovarian'), the HISTOLOGY ('NSCLC', 'SCLC'), a SUB-HISTOLOGY "
        "('adenocarcinoma', 'squamous cell carcinoma', 'large cell carcinoma', "
        "'B-cell lymphoma'), or a variant. There is no separate 'histology' or 'organ' "
        "filter -- do not invent one, and never drop a disease term because it looks "
        "too specific or too broad for this key.\n"
        "- \"prior_therapy\" is what patients must already have received "
        "('previously treated with osimertinib', 'after platinum chemotherapy', "
        "'progressed on a checkpoint inhibitor') -- distinct from "
        "drug_name_or_target, which is what the trial is TESTING.\n"
        "- \"reported_outcomes\" is for questions restricted to trials that actually "
        "REPORT given endpoints ('trials with OS reported', 'which have ORR data') -- "
        "use the abbreviations: OS, PFS, ORR, DoR, TTP, EFS, DFS.\n"
        "- Trial identifiers are NOT filters: an NCT id goes in the top-level "
        "\"nct_id\" field, and an OncoSuite id (three dash-separated 3-character "
        "groups, e.g. 8bN-3eH-W5g) also identifies ONE trial -- either means intent "
        "'single_trial_lookup' (or 'outcome_deep_dive' when the question is "
        "specifically about that trial's endpoints/efficacy).\n"
        "- \"drug_name_or_target\" covers more than a literal drug name or molecular "
        "target -- it also covers drug CLASS / MODALITY / mechanism terms, since the "
        "database records those on the same drug record (e.g. modality = "
        "'Antibody-Drug Conjugate (ADC)'). Put terms like 'ADC', 'bispecific "
        "(antibody)', 'CAR-T'/'cell therapy', 'checkpoint inhibitor', 'kinase "
        "inhibitor'/'TKI', 'monoclonal antibody', 'cancer vaccine', 'radiopharmaceutical', "
        "'immunotherapy', 'chemotherapy', 'targeted therapy' here too -- do NOT drop "
        "them just because they aren't a specific drug/target name.\n"
        f"- phase must map to one of: {phases}. (e.g. 'phase III' -> 'Phase 3', "
        "'late stage' -> ['Phase 3'].)\n"
        f"- study_status must map to one of: {statuses}. ('open'/'enrolling' -> "
        "'Recruiting'.)\n"
        "- Averages, medians, rankings, breakdowns/group-by, percentages, correlations, "
        "or comparisons ACROSS many trials (not within one trial's arms) => intent "
        "'aggregate_query'.\n"
        "- A bare count ('how many X trials...', 'number of X trials...') where X names "
        "concrete filters (a condition, biomarker, phase, or status) => intent "
        "'filtered_search' with those filters extracted, NOT 'aggregate_query' -- the "
        "search tool's own match count already answers it, and returns the matching "
        "trials too. Only use 'aggregate_query' for a bare count with nothing concrete "
        "to scope it by (e.g. 'how many trials do we have in total'), or one that also "
        "asks for grouping/stats ('how many trials per sponsor').\n"
        "- 'compare the arms' / 'arm A vs arm B' within a trial => 'arm_comparison'.\n"
        "- A specific trial's eligibility/endpoints/safety/etc (named or 'this') => "
        "'single_trial_lookup' (or 'outcome_deep_dive' if specifically about "
        "endpoints/efficacy).\n"
        "- Greetings/definitions/off-topic with no trial data need => 'out_of_scope'.\n"
        "- If the question names specific extra fields, or asks for more detail/columns "
        f"than a basic table, set \"columns\" to whichever of these it implies: {extra_cols}. "
        "Only use keys from that exact list -- never invent one. Leave \"columns\" out "
        "entirely for an ordinary question; most questions need no extra columns.\n"
        "- Output ONLY the JSON object."
    )


def _extract_json(text):
    t = text.strip()
    t = re.sub(r"^```(?:json)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    # grab the outermost {...} if the model added stray text
    m = re.search(r"\{.*\}", t, re.DOTALL)
    if m:
        t = m.group(0)
    return json.loads(t)


# filter keys we forward to the tools (drop anything else the model dreamed up)
# Must stay in step with search_trials()'s own parameters -- the router forwards
# these straight through as **filters, so a key listed here but absent there
# raises, and one accepted there but missing here is silently dropped (which is
# what kept prior_therapy / reported_outcomes from ever being used).
_ALLOWED_FILTER_KEYS = {
    "condition", "biomarkers", "cancer_stage", "line_of_therapy", "phase",
    "study_status", "sponsor", "drug_name_or_target", "columns",
    "prior_therapy", "reported_outcomes",
}

# Genuine cross-trial grouping/statistics/comparison -- these need real SQL, unlike
# a bare count of trials matching concrete filters (search_trials's total_matches
# already answers that). Shared with router.py's keyword-fallback classifier (it
# imports this constant) so both paths agree on what actually needs text-to-SQL.
# See classify()'s aggregate_query downgrade below.
_TRUE_AGG_WORDS = (
    "average", "avg", "mean", "median", "sum",
    "most", "least", "fewest", "highest", "lowest", "top ", "rank",
    "broken down", "break down", "breakdown", "grouped by", "group by", "per ",
    "distribution", "percentage", "proportion",
    "ratio", "more often", "less often", "compare", "comparison", "relationship",
    "correlat", "fraction of", "similar to", "vs ", "versus", "than ",
    "each ", "across all", "trend",
)


def classify(question, working_set):
    """Return a classification dict in router's shape, or None if unavailable/unusable."""
    if not llm_client.available():
        return None
    try:
        raw = llm_client.chat([
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": question},
        ])
        data = _extract_json(raw)
    except Exception:
        return None  # LLM down or unparseable -> caller falls back to keywords

    intent = data.get("intent")
    if intent not in _INTENTS:
        return None

    resolved_oncosuite_id = working_set.get("active_trial_id")
    resolved_arm_ids = [a["arm_id"] for a in working_set.get("last_arms", [])]

    # explicit NCT id wins -> single-trial lookup keyed by that id
    nct = data.get("nct_id")
    if nct and re.match(r"(?i)^nct\d{8}$", str(nct).strip()):
        return {"intent": "single_trial_lookup",
                "filters": {"nct_id": nct.strip().upper()}}

    # follow-up: "this/that trial" with an active trial in session
    if intent in ("single_trial_lookup", "outcome_deep_dive") and \
            data.get("refers_to_active_trial") and resolved_oncosuite_id:
        return {"intent": intent, "filters": {},
                "resolved_oncosuite_id": resolved_oncosuite_id}

    if intent == "out_of_scope":
        return {"intent": "out_of_scope", "filters": {}}
    # clean the filters the model returned (done BEFORE the arm_comparison branch
    # so a descriptive comparison like "the Phase 3 lung cancer trial" keeps its
    # condition/phase filters -- the router uses them to resolve which trial to
    # compare when no NCT id / active trial is available).
    raw_filters = data.get("filters") or {}
    filters = {}
    for k, val in raw_filters.items():
        if k not in _ALLOWED_FILTER_KEYS or not val:
            continue
        filters[k] = val if isinstance(val, list) else [val]

    if intent == "aggregate_query":
        # Defense in depth against the prompt instruction above not being followed:
        # a bare count with real filters and no genuine grouping/statistics word is
        # exactly what search_trials's own total_matches answers (and, unlike a raw
        # SQL COUNT(*), it returns the matching trials too) -- downgrade rather than
        # lose the trial list to a bare number.
        q = (question or "").lower()
        if filters and not any(w in q for w in _TRUE_AGG_WORDS):
            return {"intent": "filtered_search", "filters": filters,
                    "resolved_oncosuite_id": resolved_oncosuite_id}
        return {"intent": "aggregate_query", "filters": {}}

    if intent == "arm_comparison":
        return {"intent": "arm_comparison", "filters": filters,
                "resolved_oncosuite_id": resolved_oncosuite_id,
                "resolved_arm_ids": resolved_arm_ids}

    if intent == "landscape_or_trend":
        # landscape tool expects target_or_moa/condition; map drug_name_or_target across
        lf = {}
        if filters.get("condition"):
            lf["condition"] = filters["condition"]
        if filters.get("drug_name_or_target"):
            lf["target_or_moa"] = filters["drug_name_or_target"]
        return {"intent": "landscape_or_trend", "filters": lf}

    if intent == "outcome_deep_dive":
        return {"intent": "outcome_deep_dive", "filters": {},
                "resolved_oncosuite_id": resolved_oncosuite_id}

    # default: filtered_search with whatever filters were extracted
    return {"intent": "filtered_search", "filters": filters,
            "resolved_oncosuite_id": resolved_oncosuite_id}
