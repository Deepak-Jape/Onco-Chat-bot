import { useEffect, useState } from "react";
// import data from "./treatmentStrategiesData.json";
// import treatmentStrategiesData from "./treatmentStrategiesData.json";

import rawData from "./treatmentData.json";
import { useMemo } from "react";
import { useRef, useLayoutEffect } from "react";
import { useMediaQuery } from "../useMediaQuery";
import { styles } from "./style";
import { getTreatmentAnalytics } from "../../../api/analytics/treatment";
import CustomScrollbar from "../../../common/CustomScrollbar";
import { CircularProgress, Tooltip } from "@mui/material";
import EvidenceHoverHeader from "../trials/EvidenceHoverCell";

export default function TreatmentStrategies({
  activeTable,
  filters,
  apiFilters = {},
  data,
  view,
  onSelect,
  drawerLoading,
  sessionKey,
  onViewChange,
  isFetchingMore,
}) {
  const [focusedRowIdx, setFocusedRowIdx] = useState(null);
  const rowRefs = useRef([]);
  const metricsScrollRefs = useRef([]);
  const rawActiveTableName = Array.isArray(activeTable) ? activeTable[0] : activeTable;
  const activeTableName = String(rawActiveTableName || "")
    .trim()
    .replace(/_table$/i, "");
  // use the view prop directly (parent controls Study/Results)
  const current = data?.[view];
  const chartData = Array.isArray(rawData) ? rawData : rawData.chart || [];
  const [expandedSections, setExpandedSections] = useState({});
  const [sectionLoading, setSectionLoading] = useState({});
  const [expandedRegimens, setExpandedRegimens] = useState({});
  const [regimenLoading, setRegimenLoading] = useState({});
  const REGIMENS_PAGE_SIZE = 50;
  const ARMS_PAGE_SIZE = 50;
  const [sectionPageInfo, setSectionPageInfo] = useState({});
  const [regimenPageInfo, setRegimenPageInfo] = useState({});
  const tableRef = useRef(null);
  const dividerRef = useRef(null);
  const [summaryDrawer, setSummaryDrawer] = useState({
    open: false,
    title: "",
    nctId: null,
  });
  const isSmallScreen = useMediaQuery("(max-width: 900px)");
  const isTreatmentStrategiesTable = activeTableName === "treatment_strategies";
  const isEfficacyVsSafetyTable = activeTableName === "efficacyvssafety";

  const dataLen = Array.isArray(data) ? data.length : 0;

  useEffect(() => {
    setFocusedRowIdx(null);
    rowRefs.current = [];
    metricsScrollRefs.current = [];
  }, [activeTable]);

  const HorizontalScrollHint = ({ children, fadeBg = "#FFFFFF", metricsScrollRef }) => {
    const scrollElRef = useRef(null);
    const [hint, setHint] = useState({ canLeft: false, canRight: false });

    const toTransparent = (color) => {
      if (typeof color !== "string") return "transparent";
      const c = color.trim();
      if (!c) return "transparent";

      if (c.startsWith("#")) {
        const hex = c.slice(1);
        if (hex.length === 6 || hex.length === 8) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          if ([r, g, b].some((v) => Number.isNaN(v))) return "transparent";
          return `rgba(${r},${g},${b},0)`;
        }
      }

      if (c.startsWith("rgba(")) {
        return c.replace(/rgba\(([^)]+)\)/, (m, inner) => {
          const parts = inner.split(",").map((p) => p.trim());
          if (parts.length < 3) return "transparent";
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0)`;
        });
      }

      if (c.startsWith("rgb(")) {
        return c.replace(/rgb\(([^)]+)\)/, (m, inner) => {
          const parts = inner.split(",").map((p) => p.trim());
          if (parts.length < 3) return "transparent";
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0)`;
        });
      }

      return "transparent";
    };

    const updateHint = () => {
      const el = scrollElRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const canRight = maxScroll > 1 && el.scrollLeft < maxScroll - 1;
      const canLeft = el.scrollLeft > 1;
      setHint((prev) =>
        prev.canLeft === canLeft && prev.canRight === canRight
          ? prev
          : { canLeft, canRight },
      );
    };

    useLayoutEffect(() => {
      updateHint();
      const el = scrollElRef.current;
      if (!el) return;

      const onScroll = () => updateHint();
      el.addEventListener("scroll", onScroll, { passive: true });

      const resizeObserver = new ResizeObserver(() => updateHint());
      resizeObserver.observe(el);

      window.addEventListener("resize", updateHint);
      return () => {
        el.removeEventListener("scroll", onScroll);
        resizeObserver.disconnect();
        window.removeEventListener("resize", updateHint);
      };
    }, []);

    const fadeSize = 14;
    const edgeAlpha = 0.35; // keep last digits readable (don’t fully mask at edges)
    const maskImage = hint.canLeft && hint.canRight
      ? `linear-gradient(to right, rgba(0,0,0,${edgeAlpha}) 0px, #000 ${fadeSize}px, #000 calc(100% - ${fadeSize}px), rgba(0,0,0,${edgeAlpha}) 100%)`
      : hint.canRight
        ? `linear-gradient(to right, #000 0px, #000 calc(100% - ${fadeSize}px), rgba(0,0,0,${edgeAlpha}) 100%)`
        : hint.canLeft
          ? `linear-gradient(to right, rgba(0,0,0,${edgeAlpha}) 0px, #000 ${fadeSize}px, #000 100%)`
          : "none";

    // Only show the hint for the horizontally-scrollable years table.
    const effectiveMaskImage = isTreatmentStrategiesTable ? maskImage : "none";

    return (
      <div style={{ position: "relative", flex: "1 1 auto", minWidth: 0 }}>
        {isTreatmentStrategiesTable && hint.canLeft && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 56,
              pointerEvents: "none",
              background:
                `linear-gradient(to right, ${fadeBg}, ${toTransparent(fadeBg)})`,
              zIndex: 2,
            }}
          />
        )}
        {isTreatmentStrategiesTable && hint.canRight && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 56,
              pointerEvents: "none",
              background:
                `linear-gradient(to left, ${fadeBg}, ${toTransparent(fadeBg)})`,
              zIndex: 2,
            }}
          />
        )}
        <div
          ref={(el) => {
            scrollElRef.current = el;
            if (metricsScrollRef) metricsScrollRef.current = el;
          }}
          className="scrollbar-hide"
          style={{
            overflowX: isTreatmentStrategiesTable ? "auto" : "hidden",
            overflowY: "hidden",
            minWidth: 0,
            width: "100%",
            WebkitMaskImage:
              effectiveMaskImage === "none" ? undefined : effectiveMaskImage,
            maskImage: effectiveMaskImage === "none" ? undefined : effectiveMaskImage,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  // Invisible marker rendered near the end of a list; fires onReach once it scrolls
  // into view so the caller can fetch the next page ahead of the user hitting bottom.
  const LoadMoreSentinel = ({ onReach }) => {
    const sentinelRef = useRef(null);

    useEffect(() => {
      const el = sentinelRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onReach();
        },
        { root: null, rootMargin: "200px", threshold: 0 },
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [onReach]);

    return <div ref={sentinelRef} style={{ height: 1 }} />;
  };

  // Component for text with tooltip when truncated
  const TruncatedText = ({ text, style, maxLines = 2 }) => {
    const textRef = useRef(null);
    const [showTooltip, setShowTooltip] = useState(false);

    useLayoutEffect(() => {
      const element = textRef.current;
      if (element && text) {
        // Small delay to ensure DOM is fully rendered
        const checkTruncation = () => {
          // For multi-line text with -webkit-line-clamp
          if (maxLines > 1) {
            const isTextTruncated = element.scrollHeight > element.clientHeight + 1;
            setShowTooltip(isTextTruncated);
            return;
          }

          // For single-line text with text-overflow: ellipsis
          // Create a temporary element to measure the full text width
          const tempElement = document.createElement('div');
          tempElement.style.cssText = window.getComputedStyle(element).cssText;
          tempElement.style.position = 'absolute';
          tempElement.style.visibility = 'hidden';
          tempElement.style.height = 'auto';
          tempElement.style.width = 'auto';
          tempElement.style.whiteSpace = 'nowrap';
          tempElement.style.overflow = 'visible';
          tempElement.style.textOverflow = 'clip';
          tempElement.style.webkitLineClamp = 'unset';
          tempElement.style.webkitBoxOrient = 'unset';
          tempElement.style.display = 'block';
          tempElement.textContent = text;
          
          document.body.appendChild(tempElement);
          const fullTextWidth = tempElement.offsetWidth;
          document.body.removeChild(tempElement);
          
          // Compare with actual element width
          const actualWidth = element.offsetWidth;
          const isTextTruncated = fullTextWidth > actualWidth;
          
          setShowTooltip(isTextTruncated);
        };

        // Use requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(checkTruncation);
      }
    }, [text, maxLines]);

    // Don't render anything if no text
    if (!text) {
      return <div style={style}>-</div>;
    }

    const textStyle = {
      ...style,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: maxLines > 1 ? '-webkit-box' : 'block',
      WebkitLineClamp: maxLines > 1 ? maxLines : 'unset',
      WebkitBoxOrient: maxLines > 1 ? 'vertical' : 'unset',
      whiteSpace: maxLines === 1 ? 'nowrap' : 'normal',
      wordBreak: 'break-word',
      lineHeight: '1.2',
      cursor: showTooltip ? 'help' : 'default',
    };

    const content = (
      <div 
        ref={textRef} 
        style={textStyle}
        title={showTooltip ? "" : text} // avoid MUI Tooltip warning; native title only when not using MUI tooltip
      >
        {text}
      </div>
    );

    // Only show MUI tooltip when text is actually truncated
    if (showTooltip) {
      return (
        <Tooltip 
          title={text} 
          placement="top"
          arrow
          enterDelay={300}
          leaveDelay={100}
          PopperProps={{
            sx: {
              '& .MuiTooltip-tooltip': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'Rubik',
                maxWidth: '400px',
                padding: '8px 12px',
                borderRadius: '6px',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                zIndex: 99999, // Increased z-index to ensure it appears above everything
              },
              '& .MuiTooltip-arrow': {
                color: 'rgba(0, 0, 0, 0.9)',
              },
            },
          }}
        >
          {content}
        </Tooltip>
      );
    }

    // Return plain content without tooltip if not truncated
    return content;
  };

  const ChevronUpSmall = ({ color = "#2666BE" }) => (
    <svg
      width="10.6"
      height="6.5"
      viewBox="0 0 10.6 6.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M1 5.5L5.3 1L9.6 5.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronDownSmall = ({ color = "#2666BE" }) => (
    <svg
      width="10.6"
      height="6.5"
      viewBox="0 0 10.6 6.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M1 1L5.3 5.5L9.6 1"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  /*  helpers  */
  const formatN = (n) => {
    const resolved =
      n && typeof n === "object" && !Array.isArray(n) ? n.value : n;
    return resolved ? Number(resolved).toLocaleString("en-US") : "-";
  };

  const formatASP = (asp) => {
    if (!asp) return "-";
    return `$${Math.round(asp.value / 1000)}k`;
  };
  const unique = (arr) => [...new Set(arr)].filter(Boolean);

  const filterOptions = {
    country: unique(chartData.map((d) => d.country)),
    phase: unique(chartData.map((d) => d.phase)),

    endpoint: unique(
      chartData.map((d) => {
        if (d.orr >= 60) return "High ORR";
        if (d.orr >= 40) return "Medium ORR";
        return "Low ORR";
      }),
    ),

    safety: unique(
      chartData.map((d) => {
        if (d.sae <= 1.5) return "Low SAE";
        if (d.sae <= 2.5) return "Medium SAE";
        return "High SAE";
      }),
    ),
  };
  const armMatchesFilters = (arm, filters) => {
    if (!arm) return false;

    /*  Country  */
    if (filters.country !== "All" && arm.country !== filters.country) {
      return false;
    }

    /*  Phase */
    if (filters.phase !== "All" && arm.phase !== filters.phase) {
      return false;
    }

    /* Endpoint (ORR buckets) */
    if (filters.endpoint !== "All") {
      const endpointBucket =
        arm.metrics?.ORR >= 60
          ? "High ORR"
          : arm.metrics?.ORR >= 40
            ? "Medium ORR"
            : "Low ORR";

      if (endpointBucket !== filters.endpoint) return false;
    }

    /* Safety (SAE buckets) */
    if (filters.safety !== "All") {
      const safetyBucket =
        arm.metrics?.SAERate <= 1.5
          ? "Low SAE"
          : arm.metrics?.SAERate <= 2.5
            ? "Medium SAE"
            : "High SAE";

      if (safetyBucket !== filters.safety) return false;
    }

    return true;
  };

  const dotColor = (color) => {
    switch (color) {
      case "success":
        return "#88D2A8";
      case "warning":
        return "#F7B97C";
      case "danger":
        return "#F7A3A3";
      default:
        return "#B9BBC6";
    }
  };

  const isEvidenceLike = (value) =>
    Boolean(value && typeof value === "object" && !Array.isArray(value));

  const buildEvidence = ({ rawValue, label, displayValue }) => {
    const resolved = isEvidenceLike(rawValue) ? rawValue : {};
    const highlightFallback = `${label}: ${displayValue ?? "-"}`;
    return {
      arm: label,
      source_date: resolved.source_date,
      version: resolved.version,
      highlight: resolved.source_text || resolved.highlight || highlightFallback,
      source_text: resolved.source_text,
      reasoning:
        resolved.reasoning ||
        (resolved.source_text || resolved.source
          ? "No reasoning provided."
          : "No evidence available for this value."),
      confidence: resolved.confidence_score || resolved.confidence || "0",
      source: resolved.source || "Header",
      source_link: resolved.source_link,
      nctId: resolved.nctId || resolved.nctid || resolved.oncosuite_id,
      oncosuite_id: resolved.oncosuite_id,
    };
  };

  const Metric = ({ label, value, rawValue, asp, activeTable }) => {
    const isTreatmentStrategiesTable = activeTable === "treatment_strategies";
    const isEfficacyVsSafetyTable = activeTable === "efficacyvssafety";
    const metricWidth = isTreatmentStrategiesTable
      ? label === "N"
        ? "72px"
        : "74px"
      : isEfficacyVsSafetyTable
        ? "110px"
        : "90px";

    return (
    <div
      style={{
        ...styles.metricCol,
        ...(isEfficacyVsSafetyTable &&
          !isSmallScreen && {
            paddingTop: 4,
            paddingBottom: 2,
          }),
        ...(isSmallScreen && {
          width: "48%", // 2 metrics per row on mobile
        }),
        ...(!isSmallScreen &&
          (isEfficacyVsSafetyTable
            ? { width: "auto", minWidth: 96 }
            : { width: metricWidth })),
      }}
    >
      <div
        style={{
          ...styles.metricLabel,
          ...(isEfficacyVsSafetyTable &&
            !isSmallScreen && {
              marginBottom: 0,
            }),
        }}
      >
        {label === "Grade ≥3 AE rate" ? (
          <>
            Grade ≥3 AE
            <br />
            rate
          </>
        ) : (
          label
        )}
      </div>

      <div
        style={{
          ...styles.metricValue,
          ...(isEfficacyVsSafetyTable &&
            !isSmallScreen && {
              marginTop: 0,
            }),
        }}
      >
        {(() => {
          const valueToRender = value;

          const content = (
            <>
              {asp && valueToRender !== "-" && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dotColor(asp?.color),
                    display: "inline-block",
                    marginRight: 6,
                  }}
                />
              )}
              {typeof valueToRender === "number"
                ? valueToRender === 0
                  ? "-"
                  : Number(valueToRender).toLocaleString("en-US")
                : valueToRender === undefined || valueToRender === null || valueToRender === ""
                  ? "-"
                  : valueToRender}
            </>
          );

          const evidence = buildEvidence({
            rawValue,
            label,
            displayValue:
              typeof valueToRender === "string" || typeof valueToRender === "number"
                ? valueToRender
                : "-",
          });

          return <EvidenceHoverHeader label={content} evidence={evidence} />;
        })()}
      </div>
    </div>
    );
  };

  const efficacyVsSafetyMetrics = [
    { key: "N", label: "N", format: formatN },
    { key: "ORR", label: "ORR" },
    { key: "PFS", label: "PFS" },
    { key: "SAERate", label: "SAE Rate" },
  ];

  const treatmentStrategiesYearRange = useMemo(() => {
    if (!isTreatmentStrategiesTable) return null;

    const yearSet = new Set();
    const collect = (obj) => {
      Object.keys(obj || {}).forEach((k) => {
        if (/^\d{4}$/.test(k)) yearSet.add(Number(k));
      });
    };

    (Array.isArray(data) ? data : []).forEach((section) => {
      collect(section?.summary);

      const regimens = Array.isArray(section?.regimens) ? section.regimens : [];
      regimens.forEach((regimen) => {
        collect(regimen?.summary);
        const arms = Array.isArray(regimen?.arms) ? regimen.arms : [];
        arms.forEach((arm) => collect(arm?.metrics));
      });
    });

    const years = Array.from(yearSet).filter(Number.isFinite).sort((a, b) => a - b);
    if (!years.length) return null;

    const maxYear = years[years.length - 1];
    const minYear = years[0];

    return { minYear, maxYear };
  }, [data, isTreatmentStrategiesTable]);

  const buildTreatmentStrategiesMetrics = () => {
    const minYear = treatmentStrategiesYearRange?.minYear;
    const maxYear = treatmentStrategiesYearRange?.maxYear;
    const years = (Number.isFinite(minYear) && Number.isFinite(maxYear))
      ? Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(minYear + i))
      : [];

    return [{ key: "N", label: "N", format: formatN }, ...years.map((y) => ({ key: y, label: y }))];
  };

  const metricsByTable = {
    treatment_strategies: buildTreatmentStrategiesMetrics,
    efficacyvssafety: efficacyVsSafetyMetrics,
  };

  const MetricsRow = ({ metricsConfig, data, activeTable }) => {
    const isEfficacyVsSafetyTable = activeTable === "efficacyvssafety";
    const isTreatmentStrategiesTable = activeTable === "treatment_strategies";
    const resolvedConfig =
      typeof metricsConfig === "function" ? metricsConfig() : metricsConfig;
    return (
      <div
        style={{
          ...styles.metricsRow,
          ...(!isSmallScreen &&
            isTreatmentStrategiesTable && {
              gap: 18,
            }),
          ...(!isSmallScreen &&
            isEfficacyVsSafetyTable && {
              display: "grid",
              gridTemplateColumns: `repeat(${resolvedConfig.length}, minmax(0, 1fr))`,
              width: "100%",
              columnGap: 28,
              rowGap: 0,
              alignItems: "start",
            }),
          ...(isSmallScreen && {
            flexWrap: "wrap",
            width: "100%",
            justifyContent: "flex-start",
          }),
          // minWidth: "30px",
        }}
      >
        {resolvedConfig.map((metric) => {
          const rawValue = data?.[metric.key];
          let value;
          if (metric.format) value = metric.format(rawValue);
          else if (
            rawValue &&
            typeof rawValue === "object" &&
            !Array.isArray(rawValue)
          )
            value = rawValue.value ?? "-";
          else value = rawValue;

          return (
            <Metric
              key={metric.key}
              label={metric.label}
              value={value}
              rawValue={rawValue}
              asp={metric.key === "ASP" ? data?.[metric.key] : undefined}
              activeTable={activeTable}
            />
          );
        })}
      </div>
    );
  };

  const LEFT_COL_WIDTH = activeTable == "treatment_strategies" ? 260 : 220; // Increased from 190 to 220 for better text wrapping

  const normalizedFilters = {
    country: filters.country || "All",
    phase: filters.phase || "All",

    endpoint: filters.orr
      ? filters.orr === "lt40"
        ? "Low ORR"
        : filters.orr === "40to60"
          ? "Medium ORR"
          : "High ORR"
      : "All",

    safety: filters.sae
      ? filters.sae === "low"
        ? "Low SAE"
        : filters.sae === "medium"
          ? "Medium SAE"
          : "High SAE"
      : "All",
  };

  const filteredSections = useMemo(() => {
    return current?.sections
      ?.map((section) => {
        const filteredRegimens = section.regimens
          ?.map((regimen) => {
            const filteredArms = regimen.arms?.filter((arm) =>
              armMatchesFilters(arm, normalizedFilters),
            );

            if (!filteredArms?.length) return null;

            return {
              ...regimen,
              arms: filteredArms,
              armsCount: filteredArms.length,
            };
          })
          .filter(Boolean);

        if (!filteredRegimens?.length) return null;

        return {
          ...section,
          regimens: filteredRegimens,
          regimensCount: filteredRegimens.length,
        };
      })
      .filter(Boolean);
  }, [current?.sections, normalizedFilters]);

  useLayoutEffect(() => {
    if (!tableRef.current || !dividerRef.current) return;

    const updateDivider = () => {
      const tableRect = tableRef.current.getBoundingClientRect();
      const containerRect =
        tableRef.current.offsetParent.getBoundingClientRect();

      dividerRef.current.style.top = `${tableRect.top - containerRect.top}px`;
      dividerRef.current.style.height = `${tableRect.height}px`;
    };

    updateDivider();

    window.addEventListener("resize", updateDivider);
    return () => window.removeEventListener("resize", updateDivider);
  }, [filteredSections]);
  // const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1510);

  // useLayoutEffect(() => {
  //   const onResize = () => setIsSmallScreen(window.innerWidth <= 1510);
  //   window.addEventListener("resize", onResize);
  //   return () => window.removeEventListener("resize", onResize);
  // }, []);
  const [sectionData, setSectionData] = useState({});

  // Flat list of all visible navigable rows: sections + expanded regimens + expanded arms
  const navRows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const rows = [];
    data.forEach((section, sectionIdx) => {
      const sectionKey = section?.id ?? section?.title ?? sectionIdx;
      rows.push({ type: "section", sectionIdx, section, key: sectionKey });
      if (expandedSections[section.title] && Array.isArray(sectionData[section.title])) {
        sectionData[section.title].forEach((regimen, rIdx) => {
          const regimenKey = `${sectionKey}_${rIdx}`;
          rows.push({ type: "regimen", sectionIdx, rIdx, section, regimen, key: regimenKey });
          if (expandedRegimens[regimenKey] && Array.isArray(regimen.arms)) {
            regimen.arms.forEach((arm, aIdx) => {
              rows.push({ type: "arm", sectionIdx, rIdx, aIdx, section, regimen, arm, key: `${regimenKey}_${aIdx}` });
            });
          }
        });
      }
    });
    return rows;
  }, [data, expandedSections, sectionData, expandedRegimens]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " "].includes(e.key)) return;

      const active = document.activeElement;
      const tableEl = tableRef.current;
      if (!tableEl) return;

      const focusedTag = active?.tagName?.toLowerCase();
      const isFocusedInTable = tableEl.contains(active);
      const isInputFocused = ["input", "textarea", "select", "button", "a"].includes(focusedTag);
      if (isInputFocused && !isFocusedInTable) return;

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIdx((prev) => {
          const next = e.key === "ArrowDown"
            ? (prev === null ? 0 : Math.min(prev + 1, navRows.length - 1))
            : (prev === null ? 0 : Math.max(prev - 1, 0));
          rowRefs.current[next]?.focus();
          rowRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const idx = focusedRowIdx ?? 0;
        const scrollEl = metricsScrollRefs.current[idx]?.current;
        if (scrollEl) {
          scrollEl.scrollLeft += e.key === "ArrowRight" ? 120 : -120;
        }
      }

      if ((e.key === "Enter" || e.key === " ") && focusedRowIdx !== null) {
        e.preventDefault();
        const row = navRows[focusedRowIdx];
        if (!row) return;
        if (row.type === "section") {
          toggleSection(row.section);
        } else if (row.type === "regimen") {
          toggleRegimen({
            sectionTitle: row.section.title,
            regimenIndex: row.rIdx,
            regimen: row.regimen,
            key: row.key,
          });
        } else if (row.type === "arm") {
          const arm = row.arm;
          const nctId = arm?.oncosuite_id ?? arm?.oncosuiteId ?? arm?.nct_id;
          if (nctId) onSelect(nctId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navRows, focusedRowIdx]);

  const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  };

  const toNamedArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];

    return Object.entries(value).map(([key, item]) => {
      if (!item || typeof item !== "object") return item;
      // when backend sends regimens/arms as an object map, keep the key as a usable name
      return {
        ...item,
        name: item.name ?? key,
      };
    });
  };

  const extractRegimensFromResponse = (res) => {
    const container =
      res?.efficacyvssafety_table ||
      res?.efficacyvssafety ||
      res?.treatment_strategies_table ||
      res?.treatment_strategies;

    const regimens = toNamedArray(container?.views?.study?.sections?.[0]?.regimens);

    return regimens.map((regimen) => {
      if (!regimen || typeof regimen !== "object") return regimen;

      return {
        ...regimen,
        name:
          regimen.name ??
          regimen.regimen_name ??
          regimen.regimenName ??
          regimen.title ??
          regimen.regimen,
        armsCount:
          regimen.armsCount ??
          regimen.arms_count ??
          (Array.isArray(regimen.arms) ? regimen.arms.length : undefined),
        observedPercent:
          regimen.observedPercent ?? regimen.observed_percent ?? regimen.observed,
        summary: regimen.summary ?? regimen.Summary ?? regimen.metrics,
        arms: regimen.arms ?? regimen.arm ?? regimen.arms_data,
      };
    });
  };

  useEffect(() => {
    setExpandedSections({});
    setSectionData({});
    setSectionLoading({});
    setExpandedRegimens({});
    setRegimenLoading({});
    setSectionPageInfo({});
    setRegimenPageInfo({});
  }, [activeTable, sessionKey]);

  const toggleSection = async (section) => {
    const key = section.title;

    // toggle expand
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    // if already loaded don't call API again
    if (sectionData[key]) return;

    try {
      setSectionLoading((prev) => ({ ...prev, [key]: true }));
      const res = await getTreatmentAnalytics({
        comb_backbone: section.title,
        session_key: sessionKey,
        filters: apiFilters,
        graph: [],
        table: activeTable,
        page: 1,
        page_size: REGIMENS_PAGE_SIZE,
      });

      const regimens = extractRegimensFromResponse(res);

      setSectionData((prev) => ({
        ...prev,
        [key]: regimens,
      }));
      setSectionPageInfo((prev) => ({
        ...prev,
        [key]: {
          page: 1,
          hasMore: regimens.length >= REGIMENS_PAGE_SIZE,
        },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setSectionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const loadMoreRegimens = async (section) => {
    const key = section.title;
    const pageInfo = sectionPageInfo[key];

    if (!pageInfo?.hasMore || pageInfo.loadingMore || sectionLoading[key]) return;

    const nextPage = (pageInfo.page || 1) + 1;

    try {
      setSectionPageInfo((prev) => ({
        ...prev,
        [key]: { ...prev[key], loadingMore: true },
      }));

      const res = await getTreatmentAnalytics({
        comb_backbone: section.title,
        session_key: sessionKey,
        filters: apiFilters,
        graph: [],
        table: activeTable,
        page: nextPage,
        page_size: REGIMENS_PAGE_SIZE,
      });

      const newRegimens = extractRegimensFromResponse(res);

      setSectionData((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), ...newRegimens],
      }));
      setSectionPageInfo((prev) => ({
        ...prev,
        [key]: {
          page: nextPage,
          hasMore: newRegimens.length >= REGIMENS_PAGE_SIZE,
          loadingMore: false,
        },
      }));
    } catch (error) {
      console.error(error);
      setSectionPageInfo((prev) => ({
        ...prev,
        [key]: { ...prev[key], loadingMore: false },
      }));
    }
  };

  const toggleRegimen = async ({ sectionTitle, regimenIndex, regimen, key }) => {
    const isExpanding = !expandedRegimens[key];

    setExpandedRegimens((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    if (!isExpanding) return;

    const existingArms = asArray(regimen?.arms);
    const shouldFetchArms =
      existingArms.length === 0 && Number(regimen?.armsCount || 0) > 0;

    if (!shouldFetchArms) {
      // Give immediate feedback while a large arms list renders.
      setRegimenLoading((prev) => ({ ...prev, [key]: true }));
      window.setTimeout(
        () => setRegimenLoading((prev) => ({ ...prev, [key]: false })),
        180,
      );
      return;
    }

    const regimenName = String(regimen?.name || "").trim();
    if (!regimenName) {
      // fall back to local spinner; no safe param to request arms
      setRegimenLoading((prev) => ({ ...prev, [key]: true }));
      window.setTimeout(
        () => setRegimenLoading((prev) => ({ ...prev, [key]: false })),
        180,
      );
      return;
    }

    try {
      setRegimenLoading((prev) => ({ ...prev, [key]: true }));
      const res = await getTreatmentAnalytics({
        comb_backbone: regimenName,
        session_key: sessionKey,
        filters: apiFilters,
        graph: [],
        table: activeTable,
        page: 1,
        page_size: ARMS_PAGE_SIZE,
      });

      const regimens = extractRegimensFromResponse(res);
      const normalizedName = String(regimen?.name || "").trim().toLowerCase();
      const matchedRegimen =
        regimens.find(
          (r) => String(r?.name || "").trim().toLowerCase() === normalizedName,
        ) || regimens[0];

      const nextArms = asArray(matchedRegimen?.arms);

      setSectionData((prev) => {
        const list = Array.isArray(prev?.[sectionTitle])
          ? [...prev[sectionTitle]]
          : [];
        const existing = list[regimenIndex] || regimen || {};
        list[regimenIndex] = {
          ...existing,
          ...(matchedRegimen || {}),
          arms: nextArms,
          armsCount:
            matchedRegimen?.armsCount ?? existing?.armsCount ?? nextArms.length,
        };
        return {
          ...prev,
          [sectionTitle]: list,
        };
      });
      setRegimenPageInfo((prev) => ({
        ...prev,
        [key]: {
          page: 1,
          hasMore: nextArms.length >= ARMS_PAGE_SIZE,
        },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setRegimenLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const loadMoreArms = async ({ sectionTitle, regimenIndex, regimen, key }) => {
    const pageInfo = regimenPageInfo[key];

    if (!pageInfo?.hasMore || pageInfo.loadingMore || regimenLoading[key]) return;

    const regimenName = String(regimen?.name || "").trim();
    if (!regimenName) return;

    const nextPage = (pageInfo.page || 1) + 1;

    try {
      setRegimenPageInfo((prev) => ({
        ...prev,
        [key]: { ...prev[key], loadingMore: true },
      }));

      const res = await getTreatmentAnalytics({
        comb_backbone: regimenName,
        session_key: sessionKey,
        filters: apiFilters,
        graph: [],
        table: activeTable,
        page: nextPage,
        page_size: ARMS_PAGE_SIZE,
      });

      const regimens = extractRegimensFromResponse(res);
      const normalizedName = regimenName.toLowerCase();
      const matchedRegimen =
        regimens.find(
          (r) => String(r?.name || "").trim().toLowerCase() === normalizedName,
        ) || regimens[0];

      const newArms = asArray(matchedRegimen?.arms);

      setSectionData((prev) => {
        const list = Array.isArray(prev?.[sectionTitle])
          ? [...prev[sectionTitle]]
          : [];
        const existing = list[regimenIndex] || regimen || {};
        list[regimenIndex] = {
          ...existing,
          arms: [...asArray(existing.arms), ...newArms],
        };
        return {
          ...prev,
          [sectionTitle]: list,
        };
      });
      setRegimenPageInfo((prev) => ({
        ...prev,
        [key]: {
          page: nextPage,
          hasMore: newArms.length >= ARMS_PAGE_SIZE,
          loadingMore: false,
        },
      }));
    } catch (error) {
      console.error(error);
      setRegimenPageInfo((prev) => ({
        ...prev,
        [key]: { ...prev[key], loadingMore: false },
      }));
    }
  };

  // render (no header injection here; header controlled by TreatmentTab)
  return (
    <div style={styles.container}>
      {/* SECTIONS */}
      <div ref={tableRef}>
        {drawerLoading ? (
          // drawerLoading
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "85vh",
            }}
          >
            <CircularProgress color="#2563EB" size={30} />
          </div>
        ) : (
          <>{data?.map((section, sectionIdx) => {
            const sectionKey = section?.id ?? section?.title ?? sectionIdx;
            const flatIdx = navRows.findIndex((r) => r.type === "section" && r.sectionIdx === sectionIdx);
            const isFocused = focusedRowIdx === flatIdx;

            return (
              <div
                key={sectionKey}
                ref={(el) => { if (flatIdx >= 0) rowRefs.current[flatIdx] = el; }}
                tabIndex={0}
                outline="none"
                onFocus={() => { if (flatIdx >= 0) setFocusedRowIdx(flatIdx); }}
                style={{
                  ...styles.card,
                  position: "relative",
                  outline: isFocused ? "2px solid rgba(38, 102, 190, 0.5)" : "none",
                  outlineOffset: -2,
                }}
              >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: LEFT_COL_WIDTH,
                  width: 1,
                  background: "rgba(0, 0, 0, 0.1)",
                }}
              />
              {/* Section Header */}
              <div
                style={{
                  ...styles.sectionHeader,
                  ...(isSmallScreen && {
                    flexWrap: "wrap",
                    rowGap: 12,
                  }),
                }}
              >
                {/* LEFT */}
                {/* LEFT */}
                <div
                  data-left-column
                  style={{
                    flex: `0 0 ${LEFT_COL_WIDTH}px`,
                    paddingRight: 24,
                  }}
                >
                  <TruncatedText
                    text={section.title}
                    style={styles.sectionTitle}
                    maxLines={2}
                  />

                  <div
                    style={{ ...styles.expandRow, marginTop: 8 }}
                    onClick={() => toggleSection(section)}
                  >
                    {expandedSections[section.title] ? (
                      <ChevronUpSmall />
                    ) : (
                      <ChevronDownSmall />
                    )}

                    <span>
                      <span style={styles.regimenCount}>
                        {section.regimensCount}
                      </span>
                      <span style={styles.regimenText}>regimens</span>
                    </span>

                    {sectionLoading[section.title] ? (
                      <span style={{ display: "inline-flex", marginLeft: 8 }}>
                        <CircularProgress size={14} thickness={5} />
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* RIGHT (metrics) */}
                <HorizontalScrollHint metricsScrollRef={(() => {
                  if (flatIdx < 0) return undefined;
                  if (!metricsScrollRefs.current[flatIdx]) {
                    metricsScrollRefs.current[flatIdx] = { current: null };
                  }
                  return metricsScrollRefs.current[flatIdx];
                })()}>
                  <div
                    style={{
                      display: "block",
                      ...(isTreatmentStrategiesTable
                        ? { minWidth: "max-content" }
                        : { minWidth: 0, width: "100%" }),
                      ...(isSmallScreen && {
                        flexWrap: "wrap",
                        width: "100%",
                        justifyContent: "flex-start",
                      }),
                    }}
                  >
                    <MetricsRow
                      metricsConfig={metricsByTable[activeTableName]}
                      data={section.summary}
                      activeTable={activeTableName}
                    />
                  </div>
                  {/* <Metric label="N" value={formatN(section.summary.N)} />
                  <Metric
                    label="ASP"
                    value={formatASP(section.summary.ASP)}
                    asp={section.summary.ASP}
                  />
                  <Metric label="ORR" value={section.summary.ORR} />
                  <Metric label="PFS" value={section.summary.PFS} />
                  <Metric label="SAE Rate" value={section.summary.SAERate} />
                  <Metric
                    label="Grade ≥3 AE rate"
                    value={section.summary.Grade3AERate}
                  /> */}
                </HorizontalScrollHint>
              </div>

              {/*  REGIMENS  */}
              {expandedSections[section.title] &&
                sectionLoading[section.title] &&
                !sectionData[section?.title] && (
                  <div
                    style={{
                      padding: "14px 16px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "rgba(0,0,0,0.6)",
                      fontFamily: "Rubik",
                      fontSize: 14,
                    }}
                  >
                    <CircularProgress size={16} thickness={5} />
                    Loading regimens...
                  </div>
                )}

              {expandedSections[section.title] &&
                Array.isArray(sectionData[section?.title]) &&
                sectionData[section?.title].length === 0 && (
                  <div
                    style={{
                      padding: "14px 16px 18px",
                      color: "rgba(0,0,0,0.5)",
                      fontFamily: "Rubik",
                      fontSize: 14,
                      fontStyle: "italic",
                    }}
                  >
                    No regimens available.
                  </div>
                )}

              {expandedSections[section.title] &&
                sectionData[section?.title]?.map((regimen, rIdx) => {
                  const regimenFlatIdx = navRows.findIndex(
                    (r) => r.type === "regimen" && r.sectionIdx === sectionIdx && r.rIdx === rIdx
                  );
                  const isRegimenFocused = focusedRowIdx === regimenFlatIdx;
                  return (
                  <div
                    key={`${sectionKey}_${regimen?.name ?? rIdx}`}
                    ref={(el) => { if (regimenFlatIdx >= 0) rowRefs.current[regimenFlatIdx] = el; }}
                    tabIndex={0}
                    onFocus={() => { if (regimenFlatIdx >= 0) setFocusedRowIdx(regimenFlatIdx); }}
                    style={{
                      ...styles.regimen,
                      outline: isRegimenFocused ? "2px solid rgba(38, 102, 190, 0.5)" : "none",
                      outlineOffset: -2,
                    }}
                  >
                    <div
                      style={{
                        ...styles.regimenHeader,
                        ...(isSmallScreen && {
                          flexWrap: "wrap",
                          rowGap: 12,
                        }),
                      }}
                    >
                      {/* LEFT */}
                      <div
                        style={{
                          flex: `0 0 ${LEFT_COL_WIDTH}px`,
                          paddingRight: 24,
                          boxSizing: "border-box",
                          // overflow: "hidden", // Removed to allow text wrapping
                        }}
                      >
                        <TruncatedText
                          text={regimen.name}
                          style={styles.regimenTitle}
                          maxLines={2}
                        />

	                        <div
	                          style={styles.expandRow}
	                          onClick={() =>
	                            toggleRegimen({
	                              sectionTitle: section.title,
	                              regimenIndex: rIdx,
	                              regimen,
	                              key: `${sectionKey}_${rIdx}`,
	                            })
	                          }
	                        >
	                          {expandedRegimens[`${sectionKey}_${rIdx}`] ? (
	                            <ChevronUpSmall />
	                          ) : (
	                            <ChevronDownSmall />
	                          )}

                          <span>
                            <span style={styles.armsCount}>
                              {regimen.armsCount}
                            </span>{" "}
                            <span style={styles.link}>arms</span>
                          </span>

	                          <span style={styles.infoRow}>
	                            <span style={styles.verticalDivider} />
	                            <span style={styles.percentValue}>
	                              {regimen.observedPercent}%
	                            </span>
	                            <span style={styles.subInfo}>observed</span>
	                          </span>

	                          {regimenLoading[`${sectionKey}_${rIdx}`] ? (
	                            <span style={{ display: "inline-flex", marginLeft: 8 }}>
	                              <CircularProgress size={14} thickness={5} />
	                            </span>
	                          ) : null}
	                        </div>
	                      </div>

                      {/* RIGHT */}
                      <HorizontalScrollHint fadeBg={styles.regimen.background} metricsScrollRef={(() => {
                        if (regimenFlatIdx < 0) return undefined;
                        if (!metricsScrollRefs.current[regimenFlatIdx]) {
                          metricsScrollRefs.current[regimenFlatIdx] = { current: null };
                        }
                        return metricsScrollRefs.current[regimenFlatIdx];
                      })()}>
                        <div
                          style={{
                            display: "block",
                            ...(isTreatmentStrategiesTable
                              ? { minWidth: "max-content" }
                              : { minWidth: 0, width: "100%" }),
                            ...(isSmallScreen && {
                              flexWrap: "wrap",
                              width: "100%",
                              justifyContent: "flex-start",
                            }),
                          }}
                        >
                          <MetricsRow
                            metricsConfig={metricsByTable[activeTableName]}
                            data={regimen.summary}
                            activeTable={activeTableName}
                          />
                        </div>
                        {/* <Metric label="N" value={formatN(regimen.summary.N)} />
                        <Metric label="ASP" value="-" />
                        <Metric label="ORR" value={regimen.summary.ORR} />
                        <Metric label="PFS" value={regimen.summary.PFS} />
                        <Metric
                          label="SAE Rate"
                          value={regimen.summary.SAERate}
                        />
                        <Metric
                          label="Grade ≥3 AE rate"
                          value={regimen.summary.Grade3AERate}
                        /> */}
                      </HorizontalScrollHint>
                    </div>

	                    {/* ARMS  */}
	                    {expandedRegimens[`${sectionKey}_${rIdx}`] &&
	                      regimenLoading[`${sectionKey}_${rIdx}`] && (
	                        <div
	                          style={{
	                            padding: "12px 16px 14px",
	                            display: "flex",
	                            alignItems: "center",
	                            gap: 10,
	                            color: "rgba(0,0,0,0.6)",
	                            fontFamily: "Rubik",
	                            fontSize: 14,
	                          }}
	                        >
	                          <CircularProgress size={16} thickness={5} />
	                          Loading arms...
	                        </div>
	                      )}

	                    {expandedRegimens[`${sectionKey}_${rIdx}`] &&
	                      !regimenLoading[`${sectionKey}_${rIdx}`] &&
	                      Array.isArray(regimen.arms) &&
	                      regimen.arms.length === 0 && (
	                        <div
	                          style={{
	                            padding: "12px 16px 14px",
	                            color: "rgba(0,0,0,0.5)",
	                            fontFamily: "Rubik",
	                            fontSize: 14,
	                            fontStyle: "italic",
	                          }}
	                        >
	                          No arms available.
	                        </div>
	                      )}

	                    {expandedRegimens[`${sectionKey}_${rIdx}`] &&
	                      !regimenLoading[`${sectionKey}_${rIdx}`] &&
	                      regimen.arms?.map((arm, aIdx) => {
	                        const armFlatIdx = navRows.findIndex(
	                          (r) => r.type === "arm" && r.sectionIdx === sectionIdx && r.rIdx === rIdx && r.aIdx === aIdx
	                        );
	                        const isArmFocused = focusedRowIdx === armFlatIdx;
	                        return (
	                          <div
	                            key={`${sectionKey}_${rIdx}_${arm?.oncosuite_id ?? arm?.nct_id ?? arm?.name ?? "arm"}_${aIdx}`}
	                            ref={(el) => { if (armFlatIdx >= 0) rowRefs.current[armFlatIdx] = el; }}
	                            tabIndex={0}
	                            onFocus={() => { if (armFlatIdx >= 0) setFocusedRowIdx(armFlatIdx); }}
	                            style={{
	                              ...styles.armBlock,
	                              outline: isArmFocused ? "2px solid rgba(38, 102, 190, 0.5)" : "none",
	                              outlineOffset: -2,
	                            }}
	                          >
                            <div style={{ width: "100%" }}>
                              <div style={styles.cutDivider} />
                              {/* ARM ROW */}
                              <div
                                style={{
                                  ...styles.arm,
                                  justifyContent: "flex-start",
                                  display: "flex",
                                  alignItems: "stretch",
                                  ...(isSmallScreen && {
                                    flexWrap: "wrap",
                                    rowGap: 12,
                                  }),
                                }}
                              >
                                <div
                                  style={{
                                    flex: `0 0 ${LEFT_COL_WIDTH}px`,
                                    paddingRight: 35,
                                    boxSizing: "border-box",
                                    // overflow: "hidden", // Removed to allow text wrapping
                                  }}
                                >
                                  <TruncatedText 
                                    text={arm.arm_name} 
                                    style={styles.armTitle}
                                    maxLines={2}
                                  />
                                  <TruncatedText 
                                    text={arm.arm_description} 
                                    style={{
                                      ...styles.armDesc,
                                      wordBreak: "break-word",
                                    }}
                                    maxLines={3}
                                  />
                                  <div
                                    style={styles.summ}
                                    onClick={() =>
                                      onSelect(
                                        arm?.oncosuite_id ??
                                          arm?.oncosuiteId ??
                                          arm?.nct_id,
                                      )
                                    }
                                  >
                                    View Summary
                                  </div>
                                </div>

                                <HorizontalScrollHint fadeBg={styles.armBlock.background} metricsScrollRef={(() => {
                                  if (armFlatIdx < 0) return undefined;
                                  if (!metricsScrollRefs.current[armFlatIdx]) {
                                    metricsScrollRefs.current[armFlatIdx] = { current: null };
                                  }
                                  return metricsScrollRefs.current[armFlatIdx];
                                })()}>
                                  <div
                                    style={{
                                      display: "flex",
                                      ...(isTreatmentStrategiesTable
                                        ? { minWidth: "max-content" }
                                        : { minWidth: 0, width: "100%" }),
                                      height: "100%",
                                      alignItems: "center",
                                      ...(isSmallScreen && {
                                        flexWrap: "wrap",
                                        width: "100%",
                                        justifyContent: "flex-start",
                                      }),
                                    }}
                                  >
                                    {/* <Metric
                                    label="N"
                                    value={formatN(arm.metrics.N)}
                                  />
                                  <Metric
                                    label="ASP"
                                    value={formatASP(arm.metrics.ASP)}
                                    asp={arm.metrics.ASP}
                                  />
                                  <Metric label="ORR" value={arm.metrics.ORR} />
                                  <Metric label="PFS" value={arm.metrics.PFS} />
                                  <Metric
                                    label="SAE Rate"
                                    value={arm.metrics.SAERate}
                                  />
                                  <Metric
                                    label="Grade ≥3 AE rate"
                                    value={arm.metrics.Grade3AERate}
                                  /> */}
                                    <MetricsRow
                                      metricsConfig={metricsByTable[activeTableName]}
                                      data={arm.metrics}
                                      activeTable={activeTableName}
                                    />
                                  </div>
                                </HorizontalScrollHint>
                              </div>

                              {/*  SUMMARY ROW  */}
                              {/* RIGHT SUMMARY DRAWER*/}
                              {summaryDrawer.open && (
                                <div
                                  style={styles.drawerOverlay}
                                  onClick={() =>
                                    setSummaryDrawer({
                                      open: false,
                                      title: "",
                                      data: null,
                                      nctId: null,
                                    })
                                  }
                                >
                                  <div
                                    style={styles.drawer}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* HEADER */}

                                    {/* CONTENT */}
                                    {/* <div style={{ flex: 1, minHeight: 0 }}>
                                  <TrialDetailsPanel
                                    mode="drawer"
                                    nctId="NCT05069038"
                                    onClose={() =>
                                      setSummaryDrawer({
                                        open: false,
                                        title: "",
                                        data: null,
                                        nctId: null,
                                      })
                                    }
                                  />
                                </div> */}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
	                      })}
                    {expandedRegimens[`${sectionKey}_${rIdx}`] &&
                      !regimenLoading[`${sectionKey}_${rIdx}`] &&
                      Array.isArray(regimen.arms) &&
                      regimen.arms.length > 0 && (
                        <>
                          {regimenPageInfo[`${sectionKey}_${rIdx}`]?.hasMore && (
                            <LoadMoreSentinel
                              onReach={() =>
                                loadMoreArms({
                                  sectionTitle: section.title,
                                  regimenIndex: rIdx,
                                  regimen,
                                  key: `${sectionKey}_${rIdx}`,
                                })
                              }
                            />
                          )}
                          {regimenPageInfo[`${sectionKey}_${rIdx}`]?.loadingMore && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: "10px 0",
                              }}
                            >
                              <CircularProgress size={16} thickness={5} sx={{ color: "#2563EB" }} />
                            </div>
                          )}
                        </>
                      )}
                  </div>
                ); })}
                {sectionPageInfo[section.title]?.hasMore && (
                  <LoadMoreSentinel onReach={() => loadMoreRegimens(section)} />
                )}
                {sectionPageInfo[section.title]?.loadingMore && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "12px 0",
                    }}
                  >
                    <CircularProgress size={18} thickness={5} sx={{ color: "#2563EB" }} />
                  </div>
                )}
            </div>
            );
          })}
          {isFetchingMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px 0",
              }}
            >
              <CircularProgress size={24} sx={{ color: "#2563EB" }} />
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
