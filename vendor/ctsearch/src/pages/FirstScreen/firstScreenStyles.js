import { makeStyles } from "@mui/styles";

export const useFirstScreenStyles = makeStyles(() => ({
  textField: {
    "& .MuiOutlinedInput-root": {
      fontFamily: "Rubik",

      "& fieldset": {
        borderColor: "#D0D5DD",
      },

      "&:hover fieldset": {
        borderColor: "#98A2B3",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#344054",
        borderWidth: "2px",
      },
    },

    "& .MuiInputLabel-root": {
      "&.Mui-focused": {
        color: "#344054",
      },
    },
  },
  blockHeader: {
    fontSize: "20px",
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: "500",
    fontFamily: "Rubik"
  },
  root: {
    width: "100%",
    background: "#ffffff",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 40px",
    background: "rgba(255, 255, 255, 1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,

    boxShadow: "0px 4px 10px rgba(153, 169, 190, 0.1)",

    "@media (max-width: 600px)": {
      padding: "15px 20px",
    },
  },

  navLinks: {
    display: "flex",
    gap: "30px",

    "@media (max-width: 600px)": {
      display: "none",
    },
  },

  navButton: {
    marginLeft: "10px",

    "@media (max-width: 600px)": {
      display: "none",
    },
  },

  mobileMenuIcon: {
    display: "none",

    "@media (max-width: 600px)": {
      display: "block",
    },
  },

  drawerContent: {
    padding: 20,
    width: 250,
  },

  heroContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "60px 40px",

    "@media (max-width: 960px)": {
      flexDirection: "column",
      textAlign: "center",
      padding: "40px 20px",
    },
  },

  heroLeft: {
    maxWidth: 550,
  },

  heroTitle: {
    fontSize: 42,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 20,

    "@media (max-width: 960px)": {
      fontSize: 32,
    },
  },

  heroSubtitle: {
    fontSize: 16,
    color: "#444",
    marginBottom: 25,
  },

  heroButtons: {
    display: "flex",
    gap: 15,
    marginTop: 15,

    "@media (max-width: 960px)": {
      justifyContent: "center",
    },
  },

  videoWrapper: {
    width: 500,
    height: 310,
    borderRadius: 12,
    overflow: "hidden",
    background: "#f5f5f5",

    "@media (max-width: 960px)": {
      width: "100%",
      height: 240,
      marginTop: 30,
    },
  },

  statsSection: {
    marginTop: 40,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,

    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr",
      textAlign: "center",
    },
  },

  statBox: {
    background: "#f8f9fc",
    padding: "20px",
    borderRadius: 10,
    border: "1px solid #eee",
  },

  logosSection: {
    marginTop: 40,
    display: "flex",
    justifyContent: "center",
    gap: 40,
    flexWrap: "wrap",
  },
}));


export const useStyles = makeStyles(() => ({
  whiteSection: {
    padding: "4% 7%",
    background: "#fff",
    "@media (max-width: 900px)": {
      padding: "6% 5%",
    },
  },
  blueLightSection: {
    padding: "5% 7%",
    background: "rgba(249, 249, 251, 1)",
    // Full-bleed background even if parent (e.g. .landing-shell) has side padding.
    // Keep content width/padding unchanged.
    position: "relative",
    boxShadow: "0 0 0 100vmax rgba(249, 249, 251, 1)",
    clipPath: "inset(0 -100vmax)",
    "@media (max-width: 900px)": {
      padding: "6% 5%",
    },
  },
  centeredHeaderStack: {
    textAlign: "center",
    marginBottom: "20px",
    "@media (max-width: 600px)": {
      marginBottom: "14px",
    },
  },

  featureRailHint: {
    fontFamily: "Rubik !important",
    fontWeight: "500 !important",
    fontSize: "14px !important",
    lineHeight: "20px !important",
    color: "rgba(0, 0, 0, 0.58)",
  },
  featureScrollSection: {
    position: "relative",
    paddingTop: "18px",
    paddingBottom: "24px",
    // Touch devices / narrow viewports: force natural height even if the
    // desktop rail JS ever leaves a stale inline `height` (which would create
    // a large empty scroll area below the cards on real phones).
    "@media (max-width: 900px), (pointer: coarse)": {
      paddingTop: "10px",
      paddingBottom: "18px",
      height: "auto !important",
    },
  },
  featureStickyPane: {
    position: "sticky",
    top: "88px",
    zIndex: 2,
    background: "#fff",
    paddingTop: "12px",
    paddingBottom: "16px",
    "@media (max-width: 900px)": {
      position: "static",
      top: "auto",
    },
  },
  featureRailIntro: {
    marginTop: "12px",
  },
  featureRailStage: {
    marginTop: "14px",
  },
  featureRailViewport: {
    width: "100%",
    overflow: "hidden",
    // Native-scroll styles apply for narrow viewports OR any touch device
    // (coarse pointer) — even large phones/tablets that report >900px — so the
    // JS-driven desktop transform never leaves stale inline styles behind.
    "@media (max-width: 900px), (pointer: coarse)": {
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      // Prevent phantom horizontal over-scroll past the last card.
      overscrollBehaviorX: "contain",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },
  },

  featureRail: {
    display: "flex",
    flexWrap: "nowrap",
    gap: "24px",
    overflow: "visible",
    scrollSnapType: "x proximity",
    paddingRight: "24px",
    paddingBottom: "8px",
    willChange: "transform",
    transform: "translate3d(0, 0, 0)",
    transition: "transform 90ms linear",
    "@media (max-width: 900px), (pointer: coarse)": {
      width: "max-content",
      /* Last card sits flush to the viewport edge — no trailing padding so
         there's no empty over-scroll after the final card. */
      paddingRight: 0,
      willChange: "auto",
      transform: "none !important",
      transition: "none",
      /* proximity (not mandatory) so the browser doesn't force the last card's
         start to the left edge, which would create empty trailing scroll space.
         Combined with width:max-content + paddingRight:0, scrolling stops flush
         at the last card. */
      scrollSnapType: "x proximity",
    },
  },
  featureRailItem: {
    flex: "0 0 clamp(280px, 23vw, 360px)",
    minWidth: 0,
    display: "flex",
    scrollSnapAlign: "start",
    "@media (max-width: 900px), (pointer: coarse)": {
      flex: "0 0 min(72vw, 360px)",
    },
  },
  featureLabel: {
    lineHeight: "24px !important",
    fontFamily: "Rubik !important",
    fontWeight: 600,
    color: "rgba(193, 70, 70, 1)",
    fontSize: "16px !important",

  },
  sectionTitle: {
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    textAlign: "center",
    lineHeight: "120% !important",
    color: "rgba(0, 0, 0, 0.8)",
    fontSize: "42px !important",
    "@media (max-width: 900px)": {
      fontSize: "36px !important",
    },
    "@media (max-width: 600px)": {
      fontSize: "26px !important",
    },
  },
  sectionSubtitle: {
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    textAlign: "center",
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: "18px !important",
    "@media (max-width: 600px)": {
      fontSize: "16px !important",
    },
  },
  subtitleBreak: {
    display: "none",
    "@media (min-width: 1024px) and (max-width: 1600px)": {
      display: "block",
    },
  },
  featureCard: {
    padding: "12px 16px 16px",
    height: "100%",
    borderRadius: "8px !important",
    border: "1px solid #E8EEF6",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08) !important",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  featureStack: {
    gap: "6px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  featureHeader: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    minHeight: "60px",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: "20px !important",
    fontFamily: "Rubik !important",
    color: "rgba(0,0,0,0.8)",
    textAlign: "left",
    lineHeight: "26px !important",
    fontWeight: "600 !important",
  },
  featureText: {
    fontSize: "16px !important",
    color: "rgba(0,0,0,0.68)",
    textAlign: "left",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    lineHeight: "24px !important",
    flexGrow: 1,
  },
  featureProblemBlock: {
    minHeight: "140px",
    display: "flex",
    alignItems: "flex-start",
  },
  featureSolutionBlock: {
    minHeight: "128px",
  },
  outcomeText: {
    fontSize: "16px !important",
    textAlign: "left",
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    lineHeight: "24px !important",
    // marginTop: "16px !important",
  },
  outcomeSection: {
    backgroundColor: "#F0F6FE",
    marginTop: "-8px",
    marginLeft: "-16px",
    marginRight: "-16px",
    marginBottom: "-16px",
    padding: "12px 16px 16px",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    "@media (max-width: 600px)": {
      backgroundColor: "#F0F6FE",
    },
  },
  outcomeLabel: {
    lineHeight: "24px !important",
    fontFamily: "Rubik !important",
    fontWeight: 600,
    color: "rgba(31, 139, 77, 1)",
    fontSize: "16px !important",
  },
  useCaseOutcomeLabel: {
    color: "rgba(38, 102, 190, 1)",
  },
  outcomeValue: {
    fontFamily: "Rubik !important",
    fontSize: "16px !important",
    color: "rgba(0, 0, 0, 0.6)",
    fontWeight: 400,
    lineHeight: "24px !important",
  },
  moduleLead: {
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    fontSize: "16px !important",
    color: "rgba(0, 0, 0, 0.8)",
    textAlign: "left",
    lineHeight: "24px !important",
    marginBottom: "8px !important",
  },
  moduleDesc: {
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "16px !important",
    color: "rgba(0, 0, 0, 0.6)",
    textAlign: "left",
    lineHeight: "24px !important",
  },
  highlightBox: {
    border: "1px solid rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    marginTop: "4%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "1% 2%",
    background: "rgba(240, 246, 254, 1)",
    "@media (max-width: 900px)": {
      flexDirection: "column",
      padding: "7%",
    },
  },
  highlightText: {
    fontSize: "28px !important",
    color: "rgba(28, 77, 142, 1)",
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    lineHeight: "40px !important",
    "@media (max-width: 900px)": {
      fontSize: "20px !important",
    },
  },
  underlineAccent: {
    textDecoration: "underline",
    textDecorationColor: "#F4A340",
    textDecorationThickness: "3px",
    textUnderlineOffset: "0px",
    textDecorationSkipInk: "none",
  },
  worldMap: {
    maxWidth: "160px",
    width: "100%",
  },
  primaryButton2: {
    background: "rgba(38, 102, 190, 1) !important",
    color: "rgba(240, 246, 254, 1) !important",
    height: "56px",
    width: "245px",
    whiteSpace: "nowrap",
    fontSize: "18px !important",
    fontWeight: "600 !important",
    fontFamily: "Rubik !important",
    textTransform: "capitalize !important",
    borderRadius: "8px !important",
    "&:hover": {
      background: "rgba(28, 85, 160, 1) !important",
    },
    "@media (max-width: 900px)": {
      width: "209px",
      height: "46px",
      fontSize: "16px",
    },
  },
  evidencePanel: {
    marginTop: "28px",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 1)",
    boxShadow: "0px 10px 30px rgba(16, 24, 40, 0.08)",
    overflow: "hidden",
  },
  evidencePanelInner: {
    padding: "24px",
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    "@media (max-width: 900px)": {
      flexDirection: "column",
      padding: "20px",
    },
    // Surface Pro 7 / large tablets (portrait): stack panels so Inclusion/Exclusion doesn't get squeezed.
    "@media (min-width: 900px) and (max-width: 1100px) and (min-height: 1200px)": {
      flexDirection: "column",
    },
  },
  evidenceLeft: {
    flex: 1,
    minWidth: 0,
  },
  evidenceRight: {
    flex: "0 0 464px",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    "@media (max-width: 900px)": {
      flex: "1 1 auto",
      alignItems: "flex-start",
    },
    "@media (min-width: 900px) and (max-width: 1100px) and (min-height: 1200px)": {
      flex: "1 1 auto",
      alignItems: "flex-start",
    },
  },
  evidenceTitle: {
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    fontSize: "32px !important",
    color: "rgba(0, 0, 0, 0.8)",
    lineHeight: "120% !important",
    textAlign: "left",
  },
  evidenceSubtitle: {
    marginTop: "14px !important",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "16px !important",
    color: "rgba(0, 0, 0, 0.6)",
    lineHeight: "22px !important",
    textAlign: "left",
  },
  evidenceCriteria: {
    marginTop: "18px",
    display: "flex",
    gap: "16px",
    borderRadius: "5px",
    // border: "1px solid rgba(0,0,0,0.06)",
    overflow: "hidden",
    background: "white",
    minHeight: "188px",
    "@media (max-width: 600px)": {
      display: "none",
    },
  },
  evidenceCriteriaCol: {
    flex: 1,
    padding: "14px 16px",
    position: "relative",
    // border: "1px solid rgba(240, 249, 244, 1)",
    borderRadius: "5px",
  },
  evidenceCriteriaDivider: {
    display: "none",
    width: "1px",
    background: "rgba(0,0,0,0.06)",
    "@media (max-width: 600px)": {
      width: "100%",
      height: "1px",
    },
  },
evidenceCursor: {
  position: "absolute",
  left: "59px",
  top: "18px",

  width: "32px",
  height: "32px",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.18))",

  pointerEvents: "none",
  zIndex: 2,
},
  evidenceMiniHeading: {
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    fontSize: "13.12px !important",
    color: "rgba(0, 0, 0, 0.8)",
    textTransform: "capitalize",
    textAlign: "left",
  },
  evidenceMiniDivider: {
    margin: "10px 0 16px 0",
    borderColor: "rgba(0,0,0,0.06)",
  },
  evidenceList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "10px",
  },
  evidenceListItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "12.24px !important",
    color: "rgba(0,0,0,0.6)",
  },
  evidenceIconOk: {
    width: "15.74px",
    height: "15.74px",
    borderRadius: "999px",
    background: "rgba(34, 154, 94, 0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  evidenceIconNo: {
    width: "15.74px",
    height: "15.74px",
    borderRadius: "999px",
    background: "rgba(239, 68, 68, 0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  evidenceHoverPill: {
    background: "rgba(0, 0, 0, 0.08)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  traceCard: {
    width: "464px",
    height: "auto",
    minHeight: "300px",
    borderRadius: "6px",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    background: "#fff",
    padding: "0 24px",
    // padding: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0px 4px 10px rgba(130, 143, 169, 0.15)",
    "@media (max-width: 900px)": {
      width: "100%",
      maxWidth: "464px",
    },
    "@media (max-width: 600px)": {
      maxWidth: "100%",
      borderRadius: "10px",
      padding: "0 16px",
    },
  },
  traceHeader: {
    padding: "16px 0 12px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  traceHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  traceHeaderTitle: {
    fontFamily: "Rubik !important",
    fontWeight: "600 !important",
    fontSize: "14px !important",
    color: "rgba(0,0,0,0.8)",
  },
  confidenceWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerDivider: {
    margin: "0 0 14px 0",
    borderColor: "rgba(0,0,0,0.08)",
  },
  confidenceLabel: {
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "12px !important",
    color: "rgba(0,0,0,0.55)",
  },
  highlightedQuote: {
    margin: "10px 0px 15px 0px !important",
    borderLeft: "4px solid rgba(253, 190, 0, 1)",
    background: "rgba(254, 251, 230, 1)",
    padding: "14px 14px",
    borderRadius: "0px",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "14px !important",
    color: "rgba(0,0,0,0.7)",
    lineHeight: "20px !important",
    textAlign: "left",
  },
  highlightMark: {
    background: "rgba(245, 179, 1, 0.35)",
    padding: "0 3px",
    // borderRadius: "4px",
    // border: "1px solid rgba(245, 179, 1, 0.25)",
  },
  traceMetaLabel: {
    marginTop: "14px",
    padding: "0 18px",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "12px !important",
    color: "rgba(0,0,0,0.4)",
    textAlign: "left",
  },
  traceBody: {
    marginTop: "4px",
    marginBottom: "16px !important",
    padding: "0 18px",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "14px !important",
    color: "rgba(0, 0, 0, 0.6)",
    lineHeight: "20px !important",
    textAlign: "left",
  },
  traceSource: {
    // marginTop: "20px",
    marginBottom: "15px !important",
    padding: "0 18px",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "12px !important",
    color: "rgba(0,0,0,0.4)",
    textAlign: "left",
  },
  traceLink: {
    color: "rgba(38, 102, 190, 1)",
    // textDecoration: "underline",
  },
  traceDivider: {
    marginTop: "8px",
    marginBottom: "4px",
    // marginLeft: "18px",
    // marginRight: "18px",
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderWidth: "1px",
  },
  traceFooter: {
    padding: "8px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontFamily: "Rubik !important",
    fontWeight: "400 !important",
    fontSize: "12px !important",
    color: "rgba(0, 0, 0, 0.4)",
    width: "100%",
    "& > span:first-child": {
      flex: 1,
      textAlign: "left",
    },
    "& > span:last-child": {
      flex: 1,
      textAlign: "right",
    },
    "@media (max-width: 600px)": {
      alignItems: "flex-start",
    },
  },
}));
