"""
Piece 7 -- eval harness grading engine.
Two of the three grading layers are fully automated (tool-call accuracy,
escalation accuracy). The third (answer quality) uses a real LLM judge call
via llm_client, gated on llm_client.available() so this still degrades to a
clear "not scored" note when no backend/key is configured.
"""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from router import handle_turn, _sessions
from eval.seed_cases import SEED_CASES


def judge_answer_quality(tool_result, final_answer_text, required_facts=None, required_citations=None):
    """
    NOTE: ideally this runs on a FIXED judge model separate from the model under
    test, so grading doesn't drift as the production model changes. Only one
    backend (config.LLM_BACKEND) is configured in this environment, so the judge
    call reuses it -- same-model grading is weaker (a model is less likely to
    catch its own mistakes) but still surfaces clear hallucinations/omissions.
    Returns {"score": float|None, "grounded": bool|None, "issues": [...], "note": str}.
    """
    import llm_client
    if not final_answer_text:
        return {"score": None, "grounded": None, "issues": [], "note": "no answer text to judge"}
    if not llm_client.available():
        return {"score": None, "grounded": None, "issues": [],
                 "note": "not scored -- no LLM backend/key configured"}

    facts_block = ("\n".join(f"- {f}" for f in required_facts) if required_facts
                   else "(none specified -- judge for general grounding/hallucination only)")
    citations_block = ("\n".join(f"- {c}" for c in required_citations) if required_citations
                        else "(none specified)")
    prompt = f"""You are a strict grading judge for a clinical-trials assistant. Given the
GROUNDING DATA (the only source of truth the assistant was allowed to use) and the
ASSISTANT'S ANSWER, grade the answer.

GROUNDING DATA (tool result, as JSON):
{json.dumps(tool_result, default=str)[:100000]}

REQUIRED FACTS the answer should contain:
{facts_block}

REQUIRED CITATIONS the answer should contain:
{citations_block}

ASSISTANT'S ANSWER:
{final_answer_text[:12000]}

Grade strictly. A claim is a HALLUCINATION only if it states something as fact that
contradicts or is absent from the grounding data AND is not clearly labeled as general
knowledge. Respond with ONLY a JSON object, no prose, no markdown fences:
{{"score": <0.0-1.0 float, 1.0 = fully grounded and complete>,
  "grounded": <true|false>,
  "missing_required_facts": [<strings>],
  "hallucinations": [<short strings describing any unsupported claim>]}}"""

    try:
        raw = llm_client.chat([{"role": "user", "content": prompt}])
    except llm_client.LLMUnavailable as e:
        return {"score": None, "grounded": None, "issues": [], "note": f"judge call failed: {e}"}

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return {"score": None, "grounded": None, "issues": [],
                 "note": f"judge returned unparseable output: {raw[:200]}"}
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return {"score": None, "grounded": None, "issues": [],
                 "note": f"judge returned invalid JSON: {match.group(0)[:200]}"}

    issues = list(parsed.get("missing_required_facts") or []) + list(parsed.get("hallucinations") or [])
    return {"score": parsed.get("score"), "grounded": parsed.get("grounded"),
            "issues": issues, "note": "scored by live judge call"}


def check_required_facts(answer_text, tool_result, required_facts):
    """Deterministic, case-insensitive substring check -- cheap, exact, zero
    hallucination-risk of its own (unlike the LLM judge).

    Checks the LLM-narrated answer_text AND the raw tool_result JSON, not just
    the former: several tools (e.g. get_endpoints_and_outcomes / outcome_deep_dive
    when it doesn't escalate) skip synthesis.py entirely and are rendered by a
    DETERMINISTIC HTML function in web_app.py straight from tool_result -- see
    render_endpoints_and_outcomes(). This harness calls router.handle_turn()
    directly and never reaches that rendering layer, so checking answer_text
    alone would falsely report those turns as missing facts that the real user
    sees just fine. tool_result is the actual source those renderers draw from,
    so checking it is a faithful (if slightly generous -- it doesn't confirm the
    HTML renderer wires up every field) proxy for what a user would see.

    Returns (ok: bool|None, missing: list[str]). None means "not applicable"
    (no required_facts specified for this turn)."""
    if not required_facts:
        return None, []
    text = ((answer_text or "") + "\n" + json.dumps(tool_result, default=str)).lower()
    missing = [f for f in required_facts if f.lower() not in text]
    return (len(missing) == 0), missing


def run_seed_set():
    tool_correct, tool_total = 0, 0
    escalation_correct, escalation_total = 0, 0
    facts_correct, facts_total = 0, 0
    quality_scores = []
    results = []

    for case in SEED_CASES:
        session_id = f"eval-{case['id']}"

        if case.get("seed_session_oncosuite_id"):
            from tools.get_trial_detail import get_trial_detail
            detail = get_trial_detail(case["seed_session_oncosuite_id"])
            _sessions.update_after_tool_call(session_id, "get_trial_detail", detail)

        case_result = {"id": case["id"], "category": case["category"], "turns": []}

        for i, turn in enumerate(case["conversation"]):
            outcome = handle_turn(session_id, turn["user"])

            expected_tool = case["expected_tool"][i] if i < len(case.get("expected_tool", [])) else None
            actual_tool = outcome.get("tool_name")
            tool_ok = (actual_tool == expected_tool)
            tool_total += 1
            tool_correct += int(tool_ok)

            expected_esc = case["expected_escalation"][i] if i < len(case.get("expected_escalation", [])) else None
            actual_esc = outcome.get("escalate")
            esc_ok = (actual_esc == expected_esc)
            escalation_total += 1
            escalation_correct += int(esc_ok)

            answer_text = (outcome.get("synthesis") or {}).get("text")

            turn_facts = case.get("required_facts")
            required_facts = turn_facts[i] if turn_facts and i < len(turn_facts) else None
            facts_ok, missing_facts = check_required_facts(
                answer_text, outcome.get("tool_result"), required_facts)
            if facts_ok is not None:
                facts_total += 1
                facts_correct += int(facts_ok)

            judged = judge_answer_quality(outcome.get("tool_result"), answer_text, required_facts)
            if judged.get("score") is not None:
                quality_scores.append(judged["score"])

            case_result["turns"].append({
                "user": turn["user"],
                "expected_tool": expected_tool, "actual_tool": actual_tool, "tool_ok": tool_ok,
                "expected_escalation": expected_esc, "actual_escalation": actual_esc, "esc_ok": esc_ok,
                "response_mode": outcome.get("response_mode"),
                "required_facts": required_facts, "facts_ok": facts_ok, "missing_facts": missing_facts,
                "answer_quality": judged,
            })

            if case.get("expect_unmatched_terms"):
                got_unmatched = bool(outcome.get("unmatched_terms"))
                case_result["turns"][-1]["unmatched_terms_ok"] = got_unmatched

        results.append(case_result)

    tool_call_accuracy = tool_correct / tool_total if tool_total else 0
    escalation_accuracy = escalation_correct / escalation_total if escalation_total else 0
    required_facts_accuracy = facts_correct / facts_total if facts_total else None
    answer_quality = (round(sum(quality_scores) / len(quality_scores), 3)
                       if quality_scores else None)

    return {
        "tool_call_accuracy": round(tool_call_accuracy, 3),
        "escalation_accuracy": round(escalation_accuracy, 3),
        "required_facts_accuracy": (round(required_facts_accuracy, 3)
                                     if required_facts_accuracy is not None else "n/a -- no case had required_facts"),
        "required_facts_n": facts_total,
        "n_cases": len(SEED_CASES),
        "n_turns": tool_total,
        "answer_quality": answer_quality if answer_quality is not None
                           else "not scored -- no LLM backend/key configured",
        "answer_quality_n": len(quality_scores),
        "case_results": results,
    }


if __name__ == "__main__":
    import json
    report = run_seed_set()
    print(json.dumps(report, indent=2, default=str))
