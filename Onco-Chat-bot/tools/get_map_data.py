"""
Map-data tool: turns a natural-language question about the map_view_population
data (case ratio, population, density by country/city) into a filtered SQL query
and returns the matching rows as plain structured points -- for a map to plot,
not a prose answer.

Mirrors text_to_sql.py's generate -> validate -> execute -> retry loop, but scoped
to ONE table with its own minimal schema prompt, so the model can't wander into
the trial schema or query the wrong table.
"""
import re

import llm_client
from db import query

_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|"
    r"comment|copy|call|do|merge|vacuum|analyze|reindex|refresh)\b",
    re.IGNORECASE,
)

TABLE = "oncosuite_gold.map_view_population"
MAX_SQL_ATTEMPTS = 3
ROW_LIMIT = 500  # generous for "all cities in a country", small enough to keep payloads sane

# Every column a point needs, regardless of which ones the LLM's SQL happened to
# SELECT for its filtering/ordering logic -- see the id-based refetch in run().
ALL_COLUMNS = ["id", "country", "country_population", "annual_cases", "city",
               "city_population", "zipcode", "latitude", "longitude", "case_ratio",
               "admin_name", "city_area_km2"]

_MAP_SCHEMA_PROMPT = f"""
DATABASE: PostgreSQL. ONE table only: {TABLE} -- one row per city.
All queries must be READ-ONLY (SELECT only), and must ONLY select from {TABLE}.

COLUMNS:
    id: primary key
    country: country name, e.g. 'Australia'
    country_population: total population of the country
    annual_cases: total annual new cancer cases for the whole country (same value repeats for every city row in that country)
    city: city name (can be blank for some rows -- see admin_name)
    city_population: population of this city
    zipcode: postal/zip code for this city row
    latitude, longitude: city coordinates
    case_ratio: estimated annual new cancer cases attributable to this city
    admin_name: administrative region/state/province name
    city_area_km2: city area in square kilometers

NOTES:
    - density = case_ratio / city_area_km2 -- if you need it, compute inline with
      NULLIF(city_area_km2, 0) to avoid divide-by-zero.
    - Many smaller cities have NULL case_ratio / city_population / city_area_km2. When
      ranking top/bottom cities by any of these, add NULLS LAST (for DESC) so rows with
      no data don't dominate the ranking.
    - Always include the id column in the SELECT list, even if the question doesn't ask
      for it -- the caller uses it to fetch the full row for each matching city.
    - Do not use GROUP BY or aggregate functions (MAX/AVG/SUM/COUNT) that collapse
      multiple cities into one row -- each result row must stay one plottable city,
      unless the question is explicitly about a single aggregate number rather than
      a set of cities to plot.
"""

_SQL_SYSTEM = (
    "You translate a user's question about city/country cancer-case and population data "
    "into ONE PostgreSQL SELECT query, for the results to be plotted on a map. Output ONLY "
    "the SQL, no prose, no markdown fences. Prefer explicit column lists (always include "
    "id, latitude, longitude, city, country). If you truly cannot answer from this schema, "
    "output exactly: NO_QUERY\n\n" + _MAP_SCHEMA_PROMPT
)


def _extract_sql(text: str) -> str:
    t = text.strip()
    t = re.sub(r"^```(?:sql)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    return t


def _validate_sql(sql: str):
    s = sql.strip().rstrip(";").strip()
    if not s:
        return False, "empty"
    if s.upper() == "NO_QUERY":
        return False, "model declined (NO_QUERY)"
    if ";" in s:
        return False, "multiple statements not allowed"
    if not re.match(r"^\s*(select|with)\b", s, re.IGNORECASE):
        return False, "not a SELECT/WITH statement"
    if _FORBIDDEN.search(s):
        return False, "contains a forbidden (write) keyword"
    if "map_view_population" not in s.lower():
        return False, "must query map_view_population"
    return True, "ok"


def _enforce_limit(sql: str) -> str:
    s = sql.strip().rstrip(";")
    if re.search(r"\blimit\b", s, re.IGNORECASE):
        return s
    return f"{s}\nLIMIT {ROW_LIMIT}"


def _generate_sql(question, error_hint=None, prev_sql=None):
    messages = [{"role": "system", "content": _SQL_SYSTEM}, {"role": "user", "content": question}]
    if error_hint:
        messages.append({
            "role": "user",
            "content": (
                "Your previous SQL did not work. Fix it and output ONLY the corrected "
                f"SELECT.\nPrevious SQL:\n{prev_sql}\n\nProblem: {error_hint}\n"
                "If the question genuinely cannot be answered from this table, output NO_QUERY."
            ),
        })
    raw = llm_client.chat(messages)
    return _extract_sql(raw)


def _row_to_point(row):
    area = row.get("city_area_km2")
    case_ratio = row.get("case_ratio")
    density = (case_ratio / area) if (case_ratio is not None and area not in (None, 0)) else None
    name = row.get("city") or row.get("admin_name") or row.get("country")
    return {
        "id": f"{row.get('country')}-{name}-{row.get('id')}",
        "lat": row.get("latitude"),
        "lng": row.get("longitude"),
        "city": row.get("city") or row.get("admin_name"),
        "country": row.get("country"),
        "adminName": row.get("admin_name"),
        "zipcode": row.get("zipcode"),
        "population": row.get("city_population"),
        "countryPopulation": row.get("country_population"),
        "annualCases": row.get("annual_cases"),
        "caseRatio": case_ratio,
        "area": area,
        "density": density,
    }


def _fill_full_rows(rows):
    """The LLM's SQL only SELECTs the columns it needed for filtering/ordering, so
    a row missing (say) population/zipcode isn't necessarily NULL in the data --
    it just wasn't in that SELECT list. Refetch every matching row by id with the
    full column set, so every point always carries all fields regardless of what
    the generated SQL happened to select. Falls back to the original rows (best
    effort) if 'id' isn't present -- e.g. an aggregate query with no per-row id."""
    ids = [r["id"] for r in rows if r.get("id") is not None]
    if not ids:
        return rows
    cols = ", ".join(ALL_COLUMNS)
    full_rows = query(f"SELECT {cols} FROM {TABLE} WHERE id = ANY(%(ids)s)", {"ids": ids})
    by_id = {r["id"]: r for r in full_rows}
    return [by_id[r["id"]] if r.get("id") in by_id else r for r in rows]


def run(question: str) -> dict:
    """
    Full map-data turn. Returns:
      {"status": "answered"|"declined"|"no_data"|"unavailable"|"invalid_sql",
       "sql": str|None, "points": list, "count": int, "reason": str|None}
    Never raises -- caller decides how to handle a non-"answered" status.
    """
    error_hint = None
    prev_sql = None
    last = {"status": "invalid_sql", "sql": None, "points": [], "count": 0,
            "reason": "no attempt made"}

    for _ in range(MAX_SQL_ATTEMPTS):
        try:
            sql = _generate_sql(question, error_hint=error_hint, prev_sql=prev_sql)
        except llm_client.LLMUnavailable as e:
            return {"status": "unavailable", "sql": None, "points": [], "count": 0, "reason": str(e)}

        ok, reason = _validate_sql(sql)
        if not ok:
            if "NO_QUERY" in reason:
                return {"status": "declined", "sql": sql, "points": [], "count": 0, "reason": reason}
            last = {"status": "invalid_sql", "sql": sql, "points": [], "count": 0, "reason": reason}
            error_hint, prev_sql = f"the SQL failed validation: {reason}", sql
            continue

        safe_sql = _enforce_limit(sql)
        try:
            rows = query(safe_sql)
        except Exception as e:  # noqa: BLE001  -- bad SQL from the model, don't crash
            last = {"status": "invalid_sql", "sql": safe_sql, "points": [], "count": 0,
                    "reason": f"execution error: {e}"}
            error_hint, prev_sql = f"executing it raised: {e}", safe_sql
            continue

        if not rows:
            last = {"status": "no_data", "sql": safe_sql, "points": [], "count": 0,
                    "reason": "query ran but returned no rows"}
            error_hint, prev_sql = ("the query returned 0 rows; if the question should have "
                                    "data, relax overly strict filters"), safe_sql
            continue

        full_rows = _fill_full_rows(rows)
        points = [_row_to_point(r) for r in full_rows]
        return {"status": "answered", "sql": safe_sql, "points": points, "count": len(points),
                "reason": None}

    return last
