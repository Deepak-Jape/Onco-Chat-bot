import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* Interactive Efficacy Explorer — KM curve viewer for the Results › Analytics
   sub-tab. Driven by result_section.result_section_analysis.efficacy_explorer[],
   where each entry is {graph_type, endpoint, disease, data:{x_axis, y_axis,
   points[]}}. Three dropdowns (disease / endpoint / graph type) pick which
   entry is plotted; a shared-x tooltip reports every plotted series at the
   hovered time. Series colours follow the Figma mockup (red primary, blue
   dotted comparator). */

const SERIES_COLORS = ["rgba(193, 70, 70, 1)", "rgba(38,102,190,1)"];

// Series names of a single explorer entry. Point-level `arms` (a map of
// armName -> probability) wins when present; otherwise the entry is one curve
// labelled by data.label / endpoint.
const seriesNamesOf = (entry) => {
  const pts = entry?.data?.points || [];
  const named = new Set();
  pts.forEach((p) => {
    if (p && p.arms && typeof p.arms === "object") {
      Object.keys(p.arms).forEach((k) => named.add(k));
    }
  });
  if (named.size > 0) return [...named];
  return [entry?.data?.label || entry?.endpoint || "Probability"];
};

// Flatten an entry's points into recharts rows: {time, [seriesName]: value}.
// Probabilities are shown as percentages to match the mockup's 0-100 axis.
const toRows = (entry, names) => {
  const pts = entry?.data?.points || [];
  return pts
    .filter((p) => p && p.time != null)
    .map((p) => {
      const row = { time: Number(p.time) };
      if (p.arms && typeof p.arms === "object") {
        names.forEach((n) => {
          const v = p.arms[n];
          if (v != null) row[n] = Number(v) * 100;
        });
      } else if (p.probability != null) {
        row[names[0]] = Number(p.probability) * 100;
      }
      return row;
    })
    .sort((a, b) => a.time - b.time);
};

const SELECT_STYLE = {
  height: "32px",
  minWidth: "104px",
  padding: "0 8px",
  borderRadius: "6px",
  border: "1.5px solid rgba(232,232,236,1)",
  background: "rgba(255,255,255,1)",
  fontFamily: "Rubik",
  fontSize: "13px",
  color: "rgba(0,0,0,0.7)",
  cursor: "pointer",
  outline: "none",
};

// Card-styled tooltip: "Month N" heading then one coloured row per series.
const KmTooltip = ({ active, payload, label, xUnitLabel }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: "rgba(255,255,255,1)",
        border: "1px solid rgba(232,232,236,1)",
        borderRadius: "8px",
        boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
        padding: "10px 14px",
        fontFamily: "Rubik",
        minWidth: "160px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "rgba(0,0,0,0.85)",
          marginBottom: "6px",
        }}
      >
        {xUnitLabel} {Number(label).toFixed(Number.isInteger(Number(label)) ? 0 : 1)}
      </div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "16px",
            fontSize: "13px",
            color: p.color,
          }}
        >
          <span>{p.dataKey}:</span>
          <span style={{ fontWeight: 500 }}>
            {p.value == null ? "-" : `${Math.round(p.value)}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

const EfficacyExplorerCard = ({ explorer }) => {
  const entries = useMemo(
    () => (Array.isArray(explorer) ? explorer.filter((e) => e?.data?.points?.length) : []),
    [explorer]
  );

  // Dropdown option lists, de-duped in data order.
  const diseases = useMemo(
    () => [...new Set(entries.map((e) => e.disease).filter(Boolean))],
    [entries]
  );
  const [disease, setDisease] = useState(diseases[0] || "");

  const endpoints = useMemo(
    () => [
      ...new Set(
        entries
          .filter((e) => !disease || e.disease === disease)
          .map((e) => e.endpoint)
          .filter(Boolean)
      ),
    ],
    [entries, disease]
  );
  const [endpoint, setEndpoint] = useState(endpoints[0] || "");
  // Keep the endpoint valid when the disease changes.
  const activeEndpoint = endpoints.includes(endpoint) ? endpoint : endpoints[0] || "";

  const graphTypes = useMemo(
    () => [
      ...new Set(
        entries
          .filter(
            (e) =>
              (!disease || e.disease === disease) &&
              (!activeEndpoint || e.endpoint === activeEndpoint)
          )
          .map((e) => e.graph_type)
          .filter(Boolean)
      ),
    ],
    [entries, disease, activeEndpoint]
  );
  const [graphType, setGraphType] = useState(graphTypes[0] || "");
  const activeGraphType = graphTypes.includes(graphType) ? graphType : graphTypes[0] || "";

  const entry = useMemo(
    () =>
      entries.find(
        (e) =>
          (!disease || e.disease === disease) &&
          (!activeEndpoint || e.endpoint === activeEndpoint) &&
          (!activeGraphType || e.graph_type === activeGraphType)
      ),
    [entries, disease, activeEndpoint, activeGraphType]
  );

  const names = useMemo(() => (entry ? seriesNamesOf(entry) : []), [entry]);
  const rows = useMemo(() => (entry ? toRows(entry, names) : []), [entry, names]);

  if (entries.length === 0) return null;

  const xAxis = entry?.data?.x_axis || {};
  const yAxis = entry?.data?.y_axis || {};
  // The mockup's x-axis reads "Time (months)"; fall back to the JSON label.
  const xLabel = xAxis.label || "Time";
  const xUnitLabel = /month/i.test(xLabel) ? "Month" : "Time";
  const xMax = xAxis.max != null ? Number(xAxis.max) : "auto";
  const xMin = xAxis.min != null ? Number(xAxis.min) : 0;

  return (
    <div
      style={{
        border: "1.5px solid rgba(232,232,236,1)",
        borderRadius: "12px",
        background: "rgba(255,255,255,1)",
        padding: "20px 24px 12px",
        boxSizing: "border-box",
      }}
    >
      {/* Header: title + the three selectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: "Rubik",
            fontSize: "20px",
            fontWeight: 500,
            color: "rgba(0,0,0,0.85)",
          }}
        >
          Interactive Efficacy Explorer
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {diseases.length > 0 && (
            <select
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              style={SELECT_STYLE}
              aria-label="Disease"
            >
              {diseases.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          {endpoints.length > 0 && (
            <select
              value={activeEndpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={SELECT_STYLE}
              aria-label="Endpoint"
            >
              {endpoints.map((ep) => (
                <option key={ep} value={ep}>
                  {ep}
                </option>
              ))}
            </select>
          )}
          {graphTypes.length > 0 && (
            <select
              value={activeGraphType}
              onChange={(e) => setGraphType(e.target.value)}
              style={SELECT_STYLE}
              aria-label="Graph type"
            >
              {graphTypes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KM step chart */}
      <div style={{ width: "100%", height: "340px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              type="number"
              domain={[xMin, xMax]}
              tickCount={10}
              allowDecimals={false}
              tick={{ fontFamily: "Rubik", fontSize: 11, fill: "rgba(0,0,0,0.55)" }}
              stroke="rgba(0,0,0,0.25)"
              label={{
                value: /month/i.test(xLabel) ? xLabel : `${xLabel} (months)`,
                position: "insideBottom",
                offset: -14,
                style: {
                  fontFamily: "Rubik",
                  fontSize: 11,
                  fill: "rgba(0,0,0,0.55)",
                },
              }}
            />
            <YAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={{ fontFamily: "Rubik", fontSize: 11, fill: "rgba(0,0,0,0.55)" }}
              stroke="rgba(0,0,0,0.25)"
              label={{
                value: yAxis.label || "%",
                angle: -90,
                position: "insideLeft",
                style: {
                  fontFamily: "Rubik",
                  fontSize: 11,
                  fill: "rgba(0,0,0,0.55)",
                  textAnchor: "middle",
                },
              }}
            />
            <Tooltip
              content={<KmTooltip xUnitLabel={xUnitLabel} />}
              cursor={{ stroke: "rgba(0,0,0,0.2)", strokeDasharray: "3 3" }}
            />
            {names.map((n, i) => (
              <Line
                key={n}
                type="stepAfter"
                dataKey={n}
                name={n}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={2}
                // Comparator arm is dotted in the mockup.
                strokeDasharray={i === 0 ? undefined : "3 3"}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EfficacyExplorerCard;
