import React from "react";

export default function PredictOutcomeBlock({
  ariaLabel,
  className = "",
  title,
  subtitle,
  preview,
  features,
  outcome,
}) {
  return (
    <section
      className={`predict${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      <div className="predict__inner">
        {title ? <h2 className="predict__title" style={{ whiteSpace: "pre-line" }}>{title}</h2> : null}
        {subtitle ? <p className="predict__subtitle">{subtitle}</p> : null}

        <div className="predict__grid">
          <div className="predict__preview">
            <img
              src={preview?.src}
              alt={preview?.alt ?? ""}
              className="predict__previewImg"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="predict__features">
            {features.map((feature) => (
              <div key={feature.title} className="predict__featureCard">
                <div className="predict__featureTitle">{feature.title}</div>
                <div className="predict__featureBody">{feature.body}</div>
              </div>
            ))}
          </div>
        </div>

        {outcome ? (
          <div className="predict__outcome" role="note">
            <span className="predict__outcomeLabel">{outcome.label}</span>{" "}
            <span>{outcome.text}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
