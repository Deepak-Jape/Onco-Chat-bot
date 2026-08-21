import React from "react";
import { fea_styles } from "./style";
import ShimmerBox from "./ShimmerBox";

export default function EnrollmentSpeedGraphSkeleton() {
  const classes = fea_styles();

  return (
    <div className={classes.card}>
      <div className={classes.headerRow}>
        <ShimmerBox width="40%" height={28} radius={8} />
        <div className={classes.trialsButtonWrapper}>
          <ShimmerBox width={110} height={32} radius={4} />
        </div>
      </div>
      <div className={classes.divider} />

      <div style={{ display: "flex", gap: 20, paddingTop: 10 }}>
        <div
          style={{
            flex: 1,
            height: 385,
            borderRadius: 8,
            background: "#FAFAFA",
            border: "1px solid rgba(0,0,0,0.04)",
            padding: 16,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: 10 }).map((_, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <ShimmerBox width={88} height={14} radius={6} />
              <ShimmerBox
                width={`${60 - idx * 3}%`}
                height={18}
                radius={6}
              />
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <ShimmerBox width={140} height={14} radius={6} />
          </div>
        </div>

        <div className={classes.legend} style={{ background: "#FAFAFA" }}>
          <div className={classes.legendHeader}>
            <ShimmerBox width="60%" height={20} radius={6} />
          </div>

          <div className={classes.legendBody}>
            <ShimmerBox width={51} height={284} radius={2} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                paddingTop: 4,
                width: "100%",
              }}
            >
              {Array.from({ length: 5 }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <ShimmerBox key={idx} width="70%" height={14} radius={6} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

