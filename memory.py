"""
Piece 6 -- session / context memory for follow-ups.

Backed by oncosuite_gold.chat_working_set (Postgres) rather than a
process-local dict, so a follow-up ("compare arm A vs B") still resolves
correctly after a server restart/redeploy, and works the same way if the app
ever runs more than one worker process. The public get/set/update_after_tool_call
interface is unchanged, so call sites don't need to know the store moved.

TTL is enforced in the SELECT's WHERE clause -- a row older than ttl_seconds is
simply not returned, matching the old in-memory "expire on read" behavior
without needing a background sweep.
"""
import threading

from psycopg2.extras import Json

from db import execute, query

TABLE = "oncosuite_gold.chat_working_set"
DEFAULT_TTL_SECONDS = 45 * 60  # 45 min, per the docs' 30-60 min product-decision default
# How many of the last search's trials to remember. This is what a follow-up
# like "from the above, the one starting wd7" resolves against, so it has to
# cover what the user was actually SHOWN -- at 10 a 25-row result set left most
# of the visible rows unresolvable, and the follow-up silently re-searched the
# whole database instead.
MAX_HISTORY = 20000

_ensure_lock = threading.Lock()
_ensured = False


def _ensure_table():
    global _ensured
    if _ensured:
        return
    with _ensure_lock:
        if _ensured:
            return
        execute(
            f"CREATE TABLE IF NOT EXISTS {TABLE} ("
            "  session_id text PRIMARY KEY,"
            "  working_set jsonb NOT NULL,"
            "  updated_at timestamptz NOT NULL DEFAULT now()"
            ")"
        )
        _ensured = True


class SessionStore:
    def __init__(self, ttl_seconds=DEFAULT_TTL_SECONDS):
        self.ttl_seconds = ttl_seconds

    def _default_working_set(self, session_id):
        return {
            "session_id": session_id,
            "active_trial_id": None,
            "last_trials": [],
            "last_arms": [],
            "last_filters": {},
        }

    def get(self, session_id):
        _ensure_table()
        rows = query(
            f"SELECT working_set FROM {TABLE} WHERE session_id = %(sid)s "
            f"AND updated_at > now() - make_interval(secs => %(ttl)s)",
            {"sid": session_id, "ttl": self.ttl_seconds},
        )
        if not rows:
            return self._default_working_set(session_id)
        return rows[0]["working_set"]

    def set(self, session_id, working_set):
        _ensure_table()
        execute(
            f"INSERT INTO {TABLE} (session_id, working_set, updated_at) "
            f"VALUES (%(sid)s, %(ws)s, now()) "
            f"ON CONFLICT (session_id) DO UPDATE "
            f"SET working_set = excluded.working_set, updated_at = excluded.updated_at",
            {"sid": session_id, "ws": Json(working_set)},
        )

    def update_after_tool_call(self, session_id, tool_name, tool_result):
        ws = self.get(session_id)

        if tool_name in ("search_trials", "get_competitive_landscape"):
            results = tool_result.get("results", [])
            ws["last_trials"] = [
                {"oncosuite_id": r["oncosuite_id"], "nct_id": r.get("nct_id"), "title": r.get("title")}
                for r in results[:MAX_HISTORY]
            ]
            ws["last_filters"] = tool_result.get("filters_applied", ws.get("last_filters", {}))
            ws["active_trial_id"] = results[0]["oncosuite_id"] if len(results) == 1 else None

        elif tool_name in ("get_trial_detail", "compare_arms", "get_endpoints_and_outcomes",
                           "get_adverse_events", "get_hazard_ratios"):
            oncosuite_id = tool_result.get("oncosuite_id")
            if oncosuite_id:
                ws["active_trial_id"] = oncosuite_id
                arms = tool_result.get("arms")  # compare_arms: top-level
                if arms is None and "cohorts" in tool_result:
                    # FIX (found during Phase 1 testing): get_trial_detail nests arms
                    # under cohorts[].arms, not top-level -- flatten before storing.
                    arms = [a for c in tool_result["cohorts"] for a in c.get("arms", [])]
                if arms:
                    ws["last_arms"] = [
                        {"arm_id": a["arm_id"], "arm_name": a.get("arm_name"), "oncosuite_id": oncosuite_id}
                        for a in arms[:MAX_HISTORY]
                    ]

        self.set(session_id, ws)
        return ws
