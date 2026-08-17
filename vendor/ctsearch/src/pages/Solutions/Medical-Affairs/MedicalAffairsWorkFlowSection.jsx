import React from "react";
import "./css/MedicalAffairWorkFlowSection.css";
import frame1Icon from "../../../assets/icons/Frame 01.svg";
import frame2Icon from "../../../assets/icons/Frame 02.svg";
import frame3Icon from "../../../assets/icons/Frame 03.svg";
import frame4Icon from "../../../assets/icons/Frame 04.svg";

const USE_CASES = [
  {
    icon: frame1Icon,
    title: "Monitor",
    body:
      'Set automated alerts for competitor trial starts and protocol amendments in your specific histology.',
  },
  {
    icon: frame2Icon,
    title: "Benchmark",
    body:
      `Deconstruct peer-group regimens (Drugs, Dosages, Schedules) to identify your asset's unique differentiation.`,
  },
  {
    icon: frame3Icon,
    title: "Map",
    body: "Align your scientific outreach with geographic patient density via ZIP-level modeling.",
  },
  {
    icon: frame4Icon,
    title: "Defend",
    body: "Access the primary source documents for any competitive claim instantly, ensuring your scientific narrative is bulletproof.",
  },
];

export default function MedicalAffairsWorkFlowSection() {
  return (
    <section className="cd-usecases" aria-label="The Medical Affairs Workflow">
      <div className="cd-workflow__inner">
        <h2 className="cd-usecases__title">The Medical Affairs Workflow</h2>

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
