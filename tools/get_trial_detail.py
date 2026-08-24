"""
Piece 1, Tool 2 — get_trial_detail
Real join chain confirmed against oncosuite_gold:
  trial_info --(oncosuite_id)--> cohort_info --(cohort_id)--> arms_info
    --(arm_id)--> stratification_info --(strata_id)--> treatment_info --(drug_id)--> drug_info

trial_architecture is just a design-type tag (e.g. ["Single Cohort"]), NOT a nesting
shortcut -- confirmed against real data, so this tool does the full join, as planned.
"""
from db import query

def resolve_oncosuite_id(oncosuite_id: str):
    """The stored id matching `oncosuite_id` ignoring case, or None.

    These ids mix upper and lower case ("wD7-VqO-nZf", "kF6-oN3-If3") and are
    read off a screen, so the case a user types is unreliable -- and some
    characters are visually identical in common fonts: a capital I and a
    lowercase l are indistinguishable, which is exactly how "kF6-oN3-If3" gets
    typed as "kF6-oN3-lf3". Matching case-insensitively turns both slips into a
    successful lookup instead of "not a trial id I recognise".
    """
    if not oncosuite_id:
        return None
    wanted = str(oncosuite_id).strip()
    rows = query(
        "SELECT oncosuite_id FROM oncosuite_gold.trial_info "
        "WHERE LOWER(oncosuite_id) = LOWER(%(id)s) LIMIT 1",
        {"id": wanted},
    )
    if rows:
        return rows[0]["oncosuite_id"]

    # LOOKALIKE CHARACTERS. Case alone is not enough: I/l/1 and O/0 are
    # indistinguishable in most UI fonts, so an id copied by eye can differ from
    # the stored one by a character that LOOKS the same. Fold those classes
    # together and compare again -- this is what turns "kF6-oN3-lf3" (typed with
    # a lowercase L) into the real "kF6-oN3-If3" (a capital i).
    def _fold(value):
        out = str(value).lower()
        for group in ("il1", "o0", "s5", "z2"):
            for ch in group[1:]:
                out = out.replace(ch, group[0])
        return out

    folded = _fold(wanted)
    # Same shape only -- 3-3-3 -- so this scans a small candidate set rather
    # than the whole table.
    candidates = query(
        "SELECT oncosuite_id FROM oncosuite_gold.trial_info "
        "WHERE oncosuite_id LIKE %(pat)s",
        {"pat": f"{'_' * 3}-{'_' * 3}-{'_' * 3}"},
    )
    matches = [c["oncosuite_id"] for c in candidates
               if _fold(c["oncosuite_id"]) == folded]
    # Only when it is unambiguous: two ids folding to the same string means we
    # cannot tell which was meant, and guessing shows the wrong trial.
    return matches[0] if len(matches) == 1 else None


def get_trial_detail(oncosuite_id: str):
    # Normalise first: every query below matches the id exactly, so a
    # case/lookalike slip would otherwise fail them all.
    resolved = resolve_oncosuite_id(oncosuite_id)
    if resolved:
        oncosuite_id = resolved

    trial_rows = query(
        "SELECT oncosuite_id, official_title, trial_phase, study_status, sponsor_name, "
        "lead_organization, enrollment_count, start_date, primary_completion_date, "
        "trial_architecture, study_design, study_type "
        "FROM oncosuite_gold.trial_info WHERE oncosuite_id = %(id)s",
        {"id": oncosuite_id},
    )
    if not trial_rows:
        return {"error": f"no trial found for oncosuite_id={oncosuite_id}"}
    trial = trial_rows[0]

    nct_rows = query(
        "SELECT source_unique_id, source_link FROM oncosuite_gold.source_mapping "
        "WHERE oncosuite_id = %(id)s AND source_name = 'clinicaltrials.gov'",
        {"id": oncosuite_id},
    )
    trial["nct_id"] = nct_rows[0]["source_unique_id"] if nct_rows else None
    trial["nct_link"] = nct_rows[0]["source_link"] if nct_rows else None

    # Trial sites/locations live in facility_info, keyed by oncosuite_id.
    facilities = query(
        "SELECT name, city, state, country FROM oncosuite_gold.facility_info "
        "WHERE oncosuite_id = %(id)s ORDER BY country, state, city",
        {"id": oncosuite_id},
    )
    country_summary = query(
        "SELECT country, count(*) AS site_count FROM oncosuite_gold.facility_info "
        "WHERE oncosuite_id = %(id)s GROUP BY country ORDER BY site_count DESC",
        {"id": oncosuite_id},
    )
    trial["locations"] = {
        "total_sites": len(facilities),
        "total_countries": len(country_summary),
        "by_country": country_summary,
        "facilities": facilities,
    }

    cohorts = query(
        "SELECT cohort_id, cohort_name, phase, patient_started, patient_completed, "
        "sex, min_age, max_age, biomarkers, histology, cancer_stage, line_of_therapy, "
        "eligibility_inclusion_criteria, eligibility_exclusion_criteria "
        "FROM oncosuite_gold.cohort_info WHERE oncosuite_id = %(id)s",
        {"id": oncosuite_id},
    )

    for cohort in cohorts:
        arms = query(
            "SELECT arm_id, arm_name, arm_description, arm_type, arm_status, "
            "arm_enrollment_started, arm_enrollment_completed "
            "FROM oncosuite_gold.arms_info WHERE cohort_id = %(cid)s",
            {"cid": cohort["cohort_id"]},
        )
        for arm in arms:
            treatments = query(
                """
                SELECT tr.treatment_id, tr.drug_name, tr.dosage_value, tr.dosage_unit,
                       tr.schedule, tr.duration, s.drug_combination, s.comb_modality,
                       s.regimen_complexity, d.target, d.moa_category, d.modality AS drug_modality
                FROM oncosuite_gold.stratification_info s
                JOIN oncosuite_gold.treatment_info tr ON tr.strata_id = s.strata_id
                LEFT JOIN oncosuite_gold.drug_info d ON d.drug_id = tr.drug_id
                WHERE s.arm_id = %(aid)s
                """,
                {"aid": arm["arm_id"]},
            )
            arm["treatments"] = treatments

            arm["adverse_events"] = query(
                "SELECT ae_id, name_and_organ, all_grades, grade_3_4 "
                "FROM oncosuite_gold.adverse_events WHERE arm_id = %(aid)s",
                {"aid": arm["arm_id"]},
            )
            arm["safety"] = query(
                "SELECT safety_id, safety_title, safety_name, value "
                "FROM oncosuite_gold.safety WHERE arm_id = %(aid)s",
                {"aid": arm["arm_id"]},
            )
            arm["population_characteristics"] = query(
                "SELECT id, characteristics, evaluator, value "
                "FROM oncosuite_gold.population_characteristics WHERE arm_id = %(aid)s",
                {"aid": arm["arm_id"]},
            )
        cohort["arms"] = arms

    trial["cohorts"] = cohorts

    # Endpoints & outcomes: each endpoint gets its result rows and hazard ratios.
    endpoints = query(
        "SELECT endpoint_id, endpoint_name, endpoint_type, endpoint_phase, "
        "endpoint_category, endpoint_abbreviation, measurement_and_criteria, "
        "timing_and_evaluator, response_criteria "
        "FROM oncosuite_gold.study_endpoints_info WHERE oncosuite_id = %(id)s",
        {"id": oncosuite_id},
    )
    for ep in endpoints:
        ep["results"] = query(
            "SELECT id, arm_id, phase, endpoint_type, value_and_evaluator, value "
            "FROM oncosuite_gold.results_outcomes_basic_info WHERE endpoint_id = %(eid)s",
            {"eid": ep["endpoint_id"]},
        )
        ep["hazard_ratios"] = query(
            "SELECT hr_id, cohort_id, arm_comparison, hr_value_and_range, hr_ci, p_value "
            "FROM oncosuite_gold.hazard_ratio_info WHERE endpoint_id = %(eid)s",
            {"eid": ep["endpoint_id"]},
        )
    trial["endpoints"] = endpoints

    trial["contacts"] = query(
        "SELECT contact_id, name, role, email, phone, affiliation "
        "FROM oncosuite_gold.contacts_info WHERE oncosuite_id = %(id)s",
        {"id": oncosuite_id},
    )

    ranking_rows = query(
        "SELECT ranking_score, score_breakdown FROM oncosuite_gold.trial_ranking "
        "WHERE oncosuite_id = %(id)s",
        {"id": oncosuite_id},
    )
    trial["ranking"] = ranking_rows[0] if ranking_rows else None

    summary_rows = query(
        "SELECT summary_json FROM oncosuite_gold.summary WHERE oncosuite_id = %(id)s",
        {"id": oncosuite_id},
    )
    trial["summary"] = summary_rows[0]["summary_json"] if summary_rows else None

    return trial
