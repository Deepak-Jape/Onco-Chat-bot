import { useMemo } from "react";
import {
  TrialDurationChart,
  buildTrialDurationRows,
} from "@ct/pages/trialsHeader/analytics/Feasibility";
import { C, CARD, FONT } from "./tokens";

/* Trial Duration by Country.

   Both the chart and its row mapper come from ctsearch, so the flags, risk
   badges, segment colours and percentile tooltips are theirs -- this wrapper
   only supplies the raw API-shaped points and draws the surrounding card
   (title + trial-count badge) that their page renders separately. */

export default function TrialDuration({
  title = "Trial Duration by Country",
  points = [],
  minTrials = 0,
  maxTrials = 1,
}) {
  const rows = useMemo(
    () => buildTrialDurationRows(points, minTrials, maxTrials),
    [points, minTrials, maxTrials],
  );

  // Their bars are sized against a shared axis maximum; pad slightly so the
  // longest bar does not touch the right edge.
  const axisMax = useMemo(
    () => Math.ceil(Math.max(...rows.map((r) => r.total || 0), 1) * 1.05),
    [rows],
  );

  const trials = points.reduce((sum, p) => sum + (p.total_trials || 0), 0);

  if (!rows.length) {
    return (
      <div style={{ ...CARD, padding: "16px 15px" }}>
        <div style={{ font: `400 14px ${FONT}`, color: C.muted }}>
          No trial-duration data available.
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...CARD, padding: "16px 15px" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <h3 style={{ margin: 0, font: `500 20px/28px ${FONT}`, color: C.headText }}>
          {title}
        </h3>
        <span
          style={{
            font: `500 13px/18px ${FONT}`, color: C.link,
            border: "1px solid rgba(38,102,190,0.25)", borderRadius: 4,
            padding: "4px 10px",
          }}
        >
          {trials.toLocaleString()} Trials
        </span>
      </div>
      <TrialDurationChart rows={rows} axisMax={axisMax} />
    </div>
  );
}
