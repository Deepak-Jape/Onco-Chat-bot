"""
Piece 7 -- eval harness seed set.
Every trial/arm ID referenced below is real, pulled from the live oncosuite_gold
data during Phase 1 testing (not invented) -- so these cases are runnable
against the actual database from day one, not placeholders to fill in later.
"""

SEED_CASES = [
    {
        "id": "tc_001",
        "category": "filtered_search",
        "conversation": [{"turn": 1, "user": "Show me recruiting Phase 3 trials for NSCLC KRAS"}],
        "expected_intent": ["filtered_search"],
        "expected_tool": ["search_trials"],
        "expected_escalation": [False],  # 3 real matches, at/under threshold
    },
    {
        "id": "tc_002",
        "category": "landscape_or_trend",
        "conversation": [{"turn": 1, "user": "What is the competitive landscape for KRAS in NSCLC"}],
        "expected_intent": ["landscape_or_trend"],
        "expected_tool": ["get_competitive_landscape"],
        "expected_escalation": [True],  # tool-type rule: always escalate
    },
    {
        "id": "tc_003",
        "category": "arm_comparison",
        "conversation": [
            {"turn": 1, "user": "Tell me about NCT06881784"},
            {"turn": 2, "user": "compare arm A vs arm B"},
        ],
        "expected_intent": ["single_trial_lookup", "arm_comparison"],
        "expected_tool": ["get_trial_detail", "compare_arms"],
        "expected_escalation": [False, True],
        "seed_session_oncosuite_id": "7QA-Tm0-tvX",  # real trial, has 2 real arms
    },
    {
        "id": "tc_004",
        "category": "clarification_needed",
        "conversation": [{"turn": 1, "user": "Show me trials for made-up-marker-xyz"}],
        "expected_intent": ["filtered_search"],
        "expected_tool": ["search_trials"],
        "expected_escalation": [False],  # short-circuit, unmatched term
        "expect_unmatched_terms": True,
    },
    {
        "id": "tc_005",
        "category": "single_trial_lookup",
        "conversation": [{"turn": 1, "user": "What phase is NCT06881784 in?"}],
        "expected_intent": ["single_trial_lookup"],
        "expected_tool": ["get_trial_detail"],
        "expected_escalation": [False],
    },
]
