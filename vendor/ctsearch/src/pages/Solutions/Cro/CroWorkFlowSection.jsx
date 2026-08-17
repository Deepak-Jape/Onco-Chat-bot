import React from "react";
import "../Medical-Affairs/css/MedicalAffairWorkFlowSection.css"
import frame1Icon from "../../../assets/icons/Frame 01.svg";
import frame2Icon from "../../../assets/icons/Frame 02.svg";
import frame3Icon from "../../../assets/icons/Frame 03.svg";
import frame4Icon from "../../../assets/icons/Frame 04.svg";

const USE_CASES = [
  {
    icon: frame1Icon,
    title: "Analyze",
    body:
      `Deconstruct the sponsor's protocol into itemized Histology, Biomarker, and Treatment components.`,
  },
  {
    icon: frame2Icon,
    title: "Map",
    body:
      `Cross-reference the protocol with Patient Intelligence (ZIP-level) to identify the highest-density recruitment zones globally.`,
  },
  {
    icon: frame3Icon,
    title: "Score",
    body: "Select a site list based on Trial Congestion and verified enrollment speed.",
  },
  {
    icon: frame4Icon,
    title: "Validate",
    body: "Generate a data-backed LPI forecast using the Plan Simulator to include in your RFP response.",
  },
];

export default function CroWorkFlowSection() {
  return (
    <section className="cd-usecases" aria-label="The Pharma Enterprise Workflow">
      <div className="cd-workflow__inner">
        <h2 className="cd-usecases__title">The CRO Workflow</h2>

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
