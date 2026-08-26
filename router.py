

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
    # SPONSOR. This fallback previously extracted no sponsor at all, so
    # "trials whose sponsor is Merck Sharp & Dohme LLC" searched the WHOLE
    # database -- the constraint was silently dropped and the answer looked
    # confidently wrong. Matched against the real sponsor_name values rather
    # than a pattern, so any spelling the data actually uses is found.
    _sponsors = _sponsors_in_question(user_message)
    if _sponsors:
        filters["sponsor"] = _sponsors

    # PHASE: all four, not just Phase 3, and tolerant of "phase III" forms.
    for _label, _pats in (
        ("Phase 1", (r"\bphase\s*(1|i)\b", r"\bphase\s*one\b")),
        ("Phase 2", (r"\bphase\s*(2|ii)\b", r"\bphase\s*two\b")),
        ("Phase 3", (r"\bphase\s*(3|iii)\b", r"\bphase\s*three\b")),
        ("Phase 4", (r"\bphase\s*(4|iv)\b", r"\bphase\s*four\b")),
    ):
        if any(re.search(p, msg) for p in _pats):
            filters.setdefault("phase", []).append(_label)
    if "recruiting" in msg or "enrolling" in msg or "open" in msg:
        filters["study_status"] = ["Recruiting"]
    if "completed" in msg:
        filters.setdefault("study_status", []).append("Completed")
    requested_cols = detect_requested_columns(user_message, TRIAL_COLUMNS)
    if requested_cols:
        filters["columns"] = requested_cols

    return {"intent": "filtered_search", "filters": filters, "resolved_oncosuite_id": resolved_oncosuite_id}


_SPONSOR_CACHE = None


def _known_sponsors():
    """Distinct sponsor_name values, longest first. Cached; never raises.

    The vocabulary comes from the data because sponsor names are long, messy and
    unguessable ("ArQule, Inc., a subsidiary of Merck Sharp & Dohme LLC, ...").
    No pattern would reliably pick them out of a sentence, but comparing against
    the real values does.
    """
    global _SPONSOR_CACHE
    if _SPONSOR_CACHE is None:
        try:
            from db import query
            rows = query(
                "SELECT DISTINCT sponsor_name FROM oncosuite_gold.trial_info "
                "WHERE sponsor_name IS NOT NULL"
            )
            _SPONSOR_CACHE = sorted(
                (r["sponsor_name"] for r in rows if r["sponsor_name"]),
                key=len, reverse=True,
            )
        except Exception:
            _SPONSOR_CACHE = []
    return _SPONSOR_CACHE


def _sponsors_in_question(question):
    """Every sponsor the question plausibly names, most specific first.

    Returns a LIST rather than one guess. A bare "merck" legitimately refers to
    several distinct records -- "Merck Sharp & Dohme LLC", "Merck KGaA,
    Darmstadt, Germany" (a different company), and various subsidiaries -- so
    picking one silently answers about the wrong company. Passing them all lets
    the search match any of them, which is what the user meant.

    An exact full-name match short-circuits: if someone types "Merck Sharp &
    Dohme LLC" they mean that record and no other.
    """
    q = (question or "").lower()
    if not q:
        return []
    sponsors = _known_sponsors()

    # 1. Full name verbatim -- unambiguous, so return just that one. Longest
    #    first so the fuller name wins over a shorter one inside it.
    for name in sorted(sponsors, key=len, reverse=True):
        if name.lower() in q:
            return [name]

    # 2. Otherwise collect every sponsor whose distinctive leading words appear.
    matches = []
    for name in sponsors:
        head = re.sub(
            r"[,(].*$", "",
            re.sub(r"\b(inc|llc|ltd|limited|corp|corporation|gmbh|co|plc|ag|"
                   r"nv|bv|kgaa|pharmaceuticals?|pharma)\b\.?", "",
                   name, flags=re.IGNORECASE),
        ).strip(" .,&-")
        # A head of 3+ words, or a single word of 5+ chars. Shorter heads
        # ("Bio", "Onc", "Co") match far too much to be trusted.
        if not head or (len(head) < 5 and len(head.split()) < 2):
            continue
        if head.lower() in q:
            matches.append(name)
    # Most specific (longest) first, so a display of "matched sponsors" reads
    # sensibly.
    return sorted(set(matches), key=len, reverse=True)


def _sponsor_in_question(question):
    """Back-compat single-value form: the most specific match, or None."""
    found = _sponsors_in_question(question)
    return found[0] if found else None


def _resolve_partial_trial_id(user_message, working_set):
    """An oncosuite_id from THIS session's last results that the message refers
    to by a fragment, or None.

    Users identify a row by whatever part of it they can see: "starts with wd7",
    "the wD7 one", "wD7-VqO". None of those is a full 3-3-3 id, so the strict
    pattern misses them and the question falls through to an unfiltered search --
    which silently answers about the whole database instead of the row they
    pointed at.

    Deliberately conservative:
      * only fragments of 3+ alphanumerics are considered, so short filler words
        cannot match;
      * the fragment must match the START of exactly ONE remembered id. Two
        candidates means the reference is genuinely ambiguous, and guessing
        would answer about the wrong trial.
    """
    remembered = (working_set or {}).get("last_trials") or []
    if not remembered:
        return None
    ids = [t.get("oncosuite_id") for t in remembered if t.get("oncosuite_id")]
    if not ids:
        return None

    # Candidate fragments from the message: alphanumeric runs, plus dash-joined
    # groups so a half-typed id ("wD7-VqO") is treated as one token.
    text = str(user_message or "")
    fragments = re.findall(r"[0-9A-Za-z]{3,}(?:-[0-9A-Za-z]{3,})*", text)
    # Longest first: "wD7-VqO" is a stronger signal than "wD7".
    # Ordinary English words must never be treated as id fragments -- "the",
    # "give", "trial" would match ids by accident. An id group is 3 characters of
    # mixed case/digits, so a fragment qualifies when it is dash-joined, contains
    # a digit, OR mixes upper and lower case ("rvE", "FFi", "VqO"). That last
    # test is what lets an all-letter group work without opening the door to
    # lowercase prose.
    _WORDS = {"the", "and", "for", "give", "show", "trial", "trials", "from",
              "above", "with", "one", "specific", "which", "starts", "start",
              "oncosuite", "oid", "list", "all", "what", "that", "this", "there",
              "them", "please", "want", "need", "get", "see", "find", "about"}
    for frag in sorted(set(fragments), key=len, reverse=True):
        f = frag.lower()
        if f in _WORDS:
            continue
        # An all-lowercase fragment ("acg") is allowed too: the real protection is
        # that it must match exactly ONE remembered id, and the stop-word list
        # above removes the words that would otherwise collide. Verified against
        # ordinary questions -- none of their words appear inside a real id.
        matches = [i for i in ids if i.lower().startswith(f)]
        if len(matches) == 1:
            return matches[0]
        # Also allow a fragment appearing anywhere in the id ("VqO"), still
        # requiring a unique hit.
        if not matches:
            contained = [i for i in ids if f in i.lower()]
            if len(contained) == 1:
                return contained[0]
    return None


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

    # LEARNING -- REPLAY. If this question (or a rewording of it) was answered
    # before, run that PROVEN SQL instead of asking the model to write it again.
    # Faster, and strictly more reliable: a query that returned rows beats a
    # fresh guess. A replay that has since broken is un-learned so it is not
    # retried forever.
    try:
        import agent_learning
        learned = agent_learning.recall_query(user_message, kind="sql")
    except Exception:
        agent_learning, learned = None, None
    if learned and isinstance(learned.get("payload"), str):
        try:
            from db import query as _q
            rows = _q(learned["payload"])
            if rows:
                answer = None
                try:
                    answer = text_to_sql.answer_from_rows(
                        user_message, learned["payload"], rows)
                except Exception:
                    pass
                return {
                    "intent": "text_to_sql", "tool_name": "text_to_sql",
                    "escalate": True, "response_mode": "text_to_sql",
                    "tool_result": {"rows": rows, "sql": learned["payload"]},
                    "synthesis": ({"text": answer, "mode": "llm"} if answer
                                  else None),
                    "sql": learned["payload"],
                    "ts_status": "answered",
                    "replayed_from_memory": True,
                }
            agent_learning.forget_query(user_message, "sql")
        except Exception:
            if agent_learning:
                agent_learning.forget_query(user_message, "sql")

    result = text_to_sql.run(user_message)
    if result.get("status") == "answered":
        # LEARNING -- STORE. Only the SQL and its row count: verifiable facts,
        # never the model's prose (see agent_learning's module docstring).
        try:
            if agent_learning and result.get("sql"):
                agent_learning.remember_query(
                    user_message, "sql", result["sql"],
                    len(result.get("rows") or []))
        except Exception:
            pass
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


def _render_trial_comparison(cmp_result):
    """Markdown side-by-side comparison of two or more trials.

    Deterministic: every cell comes from compare_trials, which copies from
    get_trial_detail. The "what differs" list is the point of the answer -- a
    table alone still leaves the reader to diff two columns by eye.
    """
    trials = cmp_result.get("trials") or []
    rows = cmp_result.get("rows") or []
    if not trials or not rows:
        return {"text": "**Nothing to compare.**", "mode": "deterministic"}

    def _label(t):
        oid = t.get("oncosuite_id") or "—"
        nct = t.get("nct_id")
        return f"{oid}" + (f" ({nct})" if nct else "")

    lines = [f"**Comparing {len(trials)} trials**", ""]
    for t in trials:
        title = (t.get("title") or "").strip()
        lines.append(f"- **{_label(t)}**" + (f" — {title}" if title else ""))
    lines.append("")

    header = "| Field | " + " | ".join(_label(t) for t in trials) + " |"
    lines.append(header)
    lines.append("|" + "---|" * (len(trials) + 1))
    for row in rows:
        lines.append(f"| {row['label']} | " + " | ".join(row["values"]) + " |")

    diffs = cmp_result.get("differences") or []
    if diffs:
        lines += ["", "**Where they differ**", ""]
        lines += [f"- {d}" for d in diffs]

    shared = cmp_result.get("shared_countries") or []
    if shared:
        lines += ["", f"**Countries in common ({len(shared)})**: "
                      + ", ".join(shared[:12])
                      + (" …" if len(shared) > 12 else "")]

    unresolved = cmp_result.get("unresolved") or []
    if unresolved:
        lines += ["", "_Not included (id not recognised): "
                      + ", ".join(unresolved) + "._"]

    return {"text": "\n".join(lines), "mode": "deterministic"}


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


#: Prefixed to every model-generated answer so a user can never mistake it for a
#: figure that came out of the trial database.
GENERAL_KNOWLEDGE_DISCLAIMER = (
    "**Note:** I couldn't find this in the trial database or any connected data "
    "source. The answer below is AI-generated from the model's general knowledge — "
    "it is **not** sourced from your data and should be independently verified."
)


def _general_knowledge_response(user_message, history=None, on_step=None):
    """LAST-RESORT fallback: answer from the model's own knowledge.

    ONLY call this once every data path has genuinely been exhausted -- the keyword
    tools, text-to-SQL, AND semantic/vector search must all have returned nothing.
    The database is always tried first and in full; this never pre-empts it.
    Returns a synthesis dict {"text", "mode"} for the caller to return under
    response_mode="general_knowledge", or None if the LLM is unavailable -- in
    which case the caller still refuses honestly rather than inventing an answer.
    """
    try:
        import llm_client
        import config
        if not llm_client.available():
            return None
        if on_step:
            try:
                on_step("Not in the database — answering from general knowledge")
            except Exception:
                pass
        system = (
            "You are a clinical-trials assistant. The user's question could NOT be "
            "answered from the connected clinical-trial database -- direct lookup, "
            "SQL, and semantic search all found nothing relevant. Answer from your "
            "general knowledge instead. Be accurate and cite the type of source "
            "(e.g. SEER, GLOBOCAN, published literature) where you can, and say "
            "plainly when a figure is an estimate or varies by source. Never imply "
            "the numbers came from the user's database.\n\n"
            + config.ANSWER_FORMAT_CONTRACT
        )
        messages = [{"role": "system", "content": system}]
        if history:
            messages += history[-config.MAX_HISTORY_TURNS:]
        messages.append({"role": "user", "content": user_message})
        answer = llm_client.chat(messages)
        if not answer or not answer.strip():
            return None
        return {"text": f"{GENERAL_KNOWLEDGE_DISCLAIMER}\n\n---\n\n{answer.strip()}",
                "mode": "llm"}
    except Exception:
        return None  # any failure -> caller falls back to an honest refusal


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

    # GREETING / SMALL TALK (runs before classification): "hi", "thanks", "who are
    # you". These have no data behind them, so without this branch they fall all the
    # way through the cascade and surface the out-of-scope card, which reads as a
    # failure. Match the WHOLE message so "hi" never fires on "which trials...".
    # Strip ANY surrounding punctuation/symbols, not a hand-picked few: a stray
    # keystroke ("hi\", "hi/") otherwise slipped past this branch and fell all
    # the way through to a full trial search.
    _greet = re.sub(r"^\W+|\W+$", "", user_message.strip().lower())
    _GREETINGS = {
        "hi", "hii", "hey", "hello", "yo", "hiya", "good morning",
        "good afternoon", "good evening", "greetings", "hi there", "hello there",
    }
    _THANKS = {"thanks", "thank you", "thanks!", "ty", "thx", "cheers", "appreciate it"}
    _WHOAREYOU = {"who are you", "what are you", "what can you do", "help",
                  "what do you do", "how does this work"}
    if _greet in _GREETINGS or _greet in _THANKS or _greet in _WHOAREYOU:
        if _greet in _THANKS:
            msg = "You're welcome — ask me anything else about the trial data."
        else:
            msg = (
                "Hi — I'm your clinical-trials assistant. I can search and analyse the "
                "lung cancer trial database. Try asking:\n\n"
                "- *List all ADC trials from the last 10 years with their endpoints*\n"
                "- *How many phase 3 EGFR trials are recruiting?*\n"
                "- *Compare the arms of NCT04538664*\n"
                "- *Show the competitive landscape by drug and phase*"
            )
        _syn = {"text": msg, "mode": "direct"}
        _record_answer(session_id, _syn)
        return {"intent": "greeting", "escalate": False,
                "response_mode": "greeting", "synthesis": _syn}

    # EXPLICIT TRIAL ID OVERRIDE (runs before classification/RAG/landscape): a pasted
    # NCT number OR an internal oncosuite id (3-3-3 alphanumeric, e.g. "00v-vw5-Ejz")
    # is an unambiguous single-trial request. Handle it directly so it never gets
    # swallowed by the conceptual-RAG gate or a fuzzy LLM classification.
    _nct = _NCT_ID_RE.search(user_message)
    _onco = _ONCOSUITE_ID_RE.search(user_message)

    # TWO-TRIAL COMPARISON. Two or more ids plus a comparison cue is a request to
    # compare those trials WITH EACH OTHER -- not the same thing as compare_arms,
    # which compares arms within one trial. This must run before the single-id
    # override below, which uses .search() and would answer about the first id
    # only, presenting half the answer as if it were complete.
    _all_onco = _ONCOSUITE_ID_RE.findall(user_message)
    _all_nct = _NCT_ID_RE.findall(user_message)
    _ids = list(dict.fromkeys(_all_onco + [n.upper() for n in _all_nct]))
    # Own lowercase copy: _lm is not defined until after classification below.
    if len(_ids) >= 2 and re.search(
            r"\b(compare|comparison|versus|vs\.?|difference|differ|against|"
            r"side by side)\b", user_message.lower()):
        _step(f"Comparing {len(_ids)} trials side by side")
        from tools.compare_trials import compare_trials
        _cmp = compare_trials(_ids)
        if not _cmp.get("error"):
            # Rendered deterministically: every cell is copied from
            # get_trial_detail, so no LLM call is needed and the table cannot
            # disagree with the data. (It also keeps working while the model
            # backend is unavailable.)
            synthesis = _render_trial_comparison(_cmp)
            _record_answer(session_id, synthesis)
            return {"intent": "trial_comparison", "tool_name": "compare_trials",
                    "escalate": True,
                    "response_mode": "strong_model_synthesis",
                    "tool_result": _cmp, "synthesis": synthesis}
        # Couldn't resolve enough ids -> say so rather than silently comparing one.
        _syn = {"text": _cmp["error"], "mode": "direct"}
        _record_answer(session_id, _syn)
        return {"intent": "trial_comparison", "escalate": False,
                "response_mode": "greeting", "synthesis": _syn}

    # PARTIAL id against what this session was just shown. People refer to a row
    # by the part they can see or be bothered to type -- "the one starting wd7",
    # "from the above, wD7-VqO" -- which is not a full 3-3-3 id, so the pattern
    # above misses it and the turn used to fall through to an UNFILTERED search
    # (the observed bug: a follow-up on 25 AstraZeneca trials returned all 1,562).
    # Resolve it against last_trials, which holds exactly the rows on screen.
    if not (_nct or _onco):
        _partial = _resolve_partial_trial_id(user_message, working_set)
        if _partial:
            _step(f"Matched {_partial} from the trials just shown")
            _cls = {"intent": "single_trial_lookup",
                    "filters": {"oncosuite_id": _partial}}
            tool_name, tool_result = _dispatch_tool(_cls, working_set)
            if not (isinstance(tool_result, dict) and tool_result.get("error")
                    and not tool_result.get("oncosuite_id")):
                _sessions.update_after_tool_call(session_id, tool_name, tool_result)
                from synthesis import synthesize
                synthesis = synthesize(user_message, "single_trial_lookup",
                                       tool_name, tool_result, history=_history)
                _record_answer(session_id, synthesis)
                return {"intent": "single_trial_lookup", "tool_name": tool_name,
                        "escalate": True,
                        "response_mode": "strong_model_synthesis",
                        "tool_result": tool_result, "synthesis": synthesis}

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
    _intent_label = intent.replace('_', ' ')
    _step(f"Classified your question as {_intent_label}" if intent == "out_of_scope"
          else f"Classified your question as a {_intent_label}")

    # LEARNING -- REPLAY (filters). The classifier is an LLM call and is
    # non-deterministic: the same question can come back with filters one turn
    # and {} the next, and an empty filter set silently widens the search to the
    # whole database (the bug behind "sponsor is Merck" returning 1,562 trials).
    # If we have proven filters for this question, use them rather than search
    # unscoped.
    if not (classification.get("filters") or {}):
        try:
            import agent_learning
            _learned = agent_learning.recall_query(user_message, kind="filters")
            if _learned and isinstance(_learned.get("payload"), dict):
                classification["filters"] = dict(_learned["payload"])
                _step("Reusing filters that answered this question before")
        except Exception:
            pass

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

    # "DO ANY OF THESE HAVE PUBLISHED RESULTS?" -- a follow-up about the set
    # already on screen. No search tool answers it: search_trials reports what
    # MATCHES filters, not which matches have outcome values behind them. So the
    # question fell through to an unscoped search, and once that was guarded, to
    # "I couldn't work out what to search for".
    #
    # Resolved against last_trials (what the user was just shown) rather than
    # re-searching, because "in these 9 trials" refers to those exact rows.
    if re.search(r"\b(publish|posted|reported|available)\w*\b", _lm) and re.search(
            r"\b(result|outcome|data|readout)\w*\b", _lm):
        _prior = [t.get("oncosuite_id") for t in (working_set.get("last_trials") or [])
                  if t.get("oncosuite_id")]
        if _prior:
            _step(f"Checking posted results for {len(_prior)} trials")
            from tools.check_posted_results import (check_posted_results,
                                                    narrate_posted_results)
            _pr = check_posted_results(_prior)
            _nb = narrate_posted_results(_pr)
            if _nb:
                _syn = {"text": "\n\n".join(
                    b["text"] for b in _nb if b["type"] == "intro"), "mode": "deterministic"}
                _record_answer(session_id, _syn)
                return {"intent": "posted_results_check", "escalate": False,
                        "response_mode": "posted_results",
                        "tool_result": _pr, "narration": _nb,
                        "synthesis": _syn}

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

    # COMPARATIVE questions are the second multi-step shape, and the original
    # gate missed them entirely: "compare osimertinib trials with chemo trials"
    # names one verb and no chaining cue, yet answering it needs two searches and
    # a comparison. Requiring a cue AND two verbs let these fall through to a
    # single tool that can only answer half the question.
    #
    # Safe to match "vs" here: detect_analytics() runs BEFORE the router (see
    # web_app.py) and already claims the chart questions that use it -- "efficacy
    # vs safety", "competition intensity vs enrollment speed" -- so they never
    # reach this gate.
    _COMPARATIVE_PATTERNS = (
        r"\bcompare[sd]?\b.*\b(with|to|vs\.?|versus|against)\b",
        r"\bhow (do|does|did)\b.*\b(compare|differ|stack up|perform)\b",
        r"\b(vs\.?|versus)\b",
        r"\bdiffer(ence|ences|s)?\b.*\bbetween\b",
        r"\band how\b.*\b(differ|compare)\b",
        r"\bacross\b.*\b(phases?|countries|countr|sponsors?|lines?|stages?)\b",
    )
    _is_comparative = any(re.search(p, _lm) for p in _COMPARATIVE_PATTERNS)

    _is_multistep = (
        # A chaining cue alone is enough now: "find X then compare" is plainly
        # two steps whether or not a second verb happens to appear.
        any(c in _lm for c in _CHAIN_CUES)
        or sum(1 for v in _ACTION_VERBS if v in _lm) >= 2
        or _is_comparative
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
        # Every data path is now exhausted, which is exactly the contract
        # _general_knowledge_response documents. A definition question ("what is
        # NSCLC") has no rows behind it by nature, and refusing it reads as a
        # failure when the assistant plainly knows the answer -- so answer from
        # general knowledge, clearly labelled as NOT coming from the database.
        _syn = _general_knowledge_response(user_message, _history, on_step)
        if _syn is not None:
            _record_answer(session_id, _syn)
            return {
                "intent": intent,
                "escalate": False,
                "response_mode": "general_knowledge",
                "synthesis": _syn,
            }
        return {
            "intent": intent,
            "escalate": False,
            "response_mode": "out_of_scope_policy_needed",
            "note": ("I couldn't find an answer to that in the trial database, and "
                     "the AI fallback is currently unavailable. Try rephrasing, or "
                     "ask about trials, sponsors, phases, drugs, or endpoints."),
        }

    # DON'T ANSWER A QUESTION WE DIDN'T UNDERSTAND.
    #
    # A filtered_search with NO filters searches the entire database, and the
    # renderer then presents all 1,562 trials as though they were the answer.
    # That is how "show me the efrficacy vgs safety" came back as a generic trial
    # list: nothing matched, the classifier fell through to filtered_search with
    # {}, and an unscoped dump looked like a confident reply.
    #
    # An unscoped list is only legitimate when the user actually ASKED for
    # everything ("show all trials"), so require that phrasing; otherwise say
    # plainly that the question wasn't understood.
    if (intent == "filtered_search"
            and not any(v for k, v in (classification.get("filters") or {}).items()
                        if k != "columns")
            and not any(c in _lm for c in _SHOW_ALL_CUES)):
        _syn = {
            "text": (
                "I couldn't work out what to search for in that question.\n\n"
                "Could you rephrase it, or name what you're after — a condition, "
                "biomarker, sponsor, phase, or a trial id? For example:\n\n"
                "- *efficacy vs safety*\n"
                "- *top backbones for phase 2*\n"
                "- *trials sponsored by AstraZeneca*\n"
                "- *show all trials* (if you did want the full list)"
            ),
            "mode": "direct",
        }
        _record_answer(session_id, _syn)
        return {"intent": "clarification_needed", "escalate": False,
                "response_mode": "greeting", "synthesis": _syn}

    _step("Searching the trial database")
    tool_name, tool_result = _dispatch_tool(classification, working_set)
    unmatched_terms = tool_result.get("unmatched_terms", []) if isinstance(tool_result, dict) else []
    if isinstance(tool_result, dict) and "total_matches" in tool_result:
        _step(f"Found {tool_result['total_matches']} matching trial(s)")

    # LEARNING. Record what worked, so a later rewording of this question reuses
    # the same filters, and so the session profile reflects what this user keeps
    # asking about. Both are best-effort -- wrapped because a learning failure
    # must never cost the user their answer.
    try:
        import agent_learning
        _f = classification.get("filters") or {}
        _matches = (tool_result.get("total_matches")
                    if isinstance(tool_result, dict) else None)
        if _f and _matches:
            agent_learning.remember_query(user_message, "filters", _f, _matches)
        agent_learning.remember_entities(session_id, _f, user_message)
    except Exception:
        pass

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
            # Case-insensitive: these ids mix cases and are read off a screen, and
            # some characters are visually identical in common fonts -- a capital
            # I against a lowercase l is how "kF6-oN3-If3" gets typed as
            # "kF6-oN3-lf3". Exact matching rejected a real trial as unrecognised.
            from tools.get_trial_detail import resolve_oncosuite_id
            _resolved = resolve_oncosuite_id(onco)
            if _resolved:
                # Use the STORED spelling from here on, so every downstream
                # exact-match query still works.
                onco = _resolved
            if not _resolved:
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