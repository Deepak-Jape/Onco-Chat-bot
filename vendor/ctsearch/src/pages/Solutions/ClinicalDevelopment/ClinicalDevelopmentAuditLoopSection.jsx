import React from "react";
import "./css/ClinicalDevelopmentAuditLoopSection.css";

const CARDS = [
  {
    title: "Asset Benchmarking (The Market Hurdle)",
    intro:
      'Before finalizing a Target Product Profile, define the "Statistical Floor"—minimum efficacy and safety needed to compete.',
    oldWayTitle: "The Old Way",
    oldWayBody: "Guessing competitive benchmarks from outdated, high-level summaries.",
    oncoWayTitle: "The OncoSuite Way",
    oncoWayBody:
      "We atomize 59k+ trials into 70+ structured dimensions. Instantly pull Median PFS/ORR for specific biomarker co-expressions to set your internal “Go/No-Go” hurdles.",
    value:
      "Establish an investment thesis based on atomic evidence, not generic averages.",
  },
  {
    title: 'The "I/E Stress Test" (Sensitivity)',
    intro:
      "As the protocol is drafted, every inclusion/exclusion (I/E) criterion is a potential recruitment bottleneck.",
    oldWayTitle: "The Old Way",
    oldWayBody:
      "Discovering mid-trial that a renal clearance threshold or a prior therapy exclusion “boxed out” 40% of your patient pool.",
    oncoWayTitle: "The OncoSuite Way",
    oncoWayBody:
      "Run your draft criteria against our High-Granularity Taxonomy. See exactly how adding a specific comorbidity exclusion shrinks your eligible patient pool in real-time.",
    value:
      "Eliminate mid-study amendments that cost $50M+ and delay market entry by 18 months.",
  },
  {
    title: 'The "Future-Proofing" (SOC Forecasting)',
    intro:
      "You are designing for a readout in 2027 or 2028; your trial must remain relevant then.",
    oldWayTitle: "The Old Way",
    oldWayBody:
      "Designing against today’s Standard of Care (SOC), only to launch against a superior competitor.",
    oncoWayTitle: "The OncoSuite Way",
    oncoWayBody:
      "We track Mechanism of Action (MoA) shifts and Phase I/II trends to map the “White Space”. Design a trial that wins the narrative at the time of launch.",
    value:
      "Protect the asset from being “Dead on Arrival” due to a shift in the competitive landscape.",
  },
  {
    title: 'Fiduciary Defense (1-Click Traceability)',
    intro:
      "Every design decision must be defended to the Board, VCs, or Regulatory agencies.",
    oldWayTitle: "The Old Way",
    oldWayBody:
      "Scrambling to find the specific ASCO poster or registry filing that justified a biomarker cutoff.",
    oncoWayTitle: "The OncoSuite Way",
    oncoWayBody:
      "Every data point is 1-Click Traceable. Click any benchmark to instantly pull the original source—with the relevant data already highlighted.",
    value:
      "Total boardroom confidence and accelerated “Approval to Proceed” through the governance gate.",
  },
];

export default function ClinicalDevelopmentAuditLoopSection() {
  return (
    <section className="cd-auditloop" aria-label="Clinical development audit loop">
      <div className="cd-auditloop__inner onco-container-7xl">
        <h2 className="cd-auditloop__title">The Clinical Development Audit Loop</h2>
        <p className="cd-auditloop__subtitle">
          Securing the Asset Strategy from Protocol Design to Board Approval
        </p>

        <div className="cd-auditloop__grid">
          {CARDS.map((card) => (
            <article key={card.title} className="cd-auditloop__card">
              <div className="cd-auditloop__cardTitle">{card.title}</div>
              <div className="cd-auditloop__intro">{card.intro}</div>

              <div className="cd-auditloop__block cd-auditloop__block--old">
                <div className="cd-auditloop__sectionTitle">{card.oldWayTitle}</div>
                <div className="cd-auditloop__text cd-auditloop__text--old">
                  {card.oldWayBody}
                </div>
              </div>

              <div className="cd-auditloop__divider" aria-hidden="true" />

              <div className="cd-auditloop__block cd-auditloop__block--onco">
                <div className="cd-auditloop__sectionTitle">{card.oncoWayTitle}</div>
                <div className="cd-auditloop__text cd-auditloop__text--onco">
                  {card.oncoWayBody}
                </div>
              </div>

              <div className="cd-auditloop__divider" aria-hidden="true" />

              <div className="cd-auditloop__value">
                <span className="cd-auditloop__valueLabel">Value:</span>{" "}
                <span className="cd-auditloop__valueText">{card.value}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
