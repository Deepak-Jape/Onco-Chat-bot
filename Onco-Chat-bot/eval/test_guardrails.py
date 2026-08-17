"""
Unit tests for the output-quality guardrails:
  1. No internal metadata (intent/tool/scores/ids) leaks into user-facing text.
  2. Sponsor exclusions ("not interested in academia") are honored strictly.
  3. Missing-data / exclusion detection works.

Run:  ./venv/Scripts/python.exe -m eval.test_guardrails
Exits non-zero if any assertion fails.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

failures = []


def check(name, cond):
    print(("PASS" if cond else "FAIL"), "-", name)
    if not cond:
        failures.append(name)


# ---- 1. Output sanitizer strips trace metadata --------------------------------
import web_app

dirty = ("intent: semantic_search\n"
         "Here are 3 matching trials.\n"
         "score: 0.721\n"
         "response_mode: agentic\n"
         "The closest match has similarity 0.88 overall.\n"
         "ref_id: aBc-123-XyZ")
clean = web_app._strip_trace_metadata(dirty)
check("sanitizer removes 'intent:' line", "intent:" not in clean)
check("sanitizer removes 'score:' line", "score:" not in clean.lower())
check("sanitizer removes 'response_mode:' line", "response_mode" not in clean)
check("sanitizer removes 'ref_id:' line", "ref_id" not in clean)
check("sanitizer removes inline similarity value", "0.88" not in clean)
check("sanitizer keeps real answer text", "Here are 3 matching trials." in clean)


# ---- 2. Sponsor exclusion detection -------------------------------------------
import router

check("detects 'not interested in academia'",
      router.detect_sponsor_exclusion("active trials from corporate sponsors, not interested in academia") == "academic")
check("detects 'industry only'",
      router.detect_sponsor_exclusion("show me industry only lung trials") == "academic")
check("no false-positive on plain query",
      router.detect_sponsor_exclusion("lung cancer phase 3 trials") is None)


# ---- 3. Sponsor exclusion actually filters the data ---------------------------
from tools.search_trials import search_trials, ACADEMIC_SPONSOR_PATTERNS

excl = search_trials(condition=["lung"], exclude_sponsor_type="academic", limit=100)
leaked = [
    r["sponsor"] for r in excl["results"]
    if r["sponsor"] and any(p in r["sponsor"].lower() for p in ACADEMIC_SPONSOR_PATTERNS)
]
check("no academic sponsor in industry-only result set", len(leaked) == 0)

base = search_trials(condition=["lung"], limit=100)
check("exclusion reduces the match count (filter is active)",
      excl["total_matches"] < base["total_matches"])


# ---- 4. Router wiring passes the exclusion into filters -----------------------
cls = {"intent": "filtered_search", "filters": {"condition": ["lung"]}}
# simulate what handle_turn does
_excl = router.detect_sponsor_exclusion("lung trials, not interested in academia")
if _excl:
    cls["filters"]["exclude_sponsor_type"] = _excl
check("exclusion injected into filters", cls["filters"].get("exclude_sponsor_type") == "academic")


print()
if failures:
    print(f"{len(failures)} FAILURE(S):", ", ".join(failures))
    sys.exit(1)
print("ALL GUARDRAIL TESTS PASSED")
