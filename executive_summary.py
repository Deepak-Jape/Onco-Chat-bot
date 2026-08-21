"""Executive-summary payload for ctsearch's ExecuiteSummaryDrawer.

oncosuite_gold.summary already stores the drawer's payload per trial, in the
exact nested shape the component reads (phases[].value[].study_details,
top_info, site_locations, trial_contacts, and result_section where results have
been posted). So this module serves that JSON directly rather than rebuilding it
from the normalised tables -- no field mapping to drift out of sync, and the
Results tab works for the trials that have data.

Only two small things are added on top:
  * the drawer also reads a flat `study_details` / `endpoints` at the top level
    as a fallback when no phase matches, so the first phase is mirrored there;
  * `nctid` is filled from the trial id when the stored payload omits it.
"""

import json

from db import get_conn


def _load(raw):
    if raw is None:
        return None
    if isinstance(raw, (dict, list)):
        return raw
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


def resolve_trial_id(any_id: str):
    """Map an NCT id to its oncosuite_id; pass an oncosuite_id straight through.

    Answers cite trials by NCT id, but the summary table is keyed by
    oncosuite_id, so clicking an NCT id in a rendered answer needs this lookup
    (source_mapping.source_unique_id holds the NCT number).
    """
    ident = (any_id or "").strip()
    if not ident:
        return None
    if not ident.upper().startswith("NCT"):
        return ident
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT oncosuite_id
              FROM oncosuite_gold.source_mapping
             WHERE UPPER(source_unique_id) = UPPER(%s)
             LIMIT 1
            """,
            (ident,),
        )
        row = cur.fetchone()
    return row[0] if row else None


def build_executive_summary(oncosuite_id: str):
    """The stored summary payload for one trial, or None if unknown."""
    tid = (oncosuite_id or "").strip()
    if not tid:
        return None

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT summary_json FROM oncosuite_gold.summary WHERE oncosuite_id = %s",
            (tid,),
        )
        row = cur.fetchone()
    # Cursor/connection released above -- build_km_curve below needs the same
    # shared per-thread connection (db.get_conn()) and psycopg2 refuses to
    # re-enter it recursively while this `with` block still holds it open.
    if not row:
        return None
    data = _load(row[0])
    if not isinstance(data, dict):
        return None

    # site_locations / trial_contacts are stored under those names; the
    # drawer reads sites_locations. Alias rather than rename so either
    # spelling in the stored payload keeps working.
    if "sites_locations" not in data and "site_locations" in data:
        data["sites_locations"] = data["site_locations"]
    if "contacts" not in data and "trial_contacts" in data:
        data["contacts"] = data["trial_contacts"]

    top = data.setdefault("top_info", {}).setdefault("value", {})
    if not (top.get("nctid") or {}).get("value"):
        top["nctid"] = {"value": tid}
    if not (top.get("registry_source") or {}).get("value"):
        top["registry_source"] = {"value": tid}

    # StudyDetailsTab prefers the active phase but falls back to a flat
    # top-level study_details / endpoints. Mirror the first phase there so a
    # phase-selection mismatch cannot blank the cards.
    phases = data.get("phases") or []
    if phases:
        first = (phases[0].get("value") or [{}])[0]
        data.setdefault("study_details", first.get("study_details") or {})
        endpoint = phases[0].get("endpoint")
        if endpoint and "endpoints" not in data:
            data["endpoints"] = endpoint

    # KM curves: ResultsTab reads result_section.result_section_analysis.
    # efficacy_explorer[] straight off whichever node ends up as its `data`
    # prop -- sometimes the per-phase node, sometimes this top-level object
    # (see ResultsTab.jsx's drawerData resolution) -- so the same entries are
    # injected into both rather than guessing which one the caller will use.
    # Only oncosuite_gold.results_analytics' small set of trials ever produce
    # anything here; every other trial's payload is returned unchanged.
    try:
        from chart_data import build_km_curve
        km = build_km_curve([tid])
    except Exception:
        km = None
    if km and km.get("explorer"):
        data.setdefault("result_section", {}) \
            .setdefault("result_section_analysis", {})["efficacy_explorer"] = km["explorer"]
        for phase in phases:
            for v in (phase.get("value") or []):
                if isinstance(v, dict):
                    v.setdefault("result_section", {}) \
                        .setdefault("result_section_analysis", {})["efficacy_explorer"] = km["explorer"]

    return data
