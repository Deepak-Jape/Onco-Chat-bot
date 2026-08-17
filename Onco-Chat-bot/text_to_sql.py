"""
Text-to-SQL: turn a natural-language question (plus recent conversation) into a
safe, read-only SQL query, run it, and let the LLM phrase the answer.

SAFETY (critical for a clinical tool):
  - The generated SQL is validated: must be a single SELECT/WITH statement, no
    semicolons chaining, no DML/DDL keywords (INSERT/UPDATE/DELETE/DROP/...).
  - A LIMIT is force-appended if absent.
  - db.py already opens a READ-ONLY connection, so even a bypass can't mutate data.
  - If anything is off (LLM down, invalid SQL, empty result) we return a status the
    caller can act on -- we NEVER fabricate an answer.
"""
import re

import config
import llm_client
from db import query
from schema_metadata import build_schema_prompt

_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|"
    r"comment|copy|call|do|merge|vacuum|analyze|reindex|refresh)\b",
    re.IGNORECASE,
)

_SQL_SYSTEM = (
    "You translate a user's question about clinical trials into ONE PostgreSQL "
    "SELECT query. Output ONLY the SQL, no prose, no markdown fences. Use the schema "
    "below. Always schema-qualify tables (oncosuite_gold.<table>). Read-only SELECT "
    "only. Prefer explicit column lists. If the question needs the NCT id, join "
    "source_mapping. If you truly cannot answer from this schema, output exactly: "
    "NO_QUERY\n\n" + build_schema_prompt()
)


def _extract_sql(text: str) -> str:
    t = text.strip()
    # strip ```sql fences if the model added them
    t = re.sub(r"^```(?:sql)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    return t


def validate_sql(sql: str):
    """Return (ok, reason). Enforces single read-only SELECT."""
    s = sql.strip().rstrip(";").strip()
    if not s:
        return False, "empty"
    if s.upper() == "NO_QUERY":
        return False, "model declined (NO_QUERY)"
    if ";" in s:
        return False, "multiple statements not allowed"
    if not re.match(r"^\s*(select|with)\b", s, re.IGNORECASE):
        return False, "not a SELECT/WITH statement"
    if _FORBIDDEN.search(s):
        return False, "contains a forbidden (write) keyword"
    return True, "ok"


def _enforce_limit(sql: str) -> str:
    s = sql.strip().rstrip(";")
    if re.search(r"\blimit\b", s, re.IGNORECASE):
        return s
    return f"{s}\nLIMIT {config.SQL_ROW_LIMIT}"


def generate_sql(question: str, history=None, error_hint=None, prev_sql=None) -> str:
    """Ask the LLM for SQL. Raises llm_client.LLMUnavailable if backend is down.
    If error_hint/prev_sql are given (a retry), tell the model what went wrong so it
    can correct its previous attempt instead of blindly regenerating the same query."""
    messages = [{"role": "system", "content": _SQL_SYSTEM}]
    for turn in (history or [])[-config.MAX_HISTORY_TURNS:]:
        messages.append(turn)
    messages.append({"role": "user", "content": question})
    if error_hint:
        messages.append({
            "role": "user",
            "content": (
                "Your previous SQL did not work. Fix it and output ONLY the corrected "
                f"SELECT.\nPrevious SQL:\n{prev_sql}\n\nProblem: {error_hint}\n"
                "If the question genuinely cannot be answered from the schema, output "
                "NO_QUERY."
            ),
        })
    raw = llm_client.chat(messages)
    return _extract_sql(raw)


def answer_from_rows(question: str, sql: str, rows, history=None) -> str:
    """Let the LLM phrase a short answer grounded ONLY in the returned rows."""
    preview = rows[:50]
    grounding = (
        "You are a clinical-trials assistant. Write a clear, natural-language answer to "
        "the user's question using ONLY the SQL result rows provided -- do NOT output raw "
        "JSON or repeat the rows verbatim, and do not invent data. If the rows are empty, "
        "say you found no matching data.\n\n"
        + config.ANSWER_FORMAT_CONTRACT +
        f"\n\nSQL RUN:\n{sql}\n\nROWS (JSON):\n{_json(preview)}"
    )
    messages = [{"role": "system", "content": grounding}]
    for turn in (history or [])[-config.MAX_HISTORY_TURNS:]:
        messages.append(turn)
    messages.append({"role": "user", "content": question})
    return llm_client.chat(messages)


def _regenerate_grounded(question: str, sql: str, rows, history, problems: str) -> str:
    """Re-phrase the answer after the verifier flagged unsupported claims, telling
    the model exactly what was wrong so it stays strictly within the rows."""
    preview = rows[:50]
    grounding = (
        "You are a clinical-trials assistant. Your previous answer contained claims a "
        "fact-checker could NOT support with the data. Rewrite the answer using ONLY the "
        "SQL result rows below. Drop or correct every flagged claim. State only what the "
        "rows actually show; if the rows don't answer part of the question, say so plainly. "
        "Do not invent numbers, names, or comparisons.\n\n"
        + config.ANSWER_FORMAT_CONTRACT +
        f"\n\nFLAGGED PROBLEMS:\n{problems}\n\n"
        f"SQL RUN:\n{sql}\n\nROWS (JSON):\n{_json(preview)}"
    )
    messages = [{"role": "system", "content": grounding}]
    for turn in (history or [])[-config.MAX_HISTORY_TURNS:]:
        messages.append(turn)
    messages.append({"role": "user", "content": question})
    return llm_client.chat(messages)


def verify_answer(question: str, answer: str, rows, history=None):
    """
    Grounding check: does `answer` make any factual claim NOT supported by `rows`?
    Returns (ok: bool, problems: str). This is the accuracy guard for a clinical
    tool -- a confidently-worded but unsupported number/name is the worst failure
    mode, so we run a cheap second pass to catch it before the answer reaches the
    user. On any LLM failure we FAIL OPEN (ok=True) rather than block a good answer,
    because the primary answer is already grounded by the answer_from_rows prompt;
    this is a second safety net, not the only one.
    """
    preview = rows[:50]
    checker = (
        "You are a strict fact-checker for a clinical-trials assistant. You are given a "
        "user question, the SQL result ROWS that are the ONLY allowed source of truth, "
        "and a proposed ANSWER. Your job: find every factual claim in the ANSWER "
        "(numbers, counts, trial ids, drug/sponsor names, dates, comparisons) that is "
        "NOT directly supported by the ROWS. Reasonable rephrasing and summary are fine; "
        "only flag claims that state or imply facts the rows do not contain or that "
        "contradict the rows.\n\n"
        "Respond in EXACTLY this format:\n"
        "VERDICT: SUPPORTED   (if every claim is backed by the rows)\n"
        "or\n"
        "VERDICT: UNSUPPORTED\nPROBLEMS: <one line per unsupported/contradicted claim>\n\n"
        f"ROWS (JSON):\n{_json(preview)}"
    )
    messages = [
        {"role": "system", "content": checker},
        {"role": "user", "content": f"QUESTION:\n{question}\n\nANSWER:\n{answer}"},
    ]
    try:
        verdict = llm_client.chat(messages).strip()
    except llm_client.LLMUnavailable:
        return True, "verifier unavailable (failed open)"
    if re.search(r"VERDICT:\s*SUPPORTED", verdict, re.IGNORECASE):
        return True, "supported"
    if re.search(r"VERDICT:\s*UNSUPPORTED", verdict, re.IGNORECASE):
        problems = ""
        m = re.search(r"PROBLEMS:\s*(.+)", verdict, re.IGNORECASE | re.DOTALL)
        if m:
            problems = m.group(1).strip()
        return False, problems or "unsupported claims detected"
    # Verifier returned something unparseable -> fail open, don't block a real answer.
    return True, f"verifier gave unparseable output (failed open): {verdict[:120]}"


def _json(rows):
    import json
    import datetime
    import decimal

    def plain(o):
        if isinstance(o, dict):
            return {k: plain(v) for k, v in o.items()}
        if isinstance(o, (list, tuple)):
            return [plain(v) for v in o]
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        if isinstance(o, decimal.Decimal):
            # aggregates (AVG/SUM/...) come back as Decimal -> make it a plain number
            return float(o)
        return o

    return json.dumps(plain(rows), indent=1)[:6000]


MAX_SQL_ATTEMPTS = 3  # generate -> if it errors or returns nothing, self-correct & retry


def run(question: str, history=None) -> dict:
    """
    Full text-to-SQL turn. Returns a dict:
      {"status": "answered"|"declined"|"no_data"|"unavailable"|"invalid_sql",
       "sql": str|None, "rows": list, "answer": str|None, "reason": str|None}
    Never raises; caller decides fallback.

    Retries on failure: the LLM writes non-deterministic SQL, so a single attempt can
    hit a bad column / empty result even when the question is answerable. We retry up to
    MAX_SQL_ATTEMPTS, feeding the exact error back so the model corrects itself -- this
    turns intermittent "out of scope" failures into reliable answers.
    """
    error_hint = None
    prev_sql = None
    last = {"status": "invalid_sql", "sql": None, "rows": [], "answer": None,
            "reason": "no attempt made"}

    for attempt in range(MAX_SQL_ATTEMPTS):
        try:
            sql = generate_sql(question, history, error_hint=error_hint, prev_sql=prev_sql)
        except llm_client.LLMUnavailable as e:
            return {"status": "unavailable", "sql": None, "rows": [], "answer": None,
                    "reason": str(e)}

        ok, reason = validate_sql(sql)
        if not ok:
            if "NO_QUERY" in reason:  # model deliberately declined -> stop retrying
                return {"status": "declined", "sql": sql, "rows": [], "answer": None,
                        "reason": reason}
            last = {"status": "invalid_sql", "sql": sql, "rows": [], "answer": None,
                    "reason": reason}
            error_hint, prev_sql = f"the SQL failed validation: {reason}", sql
            continue

        safe_sql = _enforce_limit(sql)
        try:
            rows = query(safe_sql)
        except Exception as e:  # noqa: BLE001  -- bad SQL from the model, don't crash
            last = {"status": "invalid_sql", "sql": safe_sql, "rows": [], "answer": None,
                    "reason": f"execution error: {e}"}
            error_hint, prev_sql = f"executing it raised: {e}", safe_sql
            continue

        if not rows:
            last = {"status": "no_data", "sql": safe_sql, "rows": [], "answer": None,
                    "reason": "query ran but returned no rows"}
            # empty could be a genuinely empty set OR a too-strict query; ask for a
            # broader/corrected attempt, but keep this as the fallback if retries also fail.
            error_hint, prev_sql = ("the query returned 0 rows; if the question should "
                                    "have data, relax overly strict filters or fix joins"), safe_sql
            continue

        # success -> phrase the answer
        try:
            answer = answer_from_rows(question, safe_sql, rows, history)
        except llm_client.LLMUnavailable as e:
            return {"status": "answered", "sql": safe_sql, "rows": rows, "answer": None,
                    "reason": f"rows returned; answer synthesis unavailable ({e})"}

        # GROUNDING VERIFICATION: check the phrased answer against the rows. If the
        # verifier flags unsupported claims, regenerate ONCE with the problems fed
        # back; if it's still unsupported, return the answer but mark it unverified
        # so the caller can present it cautiously rather than as established fact.
        ok, problems = verify_answer(question, answer, rows, history)
        if not ok:
            try:
                answer = _regenerate_grounded(question, safe_sql, rows, history, problems)
            except llm_client.LLMUnavailable:
                pass
            ok2, problems2 = verify_answer(question, answer, rows, history)
            if not ok2:
                return {"status": "answered", "sql": safe_sql, "rows": rows,
                        "answer": answer, "reason": None,
                        "verified": False, "verification_problems": problems2}

        return {"status": "answered", "sql": safe_sql, "rows": rows, "answer": answer,
                "reason": None, "verified": True}

    return last  # all attempts exhausted -> return the last failure for the caller
