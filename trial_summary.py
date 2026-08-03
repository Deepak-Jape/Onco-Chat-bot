"""Executive-summary payload for one trial -- what the drawer shows when a
cohort's OncoSuite ID is clicked.

Mirrors the layout of ctsearch's ExecuiteSummaryDrawer (header, enrollment and
sites cards, eligibility criteria, treatment arms, endpoints) but is fed from
oncosuite_gold instead of that app's API. Fields with no value come back as
None so the UI can show a dash rather than an invented figure.
"""

from db import get_conn


def _s(v):
    return None if v is None or str(v).strip() == "" else str(v).strip()


def _flatten_criteria(js):
    """cohort_info stores eligibility as a jsonb object whose values are either
    strings or lists. Flatten to display lines, keeping the key as a label where
    it carries meaning (e.g. "Male: 18 years - 120 years")."""
    out = []
    if not isinstance(js, dict):
        return out
    for key, value in js.items():
        if isinstance(value, list):
            for item in value:
                text = _s(item)
                if text:
                    out.append(text)
        else:
            text = _s(value)
            if not text:
                continue
            label = str(key).replace("_", " ").strip()
            out.append(f"{label.capitalize()}: {text}" if len(label) <= 24 else text)
    return out[:40]


def build_trial_summary(oncosuite_id: str):
    """Everything the drawer renders for one trial, or None if the id is unknown."""
    tid = _s(oncosuite_id)
    if not tid:
        return None

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT official_title, trial_phase, study_status, sponsor_name,
                   lead_organization, enrollment_count, planned_enrollment_count,
                   start_date, primary_completion_date, completion_date,
                   sites_count, country_count, study_design, study_type, has_results
              FROM oncosuite_gold.trial_info
             WHERE oncosuite_id = %s
            """,
            (tid,),
        )
        row = cur.fetchone()
        if not row:
            return None

        (title, phase, status, sponsor, lead_org, enrolled, planned, start,
         primary_completion, completion, sites, countries, design, study_type,
         has_results) = row

        cur.execute(
            """
            SELECT cohort_id, cohort_name, histology, line_of_therapy, organ,
                   biomarkers, cancer_stage,
                   eligibility_inclusion_criteria, eligibility_exclusion_criteria
              FROM oncosuite_gold.cohort_info
             WHERE oncosuite_id = %s
             ORDER BY cohort_name
            """,
            (tid,),
        )
        cohort_rows = cur.fetchall()

        cohort_ids = tuple(r[0] for r in cohort_rows) or (None,)
        cur.execute(
            """
            SELECT a.arm_name, a.arm_type, a.arm_status,
                   STRING_AGG(DISTINCT d.name, ' + ') AS drugs
              FROM oncosuite_gold.arms_info a
              LEFT JOIN oncosuite_gold.stratification_info s ON s.arm_id = a.arm_id
              LEFT JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
              LEFT JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
             WHERE a.cohort_id IN %s
             GROUP BY a.arm_id, a.arm_name, a.arm_type, a.arm_status
             ORDER BY a.arm_name
            """,
            (cohort_ids,),
        )
        arm_rows = cur.fetchall()

        cur.execute(
            """
            SELECT endpoint_name, endpoint_type, endpoint_abbreviation,
                   timing_and_evaluator
              FROM oncosuite_gold.study_endpoints_info
             WHERE oncosuite_id = %s
             ORDER BY CASE WHEN endpoint_type = 'Primary' THEN 0 ELSE 1 END,
                      endpoint_name
             LIMIT 40
            """,
            (tid,),
        )
        endpoint_rows = cur.fetchall()

        cur.execute(
            """
            SELECT country, COUNT(*) AS n
              FROM oncosuite_gold.facility_info
             WHERE oncosuite_id = %s AND country IS NOT NULL
             GROUP BY country
             ORDER BY n DESC
             LIMIT 12
            """,
            (tid,),
        )
        site_rows = cur.fetchall()

    first = cohort_rows[0] if cohort_rows else None
    return {
        "oncosuite_id": tid,
        "title": _s(title),
        "phase": _s(phase),
        "status": _s(status),
        "sponsor": _s(sponsor),
        "lead_organization": _s(lead_org),
        "study_design": _s(design),
        "study_type": _s(study_type),
        "has_results": bool(has_results),
        "enrollment": {"planned": planned, "enrolled": enrolled},
        "dates": {
            "start": _s(start),
            "primary_completion": _s(primary_completion),
            "completion": _s(completion),
        },
        "sites": {
            "count": sites,
            "countries": countries,
            # "5x United States, 3x Germany, ..." like the design's Sites card.
            "by_country": [{"country": _s(c), "n": int(n)} for c, n in site_rows],
        },
        "cohorts": [
            {
                "name": _s(r[1]),
                "histology": r[2],
                "line_of_therapy": r[3],
                "organ": r[4],
                "biomarkers": r[5],
                "cancer_stage": r[6],
            }
            for r in cohort_rows
        ],
        "eligibility": {
            "inclusion": _flatten_criteria(first[7]) if first else [],
            "exclusion": _flatten_criteria(first[8]) if first else [],
        },
        "arms": [
            {"name": _s(a), "type": _s(t), "status": _s(st), "drugs": _s(d)}
            for a, t, st, d in arm_rows
        ],
        "endpoints": [
            {
                "name": _s(n),
                "type": _s(t),
                "abbreviation": _s(ab),
                "timing": _s(tm),
            }
            for n, t, ab, tm in endpoint_rows
        ],
    }
