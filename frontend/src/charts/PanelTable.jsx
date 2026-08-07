import { useMemo, useState } from "react";
import { BODY_CELL, BODY_ROW, BUTTON, C, CARD, CARD_TITLE, FONT, HEADER_CELL, HEADER_ROW } from "./tokens";

/* Generic Figma-styled panel table -- used for Endpoints and Adverse Events.

   Same card, header and typography tokens as the cohort table so the whole
   answer reads as one surface. Shows the first `preview` rows with a "Show all"
   toggle, matching the mock.

   A column can opt into a filter dropdown by setting `filter: true` in its
   column def -- same select-values-to-narrow-rows interaction as CohortTable's
   column filters, for the case where one column (e.g. Cancer Stage) has few
   enough distinct values that narrowing it is actually useful. Columns that
   don't set it render exactly as before.

   Cells with no value render an em dash: these columns are genuinely empty for
   some rows and must not be filled with invented numbers. */

const PREVIEW = 5;

const FILTER_ROW = {
  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
  font: `400 13px/18px ${FONT}`, color: C.body, cursor: "pointer",
};

function HeaderFilter({ col, options, selected, open, onOpenChange, onToggle }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => onOpenChange(open ? null : col.key)}
        style={{
          display: "flex", alignItems: "center", gap: 4, border: 0, padding: 0,
          background: "transparent", cursor: "pointer", font: `500 14px/20px ${FONT}`,
          color: C.headText,
        }}
      >
        {col.label}
        <span style={{ fontSize: 9, color: C.muted }}>▼</span>
      </button>

      {open ? (
        <div
          className="pt-filter-pop"
          style={{
            position: "absolute", top: 24, left: 0, zIndex: 30, minWidth: 160,
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6,
            boxShadow: "0 6px 20px rgba(16,24,40,.14)", padding: "6px 0",
          }}
        >
          <label style={FILTER_ROW}>
            <input type="checkbox" checked={selected.length === 0} onChange={() => onToggle(null)} />
            <span>Select All</span>
          </label>
          {options.map((v) => (
            <label key={v} style={FILTER_ROW}>
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

export default function PanelTable({
  title,
  columns = [],
  data = [],
  preview = PREVIEW,
}) {
  const [expanded, setExpanded] = useState(false);
  const [openFilter, setOpenFilter] = useState(null);
  const [filters, setFilters] = useState({});

  const optionsFor = (key) =>
    [...new Set(data.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== ""))].sort();

  const toggleFilter = (key, value) => {
    setExpanded(false);
    setFilters((f) => {
      const cur = f[key] || [];
      if (value === null) return { ...f, [key]: [] };
      return {
        ...f,
        [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    });
  };

  const filtered = useMemo(
    () =>
      data.filter((r) =>
        Object.entries(filters).every(([k, vals]) => !vals.length || vals.includes(r[k]))),
    [data, filters],
  );

  if (!columns.length) return null;

  const rows = expanded ? filtered : filtered.slice(0, preview);

  // First column carries the label and takes the remaining space; the numeric
  // columns are fixed so they line up across rows.
  const widthFor = (i) => (i === 0 ? { flex: 1, minWidth: 220 } : { width: 130, flexShrink: 0 });

  return (
    <div
      style={CARD}
      // Close the filter popup on an outside click, but never when the click
      // landed inside it: a checkbox is not a <button>, so a bare
      // "closest('button')" test would unmount the popup before React could
      // deliver the checkbox's onChange.
      onClick={(e) => {
        if (!e.target.closest?.(".pt-filter-pop") && !e.target.closest?.("button")) {
          setOpenFilter(null);
        }
      }}
    >
      {title ? <h3 style={CARD_TITLE}>{title}</h3> : null}

      {/* Many-column tables (e.g. the differentiation matrix, 13 columns)
          would otherwise get clipped by CARD's overflow:hidden -- this scrolls
          horizontally instead, while narrow tables (4-5 columns, everywhere
          else) fit within the card and never show a scrollbar. */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ ...HEADER_ROW, minWidth: "fit-content" }}>
          {columns.map((col, i) => (
            <div key={col.key} style={{ ...HEADER_CELL, ...widthFor(i) }}>
              {col.filter ? (
                <HeaderFilter
                  col={col}
                  options={optionsFor(col.key)}
                  selected={filters[col.key] || []}
                  open={openFilter === col.key}
                  onOpenChange={setOpenFilter}
                  onToggle={(v) => toggleFilter(col.key, v)}
                />
              ) : (
                col.label
              )}
            </div>
          ))}
        </div>

        {rows.map((row, r) => (
          <div key={r} style={{ ...BODY_ROW, minWidth: "fit-content" }}>
            {columns.map((col, i) => {
              const value = row[col.key];
              const empty = value === null || value === undefined || value === "";
              return (
                <div
                  key={col.key}
                  style={{
                    ...BODY_CELL,
                    ...widthFor(i),
                    color: empty ? C.muted : C.body,
                  }}
                >
                  {empty ? "—" : String(value)}
                </div>
              );
            })}
          </div>
        ))}

        {!rows.length ? (
          <div style={{ padding: 20, font: `400 14px ${FONT}`, color: C.muted }}>
            No data available.
          </div>
        ) : null}
      </div>

      {filtered.length > preview ? (
        <div style={{ padding: "12px 15px" }}>
          <button type="button" style={BUTTON} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : `Show all ${filtered.length}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
