import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import ChartBlock from "./charts/ChartBlock.jsx";
import MapOrTable from "./charts/MapOrTable.jsx";
import StepTrace from "./components/StepTrace.jsx";
import StepsSummary from "./components/StepsSummary.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Welcome from "./components/Welcome.jsx";
import useChats from "./useChats.js";
import { askFast } from "./api.js";

/* Answer shell.

   Answers arrive as typed blocks: `html` for everything web_app.py already
   renders (trial detail, search results, landscape, arm comparison), plus
   native `chart` / `insights` / `note` blocks for the cohort dashboard. */

// ctsearch's real executive-summary drawer, used unmodified. It reads
// state.trials.isAlertActive, so it runs inside ctsearch's own redux store (see
// the Provider in main.jsx), and it fetches search/ExecutiveSummary -- which
// this app serves from oncosuite_gold.summary (executive_summary.py).
const ExecutiveSummaryDrawer = lazy(
  () => import("@ct/pages/trialsHeader/analytics/ExecuiteSummaryDrawer"),
);

// ctsearch's own right-hand drawer shell (MUI Drawer, anchor="right"), so the
// panel slides in from the edge exactly as it does in that app rather than
// appearing as a centred modal.
const CommonRightDrawer = lazy(() => import("@ct/common/CommonRightDrawer"));

/* Paginated answer tables.

   web_app.py emits every row with a data-page marker plus a .tbl-pager control.
   Showing a page is a class toggle -- no re-fetch -- and because all rows stay
   in the DOM the Download CSV export still covers the full result set. */
function showPage(block, page) {
  const pager = block.querySelector(".tbl-pager");
  const pages = Number(pager?.dataset.pages || 1);
  const current = Math.min(Math.max(1, page), pages);

  block.querySelectorAll("tbody tr").forEach((tr) => {
    tr.classList.toggle("pg-hidden", Number(tr.dataset.page || 1) !== current);
  });

  if (!pager) return;
  pager.dataset.page = String(current);
  pager.querySelectorAll(".pg-num").forEach((b) => {
    if (Number(b.dataset.page) === current) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const prev = pager.querySelector(".pg-prev");
  const next = pager.querySelector(".pg-next");
  if (prev) prev.disabled = current === 1;
  if (next) next.disabled = current === pages;
}

function applyPage(button) {
  const block = button.closest(".tbl-block");
  const pager = button.closest(".tbl-pager");
  if (!block || !pager) return;
  const current = Number(pager.dataset.page || 1);
  if (button.classList.contains("pg-prev")) showPage(block, current - 1);
  else if (button.classList.contains("pg-next")) showPage(block, current + 1);
  else if (button.classList.contains("pg-num")) showPage(block, Number(button.dataset.page));
}

/* Server-rendered answer HTML (trial detail, search results, landscape, ...).

   The markup is produced by web_app.py from this app's own database rows, not
   from user input. Collapsing paginated tables has to happen in an effect: a
   ref callback fires before React injects dangerouslySetInnerHTML, so the rows
   would not exist yet. */
function ServerAnswer({ html, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll(".tbl-block[data-pages]").forEach((blk) => showPage(blk, 1));
  }, [html]);

  return (
    <div
      ref={ref}
      className="server-answer"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Efficacy-vs-Safety and Adverse Events sit side by side in the design; pair
// them into one row when both are present.
const PAIRED = ["EfficacySafetyScatter", "AdverseEventsTable"];

function groupBlocks(list) {
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const b = list[i];
    const next = list[i + 1];
    if (
      b.type === "chart" && next?.type === "chart" &&
      PAIRED.includes(b.chart) && PAIRED.includes(next.chart)
    ) {
      out.push({ type: "row", items: [b, next] });
      i += 1;
    } else {
      out.push(b);
    }
  }
  return out;
}

function Answer({ blocks, onOpenSummary, onServerAnswerClick }) {
  const list = blocks || [];
  if (!list.length) {
    return (
      <div style={{ color: "rgba(0,0,0,0.5)", fontSize: 14 }}>
        No matching data for this question.
      </div>
    );
  }

  return (
    <div>
      {groupBlocks(list).map((b, i) => {
        if (b.type === "row") {
          return (
            <div
              key={i}
              style={{
                display: "grid", gap: 16, margin: "16px 0",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              }}
            >
              {b.items.map((it, j) => (
                <ChartBlock
                  key={j}
                  chart={it.chart}
                  props={it.props}
                  onOpenSummary={onOpenSummary}
                />
              ))}
            </div>
          );
        }

        if (b.type === "html") {
          return <ServerAnswer key={i} html={b.html} onClick={onServerAnswerClick} />;
        }

        if (b.type === "intro") {
          // Framing sentence above the data. Only **bold** is supported, and
          // the text is built from query results in answer_insights.py -- not
          // from user input -- so the split-and-wrap below is safe.
          return (
            <p
              key={i}
              style={{
                fontSize: 15, lineHeight: 1.6, margin: "0 0 14px",
                color: "rgba(0,0,0,0.75)",
              }}
            >
              {b.text.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                j % 2 ? <strong key={j}>{part}</strong> : part,
              )}
            </p>
          );
        }

        if (b.type === "summary") {
          return (
            <div key={i} style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>
              {b.text}
            </div>
          );
        }

        if (b.type === "insights") {
          return (
            <div
              key={i}
              style={{
                margin: "16px 0", padding: 16, borderRadius: 4,
                background: "#F7FBFF", borderTop: "1px solid #F0F6FE",
                display: "flex", flexDirection: "column", gap: 4,
              }}
            >
              <h3
                style={{
                  margin: 0, fontSize: 16, fontWeight: 500,
                  color: "rgba(0,0,0,0.8)",
                }}
              >
                {b.title || "Key Insights"}
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", color: "rgba(0,0,0,0.7)" }}>
                {(b.items || []).map((t, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      fontSize: 14, lineHeight: "22px", marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 6, height: 6, marginTop: 8, borderRadius: "50%",
                        background: "rgba(0,0,0,0.2)", flexShrink: 0,
                      }}
                    />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (b.type === "note") {
          return (
            <div
              key={i}
              style={{
                margin: "16px 0", padding: "12px 14px", borderRadius: 8,
                background: "#fffaf0", border: "1px solid #f2d091",
                fontSize: 13, color: "rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {b.title || "Not shown — data not available"}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(b.items || []).map((t, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>{t}</li>
                ))}
              </ul>
            </div>
          );
        }

        if (b.type === "chart") {
          // MapView and UsHeatMap size themselves to height:"100%", which
          // collapses to 0px (invisible, but still mounted -- tiles/data load
          // fine, nothing ever appears) unless an ancestor gives them a real
          // height to fill -- MapOrTable's Map View branch supplies that;
          // Table View needs no fixed height, so it isn't set here at all.
          //
          // Only PopulationMap/CaseBurdenMap get the Table View toggle: both
          // share the same rich per-point shape (map_data.py's
          // build_case_burden_*), so one PanelTable column set fits both.
          // SiteMap's points are a different, sparser shape ({longitude,
          // latitude, name, value} -- see chart_data.py's build_site_map), so
          // it stays map-only rather than showing a wrong/empty table.
          const hasTableToggle = b.chart === "PopulationMap" || b.chart === "CaseBurdenMap";
          const isMapOnly = b.chart === "SiteMap";
          return (
            <div key={i} style={{ margin: "16px 0", height: isMapOnly ? 480 : undefined }}>
              {hasTableToggle ? (
                <MapOrTable chart={b.chart} props={b.props} onOpenSummary={onOpenSummary} />
              ) : (
                <ChartBlock chart={b.chart} props={b.props} onOpenSummary={onOpenSummary} />
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function App() {
  const {
    chats, activeId, active,
    setActiveId, newChat, addMessage, renameChat, togglePin, deleteChat,
  } = useChats();

  const [steps, setSteps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  // OncoSuite id whose executive-summary drawer is open (null = closed).
  const [drawerId, setDrawerId] = useState(null);
  const threadRef = useRef(null);
  const taRef = useRef(null);

  const messages = active?.messages || [];

  const openSummary = useCallback((row) => {
    setDrawerId(typeof row === "string" ? row : row?.oncosuite_id ?? null);
  }, []);

  const scrollDown = useCallback(() => {
    const el = threadRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, []);

  const send = useCallback(
    async (text) => {
      const q = (text ?? input).trim();
      if (!q || busy) return;
      setInput("");
      if (taRef.current) taRef.current.style.height = "auto";
      setBusy(true);
      setSteps([]);
      addMessage({ role: "user", q });
      scrollDown();

      const liveSteps = [];
      try {
        const result = await askFast(q, (s) => {
          liveSteps.push(s);
          setSteps((prev) => [...prev, s]);
          scrollDown();
        });
        addMessage({ role: "bot", blocks: result.blocks, steps: liveSteps });
      } catch (e) {
        addMessage({ role: "bot", error: String(e), steps: liveSteps });
      } finally {
        setBusy(false);
        setSteps([]);
        scrollDown();
      }
    },
    [input, busy, addMessage, scrollDown],
  );

  // The server-rendered answer HTML ships its own controls (Download CSV with a
  // base64 payload, clickable cohort rows, Next Steps buttons). Those relied on
  // a delegated listener in the old page, so re-implement it here.
  const onServerAnswerClick = useCallback(
    (e) => {
      // Trial ids in the rendered answer are wrapped as .trial-link by
      // answer_fast.linkify_trial_ids. NCT ids are resolved to their
      // oncosuite_id server-side, so either form can be passed straight on.
      const trial = e.target.closest?.(".trial-link");
      if (trial) {
        e.preventDefault();
        setDrawerId(trial.getAttribute("data-trial-id"));
        return;
      }
      const dl = e.target.closest?.(".dl-btn");
      if (dl) {
        const csv = atob(dl.getAttribute("data-csv") || "");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = dl.getAttribute("data-name") || "table.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const pg = e.target.closest?.(".tbl-pager button");
      if (pg) {
        applyPage(pg);
        return;
      }

      const ask = e.target.closest?.(".nextstep, .cohort-row");
      const q = ask?.getAttribute("data-q");
      if (q) send(q);
    },
    [send],
  );

  const autogrow = (el) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => { newChat(); taRef.current?.focus(); }}
        onPin={togglePin}
        onRename={renameChat}
        onDelete={deleteChat}
      />

      <main className="main">
        <div className="thread" ref={threadRef}>
          <div className="thread-inner">
            {!messages.length && !busy ? <Welcome onPick={send} /> : null}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div className="msg user" key={i}>
                  <div className="avatar user">You</div>
                  <div className="msg-body">{m.q}</div>
                </div>
              ) : (
                <div className="msg bot" key={i}>
                  <div className="avatar bot">AI</div>
                  <div className="msg-body">
                    <StepsSummary steps={m.steps} />
                    {m.error ? (
                      <div className="card error">{m.error}</div>
                    ) : (
                      <Answer
                        blocks={m.blocks}
                        onOpenSummary={openSummary}
                        onServerAnswerClick={onServerAnswerClick}
                      />
                    )}
                  </div>
                </div>
              ),
            )}

            {busy ? (
              <div className="msg bot">
                <div className="avatar bot">AI</div>
                <div className="msg-body">
                  <StepTrace steps={steps} />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="composer">
          <div className="composer-inner">
            <form className="bar" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <button
                className="plus-btn"
                type="button"
                title="New query"
                onClick={() => { newChat(); taRef.current?.focus(); }}
              >
                +
              </button>
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                placeholder="Ask anything"
                onChange={(e) => { setInput(e.target.value); autogrow(e.target); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className="send-btn" type="submit" disabled={busy} title="Send">
                ↑
              </button>
            </form>
            <div className="composer-hint">
              Press Enter to send · Shift+Enter for a new line
            </div>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <CommonRightDrawer
          open={Boolean(drawerId)}
          onClose={() => setDrawerId(null)}
          onBack={() => setDrawerId(null)}
          title="Executive Summary"
          width="min(1100px, 92vw)"
          contentSx={{ pt: 0 }}
        >
          {drawerId ? <ExecutiveSummaryDrawer nctId={drawerId} /> : null}
        </CommonRightDrawer>
      </Suspense>
    </div>
  );
}
