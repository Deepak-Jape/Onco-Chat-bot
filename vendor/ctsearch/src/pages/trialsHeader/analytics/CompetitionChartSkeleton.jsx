import React from "react";
import ScatterPanelGraphSkeleton from "./ScatterPanelGraphSkeleton";

export default function CompetitionChartSkeleton() {
  return (
    <ScatterPanelGraphSkeleton
      titleWidth="62%"
      badgeWidth={110}
      chartHeight={420}
      panelTitleWidth="55%"
      panelRows={9}
    />
  );
}
