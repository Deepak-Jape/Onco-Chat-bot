"""
"Do any of these trials have posted results?"

A follow-up about the set the user is already looking at, which nothing else
answers: search_trials reports what MATCHES filters, not which of those matches
have outcome data behind them. Before this existed the question fell through to
an unscoped search (or, once that was guarded, to "I don't understand").

Results live in oncosuite_gold.results_outcomes_basic_info keyed by arm_id, so
reaching a trial means cohort_info -> arms_info -> results. `value IS NOT NULL`
is the test for POSTED: a row can exist with no value, which is not a result.
"""

from db import query


def check_posted_results(oncosuite_ids):
    """{with_results: [...], without_results: [...], detail: {...}} or error."""
    ids = [str(i).strip() for i in (oncosuite_ids or []) if str(i or "").strip()]
    if not ids:
        return {"error": "No trials in scope to check."}

    rows = query(
        """
        SELECT c.oncosuite_id AS oid,
               COUNT(*)                       AS posted_values,
               COUNT(DISTINCT a.arm_id)       AS arms_with_values,
               COUNT(DISTINCT r.endpoint_type) AS endpoint_types
          FROM oncosuite_gold.cohort_info c
          JOIN oncosuite_gold.arms_info a ON a.cohort_id = c.cohort_id
          JOIN oncosuite_gold.results_outcomes_basic_info r ON r.arm_id = a.arm_id
         WHERE c.oncosuite_id = ANY(%(ids)s) AND r.value IS NOT NULL
         GROUP BY c.oncosuite_id
         ORDER BY posted_values DESC
        """,
        {"ids": ids},
    )
    detail = {r["oid"]: dict(r) for r in rows}
    with_results = [r["oid"] for r in rows]
    without_results = [i for i in ids if i not in detail]

    # Status explains WHY a trial has nothing posted -- a recruiting trial has
    # not reached its data cutoff, which is a different answer from "completed
    # but never reported".
    statuses = {}
    try:
        srows = query(
            "SELECT oncosuite_id, study_status FROM oncosuite_gold.trial_info "
            "WHERE oncosuite_id = ANY(%(ids)s)",
            {"ids": without_results or ids},
        )
        for s in srows:
            statuses[s["oncosuite_id"]] = s.get("study_status")
    except Exception:
        pass

    # WHAT THESE TRIALS DO HAVE. "No results posted" on its own is a dead end;
    # the useful answer names what IS known -- the endpoints they will report,
    # where they are in their lifecycle, and when data is actually due.
    context = {"endpoints_defined": 0, "trials_with_endpoints": 0,
               "status_mix": {}, "next_completion": None}
    try:
        erow = query(
            "SELECT COUNT(*) AS endpoints, "
            "       COUNT(DISTINCT oncosuite_id) AS trials "
            "  FROM oncosuite_gold.study_endpoints_info "
            " WHERE oncosuite_id = ANY(%(ids)s)",
            {"ids": ids},
        )
        if erow:
            context["endpoints_defined"] = int(erow[0]["endpoints"] or 0)
            context["trials_with_endpoints"] = int(erow[0]["trials"] or 0)

        srows = query(
            "SELECT study_status, COUNT(*) AS n, "
            "       MIN(primary_completion_date::text) AS earliest "
            "  FROM oncosuite_gold.trial_info "
            " WHERE oncosuite_id = ANY(%(ids)s) "
            " GROUP BY study_status ORDER BY n DESC",
            {"ids": ids},
        )
        context["status_mix"] = {
            (s["study_status"] or "Unknown"): int(s["n"] or 0) for s in srows
        }
        # Soonest completion date still in the future -- when a read becomes
        # possible, which is the thing a reader actually wants next.
        from datetime import date
        today = date.today().isoformat()
        upcoming = sorted(
            d for d in (s.get("earliest") for s in srows) if d and d > today
        )
        context["next_completion"] = upcoming[0] if upcoming else None
    except Exception:
        pass

    return {
        "checked": len(ids),
        "with_results": with_results,
        "without_results": without_results,
        "detail": detail,
        "statuses": statuses,
        "context": context,
    }


def narrate_posted_results(result):
    """Blocks answering "do any of these have posted results?" in prose.

    Written as a paragraph plus what-they-do-have plus suggestions, because "no"
    is a true answer that helps nobody: the reader wants to know whether the data
    is missing, embargoed, or simply not due yet, and what to look at instead.
    """
    if not result or result.get("error"):
        return []
    checked = result.get("checked") or 0
    have = result.get("with_results") or []
    missing = result.get("without_results") or []
    ctx = result.get("context") or {}
    status_mix = ctx.get("status_mix") or {}
    blocks = []

    if have and not missing:
        lead = (f"All **{checked}** trials have posted outcome values in the "
                f"verified data.")
    elif have:
        lead = (f"**{len(have)}** of **{checked}** trials have posted outcome "
                f"values; the remaining **{len(missing)}** have none yet.")
    else:
        lead = (f"**None of the {checked} trials has posted results yet** — "
                f"there are no outcome values recorded against any of their "
                f"arms in the verified data.")
        # The status mix is the explanation, and it is usually the whole story.
        parts = [f"{n} {s}" for s, n in status_mix.items()]
        if parts:
            lead += (" That is consistent with where they are: "
                     + ", ".join(parts) + ".")
    blocks.append({"type": "intro", "text": lead})

    detail = []
    if ctx.get("endpoints_defined"):
        detail.append(
            f"they do define **{ctx['endpoints_defined']}** endpoints across "
            f"{ctx.get('trials_with_endpoints') or 0} trials, so what they will "
            f"report is known even though the values are not in yet"
        )
    if ctx.get("next_completion"):
        detail.append(
            f"the earliest primary completion still ahead is "
            f"**{ctx['next_completion']}**, which is when a first read becomes "
            f"possible"
        )
    recruiting = sum(n for s, n in status_mix.items()
                     if s and "recruit" in s.lower())
    if recruiting:
        detail.append(
            f"**{recruiting}** are still recruiting, so any interim value would "
            f"be censored rather than final"
        )
    if detail:
        text = "What is known: " + "; ".join(detail) + "."
        blocks.append({"type": "intro", "text": text})

    # Suggestions -- concrete next questions, not generic advice.
    suggestions = []
    if not have:
        suggestions.append(
            "Ask for the **defined endpoints** of any of these trials to see "
            "what each one intends to measure."
        )
        suggestions.append(
            "Ask for **efficacy vs safety** to see which arms across the wider "
            "database DO report both an efficacy and a safety value."
        )
        completed = sum(n for s, n in status_mix.items()
                        if s and "complet" in s.lower())
        if completed:
            suggestions.append(
                f"**{completed}** of these is already Completed — worth checking "
                f"its ClinicalTrials.gov record directly, since a posted result "
                f"there may not have been ingested here yet."
            )
    else:
        suggestions.append(
            "Ask to **compare** two of the trials that do have results to see "
            "their values side by side."
        )
    if suggestions:
        blocks.append({"type": "insights", "title": "What you can ask next",
                       "items": suggestions})
    return blocks
