import { useEffect, useRef, useState } from "react";
import { C, CARD, FONT } from "./tokens";
import arrowIcon from "../assets/arrow.svg";

/* Adverse Events panel.

   Two-level, matching the design: organ system is an expandable parent row and
   the individual events sit beneath it. The chevron and indentation come from
   the mock; the rate columns show an em dash where the database has no value
   rather than a fabricated percentage. */

// Shared arrow.svg (9x5, pre-filled Black/60) rather than a text glyph, so
// every disclosure/filter arrow in the app is the same mark. Centred in a 12px
// box to keep the row's original indentation.
function Chevron({ open }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 12, flexShrink: 0,
      }}
    >
      <img
        src={arrowIcon}
        alt=""
        aria-hidden="true"
        width={9}
        height={5}
        style={{
          transform: open ? "rotate(180deg)" : "none", transition: "transform .12s",
        }}
      />
    </span>
  );
}

// textAlign here so the AE/SAE numbers line up under their own headers -- the
// same object styles both, so they can't drift apart.
const cellNum = {
  width: 110, flexShrink: 0, font: `400 14px/18px ${FONT}`, textAlign: "left",
};

export default function AdverseEventsTable({ title = "Adverse Events", badge, groups = [] }) {
  const [open, setOpen] = useState(() => new Set());

  /* The header row lives outside the scrolling body, so the body's scrollbar
     narrows the rows without narrowing the header -- the AE/SAE values end up
     left of their own headers. Scrollbar width varies by platform (0 on
     overlay-scrollbar systems like macOS, ~15-17px on Windows), so measure the
     real value rather than hardcoding one, and pad the header to match. */
  const bodyRef = useRef(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setScrollbarWidth(el.offsetWidth - el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

      {/* This header sits OUTSIDE the scrolling body below, so the body's
          scrollbar narrows the rows but not this row -- which is what pushed
          every AE/SAE value left of its header. `scrollbarGutter: stable` on
          the body (see below) reserves that width permanently; this row pads by
          the same amount so the two stay in step. */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, minHeight: 43,
          // Right padding = 15px + the measured scrollbar width, so the AE/SAE
          // headers sit exactly above their values.
          padding: "0 15px", paddingRight: 15 + scrollbarWidth,
          background: C.headerBg,
          borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          font: `500 14px/20px ${FONT}`, color: C.headText,
        }}
      >
        <div style={{ flex: 1, minWidth: 180 }}>Type of adverse event</div>
        <div style={cellNum}>AE</div>
        <div style={cellNum}>SAE</div>
      </div>

      {/* `overflowY: scroll` + `scrollbarGutter: stable` keeps the scrollbar's
          width reserved at all times. The header row above sits outside this
          container, so a scrollbar that appears and disappears would shift these
          rows left relative to the header -- which is exactly what made the
          AE/SAE values look misaligned with their headers. */}
      <div
        ref={bodyRef}
        style={{ overflowY: "scroll", scrollbarGutter: "stable", maxHeight: 320 }}
      >
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
