import React, { useMemo } from "react";
import { fea_styles } from "./style";
import ShimmerBox from "./ShimmerBox";

export default function ScatterPanelGraphSkeleton({
  titleWidth = "58%",
  badgeWidth = 110,
  chartHeight = 420,
  panelTitleWidth = "60%",
  panelRows = 8,
  wrapCard = true,
}) {
  const classes = fea_styles();

  const dotPositions = useMemo(
    () => [
      { top: "18%", left: "22%", size: 44 },
      { top: "24%", left: "66%", size: 32 },
      { top: "36%", left: "40%", size: 38 },
      { top: "44%", left: "78%", size: 54 },
      { top: "58%", left: "22%", size: 36 },
      { top: "64%", left: "62%", size: 46 },
      { top: "72%", left: "40%", size: 30 },
      { top: "78%", left: "80%", size: 34 },
    ],
    [],
  );

  const content = (
    <>
      <div className={classes.cardHeader}>
        <ShimmerBox width={titleWidth} height={34} radius={8} />
        <ShimmerBox width={badgeWidth} height={32} radius={4} />
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
        <div
          style={{
            flex: 1,
            height: chartHeight,
            position: "relative",
            borderRadius: 8,
            background: "#FAFAFA",
            overflow: "hidden",
          }}
        >
          <ShimmerBox
            width={180}
            height={16}
            radius={6}
            style={{ position: "absolute", top: 36, left: 110 }}
          />
          <ShimmerBox
            width={180}
            height={16}
            radius={6}
            style={{ position: "absolute", top: 36, right: 110 }}
          />
          <ShimmerBox
            width={180}
            height={16}
            radius={6}
            style={{ position: "absolute", bottom: 42, left: 110 }}
          />
          <ShimmerBox
            width={180}
            height={16}
            radius={6}
            style={{ position: "absolute", bottom: 42, right: 110 }}
          />

          <ShimmerBox
            width="100%"
            height={1}
            radius={0}
            style={{ position: "absolute", top: "50%" }}
          />
          <ShimmerBox
            width={1}
            height="100%"
            radius={0}
            style={{ position: "absolute", left: "50%" }}
          />

          {dotPositions.map((dot, idx) => (
            <ShimmerBox
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              width={dot.size}
              height={dot.size}
              radius="50%"
              style={{
                position: "absolute",
                top: dot.top,
                left: dot.left,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <div className={classes.filterPanel} style={{ background: "#FAFAFA" }}>
          <ShimmerBox width={panelTitleWidth} height={20} radius={6} />
          <div style={{ height: 12 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: panelRows }).map((_, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <ShimmerBox width={16} height={16} radius={4} />
                <ShimmerBox width="75%" height={14} radius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (!wrapCard) {
    return <div style={{ width: "100%" }}>{content}</div>;
  }

  return <div className={classes.card}>{content}</div>;
}
