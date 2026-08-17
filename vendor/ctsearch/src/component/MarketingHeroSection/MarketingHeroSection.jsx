import React, { useCallback, useRef } from "react";

export default function MarketingHeroSection({
  ariaLabel,
  className = "",
  background,
  backgroundSrcSet,
  backgroundSizes = "100vw",
  kicker,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  media,
}) {
  const sectionRef = useRef(null);

  const handleSecondaryCtaClick = useCallback(
    (event) => {
      if (secondaryCta?.scrollTo === "next-h2") {
        event.preventDefault();

        const sectionEl = sectionRef.current;
        if (!sectionEl) return;

        const sectionBottom =
          sectionEl.getBoundingClientRect().bottom + window.scrollY;

        const h2s = Array.from(document.querySelectorAll("h2"));
        const next = h2s
          .map((el) => ({
            el,
            top: el.getBoundingClientRect().top + window.scrollY,
          }))
          .filter(({ top }) => top > sectionBottom + 1)
          .sort((a, b) => a.top - b.top)[0]?.el;

        if (next) {
          const rootStyle = getComputedStyle(document.documentElement);
          const rawOffset = rootStyle
            .getPropertyValue("--landing-header-offset")
            .trim();
          const headerOffset = Number.parseInt(rawOffset, 10);
          const offset = Number.isFinite(headerOffset) ? headerOffset : 88;

          const targetTop = next.getBoundingClientRect().top + window.scrollY;
          const y = Math.max(0, Math.round(targetTop - offset));
          window.scrollTo({ top: y, behavior: "smooth" });

          window.setTimeout(() => {
            if (typeof next.focus === "function") {
              next.focus({ preventScroll: true });
            }
          }, 300);
        }

        return;
      }

      secondaryCta?.onClick?.(event);
    },
    [secondaryCta],
  );

  return (
    <section
      ref={sectionRef}
      className={`siteintel-hero${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      <img
        className="siteintel-hero__bg"
        src={background?.src}
        alt=""
        aria-hidden="true"
        srcSet={backgroundSrcSet}
        sizes={backgroundSizes}
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />
      <div className="siteintel-hero__bgOverlay" aria-hidden="true" />

      <div className="siteintel-hero__inner">
        <div className="siteintel-hero__content">
          {kicker ? <div className="siteintel-hero__kicker">{kicker}</div> : null}
          {title ? <h2 className="siteintel-hero__title">{title}</h2> : null}
          {subtitle ? (
            <p className="siteintel-hero__subtitle">{subtitle}</p>
          ) : null}

          <div className="siteintel-hero__actions">
            {primaryCta ? (
              <button
                type="button"
                className={primaryCta.className}
                onClick={primaryCta.onClick}
              >
                {primaryCta.label}
              </button>
            ) : null}

            {secondaryCta ? (
              <button
                type="button"
                className={secondaryCta.className}
                onClick={handleSecondaryCtaClick}
              >
                {secondaryCta.iconSrc ? (
                  <img
                    src={secondaryCta.iconSrc}
                    alt=""
                    aria-hidden="true"
                    width={secondaryCta.iconWidth ?? 22}
                    height={secondaryCta.iconHeight ?? 22}
                  />
                ) : null}
                <span>{secondaryCta.label}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="siteintel-hero__media" aria-hidden="true">
          <div className="siteintel-hero__mediaFrame">
            <img
              src={media?.src}
              alt={media?.alt ?? ""}
              className="siteintel-hero__mediaImg"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
