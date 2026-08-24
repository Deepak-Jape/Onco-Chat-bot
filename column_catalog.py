"""Column catalogs for search_trials / search_cohorts dynamic column selection.

Each entry maps a column key -- what an intent classification's
`requested_columns` names, and what the render layer looks up for a display
label -- to where its value comes from. `default=True` marks the narrow set
already returned today; those are always included so a caller that never asks
for extra columns sees the identical row shape as before. Everything else is
opt-in extra detail, drawn only from fields confirmed to actually exist on
trial_info/cohort_info/drug_info (see tools/get_trial_detail.py, chart_data.py,
dashboard.py for the confirming SELECTs) -- never invented.
"""

# trial_info fields, keyed by the result-row key. `trial_col` is the raw
# trial_info column name for a plain SELECT (no extra join needed); `computed`
# marks a field derived in Python after the query (see search_trials.py).
TRIAL_COLUMNS = {
    "oncosuite_id":            {"label": "OncoSuite ID", "default": True},
    "nct_id":                  {"label": "NCT ID", "default": True},
    "title":                   {"label": "Trial Title", "default": True},
    "phase":                   {"label": "Phase", "default": True},
    "status":                  {"label": "Status", "default": True},
    "sponsor":                 {"label": "Sponsor", "default": True},
    "enrollment":              {"label": "Enrollment", "default": True},
    "start_date":              {"label": "Start Date", "default": True},
    "lead_organization":       {"label": "Lead Organization", "default": False, "trial_col": "lead_organization"},
    "study_design":            {"label": "Study Design", "default": False, "trial_col": "study_design"},
    "study_type":              {"label": "Study Type", "default": False, "trial_col": "study_type"},
    "blinding_info":           {"label": "Blinding", "default": False, "trial_col": "blinding_info"},
    "trial_architecture":      {"label": "Architecture", "default": False, "trial_col": "trial_architecture"},
    "primary_completion_date": {"label": "Primary Completion Date", "default": False, "trial_col": "primary_completion_date"},
    "planned_enrollment_count":{"label": "Planned Enrollment", "default": False, "trial_col": "planned_enrollment_count"},
    "sponsor_type":            {"label": "Sponsor Type", "default": False, "computed": True},
}

# cohort_info fields for search_cohorts. `cohort_col` is a plain cohort_info
# column; `drug_col` is aggregated the same way `regimen` already is (distinct
# values across the cohort's arms, joined via arms_info/stratification_info/
# treatment_info/drug_info).
COHORT_COLUMNS = {
    "oncosuite_id":      {"label": "OncoSuite ID", "default": True},
    "indication":        {"label": "Indication", "default": True},
    "regimen":           {"label": "Regimen", "default": True},
    "phase":             {"label": "Phase", "default": True},
    "status":            {"label": "Status", "default": True},
    "organ":             {"label": "Organ", "default": False, "cohort_col": "organ", "is_list": True},
    "cancer_stage":      {"label": "Cancer Stage", "default": False, "cohort_col": "cancer_stage", "is_list": True},
    "prior_therapy":     {"label": "Prior Therapy", "default": False, "cohort_col": "prior_therapy", "is_list": True},
    "sub_histology":     {"label": "Sub-Histology", "default": False, "cohort_col": "sub_histology", "is_list": True},
    "biomarker_variant": {"label": "Biomarker Variant", "default": False, "cohort_col": "biomarker_variant", "is_list": True},
    "sex":               {"label": "Sex", "default": False, "cohort_col": "sex"},
    "min_age":           {"label": "Min Age", "default": False, "cohort_col": "min_age"},
    "max_age":           {"label": "Max Age", "default": False, "cohort_col": "max_age"},
    "cohort_name":       {"label": "Cohort Name", "default": False, "cohort_col": "cohort_name"},
    "target":            {"label": "Target", "default": False, "drug_col": "target"},
    "modality":          {"label": "Modality", "default": False, "drug_col": "modality"},
    "moa_category":      {"label": "MOA Category", "default": False, "drug_col": "moa_category"},
    "drug_class":        {"label": "Drug Class", "default": False, "drug_col": "class"},
    "backbone":          {"label": "Backbone", "default": False, "drug_col": "backbone"},
}


def default_keys(catalog):
    return [k for k, v in catalog.items() if v.get("default")]


def validate_keys(catalog, keys):
    """Filter a caller-supplied key list down to known catalog keys, preserving
    order and de-duping. Callers (an LLM classification, keyword extraction)
    must never have their output trusted directly as a column name."""
    if not keys:
        return []
    seen, out = set(), []
    for k in keys:
        if k in catalog and k not in seen:
            seen.add(k)
            out.append(k)
    return out


def resolve_keys(catalog, requested_extra):
    """Default columns, plus any validated extra keys not already in the
    defaults -- additive, so asking for more detail never drops the baseline
    columns every existing caller relies on."""
    base = default_keys(catalog)
    extra = [k for k in validate_keys(catalog, requested_extra) if k not in base]
    return base + extra


def extra_keys_with(catalog, active_keys, field_name):
    """Active (non-default) keys whose catalog entry carries `field_name`
    (e.g. "cohort_col", "drug_col", "trial_col") -- the opt-in extra columns
    a caller must add a SELECT/join for, grouped by which kind of column
    they come from."""
    return [
        k for k in active_keys
        if not catalog[k]["default"] and field_name in catalog[k]
    ]


def label_for(catalog, key):
    """Display label for a column key. Falls back to a titleized version of the
    key itself for fields the caller adds outside the catalog (e.g. search_trials'
    conditional "reported_outcomes" column), so an unrecognized key still renders
    a readable header instead of raising."""
    meta = catalog.get(key)
    return meta["label"] if meta else key.replace("_", " ").title()


def labels_for(catalog, keys):
    return [{"key": k, "label": label_for(catalog, k)} for k in keys]


_TRIAL_MD_HEADER_OVERRIDES = {"oncosuite_id": "OncoSuite ID", "title": "Trial"}


def trial_markdown_table(results, active_keys, title_max=80):
    """Build the '| # | ... |' pipe-table markdown lines for a trial-listing
    result set, columns driven by whichever TRIAL_COLUMNS keys search_trials
    actually returned (falls back to the historical baseline set if
    active_keys is empty), collapsing oncosuite_id/nct_id into one identifier
    column (OncoSuite id shown, falling back to NCT id only when a trial has
    none). Shared by router._render_trial_page and
    synthesis._synthesize_search_results so the two deterministic markdown
    table builders can never drift out of sync with each other."""
    keys = active_keys or ["oncosuite_id", "title", "phase", "status", "sponsor", "enrollment"]
    display_keys = []
    seen_id = False
    for k in keys:
        if k in ("oncosuite_id", "nct_id"):
            if not seen_id:
                display_keys.append("oncosuite_id")
                seen_id = True
            continue
        display_keys.append(k)

    def header_for(k):
        return _TRIAL_MD_HEADER_OVERRIDES.get(k) or label_for(TRIAL_COLUMNS, k)

    def cell_for(r, k):
        if k == "oncosuite_id":
            v = r.get("oncosuite_id") or r.get("nct_id")
        elif k == "title":
            v = r.get("title")
            v = v[:title_max] if isinstance(v, str) else v
        else:
            v = r.get(k)
        return str(v) if v not in (None, "") else "—"

    headers = ["#"] + [header_for(k) for k in display_keys]
    lines = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for i, r in enumerate(results, start=1):
        cells = [str(i)] + [cell_for(r, k) for k in display_keys]
        lines.append("| " + " | ".join(cells) + " |")
    return lines


def detect_requested_columns(user_message, catalog):
    """Keyword fallback for when no LLM classifier is available: match each
    opt-in column's display label (or its key with underscores as spaces)
    against the user's phrasing, so "show me sponsor type and biomarkers too"
    surfaces those columns without a hardcoded per-field regex. Only ever
    returns real catalog keys -- an unrecognized phrase is simply not
    detected, never guessed at."""
    msg = (user_message or "").lower()
    hits = []
    for key, meta in catalog.items():
        if meta.get("default"):
            continue
        if meta["label"].lower() in msg or key.replace("_", " ") in msg:
            hits.append(key)
    return hits
