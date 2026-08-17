import { makeStyles } from "@mui/styles"

  export const analyticStyles = makeStyles(() => ({
  analyticsTab: {
    minHeight: 32,
    padding: "8px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    boxShadow: "none",
    position: "relative",
    zIndex: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottom: "3px solid transparent",
    transition: "background 120ms ease, box-shadow 120ms ease",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.5)",
      boxShadow: "0px 2px 6px rgba(38,102,190,0.18)",
      zIndex: 2,
    },
    "&:hover $analyticsTabLabel": {
      color: "#2666BE",
      fontWeight: 500,
    },
  },

  analyticsTabActive: {
    background: "#DCE9FC",
    borderBottomColor: "#2666BE",
    zIndex: 1,
  },

  analyticsTabDisabled: {
    opacity: 0.4,
    pointerEvents: "none",
  },

  analyticsTabLabel: {
    fontFamily: "Rubik",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 400,
    color: "rgba(0,0,0,0.7)",
    whiteSpace: "nowrap",
    transition: "color 120ms ease",
  },

  analyticsTabLabelActive: {
    fontWeight: 500,
    color: "#2666BE",
  },

  skeletonWrapper: {
    display: "grid",
    gridTemplateColumns: "3fr 1fr",
    gap: "24px",
    width: "100%",
    marginTop: "15px"
  },

  chartCard2: {
    background: "#fff",
    border: "1px solid #e6eaf0",
    borderRadius: "12px",
    padding: "20px",
    minHeight: "464px",
  },

  filterCard: {
    background: "#fff",
    border: "1px solid #e6eaf0",
    borderRadius: "12px",
    minHeight: "464px",
    overflow: "hidden",
  },

  chartTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },

  chartTopRow2: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
  },

  skeletonTitle: {
    height: "38px",
    width: "52%",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  skeletonBadge: {
    height: "44px",
    width: "98px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  skeletonChartArea: {
    position: "relative",
    height: "340px",
    padding: "20px 10px 40px 48px",
  },

  skeletonYAxisLabel: {
    position: "absolute",
    left: "-8px",
    top: "45%",
    width: "60px",
    height: "14px",
    borderRadius: "6px",
    transform: "rotate(-90deg)",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  skeletonGrid: {
    height: "100%",
    borderLeft: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    padding: "0 8px",
    position: "relative",
    backgroundImage:
      "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to top, rgba(0,0,0,0.05) 1px, transparent 1px)",
    backgroundSize: "67px 100%, 100% 93px",
  },

  skeletonBarGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    width: "42px",
    height: "100%",
  },

  skeletonBar: {
    width: "24px",
    borderRadius: "6px 6px 0 0",
    background: "linear-gradient(90deg, #dfe5ea 25%, #f2f4f7 37%, #dfe5ea 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  skeletonXAxisLabel: {
    width: "32px",
    height: "12px",
    borderRadius: "4px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  skeletonXAxisTitle: {
    position: "absolute",
    bottom: "0",
    left: "50%",
    transform: "translateX(-50%)",
    width: "70px",
    height: "14px",
    borderRadius: "6px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  filterHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px",
    borderBottom: "1px solid #edf0f4",
  },

  skeletonToggle: {
    width: "54px",
    height: "30px",
    borderRadius: "30px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  skeletonFilterTitle: {
    height: "28px",
    width: "220px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

  filterBody: {
    display: "grid",
    // gridTemplateColumns: "1fr 1px 1fr",
    height: "calc(100% - 67px)",
    minHeight: "406px",
  },

  filterDivider: {
    background: "#edf0f4",
    width: "1px",
    height: "100%",
  },

  filterColumn: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "space-between"
  },

  skeletonCheckbox: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
    flexShrink: 0,
  },

  skeletonFilterText: {
    width: "230px",
    height: "18px",
    borderRadius: "6px",
    background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
    backgroundSize: "400% 100%",
    animation: "$shimmer 1.4s ease infinite",
  },

    skeletonFilterTextSmall: {
      width: "110px",
      height: "18px",
      borderRadius: "6px",
      background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
      backgroundSize: "400% 100%",
      animation: "$shimmer 1.4s ease infinite",
    },

    skeletonBubbleTitle: {
      height: 26,
      width: "220px",
      borderRadius: 8,
      background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
      backgroundSize: "400% 100%",
      animation: "$shimmer 1.4s ease infinite",
    },

    skeletonSelect: {
      height: 32,
      width: 96,
      borderRadius: 5,
      background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
      backgroundSize: "400% 100%",
      animation: "$shimmer 1.4s ease infinite",
    },

    skeletonTrialsPill: {
      height: 32,
      width: 110,
      borderRadius: 4,
      background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)",
      backgroundSize: "400% 100%",
      animation: "$shimmer 1.4s ease infinite",
    },

    skeletonScatterShell: {
      position: "absolute",
      inset: 0,
      padding: "12px 12px 18px 18px",
      boxSizing: "border-box",
    },

    skeletonScatterGrid: {
      position: "absolute",
      inset: "12px 12px 26px 40px",
      borderLeft: "1px solid #e5e7eb",
      borderBottom: "1px solid #e5e7eb",
      borderRadius: 6,
      backgroundImage:
        "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to top, rgba(0,0,0,0.05) 1px, transparent 1px)",
      backgroundSize: "64px 100%, 100% 70px",
    },

    skeletonScatterDot: {
      position: "absolute",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "linear-gradient(90deg, #dfe5ea 25%, #f2f4f7 37%, #dfe5ea 63%)",
      backgroundSize: "400% 100%",
      animation: "$shimmer 1.4s ease infinite",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    },

    "@keyframes shimmer": {
      "0%": {
        backgroundPosition: "100% 0",
      },
      "100%": {
        backgroundPosition: "-100% 0",
      },
    },
  trials_text: {
    width: "100%",
    minWidth: "70px",
    border: "1px solid rgba(220, 233, 252, 1)",
    background: "white",
    color: "rgba(38, 102, 190, 1)",
    height: "32px ",
    borderRadius: "4px",
    alignItems: "center",
    fontSize: "12px",
    fontFamily: "Rubik",
    fontWeight: "500",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    padding: "0 6px",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer"
  },
  treatment_select: {
    height: 32,
    minWidth: 96,
    borderRadius: "5px",
    backgroundColor: "transparent",
    fontFamily: "Rubik !important",
    fontSize: "14px !important",
    color: "rgba(0, 0, 0, 0.8)",

    "& .MuiOutlinedInput-notchedOutline": {
      borderWidth: 1,
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#60545C !important",
    },

    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      padding: "6px 36px 6px 10px !important",
    },

    "& .MuiSelect-icon": {
      right: 10,
      color: "rgba(0,0,0,0.6)",
      fontSize: 22,
    },
  },
  treatment_select_menu: {
    fontFamily: "Rubik",
    fontSize: "14px !important",
    color: "rgba(0,0,0,0.)",
  },
  analytics_header_tab: {
    width: "100% !important",
    background: "#FFFFFF !important",
    borderRadius: "4px !important",
    display: "flex !important",
    flexDirection: "column !important",
    justifyContent: "center !important",
    alignItems: "flex-start !important",
    gap: "10% !important",
    padding: "5% !important",
    boxShadow: "1.5px 1.5px 20.51px 0px #B7C0D026 !important",
  },

  anaytics_header_title: {
    color: "var(--Black-700, rgba(0, 0, 0, 0.7)) !important",
    fontWeight: "600 !important",
    fontSize: "14px !important",
    display: "flex !important",
    alignItems: "center !important",
    gap: "3px !important",
    fontFamily: "Rubik !important",
  },

  search_box: {
    display: "flex",
    justifyContent: "end",
    gap: "7px",
    borderRadius: "6px",
    textTransform: "capitalize",
    width: "33%"
  }
  ,
  download_btn: {
    color: "#2666BE !important",
    fontWeight: "500 !important",
    textTransform: "capitalize !important",
    border: "2px solid #2666BE !important",
    gap: "5px !important",
    height: "37px !important",
    fontFamily: "rubik !important"
  }
  ,
  root: {
    background: "transparent",
    fontFamily: "Rubik",
    marginTop: -40,
  },

  container: {
    width: "100%",
    padding: "2%",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  filterRow2: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  filterLeft: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  tabContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  tabSwitch: {
    display: "flex",
    border: "1.5px solid rgba(184, 212, 249, 1)",
    borderRadius: 8,
    overflow: "hidden",
    height: 36,
    background: "#F3F6FB",
  },

  tabItem: {
    padding: "0 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Rubik",
    fontSize: 14,
    cursor: "pointer",
    "&:not(:last-child)": {
      borderRight: "1px solid #9DB7E5",
    },
  },
  tabActive: {
    background: "rgba(38, 102, 190, 1)",
    color: "#fff",
    fontWeight: 500,
  },
  tabInactive: {
    background: "white",
    color: "#444",
    fontWeight: 400,
  },

  chartRow: {
    display: "flex",
    gap: 16,
    marginTop: 12,
  },
  skeletonTitle: {
    height: "20px",
    width: "40%",
    background: "#e0e0e0",
    borderRadius: "4px",
  },

  skeletonSubTitle: {
    height: "14px",
    width: "60%",
    background: "#e0e0e0",
    borderRadius: "4px",
  },

  skeletonChart: {
    background: "#e0e0e0",
    borderRadius: "8px",
  },

  skeletonLine: {
    background: "#e0e0e0",
    borderRadius: "4px",
  },
  chartCard: {
    flex: 1,
    height: 469,
    background: "#fff",
    border: "2px solid rgba(0,0,0,0.05)",
    borderRadius: 6,
    boxShadow: "2px 2px 10px rgba(183,192,208,0.05)",
    padding: 8,
    display: "flex",
    flexDirection: "column",
  },

  chartHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
  },

  chartTitle: {
    fontSize: 23,
    fontWeight: 500,
    color: "rgba(0,0,0,0.8)",
    fontFamily: "Rubik",
  },

  trialsButtonWrapper: {
    marginLeft: "auto",
    paddingRight: 20,
  },

  rightPanelWrapper: {
    position: "relative",
  },

  rightPanelCard: {
    width: 312,
    height: 469,
    background: "#fff",
    border: "2px solid rgba(0,0,0,0.05)",
    borderRadius: 6,
    boxShadow: "2px 2px 10px rgba(183,192,208,0.05)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
  },

  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottom: "1px solid rgba(240, 246, 254, 1)",
    marginLeft: -12,
    marginRight: -12,
    paddingLeft: 12,
    paddingRight: 12,
  },

  toggleSwitch: {
    width: 38,
    height: 22,
    borderRadius: 20,
    position: "relative",
    cursor: "pointer",
    transition: "background 150ms ease",
  },
  toggleSwitchOn: {
    background: "#2563EB",
  },

  toggleSwitchOff: {
    background: "#ebe5e5ff",
  },

  toggleKnob: {
    width: 18,
    height: 18,
    background: "#fff",
    borderRadius: "50%",
    position: "absolute",
    top: 2,
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "left 150ms ease",
  },
  toggleKnobOn: {
    left: 18,
  },

  toggleKnobOff: {
    left: 2,
  },

  toggleLabel: {
    fontSize: 16,
    fontWeight: 500,
    fontFamily: "Rubik",
    color: "rgba(0, 0, 0, 0.8)",
  },

  regimenComplexityHeader: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottom: "1px solid rgba(240, 246, 254, 1)",
    marginLeft: -12,
    marginRight: -12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  regimenComplexityTitle: {
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "Rubik",
    color: "rgba(0, 0, 0, 0.8)",
    marginBottom: 10,
  },
  regimenComplexityOptions: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    padding: "10px 12px",
  },
  regimenComplexityOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    userSelect: "none",
    fontFamily: "Rubik",
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
  },
  regimenComplexityBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  regimenComplexityLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(0,0,0,0.55)",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    position: "relative",
    cursor: "pointer",
    fontFamily: "Rubik",
    fontSize: 14,
    fontWeight: 400,
    color: "rgba(0,0,0,0.6)",
    userSelect: "none",
    "&:hover": {
      color: "rgba(0,0,0,0.6)",
    },
  },

  checkboxBox: {
    width: "13.5px",
    height: "13.5px",
    minWidth: "13.5px",
    minHeight: "13.5px",
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    transition: "all 200ms ease",
  },

  checkboxChecked: {
    backgroundColor: "#2563EB",
    "&:hover": {
      backgroundColor: "#2563EB",
    }
  },

  checkboxUnchecked: {
    backgroundColor: "#fff",
  },

  regimenContainer: {
    border: "1px solid rgba(240, 246, 254, 1)",
    borderRadius: 1,
    background: "#fff",
    height: 389,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  regimenItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    position: "relative",
    fontFamily: "Rubik",
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.6)",
    cursor: "pointer",
    borderBottom: "1px solid rgba(240,246,254,1)",
    userSelect: "none",
    fontWeight: 400,
    transition: "all 0.2s ease", // Smooth transition for background and color
    
    // 1. Row Hover Effect
    "&:hover": {
      backgroundColor: "rgba(240, 246, 254, 0.5)", // Very light blue background
      color: "rgba(0, 0, 0, 0.6)", // Keep text color same on hover
    },

  },
  regimenItemLast: {
    borderBottom: "none",
  },

  regimencheckboxBox: {
    width: 12,
    height: 12,
    minWidth: 12,
    minHeight: 12,
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    transition: "all 120ms ease",
    flexShrink: 0,
  },

  regimencheckboxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB", // Ensure border matches the fill
    "&:hover": {
      backgroundColor: "#2563EB",
    }
  },

  regimencheckboxUnchecked: {
    backgroundColor: "#fff",
  },
  noRegimens: {
    padding: "12px",
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Rubik",
  },

  bubbleChartContainer: {
    width: "100%",
    padding: "0% 2%",
  },

  bubbleRow: {
    display: "flex",
    gap: 16,
  },

  bubbleCard: {
    flex: 1,
    height: 469,
    background: "#fff",
    border: "2px solid rgba(0,0,0,0.05)",
    borderRadius: 6,
    boxShadow: "2px 2px 10px rgba(183,192,208,0.05)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    "& .recharts-wrapper:focus": {
      outline: "none",
    },
    "& .recharts-surface:focus": {
      outline: "none",
    },
    "& .recharts-layer recharts-scatter-symbol": {
      outline: "none",
    },
    "& .recharts": {
      outline: "none",
    }
  },

  bubbleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  bubbleTitle: {
    fontWeight: 500,
    fontSize: 23,
    marginBottom: 0,
    fontFamily: "Rubik",
    color: "rgba(0, 0, 0, 0.8)",
  },
  bubbleChartFilterRow: {
    display: "flex",
    gap: 8,
    paddingRight: 24,
  },

}))
export const styles = {
  container: {
    fontFamily: "Rubik",
    background: "#fff",
    position: "relative",
  },
  tableLayout: {
    display: "grid",
    gridTemplateColumns: "360px 1px 1fr",
    width: "100%",
  },



  leftColumn: {
    display: "flex",
    flexDirection: "column",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
  },
  fullHeightDivider: {
    position: "absolute",
    width: 1,
    left: "27%",
    backgroundColor: "rgba(0,0,0,0.1)",
    pointerEvents: "none",
  },
  metricsContainer: {
    borderLeft: "1px solid rgba(0,0,0,0.1)",
    paddingLeft: 16
  }
  ,

  fullDivider: {
    width: "1px",
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  row: {
    padding: "15px 20px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 5,
    alignItems: "center"
  },
  title: {
    fontSize: 17,
    fontWeight: 500,
    display: "flex",
    fontFamily: "Rubik",
    gap: 6,
    height: "31px"
  },
  summaryRow: {
    background: "#EAF3FF",
    padding: "12px 26px",
    fontSize: 14,
    color: "rgba(0,0,0,0.8)",
    borderTop: "1px solid rgba(0,0,0,0.1)",
  },
  regimenCount: {
    fontWeight: 500,
    fontSize: 14,
    color: "rgba(38, 102, 190, 1)",
    fontFamily: "Rubik",
  },
  regimenText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 400,
    color: "rgba(38, 102, 190, 1)",
    fontFamily: "Rubik",
  },

  count: {
    color: "rgba(28, 77, 142, 1)",
    fontWeight: 600,
    fontFamily: "Rubik",
    fontSize: "23px"
  },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  toggle: {
    display: "flex",
    border: "1px solid #B8D4F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  armBlock: {
    display: "flex",
    flexDirection: "column",
    background: "#EEF4FBFE",
  },

  summaryTitle: {
    fontWeight: 600,
    marginBottom: 6,
  },

  toggleBtn: {
    padding: "6px 10px",
    fontSize: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  toggleActive: {
    background: "#2666BE",
    color: "#fff",
  },
  filter: {
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 4,
    padding: "6px 8px",
    fontSize: 12,
    color: "rgba(0,0,0,0.7)",
  },
  download: {
    border: "1px solid #2666BE",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 14,
    color: "#2666BE",
    fontWeight: 500,
  },
  card: {
    border: "2px solid rgba(0, 0, 0, 0.05)",
    borderRadius: 4,
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 26px",
    background: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.8)",
    fontFamily: "Rubik",
    whiteSpace: "normal",      // Key to allow wrapping
    wordBreak: "break-word",   // Forces break if a single word is too long
    flex: "1 1 auto",          // Allows the title to grow and shrink
    marginRight: "10px",       // Prevents title from touching the "N" column
    lineHeight: "1.2",
    overflowWrap: "anywhere",
  },
  armsCount: {
    fontWeight: 500,
    fontSize: 14,
    color: "rgba(38, 102, 190, 1)",
    fontFamily: "Rubik",
  },
  link: {
    fontSize: 14,
    color: "rgba(38, 102, 190, 1)",
    fontWeight: 400,
    cursor: "pointer",
    fontFamily: "Rubik",
  },
  summ: {
    fontSize: 14,
    color: "rgba(38, 102, 190, 1)",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Rubik",
    marginTop: 10,
  },
  metricsRow: {
    display: "flex",
    gap: 2,
    alignItems: "flex-end",
    flexWrap: "nowrap",
  },
  metricCol: {
    width: 100,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 4,
  },

  metricValue: {
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    marginTop: 0,
  },
  metricLabel: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    fontFamily: "Rubik",
    minHeight: 18,
    lineHeight: "18px",
  },

  regimen: {
    background: "#F0F6FE",
    borderTop: "1px solid rgba(0,0,0,0.05)",
  },
  regimenHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 26px",
  },
  regimenTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(0, 0, 0, 0.7)",
    fontFamily: "Rubik",
     whiteSpace: "normal",      // Key to allow wrapping
    wordBreak: "break-word",   // Forces break if a single word is too long
    flex: "1 1 auto",          // Allows the title to grow and shrink
    marginRight: "20px",       // Prevents title from touching the "N" column
    lineHeight: "1.2",
    marginBottom: 8,
  },
  infoRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  /* Divider */
  verticalDivider: {
    width: "1px",
    height: "14px",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  percentValue: {
    fontWeight: 500,
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.7)",
    fontFamily: "Rubik",
  },

  subInfo: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    fontFamily: "Rubik",
  },
  arm: {
    display: "flex",
    alignItems: "flex-start",
    // gap: 24,
    padding: "15px 26px",
    background: "rgba(232, 239, 249, 1)",
    // borderTop: "1px solid rgba(0,0,0,0.1)",


  },
  cutDivider: {
    height: 1,
    background: "rgba(0, 0, 0, 0.1)",
    marginLeft: 0,
    // marginBottom: 12
  }
  ,
  armInfo: {
    width: 300,
    maxWidth: 300,
    flexShrink: 1, // ✅ allow shrink
    overflow: "hidden",
  },
  armTitle: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "Rubik",
    color: "rgba(0, 0, 0, 0.7)",
    marginBottom: 10,
  },
  armDesc: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    margin: "0 0 12px",
    fontFamily: "Rubik",
    lineHeight: "20px",

    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 5, // 2 lines only
    overflow: "hidden",

    wordBreak: "break-word",
  },
  download: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 32,
    padding: "0 12px 0 8px",
    border: "1px solid #2563EB",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#2563EB",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "Rubik",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  expandRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    userSelect: "none",
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    zIndex: 999,
  },

  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "54vw", // half page
    // maxWidth: 750,
    // minWidth: 420,
    height: "100%",
    background: "#fff",
    boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    animation: "slideIn 0.25s ease-out",
  },

  drawerHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  drawerTitle: {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "Rubik",
  },

  drawerClose: {
    cursor: "pointer",
    fontSize: 18,
    color: "rgba(0,0,0,0.6)",
  },

  drawerBody: {
    padding: 20,
    overflowY: "auto",
  },

  drawerRow: {
    marginBottom: 12,
  },

  drawerKey: {
    fontSize: 13,
    color: "rgba(0,0,0,0.6)",
    marginBottom: 2,
  },

  drawerValue: {
    fontSize: 14,
    color: "rgba(0,0,0,0.85)",
  },
};



export const fea_styles = makeStyles(() => ({
  page: {
    background: "transparent",
    fontFamily: "Rubik",
    width: "100%",
    padding: "2%",
  },
  root: {
    background: "transparent",
    fontFamily: "Rubik",
  },

  container: {
    // Match NewTreatment page spacing: fixed 16px padding + 12px gap between
    // the top filter bar and the first card (was padding: "2%" with no gap).
    width: "100%",
    padding: 16,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trialsButtonWrapper: {
    marginLeft: "auto",
  },

  filterRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // match NewTreatment's TopFilterBar (padding: "4px 0") so the filter bar
    // sits at the same vertical position when switching between tabs
    padding: "4px 0",
  },

  filterLeft: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  filterPanel: {
    width: "220px",
    height: "312px",
    background: "#fff",
    borderRadius: "4px",
    border: "1px solid rgba(240,246,254,1)",
    padding: "16px",
    boxShadow: "1px 8px 34px rgba(153,169,190,0.1)",
    display: "flex",
    flexDirection: "column",
  }
  ,
  trials_text: {
    width: "100%",
    minWidth: "70px",
    border: "1px solid rgba(220, 233, 252, 1)",
    background: "white",
    color: "rgba(38, 102, 190, 1)",
    height: "32px ",
    borderRadius: "4px",
    alignItems: "center",
    fontSize: "12px",
    fontFamily: "Rubik",
    fontWeight: "500",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    padding: "0 6px",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer"
  },
  chartRow: {
    display: "flex",
    gap: 20,
    // was marginTop: 20 — removed so the gap below the top filter bar is driven
    // solely by the container's 12px gap (matches the NewTreatment page).
  },

  chartContainer: {
    flex: 1,
    height: 383,
    position: "relative",
  },
  filterPanel: {
    width: 217,
    height: 469,
    background: "#fff",
    border: "1px solid rgba(240,246,254,1)",
    borderRadius: 4,
    padding: 16,
    boxShadow: "1px 8px 34px rgba(153,169,190,0.1)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 500,
    fontFamily: "Rubik",
    color: "rgba(0,0,0,0.8)",
    marginBottom: 6
  },
  countryLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 0",
    fontSize: 14,
    fontFamily: "Rubik",
    color: "rgba(0,0,0,0.6)",
    cursor: "pointer",
    "& input[type='checkbox']": {
      accentColor: "rgba(25, 118, 210, 1)",
    },
  },

  countryDivider: {
    border: "1px solid rgba(240, 246, 254, 1)",
  },
  countrySearch: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid rgba(220, 233, 252, 1)",
    borderRadius: 4,
    padding: "5px 8px",
    marginBottom: 10,
    background: "rgba(248, 251, 255, 1)",
    "& input": {
      border: "none",
      outline: "none",
      background: "transparent",
      fontSize: 12,
      fontFamily: "Rubik",
      color: "rgba(0,0,0,0.7)",
      width: "100%",
      "::placeholder": {
        color: "rgba(0,0,0,0.35)",
      },
    },
    "& svg": {
      flexShrink: 0,
      color: "rgba(0,0,0,0.35)",
    },
  },
  filterItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: 12,
    fontFamily: "Rubik",
    color: "rgba(0,0,0,0.7)",
    cursor: "pointer"
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    display: "inline-block"
  }
  ,
  toggleBtn: {
    padding: "6px 10px",
    fontSize: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    padding: "6px 0",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "Rubik",
    color: "rgba(0, 0, 0, 0.6)",
  },
  leftSection: {
    flex: 1,
    width: "100%",
    minWidth: 0,
  },

  headerCard: {
    background: "white",
    padding: 16,
    borderRadius: 4,
    boxShadow: "2px 2px 10px rgba(183,191,208,0.05)",
    border: "1px solid rgba(0,0,0,0.1)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  download: {
    border: "1px solid #2666BE",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 14,
    color: "#2666BE",
    fontWeight: 500,
  },
  itemStyle: {
    borderWidth: 1.2,
  },
  emphasis: {
    itemStyle: {
      borderWidth: 1.4,
    },
  },
  legend: {
    width: 217,
    height: 352,
    background: "#FFFFFF",
    border: "1px solid rgba(240,246,254,1)",
    borderRadius: 4,
    boxShadow: "1px 8px 34px rgba(153,169,190,0.1)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    flex: "0 0 217px",
    flexShrink: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  legendHeader: {
    width: "calc(100% + 32px)",   // 16px left + 16px right padding compensation
    marginLeft: -16,
    marginRight: -16,
    padding: "0 16px 8px 16px",
    marginBottom: -8,
    borderBottom: "1px solid rgba(240,246,254,1)",
    boxSizing: "border-box",
  },



  legendTitle: {
    fontFamily: "Rubik",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "20px",
    color: "rgba(0,0,0,0.8)",
  },

  legendBody: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
  },

  gradient: {
    width: 51,
    height: 284,
    borderRadius: 2,
    background:
      "linear-gradient(180deg, rgba(145,52,52,1) 0%, rgba(227,204,204,1) 100%)",
  },
  treatment_select: {
    height: 32,
    minWidth: 96,
    borderRadius: "5px",
    backgroundColor: "transparent",
    fontFamily: "Rubik !important",
    fontSize: "14px !important",
    color: "rgba(0, 0, 0, 0.8)",

    "& .MuiOutlinedInput-notchedOutline": {
      borderWidth: 1,
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#60545C !important",
    },

    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      padding: "6px 36px 6px 10px !important",
    },

    "& .MuiSelect-icon": {
      right: 10,
      color: "rgba(0,0,0,0.6)",
      fontSize: 22,
    },
  },

  phaseMenu: {
    position: "absolute",
    top: 34,
    right: 0,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 4,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    zIndex: 999999,
    minWidth: 90,
  },
  phaseOption: {
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  scale: {
    height: 284,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 6,   // 👈 pushes "50" up inside the card
    fontFamily: "Rubik",
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
  }
  ,

  title: {
    fontSize: 27,
    fontWeight: 500,
    color: "rgba(0,0,0,0.8)",
    marginBottom: 14,
    lineHeight: "24px",
    fontFamily: "Rubik",
  },

  controls: {
    display: "flex",
    gap: 16,
  },

  toggle: {
    display: "flex",
    border: "1px solid #B8D4F9",
    borderRadius: 4,
    overflow: "hidden",
  },

  toggleActive: {
    background: "#2666BE",
    color: "rgba(255, 255, 255, 1)",
    padding: "6px 12px",
    fontSize: 12,
    fontFamily: "Rubik",
    lineHeight: "24px",
  },

  toggleInactive: {
    padding: "6px 12px",
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: 12,
    fontFamily: "Rubik",
    lineHeight: "24px",
  },

  dropdown: {
    border: "1px solid rgba(0,0,0,0.2)",
    padding: "6px 10px",
    borderRadius: 4,
    fontSize: 12,
  },

  card: {
    background: "white",
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    border: "1px solid rgba(220, 233, 252, 1)",
    boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
    width: "100%",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 23,
    fontWeight: 500,
    fontFamily: "Rubik",
    color: "rgba(0, 0, 0, 0.8)",
  },

  trials: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    padding: "0 8px",
    gap: 8,
    background: "white",
    border: "1px solid rgba(220, 233, 252, 1)",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(38, 102, 190, 1)",
  },

  rightControls: {
    display: "flex",
    gap: 10,
  },

  dropdownSmall: {
    display: "inline-flex",
    alignItems: "center",
    height: 32,
    paddingLeft: 8,
    paddingRight: 4,
    gap: 6,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "Rubik",
    position: "relative",
    cursor: "pointer",
  },

  phaseBadge: {
    background: "#C7DFFF",
    padding: "1px 6px",
    borderRadius: 4,
    marginLeft: 0,
  },

  rangeRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
  },
  contentRow: {
    marginTop: 10,
    display: "flex",
    alignItems: "flex-start",   // ⭐ important change
    gap: 24,
    flexWrap: "wrap",
  }
  ,
  country: {
    width: 120,
    fontSize: 12,
    color: "rgba(0,0,0,0.7)",
  },

  rangeTrack: {
    flex: 1,
    height: 10,
    background: "#eef3fb",
    borderRadius: 5,
    position: "relative",
  },

  rangeBar: {
    position: "absolute",
    top: 0,
    height: "100%",
    background: "#2F80ED",
    borderRadius: 5,
  },
}))
