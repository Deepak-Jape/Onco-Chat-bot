import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";
import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function PortfolioProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--container7xl"
      problem={{
        kicker: "PROBLEM",
        title: "Navigating $100M Uncertainty",
        body: (
          <>
            In oncology, a &quot;Go/No-Go&quot; decision on a Phase II/III asset is a
            hundred-million-dollar gamble. Portfolio leads often rely on high-level
            market reports and static registries that miss the granular shifts in the
            competitive landscape. Without itemized data on competitor cohorts and
            real-world patient density, assets are often over-valued or prioritized
            based on &quot;stale&quot; market assumptions.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: "The OncoSuite Strategy Engine",
        body: (
          <>
            OncoSuite provides the analytical infrastructure for objective portfolio
            prioritization. We move beyond simple &quot;Trial Tracking&quot; to deliver
            high-fidelity Market Sizing and Competitive War-Gaming based on atomized
            cohort data. Scale your pipeline with the confidence that every dollar is
            allocated to the asset with the highest probability of clinical and
            commercial success.
          </>
        ),
      }}
    />
  );
}
