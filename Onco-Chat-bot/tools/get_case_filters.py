"""
Cases-per-filter lookup: oncosuite_gold.case_filters (loaded from
merged_clean_global.csv by load_case_filters.py) is a precomputed rollup tree --
every row is one (country, organ, histology, biomarkers, cancer_stage,
line_of_therapy) combination, with "All" rows at every level, down to
Annual_New_Cases for that exact combination. Because the tree is sparse (not
every histology/biomarker/stage/line combination co-occurs -- e.g. biomarkers
only break down NSCLC/SCLC, not "All" histology, or a Cancer_Stage that has an
1L line), we don't just SELECT on whatever the caller passes: get_filter_options
computes, for every column, only the values that actually co-occur with the
caller's OTHER current selections (a live faceted-search filter), so the /cases
UI can never let the user land on a combination with zero matching rows.

Also joins in "sites" for the selected country: cities from
oncosuite_gold.map_view_population (loaded from new_replace_map_view.csv),
ranked by case_ratio. The two tables aren't formally linked (no shared key,
different casing -- case_filters.country is lowercase, map_view_population.
country is title-case), so the join is a simple case-insensitive country match.
"""
from db import query

TABLE = "oncosuite_gold.case_filters"
SITES_TABLE = "oncosuite_gold.map_view_population"

FILTER_COLUMNS = ["country", "organ", "histology", "biomarkers", "cancer_stage",
                  "line_of_therapy"]

DEFAULT_SITE_LIMIT = 50


def get_filter_options(selected=None):
    """Faceted options for every filter column: for column X, the DISTINCT values
    of X that co-occur with whatever the caller already picked for the OTHER
    columns (columns not yet picked don't constrain anything). Returns
    {column: [values, ...]}, "All" first then alphabetical, so every dropdown
    only ever offers choices that lead to a real row."""
    selected = {k: v for k, v in (selected or {}).items()
                if v and k in FILTER_COLUMNS}
    options = {}
    for col in FILTER_COLUMNS:
        other = {k: v for k, v in selected.items() if k != col}
        where = " AND ".join(f"{k} = %({k})s" for k in other) or "TRUE"
        rows = query(
            f"SELECT DISTINCT {col} AS v FROM {TABLE} WHERE {where} AND {col} IS NOT NULL",
            other or None,
        )
        values = sorted((r["v"] for r in rows), key=lambda v: (v != "All", v))
        options[col] = values
    return options


def _normalized_filters(filters):
    return {col: (filters or {}).get(col) or "All" for col in FILTER_COLUMNS}


def get_case_row(filters):
    """Exact-match lookup for one filter combination. Returns the matching row
    (dict) or None if the combination doesn't exist in the data -- callers
    should be feeding values from get_filter_options, so None means the caller
    skipped that faceting step, not a data gap."""
    f = _normalized_filters(filters)
    rows = query(f"""
        SELECT country, population, organ, histology, biomarkers, biomarker_variant,
               cancer_stage, line_of_therapy, histology_frac, biomarker_frac,
               stage_frac, line_frac, annual_new_cases
        FROM {TABLE}
        WHERE country = %(country)s AND organ = %(organ)s AND histology = %(histology)s
          AND biomarkers = %(biomarkers)s AND cancer_stage = %(cancer_stage)s
          AND line_of_therapy = %(line_of_therapy)s
        LIMIT 1
    """, f)
    return rows[0] if rows else None


def get_sites_for_country(country, limit=DEFAULT_SITE_LIMIT):
    """Cities for the selected country, ranked by case_ratio. country="global" (or
    falsy) skips the country filter, so global gives a worldwide leaderboard."""
    params = {"limit": limit}
    where = "TRUE"
    if country and country.lower() != "global":
        where = "lower(country) = lower(%(country)s)"
        params["country"] = country
    return query(f"""
        SELECT id, country, city, admin_name, city_population, case_ratio,
               latitude, longitude, zipcode
        FROM {SITES_TABLE}
        WHERE {where}
        ORDER BY case_ratio DESC NULLS LAST
        LIMIT %(limit)s
    """, params)


def run(filters=None):
    """Full turn for the /cases filter UI. Returns:
      {"filters": {...normalized...}, "case": row|None, "sites": [...], "sites_count": n}
    Never raises on a missing combination -- "case": None just means that exact
    combination has no data (shouldn't happen if the UI only offers
    get_filter_options' values)."""
    f = _normalized_filters(filters)
    case_row = get_case_row(f)
    sites = get_sites_for_country(f["country"])
    return {
        "filters": f,
        "case": case_row,
        "sites": sites,
        "sites_count": len(sites),
    }
