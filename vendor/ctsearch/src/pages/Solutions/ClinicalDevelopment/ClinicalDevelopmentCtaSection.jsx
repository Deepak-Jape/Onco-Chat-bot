import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

export default function ClinicalDevelopmentCtaSection({ onBookDemo }) {
  return (
    <section className="vloop vloop--container7xl" aria-label="Clinical development call to action">
      <div className="vloop__cta">
        <div className="vloop__ctaInner onco-container-7xl">
          <h3 className="vloop__ctaTitle">Ready to De-risk Your Protocol?</h3>
          <p className="vloop__ctaSubtitle">
            Join clinical development teams using OncoSuite to design trials that
            succeed the first time.
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
