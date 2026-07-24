# """
# Hybrid orchestrator. This is the "add-on" layer that sits ON TOP of the existing
# keyword app (router.handle_turn) without replacing it.

# Cascade, in order, per the agreed design:
#   1. KEYWORD FAST-PATH   -- the existing rule-based router. Fast, deterministic,
#                             zero-cost, already 1.0 on eval. If it confidently
#                             handles the turn (clear intent, matched terms, a
#                             result), we use it.
#   2. TEXT-TO-SQL         -- otherwise ask the LLM to write SQL against the schema,
#                             run it read-only, phrase the answer. Handles arbitrary
#                             factual questions across all tables.
#   3. VECTOR FALLBACK     -- if SQL declines / finds nothing, semantic search over
#                             free-text fields ("trials about X").
#   4. HONEST REFUSAL      -- if nothing works, say so. Never fabricate.

# Conversation memory is threaded through every LLM step so follow-ups work.

# The whole thing degrades gracefully: with LLM_BACKEND="off" or Ollama not running,
# it silently behaves like the original keyword app.
# """
# import config
# import llm_client
# import text_to_sql
# import vector_store
# from conversation import conversations
# from router import handle_turn as keyword_handle_turn


# def _keyword_confident(resp: dict) -> bool:
#     """Did the keyword router actually resolve the turn well?"""
#     mode = resp.get("response_mode")
#     if mode == "clarification_needed":
#         return False           # unmatched terms -> let LLM try
#     if mode == "out_of_scope_policy_needed":
#         return False           # keyword rules bailed -> let LLM try
#     tool_result = resp.get("tool_result")
#     if isinstance(tool_result, dict) and tool_result.get("error"):
#         return False           # tool errored -> let LLM try
#     # The landscape/aggregate tool only returns raw grouped JSON with no clean
#     # renderer -- text-to-SQL produces a far better plain-English answer for
#     # "how many / count / by sponsor / trend" style questions. So DON'T treat
#     # landscape as confident: let those fall through to the SQL path.
#     if resp.get("intent") == "landscape_or_trend":
#         return False
#     return resp.get("tool_name") not in (None, "unknown")


# def handle(session_id: str, user_message: str) -> dict:
#     """
#     Returns a unified dict:
#       {"path": "keyword"|"sql"|"vector"|"refusal",
#        "answer": str|None,          # natural-language answer (LLM paths)
#        "keyword_result": dict|None, # full structured result from the keyword app
#        "sql": str|None, "rows": list|None,
#        "vector_results": list|None,
#        "backend": str}
#     """
#     conversations.add_user(session_id, user_message)
#     history = conversations.history(session_id)
#     backend = config.backend_summary()

#     # ---- 1. keyword fast-path ----
#     kw = keyword_handle_turn(session_id, user_message)
#     if _keyword_confident(kw):
#         conversations.add_assistant(session_id, f"[structured answer via {kw.get('tool_name')}]")
#         return {"path": "keyword", "answer": None, "keyword_result": kw,
#                 "sql": None, "rows": None, "vector_results": None, "backend": backend}

#     # If LLM is disabled/unreachable, we can only offer what keyword produced.
#     if not llm_client.available():
#         return _refusal(session_id, kw, backend,
#                         "LLM path is off; keyword rules couldn't confidently answer.")

#     # ---- 2. text-to-SQL ----
#     sql_res = text_to_sql.run(user_message, history=history)
#     if sql_res["status"] == "answered":
#         answer = sql_res["answer"] or "(rows returned; see data)"
#         conversations.add_assistant(session_id, answer)
#         return {"path": "sql", "answer": answer, "keyword_result": None,
#                 "sql": sql_res["sql"], "rows": sql_res["rows"],
#                 "vector_results": None, "backend": backend}

#     if sql_res["status"] == "unavailable":
#         return _refusal(session_id, kw, backend, f"LLM unreachable: {sql_res['reason']}")

#     # ---- 3. vector fallback (for declined / no_data / invalid_sql) ----
#     vec = vector_store.search(user_message)
#     if vec["status"] == "ok" and vec["results"]:
#         # let the LLM summarise the semantic matches, grounded in the snippets
#         try:
#             answer = _summarise_vector(user_message, vec["results"], history)
#         except llm_client.LLMUnavailable:
#             answer = None
#         conversations.add_assistant(session_id, answer or "[semantic matches returned]")
#         return {"path": "vector", "answer": answer, "keyword_result": None,
#                 "sql": sql_res.get("sql"), "rows": None,
#                 "vector_results": vec["results"], "backend": backend}

#     # ---- 4. honest refusal ----
#     reason = sql_res.get("reason") or vec.get("reason") or "no method could answer"
#     return _refusal(session_id, kw, backend, reason)


# def _summarise_vector(question, results, history):
#     grounding = (
#         "You are a clinical-trials assistant. The user asked a question that couldn't "
#         "be answered by a direct query, so a semantic search returned these text "
#         "snippets from the database. Summarise what's relevant, grounded ONLY in the "
#         "snippets. Do not invent. If they don't actually answer the question, say so.\n\n"
#         f"SNIPPETS:\n{results}"
#     )
#     messages = [{"role": "system", "content": grounding}]
#     messages += history[-config.MAX_HISTORY_TURNS:]
#     messages.append({"role": "user", "content": question})
#     return llm_client.chat(messages)


# def _refusal(session_id, kw, backend, reason):
#     msg = ("I couldn't answer that from the clinical-trial database. "
#            "Try naming a specific trial (NCT id), or ask about phase, status, sponsor, "
#            "eligibility, endpoints, adverse events, hazard ratios, locations, or contacts.")
#     conversations.add_assistant(session_id, msg)
#     return {"path": "refusal", "answer": msg, "keyword_result": kw if kw else None,
#             "sql": None, "rows": None, "vector_results": None,
#             "backend": backend, "reason": reason}



"""
Hybrid orchestrator. This is the "add-on" layer that sits ON TOP of the existing
keyword app (router.handle_turn) without replacing it.

Cascade, in order, per the agreed design:
  1. KEYWORD FAST-PATH   -- the existing rule-based router. Fast, deterministic,
                            zero-cost, already 1.0 on eval. If it confidently
                            handles the turn (clear intent, matched terms, a
                            result), we use it.
  2. TEXT-TO-SQL         -- otherwise ask the LLM to write SQL against the schema,
                            run it read-only, phrase the answer. Handles arbitrary
                            factual questions across all tables.
  3. VECTOR FALLBACK     -- if SQL declines / finds nothing, semantic search over
                            free-text fields ("trials about X").
  4. HONEST REFUSAL      -- if nothing works, say so. Never fabricate.

Conversation memory is threaded through every LLM step so follow-ups work.

The whole thing degrades gracefully: with LLM_BACKEND="off" or Ollama not running,
it silently behaves like the original keyword app.
"""
import config
import llm_client
import text_to_sql
import vector_store
from conversation import conversations
from router import handle_turn as keyword_handle_turn


def _keyword_confident(resp: dict) -> bool:
    """Did the keyword router actually resolve the turn well?"""
    mode = resp.get("response_mode")
    if mode == "clarification_needed":
        return False           # unmatched terms -> let LLM try
    if mode == "out_of_scope_policy_needed":
        return False           # keyword rules bailed -> let LLM try
    tool_result = resp.get("tool_result")
    if isinstance(tool_result, dict) and tool_result.get("error"):
        return False           # tool errored -> let LLM try
    # NOTE: landscape_or_trend USED to be forced past this check because
    # render_landscape had no real renderer for it (silently fell through to
    # raw JSON). That's fixed now -- get_competitive_landscape's real,
    # unit-standardized aggregation is the more trustworthy answer for these
    # questions than ad-hoc LLM-written SQL, so it's treated as confident
    # like everything else, consistent with "use the database tool layer
    # first" being the actual product priority.
    # FIX (found while wiring in the general-knowledge fallback): a genuinely
    # off-topic question ("what year did the FDA approve the first CAR-T
    # therapy") was falling into filtered_search with ZERO real filters
    # extracted -- search_trials() then ran unfiltered and returned all 1,562
    # trials, and this function still called that "confident". That silently
    # swallowed exactly the questions the general-knowledge fallback exists
    # for. A filtered_search with no real filters isn't a real search result.
    if resp.get("intent") == "filtered_search" and not resp.get("filters_extracted"):
        return False

    return resp.get("tool_name") not in (None, "unknown")


def handle(session_id: str, user_message: str) -> dict:
    """
    Returns a unified dict:
      {"path": "keyword"|"sql"|"vector"|"refusal",
       "answer": str|None,          # natural-language answer (LLM paths)
       "keyword_result": dict|None, # full structured result from the keyword app
       "sql": str|None, "rows": list|None,
       "vector_results": list|None,
       "backend": str}
    """
    conversations.add_user(session_id, user_message)
    history = conversations.history(session_id)
    backend = config.backend_summary()

    # ---- 1. keyword fast-path ----
    kw = keyword_handle_turn(session_id, user_message)
    if _keyword_confident(kw):
        conversations.add_assistant(session_id, f"[structured answer via {kw.get('tool_name')}]")
        return {"path": "keyword", "answer": None, "keyword_result": kw,
                "sql": None, "rows": None, "vector_results": None, "backend": backend}

    # If LLM is disabled/unreachable, we can only offer what keyword produced.
    if not llm_client.available():
        return _refusal(session_id, kw, backend,
                        "LLM path is off; keyword rules couldn't confidently answer.")

    # ---- 2. text-to-SQL ----
    sql_res = text_to_sql.run(user_message, history=history)
    if sql_res["status"] == "answered":
        answer = sql_res["answer"] or "(rows returned; see data)"
        # If grounding verification could not confirm the answer, prepend an honest
        # caution rather than presenting an unverified claim as established fact.
        if sql_res.get("verified") is False:
            answer = ("_Note: I couldn't fully verify the details below against the "
                      "underlying data — please double-check any specific figures._\n\n"
                      + answer)
        conversations.add_assistant(session_id, answer)
        return {"path": "sql", "answer": answer, "keyword_result": None,
                "sql": sql_res["sql"], "rows": sql_res["rows"],
                "vector_results": None, "backend": backend,
                "verified": sql_res.get("verified", True)}

    if sql_res["status"] == "unavailable":
        return _refusal(session_id, kw, backend, f"LLM unreachable: {sql_res['reason']}")

    # ---- 3. vector fallback (for declined / no_data / invalid_sql) ----
    vec = vector_store.search(user_message)
    if vec["status"] == "ok" and vec["results"]:
        # let the LLM summarise the semantic matches, grounded in the snippets
        try:
            answer = _summarise_vector(user_message, vec["results"], history)
        except llm_client.LLMUnavailable:
            answer = None
        conversations.add_assistant(session_id, answer or "[semantic matches returned]")
        return {"path": "vector", "answer": answer, "keyword_result": None,
                "sql": sql_res.get("sql"), "rows": None,
                "vector_results": vec["results"], "backend": backend}

    # ---- 4. general-knowledge fallback (LAST resort, clearly labeled) ----
    # Everything above this line queries oncosuite_gold -- your database is
    # ALWAYS tried first, in full, before this ever runs. Only if the keyword
    # tools, LLM-written SQL, AND semantic search all genuinely find nothing
    # does this fire, and the answer is explicitly labeled as general
    # knowledge rather than presented as if it came from your data.
    if llm_client.available():
        try:
            answer = _general_knowledge_answer(user_message, history)
            conversations.add_assistant(session_id, answer)
            return {"path": "general_knowledge", "answer": answer, "keyword_result": None,
                    "sql": sql_res.get("sql"), "rows": None, "vector_results": None,
                    "backend": backend,
                    "note": "Not sourced from your trial database -- general knowledge only."}
        except llm_client.LLMUnavailable:
            pass  # fall through to honest refusal below

    # ---- 5. honest refusal (only if the general-knowledge call also failed/unavailable) ----
    reason = sql_res.get("reason") or vec.get("reason") or "no method could answer"
    return _refusal(session_id, kw, backend, reason)


def _general_knowledge_answer(question, history):
    system = (
        "You are a clinical-trials assistant. The user's question could not be answered "
        "from the connected clinical-trial database (oncosuite_gold) -- direct lookup, "
        "SQL, and semantic search all found nothing relevant. Answer from your general "
        "knowledge instead, but you MUST start your reply with exactly this sentence: "
        "\"This is general knowledge, not sourced from your trial database:\" -- then "
        "answer normally following the formatting rules below.\n\n"
        + config.ANSWER_FORMAT_CONTRACT
    )
    messages = [{"role": "system", "content": system}]
    messages += history[-config.MAX_HISTORY_TURNS:]
    messages.append({"role": "user", "content": question})
    return llm_client.chat(messages)


def _summarise_vector(question, results, history):
    grounding = (
        "You are a clinical-trials assistant. The user asked a question that couldn't "
        "be answered by a direct query, so a semantic search returned these text "
        "snippets from the database. Summarise what's relevant, grounded ONLY in the "
        "snippets. Do not invent. If they don't actually answer the question, say so.\n\n"
        + config.ANSWER_FORMAT_CONTRACT +
        f"\n\nSNIPPETS:\n{results}"
    )
    messages = [{"role": "system", "content": grounding}]
    messages += history[-config.MAX_HISTORY_TURNS:]
    messages.append({"role": "user", "content": question})
    return llm_client.chat(messages)


def _refusal(session_id, kw, backend, reason):
    msg = ("I couldn't answer that from the clinical-trial database. "
           "Try naming a specific trial (NCT id), or ask about phase, status, sponsor, "
           "eligibility, endpoints, adverse events, hazard ratios, locations, or contacts.")
    conversations.add_assistant(session_id, msg)
    return {"path": "refusal", "answer": msg, "keyword_result": kw if kw else None,
            "sql": None, "rows": None, "vector_results": None,
            "backend": backend, "reason": reason}