import React from "react";
import "./css/TrialIntelligenceUseCasesSection.css";

const USE_CASES = [
  {
    title: 'Competitive Design Audits (The "Hurdle to Beat")',
    body:
      "Don't design your protocol in a vacuum. OncoSuite aggregates outcomes across thousands of active and historical arms to establish the exact statistical floor and ceiling for your asset.",
    specificsTitle: "The Specifics",
    specifics:
      "Instantly calculate Median PFS/ORR benchmarks for any specific histology, Line of Therapy, and Biomarker co-expression.",
    outcome:
      'A defensible "Go/No-Go" framework for internal governance cycles and investor due diligence.',
  },
  {
    title: "Obsolescence Prevention (Predicting the 2027 SOC)",
    body:
      "Oncology moves faster than the publication cycle. We visualize the trajectory of the industry so you don't design a trial against a Standard of Care (SOC) that will be obsolete by the time you read out.",
    specificsTitle: "The Specifics",
    specifics:
      "Track the rise of specific combination therapies and Mechanism of Action (MoA) shifts years before they become the consensus.",
    outcome:
      "Proactive protocol design that anticipates the market landscape at the time of your 1L or 2L launch.",
  },
  {
    title: "Protocol Stress-Testing (I/E Criteria Optimization)",
    body:
      "Identify the specific \"Inclusion/Exclusion\" hurdles that will kill your enrollment. Audit your draft protocol against the \"fine print\" of the competitive field.",
    specificsTitle: "The Specifics",
    specifics:
      "Run your draft criteria against our 70-dimension taxonomy, including co-morbidities and prior treatments.",
    outcome:
      "Optimized I/E criteria that maximize patient access while maintaining scientific rigor.",
  },
  {
    title: "Safety & Regulatory Benchmarking",
    body:
      "Quantify the \"Risk Profile\" of your treatment backbone. Access itemized safety signals across the entire MoA class to ensure your safety monitoring is calibrated to current regulatory expectations.",
    specificsTitle: "The Specifics",
    specifics:
      "Access pre-calculated Grade 3+ AE benchmarks and specific safety endpoints for 140k+ treatment arms.",
    outcome:
      "A governance-ready safety narrative for FDA/EMA filings and clinical trial authorization.",
  },
];

export default function TrialIntelligenceUseCasesSection() {
  return (
    <section className="ti-usecases" aria-label="Primary use cases">
      <div className="ti-usecases__inner onco-container-7xl">
        <h2 className="ti-usecases__title">Primary Use Cases: The Strategic Playbook</h2>
        <p className="ti-usecases__subtitle">
          Replace weeks of manual evidence-gathering with institutional-grade
          certainty.
        </p>

        <div className="ti-usecases__grid">
          {USE_CASES.map((card) => (
            <article key={card.title} className="ti-usecases__card">
              <div className="ti-usecases__content">
                <div className="ti-usecases__cardTitle">{card.title}</div>
                <div className="ti-usecases__cardBody">{card.body}</div>

                <div className="ti-usecases__label">The Specifics</div>
                <div className="ti-usecases__text">{card.specifics}</div>
              </div>

              <div className="ti-usecases__bottom">
                <div className="ti-usecases__divider" aria-hidden="true" />
                <div className="ti-usecases__outcome">
                  <span className="ti-usecases__outcomeLabel">Outcome:</span>{" "}
                  <span className="ti-usecases__outcomeText">{card.outcome}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
