"""
Piece 6 -- session / context memory for follow-ups.
Implemented here as an in-process dict store with the exact same interface a
Redis-backed store would have (get/set with a TTL) -- swap SessionStore's
internals for real Redis calls in production without touching call sites.
"""
import time

DEFAULT_TTL_SECONDS = 45 * 60  # 45 min, per the docs' 30-60 min product-decision default
MAX_HISTORY = 10


class SessionStore:
    def __init__(self, ttl_seconds=DEFAULT_TTL_SECONDS):
        self._store = {}
        self.ttl_seconds = ttl_seconds

    def _default_working_set(self, session_id):
        return {
            "session_id": session_id,
            "active_trial_id": None,
            "last_trials": [],
            "last_arms": [],
            "last_filters": {},
            "updated_at": time.time(),
        }

    def get(self, session_id):
        entry = self._store.get(session_id)
        if entry is None:
            return self._default_working_set(session_id)
        working_set, expires_at = entry
        if time.time() > expires_at:
            del self._store[session_id]
            return self._default_working_set(session_id)
        return working_set

    def set(self, session_id, working_set):
        working_set["updated_at"] = time.time()
        self._store[session_id] = (working_set, time.time() + self.ttl_seconds)

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
