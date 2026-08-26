"""
LangGraph agentic node for MULTI-STEP questions the single-shot router can't do
in one tool call -- e.g. "find trials similar to NCT06793215, then compare their
arms" or "search lung trials with EGFR, pick the largest, and detail it".

Design (honest about the constraints):
  - The router (router.handle_turn) stays the single-shot fast path. It delegates
    to run_agent() ONLY for questions flagged as multi-step (see router wiring).
  - This is a manual ReAct loop built on a LangGraph StateGraph, NOT the LangChain
    chat-model abstraction: we reuse the existing llm_client (deepseek-flash) for
    the reasoning step so there is no second LLM stack. The model emits a small
    JSON action each turn; we execute a real Python tool; we loop until it emits a
    final answer or we hit MAX_STEPS.
  - Every tool is one of the app's REAL, verified tools -- the agent cannot invent
    data, only call these and reason over their JSON output.

Graph:
    START -> agent -> (tool?) --yes--> tools -> agent ;  --no--> END

State carries the running scratchpad of (thought, action, observation) steps so
the model sees what it has already learned. Returns a dict in handle_turn's shape
so web_app.render_answer can display it (response_mode 'agentic').
"""
import datetime
import decimal
import json
import re
from typing import Annotated, TypedDict


def _json_default(o):
    """Make DB values (date/datetime/Decimal) JSON-serialisable for the scratchpad."""
    if isinstance(o, (datetime.date, datetime.datetime)):
        return o.isoformat()
    if isinstance(o, decimal.Decimal):
        return float(o)
    return str(o)


def _dumps(obj, limit=None):
    s = json.dumps(obj, default=_json_default)
    return s[:limit] if limit else s


from langgraph.graph import StateGraph, START, END

import config
import llm_client
from tools.search_trials import search_trials
from tools.get_trial_detail import get_trial_detail
from tools.compare_arms import compare_arms
from db import query

MAX_STEPS = 6  # hard cap on reasoning iterations (cost + loop safety)


# --------------------------------------------------------------------------- #
# Tool registry -- the ONLY actions the agent may take. Each entry: callable +
# a one-line spec the model sees. Args are passed as a JSON object.
# --------------------------------------------------------------------------- #
def _tool_search_trials(args):
    return search_trials(
        condition=args.get("condition"),
        biomarkers=args.get("biomarkers"),
        phase=args.get("phase"),
        study_status=args.get("study_status"),
        drug_name_or_target=args.get("drug_name_or_target"),
        limit=args.get("limit", 10),
    )


def _tool_get_trial_detail(args):
    oid = args.get("oncosuite_id")
    nct = args.get("nct_id")
    if nct and not oid:
        rows = query(
            "SELECT oncosuite_id FROM oncosuite_gold.source_mapping "
            "WHERE source_name='clinicaltrials.gov' AND source_unique_id=%(n)s",
            {"n": nct},
        )
        oid = rows[0]["oncosuite_id"] if rows else None
    if not oid:
        return {"error": "no oncosuite_id/nct_id given"}
    return get_trial_detail(oid)


def _tool_compare_arms(args):
    oid = args.get("oncosuite_id")
    if not oid:
        return {"error": "oncosuite_id required"}
    arm_rows = query(
        "SELECT a.arm_id FROM oncosuite_gold.arms_info a "
        "JOIN oncosuite_gold.cohort_info c ON c.cohort_id=a.cohort_id "
        "WHERE c.oncosuite_id=%(id)s",
        {"id": oid},
    )
    aids = [r["arm_id"] for r in arm_rows]
    if not aids:
        return {"error": f"trial {oid} has no arms"}
    return compare_arms(oid, aids)


TOOLS = {
    "search_trials": (
        _tool_search_trials,
        'search_trials {"condition":[...],"biomarkers":[...],"phase":[...],"limit":N} '
        "-> list of matching trials (oncosuite_id, nct_id, title, phase, sponsor)",
    ),
    "get_trial_detail": (
        _tool_get_trial_detail,
        'get_trial_detail {"nct_id":"NCT..."} or {"oncosuite_id":"..."} '
        "-> full detail for ONE trial (cohorts, arms, endpoints, safety)",
    ),
    "compare_arms": (
        _tool_compare_arms,
        'compare_arms {"oncosuite_id":"..."} '
        "-> arm-by-arm endpoints + adverse events for ONE trial",
    ),
}


def _tools_spec():
    return "\n".join(f"- {spec}" for _, spec in TOOLS.values())


# --------------------------------------------------------------------------- #
# Graph state
# --------------------------------------------------------------------------- #
class AgentState(TypedDict):
    question: str
    steps: Annotated[list, lambda a, b: (a or []) + (b or [])]  # append-only scratchpad
    final: str
    next_action: dict  # {"tool":..., "args":...} or {} when done


_SYSTEM = """You are a clinical-trials research agent. Answer the user's question by
calling the available TO

OLS one at a time, reasoning over each result, until you can
give a final grounded answer. You may only use these tools:

{tools}

On each turn respond with ONE JSON object and nothing else, in one of two forms:
  {{"thought": "<why>", "tool": "<tool_name>", "args": {{...}}}}
  {{"thought": "<why>", "final": "<the full answer to the user, grounded ONLY in tool results>"}}

EXACT FILTER VALUES (use these literal strings, do NOT guess variants):
- phase: "Phase 1", "Phase 2", "Phase 3", "Phase 4" (NOT "III"/"3"/"P3")
- study_status: "Recruiting", "Active - Not Recruiting", "Completed", "Terminated"
- condition/biomarkers: pass the plain word ("lung", "EGFR"); the search fuzzy-matches.

Rules:
- Base every fact ONLY on tool observations. Never invent trial ids, numbers, or results.
- Take the fewest steps needed. When you have enough to answer, emit "final".
- Do not repeat an identical search that already returned nothing -- change the filters or conclude.
- If tools cannot answer, say so plainly in "final".
{format_contract}
"""


def _agent_node(state: AgentState):
    scratch = ""
    for s in state.get("steps", []):
        scratch += (f"\nThought: {s.get('thought','')}\n"
                    f"Action: {s.get('tool','')} {_dumps(s.get('args',{}))}\n"
                    f"Observation: {_dumps(s.get('observation'), 1500)}\n")
    system = _SYSTEM.format(tools=_tools_spec(),
                            format_contract=config.ANSWER_FORMAT_CONTRACT)
    user = f"QUESTION: {state['question']}\n"
    # When we're at the step budget, force a final answer this turn -- do not let
    # the model request another tool (that would hit the recursion cap and lose work).
    near_budget = len(state.get("steps", [])) >= MAX_STEPS - 1
    if scratch:
        user += f"\nWORK SO FAR:{scratch}\n\n"
        user += ('You are OUT of tool budget. Respond NOW with a {"thought","final"} '
                 'JSON object answering from the work above.' if near_budget
                 else "Next JSON action:")
    else:
        user += "\nNext JSON action:"
    # Retry the reasoning call once if the model returns something unparseable --
    # deepseek-flash occasionally emits prose instead of the JSON action, and a
    # single reminder almost always fixes it. This is the main flakiness fix.
    action = {}
    raw = ""
    for attempt in range(2):
        msgs = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        if attempt == 1:
            msgs.append({"role": "user", "content":
                         "Your last reply was not valid. Respond with ONLY one JSON "
                         'object: {"thought":...,"tool":...,"args":{...}} or '
                         '{"thought":...,"final":...}. No prose, no fences.'})
        try:
            raw = llm_client.chat(msgs)
        except llm_client.LLMUnavailable:
            return {"final": "The reasoning model is unavailable, so I can't complete this multi-step request right now.",
                    "next_action": {}}
        action = _parse_action(raw)
        if action:
            break
    if "final" in action:
        return {"final": action["final"], "next_action": {}}
    # Out of budget but model still wants a tool -> synthesise a final from what we
    # have instead of looping into the recursion cap.
    if near_budget:
        forced = _force_final_from_steps(state["question"], state.get("steps", []))
        return {"final": forced or "I gathered partial data but couldn't complete the full comparison.",
                "next_action": {}}
    if action.get("tool") in TOOLS:
        return {"next_action": {"tool": action["tool"], "args": action.get("args", {}),
                                "thought": action.get("thought", "")}}
    # Unparseable / unknown tool -> stop with what we have.
    return {"final": raw.strip() or "I couldn't determine a next step.", "next_action": {}}


def _tools_node(state: AgentState):
    act = state["next_action"]
    fn = TOOLS[act["tool"]][0]
    try:
        obs = fn(act.get("args", {}))
    except Exception as e:  # a tool erroring must not kill the graph
        obs = {"error": f"{type(e).__name__}: {e}"}
    return {"steps": [{"thought": act.get("thought", ""), "tool": act["tool"],
                       "args": act.get("args", {}), "observation": obs}]}


def _route(state: AgentState):
    return "tools" if state.get("next_action") else END


def _parse_action(raw: str) -> dict:
    t = raw.strip()
    t = re.sub(r"^```(?:json)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    # grab the first {...} block
    m = re.search(r"\{.*\}", t, re.DOTALL)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


# Build the graph once at import.
def _build():
    g = StateGraph(AgentState)
    g.add_node("agent", _agent_node)
    g.add_node("tools", _tools_node)
    g.add_edge(START, "agent")
    g.add_conditional_edges("agent", _route, {"tools": "tools", END: END})
    g.add_edge("tools", "agent")
    return g.compile()


_GRAPH = _build()


def _force_final_from_steps(question, steps):
    """If the loop ended without a 'final' (step cap / parse miss), synthesise an
    answer from whatever observations were gathered rather than giving up. This is
    what keeps the agent from flakily returning None on a valid multi-step question."""
    if not steps:
        return ""
    scratch = ""
    for s in steps:
        scratch += (f"\nAction: {s.get('tool','')} {_dumps(s.get('args',{}))}\n"
                    f"Observation: {_dumps(s.get('observation'), 1500)}\n")
    system = (
        "You are a clinical-trials assistant. Using ONLY the tool observations below, "
        "answer the user's question. Ground every fact in the observations; if they "
        "don't fully answer it, say what is and isn't known. Do not invent data.\n\n"
        + config.ANSWER_FORMAT_CONTRACT + f"\n\nTOOL WORK:{scratch}"
    )
    try:
        return llm_client.chat([
            {"role": "system", "content": system},
            {"role": "user", "content": question},
        ]).strip()
    except llm_client.LLMUnavailable:
        return ""


def run_agent(user_message: str) -> dict:
    """Run the multi-step agent. Returns a handle_turn-shaped response dict, or None
    if the agent produced nothing usable (caller then falls back)."""
    out = None
    try:
        out = _GRAPH.invoke(
            {"question": user_message, "steps": [], "final": "", "next_action": {}},
            {"recursion_limit": MAX_STEPS * 2 + 2},
        )
    except Exception as _e:
        # Most commonly GraphRecursionError (hit the step cap without emitting a
        # final). We can still salvage an answer from the partial state if the
        # checkpointer exposed it; otherwise fall through to None below.
        import os
        if os.environ.get("AGENT_DEBUG"):
            print(f"[agent] invoke raised: {type(_e).__name__}: {_e}")
        out = None
    answer = (out or {}).get("final", "").strip() if out else ""
    steps = (out or {}).get("steps", []) if out else []
    # No explicit final but we DID gather observations -> synthesise from them.
    if not answer and steps:
        answer = _force_final_from_steps(user_message, steps)
    if not answer:
        return None
    trace = [{"tool": s["tool"], "args": s["args"]} for s in steps]
    return {
        "intent": "agentic", "tool_name": "agent", "escalate": True,
        "response_mode": "agentic",
        "tool_result": {"steps": trace},
        "synthesis": {"text": answer, "mode": "llm"},
    }
