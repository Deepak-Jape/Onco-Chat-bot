import React from "react";
import "../siteIntelligence/css/OncologySiteScorecardSection.css";

import ScorecardGrid from "../../component/ScorecardGrid/ScorecardGrid";

import multiCohortIcon from "../../assets/icons/multicohort.svg";
import itemizedArmsIcon from "../../assets/icons/itemized.svg";
import precisionIcon from "../../assets/icons/multi_layer.svg";
import safetyIcon from "../../assets/icons/sponsor_trust.svg";
import efficacyIcon from "../../assets/icons/trend.svg";
import moaTrendsIcon from "../../assets/icons/longitudnal.svg";

const CARDS = [
  {
    title: "Multi-Cohort Deconstruction",
    icon: multiCohortIcon,
    body:
      "We don't \"flatten\" complex trials. We itemize every arm in basket and umbrella studies, allowing you to isolate biomarker-specific efficacy and safety signals that standard registries miss.",
  },
  {
    title: "Itemized Treatment Arms",
    icon: itemizedArmsIcon,
    body:
      "Move beyond the drug name. We structure dosage kinetics, modalities, and backbone combinations to help you identify the exact competitive hurdle your asset must beat.",
  },
  {
    title: "Precision I/E Benchmarking",
    icon: precisionIcon,
    body:
      "Audit your draft protocol against the industry's most granular criteria library, including itemized co-morbidities, prior treatment exposures, and organ-function thresholds.",
  },
  {
    title: "Safety & AE Mapping",
    icon: safetyIcon,
    body:
      "Instantly access itemized Grade 3+ AE benchmarks and safety endpoints across 22,000+ data points to ensure your trial design is regulatory-ready.",
  },
  {
    title: "Efficacy Trajectory (ORR/PFS/OS)",
    icon: efficacyIcon,
    body:
      "View pre-calculated outcome analytics for every line of therapy and histology. Benchmark your expected readout against the real-time performance of the competitive field.",
  },
  {
    title: "Longitudinal MoA Trends",
    icon: moaTrendsIcon,
    body:
      "Track the evolution of Mechanisms of Action (MoA) to predict shifts in the Standard of Care. See where the \"White Space\" is before your competitors do.",
  },
];

export default function TrialIntelligenceScorecardSection() {
  return (
    <ScorecardGrid
      ariaLabel="Trial Intelligence Scorecard"
      className="scorecard--trial scorecard--container7xl"
      title="Technical Precision for High–Stakes Design"
      subtitle={
        <>
          Most trial data is buried in free-text fields that standard registries
          can’t read. OncoSuite’s engine extracts and structures the critical “fine
          print” that determines trial success or failure.
        </>
      }
      cards={CARDS}
    />
  );
}
