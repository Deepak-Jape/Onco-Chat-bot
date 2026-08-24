"""
Compare two or more TRIALS side by side.

Distinct from tools/compare_arms.py, which compares arms WITHIN one trial. A
question like "compare wD7-VqO-nZf vs kF6-oN3-If3" names two different trials,
and answering it with detail for whichever id appeared first -- which is what
happened before this existed -- answers half the question while looking complete.

Every value is copied from get_trial_detail's output, so nothing here is derived
or estimated: the comparison is only as good as the underlying rows, and a field
missing on one trial is shown as absent rather than filled in.
"""

from tools.get_trial_detail import get_trial_detail, resolve_oncosuite_id

# The fields worth putting side by side, in the order a reader would want them:
# what the trial IS, then how big, then when, then where.
_ROWS = (
    ("nct_id", "NCT ID"),
    ("trial_phase", "Phase"),
    ("study_status", "Status"),
    ("sponsor_name", "Sponsor"),
    ("lead_organization", "Lead organization"),
    ("enrollment_count", "Enrollment"),
    ("study_type", "Study type"),
    ("trial_architecture", "Architecture"),
    ("study_design", "Design"),
    ("start_date", "Start date"),
    ("primary_completion_date", "Primary completion"),
)


def _fmt(value):
    if value is None or value == "":
        return "—"
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value if v) or "—"
    return str(value)


def _derived(detail):
    """Comparable figures that aren't top-level columns."""
    # `locations` is a DICT -- {total_sites, total_countries, by_country,
    # facilities} -- not a list of sites. Treating it as a list counted its 4
    # keys as sites and produced no countries at all.
    locations = detail.get("locations") or {}
    by_country = locations.get("by_country") or []
    countries = sorted({
        str(c.get("country") or "").strip()
        for c in by_country if isinstance(c, dict) and c.get("country")
    })
    site_count = locations.get("total_sites")
    country_count = locations.get("total_countries") or len(countries) or None
    cohorts = detail.get("cohorts") or []
    arms = [a for c in cohorts if isinstance(c, dict) for a in (c.get("arms") or [])]
    endpoints = detail.get("endpoints") or []
    return {
        "sites": site_count,
        "countries": country_count,
        "country_list": countries,
        "cohorts": len(cohorts) or None,
        "arms": len(arms) or None,
        "endpoints": len(endpoints) or None,
    }


def compare_trials(oncosuite_ids):
    """{trials: [...], rows: [{label, values: [...]}], differences: [...]} or error.

    `oncosuite_ids` may be typed in any case, and lookalike characters (I/l/1,
    O/0) are tolerated -- see resolve_oncosuite_id. Unresolvable ids are reported
    rather than silently dropped, so the answer never quietly compares fewer
    trials than were asked for.
    """
    wanted = [str(i).strip() for i in (oncosuite_ids or []) if str(i or "").strip()]
    if len(wanted) < 2:
        return {"error": "Comparing trials needs at least two trial ids."}

    resolved, unresolved = [], []
    for raw in wanted:
        found = resolve_oncosuite_id(raw)
        if found:
            if found not in resolved:
                resolved.append(found)
        else:
            unresolved.append(raw)

    if len(resolved) < 2:
        return {
            "error": (
                "I could only resolve "
                f"{len(resolved)} of the {len(wanted)} ids given"
                + (f" (unrecognised: {', '.join(unresolved)})" if unresolved else "")
                + ". Comparing needs at least two valid trial ids."
            ),
            "unresolved": unresolved,
        }

    details = []
    for oid in resolved:
        d = get_trial_detail(oid)
        if isinstance(d, dict) and not d.get("error"):
            details.append(d)
        else:
            unresolved.append(oid)
    if len(details) < 2:
        return {"error": "Could not load enough trial detail to compare.",
                "unresolved": unresolved}

    derived = [_derived(d) for d in details]

    rows = []
    for key, label in _ROWS:
        rows.append({"label": label,
                     "values": [_fmt(d.get(key)) for d in details]})
    for key, label in (("cohorts", "Cohorts"), ("arms", "Arms"),
                       ("sites", "Sites"), ("countries", "Countries"),
                       ("endpoints", "Endpoints reported")):
        rows.append({"label": label,
                     "values": [_fmt(x.get(key)) for x in derived]})

    # WHAT ACTUALLY DIFFERS. A side-by-side table still leaves the reader to spot
    # the differences; naming them is the point of asking for a comparison.
    differences = []
    for row in rows:
        vals = row["values"]
        if len({v for v in vals if v != "—"}) > 1:
            differences.append(
                f"**{row['label']}**: " + " vs ".join(vals)
            )

    shared_countries = set(derived[0]["country_list"])
    for x in derived[1:]:
        shared_countries &= set(x["country_list"])

    return {
        "trials": [
            {"oncosuite_id": d.get("oncosuite_id"), "nct_id": d.get("nct_id"),
             "title": d.get("official_title")}
            for d in details
        ],
        "rows": rows,
        "differences": differences,
        "shared_countries": sorted(shared_countries),
        "unresolved": unresolved,
    }
