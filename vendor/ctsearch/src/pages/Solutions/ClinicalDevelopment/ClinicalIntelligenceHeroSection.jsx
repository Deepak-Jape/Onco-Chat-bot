import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/clinicaltrial.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

export default function SiteIntelligenceHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Clinical Development"
      className="siteintel-hero--clinical"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="CLINICAL DEVELOPMENT"
      title={
        <>
          Data-Backed
          <br />
          Protocol Design.
          <br />
          Zero-Waste Trial
          <br />
          Architecture.
        </>
      }
      subtitle={
        <>
          Stop designing against stale registries. OncoSuite stress-tests your
          Inclusion/Exclusion criteria against real-world patient density and future
          Standard of Care, ensuring you don&apos;t build a trial that&apos;s
          &quot;Dead on Arrival&quot;.
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
