import React from "react";
import "./PredictOutcomeSection.css";
import PredictOutcomeBlock from "../../component/PredictOutcomeBlock/PredictOutcomeBlock";

import LpiPreview from "../../assets/images/screen_thumbnail_780.webp";

const FEATURES = [
  {
    title: "Interactive Forecasting",
    body:
      "Adjust your site list in real-time and watch your \"Time to LPI\" shift instantly.",
  },
  {
    title: "Probability Modeling",
    body:
      "See your Optimistic (p75), Median, and Conservative (p75) timelines to prepare for every scenario.",
  },
  {
    title: "Dynamic Resource Allocation",
    body:
      "Distribute patient targets across your site list and see which facilities are your \"recruitment engines\" and which are your \"bottlenecks.\"",
  },
];

export default function PredictOutcomeSection() {
  return (
    <PredictOutcomeBlock
      ariaLabel="Predict your outcome"
      title="Predict Your Outcome Before You Open A Single Site."
      subtitle={
        <>
          We help you turn your shortlisted sites into a predictive roadmap of
          patient enrollments.
        </>
      }
      preview={{ src: LpiPreview, alt: "Time to LPI preview" }}
      features={FEATURES}
      outcome={{
        label: "Outcome:",
        text: (
          <>
            A defensible, data-backed enrollment plan you can take to your board
            with 100% confidence.
          </>
        ),
      }}
    />
  );
}

