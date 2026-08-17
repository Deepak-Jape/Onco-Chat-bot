import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import ScienceOutlinedIcon from "./assets/logo/ScienceOutlinedIcon.svg";
import BiotechOutlinedIcon from "./assets/logo/BiotechOutlinedIcon.svg";
import GroupsOutlinedIcon from "./assets/logo/GroupsOutlinedIcon.svg";
import LightbulbOutlinedIcon from "./assets/logo/LightbulbOutlinedIcon.svg";
import TrendingUpOutlinedIcon from "./assets/logo/TrendingUpOutlinedIcon.svg";
import { LuMicroscope } from "react-icons/lu";
import { RiBuildingLine } from "react-icons/ri";
import { GoPeople } from "react-icons/go";
import { IoFlaskOutline } from "react-icons/io5";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import logo from "./assets/Logo2.svg";
import martinImg from "./assets/images/martin.svg";
import missionImg from "./assets/images/aboutus_new.svg";
import { FaArrowRightLong } from "react-icons/fa6";
import BluePointer from "./assets/blue_pointer.svg";

const testimonialText = `When I was diagnosed with cancer, I spent weeks trying to understand which clinical trials existed, how they compared, and what the data actually showed. The information was out there - scattered across registries, publications, and conference abstracts but no single tool brought it together in a way that was useful.

That experience changed my career. I went from being a patient struggling to find answers, to building the platform I wished had existed. OncoSuite was born from the belief that no researcher, physician, or patient should have to piece together fragmented data to make critical decisions.`;

const features = [
  {
    stat: "3B+",
    title: "Data Points Standardized",
    description:
      "Structured daily from trials, publications, and global registries into a unified intelligence layer.",
  },
  {
    stat: "60K+",
    title: "Oncology Studies Indexed",
    description:
      "Cross-trial benchmarking across endpoints, biomarkers, and outcomes searchable in seconds.",
  },
  {
    stat: "2 min",
    title: "From Query to Insight",
    description:
      "Summaries provide quick, citation-backed answers, helping you save hours of manual review.",
  },
];

const supportCards = [
  {
    icon: (
      <Box
        component="img"
        src={ScienceOutlinedIcon}
        alt="Clinical Development"
        sx={{ width: 46, height: 46, display: "block" }}
      />
    ),
    title: "Clinical Development",
    description:
      "Design stronger protocols with instant access to comparable trial designs, endpoints, and patient populations across 60K+ oncology studies.",
    bullets: [
      "Protocol benchmarking",
      "Endpoint selection",
      "Inclusion/exclusion criteria",
      "Dose optimization",
    ],
    twoColumnBullets: true,
  },
  {
    icon: (
      <Box
        component="img"
        src={BiotechOutlinedIcon}
        alt="Clinical Operations"
        sx={{ width: 46, height: 46, display: "block" }}
      />
    ),
    title: "Clinical Operations",
    description:
      "Execute trials faster with feasibility insights, site selection intelligence, and real-time enrollment trends from similar studies.",
    bullets: [
      "Site feasibility analysis",
      "Enrollment forecasting",
      "Timeline benchmarking",
      "Risk mitigation",
    ],
    twoColumnBullets: true,
  },
  {
    icon: (
      <Box
        component="img"
        src={GroupsOutlinedIcon}
        alt="Medical Affairs"
        sx={{ width: 46, height: 46, display: "block" }}
      />
    ),
    title: "Medical Affairs",
    description:
      "Support HCPs and stakeholders with evidence-based insights, citation-backed data, and current competitive landscapes.",
    bullets: [
      "Evidence generation",
      "KOL engagement materials",
      "Scientific publications",
      "MSL enablement",
    ],
  },
  {
    icon: (
      <Box
        component="img"
        src={LightbulbOutlinedIcon}
        alt="Portfolio Strategy"
        sx={{ width: 46, height: 46, display: "block" }}
      />
    ),
    title: "Portfolio Strategy",
    description:
      "Prioritize assets and indications with AI-powered white space analysis, market sizing, and cross-portfolio opportunity mapping.",
    bullets: [
      "Pipeline prioritization",
      "Indication selection",
      "Asset valuation",
      "Go/no-go decisions",
    ],
  },
  {
    icon: (
      <Box
        component="img"
        src={TrendingUpOutlinedIcon}
        alt="Competitive & BD Teams"
        sx={{ width: 46, height: 46, display: "block" }}
      />
    ),
    title: "Competitive & BD Teams",
    description:
      "Track competitive movements, identify partnership targets, and evaluate acquisition opportunities with real-time intelligence.",
    bullets: [
      "Competitive monitoring",
      "Licensing opportunities",
      "M&A due diligence",
      "Market landscape",
    ],
  },
];

const missionSteps = [
  {
    number: "01",
    title: "Ingest & Structure",
    description:
      "We continuously pull data from Clinical Trials.gov, PubMed, ASCO, ESMO, conference abstracts, and regulatory databases then standardize it into a consistent, queryable format.",
  },
  {
    number: "02",
    title: "Enrich & Connect",
    description:
      "Biomarkers, endpoints, drug mechanisms, and patient populations are linked across studies enabling cross-trial comparisons that would take weeks to do manually.",
  },
  {
    number: "03",
    title: "Analyze & Surface",
    description:
      "Summaries, competitive landscapes, and white-space analyses are created on demand, based on solid evidence and supported by source citations.",
  },
];

export default function AboutUsBody({
  handleBookDemo,
  useCenteredStoryLayout,
  isZoom110,
  heroBackground,
  heroBackground828,
  heroBackground1242,
}) {
  return (
    <>        {/* ================= PERSONAL STORY SECTION ================= */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "rgba(249, 249, 251, 1)",
            // Reduce whitespace above the story section.
            pt: { xs: 2.5, sm: 3.5, md: 2.5 },
            pb: useCenteredStoryLayout ? 0 : { xs: 0, sm: 0, md: 0, lg: 6 },
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflowX: "hidden",
            overflowY: "hidden",
            // Avoid forcing extra whitespace on mobile.
            minHeight: { xs: "auto", md: "563px" },
          }}
        >
          <Box
            sx={{
              maxWidth: useCenteredStoryLayout
                ? "none"
                : { xs: "100%", sm: "100%", md: "1280px" },
              // Left-align the entire section on laptop/desktop widths.
              mx: useCenteredStoryLayout ? "auto" : { xs: "auto", md: 0, lg: 0 },
              px: { xs: 3, sm: 4, md: "70px", lg: "48px" },
              position: { xs: "relative", lg: "static" },
              transform: isZoom110 ? "translateX(-24px)" : "none",
              ...(useCenteredStoryLayout
                ? {
                    transform: isZoom110 ? "translateX(-48px)" : "translateX(-24px)",
                    // Nest Hub Max / similar large-tablet widths.
                    "@media (min-width: 1200px) and (max-width: 1350px) and (max-height: 850px)": {
                      transform: "translateX(-72px)",
                    },
                    // 15.6" laptop common layouts (e.g. 1366x768, 1440x900, 1536x864):
                    "@media (min-width: 1360px) and (max-width: 1600px) and (min-height: 700px) and (max-height: 950px)": {
                      transform: "translateX(-60px)",
                    },
                  }
                : {}),
              "@media (min-width: 1024px) and (max-width: 1199.95px) and (hover: none) and (pointer: coarse)":
                {
                  position: "relative",
                  flexDirection: "column",
                  flexWrap: "nowrap",
                  alignItems: "stretch",
                },
              "@media (min-width: 900px) and (max-width: 930px) and (min-height: 1300px) and (max-height: 1400px) and (orientation: portrait)":
                {
                  position: "relative",
                  flexDirection: "column",
                  flexWrap: "nowrap",
                  alignItems: "stretch",
                },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              flexWrap: { md: "wrap", lg: "nowrap" },
              minHeight: { md: "563px" },
              alignItems: useCenteredStoryLayout
                ? "flex-end"
                : { md: "flex-end", lg: "center" },
              justifyContent: useCenteredStoryLayout ? "center" : { md: "flex-start" },
              // Reduce story-card â†’ image spacing on mobile.
              gap: { xs: 0, md: 4, lg: 0 },
              flex: 1,
              // iPad Pro / Surface Pro portrait tablets: stack content so the image centers under the card.
              "@media (min-width: 900px) and (max-width: 1100px) and (orientation: portrait)":
                {
                  flexDirection: "column",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                },
            }}
          >
            <Box
              sx={{
                flex: { md: "1 1 0", lg: "0 1 auto" },
                width: {
                  xs: "100%",
                  md: "auto",
                  lg: "860px",
                },
                maxWidth: { md: "760px", lg: "860px" },
                minHeight: { md: "auto", lg: "320px", xl: "340px" },
                flexShrink: 0,
                backgroundColor: "#fff",
                borderRadius: "8px",
                p: { xs: "20px", md: "20px", lg: "18px" },
                boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                position: "relative",
                zIndex: 1,
                ml: { lg: 0, xl: "20px" },
                ...(useCenteredStoryLayout
                  ? {
                      width: "clamp(770px, 45.5vw, 980px)",
                      maxWidth: "none",
                      minHeight: { lg: "320px", xl: "340px" },
                      p: { xs: "20px", md: "20px", lg: "20px" },
                      pb: { lg: "10px", xl: "14px" },
                      gap: "12px",
                    }
                  : {}),
                // Pull the story card closer to the hero image on desktop/laptop
                // so they "touch" like the Figma layout.
                // Use `right` instead of a negative margin so we can overlap behind
                // the image without changing the overall flex layout width.
                mr: 0,
                right: { lg: "-100px", xl: "-120px" },
                // Reduce extra whitespace above the story card on desktop.
                mt: useCenteredStoryLayout ? 0 : { xs: 0, md: 0, lg: "12px", xl: "16px" },
                "@media (min-width: 1024px) and (max-width: 1199.95px)": {
                  width: "820px",
                  maxWidth: "820px",
                },
                // Nest Hub Max / similar large-tablet widths: reduce overlap into the image.
                "@media (min-width: 1200px) and (max-width: 1350px) and (max-height: 850px)": {
                  right: "50px",
                },
                // 15.6" laptop common layouts: give the card a bit more reading width.
                "@media (min-width: 1360px) and (max-width: 1600px) and (min-height: 700px) and (max-height: 950px)": {
                  width: "920px",
                  maxWidth: "920px",
                  minHeight: "340px",
                },
                ...(useCenteredStoryLayout
                  ? {
                      right: 0,
                      ml: 0,
                      transform: "translate(180px, -70px)",
                    }
                  : {}),
                "@media (min-width: 1024px) and (max-width: 1199.95px) and (hover: none) and (pointer: coarse)":
                  {
                    flex: "0 0 auto",
                    width: "100%",
                    maxWidth: "760px",
                    alignSelf: "center",
                    pr: "24px",
                    ml: 0,
                    mr: 0,
                    right: 0,
                    mt: 0,
                  },
                "@media (min-width: 900px) and (max-width: 930px) and (min-height: 1300px) and (max-height: 1400px) and (orientation: portrait)":
                  {
                    maxWidth: "760px",
                    alignSelf: "center",
                    pr: "24px",
                    ml: 0,
                    mr: 0,
                    right: 0,
                    mt: 0,
                  },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 18, sm: 18, md: 22 },
                  color: "rgba(0, 0, 0, 0.80)",
                  fontFamily: "Rubik",
                  lineHeight: { xs: 1.6, md: 1.55 },
                  fontStyle: "italic",
                  textAlign: "left",
                  whiteSpace: "pre-line",
                  pb: "10px",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {testimonialText}
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "14px", md: "18px" },
                  lineHeight: { xs: "24px", md: "32px" },
                  fontWeight: 400,
                  color: "rgba(0, 0, 0, 0.6)",
                  m: 0,
                  fontFamily: "Rubik",
                  textAlign: "left",
                  width: "100%",
                  py: { xs: 0.5, md: 1 },
                  letterSpacing: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                — Martin Lunendonk, CEO & Founder, OncoSuite.
              </Typography>
            </Box>

            <Box
              sx={{
                flex: { xs: "1 1 auto", md: "0 0 auto" },
                display: "flex",
                alignItems: "flex-end",
                justifyContent: { xs: "center", sm: "center", md: "flex-end" },
                pointerEvents: "none",
                zIndex: 2,
                // On mobile, keep the image close to the story card (no auto-push).
                mt: { xs: 0, md: 0 },
                minHeight: { xs: "auto", sm: 360 },
                width: { xs: "100%", md: "100%", lg: "auto" },
                alignSelf: { xs: "center", sm: "center", md: "flex-end" },
                mr: { xs: 0, sm: 0, md: "-80px", lg: 0 },
                position: { xs: "relative", md: "relative", lg: "absolute" },
                right: { lg: "-40px", xl: "-56px" },
                bottom: { lg: 0 },
                left: { lg: "auto" },
                top: { lg: "auto" },
                mx: 0,
                ...(useCenteredStoryLayout
                  ? {
                      position: "relative",
                      right: "auto",
                      bottom: "auto",
                      mr: 0,
                      height: "100%",
                      alignSelf: "stretch",
                      mt: "auto",
                    }
                  : {}),
                // iPad Mini / Air / Pro (portrait + landscape): keep centered (no right bias).
                "@media (hover: none) and (pointer: coarse) and (min-width: 768px) and (max-width: 1366px)": {
                  justifyContent: "center",
                  alignSelf: "center",
                  mr: 0,
                },
                // Fallback for emulators / hybrid devices that don't report coarse pointers (iPad Pro, Surface Pro).
                "@media (min-width: 900px) and (max-width: 1366px)": {
                  justifyContent: "center",
                  alignSelf: "center",
                  mr: 0,
                  right: "auto",
                },
                // Nest Hub (1024x600): center the image so it doesn't appear left-shifted.
                "@media (min-width: 1000px) and (max-width: 1100px) and (max-height: 700px) and (orientation: landscape)":
                  {
                    justifyContent: "center",
                    alignSelf: "center",
                    mr: 0,
                    right: "auto",
                  },
                // Surface Pro 7 (portrait in Chrome emulation often reports fine pointer):
                // center the image instead of right-aligning at `md`.
                "@media (min-width: 900px) and (max-width: 1100px) and (orientation: portrait)":
                  {
                    justifyContent: "center",
                    alignSelf: "center",
                    mr: 0,
                    right: "auto",
                  },
                "@media (min-width: 900px) and (max-width: 950px) and (min-height: 1200px) and (orientation: portrait)":
                  {
                    justifyContent: "center",
                    alignSelf: "center",
                    mr: 0,
                  },
                // iPad Pro (Chrome emulation may report fine pointer): keep centered.
                "@media (min-width: 1000px) and (max-width: 1100px) and (min-height: 1300px) and (orientation: portrait)":
                  {
                    justifyContent: "center",
                    alignSelf: "center",
                    mr: 0,
                  },
                "@media (min-width: 1300px) and (max-width: 1400px) and (min-height: 900px) and (max-height: 1100px) and (orientation: landscape)":
                  {
                    justifyContent: "center",
                    alignSelf: "center",
                    mr: 0,
                  },
                "@media (min-width: 1024px) and (max-width: 1199.95px) and (hover: none) and (pointer: coarse)":
                  {
                    position: "relative",
                    right: "auto",
                    bottom: "auto",
                    top: "auto",
                    left: "auto",
                    width: "100%",
                    mr: "-80px",
                  },
                "@media (min-width: 900px) and (max-width: 930px) and (min-height: 1300px) and (max-height: 1400px) and (orientation: portrait)":
                  {
                    position: "relative",
                    right: "auto",
                    bottom: "auto",
                    top: "auto",
                    left: "auto",
                    width: "100%",
                    mr: "-80px",
                  },
                // Final override: iPad Pro / Surface Pro / Nest Hub ranges -> always center.
                "@media (min-width: 1000px) and (max-width: 1366px)": {
                  justifyContent: "center",
                  alignSelf: "center",
                  mr: 0,
                  right: "auto",
                },
                // Surface Pro 7 portrait (often ~912x1368): force centering.
                "@media (min-width: 900px) and (max-width: 999px) and (min-height: 1200px)":
                  {
                    justifyContent: "center",
                    alignSelf: "center",
                    mr: 0,
                    right: "auto",
                  },
              }}
            >
              <Box
                component="img"
                src={martinImg}
                alt="Martin Lunendonk"
                sx={{
                  width: {
                    xs: "auto",
                    sm: "auto",
                    md: "clamp(460px, 42vw, 690px)",
                  },
                  height: {
                    xs: "100%",
                    sm: "100%",
                    md: "clamp(420px, 36vw, 620px)",
                  },
                  maxWidth: { xs: "100%", sm: "100%", md: "none" },
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  ml: { xs: 0, sm: 0, lg: 0 },
                  flexShrink: 0,
                  // Prevent occasional 1px hairline at the top edge on some devices/zooms.
                  clipPath: "inset(6px 0 0 0)",
                  transformOrigin: "top center",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                  ...(useCenteredStoryLayout
                    ? {
                      transform: "translate(28px, 32px) scaleY(1.02)",
                    }
                    : {}),
                  "@media (max-width: 600px)": {
                    transform: "translate(0px, 0px) scaleY(1.02)",
                  },
                  // iPad Mini / Air / Pro (portrait + landscape): nudge right slightly.
                  "@media (hover: none) and (pointer: coarse) and (min-width: 768px) and (max-width: 1366px)": {
                    transform: "translate(0px, 0px) scaleY(1.02)",
                  },
                  // Fallback for emulators / hybrid devices that don't report coarse pointers.
                  "@media (min-width: 900px) and (max-width: 1366px)": {
                    transform: "translate(0px, 0px) scaleY(1.02)",
                  },
                  // Nest Hub (1024x600): keep centered positioning.
                  "@media (min-width: 1000px) and (max-width: 1100px) and (max-height: 700px) and (orientation: landscape)":
                    {
                      transform: "translate(0px, 0px) scaleY(1.02)",
                    },
                  "@media (min-width: 900px) and (max-width: 950px) and (min-height: 1200px) and (orientation: portrait)":
                    {
                      transform: "translate(0px, 0px) scaleY(1.02)",
                    },
                  "@media (min-width: 900px) and (max-width: 1100px) and (orientation: portrait)":
                    {
                      transform: "translate(0px, 0px) scaleY(1.02)",
                    },
                  "@media (min-width: 1000px) and (max-width: 1100px) and (min-height: 1300px) and (orientation: portrait)":
                    {
                      transform: "translate(0px, 0px) scaleY(1.02)",
                    },
                  "@media (min-width: 1300px) and (max-width: 1400px) and (min-height: 900px) and (max-height: 1100px) and (orientation: landscape)":
                    {
                      transform: "translate(0px, 0px) scaleY(1.02)",
                    },
                  "@media (min-width: 1024px) and (max-width: 1199.95px) and (hover: none) and (pointer: coarse)":
                    {
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                    },
                  // Final override: iPad Pro / Surface Pro / Nest Hub ranges -> keep centered transform.
                  "@media (min-width: 1000px) and (max-width: 1366px)": {
                    transform: "translate(0px, 0px) scaleY(1.02)",
                  },
                  // Surface Pro 7 portrait: keep centered transform.
                  "@media (min-width: 900px) and (max-width: 999px) and (min-height: 1200px)":
                    {
                      transform: "translate(0px, 0px) scaleY(1.02)",
                    },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* ================= SPEED SECTION ================= */}
        <Box
          sx={{
            maxWidth: {
              xs: "100%",
              sm: "100%",
              md: "1200px",
              lg: "1400px",
              xl: "1600px",
            },
            mx: "auto",
            px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
            py: { xs: 7, sm: 8, md: 7, lg: 8, xl: 10 },
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: "26px",
                sm: "32px",
                md: "42px",
              },
              lineHeight: "120%",
              fontFamily: "Rubik",
              fontWeight: 600,
              color: "rgba(0, 0, 0, 0.8)",
              mb: { xs: 1, lg: 1.5, xl: 2 },
            }}
          >
            Oncology Is Moving Faster Than{" "}
            <Box component="br" sx={{ display: { xs: "none", md: "block" } }} />
            the Tools Built to Track It
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "16px", sm: "16px", md: "18px" },
              color: "rgba(0, 0, 0, 0.6)",
              maxWidth: "900px",
              mx: "auto",
              lineHeight: { xs: "22px", md: "32px" },
              mb: { xs: 2.5, md: 5, lg: 6 },
              fontWeight: 400,
              fontFamily: "Rubik",
            }}
          >
            The clinical trial landscape is evolving rapidly, and legacy tools
            can't keep up.
            <br />
            OncoSuite is built for this speed.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: { xs: 2.5, md: 3 },
              maxWidth: "1200px",
              mx: "auto",
              justifyContent: "center",
              justifyItems: "center",
              px: { md: 0.5 },
            }}
          >
            {features.map((item) => (
              <Box
                key={item.title}
                sx={{
                  textAlign: "center",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                  p: "24px",
                  boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.18)",
                  minHeight: "216px",
                  width: "100%",
                  maxWidth: { xs: "364px", md: "none" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Rubik",
                    fontWeight: 600,
                    fontSize: "32px",
                    lineHeight: "120%",
                    color: "rgba(38, 102, 190, 1)",
                    letterSpacing: 0,
                  }}
                >
                  {item.stat}
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "20px",
                    fontFamily: "Rubik",
                    lineHeight: "130%",
                    color: "rgba(0, 0, 0, 0.8)",
                    letterSpacing: 0,
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "16px",
                    color: "rgba(0, 0, 0, 0.6)",
                    lineHeight: "24px",
                    fontWeight: 400,
                    fontFamily: "Rubik !important",
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ================= MISSION SECTION ================= */}
        <Box
          sx={{
            width: "100%",
            background: "rgba(249, 249, 251, 1)",
            py: { xs: 7, sm: 8, md: 9, lg: 10, xl: 12 },
            px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
          }}
        >
          <Box
            sx={{
              maxWidth: {
                xs: "100%",
                sm: "100%",
                md: "1200px",
                lg: "1200px",
                xl: "1200px",
              },
              mx: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: "30px", sm: "36px", md: "42px" },
                lineHeight: "120%",
                fontFamily: "Rubik",
                fontWeight: 600,
                color: "rgba(0, 0, 0, 0.8)",
                textAlign: "center",
                mb: { xs: 4, md: 5 },
              }}
            >
              From Raw Data to Research-Ready Intelligence
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 4, md: 5 },
                alignItems: { xs: "start", md: "center" },
              }}
            >
              <Box>
                <Box sx={{ display: "grid", gap: 0, position: "relative" }}>
                  {missionSteps.map((step, index) => {
                    const isLast = index === missionSteps.length - 1;

                    return (
                      <Box
                        key={step.number}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "62px 1fr",
                            md: "92px 1fr",
                          },
                          columnGap: "8px",
                          alignItems: "stretch",
                          py: { xs: 1.75, md: 2.25 },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            alignSelf: "stretch",
                            height: "100%",
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "999px",
                              background: "rgba(240, 240, 243, 1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "rgba(38, 102, 190, 1)",
                              fontFamily: "Rubik",
                              fontWeight: 500,
                              fontStyle: "italic",
                              fontSize: "16px",
                              lineHeight: "120%",
                              letterSpacing: 0,
                              position: "relative",
                              zIndex: 1,
                            }}
                          >
                            {step.number}
                          </Box>

                          {/* Stem segment */}
                          {!isLast ? (
                            <Box
                              sx={{
                                flex: 1,
                                width: "4px",
                                background: "rgba(240, 240, 243, 1)",
                                borderRadius: "999px",
                                // Extend through the row padding so it always touches the next circle.
                                // We need to cover current-row bottom padding + next-row top padding.
                                mt: 0,
                                mb: { xs: "-28px", md: "-36px" },
                              }}
                            />
                          ) : (
                            <Box sx={{ flex: 1 }} />
                          )}
                        </Box>

                        <Box sx={{ maxWidth: 520 }}>
                          <Typography
                            sx={{
                              fontFamily: "Rubik",
                              fontSize: "20px",
                              fontWeight: 600,
                              color: "rgba(0, 0, 0, 0.8)",
                              lineHeight: "130%",
                              letterSpacing: 0,
                              textAlign: "left",
                              mb: 1,
                            }}
                          >
                            {step.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Rubik",
                              fontSize: "16px",
                              fontWeight: 400,
                              color: "rgba(0, 0, 0, 0.6)",
                              lineHeight: "24px",
                              letterSpacing: 0,
                              textAlign: "left",
                            }}
                          >
                            {step.description}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  {/* legacy absolute stem removed */}
                </Box>
              </Box>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: { xs: 320, sm: 360, md: 400, lg: 470, xl: 520 },
                    borderRadius: "12px",
                    boxShadow: "1px 8px 34px rgba(153, 169, 190, 0.1)",
                    backgroundColor: "#fff",
                    px: { xs: 1.25, sm: 1.75, md: 2 },
                    py: { xs: 1.5, sm: 2, md: 2.5 },
                    boxSizing: "border-box",
                  }}
                >
                  <Box
                    component="img"
                    src={missionImg}
                    alt="From raw data to research-ready intelligence"
                    loading="lazy"
                    sx={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* legacy content removed */}
            {/* <Box sx={{ order: { xs: 2, md: 1 } }}>
              <Typography
                sx={{
                  color: "rgba(0, 0, 0, 0.8)",
                  fontSize: {
                    xs: "26px",
                    sm: "26px",
                    md: "42px",
                    xl: "42px",
                  },
                  lineHeight: "120%",
                  fontFamily: "Rubik",
                  fontWeight: 500,
                  mb: { xs: 1, lg: 1.5, xl: 2 },
                }}
              >
                Our Mission: Turn Complex Oncology Data into Actionable Insights
              </Typography>
              <Typography
                sx={{
                  color: "rgba(0, 0, 0, 0.6)",
                  fontSize: { xs: 16, sm: 16, md: 17, lg: 18, xl: 19 },
                  lineHeight: { xs: "24px", md: "32px" },
                  fontWeight: "400",
                  fontFamily: "Rubik",
                  mb: { xs: 1, lg: 1.5, xl: 2 },
                }}
              >
                We believe that the future of oncology depends on faster, more
                transparent access to evidence.
              </Typography>
              <Typography
                sx={{
                  color: "rgba(0, 0, 0, 0.6)",
                  fontSize: { xs: 16, sm: 16, md: 17, lg: 18, xl: 19 },
                  lineHeight: { xs: "24px", md: "32px" },
                  fontWeight: "400",
                  fontFamily: "Rubik",
                  mb: { xs: 2, lg: 3, xl: 4 },
                }}
              >
                Our mission is to transform how researchers, biotech, and pharma
                teams discover and compare oncology trialsâ€”making every decision
                grounded in structured, reliable, and instantly available data.
              </Typography>

              <Box
                sx={{
                  display: "inline-flex",
                  gap: { xs: 1, lg: 1.5, xl: 2 },
                  borderRadius: "6px",
                  border: "1px solid rgba(26,115,232,0.4)",
                  background: "rgba(26,115,232,0.08)",
                  color: "rgba(28, 77, 142, 1)",
                  fontWeight: 500,
                  fontFamily: "Rubik",
                  lineHeight: "130%",
                  fontSize: {
                    xs: 14,
                    md: 16,
                  },
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    px: {
                      xs: "6px",
                      sm: "8px",
                      md: "12px",
                      lg: "14px",
                      xl: "16px",
                    },
                    py: {
                      xs: "4px",
                      sm: "6px",
                      md: "8px",
                      lg: "10px",
                      xl: "12px",
                    },
                  }}
                >
                  Faster Research
                </Box>
                <Box
                  sx={{
                    pr: {
                      xs: "8px",
                      sm: "10px",
                      md: "12px",
                      lg: "14px",
                      xl: "16px",
                    },
                    py: {
                      xs: "4px",
                      sm: "6px",
                      md: "8px",
                      lg: "10px",
                      xl: "12px",
                    },
                  }}
                >
                  <FaArrowRightLong />
                </Box>

                <Box
                  sx={{
                    px: {
                      xs: "6px",
                      sm: "8px",
                      md: "12px",
                      lg: "14px",
                      xl: "16px",
                    },
                    py: {
                      xs: "4px",
                      sm: "6px",
                      md: "8px",
                      lg: "10px",
                      xl: "12px",
                    },
                  }}
                >
                  Better Treatments
                </Box>
                <Box
                  sx={{
                    pr: {
                      xs: "8px",
                      sm: "10px",
                      md: "12px",
                      lg: "14px",
                      xl: "16px",
                    },
                    py: {
                      xs: "4px",
                      sm: "6px",
                      md: "8px",
                      lg: "10px",
                      xl: "12px",
                    },
                  }}
                >
                  <FaArrowRightLong />
                </Box>
                <Box
                  sx={{
                    px: {
                      xs: "6px",
                      sm: "8px",
                      md: "12px",
                      lg: "14px",
                      xl: "16px",
                    },
                    py: {
                      xs: "4px",
                      sm: "6px",
                      md: "8px",
                      lg: "10px",
                      xl: "12px",
                    },
                  }}
                >
                  Saved Lives
                </Box>
              </Box>
            </Box> */}
          </Box>
        </Box>

        {/* ================= SUPPORT YOUR TEAM SECTION ================= */}
        <Box
          sx={{
            width: "100%",
            background: "#fff",
            pt: { xs: 5, sm: 6, md: 6, lg: 8, xl: 10 },
            pb: { xs: 2, sm: 3, md: 6, lg: 8, xl: 10 },
            px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
          }}
        >
          <Box
            sx={{
              maxWidth: {
                xs: "100%",
                sm: "100%",
                md: "1200px",
                lg: "1400px",
                xl: "1600px",
              },
              mx: "auto",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "26px",
                  md: "42px",
                },
                fontWeight: 600,
                fontFamily: "Rubik",
                lineHeight: "120%",
                color: "rgba(0, 0, 0, 0.8)",
                mb: { xs: 1, lg: 1.5, xl: 2 },
              }}
            >
              See How We Can Support Your Oncology Team
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                  md: "16px",
                  lg: "17px",
                  xl: "18px",
                },
                color: "rgba(0, 0, 0, 0.6)",
                maxWidth: {
                  xs: "100%",
                  md: "800px",
                  lg: "900px",
                  xl: "1000px",
                },
                fontFamily: "Rubik",
                fontWeight: 400,
                mx: "auto",
                lineHeight: { xs: "20px", sm: "22px", md: "32px" },
                mb: { xs: 1.75, md: 4, lg: 5, xl: 6 },
              }}
            >
              Every feature is designed around how oncology professionals
              actually work
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
                gap: { xs: 3, md: 3 },
                maxWidth: {
                  xs: "100%",
                  md: "1100px",
                  lg: "1300px",
                  xl: "1500px",
                },
                mx: "auto",
                // Surface Pro 7 / iPad Pro widths: avoid 3-up cramped layout (keeps cards aligned).
                "@media (min-width: 900px) and (max-width: 1100px)": {
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
              {supportCards.map((card, index) => (
                <Box
                  key={card.title}
                  sx={{
                    gridColumn: {
                      md: index < 2 ? "span 6" : "span 4",
                    },
                    "@media (min-width: 900px) and (max-width: 1100px)": {
                      gridColumn: "auto",
                    },
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.05)",
                    borderRadius: "12px",
                    p: "24px",
                    boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.25)",
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    columnGap: "16px",
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      background: "#F0F6FE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#2666BE",
                    }}
                  >
                    {card.icon}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: "10px", md: "12px" },
                      width: "100%",
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontFamily: "Rubik",
                        fontSize: "20px",
                        color: "rgba(0, 0, 0, 0.8)",
                        lineHeight: "130%",
                        textAlign: "left",
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 400,
                        color: "rgba(0, 0, 0, 0.6)",
                        fontFamily: "Rubik",
                        textAlign: "left",
                        lineHeight: "24px",
                        maxWidth: "520px",
                      }}
                    >
                      {card.description}
                    </Typography>

                    <Box
                      sx={{
                        mt: "4px",
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: card.twoColumnBullets
                            ? "repeat(2, minmax(0, 1fr))"
                            : "1fr",
                        },
                        rowGap: "12px",
                        columnGap: card.twoColumnBullets ? "24px" : "0px",
                        width: "100%",
                      }}
                    >
                      {card.bullets.map((bullet, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "18px 1fr",
                            columnGap: "8px",
                            alignItems: "flex-start",
                            width: "100%",
                            minWidth: 0,
                          }}
                        >
                          <Box sx={{ width: 18, height: 18, flexShrink: 0 }}>
                            <img
                              src={BluePointer}
                              alt=""
                              width={18}
                              height={18}
                              loading="lazy"
                              decoding="async"
                              style={{ display: "block" }}
                            />
                          </Box>

                          <Typography
                            sx={{
                              fontSize: "16px",
                              color: "rgba(0, 0, 0, 0.8)",
                              fontWeight: 600,
                              fontFamily: "Rubik",
                              lineHeight: 1.5,
                              textAlign: "left",
                              minWidth: 0,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {bullet}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ================= BOOK DEMO SECTION ================= */}
        <Box
          sx={{
            width: "100%",
            position: "relative",
            py: { xs: 7, sm: 8, md: 9 },
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={heroBackground}
            alt=""
            aria-hidden="true"
            srcSet={`${heroBackground828} 828w, ${heroBackground1242} 1242w, ${heroBackground} 1437w`}
            sizes="100vw"
            loading="lazy"
            decoding="async"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: { xs: "center", md: "85% 100%" },
              zIndex: 0,
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(12, 32, 59, 0.65) 0%, rgba(12, 32, 59, 0.65) 100%)",
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              width: "100%",
              maxWidth: "1280px",
              mx: "auto",
              px: { xs: 3, sm: 4, md: "70px" },
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: { xs: 2, md: 2.5 },
              position: "relative",
              zIndex: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Rubik",
                fontWeight: 600,
                fontSize: { xs: "30px", sm: "36px", md: "44px" },
                lineHeight: "120%",
                color: "#fff",
              }}
            >
              See OncoSuite in Action
            </Typography>

            <Typography
              sx={{
                fontFamily: "Rubik",
                fontWeight: 400,
                fontSize: { xs: "14px", sm: "16px", md: "18px" },
                lineHeight: { xs: "22px", md: "28px" },
                color: "rgba(255, 255, 255, 0.75)",
                maxWidth: "760px",
              }}
            >
              Schedule a 30-minute live demo with our team or check out a sample
              report for your therapeutic area.
            </Typography>

            <Button
              variant="contained"
              onClick={handleBookDemo}
              sx={{
                mt: { xs: 1, md: 1.5 },
                alignItems: "center",
                justifyContent: "center",
                width: "fit-content",
                minWidth: { xs: "165px", sm: "220px" },
                height: { xs: "48px", sm: "56px" },
                px: { xs: "20px", sm: 4 },
                display: "inline-flex",
                gap: "8px",
                background: "#2666BE",
                borderRadius: "8px",
                fontFamily: "Rubik",
                fontWeight: 500,
                fontSize: { xs: "15px", sm: "18px" },
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { background: "#1F5AB1", boxShadow: "none" },
              }}
            >
              Book Your Demo
            </Button>
          </Box>
        </Box>

    </>
  );
}
