import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Scatter,
  ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { C, CARD, FONT } from "./tokens";

/* Feasibility-tab charts: Competition Intensity vs Enrollment Speed, Trial
   Duration by Country, and Amendment Risk vs Enrollment Speed.

   Built with recharts and the shared Figma tokens, matching how ctsearch draws
   them -- those versions are inline JSX inside a 4,800-line page component with
   its own API and filter context, so they are not importable on their own. */

const PALETTE = [
  "rgba(44, 95, 110, 1)", "rgba(40, 146, 136, 1)", "rgba(145, 52, 52, 1)",
  "rgba(122, 104, 97, 1)", "rgba(145, 77, 10, 1)", "rgba(109, 95, 150, 1)",
  "rgba(75, 145, 78, 1)", "rgba(144, 164, 174, 1)",
];

function Card({ title, badge, children, height = 340 }) {
  return (
    <div style={{ ...CARD, padding: "16px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, font: `500 16px/22px ${FONT}`, color: C.headText }}>
          {title}
        </h3>
        {badge ? (
          <span
            style={{
              font: `500 12px/16px ${FONT}`, color: C.link,
              background: "rgba(38,102,190,0.08)",
              border: "1px solid rgba(38,102,190,0.20)",
              borderRadius: 4, padding: "3px 8px",
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div style={{ height, marginTop: 12 }}>{children}</div>
    </div>
  );
}

function Empty({ what }) {
  return (
    <div
      style={{
        height: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", font: `400 14px ${FONT}`, color: C.muted,
      }}
    >
      No {what} data available.
    </div>
  );
}

const axisTick = { fontSize: 11, fill: "rgba(0,0,0,0.6)" };

function PointTooltip({ active, payload, xLabel, yLabel }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "8px 10px", font: `400 12px/18px ${FONT}`, color: C.body,
        boxShadow: "0 6px 20px rgba(16,24,40,.14)",
      }}
    >
      <div style={{ fontWeight: 600, color: C.headText, marginBottom: 4 }}>{d.name}</div>
      <div>{xLabel}: {d.x}</div>
      <div>{yLabel}: {d.y}</div>
      {d.trials != null ? <div>Trials: {d.trials}</div> : null}
      {d.planned != null ? <div>Planned patients: {d.planned.toLocaleString()}</div> : null}
    </div>
  );
}

/** Competition Intensity vs Enrollment Speed, and Amendment Risk (same shape). */
export function FeasibilityScatter({ title, points = [], xLabel, yLabel, onSelect }) {
  if (!points.length) return <Card title={title}><Empty what={title} /></Card>;
  return (
    <Card title={title} badge={`${points.length} items`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 24, left: 8, bottom: 24 }}>
          <CartesianGrid stroke="#e8e8ec" strokeDasharray="3 3" />
          <XAxis
            type="number" dataKey="x" name={xLabel} tick={axisTick}
            label={{ value: xLabel, position: "insideBottom", offset: -12, fontSize: 12 }}
          />
          <YAxis
            type="number" dataKey="y" name={yLabel} tick={axisTick}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 12 }}
          />
          <ZAxis type="number" dataKey="size" range={[80, 500]} />
          <Tooltip
            content={<PointTooltip xLabel={xLabel} yLabel={yLabel} />}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Scatter
            data={points}
            onClick={(p) => onSelect?.(p?.name)}
            cursor={onSelect ? "pointer" : "default"}
          >
            {points.map((p, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
}

/** Trial Duration by Country -- stacked months per phase of the trial. */
export function TrialDurationChart({ title, bars = [], series = [], yLabel, onSelect }) {
  if (!bars.length) return <Card title={title}><Empty what={title} /></Card>;
  return (
    <Card title={title} badge={`${bars.length} countries`} height={380}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 10, right: 24, left: 8, bottom: 60 }}>
          <CartesianGrid stroke="#e8e8ec" strokeDasharray="3 3" />
          <XAxis
            dataKey="name" tick={{ ...axisTick, angle: -35, textAnchor: "end" }}
            interval={0} height={70}
          />
          <YAxis
            tick={axisTick}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="duration"
              fill={PALETTE[i % PALETTE.length]}
              onClick={(d) => onSelect?.(d?.name)}
              cursor={onSelect ? "pointer" : "default"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default FeasibilityScatter;
