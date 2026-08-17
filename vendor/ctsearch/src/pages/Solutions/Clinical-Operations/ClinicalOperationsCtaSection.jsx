import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

export default function ClinicalOperationsCtaSection({ onBookDemo }) {
  return (
    <section className="vloop" aria-label="Clinical development call to action">
      <div className="vloop__cta">
        <div className="vloop__ctaInner">
          <h3 className="vloop__ctaTitle">Stop Guessing Your Enrollment Date. Engineer It.</h3>
          <p className="vloop__ctaSubtitle">
            Eliminate recruitment friction with the industry's most granular site intelligence.
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
