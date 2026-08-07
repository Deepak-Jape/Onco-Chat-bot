"""
Schema metadata / data dictionary for the oncosuite_gold database.

This is the single source of truth about the DB *for the LLM*. The text-to-SQL
layer feeds SCHEMA_PROMPT to the model so it can write correct SQL; the vector
layer reads FREE_TEXT_FIELDS to know what to embed. Keep this in sync with the
actual schema (all names/join keys verified against information_schema).

Nothing here touches the DB at import time -- it's pure description.
"""

# ---------------------------------------------------------------------------
# Join graph -- how the tables connect. (child.key -> parent.key)
# ---------------------------------------------------------------------------
JOINS = [
    "cohort_info.oncosuite_id           -> trial_info.oncosuite_id",
    "arms_info.cohort_id                -> cohort_info.cohort_id",
    "stratification_info.arm_id         -> arms_info.arm_id",
    "treatment_info.strata_id           -> stratification_info.strata_id",
    "treatment_info.drug_id             -> drug_info.drug_id",
    "study_endpoints_info.oncosuite_id  -> trial_info.oncosuite_id",
    "results_outcomes_basic_info.endpoint_id -> study_endpoints_info.endpoint_id",
    "results_outcomes_basic_info.arm_id -> arms_info.arm_id",
    "hazard_ratio_info.endpoint_id      -> study_endpoints_info.endpoint_id",
    "hazard_ratio_info.cohort_id        -> cohort_info.cohort_id",
    "adverse_events.arm_id              -> arms_info.arm_id",
    "safety.arm_id                      -> arms_info.arm_id",
    "population_characteristics.arm_id  -> arms_info.arm_id",
    "facility_info.oncosuite_id         -> trial_info.oncosuite_id",
    "contacts_info.oncosuite_id         -> trial_info.oncosuite_id",
    "trial_ranking.oncosuite_id         -> trial_info.oncosuite_id",
    "summary.oncosuite_id               -> trial_info.oncosuite_id",
    "source_mapping.oncosuite_id        -> trial_info.oncosuite_id  (NCT id lives here: source_name='clinicaltrials.gov', source_unique_id=NCT number)",
]

# ---------------------------------------------------------------------------
# Per-table column dictionary. Each table: purpose + {column: description}.
# Only user-relevant columns are described (internal/audit columns omitted for
# clarity but still exist). "jsonb array of controlled-vocab strings" columns
# in cohort_info hold lists like ["NSCLC"], query with jsonb operators.
# ---------------------------------------------------------------------------
TABLES = {
    "trial_info": {
        "purpose": "One row per clinical trial. Top-level facts.",
        "pk": "oncosuite_id",
        "columns": {
            "oncosuite_id": "internal trial id (string). Primary key. NCT id is in source_mapping.",
            "official_title": "full trial title",
            "study_status": "e.g. Recruiting, Active - Not Recruiting, Completed",
            "trial_phase": "e.g. Phase 1, Phase 2, Phase 3",
            "enrollment_count": "number of patients enrolled",
            "planned_enrollment_count": "planned enrollment",
            "start_date": "trial start date",
            "primary_completion_date": "primary completion date",
            "completion_date": "overall completion date",
            "sponsor_name": "sponsor organization",
            "lead_organization": "lead org",
            "study_design": "e.g. Randomized",
            "study_type": "e.g. INTERVENTIONAL",
            "sites_count": "number of sites",
            "country_count": "number of countries",
            "has_results": "boolean, whether results are posted",
        },
    },
    "cohort_info": {
        "purpose": "Patient cohorts within a trial, incl. eligibility criteria and controlled-vocab clinical attributes.",
        "pk": "cohort_id",
        "columns": {
            "cohort_id": "primary key",
            "oncosuite_id": "FK to trial_info",
            "cohort_name": "cohort label",
            "sex": "All / Male / Female",
            "min_age": "min age (numeric)",
            "max_age": "max age (numeric)",
            "biomarkers": "jsonb array, e.g. [\"KRAS\",\"PD-L1\"]",
            "organ": "jsonb array, e.g. [\"Lung\"]",
            "histology": "jsonb array, e.g. [\"NSCLC\"]",
            "cancer_stage": "jsonb array",
            "line_of_therapy": "jsonb array, e.g. [\"Maintenance\"]",
            "prior_therapy": "jsonb array",
            "comorbidities": "jsonb array",
            "performance_status": "jsonb",
            "eligibility_inclusion_criteria": "jsonb object of inclusion criteria (FREE TEXT inside)",
            "eligibility_exclusion_criteria": "jsonb object of exclusion criteria (FREE TEXT inside)",
        },
    },
    "arms_info": {
        "purpose": "Treatment arms within a cohort.",
        "pk": "arm_id",
        "columns": {
            "arm_id": "primary key", "cohort_id": "FK to cohort_info",
            "arm_name": "arm label", "arm_description": "free-text description of the arm",
            "arm_type": "e.g. Experimental, Control", "arm_status": "status",
        },
    },
    "stratification_info": {
        "purpose": "Links arms to their treatment regimens (join bridge to treatment_info).",
        "pk": "strata_id",
        "columns": {
            "strata_id": "primary key", "arm_id": "FK to arms_info",
            "drug_combination": "combination label", "comb_modality": "e.g. Immunotherapy (IO)",
            "regimen_complexity": "numeric complexity",
        },
    },
    "treatment_info": {
        "purpose": "Individual drug treatments in a regimen.",
        "pk": "treatment_id",
        "columns": {
            "treatment_id": "primary key", "strata_id": "FK to stratification_info",
            "drug_id": "FK to drug_info", "drug_name": "drug name",
            "dosage_value": "dose (numeric)", "dosage_unit": "unit e.g. mg",
            "schedule": "e.g. every 4 weeks", "duration": "treatment duration text",
        },
    },
    "drug_info": {
        "purpose": "Drug reference: mechanism, target, class.",
        "pk": "drug_id",
        "columns": {
            "drug_id": "primary key", "name": "drug name", "brand_name": "brand",
            "modality": "e.g. Monoclonal Antibody", "target": "e.g. PD-L1",
            "moa_category": "e.g. Inhibitor", "mechanism_of_action": "free-text MOA",
            "class": "drug class",
        },
    },
    "study_endpoints_info": {
        "purpose": "Trial endpoints (ORR, PFS, OS, etc). Endpoints are TRIAL-level (no arm_id here).",
        "pk": "endpoint_id",
        "columns": {
            "endpoint_id": "primary key", "oncosuite_id": "FK to trial_info",
            "endpoint_name": "full endpoint name", "endpoint_type": "Primary/Secondary",
            "endpoint_category": "broad bucket e.g. Efficacy-based, Survival-based",
            "endpoint_abbreviation": "ABBREVIATION like ORR, PFS, OS (use THIS to filter by metric)",
            "measurement_and_criteria": "free-text measurement description",
            "timing_and_evaluator": "free-text timing",
        },
    },
    "results_outcomes_basic_info": {
        "purpose": "Numeric outcome values per endpoint per arm. NOTE: sparse -- many trials have no rows.",
        "pk": "id",
        "columns": {
            "id": "primary key", "endpoint_id": "FK to study_endpoints_info",
            "arm_id": "FK to arms_info", "value": "parsed numeric value (best-effort, no unit)",
            "value_and_evaluator": "free-text original value + evaluator",
        },
    },
    "hazard_ratio_info": {
        "purpose": "Hazard ratios for endpoint/arm comparisons.",
        "pk": "hr_id",
        "columns": {
            "hr_id": "primary key", "endpoint_id": "FK to study_endpoints_info",
            "cohort_id": "FK to cohort_info", "arm_comparison": "which arms compared",
            "hr_value_and_range": "HR value + range text", "hr_ci": "confidence interval",
            "p_value": "p-value",
        },
    },
    "adverse_events": {
        "purpose": "Adverse events per arm.",
        "pk": "ae_id",
        "columns": {
            "ae_id": "primary key", "arm_id": "FK to arms_info",
            "name_and_organ": "event name / organ system", "all_grades": "count all grades",
            "grade_3_4": "count grade 3-4 (severe)",
        },
    },
    "safety": {
        "purpose": "Safety summary rows per arm.",
        "pk": "safety_id",
        "columns": {
            "safety_id": "primary key", "arm_id": "FK to arms_info",
            "safety_title": "category", "safety_name": "metric name", "value": "value text",
        },
    },
    "population_characteristics": {
        "purpose": "Baseline patient population characteristics per arm.",
        "pk": "id",
        "columns": {
            "id": "primary key", "arm_id": "FK to arms_info",
            "characteristics": "characteristic name", "evaluator": "evaluator",
            "value": "value text",
        },
    },
    "facility_info": {
        "purpose": "Trial sites / locations.",
        "pk": "facility_id",
        "columns": {
            "facility_id": "primary key", "oncosuite_id": "FK to trial_info",
            "name": "facility name", "city": "city", "state": "state", "country": "country",
        },
    },
    "contacts_info": {
        "purpose": "Trial contacts.",
        "pk": "contact_id",
        "columns": {
            "contact_id": "primary key", "oncosuite_id": "FK to trial_info",
            "name": "contact name", "role": "role", "email": "email", "phone": "phone",
            "affiliation": "affiliation",
        },
    },
    "trial_ranking": {
        "purpose": "Model-assigned ranking score per trial.",
        "pk": "oncosuite_id",
        "columns": {
            "oncosuite_id": "FK to trial_info", "ranking_score": "numeric score",
            "score_breakdown": "jsonb breakdown",
        },
    },
    "summary": {
        "purpose": "Generated trial summary (jsonb).",
        "pk": "oncosuite_id",
        "columns": {
            "oncosuite_id": "FK to trial_info", "summary_json": "jsonb summary (FREE TEXT inside)",
        },
    },
    "source_mapping": {
        "purpose": "Maps internal oncosuite_id to external source ids. THIS is where the NCT id lives.",
        "pk": "id",
        "columns": {
            "oncosuite_id": "FK to trial_info",
            "source_name": "e.g. 'clinicaltrials.gov'",
            "source_unique_id": "the external id, e.g. NCT06881784",
            "source_link": "URL to the source",
        },
    },
    "map_view_population": {
        "purpose": ("Reference geo/population data: one row per city, giving that city's "
                    "population, area, coordinates, and cancer case burden, plus its "
                    "country's total population and annual case count. NOT trial data -- "
                    "do not join this with trial_info/cohort_info/etc; it answers "
                    "population/case-burden questions by country or city, e.g. "
                    "'case ratio in Melbourne', 'top cities in Germany by case ratio', "
                    "'population of Sydney', 'new cancer cases in Germany', 'cancer case "
                    "density by city'. Many smaller cities have NULL case_ratio/"
                    "city_population/city_area_km2 -- when ranking top/bottom cities by any "
                    "of these, add NULLS LAST (DESC) or filter out NULLs, otherwise rows "
                    "with no data will dominate the ranking."),
        "pk": "id",
        "columns": {
            "id": "primary key",
            "country": "country name -- do NOT default to any particular "
                       "country when none is named in the question; query "
                       "unfiltered across all countries instead",
            "country_population": "total population of the country",
            "annual_cases": "total annual new cancer cases for the whole country (same value repeats for every city row in that country)",
            "city": "city name",
            "city_population": "population of this city",
            "zipcode": "postal/zip code for this city row (cities can have multiple zipcode rows)",
            "latitude": "city latitude",
            "longitude": "city longitude",
            "case_ratio": "estimated annual new cancer cases attributable to this city (city-level case count, not a percentage)",
            "admin_name": "administrative region/state/province name for the city",
            "city_area_km2": "city area in square kilometers; density = case_ratio / city_area_km2",
        },
    },
    "vocab_terms": {
        "purpose": "Controlled vocabulary: canonical values + aliases per field (used for term normalization).",
        "pk": "id",
        "columns": {
            "field_name": "which field this term belongs to", "canonical_value": "canonical value",
            "aliases": "text[] of aliases", "source_count": "how many records use it",
        },
    },
}

# Internal / lineage tables: exist but NOT for user-facing questions.
INTERNAL_TABLES = ["data_traceability", "sites_info"]

# ---------------------------------------------------------------------------
# Free-text fields worth embedding for semantic search (the vector fallback).
# These are prose / jsonb-with-prose columns where a keyword/SQL match won't
# find things by *meaning*. (table, column)
# ---------------------------------------------------------------------------
FREE_TEXT_FIELDS = [
    ("trial_info", "official_title"),
    ("arms_info", "arm_description"),
    ("cohort_info", "eligibility_inclusion_criteria"),
    ("cohort_info", "eligibility_exclusion_criteria"),
    ("drug_info", "mechanism_of_action"),
    ("study_endpoints_info", "measurement_and_criteria"),
    ("summary", "summary_json"),
]

# A few enum-ish columns with their common values, to help the LLM filter correctly.
ENUM_HINTS = {
    "trial_info.study_status": ["Recruiting", "Active - Not Recruiting", "Completed", "Terminated"],
    "trial_info.trial_phase": ["Phase 1", "Phase 2", "Phase 3", "Phase 4"],
    "arms_info.arm_type": ["Experimental", "Control"],
    "study_endpoints_info.endpoint_type": ["Primary", "Secondary"],
    "cohort_info.sex": ["All", "Male", "Female"],
}


def build_schema_prompt() -> str:
    """Render the whole dictionary as a compact text block for the LLM's system prompt."""
    lines = [
        "DATABASE: PostgreSQL, schema `oncosuite_gold` (ALWAYS schema-qualify tables, e.g. oncosuite_gold.trial_info).",
        "All queries must be READ-ONLY (SELECT only).",
        "",
        "TABLES:",
    ]
    for name, meta in TABLES.items():
        lines.append(f"\n- oncosuite_gold.{name} -- {meta['purpose']} (pk: {meta['pk']})")
        for col, desc in meta["columns"].items():
            lines.append(f"    {col}: {desc}")
    lines.append("\nJOINS (child -> parent):")
    for j in JOINS:
        lines.append(f"    {j}")
    lines.append("\nENUM VALUE HINTS:")
    for col, vals in ENUM_HINTS.items():
        lines.append(f"    {col} in {vals}")
    lines.append(
        "\nIMPORTANT NOTES:\n"
        "    - The NCT id (e.g. NCT06881784) is NOT in trial_info. Join source_mapping "
        "(source_name='clinicaltrials.gov', source_unique_id=<NCT>) to get oncosuite_id.\n"
        "    - cohort_info clinical attribute columns (biomarkers, organ, histology, ...) are jsonb ARRAYS; "
        "query with jsonb operators, e.g. cohort_info.biomarkers @> '[\"KRAS\"]'.\n"
        "    - Endpoints are trial-level; per-arm numeric outcomes live in results_outcomes_basic_info (sparse).\n"
        "    - Never SELECT from data_traceability or sites_info for user questions (internal)."
    )
    return "\n".join(lines)


if __name__ == "__main__":
    print(build_schema_prompt())
