import React from "react";
import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection";
import SiteIntelPreview from "../../../assets/images/clinical_ope.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

export default function ClinicalOperationsHeroSection({ onPrimaryCta }) {
  return (
    <MarketingHeroSection
      ariaLabel="Clinical Operation"
      className="siteintel-hero--clinical"
      background={{ src: heroBackground }}
      backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
      kicker="CLINICAL OPERATION"
      title={
        <>
          Eliminate the
          <br />
          &quot;Feasibility <br/> Gap.&quot; Secure
          <br />
          Your LPI.
        </>
      }
      subtitle={
        <>
          Replace optimistic enrollment estimates with high-fidelity simulations. Connect real-world patient density to verified site performance for a bulletproof roadmap to Last Patient In.
        </>
      }
      primaryCta={{
        className: "landing-button landing-button--primary",
        onClick: onPrimaryCta,
        label: "Enroll Patients Faster",
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
