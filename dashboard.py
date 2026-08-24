"""Cohort dashboard: the multi-panel answer (cohort table + charts) for
"list all X trials ... including their endpoints" style questions.

Everything here is read from oncosuite_gold. Where the database has no value the
cell is emitted as None and the UI shows its own "N/A" -- deliberately, because
the alternative is inventing numbers. Coverage is genuinely sparse for outcome
values (roughly 8% of ORR endpoints carry a number), so expect real gaps.
"""

import re

from db import get_conn
from tools.search_cohorts import regimen_drug_details

# Cohorts are reached from drugs through
# drug -> treatment -> stratification -> arm -> cohort -> trial.
_COHORT_SQL = """
SELECT t.oncosuite_id,
       t.trial_phase,
       co.cohort_id,
       co.histology,
       co.sub_histology,
       co.histology_variant,
       co.organ,
       co.biomarkers,
       co.biomarker_variant,
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
          co.sub_histology, co.histology_variant, co.organ, co.biomarkers,
          co.biomarker_variant, co.line_of_therapy, t.planned_enrollment_count,
          t.enrollment_count, t.study_status, t.start_date
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


def _all(js):
    """Every value in a jsonb array, in order, deduplicated -- ctsearch's own
    trial table shows e.g. "SCLC + Lung" by joining every histology AND organ
    entry, not just the first of each."""
    if isinstance(js, list):
        seen, out = set(), []
        for v in js:
            s = str(v).strip() if v is not None else ""
            if s and s not in seen:
                seen.add(s)
                out.append(s)
        return out
    if isinstance(js, str) and js.strip():
        return [js.strip()]
    return []


def _indication(histology, sub_histology, histology_variant, organ,
                 biomarkers, biomarker_variant):
    """Same fields ctsearch's own trial table shows under "Indication" --
    histology, its sub-type/variant, organ and biomarkers, every value in
    each jsonb array joined with " + " (e.g. "Non-Squamous NSCLC + NSCLC +
    Lung"), deduplicated across fields since histology/organ/biomarker
    entries sometimes repeat each other."""
    parts = []
    seen = set()
    for js in (histology, sub_histology, histology_variant, organ,
               biomarkers, biomarker_variant):
        for p in _all(js):
            if p not in seen:
                seen.add(p)
                parts.append(p)
    return " + ".join(parts) if parts else None


# Only ORR/SAE/AE ever populate the `orr`/`sae` point fields below -- the
# chart these feed (NewTreatment.jsx's EfficacyVsSafety, vendored/unmodified)
# always plots those two literal fields regardless of which axis its own
# dropdowns show, so OS/PFS could never actually be picked as a default here
# without the chart silently rendering nothing for every point.
_EFFICACY_METRICS = ("ORR",)
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
    for (oid, phase, cohort_id, hist, sub_hist, hist_variant, organ,
         biomarkers, biomarker_variant, line, regimen,
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
            "mode": _indication(hist, sub_hist, hist_variant, organ,
                                 biomarkers, biomarker_variant) or "Unknown",
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

        # Per-drug treatment detail for the Regimen column's hover tooltip --
        # dosage, schedule, duration, treatment status and route, straight
        # from oncosuite_gold.treatment_info. Same helper tools/search_cohorts
        # uses, so a drug's name lines up exactly with the STRING_AGG'd
        # regimen text above (both are built from the same treatment_info.drug_name).
        drug_details = regimen_drug_details(list(cohort_ids))

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

    years_seen = [r[14] for r in rows if r[14]]
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

    # Study statuses where enrollment has not concluded, so the trial's
    # *actual* accrual is still zero (or in progress) regardless of what
    # trial_info.enrollment_count says.
    _PRE_ACCRUAL_STATUS = {
        "not yet recruiting", "recruiting", "enrolling by invitation",
        "available", "withheld", "withdrawn",
    }

    def _n(planned, enrolled, status):
        # trial_info.enrollment_count is NOT a live "how many have enrolled
        # so far" count -- confirmed against the whole database: it equals
        # planned_enrollment_count for 100% of Recruiting, Not Yet
        # Recruiting, and Enrolling-By-Invite trials (ClinicalTrials.gov
        # reports "Enrollment" as the anticipated target until a trial
        # concludes, not a running total).
        #
        # ctsearch's own feasibility table (the web app) still shows BOTH
        # lines for such a trial, reporting actual as 0 -- e.g. jVh-8Cy-esB,
        # Recruiting, planned == enrollment_count == 100, renders as
        # "0 (Actual) / 100 (Target)". Match that, so the same trial reads
        # identically in the chatbot and the web app. The suppression this
        # used to do produced a single "(Target)" line and made the two
        # surfaces disagree.
        bits = []
        pre = str(status or "").strip().lower() in _PRE_ACCRUAL_STATUS
        actual = 0 if (pre and enrolled == planned) else enrolled
        if actual is not None:
            bits.append(f"{actual} (Actual)")
        if planned is not None:
            bits.append(f"{planned} (Target)")
        return "\n".join(bits) if bits else None

    def _phase(value):
        """'Phase 2' -> 'P2', 'Phase 1/2' -> 'P1/2', 'Early Phase 1' -> 'EP1'.

        Abbreviated so the column stays narrow; the full vocabulary is the
        eight distinct trial_phase values in oncosuite_gold.trial_info.
        """
        s = str(value or "").strip()
        if not s:
            return None
        m = re.match(r"^(early\s+)?phase\s+(.+)$", s, re.I)
        if not m:
            return s
        return f"{'EP' if m.group(1) else 'P'}{m.group(2).strip()}"

    # CommonTableCard reads rows as {col.key: value}, so emit that shape here.
    table_rows = []
    for (oid, phase, cohort_id, hist, sub_hist, hist_variant, organ,
         biomarkers, biomarker_variant, line, regimen,
         planned, enrolled, status, _yr) in rows:
        vals = outcomes.get(cohort_id, {})
        table_rows.append({
            "oncosuite_id": oid,
            "phase": _phase(phase),
            "indication": _indication(hist, sub_hist, hist_variant, organ,
                                       biomarkers, biomarker_variant),
            "regimen": regimen,
            "regimenDetail": {
                name: {
                    "dosage": d.get("dosage"),
                    "schedule": d.get("schedule"),
                    "duration": d.get("duration"),
                    "treatmentStatus": d.get("treatment_status"),
                    "modeOfAdministration": d.get("mode_of_administration"),
                }
                for name, d in (drug_details.get(cohort_id) or {}).items()
            },
            "n": _n(planned, enrolled, status),
            "status": status,
            "year": _yr,
            # None -> the table renders an em dash. Never substituted with a
            # placeholder number.
            "os": _metric(vals.get("OS"), "mo"),
            "orr": _metric(vals.get("ORR"), "%"),
            "pfs": _metric(vals.get("PFS"), "mo"),
        })

    # Collapse cohorts that are 100% identical across every DISPLAYED column
    # -- confirmed live against the DB that this happens for real (e.g. one
    # trial carrying two cohort_info rows, 1426 and 1427, both named
    # "EGFR-Mutated Non-Squamous NSCLC" with identical histology/biomarkers/
    # line_of_therapy/cancer_stage -- an upstream data duplication, not a
    # join fan-out in this query). Two pixel-identical rows tell the reader
    # nothing a single row wouldn't, and read as an export bug. This is a
    # display-layer dedup only: cohort_ids/trial_ids used earlier for AE/
    # endpoint/outcome aggregates and Key Learnings still reflect the raw
    # cohort count, since resolving whether 1426/1427 should count as one
    # cohort everywhere is a separate upstream data-quality question.
    seen_display_rows = set()
    deduped_rows, deduped_table_rows = [], []
    for raw_row, display_row in zip(rows, table_rows):
        key = tuple(display_row.get(k) for k in
                    ("oncosuite_id", "phase", "year", "indication", "regimen",
                     "n", "status", "os", "orr", "pfs"))
        if key in seen_display_rows:
            continue
        seen_display_rows.add(key)
        deduped_rows.append(raw_row)
        deduped_table_rows.append(display_row)
    rows, table_rows = deduped_rows, deduped_table_rows

    # Source traceability for the Excel export -- CSV can't carry comments, so
    # the cohort table's "why was this cell this value" data (already stored
    # in oncosuite_gold.data_traceability, the same table citations.py and
    # tools/get_trial_sources.py read) only reaches the user via an .xlsx
    # companion download with cell comments attached. Fetched here, in bulk
    # per field rather than per cell, since this is the one place that already
    # has every row's oncosuite_id/cohort_id in hand. Only columns with an
    # unambiguous single source field get a comment -- "regimen" (a
    # STRING_AGG across possibly several drugs) and "os"/"orr"/"pfs" (a MIN
    # across an arm's outcome rows, no single arm_id kept per cohort) are
    # joined/aggregated values with no one data_traceability row that IS the
    # cell, so they're deliberately left uncommented rather than guessed at.
    xlsx_base64 = None
    try:
        import base64 as _b64

        from excel_export import build_xlsx
        from traceability import (
            format_comment, raw_trace_by_oncosuite_id, raw_trace_by_record_id,
            to_evidence_records,
        )

        # Raw trace rows fetched ONCE per field set; comments (short hover
        # summary) and evidence records (full excerpt/reasoning -- see the
        # "Source Evidence" sheet below) are both derived from the same rows
        # rather than querying data_traceability twice.
        trial_trace = raw_trace_by_oncosuite_id(
            trial_ids, "trial_info",
            ["trial_phase", "study_status", "planned_enrollment_count",
             "enrollment_count", "start_date"],
        )
        cohort_trace = raw_trace_by_record_id(
            cohort_ids, "cohort_info",
            ["histology", "sub_histology", "histology_variant", "organ",
             "biomarkers", "biomarker_variant", "line_of_therapy"],
        )

        comments = {}
        evidence = {}
        for row_i, (oid, _phase, cohort_id, _hist, _sub_hist, _hist_variant,
                    _organ, _biomarkers, _biomarker_variant, _line, _regimen,
                    planned_val, enrolled_val, _status, _yr) in enumerate(rows):
            phase_rows = trial_trace.get((oid, "trial_phase"))
            if phase_rows:
                comments[(row_i, "phase")] = format_comment(phase_rows)
                evidence[(row_i, "phase")] = to_evidence_records(phase_rows, "Phase")

            year_rows = trial_trace.get((oid, "start_date"))
            if year_rows:
                comments[(row_i, "year")] = format_comment(year_rows)
                evidence[(row_i, "year")] = to_evidence_records(year_rows, "Start Date")

            status_rows = trial_trace.get((oid, "study_status"))
            if status_rows:
                comments[(row_i, "status")] = format_comment(status_rows)
                evidence[(row_i, "status")] = to_evidence_records(status_rows, "Status")

            # The cell now always carries both an "(Actual)" and a "(Target)"
            # line (see _n() above), so both source fields get traceability.
            # enrollment_count is skipped only where _n() itself substituted a
            # literal 0 for a not-yet-accrued trial -- there is no source row
            # behind that 0 to cite.
            substituted_zero = (
                str(status or "").strip().lower() in _PRE_ACCRUAL_STATUS
                and enrolled_val == planned_val
            )
            n_fields = [("planned_enrollment_count", "N Target")]
            if enrolled_val is not None and not substituted_zero:
                n_fields.append(("enrollment_count", "N Actual"))

            n_rows = [row for field, _ in n_fields for row in (trial_trace.get((oid, field)) or [])]
            if n_rows:
                parts = [format_comment(trial_trace[(oid, field)]) for field, _ in n_fields
                         if trial_trace.get((oid, field))]
                comments[(row_i, "n")] = "\n\n".join(parts)
                evidence[(row_i, "n")] = [
                    rec for field, label in n_fields
                    for rec in to_evidence_records(trial_trace.get((oid, field)), label)
                ]

            ind_fields = [
                ("histology", "Histology"),
                ("sub_histology", "Sub-Histology"),
                ("histology_variant", "Histology Variant"),
                ("organ", "Organ"),
                ("biomarkers", "Biomarkers"),
                ("biomarker_variant", "Biomarker Variant"),
                ("line_of_therapy", "Line of Therapy"),
            ]
            ind_rows = {label: cohort_trace.get((cohort_id, field))
                        for field, label in ind_fields}
            if any(ind_rows.values()):
                comments[(row_i, "indication")] = "\n\n".join(
                    f"{label}:\n{format_comment(rows_)}"
                    for label, rows_ in ind_rows.items() if rows_
                )
                evidence[(row_i, "indication")] = [
                    rec for label, rows_ in ind_rows.items() if rows_
                    for rec in to_evidence_records(rows_, label)
                ]

        xlsx_columns = [
            {"key": "oncosuite_id", "label": "OncoSuite ID"},
            {"key": "phase", "label": "Phase"},
            {"key": "year", "label": "Year"},
            {"key": "indication", "label": "Indication"},
            {"key": "regimen", "label": "Regimen"},
            {"key": "n", "label": "N"},
            {"key": "status", "label": "Status"},
            {"key": "os", "label": "OS"},
            {"key": "orr", "label": "ORR"},
            {"key": "pfs", "label": "PFS"},
        ]
        xlsx_base64 = _b64.b64encode(
            build_xlsx(xlsx_columns, table_rows, comments, evidence)
        ).decode("ascii")
    except Exception:
        # Excel export is a bonus alongside the existing CSV button, not a
        # dependency of it -- any failure here (missing openpyxl, a DB hiccup)
        # should just mean no Download Excel button, never a broken dashboard.
        xlsx_base64 = None

    cohort_table_props = {"data": table_rows, "title": "Cohorts"}
    if xlsx_base64:
        cohort_table_props["xlsxBase64"] = xlsx_base64
        cohort_table_props["xlsxFilename"] = "cohorts.xlsx"

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
        "props": cohort_table_props,
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

    # Status mix is still needed below (the "missing data" note explains OS/ORR
    # gaps differently depending on how many cohorts are Recruiting vs
    # Completed) even though the old flat "Key Insights" bullets built from
    # phases/statuses/regimens here have been replaced by Key Learnings below.
    total = len(table_rows)
    statuses = {}
    for r in table_rows:
        if r["status"]:
            statuses[r["status"]] = statuses.get(r["status"], 0) + 1

    # Key Learnings: cross-column, hypothesis-generating drug-development
    # insights (regimen-vs-phase skew, status risk patterns, enrollment
    # shortfalls, indication crowding, plus the reused cross-table analyses
    # below) -- see key_learnings.py for the full method and its confidence-
    # level / correlation-not-causation guardrails. Replaces the old flat
    # "Key Insights" bullets (single-column descriptive stats), which the
    # task this replaced explicitly flagged as insufficient on their own.
    insights = []
    try:
        from key_learnings import generate_key_learnings
        insights = generate_key_learnings(rows, table_rows, trial_ids)
    except Exception:
        insights = []

    # Payload mechanism vs. safety profile: classifies each drug's free-text
    # mechanism of action into a payload class (topoisomerase-I inhibitor,
    # microtubule-disrupting/auristatin-class, DNA-crosslinking, ...) and
    # cross-references it against arm-level Grade 3-4 rates plus two named
    # patterns (interstitial lung disease, cytopenias) -- connects the
    # Endpoints panel's mechanism data with the Adverse Events panel's safety
    # data, which otherwise sit in unrelated tables.
    try:
        from complex_insights import payload_safety_insights
        payload = payload_safety_insights(trial_ids, limit=8)
        if payload["table"]:
            blocks.append({
                "type": "chart", "chart": "PayloadSafetyTable",
                "props": {
                    "title": "Payload mechanism vs. safety profile",
                    "columns": [
                        {"key": "payload_class", "label": "Payload class"},
                        {"key": "arms", "label": "Arms"},
                        {"key": "avg_grade_3_4_pct", "label": "Avg Grade 3-4 %"},
                        {"key": "ild_arms", "label": "ILD arms"},
                        {"key": "cytopenia_arms", "label": "Cytopenia arms"},
                    ],
                    "data": payload["table"],
                },
            })
            # Not appended to `insights` -- key_learnings.py already reuses
            # payload_safety_insights and folds its top signal into the
            # ranked Key Learnings list above, in the fuller Evidence/Why/
            # Implication format. Duplicating it here as a bare bullet too
            # would just repeat the same fact twice in one answer.
    except Exception:
        pass

    # Site / region footprint: buckets each trial's facility_info countries
    # into regions (US/EU/APAC/...) -- the granular geographic breakdown the
    # per-trial location table doesn't summarize on its own.
    try:
        from complex_insights import region_site_breakdown
        region = region_site_breakdown(trial_ids, limit=8)
        if region["table"]:
            blocks.append({
                "type": "chart", "chart": "RegionFootprintTable",
                "props": {
                    "title": "Site footprint by region",
                    "columns": [
                        {"key": "region", "label": "Region"},
                        {"key": "trials", "label": "Trials with sites here"},
                        {"key": "pct_of_trials", "label": "% of trials"},
                        {"key": "countries", "label": "Countries"},
                    ],
                    "data": region["table"],
                },
            })
            # Shown as its own table only -- see the payload-safety note
            # above for why this isn't also duplicated into `insights`.
    except Exception:
        pass

    # KM survival curve: oncosuite_gold.results_analytics only covers a
    # handful of trials database-wide, so this is scoped to the current
    # modality's trial set and simply omitted (with an honest note below)
    # when none of them happen to be among those few.
    km = None
    try:
        from chart_data import build_km_curve
        km = build_km_curve(list(trial_ids))
    except Exception:
        km = None
    if km:
        blocks.append({"type": "chart", "chart": "KMCurve", "props": km})

    if insights:
        blocks.append({"type": "insights", "title": "Key Learnings", "items": insights})

    # Say plainly which panels could not be built and why. A silently missing
    # chart reads as a bug; an unexplained empty column reads as a wrong number.
    missing = []
    with_orr = sum(1 for r in table_rows if r["orr"] is not None)
    with_os = sum(1 for r in table_rows if r["os"] is not None)
    if not with_orr and not with_os:
        # State WHY, not just THAT -- an empty column with no cause reads as a
        # bug; the actual cause differs by where each cohort sits in its
        # lifecycle, so pick the explanation the status mix actually supports
        # rather than one generic line for every case.
        def _status_count(*names):
            names = {n.lower() for n in names}
            return sum(v for k, v in statuses.items() if k.lower() in names)

        recruiting_n = _status_count("recruiting")
        active_n = _status_count("active - not recruiting")
        completed_n = _status_count("completed")

        if recruiting_n and recruiting_n >= completed_n:
            reason = (
                f"{recruiting_n} of {total} cohorts are still Recruiting, so the "
                "events needed to compute OS/PFS are still accruing and any interim "
                "read would be censored -- values won't post until each trial "
                "reaches its data cutoff."
            )
        elif active_n and not completed_n:
            reason = (
                f"{active_n} of {total} cohorts have finished enrolling but haven't "
                "reached their primary completion date -- follow-up is ongoing, so "
                "outcome values are still pending that data cutoff."
            )
        elif completed_n:
            reason = (
                f"{completed_n} of {total} cohorts are Completed yet still show no "
                "OS/ORR values -- this looks like a reporting gap (results pending "
                "publication or peer review) rather than trials being too early to "
                "read out."
            )
        else:
            reason = (
                "these trials have endpoint definitions but no posted outcome "
                "values for this modality."
            )
        missing.append(f"OS and ORR columns are empty: {reason}")
    if not scatter:
        missing.append(
            "Efficacy vs Safety is not shown: it needs an ORR and a safety rate "
            "for the same arm, and these trials have no rows in the analytics "
            "efficacy/safety dataset."
        )
    if not km:
        missing.append(
            "KM curve is not shown: none of these trials are among the small "
            "set oncosuite_gold.results_analytics currently covers with "
            "per-timepoint survival probabilities or at-risk counts."
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
