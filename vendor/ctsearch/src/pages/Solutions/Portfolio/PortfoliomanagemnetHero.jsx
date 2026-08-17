import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/portfolio.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";


export default function PortfolioManagementHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Portfolio Management"
      className="siteintel-hero--clinical siteintel-hero--portfolio"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="Asset, Portfolio Strategy & BD"
      title={
        <>
          High-Stakes
          <br />
          Strategy. Evidence
          <br />
          Based Decisions.
        </>
      }
      subtitle={
        <>
          Every protocol shift impacts valuation and resource allocation. OncoSuite turns
          fragmented oncology data into a defensible analytical framework—helping sponsors
          prioritize the right assets, mitigate M&amp;A risk, and design trials for
          market leadership.
        </>
      }
      primaryCta={{
        className: "landing-button landing-button--primary",
        onClick: onPrimaryCta,
        label: "Audit Your Portfolio Strategy",
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
