// The ctsearch submodule imports this icon from @ct/assets but never committed
// the file, so it lives here instead (`vite build` fails on the missing path --
// the dev server only resolves assets on demand, which is why it built locally).
// Keep the .svg free of XML comments: Vite inlines small assets as a data: URI
// verbatim, and a comment ahead of the <svg> tag stops it rendering.
import diamondIcon from "../assets/Container.svg";

/* Live "Analyzing your query..." trace.

   Typography is pinned to the Figma spec: every line is 14px / 20px / weight
   500, and only colour changes with state -- header rgba(0,0,0,0.65), completed
   step .45 with a green tick, active step .85 with a blue dot. Rows are 24px
   apart. Step text comes from the server; a title/detail split is applied when
   the message carries an em/en dash or colon. */

const HEAD = {
  fontSize: 14, lineHeight: "20px", fontWeight: 500,
  color: "rgba(0,0,0,0.65)", margin: "0 0 12px",
  display: "flex", alignItems: "center", gap: 8,
};

function splitStep(text) {
  const m = String(text ?? "").match(/^(.*?)\s*[—–:]\s*(.+)$/);
  return m ? { title: m[1], sub: m[2] } : { title: String(text ?? ""), sub: "" };
}

export default function StepTrace({ steps = [] }) {
  return (
    <div>
      <div style={HEAD}>
        <img src={diamondIcon} alt="" width={16} height={16} className="trace-diamond-icon spin" />
        Analyzing your query...
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {steps.map((s, i) => {
          const { title, sub } = splitStep(s);
          const active = i === steps.length - 1;
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
                  fontSize: active ? 10 : 13,
                  color: active ? "#2563eb" : "#22a06b",
                }}
              >
                {active ? "●" : "✓"}
              </span>
              <span style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14, lineHeight: "20px", fontWeight: 500,
                    color: active ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.45)",
                  }}
                >
                  {`Step ${i + 1} — ${title}`}
                </div>
                {sub ? (
                  <div
                    style={{
                      fontSize: 12, lineHeight: "18px",
                      color: "rgba(0,0,0,0.35)", marginTop: 2,
                    }}
                  >
                    {sub}
                  </div>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
