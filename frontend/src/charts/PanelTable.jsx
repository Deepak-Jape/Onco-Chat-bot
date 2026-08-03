import { useState } from "react";
import { BODY_CELL, BODY_ROW, BUTTON, C, CARD, CARD_TITLE, FONT, HEADER_CELL, HEADER_ROW } from "./tokens";

/* Generic Figma-styled panel table -- used for Endpoints and Adverse Events.

   Same card, header and typography tokens as the cohort table so the whole
   answer reads as one surface. Shows the first `preview` rows with a "Show all"
   toggle, matching the mock.

   Cells with no value render an em dash: these columns are genuinely empty for
   some rows and must not be filled with invented numbers. */

const PREVIEW = 5;

export default function PanelTable({
  title,
  columns = [],
  data = [],
  preview = PREVIEW,
}) {
  const [expanded, setExpanded] = useState(false);
  if (!columns.length) return null;

  const rows = expanded ? data : data.slice(0, preview);
  const hidden = data.length - rows.length;

  // First column carries the label and takes the remaining space; the numeric
  // columns are fixed so they line up across rows.
  const widthFor = (i) => (i === 0 ? { flex: 1, minWidth: 220 } : { width: 130, flexShrink: 0 });

  return (
    <div style={CARD}>
      {title ? <h3 style={CARD_TITLE}>{title}</h3> : null}

      <div style={HEADER_ROW}>
        {columns.map((col, i) => (
          <div key={col.key} style={{ ...HEADER_CELL, ...widthFor(i) }}>
            {col.label}
          </div>
        ))}
      </div>

      {rows.map((row, r) => (
        <div key={r} style={BODY_ROW}>
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

      {data.length > preview ? (
        <div style={{ padding: "12px 15px" }}>
          <button type="button" style={BUTTON} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : `Show all ${data.length}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
