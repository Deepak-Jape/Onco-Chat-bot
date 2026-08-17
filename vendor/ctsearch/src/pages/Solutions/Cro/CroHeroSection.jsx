import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/cro.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

export default function CroHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Cro"
      className="siteintel-hero--clinical"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="CRO"
      title={
        <>
          Win More Bids.
          <br />
          Deliver with
          <br />
          Certainty.
        </>
      }
      subtitle={
        <>
          The industry's most granular oncology intelligence to elevate your proposals and prove you can run it.
        </>
      }
      primaryCta={{
        className: "landing-button landing-button--primary",
        onClick: onPrimaryCta,
        label: "Book Your Demo",
      }}
      secondaryCta={{
        className: "landing-button landing-button--secondary",
        scrollTo: "next-h2",
        label: "See What You Get",
        iconSrc: eyeIcon,
        iconWidth: 22,
        iconHeight: 22,
      }}
      media={{ src: SiteIntelPreview, alt: "" }}
    />
  );
}
