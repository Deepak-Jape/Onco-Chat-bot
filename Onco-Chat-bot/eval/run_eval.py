"""
Piece 7 -- eval harness grading engine.
Two of the three grading layers are fully automated (tool-call accuracy,
escalation accuracy). The third (answer quality) needs a real LLM judge --
stubbed here with a clear placeholder, since it requires an actual model call
this sandbox isn't wired to make.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from router import handle_turn, _sessions
from eval.seed_cases import SEED_CASES


def judge_answer_quality(tool_result, final_answer_text, required_facts, required_citations):
    """
    PLACEHOLDER -- in production this is a Claude call using a FIXED judge model
    (not the model under test, so grading doesn't drift as the production model
    changes). Given tool_result as grounding and final_answer_text, the judge
    checks required_facts/citations are present and flags any claim not
    supported by tool_result (the hallucination check).
    Not implemented here: no synthesis/formatting model is wired in this
    sandbox yet (Doc 05's cheap-format / strong-synthesize step comes after
    this router layer). Returns a fixed placeholder score.
    """
    return {"score": None, "note": "not implemented -- requires a real judge-model call"}


def run_seed_set():
    tool_correct, tool_total = 0, 0
    escalation_correct, escalation_total = 0, 0
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

            case_result["turns"].append({
                "user": turn["user"],
                "expected_tool": expected_tool, "actual_tool": actual_tool, "tool_ok": tool_ok,
                "expected_escalation": expected_esc, "actual_escalation": actual_esc, "esc_ok": esc_ok,
                "response_mode": outcome.get("response_mode"),
            })

            if case.get("expect_unmatched_terms"):
                got_unmatched = bool(outcome.get("unmatched_terms"))
                case_result["turns"][-1]["unmatched_terms_ok"] = got_unmatched

        results.append(case_result)

    tool_call_accuracy = tool_correct / tool_total if tool_total else 0
    escalation_accuracy = escalation_correct / escalation_total if escalation_total else 0

    return {
        "tool_call_accuracy": round(tool_call_accuracy, 3),
        "escalation_accuracy": round(escalation_accuracy, 3),
        "n_cases": len(SEED_CASES),
        "n_turns": tool_total,
        "answer_quality": "not scored -- judge model not wired in this sandbox",
        "case_results": results,
    }


if __name__ == "__main__":
    import json
    report = run_seed_set()
    print(json.dumps(report, indent=2, default=str))
