import React from "react";
import "../Medical-Affairs/css/MedicalAffairWorkFlowSection.css";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Analyze",
    body:
      'Deconstruct competitor protocols to find the "Scientific White Space" for your asset.',
  },
  {
    step: "02",
    title: "Map",
    body:
      "Identify high-density patient clusters to strategically place a limited number of high-performing sites.",
  },
  {
    step: "03",
    title: "Forecast",
    body:
      "Use the Plan Simulator to set realistic LPI dates for Board reporting and financial planning.",
  },
  {
    step: "04",
    title: "Defend",
    body:
      "Access primary source documents instantly during due diligence for licensing or M&A.",
  },
];

export default function BiotechWorkflowSection() {
  return (
    <section className="cd-usecases" aria-label="The Biotech Efficiency Workflow">
      <div className="cd-workflow__inner">
        <h2 className="cd-usecases__title">The Biotech Efficiency Workflow</h2>

        <div className="cd-workflow__grid">
          {WORKFLOW_STEPS.map((card) => (
            <article key={card.title} className="cd-workflow__card">
              <div className="cd-workflow__cardHeader">
                <div className="cd-workflow__steps">{card.step}</div>
              </div>
              <div className="cd-usecases__cardTitle">{card.title}</div>
              <div className="cd-workflow__body">{card.body}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

