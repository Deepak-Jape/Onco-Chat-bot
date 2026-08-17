"""Key Learnings: cross-column, hypothesis-generating drug-development
insights for a cohort table -- NOT the same job as answer_insights.py /
dashboard.py's existing "Key Insights" bullets, which deliberately stay to
single-column descriptive stats (top phase, % recruiting, top sponsor) for
speed. This module looks ACROSS columns for patterns a reader wouldn't spot
by scanning rows: does a given regimen skew toward a particular phase or
status, does enrollment fall short of plan in a specific segment, is a
biomarker associated with better hazard ratios, etc.

Design constraints, deliberately:
  - Every number here is a real aggregate over the current result set. No
    field is invented, no clinical outcome is inferred beyond what
    oncosuite_gold actually records.
  - Every candidate insight is tagged with a sample size and an explicit
    CONFIDENCE tier (Strong / Moderate / Hypothesis-generating) derived from
    that sample size and effect size -- see _confidence(). A pattern from 2
    trials is never presented with the same weight as one from 20.
  - Language is correlational, never causal: "is associated with", "the data
    suggests", "may indicate" -- never "causes" or "leads to". This mirrors
    how a clinical epidemiologist would hedge an observational finding.
  - Output is capped at a handful of the highest-value candidates (see
    _select()), not every statistical wrinkle found -- a long tail of weak
    correlations is worse than no insight at all.

Reuses complex_insights.py's existing cross-table analyses (drug
combinations, sponsor/MOA concentration, biomarker-vs-hazard-ratio, payload-
vs-safety) rather than recomputing them, and adds the ones that module
doesn't cover: phase-by-regimen skew, status-by-regimen risk signal,
enrollment-shortfall-vs-outcome, and indication crowding.
"""

_ADVANCED_PHASE_MARKERS = ("3", "4")
_RISK_STATUSES = ("terminat", "withdraw", "suspend")
_MATURE_STATUSES = ("completed",)


def _is_advanced_phase(phase):
    return bool(phase) and any(m in phase for m in _ADVANCED_PHASE_MARKERS)


def _is_risk_status(status):
    s = (status or "").lower()
    return any(m in s for m in _RISK_STATUSES)


def _is_mature_status(status):
    s = (status or "").lower()
    return any(m in s for m in _MATURE_STATUSES)


def _confidence(n, effect_pp):
    """n = independent trials/cohorts behind the pattern; effect_pp = the gap
    in percentage points (or an equivalent multiplier) versus baseline.
    Thresholds are intentionally conservative -- a handful of trials moving a
    few points is noise, not a finding. Returns None below the noise floor
    (n < 2 or effect_pp < 15), meaning "don't surface this at all"."""
    if n < 2 or effect_pp < 15:
        return None
    if n >= 15 and effect_pp >= 25:
        return "Strong"
    if n >= 6 and effect_pp >= 15:
        return "Moderate"
    return "Hypothesis-generating"


_CONFIDENCE_SCORE = {"Strong": 90, "Moderate": 65, "Hypothesis-generating": 40}


def _candidate(label, finding, evidence, why, implication, confidence, categories):
    return {
        "label": label, "finding": finding, "evidence": evidence, "why": why,
        "implication": implication, "confidence": confidence,
        "categories": categories, "score": _CONFIDENCE_SCORE[confidence],
    }


# ---------------------------------------------------------------------------
# New cross-column candidates (not covered by complex_insights.py)
# ---------------------------------------------------------------------------

def _phase_regimen_skew(table_rows):
    """Does a given regimen's phase mix skew notably more (or less) advanced
    than the overall pipeline? Reveals which regimens are pulling ahead --
    or stuck early -- something invisible scanning rows one at a time."""
    total = len(table_rows)
    if total < 4:
        return []
    baseline_adv = sum(1 for r in table_rows if _is_advanced_phase(r["phase"])) / total * 100

    by_regimen = {}
    for r in table_rows:
        if r["regimen"]:
            by_regimen.setdefault(r["regimen"], []).append(r)

    out = []
    for regimen, group in by_regimen.items():
        n = len(group)
        if n < 2:
            continue
        adv_pct = sum(1 for r in group if _is_advanced_phase(r["phase"])) / n * 100
        gap = adv_pct - baseline_adv
        conf = _confidence(n, abs(gap))
        if not conf:
            continue
        indications = sorted({r["indication"] for r in group if r["indication"]})
        ind_text = indications[0] if len(indications) == 1 else f"{len(indications)} indications"
        if gap > 0:
            out.append(_candidate(
                "Regimen ahead of the pipeline",
                f"**{regimen}** skews toward more advanced trial phases than the rest of "
                f"this pipeline: {round(adv_pct)}% of its {n} cohorts are Phase 3/4, versus "
                f"{round(baseline_adv)}% across all {total} cohorts shown.",
                f"{n} cohorts using {regimen} (in {ind_text}), compared against the "
                f"phase mix of all {total} cohorts in this result set.",
                "A regimen concentrated in later phases relative to its peers has "
                "typically cleared more development risk (dose-finding, early safety, "
                "an initial efficacy signal) already -- the data doesn't say why it "
                "advanced, only that it has.",
                f"Worth understanding what de-risked {regimen} faster than comparable "
                "regimens in this set (patient selection, combination partner, "
                "endpoint choice) -- those choices may be transferable to your own "
                "trial design.",
                conf, ["regulatory", "commercial"],
            ))
        else:
            out.append(_candidate(
                "Regimen concentrated in early phase",
                f"**{regimen}** is disproportionately early-phase: {round(adv_pct)}% of its "
                f"{n} cohorts are Phase 3/4, versus {round(baseline_adv)}% baseline across "
                f"all {total} cohorts shown.",
                f"{n} cohorts using {regimen} (in {ind_text}), compared against the "
                f"phase mix of all {total} cohorts in this result set.",
                "This could reflect a genuinely newer entrant, a slower regulatory "
                "path, or a program that has struggled to advance -- the data alone "
                "cannot distinguish these; it only flags the divergence from peers.",
                "If you're evaluating this regimen as a comparator or a combination "
                "partner, this gap is worth a closer look before assuming it's simply "
                "'earlier stage.'",
                conf, ["regulatory"],
            ))
    return out


def _status_regimen_risk(table_rows):
    """Regimens with a materially higher terminated/withdrawn/suspended rate
    than the pipeline baseline -- a repeated-across-trials red flag that a
    single row would never surface."""
    total = len(table_rows)
    if total < 4:
        return []
    baseline_risk = sum(1 for r in table_rows if _is_risk_status(r["status"])) / total * 100
    baseline_mature = sum(1 for r in table_rows if _is_mature_status(r["status"])) / total * 100

    by_regimen = {}
    for r in table_rows:
        if r["regimen"]:
            by_regimen.setdefault(r["regimen"], []).append(r)

    out = []
    for regimen, group in by_regimen.items():
        n = len(group)
        if n < 2:
            continue
        risk_pct = sum(1 for r in group if _is_risk_status(r["status"])) / n * 100
        gap = risk_pct - baseline_risk
        conf = _confidence(n, gap)
        if conf and gap > 0:
            statuses = sorted({r["status"] for r in group if _is_risk_status(r["status"])})
            out.append(_candidate(
                "Repeated discontinuation pattern",
                f"**{regimen}** shows a Terminated/Withdrawn/Suspended rate of "
                f"{round(risk_pct)}% across its {n} cohorts, versus {round(baseline_risk)}% "
                f"for the pipeline overall ({', '.join(statuses)}).",
                f"{n} cohorts using {regimen}; statuses observed: {', '.join(statuses)}.",
                "A regimen that stops early across more than one independent trial is "
                "more likely to reflect a real, recurring issue (tolerability, "
                "feasibility, an interim futility signal) than coincidence -- though "
                "this dataset doesn't record WHY any specific trial stopped.",
                "If this regimen or its drug class overlaps with your program, the "
                "repeated discontinuation pattern is worth investigating directly "
                "(check each trial's stated termination reason) before committing to "
                "a similar design.",
                conf, ["regulatory", "cost"],
            ))
            continue
        mature_pct = sum(1 for r in group if _is_mature_status(r["status"])) / n * 100
        gap_m = mature_pct - baseline_mature
        conf_m = _confidence(n, gap_m)
        if conf_m and gap_m > 0:
            out.append(_candidate(
                "More mature development track",
                f"**{regimen}** has completed {round(mature_pct)}% of its {n} cohorts, "
                f"versus {round(baseline_mature)}% completion across the pipeline overall.",
                f"{n} cohorts using {regimen}, status mix compared against all "
                f"{total} cohorts shown.",
                "A higher completion rate across multiple independent cohorts "
                "suggests this regimen's trials are further along the development "
                "curve than most of this set.",
                "This regimen is a reasonable benchmark for expected trial duration "
                "and enrollment feasibility if your program targets a similar "
                "population or mechanism.",
                conf_m, ["regulatory", "cost"],
            ))
    return out


def _enrollment_shortfall(rows):
    """rows: raw (oncosuite_id, phase, cohort_id, hist, line, regimen,
    planned, enrolled, status, year) tuples -- planned/enrolled are real ints
    here (table_rows' "N" column is already string-formatted). Flags
    regimens/segments where enrolled consistently falls short of planned in
    trials that have already stopped (Completed/Terminated/Withdrawn) --
    i.e. a genuine, closed-book shortfall, not one still mid-enrollment."""
    def _is_closed(r):
        has_counts = r[6] is not None and r[7] is not None and r[6] > 0
        return has_counts and (_is_risk_status(r[8]) or _is_mature_status(r[8]))

    closed = [r for r in rows if _is_closed(r)]
    if len(closed) < 4:
        return []

    by_regimen = {}
    for r in closed:
        regimen = r[5]
        if not regimen:
            continue
        shortfall_pct = max(0.0, (r[6] - r[7]) / r[6] * 100)
        by_regimen.setdefault(regimen, []).append(shortfall_pct)

    baseline = sum(sum(v) / len(v) for v in by_regimen.values()) / len(by_regimen) if by_regimen else 0

    out = []
    for regimen, shortfalls in by_regimen.items():
        n = len(shortfalls)
        if n < 2:
            continue
        avg_shortfall = sum(shortfalls) / n
        under_enrolled_n = sum(1 for s in shortfalls if s >= 20)
        if under_enrolled_n < 2:
            continue
        gap = avg_shortfall - baseline
        conf = _confidence(n, max(gap, avg_shortfall - 10))
        if not conf or avg_shortfall < 15:
            continue
        out.append(_candidate(
            "Recruitment shortfall signal",
            f"Closed-out trials using **{regimen}** enrolled {round(avg_shortfall)}% "
            f"below their planned target on average, across {n} completed/terminated/"
            f"withdrawn cohorts ({under_enrolled_n} of them at least 20% short).",
            f"{n} closed cohorts (Completed/Terminated/Withdrawn) using {regimen}, "
            "comparing planned_enrollment_count against enrollment_count.",
            "Consistently under-target enrollment across independent trials of the "
            "same regimen points to a real feasibility constraint in that patient "
            "population -- eligibility criteria too narrow, competing trials for the "
            "same patients, or a population smaller than assumed at design time.",
            "If your program targets an overlapping population or line of therapy, "
            "budget extra sites/time for recruitment, or consider whether eligibility "
            "criteria can be safely broadened relative to these precedents.",
            conf, ["cost", "regulatory"],
        ))
    return out


def _indication_crowding(table_rows):
    """Which indication segments have many competing regimens/sponsors in
    this set (crowded, harder to differentiate) versus very few (a possible
    white-space opportunity, though this is competitive density within THIS
    result set only, not a market-sizing claim)."""
    by_indication = {}
    for r in table_rows:
        if r["indication"]:
            by_indication.setdefault(r["indication"], set()).add(r["regimen"])

    segments = [(ind, len(regs)) for ind, regs in by_indication.items() if len(regs) >= 1]
    if len(segments) < 3:
        return []
    segments.sort(key=lambda kv: -kv[1])

    out = []
    top_ind, top_n = segments[0]
    if top_n >= 4:
        conf = _confidence(top_n, 20 if top_n >= 6 else 15)
        if conf:
            out.append(_candidate(
                "Crowded competitive segment",
                f"**{top_ind}** is the most contested segment in this set: "
                f"**{top_n} distinct regimens** are being developed for it.",
                f"{top_n} distinct regimen values under indication='{top_ind}', "
                f"out of {len(segments)} indication segments seen in this result set.",
                "A segment with many independent regimens in active development is "
                "harder to differentiate in and more likely to face pricing/access "
                "pressure once several products reach market together.",
                "If your program targets this segment, competitive differentiation "
                "(biomarker selection, combination strategy, dosing convenience) "
                "matters more here than in a less contested segment.",
                conf, ["commercial", "differentiation"],
            ))

    thin = [(ind, n) for ind, n in segments if n == 1]
    if len(thin) >= 1 and len(segments) >= 4:
        conf = _confidence(len(thin) + 2, 15)
        if conf:
            examples = ", ".join(ind for ind, _ in thin[:3])
            out.append(_candidate(
                "Potential white-space segment",
                f"{len(thin)} indication segment(s) in this set have only a single "
                f"regimen in development (e.g. {examples}), versus {top_n} competing "
                f"in the most crowded segment ({top_ind}).",
                f"{len(thin)} of {len(segments)} indication segments have exactly one "
                "distinct regimen represented in this result set.",
                "Fewer competing programs in a segment can mean either a genuine "
                "under-served niche or simply a smaller patient population -- this "
                "dataset alone can't tell which, since it has no epidemiology data "
                "attached to indication strings.",
                "Worth a targeted look at whether the thin segment(s) reflect real "
                "unmet need before reading this as a straightforward opportunity.",
                conf, ["commercial", "differentiation"],
            ))
    return out


# ---------------------------------------------------------------------------
# Selection: rank all candidates, cap the list, keep it thematically diverse.
# ---------------------------------------------------------------------------

def _select(candidates, min_n=3, max_n=7, max_per_category=2):
    candidates = sorted(candidates, key=lambda c: -c["score"])
    selected = []
    category_counts = {}
    for c in candidates:
        if len(selected) >= max_n:
            break
        # Diversity guard: don't let one theme (e.g. every slot being a
        # "commercial" angle) crowd out other business-value dimensions,
        # unless we're short of the minimum and have nothing else to show.
        blocked = any(category_counts.get(cat, 0) >= max_per_category for cat in c["categories"])
        if blocked and len(selected) >= min_n:
            continue
        selected.append(c)
        for cat in c["categories"]:
            category_counts[cat] = category_counts.get(cat, 0) + 1
    return selected


def _format(candidate, index):
    return (
        f"**{index}. {candidate['label']}**\n"
        f"{candidate['finding']}\n\n"
        f"**Evidence:** {candidate['evidence']}\n\n"
        f"**Why it matters:** {candidate['why']}\n\n"
        f"**Potential implication:** {candidate['implication']}\n\n"
        f"**Evidence level:** {candidate['confidence']} "
        "(correlational -- hypothesis-generating, not proven causal evidence)"
    )


def generate_key_learnings(rows, table_rows, trial_ids=None):
    """rows: raw SQL tuples from dashboard._COHORT_SQL (oncosuite_id, phase,
    cohort_id, hist, line, regimen, planned, enrolled, status, year).
    table_rows: the same cohorts, already formatted for display (has
    'indication', 'phase', 'regimen', 'status', etc. as display strings).
    trial_ids: passed through to complex_insights.py's cross-table analyses.

    Returns a list of ready-to-display strings (Markdown-ish **bold**), 0-7
    of them -- never padded to a target count with weak filler."""
    candidates = []
    candidates += _phase_regimen_skew(table_rows)
    candidates += _status_regimen_risk(table_rows)
    candidates += _enrollment_shortfall(rows)
    candidates += _indication_crowding(table_rows)

    # Reuse complex_insights.py's existing cross-table analyses rather than
    # recomputing drug-combination / sponsor-concentration / biomarker-hazard-
    # ratio / payload-safety logic a second time -- see that module's
    # docstrings for the underlying joins and caveats.
    try:
        from complex_insights import (
            drug_combination_insights, sponsor_moa_insights,
            biomarker_outcome_insights, payload_safety_insights,
        )

        combo = drug_combination_insights(trial_ids, limit=1)
        if combo["table"]:
            top = combo["table"][0]
            n = top["trials"]
            conf = _confidence(n, 20 if n >= 5 else 15)
            if conf:
                candidates.append(_candidate(
                    "Standardizing combination",
                    f"**{top['drug_a']} + {top['drug_b']}** is the most-repeated drug "
                    f"pairing in this set, appearing together across {n} distinct trials.",
                    f"Co-occurrence of {top['drug_a']} and {top['drug_b']} across "
                    "treatment_info/stratification_info/drug_info joins, {n} trials.",
                    "A combination reused across multiple independent trials suggests "
                    "the field is converging on it as a reasonable backbone, rather "
                    "than each sponsor exploring an isolated hypothesis.",
                    "If your program considers combination therapy, this pairing is a "
                    "documented precedent worth benchmarking against, including "
                    "checking whether its trials share overlapping IP or exclusivity.",
                    conf, ["regulatory", "commercial"],
                ))

        sponsor = sponsor_moa_insights(trial_ids, limit=1, min_trials=2)
        if sponsor["table"]:
            top = sponsor["table"][0]
            conf = _confidence(top["trials"], 100 * (top["hhi"] - 0.3))
            if conf and top["hhi"] >= 0.5:
                candidates.append(_candidate(
                    "Concentrated competitor strategy",
                    f"**{top['sponsor']}** concentrates {top['top_moa_share']}% of its "
                    f"drug-mechanism links (across {top['trials']} trials) on "
                    f"**{top['top_moa']}**, rather than spreading across mechanisms.",
                    f"Sponsor-to-mechanism join across {top['trials']} trials; "
                    f"concentration index HHI={top['hhi']}.",
                    "A sponsor doubling down on one mechanism across multiple trials "
                    "signals conviction in that approach -- and is a specific, named "
                    "competitor to track if your program shares the same mechanism.",
                    "Worth confirming whether this sponsor's trials overlap your "
                    "target indication/line of therapy, since a concentrated "
                    "competitor is a sharper competitive risk than a diversified one.",
                    conf, ["differentiation", "commercial"],
                ))

        biomarker = biomarker_outcome_insights(trial_ids, limit=1)
        if biomarker["table"]:
            top = biomarker["table"][0]
            n = top["n"]
            conf = _confidence(n, abs(top["vs_db_avg"]) * 40)
            if conf:
                direction = "lower (more favorable)" if top["vs_db_avg"] < 0 else "higher (less favorable)"
                candidates.append(_candidate(
                    "Biomarker-linked outcome signal",
                    f"Cohorts positive for **{top['biomarker']}** show a {direction} "
                    f"average hazard ratio ({top['avg_hr']}) than the dataset baseline, "
                    f"across {n} reported comparisons.",
                    f"{n} hazard-ratio records for cohorts carrying the {top['biomarker']} "
                    "biomarker, joined against cohort_info.biomarkers.",
                    "Hazard ratio is a real reported outcome metric here, so this is a "
                    "genuine efficacy-adjacent association -- but hazard ratios from "
                    "different trials, endpoints and comparators are not statistically "
                    "pooled here, so this is a directional signal, not a meta-analysis.",
                    "If your program addresses this biomarker, this is a data point "
                    "worth tracking alongside your own trial's biomarker-stratified "
                    "results as they mature.",
                    conf, ["efficacy", "regulatory"],
                ))

        if trial_ids:
            payload = payload_safety_insights(trial_ids, limit=1)
            if payload["table"]:
                top = payload["table"][0]
                if top["avg_grade_3_4_pct"] is not None:
                    conf = _confidence(top["arms"], top["avg_grade_3_4_pct"])
                    if conf:
                        candidates.append(_candidate(
                            "Payload-linked safety signal",
                            f"**{top['payload_class']}** shows the highest severe "
                            f"(Grade 3-4) adverse-event rate among payload classes in "
                            f"this set, averaging {top['avg_grade_3_4_pct']}% across "
                            f"{top['arms']} arms.",
                            f"Mechanism-of-action text classified into payload class, "
                            f"joined against arm-level adverse_events, {top['arms']} arms.",
                            "Tolerability differences by payload class are a plausible, "
                            "mechanistically-grounded pattern (different payloads carry "
                            "different known toxicity profiles) -- but this dataset's "
                            "per-arm severe-AE rates are self-reported and not "
                            "adjusted for dose, schedule or population differences.",
                            "If evaluating a payload for your own ADC or conjugate "
                            "program, this flags where extra safety monitoring or dose-"
                            "optimization investment may be warranted.",
                            conf, ["safety", "ease_of_use"],
                        ))
    except Exception:
        pass

    selected = _select(candidates)
    return [_format(c, i + 1) for i, c in enumerate(selected)]
