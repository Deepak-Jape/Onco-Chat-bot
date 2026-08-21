import React from "react";
import "../Medical-Affairs/css/MedicalAffairWorkFlowSection.css"
import frame1Icon from "../../../assets/icons/Frame 01.svg";
import frame2Icon from "../../../assets/icons/Frame 02.svg";
import frame3Icon from "../../../assets/icons/Frame 03.svg";
import frame4Icon from "../../../assets/icons/Frame 04.svg";

const USE_CASES = [
  {
    icon: frame1Icon,
    title: "Find",
    body:
      'Search 59k+ trials to identify PIs and sites with "Exact Match" experience in your specific histology and biomarker.',
  },
  {
    icon: frame2Icon,
    title: "Score",
    body:
      `Evaluate sites across 6 dimensions, including enrollment momentum and trial congestion.`,
  },
  {
    icon: frame3Icon,
    title: "Plan",
    body: "Use the Plan Tab to simulate your recruitment curve and finalize your site list based on your target LPI date.",
  },
  {
    icon: frame4Icon,
    title: "Execute",
    body: "Deploy MSLs and recruitment resources to high-density ZIP codes identified in the Patient Intelligence module.",
  },
];

export default function ClinicalOperationsWorkFlowSection() {
  return (
    <section className="cd-usecases" aria-label="The Clinical Operation Workflow">
      <div className="cd-workflow__inner">
        <h2 className="cd-usecases__title">The Clinical Operation Workflow</h2>

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
