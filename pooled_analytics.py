"""Deterministic, no-LLM pooled/aggregate analytics over a set of result rows
(trial-search or cohort-search rows), backing the "Pooled" view toggle that
sits alongside the raw per-row table in the main chat flow.

Grain-safety rule: a pooled figure must never silently average across rows
that aren't actually comparable (different phase, or different indication for
cohort rows). So every stat here is computed WITHIN a group first -- rows are
grouped by whichever of _COMPARABILITY_KEYS is actually present in the result
set (phase, then indication) -- rather than pooling the whole result set as
one bucket. This is plain code, not an LLM judgment call, so grouping is
always applied the same way.
"""

_COMPARABILITY_KEYS = ("phase", "indication")
_CATEGORICAL_KEYS = ("status", "sponsor_type", "regimen", "sponsor")
_NUMERIC_KEYS = ("enrollment", "planned_enrollment_count", "min_age", "max_age")
_MAX_TALLY_ITEMS = 8


def _is_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _median(values):
    s = sorted(values)
    n = len(s)
    mid = n // 2
    return s[mid] if n % 2 else (s[mid - 1] + s[mid]) / 2


def _tally(rows, key, cap=_MAX_TALLY_ITEMS):
    counts = {}
    for r in rows:
        v = r.get(key)
        v = v if v not in (None, "") else "—"
        counts[v] = counts.get(v, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: -kv[1])
    return {"items": ranked[:cap], "more": max(0, len(ranked) - cap)}


def _numeric_summary(rows, key):
    vals = [r.get(key) for r in rows if _is_number(r.get(key))]
    if not vals:
        return None
    return {"median": _median(vals), "min": min(vals), "max": max(vals), "n": len(vals)}


def build_pooled_view(rows, active_keys):
    """rows: result dicts from search_trials/search_cohorts. active_keys: the
    column_catalog keys actually present in those rows (the tool's "columns"
    return value). Returns {"groups": [{"label", "n", "categorical", "numeric"}]},
    one entry per comparability group -- empty groups list if there's nothing
    to pool (no rows)."""
    if not rows:
        return {"groups": []}

    active = set(active_keys or [])
    grouping_keys = [k for k in _COMPARABILITY_KEYS if k in active]

    groups, order = {}, []
    for r in rows:
        key = tuple(r.get(k) or "—" for k in grouping_keys) if grouping_keys else ("All results",)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(r)

    cat_keys = [k for k in _CATEGORICAL_KEYS if k in active and k not in grouping_keys]
    num_keys = [k for k in _NUMERIC_KEYS if k in active]

    out = []
    for key in order:
        group_rows = groups[key]
        label = " / ".join(str(v) for v in key) if grouping_keys else "All results"
        entry = {
            "label": label,
            "n": len(group_rows),
            "categorical": {k: _tally(group_rows, k) for k in cat_keys},
            "numeric": {k: s for k in num_keys
                       if (s := _numeric_summary(group_rows, k)) is not None},
        }
        out.append(entry)
    return {"groups": out}
