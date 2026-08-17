import React from "react";
import "../siteIntelligence/css/PredictOutcomeSection.css";

import PredictOutcomeBlock from "../../component/PredictOutcomeBlock/PredictOutcomeBlock";
import TraceabilityPreview from "../../assets/images/governance.webp";

const FEATURES = [
  {
    title: "The Audit Trail",
    body:
      "Hover over any metric to see the exact trial ID, arm description, and the page number of the clinical registry, FDA/EMA publication, scientific paper or congress presentation it was pulled from.",
  },
  {
    title: "Verify in Seconds",
    body:
      "Don't take our word for it. Click any data point to open the source PDF or registry entry with the relevant section highlighted.",
  },
  {
    title: "Fiduciary Ready",
    body:
      "Generate reports for boards or investors that include full source citations for every competitive benchmark and LPI forecast.",
  },
];

export default function TrialIntelligencePredictOutcomeSection() {
  return (
    <PredictOutcomeBlock
      ariaLabel="Traceable evidence"
      className="predict--governance predict--container7xl predict--site-white"
      title="Governance–Grade Evidence. 100% Traceable."
      subtitle={
        <>
          In a $100M &apos;Go/No-Go&apos; cycle, &apos;Good Enough&apos; data is a
          liability. Every metric in OncoSuite is one click away from its
          source—whether it&apos;s an ASCO poster, a 100-page PDF protocol, or a
          secondary endpoint in a Phase I basket trial. Audit the source, don&apos;t
          just trust the summary.
        </>
      }
      preview={{ src: TraceabilityPreview, alt: "Data traceability preview" }}
      features={FEATURES}
      outcome={null}
    />
  );
}

