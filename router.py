# # # """
# # # Piece 5 -- router: intent classification + escalation logic + orchestration.

# # # IMPORTANT: `classify_and_extract` below is a PLACEHOLDER. In production this is
# # # a single Claude tool-use call (the "cheap model" slot) with the tool schema
# # # shown in CLASSIFY_TOOL_SCHEMA. This sandbox has no wired API credentials, so
# # # a small rule-based stand-in fills the same contract (same input, same output
# # # shape) purely so the rest of the pipeline -- escalation, memory, tool dispatch --
# # # can be built and tested end-to-end. Swap classify_and_extract's body for a
# # # real `anthropic.Anthropic().messages.create(...)` call using CLASSIFY_TOOL_SCHEMA
# # # as the tool definition; nothing else in this file needs to change.

# # # Escalation rules are deterministic code, NOT a model decision, per Doc 05 --
# # # implemented exactly as specified, in priority order.
# # # """
# # # import re

# # # from memory import SessionStore
# # # from tools.search_trials import search_trials
# # # from tools.get_trial_detail import get_trial_detail
# # # from tools.get_endpoints_and_outcomes import get_endpoints_and_outcomes
# # # from tools.get_hazard_ratios import get_hazard_ratios
# # # from tools.get_adverse_events import get_adverse_events
# # # from tools.compare_arms import compare_arms
# # # from tools.get_competitive_landscape import get_competitive_landscape
# # # from tools.get_trial_sources import get_trial_sources

# # # CLASSIFY_TOOL_SCHEMA = {
# # #     "name": "classify_and_extract",
# # #     "description": "Classify user intent and extract structured filters/entity references, "
# # #                     "resolving pronouns against the session working set in the same call.",
# # #     "input_schema": {
# # #         "type": "object",
# # #         "properties": {
# # #             "intent": {
# # #                 "type": "string",
# # #                 "enum": ["single_trial_lookup", "filtered_search", "arm_comparison",
# # #                          "landscape_or_trend", "outcome_deep_dive", "clarification_needed",
# # #                          "out_of_scope"],
# # #             },
# # #             "filters": {"type": "object"},
# # #             "resolved_oncosuite_id": {"type": "string"},
# # #             "resolved_arm_ids": {"type": "array", "items": {"type": "integer"}},
# # #         },
# # #         "required": ["intent"],
# # #     },
# # # }

# # # ALWAYS_ESCALATE_INTENTS = {"arm_comparison", "landscape_or_trend"}
# # # RESULT_SIZE_CHECK_INTENTS = {"filtered_search", "outcome_deep_dive"}
# # # RESULT_SIZE_THRESHOLD = 3


# # # def classify_and_extract(user_message: str, working_set: dict) -> dict:
# # #     """PLACEHOLDER cheap-model classifier -- replace with a real Claude tool-use call."""
# # #     msg = user_message.lower()

# # #     resolved_oncosuite_id = working_set.get("active_trial_id")
# # #     resolved_arm_ids = [a["arm_id"] for a in working_set.get("last_arms", [])]

# # #     # Explicit "compare ... arms" is the one case where a named trial should still go
# # #     # to arm comparison rather than full detail, so check it first.
# # #     if any(w in msg for w in ["compare", "vs", "versus"]) and ("arm" in msg or resolved_arm_ids):
# # #         return {"intent": "arm_comparison", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id,
# # #                 "resolved_arm_ids": resolved_arm_ids}

# # #     # An explicit NCT id means the user is asking about ONE specific trial. Route it to
# # #     # the full trial-detail view (which now carries endpoints, outcomes, hazard ratios,
# # #     # adverse events, safety, population, contacts, ranking, summary). This must beat the
# # #     # generic keyword rules below ("outcome", "survival", "what is", ...) -- otherwise a
# # #     # question like "what are the outcomes for NCT03706690" gets routed to a different
# # #     # tool / rejected as out-of-scope purely because of a keyword, ignoring the NCT id.
# # #     if re.search(r"nct\d{8}", msg):
# # #         m = re.search(r"nct\d{8}", msg)
# # #         return {"intent": "single_trial_lookup", "filters": {"nct_id": m.group(0).upper()}}

# # #     if any(w in msg for w in ["landscape", "trend", "how many trials", "competitive"]):
# # #         filters = {}
# # #         m = re.search(r"for ([a-z0-9\- ]+?)(?: in| trials|$)", msg)
# # #         if m:
# # #             filters["target_or_moa"] = [m.group(1).strip().upper()]
# # #         return {"intent": "landscape_or_trend", "filters": filters}

# # #     if any(w in msg for w in ["orr", "pfs", "os ", "survival", "response rate", "outcome"]):
# # #         return {"intent": "outcome_deep_dive", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id}

# # #     if any(w in msg for w in ["what does", "what is", "define", "mechanism of"]) and "trial" not in msg:
# # #         return {"intent": "out_of_scope", "filters": {}}

# # #     filters = {}
# # #     if "nsclc" in msg or "lung" in msg:
# # #         filters["condition"] = ["NSCLC"]
# # #     known_biomarkers = ["kras", "egfr", "alk", "ros1"]
# # #     for bm in known_biomarkers:
# # #         if bm in msg:
# # #             filters.setdefault("biomarkers", []).append(bm.upper())
# # #     if "biomarkers" not in filters:
# # #         # naive fallback: "trials for <term>" with an unrecognized term -- pass it through
# # #         # as a literal biomarker filter so the vocab layer's unmatched-term path actually
# # #         # gets exercised, rather than silently dropping terms the keyword list doesn't know.
# # #         m = re.search(r"trials? for ([a-z0-9\-]+)", msg)
# # #         if m and m.group(1) not in known_biomarkers:
# # #             filters["biomarkers"] = [m.group(1)]
# # #     if "phase 3" in msg:
# # #         filters["phase"] = ["Phase 3"]
# # #     if "recruiting" in msg:
# # #         filters["study_status"] = ["Recruiting"]

# # #     return {"intent": "filtered_search", "filters": filters, "resolved_oncosuite_id": resolved_oncosuite_id}


# # # def should_escalate(intent, tool_result, unmatched_terms):
# # #     """Deterministic escalation logic -- real code, per Doc 05, in priority order."""
# # #     if unmatched_terms:
# # #         return False
# # #     if intent in ALWAYS_ESCALATE_INTENTS:
# # #         return True
# # #     if intent in RESULT_SIZE_CHECK_INTENTS:
# # #         if _count_distinct_trials(tool_result) > RESULT_SIZE_THRESHOLD:
# # #             return True
# # #     return False


# # # def _count_distinct_trials(tool_result):
# # #     if isinstance(tool_result, dict) and "results" in tool_result:
# # #         return len({r["oncosuite_id"] for r in tool_result["results"]})
# # #     return 0


# # # _sessions = SessionStore()


# # # def handle_turn(session_id: str, user_message: str) -> dict:
# # #     working_set = _sessions.get(session_id)
# # #     classification = classify_and_extract(user_message, working_set)
# # #     intent = classification["intent"]

# # #     if intent == "out_of_scope":
# # #         return {
# # #             "intent": intent,
# # #             "escalate": False,
# # #             "response_mode": "out_of_scope_policy_needed",
# # #             "note": "Doc 05 flags this as a product decision, not resolved here.",
# # #         }

# # #     tool_name, tool_result = _dispatch_tool(classification, working_set)
# # #     unmatched_terms = tool_result.get("unmatched_terms", []) if isinstance(tool_result, dict) else []

# # #     if unmatched_terms:
# # #         return {
# # #             "intent": intent, "escalate": False, "response_mode": "clarification_needed",
# # #             "unmatched_terms": unmatched_terms, "tool_name": tool_name,
# # #         }

# # #     escalate = should_escalate(intent, tool_result, unmatched_terms)
# # #     _sessions.update_after_tool_call(session_id, tool_name, tool_result)

# # #     return {
# # #         "intent": intent, "tool_name": tool_name, "tool_result": tool_result,
# # #         "escalate": escalate,
# # #         "response_mode": "strong_model_synthesis" if escalate else "cheap_model_format",
# # #     }


# # # def _dispatch_tool(classification, working_set):
# # #     intent = classification["intent"]
# # #     filters = classification.get("filters", {})
# # #     oncosuite_id = classification.get("resolved_oncosuite_id")
# # #     arm_ids = classification.get("resolved_arm_ids")

# # #     if intent == "filtered_search":
# # #         return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

# # #     if intent == "single_trial_lookup":
# # #         nct_id = filters.get("nct_id")
# # #         if nct_id:
# # #             from db import query
# # #             rows = query(
# # #                 "SELECT oncosuite_id FROM oncosuite_gold.source_mapping "
# # #                 "WHERE source_name = 'clinicaltrials.gov' AND source_unique_id = %(nct)s",
# # #                 {"nct": nct_id},
# # #             )
# # #             if rows:
# # #                 return "get_trial_detail", get_trial_detail(rows[0]["oncosuite_id"])
# # #             return "get_trial_detail", {"error": f"no trial found for NCT id {nct_id}"}
# # #         if oncosuite_id:
# # #             return "get_trial_detail", get_trial_detail(oncosuite_id)
# # #         return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

# # #     if intent == "arm_comparison":
# # #         if oncosuite_id and arm_ids:
# # #             return "compare_arms", compare_arms(oncosuite_id, arm_ids)
# # #         return "compare_arms", {"error": "could not resolve trial/arms from session context"}

# # #     if intent == "landscape_or_trend":
# # #         group_by = filters.get("group_by", ["drug_name", "phase"])
# # #         return "get_competitive_landscape", get_competitive_landscape(
# # #             group_by=group_by,
# # #             condition=filters.get("condition"),
# # #             target_or_moa=filters.get("target_or_moa"),
# # #             outcome_metric=filters.get("outcome_metric"),
# # #         )

# # #     if intent == "outcome_deep_dive":
# # #         if oncosuite_id:
# # #             return "get_endpoints_and_outcomes", get_endpoints_and_outcomes(oncosuite_id)
# # #         return "get_endpoints_and_outcomes", {"error": "could not resolve trial from session context"}

# # #     return "unknown", {"error": f"unhandled intent: {intent}"}
# # """
# # Piece 5 -- router: intent classification + escalation logic + orchestration.

# # IMPORTANT: `classify_and_extract` below is a PLACEHOLDER. In production this is
# # a single Claude tool-use call (the "cheap model" slot) with the tool schema
# # shown in CLASSIFY_TOOL_SCHEMA. This sandbox has no wired API credentials, so
# # a small rule-based stand-in fills the same contract (same input, same output
# # shape) purely so the rest of the pipeline -- escalation, memory, tool dispatch --
# # can be built and tested end-to-end. Swap classify_and_extract's body for a
# # real `anthropic.Anthropic().messages.create(...)` call using CLASSIFY_TOOL_SCHEMA
# # as the tool definition; nothing else in this file needs to change.

# # Escalation rules are deterministic code, NOT a model decision, per Doc 05 --
# # implemented exactly as specified, in priority order.
# # """
# # import re

# # from memory import SessionStore
# # from tools.search_trials import search_trials
# # from tools.get_trial_detail import get_trial_detail
# # from tools.get_endpoints_and_outcomes import get_endpoints_and_outcomes
# # from tools.get_hazard_ratios import get_hazard_ratios
# # from tools.get_adverse_events import get_adverse_events
# # from tools.compare_arms import compare_arms
# # from tools.get_competitive_landscape import get_competitive_landscape
# # from tools.get_trial_sources import get_trial_sources

# # CLASSIFY_TOOL_SCHEMA = {
# #     "name": "classify_and_extract",
# #     "description": "Classify user intent and extract structured filters/entity references, "
# #                     "resolving pronouns against the session working set in the same call.",
# #     "input_schema": {
# #         "type": "object",
# #         "properties": {
# #             "intent": {
# #                 "type": "string",
# #                 "enum": ["single_trial_lookup", "filtered_search", "arm_comparison",
# #                          "landscape_or_trend", "outcome_deep_dive", "clarification_needed",
# #                          "out_of_scope"],
# #             },
# #             "filters": {"type": "object"},
# #             "resolved_oncosuite_id": {"type": "string"},
# #             "resolved_arm_ids": {"type": "array", "items": {"type": "integer"}},
# #         },
# #         "required": ["intent"],
# #     },
# # }

# # ALWAYS_ESCALATE_INTENTS = {"arm_comparison", "landscape_or_trend"}
# # RESULT_SIZE_CHECK_INTENTS = {"filtered_search", "outcome_deep_dive"}
# # RESULT_SIZE_THRESHOLD = 3


# # def classify_and_extract(user_message: str, working_set: dict) -> dict:
# #     """PLACEHOLDER cheap-model classifier -- replace with a real Claude tool-use call."""
# #     msg = user_message.lower()

# #     resolved_oncosuite_id = working_set.get("active_trial_id")
# #     resolved_arm_ids = [a["arm_id"] for a in working_set.get("last_arms", [])]

# #     # Explicit "compare ... arms" is the one case where a named trial should still go
# #     # to arm comparison rather than full detail, so check it first.
# #     if any(w in msg for w in ["compare", "vs", "versus"]) and ("arm" in msg or resolved_arm_ids):
# #         return {"intent": "arm_comparison", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id,
# #                 "resolved_arm_ids": resolved_arm_ids}

# #     # An explicit NCT id means the user is asking about ONE specific trial. Route it to
# #     # the full trial-detail view (which now carries endpoints, outcomes, hazard ratios,
# #     # adverse events, safety, population, contacts, ranking, summary). This must beat the
# #     # generic keyword rules below ("outcome", "survival", "what is", ...) -- otherwise a
# #     # question like "what are the outcomes for NCT03706690" gets routed to a different
# #     # tool / rejected as out-of-scope purely because of a keyword, ignoring the NCT id.
# #     if re.search(r"nct\d{8}", msg):
# #         m = re.search(r"nct\d{8}", msg)
# #         return {"intent": "single_trial_lookup", "filters": {"nct_id": m.group(0).upper()}}

# #     if any(w in msg for w in ["landscape", "trend", "how many trials", "competitive"]):
# #         filters = {}
# #         m = re.search(r"for ([a-z0-9\- ]+?)(?: in| trials|$)", msg)
# #         if m:
# #             filters["target_or_moa"] = [m.group(1).strip().upper()]
# #         return {"intent": "landscape_or_trend", "filters": filters}

# #     if any(w in msg for w in ["orr", "pfs", "os ", "survival", "response rate", "outcome"]):
# #         return {"intent": "outcome_deep_dive", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id}

# #     if any(w in msg for w in ["what does", "what is", "define", "mechanism of"]) and "trial" not in msg:
# #         return {"intent": "out_of_scope", "filters": {}}

# #     filters = {}
# #     if "nsclc" in msg or "lung" in msg:
# #         filters["condition"] = ["NSCLC"]
# #     known_biomarkers = ["kras", "egfr", "alk", "ros1"]
# #     for bm in known_biomarkers:
# #         if bm in msg:
# #             filters.setdefault("biomarkers", []).append(bm.upper())
# #     if "biomarkers" not in filters:
# #         # naive fallback: "trials for <term>" with an unrecognized term -- pass it through
# #         # as a literal biomarker filter so the vocab layer's unmatched-term path actually
# #         # gets exercised, rather than silently dropping terms the keyword list doesn't know.
# #         m = re.search(r"trials? for ([a-z0-9\-]+)", msg)
# #         if m and m.group(1) not in known_biomarkers:
# #             filters["biomarkers"] = [m.group(1)]
# #     if "phase 3" in msg:
# #         filters["phase"] = ["Phase 3"]
# #     if "recruiting" in msg:
# #         filters["study_status"] = ["Recruiting"]

# #     return {"intent": "filtered_search", "filters": filters, "resolved_oncosuite_id": resolved_oncosuite_id}


# # def should_escalate(intent, tool_result, unmatched_terms):
# #     """Deterministic escalation logic -- real code, per Doc 05, in priority order."""
# #     if unmatched_terms:
# #         return False
# #     if intent in ALWAYS_ESCALATE_INTENTS:
# #         return True
# #     if intent in RESULT_SIZE_CHECK_INTENTS:
# #         if _count_distinct_trials(tool_result) > RESULT_SIZE_THRESHOLD:
# #             return True
# #     return False


# # def _count_distinct_trials(tool_result):
# #     if isinstance(tool_result, dict) and "results" in tool_result:
# #         return len({r["oncosuite_id"] for r in tool_result["results"]})
# #     return 0


# # _sessions = SessionStore()


# # def handle_turn(session_id: str, user_message: str) -> dict:
# #     working_set = _sessions.get(session_id)
# #     classification = classify_and_extract(user_message, working_set)
# #     intent = classification["intent"]

# #     if intent == "out_of_scope":
# #         return {
# #             "intent": intent,
# #             "escalate": False,
# #             "response_mode": "out_of_scope_policy_needed",
# #             "note": "Doc 05 flags this as a product decision, not resolved here.",
# #         }

# #     tool_name, tool_result = _dispatch_tool(classification, working_set)
# #     unmatched_terms = tool_result.get("unmatched_terms", []) if isinstance(tool_result, dict) else []

# #     if unmatched_terms:
# #         return {
# #             "intent": intent, "escalate": False, "response_mode": "clarification_needed",
# #             "unmatched_terms": unmatched_terms, "tool_name": tool_name,
# #         }

# #     escalate = should_escalate(intent, tool_result, unmatched_terms)
# #     _sessions.update_after_tool_call(session_id, tool_name, tool_result)

# #     filters = classification.get("filters", {})
# #     filters_extracted = bool(filters and any(v for v in filters.values()))

# #     return {
# #         "intent": intent, "tool_name": tool_name, "tool_result": tool_result,
# #         "escalate": escalate,
# #         "response_mode": "strong_model_synthesis" if escalate else "cheap_model_format",
# #         "filters_extracted": filters_extracted,
# #     }


# # def _dispatch_tool(classification, working_set):
# #     intent = classification["intent"]
# #     filters = classification.get("filters", {})
# #     oncosuite_id = classification.get("resolved_oncosuite_id")
# #     arm_ids = classification.get("resolved_arm_ids")

# #     if intent == "filtered_search":
# #         return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

# #     if intent == "single_trial_lookup":
# #         nct_id = filters.get("nct_id")
# #         if nct_id:
# #             from db import query
# #             rows = query(
# #                 "SELECT oncosuite_id FROM oncosuite_gold.source_mapping "
# #                 "WHERE source_name = 'clinicaltrials.gov' AND source_unique_id = %(nct)s",
# #                 {"nct": nct_id},
# #             )
# #             if rows:
# #                 return "get_trial_detail", get_trial_detail(rows[0]["oncosuite_id"])
# #             return "get_trial_detail", {"error": f"no trial found for NCT id {nct_id}"}
# #         if oncosuite_id:
# #             return "get_trial_detail", get_trial_detail(oncosuite_id)
# #         return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

# #     if intent == "arm_comparison":
# #         if oncosuite_id and arm_ids:
# #             return "compare_arms", compare_arms(oncosuite_id, arm_ids)
# #         return "compare_arms", {"error": "could not resolve trial/arms from session context"}

# #     if intent == "landscape_or_trend":
# #         group_by = filters.get("group_by", ["drug_name", "phase"])
# #         return "get_competitive_landscape", get_competitive_landscape(
# #             group_by=group_by,
# #             condition=filters.get("condition"),
# #             target_or_moa=filters.get("target_or_moa"),
# #             outcome_metric=filters.get("outcome_metric"),
# #         )

# #     if intent == "outcome_deep_dive":
# #         if oncosuite_id:
# #             return "get_endpoints_and_outcomes", get_endpoints_and_outcomes(oncosuite_id)
# #         return "get_endpoints_and_outcomes", {"error": "could not resolve trial from session context"}

# #     return "unknown", {"error": f"unhandled intent: {intent}"}


# """
# Piece 5 -- router: intent classification + escalation logic + orchestration.

# IMPORTANT: `classify_and_extract` below is a PLACEHOLDER. In production this is
# a single Claude tool-use call (the "cheap model" slot) with the tool schema
# shown in CLASSIFY_TOOL_SCHEMA. This sandbox has no wired API credentials, so
# a small rule-based stand-in fills the same contract (same input, same output
# shape) purely so the rest of the pipeline -- escalation, memory, tool dispatch --
# can be built and tested end-to-end. Swap classify_and_extract's body for a
# real `anthropic.Anthropic().messages.create(...)` call using CLASSIFY_TOOL_SCHEMA
# as the tool definition; nothing else in this file needs to change.

# Escalation rules are deterministic code, NOT a model decision, per Doc 05 --
# implemented exactly as specified, in priority order.
# """
# import re

# from memory import SessionStore
# from tools.search_trials import search_trials
# from tools.get_trial_detail import get_trial_detail
# from tools.get_endpoints_and_outcomes import get_endpoints_and_outcomes
# from tools.get_hazard_ratios import get_hazard_ratios
# from tools.get_adverse_events import get_adverse_events
# from tools.compare_arms import compare_arms
# from tools.get_competitive_landscape import get_competitive_landscape
# from tools.get_trial_sources import get_trial_sources

# CLASSIFY_TOOL_SCHEMA = {
#     "name": "classify_and_extract",
#     "description": "Classify user intent and extract structured filters/entity references, "
#                     "resolving pronouns against the session working set in the same call.",
#     "input_schema": {
#         "type": "object",
#         "properties": {
#             "intent": {
#                 "type": "string",
#                 "enum": ["single_trial_lookup", "filtered_search", "arm_comparison",
#                          "landscape_or_trend", "outcome_deep_dive", "clarification_needed",
#                          "out_of_scope"],
#             },
#             "filters": {"type": "object"},
#             "resolved_oncosuite_id": {"type": "string"},
#             "resolved_arm_ids": {"type": "array", "items": {"type": "integer"}},
#         },
#         "required": ["intent"],
#     },
# }

# ALWAYS_ESCALATE_INTENTS = {"arm_comparison", "landscape_or_trend"}
# RESULT_SIZE_CHECK_INTENTS = {"filtered_search", "outcome_deep_dive"}
# RESULT_SIZE_THRESHOLD = 3


# def classify_and_extract(user_message: str, working_set: dict) -> dict:
#     """PLACEHOLDER cheap-model classifier -- replace with a real Claude tool-use call."""
#     msg = user_message.lower()

#     resolved_oncosuite_id = working_set.get("active_trial_id")
#     resolved_arm_ids = [a["arm_id"] for a in working_set.get("last_arms", [])]

#     # Explicit "compare ... arms" is the one case where a named trial should still go
#     # to arm comparison rather than full detail, so check it first.
#     if any(w in msg for w in ["compare", "vs", "versus"]) and ("arm" in msg or resolved_arm_ids):
#         return {"intent": "arm_comparison", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id,
#                 "resolved_arm_ids": resolved_arm_ids}

#     # An explicit NCT id means the user is asking about ONE specific trial. Route it to
#     # the full trial-detail view (which now carries endpoints, outcomes, hazard ratios,
#     # adverse events, safety, population, contacts, ranking, summary). This must beat the
#     # generic keyword rules below ("outcome", "survival", "what is", ...) -- otherwise a
#     # question like "what are the outcomes for NCT03706690" gets routed to a different
#     # tool / rejected as out-of-scope purely because of a keyword, ignoring the NCT id.
#     if re.search(r"nct\d{8}", msg):
#         m = re.search(r"nct\d{8}", msg)
#         return {"intent": "single_trial_lookup", "filters": {"nct_id": m.group(0).upper()}}

#     if any(w in msg for w in ["landscape", "trend", "how many trials", "competitive"]):
#         filters = {}
#         m = re.search(r"for ([a-z0-9\- ]+?)(?: in| trials|$)", msg)
#         if m:
#             filters["target_or_moa"] = [m.group(1).strip().upper()]
#         return {"intent": "landscape_or_trend", "filters": filters}

#     if any(w in msg for w in ["orr", "pfs", "os ", "survival", "response rate", "outcome"]):
#         return {"intent": "outcome_deep_dive", "filters": {}, "resolved_oncosuite_id": resolved_oncosuite_id}

#     if any(w in msg for w in ["what does", "what is", "define", "mechanism of"]) and "trial" not in msg:
#         return {"intent": "out_of_scope", "filters": {}}

#     filters = {}
#     if "nsclc" in msg or "lung" in msg:
#         filters["condition"] = ["NSCLC"]
#     known_biomarkers = ["kras", "egfr", "alk", "ros1"]
#     for bm in known_biomarkers:
#         if bm in msg:
#             filters.setdefault("biomarkers", []).append(bm.upper())
#     if "biomarkers" not in filters:
#         # naive fallback: "trials for <term>" with an unrecognized term -- pass it through
#         # as a literal biomarker filter so the vocab layer's unmatched-term path actually
#         # gets exercised, rather than silently dropping terms the keyword list doesn't know.
#         m = re.search(r"trials? for ([a-z0-9\-]+)", msg)
#         if m and m.group(1) not in known_biomarkers:
#             filters["biomarkers"] = [m.group(1)]
#     if "phase 3" in msg:
#         filters["phase"] = ["Phase 3"]
#     if "recruiting" in msg:
#         filters["study_status"] = ["Recruiting"]

#     return {"intent": "filtered_search", "filters": filters, "resolved_oncosuite_id": resolved_oncosuite_id}


# def should_escalate(intent, tool_result, unmatched_terms):
#     """Deterministic escalation logic -- real code, per Doc 05, in priority order."""
#     if unmatched_terms:
#         return False
#     if intent in ALWAYS_ESCALATE_INTENTS:
#         return True
#     if intent in RESULT_SIZE_CHECK_INTENTS:
#         if _count_distinct_trials(tool_result) > RESULT_SIZE_THRESHOLD:
#             return True
#     return False


# def _count_distinct_trials(tool_result):
#     if isinstance(tool_result, dict) and "results" in tool_result:
#         return len({r["oncosuite_id"] for r in tool_result["results"]})
#     return 0


# _sessions = SessionStore()


# def handle_turn(session_id: str, user_message: str) -> dict:
#     working_set = _sessions.get(session_id)
#     classification = classify_and_extract(user_message, working_set)
#     intent = classification["intent"]

#     if intent == "out_of_scope":
#         return {
#             "intent": intent,
#             "escalate": False,
#             "response_mode": "out_of_scope_policy_needed",
#             "note": "Doc 05 flags this as a product decision, not resolved here.",
#         }

#     tool_name, tool_result = _dispatch_tool(classification, working_set)
#     unmatched_terms = tool_result.get("unmatched_terms", []) if isinstance(tool_result, dict) else []

#     if unmatched_terms:
#         return {
#             "intent": intent, "escalate": False, "response_mode": "clarification_needed",
#             "unmatched_terms": unmatched_terms, "tool_name": tool_name,
#         }

#     escalate = should_escalate(intent, tool_result, unmatched_terms)
#     _sessions.update_after_tool_call(session_id, tool_name, tool_result)

#     filters = classification.get("filters", {})
#     filters_extracted = bool(filters and any(v for v in filters.values()))

#     synthesis = None
#     if escalate:
#         # NOTE: tool_result here comes ONLY from _dispatch_tool (the 8 real tools).
#         # text_to_sql.py's LLM-written SQL path is a completely separate branch in
#         # hybrid.py and never reaches this line -- see synthesis.py's module
#         # docstring for the enforced invariant.
#         from synthesis import synthesize
#         synthesis = synthesize(user_message, intent, tool_name, tool_result)

#     return {
#         "intent": intent, "tool_name": tool_name, "tool_result": tool_result,
#         "escalate": escalate,
#         "response_mode": "strong_model_synthesis" if escalate else "cheap_model_format",
#         "filters_extracted": filters_extracted,
#         "synthesis": synthesis,
#     }


# def _dispatch_tool(classification, working_set):
#     intent = classification["intent"]
#     filters = classification.get("filters", {})
#     oncosuite_id = classification.get("resolved_oncosuite_id")
#     arm_ids = classification.get("resolved_arm_ids")

#     if intent == "filtered_search":
#         return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

#     if intent == "single_trial_lookup":
#         nct_id = filters.get("nct_id")
#         if nct_id:
#             from db import query
#             rows = query(
#                 "SELECT oncosuite_id FROM oncosuite_gold.source_mapping "
#                 "WHERE source_name = 'clinicaltrials.gov' AND source_unique_id = %(nct)s",
#                 {"nct": nct_id},
#             )
#             if rows:
#                 return "get_trial_detail", get_trial_detail(rows[0]["oncosuite_id"])
#             return "get_trial_detail", {"error": f"no trial found for NCT id {nct_id}"}
#         if oncosuite_id:
#             return "get_trial_detail", get_trial_detail(oncosuite_id)
#         return "search_trials", search_trials(**{k: v for k, v in filters.items() if k != "nct_id"})

#     if intent == "arm_comparison":
#         if oncosuite_id and arm_ids:
#             return "compare_arms", compare_arms(oncosuite_id, arm_ids)
#         return "compare_arms", {"error": "could not resolve trial/arms from session context"}

#     if intent == "landscape_or_trend":
#         group_by = filters.get("group_by", ["drug_name", "phase"])
#         return "get_competitive_landscape", get_competitive_landscape(
#             group_by=group_by,
#             condition=filters.get("condition"),
#             target_or_moa=filters.get("target_or_moa"),
#             outcome_metric=filters.get("outcome_metric"),
#         )

#     if intent == "outcome_deep_dive":
#         if oncosuite_id:
#             return "get_endpoints_and_outcomes", get_endpoints_and_outcomes(oncosuite_id)
#         return "get_endpoints_and_outcomes", {"error": "could not resolve trial from session context"}

#     return "unknown", {"error": f"unhandled intent: {intent}"}



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
            "filters": {"type": "object"},
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
    # straight to text-to-SQL -- the fixed single-trial/arm tools cannot express counts,
    # groupings, or cross-trial breakdowns. Detect this FIRST, before the narrow
    # keyword rules below can mis-grab it (e.g. "vs" -> arm_comparison, or an active
    # trial in the session hijacking it into single_trial_lookup).
    _AGG = ("how many", "count", "number of", "broken down", "break down", "breakdown",
            "grouped by", "group by", "by phase", "by sponsor", "by status", "by country",
            "per phase", "per sponsor", "distribution", "average", "avg", "mean", "median",
            "total number", "most ", "least ", "fewest", "highest", "lowest", "top ", "rank",
            "across all", "how much", "percentage", "proportion")
    _PORTFOLIO = ("trials", "studies", "sponsors", "phases", "our oncology", "portfolio",
                  "recruiting vs", "vs completed", "vs. completed")
    if not re.search(r"nct\d{8}", msg) and any(a in msg for a in _AGG) and any(p in msg for p in _PORTFOLIO):
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
    if re.search(r"nct\d{8}", msg):
        m = re.search(r"nct\d{8}", msg)
        return {"intent": "single_trial_lookup", "filters": {"nct_id": m.group(0).upper()}}

    # A user may paste the INTERNAL oncosuite_id (e.g. "00v-vw5-Ejz") instead of an NCT
    # number. It has a distinctive 3-3-3 alphanumeric-with-hyphens shape. Detect it on
    # the ORIGINAL message (case-sensitive -- ids are mixed-case) and route straight to
    # the trial detail. dispatch resolves + tells the user the linked NCT id.
    _onco = re.search(r"\b([0-9A-Za-z]{3}-[0-9A-Za-z]{3}-[0-9A-Za-z]{3})\b", user_message)
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
        m = re.search(r"for ([a-z0-9\- ]+?)(?: in| trials|$)", msg)
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


def _general_knowledge_response(user_message):
    """LAST-RESORT fallback: when the database genuinely can't answer (no matching data,
    text-to-SQL declined), let the LLM answer from its own general knowledge -- but the
    response is clearly flagged as AI-generated and NOT from the trial database, so it's
    never confused with verified data. Returns a response dict or None."""
    import llm_client
    if not llm_client.available():
        return None
    # Don't answer greetings/thanks here (web_app handles small talk); only substantive
    # questions reach this point anyway. Keep it factual and cautious.
    system = (
        "You are a clinical-trials domain assistant. The user's question could NOT be "
        "answered from the trial database (the requested data isn't in it). Answer from "
        "your own general medical/oncology knowledge instead. Be accurate and concise. "
        "If you are not confident, say so. Do NOT invent specific trial IDs, enrollment "
        "numbers, or results as if they came from a database -- speak in general terms. "
        "Start your answer with a one-line note that this is general knowledge, not from "
        "the trial dataset."
    )
    try:
        text = llm_client.chat([
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ])
    except Exception:
        return None
    if not text or not text.strip():
        return None
    return {
        "intent": "general_knowledge", "tool_name": None, "escalate": True,
        "response_mode": "general_knowledge",
        "tool_result": {},
        "synthesis": {"text": text, "mode": "general_knowledge"},
    }


def _cohort_list_response(user_message, classification, on_step=None):
    """Cohort-level answer per the client's spec: 'N cohorts within M trials' + a
    table (OncoSuite ID | Indication | Regimen | Phase | Status), clickable rows,
    Key Insights, and Next Steps. Streams the client's 6 named steps. Returns a
    response dict with response_mode='cohort_list', or None to fall through."""
    def step(m):
        if on_step:
            on_step(m)

    filters = dict(classification.get("filters", {}) or {})
    filters.pop("nct_id", None)
    _cohort_keys = ("drug_name_or_target", "condition", "biomarkers",
                    "line_of_therapy", "phase", "study_status")
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
    if not kwargs:
        return None  # nothing to scope a cohort search on -> let normal cascade run

    step("Creating table structure")
    step("Pulling relevant data from the trials")
    tr = search_cohorts(**kwargs)
    step("Verifying source-data traceability")
    if not tr.get("results"):
        return None
    step("Generating table")
    from synthesis import synthesize_cohorts
    synthesis = synthesize_cohorts(user_message, tr)
    step("Generating key insights")

    return {
        "intent": "filtered_search", "tool_name": "search_cohorts",
        "escalate": False, "response_mode": "cohort_list",
        "tool_result": tr, "synthesis": synthesis,
        "filters_extracted": True,
    }


PAGE_SIZE = 200  # rows returned per "show all" page

_SHOW_ALL_CUES = ("show all", "show me all", "list all", "list every", "all the trials",
                  "all trials", "every trial", "full list", "entire list", "show everything")
_MORE_CUES = ("show more", "more trials", "next 200", "next page", "next batch",
              "next set", "see more", "load more", "continue", "more results", "next")


def _paginated_search_response(session_id, user_message, lm, classification,
                               working_set, history, on_step=None):
    """Handle "show all trials" and its "show more / next 200" follow-ups.

    Returns a response dict (paginated page of trials) or None to let the normal
    cascade handle the message. Uses search_trials' limit/offset + total_matches.
    """
    is_show_all = any(c in lm for c in _SHOW_ALL_CUES)
    # A bare "next" is only a pagination request if we actually have a page open.
    prev = working_set.get("pagination")
    is_more = bool(prev) and any(c in lm for c in _MORE_CUES)
    if not (is_show_all or is_more):
        return None

    filters = dict(classification.get("filters", {}) or {})
    filters.pop("nct_id", None)

    if is_more and prev:
        # Continue the SAME search the previous page used; advance the offset.
        filters = dict(prev.get("filters", {}))
        offset = int(prev.get("next_offset", 0))
    else:
        offset = 0

    if on_step:
        on_step(f"Fetching trials {offset + 1}–{offset + PAGE_SIZE} from the database")
    tool_result = search_trials(**{**filters, "limit": PAGE_SIZE, "offset": offset})
    results = tool_result.get("results", [])
    total = tool_result.get("total_matches", len(results))
    shown_upto = offset + len(results)
    if on_step:
        on_step(f"Found {total} trials — building the table")

    # Persist the cursor so a later "show more" continues from here.
    ws = _sessions.get(session_id)
    if shown_upto < total:
        ws["pagination"] = {"filters": filters, "next_offset": shown_upto, "total": total}
    else:
        ws.pop("pagination", None)          # exhausted -> clear so "next" stops paging
    _sessions.set(session_id, ws)
    _sessions.update_after_tool_call(session_id, "search_trials", tool_result)

    synthesis = _render_trial_page(results, offset, shown_upto, total, filters)
    _record_answer(session_id, synthesis)
    return {
        "intent": "filtered_search", "tool_name": "search_trials",
        "escalate": False, "response_mode": "paginated_list",
        "tool_result": tool_result, "synthesis": synthesis,
        "filters_extracted": bool(filters),
        "pagination": {"offset": offset, "shown_upto": shown_upto, "total": total,
                       "has_more": shown_upto < total},
    }


def _render_trial_page(results, offset, shown_upto, total, filters):
    """Deterministic tabular render of one page of trials + a next-page offer.
    No LLM needed: every value is copied straight from the tool result."""
    if not results:
        return {"text": "**No trials matched.**\nThere are no trials for these filters.",
                "mode": "deterministic", "table_data": []}

    scope = " (filtered)" if filters else ""
    header = (f"**Trials{scope}: showing {offset + 1}–{shown_upto} of {total}**")
    lines = [header, "",
             "| # | NCT ID | Trial | Phase | Status | Sponsor | Enrollment |",
             "|---|---|---|---|---|---|---|"]
    for i, r in enumerate(results, start=offset + 1):
        title = (r.get("title") or "")[:80]
        lines.append(
            f"| {i} | {r.get('nct_id') or '—'} | {title} | {r.get('phase') or '—'} "
            f"| {r.get('status') or '—'} | {r.get('sponsor') or '—'} | {r.get('enrollment') or '—'} |"
        )
    lines.append("")
    remaining = total - shown_upto
    if remaining > 0:
        nxt = min(PAGE_SIZE, remaining)
        lines.append(f"_Showing {shown_upto} of {total}. Want to explore more? "
                     f"Say **\"show more\"** for the next {nxt} trials._")
    else:
        lines.append(f"_That's all {total} trials._")
    return {"text": "\n".join(lines), "mode": "deterministic", "table_data": results}


def _record_answer(session_id, synthesis):
    """Store the assistant's answer text in the transcript so the NEXT turn's
    synthesize() call can see it for follow-up / cross-questioning."""
    if isinstance(synthesis, dict):
        text = synthesis.get("text")
        if text:
            conversations.add_assistant(session_id, text)


def handle_turn(session_id: str, user_message: str, on_step=None) -> dict:
    """on_step: optional callback(str) invoked with a human-readable status at each
    real stage (classify -> route -> query -> synthesize). Used by the SSE endpoint
    to STREAM the actual background steps to the UI, like Claude does. Default None
    keeps the plain blocking behaviour for /ask and the eval harness."""
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
    _nct = re.search(r"nct\d{8}", user_message, re.IGNORECASE)
    _onco = re.search(r"\b([0-9A-Za-z]{3}-[0-9A-Za-z]{3}-[0-9A-Za-z]{3})\b", user_message)
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
    _step(f"Classified as: {intent.replace('_', ' ')}")

    # GUARDRAIL: honor sponsor exclusions ("not interested in academia"). Inject the
    # exclusion into the filters so it flows into search_trials/landscape via dispatch.
    _excl = detect_sponsor_exclusion(user_message)
    if _excl:
        classification.setdefault("filters", {})["exclude_sponsor_type"] = _excl

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

    # SHOW-ALL / PAGINATION. "show me all the trials", "list every trial", and the
    # follow-ups "show more" / "next 200" return a large PAGE (PAGE_SIZE rows) with
    # the true total stated and an explicit offer to fetch the next page. We page
    # through with an offset cursor stored on the session, keyed to the active
    # filter set so "next 200" continues the SAME search. This runs before the
    # aggregate/RAG gates so a bare "show all trials" isn't grabbed as a no-filter
    # question and dropped to SQL/RAG.
    _pg = _paginated_search_response(session_id, user_message, _lm, classification,
                                     working_set, _history, _step)
    if _pg is not None:
        return _pg

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
    _is_landscape = any(c in _lm for c in _LANDSCAPE_CUES) and not re.search(r"nct\d{8}", _lm)
    if _is_landscape and intent not in ("single_trial_lookup", "arm_comparison"):
        _step("Building the competitive landscape (drug × phase breakdown)")
        filters = classification.get("filters", {}) or {}
        # infer condition from the message if the classifier didn't extract one
        cond = filters.get("condition")
        if not cond:
            if "nsclc" in _lm or "lung" in _lm:
                cond = ["lung"]
        group_by = ["drug_name", "phase"]
        ls = get_competitive_landscape(
            group_by=group_by,
            condition=cond,
            target_or_moa=filters.get("target_or_moa"),
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
        and not re.search(r"nct\d{8}", _lm)
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
        ts = _text_to_sql_response(user_message)
        if ts is not None:
            return ts
        # SQL couldn't answer -> semantic/RAG search over the embedded trials.
        vs = _vector_search_response(user_message)
        if vs is not None:
            return vs
        # Nothing in the DB at all -> last resort: AI general knowledge (flagged).
        gk = _general_knowledge_response(user_message)
        if gk is not None:
            return gk
        return {
            "intent": intent, "escalate": False,
            "response_mode": "out_of_scope_policy_needed",
            "note": "I couldn't derive that breakdown from the available data.",
        }

    if intent == "out_of_scope":
        # Before rejecting, try the text-to-SQL fallback -- the data may well be in the
        # DB even though no hardcoded rule matched the phrasing.
        ts = _text_to_sql_response(user_message)
        if ts is not None:
            return ts
        # SQL couldn't answer -> semantic/RAG search over the embedded trials.
        vs = _vector_search_response(user_message)
        if vs is not None:
            return vs
        # Still nothing from the DB -> answer from AI general knowledge, clearly flagged
        # as NOT from the trial database.
        gk = _general_knowledge_response(user_message)
        if gk is not None:
            return gk
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
    #      ("average enrollment", "how many", "count by sponsor", "most/least", ...).
    #      search_trials only returns a list of trials -- it can't average/group/rank.
    _filters = classification.get("filters", {})
    _msg = user_message.lower()
    _AGG_WORDS = ("average", "avg", "mean", "median", "sum", "total number",
                  "how many", "count", "number of", "most", "least", "fewest",
                  "highest", "lowest", "top ", "rank", "group by", "per ",
                  "distribution", "breakdown", "percentage", "proportion", "ratio",
                  # comparative / analytic phrasings the fixed search tool can't do
                  "more often", "less often", "compare", "comparison", "relationship",
                  "correlat", "fraction of", "similar to", "vs ", "versus", "than ",
                  "each ", "across all", "trend")
    _wants_aggregate = any(w in _msg for w in _AGG_WORDS)
    if intent == "filtered_search" and (
        not any(v for v in _filters.values()) or _wants_aggregate
    ):
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
    if escalate:
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

        # 1. Already have an explicit trial + arms from session context -> use them.
        if oncosuite_id and arm_ids:
            return "compare_arms", compare_arms(oncosuite_id, arm_ids)

        # 2. A trial is active but arms weren't captured -> pull that trial's arms.
        if oncosuite_id and not arm_ids:
            resolved_arms = _q(
                "SELECT a.arm_id FROM oncosuite_gold.arms_info a "
                "JOIN oncosuite_gold.cohort_info c ON c.cohort_id = a.cohort_id "
                "WHERE c.oncosuite_id = %(id)s",
                {"id": oncosuite_id},
            )
            aids = [r["arm_id"] for r in resolved_arms]
            if aids:
                return "compare_arms", compare_arms(oncosuite_id, aids)
            return "compare_arms", {"error": f"trial {oncosuite_id} has no arms recorded to compare"}

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
                rid = results[0]["oncosuite_id"]
                resolved_arms = _q(
                    "SELECT a.arm_id FROM oncosuite_gold.arms_info a "
                    "JOIN oncosuite_gold.cohort_info c ON c.cohort_id = a.cohort_id "
                    "WHERE c.oncosuite_id = %(id)s",
                    {"id": rid},
                )
                aids = [r["arm_id"] for r in resolved_arms]
                if aids:
                    return "compare_arms", compare_arms(rid, aids)
                return "compare_arms", {"error": f"trial {rid} has no arms recorded to compare"}

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