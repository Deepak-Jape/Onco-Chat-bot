import React from "react";
import "./css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../assets/images/ai_agent.webp";
import heroBackground from "../../assets/bg-1437.jpg";
import heroBackground828 from "../../assets/bg-828.jpg";
import heroBackground1242 from "../../assets/bg-1242.jpg";
import eyeIcon from "../../assets/icons/eye.svg";

export default function AiAgentHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Ai Agent"
      className="siteintel-hero--withbar"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="AI AGENTS"
      title={
        <>
          Ground Your AI in
          <br />
          Verified Oncology
          <br />
          Evidence. Not
          <br />
          Hallucinations.
        </>
      }
      subtitle={
        <>
          Use Oncosuite&apos;s clinical agent for instant, source-traceable 
          answers, or stream daily-updated oncology data into your LLMs with our Model Context Protocol.
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
