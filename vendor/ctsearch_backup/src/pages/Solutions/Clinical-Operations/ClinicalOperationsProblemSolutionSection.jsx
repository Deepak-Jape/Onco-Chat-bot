import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function ClinicalOperationsProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--clinical"
      problem={{
        kicker: "PROBLEM",
        title: (
          <>
            The High Cost of &quot;Hope-Based&quot; Feasibility
          </>
        ),
        body: (
          <>
            80% of oncology trials fail to meet original enrollment timelines because they rely on static PI surveys and &quot;gut feel.&quot; 
            The result? Zero-enrollment sites that drain your budget, 6-figure rescue study fees, and LPI timelines that slip by months. In 2026,
            &quot;average&quot; performance is a clinical failure.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: (
          <>
            Predictive Site & Enrollment Intelligence
          </>
        ),
        body: (
          <>
            OncoSuite eliminates the guesswork. We cross-reference de-identified patient density (where patients live) 
            with objective Site Performance (who actually enrolls) to give you a defensible, predictive roadmap to LPI. 
            Stop searching for sites and start identifying your &quot;Recruitment Engines.&quot;
          </>
        ),
      }}
    />
  );
}
