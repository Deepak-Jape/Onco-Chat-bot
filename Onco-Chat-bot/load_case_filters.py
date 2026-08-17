"""
One-shot loader: bulk-loads merged_clean_global.csv (per-country lung-cancer case
counts broken down by organ/histology/biomarker/stage/line-of-therapy, with "All"
rollup rows at every level) into oncosuite_gold.case_filters, so the /cases filter
UI (tools/get_case_filters.py) can look up an exact case count for any filter
combination with a single indexed row lookup.

Run once:
    python load_case_filters.py
Safe to re-run: the table is truncated and reloaded each time. Uses db.py's DSN
resolution as-is and the CSV path from ONCOSUITE_CASE_FILTERS_CSV (default
./merged_clean_global.csv).

Annual_New_Cases has thousands-separator commas on at least one rollup row (e.g.
"2,380,189"), which COPY can't cast straight to bigint -- so this loader streams
the source CSV through Python (csv module) and re-writes a cleaned temp CSV before
COPYing it, rather than COPYing the source file directly.
"""
import csv
import os
import sys
import tempfile

from db import get_write_conn

CSV_PATH = os.environ.get("ONCOSUITE_CASE_FILTERS_CSV", "merged_clean_global.csv")
TABLE = "oncosuite_gold.case_filters"

DDL = f"""
DROP TABLE IF EXISTS {TABLE};
CREATE TABLE {TABLE} (
    id bigserial PRIMARY KEY,
    country text,
    population bigint,
    organ text,
    histology text,
    biomarkers text,
    biomarker_variant text,
    cancer_stage text,
    line_of_therapy text,
    histology_frac double precision,
    biomarker_frac double precision,
    stage_frac double precision,
    line_frac double precision,
    annual_new_cases bigint
);
CREATE INDEX IF NOT EXISTS case_filters_country_idx ON {TABLE} (country);
CREATE INDEX IF NOT EXISTS case_filters_lookup_idx ON {TABLE}
    (country, organ, histology, biomarkers, cancer_stage, line_of_therapy);
"""

COPY_SQL = f"""
COPY {TABLE}
    (country, population, organ, histology, biomarkers, biomarker_variant,
     cancer_stage, line_of_therapy, histology_frac, biomarker_frac, stage_frac,
     line_frac, annual_new_cases)
FROM STDIN WITH (FORMAT csv, HEADER true)
"""

_SRC_COLUMNS = [
    "Country", "Population", "Organ", "Histology", "Biomarkers",
    "Combined_Biomarker_Variant", "Cancer_Stage", "Line_Of_Therapy",
    "Histology_Frac_Of_Lung", "Biomarker_Prev_Including_Variant", "Stage_Frac",
    "Line_Frac", "Annual_New_Cases",
]


def _clean_rows(src_path, dst_file):
    """Stream the source CSV, stripping thousands-separator commas from
    Annual_New_Cases, and write the cleaned rows (source column order, no
    Population_In_Million -- it's just a display string derived from Population)
    to dst_file."""
    writer = csv.writer(dst_file)
    writer.writerow(_SRC_COLUMNS)
    with open(src_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        n = 0
        for row in reader:
            row["Annual_New_Cases"] = row["Annual_New_Cases"].replace(",", "")
            writer.writerow(row[c] for c in _SRC_COLUMNS)
            n += 1
    return n


def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV not found at {CSV_PATH}. Set ONCOSUITE_CASE_FILTERS_CSV.")
        sys.exit(2)

    conn = get_write_conn()
    with conn.cursor() as cur:
        print(f"(Re)creating table {TABLE}...")
        cur.execute(DDL)

        print(f"Cleaning {CSV_PATH}...")
        with tempfile.NamedTemporaryFile(
            "w", newline="", encoding="utf-8", suffix=".csv", delete=False
        ) as tmp:
            tmp_path = tmp.name
            n_rows = _clean_rows(CSV_PATH, tmp)

        try:
            print(f"Copying {n_rows} rows into {TABLE}...")
            with open(tmp_path, "r", encoding="utf-8", newline="") as f:
                cur.copy_expert(COPY_SQL, f)
        finally:
            os.remove(tmp_path)

        cur.execute(f"SELECT count(*) FROM {TABLE}")
        n = cur.fetchone()[0]
    conn.close()
    print(f"DONE: {n} rows loaded into {TABLE}.")


if __name__ == "__main__":
    main()
