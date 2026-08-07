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

# Per-cohort safety rate, for the Efficacy vs Safety scatter -- averaged across
# whichever arms belong to the cohort, same grain as the OS/ORR/PFS lookup above
# so the two can be paired into one point per cohort.
_COHORT_SAFETY_SQL = """
SELECT co.cohort_id,
       AVG(NULLIF(ae.grade_3_4, 0)) AS avg_sae,
       AVG(NULLIF(ae.all_grades, 0)) AS avg_ae
  FROM oncosuite_gold.adverse_events ae
  JOIN oncosuite_gold.arms_info a ON a.arm_id = ae.arm_id
  JOIN oncosuite_gold.cohort_info co ON co.cohort_id = a.cohort_id
 WHERE co.cohort_id IN %s
 GROUP BY co.cohort_id
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


_EFFICACY_METRICS = ("ORR", "OS", "PFS")
_SAFETY_METRICS = ("SAE", "AE")


def _build_efficacy_safety_scatter(rows, outcomes, safety):
    """Efficacy-vs-safety scatter props (EfficacySafetyScatter's `liveData`
    shape), one point per cohort, built entirely from oncosuite_gold.

    Only a cohort carrying at least one real efficacy value AND one real
    safety value contributes a point, and an axis is only offered when at
    least 3 cohorts report it -- so a near-empty axis never looks populated.
    Returns None when too few real pairs exist to be worth plotting (the
    common case: most trials haven't posted outcomes yet).
    """
    points = []
    for (oid, phase, cohort_id, hist, line, regimen,
         _planned, _enrolled, _status, year) in rows:
        metrics = {}
        for m, v in (outcomes.get(cohort_id) or {}).items():
            if v is not None:
                metrics[m] = float(v)
        for m, v in (safety.get(cohort_id) or {}).items():
            if v is not None:
                metrics[m] = float(v)
        if not metrics:
            continue
        points.append({
            "name": regimen or oid,
            "metrics": metrics,
            "orr": metrics.get("ORR"),
            "sae": metrics.get("SAE") or metrics.get("AE"),
            "n": 1,
            "strategy": regimen or "Unknown",
            "biomarker": phase or "Unknown",
            "mode": _indication(hist, line) or "Unknown",
            "phase": phase,
            "year": str(year) if year else None,
            "lineOfTherapy": line if isinstance(line, list) else [],
            "stage": [],
            "country": [],
            "oncosuite_id": oid,
        })

    if not points:
        return None

    def _have(m):
        return sum(1 for p in points if p["metrics"].get(m) is not None)

    def _pair_count(x, y):
        return sum(1 for p in points
                   if p["metrics"].get(x) is not None and p["metrics"].get(y) is not None)

    x_options = [m for m in _EFFICACY_METRICS if _have(m) >= 3]
    y_options = [m for m in _SAFETY_METRICS if _have(m) >= 3]
    if not x_options or not y_options:
        return None

    default_x, default_y = max(
        ((x, y) for x in x_options for y in y_options),
        key=lambda pair: _pair_count(*pair),
    )
    if _pair_count(default_x, default_y) < 3:
        return None

    return {
        "liveData": points,
        "xOptions": x_options,
        "yOptions": y_options,
        "defaultX": default_x,
        "defaultY": default_y,
        "pairCounts": {f"{x}|{y}": _pair_count(x, y)
                       for x in x_options for y in y_options},
        "colorOptions": [
            {"label": "Color by Regimen", "field": "strategy"},
            {"label": "Color by Phase", "field": "phase"},
        ],
    }


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

        safety = {}
        cur.execute(_COHORT_SAFETY_SQL, (cohort_ids,))
        for cohort_id, avg_sae, avg_ae in cur.fetchall():
            safety[cohort_id] = {"SAE": avg_sae, "AE": avg_ae}

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
            "year": _yr,
            # None -> the table renders an em dash. Never substituted with a
            # placeholder number.
            "os": _metric(vals.get("OS"), "mo"),
            "orr": _metric(vals.get("ORR"), "%"),
            "pfs": _metric(vals.get("PFS"), "mo"),
        })

    blocks = [{
        "type": "summary",
        "text": (f"We found {len(rows)} cohorts within {len(trial_ids)} trials"
                 + (f" ({min(years_seen)}–{max(years_seen)})" if years_seen else "")),
    }, {
        "type": "chart",
        # CohortTable owns its own column spec (Figma widths / filters), so it
        # only needs the rows. `title` gives the table its own caption instead
        # of relying entirely on the summary line above it.
        "chart": "CohortTable",
        "props": {"data": table_rows, "title": "Cohorts"},
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
            g = groups.setdefault(key, {
                "children": [], "ae_num": 0.0, "ae_den": 0, "sae_num": 0.0, "sae_den": 0,
            })
            g["children"].append({
                "event": event, "arms": int(arms),
                "ae": _pct(avg_all), "sae": _pct(avg_sae),
            })
            # Weighted by arms reporting THIS event, not a flat mean across event
            # types -- an unweighted mean gave one arm's worth of a rare 1%
            # event (Haematochezia, 6 arms) equal say over the group total as
            # Nausea (34.6%, 11 arms), which pulled every group's headline rate
            # below its own most common symptom. Still a rate-of-rates (this
            # table has no raw per-patient/per-arm flag to compute a true "any
            # event in this organ system" incidence), just weighted honestly now.
            if avg_all is not None:
                g["ae_num"] += float(avg_all) * int(arms)
                g["ae_den"] += int(arms)
            if avg_sae is not None:
                g["sae_num"] += float(avg_sae) * int(arms)
                g["sae_den"] += int(arms)

        ae_groups = []
        for organ, g in sorted(groups.items(),
                               key=lambda kv: -sum(c["arms"] for c in kv[1]["children"])):
            weighted_ae = (g["ae_num"] / g["ae_den"]) if g["ae_den"] else None
            weighted_sae = (g["sae_num"] / g["sae_den"]) if g["sae_den"] else None
            ae_groups.append({
                "event": organ,
                "ae": _pct(weighted_ae),
                "sae": _pct(weighted_sae),
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

    # Efficacy vs Safety needs an efficacy AND a safety value for the same
    # cohort. Built from oncosuite_gold (outcomes + safety, both fetched
    # above) rather than analytics.efficacy_vs_safety -- that table has zero
    # rows overlapping ADC/Cell-Therapy/Cancer-Vaccine trials (checked
    # directly), so it could never populate this dashboard's scatter.
    scatter = _build_efficacy_safety_scatter(rows, outcomes, safety)
    scatter_is_extracted = False
    if not scatter:
        # Clean sources have nothing for this trial set -- fall back to
        # analytics.efficacyvssafety_table, an unresolved LLM-extraction table
        # (duplicate/conflicting values per arm, collapsed with MAX -- see
        # build_efficacy_safety_extracted's docstring). Only used as a last
        # resort, and always caveated below when it fires.
        try:
            from analytics_data import build_efficacy_safety_extracted
            scatter = build_efficacy_safety_extracted(list(trial_ids))
            scatter_is_extracted = scatter is not None
        except Exception:
            scatter = None

    if scatter:
        # The scatter's own props carry no title -- ctsearch's EfficacyVsSafety
        # component (vendored, unmodified) has no title slot, so the caption
        # goes in its own intro block rather than requiring a fork of that
        # component just to add one.
        n_points = len(scatter.get("liveData") or [])
        dx, dy = scatter.get("defaultX"), scatter.get("defaultY")
        blocks.append({
            "type": "intro",
            "text": (
                f"**Efficacy vs Safety** — {n_points} cohort(s) plotted, comparing "
                f"{dx} (efficacy) against {dy} (safety) by default; switch either "
                "axis below to compare other reported metrics."
            ),
        })
        blocks.append({"type": "chart", "chart": "EfficacySafetyScatter",
                       "props": scatter})
        if scatter_is_extracted:
            blocks.append({
                "type": "note",
                "title": "Efficacy vs Safety — extracted, unverified data",
                "items": [
                    "No trials in this set have posted outcomes in the "
                    "verified oncosuite_gold data yet, so this chart falls "
                    "back to automated extraction (analytics."
                    "efficacyvssafety_table). That source has NOT been "
                    "deduplicated -- the same arm can carry several "
                    "conflicting readings for one metric, and the average "
                    "of those readings is shown since there's no way to "
                    "tell which one is correct. Treat this as indicative, "
                    "not verified.",
                ],
            })

    # Key Insights, computed from the rows above rather than written by a model:
    # every figure here is a count taken from the result set, so the panel costs
    # nothing and cannot state something the data does not support. Each item is
    # fact + "so what" -- a bare count ("29 of 75 are Phase 2") doesn't tell the
    # reader anything actionable on its own; what it implies about where this
    # pipeline sits (maturity, concentration, where risk shows up) does.
    insights = []
    total = len(table_rows)
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

    _PHASE_IMPLICATIONS = (
        # (substring to match in the phase label, implication) -- checked most
        # advanced first, so a combined label like "Phase 2/3" reads as the
        # more advanced of the two rather than the earlier one.
        ("4", "post-approval monitoring, since these are already-marketed regimens"),
        ("3", "confirmatory testing, so this pipeline is comparatively mature with "
              "some assets close to a regulatory-relevant readout"),
        ("2", "efficacy-exploration testing rather than confirmatory Phase 3, so "
              "this is an early/mid-stage landscape rather than one nearing "
              "approval decisions"),
        ("1", "early safety/dose-finding work, so efficacy signals here are still "
              "preliminary"),
    )

    if phases and total:
        top = max(phases.items(), key=lambda kv: kv[1])
        pct = round(100 * top[1] / total)
        implication = next(
            (imp for tag, imp in _PHASE_IMPLICATIONS if tag in top[0]),
            "the stage of development varies across this set",
        )
        insights.append(
            f"{top[0]} is the largest single phase ({top[1]} of {total} cohorts, "
            f"{pct}%) -- most of this pipeline is in {implication}."
        )

    if statuses and total:
        def _count(*names):
            names = {n.lower() for n in names}
            return sum(v for k, v in statuses.items() if k.lower() in names)

        recruiting_n = _count("recruiting")
        awaiting_n = _count("active - not recruiting")
        completed_n = _count("completed")

        if recruiting_n:
            pct = round(100 * recruiting_n / total)
            line = (f"{recruiting_n} of {total} cohorts ({pct}%) are still actively "
                    f"Recruiting")
            if awaiting_n:
                line += f", plus {awaiting_n} more done enrolling but not yet reporting"
            line += (" -- most of this pipeline hasn't had time to generate outcome "
                     "data yet, which is why OS/ORR/PFS are empty for nearly every "
                     "row above.")
            insights.append(line)
        elif completed_n:
            pct = round(100 * completed_n / total)
            insights.append(
                f"{completed_n} of {total} cohorts ({pct}%) are Completed -- this is "
                "a comparatively mature set, so any missing efficacy data reflects a "
                "reporting gap rather than trials still being too early to read out."
            )
        else:
            top_status = max(statuses.items(), key=lambda kv: kv[1])
            insights.append(
                f"Most common trial status is {top_status[0]} ({top_status[1]} cohorts)."
            )

    if regimens and total:
        n_regimens = len(regimens)
        top_reg = max(regimens.items(), key=lambda kv: kv[1])
        if top_reg[1] > 1:
            share = round(100 * top_reg[1] / total)
            avg = total / n_regimens
            insights.append(
                f"{n_regimens} distinct regimens are spread across just {total} "
                f"cohorts (~{avg:.1f} each), and even the most-studied one, "
                f"{top_reg[0]}, accounts for only {top_reg[1]} ({share}%) -- no "
                "single regimen has pulled ahead yet, so this remains a fragmented, "
                "still-consolidating field rather than one with a clear front-runner."
            )
        else:
            insights.append(
                f"{n_regimens} distinct regimens appear across these cohorts, each "
                "studied in only one -- this field is maximally fragmented, with no "
                "regimen yet repeated across multiple cohorts."
            )

    if ae_rows:
        line = (f"Safety data covers {len(ae_rows)} distinct adverse-event terms "
                f"across {arm_count} arms.")
        if ae_groups:
            top_group = ae_groups[0]
            top_children = [c["event"] for c in top_group["children"][:3]]
            mechanism_note = ""
            if "adc" in modality.lower() or "antibody-drug conjugate" in modality.lower():
                mechanism_note = (", consistent with the cytotoxic payload most ADCs "
                                  "carry")
            line += (
                f" {top_group['event']} is the most-reported category "
                f"(e.g. {', '.join(top_children)}){mechanism_note} -- this is where "
                "tolerability is most likely to differentiate these regimens once "
                "head-to-head comparisons are possible."
            )
        insights.append(line)

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
