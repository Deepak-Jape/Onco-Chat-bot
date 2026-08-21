

"""
Piece 5 -- router: intent classification + escalation logic + orchestration.

IMPORTANT: `classify_and_extract` below is a PLACEHOLDER. In production this is
a single Claude tool-use call (the "cheap model" slot) with the tool schema
shown in CLASSIFY_TOOL_SCHEMA. This sandbox has no wired API credentials, so
a small rule-based stand-in fills the same contract (same input, same output
shape) purely so the rest of the pipeline -- escalation, memory, tool dispatch --
can be built and tested end-to-end. Swap classify_and_extract's body for a
real `anthropic.Anthropic().messages.create(...)` call using CLASSIFY_TOOL_SCHEMA
as the tool definition; nothing else in this file needs to change.

Escalation rules are deterministic code, NOT a model decision, per Doc 05 --
implemented exactly as specified, in priority order.
"""
import re

from column_catalog import COHORT_COLUMNS, TRIAL_COLUMNS, detect_requested_columns
from conversation import conversations
from memory import SessionStore
from tools.search_trials import search_trials
from tools.search_cohorts import search_cohorts
from tools.get_trial_detail import get_trial_detail
from tools.get_endpoints_and_outcomes import get_endpoints_and_outcomes
from tools.get_hazard_ratios import get_hazard_ratios
from tools.get_adverse_events import get_adverse_events
from tools.compare_arms import compare_arms
from tools.get_competitive_landscape import get_competitive_landscape
from tools.get_trial_sources import get_trial_sources

CLASSIFY_TOOL_SCHEMA = {
    "name": "classify_and_extract",
    "description": "Classify user intent and extract structured filters/entity references, "
                    "resolving pronouns against the session working set in the same call.",
    "input_schema": {
        "type": "object",
        "properties": {
            "intent": {
                "type": "string",
                "enum": ["single_trial_lookup", "filtered_search", "arm_comparison",
                         "landscape_or_trend", "outcome_deep_dive", "clarification_needed",
                         "out_of_scope"],
            },
            "filters": {
                "type": "object",
                "properties": {
                    "columns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Extra column_catalog keys the user asked for on "
                                        "top of the default table (e.g. the phrasing names "
                                        "specific fields or asks for more detail/columns). "
                                        "Only ever populate with keys that actually appear "
                                        "in column_catalog.py's TRIAL_COLUMNS/COHORT_COLUMNS "
                                        "-- never invent a column name.",
                    },
                },
            },
            "resolved_oncosuite_id": {"type": "string"},
            "resolved_arm_ids": {"type": "array", "items": {"type": "integer"}},
        },
        "required": ["intent"],
    },
}

ALWAYS_ESCALATE_INTENTS = {"arm_comparison", "landscape_or_trend",
                           "single_trial_lookup", "filtered_search"}
RESULT_SIZE_CHECK_INTENTS = {"outcome_deep_dive"}
RESULT_SIZE_THRESHOLD = 3

# An NCT id, detected throughout this file's keyword-fallback rules. IGNORECASE
# so callers can match it against either the raw user message or an
# already-lowercased copy without needing two patterns.
_NCT_ID_RE = re.compile(r"nct\d{8}", re.IGNORECASE)

# An internal oncosuite_id (e.g. "00v-vw5-Ejz"): 3-3-3 alphanumeric groups
# separated by hyphens. Always matched against the ORIGINAL message (ids are
# mixed-case, so this is deliberately case-sensitive).
_ONCOSUITE_ID_RE = re.compile(r"\b([0-9A-Za-z]{3}-[0-9A-Za-z]{3}-[0-9A-Za-z]{3})\b")


def _dynamic_classify(user_message, working_set):
    """Try the LLM classifier. Returns a classification dict or None (fall back)."""
    try:
        import llm_classifier
        return llm_classifier.classify(user_message, working_set)
    except Exception:
        return None


def classify_and_extract(user_message: str, working_set: dict) -> dict:
    """Classify the question into an intent + extract filters.

    PRIMARY path: a dynamic, LLM-driven classifier (llm_classifier.classify) that
    understands arbitrary phrasing and any biomarker/condition/drug -- no hardcoded
    keyword lists. FALLBACK path (below): the original keyword rules, used only when the
    LLM is unavailable or returns something unusable, so the app still works offline.
    """
    dyn = _dynamic_classify(user_message, working_set)
    if dyn is not None:
        return dyn

    # ---- keyword fallback (LLM unavailable) --------------------------------------
    msg = user_message.lower()

    resolved_oncosuite_id = working_set.get("active_trial_id")
    resolved_arm_ids = [a["arm_id"] for a in working_set.get("last_arms", [])]

    # PORTFOLIO-LEVEL AGGREGATE questions ("how many ... broken down by phase",
    # "count of recruiting vs completed", "average enrollment per sponsor") must go
    # straight to text-to-SQL -- the fixed single-trial/arm tools cannot express
    # groupings, cross-trial breakdowns, or statistics. Detect this FIRST, before the
    # narrow keyword rules below can mis-grab it (e.g. "vs" -> arm_comparison, or an
    # active trial in the session hijacking it into single_trial_lookup).
    #
    # A BARE count word ("how many"/"count"/"number of") is deliberately kept OUT of
    # this list: "how many phase 3 EGFR trials are recruiting" needs no grouping or
    # math -- search_trials's own total_matches already answers it, AND (unlike a raw
    # `SELECT COUNT(*)`) also returns the actual matching trials for the table +
    # insights below it. Sending it to text-to-SQL instead threw away exactly that --
    # a bare number with no way to see which trials it counted. See _COUNT_ONLY below.
    _AGG = ("broken down", "break down", "breakdown",
            "grouped by", "group by", "by phase", "by sponsor", "by status", "by country",
            "per phase", "per sponsor", "distribution", "average", "avg", "mean", "median",
            "most ", "least ", "fewest", "highest", "lowest", "top ", "rank",
            "percentage", "proportion")
    _PORTFOLIO = ("trials", "studies", "sponsors", "phases", "our oncology", "portfolio",
                  "recruiting vs", "vs completed", "vs. completed")
    if not _NCT_ID_RE.search(msg) and any(a in msg for a in _AGG) and any(p in msg for p in _PORTFOLIO):
        return {"intent": "aggregate_query", "filters": {}}

    # A bare count ("how many"/"count"/"number of"/"total number"/"how much"/
    # "across all") with nothing concrete to scope it by (no condition, biomarker,
    # phase, or status named) is still a portfolio-wide question the fixed tool
    # can't meaningfully answer -- fall through to text-to-SQL for that case only.
    _COUNT_ONLY = ("how many", "count", "number of", "total number", "how much", "across all")
    _CONCRETE_SCOPE_TERMS = ("nsclc", "lung", "kras", "egfr", "alk", "ros1",
                             "phase 1", "phase 2", "phase 3", "phase 4",
                             "recruiting", "completed", "terminated", "withdrawn",
                             "suspended", "not yet recruiting")
    if (not _NCT_ID_RE.search(msg) and any(a in msg for a in _COUNT_ONLY)
            and any(p in msg for p in _PORTFOLIO)
            and not any(s in msg for s in _CONCRETE_SCOPE_TERMS)):
        return {"intent": "aggregate_query", "filters": {}}

    # Explicit "compare ... arms" is the one case where a named trial should still go
    # to arm comparison rather than full detail, so check it first. Require "arm" to be
    # named explicitly -- a bare "X vs Y" (e.g. "recruiting vs completed") is NOT an arm
    # comparison and must not be grabbed here.
    if any(w in msg for w in ["compare", "vs", "versus"]) and "arm" in msg:
        # Extract any descriptive filters (condition/phase/status) so the router can
        # resolve WHICH trial to compare when no NCT id or active trial is present.
        _af = {}
        if "nsclc" in msg or "lung" in msg:
            _af["condition"] = ["lung"]
        if "phase 3" in msg:
            _af["phase"] = ["Phase 3"]
        elif "phase 2" in msg:
            _af["phase"] = ["Phase 2"]
        elif "phase 1" in msg:
            _af["phase"] = ["Phase 1"]
        if "recruiting" in msg:
            _af["study_status"] = ["Recruiting"]
        return {"intent": "arm_comparison", "filters": _af, "resolved_oncosuite_id": resolved_oncosuite_id,
                "resolved_arm_ids": resolved_arm_ids}

    # An explicit NCT id means the user is asking about ONE specific trial. Route it to
    # the full trial-detail view (which now carries endpoints, outcomes, hazard ratios,
    # adverse events, safety, population, contacts, ranking, summary). This must beat the
    # generic keyword rules below ("outcome", "survival", "what is", ...) -- otherwise a
    # question like "what are the outcomes for NCT03706690" gets routed to a different
    # tool / rejected as out-of-scope purely because of a keyword, ignoring the NCT id.
    m = _NCT_ID_RE.search(msg)
    if m:
        return {"intent": "single_trial_lookup", "filters": {"nct_id": m.group(0).upper()}}

    # A user may paste the INTERNAL oncosuite_id (e.g. "00v-vw5-Ejz") instead of an NCT
    # number. It has a distinctive 3-3-3 alphanumeric-with-hyphens shape. Detect it on
    # the ORIGINAL message (case-sensitive -- ids are mixed-case) and route straight to
    # the trial detail. dispatch resolves + tells the user the linked NCT id.
    _onco = _ONCOSUITE_ID_RE.search(user_message)
    if _onco:
        return {"intent": "single_trial_lookup",
                "filters": {"oncosuite_id": _onco.group(1)},
                "resolved_oncosuite_id": _onco.group(1)}

    # FOLLOW-UP RESOLUTION: no new NCT id was named, but a trial is already active in
    # this session. If the question is about a single-trial attribute (eligibility,
    # exclusion/inclusion, endpoints, safety, locations, sponsor, ...) or refers back
    # with "this"/"it"/"that trial", answer it against the active trial -- the way any
    # chat assistant carries context across turns. Without this, "what is the exclusion
    # criteria for this" (right after asking about NCT06793215) fell through to the
    # generic "what is" rule and was wrongly rejected as out_of_scope.
    # This must NOT fire for questions that are clearly about MANY trials or are
    # comparative/analytic ("safety signals across immunotherapy vs chemo trials",
    # "which trials look similar to ...", "fraction of trials ..."). Those are new
    # portfolio questions, not a follow-up about the one active trial -- treating them
    # as single-trial lookups was the bug that answered them about NCT06793215 only.
    _MULTI_TRIAL_SIGNALS = (
        "trials", "studies", "across", "compare", "comparison", "versus", " vs ",
        "more often", "less often", "than ", "similar to", "most similar", "fraction of",
        "proportion of", "percentage of", "which trials", "any trials", "all trials",
        "each ", "every ", "list ", "rank", "how many", "average", "median", "distribution",
        "landscape", "other trials", "between trials",
    )
    if resolved_oncosuite_id and not any(w in msg for w in _MULTI_TRIAL_SIGNALS):
        _TRIAL_ATTR_WORDS = (
            "eligib", "criteria", "inclusion", "exclusion", "who can join", "enrollment",
            "endpoint", "outcome", "efficacy", "hazard", "survival", "orr", "pfs", "os ",
            "response rate", "adverse", "side effect", "toxicity", "safety",
            "population", "demographic", "baseline",
            "sponsor", "phase", "status", "recruiting", "start date", "completion",
            "design", "location", "where", "site", "countr", "contact", "email", "phone",
            "ranking", "score", "arm", "dose", "dosage", "treatment", "drug", "biomarker",
            "histology", "cohort", "summary", "overview",
        )
        _REFERS_BACK = (
            "this", "that", "it", "its", "the trial", "this trial", "that trial",
            "same trial", "above",
        )
        if any(w in msg for w in _TRIAL_ATTR_WORDS) or any(w in msg for w in _REFERS_BACK):
            return {"intent": "single_trial_lookup", "filters": {},
                    "resolved_oncosuite_id": resolved_oncosuite_id}

    if any(w in msg for w in ["landscape", "trend", "how many trials", "competitive"]):
        filters = {}
        # "for X", "in X", "on X" all name the drug/target/modality being asked
        # about ("how many trials FOR kras", "... IN adc", "... ON pd-l1"), not
        # just "for X" -- "in X" was previously missed entirely, so "how many
        # trials in adc" fell through with an empty filter and landscaped the
        # WHOLE unfiltered database instead of scoping to ADC.
        m = re.search(r"\b(?:for|in|on)\s+([a-z0-9\- ]+?)(?:\s+trials?\b|\s+studies\b|$)", msg)
        if m:
            filters["target_or_moa"] = [m.group(1).strip().upper()]
        return {"intent": "landscape_or_trend", "filters": filters}

    if any(w in msg for w in ["orr", "pfs", "os ", "survival", "response rate", "outcome"]):
        return {"intent": "outcome_deep_dive", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id}

    if any(w in msg for w in ["what does", "what is", "define", "mechanism of"]) and "trial" not in msg:
        return {"intent": "out_of_scope", "filters": {}}

    filters = {}
    if "nsclc" in msg or "lung" in msg:
        filters["condition"] = ["NSCLC"]
    known_biomarkers = ["kras", "egfr", "alk", "ros1"]
    for bm in known_biomarkers:
        if bm in msg:
            filters.setdefault("biomarkers", []).append(bm.upper())
    if "biomarkers" not in filters:
        # naive fallback: "trials for <term>" with an unrecognized term -- pass it through
        # as a literal biomarker filter so the vocab layer's unmatched-term path actually
        # gets exercised, rather than silently dropping terms the keyword list doesn't know.
        m = re.search(r"trials? for ([a-z0-9\-]+)", msg)
        if m and m.group(1) not in known_biomarkers:
            filters["biomarkers"] = [m.group(1)]
    if "phase 3" in msg:
        filters["phase"] = ["Phase 3"]
    if "recruiting" in msg:
        filters["study_status"] = ["Recruiting"]
    requested_cols = detect_requested_columns(user_message, TRIAL_COLUMNS)
    if requested_cols:
        filters["columns"] = requested_cols

    return {"intent": "filtered_search", "filters": filters, "resolved_oncosuite_id": resolved_oncosuite_id}


def should_escalate(intent, tool_result, unmatched_terms):
    """Deterministic escalation logic -- real code, per Doc 05, in priority order."""
    if unmatched_terms:
        return False
    if intent in ALWAYS_ESCALATE_INTENTS:
        return True
    if intent in RESULT_SIZE_CHECK_INTENTS:
        if _count_distinct_trials(tool_result) > RESULT_SIZE_THRESHOLD:
            return True
    return False


def _count_distinct_trials(tool_result):
    if isinstance(tool_result, dict) and "results" in tool_result:
        return len({r["oncosuite_id"] for r in tool_result["results"]})
    return 0


_sessions = SessionStore()


def _text_to_sql_response(user_message):
    """Fallback: let the LLM write SQL for questions the hardcoded rules don't cover
    (aggregates, groupings, ad-hoc filters, ...). Returns a response dict in the same
    shape handle_turn uses, with response_mode 'text_to_sql', or None if the fallback
    couldn't produce a usable answer (so the caller keeps the original behavior)."""
    try:
        import text_to_sql
    except Exception:
        return None
    result = text_to_sql.run(user_message)
    if result.get("status") == "answered":
        return {
            "intent": "text_to_sql", "tool_name": "text_to_sql", "escalate": True,
            "response_mode": "text_to_sql",
            "tool_result": {"rows": result.get("rows") or [], "sql": result.get("sql")},
            "synthesis": {"text": result.get("answer") or "", "mode": "llm"}
                          if result.get("answer") else None,
            "sql": result.get("sql"),
            "ts_status": result.get("status"),
        }
    # declined / no_data / unavailable / invalid_sql -> let caller fall back
    return None


def _vector_search_response(user_message):
    """RAG fallback: when the keyword tools and text-to-SQL can't answer, run a
    SEMANTIC search over the embedded trials (vector_store, which includes the
    ingested CSV corpus) and let the LLM summarise the retrieved snippets, grounded
    ONLY in them. Returns a response dict in handle_turn's shape, or None if the
    index is empty / embeddings unavailable / nothing relevant was retrieved.

    This sits BETWEEN text-to-SQL and general-knowledge: it still answers from YOUR
    data (the embedded trials), just by meaning rather than exact SQL, before we
    ever fall back to the model's own general knowledge."""
    import config
    import llm_client
    try:
        import vector_store
    except Exception:
        return None
    if not llm_client.available():
        return None

    vec = vector_store.search(user_message)
    if vec.get("status") != "ok" or not vec.get("results"):
        return None

    # Only treat it as a real semantic hit if the top match is reasonably similar;
    # a low top score means nothing in the corpus is actually relevant, so let the
    # caller fall through to general knowledge rather than summarising noise.
    top = vec["results"][0].get("score", 0)
    if top < 0.35:
        return None

    snippets = "\n\n".join(
        f"[{r['ref_id']}] {r['snippet']}" for r in vec["results"]
    )
    grounding = (
        "You are a clinical-trials assistant. A semantic search over the trial "
        "database returned these snippets. Answer the user's question grounded ONLY "
        "in them -- do not invent data. If they don't actually answer it, say so.\n\n"
        + config.ANSWER_FORMAT_CONTRACT +
        f"\n\nRETRIEVED TRIAL SNIPPETS:\n{snippets}"
    )
    try:
        text = llm_client.chat([
            {"role": "system", "content": grounding},
            {"role": "user", "content": user_message},
        ])
    except Exception:
        return None
    if not text or not text.strip():
        return None

    return {
        "intent": "semantic_search", "tool_name": "vector_search", "escalate": True,
        "response_mode": "semantic_search",
        "tool_result": {"vector_results": vec["results"]},
        "synthesis": {"text": text, "mode": "llm"},
    }


def _try_sql_then_vector(user_message):
    """The 'try text-to-SQL, then semantic search' cascade shared by the
    aggregate_query and out_of_scope branches below: whichever answers first
    wins, or None if neither could. Each caller keeps its own final fallback
    response when this returns None."""
    ts = _text_to_sql_response(user_message)
    if ts is not None:
        return ts
    return _vector_search_response(user_message)


def _cohort_list_response(user_message, classification, on_step=None):
    """Cohort-level answer per the client's spec: 'N cohorts within M trials' + a
    table (OncoSuite ID | Indication | Regimen | Phase | Status), clickable rows,
    Key Insights, and Next Steps. Returns a response dict with
    response_mode='cohort_list', or None to fall through.

    Streams exactly 2 steps -- one per actual operation below. This used to
    announce 6 named steps (a fixed UI spec), but 3 of them ("Creating table
    structure", "Verifying source-data traceability", "Generating table") had
    no code behind them at all -- they fired back-to-back with nothing running
    in between, and "Generating key insights" fired AFTER synthesize_cohorts()
    had already finished, describing something already done rather than in
    progress. Real progress only has two moments: the DB call, and the
    (deterministic, non-LLM) insight computation from its results."""
    def step(m):
        if on_step:
            on_step(m)

    filters = dict(classification.get("filters", {}) or {})
    filters.pop("nct_id", None)
    _cohort_keys = ("drug_name_or_target", "condition", "biomarkers",
                    "line_of_therapy", "phase", "study_status", "columns")
    kwargs = {k: filters[k] for k in _cohort_keys if filters.get(k)}
    # If the classifier gave no usable filters (it's an LLM call and is
    # non-deterministic -- it sometimes labels "list all ADC cohorts" as
    # aggregate_query with filters:{}), fall back to a DETERMINISTIC scan of the
    # message for a known drug-class term. This guarantees "ADC cohorts" finds its
    # ADC filter every time instead of falling through to the all-trials list.
    if not kwargs.get("drug_name_or_target"):
        from tools.search_cohorts import extract_drug_class
        dc = extract_drug_class(user_message)
        if dc:
            kwargs["drug_name_or_target"] = dc
    if not kwargs.get("columns"):
        requested_cols = detect_requested_columns(user_message, COHORT_COLUMNS)
        if requested_cols:
            kwargs["columns"] = requested_cols
    scoping_keys = [k for k in kwargs if k != "columns"]
    if not scoping_keys:
        return None  # nothing to scope a cohort search on -> let normal cascade run

    step("Pulling relevant data from the trials")
    tr = search_cohorts(**kwargs)
    if not tr.get("results"):
        return None
    step("Generating key insights")
    from synthesis import synthesize_cohorts
    synthesis = synthesize_cohorts(user_message, tr)

    return {
        "intent": "filtered_search", "tool_name": "search_cohorts",
        "escalate": False, "response_mode": "cohort_list",
        "tool_result": tr, "synthesis": synthesis,
        "filters_extracted": True,
    }


# Rows fetched by the FIRST query, only to learn total_matches cheaply before
# deciding whether a second, unlimited fetch is needed -- not a cap on what the
# user sees. Nobody wants to ask "show more" in a new chat turn just to see
# the rest of what they already asked for, and search_trials' own COUNT query
# (and the pre-existing CSV-export fetch this replaces) already proves fetching
# every matching row in one go is cheap enough.
_INITIAL_FETCH = 200

_SHOW_ALL_CUES = ("show all", "show me all", "list all", "list every", "all the trials",
                  "all trials", "every trial", "full list", "entire list", "show everything")


def _full_search_response(session_id, filters, on_step=None):
    """Run search_trials with `filters`, fetching EVERY matching row (not just
    an initial sample), and return a full paginated_list response. Shared by
    the "show all" and "same search" follow-up resolvers below.
    """
    if on_step:
        on_step("Fetching matching trials from the database")
    tool_result = search_trials(**{**filters, "limit": _INITIAL_FETCH, "offset": 0})
    total = tool_result.get("total_matches", len(tool_result.get("results", [])))
    if total > len(tool_result.get("results", [])):
        # More rows exist than the first fetch sampled -- get all of them now
        # rather than making the user ask again for what they already requested.
        tool_result = search_trials(**{**filters, "limit": total, "offset": 0})
    results = tool_result.get("results", [])

    if on_step:
        on_step(f"Found {total} trials — building the table")

    _sessions.update_after_tool_call(session_id, "search_trials", tool_result)

    synthesis = _render_trial_page(results, total, filters, tool_result.get("columns"))
    _record_answer(session_id, synthesis)
    return {
        "intent": "filtered_search", "tool_name": "search_trials",
        "escalate": False, "response_mode": "paginated_list",
        "tool_result": tool_result, "synthesis": synthesis,
        "filters_extracted": bool(filters),
    }


def _paginated_search_response(session_id, user_message, lm, classification,
                               working_set, history, on_step=None):
    """Handle "show all trials": fetches and returns EVERY matching trial in
    one response. Client-side pagination (already in the UI) handles browsing
    a large result set, so there is nothing left to page through server-side.

    Returns a response dict or None to let the normal cascade handle the message.
    """
    if not any(c in lm for c in _SHOW_ALL_CUES):
        return None
    filters = dict(classification.get("filters", {}) or {})
    filters.pop("nct_id", None)
    return _full_search_response(session_id, filters, on_step)


# "\s?" between "sam" and "e" tolerates the single most common typo for this
# exact phrase -- a stray space landing mid-word ("the sam e") -- seen
# directly in a real user message. Plain "in" substring checks would have
# missed it entirely and left the follow-up unresolved.
_SAME_SEARCH_CUES = (
    r"\bthe\s+sam\s?e\b", r"\bsam\s?e\s+trials?\b", r"\bsam\s?e\s+search\b",
    r"\bsam\s?e\s+results?\b", r"\bsam\s?e\s+set\b", r"\bthose\s+trials?\b",
    r"\bthese\s+trials?\b", r"\bthat\s+search\b", r"\bsam\s?e\s+list\b",
    r"\bsam\s?e\s+filters?\b",
)


# A bare "show in map" carries no explicit back-reference word at all (no
# "same"/"those"/"these") -- it just asks to visualize whatever's already on
# screen. Seen directly: this fell through every intent gate to text-to-SQL,
# which had NO real filter to work with and copied the literal example value
# from schema_metadata.py's "country" column doc ("e.g. 'Australia'") as if it
# were an actual filter, producing a answer about 27 Australian localities
# that has nothing to do with the NSCLC search the user was just looking at.
_VISUALIZE_WORDS = r"\b(map|chart|graph|plot|visuali[sz]e)\b"


def _same_search_response(session_id, lm, classification, working_set, on_step=None):
    """Handle a follow-up that refers back to whatever this session last
    searched for instead of naming its own filter -- either explicitly
    ("show me X for the same trials", "those trials") or implicitly (a short
    "show in map"/"map it" with no new entity of its own, i.e. the classifier
    extracted nothing for THIS turn). Resolves against
    working_set['last_filters'] (the exact kwargs search_trials was called
    with -- see its own "filters_applied" return key and
    SessionStore.update_after_tool_call) and re-runs that search LIVE, rather
    than leaving the reference unresolved and falling through to
    out-of-scope/text-to-SQL.

    Returns a response dict or None to let the normal cascade handle it (no
    cue matched, or there's no prior search in this session to resolve to).
    """
    explicit = any(re.search(p, lm) for p in _SAME_SEARCH_CUES)
    implicit = (
        not (classification.get("filters") or {})
        and len(lm.split()) <= 6
        and re.search(_VISUALIZE_WORDS, lm)
    )
    if not (explicit or implicit):
        return None
    last_filters = {k: v for k, v in (working_set.get("last_filters") or {}).items() if v}
    if not last_filters:
        return None
    resp = _full_search_response(session_id, last_filters, on_step)
    # Flags this as a pure follow-up reusing an ALREADY-shown result set, so
    # answer_fast.py can skip re-rendering the full trial table + insights
    # (the user just saw that exact table) when the actual new content this
    # turn asked for is a different view of the same data, e.g. a map.
    resp["same_search_followup"] = True
    return resp


def _render_trial_page(results, total, filters, columns=None):
    """Deterministic tabular render of EVERY matching trial. No LLM needed:
    every value is copied straight from the tool result. Columns are whatever
    search_trials actually returned (column_catalog.TRIAL_COLUMNS keys) rather
    than a hardcoded set, so a query that asked for extra detail renders it."""
    if not results:
        return {"text": "**No trials matched.**\nThere are no trials for these filters.",
                "mode": "deterministic", "table_data": []}

    # Note: this text is normally wrapped by answer_fast.py's own intro +
    # Key Insights blocks (built from the same tool_result) before the user
    # sees it, so it doesn't need to repeat that framing itself -- this
    # header just needs to hold up on its own if ever shown standalone.
    scope = " (filtered)" if filters else ""
    header = f"**Every matching trial{scope}: {total} total**"
    from column_catalog import trial_markdown_table
    keys = list(columns or [])
    # "reported_outcomes" only exists when the search was filtered by
    # search_trials' reported_outcomes param (e.g. "have OS/ORR/PFS reported")
    # -- shown as its own column so it's visible WHICH of the requested
    # metrics each row actually has, not just that the search was narrowed.
    if any(r.get("reported_outcomes") for r in results) and "reported_outcomes" not in keys:
        keys.append("reported_outcomes")
    lines = [header, ""] + trial_markdown_table(results, keys)
    lines.append("")
    lines.append(f"_All {total} matching trial(s)._")

    return {"text": "\n".join(lines), "mode": "deterministic",
            "table_data": results, "full_rows": results}


def _record_answer(session_id, synthesis):
    """Store the assistant's answer text in the transcript so the NEXT turn's
    synthesize() call can see it for follow-up / cross-questioning."""
    if isinstance(synthesis, dict):
        text = synthesis.get("text")
        if text:
            conversations.add_assistant(session_id, text)


def handle_turn(session_id: str, user_message: str, on_step=None,
                skip_synthesis: bool = False) -> dict:
    """on_step: optional callback(str) invoked with a human-readable status at each
    real stage (classify -> route -> query -> synthesize). Used by the SSE endpoint
    to STREAM the actual background steps to the UI, like Claude does. Default None
    keeps the plain blocking behaviour for /ask and the eval harness.

    skip_synthesis: skip the final "write the answer" LLM call and return the raw
    tool_result only. That call is by far the slowest stage -- it feeds the whole
    result set into a prompt and asks for prose -- so the chart-first path
    (answer_fast.py) sets this and renders the data itself. Default False keeps
    the existing behaviour for every current caller."""
    def _step(msg):
        if on_step:
            try:
                on_step(msg)
            except Exception:
                pass  # a broken client stream must never break answering

    working_set = _sessions.get(session_id)

    # Conversation transcript for follow-up / cross-questioning. Snapshot the
    # history BEFORE this turn (so synthesize sees prior turns, not the current
    # question echoed back), then record this user turn. The produced answer is
    # recorded at the end so the next turn can refer to it.
    _history = conversations.history(session_id)
    conversations.add_user(session_id, user_message)
    _step("Understanding your question")

    # EXPLICIT TRIAL ID OVERRIDE (runs before classification/RAG/landscape): a pasted
    # NCT number OR an internal oncosuite id (3-3-3 alphanumeric, e.g. "00v-vw5-Ejz")
    # is an unambiguous single-trial request. Handle it directly so it never gets
    # swallowed by the conceptual-RAG gate or a fuzzy LLM classification.
    _nct = _NCT_ID_RE.search(user_message)
    _onco = _ONCOSUITE_ID_RE.search(user_message)
    if _nct or _onco:
        _step("Detected a trial ID — looking it up directly")
        _cls = {"intent": "single_trial_lookup",
                "filters": ({"nct_id": _nct.group(0).upper()} if _nct
                            else {"oncosuite_id": _onco.group(1)})}
        tool_name, tool_result = _dispatch_tool(_cls, working_set)
        if not (isinstance(tool_result, dict) and tool_result.get("error")
                and not tool_result.get("oncosuite_id")):
            _sessions.update_after_tool_call(session_id, tool_name, tool_result)
            _step("Found the trial — writing the answer")
            from synthesis import synthesize
            synthesis = synthesize(user_message, "single_trial_lookup", tool_name,
                                   tool_result, history=_history)
            _record_answer(session_id, synthesis)
            return {"intent": "single_trial_lookup", "tool_name": tool_name,
                    "escalate": True, "response_mode": "strong_model_synthesis",
                    "tool_result": tool_result, "synthesis": synthesis}
        # unresolved id -> return the friendly error dict for the UI to render
        return {"intent": "single_trial_lookup", "tool_name": tool_name,
                "escalate": False, "response_mode": "strong_model_synthesis",
                "tool_result": tool_result, "synthesis": None}

    classification = classify_and_extract(user_message, working_set)
    intent = classification["intent"]
    _step(f"Classified your question as a {intent.replace('_', ' ')}")

    # GUARDRAIL: honor sponsor exclusions ("not interested in academia"). Inject the
    # exclusion into the filters so it flows into search_trials/landscape via dispatch.
    _excl = detect_sponsor_exclusion(user_message)
    if _excl:
        classification.setdefault("filters", {})["exclude_sponsor_type"] = _excl

    # Same pattern: "trials that have OS/ORR/PFS reported" has no filter of its
    # own in the classifier's vocabulary and was silently dropped -- inject it
    # so it flows into search_trials via _dispatch_tool/_paginated_search_response.
    _reported = detect_reported_outcomes(user_message)
    if _reported:
        classification.setdefault("filters", {})["reported_outcomes"] = _reported

    _lm = user_message.lower()

    # COHORT-LEVEL view (per the client's spec drawing): when the user asks for
    # cohorts, or for a trial list "including their endpoints" / a breakdown, answer
    # at the COHORT grain -- one row per cohort with Indication | Regimen | Phase |
    # Status and a "N cohorts within M trials" count line -- instead of the plain
    # trial list. Only fires when cohorts/endpoints are IMPLIED so a bare
    # "show me ADC trials" keeps the existing trial list. Runs BEFORE the show-all
    # pagination gate so "list all ADC cohorts" isn't grabbed as a trial page.
    _COHORT_CUES = ("cohort", "cohorts", "including their endpoint", "with endpoint",
                    "and their endpoint", "endpoints", "by indication", "regimen")
    # Fire on cohort cues regardless of the exact classified intent -- "list all
    # ADC cohorts" can land as filtered_search OR aggregate_query depending on LLM
    # nondeterminism; both should give the cohort table. Excludes only clearly
    # unrelated intents (single-trial, arm comparison). _cohort_list_response
    # returns None if it can't extract usable filters, so we fall through safely.
    if any(c in _lm for c in _COHORT_CUES) and intent not in (
            "single_trial_lookup", "arm_comparison"):
        _co = _cohort_list_response(user_message, classification, _step)
        if _co is not None:
            _record_answer(session_id, _co.get("synthesis"))
            return _co

    # SHOW-ALL. "show me all the trials" / "list every trial" fetches and
    # returns EVERY matching trial in one response -- no "show more" follow-up
    # needed, client-side pagination handles browsing. Runs before the
    # aggregate/RAG gates so a bare "show all trials" isn't grabbed as a
    # no-filter question and dropped to SQL/RAG.
    _pg = _paginated_search_response(session_id, user_message, _lm, classification,
                                     working_set, _history, _step)
    if _pg is not None:
        return _pg

    # SAME-SEARCH FOLLOW-UP. "show me a map for the same [trials]" names no
    # filter of its own -- without this it falls through every intent gate
    # unresolved and dead-ends as out-of-scope, even though the session
    # already has a search to refer back to. Checked here (same priority as
    # show-all) so it resolves before the aggregate/RAG gates would otherwise
    # grab it as a no-filter question.
    _ss = _same_search_response(session_id, _lm, classification, working_set, _step)
    if _ss is not None:
        return _ss

    # LANDSCAPE / PORTFOLIO questions -> get_competitive_landscape (the tool that
    # produces the drug + phase breakdown CHARTS). This must run BEFORE the conceptual
    # RAG gate, otherwise "how are EGFR NSCLC cases related to active trials from
    # corporate sponsors" gets grabbed by RAG (no charts). Trigger on landscape framing:
    # relating a population/market to trials, or asking about trials by sponsor type.
    _LANDSCAPE_CUES = (
        "landscape", "competitive", "pipeline", "trend", "how many trials",
        "related to currently active trials", "related to active trials",
        "related to trials", "relate to trials", "trials from corporate",
        "corporate sponsor", "industry sponsor", "corporate-sponsored",
        "industry-sponsored", "by sponsor", "by phase", "by drug",
        "development activity", "where is industry", "who is developing",
    )
    _is_landscape = any(c in _lm for c in _LANDSCAPE_CUES) and not _NCT_ID_RE.search(_lm)
    if _is_landscape and intent not in ("single_trial_lookup", "arm_comparison"):
        _step("Building the competitive landscape (drug × phase breakdown)")
        filters = classification.get("filters", {}) or {}
        # infer condition from the message if the classifier didn't extract one
        cond = filters.get("condition")
        if not cond:
            if "nsclc" in _lm or "lung" in _lm:
                cond = ["lung"]
        group_by = ["drug_name", "phase"]
        # `target_or_moa` is only populated when the classifier itself picked
        # "landscape_or_trend" (llm_classifier.classify's own key-rename for
        # that intent). This block also fires for OTHER intents purely on
        # landscape-cue keywords ("how many trials" -> often filtered_search,
        # per the classifier's own bare-count rule) -- those carry the same
        # drug/target/modality term under "drug_name_or_target" instead, so
        # fall back to it or a real filter like ADC silently becomes "no
        # filter" and landscapes the whole unfiltered database.
        target_or_moa = filters.get("target_or_moa") or filters.get("drug_name_or_target")
        ls = get_competitive_landscape(
            group_by=group_by,
            condition=cond,
            target_or_moa=target_or_moa,
            exclude_sponsor_type=filters.get("exclude_sponsor_type"),
        )
        if ls and ls.get("groups"):
            from synthesis import synthesize
            synthesis = synthesize(user_message, "landscape_or_trend",
                                   "get_competitive_landscape", ls, history=_history)
            _record_answer(session_id, synthesis)
            return {"intent": "landscape_or_trend", "tool_name": "get_competitive_landscape",
                    "escalate": True, "response_mode": "strong_model_synthesis",
                    "tool_result": ls, "synthesis": synthesis,
                    "filters_extracted": bool(cond or filters)}
        # no landscape data -> fall through to the normal cascade

    # CONCEPTUAL / MEANING-BASED questions -> try semantic (RAG) search FIRST, before
    # text-to-SQL. Phrasings like "trials about/exploring/related to X", "studies on a
    # <approach>", "research into Y" describe a concept with no exact column to filter
    # on -- SQL would either force a wrong keyword match or return a weak "no rows".
    # We gate this narrowly: only fire when the question is clearly conceptual AND NOT
    # an exact-lookup (NCT id) or an aggregate/count (which genuinely need SQL math).
    _CONCEPTUAL_CUES = (
        "about ", "exploring", "explore", "related to", "regarding", "approach",
        "approaches", "strategy", "strategies", "mechanism", "novel ", "ways to",
        "focused on", "focusing on", "aimed at", "targeting the", "research into",
        "research on", "studies on", "concept of", "similar to", "like the",
    )
    _EXACT_OR_AGG_CUES = (
        "how many", "count", "number of", "average", "avg", "median", "total",
        "per ", "group by", "breakdown", "distribution", "phase 1", "phase 2",
        "phase 3", "phase 4", "recruiting", "completed",
    )
    _is_conceptual = (
        any(c in _lm for c in _CONCEPTUAL_CUES)
        and not _NCT_ID_RE.search(_lm)
        and not any(c in _lm for c in _EXACT_OR_AGG_CUES)
    )
    if _is_conceptual:
        vs = _vector_search_response(user_message)
        if vs is not None:
            return vs
        # no confident semantic hit -> fall through to the normal SQL-first cascade

    # MULTI-STEP questions -> LangGraph agent. These chain two or more operations
    # ("find trials like X THEN compare their arms", "search ... and detail the
    # largest") that no single tool can answer. The agent loops search/detail/
    # compare tools until it can answer. We gate narrowly: require a chaining cue
    # AND a second action verb, so ordinary one-shot questions stay on the fast
    # path. If the agent yields nothing usable, fall through to the normal cascade.
    _CHAIN_CUES = (" then ", " and then ", "after that", "followed by",
                   "and compare", "and detail", "and then compare", "similar to",
                   "and rank", "and find", "for each of")
    _ACTION_VERBS = ("compare", "detail", "rank", "find", "search", "list", "similar")
    _is_multistep = (
        any(c in _lm for c in _CHAIN_CUES)
        and sum(1 for v in _ACTION_VERBS if v in _lm) >= 2
    )
    if _is_multistep:
        try:
            import agent_graph
            ag = agent_graph.run_agent(user_message)
        except Exception:
            ag = None
        if ag is not None:
            return ag
        # agent couldn't produce a usable answer -> continue with normal cascade

    # Portfolio-level aggregate -> text-to-SQL (counts/groupings/breakdowns the fixed
    # tools can't do). If the fallback can't answer, fall through to out-of-scope.
    if intent == "aggregate_query":
        resp = _try_sql_then_vector(user_message)
        if resp is not None:
            return resp
        return {
            "intent": intent, "escalate": False,
            "response_mode": "out_of_scope_policy_needed",
            "note": "I couldn't derive that breakdown from the available data.",
        }

    if intent == "out_of_scope":
        # Before rejecting, try the text-to-SQL fallback -- the data may well be in the
        # DB even though no hardcoded rule matched the phrasing.
        resp = _try_sql_then_vector(user_message)
        if resp is not None:
            return resp
        return {
            "intent": intent,
            "escalate": False,
            "response_mode": "out_of_scope_policy_needed",
            "note": "Doc 05 flags this as a product decision, not resolved here.",
        }

    _step("Searching the trial database")
    tool_name, tool_result = _dispatch_tool(classification, working_set)
    unmatched_terms = tool_result.get("unmatched_terms", []) if isinstance(tool_result, dict) else []
    if isinstance(tool_result, dict) and "total_matches" in tool_result:
        _step(f"Found {tool_result['total_matches']} matching trial(s)")

    # Route to text-to-SQL when the fixed search tool can't actually answer the question:
    #  (a) it extracted NO real filters (classifier didn't understand it), or
    #  (b) the question asks for an aggregate/analytic the search tool can't compute
    #      ("average enrollment", "count by sponsor", "most/least", "compare", ...).
    #      search_trials only returns a list of trials -- it can't average/group/rank.
    #
    # A BARE count word ("how many"/"count"/"number of"/"total number") is handled
    # separately from true aggregation: when real filters exist, search_trials's own
    # total_matches already answers "how many" -- and unlike a raw `SELECT COUNT(*)`,
    # the tool_result already fetched above ALSO carries the actual matching trials,
    # so the answer gets a real table + insights instead of a bare number with no way
    # to see what was counted. Only escalate a bare count to SQL when there's nothing
    # concrete to count (no filters at all).
    from llm_classifier import _TRUE_AGG_WORDS

    _filters = classification.get("filters", {})
    _msg = user_message.lower()
    _COUNT_WORDS = ("how many", "count", "number of", "total number")
    _has_filters = any(v for v in _filters.values())
    _wants_true_aggregate = any(w in _msg for w in _TRUE_AGG_WORDS)
    _wants_bare_count = any(w in _msg for w in _COUNT_WORDS)
    _wants_aggregate = _wants_true_aggregate or (_wants_bare_count and not _has_filters)
    if intent == "filtered_search" and (not _has_filters or _wants_aggregate):
        _step("Translating your question into a database query")
        ts = _text_to_sql_response(user_message)
        if ts is not None:
            return ts
        # SQL declined a no-filter / conceptual question -> try semantic/RAG search
        # over the embedded trials before giving up on the structured search result.
        if not _wants_aggregate:  # aggregates need SQL math, not snippet retrieval
            _step("Running a semantic search over the trials")
            vs = _vector_search_response(user_message)
            if vs is not None:
                return vs

    if unmatched_terms:
        return {
            "intent": intent, "escalate": False, "response_mode": "clarification_needed",
            "unmatched_terms": unmatched_terms, "tool_name": tool_name,
        }

    escalate = should_escalate(intent, tool_result, unmatched_terms)
    _sessions.update_after_tool_call(session_id, tool_name, tool_result)

    filters = classification.get("filters", {})
    filters_extracted = bool(filters and any(v for v in filters.values()))

    synthesis = None
    if escalate and not skip_synthesis:
        # NOTE: tool_result here comes ONLY from _dispatch_tool (the 8 real tools).
        # text_to_sql.py's LLM-written SQL path is a completely separate branch in
        # hybrid.py and never reaches this line -- see synthesis.py's module
        # docstring for the enforced invariant.
        _step("Writing the answer")
        from synthesis import synthesize
        synthesis = synthesize(user_message, intent, tool_name, tool_result,
                               history=_history)
        _record_answer(session_id, synthesis)

    return {
        "intent": intent, "tool_name": tool_name, "tool_result": tool_result,
        "escalate": escalate,
        "response_mode": "strong_model_synthesis" if escalate else "cheap_model_format",
        "filters_extracted": filters_extracted,
        "synthesis": synthesis,
    }


_EXCLUDE_ACADEMIA_CUES = (
    "not interested in academ", "no academ", "not academ", "exclude academ",
    "not university", "no university", "not hospital", "no hospital",
    "not institut", "no institut", "corporate sponsor", "industry sponsor",
    "industry only", "only industry", "not academia", "excluding academ",
    "not interested in academia", "not academic", "commercial sponsor",
)


def detect_sponsor_exclusion(user_message: str):
    """Return 'academic' if the user asked to exclude academic/non-industry sponsors
    (e.g. 'not interested in academia', 'corporate sponsors only'), else None."""
    m = (user_message or "").lower()
    return "academic" if any(cue in m for cue in _EXCLUDE_ACADEMIA_CUES) else None


# classify_and_extract's filter vocabulary (condition/biomarkers/phase/...) has
# no concept of "has a posted outcome value" -- so a clause like "that have OS,
# ORR, PFS reported" was silently dropped entirely, returning the exact same
# unfiltered result as a bare condition search (seen directly: identical
# 1,296-trial count with or without the clause). Injected the same way
# detect_sponsor_exclusion is, right after classification.
_OUTCOME_METRIC_ALIASES = {
    "os": "OS", "overall survival": "OS",
    "orr": "ORR", "objective response rate": "ORR",
    "pfs": "PFS", "progression free survival": "PFS", "progression-free survival": "PFS",
}
_REPORTED_OUTCOME_CUES = ("report", "posted", "available", "with data", "has data")


def detect_reported_outcomes(user_message: str):
    """List of endpoint abbreviations (e.g. ["OS", "ORR", "PFS"]) the user wants
    restricted to an actually-POSTED value for, or None. Requires BOTH a
    "reported/posted/available" cue AND at least one named metric -- a bare
    "PFS" mention alone (asking about PFS results generally, not filtering by
    whether it was reported) isn't enough to imply this specific hard filter."""
    m = (user_message or "").lower()
    if not any(cue in m for cue in _REPORTED_OUTCOME_CUES):
        return None
    found = []
    for alias, metric in _OUTCOME_METRIC_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", m) and metric not in found:
            found.append(metric)
    return found or None


def _dispatch_tool(classification, working_set):
    intent = classification["intent"]
    filters = classification.get("filters", {})
    oncosuite_id = classification.get("resolved_oncosuite_id")
    arm_ids = classification.get("resolved_arm_ids")

    if intent == "filtered_search":
        return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

    if intent == "single_trial_lookup":
        from db import query
        nct_id = filters.get("nct_id")
        onco = filters.get("oncosuite_id") or oncosuite_id
        if nct_id:
            rows = query(
                "SELECT oncosuite_id FROM oncosuite_gold.source_mapping "
                "WHERE source_name = 'clinicaltrials.gov' AND source_unique_id = %(nct)s",
                {"nct": nct_id},
            )
            if rows:
                return "get_trial_detail", get_trial_detail(rows[0]["oncosuite_id"])
            return "get_trial_detail", {"error": f"no trial found for NCT id {nct_id}"}
        if onco:
            # User gave an INTERNAL oncosuite id. Confirm it exists, look up the linked
            # NCT id, and attach an id_note so the answer can tell the user what they
            # gave and which public NCT it maps to (per product requirement).
            exists = query("SELECT 1 FROM oncosuite_gold.trial_info WHERE oncosuite_id = %(id)s",
                           {"id": onco})
            if not exists:
                return "get_trial_detail", {
                    "error": (f"'{onco}' is not a trial id I recognise. It looks like an "
                              "internal OncoSuite id but no trial matches it. Please check "
                              "the id, or give the NCT number.")}
            nct_rows = query(
                "SELECT source_unique_id FROM oncosuite_gold.source_mapping "
                "WHERE oncosuite_id = %(id)s AND source_name = 'clinicaltrials.gov'",
                {"id": onco},
            )
            linked_nct = nct_rows[0]["source_unique_id"] if nct_rows else None
            detail = get_trial_detail(onco)
            if isinstance(detail, dict):
                detail["id_note"] = (
                    f"You gave the internal OncoSuite id **{onco}**"
                    + (f", which maps to **{linked_nct}** on ClinicalTrials.gov. "
                       if linked_nct else " (no linked ClinicalTrials.gov id on record). ")
                    + "Here is what you asked for:"
                )
                detail["nct_id"] = linked_nct
            return "get_trial_detail", detail
        return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

    if intent == "arm_comparison":
        from db import query as _q

        def _resolve_arms_and_compare(onco_id):
            resolved_arms = _q(
                "SELECT a.arm_id FROM oncosuite_gold.arms_info a "
                "JOIN oncosuite_gold.cohort_info c ON c.cohort_id = a.cohort_id "
                "WHERE c.oncosuite_id = %(id)s",
                {"id": onco_id},
            )
            aids = [r["arm_id"] for r in resolved_arms]
            if aids:
                return "compare_arms", compare_arms(onco_id, aids)
            return "compare_arms", {"error": f"trial {onco_id} has no arms recorded to compare"}

        # 1. Already have an explicit trial + arms from session context -> use them.
        if oncosuite_id and arm_ids:
            return "compare_arms", compare_arms(oncosuite_id, arm_ids)

        # 2. A trial is active but arms weren't captured -> pull that trial's arms.
        if oncosuite_id and not arm_ids:
            return _resolve_arms_and_compare(oncosuite_id)

        # 3. No trial in session, but the user DESCRIBED one ("the Phase 3 lung
        #    cancer trial"). Resolve it from the extracted filters via search.
        if filters:
            found = search_trials(
                condition=filters.get("condition"),
                biomarkers=filters.get("biomarkers"),
                cancer_stage=filters.get("cancer_stage"),
                line_of_therapy=filters.get("line_of_therapy"),
                prior_therapy=filters.get("prior_therapy"),
                drug_name_or_target=filters.get("drug_name_or_target"),
                phase=filters.get("phase"),
                study_status=filters.get("study_status"),
                sponsor=filters.get("sponsor"),
                limit=10,
            )
            results = found.get("results", [])
            total = found.get("total_matches", 0)

            if total == 1 or len(results) == 1:
                return _resolve_arms_and_compare(results[0]["oncosuite_id"])

            if total > 1:
                # Ambiguous -> ask the user to pick, listing a few candidates.
                return "compare_arms", {
                    "error": "ambiguous_trial",
                    "message": (
                        f"{total} trials match that description. Name a specific trial "
                        "(NCT id) to compare its arms. For example:"
                    ),
                    "candidates": [
                        {"nct_id": r.get("nct_id"), "oncosuite_id": r["oncosuite_id"],
                         "title": r.get("title"), "phase": r.get("phase")}
                        for r in results
                    ],
                    "total_matches": total,
                }

            # total == 0
            return "compare_arms", {
                "error": "no_trial_matched",
                "message": "No trial matched that description, so there are no arms to compare.",
            }

        # 4. Nothing to go on at all.
        return "compare_arms", {
            "error": "could not resolve trial/arms",
            "message": ("Name a specific trial (NCT id), or look up a trial first, "
                        "then ask to compare its arms."),
        }

    if intent == "landscape_or_trend":
        group_by = filters.get("group_by", ["drug_name", "phase"])
        return "get_competitive_landscape", get_competitive_landscape(
            group_by=group_by,
            condition=filters.get("condition"),
            target_or_moa=filters.get("target_or_moa"),
            outcome_metric=filters.get("outcome_metric"),
            exclude_sponsor_type=filters.get("exclude_sponsor_type"),
        )

    if intent == "outcome_deep_dive":
        if oncosuite_id:
            return "get_endpoints_and_outcomes", get_endpoints_and_outcomes(oncosuite_id)
        return "get_endpoints_and_outcomes", {"error": "could not resolve trial from session context"}

    return "unknown", {"error": f"unhandled intent: {intent}"}