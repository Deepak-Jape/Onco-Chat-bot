import React, { useEffect, useMemo, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

// replace this import with your actual crown icon path
import CrownIcon from "../../assets/king.svg";

const useStyles = makeStyles(() => ({
  root: {
    background: "rgba(12, 32, 59, 1)",
    color: "#fff",
    /* Match the exact padding used by the "Built for High-Impact Oncology Teams" section. */
    padding: "4% 7%",
    // Full-bleed background even if parent has side padding/max-width
    // Keep content layout unchanged.
    position: "relative",
    boxShadow: "0 0 0 100vmax rgba(12, 32, 59, 1)",
    clipPath: "inset(0 -100vmax)",
    "@media (max-width: 900px)": {
      padding: "7% 4%",
    },
  },

  title: {
    fontFamily: "Rubik, sans-serif !important",
    fontWeight: "600 !important",
    textAlign: "center",
    fontSize: "42px !important",
    lineHeight: "120% !important",
    marginBottom: "18px !important",
    color: "rgba(255, 255, 255, 1)",
    "@media (max-width: 1200px)": {
      fontSize: "26px !important",
    },
    "@media (max-width: 900px)": {
      fontSize: "26px !important",
    },
    "@media (max-width: 600px)": {
      fontSize: "26px !important",
    },
  },

  subtitle: {
    maxWidth: "1220px",
    margin: "0 auto 40px auto !important",
    textAlign: "center",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "18px !important",
    lineHeight: "155% !important",
    color: "rgba(255,255,255,0.78)",
    "@media (max-width: 900px)": {
      fontSize: "16px !important",
      margin: "0 auto 28px auto !important",
    },
    "@media (max-width: 600px)": {
      fontSize: "16px !important",
      lineHeight: "155% !important",
      margin: "0 auto 18px auto !important",
    },
  },

  comparisonOuter: {
    width: "100%",
    maxWidth: "var(--onco-container-7xl, 80rem)",
    margin: "0 auto",
  },

  scrollWrapper: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    paddingTop: "8px",
    paddingBottom: "8px",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    "@media (min-width: 1200px)": {
      overflowX: "hidden",
    },
    "@media (max-width: 600px)": {
      paddingTop: "6px",
      paddingBottom: "6px",
    },
  },

  comparisonTableContainer: {
    width: "100%",
    minWidth: "1040px",
    background: "#FFFFFF",
    borderRadius: "10px",
    position: "relative",
    overflow: "visible",
    boxShadow: "0px 10px 34px rgba(0,0,0,0.18)",
    "&::before": {
      content: '""',
      position: "absolute",
      left: "24%",
      width: "38%",
      top: "-28px",
      bottom: "-28px",
      background: "rgba(38,102,190,1)",
      zIndex: 0,
    },
    "& $tableHeader, & $comparisonRow": {
      position: "relative",
      zIndex: 1,
    },
    "@media (max-width: 900px)": {
      minWidth: "920px",
    },
    "@media (max-width: 600px)": {
      minWidth: "860px",
      borderRadius: "8px",
    },
  },

  comparisonTableClip: {
    borderRadius: "10px",
    overflow: "hidden",
    "@media (max-width: 600px)": {
      borderRadius: "8px",
    },
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "24% 38% 38%",
    // Background is applied per-cell to avoid 1px seams on zoom between
    // the header row and the blue OncoSuite column overlay.
    background: "transparent",
    minHeight: "56px",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    overflow: "hidden",
  },

  tableHeaderCell: {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    fontFamily: "Rubik",
    // fontStyle: "italic",
    fontWeight: 600,
    fontSize: "20px",
    lineHeight: "140%",
    color: "rgba(0, 0, 0, 0.8)",
    textAlign: "left",
    background: "#DCE9FC",
    "@media (max-width: 900px)": {
      fontSize: "16px",
      padding: "12px 14px",
    },
  },

  headerCategoryCell: {
    fontStyle: "italic",
  },

  headerOncoCell: {
    background: "rgba(38,102,190,1)",
    color: "#FFFFFF",
    paddingTop: "18px",
    paddingBottom: "18px",
    position: "relative",
    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      top: -2,
      height: 3,
      background: "rgba(38,102,190,1)",
    },
  },

  headerLegacyCell: {
    fontStyle: "normal",
  },

  crownInline: {
    width: "40px",
    height: "24px",
    marginLeft: "4px",
    marginTop: "-3px",
    flexShrink: 0,
  },

  comparisonRow: {
    display: "grid",
    gridTemplateColumns: "24% 38% 38%",
    minHeight: "78px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
    "@media (max-width: 900px)": {
      minHeight: "72px",
    },
    "@media (max-width: 600px)": {
      minHeight: "68px",
    },
  },

  comparisonRowLast: {
    borderBottom: "none",
  },

  cellBase: {
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    fontFamily: "Rubik",
    fontSize: "16px",
    lineHeight: "150%",
    textAlign: "left",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    "@media (max-width: 900px)": {
      fontSize: "15px",
      padding: "7px 14px",
    },
    "@media (max-width: 600px)": {
      fontSize: "14px",
    },
  },

  categoryCell: {
    background: "#FFFFFF",
    color: "rgba(0, 0, 0, 1)",
    fontWeight: 600,
    fontStyle: "italic",
  },

  oncoCell: {
    background: "rgba(38,102,190,1)",
    color: "#FFFFFF",
    paddingTop: "10px",
    paddingBottom: "10px",
    alignItems: "flex-start",
    "& $htmlContent": {
      color: "rgba(255, 255, 255, 0.7)",
    },
    "& $htmlContent strong": {
      color: "rgba(255,255,255,1)",
    },
  },

  legacyCell: {
    background: "#FFFFFF",
    color: "rgba(0,0,0,0.6)",
    "& $htmlContent strong": {
      color: "rgba(0,0,0,0.8)",
    },
  },

  htmlContent: {
    width: "100%",
    "& strong": {
      fontWeight: "600",
    },
  },

  scrollTrackWrap: {
    display: "none",
    width: "100%",
    marginTop: "14px",
    "@media (max-width: 1199px)": {
      display: "block",
    },
  },

  scrollTrack: {
    width: "100%",
    height: "6px",
    background: "rgba(255,255,255,0.18)",
    borderRadius: "999px",
    overflow: "hidden",
  },

  scrollBar: {
    height: "100%",
    width: "120px",
    background: "rgba(38, 102, 190, 1)",
    borderRadius: "999px",
    transform: "translate3d(0,0,0)",
    transition: "transform 0.08s linear, width 0.08s linear",
  },

  buttonWrap: {
    marginTop: "34px",
    textAlign: "center",
  },

  ctaButton: {
    minWidth: "211px",
    padding: "0 24px",
    whiteSpace: "nowrap",
    height: "56px",
    background: "rgba(240,246,254,1) !important",
    color: "rgba(38,102,190,1) !important",
    border: "2px solid rgba(38,102,190,1) !important",
    borderRadius: "8px !important",
    fontSize: "18px !important",
    fontWeight: "600 !important",
    fontFamily: "Rubik, sans-serif !important",
    textTransform: "none !important",
    boxShadow: "none !important",
    transition: "background 0.2s ease",

    "&:hover": {
      background: "rgba(220, 233, 252, 1) !important",
      border: "2px solid rgba(19, 51, 95, 1) !important",
      color: "rgba(19, 51, 95, 1) !important",
    },

    "@media (max-width: 600px)": {
      minWidth: "160px",
      height: "46px",
      fontSize: "14px !important",
    },
  },
}));

export default function ComplexOncologyComparisonTable({
  onBookDemo,
  buttonText = "Book Your Demo",
}) {
  const classes = useStyles();

  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);

  const comparisonRows = useMemo(
    () => [
      {
        category: "Data Architecture",
        onco: "<strong>Multi-Cohort Native.</strong> Specifically built to itemize Basket and Umbrella trials down to the individual arm.",
        legacy:
          "<strong>Linear/Legacy.</strong> Aggregates complex designs into high-level summaries, missing cohort-specific nuances.",
      },
      {
        category: "Taxonomy & Depth",
        onco: "<strong>Modern   Oncology.</strong> Granular genomic, molecular and biomarker-driven classifications that reflect 2026 standards.",
        legacy:
          "<strong>Outdated.</strong> Stuck in 10-year-old structures that fail to categorize modern Mechanism of Action (MoA). Mainly unstructured raw data.",
      },
      {
        category: "Actionable Insight",
        onco: '<strong>Pre-Calculated Intelligence.</strong> Board-ready analytics and "Go/No-Go" signals delivered in seconds.',
        legacy:
          "<strong>Manual Labor.</strong> Requires days or weeks of analyst time to manually pivot and clean raw registry data.",
      },
      {
        category: "Update Frequency",
        onco: "<strong>Daily Sync.</strong> Tracking rapid regulatory shifts and competitive trial starts in real-time.",
        legacy:
          '<strong>Static Cubes.</strong> Monthly or quarterly lags that leave teams making decisions on "stale" data.',
      },
      {
        category: "Auditability",
        onco: "<strong>1-Click Traceable.</strong> Every insight and analytic is one click away from its primary source document.",
        legacy:
          "<strong>Black Box.</strong> Intransparent scoring and summaries with no direct path back to the evidence.",
      },
    ],
    [],
  );

  useEffect(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    const bar = barRef.current;

    if (!el || !track || !bar) return;

    let rafId = null;

    const updateBar = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const visibleRatio =
        el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;

      const trackWidth = track.offsetWidth;
      const barWidth = Math.max(trackWidth * visibleRatio, 60);

      bar.style.width = `${barWidth}px`;

      if (maxScroll <= 0) {
        bar.style.transform = "translate3d(0,0,0)";
        return;
      }

      const progress = el.scrollLeft / maxScroll;
      const maxMove = trackWidth - barWidth;
      const move = progress * maxMove;

      bar.style.transform = `translate3d(${move}px,0,0)`;
    };

    const requestTick = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateBar();
        rafId = null;
      });
    };

    updateBar();

    el.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);

    return () => {
      el.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <Box className={classes.root}>
      <Typography className={classes.title}>
         Instant, Actionable Oncology Evidence.<br className="landing-desktop-only-br" /> 1-Click Traceability. Daily Sync.
      </Typography>

      <Typography className={classes.subtitle}>
Traditional clinical platforms force complex, multi-arm oncology protocols into flat, linear data <br className="landing-desktop-only-br" />structures that obscure cohort-specific nuances.{" "}
OncoSuite maps data natively across deep clinical <br className="landing-desktop-only-br" /> and regulatory vectors, exposing the critical competitive insights legacy systems flatten out.
      </Typography>

      <Box className={classes.comparisonOuter}>
        <Box ref={scrollRef} className={classes.scrollWrapper}>
          <Box className={classes.comparisonTableContainer}>
            <Box className={classes.comparisonTableClip}>
              <Box className={classes.tableHeader}>
                <Box
                  className={`${classes.tableHeaderCell} ${classes.headerCategoryCell}`}
                >
                  Category
                </Box>

                <Box
                  className={`${classes.tableHeaderCell} ${classes.headerOncoCell}`}
                >
                  OncoSuite
                  <img
                    src={CrownIcon}
                    alt="Crown"
                    className={classes.crownInline}
                    width={40}
                    height={24}
                    loading="lazy"
                    decoding="async"
                  />
                </Box>

                <Box
                  className={`${classes.tableHeaderCell} ${classes.headerLegacyCell}`}
                >
                  Legacy Platforms
                </Box>
              </Box>

              {comparisonRows.map((row, index) => (
                <Box
                  key={row.category}
                  className={`${classes.comparisonRow} ${
                    index === comparisonRows.length - 1
                      ? classes.comparisonRowLast
                      : ""
                  }`}
                >
                  <Box className={`${classes.cellBase} ${classes.categoryCell}`}>
                    {row.category}
                  </Box>

                  <Box className={`${classes.cellBase} ${classes.oncoCell}`}>
                    <Box
                      className={classes.htmlContent}
                      dangerouslySetInnerHTML={{ __html: row.onco }}
                    />
                  </Box>

                  <Box className={`${classes.cellBase} ${classes.legacyCell}`}>
                    <Box
                      className={classes.htmlContent}
                      dangerouslySetInnerHTML={{ __html: row.legacy }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box className={classes.scrollTrackWrap}>
          <Box ref={trackRef} className={classes.scrollTrack}>
            <Box ref={barRef} className={classes.scrollBar} />
          </Box>
        </Box>
      </Box>

      <Box className={classes.buttonWrap}>
        <Button
          variant="contained"
          className={classes.ctaButton}
          onClick={onBookDemo}
        >
          {buttonText}
        </Button>
      </Box>
    </Box>
  );
}
