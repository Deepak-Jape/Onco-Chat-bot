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

import os
import requests

# ctsearch's own REST API -- the SAME /search/search_results endpoint the
# React app's Find Trials page and chatbot use (see ctsearch's
# src/redux/trialsDataSlice.js). Every agent search cross-checks the DB tool
# (search_trials, above) against this live API so a discrepancy between them
# -- different indexing, a stale materialized view, whatever the cause -- is
# something the answer can actually surface to the user instead of silently
# trusting one source. Configurable because this backend and ctsearch's API
# are deployed independently.
CTSEARCH_API_BASE = os.environ.get(
    "CTSEARCH_API_BASE", "https://204.168.157.213.sslip.io",
)

MAX_STEPS = 10  # hard cap on reasoning iterations (cost + loop safety)
# A dual-sourced compare-and-recommend answer needs exactly 8 tool calls by
# design (search_trials + search_trials_api, per option, at 2 angles -- see
# the COMPARE-AND-RECOMMEND prompt section) plus 1 turn to write "final" --
# 10 gives a little slack without leaving room for the open-ended over-
# exploration (extra angles, limit:1000 re-runs) that a much larger cap
# invited, which burned enough consecutive LLM turns in one request to hit
# real rate limits before ever reaching a final answer. Raise this only if
# the prompt's own step budget for the flow changes.


# --------------------------------------------------------------------------- #
# Tool registry -- the ONLY actions the agent may take. Each entry: callable +
# a one-line spec the model sees. Args are passed as a JSON object.
# --------------------------------------------------------------------------- #
def _tool_search_trials(args):
    return search_trials(
        condition=args.get("condition"),
        biomarkers=args.get("biomarkers"),
        cancer_stage=args.get("cancer_stage"),
        line_of_therapy=args.get("line_of_therapy"),
        prior_therapy=args.get("prior_therapy"),
        phase=args.get("phase"),
        study_status=args.get("study_status"),
        drug_name_or_target=args.get("drug_name_or_target"),
        sponsor=args.get("sponsor"),
        limit=args.get("limit", 10),
    )


def _as_list(v):
    if v is None:
        return None
    return v if isinstance(v, list) else [v]


def search_trials_api(condition=None, biomarkers=None, cancer_stage=None,
                       line_of_therapy=None, prior_therapy=None, phase=None,
                       study_status=None, sponsor=None, page_size=10):
    """Cross-check search_trials (Postgres) against ctsearch's own live
    /search/search_results REST API -- same endpoint the React app's Find
    Trials page and chatbot use. Same filter dimensions as search_trials,
    minus drug_name_or_target (no equivalent single ctsearch filter key --
    that dimension is DB-only). Returns {"total_matches", "results": [...]}
    in the same shape search_trials uses, or {"error": ...} if the API call
    itself failed (network, non-200, unexpected shape) -- a failure here must
    never crash the agent turn, only be reported as "API check unavailable"."""
    include = {}
    if condition:
        # search_trials matches condition against organ OR histology (one
        # match in either is enough). search_results ANDs across DIFFERENT
        # include keys, so sending both organ AND histology for the same term
        # would require a trial to match BOTH simultaneously -- for a
        # histology-coded term like "NSCLC" (not a real organ value) that
        # returns 0, silently reading as a false discrepancy against
        # search_trials's real count. Send histology only: every condition
        # term this agent actually uses (NSCLC, SCLC, EGFR-mutant NSCLC, ...)
        # is histology-coded in this dataset, not organ-coded.
        include["histology"] = _as_list(condition)
    if biomarkers:
        include["biomarkers"] = _as_list(biomarkers)
    if cancer_stage:
        include["cancer_stage"] = _as_list(cancer_stage)
    if line_of_therapy:
        include["line_of_therapy"] = _as_list(line_of_therapy)
    if prior_therapy:
        include["prior_therapy"] = _as_list(prior_therapy)
    if phase:
        include["phases"] = _as_list(phase)
    if study_status:
        include["trial_status"] = _as_list(study_status)
    if sponsor:
        include["sponsor_name"] = _as_list(sponsor)

    if not include:
        return {"error": "no filters given"}

    try:
        resp = requests.post(
            f"{CTSEARCH_API_BASE}/search/search_results",
            json={"include": include, "exclude": {}, "applied_filters": {}},
            params={"page": 1, "page_size": page_size, "sorting_method": "best_search"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return {"error": f"ctsearch API unavailable: {type(e).__name__}: {e}"}

    rows = data.get("data") or []
    return {
        "source": "ctsearch_api",
        "total_matches": data.get("total_found", len(rows)),
        "results": [
            {
                "oncosuite_id": r.get("oncosuite_id"),
                "title": r.get("official_title"),
                "phase": r.get("phases"),
                "histology": r.get("histology"),
                "treatment": r.get("treatment"),
                "biomarkers": r.get("biomarkers"),
                "enrollment_count": r.get("enrollment_count"),
            }
            for r in rows[:page_size]
        ],
    }


def _tool_search_trials_api(args):
    return search_trials_api(
        condition=args.get("condition"),
        biomarkers=args.get("biomarkers"),
        cancer_stage=args.get("cancer_stage"),
        line_of_therapy=args.get("line_of_therapy"),
        prior_therapy=args.get("prior_therapy"),
        phase=args.get("phase"),
        study_status=args.get("study_status"),
        sponsor=args.get("sponsor"),
        page_size=args.get("limit", 10),
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
        'search_trials {"condition":[...],"biomarkers":[...],"cancer_stage":[...],'
        '"line_of_therapy":[...],"prior_therapy":[...],"phase":[...],'
        '"study_status":[...],"drug_name_or_target":[...],"sponsor":[...],"limit":N} '
        "-> list of matching trials (oncosuite_id, nct_id, title, phase, sponsor), "
        "read DIRECTLY from the Postgres database. Every arg is optional and "
        "OR-within/AND-across groups; pass only the ones the question actually "
        "named. To COMPARE options along ANY of these dimensions (e.g. \"1L vs "
        "2L\", \"phase 2 vs phase 3\", \"EGFR vs KRAS\"), call this tool ONCE "
        "PER OPTION with everything else held fixed, changing only the "
        "dimension being compared, then reason over the result sets in your "
        "final answer. See search_trials_api below -- EVERY search_trials "
        "call should be paired with one search_trials_api call for the same "
        "filters.",
    ),
    "search_trials_api": (
        _tool_search_trials_api,
        'search_trials_api {"condition":[...],"biomarkers":[...],"cancer_stage":[...],'
        '"line_of_therapy":[...],"prior_therapy":[...],"phase":[...],'
        '"study_status":[...],"sponsor":[...],"limit":N} '
        "-> the SAME kind of trial list as search_trials, but from ctsearch's "
        "own live REST API (the production search behind the Find Trials "
        "page) instead of a direct DB read -- an independent second source "
        "for the same filters. No drug_name_or_target arg (DB-only "
        "dimension). ALWAYS call this alongside search_trials with the SAME "
        "filters (condition/biomarkers/line_of_therapy/etc.) so you have two "
        "independently-sourced counts for every search you run, not just "
        "comparisons -- if total_matches from the two disagree noticeably, "
        "say so explicitly in \"final\" rather than picking one silently; if "
        "they roughly agree, that agreement is itself evidence worth citing "
        "as \"cross-checked against ctsearch's live index\". A "
        "{\"error\":...} result means the API check was unavailable for that "
        "search -- fall back to the DB count alone and note the API side "
        "couldn't be verified, do not treat it as zero results.",
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
calling the available TOOLS one at a time, reasoning over each result, until you can
give a final grounded answer. You may only use these tools:

{tools}

On each turn respond with ONE JSON object and nothing else, in one of two forms:
  {{"thought": "<why>", "tool": "<tool_name>", "args": {{...}}}}
  {{"thought": "<why>", "final": "<the full answer to the user, grounded ONLY in tool results>"}}

EXACT FILTER VALUES (use these literal strings, do NOT guess variants):
- phase: "Phase 1", "Phase 2", "Phase 3", "Phase 4" (NOT "III"/"3"/"P3")
- study_status: "Recruiting", "Active - Not Recruiting", "Completed", "Terminated"
- condition/biomarkers: pass the plain word ("lung", "EGFR"); the search fuzzy-matches.
- line_of_therapy: "1L", "2L", "2L+", "3L", "3L+" (not "first line" -- expand it yourself)

COMPARE-AND-RECOMMEND questions ("is 1L or 2L better to run a trial on", "phase 2
vs phase 3 for EGFR", "which biomarker has more competition, KRAS or EGFR") ask you
to pick a side, not just report two numbers. Handle these as:
1. For EACH option being compared, run BOTH search_trials AND search_trials_api
   with the same filters (per the pairing rule above), holding every other
   named filter fixed and changing only the dimension in question -- e.g. for
   "1L vs 2L": search_trials{{line_of_therapy:["1L"]}}, search_trials_api{{
   line_of_therapy:["1L"]}}, search_trials{{line_of_therapy:["2L"]}},
   search_trials_api{{line_of_therapy:["2L"]}}. Two sources x two options
   = 4 calls.
2. Then run the SAME pair of searches again, each ADDING study_status=
   ["Recruiting"] -- another 4 calls -- so you have both a raw-count
   comparison and an actively-recruiting comparison for each option.
3. STOP THERE and write "final". These two angles (raw count + recruiting,
   each dual-sourced = 8 tool calls total) are the full required depth for
   this question shape -- do not add a third angle (phase mix, sponsor type,
   a bigger limit, a re-run of a search you already did), and do not run any
   search with limit above 25: you only need enough rows to name a handful
   of representative trials as evidence, not the complete result set. Every
   extra call is a real LLM turn against a shared budget -- past 8 calls you
   are trading answer completeness for a real risk of running out of turns
   before writing anything at all, which is worse than a slightly shallower
   but COMPLETE answer.
4. In "final", state which option has more/fewer matching trials at each
   angle you checked (cite the exact counts from every search you ran, and
   note whether search_trials and search_trials_api agreed for each), and
   ground the recommendation in what those numbers mean for the user's
   actual question (e.g. fewer existing 2L trials for a condition can mean
   either a promising white-space opportunity to run a NEW trial, OR a sign
   the space is harder to recruit/underexplored for a reason -- say which
   reading fits based on what the trials you found show, and be explicit
   that you are not the final word).
5. List a handful of representative trials from EACH side as evidence the
   reader can click into, not just a bare count. Cite EVERY trial as
   "oncosuite_id (NCT id)" -- e.g. "wcl-QtS-CxB (NCT07063745)" -- using BOTH
   ids from the same search_trials row, never oncosuite_id or NCT id alone.
   This applies everywhere you name a trial, including any "References"
   section: list oncosuite_id (NCT id) pairs, not bare NCT ids.
6. If the user also asks which phase/line to run their OWN trial on, treat that
   as the same comparison shape (search per candidate phase/line, compare, and
   give a reasoned recommendation) rather than declining because it sounds
   forward-looking rather than a lookup -- the trial landscape you can query IS
   the evidence for that decision.
7. Never claim clinical/regulatory authority you do not have: this is landscape
   evidence from the trials in the database, not medical or regulatory advice --
   say so plainly whenever you give a recommendation.

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
            # A rate limit / transient outage mid-loop must not discard
            # already-gathered tool observations -- if 8 real searches ran
            # before this turn's call failed, that is a complete, answerable
            # comparison; only the LAST write-up call broke. Try to salvage a
            # final answer from what's already in the scratchpad (same path
            # near_budget uses) before falling back to the flat unavailable
            # message, which previously fired even with a full scratchpad.
            forced = _force_final_from_steps(state["question"], state.get("steps", []))
            return {"final": forced or "The reasoning model is unavailable, "
                    "so I can't complete this multi-step request right now.",
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


def _bare_summary_from_steps(steps):
    """Last-resort, no-LLM summary of the raw tool observations -- used only if
    the LLM synthesis itself is unavailable/errors, so a real multi-step
    investigation (e.g. 5 search_trials calls comparing two options) never
    collapses to nothing just because the final write-up call failed. Plain
    but grounded: exactly what each call searched for and how many rows it
    matched, which is enough to answer a comparison by count alone."""
    lines = ["I couldn't finish writing a full summary, but here is what the searches found:"]
    for s in steps:
        tool = s.get("tool", "")
        args = s.get("args", {})
        obs = s.get("observation")
        if tool == "search_trials" and isinstance(obs, dict) and "results" in obs:
            n = len(obs.get("results") or [])
            total = obs.get("total_matches", n)
            ids = ", ".join(
                r.get("oncosuite_id") or r.get("nct_id") or "?"
                for r in (obs.get("results") or [])[:5]
            )
            lines.append(f"- {_dumps(args)} -> {total} match(es){f'; e.g. {ids}' if ids else ''}")
        else:
            lines.append(f"- {tool} {_dumps(args)} -> {_dumps(obs, 300)}")
    return "\n".join(lines)


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
    except Exception:
        # Any failure here (LLMUnavailable, timeout, malformed response) must
        # still fall back to SOMETHING grounded rather than an empty string --
        # an empty string is what sends a fully-worked comparison back to
        # router.py's out_of_scope branch, discarding every tool call made.
        return _bare_summary_from_steps(steps)


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
