import React from "react";
import "../ClinicalDevelopment/css/ClinicalDevelopmentUseCasesSection.css";

import badgeIcon from "../../../assets/icons/badge.svg";
import calculatorIcon from "../../../assets/icons/calculator.svg";
import findInPageIcon from "../../../assets/icons/find-in-page.svg";

const USE_CASES = [
  {
    icon: badgeIcon,
    title: "Performance-Based Site Selection",
    body:
      `Don't select sites just by "PI Reputation." Use our scoring model to rank sites by verified performance.`,
    label1:
      "Trial Congestion",
    text1:
      "See exactly how many active trials are currently competing for your specific patient patient at a given site.",
    label2:
      "Patient Access",
    text2:
      "Calculate real-world catchment based on de-identified patient density within a 100km radius of the facility.", 
    label3: "Sponsor Trust",
    text3: `Identify "High-Reliability" sites by tracking repeat sponsor rates and historical enrollment speed (Patients/Month).`, 
    impact:
      `Eliminate "Non-Performers" before they ever make it onto your site list.`,
  },
  {
    icon: calculatorIcon,
    title: `The "LPI" Simulator`,
    body:
      `Turn your site shortlist into a dynamic enrollment model. Move beyond static spreadsheets.`,
    label1:
      "Timeline Simulation",
    text1:
      "Adjust your site list and instantly watch your Optimistic, Median, and Conservative LPI dates shift.",
    label2:
      "Resource Allocation",
    text2:
      `Distribute patient targets across your sites and identify which facilities are your "Recruitment Engines" and which are your bottlenecks.`,
    impact:
      `Provide your Board with an enrollment forecast backed by data, not hope.`,
  },
  {
    icon: findInPageIcon,
    title: `Protocol Feasibility & "Leakage" Detection`,
    body: `Ensure your protocol is actually "enforceable" at the site level before you start recruiting.`,
    label1:
      "I/E Stress-Testing",
    text1:
      "Cross-reference your itemized Co-morbidities and Prior Treatment exclusions against ZIP-level patient density.",
    label2:
      "Site Capacity",
    text2:
      "Match your protocol's technical requirements (specific imaging, infusion schedules) with the actual Experience & Capability of the facility.", 
    impact:
      `Reduce protocol amendments by identifying recruitment "bottlenecks" during the design phase.`,
  },
];

export default function ClinicalOperationsUseCasesSection() {
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
