import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function MedicalAffairsProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--clinical"
      problem={{
        kicker: "PROBLEM",
        title: (
          <>
            Lagging Data in Fast Markets
          </>
        ),
        body: (
          <>
            In oncology, waiting for congress abstracts or peer-reviewed publications is a strategic failure. 
            Medical Affairs teams often operate on &quot;stale&quot; competitive intelligence, leaving them reactive to competitor protocol shifts or emerging SOC trends. Without itemized, traceable evidence, MSLs struggle to defend an asset’s value proposition against rapidly evolving benchmarks.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: (
          <>
            Real-Time Scientific Intelligence
          </>
        ),
        body: (
          <>
            OncoSuite provides the evidence layer for the modern Medical Affairs organization. 
            We atomize the oncology landscape so you can track competitor moves, benchmark scientific &quot;Share of Voice,&quot; 
            and prepare your MSLs with 1-click traceable data from 65k+ global trials. 
            Move from data tracking to strategic narrative ownership.
          </>
        ),
      }}
    />
  );
}
