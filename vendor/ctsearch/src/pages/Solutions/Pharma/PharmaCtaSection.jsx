import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

export default function PharmaCtaSection({ onBookDemo }) {
  return (
    <section className="vloop" aria-label="Clinical development call to action">
      <div className="vloop__cta">
        <div className="vloop__ctaInner">
          <h3 className="vloop__ctaTitle">Don't Just Manage Your Portfolio. Command Your Market.</h3>
          <p className="vloop__ctaSubtitle">
            Institutionalize precision oncology intelligence across your entire organization.
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
