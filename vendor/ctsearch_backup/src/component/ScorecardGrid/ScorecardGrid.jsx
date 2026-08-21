import React from "react";

export default function ScorecardGrid({
  ariaLabel,
  className = "",
  title,
  subtitle,
  cards,
}) {
  const countClass = cards?.length ? ` scorecard--count-${cards.length}` : "";
  return (
    <section
      className={`scorecard${countClass}${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      <div className="scorecard__inner">
        {title ? <h2 className="scorecard__title">{title}</h2> : null}
        {subtitle ? <p className="scorecard__subtitle">{subtitle}</p> : null}

        <div className="scorecard__grid">
          {cards.map((card) => {
            const Icon = card?.icon;
            return (
              <article key={card.title} className="scorecard__card">
                <div className="scorecard__cardHeader">
                  { Icon &&
                    (
                      <div className="scorecard__icon">
                        {typeof Icon === "string" ? (
                          <img
                            className="scorecard__iconImg"
                            src={Icon}
                            alt=""
                            aria-hidden="true"
                          />
                        ) : (
                          <Icon fontSize="small" />
                        )}
                      </div>
                    )
                  }
                  <div className="scorecard__cardTitle">{card.title}</div>
                </div>

                <div className="scorecard__cardBody">{card.body}</div>

                {card.value ? (
                  <div className="scorecard__bottom">
                    <div className="scorecard__divider" aria-hidden="true" />
                    <div className="scorecard__value">
                      <span className="scorecard__valueLabel">The Value:</span>{" "}
                      <span className="scorecard__valueText">{card.value}</span>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
