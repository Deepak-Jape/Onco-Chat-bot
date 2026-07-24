"""
Piece 1, Tool 2 — get_trial_detail
Real join chain confirmed against oncosuite_gold:
  trial_info --(oncosuite_id)--> cohort_info --(cohort_id)--> arms_info
    --(arm_id)--> stratification_info --(strata_id)--> treatment_info --(drug_id)--> drug_info

trial_architecture is just a design-type tag (e.g. ["Single Cohort"]), NOT a nesting
shortcut -- confirmed against real data, so this tool does the full join, as planned.
"""
from db import query

def get_trial_detail(oncosuite_id: str):
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
