import { useState } from "react";
import { C, CARD, FONT } from "./tokens";

/* Adverse Events panel.

   Two-level, matching the design: organ system is an expandable parent row and
   the individual events sit beneath it. The chevron and indentation come from
   the mock; the rate columns show an em dash where the database has no value
   rather than a fabricated percentage. */

function Chevron({ open }) {
  return (
    <span
      style={{
        display: "inline-block", width: 12, fontSize: 10, color: C.muted,
        transform: open ? "rotate(180deg)" : "none", transition: "transform .12s",
      }}
    >
      ▾
    </span>
  );
}

const cellNum = { width: 110, flexShrink: 0, font: `400 14px/18px ${FONT}` };

export default function AdverseEventsTable({ title = "Adverse Events", badge, groups = [] }) {
  const [open, setOpen] = useState(() => new Set());

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 15px 12px",
        }}
      >
        <h3 style={{ margin: 0, font: `500 16px/22px ${FONT}`, color: C.headText }}>
          {title}
        </h3>
        {badge ? (
          <span
            style={{
              font: `500 12px/16px ${FONT}`, color: C.link,
              background: "rgba(38,102,190,0.08)", border: `1px solid rgba(38,102,190,0.20)`,
              borderRadius: 4, padding: "3px 8px",
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, minHeight: 43,
          padding: "0 15px", background: C.headerBg,
          borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          font: `500 14px/20px ${FONT}`, color: C.headText,
        }}
      >
        <div style={{ flex: 1, minWidth: 180 }}>Type of adverse event</div>
        <div style={cellNum}>AE</div>
        <div style={cellNum}>SAE</div>
      </div>

      <div style={{ overflowY: "auto", maxHeight: 320 }}>
        {groups.map((g, i) => {
          const hasChildren = (g.children || []).length > 1;
          const isOpen = open.has(g.event);
          return (
            <div key={i}>
              <div
                onClick={() => hasChildren && toggle(g.event)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 15px", borderBottom: `1px solid ${C.border}`,
                  cursor: hasChildren ? "pointer" : "default",
                  font: `500 14px/18px ${FONT}`, color: C.headText,
                }}
              >
                <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8 }}>
                  {hasChildren ? <Chevron open={isOpen} /> : <span style={{ width: 12 }} />}
                  <span>{g.event}</span>
                </div>
                <div style={{ ...cellNum, fontWeight: 500 }}>{g.ae ?? "—"}</div>
                <div style={{ ...cellNum, fontWeight: 500 }}>{g.sae ?? "—"}</div>
              </div>

              {isOpen
                ? (g.children || []).map((c, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 15px", borderBottom: `1px solid ${C.border}`,
                        font: `400 14px/18px ${FONT}`, color: C.body,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180, paddingLeft: 20 }}>{c.event}</div>
                      <div style={cellNum}>{c.ae ?? "—"}</div>
                      <div style={cellNum}>{c.sae ?? "—"}</div>
                    </div>
                  ))
                : null}
            </div>
          );
        })}

        {!groups.length ? (
          <div style={{ padding: 20, font: `400 14px ${FONT}`, color: C.muted }}>
            No adverse-event data available.
          </div>
        ) : null}
      </div>
    </div>
  );
}
