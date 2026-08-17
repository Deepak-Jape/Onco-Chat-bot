import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function ClinicalDevelopmentProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--clinical"
      problem={{
        kicker: "PROBLEM",
        title: (
          <>
            Protocol Design is a $100M
            <br />
            Fiduciary Risk.
          </>
        ),
        body: (
          <>
            Relying on &quot;black box&quot; summaries leads to mid-study amendments
            that cost $50M+ and delay market entry by 18 months.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: (
          <>
            Atomic Evidence for
            <br />
            Defensible Design.
          </>
        ),
        body: (
          <>
            OncoSuite atomizes the oncology landscape, tethering every arm, cohort,
            and safety endpoint to its original source. Move from &quot;gut feel&quot;
            to 100% board-level confidence.
          </>
        ),
      }}
    />
  );
}
