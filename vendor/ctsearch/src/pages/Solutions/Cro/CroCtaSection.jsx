import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

export default function CroCtaSection({ onBookDemo }) {
  return (
    <section className="vloop" aria-label="Clinical development call to action">
      <div className="vloop__cta">
        <div className="vloop__ctaInner">
          <h3 className="vloop__ctaTitle">Don't Just Pitch a Trial. Prove You Can Run It.</h3>
          <p className="vloop__ctaSubtitle">
            Elevate your proposals with the industry's most granular oncology intelligence.
          </p>
          <button
            type="button"
            className="landing-button landing-button--primary"
            onClick={onBookDemo}
          >
            Book Your Demo
          </button>
        </div>
      </div>
    </section>
  );
}
