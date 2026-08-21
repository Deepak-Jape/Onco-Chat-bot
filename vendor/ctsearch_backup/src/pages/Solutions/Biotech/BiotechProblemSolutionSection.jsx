import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function BiotechProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--container7xl"
      problem={{
        kicker: "PROBLEM",
        title: <>Zero Room for Error</>,
        body: (
          <>
            In biotech, you don&apos;t have the luxury of &quot;learning from a failed
            trial.&quot; A single protocol amendment can burn through six months of
            funding, and a recruitment delay can derail your next financing round.
            <span style={{ display: "block", marginTop: 8 }} />
            You need to out-maneuver larger competitors by being faster, leaner, and
            more precise with your data.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: <>Institutional-Grade Intelligence on a Biotech Timeline</>,
        body: (
          <>
            OncoSuite gives biotech teams the same (and often better) data depth as
            Top-20 Pharma, without the need for a massive internal analytics
            department.
            <span style={{ display: "block", marginTop: 8 }} />
            We provide the &quot;Strategy-in-a-Box&quot; required to de-risk your lead
            asset and win the race to LPI.
          </>
        ),
      }}
    />
  );
}

