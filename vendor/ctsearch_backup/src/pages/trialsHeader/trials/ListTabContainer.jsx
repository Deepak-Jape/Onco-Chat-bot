/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams, Link, useLocation } from "react-router-dom";
import TrialSkeleton from "./CardSkeleton";
import RightCardSkeleton from "./RightCardSkeleton";
import Trialcardlist from "../../../common/Trialcardlist";
import CommonTabs from "../../../common/Tabs";
import ResultsTab from "./ResultsTab";
import StudyDetailsTab from "./StudyDetailsTab";
import FilterChipsHeader from "../../../common/FilterChipsHeader";
import { fetchCards } from "../../../redux/trialsDataSlice";
import { getExecutiveSummaryById } from "../../../api/Profile";
import { trialStyles } from "./style";
import helpIcon from "../../../assets/icons/help.svg";
import { Switch, Box, Typography, FormControl, Select, MenuItem, Tooltip } from "@mui/material";
import { DownloadWhiteIcon } from "../../../assets";
import { toggleAlert } from "../../../redux/trialsSlice";
import Timeline from "./TimeLine";

import {
  apiPayloadInterventionType,
  homepageTabs,
  prepareEligibilityRows,
  getStatusColor,
  getTraceability,
} from "../../../utils/helpers/helper";
import EvidenceHoverHeader from "./EvidenceHoverCell";
import { getSessionKeyFromSearchParams, getStoredFiltersForSession, setStoredFiltersForSession } from "../../../utils/trialsUrlState";
import { exportExecutiveSummaryPdf } from "../../../utils/pdfExport";
// TEMPORARY LOCAL OVERRIDE (disabled) — executive summary was served from _.json
// for a hardcoded OncoSuite id. Now every id goes through the API.
// To re-enable: uncomment the import and the map below, plus the
// EXEC_SUMMARY_LOCAL_OVERRIDES lookup in handelGetCardDetails.
// import execSummaryLocalWD7 from "../analytics/_.json";
// const EXEC_SUMMARY_LOCAL_OVERRIDES = {
//   "wD7-VqO-nZf": execSummaryLocalWD7,
// };

const SitesCard = ({ siteSummary, siteSummaryValue, siteSummaryDisplayValue, getEv }) => {
  const [expanded, setExpanded] = React.useState(false);

  const contentRef = React.useRef(null);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Check if content overflows 2 lines (line-height ~20px * 2 = 40px)
    setHasOverflow(el.scrollHeight > 44);
  }, [siteSummaryValue]);

  const textStyle = {
    fontFamily: "Rubik",
    fontSize: "16px",
    color: "rgba(0,0,0,0.5)",
    lineHeight: "20px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: expanded ? "unset" : 2,
  };

  const stripCountryCode = (str) =>
    typeof str === "string" ? str.replace(/\s*\(\s*[A-Z]{2,4}\s*\)/g, "").trim() : str;

  const renderContent = () => {
    if (Array.isArray(siteSummaryValue)) {
      return siteSummaryValue.map((site, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span style={{ color: "rgba(0,0,0,0.3)" }}>, </span>}
          <span>{stripCountryCode(site?.value) || "N/A"}</span>
        </React.Fragment>
      ));
    }
    if (siteSummaryDisplayValue) {
      return <span>{stripCountryCode(siteSummaryDisplayValue)}</span>;
    }
    if (siteSummaryValue?.countries) {
      return <>Countries: <span>{stripCountryCode(siteSummaryValue.countries)}</span></>;
    }
    if (siteSummaryValue?.sites) {
      return <>Sites: <span>{stripCountryCode(siteSummaryValue.sites)}</span></>;
    }
    return null;
  };

  return (
    <div>
      <div ref={contentRef} style={textStyle}>
        {renderContent()}
      </div>
      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "4px",
            fontFamily: "Rubik",
            fontSize: "13px",
            fontWeight: 500,
            color: "rgba(38, 102, 190, 1)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {expanded ? "Show less" : "Show all"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(38, 102, 190, 1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Info icon shown after the (short) study title. On hover / tap / keyboard focus
// it reveals the original full-length title, with a one-click copy affordance.
const StudyTitleInfo = ({ originalTitle }) => {
  const [copied, setCopied] = React.useState(false);
  const copyTimerRef = React.useRef(null);

  React.useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(originalTitle);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <Tooltip
      placement="bottom-start"
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      title={
        <div
          style={{
            padding: "10px 12px",
            fontFamily: "Rubik, sans-serif",
            maxWidth: "440px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.45)",
              }}
            >
              Original title
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "Rubik",
                fontSize: "12px",
                fontWeight: 500,
                color: copied ? "rgba(22, 163, 74, 1)" : "rgba(38, 102, 190, 1)",
              }}
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(22,163,74,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              color: "rgba(0,0,0,0.8)",
            }}
          >
            {originalTitle}
          </div>
        </div>
      }
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: "white",
            boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.15)",
            borderRadius: "8px",
            padding: 0,
            maxWidth: "none",
          },
        },
      }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="Show original study title"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "6px",
          verticalAlign: "middle",
          cursor: "pointer",
          flexShrink: 0,
          position: "relative",
          top: "-1px",
          borderRadius: "50%",
          outlineOffset: "2px",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", transition: "opacity 150ms ease" }}
        >
          <circle cx="12" cy="12" r="9" stroke="rgba(38, 102, 190, 0.7)" strokeWidth="1.6" />
          <path d="M12 11v5" stroke="rgba(38, 102, 190, 0.9)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.1" fill="rgba(38, 102, 190, 0.9)" />
        </svg>
      </span>
    </Tooltip>
  );
};

const ListTabContainer = ({
  filters = {},
  counts = {},
  currentPage,
  setCurrentPage,
  activeTabTrial="Find",
  setListURL,
  set_session_key
}) => {
  // if(activeTabTrial !== 'Find') return;
  const [reservedHeaderHeight, setReservedHeaderHeight] = useState(0);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuCloseTimerRef = useRef(null);
  const [selectedSortOption, setSelectedSortOption] = useState("Best Match");
  const sortOptions = [
    "Best Match",
    "Newest",
    "Last Updated",
  ];
  const sortOptionToApiValue = {
    "Best Match": "best_search",
    "Newest": "newest",
    "Last Updated": "last_updated",
  };
  const DropdownChevron = (props) => (
    <svg
      {...props}
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 7.5L10 13L15.5 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="0" y="0" width="20" height="20" fill="transparent" />
    </svg>
  );

  const toDisplayTitleCase = (input) => {
    const text = String(input ?? "").trim();
    if (!text) return "";

    return text
      .split(/\s+/)
      .map((word) => {
        const raw = word.trim();
        if (!raw) return raw;

        if (raw.length > 1 && raw === raw.toUpperCase()) return raw; // acronyms (NSCLC)
        if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(raw)) return raw.toUpperCase(); // roman numerals
        if (/^\d/.test(raw)) return raw; // leading digit tokens (2L+)

        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      })
      .join(" ");
  };
  const classes = trialStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { oncosuite_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const fullReportRef = useRef(null); // Pure right panel ke liye
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [hoveredId, setHoveredId] = useState(false);

  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const { data: trials, loading, lastRequest, sessionKey } = useSelector((state) => state.cards);
  const { loadingTrials } = useSelector((state) => state.conditionData);

  const filterList = useSelector((state) => state.cards?.payload?.filterList);
  const showFilters = useSelector((state) => state.cards?.payload?.showFilters ?? true);

  const scrollRef = useRef(null);
  const stickyRef = useRef(null);
  const cardListRef = useRef(null);
  const actionBarRef = useRef(null);

  const [focusZone, setFocusZone] = useState('left'); // 'left' | 'right'

  // --- CRITICAL REFS FOR API CONTROL ---
  const isFirstLoad = useRef(true);
  const isHydrating = useRef(!!getSessionKeyFromSearchParams(searchParams));
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const lastSessionFetchRef = useRef({ sessionKey: "", page: 0, tick: "" });

  const [activeTab, setActiveTab] = useState("Study Details");
  const [isLoading, setIsLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedIdData, setSelectedIdData] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [downloadOpen, setDownloadOpen] = useState(null);
  const lastAppliedSessionKeyRef = useRef("");
  const summaryAbortControllerRef = useRef(null);
  // Maps canonical oncosuite_id → list card oncosuite_id so selection-sync
  // can recognise a canonical URL change without reverting to firstCard.
  const canonicalToListIdRef = useRef({});
  // Set to true when a filter fetch is dispatched; prevents the session-key
  // watcher from re-fetching with a stale session key and clearing selected state.
  const filterFetchActiveRef = useRef(false);
  // Set to true when filters are reset/removed so that when the next trial list
  // arrives we force-select the first card regardless of what is currently shown.
  const pendingFirstCardSelectRef = useRef(false);
  // Stores the oncosuite_id from the URL when a session-key fetch is triggered
  // (copy-paste / reload). After trials load the selection sync restores this card.
  const pendingUrlOncosuiteidRef = useRef(oncosuite_id || "");
  const prevLoadingRef = useRef(false);
  const [filterSessionKey, setFilterSessionKey] = React.useState("")

  useEffect(() => {
    if(activeTabTrial !== 'Find') return;
    if(focusZone == 'left' ) {
      cardListRef.current?.focus();
    } else {
      scrollRef.current?.focus();
    }
  }, [activeTabTrial])
  useEffect(() => {
    const headerEl = document.querySelector('[data-trials-header="true"]');
    if (!headerEl) return;

    const update = () => {
      const headerHeight = headerEl.offsetHeight || 0;
      // Reserve full header height so content doesn't get pushed below the fold when chip row appears.
      setReservedHeaderHeight(headerHeight);
    };
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(headerEl);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);
  const downloadCloseTimerRef = useRef(null);

  const [isResultDisabled, setIsResultDisabled] = useState(false);
  // 1. Ensure timelineArray is actually an array
  // 1. Safe assignment using optional chaining throughout

  // console.log("selectedIdData list tab container", selectedIdData);
  const timelineArray = Array.isArray(selectedIdData?.top_info?.value?.status?.timeline?.value)
    ? selectedIdData?.top_info?.value?.status?.timeline?.value // Added ?. here
    : [];

  const customOrder = [
    "Commencement",
    "First Submission",
    "Primary Completion",
    "Completion",
    "Results Published",
  ];

  // 2. Sort the array safely
  const sortedTimeline = [...timelineArray].sort((a, b) => {
    const indexA = customOrder.indexOf(a?.title);
    const indexB = customOrder.indexOf(b?.title);
    return indexA - indexB;
  });
  const totalPages = Math.ceil((trials?.total_found || 0) / 20) || 1;
  const formattedTrialCount = Number(trials?.total_found || 0).toLocaleString("en-US");
  // 1. FILTER RESET LOGIC - Only runs if NOT hydrating from a pasted URL
  // useEffect(() => {
  //   const currentFiltersStr = JSON.stringify(filters);
  //   if (!isFirstLoad.current && prevFiltersRef.current !== currentFiltersStr) {
  //     if (!isHydrating.current) {
  //       setCurrentPage(1);
  //       setSearchParams((prev) => {
  //         const p = new URLSearchParams(prev);
  //         p.set("page", 1);
  //         return p;
  //       }, { replace: true });
  //     }
  //   }
  //   prevFiltersRef.current = currentFiltersStr;
  // }, [filters, setCurrentPage, setSearchParams]);

  useEffect(() => {
    // Don't steal focus from the search bar while its suggestion dropdown is
    // open. Selecting an option refetches results and changes selectedCard,
    // which would otherwise yank focus to the card list mid-search and hand
    // the arrow keys to the page. The search owns the keyboard until closed.
    if (!window.__trialsSearchDropdownOpen) {
      cardListRef.current?.focus();
    }
    setShowStickyHeader(false);
  }, [selectedCard]);



  // Scroll selected card into view whenever selection changes
  useEffect(() => {
    if (!selectedCard || !cardListRef.current) return;
    const el = cardListRef.current.querySelector(`[data-card-id="${selectedCard.oncosuite_id}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedCard]);

  // Focus card list when search bar closes via Escape
  useEffect(() => {
    const handler = () => cardListRef.current?.focus();
    document.addEventListener('focusCardList', handler);
    return () => document.removeEventListener('focusCardList', handler);
  }, []);

  // ADD THIS BLOCK — after your existing cardListRef focus useEffect (~line 175)
useEffect(() => {
  const handleGlobalKeyDown = (e) => {
    // Don't hijack keys when user is typing in an input/select/textarea
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    // The search owns the keyboard while its suggestion dropdown is open —
    // don't steal arrow keys even if the input briefly lost focus after a
    // select. The user hands control back to the page by pressing Esc.
    if (window.__trialsSearchDropdownOpen) return;

    // Ctrl+J (Windows/Linux) or Cmd+J (Mac) to switch the tabs between Study Details/ Results
    if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
      e.preventDefault();
      setActiveTab(prev =>
        prev === 'Study Details' ? 'Results' : 'Study Details'
      );
      return;
    }


    const rightPanel = scrollRef.current; // your existing right panel ref
    const cards = trials?.data;

    switch (e.key) {
      // ── Switch focus zone RIGHT (→ arrow) ──────────────────────
      case 'ArrowRight':
        e.preventDefault();
        setFocusZone('right');
        scrollRef.current?.focus();
        break;

      // ── Switch focus zone LEFT (← arrow) ──────────────────────
      case 'ArrowLeft':
        e.preventDefault();
        setFocusZone('left');
        cardListRef.current?.focus();
        break;

      // ── ArrowDown: left = next card, right = scroll down ───────
      // case 'ArrowDown':
        // if (focusZone === 'right') {
        //   rightPanel?.scrollBy({ top: 120, behavior: 'smooth' });
        //   e.preventDefault();
        // }
        // left zone ArrowDown is already handled by cardListRef onKeyDown — no change needed
        // break;

      // ── ArrowUp: left = prev card, right = scroll up ────────────
      // case 'ArrowUp':
      //   if (focusZone === 'right') {
      //     e.preventDefault();
      //     rightPanel?.scrollBy({ top: -120, behavior: 'smooth' });
      //   }
      //   // left zone ArrowUp already handled by cardListRef onKeyDown
      //   break;

      // ── Space: only scroll right panel when in right zone ───────
      case ' ':
        if (focusZone === 'right') {
          e.preventDefault(); // prevents default page scroll
          rightPanel?.scrollBy({ top: 350, behavior: 'smooth' });
        }
        break;

      // ── Shift+Space: scroll right panel UP ──────────────────────
      case ' ':
        if (focusZone === 'right' && e.shiftKey) {
          e.preventDefault();
          rightPanel?.scrollBy({ top: -350, behavior: 'smooth' });
        }
        break;

      default:
        break;
    }
  };

  document.addEventListener('keydown', handleGlobalKeyDown);
  return () => document.removeEventListener('keydown', handleGlobalKeyDown);
}, [focusZone, trials]); // re-bind when focusZone or trials list changes

  useEffect(() => {
    return () => {
      if (downloadCloseTimerRef.current) {
        clearTimeout(downloadCloseTimerRef.current);
        downloadCloseTimerRef.current = null;
      }
    };
  }, []);

  const formatLabelValue = (value) => {
    if (!value) return "";

    // If the backend is returning an actual array object
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // If the backend is returning a stringified array like "['Single Cohort']"
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      try {
        // Clean up brackets, single/double quotes, and spaces
        return value
          .replace(/[\[\]']/g, "") // removes [, ], and '
          .split(",")
          .map(item => item.trim())
          .join("+ ");
      } catch (e) {
        return value;
      }
    }

    return value;
  };

  const getTopInfoValue = (field) => {
    const value = selectedIdData?.top_info?.value?.[field];
    return value && typeof value === "object" && !Array.isArray(value) && "value" in value
      ? value.value
      : value;
    
  };

  


  const getTopInfoData = (field) => {
    const value = selectedIdData?.top_info?.value?.[field];
    return value && typeof value === "object" && !Array.isArray(value) && "value" in value
      ? value
      : { value };
  };

  const formatCohortCountLabel = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return `${value} Cohorts`;
  };

  const ActionBar = ({ compact = false }) => {
    const [isCohortSelectOpen, setIsCohortSelectOpen] = useState(false);
    const [isPhaseSelectOpen, setIsPhaseSelectOpen] = useState(false);
    const downloadMenuId = compact ? "sticky" : "primary";

    if (Object.keys(selectedIdData || {}).length === 0) return null;

    const hasMultiplePhases =
      (selectedIdData?.phases || []).filter((phase) => phase?.title).length > 1;

    return (
      <div className="flex items-center gap-3">
        {/* <div
          className="relative inline-block"
          onMouseEnter={() => {
            if (downloadCloseTimerRef.current) {
              clearTimeout(downloadCloseTimerRef.current);
              downloadCloseTimerRef.current = null;
            }
            setDownloadOpen(downloadMenuId);
          }}
          onMouseLeave={() => {
            if (downloadCloseTimerRef.current) {
              clearTimeout(downloadCloseTimerRef.current);
            }
            downloadCloseTimerRef.current = setTimeout(() => {
              setDownloadOpen(null);
            }, 150);
          }}
        > */}
          {/* DOWNLOAD BUTTON */}
          {/* <button
            className="flex items-center justify-center gap-2 text-white rounded-md"
            style={{
              width: 170,
              height: 44,
              borderRadius: 6,
              paddingLeft: 10,
              paddingRight: 10,
              gap: 8,
              border: "1px solid rgba(0, 0, 0, 0.1)",
              background: "rgba(38, 102, 190, 1)",
              boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
              fontFamily: "Rubik",
              fontSize: 14,
              fontWeight: 600,
              flex: "0 0 auto",
            }}
          >
            <img
              src={DownloadWhiteIcon}
              style={{ width: 15, height: 15 }}
              alt="download icon"
            />
            <span className="font-semibold text-sm">Download</span>
          </button> */}

          {/* DROPDOWN MENU */}
          {/* {downloadOpen === downloadMenuId && (
            <div
              className="absolute left-0 mt-2 w-60 bg-white shadow-lg border rounded-lg p-2 z-50"
              onMouseEnter={() => {
                if (downloadCloseTimerRef.current) {
                  clearTimeout(downloadCloseTimerRef.current);
                  downloadCloseTimerRef.current = null;
                }
                setDownloadOpen(downloadMenuId);
              }}
              onMouseLeave={() => {
                if (downloadCloseTimerRef.current) {
                  clearTimeout(downloadCloseTimerRef.current);
                }
                downloadCloseTimerRef.current = setTimeout(() => {
                  setDownloadOpen(null);
                }, 150);
              }}
            >
              <p className="text-gray-400 text-xs px-2 mb-1">
                Available Documents
              </p>
              <ul className="text-sm">
                {defaultItems
                  .filter((item) => Boolean(processedData[item]))
                  .map((item, idx) => (
                    <li
                      key={idx}
                      className="px-2 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-gray-800"
                      onClick={() => handleDownload(processedData[item])}
                    >
                      {item}
                    </li>
                  ))}
                <li
                  onClick={() => handleDownload("Executive Summary")}
                  className="px-2 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-gray-800"
                >
                  Download Summary
                </li>
              </ul>
            </div>
          )} */}
        {/* </div> */}

        {/* NSCLC COHORT SELECT — only shown when there are multiple cohort options */}
        {(currentPhaseObj?.value || []).filter(c => c?.title).length > 1 && <div
          className="relative"
          style={{
            width: 170,
            height: 44,
            borderRadius: 6,
            border: "1px solid rgba(0, 0, 0, 0.1)",
            background: "rgba(255, 255, 255, 1)",
            boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
            flex: "0 0 auto",
          }}
        >
          {(() => {
            const normalizeLabel = (label) => {
              const raw = String(label ?? "");
              const fixedTypo = raw.replace(/cohot/gi, "cohort");
              const trimmed = fixedTypo.trim();
              const withoutSuffix = trimmed.replace(/\s+[A-Za-z]$/, "");
              return toDisplayTitleCase(withoutSuffix);
            };

            const buildSortedOptions = (rawOptions, selectedValue) => {
              const options = (rawOptions || [])
                .map((opt) => ({
                  value: opt?.title ?? "",
                  label: normalizeLabel(opt?.title),
                }))
                .filter((opt) => opt.value);
              const uniqueOptions = [
                ...options
                  .reduce((acc, opt) => {
                    const key = opt.label.trim().toLowerCase();
                    if (!acc.has(key) || opt.value === selectedValue) {
                      acc.set(key, opt);
                    }
                    return acc;
                  }, new Map())
                  .values(),
              ];

              const sorted = [...uniqueOptions].sort((a, b) =>
                a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
              );

              const selected =
                sorted.find((o) => o.value === selectedValue) ||
                (sorted.length === 1 ? sorted[0] : null);
              return { selected, all: sorted };
            };

            const menuProps = {
              anchorOrigin: {
                vertical: "bottom",
                horizontal: "left",
              },
              transformOrigin: {
                vertical: "top",
                horizontal: "left",
              },
              PaperProps: {
                sx: {
                  mt: 0.25,
                  borderRadius: "6px",
                  boxShadow: "0px 4px 20px rgba(130, 143, 169, 0.15)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  minWidth: "100%",
                  p: "4px",
                  "& .MuiMenuItem-root.Mui-selected": {
                    backgroundColor: "transparent !important",
                  },
                  "& .MuiMenuItem-root.Mui-selected:hover": {
                    backgroundColor: "rgba(0,0,0,0.06) !important",
                  },
                  "& .MuiMenuItem-root.Mui-focusVisible": {
                    backgroundColor: "transparent !important",
                  },
                },
              },
              MenuListProps: { sx: { p: 0 } },
            };

            const { selected, all } = buildSortedOptions(
              currentPhaseObj?.value,
              selectedCohort,
            );
            const hasSelectableCohorts = all.length > 1;

            return (
              <>
                <FormControl
                  variant="standard"
                  sx={{
                    width: "100%",
                    height: "100%",
                    "& .MuiInput-underline:before": { borderBottom: "none" },
                    "& .MuiInput-underline:after": { borderBottom: "none" },
                    "& .MuiInputBase-root": { height: "100%" },
                  }}
                  onClick={(e) => {
                    if (!hasSelectableCohorts) return;
                    // If dropdown is open, clicking anywhere should close it — let onClose handle it
                    if (isCohortSelectOpen) { e.stopPropagation(); setIsCohortSelectOpen(false); return; }
                    setIsCohortSelectOpen(true);
                  }}
                >
                  <Select
                    value={selected?.value || ""}
                    onChange={(e) => handleCohortChange(e.target.value)}
                    disableUnderline
                    MenuProps={menuProps}
                    renderValue={(val) => normalizeLabel(val)}
                    IconComponent={DropdownChevron}
                    open={hasSelectableCohorts && isCohortSelectOpen}
                    onOpen={() => {
                      if (hasSelectableCohorts) setIsCohortSelectOpen(true);
                    }}
                    onClose={() => setIsCohortSelectOpen(false)}
                    sx={{
                      height: "100%",
                      px: "10px",
                      pr: "5px", /* Creates structural safety area away from the right side */
                      fontFamily: "Rubik",
                      fontSize: "16px",
                      lineHeight: "20px",
                      letterSpacing: "0%",
                      fontWeight: 400,
                      color: "rgba(0,0,0,0.4)",
                      "& .MuiSelect-select": {
                        display: "block", /* Changed from flex to block layout so text truncation attributes register correctly */
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                        height: "100%",
                        padding: 0,
                        lineHeight: "42px", /* Centers the truncated text vertically within your 44px container */
                        backgroundColor: "transparent",
                      },
                      "&:hover .MuiSelect-select": {
                        backgroundColor: "transparent",
                      },
                      "&.Mui-focused .MuiSelect-select": {
                        backgroundColor: "transparent",
                      },
                      "& .MuiSelect-icon": {
                        color: "rgba(0,0,0,0.3)",
                        right: 10,
                        pointerEvents: "auto",
                        cursor: "pointer",
                      },
                    }}

                  >
                    {all.length ? (
                      all.map((cohort) => {
                        const isSelected = cohort.value === selected?.value;
                        return (
                          <MenuItem
                            key={cohort.value}
                            value={cohort.value}
                            sx={{
                              width: "calc(100% - 8px)",
                              mx: "4px",
                              my: "6px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              textAlign: "left",
                              px: "8px",
                              "& .MuiTypography-root": { flex: 1, textAlign: "left" },
                              fontFamily: "Rubik",
                              fontWeight: isSelected ? 500 : 400,
                              fontSize: "14px",
                              lineHeight: "18px",
                              letterSpacing: "0%",
                              color: isSelected ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)",
                              "&.Mui-selected": { backgroundColor: "rgba(38, 102, 190, 0.06) !important" },
                              "&.Mui-selected:hover": { backgroundColor: "rgba(38, 102, 190, 0.1) !important" },
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            {isSelected ? (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                                <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span style={{ width: 20, flexShrink: 0 }} />
                            )}
                            <span>{cohort.label}</span>
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem value="" disabled>
                        No Cohorts Available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>

                <button
                  type="button"
                  aria-label="Open cohort dropdown"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // <-- Add this to stop the event fight
                    if (!hasSelectableCohorts) return;
                    setIsCohortSelectOpen((prev) => !prev); // <-- Toggle it instead of forcing true
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "100%",
                    width: 34,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: hasSelectableCohorts ? "pointer" : "default",
                    zIndex: 2, // <-- Give it a slight z-index layer to guarantee it's on top
                  }}
                />
              </>
            );
          })()}
        </div>}

        {/* PHASE SELECT — only shown when there are multiple phases */}
        {hasMultiplePhases && <div
          className="relative"
          style={{
            width: 170,
            height: 44,
            borderRadius: 6,
            border: "1px solid rgba(0, 0, 0, 0.1)",
            background: "rgba(255, 255, 255, 1)",
            boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
            flex: "0 0 auto",
          }}
        >
          {(() => {
            const buildSortedOptions = (rawOptions, selectedValue) => {
              const options = (rawOptions || [])
                .map((opt) => ({
                  value: opt?.title ?? "",
                  label: toDisplayTitleCase(opt?.title),
                }))
                .filter((opt) => opt.value);

              const sorted = [...options].sort((a, b) =>
                a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
              );

              const selected = sorted.find((o) => o.value === selectedValue);
              return { selected, all: sorted };
            };

            const menuProps = {
              anchorOrigin: {
                vertical: "bottom",
                horizontal: "left",
              },
              transformOrigin: {
                vertical: "top",
                horizontal: "left",
              },
              PaperProps: {
                sx: {
                  mt: 0.25,
                  borderRadius: "6px",
                  boxShadow: "0px 4px 20px rgba(130, 143, 169, 0.15)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  minWidth: "100%",
                  p: "4px",
                  "& .MuiMenuItem-root.Mui-selected": {
                    backgroundColor: "transparent !important",
                  },
                  "& .MuiMenuItem-root.Mui-selected:hover": {
                    backgroundColor: "rgba(0,0,0,0.06) !important",
                  },
                  "& .MuiMenuItem-root.Mui-focusVisible": {
                    backgroundColor: "transparent !important",
                  },
                },
              },
              MenuListProps: { sx: { p: 0 } },
            };

            const { selected, all } = buildSortedOptions(
              selectedIdData?.phases,
              selectedPhase,
            );

            return (
              <>
                <FormControl
                  variant="standard"
                  sx={{
                    width: "100%",
                    height: "100%",
                    "& .MuiInput-underline:before": { borderBottom: "none" },
                    "& .MuiInput-underline:after": { borderBottom: "none" },
                    "& .MuiInputBase-root": { height: "100%" },
                  }}
                  onClick={(e) => {
                    if (!hasMultiplePhases) return;
                    // If dropdown is open, clicking anywhere should close it — let onClose handle it
                    if (isPhaseSelectOpen) { e.stopPropagation(); setIsPhaseSelectOpen(false); return; }
                    setIsPhaseSelectOpen(true);
                  }}
                >

                  <Select
                    value={selectedPhase}
                    onChange={(e) => handlePhaseChange(e.target.value)}
                    disableUnderline
                    MenuProps={menuProps}
                    renderValue={(val) => toDisplayTitleCase(val)}
                    IconComponent={DropdownChevron}
                    open={hasMultiplePhases && isPhaseSelectOpen}
                    onOpen={() => {
                      if (hasMultiplePhases) setIsPhaseSelectOpen(true);
                    }}
                    onClose={() => setIsPhaseSelectOpen(false)}
                    sx={{
                      height: "100%",
                      px: "10px",
                      pr: "5px", /* Leaves structural safety gap for the arrow icon */
                      fontFamily: "Rubik",
                      fontSize: "16px",
                      lineHeight: "20px",
                      letterSpacing: "0%",
                      fontWeight: 400,
                      color: "rgba(0,0,0,0.4)",
                      "& .MuiSelect-select": {
                        display: "block", /* Switched from flex to block layout for text-overflow compatibility */
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                        height: "100%",
                        padding: 0,
                        lineHeight: "42px", /* Centers the newly bounded block-text vertically */
                        backgroundColor: "transparent",
                      },
                      "&:hover .MuiSelect-select": {
                        backgroundColor: "transparent",
                      },
                      "&.Mui-focused .MuiSelect-select": {
                        backgroundColor: "transparent",
                      },
                      "& .MuiSelect-icon": {
                        color: "rgba(0,0,0,0.3)",
                        right: 10,
                        pointerEvents: "auto",
                        cursor: "pointer",
                      },
                    }}
                  >
                    {all.length ? (
                      all.map((phase) => {
                        const isSelected = phase.value === selected?.value;
                        return (
                          <MenuItem
                            key={phase.value}
                            value={phase.value}
                            sx={{
                              width: "calc(100% - 8px)",
                              mx: "4px",
                              my: "6px",
                              borderRadius: "4px",
                              justifyContent: "flex-start",
                              textAlign: "left",
                              px: "8px",
                              "& .MuiTypography-root": { width: "100%", textAlign: "left" },
                              fontFamily: "Rubik",
                              fontWeight: 400,
                              fontSize: "14px",
                              lineHeight: "18px",
                              letterSpacing: "0%",
                              color: "rgba(0,0,0,0.6)",
                              "&.Mui-selected": { backgroundColor: "transparent" },
                              "&.Mui-selected:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            {isSelected ? (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
                                <path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span style={{ width: 20, flexShrink: 0 }} />
                            )}
                            <span style={isSelected ? { fontWeight: 500, color: "rgba(0,0,0,0.85)" } : undefined}>{phase.label}</span>
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem value="" disabled>
                        No Phase Available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>

                <button
                  type="button"
                  aria-label="Open phase dropdown"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!hasMultiplePhases) return;
                    setIsPhaseSelectOpen((prev) => !prev);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "100%",
                    width: 34,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: hasMultiplePhases ? "pointer" : "default",
                    zIndex: 2,
                  }}
                />
              </>
            );
          })()}
        </div>}

        {/* DATA TRACEABILITY TOGGLE */}
        <Box className={`${classes.data_box} flex items-center gap-2`}>
          <Switch
            checked={isAlertActive || false}
            onChange={handleToggleChange}
            className={classes.data_switch_btn}
            sx={{
              width: 42,
              height: 24,
              padding: 0,
              display: "flex",
              "& .MuiSwitch-switchBase": {
                padding: "2px",
                "&.Mui-checked": {
                  transform: "translateX(18px)",
                  color: "#fff",
                  "& + .MuiSwitch-track": {
                    backgroundColor: "#2666BE",
                    opacity: 1,
                  },
                },
              },
              "& .MuiSwitch-track": {
                borderRadius: 12,
                backgroundColor: "#E0E1E6",
                opacity: 1,
              },
              "& .MuiSwitch-thumb": {
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              },
            }}
          />
          <Typography
            className={`${classes.data_trace_text} font-semibold text-gray-700 text-sm`}
          >
            Data Traceability
          </Typography>
        </Box>
      </div>
    );
  };
  // 2. MAIN DATA FETCH - Prevent double/triple hits
  useEffect(() => {
    // debugger
    const pageFromUrl = parseInt(searchParams.get("page"), 10) || 1;
    const sessionKeyFromUrl = getSessionKeyFromSearchParams(searchParams);

    if (isFirstLoad.current) {
      if (pageFromUrl !== currentPage) setCurrentPage(pageFromUrl);

      // If session_key exists in URL, the dedicated session watcher effect
      // will handle fetching by session. Avoid double-fetch on mount.
      if (!sessionKeyFromUrl) {
        // On remount (e.g. returning from the Analyze tab), the `filters` prop
        // can be empty even though a filter (e.g. Australia) is still applied.
        // Redux `lastRequest.groupedFilters` survives unmount and holds the
        // last real search payload — prefer it so we don't refetch "all" and
        // wipe the active filter.
        const propFilters = { ...apiPayloadInterventionType(filters) };
        const hasPropFilters = Object.keys(propFilters).length > 0;
        const lastGrouped = lastRequest?.groupedFilters || {};
        const hasLastGrouped = Object.keys(lastGrouped).length > 0;

        const payload = {
          flag: "",
          page: pageFromUrl,
          page_size: 20,
          groupedFilters: hasPropFilters ? propFilters : (hasLastGrouped ? lastGrouped : propFilters),
        };
        dispatch(fetchCards(payload));
      }
      isFirstLoad.current = false;
      return;
    }

    // Don't re-fetch if we are just finis  hing the initial hydration sync
    if (isHydrating.current) return;

    // const payload = {
    //   groupedFilters: { ...apiPayloadInterventionType(filters) },
    //   page: currentPage,
    //   page_size: 20,
    // };
    // dispatch(fetchCards(payload));
  }, [currentPage, filters]);

  // Fetch when session_key changes in URL (Saved Search / shared links / manual edit)
  const searchKey = location.search || "";

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const sessionKeyFromUrl = getSessionKeyFromSearchParams(params);
    if (!sessionKeyFromUrl) return;

    // For a shared session (share:...), the header reapplies the shared chips
    // and fires the filtered fetch (same as a normal apply-filter). Don't also
    // fetch by session key here — that competing request overwrites the results.
    if (typeof sessionKeyFromUrl === "string" && sessionKeyFromUrl.startsWith("share:")) {
      return;
    }

    // If the current list was just produced by a groupedFilters fetch (which then wrote session_key to URL),
    // avoid immediately refetching by session_key; that second request can overwrite results back to "all".
    const isFromGroupedFilters =
      !lastRequest?.session_key &&
      lastRequest?.groupedFilters &&
      Object.keys(lastRequest.groupedFilters || {}).length > 0;

    // Block the watcher entirely when a filter fetch is active or was the last fetch.
    // A filter fetch owns the trial list; session-key-based refetches would overwrite it
    // and clear selectedCard/selectedIdData, breaking the URL sync.
    if (isFromGroupedFilters || filterFetchActiveRef.current) {
      return;
    }

    const pageFromUrl = parseInt(params.get("page"), 10) || 1;
    const savedSearchTick = params.get("_ss") || "";
    const last = lastSessionFetchRef.current;

    if (
      last.sessionKey === sessionKeyFromUrl &&
      last.page === pageFromUrl &&
      last.tick === savedSearchTick
    )
      return;
    lastSessionFetchRef.current = {
      sessionKey: sessionKeyFromUrl,
      page: pageFromUrl,
      tick: savedSearchTick,
    };

    isHydrating.current = false;
    lastAppliedSessionKeyRef.current = sessionKeyFromUrl;
    // Capture the oncosuite_id from the URL so that after the fetch completes
    // the selection sync restores this specific card (copy-paste / reload case).
    // Do NOT clear selectedCard/selectedIdData here — that causes a flash and
    // loses the target we need to restore.
    const urlOncosuiteid = window.location.pathname.split("/trials/")[1]?.split("?")[0] || "";
    pendingUrlOncosuiteidRef.current = urlOncosuiteid;
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }

    const storedFilters = getStoredFiltersForSession(sessionKeyFromUrl);

    const fetchByFilters = (filtersPayload) =>
      dispatch(
        fetchCards({
          groupedFilters: filtersPayload || {},
          flag: "",
          session_key: "",
          page: pageFromUrl,
          page_size: 20,
        }),
      ).unwrap();

    const fetchBySession = () =>
      dispatch(
        fetchCards({
          groupedFilters: {},
          flag: "",
          session_key: sessionKeyFromUrl,
          page: pageFromUrl,
          page_size: 20,
        }),
      ).unwrap();

    // A shared session (share:...) already encodes its filters server-side, so
    // always fetch purely by session key. Using locally stored filters here can
    // inject stale/wrong filters (e.g. a previous session's locations) that the
    // shared session never had.
    const isSharedSession =
      typeof sessionKeyFromUrl === "string" && sessionKeyFromUrl.startsWith("share:");

    const hasStoredFilters =
      !isSharedSession &&
      storedFilters &&
      typeof storedFilters === "object" &&
      (Object.keys(storedFilters?.include || {}).length > 0 ||
        Object.keys(storedFilters?.exclude || {}).length > 0);

    (hasStoredFilters ? fetchByFilters(storedFilters) : fetchBySession())
      .then((payload) => {
        // If backend ignored session_key and returned unfiltered "all", but it provided payload filters,
        // re-apply filters locally via groupedFilters for deterministic results (reload-safe).
        // Skip for shared sessions: the session fetch is authoritative and a
        // second groupedFilters fetch (session_key: "") can diverge from it.
        if (!isSharedSession && !hasStoredFilters && payload?.payload) {
          setStoredFiltersForSession(sessionKeyFromUrl, payload.payload);
          return fetchByFilters(payload.payload);
        }

        return payload;
      })
      // .then((payload) => {
      //   debugger
      //   const firstCard = payload?.data?.[0];
      //   if (!firstCard?.oncosuite_id) return;

      //   navigate(
      //     `/trials/${new_oncosuite_id}?page=${pageFromUrl}&session_key=${encodeURIComponent(sessionKeyFromUrl)}`,
      //     { replace: true },
      //   );
      //   handelGetCardDetails(firstCard, new_oncosuite_id, false);
      // })
      .catch(() => {
        // errors handled in slice / console
      });
  }, [currentPage, dispatch, searchKey, setCurrentPage]);

  // Mark filter fetch active as soon as the dispatch is pending so the session-key
  // watcher is blocked immediately, before loading becomes false.
  useEffect(() => {
    const hasGroupedFilters =
      lastRequest?.groupedFilters &&
      Object.keys(lastRequest.groupedFilters || {}).length > 0;

    // Detect loading start (false → true): a new fetch just kicked off.
    if (loading && !prevLoadingRef.current) {
      // If it's a reset/remove fetch (no grouped filters), flag that we need
      // to select the first card once the new results arrive.
      if (!hasGroupedFilters) {
        pendingFirstCardSelectRef.current = true;
      }
    }
    prevLoadingRef.current = loading;

    if (hasGroupedFilters && loading) {
      filterFetchActiveRef.current = false;
    } else if (!hasGroupedFilters && !loading) {
      filterFetchActiveRef.current = false;
    }
  }, [lastRequest, loading]);

  // Clear right panel when filters yield 0 results
  useEffect(() => {
    if (!loading && trials?.total_found === 0) {
      setSelectedCard(null);
      setSelectedIdData({});
    }
  }, [loading, trials?.total_found]);

  // 3. SELECTION & URL SYNC
  useEffect(() => {
    if (!loading && trials?.data?.length > 0) {
      // When the URL carries a shared session (share:...), keep that exact key
      // in the URL rather than the fetch response's session_key — a shared link
      // must remain shareable and must not flip to a resolved/default key.
      const urlSessionKeyRaw = getSessionKeyFromSearchParams(searchParams);
      const isSharedSession =
        typeof urlSessionKeyRaw === "string" && urlSessionKeyRaw.startsWith("share:");
      const sessionKey = isSharedSession ? urlSessionKeyRaw : trials.session_key;
      const firstCard = trials.data[0];
      const currentCardInNewList = trials.data.find((c) => c.oncosuite_id === oncosuite_id);
      // setSelectedCard(firstCard);
      setFilterSessionKey(sessionKey)
      set_session_key(sessionKey)
      let listURL = ""
      const pageNo = trials?.page
      setCurrentPage(pageNo)
      // A filter apply/remove should always jump the right panel to the FIRST
      // card of the new list — not preserve the previously-selected card even if
      // it survived the filter. Detect filter-driven fetches:
      //   - remove/reset: pendingFirstCardSelectRef was set when loading started
      //   - apply: the last request carried groupedFilters
      const isFilterApply =
        lastRequest?.groupedFilters &&
        Object.keys(lastRequest.groupedFilters || {}).length > 0;
      // A reload / deep-link / copy-paste carries a pending URL target that must
      // be honoured — don't treat that as a filter action. Only a fresh in-app
      // filter apply/remove should force selection back to the first card.
      //
      // NOTE: a real filter APPLY (grouped filters present) must win even during
      // the initial-load hydration window. Previously `isHydrating.current` was
      // part of this guard, so applying a filter right after landing on the page
      // (before the ~500ms hydration timeout cleared) was NOT treated as
      // filter-driven — the stale pre-filter card stayed selected in the right
      // panel while the left list filtered. A genuine apply should override
      // hydration; only an actual pending URL target (deep-link) still blocks it.
      const hasPendingUrlTargetForFilter =
        !!pendingUrlOncosuiteidRef.current || (isHydrating.current && !isFilterApply);
      const isFilterDrivenFetch =
        (pendingFirstCardSelectRef.current || isFilterApply) &&
        !hasPendingUrlTargetForFilter;

      const new_oncosuite_id = isFilterDrivenFetch
        ? firstCard.oncosuite_id
        : currentCardInNewList?.oncosuite_id
          ? currentCardInNewList?.oncosuite_id
          : firstCard.oncosuite_id;
      const selected_card = isFilterDrivenFetch
        ? firstCard
        : currentCardInNewList?.oncosuite_id
          ? currentCardInNewList
          : firstCard;
      if(activeTabTrial == 'Find') {
        // On a filter apply/remove, always select the first card and skip the
        // deep-link / URL-target handling below (that URL id is the stale
        // pre-filter selection, not a copy-paste target).
        if (isFilterDrivenFetch) {
          pendingFirstCardSelectRef.current = false;
          pendingUrlOncosuiteidRef.current = "";
          listURL = `/trials/${firstCard.oncosuite_id}?page=${pageNo}${sessionKey ? `&session_key=${encodeURIComponent(sessionKey)}` : ""}`;
          window.history.replaceState(null, "", listURL);
          setListURL(listURL);
          handelGetCardDetails(firstCard, firstCard.oncosuite_id, false);
          setTimeout(() => { isHydrating.current = false; }, 500);
          return;
        }
        // If the URL points at a specific card that is NOT on the current page
        // (e.g. it lives on page 3), don't silently fall back to the first card.
        // Fetch that card's details directly by id and keep the id in the URL,
        // so a deep link / copy-paste to any card works regardless of its page.
        const urlTargetId = oncosuite_id || pendingUrlOncosuiteidRef.current || "";
        const urlTargetOnThisPage =
          urlTargetId && trials.data.some((c) => c.oncosuite_id === urlTargetId);

        if (urlTargetId && !urlTargetOnThisPage) {
          pendingUrlOncosuiteidRef.current = ""; // consumed
          listURL = `/trials/${urlTargetId}?page=${pageNo}${sessionKey ? `&session_key=${encodeURIComponent(sessionKey)}` : ""}`;
          window.history.replaceState(null, "", listURL);
          setListURL(listURL);
          // Load the card's detail directly (right panel) even though it's not on
          // the current page. Jumping the left list to its page needs the backend
          // to return the card's page/index for a session_key — not available, so
          // the list stays on the current page (detail-only).
          handelGetCardDetails({ oncosuite_id: urlTargetId }, urlTargetId, false);
          setTimeout(() => { isHydrating.current = false; }, 500);
          return;
        }

        // setSearchParams((prev) => {
        //     const p = new URLSearchParams(prev);
        //     p.set("page", currentPage);
        //     p.set("session_key", sessionKey);
        //     return p;
        // }, { replace: true });
        listURL = `/trials/${new_oncosuite_id}?page=${pageNo}${sessionKey ? `&session_key=${encodeURIComponent(sessionKey)}` : ""}`
        window.history.replaceState(null, "", listURL);
        setListURL(listURL)
        handelGetCardDetails(selected_card, new_oncosuite_id, false);
        setTimeout(() => { isHydrating.current = false; }, 500);
        return;
      } else {
        listURL = `/trials/${firstCard.oncosuite_id}?page=${1}${sessionKey ? `&session_key=${encodeURIComponent(sessionKey)}` : ""}`
        setListURL(listURL)
        handelGetCardDetails(firstCard, firstCard.oncosuite_id, false);
        setTimeout(() => { isHydrating.current = false; }, 500);
        return;
      }

      const urlId = searchParams.get("id");
      const hasGroupedFilters =
        lastRequest?.groupedFilters &&
        Object.keys(lastRequest.groupedFilters || {}).length > 0;

      // Filter was reset/removed — new results just arrived, always select first card.
      if (pendingFirstCardSelectRef.current) {
        pendingFirstCardSelectRef.current = false;
        // Do NOT put session_key back in the URL here: the session key returned by the
        // filter-removal fetch encodes the new (reduced) filter context. If we navigate
        // with it, the session-key watcher fires and re-fetches using that key, which
        // the backend resolves back to the old filtered state, overwriting the removal.
        // listURL = `/trials/${new_oncosuite_id}?page=${currentPage}${sessionKey ? `&session_key=${encodeURIComponent(sessionKey)}` : ""}`
        // if(activeTabTrial == 'Find') {
          // navigate(
          //   url,
          //   { replace: true },
          // );
          // setListURL("")
        // } else {
          // setCurrentPage(1);
          // setSelectedCard(firstCard);
        // }
        // setListURL(listURL)
        handelGetCardDetails(selected_card, new_oncosuite_id, false);
        setTimeout(() => { isHydrating.current = false; }, 500);
        return;
      }

      const selectedTrialId =
        selectedIdData?.top_info?.value?.oncosuite_id?.value;

      // const currentCardInNewList = trials.data.find((c) => c.oncosuite_id === oncosuite_id);
      const listIdForCanonical = canonicalToListIdRef.current[oncosuite_id];
      const canonicalCardInNewList = listIdForCanonical && trials.data.find((c) => c.oncosuite_id === listIdForCanonical);
      const hasPendingUrlTarget = !!pendingUrlOncosuiteidRef.current;

      // A filter was just applied and the card the URL still points at (left over from
      // before the filter) fell out of the new result set — don't keep honouring the
      // stale URL id, fall through to selecting the new first card instead.
      // const staleCardDroppedByFilter =
      // hasGroupedFilters && currentCardInNewList == null && canonicalCardInNewList == null;
      
      // PRIORITY 1: Always honour the oncosuite_id in the URL — whether it came from
      // copy-paste, manual edit, or a shared link. If the right panel already shows
      // this card, do nothing. Otherwise fetch it directly.
      if (oncosuite_id) {
        // listURL = `/trials/${oncosuite_id}?page=1${sessionKey ? `&session_key=${encodeURIComponent(sessionKey)}` : ""}`
        // if(activeTabTrial == 'Find') {
        //   // navigate(
        //     //   url,
        //     //   { replace: true },
        //     // );
        //     // setListURL("")
        //   } else {
        //     // setCurrentPage(1);
        //     setSelectedCard(firstCard);
        //   }
        //   setListURL(listURL)
          
        const selectedTrialId =
          selectedIdData?.top_info?.value?.oncosuite_id?.value;
        const alreadyShowing =
          selectedTrialId === oncosuite_id || canonicalCardInNewList != null;

        if (!alreadyShowing) {
          pendingUrlOncosuiteidRef.current = ""; // consumed
          handelGetCardDetails(currentCardInNewList || { oncosuite_id }, oncosuite_id, false);
          setTimeout(() => { isHydrating.current = false; }, 500);
          return;
        }

        // Already showing the correct card — just clear the pending target if set.
        if (hasPendingUrlTarget) pendingUrlOncosuiteidRef.current = "";
        setTimeout(() => { isHydrating.current = false; }, 500);
        return;
      }

      // PRIORITY 2: No oncosuite_id in URL — fall back to first card only when
      // there is no pending URL target (i.e. not a copy-paste / reload scenario).
      if (!hasPendingUrlTarget && trials.data.length > 0) {
        // const firstCard = trials.data[0];
        const finalId = sessionKey || urlId || "";
        // navigate(
        //   `/trials/${new_oncosuite_id}?page=${currentPage}${finalId ? `&session_key=${encodeURIComponent(finalId)}` : ""}`,
        //   { replace: true },
        // );
        handelGetCardDetails(selected_card, new_oncosuite_id, false);
      }
      setTimeout(() => { isHydrating.current = false; }, 500);
    }
  }, [trials, loading, oncosuite_id]);

  useEffect(() => {
    // debugger
    const scrollContainer = stickyRef.current?.closest(".scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const rect = stickyRef.current?.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      setIsSticky(rect?.top <= containerRect.top + 1);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const syncTrialUrl = (trialId, { replace = true, sessionKey: sessionKeyOverride } = {}) => {
    if (!trialId) return;

    const currentSessionKey = sessionKeyOverride !== undefined
      ? sessionKeyOverride
      : (getSessionKeyFromSearchParams(searchParams) || trials?.session_key || "");
    const nextUrl = `/trials/${trialId}?page=${currentPage}${
      currentSessionKey
        ? `&session_key=${encodeURIComponent(currentSessionKey)}`
        : ""
    }`;

    if (`${location.pathname}${location.search}` === nextUrl) return;
    // alert(3)
    window.history.replaceState(null, "", nextUrl);
    setListURL(nextUrl)
    // navigate(nextUrl, { replace });
  };

  const handelGetCardDetails = async (card, id, shouldNavigate = true) => {
    if (selectedCard?.oncosuite_id === id && Object.keys(selectedIdData).length > 0) return;

    // Abort any in-flight summary fetch for a previous card so its stale result
    // cannot overwrite the URL after we've already navigated to a new card.
    summaryAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    summaryAbortControllerRef.current = abortController;

    if (shouldNavigate) {
      syncTrialUrl(id);
    }
    try {
      // debugger
      setIsLoading(true);
      setSelectedCard(card);
      setIsSticky(false);
      setScrollProgress(0);
      // Local _.json override disabled — always fetch from the API.
      // const localSummary = EXEC_SUMMARY_LOCAL_OVERRIDES[id];
      const res = await getExecutiveSummaryById(id, undefined, abortController.signal);
      const result = await res
      if (!result) { setIsLoading(false); return; } // aborted
      const canonicalId = result?.top_info?.value?.oncosuite_id?.value || id;
      setSelectedIdData(result);
      setActiveTab("Study Details");
      if (canonicalId && canonicalId !== id) {
        // Record the mapping so selection-sync won't mistake the canonical ID
        // for an unknown card and fall back to firstCard.
        canonicalToListIdRef.current[canonicalId] = id;
        // Use the live Redux session_key (not the potentially stale URL session_key)
        // to avoid triggering the session-key watcher with an old key.
        syncTrialUrl(canonicalId, { sessionKey: trials?.session_key || "" });
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        console.error(err);
      }
    } finally { setIsLoading(false); }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      isHydrating.current = false; // Manually changing page breaks hydration mode
      setSelectedCard(null);
      setSelectedIdData({});
      setCurrentPage(newPage);
      // setSearchParams((prev) => {
      //   const p = new URLSearchParams(prev);
      //   p.set("page", newPage);
      //   return p;
      // }, { replace: true });

      const payload = {
        page: newPage,
        page_size: 20,
        flag: ""
      };

      
      // const currentSessionKey = getSessionKeyFromSearchParams(searchParams);
      const storedFilters = getStoredFiltersForSession(filterSessionKey)
      if (storedFilters) {
        // payload.session_key = currentSessionKey;
        payload.groupedFilters = storedFilters || {};
      }
      // else {
      //   payload.groupedFilters = { ...apiPayloadInterventionType(filters) };
      // }
      dispatch(fetchCards(payload));
    }
  };

  const handleScroll33 = () => {
    const el = scrollRef.current;
    if (!el) return;

    const current = el.scrollTop;

    setIsSticky(current > 0);

    const progressBarHeight = current > 0 ? 4 : 0; // h-1
    const stickyHeaderHeight =
      (stickyRef.current?.offsetHeight || 0) + progressBarHeight;
    const actionBarOffsetTop =
      actionBarRef.current?.offsetTop ?? Number.POSITIVE_INFINITY;
    const triggerBuffer = 8;
    setShowStickyHeader(
      current + stickyHeaderHeight + triggerBuffer >= actionBarOffsetTop,
    );

    const total = el.scrollHeight - el.clientHeight;
    const progress = (current / total) * 100;

    setScrollProgress(progress);
  };

  useEffect(() => {
    setIsSticky(currentPage > 0);
  }, [currentPage]);

  // --- Dependent State for Cohort & Phase Logic ---
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [treatments, setTreatments] = useState([]);
  const [eligibility, setEligibility] = useState({ inclusion: [], exclusion: [] });
  const [endpoints, setEndpoints] = useState([]);
  const [resultEndpoints, setResultEndpoints] = useState([]);
  const [currentPhaseObj, setCurrentPhaseObj] = useState([]);
  // Update derived data when selectedIdData changes (initial load or card change)

  const [studyDetails, setStudyDetails] = useState({});
  const [result, setResult] = useState({});

  useEffect(() => {
    if (!selectedIdData?.phases?.length) return;

    const defaultPhaseTitle = selectedIdData.phases[0]?.title || "";
    if (!defaultPhaseTitle) return;

    handlePhaseChange(defaultPhaseTitle);
  }, [selectedIdData]);

  // Handlers for dropdowns
  const handleCohortChange = (cohortName) => {
    setSelectedCohort(cohortName);
    if (!currentPhaseObj?.value?.length) return;

    const cohortObj =
      currentPhaseObj.value.find((c) => c.title === cohortName) ||
      currentPhaseObj.value[0];
    setStudyDetails({
      study_details: cohortObj?.study_details,
      // The phase object's field is `endpoint` (singular) — reading `endpoints`
      // here silently blanked the Endpoints table on every cohort change.
      endpoints: currentPhaseObj?.endpoint,
      trial_contacts: selectedIdData?.trial_contacts,
      site_locations: selectedIdData?.site_locations,
      top_info: selectedIdData?.top_info,
      result_section: cohortObj?.result_section,
      phases: selectedIdData?.phases,
      source_date: selectedIdData?.source_date,
      version: selectedIdData?.version,
    });

    const resultSection = cohortObj?.result_section;
    setResult(resultSection || {});
    setIsResultDisabled(!resultSection || Object.keys(resultSection || {}).length === 0);
  };

  const handlePhaseChange = (phaseValue) => {
    setSelectedPhase(phaseValue);

    const phaseObj =
      selectedIdData?.phases?.find((p) => p.title === phaseValue) || null;
    setCurrentPhaseObj(phaseObj);

    const nextCohortTitle = phaseObj?.value?.[0]?.title || "";
    setSelectedCohort(nextCohortTitle);

    const cohortObj =
      phaseObj?.value?.find((c) => c.title === nextCohortTitle) ||
      phaseObj?.value?.[0] ||
      null;
    setStudyDetails({
      study_details: cohortObj?.study_details,
      endpoints: phaseObj?.endpoint,
      trial_contacts: selectedIdData?.trial_contacts,
      site_locations: selectedIdData?.site_locations,
      top_info: selectedIdData?.top_info,
      result_section: cohortObj?.result_section,
      phases: selectedIdData?.phases,
      source_date: selectedIdData?.source_date,
      version: selectedIdData?.version,
    });

    const resultSection = cohortObj?.result_section;
    setResult(resultSection || {});
    setIsResultDisabled(!resultSection || Object.keys(resultSection || {}).length === 0);

    // Keep these in sync for any other dependent UI
    setEndpoints(phaseObj?.endpoints?.value || phaseObj?.endpoints || []);
    setTreatments(cohortObj?.study_details?.study_arms?.value || []);
    setEligibility(cohortObj?.study_details?.eligibility_criteria?.value || { inclusion: [], exclusion: [] });
    setResultEndpoints(cohortObj?.result_section?.endpoints_outcomes || []);
  };

  // Use eligibility for eligibilityRows
  const eligibilityRows = prepareEligibilityRows(eligibility.exclusion, eligibility.inclusion);
  const patientDempgraphicRows = studyDetails?.study_details?.age_gender?.value
    ? Object.entries(studyDetails.study_details.age_gender.value).map(
      ([sex, obj]) => ({
        sex,
        age: obj?.value ?? "-",
      }),
    )
    : [];
  const SafeRender = ({ children, fallback = "" }) => {
    try {
      if (children === null || children === undefined) return fallback;
      if (typeof children === "string" || typeof children === "number")
        return children;
      if (Array.isArray(children)) return children.join(", ");
      if (typeof children === "object") {
        console.warn("SafeRender: Attempted to render object:", children);
        return fallback;
      }
      return children;
    } catch (error) {
      console.error("SafeRender error:", error);
      return fallback;
    }
  };
  const handleToggleChange = (event) => {
    dispatch(toggleAlert(event.target.checked));
  };
  // const isResultDisabled =
  //   !selectedIdData?.phases?.result_section ||
  //   Object.keys(selectedIdData.result_section)?.length === 0;

  const isTerminatedDisabled =
    !selectedIdData?.terminated_section ||
    Object.keys(selectedIdData.terminated_section)?.length === 0;

  const isWithdrawnDisabled =
    !selectedIdData?.withdrawn_section ||
    Object.keys(selectedIdData.withdrawn_section)?.length === 0;

  const isAlertActive = useSelector((state) => state.trials.isAlertActive);

  const onChangeTab = (tab) => {
    // debugger
    setActiveTab(tab);
  };


  // 1. Get the raw downloads object from API
  const documentsDetails = selectedIdData?.top_info?.value?.downloads || {};

  // 2. Define the specific priority items based on your request
  const downloadKeys = {
    "Study Protocol":
      "https://cdn.clinicaltrials.gov/large-docs/01/NCT02827201/Prot_000.pdf",
    "Statistical Analysis Plan":
      "https://cdn.clinicaltrials.gov/large-docs/01/NCT02827201/SAP_001.pdf",
  };
  const defaultItems = [
    "Study Protocol",
    "Statistical Analysis Plan",
    "Informed Consent Form",
    "Trial Results",
    "Executive Summary",
  ];

  const handleDownload = async (item) => {
    setDownloadOpen(null);
    const oncosuite_id = selectedIdData?.top_info?.value?.oncosuite_id?.value || "Trial";

    if (item === "Executive Summary") {
      const element = fullReportRef.current;
      if (!element) return;
      try {
        await exportExecutiveSummaryPdf(
          element,
          `${item.replace(/\s+/g, "_")}_${oncosuite_id}.pdf`,
        );
      } catch (error) {
        console.error("PDF Capture Error:", error);
      }
      return;
    }
    try {
      const response = await fetch(item);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${item}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };
  const processedData = {};

  // 3. Populate processedData: Check our priority keys first, then fallback to API data
  defaultItems.forEach((item) => {
    // If the API contains the key (after cleaning), use the API URL
    // Otherwise, if it's one of our specific keys, use the provided link
    const apiKey = Object.keys(documentsDetails).find((key) =>
      key.toLowerCase().includes(item.toLowerCase()),
    );

    if (apiKey) {
      processedData[item] = documentsDetails[apiKey];
    } else if (downloadKeys[item]) {
      processedData[item] = downloadKeys[item];
    }
  });
  // 1. When Phase Changes
  // const handlePhaseChange = (phaseTitle) => {
  //   const phase = selectedIdData.phases.find((p) => p.title === phaseTitle);
  //   setSelectedPhase(phaseTitle);
  //   setCurrentPhaseObj(phase); // This updates the Cohort dropdown list

  //   // Reset Cohort to the first one available in the new phase
  //   if (phase?.value?.length > 0) {
  //     setSelectedCohort(phase.value[0].title);
  //     setCurrentCohortObj(phase.value[0]); // This updates Study Details/Results
  //   } else {
  //     setSelectedCohort("");
  //     setCurrentCohortObj(null);
  //   }
  // };

  // 2. When Cohort Changes
  // const handleCohortChange = (cohortTitle) => {
  //   // Find the cohort object inside the currently selected phase
  //   const cohort = currentPhaseObj?.value?.find((c) => c.title === cohortTitle);
  //   setSelectedCohort(cohortTitle);
  //   setCurrentCohortObj(cohort); // StudyDetailsTab and ResultsTab will react to this
  // };
  // Custom layout element to compute individual element bounds dynamically
  const InnerMetadataWrapper = ({ valuesArray: rawValues, item, selectedIdData, EvidenceHoverHeader }) => {
    // Force rawValues to be an array. If it's a string, wrap it in an array.
    const valuesArray = Array.isArray(rawValues)
      ? rawValues
      : rawValues === null || rawValues === undefined
        ? []
        : [rawValues];

    // If the field array only contains 0 or 1 string, render it cleanly with no badge or slicing logic
    if (valuesArray.length <= 1) {
      return (
        <span className="inline-flex items-center text-gray-500 font-normal truncate max-w-full" style={{ fontSize: "16px" }}>
          <EvidenceHoverHeader
            label={<span className="inline text-gray-500 truncate" style={{ fontSize: "16px" }}>{valuesArray[0] || ""}</span>}
            evidence={{
              source_date: selectedIdData?.source_date,
              version: selectedIdData?.version,
              highlight: getTraceability(item?.data)?.source_text,
              reasoning: getTraceability(item?.data)?.reasoning || "No reasoning provided.",
              confidence: getTraceability(item?.data)?.confidence_score || "0",
              source: getTraceability(item?.data)?.source,
              nctId: selectedIdData?.top_info?.value?.nctid?.value,
              source_link: getTraceability(item?.data)?.source_link,
              // Structured source-document snippet + terms to highlight in it.
              snippet: getTraceability(item?.data)?.snippet,
              keywords: getTraceability(item?.data)?.keywords,
            }}
          />
        </span>
      );
    }

    const isStageKey = item.key === "stage";
    // Adjust slice count if you want to show more items inline before truncating with the tooltip
    const visibleValues = isStageKey ? valuesArray.slice(0, 2) : valuesArray;
    const hiddenItems = isStageKey ? valuesArray.slice(2) : [];

    return (
      /* CHANGED: Enforced absolute single-line layout using inline-flex, whitespace-nowrap, and hidden overflows */
      <div className="inline-flex items-center min-w-0 max-w-full whitespace-nowrap align-middle overflow-visible">
        {visibleValues.map((val, idx) => (
          <span
            key={idx}
            className="inline-flex items-center text-gray-500 min-w-0 max-w-full whitespace-nowrap"
            style={{ fontSize: "16px" }}
          >
            {idx > 0 && (
              <span className="text-gray-400 mx-1 select-none flex-shrink-0">
                +
              </span>
            )}
            <div className="truncate max-w-full" style={{ display: "inline-flex", alignItems: "center" }}>
              <EvidenceHoverHeader
                label={
                  <span
                    className="text-gray-500 truncate max-w-full"
                    style={{ fontSize: "16px", display: "inline-flex", alignItems: "center" }}
                  >
                    {val}
                  </span>
                }
                evidence={{
                  source_date: selectedIdData?.source_date,
                  version: selectedIdData?.version,
                  highlight: getTraceability(item?.data)?.source_text,
                  reasoning: getTraceability(item?.data)?.reasoning || "No reasoning provided.",
                  confidence: getTraceability(item?.data)?.confidence_score || "0",
                  source: getTraceability(item?.data)?.source,
                  oncosuite_id: selectedIdData?.top_info?.value?.oncosuite_id?.value,
                  source_link: getTraceability(item?.data)?.source_link,
                  // Structured source-document snippet + terms to highlight in it.
                  snippet: getTraceability(item?.data)?.snippet,
                  keywords: getTraceability(item?.data)?.keywords,
                }}
              />
            </div>
          </span>
        ))}

        {/* Render the clean horizontal tooltip when overflow items exist */}
        {hiddenItems.length > 0 && (
          <Tooltip
            placement="bottom-start"
            title={
              <div style={{
                display: "flex", flexDirection: "row", flexWrap: "wrap",
                alignItems: "center", gap: "8px", padding: "10px 12px",
                fontFamily: "Rubik, sans-serif", fontSize: "14px",
                fontWeight: 500, color: "rgba(107, 114, 128, 1)", whiteSpace: "nowrap"
              }}>
                {hiddenItems.map((val, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-gray-400 font-normal">+</span>}
                    <div>{val}</div>
                  </React.Fragment>
                ))}
              </div>
            }
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "white",
                  boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.15)",
                  borderRadius: "8px", padding: 0, maxWidth: "none"
                }
              }
            }}
          >
            <span style={{
              height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxSizing: "border-box",
              borderRadius: "4px", padding: "0 5px", background: "rgba(232, 232, 236, 1)",
              fontFamily: "Rubik", fontWeight: 500, fontSize: "11px", color: "rgba(0,0,0,0.8)",
              lineHeight: "18px", verticalAlign: "middle", alignSelf: "center",
              position: "relative", top: 0,
              cursor: "pointer", marginLeft: "6px", flexShrink: 0
            }}>
              +{hiddenItems.length}
            </span>
          </Tooltip>
        )}
      </div>
    );
  };
  return (
    <>
      {loading && isFirstLoad.current ? (
        <div className="text-center w-full mt-3" style={{ height: `calc(100vh - ${reservedHeaderHeight}px)` }}>
          <TrialSkeleton />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: `calc(100vh - ${reservedHeaderHeight}px)`,
          }}
          className="flex bg-mainBlue"
        >
          <div className="h-full flex flex-col font-inter bg-blue-50" style={{
            //  width: "25%"
            width: "340px",
            height: "100%",
            // gap: "12px",
            transform: "rotate(0deg)",
            opacity: 1,
            // position: "sticky",
            top: 0

          }}>
            <div className={`flex flex-col ${classes.cards_height}`}
            // style={{ 
            //   height: chipsVisible?  "78vh" : "85vh",
            //   position: "sticky"
            //  }}
            >
              <div style={{
                height: "40px",
                // paddingRight: "8px",
                // paddingLeft: "8px",
                gap: "5px",
                padding: "8px 30px",
                flexShrink: 0,
                // borderBottomWidth: "1px",
                // borderBottomStyle: "solid",
                // borderBottomColor: "#e5e7eb",
                // boxShadow: "0px 4px 10px 0px #828FA926"
              }}
                className="flex items-center justify-between z-50">

                {/* Trial count */}
                <span className="text-sm font-semibold">
                  <span style={{ color: "#1a1a1a" }}>{formattedTrialCount}</span>
                  {" "}
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>Trials</span>
                </span>

                {/* Sort button */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (sortMenuCloseTimerRef.current) {
                      clearTimeout(sortMenuCloseTimerRef.current);
                      sortMenuCloseTimerRef.current = null;
                    }
                    setSortMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    sortMenuCloseTimerRef.current = setTimeout(() => {
                      setSortMenuOpen(false);
                    }, 120);
                  }}
                >
                  <button
                    type="button"
                    aria-label="Sort trials"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      color: "#6b7280",
                    }}
                  >
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 12V10H6V12H0ZM0 7V5H12V7H0ZM0 2V0H18V2H0Z" fill="black" fillOpacity="0.7" />
                    </svg>
                  </button>
                  {sortMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-50 overflow-hidden"
                      style={{ boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.12)" }}
                    >
<div className="py-2 px-2">
  {sortOptions.map((option) => (
    <button
      key={option}
      type="button"
      onClick={() => {
                          setSelectedSortOption(option);
                          setSortMenuOpen(false);
                          dispatch(fetchCards({
                            ...(lastRequest || {}),
                            page: 1,
                            sorting_method: sortOptionToApiValue[option],
                            session_key: sessionKey,
                          }));
                        }}
      className={`w-full px-4 py-2 rounded-md text-left text-sm transition-colors ${
        selectedSortOption === option
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="w-4 flex justify-center">
          {selectedSortOption === option ? "✓" : ""}
        </span>
        <span>{option}</span>
      </span>
    </button>
  ))}
</div>
                    </div>
                  )}
                </div>

              </div>
              {/* {showFilters && filterList && <FilterChipsHeader filters={filterList} />} */}
              <div
                ref={cardListRef}
                className="app-scroll px-4 flex flex-col gap-2 flex-1 overflow-y-auto"
                style={{
                  background: "#f0f6fe",
                  overflowX: "hidden",
                  marginBottom: "50px",
                  outline: "none",
                }}
                onClick={() => setFocusZone('left')}
                tabIndex={-1}
                onKeyDown={(e) => {
                  // The search owns the keyboard while its suggestion dropdown
                  // is open — even if focus briefly landed here after a select,
                  // don't consume arrow keys. User hands control back with Esc.
                  if (window.__trialsSearchDropdownOpen) return;

                  // GUARD — right panel scrolling is now handled globally
                  if (focusZone === 'right') return;

                  const cards = trials?.data;
                  if (!cards?.length) return;
                  const currentIndex = cards.findIndex(c => c.oncosuite_id === selectedCard?.oncosuite_id);
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (currentIndex === cards.length - 1 && currentPage < totalPages) {
                      // Last card on page — go to next page
                      handlePageChange(currentPage + 1);
                    } else {
                      const next = cards[Math.min(currentIndex + 1, cards.length - 1)];
                      if (next) handelGetCardDetails(next, next.oncosuite_id);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (currentIndex === 0 && currentPage > 1) {
                      // First card on page — go to previous page
                      handlePageChange(currentPage - 1);
                    } else {
                      const prev = cards[Math.max(currentIndex - 1, 0)];
                      if (prev) handelGetCardDetails(prev, prev.oncosuite_id);
                    }
                  }
                }}
              >
                {trials?.data?.map((card, index) => (
                  <div key={`${card.oncosuite_id}-${index}`} data-card-id={card.oncosuite_id}>
                  <Trialcardlist card={card} isSelected={selectedCard?.oncosuite_id === card.oncosuite_id} onSelect={(c, id) => { handelGetCardDetails(c, id); cardListRef.current?.focus(); }} selectedIdData={selectedIdData} />
                  </div>
                ))}
              </div>
              {/* Restored Pagination */}
              {!loadingTrials && (
                <div style={{
                  padding: "2.5px",
                  height: "40px",
                  // width: "345px",
                  // paddingRight: "8px",
                  // paddingLeft: "8px",
                  // gap: "5px",
                  // transform: "rotate(0deg)",
                  // opacity: 1,
                  // borderTopWidth: "1px",
                  // borderTopStyle: "solid",
                  // boxShadow: "0px -4px 10px 0px rgba(130, 143, 169, 0.15)",
                  background: "#eff6ff",
                  position: "sticky",
                  bottom: "0%"
                }}
                // className="bg-white border-t border-gray-100 w-full sticky bottom-0 z-[100] flex flex-col justify-center"
                >
                  <div className="flex w-full justify-center gap-1">
                    {currentPage > 1 &&
                      (
                        <button
                          disabled={currentPage <= 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={`w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg ${currentPage <= 1
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          ‹
                        </button>
                      )
                    }
                    {(() => {
                      const buttons = [];
                      const delta = 1;
                      buttons.push(<button key={1} onClick={() => handlePageChange(1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium ${currentPage === 1 ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>1</button>);
                      if (currentPage > 3) buttons.push(<span key="ld" className="text-gray-400">...</span>);
                      let start = Math.max(2, currentPage - delta);
                      let end = Math.min(totalPages - 1, currentPage + delta);
                      for (let i = start; i <= end; i++) {
                        buttons.push(<button key={i} onClick={() => handlePageChange(i)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium ${currentPage === i ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>{i}</button>);
                      }
                      if (currentPage < totalPages - 2) buttons.push(<span key="rd" className="text-gray-400">...</span>);
                      if (totalPages > 1) {
                        buttons.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium ${currentPage === totalPages ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>{totalPages}</button>);
                      }
                      return buttons;
                    })()}
                    {(currentPage < totalPages) &&
                      (
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={`w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg ${currentPage >= totalPages
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          ›
                        </button>
                      )
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              // width: "70%",
              // Reduce bottom gap so the right card reaches closer to viewport bottom.
              padding: "1.5% 1.2% 64px 1.5%",
              paddingRight: "calc(1.2% + 5px)",
              background: "#F0F6FE",
              // boxShadow: "inset 0px 4px 6px rgba(138, 160, 190, 0.15)",
            }}
            className="flex flex-col flex-1 min-h-0 min-w-0 text-left bg-white"
          >
            {isLoading || (selectedCard && Object.keys(selectedIdData).length === 0) ? (
              <div className="listtab-right-panel h-full">
                <RightCardSkeleton style={{ height: "100%" }} />
              </div>
            ) : selectedCard ? (
              <>
                {/* Sticky Header Section */}
                <div
                  className="app-scroll listtab-right-panel"
                  ref={scrollRef}
                  onScroll={handleScroll33}
                  // ADD: click sets focusZone to right
                  onClick={() => setFocusZone('right')}
                  style={{
                    overflowY: "auto",
                    background: "#FFFFFF",
                    borderRadius: "8px",
                    boxShadow: "0 0 10px rgba(130, 143, 169, 0.15)",
                    // ADD: visual focus ring — matches the blue in your screenshot
                    outline: focusZone === 'right' ? '2px solid rgba(38, 102, 190, 0.5)' : 'none',
                    transition: 'outline 150ms ease',
                  }}
                >
                  <div ref={fullReportRef} className="executive-summary">
                    <div className="sticky top-0 bg-white z-50 pt-0">
                      {scrollProgress > 0 && (
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-150"
                            style={{ width: `${scrollProgress}%` }}
                          ></div>
                        </div>
                      )}
                      <div
                        style={{
                          padding:
                            scrollProgress > 0 ? "10px 3%" : "2% 3% 0% 3%",
                        }}
                        ref={stickyRef}
                      >
                        <h2
                          style={{
                            fontFamily: "Rubik",
                            color: "rgba(0,0,0,0.9)",
                            fontWeight: 500,
                            fontSize: isSticky ? "17px" : "28px",
                            margin: 0,
                            whiteSpace: isSticky ? "nowrap" : "normal",
                            overflow: isSticky ? "hidden" : "visible",
                            textOverflow: isSticky ? "ellipsis" : "unset",
                            lineHeight: isSticky ? "24px" : "36px",
                          }}
                        >
                          {(() => {
                            const studyTitleObj = selectedIdData?.top_info?.value?.study_title;
                            const shortTitleObj = selectedIdData?.top_info?.value?.short_study_title;
                            const shortTitle =
                              shortTitleObj?.value || studyTitleObj?.value || "";
                            // Full/original title shown on hover of the info icon.
                            const originalTitle =
                              shortTitleObj?.original_value ||
                              studyTitleObj?.original_value ||
                              studyTitleObj?.value ||
                              "";
                            const hasOriginal =
                              originalTitle && originalTitle !== shortTitle;

                            return (
                              <>
                                <SafeRender>{shortTitle}</SafeRender>
                                {hasOriginal && !isSticky && (
                                  <StudyTitleInfo originalTitle={originalTitle} />
                                )}
                              </>
                            );
                          })()}
                        </h2>
                      </div>

                      <div
                        style={{
                          overflow: downloadOpen ? "visible" : "hidden",
                          maxHeight: showStickyHeader ? 120 : 0,
                          opacity: showStickyHeader ? 1 : 0,
                          transform: showStickyHeader
                            ? "translateY(0)"
                            : "translateY(-8px)",
                          padding: showStickyHeader ? "2% 3%" : "0 3%",
                          pointerEvents: showStickyHeader ? "auto" : "none",
                          transition:
                            "max-height 200ms ease, opacity 200ms ease, transform 200ms ease, padding 200ms ease",
                        }}
                        className="bg-white border-b border-gray-100 shadow-sm"
                      >
                        <ActionBar compact />
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1% 3% 2% 3%",
                      }}
                    >
                      <div>
                        <div className="flex flex-row flex-wrap items-center gap-x-2 text-[13px] text-gray-500 mb-6 w-full max-w-full" style={{ overflow: "visible", lineHeight: "1.6" }}>
                          {selectedIdData?.top_info?.value
                            ? [
                              {
                                key: "phase",
                                label: formatLabelValue(getTopInfoValue("phase")),
                                fallback: "phase N/A",
                                data: getTopInfoData("phase"),
                              },
                              {
                                key: "study_intent",
                                label: formatLabelValue(getTopInfoValue("study_intent")),
                                fallback: "study intent N/A",
                                data: getTopInfoData("study_intent"),
                              },
                              {
                                key: "organ",
                                label: formatLabelValue(getTopInfoValue("organ")),
                                fallback: "organ N/A",
                                data: getTopInfoData("organ"),
                              },
                              {
                                key: "stage",
                                label: formatLabelValue(getTopInfoValue("stage")),
                                fallback: "stage N/A",
                                data: getTopInfoData("stage"),
                              },
                              {
                                key: "line_of_therapy",
                                label: formatLabelValue(getTopInfoValue("line_of_therapy")),
                                fallback: "line of therapy N/A",
                                data: getTopInfoData("line_of_therapy"),
                              },
                              {
                                key: "trial_architecture",
                                label: formatLabelValue(getTopInfoValue("trial_architecture")),
                                fallback: "arm N/A",
                                data: getTopInfoData("trial_architecture"),
                              },
                              {
                                key: "biomarker",
                                label: formatLabelValue(getTopInfoValue("biomarker")),
                                fallback: "biomarker N/A",
                                data: getTopInfoData("biomarker"),
                              },
                              {
                                key: "histology",
                                label: formatLabelValue(getTopInfoValue("histology")),
                                fallback: "histology N/A",
                                data: getTopInfoData("histology"),
                              },
                              {
                                key: "regimen_combination",
                                label: formatLabelValue(getTopInfoValue("regimen_combination")),
                                fallback: "regimen combination N/A",
                                data: getTopInfoData("regimen_combination"),
                              },
                              {
                                key: "cohort_count",
                                label: formatCohortCountLabel(
                                  (selectedIdData?.phases || []).reduce(
                                    (acc, phase) => acc + (phase?.value || []).filter(c => c?.title).length,
                                    0
                                  ) || null
                                ),
                                fallback: "cohort count N/A",
                                data: getTopInfoData("cohort_count"),
                              },
                            ]
                              // For this specific OncoSuite study, show ONLY the
                              // 7 requested dimensions in the sub-text; every
                              // other study keeps the full breadcrumb.
                              .filter((item) => {
                                const currentOncosuiteId =
                                  selectedIdData?.top_info?.value?.oncosuite_id?.value;
                                if (currentOncosuiteId !== "wD7-VqO-nZf") return true;
                                return [
                                  "phase",
                                  "study_intent",
                                  "organ",
                                  "stage",
                                  "line_of_therapy",
                                  "trial_architecture",
                                  "biomarker",
                                ].includes(item.key);
                              })
                              .filter(
                                (item) =>
                                  item.label &&
                                  item.label !== "Not available",
                              )
                              ?.map((item, index) => {
                                const valuesArray = item.key === "cohort_count"
                                  ? item.label
                                  : item.data?.value;

                                return (
                                  <React.Fragment key={item.key}>
                                    {index > 0 && (
                                      <span className="text-gray-400 shrink-0 mx-1 select-none flex-shrink-0" style={{ fontSize: "18px" }}>
                                        •
                                      </span>
                                    )}

                                    <div className="inline-block min-w-0 align-middle overflow-visible">
                                      <InnerMetadataWrapper
                                        valuesArray={valuesArray}
                                        item={item}
                                        selectedIdData={selectedIdData}
                                        EvidenceHoverHeader={EvidenceHoverHeader}
                                      />
                                    </div>
                                  </React.Fragment>
                                );
                              })
                            : ""}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-y-6 gap-x-8 mt-6">
                        {selectedIdData?.top_info?.value ? (
                          [
                            {
                              label: "Sponsor",
                              value: selectedIdData?.top_info?.value?.sponsor,
                            },
                            {
                              label: "Study Lead",
                              value: selectedIdData?.top_info?.value?.study_lead,
                            },
                            {
                              label: "Latest update",
                              value: selectedIdData?.top_info?.value?.latest_update,
                            },
                            {
                              label: "Primary completion",
                              value: selectedIdData?.top_info?.value?.primary_completion,
                            },
                            {
                              label: "Status",
                              value: selectedIdData?.top_info?.value?.status,
                              isStatus: true,
                            },
                            // {
                            //   label: "Cohort Count",
                            //   value: selectedIdData?.cohort_name?.cohort_count?.value,
                            // },
                            {
                              label: "Registry",
                              value: selectedIdData?.top_info?.value?.registry_source,
                            },
                          ]
                            ?.filter((item) => item.value && item.value !== "Not available")
                            ?.map((item, index) => (
                              <div
                                key={index}
                                className={`flex flex-col relative ${index % 3 !== 0 ? "pl-8 border-l border-gray-200" : ""}`}
                              >
                                <div className="flex flex-col">
                                  <span
                                    className="text-gray-500 text-xs mb-1"
                                    style={{
                                      fontFamily: "rubik",
                                      fontWeight: "400",
                                      fontStyle: "regular",
                                      fontSize: item.label === "Sponsor" ? "16px" : "16px",
                                      lineHeight: "100%",
                                      letterSpacing: "0%",
                                      color:
                                        item.label === "Sponsor"
                                          ? "rgba(0, 0, 0, 0.6)"
                                          : undefined,
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.label === "Registry" ? (
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const registryValue = item.value;

                                        const usingTitleAsPrimary =
                                          typeof registryValue?.title === "string" &&
                                          registryValue.title.trim().length > 0;

                                        const registryIds = Array.isArray(registryValue)
                                          ? registryValue
                                          : Array.isArray(registryValue?.value)
                                            ? registryValue.value
                                            : Array.isArray(registryValue?.value?.value)
                                              ? registryValue.value.value
                                              : [];

                                        const first = registryIds?.[0];

                                        const pickText = (val) => {
                                          if (typeof val === "string") return val;
                                          if (val && typeof val === "object") {
                                            return (
                                              (typeof val.id === "string" && val.id) ||
                                              (typeof val.title === "string" && val.title) ||
                                              (typeof val.value === "string" && val.value) ||
                                              ""
                                            );
                                          }
                                          return "";
                                        };

                                        const registryCode = usingTitleAsPrimary
                                          ? registryValue.title
                                          : pickText(first) ||
                                          pickText(registryValue?.id) ||
                                          pickText(registryValue?.title) ||
                                          pickText(registryValue?.value) ||
                                          "";

                                        const extraRegistryCodes = usingTitleAsPrimary
                                          ? registryIds.map((entry) => pickText(entry)).filter(Boolean)
                                          : registryIds
                                            .slice(1)
                                            .map((entry) => pickText(entry))
                                            .filter(Boolean);

                                        const extraCount = usingTitleAsPrimary
                                          ? registryIds.length
                                          : registryIds.length > 1
                                            ? registryIds.length - 1
                                            : 0;

                                        const getRegistryUrl = (id) => {
                                          const trimmed = id.trim();
                                          if (/^NCT\d+$/i.test(trimmed))
                                            return `https://clinicaltrials.gov/study/${trimmed}`;
                                          if (/^EU\s?CTR\s?[\d-]+$/i.test(trimmed) || /^\d{4}-\d{6}-\d{2}(-\w+)?$/.test(trimmed))
                                            return `https://www.clinicaltrialsregister.eu/ctr-search/search?query=${encodeURIComponent(trimmed)}`;
                                          if (/^ChiCTR/i.test(trimmed))
                                            return `https://www.chictr.org.cn/showproj.aspx?proj=${trimmed}`;
                                          if (/^ISRCTN/i.test(trimmed))
                                            return `https://www.isrctn.com/${trimmed}`;
                                          if (/^ACTRN/i.test(trimmed))
                                            return `https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?id=${trimmed.replace(/^ACTRN/i, "")}`;
                                          if (/^CTRI/i.test(trimmed))
                                            return `https://ctri.nic.in/Clinicaltrials/showallp.php?mid1=&EncHid=&userName=${encodeURIComponent(trimmed)}`;
                                          if (/^DRKS/i.test(trimmed))
                                            return `https://drks.de/search/en/trial/${trimmed}`;
                                          if (/^jRCT/i.test(trimmed))
                                            return `https://jrct.niph.go.jp/en-latest-detail/${trimmed}`;
                                          if (/^UMIN/i.test(trimmed))
                                            return `https://upload.umin.ac.jp/cgi-open-bin/ctr_e/ctr_view.cgi?recptno=${trimmed}`;
                                          return null;
                                        };

                                        const RegistryLink = ({ code }) => {
                                          const url = getRegistryUrl(code);
                                          const baseStyle = {
                                            fontSize: "14px",
                                            fontFamily: "Rubik, sans-serif",
                                            fontWeight: "500",
                                            lineHeight: "20px",
                                            textDecoration: "none",
                                          };
                                          return url ? (
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ ...baseStyle, color: "rgba(38, 102, 190, 1)" }}
                                              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                                              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                                            >
                                              {code}
                                            </a>
                                          ) : (
                                            <span style={{ ...baseStyle, color: "rgba(0,0,0,0.8)" }}>{code}</span>
                                          );
                                        };

                                        return (
                                          <>
                                            <RegistryLink code={registryCode || "-"} />
                                            {extraCount > 0 && (
                                              <Tooltip
                                                placement="bottom-start"
                                                title={
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      flexDirection: "column",
                                                      gap: "8px",
                                                      padding: "8px 10px",
                                                      fontFamily: "Rubik, sans-serif",
                                                    }}
                                                  >
                                                    {extraRegistryCodes.map((code, idx) => (
                                                      <div key={`${code}-${idx}`}>
                                                        <RegistryLink code={code} />
                                                      </div>
                                                    ))}
                                                  </div>
                                                }
                                                slotProps={{
                                                  tooltip: {
                                                    sx: {
                                                      backgroundColor: "rgba(255,255,255,1)",
                                                      boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.15)",
                                                      borderRadius: "8px",
                                                      padding: 0,
                                                    },
                                                  },
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    height: "20px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "4px",
                                                    padding: "3px 6px",
                                                    gap: "2px",
                                                    background: "rgba(232, 232, 236, 1)",
                                                    fontFamily: "Rubik",
                                                    fontWeight: 500,
                                                    fontSize: "12px",
                                                    lineHeight: "16px",
                                                    letterSpacing: "0%",
                                                    color: "rgba(0,0,0,0.8)",
                                                    cursor: "default",
                                                  }}
                                                >
                                                  +{extraCount}
                                                </span>
                                              </Tooltip>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <div
                                      className={item.isStatus ? "relative inline-flex items-center gap-1 w-fit" : undefined}
                                      onMouseEnter={item.isStatus ? () => setHoveredId(item.id ?? `${item.label}-${index}`) : undefined}
                                      onMouseLeave={item.isStatus ? () => setHoveredId(null) : undefined}
                                      style={{
                                        fontSize: "16px",
                                        fontFamily: "Rubik, sans-serif",
                                        fontWeight: "500",
                                        lineHeight: "20px",
                                        letterSpacing: "0%",
                                        color: item?.isStatus
                                          ? getStatusColor(item.value?.value)
                                          : "rgba(0, 0, 0, 0.8)",
                                        cursor: item.isStatus ? "pointer" : "default",
                                      }}
                                    >
                                      <SafeRender>
                                        {(() => {
                                          const rawValue = item.value?.value ?? item.value;
                                          const iso =
                                            typeof rawValue === "string" &&
                                              /^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())
                                              ? rawValue.trim()
                                              : null;

                                          const shouldFormatDate =
                                            item.label === "Latest update" ||
                                            item.label === "Primary completion";

                                          if (!shouldFormatDate || !iso) return rawValue;

                                          const [yyyy, mm, dd] = iso.split("-");
                                          const monthIndex = Number(mm) - 1;
                                          const months = [
                                            "Jan",
                                            "Feb",
                                            "Mar",
                                            "Apr",
                                            "May",
                                            "Jun",
                                            "Jul",
                                            "Aug",
                                            "Sep",
                                            "Oct",
                                            "Nov",
                                            "Dec",
                                          ];
                                          const day = Number(dd);
                                          const month = months[monthIndex] ?? mm;
                                          return `${day} ${month} ${yyyy}`;
                                        })()}
                                      </SafeRender>

                                      {item.isStatus && (
                                        <div className="p-1">
                                          <svg
                                            className={`w-4 h-4 transition-colors ${hoveredId === (item.id ?? `${item.label}-${index}`) ? 'text-orange-600' : 'text-orange-400'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            style={{
                                              transform: hoveredId === (item.id ?? `${item.label}-${index}`) ? "rotate(180deg)" : "rotate(0deg)",
                                              transformOrigin: "center",
                                              transition: "transform 150ms ease, color 150ms ease",
                                            }}
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      )}

                                      {item.isStatus && hoveredId === (item.id ?? `${item.label}-${index}`) && sortedTimeline && (
                                        <div
                                          className="absolute z-[9999] top-full bg-white border animate-in fade-in zoom-in duration-200 overflow-x-auto overflow-y-visible"
                                          style={{
                                            boxSizing: 'border-box',
                                            width: "min(820px, 90vw)",
                                            zIndex: "9999",
                                            borderRadius: "4px",
                                            borderColor: "rgba(0,0,0,0.05)",
                                            padding: "15px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
                                            left: index % 3 === 0 ? "0" : index % 3 === 1 ? "50%" : "auto",
                                            right: index % 3 === 2 ? "0" : "auto",
                                            transform: index % 3 === 1 ? "translateX(-50%)" : "none",
                                          }}
                                        >
                                          <Timeline data={sortedTimeline} noContainer />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="col-span-3 flex items-center justify-center bg-gray-50/50 rounded-lg min-h-[80px] mt-2">
                            <div className="flex flex-col items-center gap-1">
                              <p className="text-gray-400 text-sm italic font-medium">
                                Detailed metrics not available
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enrollment & Sites Cards */}
                      {(() => {
                        const sd = studyDetails?.study_details;
                        const enrollmentValue =
                          selectedIdData?.top_info?.value?.enrollment?.value ||
                          sd?.enrollment?.value;
                        const hasEnrollment =
                          enrollmentValue?.Planned?.value || enrollmentValue?.Completed?.value;

                        const siteSummary =
                          selectedIdData?.top_info?.value?.sites ||
                          sd?.sites || sd?.patient_population?.value?.sites;
                        const siteSummaryValue = siteSummary?.value;
                        const hasSites = (() => {
                          if (!siteSummaryValue) return false;
                          if (Array.isArray(siteSummaryValue)) return siteSummaryValue.length > 0;
                          if (typeof siteSummaryValue === "object") return Object.keys(siteSummaryValue).length > 0;
                          if (typeof siteSummaryValue === "string") return siteSummaryValue.trim().length > 0;
                          return false;
                        })();
                        const siteSummaryDisplayValue =
                          siteSummaryValue && typeof siteSummaryValue === "object"
                            ? siteSummaryValue.value
                            : siteSummaryValue;

                        if (!hasEnrollment && !hasSites) return null;

                        const cardStyle = {
                          width: "100%",
                          minHeight: "78px",
                          padding: "15px",
                          borderRadius: "4px",
                          border: "1px solid rgba(0, 0, 0, 0.05)",
                          boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
                          gap: "0px",
                          boxSizing: "border-box",
                          background: "#fff",
                        };

                        const getEv = (item) => {
                          const trace = getTraceability(item);
                          return {
                            source_date: selectedIdData?.source_date,
                            version: selectedIdData?.version,
                            nctId: selectedIdData?.top_info?.value?.nct_id?.value,
                            highlight: trace?.source_text || [],
                            arm: item?.title || "Detail",
                            reasoning: trace?.reasoning,
                            confidence: trace?.confidence_score,
                            source: trace?.source,
                            source_link: trace?.source_link,
                            // Structured source-document snippet + terms to highlight in it.
                            snippet: trace?.snippet,
                            keywords: trace?.keywords,
                          };
                        };

                        const bothCards = hasEnrollment && hasSites;
                        return (
                          <div className={`grid ${bothCards ? "grid-cols-2" : "grid-cols-1"} gap-3 mt-5`}>
                            {hasEnrollment && (
                              <div style={cardStyle}>
                                <p style={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "16px", color: "rgba(0,0,0,0.7)", margin: 0 }}>
                                  Enrollment
                                </p>
                                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                                  {enrollmentValue?.Planned?.value && (() => {
                                    const rawValue = String(enrollmentValue.Planned.value ?? "N/A");
                                    const match = rawValue.match(/(\d+)\s*\(([^)]+)\)/);
                                    const number = match?.[1] || rawValue;
                                    const text = match?.[2] || "";
                                    return (
                                      <span style={{ fontSize: "16px", fontFamily: "Rubik", color: "rgba(0,0,0,0.5)" }}>
                                        <EvidenceHoverHeader
                                          label={
                                            <>
                                              <strong style={{ fontSize: "16px", fontFamily: "Rubik", fontWeight: "500", color: "rgba(0,0,0,0.7)" }}>
                                                {number}
                                              </strong>
                                              {text && <>&nbsp;({text})</>}
                                            </>
                                          }
                                          evidence={getEv(enrollmentValue.Planned)}
                                        />
                                      </span>
                                    );
                                  })()}
                                  {enrollmentValue?.Completed?.value && (() => {
                                    const rawValue = String(enrollmentValue.Completed.value ?? "N/A");
                                    const match = rawValue.match(/^([^\s(]+)\s*\(([^)]+)\)/);
                                    const number = match?.[1] || rawValue;
                                    const text = match?.[2] ? ` (${match[2]})` : "";
                                    return (
                                      <span style={{ fontSize: "16px", fontFamily: "Rubik", color: "rgba(0,0,0,0.5)" }}>
                                        <EvidenceHoverHeader
                                          label={
                                            <>
                                              <strong style={{ fontSize: "16px", fontFamily: "Rubik", fontWeight: "500", color: "rgba(0,0,0,0.7)" }}>
                                                {number}
                                              </strong>
                                              {text && <>&nbsp;{text}</>}
                                            </>
                                          }
                                          evidence={getEv(enrollmentValue.Completed)}
                                        />
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {hasSites && (
                              <div style={cardStyle}>
                                <p style={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "16px", color: "rgba(0,0,0,0.7)", margin: 0 }}>
                                  {siteSummary?.title || "Sites"}
                                </p>
                                <div style={{ marginTop: "8px" }}>
                                  <SitesCard
                                    siteSummary={siteSummary}
                                    siteSummaryValue={siteSummaryValue}
                                    siteSummaryDisplayValue={siteSummaryDisplayValue}
                                    getEv={getEv}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* <div className="flex flex-col gap-6 mt-6">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          {[
                            {
                              id: "evidence",
                              title: "Evidence Strength", // Added explicit title for fallback
                              data: selectedIdData?.top_info?.value
                                ?.trial_quality_scores?.value
                                ?.evidence_strength,
                              footerNote:
                                "This score reflects the statistical robustness and design quality of the clinical trial.",
                            },
                            {
                              id: "operational",
                              title: "Operational Feasibility", // Added explicit title for fallback
                              data: selectedIdData?.top_info?.value
                                ?.trial_quality_scores?.value
                                ?.operational_feasibility,
                              footerNote:
                                "Feasibility is calculated based on site distribution and enrollment rates.",
                            },
                          ].map((card) => {
                            const hasData = !!card.data;
                            const isPositive = card?.data?.benchmark >= 0;
                            const scoreBreakdown = card.data?.value
                              ? Object.entries(card.data.value)
                              : [];
                            const isHovered =
                              hasData && activeCard === card.id; // Only hover if data exists

                            return (
                              <div
                                key={card.id}
                                // onMouseEnter={() =>
                                //   hasData && setActiveCard(card.id)
                                // }
                                // onMouseLeave={() => setActiveCard(null)}
                                className={classes.evidence_card}
                              >
                                <div
                                  className="grid transition-[grid-template-rows] duration-500 ease-in-out"
                                  style={{
                                    gridTemplateRows: isHovered
                                      ? "1fr"
                                      : "auto",
                                  }}
                                >
                                  <div className="overflow-hidden">
                                    <div className="relative min-h-[105px]">
                                      {!isHovered && (
                                        <div className="flex flex-col animate-out fade-out duration-300 fill-mode-forwards ease-in-out">
                                          <div className="flex items-center gap-2">
                                            {!hasData && (
                                              <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-200 text-gray-500 text-[10px] font-bold">
                                                {card.id === "evidence"
                                                  ? "ES"
                                                  : "OF"}
                                              </div>
                                            )}
                                            <span
                                              className={
                                                classes.evidence_card_title
                                              }
                                            >
                                              {card.data?.title ||
                                                card.title}
                                              <img
                                                src={helpIcon}
                                                alt="help-icon"
                                              />
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-baseline">
                                              <span
                                                className={`font-semibold  leading-none tracking-tight ${hasData ? "text-gray-800" : "text-gray-300"}`}
                                                style={{
                                                  fontSize: "30px",
                                                  lineHeight: "32px",
                                                  fontFamily: "rubik",
                                                }}
                                              >
                                                {hasData
                                                  ? card.data?.score || 0
                                                  : "—"}
                                              </span>
                                              <span
                                                className={
                                                  classes.evidence_card_total
                                                }
                                              >
                                                /100
                                              </span>
                                            </div>
                                            {hasData ? (
                                              <div
                                                className={
                                                  isPositive
                                                    ? classes.evidence_card_bar_positive
                                                    : classes.evidence_card_bar_negative
                                                }
                                              >
                                                {isPositive
                                                  ? `+${card?.data?.benchmark}`
                                                  : card?.data
                                                    ?.benchmark}{" "}
                                                compared to benchmark
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 text-xs italic">
                                                Data not available
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {isHovered && hasData && (
                                        <div className="flex flex-col space-y-0.5">
                                          {scoreBreakdown.map(
                                            ([key, detail], index) => (
                                              <div
                                                key={key}
                                                className="animate-in fade-in slide-in-from-top-2 duration-500 ease-out fill-mode-both"
                                                style={{
                                                  animationDelay: `${index * 50}ms`,
                                                }}
                                              >
                                                <EvidenceHoverHeader
                                                  label={
                                                    <div
                                                      className={`flex items-center gap-3 py-1.5 cursor-pointer group transition-colors duration-200 ${index % 2 === 1
                                                        ? "bg-gray-50/80 -mx-4 px-4"
                                                        : "px-0"
                                                        }`}
                                                    >
                                                      <div
                                                        className="flex items-center justify-center rounded shrink-0"
                                                        style={{
                                                          width: "18px",
                                                          height: "18px",
                                                          backgroundColor:
                                                            "#f3f4f7",
                                                          minWidth: "18px",
                                                        }}
                                                      >
                                                        <svg
                                                          width="8"
                                                          height="8"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                          className="text-gray-400 group-hover:text-gray-600"
                                                        >
                                                          <path
                                                            d="M9 5l7 7-7 7"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                          />
                                                        </svg>
                                                      </div>
                                                      <div className="flex justify-between w-full items-center">
                                                        <span className="text-[12px] text-gray-500 font-normal group-hover:text-gray-900">
                                                          {detail?.title ||
                                                            key.replace(
                                                              /_/g,
                                                              " ",
                                                            )}
                                                        </span>
                                                        <span className="text-[12px] font-medium text-gray-700 px-1">
                                                          {detail?.score > 0
                                                            ? `+ ${detail.score}`
                                                            : detail?.score <
                                                              0
                                                              ? ` ${detail.score}`
                                                              : "→ 0"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  }
                                                  evidence={{
                                                    source_date:
                                                      selectedIdData?.source_date,
                                                    version:
                                                      selectedIdData?.version,
                                                    highlight:
                                                      detail?.source_text,
                                                    reasoning:
                                                      detail?.reasoning ||
                                                      "No reasoning provided.",
                                                    confidence:
                                                      detail?.confidence_score ||
                                                      "0",
                                                    source: detail?.source,
                                                    source_link:
                                                      detail?.source_link,
                                                    nctId:
                                                      selectedIdData
                                                        ?.top_info?.value
                                                        ?.nctid?.value,
                                                  }}
                                                />
                                              </div>
                                            ),
                                          )}
                                          <div
                                            className="mt-4 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-500 ease-out fill-mode-both"
                                            style={{
                                              animationDelay: `${(scoreBreakdown?.length + 1) * 50}ms`,
                                            }}
                                          >
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-[14px] font-bold text-gray-900">
                                                Subtotal: {card.data?.score}
                                              </span>
                                              <span className="text-gray-300">
                                                →
                                              </span>
                                              <span className="text-[14px] font-bold text-gray-900">
                                                {card.data?.score <= 0
                                                  ? "0"
                                                  : card.data?.score}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-snug">
                                              {card.footerNote}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </section>

                        <section className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm grid grid-cols-12 gap-y-8 md:gap-y-0 items-start h-full min-h-[80px]">
                          {selectedIdData?.top_info?.value
                            ?.study_evaluation ? (
                            <>
                              <div className="col-span-12 md:col-span-6 md:pr-10">
                                <EvidenceHoverHeader
                                  label={
                                    <h3
                                      className={
                                        classes.study_evaluation_title
                                      }
                                    >
                                      {selectedIdData?.top_info?.value
                                        ?.study_evaluation?.title ||
                                        "What This Study Evaluates"}
                                    </h3>
                                  }
                                  evidence={{
                                    source_date:
                                      selectedIdData?.source_date,
                                    version: selectedIdData?.version,
                                    highlight:
                                      selectedIdData?.top_info?.value
                                        ?.study_evaluation?.source_text,
                                    arm: selectedIdData?.top_info?.value
                                      ?.study_evaluation?.title,
                                    reasoning:
                                      selectedIdData?.top_info?.value
                                        ?.study_evaluation?.reasoning,
                                    confidence:
                                      selectedIdData?.top_info?.value
                                        ?.study_evaluation
                                        ?.confidence_score,
                                    source:
                                      selectedIdData?.top_info?.value
                                        ?.study_evaluation?.source,
                                    source_link:
                                      selectedIdData?.top_info?.value
                                        ?.study_evaluation?.source_link,
                                    nctId:
                                      selectedIdData?.top_info?.value?.nctid
                                        ?.value,
                                  }}
                                />
                                <p
                                  className={classes.study_evaluation_value}
                                >
                                  {
                                    selectedIdData?.top_info?.value
                                      ?.study_evaluation?.value
                                  }
                                </p>
                              </div>
                              <div className="col-span-12 md:col-span-3 md:border-l border-gray-200 md:px-6 h-full min-h-[80px]">
                                <h3
                                  className={classes.study_evaluation_title}
                                >
                                  {selectedIdData?.top_info?.value
                                    ?.primary_endpoint?.title ||
                                    "Primary Endpoint"}
                                </h3>
                                <p
                                  className={classes.study_evaluation_value}
                                >
                                  {
                                    selectedIdData?.top_info?.value
                                      ?.primary_endpoint?.value
                                  }
                                </p>
                              </div>
                              <div className="col-span-12 md:col-span-3 md:border-l border-gray-200 md:pl-6 md:pl-6 h-full min-h-[80px]">
                                <h3
                                  className={classes.study_evaluation_title}
                                >
                                  {selectedIdData?.study_details
                                    ?.patient_population?.value?.enrollment
                                    ?.title || "Enrollment"}
                                </h3>
                                <div className="flex flex-col gap-1.5">
                                  {selectedIdData?.study_details
                                    ?.patient_population?.value?.enrollment
                                    ?.value?.Planned?.value &&
                                    selectedIdData?.study_details
                                      ?.patient_population?.value
                                      ?.enrollment?.value?.Planned
                                      ?.value !== "Not available" && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-800 font-medium text-sm">
                                          {(() => {
                                            const rawValue =
                                              selectedIdData?.study_details
                                                ?.patient_population?.value
                                                ?.enrollment?.value?.Planned
                                                ?.value;
                                            if (!rawValue) return null;

                                            // Split the string keeping the parentheses
                                            const parts =
                                              rawValue.split(/(\(.*\))/g);

                                            return parts.map(
                                              (part, index) =>
                                                part.startsWith("(") &&
                                                  part.endsWith(")") ? (
                                                  <span
                                                    key={index}
                                                    className={
                                                      classes.enrollment_no_value
                                                    }
                                                  >
                                                    {part}
                                                  </span>
                                                ) : (
                                                  <span
                                                    key={index}
                                                    className={
                                                      classes.enrollment_text_value
                                                    }
                                                  >
                                                    {part}
                                                  </span>
                                                ),
                                            );
                                          })()}
                                        </span>
                                      </div>
                                    )}

                                  {selectedIdData?.study_details
                                    ?.patient_population?.value?.enrollment
                                    ?.value?.Actual?.value &&
                                    selectedIdData?.study_details
                                      ?.patient_population?.value
                                      ?.enrollment?.value?.Actual?.value !==
                                    "Not available" && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-800 font-medium text-sm">
                                          {(() => {
                                            const rawValue =
                                              selectedIdData?.study_details
                                                ?.patient_population?.value
                                                ?.enrollment?.value?.Actual
                                                ?.value;
                                            if (!rawValue) return null;
                                            const parts =
                                              rawValue.split(/(\(.*\))/g);

                                            return parts.map(
                                              (part, index) =>
                                                part.startsWith("(") &&
                                                  part.endsWith(")") ? (
                                                  <span
                                                    key={index}
                                                    className={
                                                      classes.enrollment_no_value
                                                    }
                                                  >
                                                    {part}
                                                  </span>
                                                ) : (
                                                  <span
                                                    className={
                                                      classes.enrollment_text_value
                                                    }
                                                    key={index}
                                                  >
                                                    {part}
                                                  </span>
                                                ),
                                            );
                                          })()}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="col-span-3 flex items-center justify-center bg-gray-50/50 rounded-lg min-h-[80px] mt-2">
                              <div className="flex flex-col items-center gap-1">
                                <p className={classes.enrollment_no_value}>
                                  Not available
                                </p>
                              </div>
                            </div>
                          )}
                        </section>
                      </div>  */}
                      {/* Action Buttons */}
                      <div
                        style={{
                          opacity: showStickyHeader ? 0 : 1,
                          pointerEvents: showStickyHeader ? "none" : "auto",
                          transition: "opacity 150ms ease",
                        }}
                        ref={actionBarRef}
                      >
                        <div className="mt-5"><ActionBar /></div>
                      </div>

                      {/* Tabs and Content */}
                      <div className="mt-6">
                        <div>
                          <div className="flex space-x-6">
                            <CommonTabs
                              tabs={homepageTabs}
                              onChange={onChangeTab}
                              defaultValue={activeTab}
                              disabledTabs={
                                isResultDisabled &&
                                  isTerminatedDisabled &&
                                  isWithdrawnDisabled
                                  ? ["Results"]
                                  : []
                              }
                              page={"trialDetails"}
                            />
                          </div>
                        </div>

                        {/* Tab Content - Your existing tab content goes here */}
                        {Object.keys(selectedIdData)?.length !== 0 ? (
                          <div className={activeTab === "Study Details" ? "" : "mt-4"}>
                            {activeTab === "Study Details" && (
                              <>
                                <div
                                  style={{
                                    fontFamily: "Rubik",
                                    fontWeight: 500,
                                    fontSize: 22,
                                    lineHeight: "24px",
                                    letterSpacing: "0%",
                                    color: "rgba(0,0,0,0.8)",
                                    paddingTop: "24px",
                                    paddingBottom: "24px",
                                  }}
                                >
                                  Eligibility Criteria
                                </div>
                                <StudyDetailsTab
                                  selectedIdData={selectedIdData}
                                  selectedCard={selectedCard}
                                  patientDempgraphicRows={
                                    patientDempgraphicRows
                                  }
                                  eligibilityRows={eligibilityRows}
                                  steps={sortedTimeline}
                                  oncosuite_id={
                                    selectedIdData?.top_info?.value?.oncosuite_id
                                      ?.value
                                  }
                                  source_date={selectedIdData?.source_date}
                                  version={selectedIdData?.version}
                                  studyDetails={studyDetails}
                                  selectedPhase={selectedPhase}
                                />
                              </>
                            )}
                            {activeTab === "Results" && (
                              <div>
                                <ResultsTab
                                  data={studyDetails}
                                  isResultDisabled={isResultDisabled}
                                  oncosuite_id={
                                    selectedIdData?.top_info?.value?.oncosuite_id
                                      ?.value
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-3 bg-gray-50/50 border border-dashed border-gray-200 rounded-md min-h-[50px]">
                            <p className="text-gray-400 text-sm italic font-medium">
                              Not available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : trials?.total_found === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", gap: 16, padding: "40px 32px",
                textAlign: "center",
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(229, 235, 245, 0.8)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M20 20L17 17" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8.5 11H13.5M11 8.5V13.5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8.5 11H13.5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#1F2937", marginBottom: 6, fontFamily: "Rubik" }}>
                    No trials found
                  </p>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, maxWidth: 260, fontFamily: "Rubik" }}>
                    Your current filter combination returned no matching trials. Try removing or adjusting a filter to broaden your search.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", gap: 16, padding: "40px 32px",
                textAlign: "center",
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(229, 235, 245, 0.8)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.8"/>
                    <path d="M3 9H21" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 5V3M16 5V3" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M7 13H12M7 16H10" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#1F2937", marginBottom: 6, fontFamily: "Rubik" }}>
                    Select a trial to view details
                  </p>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, maxWidth: 260, fontFamily: "Rubik" }}>
                    Click on any trial card on the left to see its full study details, results, and site information here.
                  </p>
                </div>
              </div>
            )}
            {isModalOpen && (
              <PopUpModal
                modalItems={modalItems}
                modalTitle={modalTitle}
                setIsModalOpen={setIsModalOpen}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ListTabContainer;
