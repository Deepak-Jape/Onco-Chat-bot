import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSharedChipFilters, setAnalyticsSessionKey } from "../../../redux/trialsDataSlice";
import { ChevronDown, Square, Check, Search } from "lucide-react";
import { getData as getCountryData } from "country-list";
import {
  getPopulationAnalytics,
  getPopulationShareableUrl,
  normalizePopulationAnalyticsFilters,
} from "../../../api/analytics/population";
import { ScatterChartSkeleton } from "./ChartSkeleton";
import MapView from "../../../components/MapView";
import PopulationSkeleton, { PatientDevelopmentSkeleton } from "./PopulationSkeleton";
import { X } from "lucide-react"; // For the tag close icons
import { useSearchParams } from "react-router-dom";
import {
  getSessionKeyFromSearchParams,
  setSessionKeySearchParam,
  isDefaultSearchSession,
} from "../../../utils/trialsUrlState";
import { useShareAction } from "./ShareActionContext";
import { Box, Dialog, IconButton, TextField, Typography } from "@mui/material";
import Copyicon from "../../../assets/icons/Copy.svg";
import { buildPopulationMapPoints, resolveCoordinates } from "../../../utils/helpers/populationMapPoints";

// --- Mock Data ---
const INITIAL_FUNNEL = [
  { id: "country", label: "United States", options: ["United States", "Australia", "Canada", "Denmark"], value: "30M", color: "rgba(44, 95, 110, 1)", width: "100%", checked: true },
  { id: "cancer", label: "Lung Cancer", options: ["Lung Cancer", "Breast Cancer", "Melanoma"], value: "10M", percent: "2.85%", color: "rgba(145, 52, 52, 1)", width: "90%", checked: true },
  { id: "subtype", label: "NSCLC", options: ["NSCLC", "SCLC", "Adenocarcinoma"], value: "1M", percent: "10%", color: "rgba(145, 77, 10, 1)", width: "75%", checked: true },
  { id: "mutation", label: "EGFR exon 19 deletion", options: ["EGFR exon 19 deletion", "KRAS", "ALK"], value: "500,000", percent: "50%", color: "rgba(122, 104, 97, 1)", width: "62%", checked: false, },
  { id: "stage", label: "All stages", options: ["All stages", "Stage I", "Stage II", "Stage IV"], value: "450", percent: "0.9%", color: "rgba(109, 95, 150, 1)", width: "48%", checked: false, },
  { id: "line", label: "2L (second line)", options: ["1L", "2L (second line)", "3L+"], value: "225", percent: "50%", color: "rgba(75, 145, 78, 1)", width: "35%", checked: false, },
];

const COMPETITION_DATA = [
  { year: 2026, pool: 350, active: 18, planned: 2.8, competition: "0.8%", color: "#FFF4E5", textColor: "#B45309" },
  { year: 2025, pool: 120, active: 22, planned: 1.0, competition: "0.8%", color: "#FFF4E5", textColor: "#B45309" },
  { year: 2024, pool: 280, active: 26, planned: 3.4, competition: "1.2%", color: "#FFF4E5", textColor: "#B45309" },
  { year: 2023, pool: 310, active: 28, planned: 5.9, competition: "1.9%", color: "#FEE2E2", textColor: "#B91C1C" },
  { year: 2022, pool: 150, active: 31, planned: 4.0, competition: "2.7%", color: "#FEE2E2", textColor: "#B91C1C" },
  { year: 2021, pool: 150, active: 34, planned: 5.7, competition: "3.6%", color: "#FEE2E2", textColor: "#B91C1C" },
];

const SELECTED_TAGS = ["United States", "Lung Cancer", "NSCLC"];


const COUNTRY_DISPLAY_NAME_LOOKUP = (() => {
  try {
    return new Map(
      (getCountryData?.() || []).map((c) => [String(c.name).toLowerCase(), c.name]),
    );
  } catch {
    return new Map();
  }
})();

function formatCountryLabel(rawName) {
  if (rawName === null || rawName === undefined) return "";
  const name = String(rawName).trim();
  if (!name) return "";
  if (name.toLowerCase() === "global") return "All Countries";

  // Preserve abbreviations like "USA"
  if (name === name.toUpperCase() && /[A-Z]/.test(name)) return name;

  const fromLookup = COUNTRY_DISPLAY_NAME_LOOKUP.get(name.toLowerCase());
  if (fromLookup) return fromLookup;

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part,
        )
        .join("-"),
    )
    .join(" ");
}

// Maps "all" option to a descriptive label per filter type
const ALL_LABEL_BY_ID = {
  country:  "All Countries",
  cancer:   "All Organs",
  subtype:  "All Histologies",
  mutation: "All Biomarkers",
  stage:    "All Cancer Stages",
  line:     "All Lines of Therapy",
};

function formatPopulationOptionLabel(id, rawValue) {
  if (rawValue === null || rawValue === undefined) return "";

  const normaliseRawValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      const candidate =
        value.label ?? value.name ?? value.value ?? value.id ?? "";
      return String(candidate ?? "").trim();
    }
    return String(value).trim();
  };

  const value = normaliseRawValue(rawValue);
  if (!value) return "";

  // Replace bare "all" / "ALL" with a descriptive label
  if (value.toLowerCase() === "all") {
    return ALL_LABEL_BY_ID[id] ?? "All";
  }

  if (id === "country") return formatCountryLabel(value);

  const titleCaseToken = (token) => {
    if (!token) return token;

    // Preserve acronyms / codes like NSCLC, EGFR, HER2+, PD-L1, IIIB, etc.
    if (token === token.toUpperCase() && /[A-Z]/.test(token)) return token;

    const match = token.match(/^([('"[\{<]*)(.*?)([)\]"'\}>.,!?:;]*)$/);
    const prefix = match ? match[1] : "";
    const core = match ? match[2] : token;
    const suffix = match ? match[3] : "";

    if (!core) return `${prefix}${suffix}`;

    const parts = core.split(/([+/-])/);
    const formattedCore = parts
      .map((part) => {
        if (part === "+" || part === "/" || part === "-") return part;
        if (!part) return part;
        if (part === part.toUpperCase() && /[A-Z]/.test(part)) return part;
        const lower = part.toLowerCase();
        return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
      })
      .join("");

    return `${prefix}${formattedCore}${suffix}`;
  };

  return value
    .split(/\s+/)
    .map((token) => titleCaseToken(token))
    .join(" ");
}

export default function PopulationTab({activeSubTab, session_keys}) {
  const [view, setView] = useState("Flow View");
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const viewDropdownRef = useRef(null);
  const viewDropdownCloseTimerRef = useRef(null);

  const openViewDropdown = () => {
    if (viewDropdownCloseTimerRef.current) {
      clearTimeout(viewDropdownCloseTimerRef.current);
      viewDropdownCloseTimerRef.current = null;
    }
    setViewDropdownOpen(true);
  };

  const scheduleCloseViewDropdown = () => {
    viewDropdownCloseTimerRef.current = setTimeout(() => {
      setViewDropdownOpen(false);
    }, 200);
  };
  const [loadedCharts, setLoadedCharts] = useState({ trialedVolume: false });
  const [isLoading, setIsLoading] = useState(true); // Add explicit loading state
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [funnelData, setFunnelData] = useState([]); // Start with empty array instead of static data
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPlacement, setDropdownPlacement] = useState("bottom"); // "bottom" | "top"
  const [_populationData, setPopulationData] = useState(null);
  const [populationMapData, setPopulationMapData] = useState(null);
  const [completeHierarchicalData, setCompleteHierarchicalData] = useState(null); // Store complete API data
  const [lastFilters, setLastFilters] = useState(null); // Store last filters payload
  const [selectedCountry, setSelectedCountry] = useState("global"); // Track selected country
  const selectedCountryRef = useRef("global"); // Ref for reading selectedCountry in effects without stale closure
  const prevSearchLocationRef = useRef(null); // Tracks previous search-bar location to detect real clears
  const [searchText, setSearchText] = useState(""); // For dropdown search
  const [dropdownHighlightIndex, setDropdownHighlightIndex] = useState(-1);
  const dropdownOptionsRef = useRef([]);
  const _scrollRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // const initialSessionKey = getSessionKeyFromSearchParams(searchParams);
  const initialSessionKey = searchParams.get("share_id");
  const currentSessionKeyRef = useRef(initialSessionKey);
  const { setShareAction, clearShareAction } = useShareAction();
  const [openShareModal, setOpenShareModal] = useState(false);

  const dispatch = useDispatch();
  const activeFilters = useSelector((state) => state.cards.activeFilters || {});
  const reduxSessionKey = useSelector((state) => state.cards.sessionKey) || "";
  const analyticsSessionKey = useSelector((state) => state.cards.analyticsSessionKey) || "";

  // Maps redux activeFilters (from search bar) to funnel selection keys.
  // activeFilters has two possible shapes depending on redux timing:
  //   pending  → { include: { histology: ["NSCLC"], organ: [...] }, exclude: {}, ... }
  //   fulfilled → { histology: ["NSCLC"], organ: [...], ... }  (flat API response payload)
  const getSelectionsFromActiveFilters = useCallback((filters) => {
    const selections = {};
    if (!filters || Object.keys(filters).length === 0) return selections;

    // Normalise to a flat map regardless of nesting shape
    const flat = filters?.include ? (filters.include || {}) : filters;

    const getFirst = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const item = arr[0];
      return typeof item === "object" ? (item.label ?? item.value ?? item.name ?? null) : String(item);
    };

    const organ = getFirst(flat.organ);
    if (organ) selections.cancer = organ;
    const histology = getFirst(flat.histology);
    if (histology) selections.subtype = histology;
    const biomarker = getFirst(flat.biomarkers);
    if (biomarker) selections.mutation = biomarker;
    const stage = getFirst(flat.cancer_stage);
    if (stage) selections.stage = stage;
    const line = getFirst(flat.line_of_therapy);
    if (line) selections.line = line;
    return selections;
  }, []);

  const handleToggleDropdown = useCallback((id) => {
    setOpenDropdown((current) => (current === id ? null : id));
  }, []);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!viewDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target)) {
        setViewDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [viewDropdownOpen]);

  useEffect(() => {
    currentSessionKeyRef.current = initialSessionKey;
  }, [initialSessionKey]);

  // Adopt a session key published by a sibling analytics tab (Treatment /
  // Feasibility) after it applied a filter, then refetch so the Patients view
  // reflects the same filtered session.
  useEffect(() => {
    if (!analyticsSessionKey || analyticsSessionKey === currentSessionKeyRef.current) return;
    if (isDefaultSearchSession(analyticsSessionKey)) return;
    currentSessionKeyRef.current = analyticsSessionKey;

    async function refetchWithSiblingSession() {
      try {
        if (hasLoadedOnceRef.current) {
          setIsFetching(true);
        } else {
          setIsLoading(true);
        }
        const data = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: selectedCountryRef.current || "global",
          filters: { country: [], organ: [], histology: [], biomarkers: [], stage: [], line_intent: [] },
          session_key: analyticsSessionKey,
        });
        if (data?.session_key) {
          currentSessionKeyRef.current = data.session_key;
        }
        setPopulationData(data);
        setCompleteHierarchicalData(data);
        if (data?.new_cancer_cases_flow) {
          setLastFilters(data.new_cancer_cases_flow.filters || {});
          setPopulationMapData(data);
          const selections = getSelectionsFromActiveFilters(activeFilters);
          setFunnelData(buildFunnelFromHierarchy(selections, data, selectedCountryRef.current || "global"));
        } else {
          setFunnelData([]);
        }
        setLoadedCharts({ trialedVolume: true });
      } catch (error) {
        console.error("Population sibling-session re-fetch error:", error);
      } finally {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
        setIsFetching(false);
      }
    }

    refetchWithSiblingSession();
  }, [analyticsSessionKey]);

  useEffect(() => {
    if (!reduxSessionKey || reduxSessionKey === currentSessionKeyRef.current) return;
    // When a shared session (share_id) is active, don't let the live/default
    // search session refetch and replace the shared data. The dedicated
    // restoreSharedFilters effect owns the share_id load.
    if (initialSessionKey) return;
    currentSessionKeyRef.current = reduxSessionKey;

    async function refetchWithNewSession() {
      try {
        if (hasLoadedOnceRef.current) {
          setIsFetching(true);
        } else {
          setIsLoading(true);
        }
        const data = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: selectedCountryRef.current || "global",
          filters: { country: [], organ: [], histology: [], biomarkers: [], stage: [], line_intent: [] },
          session_key: reduxSessionKey,
        });

        if (data?.session_key) {
          currentSessionKeyRef.current = data.session_key;
        }

        setPopulationData(data);
        setCompleteHierarchicalData(data);

        if (data?.new_cancer_cases_flow) {
          setLastFilters(data.new_cancer_cases_flow.filters || {});
          setPopulationMapData(data);
          const selections = getSelectionsFromActiveFilters(activeFilters);
          setFunnelData(buildFunnelFromHierarchy(selections, data, selectedCountryRef.current || "global"));
        } else {
          setFunnelData([]);
        }

        setLoadedCharts({ trialedVolume: true });
      } catch (error) {
        console.error("Population re-fetch error:", error);
        setFunnelData([]);
        setLoadedCharts({ trialedVolume: true });
      } finally {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
        setIsFetching(false);
      }
    }

    refetchWithNewSession();
  }, [reduxSessionKey, activeFilters, getSelectionsFromActiveFilters, initialSessionKey]);

  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
  }, [selectedCountry]);

  // Add session key restoration logic for shared URLs
  useEffect(() => {
    async function restoreSharedFilters() {
      if (!initialSessionKey) return;

      try {
        // Call the API with the session key to get the shared filters
        const data = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: "global",
          session_key: initialSessionKey,
          // Don't pass filters initially, let the session key restore them
        });

        if (data?.session_key) {
          currentSessionKeyRef.current = data.session_key;
        }

        // Publish applied top_filters so the header renders them as chips
        // (analytics API is the only source of the { include, exclude,
        // applied_filters } chip shape).
        const chipFilters = data?.top_filters || data?.payload?.top_filters;
        if (chipFilters) {
          dispatch(setSharedChipFilters(chipFilters));
        }

        // Check if we have shared filter data in the payload
        const sharedFilters = data?.payload?.graph_filters || data?.payload?.population_filters || {};

        // If we have shared filters, we need to call the API again with those filters
        if (Object.keys(sharedFilters).length > 0) {
          // Extract country from shared filters for country_name parameter
          const sharedCountry = sharedFilters.country?.[0] || "global";

          // Capitalize country name for display (italy -> Italy)
          const displayCountry = sharedCountry === "global" ? "global" :
            sharedCountry.charAt(0).toUpperCase() + sharedCountry.slice(1).toLowerCase();

          // Update the selected country state immediately
          setSelectedCountry(displayCountry);

          // Call API with the shared filters to get the correct data
          const filteredData = await getPopulationAnalytics({
            graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
            country_name: sharedCountry,
            filters: {
              country: sharedFilters.country || [],
              organ: sharedFilters.organ || [],
              histology: sharedFilters.histology || [],
              biomarkers: sharedFilters.biomarkers || [],
              stage: sharedFilters.stage || [],
              line_intent: sharedFilters.line_intent || [],
            },
            session_key: currentSessionKeyRef.current,
          });

          if (filteredData && filteredData.new_cancer_cases_flow) {
            const rootData = filteredData.new_cancer_cases_flow;
            const filters = filteredData?.new_cancer_cases_flow?.filters || {};

            setLastFilters(filters);
            setPopulationData(filteredData);
            setPopulationMapData(filteredData);
            setCompleteHierarchicalData(filteredData); // Store complete hierarchical data
            setSelectedCountry(displayCountry);

            // Build funnel data using the new helper with shared selections
            const sharedSelections = {};
            Object.keys(sharedFilters).forEach(filterKey => {
              const keyMap = {
                country: "country",
                organ: "cancer",
                histology: "subtype",
                biomarkers: "mutation",
                stage: "stage",
                line_intent: "line"
              };

              const funnelKey = keyMap[filterKey];
              if (funnelKey && sharedFilters[filterKey]?.[0]) {
                sharedSelections[funnelKey] = sharedFilters[filterKey][0];
              }
            });

            const mappedFunnel = buildFunnelFromHierarchy(sharedSelections, filteredData, displayCountry);
            setFunnelData(mappedFunnel);
            setLoadedCharts({ trialedVolume: true });
            setIsLoading(false);

            return; // Exit early, don't run the normal fetch
          }
        }

        // If no shared filters in payload, treat as normal session restoration
        if (data && data.new_cancer_cases_flow) {
          const rootData = data.new_cancer_cases_flow;
          const filters = data?.new_cancer_cases_flow?.filters || {};

          setLastFilters(filters);
          setPopulationData(data);
          setPopulationMapData(data);
          setCompleteHierarchicalData(data); // Store complete hierarchical data
          setSelectedCountry("global");

          // Build funnel data using the new helper (no selections for session restore)
          const mappedFunnel = buildFunnelFromHierarchy({}, data, "global");
          setFunnelData(mappedFunnel);
          setLoadedCharts({ trialedVolume: true });
          setIsLoading(false);

          return; // Exit early, don't run the normal fetch
        }
      } catch (error) {
        console.error('❌ Error restoring shared filters:', error);
        // Fall through to normal fetch logic
      }
    }

    // Only restore if we have a session key and haven't loaded data yet
    if (initialSessionKey && funnelData.length === 0) {
      restoreSharedFilters();
    }
  }, [initialSessionKey]); // Only run when initialSessionKey changes

  // const syncSessionKeyInUrl = useCallback(
  //   (nextSessionKey) => {
  //     setSearchParams(
  //       (prev) => setSessionKeySearchParam(prev, nextSessionKey),
  //       { replace: true },
  //     );
  //   },
  //   [setSearchParams],
  // );

  // Helper to format value as 4.2B, 64.8M, 70K, etc.
  function formatValue(val) {
    if (val >= 1e9) return (val / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
    return val?.toLocaleString?.() || val;
  }

  // Helper to navigate through hierarchical data client-side
  const navigateHierarchicalData = useCallback((selections) => {
    if (!completeHierarchicalData) return null;

    let currentData = completeHierarchicalData.new_cancer_cases_flow;
    const path = [];

    // Navigate through each level based on selections
    const levelMappings = [
      { id: "cancer", filterKey: "organ" },
      { id: "subtype", filterKey: "histology" },
      { id: "mutation", filterKey: "biomarkers" },
      { id: "stage", filterKey: "stage" },
      { id: "line", filterKey: "line_intent" }
    ];

    for (const mapping of levelMappings) {
      const selection = selections[mapping.id];
      if (selection && currentData.children) {
        const foundChild = currentData.children.find(child => child.name === selection);
        if (foundChild) {
          currentData = foundChild;
          path.push(selection);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return currentData;
  }, [completeHierarchicalData]);

  // Helper to build funnel from hierarchical data and selections
  const buildFunnelFromHierarchy = useCallback((selections = {}, hierarchicalData = null, countryOverride = null) => {
    const dataToUse = hierarchicalData || completeHierarchicalData;
    if (!dataToUse) {
      return [];
    }

    const sortOptions = (id, options = []) => {
      const normaliseOption = (opt) => {
        if (opt === null || opt === undefined) return "";
        if (typeof opt === "object") {
          const candidate = opt.label ?? opt.name ?? opt.value ?? opt.id ?? "";
          return String(candidate ?? "").trim();
        }
        return String(opt).trim();
      };

      // Dedupe by the final rendered label (case/whitespace-insensitive) so
      // the API returning near-duplicate raw values (e.g. differing only in
      // case) doesn't surface as two visually identical dropdown entries.
      const seenLabels = new Set();
      const unique = [];
      for (const raw of options || []) {
        const value = normaliseOption(raw);
        if (!value) continue;
        const labelKey = formatPopulationOptionLabel(id, value).trim().toLowerCase();
        if (!labelKey || seenLabels.has(labelKey)) continue;
        seenLabels.add(labelKey);
        unique.push(value);
      }

      return unique.sort((a, b) =>
        formatPopulationOptionLabel(id, a).localeCompare(
          formatPopulationOptionLabel(id, b),
          undefined,
          { sensitivity: "base" },
        ),
      );
    };

    const mappedFunnel = [];
    const rootData = dataToUse.new_cancer_cases_flow;
    const filters = dataToUse?.new_cancer_cases_flow?.filters || {};
    let prevLevelValue = Number(rootData?.value ?? 0);

    // Use country override if provided, otherwise use selectedCountry state
    const currentCountry = countryOverride || selectedCountry;

    // Country level (root)
    let countryOptions = [];
    if (filters.country && Array.isArray(filters.country)) {
      countryOptions = sortOptions("country", filters.country);
    }

    mappedFunnel.push({
      ...INITIAL_FUNNEL[0],
      id: "country",
      label: currentCountry === "global" ? "All Countries" : currentCountry,
      value: formatValue(rootData.value),
      options: countryOptions,
      checked: true,
    });

    // Navigate through hierarchy based on selections
    let currentLevel = rootData.children || [];
    let levelIndex = 1;

    console.log("🌲 buildFunnelFromHierarchy — rootData children:", currentLevel?.length, currentLevel?.map?.(c => c?.name));
    console.log("🌲 top-level filters:", Object.keys(filters).map(k => `${k}: [${(filters[k]||[]).join(", ")}]`));

    const levelMappings = [
      { id: "cancer", filterKey: "organ" },
      { id: "subtype", filterKey: "histology" },
      { id: "mutation", filterKey: "biomarkers" },
      { id: "stage", filterKey: "stage" },
      { id: "line", filterKey: "line_intent", filterKeyAlt: "line_of_therapy" }
    ];

    // Helper to get flat filter options for a mapping (handles alternate key)
    const getFlatFilterOptions = (mapping) => {
      const primary = filters[mapping.filterKey];
      if (Array.isArray(primary) && primary.length > 0) return primary;
      if (mapping.filterKeyAlt) {
        const alt = filters[mapping.filterKeyAlt];
        if (Array.isArray(alt) && alt.length > 0) return alt;
      }
      return [];
    };

    levelMappings.forEach((mapping) => {
      const baseConfig = INITIAL_FUNNEL[levelIndex] || {};

      const selection = selections[mapping.id];
      const allLabel = ALL_LABEL_BY_ID[mapping.id] ?? "All";

      // Some API responses include an explicit "All X" node/name (e.g. "All
      // Histology") alongside — or instead of — the bare "all" sentinel. Match
      // any "All ..." wording, not just our own ALL_LABEL_BY_ID phrasing, so it
      // doesn't survive as a second entry next to the pinned virtual "All X".
      const isAllSentinel = (name) => {
        const normalised = String(name ?? "").trim().toLowerCase();
        return normalised === "all" || /^all\s/.test(normalised);
      };

      console.log(`🔍 [${mapping.id}] currentLevel:`, currentLevel?.length, currentLevel?.map?.(c => c?.name), "| selection:", selection);

      if (currentLevel && currentLevel.length > 0) {
        if (selection) {
          // User has made a selection — find that specific child and navigate into it
          const levelData = currentLevel.find(
            (item) =>
              String(item?.name ?? "").trim().toLowerCase() ===
              String(selection).trim().toLowerCase(),
          ) || currentLevel[0];

          // Options are the names at currentLevel (siblings of the selection),
          // falling back to flat filters if hierarchy names are only sentinel "All" nodes
          const siblingNames = currentLevel.map((item) => item.name).filter((n) => n && !isAllSentinel(n));
          const flatFallback = getFlatFilterOptions(mapping).filter((n) => !isAllSentinel(n));
          const filterOptions = siblingNames.length > 0
            ? sortOptions(mapping.id, siblingNames)
            : flatFallback.length > 0 ? sortOptions(mapping.id, flatFallback) : [];

          const selVal = Number(levelData.value ?? 0);
          const selPct = levelData.percentage
            ? `${levelData.percentage}%`
            : prevLevelValue > 0
              ? `${((selVal / prevLevelValue) * 100).toFixed(2)}%`
              : undefined;
          mappedFunnel.push({
            ...baseConfig,
            id: mapping.id,
            label: selection,
            value: formatValue(levelData.value),
            percent: selPct,
            options: filterOptions,
            checked: true,
          });

          prevLevelValue = selVal;
          // Navigate into selected child
          currentLevel = levelData.children || [];
        } else {
          // No selection — find the "All" aggregate node if present, else sum all children
          const allNode = currentLevel.find((item) => isAllSentinel(item?.name));

          // Options are the names at currentLevel (excluding the "all" sentinel if present),
          // falling back to flat filters (handles line_of_therapy / line_intent mismatch)
          const optionNames = currentLevel
            .map((item) => item.name)
            .filter((name) => name && !isAllSentinel(name));
          const flatFallback = getFlatFilterOptions(mapping).filter((n) => !isAllSentinel(n));
          const filterOptions = optionNames.length > 0
            ? sortOptions(mapping.id, optionNames)
            : flatFallback.length > 0 ? sortOptions(mapping.id, flatFallback) : [];

          let levelValue, levelPercent;
          if (allNode) {
            levelValue = Number(allNode.value ?? 0);
            levelPercent = allNode.percentage;
            currentLevel = allNode.children || [];
          } else {
            // Use first child's value — summing all siblings gives inflated cross-organ aggregates
            const firstChild = currentLevel[0];
            levelValue = Number(firstChild?.value ?? 0);
            levelPercent = firstChild?.percentage ?? undefined;
            currentLevel = firstChild?.children || [];
          }

          const computedPct = levelPercent != null ? `${levelPercent}%` : "100%";

          mappedFunnel.push({
            ...baseConfig,
            id: mapping.id,
            // Prefer the API's own "All ..." wording (e.g. "All Histology")
            // over our hardcoded ALL_LABEL_BY_ID phrasing, so the pill text
            // always matches what the backend actually calls it.
            label: allNode?.name || allLabel,
            value: formatValue(levelValue),
            percent: computedPct,
            options: filterOptions,
            checked: true,
          });

          prevLevelValue = levelValue;
        }
        levelIndex++;
      } else {
        // currentLevel is empty — try flat filters as fallback for options
        const flatFallback = getFlatFilterOptions(mapping).filter((n) => !isAllSentinel(n));
        const filterOptions = flatFallback.length > 0 ? sortOptions(mapping.id, flatFallback) : [];
        mappedFunnel.push({
          ...baseConfig,
          id: mapping.id,
          label: selection || allLabel,
          value: "0",
          options: filterOptions,
          checked: !!selection,
        });
        levelIndex++;
      }
    });

    return mappedFunnel;
  }, [completeHierarchicalData, selectedCountry]);

  useEffect(() => {
    async function fetchPopulationData() {
      // Skip normal fetch if we have a session key (shared URL) - let the restoration logic handle it
      if (initialSessionKey) {
        return;
      }

      try {
        setIsLoading(true); // Set loading to true when starting fetch

        const data = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: "global",
          filters: {
            country: [],
            organ: [],
            histology: [],
            biomarkers: [],
            stage: [],
            line_intent: [],
          },
          session_key: currentSessionKeyRef.current,
        });

        if (data?.session_key) {
          // Keep the population cohort session key in a ref for population API
          // calls and Share only. Do NOT write it to the shared URL session
          // param — the trials list (ListTabContainer) reads that param and
          // would refetch by this population cohort key, returning 0 trials.
          // This matches how Treatment/Feasibility tabs behave (they never
          // write their analytics session key to the shared URL).
          currentSessionKeyRef.current = data.session_key;
          // syncSessionKeyInUrl(data.session_key);
        }

        setPopulationData(data);
        setCompleteHierarchicalData(data); // Store complete hierarchical data

        // Check if we have the expected data structure
        if (data && data.new_cancer_cases_flow) {
          const rootData = data.new_cancer_cases_flow;
          const filters = data?.new_cancer_cases_flow?.filters || {};

          setLastFilters(filters);
          setPopulationData(data);
          setPopulationMapData(data);
          setCompleteHierarchicalData(data); // Store complete hierarchical data

          // Build funnel data from the hierarchical structure using the new helper.
          // Seed with any search-bar selections (e.g. histology = NSCLC) so the
          // funnel reflects what the user already searched for.
          const initialSelections = getSelectionsFromActiveFilters(activeFilters);
          const mappedFunnel = buildFunnelFromHierarchy(initialSelections, data, "global");
          setFunnelData(mappedFunnel);
        } else {
          // Keep funnelData as empty array so skeleton continues to show
          setFunnelData([]);
        }

        setLoadedCharts({ trialedVolume: true });
        hasLoadedOnceRef.current = true;
        setIsLoading(false);

      } catch (error) {
        console.error('❌ API ERROR:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });

        // On error, keep empty array so skeleton shows
        setFunnelData([]);
        setLoadedCharts({ trialedVolume: true });
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
      }
    }

    fetchPopulationData();
  }, [
    // syncSessionKeyInUrl,
     initialSessionKey]); // Add initialSessionKey as dependency

  // Whenever search-bar filters change OR hierarchical data finishes loading,
  // rebuild the funnel client-side so the Population Flow reflects the selection.
  useEffect(() => {
    if (!completeHierarchicalData) return;
    const selections = getSelectionsFromActiveFilters(activeFilters);
    const newFunnel = buildFunnelFromHierarchy(selections, completeHierarchicalData, selectedCountry);
    setFunnelData(newFunnel);
  }, [activeFilters, completeHierarchicalData, buildFunnelFromHierarchy, getSelectionsFromActiveFilters, selectedCountry]);

  // When a country/location is selected in the search bar, trigger the country
  // API fetch so the Population Flow chart reflects the correct country data.
  // Also handle when country filter is removed (reset to global).
  useEffect(() => {
    if (!completeHierarchicalData) return;
    const flat = activeFilters?.include ? (activeFilters.include || {}) : activeFilters;

    const getFirst = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const item = arr[0];
      return typeof item === "object" ? (item.label ?? item.value ?? item.name ?? null) : String(item);
    };

    const location = getFirst(flat?.locations);
    const prevLocation = prevSearchLocationRef.current;
    prevSearchLocationRef.current = location;

    // If no location in filters, only reset to global when the search-bar
    // location was *actually cleared* (had a value on the previous run). Do
    // NOT reset when the search bar simply never had a location — otherwise a
    // country picked directly in the funnel dropdown gets stomped back to
    // global on the next render.
    if (!location) {
      if (prevLocation && selectedCountryRef.current.toLowerCase() !== "global") {
        handleSelect("country", "global");
      }
      return;
    }

    // Normalise to title-case for comparison (e.g. "china" → "China")
    const titleCase = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
    if (titleCase.toLowerCase() === selectedCountryRef.current.toLowerCase()) return; // already selected

    handleSelect("country", titleCase);
  // handleSelect is stable via useCallback; selectedCountry & activeFilters are the reactive deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters, completeHierarchicalData]);


  // Helper to build filters payload for API
  function buildFiltersPayload(id, value) {
    // Map funnel id to API filter key
    const keyMap = {
      country: "country",
      cancer: "organ",
      subtype: "histology",
      mutation: "biomarkers",
      stage: "stage",            // ✅ FIX
      line: "line_intent"        // ✅ FIX
    };
    // Default filter structure
    // const filters = {
    //   country: [""],
    //   organ: [""],
    //   histology: [""],
    //   biomarkers: [""],
    //   stage: [""],
    //   line_intent: [""],
    // };
    // const filterKey = keyMap[id] || id;
    // if (filters.hasOwnProperty(filterKey)) {
    //   filters[filterKey] = [value];
    // }
    const filterKey = keyMap[id] || id;
    const filters = {
      ...(lastFilters || {}),
      [filterKey]: [value],
    };
    return filters;
  }
  // Clear search text and highlight when dropdown closes
  useEffect(() => {
    if (!openDropdown) { setSearchText(""); setDropdownHighlightIndex(-1); }
  }, [openDropdown])

  // Reset highlight when search text changes
  useEffect(() => {
    setDropdownHighlightIndex(-1);
  }, [searchText])

  // Scroll highlighted item into view
  useEffect(() => {
    if (dropdownHighlightIndex < 0 || !dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('[data-dropdown-opt-idx]');
    items[dropdownHighlightIndex]?.scrollIntoView({ block: 'nearest' });
  }, [dropdownHighlightIndex])
  // Add this at the top of your component
  const dropdownRef = useRef(null);

  useLayoutEffect(() => {
    if (!openDropdown) return;
    const dropdownEl = dropdownRef.current;
    if (!dropdownEl) return;

    const anchorEl = dropdownEl.parentElement;
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const dropdownRect = dropdownEl.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;

    const padding = 8;
    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    const nextPlacement =
      spaceBelow < dropdownRect.height + padding && spaceAbove > spaceBelow
        ? "top"
        : "bottom";

    setDropdownPlacement((prev) =>
      prev === nextPlacement ? prev : nextPlacement,
    );
  }, [openDropdown]);

  // Add this useEffect to handle the outside click
  useEffect(() => {
    function handleClickOutside(event) {
      // If the dropdown is open AND the click was NOT inside the dropdownRef
      if (openDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]); // Re-run if openDropdown changes

  const handleSelect = useCallback(async (id, newValue) => {
    // Close dropdown immediately for better UX
    setOpenDropdown(null);

    // Virtual "All X" option selected — reset this level back to aggregate
    if (String(newValue).startsWith('__all__')) {
      if (id === 'country') {
        // Country reset needs an API call with "global"
        return handleSelect('country', 'global');
      }
      const currentSelections = {};
      funnelData.forEach(item => {
        if (item.checked && item.label && item.id !== id) {
          const allLabel = ALL_LABEL_BY_ID[item.id] ?? "All";
          if (item.label !== allLabel) currentSelections[item.id] = item.label;
        }
      });
      const newFunnel = buildFunnelFromHierarchy(currentSelections, completeHierarchicalData, selectedCountry);
      setFunnelData(newFunnel);
      return;
    }

    // If country is selected, we need to hit the API to get new data
    if (id === "country") {
      setSelectedCountry(newValue);
      setIsFetching(true);
      setLoadedCharts({ trialedVolume: false });

      try {
        const data = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: newValue,
          filters: {
            country: [],
            organ: [],
            histology: [],
            biomarkers: [],
            stage: [],
            line_intent: [],
          },
          session_key: currentSessionKeyRef.current,
        });

        setPopulationData(data);
        setCompleteHierarchicalData(data); // Store new complete data
        setSelectedCountry(newValue);

        if (data?.session_key) {
          // Keep the population cohort session key in a ref only — do NOT write
          // it to the shared URL session param (ListTabContainer reads it and
          // would refetch by this cohort key, returning 0 trials). Matches the
          // Treatment/Feasibility tab flow.
          currentSessionKeyRef.current = data.session_key;
          // syncSessionKeyInUrl(data.session_key);
        }

        const newFilters = data?.new_cancer_cases_flow?.filters || {};
        setLastFilters(newFilters);
        setPopulationMapData(data);

        // Build funnel with new country data, preserving both the current
        // funnel/bar selections (e.g. NSCLC picked directly on a bar) and any
        // active search-bar selections. Without carrying the bar selections
        // forward, changing the country resets every bar back to its "All X"
        // aggregate and the map/flow lose the applied filter.
        const barSelections = {};
        funnelData.forEach((item) => {
          if (!item.checked || !item.label || item.id === "country") return;
          const label = String(item.label).trim();
          const labelLower = label.toLowerCase();
          const isAggregate =
            labelLower === "all" || /^all\s/.test(labelLower) || label === item.id || label === "";
          if (!isAggregate) barSelections[item.id] = label;
        });
        const otherSelections = { ...getSelectionsFromActiveFilters(activeFilters), ...barSelections };
        const newFunnel = buildFunnelFromHierarchy(otherSelections, data, newValue);
        setFunnelData(newFunnel);

        // Force a re-render by updating loaded charts after funnel data
        setTimeout(() => {
          setLoadedCharts({ trialedVolume: true });
          setIsFetching(false);
        }, 10);
      } catch (error) {
        console.error('Error in country selection:', error);
        setLoadedCharts({ trialedVolume: true });
        setIsFetching(false);
      }
    } else {
      // For non-country filters, use client-side navigation
      // Get current selections from funnel data
      const currentSelections = {};
      funnelData.forEach(item => {
        if (item.checked && item.label && item.id !== id) {
          currentSelections[item.id] = item.label;
        }
      });

      // Add the new selection
      currentSelections[id] = newValue;

      // Build new funnel using client-side navigation with current country context
      const newFunnel = buildFunnelFromHierarchy(currentSelections, completeHierarchicalData, selectedCountry);
      setFunnelData(newFunnel);
    }
  }, [funnelData, buildFunnelFromHierarchy, completeHierarchicalData, selectedCountry, activeFilters, getSelectionsFromActiveFilters, 
    // syncSessionKeyInUrl
  ]);

  // Helper to build current applied filters from funnelData state
  const getCurrentAppliedFilters = useCallback(() => {
    const appliedFilters = {
      country: [],
      organ: [],
      histology: [],
      biomarkers: [],
      stage: [],
      line_intent: [],
    };

    // Map funnel id to API filter key
    const keyMap = {
      country: "country",
      cancer: "organ",
      subtype: "histology",
      mutation: "biomarkers",
      stage: "stage",
      line: "line_intent"
    };

    // Extract applied filters from current funnelData state
    funnelData.forEach(item => {
      if (item.checked && item.label && keyMap[item.id]) {
        const filterKey = keyMap[item.id];
        if (appliedFilters.hasOwnProperty(filterKey)) {
          // For country, use the selected country state instead of funnel label
          if (item.id === "country") {
            // Use selectedCountry state, but only if it's not "global"
            if (selectedCountry && selectedCountry !== "global") {
              appliedFilters[filterKey] = [selectedCountry];
            }
          } else {
            // For other filters, only add a genuine selection — skip the
            // aggregate "All X" state. A non-selected bar's label is either our
            // hardcoded "All Histologies" (ALL_LABEL_BY_ID) or the API's own
            // wording like "All Histology", so match any "all" / "All ..." label
            // rather than only "All Countries".
            const label = String(item.label ?? "").trim();
            const labelLower = label.toLowerCase();
            const isAggregate =
              labelLower === "all" ||
              /^all\s/.test(labelLower) ||
              label === item.id ||
              label === "";
            if (!isAggregate) {
              appliedFilters[filterKey] = [label];
            }
          }
        }
      }
    });

    return appliedFilters;
  }, [funnelData, selectedCountry]);

  const handleOpenShare = useCallback(async () => {
    setOpenShareModal(true);
    setShareUrl("");
    setShareLoading(true);

    try {
      // Get current applied filters from the funnel state instead of lastFilters
      const currentFilters = getCurrentAppliedFilters();
      const shareFilters = normalizePopulationAnalyticsFilters(currentFilters);

      const topSessionKey =
        currentSessionKeyRef.current || initialSessionKey || "";
      const result = await getPopulationShareableUrl({
        top_session_key: topSessionKey,
        filters: shareFilters,
        tab_name: "population",
      });

      const newSessionKey = result?.session_key;
      if (!newSessionKey) return;

      const tabPath = result?.tab_name || "population";
      const url = `${window.location.origin}/trials/${tabPath}?share_id=${encodeURIComponent(newSessionKey)}`;
      setShareUrl(url);
    } catch (error) {
      console.error("Share failed", error);
    } finally {
      setShareLoading(false);
    }
  }, [initialSessionKey, getCurrentAppliedFilters, selectedCountry, funnelData]);

  const handleCopy = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const ownerId = "population";
    if(activeSubTab == "Population") {
      setShareAction({ ownerId, onClick: handleOpenShare });
    } else {
      clearShareAction(ownerId);
    }
    return () => clearShareAction(ownerId);
  }, [clearShareAction, handleOpenShare, setShareAction, activeSubTab]);

  // When the user switches to Map View, re-fetch the population data passing the
  // currently-applied funnel/bar selections (e.g. NSCLC) as filters, so the map
  // (new_cancer_cases_map) reflects those filters instead of the stale unfiltered
  // data. Client-side funnel navigation never re-fetches, so without this the map
  // would ignore any bar filter that isn't the country.
  const lastMapFetchKeyRef = useRef(null);
  useEffect(() => {
    if (view !== "Map View") return;
    if (!completeHierarchicalData) return;

    const appliedFilters = getCurrentAppliedFilters();

    // Dedupe: skip the fetch if the applied filters (and country) haven't changed
    // since the last map fetch — avoids refetching every time the user toggles
    // back to Map View without changing anything.
    const fetchKey = JSON.stringify({ appliedFilters, country: selectedCountry });
    if (lastMapFetchKeyRef.current === fetchKey) return;
    lastMapFetchKeyRef.current = fetchKey;

    let cancelled = false;
    async function fetchFilteredMap() {
      try {
        setIsFetching(true);
        const data = await getPopulationAnalytics({
          graph: ["new_cancer_cases_flow", "new_cancer_cases_map"],
          country_name: selectedCountry || "global",
          filters: appliedFilters,
          session_key: currentSessionKeyRef.current,
        });
        if (cancelled) return;
        if (data?.session_key) {
          currentSessionKeyRef.current = data.session_key;
        }
        // Only refresh the map data — leave the funnel/flow as-is so switching
        // views doesn't visually rebuild the flow the user already has.
        setPopulationMapData(data);
      } catch (error) {
        console.error("Population map filtered re-fetch error:", error);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    fetchFilteredMap();
    return () => { cancelled = true; };
  }, [view, completeHierarchicalData, getCurrentAppliedFilters, selectedCountry]);

  const cohortTotal = useMemo(() => {
    // Read the country-level population straight off the map node so the
    // legend reflects the filtered map response (e.g. Brazil -> 27710) and
    // updates on every filter change. Falls back to the flow value only when
    // the map node has no population.
    const mapPopulation = populationMapData?.new_cancer_cases_map?.population;
    if (mapPopulation != null && Number(mapPopulation) > 0) {
      return Number(mapPopulation);
    }
    return Number(populationMapData?.new_cancer_cases_flow?.value ?? 0);
  }, [populationMapData]);

  const populationMapInitialViewState = useMemo(() => {
    const rootCountry = populationMapData?.new_cancer_cases_map?.name ?? selectedCountry;
    const coordinates = resolveCoordinates(rootCountry, rootCountry);
    if (coordinates) {
      return {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        zoom: 4.5,
      };
    }

    // Global fallback
    return { longitude: 0, latitude: 20, zoom: 2 };
  }, [populationMapData, selectedCountry]);

  const populationMapPoints = useMemo(() => {
  const root = populationMapData?.new_cancer_cases_map;
  return buildPopulationMapPoints(root, selectedCountry);
}, [populationMapData, selectedCountry]);

  return (
    <>
      <div style={{ background: "transparent", fontFamily: "Rubik, sans-serif" }}>
        <div style={{ width: "100%", padding: "2% 2% 0" }}>
          {isLoading ? (
            <PopulationSkeleton height={260} />
          ) : (
            <div style={{ position: "relative" }}>
              {isFetching && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 10,
                  background: "rgba(255,255,255,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, border: "3px solid #e0e7ef",
                    borderTop: "3px solid #2666BE", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                </div>
              )}
              <div style={{
                background: "#fff",
                padding: 16,
                borderRadius: 6,
                border: "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: "2px 2px 10px 0px rgba(183, 192, 208, 0.05)",
                marginBottom: 24,
              }}>
                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 23, fontWeight: 500, color: "rgba(0, 0, 0, 0.8)" }}>
                    New Cancer Cases per Year
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div
                      ref={viewDropdownRef}
                      style={{ position: "relative" }}
                      onMouseEnter={openViewDropdown}
                      onMouseLeave={scheduleCloseViewDropdown}
                    >
                      <button
                        type="button"
                        onClick={() => setViewDropdownOpen((prev) => !prev)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          height: "36px",
                          padding: "0 12px",
                          border: "1px solid rgba(0,0,0,0.12)",
                          borderRadius: "6px",
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontFamily: "Rubik, sans-serif",
                          fontWeight: 400,
                          color: "rgba(0,0,0,0.6)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {view}
                        <ChevronDown size={14} style={{ color: "rgba(0,0,0,0.4)", flexShrink: 0, transition: "transform 200ms ease", transform: viewDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </button>
                      {viewDropdownOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            minWidth: "100%",
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,0.08)",
                            borderRadius: "6px",
                            boxShadow: "0 4px 16px rgba(130,143,169,0.15)",
                            zIndex: 9999,
                            padding: "4px",
                            marginTop: "4px",
                          }}
                        >
                          {["Flow View", "Map View"].map((item) => (
                            <div
                              key={item}
                              onClick={() => { setView(item); setViewDropdownOpen(false); }}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontFamily: "Rubik, sans-serif",
                                fontWeight: view === item ? 500 : 400,
                                color: view === item ? "rgba(38,102,190,1)" : "rgba(0,0,0,0.7)",
                                background: view === item ? "rgba(38,102,190,0.06)" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              onMouseEnter={(e) => { if (view !== item) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = view === item ? "rgba(38,102,190,0.06)" : "transparent"; }}
                            >
                              {view === item && (
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="rgba(38,102,190,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              )}
                              {view !== item && <span style={{ width: 12, flexShrink: 0 }} />}
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CHART AREA */}
                <div style={{ minHeight: 260 }}>
                  {view === "Flow View" ?
                    (
                      funnelData.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          {funnelData.map((row, index) => (
                            <div key={row.id} style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                              {/* The Bar */}
                              <div
                                style={{
                                  width: row.width,
                                  height: "40px",
                                  background: row.checked ? row.color : "#F9FAFB",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "0 16px",
                                  border: (row.isGhost || !row.checked) ? "1px solid #B8D4F9" : "none",
                                  cursor: "default",
                                  transition: "all 0.2s ease",
                                  zIndex:
                                    openDropdown === row.id
                                      ? 9999
                                      : funnelData.length - index,
                                  boxSizing: "border-box"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  {row.checked ? (
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {/* The solid white background/border square */}
                                      <Square
                                        size={18}
                                        fill="#fff"
                                        color="#fff"
                                      />
                                      {/* The "cutout" checkmark that takes the color of the bar */}
                                      <Check
                                        size={14}
                                        strokeWidth={3}
                                        color={row.isGhost ? "#2666BE" : row.color}
                                        style={{ position: 'absolute' }}
                                      />
                                    </div>
                                  ) : (
                                    <Square
                                      size={18}
                                      color="#B8D4F9"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleDropdown(row.id);
                                    }}
                                    aria-expanded={openDropdown === row.id}
                                    style={{
                                      padding: 0,
                                      border: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      color:
                                        row.checked && !row.isGhost
                                          ? "#fff"
                                          : "rgba(0,0,0,0.7)",
                                    }}
                                  >
                                    {formatPopulationOptionLabel(row.id, row.label)}
                                  </button>
                                  <div
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleDropdown(row.id);
                                    }}
                                    style={{ cursor: "pointer", display: "flex" }}
                                  >
                                    <ChevronDown
                                      size={16}
                                      color={(row.checked && !row.isGhost) ? "#fff" : "#94A3B8"}
                                      style={{
                                        transition: "transform 150ms ease",
                                        transform:
                                          openDropdown === row.id
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                      }}
                                    />
                                  </div>
                                </div>
                                <span style={{ fontSize: "16px", fontWeight: 500, color: (row.checked && !row.isGhost) ? "#fff" : "#1E293B" }}>
                                  {row.value}
                                </span>

                                {/* Dropdown Menu */}
                                {openDropdown === row.id && (
                                  <div style={{
                                    position: "absolute",
                                    top: dropdownPlacement === "bottom" ? "45px" : "auto",
                                    bottom: dropdownPlacement === "top" ? "45px" : "auto",
                                    left: "40px",
                                    width: "240px", // Slightly wider for search icon
                                    background: "#FFFFFF",
                                    borderRadius: "8px",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                    border: "1px solid #E2E8F0",
                                    zIndex: 1000,
                                    padding: "8px 0"
                                  }}
                                    ref={openDropdown === row.id ? dropdownRef : null}>

                                    {/* SEARCH INPUT */}
                                    <div style={{ padding: "0 12px 8px 12px", zIndex: 999999 }}>
                                      <div style={{
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: '#FFFFFF',
                                        borderRadius: '8px',
                                        border: '1px solid #D1D5DB',
                                        padding: '6px 10px'
                                      }}>
                                        <Search size={14} color="#9CA3AF" style={{ marginRight: '8px' }} />
                                        <input
                                          autoFocus
                                          placeholder={(() => {
                                            switch (row.id) {
                                              case "country": return "Search country...";
                                              case "cancer": return "Search organ...";
                                              case "mutation": return "Search biomarker...";
                                              case "subtype": return "Search histology...";
                                              case "stage": return "Search cancer stage...";
                                              case "line": return "Search line of therapy...";
                                              default: return "Search...";
                                            }
                                          })()}
                                          style={{
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '13px',
                                            outline: 'none',
                                            width: '100%',
                                            color: '#374151'
                                          }}
                                          value={openDropdown === row.id ? searchText : ""}
                                          onChange={e => setSearchText(e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => {
                                            const opts = dropdownOptionsRef.current;
                                            if (e.key === 'ArrowDown') {
                                              e.preventDefault();
                                              setDropdownHighlightIndex(i => Math.min(i + 1, opts.length - 1));
                                            } else if (e.key === 'ArrowUp') {
                                              e.preventDefault();
                                              setDropdownHighlightIndex(i => Math.max(i - 1, 0));
                                            } else if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const item = opts[dropdownHighlightIndex];
                                              if (item) { handleSelect(row.id, item.opt); setSearchText(""); }
                                            } else if (e.key === 'Escape') {
                                              setOpenDropdown(null);
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* SCROLLABLE OPTIONS LIST */}
                                    <div style={{
                                      maxHeight: "220px", // Fixed height for scrollbar as per image
                                      overflowY: "auto",
                                      scrollbarWidth: 'thin'
                                    }}>
                                      {(() => {
                                        const needle = String(searchText || "")
                                          .trim()
                                          .toLowerCase();

                                        const getMatchScore = (labelLower) => {
                                          if (!needle) return { rank: 99, index: 9999 };
                                          if (labelLower === needle) return { rank: 0, index: 0 }; // exact
                                          if (labelLower.startsWith(needle))
                                            return { rank: 1, index: 0 }; // prefix

                                          const words = labelLower.split(/\s+/).filter(Boolean);
                                          if (words.some((w) => w.startsWith(needle)))
                                            return { rank: 2, index: 0 }; // word prefix

                                          const index = labelLower.indexOf(needle);
                                          if (index !== -1) return { rank: 3, index }; // substring

                                          return { rank: 99, index: 9999 };
                                        };

                                        const filteredOptions = (row.options || [])
                                          .map((opt) => {
                                            const label = formatPopulationOptionLabel(
                                              row.id,
                                              opt,
                                            );
                                            return {
                                              opt,
                                              label,
                                              labelLower: label.toLowerCase(),
                                            };
                                          })
                                          .filter(({ labelLower }) => {
                                            if (!needle) return true;

                                            // Keep broad matching, but we will rank results so exact matches show first.
                                            if (needle.length <= 1) {
                                              if (labelLower.startsWith(needle)) return true;
                                              return labelLower
                                                .split(/\s+/)
                                                .some((word) => word.startsWith(needle));
                                            }

                                            return labelLower.includes(needle);
                                          })
                                          .sort((a, b) => {
                                            const as = getMatchScore(a.labelLower);
                                            const bs = getMatchScore(b.labelLower);
                                            if (as.rank !== bs.rank) return as.rank - bs.rank;
                                            if (as.index !== bs.index) return as.index - bs.index;
                                            return a.label.localeCompare(b.label, undefined, {
                                              sensitivity: "base",
                                            });
                                          });

                                        const normaliseOption = (value) =>
                                          String(value ?? "")
                                            .trim()
                                            .toLowerCase();

                                        const selectedLabel = formatPopulationOptionLabel(
                                          row.id,
                                          row.label,
                                        );
                                        const selectedOption = filteredOptions.find(
                                          ({ label }) => label === selectedLabel,
                                        );

                                        // Prefer the API's own "All ..." wording when the currently
                                        // selected row is itself an "all" state (e.g. "All Histology"),
                                        // falling back to our hardcoded phrasing only if the API never
                                        // sent one — keeps the pinned entry and the pill text in sync.
                                        const apiAllLabel = /^all\s/i.test(String(row.label ?? "").trim())
                                          ? formatPopulationOptionLabel(row.id, row.label)
                                          : null;
                                        const allOptionLabel = apiAllLabel || (ALL_LABEL_BY_ID[row.id] ?? "All");
                                        // Virtual "All" entry — always pinned first
                                        const virtualAllOption = { opt: `__all__${row.id}`, label: allOptionLabel, labelLower: allOptionLabel.toLowerCase() };
                                        const isAllSelected = selectedLabel.toLowerCase() === allOptionLabel.toLowerCase();

                                        // Matches the raw "all" sentinel as well as any API-provided
                                        // "All <Something>" variant (e.g. "All Histology" vs our own
                                        // "All Histologies") so only the single pinned virtual entry shows.
                                        const isAllVariant = (label, opt) => {
                                          if (normaliseOption(opt) === "all") return true;
                                          return /^all\s/i.test(String(label ?? "").trim());
                                        };

                                        const orderedOptions = (() => {
                                          const needle = String(searchText || "").trim().toLowerCase();

                                          // Always pin "All X" at top unless searching and it doesn't match
                                          const showVirtualAll = !needle || allOptionLabel.toLowerCase().includes(needle);

                                          const out = [];
                                          if (showVirtualAll) out.push(virtualAllOption);

                                          for (const opt of filteredOptions) {
                                            // Skip raw "all" sentinel and any "All ..." variant coming from the
                                            // API — replaced by the single pinned virtualAllOption above.
                                            if (isAllVariant(opt.label, opt.opt)) continue;
                                            out.push(opt);
                                          }

                                          return out;
                                        })();

                                        if (orderedOptions.length === 0) {
                                          dropdownOptionsRef.current = [];
                                          return (
                                            <div style={{
                                              padding: "10px 16px",
                                              fontSize: "14px",
                                              color: "#9CA3AF",
                                              fontStyle: "italic"
                                            }}>
                                              No options available
                                            </div>
                                          );
                                        }

                                        dropdownOptionsRef.current = orderedOptions;

                                        return orderedOptions.map(({ opt, label: optionLabel }, optIdx) => {
                                          const isVirtualAll = String(opt).startsWith('__all__');
                                          const isSelected = isVirtualAll ? isAllSelected : optionLabel === selectedLabel;
                                          const isHighlighted = optIdx === dropdownHighlightIndex;
                                          return (
                                            <div
                                              key={opt}
                                              data-dropdown-opt-idx={optIdx}
                                              onClick={(e) => { e.stopPropagation(); handleSelect(row.id, opt); setSearchText(""); }}
                                              style={{
                                                padding: "10px 16px",
                                                fontSize: "14px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                background: isHighlighted ? "#EBF2FB" : isSelected ? "#C3D1E4" : "transparent",
                                                cursor: 'pointer',
                                                color: isSelected ? "#1D4ED8" : "#4B5563",
                                                fontFamily: "'Rubik', sans-serif",
                                                transition: 'background 0.2s'
                                              }}
                                              onMouseEnter={(e) => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = "#F9FAFB" }}
                                              onMouseLeave={(e) => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = "transparent" }}
                                            >
                                              <span style={{ fontWeight: isSelected ? 500 : 400 }}>
                                                {optionLabel}
                                              </span>
                                              {/* Check icon is optional based on image, image shows text color change only */}
                                              {isSelected && <Check size={14} color="#2666BE" />}
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                )}
                                {/* ...existing code... */}
                              </div>


                              {/* Connector Arrow */}
                              {row.percent && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" style={{ marginTop: '-12px' }}>
                                    {/* The Curved Line */}
                                    <path
                                      d="M38 2C38 8 40 20 4 22"
                                      stroke="#B8D4F9"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                    />
                                    {/* The Arrow Head (Pointing Left) */}
                                    <path
                                      d="M10 18L1 22L10 26"
                                      stroke="#B8D4F9"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span style={{ fontSize: "15px", color: "rgba(0,0,0,0.4)", fontWeight: 400 }}>{row.percent}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <PopulationSkeleton height={260} />
                      )
                    )
                    : (
                      <div style={{ height: "calc(100vh - 290px)", minHeight: 460 }}>
                        <MapView
                          key={populationMapData?.new_cancer_cases_map?.name || selectedCountry}
                          data={populationMapPoints}
                          loading={isLoading}
                          initialViewState={populationMapInitialViewState}
                          cohortTotal={cohortTotal}
                        />
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <PatientDevelopmentSkeleton height={260} />
          ) : (
            <>
              {/* SECTION 2: PATIENT DEVELOPMENT & COMPETITION */}
              <div style={{
                background: "#fff",
                padding: "24px",
                borderRadius: 6,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                marginTop: "24px"
              }}>

                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: 0 }}>
                    Patient Development & Competition
                  </h2>
                  <div style={{
                    padding: "6px 12px",
                    border: "1px solid #DBEAFE",
                    borderRadius: "6px",
                    color: "#2563EB",
                    fontSize: "13px",
                    fontWeight: "500"
                  }}>
                    140 Trials
                  </div>
                </div>

                {/* Filter Tags */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                  {(() => {
                    const tags = [];
                    const flat = activeFilters?.include ? (activeFilters.include || {}) : activeFilters;

                    // Add location/country if present
                    if (flat?.locations && Array.isArray(flat.locations) && flat.locations.length > 0) {
                      const loc = flat.locations[0];
                      const locLabel = typeof loc === "object" ? (loc.label ?? loc.name ?? loc.value ?? "") : String(loc);
                      if (locLabel) tags.push({ key: "location", label: locLabel });
                    }

                    // Add organ if present
                    if (flat?.organ && Array.isArray(flat.organ) && flat.organ.length > 0) {
                      const org = flat.organ[0];
                      const orgLabel = typeof org === "object" ? (org.label ?? org.name ?? org.value ?? "") : String(org);
                      if (orgLabel) tags.push({ key: "organ", label: orgLabel });
                    }

                    // Add histology if present
                    if (flat?.histology && Array.isArray(flat.histology) && flat.histology.length > 0) {
                      const hist = flat.histology[0];
                      const histLabel = typeof hist === "object" ? (hist.label ?? hist.name ?? hist.value ?? "") : String(hist);
                      if (histLabel) tags.push({ key: "histology", label: histLabel });
                    }

                    return tags.map(tag => (
                      <div key={tag.key} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        backgroundColor: "#EFF6FF",
                        border: "1px solid #DBEAFE",
                        borderRadius: "100px",
                        fontSize: "12px",
                        color: "#6B7280"
                      }}>
                        {tag.label} <X size={12} style={{ cursor: "pointer" }} />
                      </div>
                    ));
                  })()}
                </div>

                {/* The Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <th style={styles.th}>Year</th>
                      <th style={styles.th}>Patient Pool</th>
                      <th style={styles.th}>Active Trials</th>
                      <th style={styles.th}>Planned Patients</th>
                      <th style={styles.th}>Competition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPETITION_DATA.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: idx !== COMPETITION_DATA.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                        <td style={styles.td}>{row.year}</td>
                        <td style={styles.td}>{row.pool}</td>
                        <td style={styles.td}>{row.active}</td>
                        <td style={styles.td}>{row.planned}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: "100px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: row.color,
                            color: row.textColor
                          }}>
                            {row.competition}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={openShareModal}
        onClose={() => setOpenShareModal(false)}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            padding: "16px",
            width: "420px",
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 500,
              fontFamily: "Rubik",
              color: "rgba(0,0,0,0.8)",
            }}
          >
            Share
          </Typography>

          <IconButton
            onClick={() => setOpenShareModal(false)}
            sx={{
              width: "24px",
              height: "24px",
              padding: 0,
            }}
          >
            <span style={{ fontSize: "14px", lineHeight: "14px" }}>✕</span>
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "8px",
            padding: "5px 8px",
            gap: "8px",
          }}
        >
          <TextField
            fullWidth
            value={shareLoading ? "Generating..." : shareUrl}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: "12px",
                color: "rgba(0,0,0,0.6)",
                fontFamily: "Rubik",
              },
              readOnly: true,
            }}
          />

          <div style={{ position: "relative" }}>
            <IconButton
              onClick={handleCopy}
              disabled={!shareUrl || shareLoading}
              sx={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                background: "#EEF2FF",
                padding: 0,
              }}
            >
              <img
                src={Copyicon}
                alt="copy"
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            </IconButton>

            {copied && (
              <div
                style={{
                  position: "absolute",
                  top: "-28px",
                  right: "0",
                  background: "#000",
                  color: "#fff",
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                Copied
              </div>
            )}
          </div>
        </Box>
      </Dialog>
    </>
  );
}

const styles = {
  th: {
    padding: "12px 0",
    fontSize: "13px",
    fontWeight: "500",
    color: "#6B7280",
    borderBottom: "1px solid #F3F4F6"
  },
  td: {
    padding: "16px 0",
    fontSize: "14px",
    color: "#374151"
  }
};
