import React from "react";
import "../ClinicalDevelopment/css/ClinicalDevelopmentUseCasesSection.css";

import circleIcon from "../../../assets/icons/circle.svg";
import trendIcon from "../../../assets/icons/trend.svg";
import barChartIcon from "../../../assets/icons/BarChart.svg";

const USE_CASES = [
  {
    icon: circleIcon,
    title: "High-Precision Proposal Development",
    body:
      `Move beyond generic enrollment estimates. Build your bid on a foundation of atomized reality.`,
    label1:
      "Protocol Pressure-Testing:",
    text1:
      `Before you submit your RFP, use OncoSuite to "Red Team" the sponsor's protocol. Identify Co-morbidity or Prior Treatment exclusions that will make their original timeline impossible.`,
    label2:
      "Evidence-Based Pricing:",
    text2:
      "Use real-world Site Congestion data to justify your site-selection strategy and budget.", 
    impact:
      `Win the bid by being the only CRO that provides a technical "Proof of Concept" for the enrollment plan.`,
  },
  {
    icon: barChartIcon,
    title: `Predictive Site Selection (The CRO Advantage)`,
    body:
      `Don't just offer "Famous Sites." Offer High-Performance Sites.`,
    label1:
      "The Performance Scorecard:",
    text1:
      `Rank sites across 6 dimensions, including Exact Match cohort history and Repeat Sponsor Rates.`,
    label2:
      `Identify "Hidden Gems":`,
    text2:
      `Surface high-performing, low-congestion sites that your competitors missed, ensuring your sponsor's trial isn't buried in a PI's backlog.`,
    impact:
      `Reduce your reliance on "Rescue Studies" and build a reputation for meeting LPI (Last Patient In) targets every time.`,
  },
  {
    icon: trendIcon,
    title: `The "PLAN" Simulator (Live Feasibility)`,
    body: `Transform your feasibility presentation from a slide deck into a live simulation.`,
    label1:
      "LPI Forecasting:",
    text1:
      `Use the Plan Tab during your pitch to show the sponsor how their timeline shifts as you add or remove specific sites.`,
    label2:
      "Risk Mitigation:",
    text2:
      "Provide Optimistic, Median, and Conservative recruitment curves based on Real-World Patient Density and verified site momentum.", 
    impact:
      `Build immediate trust by showing the sponsor you have already "run" their trial in a digital environment.`,
  },
];

export default function CroUseCasesSection() {
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
