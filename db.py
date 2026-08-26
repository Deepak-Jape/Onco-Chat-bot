"""
Shared DB connection helper for the tool layer.
Points at the restored oncosuite_gold DB.

Connection string comes from the ONCOSUITE_DSN environment variable in production
(so no credentials are committed). Falls back to the local dev DSN if unset.

PERFORMANCE: we keep ONE persistent connection per thread and reuse it, instead
of opening a fresh connection on every query. Over a REMOTE database (prod DB on
another host) a new connect() costs ~1-3s (TCP + auth + TLS + a search_path
round-trip), so the old "connect per query" made a single search take 8-16s
even though the SQL itself runs in ~10ms. Reusing the connection drops that to
sub-second. Connections are per-thread because the web server is threaded and a
psycopg2 connection is not safe to share across threads.
"""
import os
import threading

import psycopg2
import psycopg2.extras

DSN = os.environ.get(
    "ONCOSUITE_DSN",
    "host=204.168.157.213 port=5432 dbname=chatbot user=postgres password=Somya",
)

# One connection per thread (psycopg2 connections aren't thread-safe to share).
_local = threading.local()

# Separate thread-local, WRITABLE connection for frequent, latency-sensitive
# writes (conversation turns, session working-set) -- reused per thread like
# get_conn() below, so a chat message doesn't pay a fresh TCP+auth round-trip
# (~1-3s over a remote DB) on every turn the way get_write_conn() would. Kept
# apart from _local's readonly connection so a write session is never mixed
# into the hot read path.
_local_write = threading.local()


def _new_conn():
    conn = psycopg2.connect(DSN)
    conn.set_session(readonly=True, autocommit=True)
    with conn.cursor() as cur:
        cur.execute("SET search_path TO oncosuite_gold, public")
    return conn


def get_conn():
    """Return this thread's persistent connection, (re)creating it if missing or
    dead. Callers that need a writable/one-off session can still call _new_conn()
    semantics via conn.set_session(...), but should NOT close the shared conn."""
    conn = getattr(_local, "conn", None)
    if conn is not None and conn.closed == 0:
        return conn
    conn = _new_conn()
    _local.conn = conn
    return conn


def get_session_write_conn():
    """This thread's persistent writable connection, (re)creating it if missing
    or dead. Use for small, frequent writes (chat history, working-set state);
    for one-off/batch writes use get_write_conn() instead."""
    conn = getattr(_local_write, "conn", None)
    if conn is not None and conn.closed == 0:
        return conn
    conn = psycopg2.connect(DSN)
    conn.set_session(readonly=False, autocommit=True)
    with conn.cursor() as cur:
        cur.execute("SET search_path TO oncosuite_gold, public")
    _local_write.conn = conn
    return conn


def execute(sql, params=None):
    """Run a write statement on the shared per-thread write connection,
    reconnecting once if it has gone stale."""
    for attempt in (1, 2):
        conn = get_session_write_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params if params else None)
            return
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            conn2 = getattr(_local_write, "conn", None)
            if conn2 is not None:
                try:
                    conn2.close()
                except Exception:
                    pass
            _local_write.conn = None
            if attempt == 2:
                raise


def get_write_conn():
    """A SEPARATE, fresh connection for write/batch work (index builds, vocab).
    Kept apart from the shared readonly request connection so those callers never
    flip the hot read connection into a writable session. Caller may close it."""
    conn = psycopg2.connect(DSN)
    conn.set_session(readonly=False, autocommit=True)
    with conn.cursor() as cur:
        cur.execute("SET search_path TO oncosuite_gold, public")
    return conn


def _reset_conn():
    """Drop the cached connection so the next get_conn() reconnects. Used when a
    connection goes bad mid-flight (server restart, network blip, timeout)."""
    conn = getattr(_local, "conn", None)
    if conn is not None:
        try:
            conn.close()
        except Exception:
            pass
    _local.conn = None


def query(sql, params=None):
    """Run a read query on the shared connection, reconnecting once if the
    connection has gone stale (e.g. the DB restarted since the last call)."""
    for attempt in (1, 2):
        conn = get_conn()
        try:
            # Reused readonly/autocommit connections can be left in a failed
            # transaction state by a prior error; roll back defensively (cheap,
            # no round-trip when the connection is clean under autocommit).
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Pass None (not {}) when there are no params: psycopg2 raises
                # "dict is not a sequence" if given an empty dict for SQL that has
                # no %(name)s placeholders -- exactly the case for LLM-written
                # text-to-SQL queries (they inline their own literals, no params).
                cur.execute(sql, params if params else None)
                return cur.fetchall()
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Connection died (server restart / network). Reset and retry once.
            _reset_conn()
            if attempt == 2:
                raise


def resolve_nct_ids(oncosuite_ids):
    """oncosuite_id -> NCT id, for whichever ids came back from a trial/cohort
    search. Shared by search_trials.py and search_cohorts.py so both do the
    same clinicaltrials.gov lookup against source_mapping."""
    if not oncosuite_ids:
        return {}
    rows = query(
        "SELECT oncosuite_id, source_unique_id FROM oncosuite_gold.source_mapping "
        "WHERE oncosuite_id = ANY(%(ids)s) AND source_name = 'clinicaltrials.gov'",
        {"ids": list(oncosuite_ids)},
    )
    return {r["oncosuite_id"]: r["source_unique_id"] for r in rows}

