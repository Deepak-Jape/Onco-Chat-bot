"""Narrative intro and Key Insights for any answer.

Both are computed from the rows the query already returned -- counts, spans and
distributions -- rather than written by a model. That keeps them instant (the
prose-writing LLM call is what made broad questions time out) and means every
statement is backed by the result set: nothing here can assert something the
data does not support.

Used by answer_fast.build_fast_answer, so it applies to every answer type that
returns rows, not just the cohort dashboard.
"""


def _rows_of(tool_result):
    if not isinstance(tool_result, dict):
        return []
    for key in ("results", "rows", "cohorts", "trials"):
        rows = tool_result.get(key)
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows
    return []


def _tally(rows, field):
    counts = {}
    for r in rows:
        v = r.get(field)
        if v is None or str(v).strip() in ("", "-", "None"):
            continue
        key = str(v).strip()
        counts[key] = counts.get(key, 0) + 1
    return counts


def _years(rows):
    out = []
    for r in rows:
        raw = str(r.get("start_date") or "")[:4]
        if raw.isdigit():
            out.append(int(raw))
    return out


def _pct(n, total):
    return round(100 * n / total) if total else 0


def build_intro(question, tool_result, rows=None):
    """One-line framing sentence, e.g. what was searched and how much matched."""
    rows = rows if rows is not None else _rows_of(tool_result)
    if not rows:
        return None

    total = (tool_result or {}).get("total_matches") or len(rows)
    shown = len(rows)

    phases = _tally(rows, "phase")
    statuses = _tally(rows, "status")
    years = _years(rows)

    bits = []
    if total > shown:
        bits.append(f"Found **{total:,}** matching trials; showing the first **{shown}**")
    else:
        bits.append(f"Found **{total:,}** matching trial(s)")

    if phases:
        top = max(phases.items(), key=lambda kv: kv[1])
        bits.append(f"mostly **{top[0]}** ({_pct(top[1], shown)}%)")
    if years:
        lo, hi = min(years), max(years)
        bits.append(f"starting between **{lo}** and **{hi}**" if lo != hi else f"starting in **{lo}**")

    lead = ", ".join(bits) + "."

    recruiting = sum(v for k, v in statuses.items() if "recruit" in k.lower() and "not" not in k.lower())
    if recruiting:
        lead += f" **{recruiting}** of the trials shown are actively recruiting."
    return lead


def build_key_insights(question, tool_result, rows=None, limit=5):
    """Bullet insights derived from the result set. Empty when nothing is solid."""
    rows = rows if rows is not None else _rows_of(tool_result)
    if len(rows) < 2:
        return []

    shown = len(rows)
    total = (tool_result or {}).get("total_matches") or shown
    out = []

    phases = _tally(rows, "phase")
    if phases:
        top, n = max(phases.items(), key=lambda kv: kv[1])
        out.append(
            f"{top} is the most common phase: {n} of {shown} trials shown "
            f"({_pct(n, shown)}%), across {len(phases)} distinct phases."
        )

    statuses = _tally(rows, "status")
    if statuses:
        recruiting = sum(
            v for k, v in statuses.items()
            if "recruit" in k.lower() and "not" not in k.lower()
        )
        if recruiting:
            out.append(
                f"{recruiting} trials ({_pct(recruiting, shown)}%) are actively "
                f"recruiting and open to enrolment."
            )
        top, n = max(statuses.items(), key=lambda kv: kv[1])
        out.append(f"The most frequent status is {top} ({n} trials).")

    sponsors = _tally(rows, "sponsor")
    if sponsors:
        top, n = max(sponsors.items(), key=lambda kv: kv[1])
        if n > 1:
            out.append(f"{top} sponsors the most trials in this set ({n}).")
        out.append(
            f"{len(sponsors)} distinct sponsors appear, indicating a "
            f"{'concentrated' if len(sponsors) < shown / 3 else 'fragmented'} landscape."
        )

    enrols = []
    for r in rows:
        try:
            v = int(r.get("enrollment"))
            if v > 0:
                enrols.append(v)
        except (TypeError, ValueError):
            continue
    if len(enrols) >= 3:
        enrols.sort()
        median = enrols[len(enrols) // 2]
        out.append(
            f"Median planned enrolment is {median:,} participants "
            f"(range {min(enrols):,}–{max(enrols):,})."
        )

    years = _years(rows)
    if years:
        recent = sum(1 for y in years if y >= max(years) - 1)
        if recent:
            out.append(
                f"{recent} trials started in {max(years) - 1}–{max(years)}, "
                f"showing continued activity in this area."
            )

    if total > shown:
        out.append(
            f"These figures describe the {shown} trials shown; {total:,} matched "
            f"in total, so ask for more to widen the sample."
        )

    return out[:limit]
