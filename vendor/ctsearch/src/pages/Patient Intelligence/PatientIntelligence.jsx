import React, { useCallback } from "react";

import useScrollRestoration from "../../utils/hooks/useScrollRestoration";

import "../siteIntelligence/css/SiteIntelligenceHeroSection.css";
import "../siteIntelligence/css/ProblemSolutionSection.css";
import "../siteIntelligence/css/OncologySiteScorecardSection.css";
import "../siteIntelligence/css/PredictOutcomeSection.css";
import "../siteIntelligence/css/ValidationLoopSection.css";

import organIcon from "../../assets/icons/organ.svg";
import biomarkerIcon from "../../assets/icons/biomarker.svg";
import moaTrendsIcon from "../../assets/icons/longitudnal.svg";
import lotIcon from "../../assets/icons/lot.svg";
import geographIcon from "../../assets/icons/geograph.svg";

import InsightsIcon from "@mui/icons-material/Insights";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

import MarketingHeroSection from "../../component/MarketingHeroSection/MarketingHeroSection";
import ProblemSolutionCards from "../../component/ProblemSolutionCards/ProblemSolutionCards";
import ScorecardGrid from "../../component/ScorecardGrid/ScorecardGrid";
import PredictOutcomeBlock from "../../component/PredictOutcomeBlock/PredictOutcomeBlock";
import ValidationLoopBlock from "../../component/ValidationLoopBlock";

import MainHeaderOncoSuite from "../siteIntelligence/MainHeaderOncoSuite.jsx";
import Footer from "../FirstScreen/Footer";

import patientIntelligenmapimg from "../../assets/images/patient.webp";
import SynthesisLoopImg from "../../assets/images/patient_bar.webp";
import heroBackground from "../../assets/bg-1437.jpg";
import heroBackground828 from "../../assets/bg-828.jpg";
import heroBackground1242 from "../../assets/bg-1242.jpg";
import eyeIcon from "../../assets/icons/eye.svg";

const FILTER_CARDS = [
  {
    title: "Organ & Histology",
    icon: organIcon,
    body:
      "Go beyond broad indications. Isolate specific primary sites and histological subtypes (e.g., Squamous vs. Adenocarcinoma) to ensure your density model reflects the exact pathology of your protocol.",
  },
  {
    title: "Biomarker & Mutation",
    icon: biomarkerIcon,
    body:
      `Filter by genomic drivers, protein expressions, and co-mutations. Map "KRAS-G12C" or "HER2-Low" patients with surgical precision to identify where your target patients are clustering.`,
  },
  {
    title: "Stage & Severity",
    icon: moaTrendsIcon,
    body:
      "Differentiate between early-stage resectable patients and Stage IV metastatic patients. Target the specific clinical window where your therapy—or your competitor’s trial—is most relevant.",
  },
  {
    title: "Line of Therapy (LoT)",
    icon: lotIcon,
    body:
      `Track the patient journey from First-Line (1L) to heavily pre-treated patients. Identify "treatment-naive" hotspots or clusters of patients who have progressed on specific standard-of-care backbones.`,
  },
  {
    title: "Geographic & Country",
    icon: geographIcon,
    body:
      "Scale from global country-level trends down to ZIP-code density. Compare international patient availability to optimize your global footprint and regulatory submission strategy.",
  },
];

const USE_CASE_CARDS = [
  {
    title: "Precision Market Sizing",
    icon: null,
    body:
      "Build boardroom-ready revenue models for commercial launches and licensing deals based on actual patient counts, not estimates.",
  },
  {
    title: "Strategic Recruitment Geography",
    icon: null,
    body:
      "Map your specific target cohort down to the ZIP code to identify high-density areas for recruitment and focus your MSL efforts.",
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

export default function PatientIntelligence() {
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
          ariaLabel="Patient Intelligence"
          className="siteintel-hero--withbar"
          background={{ src: heroBackground }}
          backgroundSrcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
          kicker="PATIENT INTELLIGENCE"
          title={
            <>
              Map Your Actual Addressable
              <br />
              Patient, Not
              <br />
              Guesses.
            </>
          }
          subtitle={
            <>
              Move beyond national averages. OncoSuite models patient density by ZIP
              code, filtered by biomarkers and therapy lines defining your market.
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
              Aggregation of Clinical Registries, Pharmacy Triggers, and Public
              Health Data—Cross-Referenced with Enrollment Benchmarks.
            </span>
          </div>
        </section>

        <ProblemSolutionCards
          className="ps-section--container7xl"
          problem={{
            kicker: "PROBLEM",
            title: "Traditional Epidemiology is Too Broad for Precision Medicine.",
            body: (
              <>
                When your drug targets a specific mutation (e.g., ROS1 or PIK3CA),
                national averages are meaningless. You need to know where those
                patients are clustered today to win the recruitment race and dominate
                the commercial launch.
              </>
            ),
          }}
          solution={{
            kicker: "SOLUTION",
            title: "One Unified View of Oncology Patient Intelligence",
            body: (
              <>
                OncoSuite&apos;s Patient Intelligence module expertly combines multiple complex data streams
                into one comprehensive and easy-to-understand geographic dashboard,
                empowering healthcare professionals with actionable insights to improve patient outcomes.
              </>
            ),
          }}
        />

        <ScorecardGrid
          ariaLabel="The Atomic Patient Filter"
          className="scorecard--container7xl"
          title="The Atomic Patient Filter"
          subtitle={
            <>
              Move from &quot;Global Estimates&quot; to ZIP-level enrollment reality
              in three clicks.
            </>
          }
          cards={FILTER_CARDS}
        />

        <ScorecardGrid
          ariaLabel="Primary Use Cases"
          className="scorecard--container7xl scorecard--bgwhite"
          title="Primary Use Cases"
          subtitle={null}
          cards={USE_CASE_CARDS}
        />

        <PredictOutcomeBlock
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
        />

        <ValidationLoopBlock
          ariaLabel="Patient insights meet site execution"
          className="vloop--container7xl"
          title="Patient Insights Meet Site Execution."
          subtitle={
            <>
              While Patient Intelligence tells you where the patients are, our Site
              Intelligence module tells you who can treat them.
            </>
          }
          cards={[
            {
              title: "The Workflow",
              body: (
                <>
                  Identify a high-density ZIP code in the Patient module, then
                  instantly toggle to Site Intelligence to see the PIs, facility
                  capacity, and historical performance of the hospitals in that exact
                  radius.
                </>
              ),
              // value: "No switching between disconnected tools or static reports.",
            },
            {
              title: "The Result",
              body: (
                <>
                  A closed-loop strategy that connects the right patient to the right
                  site at the right time.
                </>
              ),
              // value: "Faster enrollment with defensible, data-backed execution.",
            },
          ]}
          cta={{
            title: "Stop Recruiting in the Dark",
            subtitle:
              "Get the ZIP-level precision you need to outpace the competition.",
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
