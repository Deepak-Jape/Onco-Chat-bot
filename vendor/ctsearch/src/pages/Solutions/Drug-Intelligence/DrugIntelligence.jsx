import React, { useCallback } from "react";

import useScrollRestoration from "../../../utils/hooks/useScrollRestoration";

import "../../siteIntelligence/css/SiteIntelligenceHeroSection.css";
import "../../siteIntelligence/css/ProblemSolutionSection.css";
import "../../siteIntelligence/css/OncologySiteScorecardSection.css";
import "../../siteIntelligence/css/PredictOutcomeSection.css";
import "../../siteIntelligence/css/ValidationLoopSection.css";

import dollarIcon from "../../../assets/icons/dollar.svg";
import checkMarkIcon from "../../../assets/icons/check-mark.svg";
import pipelineIcon from "../../../assets/icons/pipeline.svg";
import geographIcon from "../../../assets/icons/geograph.svg";

import InsightsIcon from "@mui/icons-material/Insights";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

import MarketingHeroSection from "../../../component/MarketingHeroSection/MarketingHeroSection.jsx";
import ProblemSolutionCards from "../../../component/ProblemSolutionCards/ProblemSolutionCards";
import ScorecardGrid from "../../../component/ScorecardGrid/ScorecardGrid";
import PredictOutcomeBlock from "../../../component/PredictOutcomeBlock/PredictOutcomeBlock";
import ValidationLoopBlock from "../../../component/ValidationLoopBlock";

import MainHeaderOncoSuite from "../../siteIntelligence/MainHeaderOncoSuite.jsx";
import Footer from "../../FirstScreen/Footer";

import patientIntelligenmapimg from "../../../assets/images/patient.webp";
import SynthesisLoopImg from "../../../assets/images/patient_bar.webp";
import heroBackground from "../../../assets/bg-1437.jpg";
import heroBackground828 from "../../../assets/bg-828.jpg";
import heroBackground1242 from "../../../assets/bg-1242.jpg";
import eyeIcon from "../../../assets/icons/eye.svg";

const FILTER_CARDS = [
  {
    title: "Pipeline & Development",
    icon: pipelineIcon,
    body:
      "Track the global clinical landscape of 1,000+ oncology molecules. Monitor live phase transitions, trial terminations, and active developer pipelines to map your exact competitive horizon.",
  },
  {
    title: "Global Patent Lifecycles",
    icon: geographIcon,
    body:
      `Map drug exclusivity with multi-country patent timelines. Instantly calculate remaining market runways and spot impending generic or biosimilar market entry.`,
  },
  {
    title: "Cross-Border Pricing",
    icon: dollarIcon,
    body:
      "Access international monthly pricing data across multiple key countries. Eliminate blindspots to guide regional commercial launch strategy and reimbursement positioning.",
  },
  {
    title: "Approved FDA/EMA Indications",
    icon: checkMarkIcon,
    body: "Trace the entire historical regulatory timeline of approved therapies, including exact approved indications, line-of-therapy restrictions, and companion diagnostic requirements."
  }
];

const USE_CASE_CARDS = [
  {
    title: "Precision Due Diligence & Valuation",
    icon: null,
    body:
      "Stress-test inbound or outbound oncology assets during out-licensing negotiations. Use structured multi-country patent timelines and regulatory records to defend valuations with audit-ready evidence.",
  },
  {
    title: "Strategic Launch & Pricing Positioning",
    icon: null,
    body:
      "Set realistic commercial pricing corridors and prioritize global launch markets by benchmarking against live competitor prices and historical regulatory precedent.",
  },
];

const SYNTHESIS_FEATURES = [
  {
    title: "Multi-Source Aggregation",
    body:
      "We ingest de-identified data from clinical registries, pharmacy triggers, and public health datasets to build a complete picture.",
  },
  {
    title: "AI-Powered Synthesis",
    body:
      "Our models harmonize disparate formats, resolving contradictions and identifying emerging trends in biomarker prevalence.",
  },
  {
    title: "Human-in-the-Loop Validation",
    body:
      "Every density model is cross-referenced against historical enrollment benchmarks and academic literature to ensure clinical reality.",
  },
];

export default function DrugIntelligence() {
  const { navigateWithScrollSaved, hiddenWhileRestoring } =
    useScrollRestoration();

  const handleBookDemo = useCallback(() => {
    navigateWithScrollSaved("/book-demo");
  }, [navigateWithScrollSaved]);

  return (
    <>
      <MainHeaderOncoSuite showSpacer={false} />

      <main className="landing-no-header-spacer" style={hiddenWhileRestoring}>
        <MarketingHeroSection
          ariaLabel="DRUG Intelligence"
          className="siteintel-hero--withbar"
          background={{ src: heroBackground }}
          backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
          kicker="DRUG INTELLIGENCE"
          title={
            <>
              Map the Global
              <br />
              Asset Landscape,
              <br/>
              Not Fragmented
              <br/>
              Databases.
            </>
          }
          subtitle={
            <>
              Move beyond manual pricing tracking and disjointed patent searches. 
              OncoSuite structures the complete clinical, regulatory, and commercial lifecycles of 1,000+ oncology drugs into a single, unified view.
            </>
          }
          primaryCta={{
            className: "landing-button landing-button--primary",
            onClick: handleBookDemo,
            label: "Book Your Demo",
          }}
          secondaryCta={{
            className:
              "landing-button landing-button--secondary siteintel-hero__secondary",
            scrollTo: "next-h2",
            label: "See What You Get",
            iconSrc: eyeIcon,
            iconWidth: 22,
            iconHeight: 22,
          }}
          media={{ src: patientIntelligenmapimg, alt: "Patient density map preview" }}
        />

        <section className="landing-built-for-bar" aria-label="Powered by">
          <div className="landing-built-for-left">
            <span className="landing-built-for-label">Powered by</span>
          </div>
          <div className="landing-built-for-right">
            <span className="landing-built-for-content">
              Aggregation of Global Patent Offices, Multi-Country Reimbursement Indexes, 
              and Live FDA/EMA Regulatory Archives.
            </span>
          </div>
        </section>

        <ProblemSolutionCards
          className="ps-section--container7xl"
          problem={{
            kicker: "PROBLEM",
            title: "Siloed Commercial & Regulatory Data Hinders Asset Decisions.",
            body: (
              <>
                When evaluating or preparing an oncology asset, cross-functional teams waste weeks manually synthesizing data from fragmented regulatory registries,
                cross-border patent filings, and local pricing sheets. This lag leaves teams exposed to missed competitive threats, flawed valuations, and unexpected patent timelines.
              </>
            ),
          }}
          solution={{
            kicker: "SOLUTION",
            title: "One Unified View of Oncology Drug Intelligence.",
            body: (
              <>
                OncoSuite’s Drug Intelligence module integrates clinical, regulatory, and commercial data vectors into one traceable platform. Monitor active competitor pipeline stages,
                multi-country patent runways, global pricing, and approved FDA/EMA indications—all updated daily.
              </>
            ),
          }}
        />

        <ScorecardGrid
          ariaLabel="The Complete Asset Matrix"
          className="scorecard--container4x1"
          title="The Complete Asset Matrix"
          subtitle={
            <>
              Move from siloed, raw drug registries to structured asset tracking in three clicks.
            </>
          }
          cards={FILTER_CARDS}
        />

        {/* <ScorecardGrid
          ariaLabel="Primary Use Cases"
          className="scorecard--container7xl scorecard--bgwhite"
          title="Primary Use Cases"
          subtitle={null}
          cards={USE_CASE_CARDS}
        /> */}

        {/* <PredictOutcomeBlock
          ariaLabel="OncoSuite accuracy loop"
          className="predict--container7xl predict--governance"
          title={`Our Synthesis Methodology:
            The OncoSuite Accuracy Loop.`}
          subtitle={
            <>
              We don&apos;t rely on a single, fragmented data source. Our Patient
              Intelligence module is powered by a three-step harmonization process.
            </>
          }
          preview={{ src: SynthesisLoopImg, alt: "OncoSuite Accuracy Loop" }}
          features={SYNTHESIS_FEATURES}
          // outcome={{
          //   label: "Outcome:",
          //   text: (
          //     <>
          //       A density model you can trust—grounded in real-world data and
          //       validated against enrollment benchmarks.
          //     </>
          //   ),
          // }}
        /> */}

        <ValidationLoopBlock
          ariaLabel="Primary Use Cases"
          className="vloop--container7xl"
          title="Primary Use Cases"
          subtitle={
            <>
              
            </>
          }
          cards={USE_CASE_CARDS}
          cta={{
            title: "Stop Evaluating in the Dark",
            subtitle:
              "Get the cross-border precision and daily-synced asset data you need to outpace the competitive pipeline.",
            buttonLabel: "Book Your Demo",
            buttonClassName: "landing-button landing-button--primary",
            onClick: handleBookDemo,
          }}
        />
      </main>

      <div style={hiddenWhileRestoring}>
        <Footer />
      </div>
    </>
  );
}
