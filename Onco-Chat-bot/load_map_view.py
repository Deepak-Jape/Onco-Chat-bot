"""
One-shot loader: bulk-loads new_replace_map_view.csv (country/city population +
cancer case-ratio, one row per city) into oncosuite_gold.map_view_population, so
text-to-SQL can answer exact city-wise/country-wise questions (case ratio, density,
population, rankings) directly with SQL. This is plain structured numeric/geo data,
not free text, so SQL is the right tool -- not the embedding/vector-search fallback
(see vector_store.py's module docstring: SQL is primary, embeddings only cover
free-text fields SQL can't express).

Run once:
    python load_map_view.py
Safe to re-run: the table is truncated and reloaded each time. Uses db.py's DSN
resolution as-is (ONCOSUITE_DSN env var if set, else db.py's own default) and the
CSV path from ONCOSUITE_MAP_VIEW_CSV (default ./new_replace_map_view.csv).
"""
import os
import sys

from db import get_write_conn

CSV_PATH = os.environ.get("ONCOSUITE_MAP_VIEW_CSV", "new_replace_map_view.csv")
TABLE = "oncosuite_gold.map_view_population"

DDL = f"""
DROP TABLE IF EXISTS {TABLE};
CREATE TABLE {TABLE} (
    id bigserial PRIMARY KEY,
    country text,
    country_population bigint,
    annual_cases bigint,
    city text,
    city_population double precision,
    zipcode text,
    latitude double precision,
    longitude double precision,
    case_ratio double precision,
    admin_name text,
    city_area_km2 double precision
);
CREATE INDEX IF NOT EXISTS map_view_population_country_idx ON {TABLE} (country);
CREATE INDEX IF NOT EXISTS map_view_population_city_idx ON {TABLE} (city);
"""

COPY_SQL = f"""
COPY {TABLE}
    (country, country_population, annual_cases, city, city_population, zipcode,
     latitude, longitude, case_ratio, admin_name, city_area_km2)
FROM STDIN WITH (FORMAT csv, HEADER true)
"""


def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV not found at {CSV_PATH}. Set ONCOSUITE_MAP_VIEW_CSV.")
        sys.exit(2)

    conn = get_write_conn()
    with conn.cursor() as cur:
        print(f"(Re)creating table {TABLE}...")
        cur.execute(DDL)

        print(f"Copying {CSV_PATH} into {TABLE}...")
        with open(CSV_PATH, "r", encoding="utf-8-sig", newline="") as f:
            cur.copy_expert(COPY_SQL, f)

        cur.execute(f"SELECT count(*) FROM {TABLE}")
        n = cur.fetchone()[0]
    conn.close()
    print(f"DONE: {n} rows loaded into {TABLE}.")


if __name__ == "__main__":
    main()
