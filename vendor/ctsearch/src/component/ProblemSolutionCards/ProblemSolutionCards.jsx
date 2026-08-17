import React from "react";

export default function ProblemSolutionCards({ className = "", problem, solution }) {
  return (
    <section
      className={`ps-section${className ? ` ${className}` : ""}`}
      aria-label="Problem and Solution"
    >
      <div className="ps-section__inner">
        <div className="ps-card ps-card--problem">
          <div className="ps-card__kicker ps-card__kicker--problem">
            {problem.kicker}
          </div>
          <h3 className="ps-card__title">{problem.title}</h3>
          <p className="ps-card__body">{problem.body}</p>
        </div>

        <div className="ps-card ps-card--solution">
          <div className="ps-card__kicker ps-card__kicker--solution">
            {solution.kicker}
          </div>
          <h3 className="ps-card__title">{solution.title}</h3>
          <p className="ps-card__body">{solution.body}</p>
        </div>
      </div>
    </section>
  );
}
