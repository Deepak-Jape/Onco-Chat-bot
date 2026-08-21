import { useMemo, useState } from "react";
import { BUTTON, C, CARD_TITLE, FONT, statusColor as STATUS_COLOR } from "./tokens";
import arrowIcon from "../assets/arrow.svg";

/* Cohort table built to the Figma spec.

   Values taken from the shared Figma inspector panels:
     header row   : bg rgba(249,249,251,1), height 43px, radius 4px top,
                    1px border rgba(0,0,0,0.05), padding 15px, gap 8px,
                    drop shadow 1px 8px 34px rgba(153,169,190,0.10)
     header label : 14px / weight 500 (Medium) / rgba(0,0,0,0.8), 20px line
     ID cell      : 14px / 500 / rgba(38,102,190,1)  (Info/600), 18px line
     text cell    : 14px / 400 (Regular) / rgba(0,0,0,0.7), 18px line
     status OK    : 14px / 400 / rgba(75,145,78,1)
   Sub-values (Enrolled counts, CI ranges) render italic and muted beneath the
   primary value, matching the mock.

   A cell with no value renders an em dash: these columns are genuinely empty
   for some cohorts and must not be filled with invented numbers. */

const COLUMNS = [
  { key: "oncosuite_id", label: "OncoSuite ID", width: 118, kind: "id" },
  { key: "phase", label: "Phase", width: 92, filter: true },
  { key: "year", label: "Year", width: 80, filter: true },
  { key: "indication", label: "Indication", width: 150 },
  { key: "regimen", label: "Regimen", width: 170, kind: "regimen" },
  { key: "n", label: "N", width: 118, kind: "stacked" },
  { key: "status", label: "Status", width: 120, kind: "status", filter: true },
  { key: "os", label: "OS", width: 118, kind: "metric" },
  { key: "orr", label: "ORR", width: 118, kind: "metric" },
  { key: "pfs", label: "PFS", width: 118, kind: "metric" },
];

const PAGE_SIZE = 10;

/* Vertical rule between columns: a left border on every cell after the first.

   The row itself must NOT use `gap` -- a flex gap is unbordered space, so any
   gap leaves the rule broken at every cell boundary. The 8px of breathing room
   the gap used to provide is inside the cell's own padding instead, which keeps
   each rule flush against its neighbour and continuous down the row. */
const divider = (first) =>
  first ? null : { borderLeft: `1px solid ${C.border}`, paddingLeft: 8 };

function HeaderCell({ col, first, openFilter, setOpenFilter, values, selected, onToggle }) {
  const isOpen = openFilter === col.key;

  /* Hover-to-open. Both handlers live on the wrapper (which contains the label,
     the arrow AND the popup) rather than on the button, so moving the cursor
     down into the popup never counts as leaving -- otherwise the popup would
     unmount before a checkbox could be clicked.

     Leaving closes immediately, but only if this column is the open one: a
     mouseleave firing after the user has already hovered a *different* column
     must not close that newer popup. Click still works and still toggles, for
     keyboard/touch users where hover doesn't exist. */
  const hoverOpen = () => col.filter && setOpenFilter(col.key);
  const hoverClose = () => col.filter && setOpenFilter((k) => (k === col.key ? null : k));

  return (
    <div
      onMouseEnter={hoverOpen}
      onMouseLeave={hoverClose}
      style={{
        position: "relative", width: col.width, flexShrink: 0,
        // full-height rule in the 43px header, so it reads as one grid line.
        // Padding/box-sizing must match Cell's base exactly or the header
        // columns drift out of line with the body columns.
        alignSelf: "stretch", display: "flex", alignItems: "center",
        paddingRight: 8, boxSizing: "border-box",
        ...divider(first),
      }}
    >
      <button
        type="button"
        onClick={() => col.filter && setOpenFilter(isOpen ? null : col.key)}
        style={{
          display: "flex", alignItems: "center", gap: 4, border: 0, padding: 0,
          background: "transparent", cursor: col.filter ? "pointer" : "default",
          font: `500 14px/20px ${FONT}`, color: C.headText,
        }}
      >
        {col.label}
        {/* arrow.svg is a 9x5 chevron already filled Black/60; it flips to point
            up while that column's filter popup is open. */}
        {col.filter ? (
          <img
            src={arrowIcon}
            alt=""
            aria-hidden="true"
            width={9}
            height={5}
            style={{
              flexShrink: 0,
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 120ms ease",
            }}
          />
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="ct-filter-pop"
          style={{
            position: "absolute", top: 26, left: -8, zIndex: 30, minWidth: 132,
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6,
            boxShadow: "0 6px 20px rgba(16,24,40,.14)", padding: "6px 0",
            // The popup is offset 26px below the label, leaving a strip of dead
            // space the cursor must cross. A transparent top border keeps the
            // hover unbroken across it (background-clip so the white fill
            // doesn't show through the border box).
            borderTop: "26px solid transparent",
            backgroundClip: "padding-box",
            marginTop: -26,
          }}
        >
          <label style={rowStyle}>
            <input
              type="checkbox"
              checked={selected.length === 0}
              onChange={() => onToggle(null)}
            />
            <span>Select All</span>
          </label>
          {values.map((v) => (
            <label key={v} style={rowStyle}>
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={() => onToggle(v)}
              />
              <span>{v}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const rowStyle = {
  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
  font: `400 13px/18px ${FONT}`, color: C.body, cursor: "pointer",
};

function Cell({ col, row, first, onOpen }) {
  const raw = row[col.key];
  // overflowWrap keeps long values (drug names, indications) inside their own
  // column instead of bleeding into the neighbouring one.
  const base = {
    width: col.width, flexShrink: 0, font: `400 14px/18px ${FONT}`, color: C.body,
    alignSelf: "stretch", minWidth: 0, overflowWrap: "anywhere",
    // 12px vertical padding moved off the row (see the row's comment) so the
    // divider border stretches the row's whole height with no gap. 8px on the
    // right keeps text off the next column's rule (replaces the old flex gap).
    paddingTop: 12, paddingBottom: 12, paddingRight: 8,
    // border-box so paddingLeft/Right stay inside the column's declared width
    // and the columns keep lining up with the header.
    boxSizing: "border-box",
    ...divider(first),
  };

  if (col.kind === "id") {
    return (
      <button
        type="button"
        onClick={() => onOpen?.(row)}
        title="Open summary panel"
        style={{
          ...base, textAlign: "left", background: "transparent",
          // Keep base's divider AND its 12px vertical padding -- resetting
          // either one shortens this column's rule and reopens the gap.
          border: 0, ...divider(first),
          alignItems: "flex-start", display: "flex",
          cursor: "pointer", font: `500 14px/18px ${FONT}`, color: C.link,
        }}
      >
        {raw ?? "—"}
      </button>
    );
  }

  if (col.kind === "status") {
    return <div style={{ ...base, color: STATUS_COLOR(raw) }}>{raw ?? "—"}</div>;
  }

  // Regimen renders each drug as its own Slate/200 chip, stacked vertically and
  // joined by a "+" -- per the Figma frame (Hug 60x20, radius 4, 4px side
  // padding, 2px gap, Slate/200 fill, Black/600 14px/20px label).
  // Splits on "+" / "," / newline since search_cohorts STRING_AGGs drug names.
  if (col.kind === "regimen") {
    const drugs = String(raw ?? "")
      .split(/\s*[+,\n]\s*/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (!drugs.length) return <div style={base}>—</div>;
    return (
      <div
        style={{
          ...base, display: "flex", flexDirection: "column",
          alignItems: "flex-start", gap: 2, minWidth: 0, overflow: "hidden",
        }}
      >
        {drugs.map((drug, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "flex-start", gap: 4,
              maxWidth: "100%", minWidth: 0,
            }}
          >
            {i > 0 ? (
              <span style={{ font: `400 14px/20px ${FONT}`, color: C.muted, flexShrink: 0 }}>
                +
              </span>
            ) : null}
            {/* Long drug names ("Telisotuzumab Adizutecan") must wrap inside the
                chip rather than run past the column into the next one. */}
            <span
              style={{
                display: "inline-block", borderRadius: 4,
                // Figma's frame is a single-line Hug 60x20 with 4px sides; these
                // labels wrap to two lines, so the chip needs real vertical
                // padding and roomier sides to keep the text off the grey edge.
                padding: "3px 8px", background: C.chipBg,
                font: `400 14px/20px ${FONT}`, color: C.chipText,
                minWidth: 0, maxWidth: "100%",
                overflowWrap: "anywhere",
              }}
            >
              {drug}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // "187 (Planned) / 112 (Enrolled)" and "24.6 mo / 95% CI: ..." both render as
  // a primary line with an italic muted sub-line.
  if (col.kind === "stacked" || col.kind === "metric") {
    if (raw == null || raw === "") return <div style={base}>—</div>;
    const [first, ...rest] = String(raw).split("\n");
    return (
      <div style={base}>
        <div>{first}</div>
        {rest.map((line, i) => (
          <div key={i} style={{ font: `italic 400 12px/16px ${FONT}`, color: C.muted }}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  return <div style={base}>{raw ?? "—"}</div>;
}

// Base64 -> Blob -> anchor-click download, same pattern App.jsx already uses
// for the server-rendered answer's own .dl-btn (atob + Blob + object URL).
function downloadBase64(base64, filename, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function CohortTable({ data = [], onOpenSummary, title, xlsxBase64, xlsxFilename }) {
  const [openFilter, setOpenFilter] = useState(null);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const optionsFor = (key) =>
    [...new Set(data.map((r) => r[key]).filter(Boolean))].sort();

  const toggle = (key, value) => {
    setPage(1);
    setFilters((f) => {
      const cur = f[key] || [];
      if (value === null) return { ...f, [key]: [] };
      return {
        ...f,
        [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
      
    });
  };

  const rows = useMemo(
    () =>
      data.filter((r) =>
        Object.entries(filters).every(
          ([k, vals]) => !vals.length || vals.includes(r[k]),
        ),
      ),
    [data, filters],
  );

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const downloadCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const csv = [
      COLUMNS.map((c) => esc(c.label)).join(","),
      ...rows.map((r) => COLUMNS.map((c) => esc(r[c.key])).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "cohorts.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const totalWidth = COLUMNS.reduce((sum, c) => sum + c.width, 0) + 30;

  return (
    <div
      style={{ fontFamily: FONT }}
      // Close the filter popup on an outside click, but never when the click
      // landed inside it: a checkbox is not a <button>, so the old
      // "closest('button')" test unmounted the popup before React could deliver
      // the checkbox's onChange -- the filters never applied.
      onClick={(e) => {
        if (!e.target.closest?.(".ct-filter-pop") && !e.target.closest?.("button")) {
          setOpenFilter(null);
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        {title ? <h3 style={{ ...CARD_TITLE, padding: 0, margin: 0 }}>{title}</h3> : <span />}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={downloadCsv}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
              background: "#fff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 4,
              font: `500 14px/18px ${FONT}`, color: C.headText, cursor: "pointer",
            }}
          >
            Download CSV
          </button>
          {xlsxBase64 ? (
            <button
              type="button"
              onClick={() => downloadBase64(xlsxBase64, xlsxFilename || "cohorts.xlsx", XLSX_MIME)}
              title="Includes source-traceability notes on hover for Phase, Year, Status, N and Indication. Exports all cohorts (current filters aren't applied)."
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
                background: "#fff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 4,
                font: `500 14px/18px ${FONT}`, color: C.headText, cursor: "pointer",
              }}
            >
              Download Excel
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${C.border}`, borderRadius: 4, overflowX: "auto",
          boxShadow: "1px 8px 34px 0px rgba(153,169,190,0.10)", background: "#fff",
        }}
      >
        <div style={{ minWidth: totalWidth }}>
          <div
            style={{
              // gap omitted to match the body rows -- see divider()
              display: "flex", alignItems: "stretch", height: 43,
              padding: "0 15px", background: C.headerBg,
              borderBottom: `1px solid ${C.border}`,
              borderRadius: "4px 4px 0 0",
            }}
          >
            {COLUMNS.map((col, ci) => (
              <HeaderCell
                key={col.key}
                col={col}
                first={ci === 0}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                values={col.filter ? optionsFor(col.key) : []}
                selected={filters[col.key] || []}
                onToggle={(v) => toggle(col.key, v)}
              />
            ))}
          </div>

          {visible.map((row, i) => (
            <div
              key={i}
              style={{
                // No `gap` (it would break the column rules) and no vertical
                // padding (it would cut each rule short top and bottom) -- both
                // live on the cells instead. See divider() and Cell's base.
                display: "flex", alignItems: "stretch",
                padding: "0 15px", borderBottom: `1px solid ${C.border}`,
              }}
            >
              {COLUMNS.map((col, ci) => (
                <Cell
                  key={col.key}
                  col={col}
                  row={row}
                  first={ci === 0}
                  onOpen={onOpenSummary}
                />
              ))}
            </div>
          ))}

          {!visible.length ? (
            <div style={{ padding: 20, font: `400 14px ${FONT}`, color: C.muted }}>
              No cohorts match these filters.
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "14px 0",
        }}
      >
        <PageBtn disabled={current === 1} onClick={() => setPage(current - 1)}>
          ‹ Prev
        </PageBtn>
        {pageList(current, pages).map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ color: C.muted, padding: "0 4px" }}>…</span>
          ) : (
            <PageBtn key={p} active={p === current} onClick={() => setPage(p)}>
              {p}
            </PageBtn>
          ),
        )}
        <PageBtn disabled={current === pages} onClick={() => setPage(current + 1)}>
          Next ›
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minWidth: 30, height: 30, padding: "0 9px", borderRadius: 4,
        border: active ? "1px solid #2666be" : "1px solid transparent",
        background: active ? "#2666be" : "transparent",
        color: active ? "#fff" : disabled ? "rgba(0,0,0,0.25)" : C.body,
        font: `${active ? 500 : 400} 14px/18px ${FONT}`,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// 1 2 3 … 10 -- keeps the control narrow for large result sets.
function pageList(current, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", pages];
  if (current >= pages - 2) return [1, "...", pages - 2, pages - 1, pages];
  return [1, "...", current, "...", pages];
}
