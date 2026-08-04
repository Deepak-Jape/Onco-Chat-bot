"""Cohort dashboard: the multi-panel answer (cohort table + charts) for
"list all X trials ... including their endpoints" style questions.

Everything here is read from oncosuite_gold. Where the database has no value the
cell is emitted as None and the UI shows its own "N/A" -- deliberately, because
the alternative is inventing numbers. Coverage is genuinely sparse for outcome
values (roughly 8% of ORR endpoints carry a number), so expect real gaps.
"""

from db import get_conn

# Cohorts are reached from drugs through
# drug -> treatment -> stratification -> arm -> cohort -> trial.
_COHORT_SQL = """
SELECT t.oncosuite_id,
       t.trial_phase,
       co.cohort_id,
       co.histology,
       co.line_of_therapy,
       STRING_AGG(DISTINCT d.name, ' + ') AS regimen,
       t.planned_enrollment_count,
       t.enrollment_count,
       t.study_status,
       EXTRACT(YEAR FROM t.start_date)::int AS start_year
  FROM oncosuite_gold.trial_info t
  JOIN oncosuite_gold.cohort_info co ON co.oncosuite_id = t.oncosuite_id
  JOIN oncosuite_gold.arms_info a ON a.cohort_id = co.cohort_id
  JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
  JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
  JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
 WHERE d.modality = %s
   AND t.start_date >= (CURRENT_DATE - (%s || ' years')::interval)
 GROUP BY t.oncosuite_id, t.trial_phase, co.cohort_id, co.histology,
          co.line_of_therapy, t.planned_enrollment_count, t.enrollment_count,
          t.study_status, t.start_date
 ORDER BY t.start_date DESC
 LIMIT %s
"""

# Per-cohort OS / ORR. Endpoints are trial-level, outcome values are arm-level,
# so a cohort's value is taken from any arm belonging to it.
_OUTCOME_SQL = """
SELECT co.cohort_id,
       UPPER(e.endpoint_abbreviation) AS metric,
       MIN(r.value) AS value
  FROM oncosuite_gold.cohort_info co
  JOIN oncosuite_gold.arms_info a ON a.cohort_id = co.cohort_id
  JOIN oncosuite_gold.results_outcomes_basic_info r ON r.arm_id = a.arm_id
  JOIN oncosuite_gold.study_endpoints_info e ON e.endpoint_id = r.endpoint_id
 WHERE co.cohort_id IN %s
   AND UPPER(e.endpoint_abbreviation) IN ('OS', 'ORR', 'PFS')
   AND r.value IS NOT NULL
 GROUP BY co.cohort_id, UPPER(e.endpoint_abbreviation)
"""

# The question asks for endpoints, and endpoint DEFINITIONS exist even where no
# outcome VALUE was ever posted -- so this panel is populated from the endpoint
# table directly and stands on its own.
_ENDPOINTS_SQL = """
SELECT COALESCE(NULLIF(e.endpoint_abbreviation, ''), 'Other') AS metric,
       e.endpoint_type,
       COUNT(*) AS n,
       COUNT(DISTINCT e.oncosuite_id) AS trials
  FROM oncosuite_gold.study_endpoints_info e
 WHERE e.oncosuite_id IN %s
   AND e.endpoint_abbreviation IS NOT NULL
 GROUP BY 1, 2
 ORDER BY n DESC
 LIMIT 20
"""

# name_and_organ is stored as "Event (Organ system)", which gives the two-level
# grouping the design shows: organ system as the expandable parent, individual
# events beneath it.
_AE_SQL = """
SELECT SPLIT_PART(ae.name_and_organ, ' (', 1) AS event,
       NULLIF(TRIM(TRAILING ')' FROM SPLIT_PART(ae.name_and_organ, ' (', 2)), '') AS organ,
       COUNT(DISTINCT ae.arm_id) AS arms,
       AVG(NULLIF(ae.all_grades, 0)) AS avg_all,
       AVG(NULLIF(ae.grade_3_4, 0)) AS avg_sae
  FROM oncosuite_gold.adverse_events ae
  JOIN oncosuite_gold.arms_info a ON a.arm_id = ae.arm_id
  JOIN oncosuite_gold.cohort_info co ON co.cohort_id = a.cohort_id
 WHERE co.oncosuite_id IN %s
   AND ae.name_and_organ IS NOT NULL
 GROUP BY 1, 2
 ORDER BY arms DESC
 LIMIT 120
"""

# Arms behind the Efficacy-vs-Safety panel, for the "N Arms" badge.
_ARM_COUNT_SQL = """
SELECT COUNT(DISTINCT a.arm_id)
  FROM oncosuite_gold.arms_info a
  JOIN oncosuite_gold.cohort_info co ON co.cohort_id = a.cohort_id
 WHERE co.oncosuite_id IN %s
"""


def _first(js):
    """cohort_info stores histology / line_of_therapy as jsonb arrays."""
    if isinstance(js, list) and js:
        return str(js[0])
    if isinstance(js, str) and js.strip():
        return js
    return None


def _indication(histology, line):
    parts = [p for p in (_first(line), _first(histology)) if p]
    return " ".join(parts) if parts else None


def build_cohort_dashboard(modality="Antibody-Drug Conjugate (ADC)",
                           years=10, limit=200):
    """Blocks for the cohort-dashboard answer.

    Returns {"blocks": [...], "meta": {...}} or None when nothing matches.
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(_COHORT_SQL, (modality, str(years), limit))
        rows = cur.fetchall()
        if not rows:
            return None

        cohort_ids = tuple(r[2] for r in rows)
        trial_ids = tuple({r[0] for r in rows})

        outcomes = {}
        cur.execute(_OUTCOME_SQL, (cohort_ids,))
        for cohort_id, metric, value in cur.fetchall():
            outcomes.setdefault(cohort_id, {})[metric] = value

        cur.execute(_ENDPOINTS_SQL, (trial_ids,))
        endpoint_rows = cur.fetchall()

        cur.execute(_AE_SQL, (trial_ids,))
        ae_rows = cur.fetchall()

        cur.execute(_ARM_COUNT_SQL, (trial_ids,))
        arm_count = cur.fetchone()[0]

    years_seen = [r[9] for r in rows if r[9]]
    def _metric(value, unit):
        """'24.6 mo' style cell. Returns None when the database has no value --
        the table shows an em dash rather than a fabricated figure."""
        if value is None:
            return None
        try:
            num = float(value)
        except (TypeError, ValueError):
            return str(value)
        text = f"{num:g}"
        return f"{text}{unit}" if unit == "%" else f"{text} {unit}"

    def _n(planned, enrolled):
        bits = []
        if planned is not None:
            bits.append(f"{planned} (Planned)")
        if enrolled is not None:
            bits.append(f"{enrolled} (Enrolled)")
        return "\n".join(bits) if bits else None

    # CommonTableCard reads rows as {col.key: value}, so emit that shape here.
    table_rows = []
    for (oid, phase, cohort_id, hist, line, regimen,
         planned, enrolled, status, _yr) in rows:
        vals = outcomes.get(cohort_id, {})
        table_rows.append({
            "oncosuite_id": oid,
            "phase": phase,
            "indication": _indication(hist, line),
            "regimen": regimen,
            "n": _n(planned, enrolled),
            "status": status,
            # None -> the table renders an em dash. Never substituted with a
            # placeholder number.
            "os": _metric(vals.get("OS"), "mo"),
            "orr": _metric(vals.get("ORR"), "%"),
        })

    blocks = [{
        "type": "summary",
        "text": (f"We found {len(rows)} cohorts within {len(trial_ids)} trials"
                 + (f" ({min(years_seen)}–{max(years_seen)})" if years_seen else "")),
    }, {
        "type": "chart",
        # CohortTable owns its own column spec (Figma widths / filters), so it
        # only needs the rows.
        "chart": "CohortTable",
        "props": {"data": table_rows},
    }]

    if endpoint_rows:
        blocks.append({
            "type": "chart",
            "chart": "EndpointSummaryTable",
            "props": {
                "title": "Endpoints",
                "useFigmaStyles": True,
                "columns": [
                    {"key": "metric", "label": "Endpoint"},
                    {"key": "type", "label": "Type"},
                    {"key": "trials", "label": "Trials"},
                    {"key": "n", "label": "Cohorts"},
                ],
                "data": [{"metric": m, "type": ty, "trials": int(tn), "n": int(n)}
                         for m, ty, n, tn in endpoint_rows],
            },
        })

    if ae_rows:
        # Group by organ system so the panel expands/collapses like the design.
        def _pct(v):
            return f"{float(v):.0f}%" if v is not None else None

        groups = {}
        for event, organ, arms, avg_all, avg_sae in ae_rows:
            key = organ or "Other"
            g = groups.setdefault(key, {"children": [], "all": [], "sae": []})
            g["children"].append({
                "event": event, "arms": int(arms),
                "ae": _pct(avg_all), "sae": _pct(avg_sae),
            })
            if avg_all is not None:
                g["all"].append(float(avg_all))
            if avg_sae is not None:
                g["sae"].append(float(avg_sae))

        ae_groups = []
        for organ, g in sorted(groups.items(),
                               key=lambda kv: -sum(c["arms"] for c in kv[1]["children"])):
            avg = lambda xs: (sum(xs) / len(xs)) if xs else None
            ae_groups.append({
                "event": organ,
                "ae": _pct(avg(g["all"])),
                "sae": _pct(avg(g["sae"])),
                # Roll the group's own rate up from its children; a single-child
                # group is shown flat rather than as a pointless expander.
                "children": sorted(g["children"], key=lambda c: -c["arms"])[:12],
            })

        blocks.append({
            "type": "chart",
            "chart": "AdverseEventsTable",
            "props": {
                "title": "Adverse Events",
                "badge": f"{arm_count} Arms",
                "groups": ae_groups,
            },
        })

    # Efficacy vs Safety needs an ORR and an SAE rate for the same cohort. With
    # ~8% outcome coverage most cohorts cannot supply a point, so the panel is
    # only emitted when enough real pairs exist to be worth plotting.
    # The scatter is built ONLY from the analytics schema. oncosuite_gold has no
    # per-arm safety rate to pair with ORR, so the old fallback could only ever
    # plot y=0 for every point -- a chart that looks populated but says nothing.
    # analytics.efficacy_vs_safety carries both readings per arm.
    scatter = None
    try:
        from analytics_data import build_efficacy_safety
        scatter = build_efficacy_safety(list(trial_ids))
    except Exception:
        scatter = None

    if scatter:
        blocks.append({"type": "chart", "chart": "EfficacySafetyScatter",
                       "props": scatter})

    # Key Insights, computed from the rows above rather than written by a model:
    # every figure here is a count taken from the result set, so the panel costs
    # nothing and cannot state something the data does not support.
    insights = []
    phases = {}
    statuses = {}
    regimens = {}
    for r in table_rows:
        if r["phase"]:
            phases[r["phase"]] = phases.get(r["phase"], 0) + 1
        if r["status"]:
            statuses[r["status"]] = statuses.get(r["status"], 0) + 1
        if r["regimen"]:
            regimens[r["regimen"]] = regimens.get(r["regimen"], 0) + 1

    if phases:
        top = max(phases.items(), key=lambda kv: kv[1])
        insights.append(
            f"{top[0]} accounts for the largest share of cohorts "
            f"({top[1]} of {len(table_rows)}, {100 * top[1] // len(table_rows)}%)."
        )
    if statuses:
        recruiting = sum(v for k, v in statuses.items() if "recruit" in k.lower())
        if recruiting:
            insights.append(
                f"{recruiting} of {len(table_rows)} cohorts are currently recruiting."
            )
        top_status = max(statuses.items(), key=lambda kv: kv[1])
        insights.append(f"Most common trial status is {top_status[0]} ({top_status[1]} cohorts).")
    if regimens:
        top_reg = max(regimens.items(), key=lambda kv: kv[1])
        if top_reg[1] > 1:
            insights.append(
                f"{top_reg[0]} is the most frequently studied regimen ({top_reg[1]} cohorts)."
            )
        insights.append(f"{len(regimens)} distinct regimens appear across these cohorts.")
    if ae_rows:
        insights.append(
            f"Safety data covers {len(ae_rows)} distinct adverse-event terms "
            f"across {arm_count} arms."
        )

    if insights:
        blocks.append({"type": "insights", "title": "Key Insights", "items": insights})

    # Say plainly which panels could not be built and why. A silently missing
    # chart reads as a bug; an unexplained empty column reads as a wrong number.
    missing = []
    with_orr = sum(1 for r in table_rows if r["orr"] is not None)
    with_os = sum(1 for r in table_rows if r["os"] is not None)
    if not with_orr and not with_os:
        missing.append(
            "OS and ORR columns are empty: these trials have endpoint definitions "
            "but no posted outcome values for this modality -- other trials in the "
            "database do have OS/ORR values."
        )
    if not scatter:
        missing.append(
            "Efficacy vs Safety is not shown: it needs an ORR and a safety rate "
            "for the same arm, and these trials have no rows in the analytics "
            "efficacy/safety dataset."
        )
    missing.append(
        "KM curve is not shown: the database holds no per-timepoint survival "
        "probabilities or at-risk counts."
    )
    if missing:
        blocks.append({"type": "note", "items": missing})

    return {
        "blocks": blocks,
        "meta": {
            "cohorts": len(rows),
            "trials": len(trial_ids),
            "with_orr": sum(1 for r in table_rows if r["orr"] is not None),
            "with_os": sum(1 for r in table_rows if r["os"] is not None),
            "ae_events": len(ae_rows),
        },
    }
