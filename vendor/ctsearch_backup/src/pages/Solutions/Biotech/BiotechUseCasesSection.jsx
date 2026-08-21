import React from "react";
import "../ClinicalDevelopment/css/ClinicalDevelopmentUseCasesSection.css";

import shieldIcon from "../../../assets/logo/protocol.svg";
import barChartIcon from "../../../assets/icons/Investor.svg";
import patientSpeedIcon from "../../../assets/icons/patient_speed.svg";

const USE_CASES = [
  {
    key: "rapid-protocol-derisking",
    icon: shieldIcon,
    title: (
      <>
        Rapid Protocol De-risking
        <br />
        (Protect the Runway)
      </>
    ),
    body:
      "Don't let a \"design flaw\" kill your asset. We help you lock your protocol with the confidence that it can actually be executed.",
    sections: [
      {
        label: "Itemized Benchmarking:",
        text:
          "Compare your design against every competitor arm, specifically looking at Co-morbidities and Prior Treatments that could choke your recruitment.",
      },
      {
        label: "Feasibility Simulation:",
        text:
          "Use our Plan Tab to see if your enrollment targets are realistic before you commit to a timeline for your investors.",
      },
    ],
    impact: "Avoid the $2M \"Amendment Tax\" and keep your development on track.",
  },
  {
    key: "investor-ready-market-sizing",
    icon: barChartIcon,
    title: (
      <>
        Investor-Ready Market
        <br />
        Sizing
      </>
    ),
    body:
      "When you are in the room with VCs or potential partners, \"Approximate\" market sizing won't cut it.",
    sections: [
      {
        label: "Precision Quantification:",
        text:
          "Use Patient Intelligence to map your specific biomarker-driven patient down to the ZIP code.",
      },
      {
        label: "Evidence-Backed Valuation:",
        text:
          "Provide 1-click traceable data for every claim in your pitch deck, proving the commercial viability of your asset.",
      },
    ],
    impact:
      "Build immediate trust with investors by showing a level of data-rigor that exceeds industry standards.",
  },
  {
    key: "lean-site-execution",
    icon: patientSpeedIcon,
    title: (
      <>
        Lean Site Execution
        <br />
        (Small Team, Big Impact)
      </>
    ),
    body: "You don't need a 50-person ClinOps team to find the best sites.",
    sections: [
      {
        label: "The \"Hidden Gem\" Search:",
        text:
          "Use Site Intelligence to identify high-performing, low-congestion sites that Big Pharma has overlooked.",
      },
      {
        label: "PI Access:",
        text:
          "Rank investigators by \"Exact Match\" cohort experience to ensure your MSLs are talking to the right KOLs from Day 1.",
      },
    ],
    impact:
      "Out-enroll larger competitors by placing your trial where the patients are, not where the most famous PIs are.",
  },
];

export default function BiotechUseCasesSection() {
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

