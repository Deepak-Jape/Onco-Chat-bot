import React from "react";
import "./css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../assets/images/siteintelligence.webp";
import heroBackground from "../../assets/bg-1437.jpg";
import heroBackground828 from "../../assets/bg-828.jpg";
import heroBackground1242 from "../../assets/bg-1242.jpg";
import eyeIcon from "../../assets/icons/eye.svg";

export default function SiteIntelligenceHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Site Intelligence"
      className="siteintel-hero--withbar"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="SITE INTELLIGENCE"
      title={
        <>
          Kill the &apos;Zero-
          <br />
          Enrollment&apos; Site.
          <br />
          Predict Your LPI
          <br />
          with 92% Accuracy.
        </>
      }
      subtitle={
        <>
          Move beyond &apos;gut-feel&apos; site selection. OncoSuite uses predictive
          modeling to identify high-performers and forecast your exact timeline to
          LPI.
        </>
      }
      primaryCta={{
        className: "landing-button landing-button--primary",
        onClick: onPrimaryCta,
        label: "Enroll Patients Faster",
      }}
      secondaryCta={{
        className: "landing-button landing-button--secondary siteintel-hero__secondary",
        scrollTo: "next-h2",
        label: "See Site Scorecard",
        iconSrc: eyeIcon,
        iconWidth: 22,
        iconHeight: 22,
      }}
      media={{ src: SiteIntelPreview, alt: "" }}
    />
  );
}
