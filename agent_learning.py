"""
Learning memory -- the piece that makes this an agent rather than a chatbot.

Two stores, deliberately separate because they carry different risk:

  1. QUERY MEMORY (learned_queries): "this question was answered by this SQL /
     these filters, and it returned N rows." A later, similar question reuses the
     proven query instead of re-deriving it. This is what makes repeat questions
     both faster and more accurate -- a query that demonstrably worked beats a
     fresh guess.

  2. PREFERENCE MEMORY (session_profile): which sponsors, biomarkers, phases and
     countries a session keeps asking about, so defaults can follow the user's
     actual interest rather than starting cold every turn.

WHAT IS DELIBERATELY *NOT* STORED: model prose. Writing generated answers into
the corpus that later answers are grounded in creates a feedback loop where one
wrong answer becomes evidence for the next. For a clinical-trials tool that is a
serious failure mode, so only QUERIES (verifiable -- they either return rows or
they don't) and ENTITIES (extracted from the question, not invented) are learned.

Everything here degrades to a no-op if the DB is unreachable: a learning layer
must never be able to break answering.
"""
import json
import re
import threading

from psycopg2.extras import Json

from db import execute, query

QUERY_TABLE = "oncosuite_gold.learned_queries"
PROFILE_TABLE = "oncosuite_gold.session_profile"

# A learned query is only worth reusing if it actually produced data.
MIN_ROWS_TO_LEARN = 1
# Similarity floor for treating a past question as "the same question".
_REUSE_THRESHOLD = 0.72
# Never let the profile grow unbounded; keep the most-mentioned entities.
_MAX_ENTITIES_PER_KIND = 8

_ensure_lock = threading.Lock()
_ensured = False


def _ensure_tables():
    global _ensured
    if _ensured:
        return
    with _ensure_lock:
        if _ensured:
            return
        try:
            execute(
                f"CREATE TABLE IF NOT EXISTS {QUERY_TABLE} ("
                "  id bigserial PRIMARY KEY,"
                "  question text NOT NULL,"
                "  normalized text NOT NULL,"
                "  kind text NOT NULL,"            # 'sql' | 'filters' | 'chart'
                "  payload jsonb NOT NULL,"        # the SQL string or filter dict
                "  row_count integer NOT NULL,"
                "  hits integer NOT NULL DEFAULT 0,"
                "  last_used_at timestamptz,"
                "  created_at timestamptz NOT NULL DEFAULT now()"
                ")"
            )
            execute(
                f"CREATE INDEX IF NOT EXISTS learned_queries_norm_idx "
                f"ON {QUERY_TABLE} (normalized)"
            )
            execute(
                f"CREATE TABLE IF NOT EXISTS {PROFILE_TABLE} ("
                "  session_id text PRIMARY KEY,"
                "  profile jsonb NOT NULL,"
                "  updated_at timestamptz NOT NULL DEFAULT now()"
                ")"
            )
            _ensured = True
        except Exception:
            # Leave _ensured False so a later call can retry once the DB is back.
            pass


# --------------------------------------------------------------------------
# Question normalisation
#
# Two questions are "the same" when they differ only in wording, so the
# comparison runs on a normalised form: lowercased, stripped of filler words and
# punctuation, tokens sorted. That makes "what are the top moa" and "show me top
# MoA please" collapse to the same key, without needing embeddings.
# --------------------------------------------------------------------------
_FILLER = {
    "show", "me", "the", "a", "an", "please", "can", "you", "could", "would",
    "what", "which", "are", "is", "was", "were", "do", "does", "did", "for",
    "of", "in", "on", "to", "and", "or", "with", "give", "get", "tell", "about",
    "i", "want", "need", "list", "all", "any", "some", "there", "how", "many",
}


def normalize_question(question):
    words = re.findall(r"[a-z0-9]+", str(question or "").lower())
    kept = [w for w in words if w not in _FILLER]
    # Fall back to the raw words if filtering emptied it (e.g. "how many?").
    return " ".join(sorted(kept or words))


def _similarity(a, b):
    from difflib import SequenceMatcher
    return SequenceMatcher(None, a, b).ratio()


# --------------------------------------------------------------------------
# 1. Query memory
# --------------------------------------------------------------------------

def remember_query(question, kind, payload, row_count):
    """Record that `payload` answered `question` with `row_count` rows.

    Only successful queries are learned -- a query that returned nothing is not
    worth replaying. Re-learning the same question/kind updates in place rather
    than accumulating duplicates.
    """
    if not question or row_count is None or row_count < MIN_ROWS_TO_LEARN:
        return
    if not payload:
        return
    _ensure_tables()
    norm = normalize_question(question)
    try:
        existing = query(
            f"SELECT id FROM {QUERY_TABLE} WHERE normalized = %(n)s AND kind = %(k)s",
            {"n": norm, "k": kind},
        )
        if existing:
            execute(
                f"UPDATE {QUERY_TABLE} SET payload = %(p)s, row_count = %(rc)s, "
                f"question = %(q)s WHERE id = %(id)s",
                {"p": Json(payload), "rc": int(row_count), "q": question,
                 "id": existing[0]["id"]},
            )
        else:
            execute(
                f"INSERT INTO {QUERY_TABLE} (question, normalized, kind, payload, "
                f"row_count) VALUES (%(q)s, %(n)s, %(k)s, %(p)s, %(rc)s)",
                {"q": question, "n": norm, "k": kind, "p": Json(payload),
                 "rc": int(row_count)},
            )
    except Exception:
        pass  # learning is best-effort; never break the answer path


def recall_query(question, kind=None):
    """A previously-proven query for a question like this one, or None.

    Returns {"kind", "payload", "row_count", "question", "similarity"}. An exact
    normalised match wins outright; otherwise the closest match above the
    similarity floor is used, so near-identical phrasings still hit.
    """
    if not question:
        return None
    _ensure_tables()
    norm = normalize_question(question)
    try:
        if kind:
            rows = query(
                f"SELECT * FROM {QUERY_TABLE} WHERE kind = %(k)s "
                f"ORDER BY hits DESC, row_count DESC LIMIT 400",
                {"k": kind},
            )
        else:
            rows = query(
                f"SELECT * FROM {QUERY_TABLE} "
                f"ORDER BY hits DESC, row_count DESC LIMIT 400"
            )
    except Exception:
        return None
    if not rows:
        return None

    best, best_score = None, 0.0
    for r in rows:
        if r["normalized"] == norm:
            best, best_score = r, 1.0
            break
        score = _similarity(norm, r["normalized"])
        if score > best_score:
            best, best_score = r, score
    if not best or best_score < _REUSE_THRESHOLD:
        return None

    try:
        execute(
            f"UPDATE {QUERY_TABLE} SET hits = hits + 1, last_used_at = now() "
            f"WHERE id = %(id)s",
            {"id": best["id"]},
        )
    except Exception:
        pass

    payload = best["payload"]
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            pass
    return {"kind": best["kind"], "payload": payload,
            "row_count": best["row_count"], "question": best["question"],
            "similarity": round(best_score, 3)}


def forget_query(question, kind):
    """Drop a learned query -- called when a replay stops working, so a query
    that has gone stale (schema change, data change) is not replayed forever."""
    if not question:
        return
    _ensure_tables()
    try:
        execute(
            f"DELETE FROM {QUERY_TABLE} WHERE normalized = %(n)s AND kind = %(k)s",
            {"n": normalize_question(question), "k": kind},
        )
    except Exception:
        pass


# --------------------------------------------------------------------------
# 2. Preference / entity memory
# --------------------------------------------------------------------------

def _empty_profile():
    return {"sponsor": {}, "biomarker": {}, "phase": {}, "country": {},
             "condition": {}, "asked": 0}


def get_profile(session_id):
    """This session's accumulated interests, as {kind: {value: count}}."""
    if not session_id:
        return _empty_profile()
    _ensure_tables()
    try:
        rows = query(
            f"SELECT profile FROM {PROFILE_TABLE} WHERE session_id = %(sid)s",
            {"sid": session_id},
        )
    except Exception:
        return _empty_profile()
    if not rows:
        return _empty_profile()
    prof = rows[0]["profile"]
    if isinstance(prof, str):
        try:
            prof = json.loads(prof)
        except Exception:
            return _empty_profile()
    base = _empty_profile()
    base.update(prof or {})
    return base


def remember_entities(session_id, filters=None, question=None):
    """Fold the entities this turn actually used into the session profile.

    Counts are what make this useful: a sponsor mentioned once is context, one
    mentioned five times is a preference. Only values that came from the DB
    vocabulary or the extracted filters are recorded -- nothing is inferred.
    """
    if not session_id:
        return
    _ensure_tables()
    prof = get_profile(session_id)
    prof["asked"] = int(prof.get("asked") or 0) + 1

    def bump(kind, values):
        if not values:
            return
        bucket = prof.setdefault(kind, {})
        for v in (values if isinstance(values, (list, tuple)) else [values]):
            if not v:
                continue
            key = str(v)
            bucket[key] = int(bucket.get(key, 0)) + 1

    f = filters or {}
    bump("sponsor", f.get("sponsor"))
    bump("biomarker", f.get("biomarkers"))
    bump("phase", f.get("phase"))
    bump("condition", f.get("condition"))
    bump("country", f.get("locations") or f.get("countries"))

    # Trim each bucket to the most-mentioned entries so the row stays small.
    for kind in ("sponsor", "biomarker", "phase", "country", "condition"):
        bucket = prof.get(kind) or {}
        if len(bucket) > _MAX_ENTITIES_PER_KIND:
            prof[kind] = dict(
                sorted(bucket.items(), key=lambda kv: kv[1], reverse=True)
                [:_MAX_ENTITIES_PER_KIND]
            )

    try:
        execute(
            f"INSERT INTO {PROFILE_TABLE} (session_id, profile, updated_at) "
            f"VALUES (%(sid)s, %(p)s, now()) "
            f"ON CONFLICT (session_id) DO UPDATE SET profile = excluded.profile, "
            f"updated_at = excluded.updated_at",
            {"sid": session_id, "p": Json(prof)},
        )
    except Exception:
        pass


def preferred(session_id, kind, min_count=2):
    """The values this session asks about repeatedly, most-mentioned first.

    `min_count` is why this is a preference and not just history: a single
    mention is not enough to start steering answers.
    """
    prof = get_profile(session_id)
    bucket = prof.get(kind) or {}
    ranked = sorted(
        ((v, c) for v, c in bucket.items() if int(c) >= min_count),
        key=lambda kv: kv[1], reverse=True,
    )
    return [v for v, _ in ranked]


def profile_summary(session_id):
    """One-line description of what this session cares about, or None.

    Used to tell the user what the assistant has picked up -- learning the user
    cannot see is indistinguishable from a bug.
    """
    prof = get_profile(session_id)
    parts = []
    for kind, label in (("sponsor", "sponsor"), ("biomarker", "biomarker"),
                        ("condition", "indication"), ("phase", "phase"),
                        ("country", "country")):
        vals = preferred(session_id, kind)
        if vals:
            parts.append(f"{label}: {', '.join(vals[:3])}")
    if not parts:
        return None
    return f"Based on this session ({prof.get('asked', 0)} questions) — " + "; ".join(parts)
