

"""
Small local web interface for the oncosuite assistant.

Type a question, get a structured answer. Uses only the Python standard
library (http.server) -- no extra pip installs. Calls router.handle_turn
and renders each response shape (trial detail, search results, landscape,
clarification, out-of-scope) as clean HTML.

Run:  python web_app.py
Then open http://127.0.0.1:8000 in your browser.
"""
import datetime
import html
import json
import os
import queue
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from router import handle_turn

SESSION_ID = "web"  # single shared session so follow-ups ("compare arm A vs B") work


# ---------- helpers ----------

def _auto_bar_chart(rows, headers):
    """If SQL result rows look like a grouped aggregate -- one text/label column and
    one numeric column, 2-30 rows -- render a bar chart. Returns '' if the shape
    doesn't fit (so ungroupable results just show the table). Keeps aggregate answers
    visual even when they come through the text-to-SQL path (not just landscape)."""
    if not rows or len(rows) < 2 or len(rows) > 30:
        return ""
    if len(headers) < 2:
        return ""
    # find one numeric column and one non-numeric label column
    def _num(v):
        try:
            if isinstance(v, bool):
                return None
            return float(v)
        except (TypeError, ValueError):
            return None
    num_col = label_col = None
    for h in headers:
        vals = [r.get(h) for r in rows]
        nums = [_num(v) for v in vals]
        if all(n is not None for n in nums):
            if num_col is None:
                num_col = h
        elif label_col is None:
            label_col = h
    if not num_col or not label_col:
        return ""
    data = [(_fmt_cell(r.get(label_col)), _num(r.get(num_col))) for r in rows]
    data = [(lbl, val) for lbl, val in data if val is not None][:20]
    if len(data) < 2:
        return ""
    # A "bar chart by X" implies one bar per distinct X. If the label column
    # repeats (e.g. several rows all naming the same country, because the
    # query actually grouped by something else like city), this isn't a real
    # one-row-per-category aggregate -- charting it anyway just draws the same
    # label N times at the same value, which looks like real data but says
    # nothing. Seen directly: a "Country Population by Country" chart with
    # "United States" repeated 6 times at 342,000,000, once per matching city.
    if len({lbl for lbl, _ in data}) < len(data):
        return ""
    from charts import bar_chart
    title = f"{num_col.replace('_', ' ').title()} by {label_col.replace('_', ' ').title()}"
    return f'<div class="card">{bar_chart(data, title=title)}</div>'


def _fmt_cell(val):
    """Format one value for display in a results-table cell: unwrap lists to a
    comma-joined string, show missing values as an em dash, and strip the
    JSON/Python list noise (['NSCLC'], ["x"], None) that otherwise leaks into
    the UI as raw repr."""
    if val is None:
        return "—"  # em dash
    if isinstance(val, (list, tuple)):
        parts = [_fmt_cell(v) for v in val if v is not None and str(v).strip()]
        parts = [p for p in parts if p != "—"]
        return ", ".join(parts) if parts else "—"
    s = str(val).strip()
    if not s or s.lower() in ("none", "null", "[none]", "[]", "{}"):
        return "—"
    # JSON-ish array text, e.g. ["NSCLC","SCLC"] or ['NSCLC'] -> NSCLC, SCLC
    if len(s) >= 2 and s[0] in "[{" and s[-1] in "]}":
        inner = s[1:-1]
        cleaned = [t.strip().strip('\'"') for t in inner.split(",")]
        cleaned = [t for t in cleaned if t and t.lower() not in ("none", "null")]
        return ", ".join(cleaned) if cleaned else "—"
    return s


def to_plain(obj):
    """Make RealDictRow / date / etc. JSON-serialisable and plain."""
    if isinstance(obj, dict):
        return {k: to_plain(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [to_plain(v) for v in obj]
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    import decimal
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    return obj


def _plain_text(html_str):
    """Strip HTML tags to plain text (for API responses / smalltalk replies)."""
    if not html_str:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_str)
    text = html.unescape(text)
    return re.sub(r"[ \t]+", " ", text).strip()


def _answer_trial_ids(resp, limit=200):
    """oncosuite_ids an answer is about, for the chart pipeline.

    Charts are built from the trials the answer actually covers, so the front-end
    sends these back to POST /api/charts. Tool results carry ids in several
    shapes depending on the tool (a single detail id, `results` rows, `rows`
    rows), so check each and de-duplicate while preserving order.
    """
    tr = resp.get("tool_result") or {}
    if not isinstance(tr, dict):
        return []

    found = []
    single = tr.get("oncosuite_id")
    if single:
        found.append(single)
    for key in ("results", "rows", "cohorts", "trials"):
        for row in (tr.get(key) or []):
            if isinstance(row, dict) and row.get("oncosuite_id"):
                found.append(row["oncosuite_id"])

    seen, out = set(), []
    for i in found:
        i = str(i)
        if i not in seen:
            seen.add(i)
            out.append(i)
            if len(out) >= limit:
                break
    return out


def _api_result(question, resp):
    """Build the structured JSON payload for POST /api/ask from a handle_turn response.
    Exposes the useful data (answer text, source trials, rows, sql) but NO HTML and NO
    internal trace metadata (scores, internal ids beyond trial references)."""
    tr = resp.get("tool_result") or {}
    synthesis = resp.get("synthesis") or {}
    answer = _strip_trace_metadata(synthesis.get("text") or "")

    out = {
        "question": question,
        "answer": answer,
        # a coarse, non-leaky category so callers can branch (not internal routing labels)
        "type": {
            "text_to_sql": "data_query",
            "semantic_search": "semantic",
            "agentic": "multi_step",
            "general_knowledge": "general_knowledge",
        }.get(resp.get("response_mode"), "structured"),
    }

    # source trials, when the result carries them (search / landscape / RAG)
    trials = []
    for r in (tr.get("results") or []):
        trials.append({k: r.get(k) for k in ("nct_id", "title", "phase", "status", "sponsor")
                       if r.get(k) is not None})
    for h in (tr.get("vector_results") or []):
        if h.get("ref_id"):
            trials.append({"trial_id": h["ref_id"]})
    for s in (tr.get("sample_trials") or []):
        trials.append({k: s.get(k) for k in ("official_title", "sponsor_type", "status")
                       if s.get(k) is not None})
    if trials:
        out["trials"] = to_plain(trials)

    # tabular rows + sql for the data-query path
    if tr.get("rows"):
        out["rows"] = to_plain(tr["rows"])
    if resp.get("sql") or tr.get("sql"):
        out["sql"] = resp.get("sql") or tr.get("sql")
    if tr.get("total_matches") is not None:
        out["total_matches"] = tr["total_matches"]

    return out


def esc(v):
    return html.escape(str(v)) if v is not None else "&mdash;"


def render_criteria_block(title, crit):
    """Eligibility criteria come as a dict of {category: value|list}. Render as grouped bullets."""
    if not crit:
        return ""
    rows = []
    for key, val in crit.items():
        if isinstance(val, list):
            items = [x for x in val if x and str(x) != "Not Specified"]
            if not items:
                continue
            val_html = ", ".join(esc(x) for x in items)
        else:
            if not val or str(val) == "Not Specified":
                continue
            val_html = esc(val)
        rows.append(f'<div class="crit-row"><span class="crit-key">{esc(key)}</span>'
                    f'<span class="crit-val">{val_html}</span></div>')
    if not rows:
        return ""
    return f'<div class="crit-block"><h4>{esc(title)}</h4>{"".join(rows)}</div>'


# ---------- per-response-mode renderers ----------

# Map keyword(s) in the question -> (label, how to pull the value from the trial dict).
# First match wins. Lets a specific question get a specific, highlighted answer.
DIRECT_FIELDS = [
    (("enrollment", "how many patient", "how many people", "sample size"),
     "Enrollment count", lambda t: t.get("enrollment_count")),
    (("phase",), "Phase", lambda t: t.get("trial_phase")),
    (("status", "recruiting", "still open", "active"),
     "Study status", lambda t: t.get("study_status")),
    (("sponsor", "who is running", "who runs", "funded by", "company"),
     "Sponsor", lambda t: t.get("sponsor_name")),
    (("start date", "when did it start", "start"),
     "Start date", lambda t: t.get("start_date")),
    (("completion", "when does it end", "end date", "finish"),
     "Primary completion date", lambda t: t.get("primary_completion_date")),
    (("design", "randomized", "randomised", "blinded"),
     "Study design", lambda t: t.get("study_design")),
    (("title", "official name", "full name"),
     "Official title", lambda t: t.get("official_title")),
    # FIX (found via real usage): bare "nct" as a keyword collided with the NCT
    # number itself -- "what is the purpose of NCT06881784" contains "nct" as a
    # substring of "NCT06881784", so EVERY question naming a trial by its NCT id
    # was hijacked into "here's the NCT id" instead of answering what was asked.
    # Require an actual request for the id (a real phrase), not just its presence.
    (("nct id", "nct number", "which nct", "what nct", "clinicaltrials", "link", "url"),
     "NCT id", lambda t: t.get("nct_id")),
    (("type",), "Study type", lambda t: t.get("study_type")),
]


def render_direct_answer(question, tr):
    """If the question asks about ONE specific attribute, surface it up top."""
    if not tr or tr.get("error"):
        return ""
    q = (question or "").lower()

    # NOTE: eligibility questions used to get a full inclusion/exclusion dump here too.
    # render_trial_detail() now scopes its cohort section to the question (see
    # _detail_focus) and shows the same criteria blocks there -- printing them a second
    # time here would just duplicate the exact same tables the LLM synthesis paragraph
    # (above this whole function's output) has already covered as well.

    # NOTE: broad "tell me about X" / "summary" / "purpose" questions used to get a
    # hand-built sentence here. Every single_trial_lookup now always escalates to
    # synthesis.py's Executive Summary (see router.ALWAYS_ESCALATE_INTENTS), which
    # covers the exact same narrative -- render_answer() puts it above this function's
    # output, so repeating it here would just print the same sentence twice.

    def _banner(label, val, sub=None):
        sub = sub if sub is not None else f'for {esc(tr.get("nct_id"))}'
        return (f'<div class="answer"><span class="answer-lbl">{esc(label)}</span>'
                f'<span class="answer-val">{esc(val)}</span>'
                f'<span class="answer-sub">{sub}</span></div>')

    def _arm_sum(key):
        return sum(len(a.get(key) or [])
                   for c in tr.get("cohorts", []) for a in c.get("arms", []))

    # --- structured-detail questions: headline value/count, point to section below ---
    if any(w in q for w in ("patient population", "population characteristic", "population",
                            "demographic", "baseline characteristic")):
        pop_count = _arm_sum("population_characteristics")
        if pop_count:
            return _banner("Patient population", f"{pop_count} characteristics recorded",
                           "see the arm sections below")
        return _banner("Patient population", "Not recorded for this trial")
    if any(w in q for w in ("adverse event", "side effect", "toxicity", "safety")):
        ae_count = _arm_sum("adverse_events")
        safety_count = _arm_sum("safety")
        if ae_count or safety_count:
            return _banner("Adverse events & safety",
                           f"{ae_count} adverse-event rows, {safety_count} safety rows",
                           "see the arm sections below")
        return _banner("Adverse events & safety", "Not recorded for this trial")
    if any(w in q for w in ("hazard ratio", "hazard-ratio", " hr ", "p-value", "p value",
                            "confidence interval", "conf interval", " ci ")):
        hr_count = sum(len(e.get("hazard_ratios") or []) for e in tr.get("endpoints", []))
        if hr_count:
            return _banner("Hazard ratios", f"{hr_count} recorded",
                           "see Endpoints & Outcomes below")
        return _banner("Hazard ratios", "Not recorded for this trial")
    if any(w in q for w in ("orr", "pfs", " os ", "overall survival", "response rate",
                            "endpoint", "outcome", "efficacy", "progression")):
        eps = tr.get("endpoints", [])
        if eps:
            names = ", ".join(e.get("endpoint_abbreviation") or e.get("endpoint_name") or "?"
                              for e in eps[:5])
            return _banner("Endpoints & outcomes", f"{len(eps)} endpoints",
                           f"{esc(names)} &middot; see section below")
        return _banner("Endpoints & outcomes", "Not recorded for this trial")
    if any(w in q for w in ("contact", "email", "phone", "who do i contact", "reach out")):
        contacts = tr.get("contacts") or []
        if contacts:
            first = contacts[0]
            headline = first.get("email") or first.get("phone") or first.get("name") or "see below"
            return _banner("Contact", headline,
                           f"{len(contacts)} contact(s) &middot; see Contacts below")
        return _banner("Contact", "Not recorded for this trial")
    if any(w in q for w in ("ranking", "score")):
        rk = tr.get("ranking")
        if rk and rk.get("ranking_score") is not None:
            return _banner("Trial ranking", rk.get("ranking_score"))
        return _banner("Trial ranking", "Not recorded for this trial")
    if any(w in q for w in ("summary", "overview")):
        if tr.get("summary"):
            return _banner("Summary", "Available", "see Summary section below")
        return _banner("Summary", "Not recorded for this trial")

    # location has its own dedicated block (countries + sites); give a count banner
    if any(w in q for w in ("location", "where", "site", "countr", "performed", "conducted", "cities", "hospital")):
        loc = tr.get("locations") or {}
        if loc.get("total_sites"):
            top = ", ".join(f'{r["country"]} ({r["site_count"]})' for r in loc.get("by_country", [])[:5])
            val = f'{loc["total_sites"]} sites across {loc["total_countries"]} countries'
            return (f'<div class="answer"><span class="answer-lbl">Trial locations</span>'
                    f'<span class="answer-val">{esc(val)}</span>'
                    f'<span class="answer-sub">Top: {esc(top)} &middot; for {esc(tr.get("nct_id"))}</span></div>')
        return (f'<div class="answer"><span class="answer-lbl">Trial locations</span>'
                f'<span class="answer-val">No sites recorded</span>'
                f'<span class="answer-sub">for {esc(tr.get("nct_id"))}</span></div>')
    for keywords, label, getter in DIRECT_FIELDS:
        if any(k in q for k in keywords):
            val = getter(tr)
            if val in (None, "", []):
                val = "Not recorded for this trial"
            return (f'<div class="answer"><span class="answer-lbl">{esc(label)}</span>'
                    f'<span class="answer-val">{esc(val)}</span>'
                    f'<span class="answer-sub">for {esc(tr.get("nct_id"))}</span></div>')
    return ""


def render_locations(loc):
    if not loc or not loc.get("total_sites"):
        return ""
    from charts import bar_chart
    country_data = [(r["country"], r["site_count"]) for r in loc.get("by_country", [])[:12]]
    chart_html = bar_chart(country_data, title="Sites by country", value_suffix=" sites")
    by_country = "".join(
        f'<tr><td>{esc(r["country"])}</td><td>{esc(r["site_count"])}</td></tr>'
        for r in loc.get("by_country", [])
    )
    sites = "".join(
        f'<tr><td>{esc(f["name"])}</td><td>{esc(f["city"])}</td>'
        f'<td>{esc(f["state"])}</td><td>{esc(f["country"])}</td></tr>'
        for f in loc.get("facilities", [])
    )
    return (
        '<div class="card"><h3>Locations</h3>'
        f'<p class="count">{loc["total_sites"]} sites across {loc["total_countries"]} countries</p>'
        f'{chart_html}'
        '<h4>By country</h4>'
        f'<table><thead><tr><th>Country</th><th>Sites</th></tr></thead><tbody>{by_country}</tbody></table>'
        '<h4>All sites</h4>'
        '<div style="max-height:340px; overflow:auto;">'
        f'<table><thead><tr><th>Facility</th><th>City</th><th>State</th><th>Country</th></tr></thead>'
        f'<tbody>{sites}</tbody></table></div>'
        '</div>'
    )


def _leading_number(val):
    """Pull the first numeric value out of a result string like '45.2%' or
    '12.3 months (95% CI ...)' -> 45.2 / 12.3. Returns None if no number found,
    so non-numeric results (e.g. 'Not reached') simply skip the chart."""
    if val is None:
        return None
    m = re.search(r"-?\d+(?:\.\d+)?", str(val))
    return float(m.group(0)) if m else None


def render_endpoints(endpoints):
    if not endpoints:
        return ""
    from charts import bar_chart
    blocks = []
    for ep in endpoints:
        head = esc(ep.get("endpoint_name"))
        meta = " &middot; ".join(
            esc(x) for x in (ep.get("endpoint_type"), ep.get("endpoint_abbreviation")) if x
        )
        block = [f'<div class="arm"><strong>{head}</strong>']
        if meta:
            block.append(f' <span class="pill">{meta}</span>')
        results = ep.get("results") or []
        if results:
            # Chart the per-arm values when they're numeric so arms can be compared
            # at a glance (e.g. ORR % or median PFS by arm). Falls back to just the
            # table when the values aren't numbers ("Not reached", text, etc.).
            chart_data = []
            for r in results:
                raw = r.get("value") or r.get("value_and_evaluator")
                num = _leading_number(raw)
                if num is not None:
                    chart_data.append((r.get("arm_id") or "Arm", num))
            chart_html = (bar_chart(chart_data, title=f"{ep.get('endpoint_abbreviation') or 'Result'} by arm")
                          if len(chart_data) >= 2 else "")
            rows = "".join(
                f'<tr><td>{esc(r.get("arm_id"))}</td>'
                f'<td>{esc(r.get("value") or r.get("value_and_evaluator"))}</td></tr>'
                for r in results
            )
            block.append(f'<h4>Results</h4>{chart_html}'
                         '<table><thead><tr><th>Arm</th><th>Value</th></tr></thead>'
                         f'<tbody>{rows}</tbody></table>')
        hrs = ep.get("hazard_ratios") or []
        if hrs:
            rows = "".join(
                f'<tr><td>{esc(h.get("arm_comparison"))}</td>'
                f'<td>{esc(h.get("hr_value_and_range"))}</td>'
                f'<td>{esc(h.get("hr_ci"))}</td>'
                f'<td>{esc(h.get("p_value"))}</td></tr>'
                for h in hrs
            )
            block.append('<h4>Hazard ratios</h4>'
                         '<table><thead><tr><th>Comparison</th><th>HR</th>'
                         '<th>CI</th><th>p-value</th></tr></thead>'
                         f'<tbody>{rows}</tbody></table>')
        block.append('</div>')
        blocks.append("".join(block))
    return '<div class="card"><h3>Endpoints &amp; Outcomes</h3>' + "".join(blocks) + '</div>'


def render_endpoints_and_outcomes(tr):
    """Deterministic render for get_endpoints_and_outcomes (the outcome_deep_dive
    tool) -- this used to fall through to the generic pretty-printed-JSON
    fallback below, the one place in the app where a real answer reached the
    user as an un-narrated data dump. A lead sentence states how many
    endpoints have a posted value vs are listed with none, so the reader
    knows what this table does before reading it -- an endpoint with no
    outcomes shown is the DATA being sparse, not a value being hidden."""
    endpoints = (tr or {}).get("endpoints") or []
    if not endpoints:
        return '<div class="card warn"><p>No endpoints are defined for this trial.</p></div>'

    with_values = sum(1 for ep in endpoints if ep.get("outcomes"))
    lead = (
        f'<p class="answer-sub">Found <strong>{len(endpoints)}</strong> endpoint(s) defined for '
        f'this trial; <strong>{with_values}</strong> {"has" if with_values == 1 else "have"} a posted '
        'outcome value below. The rest are listed for completeness -- no value has been posted for '
        'them yet, not because one was hidden.</p>'
    )

    cards = []
    for ep in endpoints:
        head = esc(ep.get("endpoint_name"))
        meta = " &middot; ".join(
            esc(x) for x in (ep.get("endpoint_type"), ep.get("endpoint_abbreviation")) if x
        )
        block = [f'<div class="arm"><strong>{head}</strong>']
        if meta:
            block.append(f' <span class="pill">{meta}</span>')
        outcomes = ep.get("outcomes") or []
        if outcomes:
            rows = "".join(
                f'<tr><td>{esc(o.get("arm_name") or o.get("arm_id"))}</td>'
                f'<td>{esc(o.get("value") if o.get("value") is not None else o.get("value_and_evaluator"))}</td></tr>'
                for o in outcomes
            )
            block.append('<table><thead><tr><th>Arm</th><th>Value</th></tr></thead>'
                        f'<tbody>{rows}</tbody></table>')
        else:
            block.append('<p class="muted">No outcome value posted yet for this endpoint.</p>')
        block.append('</div>')
        cards.append("".join(block))

    # Every endpoint carries the same _caveat text (see get_endpoints_and_outcomes.py)
    # -- show it once at the end, not once per endpoint.
    caveat = next((ep.get("_caveat") for ep in endpoints if ep.get("_caveat")), None)
    caveat_html = (f'<p class="muted" style="margin-top:8px;font-size:11px">{esc(caveat)}</p>'
                  if caveat else "")

    return '<div class="card">' + lead + "".join(cards) + caveat_html + '</div>'


def render_arm_clinical(arm):
    """Adverse events, safety, and population characteristics tables for one arm."""
    out = []
    aes = arm.get("adverse_events") or []
    if aes:
        from charts import grouped_bar_chart
        # top AEs by all_grades count -- chart the highest-burden events, table has the rest
        top_aes = sorted(aes, key=lambda a: a.get("all_grades") or 0, reverse=True)[:10]
        chart_data = [(a.get("name_and_organ"), [a.get("all_grades") or 0, a.get("grade_3_4") or 0])
                      for a in top_aes]
        chart_html = grouped_bar_chart(chart_data, ["All grades", "Grade 3-4"],
                                       title=f"Top adverse events \u2014 {esc(arm.get('arm_name', ''))}")
        rows = "".join(
            f'<tr><td>{esc(a.get("name_and_organ"))}</td>'
            f'<td>{esc(a.get("all_grades"))}</td><td>{esc(a.get("grade_3_4"))}</td></tr>'
            for a in aes
        )
        out.append(f'<h4>Adverse events</h4>{chart_html}'
                   '<table><thead><tr><th>Event / organ</th><th>All grades</th>'
                   f'<th>Grade 3-4</th></tr></thead><tbody>{rows}</tbody></table>')
    safety = arm.get("safety") or []
    if safety:
        rows = "".join(
            f'<tr><td>{esc(s.get("safety_title"))}</td>'
            f'<td>{esc(s.get("safety_name"))}</td><td>{esc(s.get("value"))}</td></tr>'
            for s in safety
        )
        out.append('<h4>Safety</h4>'
                   '<table><thead><tr><th>Title</th><th>Name</th><th>Value</th></tr></thead>'
                   f'<tbody>{rows}</tbody></table>')
    pop = arm.get("population_characteristics") or []
    if pop:
        rows = "".join(
            f'<tr><td>{esc(p.get("characteristics"))}</td>'
            f'<td>{esc(p.get("evaluator"))}</td><td>{esc(p.get("value"))}</td></tr>'
            for p in pop
        )
        out.append('<h4>Population characteristics</h4>'
                   '<table><thead><tr><th>Characteristic</th><th>Evaluator</th>'
                   f'<th>Value</th></tr></thead><tbody>{rows}</tbody></table>')
    return "".join(out)


def render_contacts(contacts):
    if not contacts:
        return ""
    rows = "".join(
        f'<tr><td>{esc(c.get("name"))}</td><td>{esc(c.get("role"))}</td>'
        f'<td>{esc(c.get("email"))}</td><td>{esc(c.get("phone"))}</td>'
        f'<td>{esc(c.get("affiliation"))}</td></tr>'
        for c in contacts
    )
    return ('<div class="card"><h3>Contacts</h3>'
            '<table><thead><tr><th>Name</th><th>Role</th><th>Email</th>'
            f'<th>Phone</th><th>Affiliation</th></tr></thead><tbody>{rows}</tbody></table></div>')


def render_ranking(ranking):
    if not ranking or ranking.get("ranking_score") is None:
        return ""
    return (f'<div class="card"><h3>Trial ranking</h3>'
            f'<p><span class="lbl">Ranking score</span>{esc(ranking.get("ranking_score"))}</p></div>')


FOCUS_KEYWORDS = {
    "eligibility": ("eligib", "criteria", "inclusion", "exclusion", "who can join",
                    "who is eligible", "enrollment criteria"),
    "safety": ("adverse event", "side effect", "toxicity", "safety"),
    "population": ("patient population", "population characteristic", "population",
                   "demographic", "baseline characteristic"),
    "endpoints": ("hazard ratio", "hazard-ratio", " hr ", "p-value", "p value",
                 "confidence interval", "conf interval", " ci ", "orr", "pfs", " os ",
                 "overall survival", "response rate", "endpoint", "outcome", "efficacy",
                 "progression"),
    "contacts": ("contact", "email", "phone", "who do i contact", "reach out"),
    "ranking": ("ranking", "score"),
    "locations": ("location", "where", "site", "countr", "performed", "conducted",
                 "cities", "hospital"),
}
BROAD_DETAIL_KEYWORDS = ("tell me about", "what is this trial", "overview", "summary",
                         "describe", "purpose", "what is nct", "about nct")


def _detail_focus(question):
    """Which structured sections (below the paragraph answer + overview card) should
    render, based on what the question actually asked. Returns None for a broad "tell me
    about X" (show every section), otherwise the set of matching focus keys -- possibly
    empty, for a narrow single-attribute question (e.g. "what phase is X") that needs
    nothing beyond the overview card. Without this, every question -- however narrow --
    used to dump all sites, every arm's full adverse-event table, every endpoint, contacts,
    and ranking, regardless of what was actually asked."""
    q = (question or "").lower()
    if any(w in q for w in BROAD_DETAIL_KEYWORDS):
        return None
    return {key for key, words in FOCUS_KEYWORDS.items() if any(w in q for w in words)}


def render_trial_detail(tr, question=""):
    if tr.get("error"):
        return f'<div class="card error">{esc(tr["error"])}</div>'
    direct = render_direct_answer(question, tr)
    focus = _detail_focus(question)
    show_all = focus is None
    want = lambda key: show_all or key in focus  # noqa: E731

    q = (question or "").lower()
    # When the user names a single side of eligibility ("exclusion criteria"),
    # show only that side -- not both. Only render both when neither is named
    # (a plain "eligibility criteria" question) or on a broad "tell me about".
    # Match loosely so common typos still resolve to the right side --
    # "exusion"/"exlusion"/"excl" -> exclusion, "inclu"/"includ" -> inclusion.
    said_excl = any(w in q for w in ("exclus", "exclu", "exlus", "exusion", "excl", "exus"))
    said_incl = any(w in q for w in ("inclus", "inclu", "includ", "incl"))
    if said_excl and not said_incl:
        want_incl, want_excl = show_all, True
    elif said_incl and not said_excl:
        want_incl, want_excl = True, show_all
    else:
        want_incl = want_excl = True  # neither/both named -> show both

    # The full overview card (title/sponsor/dates/design/link) is only useful for a
    # broad "tell me about" question. For a focused question the synthesis already
    # states the trial context, so this card is just noise -- skip it.
    parts = []
    if show_all:
        parts += [
            '<div class="card">',
            f'<div class="tag">{esc(tr.get("trial_phase"))} &middot; {esc(tr.get("study_status"))}</div>',
            f'<h2>{esc(tr.get("nct_id"))}</h2>',
            f'<p class="title">{esc(tr.get("official_title"))}</p>',
            '<div class="grid">',
            f'<div><span class="lbl">Sponsor</span>{esc(tr.get("sponsor_name"))}</div>',
            f'<div><span class="lbl">Enrollment</span>{esc(tr.get("enrollment_count"))}</div>',
            f'<div><span class="lbl">Start</span>{esc(tr.get("start_date"))}</div>',
            f'<div><span class="lbl">Primary completion</span>{esc(tr.get("primary_completion_date"))}</div>',
            f'<div><span class="lbl">Design</span>{esc(tr.get("study_design"))}</div>',
            f'<div><span class="lbl">Type</span>{esc(tr.get("study_type"))}</div>',
            '</div>',
        ]
        if tr.get("nct_link"):
            parts.append(f'<p><a href="{esc(tr["nct_link"])}" target="_blank">View on ClinicalTrials.gov &rarr;</a></p>')
        parts.append('</div>')

    if want("locations"):
        parts.append(render_locations(tr.get("locations")))

    if want("eligibility") or want("safety") or want("population"):
        for c in tr.get("cohorts", []):
            parts.append('<div class="card">')
            parts.append(f'<h3>Cohort: {esc(c.get("cohort_name"))}</h3>')
            # The cohort demographics grid is context for a broad view; a focused
            # eligibility-side question doesn't need it, so only show it when broad.
            if show_all:
                parts.append('<div class="grid">')
                parts.append(f'<div><span class="lbl">Sex</span>{esc(c.get("sex"))}</div>')
                parts.append(f'<div><span class="lbl">Age</span>{esc(c.get("min_age"))} &ndash; {esc(c.get("max_age"))}</div>')
                parts.append(f'<div><span class="lbl">Histology</span>{esc(", ".join(c.get("histology") or []) or None)}</div>')
                parts.append(f'<div><span class="lbl">Biomarkers</span>{esc(", ".join(c.get("biomarkers") or []) or None)}</div>')
                parts.append('</div>')

            if want("eligibility"):
                if want_incl:
                    parts.append(render_criteria_block("Inclusion criteria", c.get("eligibility_inclusion_criteria")))
                if want_excl:
                    parts.append(render_criteria_block("Exclusion criteria", c.get("eligibility_exclusion_criteria")))

            if want("safety") or want("population"):
                for arm in c.get("arms", []):
                    drugs = ", ".join(
                        f'{t.get("drug_name")}'
                        + (f' {t["dosage_value"]}{t.get("dosage_unit") or ""}' if t.get("dosage_value") else "")
                        for t in arm.get("treatments", [])
                    )
                    parts.append(
                        f'<div class="arm"><strong>{esc(arm.get("arm_name"))}</strong> '
                        f'<span class="pill">{esc(arm.get("arm_type"))}</span>'
                        f'<div class="arm-desc">{esc(arm.get("arm_description"))}</div>'
                        f'<div class="arm-drug">Treatment: {esc(drugs or None)}</div>'
                        f'{render_arm_clinical(arm)}</div>'
                    )
            parts.append('</div>')

    if want("endpoints"):
        parts.append(render_endpoints(tr.get("endpoints")))
    if want("contacts"):
        parts.append(render_contacts(tr.get("contacts")))
    if want("ranking"):
        parts.append(render_ranking(tr.get("ranking")))
    return direct + "".join(parts)


def render_search_results(tr):
    results = tr.get("results", [])
    if not results:
        return '<div class="card">No matching trials.</div>'
    head = f'<p class="count">{tr.get("total_matches", len(results))} match(es), showing {len(results)}</p>'

    chart_html = ""
    if len(results) > 1:
        from charts import donut_chart
        phase_counts = {}
        for r in results:
            key = r.get("phase") or "Unknown"
            phase_counts[key] = phase_counts.get(key, 0) + 1
        if len(phase_counts) > 1:
            # phase breakdown is a share-of-the-whole -> donut reads more naturally
            # than bars (each slice is "what fraction of matches is this phase").
            chart_data = sorted(phase_counts.items(), key=lambda kv: -kv[1])
            chart_html = (f'<div class="card">'
                         f'{donut_chart(chart_data, title="Matches by phase", value_suffix=" trials")}'
                         f'</div>')

    # The actual matched trials -- previously only the count and phase donut
    # above were rendered, so a search answer never showed which trials it
    # actually found. NCT id is left as plain text so linkify_trial_ids (run
    # over the whole html block) wraps it into the same clickable
    # trial-detail-drawer button every other trial id in an answer gets.
    rows = ['<div class="table-wrap"><table class="data-table"><thead><tr>'
            '<th>Trial</th><th>Title</th><th>Sponsor</th><th>Phase</th>'
            '<th>Status</th></tr></thead><tbody>']
    for r in results:
        ident = r.get("nct_id") or r.get("oncosuite_id") or ""
        rows.append(
            f'<tr><td>{esc(ident)}</td>'
            f'<td>{esc(r.get("title"))}</td>'
            f'<td>{esc(r.get("sponsor"))}</td>'
            f'<td>{esc(r.get("phase"))}</td>'
            f'<td>{esc(r.get("status"))}</td></tr>'
        )
    rows.append("</tbody></table></div>")

    return head + chart_html + "".join(rows)


def render_compare_arms(tr):
    """Render the arm-comparison result. Handles the resolve-failure shapes
    (ambiguous_trial / no_trial_matched / could not resolve) as a clean, clickable
    candidate list instead of dumping raw JSON, and a real comparison otherwise."""
    err = tr.get("error")
    if err:
        msg = esc(tr.get("message") or err)
        cands = tr.get("candidates") or []
        if not cands:
            return f'<div class="card warn"><p>{msg}</p></div>'
        items = []
        for c in cands:
            nct = c.get("nct_id") or c.get("oncosuite_id") or ""
            phase = f' &middot; {esc(c.get("phase"))}' if c.get("phase") else ""
            title = esc(c.get("title") or "")
            # Clicking re-asks the arm comparison scoped to this specific trial.
            # json.dumps gives a JS string literal; escape its double-quotes to
            # &quot; so they don't terminate the onclick="..." HTML attribute.
            reask = f"compare adverse events across the arms of {nct}"
            reask_js = json.dumps(reask).replace('"', "&quot;")
            items.append(
                '<div class="card" style="cursor:pointer" '
                f'onclick="ask({reask_js})">'
                f'<h3>{esc(nct)}<span class="tag">{phase}</span></h3>'
                f'<p class="title">{title}</p>'
                '<p class="muted">Click to compare this trial\'s arms</p>'
                '</div>'
            )
        return f'<div class="card warn"><p>{msg}</p></div>' + "".join(items)

    # Real comparison: let the synthesis prose carry the analysis; show a compact
    # arms table beneath it for reference.
    arms = tr.get("arms") or []
    if not arms:
        return '<div class="card">No arm data available for this trial.</div>'
    rows = ['<table class="data-table"><thead><tr><th>Arm</th><th>Type</th><th>Status</th></tr></thead><tbody>']
    for a in arms:
        rows.append(
            f'<tr><td>{esc(a.get("arm_name"))}</td>'
            f'<td>{esc(a.get("arm_type"))}</td>'
            f'<td>{esc(a.get("arm_status"))}</td></tr>'
        )
    rows.append("</tbody></table>")
    return f'<div class="card"><h3>Arms compared ({esc(tr.get("oncosuite_id"))})</h3>' + "".join(rows) + "</div>"


def _trial_chips(trial_ids):
    """Render trial IDs as clickable chips -- clicking asks for that trial's detail
    (source traceability: user can drill from an aggregate count to the actual trials)."""
    chips = []
    for tid in trial_ids:
        if not tid:
            continue
        reask = json.dumps(f"show trial {tid}").replace('"', "&quot;")
        chips.append(f'<a class="trial-chip" onclick="ask({reask})">{esc(tid)}</a>')
    return " ".join(chips)


def _classify_sponsor(sponsor_name):
    """Heuristic Industry vs Academic classification by sponsor NAME (no authoritative
    sponsor-type field exists in the schema). Mirrors search_trials' patterns."""
    if not sponsor_name:
        return "Unknown"
    from tools.search_trials import ACADEMIC_SPONSOR_PATTERNS
    s = sponsor_name.lower()
    return "Academic" if any(p in s for p in ACADEMIC_SPONSOR_PATTERNS) else "Industry"


def _render_source_trials_table(hits):
    """Replace the raw snippet cards with ONE clean summary table of the source trials:
    trial id (clickable), title, sponsor type, and enrollment status. Enriches each
    retrieved id from trial_info; falls back to the snippet if a row can't be found."""
    if not hits:
        return ""
    # unique ids in retrieval order
    ids, seen = [], set()
    for h in hits:
        tid = h.get("ref_id")
        if tid and tid not in seen:
            seen.add(tid)
            ids.append(tid)
    if not ids:
        return ""

    info = {}
    try:
        from db import query
        rows = query(
            "SELECT oncosuite_id, official_title, study_status, sponsor_name "
            "FROM oncosuite_gold.trial_info WHERE oncosuite_id = ANY(%(ids)s)",
            {"ids": ids},
        )
        info = {r["oncosuite_id"]: r for r in rows}
    except Exception:
        info = {}

    from charts import simple_table
    body = []
    snippet_by_id = {h.get("ref_id"): (h.get("snippet") or "") for h in hits}
    for tid in ids:
        r = info.get(tid)
        if r:
            title = r.get("official_title") or "—"
            status = r.get("study_status") or "—"
            sp_type = _classify_sponsor(r.get("sponsor_name"))
        else:
            # no DB row -> fall back to the snippet text, unknown status/type
            title = (snippet_by_id.get(tid) or "").replace("official title:", "").strip()[:120] or "—"
            status = "—"
            sp_type = "Unknown"
        body.append([_trial_chips([tid]), esc(title), esc(sp_type), esc(status)])

    table = simple_table(
        ["Trial", "Title", "Sponsor type", "Enrollment status"],
        body,
        title="Source trials",
        allow_html_cols={0},  # trial-id chip column is pre-rendered HTML
    )
    note = ('<p class="muted" style="margin-top:6px;font-size:11px">Sponsor type is a '
            'name-based estimate (Industry vs Academic); no authoritative sponsor-type '
            'field exists in the data. Click a trial id to open it.</p>')
    return table + note


def render_landscape(tr):
    if tr.get("error"):
        return f'<div class="card error">{esc(tr["error"])}</div>'

    from charts import bar_chart, simple_table

    # FIX (found while wiring in charts): this function was checking for
    # tr["rows"] / tr["results"], but get_competitive_landscape actually
    # returns {"groups": {dimension: [...]}, "outcome_averages": {...}}.
    # Every real landscape query was silently falling through to a raw JSON
    # dump below -- never actually rendered as a table or chart until now.
    groups = tr.get("groups") or {}
    outcome_avgs = tr.get("outcome_averages")
    blocks = []

    filters = tr.get("filters_applied") or {}
    filt_bits = [f"{k}: {', '.join(v)}" for k, v in filters.items() if v]
    scope = "; ".join(filt_bits) if filt_bits else "all trials in the database"
    # Always state WHAT the counts cover -- the client flagged that it wasn't clear
    # whether these are active/completed trials. Counts include ALL statuses unless
    # the user grouped/filtered by status.
    grouped_by_status = "study_status" in (groups or {})
    scope_note = (f'<p class="count">Scope &mdash; {esc(scope)}. '
                  f'Counts cover trials of <b>all statuses</b>'
                  f'{" (broken out below)" if grouped_by_status else " (recruiting, active, completed, terminated)"}. '
                  f'Click a trial id to open it.</p>')
    blocks.append(scope_note)

    for dimension, rows in groups.items():
        if not rows:
            continue
        count_key = "trial_count" if "trial_count" in rows[0] else "trial_drug_count"
        chart_data = [(r.get("group_key"), r.get(count_key)) for r in rows[:15]]
        chart_html = bar_chart(chart_data, title=f"Trial count by {dimension.replace('_', ' ')}",
                               value_suffix=" trials")
        table_html = simple_table(
            ["", dimension.replace("_", " ").title(), "Trials", "Example trials (click to open)"],
            [[i + 1, r.get("group_key"), r.get(count_key),
              _trial_chips((r.get("example_trial_ids") or [])[:5])]
             for i, r in enumerate(rows)],
            allow_html_cols={3},  # last column contains clickable chip HTML
        )
        blocks.append(f'<div class="card"><h3>By {esc(dimension.replace("_", " "))}</h3>'
                      f'{chart_html}{table_html}</div>')

    if outcome_avgs and outcome_avgs.get("groups"):
        rows = outcome_avgs["groups"]
        # one chart per unit_category so percentages/counts/scores never get
        # visually blended together -- mirrors the real fix in Template C itself
        by_unit = {}
        for r in rows:
            by_unit.setdefault(r.get("unit_category"), []).append(r)
        for unit_cat, ucr in by_unit.items():
            chart_data = [(r.get("group_key"), r.get("avg_value")) for r in ucr[:15]]
            chart_html = bar_chart(chart_data, title=f"Average value \u2014 {unit_cat}")
            table_html = simple_table(
                ["Drug", "Trials", f"Avg ({unit_cat})", "# values"],
                [[r.get("group_key"), r.get("trial_count"), r.get("avg_value"), r.get("n_values")]
                 for r in ucr],
            )
            blocks.append(f'<div class="card"><h3>Outcome averages &mdash; {esc(unit_cat)}</h3>'
                          f'{chart_html}{table_html}</div>')
        if outcome_avgs.get("excluded_unclassified_count"):
            blocks.append(f'<p class="muted">{outcome_avgs["excluded_unclassified_count"]} value(s) '
                          f'excluded (couldn\'t classify the reported unit).</p>')
        if outcome_avgs.get("_note"):
            blocks.append(f'<p class="muted">{esc(outcome_avgs["_note"])}</p>')

    if tr.get("_caveat"):
        blocks.append(f'<p class="muted">{esc(tr["_caveat"])}</p>')

    if not blocks:
        return f'<div class="card">No landscape data found for these filters.</div>'
    return "".join(blocks)


def _available_values(field):
    """Fetch the real distinct values for a filter field from the DB, so a clarification
    can tell the user what the dataset actually covers instead of blaming their wording."""
    col_map = {
        "condition": ("cohort_info", "organ"),
        "biomarkers": ("cohort_info", "biomarkers"),  # array/jsonb -> handled below
    }
    tbl_col = col_map.get(field)
    if not tbl_col:
        return []
    tbl, col = tbl_col
    try:
        from db import query
        if field == "biomarkers":
            rows = query(f"SELECT DISTINCT jsonb_array_elements_text(biomarkers) AS v "
                         f"FROM oncosuite_gold.{tbl} WHERE biomarkers IS NOT NULL LIMIT 40")
        else:
            rows = query(f"SELECT DISTINCT {col} AS v FROM oncosuite_gold.{tbl} "
                         f"WHERE {col} IS NOT NULL ORDER BY 1 LIMIT 40")
        vals = []
        for r in rows:
            v = r.get("v")
            if isinstance(v, list):
                vals.extend(str(x) for x in v)
            elif v is not None:
                vals.append(str(v))
        return sorted(set(vals))
    except Exception:
        return []


def render_clarification(resp):
    terms = resp.get("unmatched_terms", [])
    blocks = []
    for t in terms:
        term = t.get("term")
        field = t.get("group")
        avail = _available_values(field)
        avail_html = ""
        if avail:
            shown = ", ".join(esc(a) for a in avail[:20])
            more = f" &hellip; (+{len(avail) - 20} more)" if len(avail) > 20 else ""
            avail_html = (f"<div class='muted' style='margin:2px 0 10px'>"
                          f"Available {esc(field)} values in this dataset: {shown}{more}</div>")
        blocks.append(f"<li><b>{esc(term)}</b> "
                      f"<span class='muted'>(field: {esc(field)})</span>{avail_html}</li>")
    return ('<div class="card warn"><h3>Not in this dataset</h3>'
            "<p>This assistant only covers the trials currently in the database. "
            "I couldn&rsquo;t find these in the data:</p>"
            f"<ul>{''.join(blocks)}</ul></div>")


_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
_ITALIC_RE = re.compile(r"\*(.+?)\*")


def _inline_md(s: str) -> str:
    """Escape, then convert inline **bold** and *italic* spans to <strong>/<em>. Models
    (DeepSeek/Claude/etc.) routinely bold/italicize a term mid-sentence or mid-table-cell,
    not just on whole header lines -- without this, those markers leaked into the page as
    literal asterisks. Bold is resolved first so a lone leftover "*" pair reads as italic."""
    escaped = _BOLD_RE.sub(r"<strong>\1</strong>", esc(s))
    return _ITALIC_RE.sub(r"<em>\1</em>", escaped)


_TRACE_LINE_RE = re.compile(
    r"^\s*(intent|tool|tool_name|response_mode|escalate|escalated|path|"
    r"backend|session_id|oncosuite_id|ref_id|score|similarity|cosine|embedding|"
    r"vector_results|filters_applied|ts_status)\s*[:=].*$",
    re.IGNORECASE,
)
_TRACE_INLINE_RE = re.compile(
    r"\b(score|similarity|cosine)\s*[:=]?\s*0?\.\d+\b", re.IGNORECASE
)


def _strip_trace_metadata(md: str) -> str:
    """GUARDRAIL (defense-in-depth): remove any internal trace/debug metadata the model
    may have echoed from its context before it reaches the user -- routing labels
    ('intent: semantic_search'), similarity scores ('score: 0.721'), raw response_mode /
    session ids, etc. Structured display (tables, chips) is produced by our own renderers,
    not by these lines, so stripping them never removes real answer content."""
    if not md:
        return md
    kept = []
    for line in md.split("\n"):
        if _TRACE_LINE_RE.match(line):
            continue
        line = _TRACE_INLINE_RE.sub("", line)
        kept.append(line)
    return "\n".join(kept)


def _plain_cell(cell: str) -> str:
    """Strip the inline markdown / HTML a table cell may carry so the CSV export
    holds the plain text the user sees, not the markup behind it."""
    s = re.sub(r"<[^>]+>", "", str(cell or ""))
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    # markdown links -> just the label
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"[_*`]", "", s)
    return s.strip()


def _table_dl_button(csv_rows: list, filename: str) -> str:
    """Toolbar with a Download CSV button carrying the table's data inline.

    The CSV is base64'd into a data attribute (same approach as the cohort table)
    so the download needs no extra round-trip and always matches what is shown."""
    import base64

    def cell(x):
        return '"' + str(x if x is not None else "").replace('"', '""') + '"'

    csv_text = "\n".join(",".join(cell(c) for c in row) for row in csv_rows)
    b64 = base64.b64encode(csv_text.encode("utf-8")).decode("ascii")
    return (f'<div class="tbl-toolbar">'
            f'<button class="dl-btn" data-csv="{b64}" data-name="{esc(filename)}">'
            f'&#10515; Download CSV</button></div>')


# Rows shown per page in a rendered answer table. Long result sets (1,500+
# trials) are unusable as one scroll, so the markup carries every row and the
# front-end reveals one page at a time.
TABLE_PAGE_SIZE = 10


def _table_pager(pages: int, total_rows: int) -> str:
    """Prev / 1 2 3 … N / Next control beneath a paginated table.

    Page buttons are emitted for the first three and the last page with an
    ellipsis between, so the control stays narrow for very large tables. The
    front-end handles clicks (see the .tbl-pager delegate) -- no round-trip."""
    nums = list(range(1, pages + 1)) if pages <= 5 else [1, 2, 3, None, pages]
    buttons = []
    for n in nums:
        if n is None:
            buttons.append('<span class="pg-gap">&hellip;</span>')
        else:
            active = ' aria-current="page"' if n == 1 else ""
            buttons.append(f'<button class="pg-num" data-page="{n}"{active}>{n}</button>')
    return (
        f'<div class="tbl-pager" data-pages="{pages}" data-page="1" '
        f'data-size="{TABLE_PAGE_SIZE}" data-total="{total_rows}">'
        '<button class="pg-prev" disabled>&lsaquo; Prev</button>'
        + "".join(buttons)
        + '<button class="pg-next">Next &rsaquo;</button>'
        '</div>'
    )


def render_markdown_lite(md: str) -> str:
    """Minimal, dependency-free markdown -> HTML for the subset synthesis.py and the LLM
    prompts ask for: bold headers (**Header** or "## Header"), pipe tables, bullet lines
    ("- " or "* "), inline **bold**, _italic notes_. Not a general markdown parser --
    deliberately narrow, matched to what we actually ask the model to produce."""
    md = _strip_trace_metadata(md)
    lines = md.split("\n")
    out = []
    table_buf = []
    in_list = False  # are we currently inside an open <ul>?

    def close_list():
        nonlocal in_list
        if in_list:
            out.append("</ul>")
            in_list = False

    def flush_table():
        if not table_buf:
            return
        rows = [r for r in table_buf if not set(r.strip()) <= set("|-: ")]
        if not rows:
            table_buf.clear()
            return
        head_cells = [c.strip() for c in rows[0].strip("|").split("|")]

        # Columns the reader can narrow with a header dropdown, kept to a short
        # known allowlist rather than every column -- a free-text column
        # (Trial title, Sponsor) has too many distinct values to be a useful
        # filter, just a long unusable checkbox list.
        filter_cols = {i for i, h in enumerate(head_cells)
                      if h.strip().lower() in ("phase", "status", "reported outcomes")}
        filter_values = {i: [] for i in filter_cols}  # first-seen order, deduped

        # Collect the raw (un-marked-up) cells alongside the rendered ones so the
        # Download CSV button exports exactly what the table shows.
        csv_rows = [head_cells]
        body_html = []
        for r in rows[1:]:
            cells = [c.strip() for c in r.strip("|").split("|")]
            # pad/truncate to header width so cells never spill or misalign
            while len(cells) < len(head_cells):
                cells.append("")
            cells = cells[:len(head_cells)]
            plain = [_plain_cell(c) for c in cells]
            csv_rows.append(plain)
            for i in filter_cols:
                if plain[i] and plain[i] not in filter_values[i]:
                    filter_values[i].append(plain[i])

            # data-page lets the front-end show one page at a time without
            # re-fetching; every row is present in the markup (and in the CSV
            # export), just hidden until its page is selected. data-f<i> carries
            # the plain value of each filterable column so the front-end can
            # match a row against the header dropdown's checked values.
            page_no = len(body_html) // TABLE_PAGE_SIZE + 1
            filter_attrs = "".join(f' data-f{i}="{esc(plain[i])}"' for i in filter_cols)
            body_html.append(
                f'<tr data-page="{page_no}"{filter_attrs}>'
                + "".join(f"<td>{_inline_md(c)}</td>" for c in cells)
                + "</tr>"
            )

        pages = max(1, (len(body_html) + TABLE_PAGE_SIZE - 1) // TABLE_PAGE_SIZE)

        def _th(i, label):
            if i not in filter_cols:
                return f"<th>{_inline_md(label)}</th>"
            opts = "".join(
                f'<label class="th-filter-row"><input type="checkbox" class="th-filter-val" '
                f'value="{esc(v)}" checked> {esc(v)}</label>'
                for v in filter_values[i]
            )
            return (
                f'<th class="th-filterable" data-filter-col="{i}">'
                f'<button type="button" class="th-filter-btn">{_inline_md(label)} '
                '<span class="th-filter-tri">&#9660;</span></button>'
                '<div class="th-filter-pop" hidden>'
                '<label class="th-filter-row th-filter-all">'
                '<input type="checkbox" class="th-filter-select-all" checked> Select All</label>'
                + opts +
                '</div></th>'
            )

        # Wrap the table in a horizontally-scrollable container so wide tables
        # (many columns / long cells) scroll instead of being cut off by the bubble.
        out.append('<div class="tbl-block"'
                   + (f' data-pages="{pages}"' if pages > 1 else "")
                   + ">"
                   + _table_dl_button(csv_rows, "table.csv")
                   + "<div class='table-wrap'><table class='data-table'><thead><tr>"
                   + "".join(_th(i, c) for i, c in enumerate(head_cells))
                   + "</tr></thead><tbody>")
        out.extend(body_html)
        if filter_cols:
            out.append(
                f'<tr class="no-match-row pg-hidden"><td colspan="{len(head_cells)}">'
                'No rows match the selected filters.</td></tr>'
            )
        out.append("</tbody></table></div>")
        if pages > 1:
            out.append(_table_pager(pages, len(body_html)))
        out.append("</div>")
        table_buf.clear()

    for line in lines:
        s = line.strip()
        if s.startswith("|"):
            close_list()
            table_buf.append(s)
            continue
        flush_table()
        if s.startswith("- ") or s.startswith("* "):
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{_inline_md(s[2:])}</li>")
            continue
        # any non-list line ends an open list
        close_list()
        if s.startswith("#"):
            out.append(f"<h4 class='synth-h'>{_inline_md(s.lstrip('#').strip())}</h4>")
        elif s.startswith("**") and s.endswith("**"):
            out.append(f"<h4 class='synth-h'>{_inline_md(s.strip('*'))}</h4>")
        elif s.startswith("_") and s.endswith("_") and len(s) > 1:
            out.append(f"<p class='muted'>{_inline_md(s.strip('_'))}</p>")
        elif len(s) >= 3 and set(s) <= set("-*_"):
            out.append('<hr class="synth-hr">')
        elif s:
            out.append(f"<p>{_inline_md(s)}</p>")
    flush_table()
    close_list()
    return "\n".join(out)


def render_cohort_list(syn: dict) -> str:
    """Interactive cohort table per the client's spec: a 'N cohorts within M
    trials' lead line, a scrollable table whose rows are CLICKABLE (each fires a
    follow-up query for that trial's executive summary), a CSV download button,
    Key Insights, and Next Steps. Built as first-class HTML (not markdown-lite)
    so rows can carry click handlers and the table can scroll + download."""
    if not syn or not syn.get("rows"):
        return ('<div class="card"><p>No cohorts matched this query.</p></div>')

    rows = syn["rows"]
    lead = render_markdown_lite(syn.get("lead", ""))

    # Rows: each is clickable. data-q holds the follow-up question the front-end
    # sends on click (asks for that specific trial's executive summary). The id
    # shown is the public NCT id when available, else the internal OncoSuite id.
    body = []
    for r in rows:
        ident = r.get("nct_id") or r.get("oncosuite_id") or ""
        follow = f"Give me the executive summary of trial {ident}"
        body.append(
            f'<tr class="cohort-row" data-q="{esc(follow)}" title="Click for this trial\'s executive summary">'
            f'<td class="cohort-id">{esc(ident)}</td>'
            f'<td>{esc(r.get("indication") or "—")}</td>'
            f'<td>{esc(r.get("regimen") or "—")}</td>'
            f'<td>{esc(r.get("phase") or "—")}</td>'
            f'<td>{esc(r.get("status") or "—")}</td>'
            f'</tr>'
        )

    # CSV for the download button, embedded as a data attribute (base64 avoids
    # quoting headaches). Built from the same rows shown -- no separate query.
    import base64
    csv_lines = ["OncoSuite/NCT ID,Indication,Regimen,Phase,Status"]
    for r in rows:
        def c(x): return '"' + str(x or "").replace('"', '""') + '"'
        csv_lines.append(",".join(c(r.get(k)) for k in
                                  ("nct_id", "indication", "regimen", "phase", "status")))
    csv_b64 = base64.b64encode("\n".join(csv_lines).encode("utf-8")).decode("ascii")

    # Excel companion for the same rows, with source-traceability comments on
    # Phase/Status/Indication -- CSV can't carry comments (requirement this is
    # answering), and this legacy page has no other export path. Reuses
    # oncosuite_gold.data_traceability directly via traceability.py, same as
    # the React CohortTable's Excel export in dashboard.py. Skipped entirely
    # (not a hard failure) if openpyxl is missing or the DB lookup errors --
    # the CSV button above must keep working regardless.
    xlsx_b64 = None
    try:
        from excel_export import build_xlsx
        from traceability import (
            format_comment, raw_trace_by_oncosuite_id, raw_trace_by_record_id,
            to_evidence_records,
        )

        oncosuite_ids = [r.get("oncosuite_id") for r in rows if r.get("oncosuite_id")]
        cohort_ids = [r.get("cohort_id") for r in rows if r.get("cohort_id")]

        # search_cohorts.py: phase comes from cohort_info.phase (not
        # trial_info.trial_phase), status from trial_info.study_status,
        # indication is composed from cohort_info's line_of_therapy /
        # biomarkers / histology / organ -- match that exact field mapping so
        # a comment never gets attached to the wrong source.
        trial_trace = raw_trace_by_oncosuite_id(oncosuite_ids, "trial_info", ["study_status"])
        cohort_trace = raw_trace_by_record_id(
            cohort_ids, "cohort_info",
            ["phase", "line_of_therapy", "biomarkers", "histology", "organ"],
        )

        xlsx_columns = [
            {"key": "id", "label": "OncoSuite / NCT ID"},
            {"key": "indication", "label": "Indication"},
            {"key": "regimen", "label": "Regimen"},
            {"key": "phase", "label": "Phase"},
            {"key": "status", "label": "Status"},
        ]
        xlsx_rows = []
        comments = {}
        evidence = {}
        for row_i, r in enumerate(rows):
            xlsx_rows.append({
                "id": r.get("nct_id") or r.get("oncosuite_id") or "",
                "indication": r.get("indication"),
                "regimen": r.get("regimen"),
                "phase": r.get("phase"),
                "status": r.get("status"),
            })
            cid, oid = r.get("cohort_id"), r.get("oncosuite_id")

            phase_rows = cohort_trace.get((cid, "phase"))
            if phase_rows:
                comments[(row_i, "phase")] = format_comment(phase_rows)
                evidence[(row_i, "phase")] = to_evidence_records(phase_rows, "Phase")

            status_rows = trial_trace.get((oid, "study_status"))
            if status_rows:
                comments[(row_i, "status")] = format_comment(status_rows)
                evidence[(row_i, "status")] = to_evidence_records(status_rows, "Status")

            ind_parts, ind_evidence = [], []
            for field, heading in (("line_of_therapy", "Line of therapy"),
                                    ("biomarkers", "Biomarkers"),
                                    ("histology", "Histology"),
                                    ("organ", "Organ")):
                field_rows = cohort_trace.get((cid, field))
                if field_rows:
                    ind_parts.append(f"{heading}:\n{format_comment(field_rows)}")
                    ind_evidence.extend(to_evidence_records(field_rows, heading))
            if ind_parts:
                comments[(row_i, "indication")] = "\n\n".join(ind_parts)
                evidence[(row_i, "indication")] = ind_evidence

        xlsx_b64 = base64.b64encode(
            build_xlsx(xlsx_columns, xlsx_rows, comments, evidence)
        ).decode("ascii")
    except Exception:
        xlsx_b64 = None

    xlsx_button = ""
    if xlsx_b64:
        xlsx_button = (
            f'<button class="dl-btn dl-btn-xlsx" data-xlsx="{xlsx_b64}" '
            f'data-name="cohorts.xlsx">⤓ Download Excel (with source notes)</button>'
        )

    insights = ""
    if syn.get("insights"):
        items = "".join(f"<li>{render_markdown_lite(i).replace('<p>','').replace('</p>','')}</li>"
                        for i in syn["insights"])
        insights = f'<div class="cohort-insights"><h4 class="synth-h">Key Insights</h4><ul>{items}</ul></div>'

    next_steps = ""
    if syn.get("next_steps"):
        items = "".join(f'<li><button class="nextstep" data-q="{esc(s)}">{esc(s)}</button></li>'
                        for s in syn["next_steps"])
        next_steps = f'<div class="cohort-next"><h4 class="synth-h">Next Steps</h4><ul class="nextsteps">{items}</ul></div>'

    return (
        '<div class="cohort-answer">'
        f'<div class="cohort-lead">{lead}</div>'
        '<div class="cohort-toolbar">'
        f'<button class="dl-btn" data-csv="{csv_b64}" data-name="cohorts.csv">⤓ Download CSV</button>'
        f'{xlsx_button}'
        '<span class="cohort-hint">Click any row for that trial\'s executive summary</span>'
        '</div>'
        '<div class="table-wrap cohort-wrap"><table class="data-table cohort-table"><thead><tr>'
        '<th>OncoSuite / NCT ID</th><th>Indication</th><th>Regimen</th><th>Phase</th><th>Status</th>'
        '</tr></thead><tbody>'
        + "".join(body) +
        '</tbody></table></div>'
        + insights + next_steps +
        '</div>'
    )


def render_synthesis(synthesis: dict) -> str:
    if not synthesis or not synthesis.get("text"):
        return ""
    mode = synthesis.get("mode")
    mode_label = "LLM-generated" if mode == "llm" else "computed directly from verified data, no LLM"
    return (
        '<div class="card" style="border-color:#2563eb;border-width:2px">'
        f'<div class="tag">Analysis \u2014 {esc(mode_label)}</div>'
        f'<div class="synth-body">{render_markdown_lite(synthesis["text"])}</div>'
        '</div>'
    )


# ---------- small talk / non-trial gate ----------
# The router classifies EVERY input as a trial query (a plain "hi" becomes a
# filtered_search over trials). For casual, non-trial messages we short-circuit
# with a friendly conversational reply instead of running a database search.

_GREETINGS = {"hi", "hii", "hiii", "hey", "heyy", "hello", "helloo", "yo", "hola",
              "hi there", "hey there", "good morning", "good afternoon", "good evening",
              "gm", "sup", "what's up", "whats up", "wassup"}
_THANKS = {"thanks", "thank you", "thankyou", "ty", "thx", "thank u", "appreciate it",
           "great", "nice", "cool", "awesome", "perfect", "ok", "okay", "got it"}
_BYES = {"bye", "goodbye", "see you", "see ya", "cya", "later", "good night", "gn"}
_HELP = {"help", "what can you do", "what can you do?", "who are you", "who are you?",
         "what are you", "how do you work", "what is this", "what do you do",
         "how can you help", "what should i ask"}


def smalltalk_reply(q):
    """Return conversational HTML for casual, non-trial messages, or None if the
    message looks like a real trial question and should go to the router."""
    s = q.strip().lower().rstrip("!.")
    if not s:
        return None

    def bubble(text):
        return f'<div class="synth-body"><p>{esc(text)}</p></div>'

    if s in _GREETINGS:
        return bubble("Hi! I'm the OncoSuite clinical-trial assistant. Ask me about a "
                      "trial — for example its eligibility criteria, endpoints, safety "
                      "data, or the competitive landscape for a drug or target. "
                      "Try: “Tell me about NCT06793215”.")
    if s in _THANKS:
        return bubble("You're welcome! Ask me anything else about a trial whenever you're ready.")
    if s in _BYES:
        return bubble("Goodbye! Come back anytime you need clinical-trial info.")
    if s in _HELP:
        return bubble("I answer questions about clinical trials from the oncosuite_gold "
                      "database. You can ask me things like: the eligibility (inclusion/exclusion) "
                      "criteria of a trial, its endpoints and outcomes, adverse events and safety, "
                      "locations, sponsor and enrollment, or a competitive landscape across a drug "
                      "or target. Just name a trial (e.g. NCT06793215) or describe what you're "
                      "looking for in plain English.")
    return None


def _replace_csv_with_full_rows(html: str, full_rows: list) -> str:
    """Swap the auto-embedded Download CSV data (built from only the visible
    page of a "show all" trial list) for one covering every matching trial, so
    the export isn't silently capped at whatever page happened to be on screen."""
    if not full_rows or "data-csv=" not in html:
        return html
    import base64

    def cell(x):
        return '"' + str(x if x is not None else "").replace('"', '""') + '"'

    header = ["#", "NCT ID", "Trial", "Phase", "Status", "Sponsor", "Enrollment"]
    csv_lines = [",".join(cell(h) for h in header)]
    for i, r in enumerate(full_rows, start=1):
        csv_lines.append(",".join(cell(v) for v in (
            i, r.get("nct_id") or "—", (r.get("title") or "")[:80], r.get("phase") or "—",
            r.get("status") or "—", r.get("sponsor") or "—", r.get("enrollment") or "—",
        )))
    b64 = base64.b64encode("\n".join(csv_lines).encode("utf-8")).decode("ascii")
    return re.sub(r'data-csv="[^"]*"', f'data-csv="{b64}"', html, count=1)


def render_answer(resp, question=""):
    mode = resp.get("response_mode")
    intent = resp.get("intent")
    tool = resp.get("tool_name")
    tr = resp.get("tool_result", {})

    # GUARDRAIL: never leak internal routing (intent/tool/escalation) to end users.
    # The debug banner is gated behind ONCOSUITE_DEBUG_BANNER=1 for developers only;
    # in normal (user-facing) operation it is empty.
    banner = ""
    if os.environ.get("ONCOSUITE_DEBUG_BANNER") == "1":
        banner = (f'<div class="meta">intent: <b>{esc(intent)}</b> &middot; tool: <b>{esc(tool)}</b>'
                  f' &middot; {"escalated (synthesis)" if resp.get("escalate") else "direct"}</div>')

    if mode == "clarification_needed":
        # DB doesn't have these exact terms -- show the honest "not in dataset" note.
        return banner + render_clarification(resp)
    if mode == "out_of_scope_policy_needed":
        return banner + ('<div class="card warn"><h3>Out of scope</h3>'
                         f'<p>{esc(resp.get("note"))}</p></div>')
    if mode == "greeting":
        return banner + render_synthesis(resp.get("synthesis"))
    if mode == "general_knowledge":
        # Nothing matched the database, so the model answered from its own
        # knowledge. render_synthesis already renders the disclaimer that
        # router.GENERAL_KNOWLEDGE_DISCLAIMER prepends to the text; the "warn"
        # card frames the whole answer as unverified so it can't be mistaken
        # for a figure that came out of the trial data.
        return (banner + '<div class="card warn">'
                + render_synthesis(resp.get("synthesis")) + '</div>')
    if mode == "cohort_list":
        return banner + render_cohort_list(resp.get("synthesis"))
    if mode == "agentic":
        # Multi-step LangGraph agent: the grounded answer, plus a collapsed trace
        # of the tool calls it made (transparency for a clinical tool).
        syn = render_synthesis(resp.get("synthesis"))
        steps = (tr or {}).get("steps") or []
        trace = ""
        if steps:
            items = "".join(
                f'<li>{esc(s.get("tool"))} <span class="muted">{esc(json.dumps(s.get("args", {})))}</span></li>'
                for s in steps
            )
            trace = (f'<details class="card"><summary class="muted" style="cursor:pointer">'
                     f'Reasoning steps ({len(steps)})</summary><ul>{items}</ul></details>')
        return banner + syn + trace
    if mode == "semantic_search":
        # RAG answer: the grounded summary, then a CLEAN SUMMARY TABLE of the source
        # trials (not raw snippets) -- one row per trial with sponsor type and
        # enrollment status. GUARDRAIL: no similarity scores or raw internal ids as
        # bare text; the trial id is shown as a clickable reference chip.
        syn = render_synthesis(resp.get("synthesis"))
        hits = (tr or {}).get("vector_results") or []
        table_html = _render_source_trials_table(hits)
        return banner + syn + table_html

    synthesis_html = render_synthesis(resp.get("synthesis"))
    full_rows = (resp.get("synthesis") or {}).get("full_rows")
    if full_rows:
        synthesis_html = _replace_csv_with_full_rows(synthesis_html, full_rows)

    if tool == "text_to_sql":
        # LLM-written-SQL fallback: the phrased answer, an auto-chart if the rows
        # look like a grouped aggregate (label + count), the raw rows as a table, and
        # the SQL. The auto-chart means aggregate answers get a bar chart here too --
        # not only via the landscape tool.
        rows = (tr or {}).get("rows") or []
        chart_html = ""
        table_html = ""
        if rows:
            from charts import simple_table
            headers = list(rows[0].keys())
            seen = set()
            body = []
            for r in rows[:200]:
                cells = tuple(_fmt_cell(r.get(h)) for h in headers)
                if cells in seen:
                    continue
                seen.add(cells)
                body.append(list(cells))
                if len(body) >= 100:
                    break
            chart_html = _auto_bar_chart(rows, headers)
            # Caption states this is the SAME rows the chart/answer above are
            # built from, not a second/different dataset -- otherwise a reader
            # has no way to tell whether the table is redundant with, or
            # contradicts, what came before it.
            table_title = "Every row behind the chart above" if chart_html else "Query results"
            table_html = f'<div class="card">{simple_table(headers, body, title=table_title)}</div>'
        sql = (tr or {}).get("sql")
        sql_html = (f'<details class="card"><summary class="muted" style="cursor:pointer">'
                    f'Show the SQL this answer was computed from</summary>'
                    f'<pre>{esc(sql)}</pre></details>') if sql else ""
        if not synthesis_html and not table_html:
            return banner + '<div class="card">I found no matching data for that question.</div>'
        # Answer text FIRST: it's the framing for the chart/table that follow, so
        # the reader knows what job each piece below is doing before seeing it,
        # rather than hitting a bare chart with no explanation of why it's there.
        return banner + synthesis_html + chart_html + table_html + sql_html

    if tool == "get_trial_detail":
        # Unresolvable id (e.g. a bad oncosuite id) -> show the plain message, not a
        # blank detail view.
        if (tr or {}).get("error") and not (tr or {}).get("oncosuite_id"):
            return banner + f'<div class="card warn"><p>{esc(tr["error"])}</p></div>'
        # If the user pasted an internal oncosuite id, lead with a note telling them
        # what they gave and the linked NCT id.
        id_note_html = ""
        if (tr or {}).get("id_note"):
            id_note_html = f'<div class="synth-body">{render_markdown_lite(tr["id_note"])}</div>'
        detail_html = render_trial_detail(tr, question)
        focused = bool(_detail_focus(question))  # non-empty set => a specific ask
        if focused:
            return banner + id_note_html + detail_html + synthesis_html
        return banner + id_note_html + synthesis_html + detail_html
    if tool == "search_trials":
        # The synthesis already renders every matching trial as a table, so
        # emitting a card per trial underneath just repeats every row. Keep
        # the cards only when there is no table.
        if "<table" in synthesis_html:
            return banner + synthesis_html
        return banner + synthesis_html + render_search_results(tr)
    if tool == "get_competitive_landscape":
        return banner + synthesis_html + render_landscape(tr)
    if tool == "compare_arms":
        return banner + synthesis_html + render_compare_arms(tr)
    if tool == "get_endpoints_and_outcomes":
        return banner + synthesis_html + render_endpoints_and_outcomes(tr)
    # A tool that returned only an error has nothing to render as data. Show the
    # message plainly instead of dumping {"error": ...} as JSON at the user --
    # this is what an under-specified question (e.g. asking for "the primary
    # endpoints" with no trial in the question or the session) lands on.
    if isinstance(tr, dict) and tr.get("error") and len(tr) == 1:
        msg = str(tr["error"])
        hint = ""
        if "session context" in msg or "resolve trial" in msg:
            hint = ("<p class=\"answer-sub\">Name a trial (for example "
                    "<em>&ldquo;primary endpoints for NCT06881784&rdquo;</em>), or run a "
                    "search first and then ask a follow-up about one of the results.</p>")
        return (banner + synthesis_html
                + f'<div class="card warn"><p>{esc(msg)}</p>{hint}</div>')

    # fallback: pretty JSON
    return banner + synthesis_html + f'<div class="card"><pre>{esc(json.dumps(to_plain(tr), indent=2))}</pre></div>'


# ---------- page ----------

PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><title>OncoSuite Assistant</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
 /* ===== Light "Analyst" theme (matches the reference design) ===== */
 * { box-sizing: border-box; }
 html, body { height: 100%; }
 body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin:0;
     background:#ffffff; color:#1f2937; }

 /* ---- app shell: sidebar + main ---- */
 .app { display:flex; height:100vh; overflow:hidden; }

 /* ---- left sidebar (chat list) ---- */
 .sidebar { width:270px; flex-shrink:0; background:#f7f9fc; border-right:1px solid #e5e9f0;
     display:flex; flex-direction:column; }
 .sidebar-head { padding:16px 16px 10px; }
 .brand { font-size:20px; font-weight:700; color:#111827; margin:0 0 16px; letter-spacing:-.01em; }
 .new-chat { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px 12px;
     border:0; border-radius:8px; background:#2563eb; color:#fff; font-size:14px; font-weight:600; cursor:pointer; }
 .new-chat:hover { background:#1d4ed8; }
 .search-box { position:relative; margin:12px 16px 6px; }
 .search-box input { width:100%; padding:8px 12px 8px 32px; border:1px solid #e5e9f0; border-radius:8px;
     background:#fff; color:#1f2937; font-size:13px; outline:none; }
 .search-box input:focus { border-color:#c3d0e8; }
 .search-box .si { position:absolute; left:11px; top:50%; transform:translateY(-50%);
     color:#9aa4b2; font-size:13px; }
 .chats-label { display:flex; align-items:center; justify-content:space-between; padding:10px 18px 4px;
     font-size:12px; font-weight:700; color:#374151; }
 .chat-list { flex:1; overflow-y:auto; padding:2px 10px 10px; }
 .chat-item { position:relative; display:flex; align-items:center; gap:6px; padding:8px 10px; border-radius:8px;
     font-size:13px; color:#374151; cursor:pointer; margin-bottom:1px; white-space:nowrap;
     overflow:hidden; text-overflow:ellipsis; }
 .chat-item:hover { background:#eef2f8; }
 .chat-item.active { background:#e4ebf7; color:#1e3a8a; font-weight:600; }
 .ic { width:15px; height:15px; flex-shrink:0; display:block; }
 .chat-item .ci-pin { flex-shrink:0; color:#f59e0b; display:flex; }
 .chat-item .ci-pin .ic { width:13px; height:13px; }
 .chat-item .ci-title { flex:1; overflow:hidden; text-overflow:ellipsis; }
 /* inline rename field: replaces the title while editing */
 .chat-item .ci-edit { flex:1; min-width:0; font:inherit; color:#1f2937; padding:1px 4px;
     border:1px solid #2563eb; border-radius:5px; outline:none; background:#fff; }
 .chat-item .ci-menu { opacity:0; flex-shrink:0; color:#9aa4b2; line-height:1; display:flex;
     align-items:center; padding:3px; border-radius:5px; }
 .chat-item:hover .ci-menu, .chat-item .ci-menu.open { opacity:1; }
 .chat-item .ci-menu:hover { background:#dfe6f1; color:#374151; }
 /* the pin/rename/delete popup */
 .ci-pop { position:absolute; z-index:50; min-width:150px; background:#fff; border:1px solid #e5e9f0;
     border-radius:9px; box-shadow:0 6px 20px rgba(16,24,40,.14); padding:4px; font-size:13px; }
 .ci-pop button { display:flex; align-items:center; gap:9px; width:100%; padding:7px 9px; border:0;
     background:transparent; color:#374151; font:inherit; text-align:left; border-radius:6px; cursor:pointer; }
 .ci-pop button:hover { background:#f2f5fa; }
 .ci-pop button.danger { color:#dc2626; }
 .ci-pop button.danger:hover { background:#fef2f2; }
 .ci-pop .sep { height:1px; background:#eef1f6; margin:4px 2px; }
 .chats-label .cl-sub { font-size:11px; font-weight:600; color:#9aa4b2; text-transform:uppercase;
     letter-spacing:.04em; padding:8px 8px 3px; }
 .sidebar-foot { padding:12px 16px; border-top:1px solid #e5e9f0; font-size:11px; color:#9aa4b2; }

 /* ---- main chat column ---- */
 .main { flex:1; display:flex; flex-direction:column; height:100vh; min-width:0; background:#fff; }
 .topbar { padding:16px 24px; border-bottom:1px solid #eef1f6; display:flex; align-items:baseline; gap:10px; }
 .topbar h1 { font-size:16px; margin:0; color:#111827; }
 .topbar .sub { color:#9aa4b2; font-size:12px; }

 .thread { flex:1; overflow-y:auto; padding:24px 0; }
 .thread-inner { max-width:840px; margin:0 auto; padding:0 24px; }

 /* welcome / empty state */
 .welcome { text-align:center; margin-top:16vh; }
 .welcome h2 { color:#1f2937; font-size:26px; font-weight:600; margin:0 0 26px; }

 /* centered welcome composer (matches the reference) */
 .welcome-bar { max-width:560px; margin:0 auto; }

 .suggestions { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; max-width:600px;
     margin:22px auto 0; }
 .suggestion { padding:11px 15px; border:1px solid #e5e9f0; border-radius:12px; background:#fff;
     color:#374151; font-size:13px; cursor:pointer; text-align:left; max-width:270px; }
 .suggestion:hover { border-color:#c3d0e8; background:#f7f9fc; }

 /* message rows */
 .msg { display:flex; gap:14px; margin:0 0 26px; }
 .avatar { width:30px; height:30px; border-radius:8px; flex-shrink:0; display:flex; align-items:center;
     justify-content:center; font-size:12px; font-weight:700; }
 .avatar.user { background:#e4ebf7; color:#1e3a8a; }
 .avatar.bot { background:#2563eb; color:#fff; }
 .msg-body { flex:1; min-width:0; padding-top:3px; }
 .msg.user .msg-body { color:#1f2937; font-size:15px; line-height:1.5; }

 /* ---- bottom chat bar ---- */
 .composer { border-top:1px solid #eef1f6; padding:14px 24px 20px; background:#fff; }
 .composer-inner { max-width:760px; margin:0 auto; }
 form.bar { display:flex; gap:8px; align-items:center; background:#fff; border:1px solid #d7deea;
     border-radius:14px; padding:10px 10px 10px 14px; box-shadow:0 1px 2px rgba(16,24,40,.04); }
 form.bar:focus-within { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.10); }
 .plus-btn { width:30px; height:30px; flex-shrink:0; border:0; border-radius:8px; background:transparent;
     color:#6b7280; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
 .plus-btn:hover { background:#f2f4f8; }
 form.bar textarea { flex:1; resize:none; border:0; background:transparent; color:#1f2937; font-size:15px;
     line-height:1.4; max-height:180px; padding:4px 0; font-family:inherit; outline:none; }
 form.bar textarea::placeholder { color:#9aa4b2; }
 .send-btn { width:34px; height:34px; flex-shrink:0; border:0; border-radius:50%; background:#111827;
     color:#fff; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
 .send-btn:hover { background:#1f2937; }
 .send-btn:disabled { background:#c9cfda; cursor:not-allowed; }
 .composer-hint { text-align:center; font-size:11px; color:#b0b7c3; margin-top:8px; }

 /* ---- loading indicator (spinner + rotating status) ---- */
 .loading { display:flex; align-items:center; gap:11px; color:#2563eb; font-size:14px; }
 .spinner { width:18px; height:18px; border:2px solid #e5e9f0; border-top-color:#2563eb;
     border-radius:50%; animation:spin .8s linear infinite; flex-shrink:0; }
 @keyframes spin { to { transform:rotate(360deg); } }
 .load-text { position:relative; }
 .load-text::after { content:''; animation:dots 1.4s steps(4,end) infinite; }
 @keyframes dots { 0%{content:''} 25%{content:'.'} 50%{content:'..'} 75%{content:'...'} }
 /* ---- live background-step trace (real steps streamed from the server) ----
    Typography is pinned to the Figma spec: every line is 14px / 20px / weight
    500; only the colour changes with state (done .45, active .85, header .65). */
 .trace-head { font-size:14px; line-height:20px; font-weight:500; color:rgba(0,0,0,0.65);
     margin:0 0 12px; }
 .steps { margin:0; padding:0; list-style:none; }
 .steps li { display:flex; align-items:flex-start; gap:12px; padding:0 0 24px 0;
     animation:stepin .25s ease; }
 .steps li:last-child { padding-bottom:0; }
 .steps .tick { width:16px; flex-shrink:0; font-size:13px; line-height:20px; text-align:center; }
 .steps li.done .tick { color:#22a06b; }
 .steps li.active .tick { color:#2563eb; font-size:10px; }
 .steps .st-body { min-width:0; }
 .steps .st-title { font-size:14px; line-height:20px; font-weight:500; color:rgba(0,0,0,0.45); }
 .steps li.active .st-title { color:rgba(0,0,0,0.85); }
 .steps .st-sub { font-size:12px; line-height:18px; font-weight:400; color:rgba(0,0,0,0.35);
     margin-top:2px; }
 @keyframes stepin { from { opacity:0; transform:translateY(3px);} to {opacity:1;transform:none;} }

 @media (max-width: 760px) {
   .sidebar { display:none; }
 }

 /* ===== answer content (light) ===== */
 .meta { font-size:12px; color:#9aa4b2; margin-bottom:10px; }
 .answer { background:#f0f6ff; border:1px solid #cfe0fb; border-left:4px solid #2563eb;
     border-radius:10px; padding:14px 18px; margin-bottom:14px; }
 .answer-lbl { display:block; font-size:12px; color:#2563eb; text-transform:uppercase; letter-spacing:.05em; }
 .answer-val { display:block; font-size:22px; font-weight:700; color:#111827; margin-top:2px; }
 .answer-sub { font-size:12px; color:#9aa4b2; }
 .card { background:#fff; border:1px solid #e5e9f0; border-radius:12px; padding:16px 18px; margin-bottom:14px;
     box-shadow:0 1px 2px rgba(16,24,40,.03); }
 .card.error { border-color:#f3b4ae; background:#fef4f3; color:#b42318; }
 .card.warn { border-color:#f2d091; background:#fffaf0; }
 h2 { font-size:17px; margin:2px 0 6px; color:#111827; }
 h3 { font-size:15px; margin:2px 0 8px; color:#111827; }
 h4 { font-size:13px; margin:14px 0 6px; color:#2563eb; text-transform:uppercase; letter-spacing:.04em; }
 .title { color:#4b5563; font-size:14px; line-height:1.45; margin:0 0 12px; }
 .tag { display:inline-block; font-size:11px; background:#e4ebf7; color:#1e40af; padding:3px 8px;
     border-radius:6px; margin-bottom:6px; }
 .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin:6px 0; }
 .lbl { display:block; font-size:11px; color:#9aa4b2; text-transform:uppercase; letter-spacing:.04em; }
 .crit-block { margin-top:6px; }
 .crit-key { min-width:150px; color:#6b7280; }
 .crit-val { flex:1; color:#1f2937; }
 .arm { border-left:3px solid #2563eb; padding:8px 12px; margin:10px 0; background:#f7f9fc; border-radius:0 8px 8px 0; }
 .arm-desc { font-size:13px; color:#4b5563; margin:4px 0; }
 .arm-drug { font-size:12px; color:#2563eb; }
 .pill { font-size:11px; background:#eef2f8; padding:2px 7px; border-radius:5px; color:#374151; }
 .count { color:#9aa4b2; font-size:13px; }
 .muted { color:#9aa4b2; }
 /* Bare tables (trial-detail: contacts, locations, arms, safety, ...) can have
    many columns. Make each table its own horizontal scroll region so the last
    column (e.g. Affiliation) is never clipped by the card edge. display:block +
    overflow-x:auto turns the table element itself into the scroller. */
 table { display:block; width:100%; max-width:100%; overflow-x:auto; border-collapse:collapse;
         font-size:13px; -webkit-overflow-scrolling:touch; }
 thead, tbody { display:table; width:100%; min-width:max-content; }
 th,td { text-align:left; padding:8px 12px; border-bottom:1px solid #eef1f6;
         vertical-align:top; line-height:1.45; }
 th { color:#6b7280; white-space:nowrap; }
 td { min-width:80px; }
 pre { white-space:pre-wrap; font-size:12px; color:#4b5563; margin:0; }
 a { color:#2563eb; }
 .examples { font-size:12px; color:#9aa4b2; margin-top:6px; }
 .examples a { margin-right:12px; }
 .chart-wrap { margin: 14px 0; }
 .chart-title { font-size: 13px; font-weight: 600; color: #1f2937; margin: 0 0 8px; }
 /* Scroll container so wide tables never get cut off by the message bubble. */
 .table-wrap { width: 100%; overflow-x: auto; margin: 12px 0; -webkit-overflow-scrolling: touch;
               border: 1px solid #eef1f6; border-radius: 8px; }
 /* Inside .table-wrap the wrapper scrolls, so the table is a normal table (undo
    the global display:block scroller to avoid a double scrollbar). */
 .table-wrap table.data-table { display: table; overflow: visible; }
 .table-wrap thead, .table-wrap tbody { display: table-row-group; min-width: 0; }
 .table-wrap thead { display: table-header-group; }
 .data-table { width: 100%; min-width: max-content; border-collapse: collapse; font-size: 13px; }
 .data-table th { text-align: left; color: #6b7280; font-weight: 600; font-size: 11px;
                   text-transform: uppercase; letter-spacing: .04em; padding: 8px 12px;
                   border-bottom: 1px solid #eef1f6; white-space: nowrap; background:#fafbfd; }
 .data-table td { padding: 8px 12px; border-bottom: 1px solid #f2f4f8; color: #1f2937;
                  vertical-align: top; line-height: 1.45; }
 .data-table tr:last-child td { border-bottom: 0; }
 /* every rendered table gets its own Download CSV toolbar, right-aligned above it */
 .tbl-block { margin: 12px 0; }
 .tbl-block .table-wrap { margin-top: 0; }
 .tbl-toolbar { display: flex; justify-content: flex-end; margin-bottom: 6px; }
 .tbl-toolbar .dl-btn { background:#fff; color:#374151; border:1px solid #d7deea; font-weight:500; }
 .tbl-toolbar .dl-btn:hover { background:#f2f5fa; border-color:#c3d0e8; color:#111827; }
 /* ---- cohort answer (client spec: clickable rows + download + insights) ---- */
 .cohort-answer { margin: 4px 0; }
 .cohort-lead { font-size: 14px; margin-bottom: 8px; }
 .cohort-toolbar { display: flex; align-items: center; gap: 12px; margin: 6px 0; flex-wrap: wrap; }
 .dl-btn { background: #2563eb; color: #fff; border: 0; border-radius: 7px; padding: 6px 12px;
           font-size: 12px; cursor: pointer; }
 .dl-btn:hover { background: #1d4ed8; }
 .cohort-hint { font-size: 12px; color: #9aa4b2; }
 .cohort-wrap { max-height: 460px; overflow: auto; }   /* vertical + horizontal scroll */
 .cohort-row { cursor: pointer; }
 .cohort-row:hover td { background: #eef4ff; }
 .cohort-id { color: #2563eb; font-weight: 600; white-space: nowrap; }
 .cohort-insights { margin-top: 14px; }
 .cohort-next { margin-top: 12px; }
 ul.nextsteps { list-style: none; padding: 0; margin: 6px 0 0; }
 ul.nextsteps li { margin: 6px 0; }
 .nextstep { text-align: left; background: #f0f6ff; border: 1px solid #cfe0fb; color: #1d4ed8;
             border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; width: 100%; }
 .nextstep:hover { background: #e2edff; }
 .data-table tr:hover td { background: #f7f9fc; }
 .synth-h { font-size: 13px; color: #2563eb; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
 .synth-body { font-size: 14.5px; color: #1f2937; }
 .synth-body p { margin: 8px 0; line-height: 1.62; }
 .synth-body p:first-child { margin-top: 0; }
 .synth-body strong { color: #111827; font-weight: 650; }
 .synth-body em { color: #6b7280; }
 .synth-body ul { margin: 8px 0; padding-left: 22px; }
 .synth-body li { margin: 4px 0; line-height: 1.55; }
 .synth-hr { border: 0; border-top: 1px solid #eef1f6; margin: 14px 0; }
 .trial-chip { display:inline-block; background:#eff4ff; color:#2563eb; border:1px solid #d5e2fb;
               border-radius:6px; padding:1px 7px; margin:1px 3px 1px 0; font-size:12px;
               cursor:pointer; white-space:nowrap; }
 .trial-chip:hover { background:#2563eb; color:#fff; }
 .crit-row { display: flex; gap: 8px; padding: 3px 0; align-items: flex-start; border-bottom:1px solid #f2f4f8; }
 .crit-key { color: #6b7280; min-width: 140px; flex-shrink: 0; font-size: 12px; }
 .crit-val { color: #1f2937; }
</style></head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="sidebar-head">
      <p class="brand">Analyst</p>
      <button class="new-chat" onclick="newChat()">&#43;&nbsp; New Query</button>
    </div>
    <div class="search-box">
      <span class="si">&#128269;</span>
      <input type="text" id="chatSearch" placeholder="Search sites..." oninput="renderSidebar()">
    </div>
    <div class="chats-label"><span>Chats</span><span style="color:#9aa4b2">&#9776;</span></div>
    <div class="chat-list" id="chatList"></div>
    <div class="sidebar-foot">Answers from the oncosuite_gold database.</div>
  </aside>

  <main class="main">
    <div class="thread" id="thread">
      <div class="thread-inner" id="threadInner"></div>
    </div>

    <div class="composer">
      <div class="composer-inner">
        <form class="bar" id="askForm" onsubmit="return onSend(event)">
          <button class="plus-btn" type="button" title="New query" onclick="newChat()">&#43;</button>
          <textarea id="q" rows="1" placeholder="Ask anything"
                    autofocus oninput="autogrow(this)" onkeydown="onKey(event)"></textarea>
          <button class="send-btn" id="sendBtn" type="submit" title="Send">&#8593;</button>
        </form>
        <div class="composer-hint">Press Enter to send &middot; Shift+Enter for a new line</div>
      </div>
    </div>
  </main>
</div>

<script>
// Base path the app is served under (e.g. "/chat-bot" behind nginx, or "" at root).
// Injected at serve time from ONCOSUITE_BASE_PATH so fetch() targets the right URL.
const BASE_PATH = "__BASE_PATH__";
const LS_KEY = 'oncosuite_chats';
const STATUSES = ['Understanding your question', 'Searching trials', 'Compounding findings',
                  'Cross-checking data', 'Structuring the answer'];

let chats = load();          // [{id, title, messages:[{role, q?, html?}]}]
let activeId = null;

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; }
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(chats)); }
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function newChat() {
  activeId = null;
  renderSidebar();
  renderThread();
  document.getElementById('q').focus();
}

function activeChat() { return chats.find(c => c.id === activeId); }

function selectChat(id) { activeId = id; renderSidebar(); renderThread(); }

function deleteChat(id) {
  const c = chats.find(x => x.id === id);
  if (!confirm('Delete "' + ((c && c.title) || 'this chat') + '"? This cannot be undone.')) return;
  chats = chats.filter(x => x.id !== id);
  if (activeId === id) activeId = null;
  save(); renderSidebar(); renderThread();
}

// Pinned chats float to the top of the list and keep a pin glyph.
function togglePin(id) {
  const c = chats.find(x => x.id === id);
  if (!c) return;
  c.pinned = !c.pinned;
  save(); renderSidebar();
}

// Rename happens inline: the title span is swapped for an input, committed on
// Enter/blur and abandoned on Escape.
function startRename(id) {
  const row = document.querySelector('.chat-item[data-id="' + id + '"]');
  if (!row) return;
  const titleEl = row.querySelector('.ci-title');
  const c = chats.find(x => x.id === id);
  if (!titleEl || !c) return;
  const input = document.createElement('input');
  input.className = 'ci-edit';
  input.value = c.title || '';
  let settled = false;
  const commit = (keep) => {
    if (settled) return;
    settled = true;
    if (keep) { const v = input.value.trim(); if (v) c.title = v.slice(0, 80); save(); }
    renderSidebar();
  };
  input.onclick = (e) => e.stopPropagation();
  input.onkeydown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commit(true); }
    else if (e.key === 'Escape') { e.preventDefault(); commit(false); }
  };
  input.onblur = () => commit(true);
  titleEl.replaceWith(input);
  input.focus(); input.select();
}

// Inline SVGs rather than emoji/dingbat entities: the sidebar font stack has no
// glyphs for those codepoints and falls back to garbage like "OC" / "Y1".
const _svg = (d, extra) => '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
  + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + (extra || '') + '</svg>';
const ICON = {
  pin:    _svg('<path d="M9 4h6l-1 6 3 3H7l3-3-1-6Z"/><path d="M12 13v7"/>'),
  pencil: _svg('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M15 6l3 3"/>'),
  trash:  _svg('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/>'
             + '<path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'),
  dots:   _svg('<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>'
             + '<circle cx="12" cy="19" r="1.4" fill="currentColor"/>'),
  down:   _svg('<path d="M12 4v11"/><path d="M7 12l5 5 5-5"/><path d="M5 20h14"/>'),
};

function closeChatMenu() {
  document.querySelectorAll('.ci-pop').forEach(p => p.remove());
  document.querySelectorAll('.ci-menu.open').forEach(b => b.classList.remove('open'));
}

// Anchor the popup to the row in fixed coords so it is never clipped by the
// chat list's overflow:auto.
function openChatMenu(id, ev) {
  ev.stopPropagation();
  const wasOpen = ev.currentTarget.classList.contains('open');
  closeChatMenu();
  if (wasOpen) return;
  ev.currentTarget.classList.add('open');
  const c = chats.find(x => x.id === id);
  const pop = document.createElement('div');
  pop.className = 'ci-pop';
  pop.style.position = 'fixed';
  pop.innerHTML =
      '<button data-act="pin">' + ICON.pin
    + (c && c.pinned ? 'Unpin chat' : 'Pin chat') + '</button>'
    + '<button data-act="rename">' + ICON.pencil + 'Rename</button>'
    + '<div class="sep"></div>'
    + '<button class="danger" data-act="delete">' + ICON.trash + 'Delete</button>';
  pop.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    const act = b.getAttribute('data-act');
    closeChatMenu();
    if (act === 'pin') togglePin(id);
    else if (act === 'rename') startRename(id);
    else if (act === 'delete') deleteChat(id);
  };
  document.body.appendChild(pop);
  const r = ev.currentTarget.getBoundingClientRect();
  const h = pop.offsetHeight;
  pop.style.left = Math.round(r.left - 6) + 'px';
  // flip above the button when there is no room below
  pop.style.top = (r.bottom + h + 8 > window.innerHeight ? Math.round(r.top - h - 4)
                                                         : Math.round(r.bottom + 4)) + 'px';
}

document.addEventListener('click', closeChatMenu);
window.addEventListener('resize', closeChatMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChatMenu(); });

function chatRowHtml(c) {
  return '<div class="chat-item ' + (c.id === activeId ? 'active' : '') + '" data-id="' + c.id + '"'
    + ' onclick="selectChat(\\'' + c.id + '\\')">'
    + (c.pinned ? '<span class="ci-pin" title="Pinned">' + ICON.pin + '</span>' : '')
    + '<span class="ci-title">' + esc(c.title || 'New Query') + '</span>'
    + '<span class="ci-menu" title="More" onclick="openChatMenu(\\'' + c.id + '\\', event)">' + ICON.dots + '</span>'
    + '</div>';
}

function renderSidebar() {
  const list = document.getElementById('chatList');
  const searchEl = document.getElementById('chatSearch');
  const term = (searchEl ? searchEl.value : '').trim().toLowerCase();
  const shown = term ? chats.filter(c => (c.title || '').toLowerCase().includes(term)) : chats;
  if (!shown.length) {
    list.innerHTML = '<div style="padding:10px 8px;color:#9aa4b2;font-size:12px">'
      + (term ? 'No matching chats.' : 'No chats yet.') + '</div>';
    return;
  }
  const pinned = shown.filter(c => c.pinned);
  const rest = shown.filter(c => !c.pinned);
  let html = '';
  if (pinned.length) {
    html += '<div class="cl-sub">Pinned</div>' + pinned.map(chatRowHtml).join('');
    if (rest.length) html += '<div class="cl-sub">Recent</div>';
  }
  html += rest.map(chatRowHtml).join('');
  list.innerHTML = html;
}

function welcomeHtml() {
  const s = [
    'Show me recruiting Phase 3 trials for NSCLC KRAS',
    'Tell me about NCT06881784',
    'What is eligibility criteria for trial NCT03706690',
    'Competitive landscape for KRAS G12C inhibitors',
  ];
  return '<div class="welcome"><h2>What can I help with?</h2>'
    + '<div class="suggestions">'
    + s.map(x => '<button class="suggestion" onclick="ask(' + JSON.stringify(x).replace(/"/g, '&quot;') + ')">' + esc(x) + '</button>').join('')
    + '</div></div>';
}

function renderThread() {
  const inner = document.getElementById('threadInner');
  const chat = activeChat();
  if (!chat || !chat.messages.length) { inner.innerHTML = welcomeHtml(); return; }
  inner.innerHTML = chat.messages.map(m => {
    if (m.role === 'user') {
      return '<div class="msg user"><div class="avatar user">You</div>'
           + '<div class="msg-body">' + esc(m.q) + '</div></div>';
    }
    return '<div class="msg bot"><div class="avatar bot">AI</div>'
         + '<div class="msg-body">' + (m.html || '') + '</div></div>';
  }).join('');
  scrollDown();
}

function scrollDown() {
  const t = document.getElementById('thread');
  t.scrollTop = t.scrollHeight;
}

function autogrow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px'; }
function onKey(ev) {
  if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); onSend(ev); }
}
function onSend(ev) {
  ev.preventDefault();
  const el = document.getElementById('q');
  const text = el.value.trim();
  if (!text) return false;
  el.value = ''; autogrow(el);
  ask(text);
  return false;
}

let busy = false;
async function ask(text) {
  if (busy) return;
  // create a chat if none active
  let chat = activeChat();
  if (!chat) {
    chat = { id: uid(), title: text.slice(0, 48), messages: [] };
    chats.unshift(chat);
    activeId = chat.id;
  }
  chat.messages.push({ role: 'user', q: text });
  if (chat.messages.length === 1) chat.title = text.slice(0, 48);
  save(); renderSidebar(); renderThread();

  // append a loading bubble with a LIVE step list (real steps stream in below)
  busy = true;
  document.getElementById('sendBtn').disabled = true;
  const inner = document.getElementById('threadInner');
  const loadId = 'load_' + Date.now();
  inner.insertAdjacentHTML('beforeend',
    '<div class="msg bot" id="' + loadId + '"><div class="avatar bot">AI</div>'
    + '<div class="msg-body"><div class="trace-head">Analyzing your query...</div>'
    + '<ul class="steps" id="' + loadId + '_s"></ul></div></div>');
  scrollDown();

  const stepsEl = document.getElementById(loadId + '_s');
  let stepNo = 0;

  // The server sends one line per step. The Figma trace shows a numbered title
  // plus a muted detail line, so split on an em/en dash or colon when the step
  // text carries one; otherwise the title stands alone.
  function splitStep(textMsg) {
    const m = String(textMsg).match(/^(.*?)\\s*(?:[\\u2014\\u2013:])\\s*(.+)$/);
    return m ? { title: m[1], sub: m[2] } : { title: String(textMsg), sub: '' };
  }
  function markDone(li) {
    if (!li) return;
    li.classList.remove('active');
    li.classList.add('done');
    li.querySelector('.tick').textContent = '✓';
  }
  function addStep(textMsg) {
    markDone(stepsEl.lastElementChild);   // previous step is finished
    const parts = splitStep(textMsg);
    stepNo += 1;
    const li = document.createElement('li');
    li.className = 'active';
    const sub = document.createElement('div');
    sub.className = 'st-sub';
    sub.textContent = parts.sub;
    const title = document.createElement('div');
    title.className = 'st-title';
    title.textContent = 'Step ' + stepNo + ' — ' + parts.title;
    const bodyEl = document.createElement('div');
    bodyEl.className = 'st-body';
    bodyEl.appendChild(title);
    if (parts.sub) bodyEl.appendChild(sub);
    li.innerHTML = '<span class="tick">●</span>';
    li.appendChild(bodyEl);
    stepsEl.appendChild(li);
    scrollDown();
  }
  function finishSteps() { markDone(stepsEl.lastElementChild); }

  let answerHtml = null;
  try {
    const r = await fetch(BASE_PATH + '/ask/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text }),
    });
    // Parse the SSE stream frame-by-frame from the response body.
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\\n\\n')) >= 0) {
        const raw = buf.slice(0, idx); buf = buf.slice(idx + 2);
        let ev = 'message', data = '';
        raw.split('\\n').forEach(line => {
          if (line.startsWith('event:')) ev = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        });
        if (!data) continue;
        const obj = JSON.parse(data);
        if (ev === 'step') addStep(obj.text);
        else if (ev === 'answer') { finishSteps(); answerHtml = obj.html; }
        else if (ev === 'error') { finishSteps();
          answerHtml = '<div class="card error">Error: ' + esc(obj.message) + '</div>'; }
      }
    }
  } catch (e) {
    answerHtml = '<div class="card error">Network error: ' + esc(String(e)) + '</div>';
  }
  if (answerHtml === null) answerHtml = '<div class="card error">No answer returned.</div>';

  // Replace the loading bubble (with its step trace) by the final answer.
  chat.messages.push({ role: 'bot', html: answerHtml });
  save();
  busy = false;
  document.getElementById('sendBtn').disabled = false;
  renderThread();
  document.getElementById('q').focus();
}

// Delegated clicks for the cohort table: row -> ask that trial's exec summary;
// download button -> save the embedded CSV; Next Steps button -> ask that.
document.getElementById('threadInner').addEventListener('click', function (e) {
  const dl = e.target.closest('.dl-btn');
  if (dl) {
    const csv = atob(dl.getAttribute('data-csv'));
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dl.getAttribute('data-name') || 'cohorts.csv';
    document.body.appendChild(a); a.click(); a.remove();
    return;
  }
  // Separate button/attribute from the CSV one above -- .xlsx is binary, so it
  // needs a byte array Blob (not a text Blob like the CSV branch), and this
  // must never touch the existing CSV path.
  const dlx = e.target.closest('.dl-btn-xlsx');
  if (dlx) {
    const binary = atob(dlx.getAttribute('data-xlsx'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dlx.getAttribute('data-name') || 'cohorts.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    return;
  }
  const ns = e.target.closest('.nextstep');
  if (ns) { if (!busy) ask(ns.getAttribute('data-q')); return; }
  const row = e.target.closest('.cohort-row');
  if (row) { if (!busy) ask(row.getAttribute('data-q')); return; }
});

renderSidebar();
renderThread();
</script>
</body></html>"""


# Base path the app is served under (e.g. "/chat-bot" behind nginx). Read from env so
# the SAME image works at root (dev) or under a path prefix (prod). Normalized to have
# a leading slash and no trailing slash, or "" for root.
BASE_PATH = os.environ.get("ONCOSUITE_BASE_PATH", "").strip().rstrip("/")
if BASE_PATH and not BASE_PATH.startswith("/"):
    BASE_PATH = "/" + BASE_PATH

# Inject the base path into the page JS (fetch() prepends it). The token is a plain
# string, so this is a safe single substitution.
PAGE_HTML = PAGE.replace("__BASE_PATH__", BASE_PATH)


class Handler(BaseHTTPRequestHandler):
    def _send(self, body, content_type="text/html; charset=utf-8", status=200):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _path(self):
        """Request path with the configured base prefix stripped, so route matching
        is prefix-agnostic. '/chat-bot/ask' -> '/ask'; '/chat-bot' -> '/'."""
        p = urlparse(self.path).path
        if BASE_PATH and p.startswith(BASE_PATH):
            p = p[len(BASE_PATH):] or "/"
        return p

    def do_GET(self):
        return self._route_get()

    def _route_get(self):
        path = self._path()
        if path in ("/", "/index.html"):
            self._send(PAGE_HTML)
        elif path in ("/api/health", "/health"):
            self._send(json.dumps({"status": "ok", "service": "oncosuite"}),
                       "application/json")
        elif path == "/api/charts":
            self._handle_charts_catalog()
        elif path in ("/api/trial", "/search/ExecutiveSummary"):
            self._handle_trial_summary()
        else:
            self.send_error(404)

    def _handle_trial_summary(self):
        """GET search/ExecutiveSummary?OncoSuiteId=<id> -- feeds ctsearch's
        ExecuiteSummaryDrawer, which is used unmodified.

        The path and query parameter match what that component's axios client
        requests, and the response follows its documented shape (see
        executive_summary.py), so pointing VITE_API_BASE_URL at this app is all
        the wiring the drawer needs. `id` is accepted as an alias."""
        from urllib.parse import parse_qs
        qs = parse_qs(urlparse(self.path).query)
        trial_id = (qs.get("OncoSuiteId") or qs.get("id") or [""])[0].strip()
        if not trial_id:
            self._send(json.dumps({"error": "missing OncoSuiteId"}),
                       "application/json", 400)
            return
        try:
            from executive_summary import build_executive_summary, resolve_trial_id
            # Answers cite trials by NCT id; the summary table is keyed by
            # oncosuite_id, so accept either.
            data = build_executive_summary(resolve_trial_id(trial_id) or trial_id)
            if not data:
                self._send(json.dumps({"error": "trial not found"}),
                           "application/json", 404)
                return
            self._send(json.dumps(data, default=str), "application/json")
        except Exception as e:
            self._send(json.dumps({"error": str(e)}), "application/json", 500)

    def do_POST(self):
        path = self._path()
        if path == "/ask":
            self._handle_ask_html()
        elif path == "/ask/stream":
            self._handle_ask_stream()
        elif path == "/api/ask":
            self._handle_ask_json()
        elif path == "/api/charts":
            self._handle_charts()
        elif path == "/ask/fast":
            self._handle_ask_fast()
        else:
            self.send_error(404)

    def _handle_ask_fast(self):
        """SSE chart-first answer: run the tool, pick a chart, return blocks.

        Skips the "write the answer" LLM call entirely -- that stage feeds the
        whole result set into a prompt for prose and is the slow part (it times
        out on broad queries). Here the model makes one cheap decision, which
        chart fits, and every number shown is read straight from oncosuite_gold.

        Frames:
          event: step    data: {"text": "..."}
          event: answer  data: {"blocks": [...], "timings": {...}}
          event: error   data: {"message": "..."}
        """
        q, err = self._read_question()
        if err is not None or not q:
            self._send(json.dumps({"error": "bad request"}), "application/json", 400)
            return

        self.wfile.write(b"HTTP/1.1 200 OK\r\n")
        for header in (b"Content-Type: text/event-stream; charset=utf-8",
                       b"Cache-Control: no-cache", b"Connection: close",
                       b"X-Accel-Buffering: no"):
            self.wfile.write(header + b"\r\n")
        self.wfile.write(b"\r\n")
        self.wfile.flush()

        def emit(event, obj):
            self.wfile.write(f"event: {event}\ndata: {json.dumps(obj)}\n\n".encode("utf-8"))
            self.wfile.flush()

        try:
            steps = queue.Queue()
            result = {}

            def worker():
                try:
                    from answer_fast import (build_fast_answer, detect_analytics,
                                             detect_map_chart, detect_case_stage_breakdown)

                    # Analytics questions bypass the router entirely: it marks
                    # them out of scope or routes to a tool with no rows, and
                    # the answer comes from the analytics schema regardless.
                    if detect_analytics(q):
                        steps.put(("step", "Reading the analytics dataset"))
                        result["payload"] = build_fast_answer(q, {}, [])
                        return

                    # Self-contained geography/epidemiology questions ("show
                    # cancer cases with stages in US") are answered entirely
                    # from oncosuite_gold's map/case tables -- no LLM
                    # classification needed. Bypassing the router matters here:
                    # its classifier has no "geography" intent category, so it
                    # reasonably calls this out_of_scope, then burns 2+ minutes
                    # on text-to-SQL and vector-search fallback attempts before
                    # ever reaching this same deterministic map logic -- a real
                    # hang observed on exactly this question. A bare pronoun
                    # follow-up ("show it on the map") still needs the
                    # router's session-aware same-search-recap, so this is
                    # skipped when the question refers back rather than
                    # standing alone.
                    _FOLLOWUP_CUES = (r"\bit\b", r"\bsame\b", r"\bagain\b")
                    map_q = detect_case_stage_breakdown(q) or detect_map_chart(q)
                    if map_q and not any(re.search(c, q.lower()) for c in _FOLLOWUP_CUES):
                        steps.put(("step", "Building the map"))
                        result["payload"] = build_fast_answer(q, {}, [])
                        return

                    resp = handle_turn(SESSION_ID, q,
                                       on_step=lambda m: steps.put(("step", m)),
                                       skip_synthesis=True)
                    ids = _answer_trial_ids(resp)
                    steps.put(("step", "Choosing the best visualisation"))
                    result["payload"] = build_fast_answer(
                        q, resp.get("tool_result") or {}, ids, resp=resp)
                except Exception as e:
                    result["error"] = str(e)
                finally:
                    steps.put(("done", None))

            threading.Thread(target=worker, daemon=True).start()

            while True:
                kind, payload = steps.get()
                if kind == "done":
                    break
                emit("step", {"text": payload})

            if "error" in result:
                emit("error", {"message": result["error"]})
            else:
                emit("answer", result.get("payload") or {"blocks": []})
            self.wfile.write(b"")
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _handle_charts_catalog(self):
        """GET /api/charts -- which charts exist and which are currently gated.

        Exposed so the front-end (and a human debugging a missing chart) can see
        why something is not rendering without reading the source."""
        try:
            from chart_data import CHART_SPECS
            catalog = {
                name: {"label": s.get("label"), "enabled": bool(s.get("enabled")),
                       "reason": s.get("disabled_reason")}
                for name, s in CHART_SPECS.items()
            }
            self._send(json.dumps({"charts": catalog}), "application/json")
        except Exception as e:
            self._send(json.dumps({"error": str(e)}), "application/json", 500)

    def _handle_charts(self):
        """POST /api/charts {q, oncosuite_ids[]} -> {"blocks": [...]}.

        The LLM picks which charts suit the question; chart_data builds the props
        from oncosuite_gold. Charts with no backing data are dropped, so an empty
        list is a valid, common answer -- not an error."""
        try:
            length = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, TypeError):
            self._send(json.dumps({"error": "bad json"}), "application/json", 400)
            return

        question = str(payload.get("q") or "").strip()
        ids = payload.get("oncosuite_ids") or []
        if not isinstance(ids, list):
            ids = []
        # An empty id list is fine: the analytics panels and the maps answer
        # database-wide questions ("competition intensity by country") that are
        # not scoped to a particular set of trials.
        if not question:
            self._send(json.dumps({"blocks": []}), "application/json")
            return

        try:
            from chart_select import build_chart_blocks
            blocks = build_chart_blocks(question, [str(i) for i in ids][:200])
            self._send(json.dumps({"blocks": blocks}), "application/json")
        except Exception as e:
            self._send(json.dumps({"blocks": [], "error": str(e)}),
                       "application/json", 500)

    def _handle_ask_stream(self):
        """Server-Sent Events endpoint: streams the REAL background steps as they
        happen (like Claude showing its work), then the final answer HTML.

        Frames:
          event: step    data: {"text": "Searching the trial database"}
          event: answer  data: {"html": "<...rendered answer...>"}
          event: error   data: {"message": "..."}

        handle_turn runs in a worker thread and pushes each on_step message into a
        queue; this request thread drains the queue and flushes an SSE frame per
        step, so the user sees progress in real time on the one open connection."""
        q, err = self._read_question()
        if err is not None or not q:
            self._send(json.dumps({"html": '<div class="card error">Bad request.</div>'}),
                       "application/json", 400)
            return

        # We write the status line + headers MANUALLY with HTTP/1.1 + chunked
        # transfer encoding. BaseHTTPRequestHandler.send_response() stamps HTTP/1.0,
        # which has no chunked encoding -- so a keep-alive response with no
        # Content-Length makes the BROWSER buffer the whole body (or wait for the
        # socket to close) and the live steps never appear. Chunked framing lets the
        # browser's fetch() reader see each SSE frame the instant we flush it.
        head = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/event-stream; charset=utf-8\r\n"
            "Cache-Control: no-cache\r\n"
            "Connection: close\r\n"
            "X-Accel-Buffering: no\r\n"      # tell nginx not to buffer the stream
            "Transfer-Encoding: chunked\r\n"
            "\r\n"
        )
        self.wfile.write(head.encode("utf-8"))
        self.wfile.flush()

        def emit(event, obj):
            frame = f"event: {event}\ndata: {json.dumps(obj)}\n\n".encode("utf-8")
            # one HTTP chunk: hex length CRLF, payload, CRLF
            self.wfile.write(f"{len(frame):X}\r\n".encode("ascii"))
            self.wfile.write(frame)
            self.wfile.write(b"\r\n")
            self.wfile.flush()

        def end_stream():
            self.wfile.write(b"0\r\n\r\n")   # terminating zero-length chunk
            self.wfile.flush()

        try:
            # Smalltalk short-circuits with no background steps.
            chit = smalltalk_reply(q)
            if chit is not None:
                emit("answer", {"html": chit})
                end_stream()
                return

            steps = queue.Queue()
            result = {}

            def worker():
                try:
                    resp = handle_turn(SESSION_ID, q, on_step=lambda m: steps.put(("step", m)))
                    result["html"] = render_answer(resp, q)
                    result["ids"] = _answer_trial_ids(resp)
                except Exception as e:
                    result["error"] = str(e)
                finally:
                    steps.put(("done", None))

            t = threading.Thread(target=worker, daemon=True)
            t.start()

            # Drain step messages until the worker signals done.
            while True:
                kind, payload = steps.get()
                if kind == "done":
                    break
                emit("step", {"text": payload})
            if "error" in result:
                emit("error", {"message": result["error"]})
            else:
                emit("answer", {"html": result.get("html")
                                or '<div class="card error">No answer returned.</div>',
                                "oncosuite_ids": result.get("ids") or []})
            end_stream()
        except (BrokenPipeError, ConnectionResetError):
            pass  # client navigated away mid-stream; nothing more to do

    def _read_question(self):
        """Parse {"q": ...} (or {"question": ...}) from the request body. Returns
        (question, error_response_or_None)."""
        try:
            length = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception as e:
            return None, str(e)
        q = (payload.get("q") or payload.get("question") or "").strip()
        return q, None

    def _handle_ask_html(self):
        """Browser UI endpoint -- returns rendered HTML in {"html": ...}."""
        q, err = self._read_question()
        if err is not None:
            self._send(json.dumps({"html": f'<div class="card error">Bad request: {esc(err)}</div>'}),
                       "application/json", 400)
            return
        if not q:
            html_out = '<div class="card error">Empty question.</div>'
        else:
            chit = smalltalk_reply(q)
            if chit is not None:
                html_out = chit
            else:
                try:
                    resp = handle_turn(SESSION_ID, q)
                    html_out = render_answer(resp, q)
                except Exception as e:
                    html_out = f'<div class="card error">Error: {esc(e)}</div>'
        self._send(json.dumps({"html": html_out}), "application/json")

    def _handle_ask_json(self):
        """Programmatic JSON API: POST /api/ask {"q": "..."} -> structured JSON.

        Returns the answer text plus useful structured fields (source trials, rows,
        sql) WITHOUT any HTML or internal trace metadata -- suitable for other apps
        to consume. Optional session_id in the body isolates conversation memory
        per caller; defaults to the shared UI session."""
        try:
            length = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception as e:
            self._send(json.dumps({"error": f"bad request: {e}"}), "application/json", 400)
            return
        q = (payload.get("q") or payload.get("question") or "").strip()
        if not q:
            self._send(json.dumps({"error": "missing 'q'"}), "application/json", 400)
            return
        session_id = payload.get("session_id") or SESSION_ID
        try:
            chit = smalltalk_reply(q)
            if chit is not None:
                out = {"question": q, "answer": _plain_text(chit), "type": "smalltalk"}
            else:
                resp = handle_turn(session_id, q)
                out = _api_result(q, resp)
        except Exception as e:
            self._send(json.dumps({"question": q, "error": str(e)}), "application/json", 500)
            return
        self._send(json.dumps(out, default=str), "application/json")

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    # Host/port configurable via env so the same code runs in local dev and on the
    # shared VM. On the VM we bind 127.0.0.1:8010 and put nginx in front (TLS);
    # 8010 avoids colliding with the HRMS app already on :8000.
    host = os.environ.get("ONCOSUITE_HOST", "127.0.0.1")
    port = int(os.environ.get("ONCOSUITE_PORT", "8000"))
    addr = (host, port)
    print(f"OncoSuite web interface running at http://{addr[0]}:{addr[1]}")
    print("Press Ctrl+C to stop.")
    ThreadingHTTPServer(addr, Handler).serve_forever()