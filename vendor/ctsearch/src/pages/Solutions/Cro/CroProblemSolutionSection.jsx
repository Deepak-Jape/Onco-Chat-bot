import React from "react";
import "../../../pages/siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function CroProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--clinical"
      problem={{
        kicker: "PROBLEM",
        title: (
          <>
            The &quot;Commodity&quot; Trap and Over-Promising
          </>
        ),
        body: (
          <>
            In the competitive bidding process, sponsors are tired of "Feasibility Surveys" that turn out to be optimistic guesses. 
            If your bid relies on the same generic site lists as every other CRO, you are forced to compete on price alone. Worse, 
            if you win a bid and then fail to meet recruitment timelines, your relationship with the sponsor is permanently damaged.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: (
          <>
            Data-Backed Feasibility & High-Confidence Bidding
          </>
        ),
        body: (
          <>
           OncoSuite gives your Business Development and ClinOps teams a technical edge. 
           We provide the Evidence Layer you need to build defensible, data-driven proposals that prove 
           exactly where the patients are and which sites will actually deliver them.
          </>
        ),
      }}
    />
  );
}
