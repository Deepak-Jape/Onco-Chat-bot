import React from "react";
import "../siteIntelligence/css/ValidationLoopSection.css";

import ValidationLoopBlock from "../../component/ValidationLoopBlock";

export default function TrialIntelligenceValidationLoopSection({ onBookDemo }) {
  const ctaTitle = "Stop Guessing. Start Benchmarking.";
  const ctaSubtitle =
    "Join the oncology teams using OncoSuite to design the trials of the future.";

  return (
    <ValidationLoopBlock
      ariaLabel="Trial intelligence proof"
      className="vloop--trial vloop--container7xl vloop--site-grey"
      title="The Only Platform Built For Complex Oncology Designs."
      subtitle={
        <>
          While legacy platforms provide a &quot;summary,&quot; OncoSuite provides the
          &quot;Evidence Atom.&quot;
        </>
      }
      cards={[
        {
          title: "Cohort-Level Precision",
          body: (
            <>
              We deconstruct Basket and Umbrella trials into individual cohorts,
              ensuring you never miss a nuance in a specific patient subgroup.
            </>
          ),
        },
        {
          title: "Standardized Taxonomy",
          body: (
            <>
              We harmonize unstructured text into a searchable taxonomy, allowing you
              to run complex queries like &quot;Show me all Phase II trials in NSCLC
              that excluded patients with prior PD-1 exposure and had a BMI
              cutoff.&quot;
            </>
          ),
        },
      ]}
      cta={{
        title: ctaTitle,
        subtitle: ctaSubtitle,
        buttonLabel: "Book Your Demo",
        buttonClassName: "landing-button landing-button--primary",
        onClick: onBookDemo,
      }}
    />
  );
}
