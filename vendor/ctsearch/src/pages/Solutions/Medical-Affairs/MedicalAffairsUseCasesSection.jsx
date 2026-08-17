import React from "react";
import "../ClinicalDevelopment/css/ClinicalDevelopmentUseCasesSection.css";

import bellIcon from "../../../assets/icons/bell.svg";
import circleIcon from "../../../assets/icons/circle.svg";
import analyticsIcon from "../../../assets/icons/trend.svg";

const USE_CASES = [
  {
    icon: bellIcon,
    title: "Real-Time Competitive Intelligence (CI)",
    body:
      'Stop digging through registry updates. Monitor competition precisely.',
    label1:
      "Protocol Pivot Detection:",
    text1:
      "Get instant visibility when a competitor shifts their inclusion criteria, adds a new treatment arm, or changes a dosage schedule.",
    label2:
      "MoA Landscape Mapping:",
    text2:
      "Track emerging Mechanisms of Action and combination strategies in your specific histology.", 
    impact:
      "Transform MSLs into high-authority scientific partners for KOLs, backed by audit-ready intelligence",
  },
  {
    icon: circleIcon,
    title: "Scientific Benchmarking & Gap Analysis",
    body:
      `Quantify your asset's standing against the current and future Standard of Care (SOC).`,
    label1:
      "Itemized Cohort Analytics:",
    text1:
      "Compare your trial's Co-morbidities, Prior Treatments, and Outcome Benchmarks against every competing cohort.",
    label2:
      "Cross-Trial Efficacy/Safety:",
    text2:
      `Establish the statistical "Gold Standard" your MSLs need to communicate to Key Opinion Leaders (KOLs).`, 
    impact:
      `Identify strategic gaps in your own data generation plan and strengthen your "Value Story" with harmonized global evidence.`,
  },
  {
    icon: analyticsIcon,
    title: "MSL Empowerment & Field Intelligence",
    body: "Arm your field teams with the world's most granular oncology data.",
    label1:
      "1-Click Evidence:",
    text1:
      "Enable MSLs to trace any data point, like comorbidity exclusions or treatments, back to the original source quickly.",
    label2:
      "ZIP-Level Patient Mapping:",
    text2:
      "Use Patient Intelligence to find high-density patient clusters and emerging Hotspots for MSL outreach.", 
    impact:
      "Move from reactive tracking to proactive strategy. Anticipate competitor readouts before they hit the podium at ASCO or ESMO.",
  },
];

export default function MedicalAffairsUseCasesSection() {
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
