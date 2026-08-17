"""
Piece 7 -- eval harness seed set.
Every trial/arm/cohort ID and required_fact below is real, pulled directly from
the live oncosuite_gold data (see the queries in the PR/commit that added each
case) -- not invented -- so these cases are runnable against the actual
database from day one and required_facts double as a real correctness check,
not just a routing check.

expected_escalation reflects the CURRENT policy in router.py
(ALWAYS_ESCALATE_INTENTS = {"arm_comparison", "landscape_or_trend",
"single_trial_lookup", "filtered_search"}; outcome_deep_dive is still
size-gated; the cohort-list path and the unmatched-term short-circuit always
escalate=False). Update this comment (and the expectations) together if that
policy changes again -- these previously drifted out of sync with router.py
and made the eval report a false "regression" on every run.

required_facts: strings the final answer text should contain (case-insensitive
substring check by the harness). Kept to facts that are (a) verified true
against the live DB right now and (b) highly likely to survive re-phrasing --
avoid asserting on exact prose the LLM is free to word differently.
"""

SEED_CASES = [
    {
        "id": "tc_001",
        "category": "filtered_search",
        "conversation": [{"turn": 1, "user": "Show me recruiting Phase 3 trials for NSCLC KRAS"}],
        "expected_intent": ["filtered_search"],
        "expected_tool": ["search_trials"],
        "expected_escalation": [True],  # filtered_search is in ALWAYS_ESCALATE_INTENTS
        # search_trials(condition=[NSCLC], biomarkers=[KRAS], phase=[Phase 3],
        # study_status=[Recruiting]) returns exactly these 3 real trials today.
        "required_facts": [["NCT06793215", "NCT06881784", "NCT06300177"]],
    },
    {
        "id": "tc_002",
        "category": "landscape_or_trend",
        "conversation": [{"turn": 1, "user": "What is the competitive landscape for KRAS in NSCLC"}],
        "expected_intent": ["landscape_or_trend"],
        "expected_tool": ["get_competitive_landscape"],
        "expected_escalation": [True],  # tool-type rule: always escalate
        # get_competitive_landscape(group_by=[drug_name,phase], condition=[lung],
        # target_or_moa=[KRAS]): Sotorasib leads with 7 trials, by far the largest group.
        "required_facts": [["Sotorasib"]],
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
        "expected_escalation": [True, True],  # both always-escalate intents
        "seed_session_oncosuite_id": "7QA-Tm0-tvX",  # real trial, has 2 real arms
        # get_trial_detail('7QA-Tm0-tvX'): sponsor Revolution Medicines, Phase 3, Recruiting.
        "required_facts": [
            ["Revolution Medicines", "Phase 3"],
            # compare_arms's 2 real arms for this trial (arms_info.arm_name).
            ["daraxonrasib", "docetaxel"],
        ],
    },
    {
        "id": "tc_004",
        "category": "clarification_needed",
        "conversation": [{"turn": 1, "user": "Show me trials for made-up-marker-xyz"}],
        "expected_intent": ["filtered_search"],
        "expected_tool": ["search_trials"],
        "expected_escalation": [False],  # short-circuit, unmatched term -- overrides ALWAYS_ESCALATE
        "expect_unmatched_terms": True,
    },
    {
        "id": "tc_005",
        "category": "single_trial_lookup",
        "conversation": [{"turn": 1, "user": "What phase is NCT06881784 in?"}],
        "expected_intent": ["single_trial_lookup"],
        "expected_tool": ["get_trial_detail"],
        "expected_escalation": [True],  # single_trial_lookup is in ALWAYS_ESCALATE_INTENTS
        "required_facts": [["Phase 3"]],
    },
    {
        "id": "tc_006",
        "category": "outcome_deep_dive",
        "conversation": [
            {"turn": 1, "user": "Tell me about NCT02846792"},
            {"turn": 2, "user": "what is the survival and response rate outcome data for this trial?"},
        ],
        "expected_intent": ["single_trial_lookup", "outcome_deep_dive"],
        "expected_tool": ["get_trial_detail", "get_endpoints_and_outcomes"],
        # outcome_deep_dive is RESULT_SIZE_CHECK_INTENTS-gated, not always-escalate;
        # get_endpoints_and_outcomes's result has no "results" key so the distinct-trial
        # count is 0, under RESULT_SIZE_THRESHOLD (3) -> no escalation.
        "expected_escalation": [True, False],
        "seed_session_oncosuite_id": "8fc-43p-mSs",  # real trial with real endpoint rows
        # get_endpoints_and_outcomes('8fc-43p-mSs').endpoints[].endpoint_abbreviation
        # includes these real values today (ORR/PFS/OS are the ones the question asks about).
        "required_facts": [None, ["ORR", "PFS", "OS"]],
    },
    {
        "id": "tc_007",
        "category": "cohort_list",
        "conversation": [{"turn": 1, "user": "list all ADC cohorts"}],
        "expected_intent": ["filtered_search"],
        "expected_tool": ["search_cohorts"],
        "expected_escalation": [False],  # _cohort_list_response hardcodes escalate=False
        # search_cohorts(drug_name_or_target=['adc']): 120 cohorts within 99 trials,
        # today, against the live DB. This path is 100% deterministic (synthesize_cohorts,
        # no LLM), so these exact numbers must appear verbatim -- any drift is a real bug.
        "required_facts": [["120 cohorts", "99 trials"]],
    },
]
