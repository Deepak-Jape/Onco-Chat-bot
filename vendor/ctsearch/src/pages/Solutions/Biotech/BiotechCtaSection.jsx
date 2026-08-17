import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

import ValidationLoopBlock from "../../../component/ValidationLoopBlock";

export default function BiotechCtaSection({ onBookDemo }) {
  return (
    <ValidationLoopBlock
      ariaLabel="Biotech call to action"
      className="vloop--ctaOnly vloop--container7xl"
      title={null}
      subtitle={null}
      cards={[]}
      cta={{
        title: "Don't Compete with Big Pharma. Out-Engineer Them.",
        subtitle:
          "Get the precision intelligence required to turn your asset into a market leader.",
        buttonLabel: "Book Your Demo",
        buttonClassName: "landing-button landing-button--primary",
        onClick: onBookDemo,
      }}
    />
  );
}

