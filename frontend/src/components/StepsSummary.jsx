import { useState } from "react";
// Local copy -- see the note in StepTrace.jsx (asset absent from the submodule).
import diamondIcon from "../assets/Container.svg";
import arrowIcon from "../assets/arrow.svg";

/* Collapsed-by-default recap of the step trace that was live while the answer
   was being built. Same numbered "Step N -- Title / sub-detail" layout and
   typography as the live StepTrace, but every step renders as done (checkmark,
   no active blue dot) since the trace is now history, not progress. */

const HEAD = {
  fontSize: 14, lineHeight: "20px", fontWeight: 500,
  color: "rgba(0,0,0,0.65)", margin: 0,
  display: "flex", alignItems: "center", gap: 8,
  background: "transparent", border: 0, padding: 0, cursor: "pointer",
  font: "inherit", textAlign: "left", width: "100%",
};

function splitStep(text) {
  const m = String(text ?? "").match(/^(.*?)\s*[—–:]\s*(.+)$/);
  return m ? { title: m[1], sub: m[2] } : { title: String(text ?? ""), sub: "" };
}

export default function StepsSummary({ steps = [] }) {
  const [open, setOpen] = useState(false);
  if (!steps.length) return null;

  return (
    <div style={{ margin: "0 0 14px" }}>
      <button type="button" style={HEAD} onClick={() => setOpen((v) => !v)}>
        <img src={diamondIcon} alt="" width={16} height={16} className="trace-diamond-icon" />
        Analyzing your query...
        {/* Shared arrow.svg, same as the table filter/disclosure arrows. It
            points down, so collapsed is its natural orientation and open flips
            it 180deg -- the old glyph pointed right and rotated 90deg. */}
        <img
          src={arrowIcon}
          alt=""
          aria-hidden="true"
          width={9}
          height={5}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        />
      </button>

      {open ? (
        <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
          {steps.map((s, i) => {
            const { title, sub } = splitStep(s);
            return (
              <li
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  paddingBottom: i === steps.length - 1 ? 0 : 24,
                }}
              >
                <span
                  style={{
                    width: 16, flexShrink: 0, textAlign: "center", lineHeight: "20px",
                    fontSize: 13, color: "#22a06b",
                  }}
                >
                  ✓
                </span>
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "rgba(0,0,0,0.45)" }}>
                    {`Step ${i + 1} — ${title}`}
                  </div>
                  {sub ? (
                    <div style={{ fontSize: 12, lineHeight: "18px", color: "rgba(0,0,0,0.35)", marginTop: 2 }}>
                      {sub}
                    </div>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
