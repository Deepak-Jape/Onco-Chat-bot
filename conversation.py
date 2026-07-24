"""
Conversation memory. Keeps a per-session transcript so follow-up questions
("what about its side effects?", "compare that to the other one") carry context,
the way a chat assistant does.

This is intentionally simple and in-memory (a dict). For multi-user production
you'd back it with a table or Redis, but the interface here wouldn't change.

Each session stores an ordered list of {role, content} turns. We hand the recent
slice to the LLM on every call -- that's what gives it "memory".
"""
import threading

import config


class Conversations:
    def __init__(self):
        self._lock = threading.Lock()
        self._store = {}  # session_id -> list[{"role","content"}]

    def history(self, session_id):
        with self._lock:
            return list(self._store.get(session_id, []))

    def add_user(self, session_id, text):
        self._add(session_id, "user", text)

    def add_assistant(self, session_id, text):
        self._add(session_id, "assistant", text)

    def _add(self, session_id, role, text):
        with self._lock:
            turns = self._store.setdefault(session_id, [])
            turns.append({"role": role, "content": text})
            # keep memory bounded: last MAX_HISTORY_TURNS*2 messages (user+assistant pairs)
            cap = config.MAX_HISTORY_TURNS * 2
            if len(turns) > cap:
                del turns[: len(turns) - cap]

    def reset(self, session_id):
        with self._lock:
            self._store.pop(session_id, None)


# shared singleton
conversations = Conversations()
