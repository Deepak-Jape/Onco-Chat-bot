import React from "react";
import ScatterPanelGraphSkeleton from "./ScatterPanelGraphSkeleton";

export default function AmendmentRiskGraphSkeleton({ embedded = false }) {
  return (
    <ScatterPanelGraphSkeleton
      titleWidth="52%"
      badgeWidth={140}
      chartHeight={360}
      panelTitleWidth="65%"
      panelRows={9}
      wrapCard={!embedded}
    />
  );
}
