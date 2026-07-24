"""
Shared DB connection helper for the tool layer.
Points at the restored oncosuite_gold DB.

Connection string comes from the ONCOSUITE_DSN environment variable in production
(so no credentials are committed). Falls back to the local dev DSN if unset.
"""
import os
import psycopg2
import psycopg2.extras

DSN = os.environ.get(
    "ONCOSUITE_DSN",
    "host=127.0.0.1 dbname=oncosuite_new user=postgres password=Deepak@2309",
)

def get_conn():
    conn = psycopg2.connect(DSN)
    conn.set_session(readonly=True, autocommit=True)
    with conn.cursor() as cur:
        cur.execute("SET search_path TO oncosuite_gold, public")
    return conn

def query(sql, params=None):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Pass None (not {}) when there are no params: psycopg2 raises
            # "dict is not a sequence" if given an empty dict for SQL that has no
            # %(name)s placeholders -- which is exactly the case for LLM-written
            # text-to-SQL queries (they inline their own literals, no params).
            cur.execute(sql, params if params else None)
            return cur.fetchall()
