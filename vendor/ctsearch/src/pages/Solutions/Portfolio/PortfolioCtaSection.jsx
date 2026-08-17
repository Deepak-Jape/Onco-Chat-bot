import React from "react";
import "../../siteIntelligence/css/ValidationLoopSection.css";

import ValidationLoopBlock from "../../../component/ValidationLoopBlock";

export default function PortfolioCtaSection({ onBookDemo }) {
  return (
    <ValidationLoopBlock
      ariaLabel="Portfolio management call to action"
      className="vloop--ctaOnly vloop--container7xl"
      title={null}
      subtitle={null}
      cards={[]}
      cta={{
        title: 'Don\'t Prioritize Your Pipeline on "Approximate" Data.',
        subtitle:
          "Get the precision intelligence required to optimize your oncology portfolio.",
        buttonLabel: "Book Your Demo",
        buttonClassName: "landing-button landing-button--primary",
        onClick: onBookDemo,
      }}
    />
  );
}

