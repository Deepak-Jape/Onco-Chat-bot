import { useState, useEffect } from "react";
import Flag from "react-world-flags";
// import data from "./treatmentStrategiesData.json";
// import treatmentStrategiesData from "./treatmentStrategiesData.json";

import rawData from "./treatmentData.json";
import { useMemo } from "react";
import { useRef, useLayoutEffect } from "react";
import { useMediaQuery } from "../useMediaQuery";
import { styles } from "./style";
import { getTreatmentAnalytics } from "../../../api/analytics/treatment";
import CustomScrollbar from "../../../common/CustomScrollbar";
import { CircularProgress, Popper, Tooltip } from "@mui/material";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
// import { Tooltip } from "@mui/material";

countries.registerLocale(en);
import feasibilityData from "./feasibilityData.json";
import EvidenceHoverHeader from "../trials/EvidenceHoverCell";

// ---- Dynamic drawer columns -------------------------------------------------
// Feasibility table endpoints each return a different row shape and carry no
// column metadata, so columns are derived from the keys present on the returned
// rows. This map only supplies display labels / widths / renderers for the keys
// we know about; unknown keys still render with a prettified label so new API
// fields show up without a code change.
const COLUMN_META = {
  Year: { label: "Year", width: 120 },
  year: { label: "Year", width: 120 },
  regimen: { label: "Regimen", width: 260, type: "list-clamped" },
  countries: { label: "Countries", width: 180, type: "countries" },
  patients_per_month_site: { label: "Patients / month / site", width: 160 },
  site_count: { label: "# of sites", width: 140 },
  planned_patients: { label: "Patients (planned)", width: 160, type: "number" },
  completed_patients: { label: "Patients (completed)", width: 160, type: "number" },
  phase: { label: "Phase", width: 160, type: "list" },
  line_of_therapy: { label: "Line of Therapy", width: 180, type: "list" },
  cancer_stage: { label: "Cancer Stage", width: 200, type: "list" },
};

// Keys that never become their own column. Three groups:
//  1. the sticky first column already renders the id + trial name,
//  2. `metrics` / nct ids are internal bookkeeping,
//  3. normalizeFeasibilityDrawerRow spreads the raw API row and then adds
//     snake_case aliases, so rows carry BOTH `Regimen` and `regimen`. The raw
//     aliases are hidden here so each field yields exactly one column (the
//     normalized one, which has the richer renderer).
const HIDDEN_COLUMN_KEYS = new Set([
  "id",
  "oncosuite_id",
  "oncosuiteId",
  "OncoSuiteID",
  "trial_name",
  "TrialName",
  "trialName",
  "metrics",
  "nct_id",
  "nctId",
  // Raw aliases superseded by the normalizer's canonical keys.
  "Regimen",
  "Countries",
  "PatientsPerMonthSite",
  "patients_per_month_per_site",
  "SiteCount",
  "Sites",
  "PlannedPatients",
  "CompletedPatients",
]);

const isHiddenColumnKey = (key) =>
  HIDDEN_COLUMN_KEYS.has(key) || key.endsWith("_evidence");

// "PlannedPatients" / "line_of_therapy" -> "Planned Patients" / "Line Of Therapy"
const prettifyColumnKey = (key) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Preferred left-to-right order for keys we know about. Raw API keys land ahead
// of the normalizer's aliases in Object.keys order, which would otherwise put
// e.g. `Year` before `planned_patients`; this pins the reading order. Keys not
// listed here keep their API order and follow the known ones.
const COLUMN_ORDER = [
  "regimen",
  "countries",
  "Year",
  "year",
  "phase",
  "line_of_therapy",
  "cancer_stage",
  "patients_per_month_site",
  "site_count",
  "planned_patients",
  "completed_patients",
];

// Build the column list from the keys actually present across the returned rows.
const deriveDrawerColumns = (rows = []) => {
  const seen = new Set();
  const columns = [];

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (seen.has(key) || isHiddenColumnKey(key)) return;
      seen.add(key);
      const meta = COLUMN_META[key] || {};
      columns.push({
        key,
        label: meta.label || prettifyColumnKey(key),
        width: meta.width || 160,
        type: meta.type || "text",
      });
    });
  });

  const rank = (key) => {
    const i = COLUMN_ORDER.indexOf(key);
    return i === -1 ? COLUMN_ORDER.length : i;
  };

  // Stable sort: known keys in COLUMN_ORDER, unknown keys keep API order after.
  return columns
    .map((column, index) => ({ column, index }))
    .sort((a, b) => rank(a.column.key) - rank(b.column.key) || a.index - b.index)
    .map(({ column }) => column);
};

export default function FeasibilityStrategies({
  activeTable,
  filters,
  data,
  view,
  onSelect,
  drawerLoading,
  onScroll,
  isFetchingMore,
}) {
  // const [view, setView] = useState("study");
  const current = data?.[view];
  const chartData = Array.isArray(rawData) ? rawData : rawData.chart || [];
  const [expandedSections, setExpandedSections] = useState({});
  const tableRef = useRef(null);
  const dividerRef = useRef(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [countriesMenuAnchorRect, setCountriesMenuAnchorRect] = useState(null);
  const tableData = Array.isArray(data) ? data : [];
  const timeoutRef = useRef(null);
  const [summaryDrawer, setSummaryDrawer] = useState({
    open: false,
    title: "",
    nctId: null,
  });
  const isSmallScreen = useMediaQuery("(max-width: 900px)");

  // Columns come from whatever the active table's endpoint returned.
  const drawerColumns = useMemo(
    () => deriveDrawerColumns(Array.isArray(data) ? data : []),
    [data],
  );

  const GRID_COLUMNS = useMemo(
    () => ["260px", ...drawerColumns.map((c) => `${c.width}px`)].join(" "),
    [drawerColumns],
  );

  const HorizontalScrollHint = ({ children, fadeBg = "#FFFFFF", scrollRef }) => {
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

      const STICKY_COL_WIDTH = 260;
      const onWheel = (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // already horizontal
        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        // if cursor is over the sticky first column, let page scroll vertically
        if (cursorX <= STICKY_COL_WIDTH) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;
        const goingRight = e.deltaY > 0 && el.scrollLeft < maxScroll;
        const goingLeft = e.deltaY < 0 && el.scrollLeft > 0;
        if (!goingRight && !goingLeft) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      };
      el.addEventListener("wheel", onWheel, { passive: false });

      const resizeObserver = new ResizeObserver(() => updateHint());
      resizeObserver.observe(el);
      window.addEventListener("resize", updateHint);
      return () => {
        el.removeEventListener("scroll", onScroll);
        el.removeEventListener("wheel", onWheel);
        resizeObserver.disconnect();
        window.removeEventListener("resize", updateHint);
      };
    }, []);

    const fadeSize = 14;
    const edgeAlpha = 0.35;
    const maskImage = hint.canRight
      ? `linear-gradient(to right, #000 0px, #000 calc(100% - ${fadeSize}px), rgba(0,0,0,${edgeAlpha}) 100%)`
      : "none";

    return (
      <div style={{ position: "relative", flex: "1 1 auto", minWidth: 0 }}>
        {hint.canRight && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 56,
              pointerEvents: "none",
              background: `linear-gradient(to left, ${fadeBg}, ${toTransparent(fadeBg)})`,
              zIndex: 2,
            }}
          />
        )}
        <div
          ref={(el) => {
            scrollElRef.current = el;
            if (scrollRef) scrollRef.current = el;
          }}
          className="scrollbar-hide"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            minWidth: 0,
            width: "100%",
            WebkitMaskImage: maskImage === "none" ? undefined : maskImage,
            maskImage: maskImage === "none" ? undefined : maskImage,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        >
          {children}
        </div>
      </div>
    );
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
  const parseCountriesList = (raw) => {
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr
      .flatMap((entry) => {
        if (typeof entry !== "string") return [entry];
        // Split "Australia ( AUS ), Belgium ( BEL ), ..." on ), keeping the closing paren
        return entry.split(/\)\s*,\s*/).map((s, i, parts) =>
          i < parts.length - 1 ? s.trim() + ")" : s.trim()
        );
      })
      .filter(Boolean);
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

  // Unwrap the { value, source_text, ... } evidence envelope the feasibility API
  // wraps scalar fields in.
  const unwrapCellValue = (raw) => {
    if (raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw) {
      return raw.value ?? "-";
    }
    return raw ?? "-";
  };

  // Render a plain string[] field (phase / line_of_therapy / cancer_stage).
  const formatListCell = (raw) => {
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list.length ? list.join(", ") : "-";
  };

  const getCountryName = (countryString) =>
    countryString.split("(")[0].trim();

  const getCountryCode = (countryString) => {
    const iso3Match = countryString.match(/\(\s*([A-Z]{3})\s*\)/);
    if (iso3Match) {
      const iso2 = countries.alpha3ToAlpha2(iso3Match[1]);
      if (iso2) return iso2.toLowerCase();
    }
    const name = countryString.split("(")[0].trim();
    const code = countries.getAlpha2Code(name, "en");
    return code?.toLowerCase() || null;
  };

  const [expandedRegimens, setExpandedRegimens] = useState({});
  const [focusedRowIdx, setFocusedRowIdx] = useState(null);
  const rowRefs = useRef([]);
  const tableScrollRef = useRef(null);
  const headerRowRef = useRef(null);

  // Keep the table header visually pinned to the top of the drawer while the
  // drawer scrolls vertically. The header lives inside a horizontal-scroll box
  // (so native position:sticky can't pin it to the drawer's vertical scroll),
  // so we translate it down by the scroll offset instead. Design is untouched;
  // vertical scroll + pagination stay on the drawer as before.
  useEffect(() => {
    const headerEl = headerRowRef.current;
    if (!headerEl) return;
    const scrollParent = getVerticalScrollParent(headerEl);
    if (!scrollParent) return;

    let raf = 0;
    const sync = () => {
      raf = 0;
      // Distance the header has scrolled past the top of the scroll viewport.
      const parentTop = scrollParent.getBoundingClientRect().top;
      const headerHome =
        headerEl.offsetTop - (headerEl.parentElement?.offsetTop || 0);
      // How far the whole table has scrolled up within the scroll parent.
      const scrolled = scrollParent.scrollTop;
      const offset = Math.max(0, scrolled - headerHome);
      headerEl.style.transform = `translateY(${offset}px)`;
      headerEl.style.position = "relative";
      headerEl.style.zIndex = "5";
      void parentTop;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => {
      scrollParent.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tableData, drawerLoading]);

  // Find the nearest vertically-scrollable ancestor of the table (the drawer
  // content area), so arrow keys can scroll the viewport to reveal hidden rows.
  // NOTE: we accept any ancestor whose overflowY is auto/scroll REGARDLESS of
  // whether it currently overflows. Gating on `scrollHeight > clientHeight`
  // caused a race on drawer open — before rows finished laying out the parent
  // didn't overflow yet, so this returned null and keyboard scroll silently
  // did nothing (and, worse, arrow keys fell through to the browser's default
  // caret/focus movement).
  const getVerticalScrollParent = (node) => {
    let el = node?.parentElement;
    while (el) {
      const { overflowY } = window.getComputedStyle(el);
      if (overflowY === "auto" || overflowY === "scroll") {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  useEffect(() => {
    const NAV_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", "Enter"];

    // A single rAF-driven momentum loop drives all keyboard scrolling. Each keypress
    // just adds to a pending "remaining distance"; the loop eases toward zero every
    // frame. This is what keeps it smooth — using native `behavior:"smooth"` on every
    // keydown instead queued a fresh animation per press, and rapid/held arrows made
    // those animations fight each other, which is the lag you were seeing.
    let vRemaining = 0; // remaining vertical distance to travel (px, signed)
    let hRemaining = 0; // remaining horizontal distance to travel (px, signed)
    let vEl = null;
    let hEl = null;
    let raf = 0;

    const tick = () => {
      raf = 0;
      // Ease: consume ~22% of the remaining distance per frame (min 1px) so motion
      // decelerates naturally and settles quickly without visible stepping.
      const consume = (remaining) => {
        if (Math.abs(remaining) <= 1) return [0, remaining];
        const move = remaining * 0.22;
        const stepPx = Math.abs(move) < 1 ? Math.sign(remaining) : move;
        return [remaining - stepPx, stepPx];
      };

      if (vEl && Math.abs(vRemaining) > 0.5) {
        const [next, step] = consume(vRemaining);
        vRemaining = next;
        vEl.scrollTop += step;
      } else {
        vRemaining = 0;
      }

      if (hEl && Math.abs(hRemaining) > 0.5) {
        const [next, step] = consume(hRemaining);
        hRemaining = next;
        hEl.scrollLeft += step;
      } else {
        hRemaining = 0;
      }

      if (Math.abs(vRemaining) > 0.5 || Math.abs(hRemaining) > 0.5) {
        raf = requestAnimationFrame(tick);
      }
    };
    const ensureLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleKeyDown = (e) => {
      if (!NAV_KEYS.includes(e.key)) return;

      const tableEl = tableRef.current;
      if (!tableEl) return;

      // Only act when the drawer / table actually holds focus. On drawer open we
      // auto-focus the table wrapper (see the focus effect below), so this is true
      // without the user having to click first.
      const active = document.activeElement;
      const isFocusedInTable = tableEl.contains(active) || active === tableEl;
      if (!isFocusedInTable) return;

      // Never let a real control (search box etc.) inside the table swallow arrows —
      // but rows themselves are tabIndex=0 divs, which we DO want to handle.
      const focusedTag = active?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(focusedTag)) return;

      // Enter opens the summary for the focused row (if any).
      if (e.key === "Enter") {
        if (focusedRowIdx !== null) {
          e.preventDefault();
          const row = tableData[focusedRowIdx];
          if (row && onSelect) onSelect(row.oncosuite_id);
        }
        return;
      }

      // UP / DOWN / PageUp / PageDown / Home / End → scroll the drawer viewport
      // itself to reveal hidden rows. The whole point (per UX): DOWN should reveal
      // MORE of the table, not hop a caret between visible rows — so we always
      // preventDefault to suppress the browser's native caret/focus movement.
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
        const scrollEl = getVerticalScrollParent(tableEl);
        if (!scrollEl) return;
        e.preventDefault();
        vEl = scrollEl;

        if (e.key === "Home") {
          vRemaining = -scrollEl.scrollTop;
          ensureLoop();
          return;
        }
        if (e.key === "End") {
          vRemaining = scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
          ensureLoop();
          return;
        }

        const isPage = e.key === "PageUp" || e.key === "PageDown";
        const step = isPage ? scrollEl.clientHeight * 0.9 : 120;
        const dir = (e.key === "ArrowDown" || e.key === "PageDown") ? 1 : -1;
        // Accumulate — holding/spamming the key builds momentum instead of resetting.
        vRemaining += dir * step;
        ensureLoop();
        return;
      }

      // LEFT / RIGHT → scroll the horizontal table scroller to reveal hidden columns.
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const scrollEl = tableScrollRef.current;
        if (!scrollEl) return;
        e.preventDefault();
        hEl = scrollEl;
        hRemaining += e.key === "ArrowRight" ? 200 : -200;
        ensureLoop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tableData, focusedRowIdx, onSelect]);

  // Auto-focus the table wrapper when it mounts / data arrives so keyboard
  // scrolling (arrows / page keys) works immediately, without the user having
  // to click into the drawer first. The wrapper is made focusable via tabIndex
  // on the element in JSX.
  useEffect(() => {
    if (drawerLoading) return;
    const tableEl = tableRef.current;
    if (!tableEl) return;
    // Don't steal focus from a control the user is already using inside the drawer.
    const active = document.activeElement;
    const activeTag = active?.tagName?.toLowerCase();
    if (["input", "textarea", "select"].includes(activeTag)) return;
    // Focus without scrolling the page to the element.
    tableEl.focus({ preventScroll: true });
  }, [tableData, drawerLoading]);

  /*  helpers  */
  const formatN = (n) => (n ? n.toLocaleString() : "-");

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

  const Metric = ({ label, value, asp, activeTable }) => (
    <div
      style={{
        ...styles.metricCol,
        ...(isSmallScreen && {
          width: "48%", // 2 metrics per row on mobile
        }),
        width: activeTable[0] !== "treatment_strategies" ? "100px" : "60px",
      }}
    >
      <div style={styles.metricLabel}>
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

      <div style={styles.metricValue}>
        {asp && value !== "-" && (
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
        {typeof value === "number"
          ? value === 0
            ? "-"
            : Number(value).toLocaleString("en-US")
          : value === undefined
            ? "-"
            : value}
      </div>
    </div>
  );

  const efficacyVsSafetyMetrics = [
    { key: "N", label: "N", format: formatN },
    { key: "ASP", label: "ASP", format: formatASP },
    { key: "ORR", label: "ORR" },
    { key: "PFS", label: "PFS" },
    { key: "SAERate", label: "SAE Rate" },
    { key: "Grade3AERate", label: "Grade ≥3 AE rate" },
  ];

  const treatmentStrategiesMetrics = [
    { key: "N", label: "N", format: formatN },
    { key: "2016", label: "2016" },
    { key: "2017", label: "2017" },
    { key: "2018", label: "2018" },
    { key: "2019", label: "2019" },
    { key: "2020", label: "2020" },
    { key: "2021", label: "2021" },
    { key: "2022", label: "2022" },
    { key: "2023", label: "2023" },
    { key: "2024", label: "2024" },
  ];

  const metricsByTable = {
    treatment_strategies: treatmentStrategiesMetrics,
    efficacyvssafety: efficacyVsSafetyMetrics,
  };

  const MetricsRow = ({ metricsConfig, data, activeTable }) => {
    return (
      <div
        style={{
          ...styles.metricsRow,
          ...(isSmallScreen && {
            flexWrap: "wrap",
            width: "100%",
            justifyContent: "flex-start",
          }),
          // minWidth: "30px",
        }}
      >
        {metricsConfig.map((metric) => {
          let value = data?.[metric.key];

          if (metric.format) {
            value = metric.format(value);
          }

          return (
            <Metric
              key={metric.key}
              label={metric.label}
              value={value}
              asp={metric.key === "ASP" ? data?.[metric.key] : undefined}
              activeTable={activeTable}
            />
          );
        })}
      </div>
    );
  };
  console.log("API DATA:", data);

  const toggleRegimen = (key) => {
    setExpandedRegimens((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const LEFT_COL_WIDTH = activeTable == "treatment_strategies" ? 229 : 190;

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
      const res = await getFeasibilityAnalytics({
        // comb_backbone: section.title,
        session_key:
          "search:578f1aa8f0f5b2881903d0a4a1dd609be8d0c8513f8991d42f70ad12141940b3",
        graph: [],
        table: activeTable,
      });

      const regimens =
        res?.efficacyvssafety_table?.views?.study?.sections?.[0]?.regimens ||
        res?.treatment_strategies_table?.views?.study?.sections?.[0]
          ?.regimens ||
        [];

      setSectionData((prev) => ({
        ...prev,
        [key]: regimens,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const metricStyle = {
    fontFamily: "Rubik",
    fontSize: "14px",
    fontWeight: 500,
    color: "rgba(0, 0, 0, 0.7)",
    textAlign: "left",
  };

  const handleEnter = (index) => {
    clearTimeout(timeoutRef.current);
    setHoveredRow(index);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredRow(null);
      setCountriesMenuAnchorRect(null);
    }, 200);
  };

  return (
    <div style={styles.container}>
      {/* {!isSmallScreen && (
        <div
          ref={dividerRef}
          className="responsive-divider"
          style={styles.fullHeightDivider}
        />
      )} */}

      {/* SECTIONS */}
      <HorizontalScrollHint fadeBg="#FFFFFF" scrollRef={tableScrollRef}>
        <div
          ref={tableRef}
          tabIndex={0}
          style={{ minWidth: "1200px", outline: "none" }}
          // Clicking a non-focusable cell blurs the wrapper to <body>, which
          // makes the keydown handler bail (it requires focus inside the table).
          // Return focus to the wrapper on click so arrow keys keep working —
          // unless the click was on a real control (link/button/input etc).
          onMouseUp={(e) => {
            const interactive = e.target.closest(
              "a, button, input, select, textarea, [role='button'], [contenteditable='true']",
            );
            if (interactive) return;
            tableRef.current?.focus({ preventScroll: true });
          }}
        >
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
            <>
              <div
                ref={headerRowRef}
                style={{
                  display: "grid",
                  columnGap: "16px",
                  gridTemplateColumns: GRID_COLUMNS,
                  padding: "12px 0px",
                  alignItems: "center",
                  background: "rgba(240, 246, 254, 1)",
                  fontWeight: 400,
                  fontSize: 12,
                  borderBottom: "1px solid #E5E7EB",
                  color: "rgba(74, 85, 101, 1)",
                  width: "max-content",
                  willChange: "transform",
                  position: "relative",
                }}
              >
                {/* Opaque backdrop that extends above the header to hide rows
                    scrolling up through the strip between the drawer header and
                    this pinned header. */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "100%",
                    height: 600,
                    background: "#ffffff",
                    zIndex: 0,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    padding: "0 16px",
                    background: "rgba(240, 246, 254, 1)",
                  }}
                >
                  OncoSuite ID & Trial Name
                </div>

                {drawerColumns.map((column) => (
                  <div key={column.key}>{column.label}</div>
                ))}
              </div>

              {tableData?.map((row, index) => (
                <div
                  key={row.id || index}
                  ref={(el) => { rowRefs.current[index] = el; }}
                  tabIndex={0}
                  onFocus={() => setFocusedRowIdx(index)}
                  style={{
                    display: "grid",
                    columnGap: "16px",
                    gridTemplateColumns: GRID_COLUMNS,
                    alignItems: "center",
                    padding: "12px 0px",
                    borderBottom: "1px solid #E5E7EB",
                    width: "max-content",
                  }}
                >
                  <div
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      padding: "0 16px",
                      background: "#fff",
                      cursor: onSelect ? "pointer" : "default",
                      borderLeft: focusedRowIdx === index ? "2px solid rgba(38, 102, 190, 0.5)" : "2px solid transparent",
                    }}
                    onClick={() => onSelect && onSelect(row.oncosuite_id)}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 400,
                          color: "rgba(0, 0, 0, 0.6)",
                        }}
                      >
                        {row.oncosuite_id}
                      </span>
                    </div>

                    <div
                      style={{
                        fontWeight: 500,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: "18px",
                        height: "36px",
                        width: "100%",
                        color: "rgba(28, 77, 142, 1)",
                        fontSize: "14px",
                      }}
                      title={row.trial_name}
                    >
                      {row.trial_name}
                    </div>
                  </div>

                  {drawerColumns.map((column) => {
                    // Countries render as a stack of flags with a "+N" overflow
                    // popper, so it keeps its bespoke cell.
                    if (column.type === "countries") {
                      return (
                        <div key={column.key} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", position: "relative", width: "auto" }}>
                          {parseCountriesList(row[column.key]).slice(0, 2).map((c, i) => {
                            const code = getCountryCode(c);
                            if (!code) return null;
                            return (
                              <Tooltip key={i} title={getCountryName(c)} placement="top" arrow slotProps={{ tooltip: { sx: { fontFamily: "Rubik", fontSize: 12 } } }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid #E5E7EB", flexShrink: 0, cursor: "default" }}>
                                  <Flag code={code.toUpperCase()} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                              </Tooltip>
                            );
                          })}

                          {(() => {
                            const all = parseCountriesList(row[column.key]);
                            if (all.length <= 2) return null;
                            const thirdCode = getCountryCode(all[2]);
                            return (
                              <div
                                style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}
                                onMouseEnter={(event) => {
                                  handleEnter(index);
                                  setCountriesMenuAnchorRect(event.currentTarget.getBoundingClientRect());
                                }}
                                onMouseLeave={handleLeave}
                              >
                                <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid #E5E7EB" }}>
                                  {thirdCode
                                    ? <Flag code={thirdCode.toUpperCase()} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <div style={{ width: "100%", height: "100%", background: "#E5E7EB" }} />}
                                </div>
                                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: "Rubik" }}>
                                  +{all.length - 2}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }

                    // Multi-value field shown as "first + N more" on two lines.
                    if (column.type === "list-clamped") {
                      const list = Array.isArray(row[column.key])
                        ? row[column.key]
                        : row[column.key]
                          ? [row[column.key]]
                          : [];
                      return (
                        <EvidenceHoverHeader
                          key={column.key}
                          label={
                            <div
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: "18px",
                                height: "36px",
                                width: "100%",
                                fontFamily: "Rubik",
                                fontWeight: 500,
                                fontSize: "14px",
                                color: "rgba(0, 0, 0, 0.7)",
                              }}
                              title={list.join(", ")}
                            >
                              {list[0] || "-"}
                              {list.length > 1 && (
                                <span style={{ marginLeft: 6 }}>
                                  +{list.length - 1} more
                                </span>
                              )}
                            </div>
                          }
                          evidence={buildEvidence({
                            rawValue: row[`${column.key}_evidence`],
                            label: column.label,
                            displayValue: list.join(", "),
                          })}
                        />
                      );
                    }

                    // Plain string[] (phase / line_of_therapy / cancer_stage) —
                    // these arrive without an evidence envelope.
                    if (column.type === "list") {
                      return (
                        <div key={column.key} style={metricStyle}>
                          {formatListCell(row[column.key])}
                        </div>
                      );
                    }

                    const rawValue = row[column.key];
                    const value = unwrapCellValue(rawValue);
                    const isEmpty =
                      value === null || value === undefined || value === "" || value === "-";
                    const displayValue = isEmpty
                      ? "-"
                      : column.type === "number" && Number.isFinite(Number(value))
                        ? Number(value).toLocaleString()
                        : String(value);

                    return (
                      <div key={column.key} style={metricStyle}>
                        <EvidenceHoverHeader
                          label={displayValue}
                          evidence={buildEvidence({
                            // Scalars are either wrapped inline or paired with a
                            // sibling `<key>_evidence` field by the normalizer.
                            rawValue: row[`${column.key}_evidence`] ?? rawValue,
                            label: column.label,
                            displayValue,
                          })}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}

              <Popper
                open={Boolean(countriesMenuAnchorRect) && hoveredRow !== null}
                anchorEl={countriesMenuAnchorRect ? { getBoundingClientRect: () => countriesMenuAnchorRect } : null}
                placement="bottom-start"
                strategy="fixed"
                modifiers={[
                  { name: "offset", options: { offset: [0, 8] } },
                ]}
                style={{ zIndex: 1300 }}
              >
                <div
                  className="app-scroll"
                  onMouseEnter={() => clearTimeout(timeoutRef.current)}
                  onMouseLeave={handleLeave}
                  onWheel={(e) => e.stopPropagation()}
                  onWheelCapture={(e) => e.stopPropagation()}
                  ref={(el) => {
                    if (!el) return;
                    el._stopWheel = el._stopWheel || ((e) => e.stopPropagation());
                    el.removeEventListener("wheel", el._stopWheel, { capture: true });
                    el.addEventListener("wheel", el._stopWheel, { capture: true, passive: false });
                  }}
                  style={{
                    width: 220,
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    padding: "8px 0",
                  }}
                >
                  {hoveredRow !== null &&
                    parseCountriesList(tableData?.[hoveredRow]?.countries).map((c, i) => {
                      const code = getCountryCode(c);
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "6px 12px",
                            fontSize: 13,
                            cursor: "default",
                          }}
                        >
                          {code ? (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                overflow: "hidden",
                                flexShrink: 0,
                                border: "1px solid #E5E7EB",
                              }}
                            >
                              <Flag
                                code={code.toUpperCase()}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "#E5E7EB",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span>{getCountryName(c)}</span>
                        </div>
                      );
                    })}
                </div>
              </Popper>
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
      </HorizontalScrollHint>
    </div>
  );
}
