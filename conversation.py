"""
Conversation memory. Keeps a per-session transcript so follow-up questions
("what about its side effects?", "compare that to the other one") carry context,
the way a chat assistant does.

Backed by oncosuite_gold.chat_turns (Postgres) rather than a process-local dict:
turns survive a server restart/redeploy, and the app can run more than one
worker process without each one having its own amnesia. history() still only
returns the most recent MAX_HISTORY_TURNS*2 turns -- the full transcript stays
in the table as a durable record, but only the recent slice goes to the LLM.
"""
import threading

import config
from db import query, execute

TABLE = "oncosuite_gold.chat_turns"

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
            "  id bigserial PRIMARY KEY,"
            "  session_id text NOT NULL,"
            "  role text NOT NULL,"
            "  content text NOT NULL,"
            "  created_at timestamptz NOT NULL DEFAULT now()"
            ")"
        )
        execute(
            f"CREATE INDEX IF NOT EXISTS chat_turns_session_idx "
            f"ON {TABLE} (session_id, id)"
        )
        _ensured = True


class Conversations:
    def history(self, session_id):
        _ensure_table()
        cap = config.MAX_HISTORY_TURNS * 2
        rows = query(
            f"SELECT role, content FROM {TABLE} WHERE session_id = %(sid)s "
            f"ORDER BY id DESC LIMIT %(cap)s",
            {"sid": session_id, "cap": cap},
        )
        return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]

    def add_user(self, session_id, text):
        self._add(session_id, "user", text)

    def add_assistant(self, session_id, text):
        self._add(session_id, "assistant", text)

    def _add(self, session_id, role, text):
        _ensure_table()
        execute(
            f"INSERT INTO {TABLE} (session_id, role, content) "
            f"VALUES (%(sid)s, %(role)s, %(content)s)",
            {"sid": session_id, "role": role, "content": text},
        )

    def reset(self, session_id):
        _ensure_table()
        execute(f"DELETE FROM {TABLE} WHERE session_id = %(sid)s", {"sid": session_id})


# shared singleton
conversations = Conversations()
