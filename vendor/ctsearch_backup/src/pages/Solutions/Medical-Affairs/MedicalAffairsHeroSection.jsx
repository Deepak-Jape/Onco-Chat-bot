import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/medical.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

export default function MedicalAffairsHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Medical Affairs"
      className="siteintel-hero--clinical"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="MEDICAL AFFAIRS"
      title={
        <>
          Anticipate the
          <br />
          Shift: Precision
          <br />
          Intelligence for
          <br />
          Oncology
        </>
      }
      subtitle={
        <>
          Close the evidence gap between congress abstracts and peer-reviewed reality. Real-time trial tracking and MoA landscape mapping for high-stakes oncology assets.
        </>
      }
      primaryCta={{
        className: "landing-button landing-button--primary",
        onClick: onPrimaryCta,
        label: "Audit Your Protocol Design",
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
