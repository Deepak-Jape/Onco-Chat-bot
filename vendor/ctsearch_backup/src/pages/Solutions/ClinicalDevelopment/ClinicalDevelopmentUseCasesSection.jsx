import React from "react";
import "./css/ClinicalDevelopmentUseCasesSection.css";

import stressTestingIcon from "../../../assets/icons/protocol.svg";
import analyticsIcon from "../../../assets/icons/trend.svg";
import trendsIcon from "../../../assets/icons/sponsor_trust.svg";

const USE_CASES = [
  {
    icon: stressTestingIcon,
    title: "Protocol Stress-Testing",
    body:
      'Validate your "Inclusion/Exclusion" (I/E) criteria against real-world patient density.',
    logic:
      "See exactly how shifting a biomarker cutoff (e.g., PD-L1 >1% to >5%) or adding a comorbidity exclusion (e.g., renal clearance) shrinks your eligible patient pool in real-time.",
    outcome:
      "Reach protocol lock with a mathematically validated enrollment path.",
  },
  {
    icon: analyticsIcon,
    title: "Cross-Trial Analytics",
    body:
      'Identify the "Benchmarks to Beat" by deconstructing competitor arms.',
    logic:
      "We extract unstructured data—prior lines of therapy, physical conditions, and specific co-medications—to show you the exact performance of competing cohorts.",
    outcome:
      'Establish high-confidence Efficacy/Safety targets for your internal "Go/No-Go" governance.',
  },
  {
    icon: trendsIcon,
    title: "Longitudinal Trend Tracking",
    body: "Anticipate the 2027 Standard of Care (SOC).",
    logic:
      "Track how inclusion criteria and Mechanism of Action (MoA) combinations are trending across current Phase I/II trials.",
    outcome:
      "Future-proof your design so your comparator remains relevant at the time of your readout.",
  },
];

export default function ClinicalDevelopmentUseCasesSection() {
  return (
    <section className="cd-usecases" aria-label="High-impact use cases">
      <div className="cd-usecases__inner onco-container-7xl">
        <h2 className="cd-usecases__title">High-Impact Use Cases</h2>

        <div className="cd-usecases__grid">
          {USE_CASES.map((card) => (
            <article key={card.title} className="cd-usecases__card"  style={{padding: '0'}}>
              <span style={{padding: '16px'}}>
                <div className="cd-usecases__cardHeader">
                  <div className="cd-usecases__icon">
                    <img src={card.icon} alt="" aria-hidden="true" />
                  </div>
                  <div className="cd-usecases__cardTitle">{card.title}</div>
                </div>

                <div className="cd-usecases__body">{card.body}</div>

                <div className="cd-usecases__label">The Logic</div>
                <div className="cd-usecases__text">{card.logic}</div>
              </span>

              <div className="cd-usecases__bottom" style={{padding: '0 16px 16px 16px', background: '#F0F6FE', borderRadius: '0 0 7px 7px'}}>
                <div className="cd-usecases__divider" aria-hidden="true" />
                <div className="cd-usecases__outcome">
                  <span className="cd-usecases__outcomeLabel">Outcome:</span>{" "}
                  <span className="cd-usecases__outcomeText">{card.outcome}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
