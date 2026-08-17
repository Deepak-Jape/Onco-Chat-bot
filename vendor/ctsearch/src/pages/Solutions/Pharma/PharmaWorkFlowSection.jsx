import React from "react";
import "../Medical-Affairs/css/MedicalAffairWorkFlowSection.css"
import frame1Icon from "../../../assets/icons/Frame 01.svg";
import frame2Icon from "../../../assets/icons/Frame 02.svg";
import frame3Icon from "../../../assets/icons/Frame 03.svg";
import frame4Icon from "../../../assets/icons/Frame 04.svg";

const USE_CASES = [
  {
    icon: frame1Icon,
    title: "Standardize",
    body:
      'Replace fragmented regional reports with a single, atomized data layer used by all stakeholders.',
  },
  {
    icon: frame2Icon,
    title: "Align",
    body:
      `Ensure R&D, ClinOps, and Commercial teams are viewing the same Market Sizing and Competitive Landscape maps.`,
  },
  {
    icon: frame3Icon,
    title: "Accelerate",
    body: "Use the Plan Simulator to forecast global enrollment timelines and set realistic commercial launch targets.",
  },
  {
    icon: frame4Icon,
    title: "Comply",
    body: "Maintain 100% data transparency with 1-click access to primary source protocols for every data point.",
  },
];

export default function PharmaWorkFlowSection() {
  return (
    <section className="cd-usecases" aria-label="The Pharma Enterprise Workflow">
      <div className="cd-workflow__inner">
        <h2 className="cd-usecases__title">The Pharma Enterprise Workflow</h2>

        <div className="cd-workflow__grid">
          {USE_CASES.map((card) => (
            <article
              key={card.title}
              className="cd-workflow__card"
            >
              <div className="cd-workflow__cardHeader">
                <div className="cd-workflow__steps">
                  <img src={card.icon} alt="" aria-hidden="true" />
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
