import React from "react";
import { analyticStyles } from "./style";

export default function EfficacyVsSafetyGraphSkeleton() {
  const classes = analyticStyles();

  return (
    <div
      className={classes.bubbleCard}
      style={{ flex: "0 0 50%", maxWidth: "50%" }}
    >
      <div className={classes.bubbleHeader}>
        <div className={classes.skeletonBubbleTitle} />

        <div className={classes.bubbleChartFilterRow}>
          <div className={classes.skeletonSelect} />
          <div className={classes.skeletonSelect} />
          <div className={classes.skeletonTrialsPill} />
        </div>
      </div>

      <div style={{ position: "relative", flex: 1 }}>
        <div className={classes.skeletonScatterShell}>
          <div className={classes.skeletonScatterGrid} />

          {[
            [14, 22],
            [24, 58],
            [33, 40],
            [42, 76],
            [52, 30],
            [60, 66],
            [70, 44],
            [78, 18],
            [18, 80],
            [64, 84],
            [40, 18],
            [74, 70],
          ].map(([top, left], idx) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className={classes.skeletonScatterDot}
              style={{ top: `${top}%`, left: `${left}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

