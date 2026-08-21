import React from "react";
import "../siteIntelligence/css/ProblemSolutionSection.css";

import ProblemSolutionCards from "../../component/ProblemSolutionCards/ProblemSolutionCards";

export default function TrialIntelligenceProblemSolutionSection() {
  return (
    <ProblemSolutionCards
      className="ps-section--container7xl"
      problem={{
        kicker: "PROBLEM",
        title: (
          <>
            Flattened Data for Multi-
            <br />
            Dimensional Trials
          </>
        ),
        body: (
          <>
            Most oncology registries treat a complex, multi-cohort Phase I/II trial
            as a single entry. This &quot;flattened&quot; data hides the granular
            efficacy of specific arms and ignores the nuanced inclusion criteria that
            define modern precision medicine. For a Strategy or ClinDev lead, relying
            on flattened data isn&apos;t just inefficient—it&apos;s a risk to the
            asset&apos;s trajectory.
          </>
        ),
      }}
      solution={{
        kicker: "SOLUTION",
        title: (
          <>
            70+ Dimensions of Structured
            <br />
            Reality
          </>
        ),
        body: (
          <>
            OncoSuite is the only platform built on a High-Granularity Oncology
            Taxonomy. We don&apos;t just &quot;index&quot; trials; we deconstruct them
            into 70+ structured data types. Whether it&apos;s a 15-arm basket trial
            or a complex dose-escalation study, we atomize every cohort, treatment
            backbone, and safety endpoint into a machine-readable format.
          </>
        ),
      }}
    />
  );
}
