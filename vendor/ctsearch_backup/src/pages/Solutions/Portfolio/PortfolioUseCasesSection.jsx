import React from "react";
import "../ClinicalDevelopment/css/ClinicalDevelopmentUseCasesSection.css";

import valuationIcon from "../../../assets/icons/trend.svg";
import benchmarkingIcon from "../../../assets/icons/multi_layer.svg";
import diligenceIcon from "../../../assets/icons/pipeline_icon.svg";

const USE_CASES = [
  {
    key: "market-sizing",
    icon: valuationIcon,
    title: (
      <>
        Defensible Market Sizing &amp;
        <br />
        Valuation
      </>
    ),
    body: "Build a bottom-up revenue model that stands up to board-level scrutiny.",
    sections: [
      {
        label: "Biomarker-Level Granularity:",
        text:
          'Quantify your "True Addressable Market" by filtering the global landscape by Histology, Mutation, Stage, and Line of Therapy.',
      },
      {
        label: "ZIP-Level Distribution:",
        text:
          'Use Patient Intelligence to map patient density. Move from "Estimated Percentages" to "Calculated Patient Counts."',
      },
    ],
    impact:
      "Deliver high-confidence revenue forecasting and asset valuation for internal reviews or licensing bids.",
  },
  {
    key: "war-gaming",
    icon: benchmarkingIcon,
    title: (
      <>
        Competitive &quot;War-Gaming&quot;
        <br />
        &amp; Benchmarking
      </>
    ),
    body:
      'Understand the "Benchmarks to Beat" across the entire clinical landscape.',
    sections: [
      {
        label: "Cross-Trial Analytics:",
        text:
          "Analyze every competitor arm down to the Dosage, Schedule, and Outcome.",
      },
      {
        label: "MoA Landscape Mapping:",
        text:
          'Identify "crowded" Mechanism of Action spaces and spot white-space opportunities before the competition.',
      },
    ],
    impact:
      "Prioritize assets with the highest probability of clinical differentiation and market leadership.",
  },
  {
    key: "diligence",
    icon: diligenceIcon,
    title: (
      <>
        Pipeline Due Diligence
        <br />
        (M&amp;A and Licensing)
      </>
    ),
    body: "Perform deep-dive audits on external assets in days, not weeks.",
    sections: [
      {
        label: "Protocol De-risking:",
        text:
          '"Red Team" an external asset\'s protocol by cross-referencing their inclusion criteria against our itemized Co-morbidity and Prior Treatment database.',
      },
      {
        label: "Execution Feasibility:",
        text:
          "Validate if an asset’s enrollment claims match the real-world Site Congestion and Patient Density data.",
      },
    ],
    impact:
      "Mitigate acquisition risk with 1-click traceable evidence for every due diligence claim.",
  },
];

export default function PortfolioUseCasesSection() {
  return (
    <section className="cd-usecases" aria-label="High-impact use cases">
      <div className="cd-usecases__inner">
        <h2 className="cd-usecases__title">High-Impact Use Cases</h2>

        <div className="cd-usecases__grid">
          {USE_CASES.map((card) => (
            <article key={card.key} className="cd-usecases__card">
              <div className="cd-usecases__cardHeader">
                <div className="cd-usecases__icon">
                  <img src={card.icon} alt="" aria-hidden="true" />
                </div>
                <div className="cd-usecases__cardTitle">{card.title}</div>
              </div>

              <div className="cd-usecases__body">{card.body}</div>

              {card.sections.map((section) => (
                <React.Fragment key={section.label}>
                  <div className="cd-usecases__label">{section.label}</div>
                  <div className="cd-usecases__text">{section.text}</div>
                </React.Fragment>
              ))}

              <div className="cd-usecases__bottom">
                <div className="cd-usecases__divider" aria-hidden="true" />
                <div className="cd-usecases__outcome">
                  <span className="cd-usecases__outcomeLabel">Impact:</span>{" "}
                  <span className="cd-usecases__outcomeText">{card.impact}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

