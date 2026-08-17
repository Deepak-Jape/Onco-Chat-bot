# """
# Hybrid web interface. Chat-style UI on top of hybrid.handle():
#   keyword fast-path -> text-to-SQL -> vector fallback -> honest refusal,
# with conversation memory so follow-ups work.

# Keeps the original web_app.py untouched -- this is the "add-on" surface. Reuses
# web_app's structured renderers for keyword answers, and renders SQL / vector /
# refusal answers in their own styles.

# Run:  python hybrid_app.py     (open http://127.0.0.1:8080)

# Backend is chosen by config.LLM_BACKEND:
#   - "off"    : behaves like the keyword app (safe default until Ollama is installed)
#   - "ollama" : local model (install Ollama + `ollama pull qwen2.5-coder:7b`)
#   - "claude" : Claude API (set ANTHROPIC_API_KEY)
# """
# import html
# import json
# from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
# from urllib.parse import parse_qs, urlparse

# import config
# import llm_client
# from hybrid import handle
# from conversation import conversations
# from web_app import esc, render_answer, to_plain

# SESSION_ID = "hybrid-web"


# def _badge(path):
#     colors = {"keyword": "#4c8bf5", "sql": "#38b48b", "vector": "#b37ddb", "refusal": "#b3892f"}
#     labels = {"keyword": "fast-path", "sql": "text-to-SQL", "vector": "semantic search", "refusal": "no answer"}
#     c = colors.get(path, "#8b95a7")
#     return f'<span class="badge" style="background:{c}">{labels.get(path, path)}</span>'


# def render_result(res, question):
#     path = res["path"]
#     head = f'<div class="pathline">{_badge(path)} <span class="backend">{esc(res.get("backend"))}</span></div>'

#     if path == "keyword":
#         return head + render_answer(res["keyword_result"], question)

#     if path == "sql":
#         parts = [head]
#         if res.get("answer"):
#             parts.append(f'<div class="card answer-card">{esc(res["answer"])}</div>')
#         rows = res.get("rows") or []
#         if rows:
#             parts.append(_render_rows_table(rows))
#         if res.get("sql"):
#             parts.append(f'<details class="sql"><summary>SQL used</summary>'
#                          f'<pre>{esc(res["sql"])}</pre></details>')
#         return "".join(parts)

#     if path == "vector":
#         parts = [head]
#         if res.get("answer"):
#             parts.append(f'<div class="card answer-card">{esc(res["answer"])}</div>')
#         for r in res.get("vector_results") or []:
#             parts.append(
#                 f'<div class="card"><div class="tag">{esc(r["table"])}.{esc(r["field"])} '
#                 f'&middot; score {esc(r["score"])}</div><p class="title">{esc(r["snippet"])}</p></div>'
#             )
#         return "".join(parts)

#     # refusal
#     return head + f'<div class="card warn">{esc(res.get("answer"))}</div>'


# def _render_rows_table(rows):
#     keys = list(rows[0].keys())
#     thead = "".join(f"<th>{esc(k)}</th>" for k in keys)
#     body = ""
#     for row in rows[:100]:
#         body += "<tr>" + "".join(f"<td>{esc(row.get(k))}</td>" for k in keys) + "</tr>"
#     more = f'<p class="count">showing {min(len(rows),100)} of {len(rows)} rows</p>' if len(rows) > 100 else ""
#     return (f'<div class="card"><div style="overflow:auto">'
#             f'<table><thead><tr>{thead}</tr></thead><tbody>{body}</tbody></table></div>{more}</div>')


# def render_transcript(session_id):
#     turns = conversations.history(session_id)
#     if not turns:
#         return ""
#     bubbles = []
#     for t in turns:
#         who = "you" if t["role"] == "user" else "assistant"
#         # skip internal assistant placeholders like "[structured answer via ...]"
#         content = t["content"]
#         if t["role"] == "assistant" and content.startswith("["):
#             continue
#         bubbles.append(f'<div class="bubble {who}"><span class="who">{who}</span>{esc(content)}</div>')
#     if not bubbles:
#         return ""
#     return '<div class="transcript"><h4>Conversation</h4>' + "".join(bubbles) + "</div>"


# PAGE = """<!doctype html>
# <html><head><meta charset="utf-8"><title>OncoSuite Assistant (Hybrid)</title>
# <meta name="viewport" content="width=device-width, initial-scale=1">
# <style>
#  *{{box-sizing:border-box}} body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f1420;color:#e6eaf2}}
#  .wrap{{max-width:900px;margin:0 auto;padding:26px 20px 60px}}
#  h1{{font-size:20px;margin:0 0 2px}} .sub{{color:#8b95a7;font-size:13px;margin:0 0 6px}}
#  .status{{font-size:12px;margin:0 0 18px}} .ok{{color:#38b48b}} .bad{{color:#d98b8b}}
#  form{{display:flex;gap:10px;margin-bottom:8px}}
#  input[type=text]{{flex:1;padding:12px 14px;border-radius:10px;border:1px solid #2a3446;background:#161c2b;color:#e6eaf2;font-size:15px}}
#  button{{padding:12px 20px;border:0;border-radius:10px;background:#4c8bf5;color:#fff;font-size:15px;font-weight:600;cursor:pointer}}
#  a.reset{{font-size:12px;color:#8b95a7;text-decoration:none}}
#  .pathline{{margin:6px 0 10px;font-size:12px}} .badge{{color:#fff;padding:3px 9px;border-radius:6px;font-weight:600}}
#  .backend{{color:#8b95a7;margin-left:8px}}
#  .card{{background:#161c2b;border:1px solid #232c3d;border-radius:12px;padding:16px 18px;margin-bottom:14px}}
#  .card.warn{{border-color:#b3892f}} .card.error{{border-color:#b3392f;color:#ffb3ad}}
#  .answer-card{{border-left:4px solid #38b48b;font-size:15px;line-height:1.5}}
#  .tag{{display:inline-block;font-size:11px;background:#22304a;color:#9fc0ff;padding:3px 8px;border-radius:6px;margin-bottom:6px}}
#  .title{{color:#c7cfdd;font-size:14px;line-height:1.45;margin:0 0 12px}}
#  h2{{font-size:17px;margin:2px 0 6px}} h3{{font-size:15px;margin:2px 0 8px}}
#  /* shared classes required by web_app.render_answer renderers */
#  .meta{{font-size:12px;color:#8b95a7;margin-bottom:10px}}
#  .answer{{background:#13233a;border:1px solid #2f5fa8;border-left:4px solid #4c8bf5;border-radius:10px;padding:14px 18px;margin-bottom:14px}}
#  .answer-lbl{{display:block;font-size:12px;color:#9fc0ff;text-transform:uppercase;letter-spacing:.05em}}
#  .answer-val{{display:block;font-size:22px;font-weight:700;color:#fff;margin-top:2px}}
#  .answer-sub{{font-size:12px;color:#8b95a7}}
#  .grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:6px 0}}
#  .lbl{{display:block;font-size:11px;color:#8b95a7;text-transform:uppercase;letter-spacing:.04em}}
#  .crit-block{{margin-top:6px}}
#  .crit-row{{display:flex;gap:10px;padding:4px 0;border-bottom:1px solid #202839;font-size:13px}}
#  .crit-key{{min-width:150px;color:#9fb3d9}} .crit-val{{flex:1}}
#  .arm{{border-left:3px solid #4c8bf5;padding:8px 12px;margin:10px 0;background:#131a28;border-radius:0 8px 8px 0}}
#  .arm-desc{{font-size:13px;color:#c7cfdd;margin:4px 0}} .arm-drug{{font-size:12px;color:#9fb3d9}}
#  .pill{{font-size:11px;background:#2a3446;padding:2px 7px;border-radius:5px;color:#c7cfdd}}
#  .muted{{color:#8b95a7}}
#  table{{width:100%;border-collapse:collapse;font-size:13px}} th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid #232c3d}} th{{color:#9fb3d9}}
#  pre{{white-space:pre-wrap;font-size:12px;color:#c7cfdd;margin:0}}
#  details.sql summary{{cursor:pointer;color:#8b95a7;font-size:12px}} .count{{color:#8b95a7;font-size:12px}}
#  .transcript{{margin-top:26px;border-top:1px solid #232c3d;padding-top:14px}}
#  .transcript h4{{color:#8b95a7;font-size:12px;text-transform:uppercase;letter-spacing:.05em}}
#  .bubble{{padding:8px 12px;border-radius:10px;margin:6px 0;font-size:13px;max-width:80%}}
#  .bubble .who{{display:block;font-size:10px;color:#8b95a7;text-transform:uppercase;margin-bottom:2px}}
#  .bubble.you{{background:#1c2740;margin-left:auto}} .bubble.assistant{{background:#161c2b;border:1px solid #232c3d}}
#  .examples{{font-size:12px;color:#8b95a7;margin:4px 0 16px}} .examples a{{margin-right:12px}}
#  h4{{font-size:13px;margin:14px 0 6px;color:#9fb3d9;text-transform:uppercase;letter-spacing:.04em}}
# </style></head>
# <body><div class="wrap">
#  <h1>OncoSuite Assistant <span style="color:#8b95a7;font-size:13px">(hybrid)</span></h1>
#  <p class="sub">Keyword fast-path &rarr; text-to-SQL &rarr; semantic search &rarr; honest refusal. Remembers the conversation.</p>
#  <p class="status">Backend: <span class="{statusclass}">{status}</span></p>
#  <form method="get" action="/">
#    <input type="text" name="q" value="{q}" placeholder="Ask anything about the trial database..." autofocus>
#    <button type="submit">Ask</button>
#  </form>
#  <div class="examples">
#    <a href="/?q=what+phase+is+NCT06881784">phase of a trial</a>
#    <a href="/?q=how+many+trials+are+recruiting">count (SQL)</a>
#    <a href="/?q=which+sponsors+have+the+most+trials">aggregate (SQL)</a>
#    <a href="/reset">reset chat</a>
#  </div>
#  {result}
#  {transcript}
# </div></body></html>"""


# class Handler(BaseHTTPRequestHandler):
#     def do_GET(self):
#         parsed = urlparse(self.path)
#         if parsed.path == "/reset":
#             conversations.reset(SESSION_ID)
#             self._redirect("/")
#             return
#         if parsed.path not in ("/", "/index.html"):
#             self.send_error(404)
#             return
#         q = parse_qs(parsed.query).get("q", [""])[0].strip()
#         result_html = ""
#         if q:
#             try:
#                 res = handle(SESSION_ID, q)
#                 result_html = render_result(res, q)
#             except Exception as e:  # never let the page die
#                 result_html = f'<div class="card warn">Error: {esc(e)}</div>'
#         ok, detail = llm_client.health()
#         body = PAGE.format(
#             q=html.escape(q), result=result_html,
#             transcript=render_transcript(SESSION_ID),
#             status=html.escape(detail), statusclass="ok" if ok else "bad",
#         ).encode("utf-8")
#         self.send_response(200)
#         self.send_header("Content-Type", "text/html; charset=utf-8")
#         self.send_header("Content-Length", str(len(body)))
#         self.end_headers()
#         self.wfile.write(body)

#     def _redirect(self, to):
#         self.send_response(302)
#         self.send_header("Location", to)
#         self.end_headers()

#     def log_message(self, *a):
#         pass


# if __name__ == "__main__":
#     addr = ("127.0.0.1", 8080)
#     print(f"OncoSuite HYBRID interface at http://{addr[0]}:{addr[1]}")
#     print(f"Backend: {config.backend_summary()}")
#     print("Press Ctrl+C to stop.")
#     ThreadingHTTPServer(addr, Handler).serve_forever()





"""
Hybrid web interface. Chat-style UI on top of hybrid.handle():
  keyword fast-path -> text-to-SQL -> vector fallback -> honest refusal,
with conversation memory so follow-ups work.

Keeps the original web_app.py untouched -- this is the "add-on" surface. Reuses
web_app's structured renderers for keyword answers, and renders SQL / vector /
refusal answers in their own styles.

Run:  python hybrid_app.py     (open http://127.0.0.1:8080)

Backend is chosen by config.LLM_BACKEND:
  - "off"    : behaves like the keyword app (safe default until Ollama is installed)
  - "ollama" : local model (install Ollama + `ollama pull qwen2.5-coder:7b`)
  - "claude" : Claude API (set ANTHROPIC_API_KEY)
"""
import html
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import config
import llm_client
from hybrid import handle
from conversation import conversations
from web_app import esc, render_answer, render_markdown_lite, to_plain
from charts import bar_chart

SESSION_ID = "hybrid-web"


def _badge(path):
    colors = {"keyword": "#4c8bf5", "sql": "#38b48b", "vector": "#b37ddb",
              "general_knowledge": "#d68a2b", "refusal": "#8b95a7"}
    labels = {"keyword": "your database", "sql": "your database (text-to-SQL)",
              "vector": "your database (semantic search)",
              "general_knowledge": "general knowledge \u2014 NOT your database", "refusal": "no answer"}
    c = colors.get(path, "#8b95a7")
    return f'<span class="badge" style="background:{c}">{labels.get(path, path)}</span>'


def render_result(res, question):
    path = res["path"]
    head = f'<div class="pathline">{_badge(path)} <span class="backend">{esc(res.get("backend"))}</span></div>'

    if path == "keyword":
        return head + render_answer(res["keyword_result"], question)

    if path == "sql":
        parts = [head]
        rows = res.get("rows") or []
        chart_html = _maybe_chart(rows)
        if res.get("answer"):
            parts.append(f'<div class="card answer-card synth-body">'
                         f'{render_markdown_lite(res["answer"])}</div>')
        if chart_html:
            parts.append(f'<div class="card">{chart_html}</div>')
        if rows:
            parts.append(_render_rows_table(rows))
        if res.get("sql"):
            parts.append(f'<details class="sql"><summary>SQL used</summary>'
                         f'<pre>{esc(res["sql"])}</pre></details>')
        return "".join(parts)

    if path == "vector":
        parts = [head]
        if res.get("answer"):
            parts.append(f'<div class="card answer-card synth-body">'
                         f'{render_markdown_lite(res["answer"])}</div>')
        for r in res.get("vector_results") or []:
            parts.append(
                f'<div class="card"><div class="tag">{esc(r["table"])}.{esc(r["field"])} '
                f'&middot; score {esc(r["score"])}</div><p class="title">{esc(r["snippet"])}</p></div>'
            )
        return "".join(parts)

    if path == "general_knowledge":
        return (head
                + '<div class="card warn"><p class="muted" style="margin:0 0 8px">'
                + esc(res.get("note", "Not sourced from your trial database."))
                + f'</p><div class="answer-card synth-body">{render_markdown_lite(res.get("answer") or "")}</div></div>')

    # refusal
    return head + f'<div class="card warn">{esc(res.get("answer"))}</div>'


def _maybe_chart(rows):
    """SQL rows shaped as (label, numeric value) pairs -- e.g. a GROUP BY count/aggregate --
    read better as a bar chart than as a table. Anything else (many columns, non-numeric
    value column) is left to the rows table below."""
    if not rows or len(rows) < 2:
        return ""
    keys = list(rows[0].keys())
    if len(keys) != 2:
        return ""
    label_key, value_key = keys

    def is_num(v):
        return isinstance(v, (int, float)) and not isinstance(v, bool)

    if not all(is_num(r.get(value_key)) for r in rows):
        return ""
    data = [(r.get(label_key), r.get(value_key)) for r in rows[:15]]
    return bar_chart(data, title=str(label_key).replace("_", " ").title())


def _render_rows_table(rows):
    keys = list(rows[0].keys())
    thead = "".join(f"<th>{esc(k)}</th>" for k in keys)
    body = ""
    for row in rows[:100]:
        body += "<tr>" + "".join(f"<td>{esc(row.get(k))}</td>" for k in keys) + "</tr>"
    more = f'<p class="count">showing {min(len(rows),100)} of {len(rows)} rows</p>' if len(rows) > 100 else ""
    return (f'<div class="card"><div style="overflow:auto">'
            f'<table><thead><tr>{thead}</tr></thead><tbody>{body}</tbody></table></div>{more}</div>')


PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><title>OncoSuite Assistant (Hybrid)</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
 *{{box-sizing:border-box}} body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f1420;color:#e6eaf2}}
 .wrap{{max-width:900px;margin:0 auto;padding:26px 20px 60px}}
 h1{{font-size:20px;margin:0 0 2px}} .sub{{color:#8b95a7;font-size:13px;margin:0 0 6px}}
 .status{{font-size:12px;margin:0 0 18px}} .ok{{color:#38b48b}} .bad{{color:#d98b8b}}
 form{{display:flex;gap:10px;margin-bottom:8px}}
 input[type=text]{{flex:1;padding:12px 14px;border-radius:10px;border:1px solid #2a3446;background:#161c2b;color:#e6eaf2;font-size:15px}}
 button{{padding:12px 20px;border:0;border-radius:10px;background:#4c8bf5;color:#fff;font-size:15px;font-weight:600;cursor:pointer}}
 a.reset{{font-size:12px;color:#8b95a7;text-decoration:none}}
 .pathline{{margin:6px 0 10px;font-size:12px}} .badge{{color:#fff;padding:3px 9px;border-radius:6px;font-weight:600}}
 .backend{{color:#8b95a7;margin-left:8px}}
 .card{{background:#161c2b;border:1px solid #232c3d;border-radius:12px;padding:16px 18px;margin-bottom:14px}}
 .card.warn{{border-color:#b3892f}} .card.error{{border-color:#b3392f;color:#ffb3ad}}
 .answer-card{{border-left:4px solid #38b48b;font-size:15px;line-height:1.5}}
 .tag{{display:inline-block;font-size:11px;background:#22304a;color:#9fc0ff;padding:3px 8px;border-radius:6px;margin-bottom:6px}}
 .title{{color:#c7cfdd;font-size:14px;line-height:1.45;margin:0 0 12px}}
 h2{{font-size:17px;margin:2px 0 6px}} h3{{font-size:15px;margin:2px 0 8px}}
 /* shared classes required by web_app.render_answer renderers */
 .meta{{font-size:12px;color:#8b95a7;margin-bottom:10px}}
 .answer{{background:#13233a;border:1px solid #2f5fa8;border-left:4px solid #4c8bf5;border-radius:10px;padding:14px 18px;margin-bottom:14px}}
 .answer-lbl{{display:block;font-size:12px;color:#9fc0ff;text-transform:uppercase;letter-spacing:.05em}}
 .answer-val{{display:block;font-size:22px;font-weight:700;color:#fff;margin-top:2px}}
 .answer-sub{{font-size:12px;color:#8b95a7}}
 .grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:6px 0}}
 .lbl{{display:block;font-size:11px;color:#8b95a7;text-transform:uppercase;letter-spacing:.04em}}
 .crit-block{{margin-top:6px}}
 .crit-row{{display:flex;gap:10px;padding:4px 0;border-bottom:1px solid #202839;font-size:13px}}
 .crit-key{{min-width:150px;color:#9fb3d9}} .crit-val{{flex:1}}
 .arm{{border-left:3px solid #4c8bf5;padding:8px 12px;margin:10px 0;background:#131a28;border-radius:0 8px 8px 0}}
 .arm-desc{{font-size:13px;color:#c7cfdd;margin:4px 0}} .arm-drug{{font-size:12px;color:#9fb3d9}}
 .pill{{font-size:11px;background:#2a3446;padding:2px 7px;border-radius:5px;color:#c7cfdd}}
 .muted{{color:#8b95a7}}
 table{{width:100%;border-collapse:collapse;font-size:13px}} th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid #232c3d}} th{{color:#9fb3d9}}
 pre{{white-space:pre-wrap;font-size:12px;color:#c7cfdd;margin:0}}
 details.sql summary{{cursor:pointer;color:#8b95a7;font-size:12px}} .count{{color:#8b95a7;font-size:12px}}
 .examples{{font-size:12px;color:#8b95a7;margin:4px 0 16px}} .examples a{{margin-right:12px}}
 .chart-wrap{{margin:14px 0}} .chart-title{{font-size:13px;font-weight:600;color:#e6eaf2;margin:0 0 8px}}
 .data-table{{width:100%;border-collapse:collapse;font-size:13px}}
 .data-table th{{text-align:left;color:#8b95a7;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:6px 10px;border-bottom:1px solid #232c3d}}
 .data-table td{{padding:7px 10px;border-bottom:1px solid #1a2131;color:#e6eaf2}}
 .data-table tr:hover td{{background:#161c2b}}
 .synth-h{{font-size:13px;color:#9fc0ff;margin:14px 0 4px;text-transform:uppercase;letter-spacing:.04em}}
 .synth-body p{{margin:4px 0;line-height:1.5}} .synth-body ul{{margin:4px 0;padding-left:20px}}
 .synth-hr{{border:0;border-top:1px solid #232c3d;margin:14px 0}}
 h4{{font-size:13px;margin:14px 0 6px;color:#9fb3d9;text-transform:uppercase;letter-spacing:.04em}}
</style></head>
<body><div class="wrap">
 <h1>OncoSuite Assistant <span style="color:#8b95a7;font-size:13px">(hybrid)</span></h1>
 <p class="sub">Keyword fast-path &rarr; text-to-SQL &rarr; semantic search &rarr; honest refusal. Remembers the conversation.</p>
 <p class="status">Backend: <span class="{statusclass}">{status}</span></p>
 <form method="get" action="/">
   <input type="text" name="q" value="{q}" placeholder="Ask anything about the trial database..." autofocus>
   <button type="submit">Ask</button>
 </form>
 <div class="examples">
   <a href="/?q=what+phase+is+NCT06881784">phase of a trial</a>
   <a href="/?q=how+many+trials+are+recruiting">count (SQL)</a>
   <a href="/?q=which+sponsors+have+the+most+trials">aggregate (SQL)</a>
   <a href="/reset">reset chat</a>
 </div>
 {result}
</div></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/reset":
            conversations.reset(SESSION_ID)
            self._redirect("/")
            return
        if parsed.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        q = parse_qs(parsed.query).get("q", [""])[0].strip()
        result_html = ""
        if q:
            try:
                res = handle(SESSION_ID, q)
                result_html = render_result(res, q)
            except Exception as e:  # never let the page die
                result_html = f'<div class="card warn">Error: {esc(e)}</div>'
        ok, detail = llm_client.health()
        body = PAGE.format(
            q=html.escape(q), result=result_html,
            status=html.escape(detail), statusclass="ok" if ok else "bad",
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _redirect(self, to):
        self.send_response(302)
        self.send_header("Location", to)
        self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    addr = ("127.0.0.1", 8080)
    print(f"OncoSuite HYBRID interface at http://{addr[0]}:{addr[1]}")
    print(f"Backend: {config.backend_summary()}")
    print("Press Ctrl+C to stop.")
    ThreadingHTTPServer(addr, Handler).serve_forever()