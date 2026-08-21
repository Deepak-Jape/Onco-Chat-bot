import React from "react";

export default function ValidationLoopBlock({
  ariaLabel,
  className = "",
  title,
  subtitle,
  cards,
  cta,
}) {
  return (
    <section className={`vloop${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      <div className="vloop__top">
        {title ? <h2 className="vloop__title">{title}</h2> : null}
        {subtitle ? <p className="vloop__subtitle">{subtitle}</p> : null}

        <div className="vloop__grid">
          {cards.map((card) => (
            <article key={card.title} className="vloop__card">
              <div className="vloop__cardTitle">{card.title}</div>
              <div className="vloop__cardBody">{card.body}</div>
              {card.value ? (
                <div className="vloop__bottom">
                  <div className="vloop__divider" aria-hidden="true" />
                  <div className="vloop__value">
                    <span className="vloop__valueLabel">The Value:</span>{" "}
                    <span>{card.value}</span>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {cta ? (
        <div className="vloop__cta">
          <div className="vloop__ctaInner">
            <h3 className="vloop__ctaTitle">{cta.title}</h3>
            <p className="vloop__ctaSubtitle">{cta.subtitle}</p>
            <button
              type="button"
              className={cta.buttonClassName}
              onClick={cta.onClick}
            >
              {cta.buttonLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
