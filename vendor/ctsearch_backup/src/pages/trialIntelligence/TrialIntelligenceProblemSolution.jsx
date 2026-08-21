import React from "react";
import "./ProblemSolutionSection.css";
import ProblemSolutionCards from "../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function ProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      problem={{
        kicker: "PROBLEM",
        title: "80% of Trials Fail to Meet Enrollment Timelines.",
        body: (
          <>
            Most feasibility studies rely on static surveys and &quot;gut feel.&quot;
            The result is a landscape of &quot;Zero-Enrollment&quot; sites that burn
            through your budget while your trial is still requiring million dollar
            amendments, slower time to market, and $100m in foregone patent-protected
            lifetime revenues.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: "OncoSuite Delivers Predictive Execution, Not Guesswork.",
        body: (
          <>
            OncoSuite replaces gut feel with a Digital Twin of your trial. We help
            you find &amp; score sites using real-world catchment data and multi-layer
            congestion maps, then simulate your LPI curve with 92% historical accuracy.
          </>
        ),
      }}
    />
  );
}

