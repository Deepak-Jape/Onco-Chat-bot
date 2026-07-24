"""
Populate vocab_terms by scanning real distinct values out of cohort_info's
controlled-vocabulary jsonb columns. Run this once, then re-run whenever
the bronze->gold load refreshes (per the design docs' nightly-refresh assumption).
"""
from db import get_conn

VOCAB_FIELDS = [
    "biomarkers", "biomarker_variant", "organ", "histology", "sub_histology",
    "histology_variant", "cancer_stage", "line_of_therapy", "physical_state",
    "comorbidities", "prior_therapy", "performance_status",
]

def ensure_table(cur):
    """Create vocab_terms if missing (the INSERT below assumes it exists, incl. the
    (field_name, canonical_value) unique key used by ON CONFLICT). Safe to re-run."""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS oncosuite_gold.vocab_terms (
            id bigserial PRIMARY KEY,
            field_name text NOT NULL,
            canonical_value text NOT NULL,
            aliases text[] NOT NULL DEFAULT '{}',
            source_count integer NOT NULL DEFAULT 0,
            UNIQUE (field_name, canonical_value)
        )
    """)


def build():
    conn = get_conn()
    conn.set_session(readonly=False, autocommit=True)
    cur = conn.cursor()
    ensure_table(cur)
    total = 0
    for field in VOCAB_FIELDS:
        cur.execute(f"""
            INSERT INTO oncosuite_gold.vocab_terms (field_name, canonical_value, source_count)
            SELECT %s, v, count(*)
            FROM oncosuite_gold.cohort_info,
                 jsonb_array_elements_text(
                     CASE WHEN jsonb_typeof({field}) = 'array' THEN {field} ELSE '[]' END
                 ) v
            WHERE v IS NOT NULL AND v <> '' AND v <> 'Not Specified'
            GROUP BY v
            ON CONFLICT (field_name, canonical_value) DO UPDATE
                SET source_count = EXCLUDED.source_count
        """, (field,))
        total += cur.rowcount
        print(f"  {field}: {cur.rowcount} canonical values")
    print(f"Total vocab_terms rows upserted: {total}")

if __name__ == "__main__":
    build()
