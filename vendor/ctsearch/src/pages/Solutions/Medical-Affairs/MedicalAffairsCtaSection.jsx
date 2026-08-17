import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

export default function MedicalAffairsCtaSection({ onBookDemo }) {
  return (
    <section className="vloop" aria-label="Clinical development call to action">
      <div className="vloop__cta">
        <div className="vloop__ctaInner">
          <h3 className="vloop__ctaTitle">Don't Just Track the Market. Lead It.</h3>
          <p className="vloop__ctaSubtitle">
            Equip your team with the precision intelligence required to win the scientific narrative.
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
