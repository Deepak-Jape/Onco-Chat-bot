import React, { useEffect, useMemo, useRef } from "react";
import { makeStyles } from "@mui/styles";
import { Box, Button, Typography, Stack, Paper } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import Container1 from "../../assets/icons/Container_1.svg";
import Container2 from "../../assets/icons/Container_2.svg";
import Container3 from "../../assets/icons/Container_3.svg";
import Container4 from "../../assets/icons/Container_4.svg";
import Container6 from "../../assets/icons/Container_6.svg";
import SiteIntelIcon from "../../assets/icons/site_intel_icon.svg";
import DrugIntelIcon from "../../assets/icons/drug_intelligence.svg";
import AiIntelIcon from "../../assets/icons/ai_agent.svg";
import TrialsIntelIcon from "../../assets/icons/trials_intel_icon.svg";
import WorldMap from "../../assets/icons/world_map.svg";
import { Divider } from "@mui/material";
import CursorPointer from "../../assets/images/cursor_img.svg";
import VerifiedIcon from "../../assets/images/Protect.svg";
import { useStyles } from "./firstScreenStyles";


const ConfidenceRing = ({ value = 85 }) => {
  const size = 36;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(34, 154, 94, 0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(34, 154, 94, 1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Rubik",
          fontWeight: 700,
          fontSize: 12,
          color: "rgba(0,0,0,0.8)",
        }}
      >
        {value}
      </Box>
    </Box>
  );
};

// const CursorPointer = () => (
//   <svg viewBox="0 0 24 32" width="100%" height="100%" aria-hidden="true">
//     <g transform="translate(1,0) rotate(8 12 16)">
//       <path
//         d="M2.2 2.1 21 16.4c.6.4.3 1.3-.4 1.3h-7.2l2.7 9c.1.4-.1.8-.5.9l-3.1 1c-.4.1-.8-.1-.9-.5l-2.8-9-5.6 4.8c-.5.4-1.3 0-1.3-.7V2.7c0-.7.8-1.1 1.3-.6Z"
//         fill="#111827"
//       />
//       <path
//         d="M2.2 2.1 21 16.4c.6.4.3 1.3-.4 1.3h-7.2l2.7 9c.1.4-.1.8-.5.9l-3.1 1c-.4.1-.8-.1-.9-.5l-2.8-9-5.6 4.8c-.5.4-1.3 0-1.3-.7V2.7c0-.7.8-1.1 1.3-.6Z"
//         fill="none"
//         stroke="#ffffff"
//         strokeWidth="1.4"
//       />
//     </g>
//   </svg>
// );

const FirstScreenSections = ({ onBookDemo }) => {
  const classes = useStyles();
  const featureSectionRef = useRef(null);
  const featureRailViewportRef = useRef(null);
  const featureRailRef = useRef(null);

  const moduleSectionRef = useRef(null);
  const moduleRailViewportRef = useRef(null);
  const moduleRailRef = useRef(null);

  const useHorizontalRail = (sectionRef, viewportRef, railRef) => useEffect(() => {
    const sectionEl = sectionRef.current;
    const viewportEl = viewportRef.current;
    const railEl = railRef.current;
    if (!sectionEl || !viewportEl || !railEl) return undefined;

    let rafId = 0;
    let resizeObserver;
    let isDesktopMode = false;
    // Desktop rail (JS-driven horizontal transform) should only run on real
    // desktops: wide viewport AND a fine pointer (mouse). Touch devices —
    // including large phones/tablets that report >900px — must use native
    // scrolling, otherwise the leftover inline transform/height causes the
    // "scrolls past the last card" bug seen only on real mobile devices.
    const desktopQuery = window.matchMedia(
      "(min-width: 901px) and (pointer: fine)",
    );

    const updateRail = () => {
      rafId = 0;

      const stickyPane = sectionEl.firstElementChild;
      const paneHeight = stickyPane ? stickyPane.offsetHeight : 0;
      // Distance the pane is pinned from the top (matches CSS `top` on the sticky pane).
      const pinOffset = stickyPane
        ? parseFloat(window.getComputedStyle(stickyPane).top) || 0
        : 0;
      const maxTranslate = Math.max(0, railEl.scrollWidth - viewportEl.clientWidth);
      const sectionTop = sectionEl.getBoundingClientRect().top + window.scrollY;
      // Extra scroll distance so the pane stays pinned longer. Scale it up on wider
      // desktops (where the rail overflows less) to lengthen the pinned range.
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const extraRange = viewportWidth >= 1440 ? 480 : viewportWidth >= 1200 ? 320 : 160;
      const sectionScrollRange = Math.max(1, maxTranslate + extraRange);
      const progress = Math.min(
        1,
        Math.max(0, (window.scrollY - sectionTop - pinOffset) / sectionScrollRange),
      );

      // Section must be tall enough that the sticky pane stays pinned for the
      // entire horizontal-scroll range, otherwise the next section slides up early.
      sectionEl.style.height = `${paneHeight + sectionScrollRange}px`;
      railEl.style.transform = `translate3d(${-maxTranslate * progress}px, 0, 0)`;
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateRail);
    };

    const resetMobileRail = () => {
      sectionEl.style.height = "";
      railEl.style.transform = "";
    };

    // --- Mobile native-scroll clamp -------------------------------------
    // On real touch devices iOS momentum scrolling can carry the rail past the
    // last card into empty space ("scrolls forever"). CSS alone (max-content /
    // overscroll-behavior) does not reliably stop this on iOS, so we hard-clamp
    // scrollLeft to the true last-card boundary on every scroll frame.
    let mobileScrollBound = false;
    let clampRaf = 0;
    const clampScroll = () => {
      clampRaf = 0;
      // The real end position: last child's right edge, minus the viewport width.
      const lastCard = railEl.lastElementChild;
      if (!lastCard) return;
      const maxScroll = Math.max(
        0,
        lastCard.offsetLeft + lastCard.offsetWidth - viewportEl.clientWidth,
      );
      if (viewportEl.scrollLeft > maxScroll) {
        viewportEl.scrollLeft = maxScroll;
      }
    };
    const onMobileScroll = () => {
      if (clampRaf) return;
      clampRaf = window.requestAnimationFrame(clampScroll);
    };
    const enableMobileClamp = () => {
      if (mobileScrollBound) return;
      mobileScrollBound = true;
      viewportEl.addEventListener("scroll", onMobileScroll, { passive: true });
    };
    const disableMobileClamp = () => {
      if (!mobileScrollBound) return;
      mobileScrollBound = false;
      viewportEl.removeEventListener("scroll", onMobileScroll);
      if (clampRaf) window.cancelAnimationFrame(clampRaf);
      clampRaf = 0;
    };

    const enableDesktopRail = () => {
      if (isDesktopMode) return;
      isDesktopMode = true;
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(sectionEl);
      resizeObserver.observe(railEl);
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", scheduleUpdate);
      scheduleUpdate();
    };

    const disableDesktopRail = () => {
      if (!isDesktopMode) return;
      isDesktopMode = false;
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      resetMobileRail();
    };

    const syncRailMode = () => {
      if (desktopQuery.matches) {
        disableMobileClamp();
        enableDesktopRail();
      } else {
        disableDesktopRail();
        // Always clear any stale inline height/transform so the mobile rail
        // scrolls natively and stops flush at the last card (no phantom
        // over-scroll left behind by a previous desktop transform).
        resetMobileRail();
        // Hard-clamp native scroll so iOS momentum can't carry past the last card.
        enableMobileClamp();
      }
    };

    syncRailMode();
    // Re-sync after first paint: real mobile browsers can briefly report a
    // desktop-sized viewport before the meta-viewport is applied, which would
    // otherwise leave a stale inline transform/height on the rail.
    const settleId = window.requestAnimationFrame(syncRailMode);

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", syncRailMode);
    } else {
      desktopQuery.addListener(syncRailMode);
    }

    return () => {
      window.cancelAnimationFrame(settleId);
      disableDesktopRail();
      disableMobileClamp();
      if (desktopQuery.removeEventListener) {
        desktopQuery.removeEventListener("change", syncRailMode);
      } else {
        desktopQuery.removeListener(syncRailMode);
      }
    };
  }, [sectionRef, viewportRef, railRef]);

  useHorizontalRail(featureSectionRef, featureRailViewportRef, featureRailRef);
  useHorizontalRail(moduleSectionRef, moduleRailViewportRef, moduleRailRef);

  const topFeatures = useMemo(
    () => [
      {
        // icon: Container1,
        title: (
          <>
            Quantify Granular Target Patient Pools
            {/* <br /> */}
            
          </>
        ),
        description: (
          "High-level epidemiology overestimates market size, causing teams to advance assets for patient populations that are too small to successfully recruit or commercialize."
        ),
        outcome:
          "Model precise patient volumes by filtering the oncology landscape down to exact organ, histology, biomarker, cancer stage, and line of therapy combinations.",
      },
      {
        // icon: Container2,
        title: (
          <>
            Establish Efficacy vs. 
            <br />
            Safety Benchmarks
          </>
        ),
        description:
          "Teams design clinical protocols without hard historical baseline data, resulting in unrealistic target product profiles (TPPs) and failed endpoints.",
        outcome:
          "Instantly generate objective efficacy vs. safety benchmarks for any cohort-by-treatment combination to define the exact statistical hurdle your asset must beat.",
      },
      {
        // icon: Container3,
        title: (
          <>
            Eliminate $2M+ Protocol Amendments
            {/* <br /> */}
            
          </>
        ),
        description:
          " Unworkable inclusion criteria and flawed comparator choices force mid-trial amendments, delaying development timelines by an average of 4.5 months.",
        outcome:
          'Cross-reference draft eligibility criteria against 59k+ historical trial arms to expose design friction and hidden protocol flaws before protocol lock.',
      },
      {
        // icon: Container4,
        title : (
          <>
          Stop Feasibility Timeline Slippage
          {/* <br /> */}
          
          
          </>

        ),
        description:
          "Flooding the same over-saturated academic medical centers creates trial congestion, leading to zero-recruiting sites and missed Last Patient In (LPI) deadlines.",
        outcome:
          "Map global investigator networks by real-time enrollment momentum and active competitor trial loads to isolate sites with immediate patient access.",
      },
      {
        // icon: Container5,
        title: (
          <>
            Prevent Competitive
            <br />
            Blindspots
            {/* <br /> */}
            
          </>
        ),
        description: (
          "Relying on annual medical congresses means discovering competitor pivots 6 to 12 months too late—after they have captured your target niche."
        ),
        outcome:
          "Track daily global registry modifications and new trial arm additions in real time to spot competitor strategy shifts before they surface at ASCO.",
      },
    ],
    [],
  );

  const intelligenceModules = useMemo(
    () => [
      {
        icon: Container6,
        title: "Patient Intelligence",
        id: "patient-intelligence",
        descriptionTitle: "Identify high responders and size markets.",
        description:
          "Filter the clinical landscape by histology, cancer stage, therapy line, and biomarkers to isolate high-responding patient sub-cohorts and get a data-backed view of your target pool.",
        outcome:  
          "A defensible, biomarker-stratified patient population mapping and market sizing.",
      },
      {
        icon: DrugIntelIcon,
        title: "Drug Intelligence",
        id: "drug-intelligence",
        descriptionTitle: "Map commercial and regulatory lifecycles.",
        description: "Eliminate manual valuation and data tracking. Access a dashboard of 1,000+ oncology drugs to monitor pipeline stages, patent timelines, pricing, and FDA/EMA indications.",
        outcome: "A unified cross-border map to de-risk strategy, due diligence, and launch positioning."

      },
      {
        icon: TrialsIntelIcon,
        title: "Trial Intelligence",
        id: "trial-intelligence",
        descriptionTitle: "Define the hurdles you need to beat.",
        description:
          "Don't just track trials—benchmark them. Analyze the competitive landscape across current treatment strategies and endpoints to establish clear Efficacy vs. Safety targets for your protocol.",
        outcome:
          "A clear strategic map of the clinical hurdles required to achieve market leadership.",
      },
      {
        icon: SiteIntelIcon,
        title: "Site Intelligence",
        id: "site-intelligence",
        descriptionTitle: "Predict and accelerate enrollment.",
        description:
          "Eliminate the guesswork of legacy scoring. Rank sites by verified patient access, trial congestion, and PI experience to hit your Last Patient In (LPI) targets faster.",
        outcome:
          "A predictive enrollment roadmap that eliminates recruitment friction.",
      },

      {
        icon: AiIntelIcon,
        title: "AI Agents",
        id: "ai-agents",
        descriptionTitle: "Trusted oncology intelligence anywhere.",
        description: "Avoid AI hallucinations and manual evidence gathering. Query our agent for instant, traceable answers or use MCP to stream detailed, daily-updated data into your corporate AI agents.",
        outcome: "Maximum accuracy and value for AI agents, backed by trusted clinical evidence."

      }
    ],
    [],
  );

  return (
    <>
      {/* <Box className={classes.whiteSection}> */}
        {/* <Box ref={featureSectionRef} className={classes.featureScrollSection}>
          <Box className={classes.featureStickyPane}>
            <Stack spacing={2} className={classes.centeredHeaderStack}>
              <Typography className={classes.sectionTitle}>
                Stop Searching. Start Deciding.
              </Typography> */}

              {/* <Typography className={classes.sectionSubtitle}>
                OncoSuite replaces fragmented data registries with precise, evidence-ready intelligence.
                Access the radical data granularity <br className={classes.subtitleBreak} />
                required to validate target markets,
                benchmark clinical hurdles, and accelerate time-to-market.
              </Typography>
            </Stack> */}

            {/* <Box className={classes.featureRailIntro}>
              <Typography className={classes.featureRailHint}>
                Scroll here to move through the cards
              </Typography> */}
            {/* </Box> */}

            {/* <Box className={classes.featureRailStage}>
              <Box ref={featureRailViewportRef} className={classes.featureRailViewport}>
                <Box ref={featureRailRef} className={classes.featureRail}>
                {topFeatures.map((feature, index) => (
                  <Box key={index} className={classes.featureRailItem}>
                    <Paper
                      elevation={0}
                      className={classes.featureCard}
                      sx={{ width: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <Stack className={classes.featureStack} sx={{ flex: 1 }}>
                        <Box className={classes.featureHeader}> */}
                          {/* <img
                            src={feature.icon}
                            alt={`feature-${index}`}
                            width={52}
                            height={52}
                            loading="lazy"
                            decoding="async"
                          /> */}
                          {/* <Typography className={classes.featureTitle}>
                            {feature.title}
                          </Typography>
                        </Box> */}

                        {/* <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0,
                            gap: "8px",
                          }}
                        >
                          <Box className={classes.featureProblemBlock}>
                            <Typography className={classes.featureText}>
                              <Box component="span" className={classes.featureLabel}>
                                The Problem:
                              </Box>{" "}
                              <Box component="span" className={classes.outcomeValue}>
                                {feature.description}
                              </Box>
                            </Typography>
                          </Box>

                          <Divider sx={{ mb: 0.25, mt: "auto" }} />

                          <Box className={classes.featureSolutionBlock}>
                            <Typography className={classes.outcomeText}>
                              <Box component="span" className={classes.outcomeLabel}>
                                The Solution:
                              </Box>{" "}
                              <Box component="span" className={classes.outcomeValue}>
                                {feature.outcome}
                              </Box>
                            </Typography>
                          </Box>
                        </Box> */}

                        {/* </Typography>
                      </Stack>
                    </Paper>
                  </Box>
                ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box> */}

      {/* </Box> */}

      <Box id="platform" className={classes.blueLightSection}>
        <Box ref={moduleSectionRef} className={classes.featureScrollSection}>
          <Box className={classes.featureStickyPane} sx={{ background: "transparent !important" }}>
            <Stack spacing={2} className={classes.centeredHeaderStack}>
              <Typography className={classes.sectionTitle}>
                5 Modules to Benchmark, De-Risk, and <br className="landing-desktop-only-br" />{" "}Accelerate Your Oncology Pipeline.
              </Typography>

              <Typography className={classes.sectionSubtitle}>
               Move away from fragmented data silos and disjointed intelligence tracking.
               OncoSuite centralizes your <br className="landing-desktop-only-br" />{" "}
               clinical, operational, and market landscaping into a unified,
               audit-ready ecosystem—allowing your teams to <br className="landing-desktop-only-br" />{" "}
               pivot from data gathering to strategic execution instantly.
              </Typography>
            </Stack>

            <Box className={classes.featureRailStage}>
              <Box ref={moduleRailViewportRef} className={classes.featureRailViewport}>
                <Box ref={moduleRailRef} className={classes.featureRail}>
                  {intelligenceModules.map((item, index) => (
                    <Box key={index} id={item.id} className={classes.featureRailItem}>
                      <Paper
                        elevation={0}
                        className={classes.featureCard}
                        sx={{ width: "100%", display: "flex", flexDirection: "column" }}
                      >
                        <Stack className={classes.featureStack} sx={{ flex: 1 }}>
                          <Box className={classes.featureHeader}>
                            <img
                              src={item.icon}
                              alt={item.title}
                              width={52}
                              height={52}
                              loading="lazy"
                              decoding="async"
                            />
                            <Typography className={classes.featureTitle}>
                              {item.title}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              flexGrow: 1,
                              minHeight: 0,
                              gap: "8px",
                            }}
                          >
                            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                              <Typography className={classes.moduleLead}>
                                {item.descriptionTitle}
                              </Typography>

                              <Typography className={classes.moduleDesc}>
                                {item.description}
                              </Typography>
                            </Box>

                            <Divider sx={{ mt: "auto", mb: 0 }} />

                            <Box className={classes.outcomeSection}>
                              <Typography className={classes.outcomeText}>
                                <Box
                                  component="span"
                                  className={`${classes.outcomeLabel} ${classes.useCaseOutcomeLabel}`}
                                >
                                  Outcome:
                                </Box>{" "}
                                <Box component="span" className={classes.outcomeValue}>
                                  {item.outcome}
                                </Box>
                              </Typography>
                            </Box>

                          </Box>
                        </Stack>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box className={classes.evidencePanel}>
              <Box className={classes.evidencePanelInner}>
            <Box className={classes.evidenceLeft}>
              <Typography className={classes.evidenceTitle}>
                1-Click Source Traceability
              </Typography>
              <Typography className={classes.evidenceSubtitle}>
                Every data point can be traced back to the original source file,
                allowing users to verify each point without relying on blind
                trust in a black box.
              </Typography>

              <Box className={classes.evidenceCriteria}>
                <Box
                  className={classes.evidenceCriteriaCol}
                  sx={{ background: "rgba(240, 253, 244, 0.85)" }}
                >
                  <Typography className={classes.evidenceMiniHeading}>
                    Inclusion
                  </Typography>
                  <Divider className={classes.evidenceMiniDivider} />
                  <Box className={classes.evidenceList}>
                    <Box className={classes.evidenceListItem}>
                      <Box className={classes.evidenceIconOk}>
                        <CheckRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(31, 139, 77, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      Lung cancer
                    </Box>
                    <Box className={classes.evidenceListItem}>
                      <Box className={classes.evidenceIconOk}>
                        <CheckRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(31, 139, 77, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      NSCLC
                    </Box>
                    <Box className={classes.evidenceListItem}>
                      <Box className={classes.evidenceIconOk}>
                        <CheckRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(31, 139, 77, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      EGFR 19 exon reduction
                    </Box>
                    <Box className={classes.evidenceListItem}>
                      <Box className={classes.evidenceIconOk}>
                        <CheckRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(31, 139, 77, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      Advanced stage
                    </Box>
                  </Box>
                </Box>

                <Box className={classes.evidenceCriteriaDivider} />

                <Box
                  className={classes.evidenceCriteriaCol}
                  sx={{ background: "rgba(254, 242, 242, 0.9)" }}
                >
                  <Typography className={classes.evidenceMiniHeading}>
                    Exclusion
                  </Typography>
                  <Divider className={classes.evidenceMiniDivider} />

                  <Box className={classes.evidenceList}>
                    <Box className={classes.evidenceListItem} sx={{ position: "relative" }}>
                      <Box className={classes.evidenceIconNo}>
                        <CloseRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(193, 70, 70, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      <Box component="span" className={classes.evidenceHoverPill}>
                        Prior immunotherapy
                      </Box>
                      <Box className={classes.evidenceCursor} aria-hidden="true">
                        <img src={CursorPointer} alt="cursor" />
                      </Box>
                    </Box>
                    <Box className={classes.evidenceListItem}>
                      <Box className={classes.evidenceIconNo}>
                        <CloseRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(193, 70, 70, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      Cardiovascular disease
                    </Box>
                    <Box className={classes.evidenceListItem}>
                      <Box className={classes.evidenceIconNo}>
                        <CloseRoundedIcon
                          sx={{ fontSize: 10, color: "rgba(193, 70, 70, 1)", fontWeight: "bold" }}
                        />
                      </Box>
                      Pregnancy or breastfeeding
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box className={classes.evidenceRight}>
              <Box className={classes.traceCard}>
                <Box className={classes.traceHeader}>
                  <Box className={classes.traceHeaderLeft}>
                    <Box
                      component="img"
                      src={VerifiedIcon}
                      alt="verified"
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography className={classes.traceHeaderTitle}>
                      Source Traceability
                    </Typography>
                  </Box>

                  <Box className={classes.confidenceWrap}>
                    <Typography className={classes.confidenceLabel}>
                      Confidence Score:
                    </Typography>
                    <ConfidenceRing value={85} />
                  </Box>
                </Box>
                <Divider className={classes.headerDivider} />

                <Typography className={classes.highlightedQuote}>
                  Patients on immunotherapy{" "}
                  <span className={classes.highlightMark}>
                    (PD-1, PD-L1, CTLA-4 inhibitors)
                  </span>{" "}
                  were excluded to avoid confounding results.
                </Typography>

                <Typography className={classes.traceMetaLabel}>
                  Reasoning
                </Typography>
                <Typography className={classes.traceBody}>
                  Prior immunotherapy changes immune response, making new
                  treatment assessment harder. Trials exclude these patients.
                </Typography>

                <Typography className={classes.traceSource}>
                  Source:{" "}
                  <span className={classes.traceLink}>ClinicalTrials.gov</span>
                </Typography>

                <Divider className={classes.traceDivider} />

                <Box className={classes.traceFooter}>
                  <span>Source Date: 29th May, 25</span>
                  <span>OncoSuite v1.3</span>
                </Box>
              </Box>
            </Box>
          </Box>
          </Box>
        </Box>
        </Box>

        <Box sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="landing-button landing-button--primary sm-col-2"
            onClick={onBookDemo}
          >
            Book Your Demo
          </button>
        </Box>
      </Box>
    </>
  );
};

export default FirstScreenSections;
