import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/pharma.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

export default function PharmaHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Pharma"
      className="siteintel-hero--clinical"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="PHARMA"
      title={
        <>
          Global Scale.
          <br />    
          Standardized
          <br />
          Intelligence.
        </>
      }
      subtitle={
        <>
          Our oncology platform standardizes global data, including clinical trials, treatment pathways, patient cohorts, and site data. This allows faster analysis, clearer comparisons, and consistent insights for evaluating countries or global studies.
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
