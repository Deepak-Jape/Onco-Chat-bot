# Oncosuite Chat App -- working build

Every file here is tested against your real, restored `oncosuite_gold` data
(1,562 real trials) -- not mocked. Where something is a placeholder standing
in for a real LLM call, it's labeled loudly in the file and below.

## What's real and working end to end

```
db.py                          connection helper
vocab.py + vocab_build.py      Piece 2 -- normalization, populated from real
                                cohort_info values (184 canonical terms)
tools/search_trials.py         Piece 1, tool 1
tools/get_trial_detail.py      Piece 1, tool 2 -- real join chain incl. stratification hop
tools/get_endpoints_and_outcomes.py   Piece 1, tool 3
tools/get_hazard_ratios.py     Piece 1, tool 4
tools/get_adverse_events.py    Piece 1, tool 5 -- also surfaces the `safety` table
tools/compare_arms.py          Piece 1, tool 6
tools/get_competitive_landscape.py    Piece 1, tool 7 / Piece 3 aggregation templates
tools/get_trial_sources.py     Piece 1, tool 8
citations.py                   Piece 4 -- tier-1 stubs, confidence-tiered hedging
memory.py                      Piece 6 -- session working set
router.py                      Piece 5 -- escalation logic (real) + orchestration
eval/seed_cases.py + run_eval.py     Piece 7 -- 5 seed cases, 100% tool-call and
                                escalation accuracy on the current baseline
```

Run it yourself: `python3 eval/run_eval.py` (needs the DB reachable at
`127.0.0.1`, password `sandboxpw` -- swap `db.py`'s DSN for your real
read-replica connection string).

## What's a labeled placeholder, not a real implementation

- **`classify_and_extract` in `router.py`** -- a rule-based/regex stand-in for
  the cheap model's single tool-use call. Same input/output contract as the
  real thing (`CLASSIFY_TOOL_SCHEMA` in the same file is the actual tool
  definition to hand to a real Claude call). Swap the function body; nothing
  else changes.
- **The cheap-format / strong-synthesize step** -- not built. The router
  produces `response_mode: "cheap_model_format"` or `"strong_model_synthesis"`
  and stops there; wiring an actual Claude call for either mode, using
  `citations.py`'s hedging instructions, is the next piece.
- **`judge_answer_quality` in `eval/run_eval.py`** -- returns a fixed
  placeholder. Needs a real fixed judge-model call per Doc 07.
- **Session store** -- in-process dict with a Redis-identical interface
  (`memory.py`). Swap the internals for real Redis calls for anything beyond
  a single-process demo.

## Real bugs found and fixed while building (not in the original docs)

1. `search_trials`'s `condition` filter maps to both `organ` and `histology`.
   A term that matched under one but not the other used to show up in
   `unmatched_terms` anyway, which would wrongly trigger the disambiguation
   short-circuit. Fixed via `vocab.normalize_field_group` -- a term is only
   reported unmatched if it fails under every field in its group.
2. Trigram similarity was too strict for short biomarker codes ("KRAS" ->
   one-letter typo scored 0.11, far under any usable threshold). Fixed by
   adding a Levenshtein-distance pass (`fuzzystrmatch`) for canonical values
   under 6 characters, keeping trigram for longer free-text values.
3. `memory.py`'s working-set update assumed `get_trial_detail`'s response had
   a top-level `arms` key. It's actually nested under `cohorts[].arms`. Fixed
   by flattening before storing.
4. `router.py`'s `single_trial_lookup` intent detected NCT numbers via regex
   but never actually resolved them to an `oncosuite_id` before dispatch --
   it would've silently fallen through to an unfiltered `search_trials` call.
   Fixed by adding the real `source_mapping` lookup.

## What still needs a product decision (per the original docs, still open)

- Out-of-scope question policy (decline / disclaim / route to strong model)
- `hazard_ratio_info.arm_comparison` -- display as free text, or invest in
  fuzzy-matching it back to `arm_name`
- One tool or two for `adverse_events` vs. `safety`
- Whether `get_trial_detail` should read `summary.summary_json` directly
  instead of doing the join (worth prototyping both and comparing)
- Building the actual outcome-standardization logic (`v_outcomes_standardized`
  doesn't exist; `get_competitive_landscape`'s outcome averages are flagged
  as directional-only until this is built)

## Suggested next session

1. Wire a real Claude call into `classify_and_extract`, using `CLASSIFY_TOOL_SCHEMA`.
2. Build the cheap-format and strong-synthesize response generators, feeding
   `citations.py`'s hedging instructions into the strong model's system prompt.
3. Expand `eval/seed_cases.py` toward the full ~45-case seed set across all
   8 intent categories.
4. Swap `memory.py`'s internals for real Redis.
