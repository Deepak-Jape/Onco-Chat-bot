import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function PharmaProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--clinical"
      problem={{
        kicker: "PROBLEM",
        title: (
          <>
            The Cost of Fragmented Intelligence
          </>
        ),
        body: (
          <>
            In global Pharma, intelligence is often trapped in regional silos or static, &quot;black-box&quot; vendor reports.
            This fragmentation leads to misaligned strategies, redundant site-selection efforts, and billions in lost
            opportunity cost when a competitor's pivot isn't detected across the global portfolio. To win in 2026, 
            you need a standardized, atomized data layer that spans the entire lifecycle—from Phase I design to Commercial launch.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: (
          <>
            The Enterprise Operating System for Oncology
          </>
        ),
        body: (
          <>
            OncoSuite provides the unified intelligence layer for global oncology teams. We atomize 59k+ trials and ZIP-level 
            patient data into a single, traceable platform that ensures your R&D, Clinical Ops, and Medical Affairs teams are 
            all making decisions based on the same high-fidelity reality.
          </>
        ),
      }}
    />
  );
}
