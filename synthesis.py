"""
Strong-model synthesis layer -- built to the product spec (professional,
investor/pharma-grade comparative analytics, never Larvol-style plain lists).

ARCHITECTURAL INVARIANT, enforced by construction, not just convention:
  synthesize() is called ONLY from router.handle_turn() with a tool_result
  that came from the 8 real tools (search_trials, compare_arms,
  get_competitive_landscape, etc.) via router._dispatch_tool(). It NEVER
  receives anything from text_to_sql.py's LLM-written SQL path -- that path
  lives entirely inside hybrid.py and produces its own answer independently
  (see hybrid.py's "sql" branch). Do not import text_to_sql here, and do not
  import this module from text_to_sql.py or hybrid.py's SQL branch. If you
  ever need SQL-derived data to reach an executive-style narrative, that's a
  new, explicit tool-layer function -- not a shortcut through this file.

Two modes:
  1. REAL LLM (llm_client.available()) -- sends the full spec system prompt
     + tool_result JSON + citations as grounding, gets back real prose.
  2. NO LLM (default, LLM_BACKEND="off") -- a deterministic renderer builds
     the same Executive Summary / Comparison Table / Key Insights / Citations
     structure directly from the verified JSON, with zero hallucination risk
     since every number is copy-pasted from tool_result, never generated.
     This means the showcase analytics work TODAY, before any API key exists.
"""
import config
import llm_client
from citations import get_citation_stubs, annotate_with_hedging

SYSTEM_PROMPT = """You are a clinical-trial intelligence analyst producing pharmaceutical-grade
comparative analytics for pharma executives and investors. Your goal is to demonstrate deep,
clinically meaningful comparative reasoning -- not simple data retrieval or plain trial lists.

ARCHITECTURE CONSTRAINTS (hard rules, never violate):
- You do not access any database directly and never invent SQL.
- Every factual statement must originate from the tool_result JSON you are given below.
- Never answer from model memory. Never guess a missing endpoint value. Never infer efficacy
  or safety that isn't explicitly present in tool_result.
- If information is unavailable in tool_result, explicitly state that it is unavailable --
  do not fill the gap with plausible-sounding language.
- Every conclusion must be traceable to a specific field in tool_result or the citations
  provided alongside it.

CITATION RULES:
Whenever citation/traceability metadata is provided, include it naturally in your answer --
NCT number, confidence score, and a plain-language confidence qualifier (state as fact only
if confidence >= 0.85; hedge explicitly between 0.5-0.85; do not state as fact below 0.5,
flag it as low-confidence instead).

{format_contract}

WHEN THE QUESTION IS A COMPARISON OR ANALYSIS, prefer these sections (using the formatting
rules above): a lead **Executive Summary** sentence, a **Comparison Table** with the actual
numbers (never prose-only for a comparison), **Key Clinical Insights** bullets, and
**Supporting Citations** (NCT numbers / confidence). For a simple factual question, just
answer directly per the formatting rules -- don't force the full section structure.

STYLE: Professional, objective, clinical, evidence-based. Write for pharmaceutical executives
and investors, not consumers. State findings plainly and back every one with a number from tool_result.

USER QUESTION:
{question}

TOOL USED: {tool_name}

TOOL_RESULT (this is your ONLY source of truth -- verified, structured data):
{tool_result}

CITATIONS AVAILABLE:
{citations}
"""


def synthesize(user_message: str, intent: str, tool_name: str, tool_result: dict) -> dict:
    """
    Returns {"text": str, "mode": "llm"|"deterministic", "table_data": list|None}
    so callers (web_app.py) can render the table separately from the prose if useful.
    """
    citations = _gather_citations(tool_result)

    if llm_client.available():
        try:
            prompt = SYSTEM_PROMPT.format(
                question=user_message, tool_name=tool_name,
                tool_result=tool_result, citations=citations,
                format_contract=config.ANSWER_FORMAT_CONTRACT,
            )
            text = llm_client.chat([{"role": "user", "content": prompt}])
            return {"text": text, "mode": "llm", "table_data": None}
        except llm_client.LLMUnavailable:
            pass  # fall through to the deterministic renderer below

    return _deterministic_synthesis(intent, tool_name, tool_result, citations)


def _gather_citations(tool_result: dict) -> list:
    """Pull real tier-1 citation stubs for whatever trial(s) this tool_result touches."""
    if not isinstance(tool_result, dict):
        return []
    oncosuite_id = tool_result.get("oncosuite_id")
    if not oncosuite_id:
        return []
    stubs = get_citation_stubs(oncosuite_id, "trial_info",
                               ["sponsor_name", "official_title", "trial_phase"])
    return annotate_with_hedging(stubs)


# --------------------------------------------------------------------------- #
# Deterministic renderer -- zero LLM dependency, zero hallucination risk,
# every number below is read directly from tool_result, never generated.
# --------------------------------------------------------------------------- #
def _deterministic_synthesis(intent, tool_name, tool_result, citations) -> dict:
    if tool_name == "compare_arms":
        return _synthesize_arm_comparison(tool_result, citations)
    if tool_name == "get_competitive_landscape":
        return _synthesize_landscape(tool_result, citations)
    if tool_name == "get_trial_detail":
        return _synthesize_trial_detail(tool_result, citations)
    if tool_name == "search_trials":
        return _synthesize_search_results(tool_result, citations)
    return {"text": _generic_fallback(tool_result), "mode": "deterministic", "table_data": None}


def _synthesize_arm_comparison(tr: dict, citations: list) -> dict:
    # No single trial could be resolved -- surface the guidance / candidate list
    # instead of rendering an empty, confusing comparison table.
    if tr.get("error"):
        lines = [f"**{tr.get('message') or tr['error']}**"]
        for c in (tr.get("candidates") or []):
            ident = c.get("nct_id") or c.get("oncosuite_id")
            phase = f" ({c['phase']})" if c.get("phase") else ""
            title = f" — {c['title']}" if c.get("title") else ""
            lines.append(f"- `{ident}`{phase}{title}")
        return {"text": "\n".join(lines), "mode": "deterministic", "table_data": None}

    arms = {a["arm_id"]: a.get("arm_name") for a in tr.get("arms", [])}
    endpoints = tr.get("endpoints_by_arm", [])
    aes = tr.get("adverse_events_by_arm", [])
    hrs = tr.get("hazard_ratios", [])

    # --- Comparison Table: endpoint values by arm ---
    ep_by_endpoint = {}
    for e in endpoints:
        key = e.get("endpoint_abbreviation") or e.get("endpoint_name") or "?"
        ep_by_endpoint.setdefault(key, {})[arms.get(e.get("arm_id"), e.get("arm_id"))] = e.get("value_and_evaluator")
    arm_names = list(arms.values())
    table_rows = []
    for ep_name, by_arm in ep_by_endpoint.items():
        row = [ep_name] + [by_arm.get(a, "Not reported") for a in arm_names]
        table_rows.append(row)

    # --- AE burden by arm, real counts ---
    ae_burden = {}
    for a in aes:
        arm_label = arms.get(a.get("arm_id"), a.get("arm_id"))
        ae_burden.setdefault(arm_label, {"all": 0, "g34": 0})
        ae_burden[arm_label]["all"] += a.get("all_grades") or 0
        ae_burden[arm_label]["g34"] += a.get("grade_3_4") or 0

    lines = ["**Executive Summary**"]
    if table_rows:
        lines.append(f"Comparing {len(arm_names)} arms ({', '.join(arm_names)}) across "
                     f"{len(table_rows)} reported endpoint(s).")
    else:
        lines.append(f"Comparing {len(arm_names)} arms ({', '.join(arm_names)}) -- "
                     f"no efficacy endpoints reported yet for this trial.")
    if ae_burden:
        worst = max(ae_burden.items(), key=lambda kv: kv[1]["g34"])
        lines.append(f"{worst[0]} shows the highest reported grade 3-4 adverse-event burden "
                     f"({worst[1]['g34']} events).")

    lines.append("\n**Comparison Table**\n")
    if table_rows:
        lines.append("| Endpoint | " + " | ".join(arm_names) + " |")
        lines.append("|---" * (len(arm_names) + 1) + "|")
        for row in table_rows:
            lines.append("| " + " | ".join(str(c) for c in row) + " |")
    else:
        lines.append("_No efficacy endpoint data reported for this trial yet._")

    if ae_burden:
        lines.append("\n**Safety Comparison**\n")
        lines.append("| Arm | All-grade AEs | Grade 3-4 AEs |")
        lines.append("|---|---|---|")
        for arm_label, counts in ae_burden.items():
            lines.append(f"| {arm_label} | {counts['all']} | {counts['g34']} |")

    if hrs:
        lines.append("\n**Hazard Ratios**\n")
        lines.append("| Endpoint | Comparison | HR | CI | p-value |")
        lines.append("|---|---|---|---|---|")
        for hr in hrs:
            lines.append(f"| {hr.get('endpoint_abbreviation', hr.get('endpoint_name'))} "
                         f"| {hr.get('arm_comparison')} | {hr.get('hr_value_and_range')} "
                         f"| {hr.get('hr_ci')} | {hr.get('p_value')} |")

    lines.append("\n**Key Clinical Insights**")
    if not table_rows and not ae_burden:
        lines.append("- No comparative data (efficacy or safety) reported for this trial yet.")
    else:
        if table_rows:
            lines.append(f"- {len(table_rows)} endpoint(s) compared directly from verified trial data.")
        if ae_burden:
            lines.append(f"- Safety burden compared across {len(ae_burden)} arm(s) using reported grade 3-4 counts.")

    lines.append("\n**Supporting Citations**")
    if citations:
        for c in citations:
            lines.append(f"- {c.get('field_name')}: confidence {c.get('confidence_score')} "
                         f"({c.get('hedge_instruction')}) \u2014 {c.get('source_link')}")
    else:
        lines.append(f"- Source: {tr.get('oncosuite_id')}")

    return {"text": "\n".join(lines), "mode": "deterministic", "table_data": table_rows}


def _synthesize_landscape(tr: dict, citations: list) -> dict:
    groups = tr.get("groups") or {}
    outcome_avgs = tr.get("outcome_averages")
    filters = tr.get("filters_applied") or {}

    lines = ["**Executive Summary**"]
    filt_desc = "; ".join(f"{k}: {', '.join(v)}" for k, v in filters.items() if v) or "no filters"
    total_drugs = len(groups.get("drug_name", []))
    lines.append(f"Competitive landscape for {filt_desc} \u2014 {total_drugs} distinct drug(s)/sponsor(s) "
                f"identified from verified trial data." if total_drugs else
                f"Competitive landscape for {filt_desc}.")

    for dimension, rows in groups.items():
        if not rows:
            continue
        count_key = "trial_count" if "trial_count" in rows[0] else "trial_drug_count"
        lines.append(f"\n**Comparison Table \u2014 by {dimension.replace('_', ' ')}**\n")
        lines.append(f"| {dimension.replace('_', ' ').title()} | Trials | Example Trial IDs |")
        lines.append("|---|---|---|")
        for r in rows[:15]:
            examples = ", ".join((r.get("example_trial_ids") or [])[:3])
            lines.append(f"| {r.get('group_key')} | {r.get(count_key)} | {examples} |")
        if len(rows) >= 2:
            leader = rows[0]
            lines.append(f"\n_{leader.get('group_key')} leads with {leader.get(count_key)} trials "
                         f"in this landscape._")

    if outcome_avgs and outcome_avgs.get("groups"):
        by_unit = {}
        for r in outcome_avgs["groups"]:
            by_unit.setdefault(r.get("unit_category"), []).append(r)
        for unit_cat, rows in by_unit.items():
            lines.append(f"\n**Outcome Averages \u2014 {unit_cat}**\n")
            lines.append(f"| Drug | Trials | Avg Value | # Values |")
            lines.append("|---|---|---|---|")
            for r in rows:
                lines.append(f"| {r.get('group_key')} | {r.get('trial_count')} "
                             f"| {r.get('avg_value')} | {r.get('n_values')} |")
        if outcome_avgs.get("_note"):
            lines.append(f"\n_{outcome_avgs['_note']}_")

    lines.append("\n**Key Clinical Insights**")
    for dimension, rows in groups.items():
        if rows and len(rows) >= 2:
            lines.append(f"- By {dimension.replace('_', ' ')}: {rows[0].get('group_key')} "
                         f"({rows[0].get(list(rows[0].keys())[1])} trials) leads over "
                         f"{rows[1].get('group_key')} ({rows[1].get(list(rows[1].keys())[1])} trials).")
    if not any(groups.values()):
        lines.append("- No trials matched these filters in the database.")

    lines.append("\n**Supporting Citations**")
    lines.append("- All figures aggregated directly from oncosuite_gold via get_competitive_landscape "
                 "(Templates A/B/C) \u2014 see individual trial IDs above for NCT-level source lookup.")

    return {"text": "\n".join(lines), "mode": "deterministic", "table_data": groups}


def _synthesize_trial_detail(tr: dict, citations: list) -> dict:
    if tr.get("error"):
        return {"text": f"**Executive Summary**\n{tr['error']}", "mode": "deterministic", "table_data": None}

    nct = tr.get("nct_id") or "This trial"
    phase = tr.get("trial_phase") or "an unspecified phase"
    status = (tr.get("study_status") or "an unknown status").lower()
    sponsor = (tr.get("sponsor_name") or "an unspecified sponsor").rstrip(".")
    title = (tr.get("official_title") or "").strip().rstrip(".")
    enrollment = tr.get("enrollment_count")

    cohorts = tr.get("cohorts") or []
    cond_bits = []
    if cohorts:
        c = cohorts[0]
        if c.get("histology"):
            cond_bits.append(", ".join(c["histology"]))
        if c.get("biomarkers"):
            cond_bits.append(f"biomarker(s) {', '.join(c['biomarkers'])}")

    sentence = f"{nct} is {phase}, currently {status}, sponsored by {sponsor}."
    if title:
        sentence += f" It studies: {title}."
    if cond_bits:
        sentence += f" Cohort focus: {' with '.join(cond_bits)}."
    if enrollment:
        sentence += f" Target enrollment is {enrollment} patients."

    loc = tr.get("locations") or {}
    if loc.get("total_sites"):
        top = ", ".join(f'{r["country"]} ({r["site_count"]})' for r in (loc.get("by_country") or [])[:5])
        sentence += (f" It runs across {loc['total_sites']} sites in {loc['total_countries']} "
                    f"countries, led by {top}.")

    lines = ["**Executive Summary**", sentence]

    insights = []
    endpoints = tr.get("endpoints") or []
    for ep in endpoints[:5]:
        name = ep.get("endpoint_abbreviation") or ep.get("endpoint_name") or "Endpoint"
        hrs = ep.get("hazard_ratios") or []
        if hrs:
            hr = hrs[0]
            insights.append(f"- {name}: HR {hr.get('hr_value_and_range')} ({hr.get('hr_ci')}), "
                            f"p={hr.get('p_value')}")
        else:
            insights.append(f"- {name} reported — see Endpoints &amp; Outcomes below.")
    ae_total = sum(len(a.get("adverse_events") or []) for c in cohorts for a in c.get("arms", []))
    if ae_total:
        insights.append(f"- {ae_total} adverse-event categories recorded across all arms.")
    if insights:
        lines.append("\n**Key Clinical Insights**")
        lines.extend(insights)

    lines.append("\n**Supporting Citations**")
    if citations:
        for c in citations:
            lines.append(f"- {c.get('field_name')}: confidence {c.get('confidence_score')} "
                         f"({c.get('hedge_instruction')}) — {c.get('source_link')}")
    else:
        lines.append(f"- Source: {tr.get('oncosuite_id')}")

    return {"text": "\n".join(lines), "mode": "deterministic", "table_data": None}


def _synthesize_search_results(tr: dict, citations: list) -> dict:
    results = tr.get("results") or []
    total = tr.get("total_matches", len(results))

    if not results:
        return {"text": "**Executive Summary**\nNo trials matched these search filters in the database.",
                "mode": "deterministic", "table_data": None}

    lines = ["**Executive Summary**",
             f"Found {total} matching trial(s); showing {len(results)}."]

    lines.append("\n**Comparison Table**\n")
    lines.append("| NCT ID | Phase | Status | Sponsor | Enrollment |")
    lines.append("|---|---|---|---|---|")
    for r in results[:15]:
        lines.append(f"| {r.get('nct_id')} | {r.get('phase')} | {r.get('status')} "
                     f"| {r.get('sponsor')} | {r.get('enrollment')} |")

    by_sponsor = {}
    for r in results:
        key = r.get("sponsor") or "Unknown"
        by_sponsor[key] = by_sponsor.get(key, 0) + 1
    if len(by_sponsor) > 1:
        leader = max(by_sponsor.items(), key=lambda kv: kv[1])
        lines.append("\n**Key Clinical Insights**")
        lines.append(f"- {leader[0]} sponsors the most matching trials ({leader[1]}).")

    lines.append("\n**Supporting Citations**")
    lines.append(f"- {total} trial(s) matched directly from oncosuite_gold via search_trials.")

    return {"text": "\n".join(lines), "mode": "deterministic", "table_data": results}


def _generic_fallback(tool_result) -> str:
    return (f"No dedicated executive-style renderer exists yet for this tool's output shape. "
           f"Raw verified data: {tool_result}")