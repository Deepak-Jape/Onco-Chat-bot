import React from "react";
import "../Medical-Affairs/css/MedicalAffairWorkFlowSection.css";

const USE_CASES = [
  {
    step: "01",
    title: "Quantify",
    body:
      "Use Patient Intelligence to size the market for a specific genomic subgroup.",
  },
  {
    step: "02",
    title: "Benchmark",
    body:
      'Use Trial Intelligence to establish the Efficacy/Safety hurdles required for a "Go" decision.',
  },
  {
    step: "03",
    title: "Simulate",
    body: "Use Site Intelligence to determine if the global infrastructure can support a rapid Phase III launch.",
  },
  {
    step: "04",
    title: "Audit",
    body: "Use 1-Click Traceability to verify every competitive claim in your strategic deck.",
  },
];

export default function MedicalAffairsWorkFlowSection() {
  return (
    <section className="cd-usecases" aria-label="The Portfolio Strategy Workflow">
      <div className="cd-workflow__inner">
        <h2 className="cd-usecases__title">The Portfolio Strategy Workflow</h2>

        <div className="cd-workflow__grid">
          {USE_CASES.map((card) => (
            <article
              key={card.title}
              className="cd-workflow__card"
            >
              <div className="cd-workflow__cardHeader">
                <div className="cd-workflow__steps">
                  {card.step}
                </div>
              </div>
              <div className="cd-usecases__cardTitle">
                {card.title}
              </div>
              <div className="cd-workflow__body">
                {card.body}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
