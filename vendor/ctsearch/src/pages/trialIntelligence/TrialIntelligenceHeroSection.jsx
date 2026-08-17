import React from "react";
import "../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../assets/images/TrialIntelligence.webp";
import heroBackground from "../../assets/bg-1437.jpg";
import heroBackground828 from "../../assets/bg-828.jpg";
import heroBackground1242 from "../../assets/bg-1242.jpg";
import eyeIcon from "../../assets/icons/eye.svg";

export default function TrialIntelligenceHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Trial Intelligence"
      className="siteintel-hero--trial siteintel-hero--withbar"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="TRIAL INTELLIGENCE"
      title={
        <>
          Stop Scraping.
          <br />
          Start Deciding. 70+
          <br />
          Oncology Evidence
          <br />
          Dimensions.
        </>
      }
      subtitle={
        <>
          Stop manual PDF work. OncoSuite breaks down 59k+ trials into 70+ data types.
          Get instant benchmarks for safety, efficacy, and backbones. Make decisions
          in seconds.
        </>
      }
      primaryCta={{
        className: "landing-button landing-button--primary",
        onClick: onPrimaryCta,
        label: "Start Benchmarking Your Trial",
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
