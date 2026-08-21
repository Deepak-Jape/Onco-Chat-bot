import React from "react";
import "../ClinicalDevelopment/css/ClinicalDevelopmentUseCasesSection.css";

import pharma1Icon from "../../../assets/icons/Pharma-1.svg";
import pharma2Icon from "../../../assets/icons/Pharma-2.svg";
import pharma3Icon from "../../../assets/icons/Pharma-3.svg";

const USE_CASES = [
  {
    icon: pharma1Icon,
    title: "Global Portfolio Synchronization",
    body:
      `Ensure every asset in your pipeline is optimized against the most current global benchmarks.`,
    label1:
      "Cross-Asset Benchmarking:",
    text1:
      "Use our itemized Cohort and Treatment data to standardize how you measure success across different histology programs.",
    label2:
      "Standard of Care (SOC) Monitoring:",
    text2:
      "Track emerging SOC shifts globally to ensure your Phase III comparators remain valid for both FDA and EMA submissions.", 
    impact:
      `Eliminate regional strategy gaps and ensure global portfolio prioritization is backed by harmonized data.`,
  },
  {
    icon: pharma2Icon,
    title: `Enterprise-Wide De-risking (The Amendment Shield)`,
    body:
      `Standardize the protocol review process to eliminate avoidable delays.`,
    label1:
      "Institutional Protocol Audits:",
    text1:
      `Use OncoSuite to "Red Team" protocols across therapeutic areas. Cross-reference Co-morbidities and Prior Treatments with patient density to flag recruitment risks early.`,
    label2:
      "Traceable Governance:",
    text2:
      `Every design choice is backed by 1-Click Traceability, providing a digital audit trail for internal compliance and regulatory due diligence.`,
    impact:
      `Reduce the global "Amendment Tax" by institutionalizing data-driven design.`,
  },
  {
    icon: pharma3Icon,
    title: `Optimized Global Execution (Site & Patient Synergy)`,
    body: `Maximize the ROI of your global site footprint and MSL deployment.`,
    label1:
      "Site Congestion Management:",
    text1:
      `Identify where your own internal trials are competing for the same PIs and patients, and shift resources to "White Space" sites.`,
    label2:
      "Precision MSL Deployment:",
    text2:
      "Use ZIP-level Patient Intelligence to align your global Medical Affairs outreach with real-world patient clusters.", 
    impact:
      `Accelerate global "Last Patient In" (LPI) by matching your highest-potential assets with the sites best equipped to deliver.`,
  },
];

export default function PharmaUseCasesSection() {
  return (
    <section className="cd-usecases" aria-label="High-impact use cases">
      <div className="cd-usecases__inner">
        <h2 className="cd-usecases__title">High-Impact Use Cases</h2>

        <div className="cd-usecases__grid">
          {USE_CASES.map((card) => (
            <article key={card.title} className="cd-usecases__card">
              <div className="cd-usecases__cardHeader">
                <div className="cd-usecases__icon">
                  <img src={card.icon} alt="" aria-hidden="true" />
                </div>
                <div className="cd-usecases__cardTitle">{card.title}</div>
              </div>

              <div className="cd-usecases__body">{card.body}</div>

              <div className="cd-usecases__label">{card.label1}</div>
              <div className="cd-usecases__text">{card.text1}</div>

              <div className="cd-usecases__label">{card.label2}</div>
              <div className="cd-usecases__text">{card.text2}</div>

              { card?.label3 &&
                (
                  <>
                  <div className="cd-usecases__label">{card.label3}</div>
                  <div className="cd-usecases__text">{card.text3}</div>
                  </>
                )
              }

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
