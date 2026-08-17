import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/biotech.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

export default function BiotechHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Biotech Hero Section"
      className="siteintel-hero--clinical"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="Biotech"
      title={
        <>
          Maximize Runway.
          <br />
          Accelerate
          <br />
          Approval.
        </>
      }
      subtitle={
        <>
Institutional-grade intelligence on a biotech timeline. Get the precision data you need to out-maneuver larger competitors.
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
