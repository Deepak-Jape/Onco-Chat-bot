import {
  useState,
  useReducer,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useDeferredValue,
  startTransition,
} from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";
import Copyicon from "../../../assets/icons/Copy.svg";

import CustomScrollbar from "../../../common/CustomScrollbar";
import {
  Select,
  MenuItem,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  TextField,
  Button,
  Switch,
  CircularProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { useShareAction } from "./ShareActionContext";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import treatmentData from "./treatmentData.json";
import TreatmentStrategies from "./TreatmentStrategies";
import { analyticStyles, styles } from "./style";
import { downloadIcon } from "../../../assets";
import CommonRightDrawer from "../../../common/CommonRightDrawer";
import ExecuiteSummaryDrawer from "./ExecuiteSummaryDrawer";
import CountrySelect from "../../../common/CountrySelect";
import FilterSelect from "../../../common/FilterSelect";
import {
  getTreatmentAnalytics,
  getTreatmentShareableUrl,
  normalizeTreatmentAnalyticsFilters,
} from "../../../api/analytics/treatment";
import { getExecutiveSummaryById } from "../../../api/Profile";
import TreatmentStrategyGraphSkeleton from "./TreatmentStrategyGraphSkeleton";
import EfficacyVsSafetyGraphSkeleton from "./EfficacyVsSafetyGraphSkeleton";
import {
  getAnalyticsSharedFiltersFromSearchParams,
  getSharedSessionFallbackFilters,
  getSessionKeyFromSearchParams,
  hasAnalyticsSharedFilters,
  setSessionKeySearchParam,
  isDefaultSearchSession,
  // setStoredFiltersForSession,
} from "../../../utils/trialsUrlState";
import { toggleAlert } from "../../../redux/trialsSlice";
import { setSharedChipFilters, setAnalyticsSessionKey } from "../../../redux/trialsDataSlice";
// import getScrollbarThumb from "../.."

/* Axis Styles */
const axisTick = {
  fill: "rgba(0, 0, 0, 0.7)",
  fontSize: 12,
  lineHeight: "12px",
  fontFamily: "Rubik",
};

const axisLabel = {
  fill: "rgba(0,0,0,0.4)",
  fontSize: 12,
  fontFamily: "Rubik",
  fontWeight: 400,
};

const formatAxisNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";

  const abs = Math.abs(numeric);
  const sign = numeric < 0 ? "-" : "";

  const formatSmall = (n) => {
    if (!Number.isFinite(n)) return "";
    if (Number.isInteger(n)) return String(n);
    const fixed = n.toFixed(2);
    return fixed.replace(/\.?0+$/, "");
  };

  // Use lowercase suffixes as requested: 1.2k, 3.4m
  if (abs >= 1_000_000) {
    return `${sign}${formatSmall(abs / 1_000_000)}m`;
  }

  if (abs >= 1_000) {
    return `${sign}${formatSmall(abs / 1_000)}k`;
  }

  return formatSmall(numeric);
};

const EfficacyXAxisTick = ({ x, y, payload, minTick, maxTick, tickLabels }) => {
  const rawValue = payload?.value;
  const labelValue =
    Array.isArray(tickLabels) && Number.isFinite(rawValue)
      ? tickLabels[rawValue]
      : rawValue;

  const isMin = Number.isFinite(minTick) && rawValue === minTick;
  const isMax = Number.isFinite(maxTick) && rawValue === maxTick;
  const textAnchor = isMin ? "start" : isMax ? "end" : "middle";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor={textAnchor}
        style={axisTick}
      >
        {formatAxisNumber(labelValue)}
      </text>
    </g>
  );
};

/*Bubble Size*/
const SIZE_MAP = {
  xs: 80,
  sm: 140,
  md: 220,
  lg: 360,
};
// const STACK_COLORS = {
//   adc: "#90A4AE",
//   chemo: "#607D8B",
//   targeted: "#2C5F6E",
//   vaccine: "#F18010",
//   "cell therapy": "#A1887F",
//   "cell therapy + gene therapy": "#A1887F",
//   "cell therapy + gene therapy + targeted": "#A1887F",
//   "cell therapy + vaccine": "#A1887F",
//   "gene therapy": "#C14646",
//   "gene therapy + vaccine": "#C14646",
//   hormonal: "#8D6E63",
//   "not specified": "#B0BEC5",
//   other: "#9E9E9E",
//   palliative: "#B39DDB",
//   radiopharmaceutical: "#FF7043",
//   radiotherapy: "#26A69A",
//   steroids: "#78909C",
// };

const TREATMENT_COLOR_FAMILIES = [
  ["rgba(144, 164, 174, 1)", "rgba(96, 125, 139, 1)", "rgba(44, 95, 110, 1)"],
  ["rgba(241, 87, 87, 1)", "rgba(193, 70, 70, 1)", "rgba(145, 52, 52, 1)"],
  ["rgba(241, 128, 16, 1)", "rgba(193, 102, 13, 1)", "rgba(145, 77, 10, 1)"],
  ["rgba(205, 174, 163, 1)", "rgba(159, 136, 128, 1)", "rgba(122, 104, 97, 1)"],
  ["rgba(188, 170, 240, 1)", "rgba(142, 124, 195, 1)", "rgba(109, 95, 150, 1)"],
  ["rgba(166, 228, 169, 1)", "rgba(129, 199, 132, 1)", "rgba(75, 145, 78, 1)"],
  ["rgba(141, 219, 212, 1)", "rgba(83, 186, 176, 1)", "rgba(40, 146, 136, 1)"],
];

const REGIMEN_COMPLEXITY_COLORS = {
  "1": "rgba(144, 164, 174, 1)",
  "2": "rgba(96, 125, 139, 1)",
  "3": "rgba(44, 95, 110, 1)",
  "4+": "rgba(40, 146, 136, 1)",
};

const KNOWN_STACK_KEYS = [
  "adc",
  "cell therapy",
  "cell therapy + gene therapy",
  "cell therapy + gene therapy + targeted",
  "cell therapy + vaccine",
  "chemo",
  "gene therapy",
  "gene therapy + vaccine",
  "hormonal",
  "not specified",
  "other",
  "palliative",
  "radiopharmaceutical",
  "radiotherapy",
  "steroids",
  "targeted",
  "vaccine",
];

const STACK_COLOR_FAMILIES_BASE = KNOWN_STACK_KEYS.reduce((acc, key, index) => {
  const family =
    TREATMENT_COLOR_FAMILIES[index % TREATMENT_COLOR_FAMILIES.length];
  const shadeOffset =
    Math.floor(index / TREATMENT_COLOR_FAMILIES.length) % 3;

  acc[key] = { family, shadeOffset };
  return acc;
}, {});

let dynamicColorIndex = KNOWN_STACK_KEYS.length;

const STACK_COLORS = new Proxy(STACK_COLOR_FAMILIES_BASE, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }

    if (typeof prop !== "string") {
      return undefined;
    }

    const family =
      TREATMENT_COLOR_FAMILIES[dynamicColorIndex % TREATMENT_COLOR_FAMILIES.length];
    const shadeOffset =
      Math.floor(dynamicColorIndex / TREATMENT_COLOR_FAMILIES.length) % 3;
    dynamicColorIndex += 1;

    const entry = { family, shadeOffset };
    target[prop] = entry;
    return entry;
  },
});

const ALL_KEYS = Object.keys(STACK_COLORS);
const TREATMENT_GRAPH_MAP = {
  Backbone: ["treatment_strategies_backbone", "efficacyvssafety_backbone"],
  Modality: ["treatment_strategies_modality", "efficacyvssafety_modality"],
  MoA: ["treatment_strategies_moa", "efficacyvssafety_moa"],
};

const getTreatmentFamilyEntry = (key) =>
  STACK_COLORS[key] || { family: TREATMENT_COLOR_FAMILIES[0], shadeOffset: 0 };

const pickTreatmentShade = (key, bucket) => {
  const entry = getTreatmentFamilyEntry(key);
  const family = entry.family || TREATMENT_COLOR_FAMILIES[0];
  const offset = entry.shadeOffset || 0;

  // Always keep "large values" on the darkest shade from the provided family.
  if (bucket >= 2) return family[2];

  // For low/medium values, alternate between the two lighter shades when colors repeat.
  const useLightFirst = offset % 2 === 0;
  if (bucket === 0) return useLightFirst ? family[0] : family[1];
  return useLightFirst ? family[1] : family[0];
};

const getTreatmentStrategyPointKey = (point = {}, tab = "Backbone") => {
  if (tab === "Backbone") {
    return (
      point.backbone || point.category || point.sub_category || point.modality || point.regimen
    );
  }

  if (tab === "Modality") {
    return (
      point.modality || point.category || point.backbone || point.sub_category || point.regimen
    );
  }

  return (
    // For MoA, we want the main series to be the MoA "category" (e.g. Agonist/Inhibitor),
    // and the right panel to show the sub-categories within that category.
    point.category || point.sub_category || point.modality || point.regimen || point.backbone
  );
};

const getTreatmentStrategyPointers = (chart = {}) => {
  const pointersRaw = chart?.pointer ?? chart?.points ?? [];
  return (Array.isArray(pointersRaw)
    ? pointersRaw
    : Object.values(pointersRaw || {})
  ).flatMap((value) => (Array.isArray(value) ? value : [value]));
};

const getEfficacySafetyPointers = (apiData = {}) => {
  const candidates = [
    apiData?.chart?.points,
    apiData?.chart?.pointer,
    apiData?.points,
    apiData?.pointer,
    apiData?.payload?.chart?.points,
    apiData?.payload?.chart?.pointer,
  ];

  const raw = candidates.find((item) => {
    if (Array.isArray(item)) return item.length > 0;
    return item && typeof item === "object" && Object.keys(item).length > 0;
  });

  if (!raw) return [];

  return (Array.isArray(raw) ? raw : Object.values(raw || {}))
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((point) => point && typeof point === "object");
};

const getTreatmentStrategyPointYear = (point = {}) =>
  point.x_axis ??
  point.year ??
  point.x ??
  point.label ??
  point.start_year ??
  point.end_year;

const getTreatmentStrategyPointValue = (point = {}) => {
  const value =
    point.y_axis ??
    point.n ??
    point.count ??
    point.arms ??
    point.value ??
    point.total;

  return Number(value) || 0;
};

const getRegimenComplexityKey = (point = {}) => {
  const raw = point?.regimen_complexity;

  if (raw === null || raw === undefined || raw === "") return "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (trimmed === "4+") return "4+";
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed >= 4 ? "4+" : String(parsed);
    }
    return trimmed;
  }

  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return "";
    return raw >= 4 ? "4+" : String(raw);
  }

  return "";
};

const getChartSeriesKeys = (rows = []) => {
  const result = Array.from(
    new Set(
      (rows || []).flatMap((row) => {
        const keys = Object.keys(row || {}).filter((key) => key !== "year");
        return keys;
      }),
    ),
  );

  return result;
};

const createEmptyTopFilters = () => ({
  line_intent: [],
  phases: [],
  stage: [],
  locations: [],
  category: [],
  sub_category: [],
  modality: [],
  regimen_complexity: [],
  efficacyvssafety_x_axis: "",
  efficacyvssafety_y_axis: "",
});

const toFilterArray = (value) => (Array.isArray(value) ? value : []);

const normalizeMetricOptionList = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined && item !== "")
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "number") return String(item);
        return item?.label ?? item?.value ?? item?.name ?? item?.title ?? "";
      })
      .filter(Boolean);
  }

  // Some APIs return `{ option: count }` maps.
  if (value && typeof value === "object") {
    return Object.keys(value).filter(Boolean);
  }

  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
};

const normalizeSharedFilterPayload = (filters = {}) => {
  const scopedFilters =
    filters?.graph_filters || filters?.top_filters || filters || {};

  return {
    line_intent: toFilterArray(
      scopedFilters.line_intent || scopedFilters.line_of_therapy,
    ),
    phases: toFilterArray(scopedFilters.phases || scopedFilters.phase),
    stage: toFilterArray(scopedFilters.stage || scopedFilters.cancer_stage),
    locations: toFilterArray(
      scopedFilters.locations || scopedFilters.countries,
    ),
    category: toFilterArray(scopedFilters.category),
    sub_category: toFilterArray(scopedFilters.sub_category),
    modality: toFilterArray(scopedFilters.modality),
    regimen_complexity: toFilterArray(
      scopedFilters.regimen_complexity || scopedFilters.regimenComplexity,
    ),
    efficacyvssafety_x_axis: scopedFilters.efficacyvssafety_x_axis || "",
    efficacyvssafety_y_axis: scopedFilters.efficacyvssafety_y_axis || "",
  };
};

const getNextRegimenComplexitySelection = (
  previousSelection,
  key,
  complexityKeys,
) => {
  const previous =
    previousSelection instanceof Set ? previousSelection : new Set();

  if (key === "all") {
    return previous.size === complexityKeys.length
      ? new Set()
      : new Set(complexityKeys);
  }

  const nextSelection = new Set(previous);
  if (nextSelection.has(key)) {
    nextSelection.delete(key);
  } else {
    nextSelection.add(key);
  }

  return nextSelection;
};

const normalizeAnalyticsFilterOptions = (_apiFilters = {}, apiMetrics = {}) => {
  // Treatment tab top filters must come only from the API `metrics` object.
  const scopedMetrics = apiMetrics?.metrics || apiMetrics || {};

  return {
    stage: normalizeMetricOptionList(
      scopedMetrics.stage ||
      scopedMetrics.cancer_stage ||
      scopedMetrics.cancer_type,
    ),
    line_intent: normalizeMetricOptionList(
      scopedMetrics.line_intent ||
      scopedMetrics.line_of_therapy ||
      scopedMetrics.line_of_treatment,
    ),
    phases: normalizeMetricOptionList(
      scopedMetrics.phases || scopedMetrics.phase,
    ),
    locations: normalizeMetricOptionList(
      scopedMetrics.locations ||
      scopedMetrics.countries ||
      scopedMetrics.country,
    ),
  };
};

const normalizeComparableString = (value) => {
  if (value === null || value === undefined) return "";

  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
};

const normalizePhaseValue = (value) => {
  if (!value) return "";

  const normalized = String(value).trim().toLowerCase();

  // Convert Roman numerals to Arabic numerals for phase matching
  const phaseMap = {
    'phase i': 'phase 1',
    'phase ii': 'phase 2',
    'phase iii': 'phase 3',
    'phase iv': 'phase 4',
    'early phase i': 'early phase 1',
    'phase 1': 'phase 1',
    'phase 2': 'phase 2',
    'phase 3': 'phase 3',
    'phase 4': 'phase 4',
    'early phase 1': 'early phase 1'
  };

  // Return the normalized Arabic numeral version
  return phaseMap[normalized] || normalized;
};

const tryParseJsonArrayString = (text = "") => {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const normalizePointValueArray = (value) => {
  const normalizeSingle = (item) => {
    if (item === null || item === undefined || item === "") return [];

    if (Array.isArray(item)) {
      return item.flatMap(normalizeSingle);
    }

    const parsed = tryParseJsonArrayString(item);
    if (parsed) {
      return parsed.flatMap(normalizeSingle);
    }

    const text = String(item).trim();
    return text ? [text] : [];
  };

  return normalizeSingle(value).filter(Boolean);
};

const getComparableLocationValues = (values = []) =>
  values.flatMap((value) => {
    const normalized = String(value || "").trim();

    if (!normalized) return [];

    const stripped = normalized.split("(")[0].trim();
    return Array.from(
      new Set(
        [normalized, stripped]
          .filter(Boolean)
          .map((entry) => normalizeComparableString(entry)),
      ),
    );
  });

const getTreatmentPointFilterValues = (point = {}) => ({
  stage: normalizePointValueArray(
    point.stage || point.cancer_stage || point.cancerStage,
  ),
  line_intent: normalizePointValueArray(
    point.line_intent || point.line_of_therapy || point.lineOfTherapy,
  ),
  phases: normalizePointValueArray(point.phases || point.phase),
  locations: normalizePointValueArray(
    point.locations || point.countries || point.country,
  ),
});

const filterTreatmentPointsByTopFilters = (points = [], filters = {}) => {
  if (!Array.isArray(points) || !points.length) return [];

  const selectedStage = Array.isArray(filters.stage) ? filters.stage : [];
  const selectedLineIntent = Array.isArray(filters.line_intent)
    ? filters.line_intent
    : [];
  const selectedPhases = Array.isArray(filters.phases) ? filters.phases : [];
  const selectedLocations = Array.isArray(filters.locations)
    ? filters.locations
    : [];

  const shouldFilterStage = selectedStage.length > 0;
  const shouldFilterLine = selectedLineIntent.length > 0;
  const shouldFilterPhases = selectedPhases.length > 0;
  const shouldFilterLocations = selectedLocations.length > 0;

  if (
    !shouldFilterStage &&
    !shouldFilterLine &&
    !shouldFilterPhases &&
    !shouldFilterLocations
  ) {
    return points;
  }

  const canFilterStage =
    !shouldFilterStage ||
    points.some((point) => getTreatmentPointFilterValues(point).stage.length > 0);
  const canFilterLine =
    !shouldFilterLine ||
    points.some(
      (point) => getTreatmentPointFilterValues(point).line_intent.length > 0,
    );
  const canFilterPhases =
    !shouldFilterPhases ||
    points.some(
      (point) => getTreatmentPointFilterValues(point).phases.length > 0,
    );
  const canFilterLocations =
    !shouldFilterLocations ||
    points.some(
      (point) => getTreatmentPointFilterValues(point).locations.length > 0,
    );

  const normalizedSelectedStage = selectedStage.map(normalizeComparableString);
  const normalizedSelectedLine = selectedLineIntent.map(
    normalizeComparableString,
  );
  const normalizedSelectedPhases = selectedPhases.map(
    (phase) => normalizePhaseValue(normalizeComparableString(phase)),
  );
  const normalizedSelectedLocations = getComparableLocationValues(
    selectedLocations,
  );

  const filteredPoints = points.filter((point) => {
    const pointValues = getTreatmentPointFilterValues(point);
    const normalizedStageValues = pointValues.stage.map(normalizeComparableString);
    const normalizedLineValues = pointValues.line_intent.map(
      normalizeComparableString,
    );
    const normalizedPhaseValues = pointValues.phases.map(
      (phase) => normalizePhaseValue(normalizeComparableString(phase)),
    );
    const normalizedLocationValues = getComparableLocationValues(
      pointValues.locations,
    );

    if (shouldFilterStage && canFilterStage) {
      const matchesStage = normalizedSelectedStage.some((value) =>
        normalizedStageValues.includes(value),
      );

      if (!matchesStage) return false;
    }

    if (shouldFilterLine && canFilterLine) {
      const matchesLine = normalizedSelectedLine.some((value) =>
        normalizedLineValues.includes(value),
      );

      if (!matchesLine) return false;
    }

    if (shouldFilterPhases && canFilterPhases) {
      const matchesPhase = normalizedSelectedPhases.some((value) =>
        normalizedPhaseValues.includes(value),
      );

      if (!matchesPhase) return false;
    }

    if (shouldFilterLocations && canFilterLocations) {
      const matchesLocation = normalizedSelectedLocations.some((value) =>
        normalizedLocationValues.includes(value),
      );

      if (!matchesLocation) return false;
    }

    return true;
  });

  return filteredPoints;
};

const filterTreatmentStrategiesApi = (apiData, filters = {}) => {
  if (!apiData?.chart) return apiData;

  const pointerRaw = apiData.chart?.pointer;
  const pointsRaw = apiData.chart?.points;
  const resolvedKey =
    (Array.isArray(pointerRaw) ? "pointer" : null) ||
    (Array.isArray(pointsRaw) ? "points" : null) ||
    (pointerRaw && typeof pointerRaw === "object" ? "pointer" : null) ||
    (pointsRaw && typeof pointsRaw === "object" ? "points" : null) ||
    null;

  if (!resolvedKey) return apiData;

  const raw = apiData.chart?.[resolvedKey];
  const points = (Array.isArray(raw) ? raw : Object.values(raw || {})).flatMap(
    (value) => (Array.isArray(value) ? value : [value]),
  );
  const filteredPoints = filterTreatmentPointsByTopFilters(points, filters);

  if (filteredPoints === points) {
    return apiData;
  }

  return {
    ...apiData,
    summary: filteredPoints.length === 0 ? 0 : apiData.summary || 0,
    chart: {
      ...apiData.chart,
      [resolvedKey]: filteredPoints,
    },
  };
};

const filterTreatmentEfficacyApi = (apiData, filters = {}) => {
  if (!apiData?.chart) return apiData;

  const pointerRaw = apiData.chart?.pointer;
  const pointsRaw = apiData.chart?.points;

  const resolvedKey =
    (Array.isArray(pointerRaw) ? "pointer" : null) ||
    (Array.isArray(pointsRaw) ? "points" : null) ||
    (pointerRaw && typeof pointerRaw === "object" ? "pointer" : null) ||
    (pointsRaw && typeof pointsRaw === "object" ? "points" : null) ||
    null;

  if (!resolvedKey) return apiData;

  const raw = apiData.chart?.[resolvedKey];
  const points = (Array.isArray(raw) ? raw : Object.values(raw || {})).flatMap(
    (value) => (Array.isArray(value) ? value : [value]),
  );
  if (!points.length) return apiData;

  const baseFilteredPoints = filterTreatmentPointsByTopFilters(points, filters);
  const selectedXAxis = String(filters?.efficacyvssafety_x_axis || "").trim();
  const selectedYAxis = String(filters?.efficacyvssafety_y_axis || "").trim();

  const parseLocalNumeric = (value) => {
    if (value === null || value === undefined || value === "") return NaN;
    if (typeof value === "number") return value;
    const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  };

  const normalizeMetric = (value = "") =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const metricMatches = (metric = "", selection = "") => {
    if (!selection) return true;
    if (!metric) return false;
    if (metric === selection) return true;

    const metricValue = normalizeMetric(metric);
    const selectionValue = normalizeMetric(selection);
    if (metricValue === selectionValue) return true;

    const tokens = metricValue.split(" ").filter(Boolean);
    const selectedTokens = selectionValue.split(" ").filter(Boolean);
    if (selectedTokens.some((token) => tokens.includes(token))) return true;

    const isSaeSelection =
      selectionValue === "sae" ||
      selectionValue === "saes" ||
      selectionValue.includes("serious adverse") ||
      selectionValue.includes("sae rate");
    if (isSaeSelection && (metricValue === "serious" || metricValue.includes("sae"))) {
      return true;
    }

    return false;
  };

  const axisFilteredPoints =
    selectedXAxis || selectedYAxis
      ? baseFilteredPoints.filter((point) => {
          if (selectedXAxis) {
            const pointSafetyMetric =
              point?.safety_endpoint || point?.ae_category || point?.x_axis_label || "";
            const hasSelectedSafetyValue = Number.isFinite(
              parseLocalNumeric(point?.[selectedXAxis]),
            );
            const hasAxisSafetyValue = Number.isFinite(
              parseLocalNumeric(point?.["x-axis"] ?? point?.x_axis),
            );

            if (
              pointSafetyMetric &&
              !metricMatches(pointSafetyMetric, selectedXAxis)
            ) {
              return false;
            }

            if (!pointSafetyMetric && !hasSelectedSafetyValue && !hasAxisSafetyValue) {
              return false;
            }
          }

          if (selectedYAxis) {
            const pointEfficacyMetric =
              point?.efficacy_endpoint || point?.endpoint || point?.y_axis_label || "";
            const hasSelectedEfficacyValue = Number.isFinite(
              parseLocalNumeric(point?.[selectedYAxis]),
            );
            const hasAxisEfficacyValue = Number.isFinite(
              parseLocalNumeric(point?.["y-axis"] ?? point?.y_axis),
            );

            if (
              pointEfficacyMetric &&
              !metricMatches(pointEfficacyMetric, selectedYAxis)
            ) {
              return false;
            }

            if (!pointEfficacyMetric && !hasSelectedEfficacyValue && !hasAxisEfficacyValue) {
              return false;
            }
          }

          return true;
        })
      : baseFilteredPoints;

  const filteredPoints = axisFilteredPoints;

  if (filteredPoints === points) {
    return apiData;
  }

  return {
    ...apiData,
    summary: filteredPoints.length === 0 ? 0 : apiData.summary || 0,
    chart: {
      ...apiData.chart,
      [resolvedKey]: filteredPoints,
    },
  };
};

const withSelectedOption = (options = [], selectedValue = "") => {
  if (!selectedValue) {
    return options;
  }

  const normalizedOptions = Array.isArray(options) ? options : [];
  if (normalizedOptions.length === 0) {
    return normalizedOptions;
  }
  const hasSelectedValue = normalizedOptions.some((option) => {
    if (typeof option === "string") {
      return option === selectedValue;
    }

    return option?.value === selectedValue || option?.label === selectedValue;
  });

  return hasSelectedValue
    ? normalizedOptions
    : [selectedValue, ...normalizedOptions];
};

const normalizeSelectionFilter = (selectedValues = []) =>
  selectedValues.filter(Boolean);

const normalizeSharedFilterEntry = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeSharedFiltersForCompare = (filters = {}) =>
  Object.keys(createEmptyTopFilters()).reduce((normalizedFilters, key) => {
    const rawValue = filters[key];
    const values = Array.isArray(rawValue)
      ? rawValue
      : rawValue !== null && rawValue !== undefined && rawValue !== ""
        ? [rawValue]
        : [];

    normalizedFilters[key] = values
      .map(normalizeSharedFilterEntry)
      .filter((value) => value !== null && value !== undefined && value !== "")
      .sort((left, right) => String(left).localeCompare(String(right)));

    return normalizedFilters;
  }, createEmptyTopFilters());

const hasTreatmentSharedFilters = (filters = {}) =>
  hasAnalyticsSharedFilters(filters) ||
  Boolean(filters?.efficacyvssafety_x_axis || filters?.efficacyvssafety_y_axis);

const areSharedFiltersEquivalent = (leftFilters = {}, rightFilters = {}) =>
  JSON.stringify(normalizeSharedFiltersForCompare(leftFilters)) ===
  JSON.stringify(normalizeSharedFiltersForCompare(rightFilters));

const createTreatmentFetchKey = (
  tab = "Backbone",
  filters = {},
  sessionKey = "",
) =>
  JSON.stringify({
    tab,
    sessionKey: sessionKey || "",
    filters: normalizeSharedFiltersForCompare(filters),
  });

const createTreatmentFetchFingerprint = (tab = "Backbone", filters = {}, sessionKey = "") =>
  JSON.stringify({
    tab,
    sessionKey: sessionKey || "",
    filters: normalizeSharedFiltersForCompare(filters),
  });

let lastRecentTreatmentFetch = {
  fingerprint: "",
  timestamp: 0,
};

const RECENT_TREATMENT_FETCH_WINDOW_MS = 2500;

const wasRecentlyFetchedTreatmentFingerprint = (fingerprint = "") =>
  lastRecentTreatmentFetch.fingerprint === fingerprint &&
  Date.now() - lastRecentTreatmentFetch.timestamp <
  RECENT_TREATMENT_FETCH_WINDOW_MS;

const markRecentTreatmentFetchFingerprint = (fingerprint = "") => {
  lastRecentTreatmentFetch = {
    fingerprint,
    timestamp: Date.now(),
  };
};

const formatFilterLabel = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";

  return text
    .split(/\s+/)
    .map((token) => {
      const raw = token.trim();
      if (!raw) return raw;
      if (raw === "+" || raw === "-" || raw === "/" || raw === "&") return raw;

      const lower = raw.toLowerCase();
      if (lower === "adc") return "ADC";
      if (lower === "io") return "IO";
      if (lower === "tki") return "TKI";

      if (raw.length > 1 && raw === raw.toUpperCase()) return raw;
      if (/^\d/.test(raw)) return raw;

      return raw.charAt(0).toUpperCase() + raw.slice(1);
    })
    .join(" ");
};

const parseNumericValue = (value) => {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;

  const text = String(value).trim();
  if (!text) return NaN;

  // Handle common formats: "47.8", "47.8%", "1,234.5", " (47.8) "
  const normalized = text.replace(/,/g, "");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};

const normalizePercentLike = (value, metricLabel = "") => {
  const num = Number(value);
  if (!Number.isFinite(num)) return num;

  const label = String(metricLabel || "").toLowerCase();
  const looksPercent = label.includes("orr") || label.includes("rate") || label.includes("dcr") || label.includes("pcr") || label.includes("pr") || label.includes("cr");

  if (!looksPercent) return num;

  // If backend returns fraction (0-1), convert to percent.
  if (num > 0 && num <= 1) return num * 100;

  // If backend already returns percent (0-100), keep it.
  if (num >= 0 && num <= 100) return num;

  // Some backends return percent-like values scaled as basis points (x100),
  // per-mille (x1000), or per-myriads (x10000). Prefer the smallest scale
  // factor that yields a plausible percentage.
  if (num > 100) {
    const scaleFactors = [100, 1000, 10000];
    for (const factor of scaleFactors) {
      const scaled = num / factor;
      if (scaled >= 0 && scaled <= 100) return scaled;
    }

    // Fallback: avoid flattening the chart by capping extreme values.
    return 100;
  }

  return num;
};

const getMetricTokens = (label = "") =>
  String(label || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

const normalizeMetricToken = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getMetricAliases = (label = "") => {
  const normalized = normalizeMetricToken(label);
  const aliases = new Set([normalized]);

  if (
    normalized === "sae" ||
    normalized === "saes" ||
    normalized.includes("serious adverse") ||
    normalized.includes("sae rate")
  ) {
    aliases.add("sae");
    aliases.add("saes");
    aliases.add("sae rate");
    aliases.add("serious");
    aliases.add("serious adverse events");
  }

  if (normalized === "serious") {
    aliases.add("sae");
    aliases.add("saes");
    aliases.add("sae rate");
    aliases.add("serious adverse events");
  }

  return aliases;
};

const metricMatchesSelection = (metric = "", selection = "") => {
  if (!selection) return true;
  if (!metric) return false;

  if (metric === selection) return true;

  const metricTokens = getMetricTokens(metric);
  const selectionTokens = getMetricTokens(selection);

  if (!metricTokens.length || !selectionTokens.length) return false;

  const metricSet = new Set(metricTokens.map((t) => t.toLowerCase()));
  const tokenMatch = selectionTokens.some((token) => metricSet.has(token.toLowerCase()));
  if (tokenMatch) return true;

  const metricAliases = getMetricAliases(metric);
  const selectionAliases = getMetricAliases(selection);
  return Array.from(selectionAliases).some((alias) => metricAliases.has(alias));
};

const resolveAxisSelection = (selection = "", axisLabels = []) => {
  const selected = String(selection || "").trim();
  if (!selected) return "";

  const labels = Array.isArray(axisLabels) ? axisLabels : [];
  if (!labels.length) return selected;

  const direct = labels.find((label) => String(label) === selected);
  if (direct) return direct;

  const tokenMatch = labels.find((label) => metricMatchesSelection(label, selected));
  return tokenMatch || selected;
};

const resolvePointMetricLabel = (point = {}, selection = "", axisLabels = []) => {
  const labels = Array.isArray(axisLabels) ? axisLabels : [];
  const selected = resolveAxisSelection(selection, labels);

  const candidates = [
    selected,
    ...labels.filter((label) => metricMatchesSelection(label, selected)),
    ...labels,
  ].filter(Boolean);

  const seen = new Set();
  return (
    candidates.find((label) => {
      if (seen.has(label)) return false;
      seen.add(label);
      return Number.isFinite(parseNumericValue(point?.[label]));
    }) ||
    selected ||
    ""
  );
};

const downsampleEvenly = (items = [], limit = 3000) => {
  const list = Array.isArray(items) ? items : [];
  if (limit <= 0) return [];
  if (list.length <= limit) return list;

  const step = list.length / limit;
  const sampled = [];

  for (let i = 0; i < limit; i += 1) {
    const index = Math.min(list.length - 1, Math.floor(i * step));
    sampled.push(list[index]);
  }

  return sampled;
};

const downsampleStratifiedByX = (items = [], limit = 3000) => {
  const list = Array.isArray(items) ? items : [];
  if (limit <= 0) return [];
  if (list.length <= limit) return list;

  // Stratify by x-axis value so the scatter doesn't collapse into a few vertical stripes
  // when the backend returns pointer data grouped/sorted by x.
  const buckets = new Map();
  list.forEach((item) => {
    const x = parseNumericValue(item?.["x-axis"] ?? item?.x_axis ?? item?.SAE ?? item?.sae);
    const key = Number.isFinite(x) ? String(Math.round(x * 100) / 100) : "__nan__";
    const arr = buckets.get(key);
    if (arr) arr.push(item);
    else buckets.set(key, [item]);
  });

  const bucketEntries = Array.from(buckets.values()).filter((b) => b.length);
  if (!bucketEntries.length) return downsampleEvenly(list, limit);

  const perBucket = Math.max(1, Math.floor(limit / bucketEntries.length));
  const sampled = [];
  bucketEntries.forEach((bucket) => {
    sampled.push(...downsampleEvenly(bucket, perBucket));
  });

  return sampled.length > limit ? downsampleEvenly(sampled, limit) : sampled;
};

// Pre-sample efficacy API data at the point of ingestion so all downstream filter/processing
// operations never see the full 200k+ raw dataset. Downsampling here is safe because the
// final render limit is much smaller anyway (see efficacyChartData).
const PRE_SAMPLE_LIMIT = 5000;

const presampleEfficacyApiData = (apiData) => {
  if (!apiData?.chart && !apiData?.points && !apiData?.pointer) return apiData;

  const pointerRaw = apiData?.chart?.pointer;
  const pointsRaw = apiData?.chart?.points;
  const resolvedKey =
    (Array.isArray(pointerRaw) ? "pointer" : null) ||
    (Array.isArray(pointsRaw) ? "points" : null) ||
    (pointerRaw && typeof pointerRaw === "object" ? "pointer" : null) ||
    (pointsRaw && typeof pointsRaw === "object" ? "points" : null) ||
    null;

  if (!resolvedKey) {
    const topLevelKey =
      (Array.isArray(apiData.pointer) ? "pointer" : null) ||
      (Array.isArray(apiData.points) ? "points" : null) ||
      (apiData.pointer && typeof apiData.pointer === "object" ? "pointer" : null) ||
      (apiData.points && typeof apiData.points === "object" ? "points" : null) ||
      null;

    if (!topLevelKey) return apiData;

    const raw = apiData?.[topLevelKey];
    const points = (Array.isArray(raw) ? raw : Object.values(raw || {})).flatMap(
      (value) => (Array.isArray(value) ? value : [value]),
    );

    if (points.length <= PRE_SAMPLE_LIMIT) return apiData;

    return {
      ...apiData,
      [topLevelKey]: downsampleStratifiedByX(points, PRE_SAMPLE_LIMIT),
    };
  }

  const raw = apiData.chart?.[resolvedKey];
  const points = (Array.isArray(raw) ? raw : Object.values(raw || {})).flatMap(
    (value) => (Array.isArray(value) ? value : [value]),
  );

  if (points.length <= PRE_SAMPLE_LIMIT) return apiData;

  return {
    ...apiData,
    chart: {
      ...apiData.chart,
      [resolvedKey]: downsampleStratifiedByX(points, PRE_SAMPLE_LIMIT),
    },
  };
};

// NOTE: overlap detection is handled by value-based keys (see hover handler).

/*  Custom Shapes  */
const SHAPE_MAP = {
  circle: ({ cx, cy, fill, size }) => {
    const r = Math.sqrt(size / Math.PI);
    return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#F0F0F3" />;
  },
};

/*  Tooltip  */
const CustomTooltip = ({
  active,
  payload,
  similarItems = [],
  similarLabel = "Similar regimens",
}) => {
  const [similarIndex, setSimilarIndex] = useState(0);

  // Reset to first item whenever the overlap group changes (new bubble hovered)
  const itemsKey = similarItems.map((i) => i?._uid ?? "").join(",");
  useEffect(() => { setSimilarIndex(0); }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !payload?.length) return null;

  const rawD = payload?.[0]?.payload;
  if (!rawD) return null;

  const showSimilar = Array.isArray(similarItems) && similarItems.length > 1;
  const safeIndex = Math.min(Math.max(0, similarIndex), (similarItems?.length || 1) - 1);
  const canPrev = showSimilar && safeIndex > 0;
  const canNext = showSimilar && safeIndex < similarItems.length - 1;

  const onPrev = () => setSimilarIndex((i) => Math.max(0, i - 1));
  const onNext = () => setSimilarIndex((i) => Math.min(similarItems.length - 1, i + 1));

  // When multiple bubbles overlap, show the navigated item's data
  const d = showSimilar && similarItems[safeIndex] ? similarItems[safeIndex] : rawD;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 8,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 16px 10px 16px",
        minWidth: 260,
        width: 320,
        maxWidth: 320,
        boxSizing: "border-box",
        fontFamily: "Rubik",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "rgba(0, 0, 0, 1)",
          marginBottom: 10,
          fontFamily: "Rubik",
        }}
	      >
	        {d.regimen || d.treatment_name || d.backbone || "—"}
	      </div>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px minmax(0, 1fr)",
          columnGap: 12,
          rowGap: 10,
          fontSize: 14,
          fontFamily: "Rubik",
          alignItems: "start",
        }}
      >
	        <span style={{ color: "rgba(0,0,0,0.6)" }}>N</span>
        <span
          style={{
            color: "rgba(0,0,0,0.6)",
            justifySelf: "end",
            textAlign: "right",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {d.n?.toLocaleString() ?? "—"}
        </span>

        <span style={{ color: "rgba(0,0,0,0.6)" }}>{d.efficacyMetric ? `${d.efficacyMetric} (Efficacy)` : "ORR (Efficacy)"}</span>
        <span
          style={{
            color: "rgba(0,0,0,0.6)",
            justifySelf: "end",
            textAlign: "right",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {d.orr ?? "—"}%
        </span>

        <span style={{ color: "rgba(0,0,0,0.6)" }}>{d.safetyMetric ? `${d.safetyMetric} (Safety)` : "SAE (Safety)"}</span>
        <span
          style={{
            color: "rgba(0,0,0,0.6)",
            justifySelf: "end",
            textAlign: "right",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {d.sae ?? "—"}
        </span>

        <span
          style={{
            color: "rgba(0,0,0,0.6)",
            lineHeight: "18px",
            alignSelf: "start",
          }}
        >
          Mode Of Administration
        </span>
        <span
          style={{
            color: "rgba(0,0,0,0.6)",
            justifySelf: "stretch",
            textAlign: "right",
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            lineHeight: "18px",
            alignSelf: "start",
          }}
        >
          {Array.isArray(d.mode_of_administration)
            ? d.mode_of_administration.join(", ") || "—"
            : typeof d.mode_of_administration === "object"
            ? Object.values(d.mode_of_administration || {}).join(", ") || "—"
            : d.mode_of_administration ?? "—"}
        </span>
	      </div>

	      {showSimilar ? (
	        <div
	          style={{
	            display: "flex",
	            alignItems: "center",
	            justifyContent: "space-between",
	            fontSize: 14,
	            color: "rgba(0,0,0,0.6)",
	            borderTop: "1px solid rgba(0,0,0,0.08)",
	            marginTop: 12,
	            paddingTop: 10,
	          }}
	        >
	          <span>{similarLabel}</span>

	          <div
	            style={{
	              display: "flex",
	              alignItems: "center",
	              gap: 10,
	              fontWeight: 500,
	            }}
	          >
	            <span style={{ color: "rgba(0,0,0,0.6)" }}>
	              {safeIndex + 1}/{similarItems.length}
	            </span>

            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous"
              disabled={!canPrev}
              style={{
                border: "none",
                background: "transparent",
                cursor: canPrev ? "pointer" : "default",
                padding: 2,
                color: canPrev ? "#2563EB" : "#9CA3AF",
                fontSize: 18,
                lineHeight: "18px",
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next"
              disabled={!canNext}
              style={{
                border: "none",
                background: "transparent",
                cursor: canNext ? "pointer" : "default",
                padding: 2,
                color: canNext ? "#2563EB" : "#9CA3AF",
                fontSize: 18,
                lineHeight: "18px",
              }}
            >
              ›
            </button>
	          </div>
	        </div>
	      ) : null}

	      {/* Bottom divider */}
	      {/* <div
	        style={{
	          height: 1,
          background: "rgba(0,0,0,0.08)",
          margin: "14px -16px 8px -16px",
        }}
      /> */}

      {/* Footer strip */}
      {/* <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
          color: "rgba(0,0,0,0.6)",
        }}
      >
        <span>Similar regimens</span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 500,
          }}
        >
          <span style={{ color: "rgba(0,0,0,0.6)" }}>1/7</span>

          <span style={{ color: "#9CA3AF", fontSize: 18 }}>‹</span>
          <span style={{ color: "#2563EB", fontSize: 18 }}>›</span>
        </div>
      </div>*/}
    </div>
  );
};

const getSimilarLabel = (tab = "Backbone") => {
  const name = String(tab || "").toLowerCase();
  if (name === "modality") return "Similar modalities";
  if (name === "moa") return "Similar MOAs";
  return "Similar regimens";
};

const buildOverlapKey = (point = {}, xDomain, yDomain) => {
  const x = Number(point?.sae);
  const y = Number(point?.orr);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "";

  // Value-binning overlap: "exact" overlaps are rare when values are large.
  // Bin by domain span so visually close points group together reliably.
  const [xMin, xMax] = Array.isArray(xDomain) ? xDomain : [0, 0];
  const [yMin, yMax] = Array.isArray(yDomain) ? yDomain : [0, 0];

  const xSpan = Number.isFinite(xMax - xMin) ? xMax - xMin : 0;
  const ySpan = Number.isFinite(yMax - yMin) ? yMax - yMin : 0;

  // ~300 buckets across each axis is a good balance for tooltip overlap grouping.
  const xBin = xSpan > 0 ? xSpan / 300 : 0;
  const yBin = ySpan > 0 ? ySpan / 300 : 0;

  const bx = xBin > 0 ? Math.floor((x - xMin) / xBin) : Math.round(x * 100) / 100;
  const by = yBin > 0 ? Math.floor((y - yMin) / yBin) : Math.round(y * 100) / 100;

  return `${bx}|${by}`;
};

const dedupeOverlapItems = (items = []) => {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const result = [];

  list.forEach((item) => {
    if (!item) return;
    const key = item._uid || item.treatment_id || item.nct_id || item.id || "";
    if (!key) {
      result.push(item);
      return;
    }
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
};


const CustomTooltipBar = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];

  const backbone = data.name;
  const value = data.value;
  const year = data.payload?.year;
  const color = data.fill;

  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 5%, white)`,
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Rubik",
      }}
    >
      <div
        style={{
          fontWeight: 500,
          fontFamily: "Rubik",
          color: "rgba(0, 0, 0, 1)",
          fontSize: "14px",
        }}
      >
        {formatFilterLabel(backbone) || "--"}
      </div>

      <div
        style={{
          color: "rgba(0,0,0,0.6)",
          fontFamily: "Rubik",
          fontSize: "14px",
        }}
      >
        {year}: {value ?? "--"}
      </div>
    </div>
  );
};

const EmptyGraphState = ({
  title,
  description,
  actionLabel,
  onAction,
  isBlocking = true,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.92)",
      zIndex: 3,
      padding: 24,
      textAlign: "center",
      pointerEvents: isBlocking ? "auto" : "none",
    }}
  >
    <div style={{ maxWidth: 360 }}>
      <div
        style={{
          fontFamily: "Rubik",
          fontSize: 18,
          fontWeight: 500,
          color: "rgba(0,0,0,0.8)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "Rubik",
          fontSize: 14,
          lineHeight: "20px",
          color: "rgba(0,0,0,0.6)",
          marginBottom: onAction ? 16 : 0,
        }}
      >
        {description}
      </div>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          style={{
            border: "1px solid rgba(38, 102, 190, 0.24)",
            background: "#F3F6FB",
            color: "rgba(38, 102, 190, 1)",
            borderRadius: 6,
            padding: "8px 12px",
            fontFamily: "Rubik",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </div>
);

// Isolated tooltip overlay — has its own state so parent never re-renders on hover
function EfficacyTooltipOverlay({ dataRef, positionRef, triggerRef, timeoutRef, activeTab }) {
  const [, forceUpdate] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    triggerRef.current = forceUpdate;
    return () => { triggerRef.current = null; };
  }, [triggerRef]);

  const data = dataRef.current;
  const pos = positionRef.current;

  if (!data.active || !pos) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: 100,
        pointerEvents: "auto",
      }}
      onMouseEnter={() => clearTimeout(timeoutRef.current)}
      onMouseLeave={() => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          dataRef.current = { active: false, items: [] };
          positionRef.current = null;
          triggerRef.current?.();
        }, 200);
      }}
    >
      <CustomTooltip
        active={true}
        payload={data.items?.[0] ? [{ payload: data.items[0] }] : []}
        similarItems={data.items}
        similarLabel={getSimilarLabel(activeTab)}
      />
    </div>
  );
}

export default function TreatmentTab({ sessionKey, onSessionKeyChange, activeSubTab, session_keys }) {
  const DEBUG_EFFICACY_GRAPH =
    Boolean(import.meta?.env?.DEV) || Boolean(window?.__DEBUG_EFFICACY__);
  const VIEWPORT_HEIGHT = 389;
  const FILTER_HEIGHT = 0;
  const TRACK_PAD = 0;
  const TRACK_PAD_BOTTOM = 0;
  const TRACK_HEIGHT =
    VIEWPORT_HEIGHT - FILTER_HEIGHT - TRACK_PAD - TRACK_PAD_BOTTOM;
  const contentHeight = 0 + ALL_KEYS.length * 44;
  const [scrollTop, setScrollTop] = useState(0);
  const [country, setCountry] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [rawAnalytics, setRawAnalytics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [, setHoveredRow] = useState(null);
  const [selectedBackbone, setSelectedBackbone] = useState("IO");
  const rafLeft = useRef(null);
  const rafRight = useRef(null);
  const [efficacySafetyAPI, setEfficacySafetyAPI] = useState(null);
  const [treatmentStrategiesAPI, setTreatmentStrategiesAPI] = useState(null);
  const [rawEfficacySafetyAPI, setRawEfficacySafetyAPI] = useState(null);
  const [rawTreatmentStrategiesAPI, setRawTreatmentStrategiesAPI] =
    useState(null);
  const timeoutRef = useRef(null);
  const [openShareModal, setOpenShareModal] = useState(false);

  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const { setShareAction, clearShareAction } = useShareAction();
  const [copied, setCopied] = useState(false);

  // const [filters, setFilters] = useState({
  //   // country: "",
  //   // // backbone: "",
  //   // phase: "",
  //   cancerStage: "",
  //   // // orr: "",.chart
  //   // // sae: "",
  //   // lineOfTherapy: "",
  //   // cancer_stage: [],
  //   line_intent: [],
  //   phase: [],
  //   countries: [],
  // });

  // const [rootFilters1, setRootFilters1] = useState({
  //   stage: [],
  //   line_intent: [],
  //   phase: [],
  //   countries: [],
  // });

  // console.log(rootFilters1, "rootFilters1rootFilters1");

  const [loading, setLoading] = useState({
    line_intent: false,
    phases: false,
    stage: false,
    locations: false,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  // const initialSessionKey = sessionKey || getSessionKeyFromSearchParams(searchParams);
  const initialSessionKey = searchParams.get("share_id");
  const [currentSessionKey, setCurrentSessionKey] = useState(
    () => initialSessionKey,
  );
  const currentSessionKeyRef = useRef(initialSessionKey);
  const preserveSharedSessionKeyRef = useRef(Boolean(initialSessionKey));
  const hasExplicitEmptyCategorySelectionRef = useRef(false);
  const skipNextFetchRequestKeyRef = useRef("");
  const inFlightFetchFingerprintRef = useRef("");
  const lastHandledFetchFingerprintRef = useRef("");
  const [selectedRegimens, setSelectedRegimens] = useState([]);
  const dispatch = useDispatch();
  const isAlertActive = useSelector((state) => state.trials.isAlertActive);
  const reduxActiveFilters = useSelector((state) => state.cards.activeFilters || {});
  const reduxSyncedFiltersRef = useRef({});
  const REGIMEN_COMPLEXITY_KEYS = useMemo(() => ["1", "2", "3", "4+"], []);
  // Keep checkbox UI snappy by decoupling it from the heavy chart/filter re-render path.
  const [uiRegimenComplexitySelection, setUiRegimenComplexitySelection] =
    useState(() => new Set());
  const [regimenComplexitySelection, setRegimenComplexitySelection] = useState(
    () => new Set(),
  );
  const pendingRegimenComplexitySharedUpdateRef = useRef(null);
  const regimenComplexitySharedUpdateTimerRef = useRef(null);
  const deferredRegimenComplexitySelection = useDeferredValue(
    regimenComplexitySelection,
  );
  // Ref so updates don't trigger full rerenders (debug/telemetry only).
  const lastRightPanelFilterChangedRef = useRef(null);
  const hasUserSetEfficacyAxisRef = useRef(false);
  const hasUserSetOrrAxisRef = useRef(false);
  const hasUserSetSaeAxisRef = useRef(false);
  const [filters, setFilters] = useState({
    stage: "",
    line_intent: "",
    phases: "",
    locations: "",
    orr: "",
    sae: "",
  });
  const deferredFilters = useDeferredValue(filters);
  const [view, setView] = useState("study");
  const [activeTab, setActiveTab] = useState("Backbone");

  const [topFilters, setTopFilters] = useState(() =>
    getAnalyticsSharedFiltersFromSearchParams(searchParams),
  );
  const [allowPayloadTopFilterFallback, setAllowPayloadTopFilterFallback] =
    useState(
      () =>
        !hasTreatmentSharedFilters(
          getAnalyticsSharedFiltersFromSearchParams(searchParams),
        ),
    );

  // const analyticsPayloadTopFilters = useMemo(
  //   () => normalizeSharedFilterPayload(analytics?.payload),
  //   [analytics],
  // );

  const analyticsPayloadTopFilters = useMemo(() => {
    const cleaned = normalizeSharedFilterPayload(analytics?.payload);

    return cleaned;
  }, [analytics]);

  // const effectiveTopFilters = useMemo(() => {
  //   if (hasTreatmentSharedFilters(topFilters)) {
  //     return topFilters;
  //   }

  //   if (
  //     allowPayloadTopFilterFallback &&
  //     hasTreatmentSharedFilters(analyticsPayloadTopFilters)
  //   ) {
  //     return analyticsPayloadTopFilters;
  //   }

  //   return topFilters;
  // }, [allowPayloadTopFilterFallback, analyticsPayloadTopFilters, topFilters]);

  const effectiveTopFilters = useMemo(() => {
    let filters;

    if (hasTreatmentSharedFilters(topFilters)) {
      filters = topFilters;
    } else if (
      allowPayloadTopFilterFallback &&
      hasTreatmentSharedFilters(analyticsPayloadTopFilters)
    ) {
      filters = analyticsPayloadTopFilters;
    } else {
      filters = topFilters;
    }

    const cleaned = { ...filters };

    return cleaned;
  }, [allowPayloadTopFilterFallback, analyticsPayloadTopFilters, topFilters]);

  const hasSharedFilters = useMemo(
    () => hasTreatmentSharedFilters(effectiveTopFilters),
    [effectiveTopFilters],
  );

  useEffect(() => {
    const sharedSelection = Array.isArray(effectiveTopFilters.regimen_complexity)
      ? effectiveTopFilters.regimen_complexity
      : [];

    if (!sharedSelection.length) {
      setUiRegimenComplexitySelection((prev) => (prev.size ? new Set() : prev));
      setRegimenComplexitySelection((prev) => (prev.size ? new Set() : prev));
      return;
    }

    const restored = sharedSelection
      .map((value) => String(value).trim())
      .filter(Boolean)
      .filter((value) => REGIMEN_COMPLEXITY_KEYS.includes(value));

    const nextSet = new Set(restored.length ? restored : []);
    setUiRegimenComplexitySelection(() => nextSet);
    setRegimenComplexitySelection(() => nextSet);
  }, [REGIMEN_COMPLEXITY_KEYS, effectiveTopFilters.regimen_complexity]);

  useEffect(() => {
    return () => {
      if (regimenComplexitySharedUpdateTimerRef.current) {
        clearTimeout(regimenComplexitySharedUpdateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextOrrFilter = effectiveTopFilters.efficacyvssafety_y_axis || "";
    const nextSaeFilter = effectiveTopFilters.efficacyvssafety_x_axis || "";

    setFilters((prevFilters) => {
      // IMPORTANT: Keep chart axis labels stable. Only the ORR/SAE dropdowns should
      // change `filters.orr` / `filters.sae` after the user interacts with them.
      if (hasUserSetEfficacyAxisRef.current) return prevFilters;

      const resolvedOrr = nextOrrFilter || prevFilters.orr || "";
      const resolvedSae = nextSaeFilter || prevFilters.sae || "";

      if (
        prevFilters.orr === resolvedOrr &&
        prevFilters.sae === resolvedSae
      ) {
        return prevFilters;
      }

      return {
        ...prevFilters,
        orr: resolvedOrr,
        sae: resolvedSae,
      };
    });
  }, [
    effectiveTopFilters.efficacyvssafety_x_axis,
    effectiveTopFilters.efficacyvssafety_y_axis,
  ]);

  // console.log(filters, "filtersfiltersfilters");

  // const [country, setCountry] = useState("");

  // The below function subCategoryMap is reponsible for briging the data for subctegoriess

  const subCategoryMap = useMemo(() => {
    const sourceMap = treatmentStrategiesAPI?.metrics?.sub_category_map || {};
    let map = Object.entries(sourceMap).reduce((acc, [key, values]) => {
      acc[key] = Array.isArray(values) ? [...values] : [];
      return acc;
    }, {});

    const addSubCategory = (categoryKey, subCategoryValue) => {
      if (!categoryKey || !subCategoryValue) return;

      if (!map[categoryKey]) {
        map[categoryKey] = [];
      }

      if (!map[categoryKey].includes(subCategoryValue)) {
        map[categoryKey].push(subCategoryValue);
      }
    };

    // Build/augment the map from raw chart points. This is required for MoA,
    // because the chart aggregation only keeps category totals.
    if (treatmentStrategiesAPI?.chart) {
      const pointers = getTreatmentStrategyPointers(treatmentStrategiesAPI.chart);

      pointers.forEach((point) => {
        const category =
          activeTab === "MoA"
            ? point.category ||
              point.moa_category ||
              point.modality ||
              point.backbone
            : point.category || point.modality || point.backbone;

        const subCategory =
          activeTab === "MoA"
            ? point.sub_category ||
              point.moa ||
              point.regimen ||
              point.treatment_name
            : point.sub_category || point.regimen || point.treatment_name;

        addSubCategory(category, subCategory);
      });
    }

    // If still no map, create a simple fallback based on common treatment categories
    if (Object.keys(map).length === 0) {
      map = {
        'io': ['io', 'immunotherapy'],
        'chemo': ['chemo', 'chemotherapy'],
        'targeted': ['targeted', 'targeted therapy'],
        'vaccine': ['vaccine'],
        'cell therapy': ['cell therapy'],
        'gene therapy': ['gene therapy'],
        'adc': ['adc'],
        'radiotherapy': ['radiotherapy'],
        'hormonal': ['hormonal'],
      };
    }

    return map;
  }, [activeTab, treatmentStrategiesAPI]);

  // Filter dropdown options must come from the API response only (`result.metrics` / `result.filters`).
  // Keep these empty until analytics data is successfully fetched.
  const [rootFilters1, setRootFilters1] = useState({
    stage: [],
    line_intent: [],
    phases: [],
    locations: [],
  });

  // const syncSessionKeyInUrl = useCallback(
  //   (nextSessionKey) => {
  //     setSearchParams(
  //       (prev) => {
  //         const nextParams = setSessionKeySearchParam(prev, nextSessionKey);

  //         [
  //           "line_intent",
  //           "phases",
  //           "stage",
  //           "locations",
  //           "category",
  //           "sub_category",
  //           "modality",
  //         ].forEach((key) => {
  //           nextParams.delete(key);
  //         });

  //         return nextParams;
  //       },
  //       { replace: true },
  //     );
  //   },
  //   [setSearchParams],
  // );

  const resetSessionContextForManualTopFilterChange = useCallback(() => {
    preserveSharedSessionKeyRef.current = false;
    skipNextFetchRequestKeyRef.current = "";
    inFlightFetchFingerprintRef.current = "";
    lastHandledFetchFingerprintRef.current = "";
    setAllowPayloadTopFilterFallback(false);
  }, []);

  const updateSharedFilters = useCallback(
    (nextFilters, options = {}) => {
      const { updateUrl = false } = options;

      setTopFilters((prevFilters) =>
        areSharedFiltersEquivalent(prevFilters, nextFilters)
          ? prevFilters
          : nextFilters,
      );

      if (!updateUrl) return;

      setSearchParams(
        (prev) => setSessionKeySearchParam(prev, currentSessionKeyRef.current),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const fetchFilterOptions = async (key) => {
    // Options now come from the analytics API response (`result.metrics` / `result.filters`).
    // Keep this as a no-op to preserve the existing `onOpen` hooks + loading prop.
    setLoading((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  useEffect(() => {
    if (!sessionKey) return;
    // No-op when the incoming key already matches — on initial share load the
    // prop equals the share_id we captured at mount, so this leaves the shared
    // session intact. When a sibling analytics tab applies a filter it publishes
    // a NEW session key; that differs, so we adopt it here to keep tabs in sync.
    if (sessionKey === currentSessionKeyRef.current) return;
    // Never let the default/live search session override a shared session.
    if (preserveSharedSessionKeyRef.current && isDefaultSearchSession(sessionKey)) return;

    // A propagated key means the shared snapshot no longer applies.
    preserveSharedSessionKeyRef.current = false;
    hasExplicitEmptyCategorySelectionRef.current = false;
    currentSessionKeyRef.current = sessionKey;
    setCurrentSessionKey((prevSessionKey) =>
      prevSessionKey === sessionKey ? prevSessionKey : sessionKey,
    );
  }, [sessionKey]);

  useEffect(() => {
    currentSessionKeyRef.current = currentSessionKey;
  }, [currentSessionKey]);

  useEffect(() => {
    const flat = reduxActiveFilters?.include ? (reduxActiveFilters.include || {}) : (reduxActiveFilters || {});

    const toArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((v) => (typeof v === "object" ? (v.label ?? v.value ?? v.name ?? String(v)) : String(v))).filter(Boolean);
      if (typeof val === "object") return [(val.label ?? val.value ?? val.name ?? "")].filter(Boolean);
      return [String(val)].filter(Boolean);
    };

    const mappedFilters = {
      line_intent: toArray(flat.line_of_therapy || flat.line_intent),
      phases: toArray(flat.phases || flat.phase),
      stage: toArray(flat.cancer_stage || flat.stage),
      locations: toArray(flat.locations || flat.countries),
    };

    const prevSynced = reduxSyncedFiltersRef.current;
    const hasAny = Object.values(mappedFilters).some((arr) => arr.length > 0);

    if (!hasAny) {
      const prevSyncedKeys = Object.keys(prevSynced).filter(
        (k) => Array.isArray(prevSynced[k]) && prevSynced[k].length > 0,
      );
      if (prevSyncedKeys.length === 0) return;
      reduxSyncedFiltersRef.current = {};
      setTopFilters((prev) => {
        const next = { ...prev };
        prevSyncedKeys.forEach((k) => { next[k] = []; });
        return next;
      });
      return;
    }

    reduxSyncedFiltersRef.current = mappedFilters;
    setTopFilters((prev) => ({ ...prev, ...mappedFilters }));
  }, [reduxActiveFilters]);

  useEffect(() => {
    // Once the user manually changes/clears a top filter,
    // resetSessionContextForManualTopFilterChange() sets this flag false.
    // In that case the applied top filters are the source of truth and we must
    // NOT restore them from the API payload echo — otherwise a cleared filter
    // (e.g. "2L") gets re-injected from the response and its chip reappears.
    if (!allowPayloadTopFilterFallback) {
      return;
    }

    const normalizedPayloadFilters = normalizeSharedFilterPayload(
      analytics?.payload,
    );
    const mergedPayloadFilters = {
      ...normalizedPayloadFilters,
      ...getSharedSessionFallbackFilters(topFilters, normalizedPayloadFilters),
    };

    if (!hasTreatmentSharedFilters(mergedPayloadFilters)) {
      return;
    }

    setAllowPayloadTopFilterFallback(true);
    setTopFilters((prevFilters) => {
      const cleanedFilters = { ...mergedPayloadFilters };

      if (areSharedFiltersEquivalent(prevFilters, cleanedFilters)) {
        return prevFilters;
      }

      skipNextFetchRequestKeyRef.current = createTreatmentFetchKey(
        activeTab,
        mergedPayloadFilters,
        currentSessionKeyRef.current,
      );

      //  const cleanedFilters = { ...mergedPayloadFilters };

      // ❌ REMOVE UI FILTERS

      return cleanedFilters;
    });
  }, [activeTab, analytics, topFilters, allowPayloadTopFilterFallback]);

  const rightCounts = analytics?.right_panel_counts ||
    treatmentData?.right_panel_counts || { B: 10, M: 8, R: 3 };

  const [rightFilters, setRightFilters] = useState({
    B: rightCounts.B,
    M: rightCounts.M,
    R: rightCounts.R,
  });

  const [activeKeys, setActiveKeys] = useState([]);

  // Debug activeKeys changes
  useEffect(() => {
    // activeKeys changed
  }, [activeKeys]);

  const normalizeFilterToken = useCallback((value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const subCategoryMapCaseInsensitive = useMemo(() => {
    const map = subCategoryMap || {};
    const index = {};

    Object.keys(map).forEach((key) => {
      if (!key) return;
      index[normalizeFilterToken(key)] = map[key];
    });

    return index;
  }, [normalizeFilterToken, subCategoryMap]);

  const subCategoryToCategoryKeys = useMemo(() => {
    const map = subCategoryMap || {};
    const inverse = {};

    Object.entries(map).forEach(([categoryKey, subValues]) => {
      if (!categoryKey || !Array.isArray(subValues)) return;

      const normalizedCategoryKey = normalizeFilterToken(categoryKey);

      // Map each subcategory value to its parent category.
      subValues.forEach((subValue) => {
        const normalizedSub = normalizeFilterToken(subValue);
        if (!normalizedSub) return;

        if (!inverse[normalizedSub]) inverse[normalizedSub] = new Set();
        inverse[normalizedSub].add(categoryKey);
      });

      // Also allow selecting the category itself as a "subcategory" token.
      if (normalizedCategoryKey) {
        if (!inverse[normalizedCategoryKey])
          inverse[normalizedCategoryKey] = new Set();
        inverse[normalizedCategoryKey].add(categoryKey);
      }
    });

    return inverse;
  }, [normalizeFilterToken, subCategoryMap]);

  const getRegimensForCategoryKey = useCallback(
    (categoryKey) => {
      if (!categoryKey) return [];

      const direct = subCategoryMap?.[categoryKey];
      if (Array.isArray(direct)) return direct;

      const normalizedKey = normalizeFilterToken(categoryKey);
      const caseInsensitive = subCategoryMapCaseInsensitive?.[normalizedKey];
      return Array.isArray(caseInsensitive) ? caseInsensitive : [];
    },
    [normalizeFilterToken, subCategoryMap, subCategoryMapCaseInsensitive],
  );
  const getRegimensForCategoryKeys = useCallback(
    (categoryKeys = []) => {
      const result = [
        ...new Set(
          categoryKeys.flatMap((key) => {
            return getRegimensForCategoryKey(key);
          }),
        ),
      ];

      return result;
    },
    [getRegimensForCategoryKey],
  );

  // const toggleKey = (key) => {
  //   setSelectedBackbone(key);

  //   resetSessionContextForManualTopFilterChange();
  //   const nextActiveKeys = activeKeys.includes(key)
  //     ? activeKeys.filter((activeKey) => activeKey !== key)
  //     : [...activeKeys, key];
  //   hasExplicitEmptyCategorySelectionRef.current = nextActiveKeys.length === 0;
  //   const availableRegimens = getRegimensForCategoryKeys(nextActiveKeys);
  //   const nextRegimens = selectedRegimens.filter((regimen) =>
  //     availableRegimens.includes(regimen),
  //   );
  //   const updatedFilters = {
  //     ...effectiveTopFilters,
  //     category: normalizeSelectionFilter(nextActiveKeys),
  //     sub_category: normalizeSelectionFilter(nextRegimens),
  //   };

  //   setActiveKeys(nextActiveKeys);
  //   setSelectedRegimens(nextRegimens);
  //   updateSharedFilters(updatedFilters);
  // };

  const toggleKey = (key) => {
    setSelectedBackbone(key);
    lastRightPanelFilterChangedRef.current = "category";

    const nextActiveKeys = activeKeys.includes(key)
      ? activeKeys.filter((activeKey) => activeKey !== key)
      : [...activeKeys, key];

    hasExplicitEmptyCategorySelectionRef.current = nextActiveKeys.length === 0;

    const availableRegimens = getRegimensForCategoryKeys(nextActiveKeys);

    const nextRegimens = selectedRegimens.filter((regimen) =>
      availableRegimens.includes(regimen),
    );

    setActiveKeys(nextActiveKeys);
    setSelectedRegimens(nextRegimens);
  };

  const regimens = useMemo(() => {
    if (!subCategoryMap) return [];

    if (!activeKeys.length) {
      return [];
    }

    const result = getRegimensForCategoryKeys(activeKeys);
    return result;
  }, [activeKeys, getRegimensForCategoryKeys, subCategoryMap]);

  const ioRegimens = useMemo(() => {
    return regimens.filter((r) => {
      const base = r?.toLowerCase().split("+")[0].trim();
      return base === "io"; // ✅ correct
    });
  }, [regimens]);

  const isAllSelected =
    regimens.length > 0 && regimens.every((r) => selectedRegimens.includes(r));

  // const toggleAll = () => {
  //   resetSessionContextForManualTopFilterChange();
  //   const nextRegimens = isAllSelected ? [] : regimens;
  //   const updatedFilters = {
  //     ...effectiveTopFilters,
  //     category: normalizeSelectionFilter(activeKeys),
  //     sub_category: normalizeSelectionFilter(nextRegimens),
  //   };

  //   setSelectedRegimens(nextRegimens);
  //   updateSharedFilters(updatedFilters);
  // };

  const toggleAll = () => {
    lastRightPanelFilterChangedRef.current = "subcategory";
    const nextRegimens = isAllSelected ? [] : regimens;
    resetSessionContextForManualTopFilterChange();
    setSelectedRegimens(nextRegimens);
    updateSharedFilters({
      ...effectiveTopFilters,
      category: normalizeSelectionFilter(activeKeys),
      sub_category: normalizeSelectionFilter(nextRegimens),
    });
  };
  //   useEffect(() => {
  //   setSelectedRegimens([]);
  // }, [activeKeys]);

  const normalizeAnalytics = (data) => {
    if (!data) return null;

    return {
      filters: data.filters,
      chart: data.chart,
      efficacyvssafety: data.efficacyvssafety,
      table: {
        columns: data.table?.columns || [],
        rows: data.table?.rows || [],
      },
      summary: data.summary || 0,
      totalStrategies: data.totalStrategies || 0,
      rowData: data.views,
    };
  };
  // const fetchAnalytics = useCallback(async () => {
  //   try {
  //     const response = await fetch(
  //       `https://oncosuite.com/analytics/treatment?session_key=gLNnxPYF-4q7F2cOWqIJgwmTrCJRQ2u0ukHl6dkBB9Q`,
  //       {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           accept: "application/json",
  //         },
  //       },
  //     );

  //     const data = await response.json();
  //     setAnalytics(normalizeAnalytics(data));
  //     console.log(data);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }, []);

  // const fetchAnalytics = useCallback(
  //   async (
  //     filters,
  //     treatment_key = ["treatment_strategies_backbone", "efficacyvssafety"],
  //   ) => {
  //     try {
  //       const payload = {
  //         filters: filters || {},
  //       };

  //       const [strategiesRes] = await Promise.all([
  //         fetch(
  //           "https://oncosuite.com/analytics/treatment" ||
  //             `${baseURL}/analytics/treatment`,
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //               Accept: "application/json",
  //             },
  //             body: JSON.stringify({
  //               ...payload,
  //               graph: treatment_key,
  //               table: [],
  //             }),
  //           },
  //         ),

  //         // fetch(
  //         //   "https://oncosuite.com/analytics/treatment" ||
  //         //     `${baseURL}/analytics/treatment`,
  //         //   {
  //         //     method: "POST",
  //         //     headers: {
  //         //       "Content-Type": "application/json",
  //         //       Accept: "application/json",
  //         //     },
  //         //     body: JSON.stringify({
  //         //       ...payload,
  //         //       graph: ["efficacyvssafety"],
  //         //       table: [],
  //         //     }),
  //         //   },
  //         // ),
  //       ]);

  //       const strategiesData = await strategiesRes.json();
  //       const efficacyData = await efficacyRes.json();

  //       setTreatmentStrategiesAPI(strategiesData?.[treatment_key] || null);
  //       setEfficacySafetyAPI(efficacyData?.efficacyvssafety || null);
  //     } catch (err) {
  //       console.error("Analytics fetch error:", err);
  //     }
  //   },
  //   [],
  // );

  const [graphLoading, setGraphLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const fetchAnalytics = useCallback(
    async (
      treatment_key = TREATMENT_GRAPH_MAP.Backbone,
      analyticsFilters = {},
      requestTab = activeTab,
    ) => {
      if (hasLoadedOnceRef.current) {
        setIsFetching(true);
      } else {
        setGraphLoading(true);
      }
      try {
        const result = await getTreatmentAnalytics({
          session_key: currentSessionKeyRef.current,
          filters: normalizeTreatmentAnalyticsFilters(analyticsFilters),
          graph: treatment_key,
          table: [],
        });
        const nextSessionKey = result?.session_key || "";
        const resolvedSessionKey =
          nextSessionKey || currentSessionKeyRef.current;

        // On a shared session (share_id), publish the applied top_filters so the
        // header can render them as chips. Only the analytics API returns
        // top_filters — search_results does not — so this is the only source.
        if (preserveSharedSessionKeyRef.current && result?.top_filters) {
          dispatch(setSharedChipFilters(result.top_filters));
        }


        const normalizedPayloadFilters = normalizeSharedFilterPayload(
          result?.payload,
        );
        const fallbackAppliedFilters =
          normalizeSharedFilterPayload(analyticsFilters);
        const mergedPayloadFilters = {
          ...normalizedPayloadFilters,
          ...getSharedSessionFallbackFilters(
            fallbackAppliedFilters,
            normalizedPayloadFilters,
          ),
        };
        const responsePayloadFilters = hasTreatmentSharedFilters(
          mergedPayloadFilters,
        )
          ? mergedPayloadFilters
          : fallbackAppliedFilters;
        // The fetch effect keys off the graph top filters, so the skip-guard
        // must reflect the filters we actually sent (not empty) or the effect
        // re-fires immediately and double-fetches.
        skipNextFetchRequestKeyRef.current = createTreatmentFetchKey(
          requestTab,
          analyticsFilters,
          resolvedSessionKey,
        );

        const nextFilterOptions = normalizeAnalyticsFilterOptions(
          result?.filters,
          result?.metrics || result?.payload?.metrics,
        );

        const treatmentStrategiesKey = treatment_key[0];
        const efficacySafetyKey = treatment_key[1];
        const resolvedTreatmentStrategies =
          result?.[treatmentStrategiesKey] ||
          result?.treatment_strategies ||
          result?.treatmentStrategies ||
          null;
        const resolvedEfficacySafety =
          result?.[efficacySafetyKey] ||
          result?.efficacyvssafety ||
          result?.efficacyVsSafety ||
          null;

        setRootFilters1({
          stage: nextFilterOptions.stage,
          line_intent: nextFilterOptions.line_intent,
          phases: nextFilterOptions.phases,
          locations: nextFilterOptions.locations,
        });
        setRawTreatmentStrategiesAPI(resolvedTreatmentStrategies);
        setRawEfficacySafetyAPI(
          presampleEfficacyApiData(resolvedEfficacySafety),
        );
        setRawAnalytics(result || null);

        if (nextSessionKey && !preserveSharedSessionKeyRef.current) {
          currentSessionKeyRef.current = nextSessionKey;
          setCurrentSessionKey(nextSessionKey);
          // Publish the new session key so sibling analytics tabs (Feasibility,
          // Patients) use the same filtered session — but only during a share
          // flow, and never the default/live search session.
          if (
            searchParams.get("share_id") &&
            !isDefaultSearchSession(nextSessionKey)
          ) {
            dispatch(setAnalyticsSessionKey(nextSessionKey));
          }
          // syncSessionKeyInUrl(nextSessionKey);
          // setStoredFiltersForSession(nextSessionKey, responsePayloadFilters);
          // onSessionKeyChange?.(nextSessionKey);
        }

        setTopFilters((prevFilters) => {
          const reduxFilters = reduxSyncedFiltersRef.current || {};
          const cleanedFilters = {
            ...responsePayloadFilters,
            ...Object.fromEntries(
              Object.entries(reduxFilters).filter(([, v]) => Array.isArray(v) && v.length > 0),
            ),
            // The graph top filters were sent server-side, so what the user
            // actually applied is the source of truth — it must win over the
            // API echo for ALL four keys, including cleared (empty) ones.
            // Otherwise clearing a filter lets the response echo resurrect it
            // (chip stays visible until a second click) and, when non-empty,
            // a backend that doesn't echo them would wipe the selection and
            // re-fire the fetch effect in a loop.
            line_intent: toFilterArray(analyticsFilters?.line_intent),
            phases: toFilterArray(analyticsFilters?.phases),
            stage: toFilterArray(analyticsFilters?.stage),
            locations: toFilterArray(analyticsFilters?.locations),
          };

          if (areSharedFiltersEquivalent(prevFilters, cleanedFilters)) {
            return prevFilters;
          }

          skipNextFetchRequestKeyRef.current = createTreatmentFetchKey(
            requestTab,
            analyticsFilters,
            resolvedSessionKey,
          );

          return cleanedFilters;
        });

        return result;
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setRawTreatmentStrategiesAPI(null);
        setRawEfficacySafetyAPI(null);
        setRawAnalytics(null);
        setTreatmentStrategiesAPI(null);
        setEfficacySafetyAPI(null);
        setAnalytics(null);
        setGraphLoading(false);
        setIsFetching(false);
        return null;
      } finally {
        hasLoadedOnceRef.current = true;
        setGraphLoading(false);
        setIsFetching(false);
      }
    },
    [activeTab, onSessionKeyChange, 
      // syncSessionKeyInUrl
    ],
  );

  const handleEnter = (index) => {
    clearTimeout(timeoutRef.current);
    setHoveredRow(index);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredRow(null);
    }, 200);
  };

  const filteredData = useMemo(() => {
    return (treatmentData.chart || [])
      .filter((d) => {
        /* Country */
        const {
          country,
          backbone,
          phase,
          orr,
          sae,
          lineOfTherapy,
          cancerStage,
        } = filters;

        if (country && d.country !== country) return false;
        if (backbone && d.backbone !== backbone) return false;
        if (cancerStage && d.cancerStage !== cancerStage) return false;
        if (phase && d.phase !== phase) return false;
        if (lineOfTherapy && d.lineOfTherapy !== lineOfTherapy) return false;

        /* ORR */
        if (orr === "lt40" && d.orr >= 40) return false;
        if (orr === "40to60" && (d.orr < 40 || d.orr > 60)) return false;
        if (orr === "gt60" && d.orr <= 60) return false;

        /* SAE */
        if (sae === "low" && d.sae > 1) return false;
        if (sae === "medium" && (d.sae <= 1 || d.sae > 2)) return false;
        if (sae === "high" && d.sae <= 2) return false;

        return true;
      })
      .map((d) => ({
        ...d,

        /* bubble size from ORR */
        size: d.orr < 40 ? "xs" : d.orr < 55 ? "sm" : d.orr < 70 ? "md" : "lg",

        /* shape from backbone */
        shape: d.backbone === "B" ? "diamond" : "circle",
      }));
  }, [filters]);
  const bubbleData = useMemo(() => {
    const source =
      analytics && Array.isArray(analytics.bubble_chart)
        ? analytics.bubble_chart
        : treatmentData.bubble_chart;

    return source.map((d) => {
      const sizeKey =
        d.orr < 40 ? "xs" : d.orr < 55 ? "sm" : d.orr < 70 ? "md" : "lg";

      return {
        ...d,
        sizeValue: SIZE_MAP[sizeKey],
      };
    });
  }, [analytics]);

  const filteredBubbleData = useMemo(() => {
    return bubbleData.filter((d) => {
      if (filters.country && d.country !== filters.country) return false;
      if (filters.phases && d.phases !== filters.phases) return false;
      if (filters.cancerStage && d.cancerStage !== filters.cancerStage)
        return false;
      if (filters.lineOfTherapy && d.lineOfTherapy !== filters.lineOfTherapy)
        return false;
      return true;
    });
  }, [bubbleData, filters]);

  useEffect(() => {
    if (!rawTreatmentStrategiesAPI && !rawEfficacySafetyAPI && !rawAnalytics) {
      return;
    }

    const topGraphFilters = {
      // line_intent / phases / stage / locations are now applied server-side
      // (sent in the getTreatmentAnalytics payload), so the response is already
      // filtered by them. Leave them empty here so the client-side pass is a
      // pass-through and doesn't double-filter. Only the efficacy axes stay
      // client-side.
      stage: [],
      line_intent: [],
      phases: [],
      locations: [],
      efficacyvssafety_x_axis: hasUserSetSaeAxisRef.current
        ? effectiveTopFilters.efficacyvssafety_x_axis
        : "",
      efficacyvssafety_y_axis: hasUserSetOrrAxisRef.current
        ? effectiveTopFilters.efficacyvssafety_y_axis
        : "",
    };

    const filteredStrategies = filterTreatmentStrategiesApi(
      rawTreatmentStrategiesAPI,
      topGraphFilters,
    );
    const filteredEfficacy = filterTreatmentEfficacyApi(
      rawEfficacySafetyAPI,
      topGraphFilters,
    );

    setTreatmentStrategiesAPI(filteredStrategies || null);
    setEfficacySafetyAPI(filteredEfficacy || null);

    if (!rawAnalytics) {
      setAnalytics(null);
      return;
    }

    const treatmentGraphKey = TREATMENT_GRAPH_MAP[activeTab]?.[0];
    const efficacyGraphKey = TREATMENT_GRAPH_MAP[activeTab]?.[1];
    const filteredBubbleChart = filterTreatmentPointsByTopFilters(
      rawAnalytics?.bubble_chart || [],
      topGraphFilters,
    );

        setAnalytics({
          ...rawAnalytics,
          ...(treatmentGraphKey
            ? {
                [treatmentGraphKey]:
                  filteredStrategies ||
                  rawAnalytics[treatmentGraphKey] ||
                  rawAnalytics.treatment_strategies ||
                  rawAnalytics.treatmentStrategies,
              }
            : {}),
          ...(efficacyGraphKey
            ? {
                [efficacyGraphKey]:
                  filteredEfficacy ||
                  rawAnalytics[efficacyGraphKey] ||
                  rawAnalytics.efficacyvssafety ||
                  rawAnalytics.efficacyVsSafety,
              }
            : {}),
          bubble_chart: filteredBubbleChart,
        });
  }, [
    activeTab,
    effectiveTopFilters.line_intent,
    effectiveTopFilters.locations,
    effectiveTopFilters.phases,
    effectiveTopFilters.stage,
    effectiveTopFilters.efficacyvssafety_x_axis,
    effectiveTopFilters.efficacyvssafety_y_axis,
    rawAnalytics,
    rawEfficacySafetyAPI,
    rawTreatmentStrategiesAPI,
  ]);

  const classes = analyticStyles();
  // Only the graph-relevant top filters are sent to the backend so the API
  // returns pre-filtered data. Keep this list in sync with the payload schema
  // (line_intent / phases / stage / locations).
  const graphTopFilters = useMemo(
    () => ({
      line_intent: effectiveTopFilters.line_intent,
      phases: effectiveTopFilters.phases,
      stage: effectiveTopFilters.stage,
      locations: effectiveTopFilters.locations,
    }),
    [
      effectiveTopFilters.line_intent,
      effectiveTopFilters.phases,
      effectiveTopFilters.stage,
      effectiveTopFilters.locations,
    ],
  );
  const graphTopFiltersKey = useMemo(
    () => JSON.stringify(normalizeSharedFiltersForCompare(graphTopFilters)),
    [graphTopFilters],
  );

  useEffect(() => {
    let cancelled = false;
    const requestKey = createTreatmentFetchKey(
      activeTab,
      graphTopFilters,
      currentSessionKeyRef.current,
    );
    const requestFingerprint = createTreatmentFetchFingerprint(
      activeTab,
      graphTopFilters,
      currentSessionKeyRef.current,
    );

    if (skipNextFetchRequestKeyRef.current === requestKey) {
      skipNextFetchRequestKeyRef.current = "";
      lastHandledFetchFingerprintRef.current = requestFingerprint;
      return () => {
        cancelled = true;
      };
    }

    if (
      inFlightFetchFingerprintRef.current === requestFingerprint ||
      lastHandledFetchFingerprintRef.current === requestFingerprint ||
      wasRecentlyFetchedTreatmentFingerprint(requestFingerprint)
    ) {
      lastHandledFetchFingerprintRef.current = requestFingerprint;
      return () => {
        cancelled = true;
      };
    }

    inFlightFetchFingerprintRef.current = requestFingerprint;

    const loadAnalytics = async () => {
      try {
        if (!cancelled) {
          const result = await fetchAnalytics(
            TREATMENT_GRAPH_MAP[activeTab],
            graphTopFilters,
            activeTab,
          );

          if (!cancelled && result) {
            lastHandledFetchFingerprintRef.current = requestFingerprint;
            markRecentTreatmentFetchFingerprint(requestFingerprint);
          }
        }
      } catch (error) {
        console.error("Failed to load treatment analytics:", error);
      } finally {
        if (inFlightFetchFingerprintRef.current === requestFingerprint) {
          inFlightFetchFingerprintRef.current = "";
        }
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [activeTab, currentSessionKey, fetchAnalytics, graphTopFilters, graphTopFiltersKey]);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewSummary, setViewSummary] = useState(null);

  // Controlled tooltip state for both scatter charts.
  const [bubbleScatterTooltip, setBubbleScatterTooltip] = useState({
    active: false,
    payload: null,
  });

  // Refs — no state, so hover never re-renders the parent component
  const efficacyTooltipDataRef = useRef({ active: false, items: [] });
  const efficacyTooltipPositionRef = useRef(null);
  const efficacyTooltipTriggerRef = useRef(null); // set by the overlay component

  const efficacyTooltipTimeoutRef = useRef(null);
  const bubbleTooltipTimeoutRef = useRef(null);
  const efficacyChartWrapRef = useRef(null);
  const efficacyScatterWrapRef = useRef(null);

  const clearSingleFilter = (key) => {
    if (key === "orr" || key === "sae") {
      if (key === "orr") {
        hasUserSetOrrAxisRef.current = false;
      } else {
        hasUserSetSaeAxisRef.current = false;
      }

      // resetSessionContextForManualTopFilterChange();
      const sharedFilterKey =
        key === "orr" ? "efficacyvssafety_y_axis" : "efficacyvssafety_x_axis";

      setFilters((prev) => ({
        ...prev,
        [key]: "",
      }));

      startTransition(() => {
        updateSharedFilters({
          ...effectiveTopFilters,
          [sharedFilterKey]: "",
        });
      });
      return;
    }

    resetSessionContextForManualTopFilterChange();

    // If this filter originated from the search bar (Redux), drop it from the
    // synced ref too. Otherwise the Redux sync effect (and the fetch response
    // merge) re-inject the old value and the chip reappears after clearing.
    if (reduxSyncedFiltersRef.current && key in reduxSyncedFiltersRef.current) {
      const { [key]: _removed, ...restSynced } = reduxSyncedFiltersRef.current;
      reduxSyncedFiltersRef.current = restSynced;
    }

    const updatedFilters = {
      ...effectiveTopFilters,
      [key]: [],
    };

    updateSharedFilters(updatedFilters);
  };

  const clearTopFilters = useCallback(() => {
    resetSessionContextForManualTopFilterChange();
    hasExplicitEmptyCategorySelectionRef.current = false;
    hasUserSetEfficacyAxisRef.current = false;
    hasUserSetOrrAxisRef.current = false;
    hasUserSetSaeAxisRef.current = false;
    reduxSyncedFiltersRef.current = {};
    const nextFilters = createEmptyTopFilters();
    updateSharedFilters(nextFilters);
  }, [resetSessionContextForManualTopFilterChange, updateSharedFilters]);

  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeTable, setActiveTable] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableHasMore, setTableHasMore] = useState(true);
  const [isFetchingMoreRows, setIsFetchingMoreRows] = useState(false);
  const tableFetchKeyRef = useRef("");

  // detect when the opened drawer/table is the Efficacy vs Safety table
  const isEfficacyTable = (() => {
    const name = Array.isArray(activeTable) ? activeTable[0] : activeTable;
    return String(name || "").toLowerCase() === "efficacyvssafety";
  })();

  const TREATMENT_PAGE_SIZE = 50;
  const TREATMENT_SCROLL_THRESHOLD = 40;

  const extractTreatmentSections = (res) => {
    return (
      res?.efficacyvssafety?.views?.study?.sections ??
      res?.efficacyvssafety_table?.views?.study?.sections ??
      res?.treatment_strategies?.views?.study?.sections ??
      res?.treatment_strategies_table?.views?.study?.sections ??
      []
    );
  };

  const handleOpenDrawer = async ({
    table = [],
    graph = [],
    comb_backbone = "",
  }) => {
    setOpenDrawer(true);
    const fetchKey = `${table.join(",")}-${comb_backbone}`;
    tableFetchKeyRef.current = fetchKey;
    try {
      setDrawerLoading(true);
      setActiveTable(table);
      setTableRows([]);
      setTablePage(1);
      setTableHasMore(true);
      const res = await getTreatmentAnalytics({
        comb_backbone,
        session_key: currentSessionKeyRef.current,
        filters: effectiveTopFilters,
        graph,
        table,
        page: 1,
        page_size: TREATMENT_PAGE_SIZE,
      });
      if (tableFetchKeyRef.current !== fetchKey) return;
      setDrawerData(res);
      const sections = extractTreatmentSections(res);
      setTableRows(sections);
      setTableHasMore(sections.length === TREATMENT_PAGE_SIZE);
      setTablePage(2);
    } catch (error) {
      console.error("Drawer API error:", error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleTreatmentTableScroll = useCallback(async (scrollTop, scrollHeight, clientHeight) => {
    const rowsFromBottom = Math.round((scrollHeight - scrollTop - clientHeight) / 80);
    if (rowsFromBottom > TREATMENT_SCROLL_THRESHOLD) return;
    if (!tableHasMore || isFetchingMoreRows || drawerLoading) return;

    const currentTable = activeTable;
    const currentPage = tablePage;
    const fetchKey = tableFetchKeyRef.current;

    setIsFetchingMoreRows(true);
    try {
      const res = await getTreatmentAnalytics({
        session_key: currentSessionKeyRef.current,
        filters: effectiveTopFilters,
        graph: [],
        table: currentTable,
        page: currentPage,
        page_size: TREATMENT_PAGE_SIZE,
      });
      if (tableFetchKeyRef.current !== fetchKey) return;
      const sections = extractTreatmentSections(res);
      setTableRows((prev) => [...prev, ...sections]);
      setTableHasMore(sections.length === TREATMENT_PAGE_SIZE);
      setTablePage((p) => p + 1);
    } catch (error) {
      console.error("Fetch more treatment rows error:", error);
    } finally {
      setIsFetchingMoreRows(false);
    }
  }, [tableHasMore, isFetchingMoreRows, drawerLoading, activeTable, tablePage, effectiveTopFilters]);

  // const handleDownloadCSV = async () => {
  //   const data = await downloadTableCSV({
  //     tablename: activeTable,
  //     session_key:
  //       "search:578f1aa8f0f5b2881903d0a4a1dd609be8d0c8513f8991d42f70ad12141940b3",
  //   });
  // };

  // const handleDownloadCSV = async () => {
  //   try {
  //     const blob = await downloadTableCSV({
  //       tablename: activeTable,
  //       session_key:
  //         "search:578f1aa8f0f5b2881903d0a4a1dd609be8d0c8513f8991d42f70ad12141940b3",
  //     });

  //     const url = window.URL.createObjectURL(blob);

  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = `${activeTable}.csv`;

  //     document.body.appendChild(link);
  //     link.click();

  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("CSV download failed:", error);
  //   }
  // };

  //   const handleDownloadCSV = async () => {
  //   try {
  //     const blob = await downloadTableCSV({
  //       tablename: activeTable,
  //       session_key:
  //         "search:578f1aa8f0f5b2881903d0a4a1dd609be8d0c8513f8991d42f70ad12141940b3",
  //     });

  //     const url = window.URL.createObjectURL(blob);

  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = `${activeTable}.csv`;

  //     document.body.appendChild(link);
  //     link.click();

  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("CSV download failed:", error);
  //   }
  // };

  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  const handleDownloadCSV = async () => {
    if (isDownloadingCSV) return;
    setIsDownloadingCSV(true);

    const downloadTableName = Array.isArray(activeTable)
      ? activeTable[0]
      : activeTable;

    if (!downloadTableName) {
      setIsDownloadingCSV(false);
      return;
    }

    const url = new URL(
      "https://oncosuite.com/analytics/downloadcsv",
    );
    url.searchParams.set("tablename", downloadTableName);
    if (currentSessionKey) {
      url.searchParams.set("session_key", currentSessionKey);
    }

    // Trigger download without navigating away / opening a new tab.
    // For cross-origin attachment downloads, a hidden iframe is the most reliable
    // way to keep the SPA state intact (especially on Safari).
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url.toString();

    // Best-effort: hide the loader when the request completes (iframe load).
    // This correlates better with "download started" than a fixed short timer.
    const fallbackTimeout = window.setTimeout(() => {
      setIsDownloadingCSV(false);
    }, 2500);

    iframe.onload = () => {
      window.clearTimeout(fallbackTimeout);
      setIsDownloadingCSV(false);
    };

    iframe.onerror = () => {
      window.clearTimeout(fallbackTimeout);
      setIsDownloadingCSV(false);
    };

    document.body.appendChild(iframe);
    window.setTimeout(() => iframe.remove(), 60_000);
  };

  // const efficacyVsSafetyData = useMemo(() => {
  //   const source =
  //     analytics?.efficacyvssafety?.[0] ??
  //     treatmentData?.efficacyvssafety?.[0];

  //   if (!source?.chart.points) return [];

  //   const xMetricsSet = new Set(source.metrics?.x_axis || []);
  //   const yMetricsSet = new Set(source.metrics?.y_axis || []);

  //   return source.chart.points
  //     .filter((p) => {

  //       if (filters.phase && p.phase !== filters.phase) return false;

  //       if (
  //         filters.lineOfTherapy &&
  //         p.line_of_therapy !== filters.lineOfTherapy
  //       )
  //         return false;

  //       if (
  //         filters.country &&
  //         p.country &&
  //         p.country !== filters.country
  //       )
  //         return false;

  //       if (
  //         filters.cancerStage &&
  //         p.cancer_stage &&
  //         p.cancer_stage !== filters.cancerStage
  //       )
  //         return false;

  //       return true;
  //     })
  //     .map((p) => {
  //       let sae = null;
  //       let orr = null;
  //       let safetyMetric = null;
  //       let efficacyMetric = null;

  //       for (const key in p) {
  //         if (xMetricsSet.has(key) && sae == null) {
  //           sae = Number(p[key]);
  //           safetyMetric = key;
  //         }

  //         if (yMetricsSet.has(key) && orr == null) {
  //           orr = Number(p[key]);
  //           efficacyMetric = key;
  //         }
  //       }

  //       // skip invalid points
  //       if (sae == null || orr == null) return null;

  //       return {
  //         sae,
  //         orr,
  //         safetyMetric,
  //         efficacyMetric,
  //         backbone: p.backbone,
  //         n: p.n,
  //         phase: p.phase,
  //         line_of_therapy: p.line_of_therapy,
  //         sizeValue: Math.max(60, Math.min(400, (p.n || 0) / 10)),
  //       };
  //     })
  //     .filter(Boolean);

  // }, [analytics, treatmentData, filters]);

	  const efficacyVsSafetyData = useMemo(() => {
      console.log()

	    const pointers = getEfficacySafetyPointers(efficacySafetyAPI);

	    if (!pointers.length) {
	      if (DEBUG_EFFICACY_GRAPH) {
	        // eslint-disable-next-line no-console
	        console.warn("[EfficacyVsSafety] No pointers found", {
	          hasApi: Boolean(efficacySafetyAPI),
	          summary: efficacySafetyAPI?.summary,
	          chartKeys: Object.keys(efficacySafetyAPI?.chart || {}),
	          pointsType: typeof efficacySafetyAPI?.chart?.points,
	          pointerType: typeof efficacySafetyAPI?.chart?.pointer,
	        });
	      }
	      return [];
	    }

	    // Rendering + processing 200k+ SVG points will freeze the UI.
	    // Downsample for interactivity; keep summary as the total count.
	    // Accuracy mode: plot every point returned by the API (no downsampling).
	    // Keep this lightweight: scatter hover/tooltips should not trigger heavy recomputation.
      const accuracyMode = Boolean(window?.__EFFICACY_ACCURACY__);
      const POINT_SAMPLE_LIMIT = PRE_SAMPLE_LIMIT; // already pre-sampled; no need to cut again
	    const sampledPointers =
        accuracyMode || pointers.length <= POINT_SAMPLE_LIMIT
          ? pointers
          : downsampleStratifiedByX(pointers, POINT_SAMPLE_LIMIT);

    // API returns chart.x_axis / chart.y_axis as [{label, min, max}]
    const xAxisArr = efficacySafetyAPI.chart?.x_axis || [];
    const yAxisArr = efficacySafetyAPI.chart?.y_axis || [];

    // Fall back to metrics arrays if chart axes are absent
    const xMetrics = xAxisArr.length
      ? xAxisArr.map((a) => a.label)
      : efficacySafetyAPI.metrics?.x_axis || [];
    const yMetrics = yAxisArr.length
      ? yAxisArr.map((a) => a.label)
      : efficacySafetyAPI.metrics?.y_axis || [];

    const firstXAxisLabel =
      xAxisArr?.find((entry) => entry?.label === "SAE")?.label ||
      xAxisArr?.[0]?.label ||
      xMetrics?.[0] ||
      "";
    const firstYAxisLabel =
      yAxisArr?.find((entry) => entry?.label === "ORR")?.label ||
      yAxisArr?.[0]?.label ||
      yMetrics?.[0] ||
      "";

    // Selected axis labels (top filters). If the user hasn't explicitly chosen
    // an axis metric yet, don't filter points by endpoint; just plot what the API returns.
    const userSelectedSafetyMetric =
      hasUserSetSaeAxisRef.current && Boolean(filters?.sae);
    const userSelectedEfficacyMetric =
      hasUserSetOrrAxisRef.current && Boolean(filters?.orr);

	    const selectedSafetyMetric = resolveAxisSelection(
	      filters?.sae || firstXAxisLabel,
	      xMetrics,
	    );
	    const selectedEfficacyMetric = resolveAxisSelection(
	      filters?.orr || firstYAxisLabel,
	      yMetrics,
	    );

	    const result = sampledPointers
	      .map((p, idx) => {
        // Support BOTH backends:
        // 1) legacy schema: { ae_value, endpoint_value, ae_category, endpoint }
        // 2) current schema:
        //    - values may be keyed by axis labels (e.g. { SAE: 2.0, ORR: 0.5 })
        //    - OR provided as hyphenated keys { "x-axis": 3.4, "y-axis": 1.73, safety_endpoint, efficacy_endpoint }
        const hasLegacySchema =
          p &&
          Object.prototype.hasOwnProperty.call(p, "ae_value") &&
          Object.prototype.hasOwnProperty.call(p, "endpoint_value");

        const hasAxisValueSchema =
          p &&
          (Object.prototype.hasOwnProperty.call(p, "x-axis") ||
            Object.prototype.hasOwnProperty.call(p, "y-axis") ||
            Object.prototype.hasOwnProperty.call(p, "x_axis") ||
            Object.prototype.hasOwnProperty.call(p, "y_axis"));

        const safetyMetric = hasLegacySchema
          ? p.ae_category // "SAE" or "Grade 3-4"
          : hasAxisValueSchema
            ? p.safety_endpoint || selectedSafetyMetric
            : resolvePointMetricLabel(p, selectedSafetyMetric, xMetrics);
        const efficacyMetric = hasLegacySchema
          ? p.endpoint // "ORR", "PFS", etc.
          : hasAxisValueSchema
            ? p.efficacy_endpoint || selectedEfficacyMetric
            : resolvePointMetricLabel(p, selectedEfficacyMetric, yMetrics);

        if (hasAxisValueSchema && (userSelectedSafetyMetric || userSelectedEfficacyMetric)) {
          const pointSafety = p?.safety_endpoint;
          const pointEfficacy = p?.efficacy_endpoint;

          if (
            userSelectedSafetyMetric && selectedSafetyMetric &&
            pointSafety && !metricMatchesSelection(pointSafety, selectedSafetyMetric)
          ) {
            return null;
          }

          if (
            userSelectedEfficacyMetric && selectedEfficacyMetric &&
            pointEfficacy && !metricMatchesSelection(pointEfficacy, selectedEfficacyMetric)
          ) {
            return null;
          }
        }

        if (
          !hasAxisValueSchema &&
          userSelectedSafetyMetric &&
          selectedSafetyMetric &&
          !metricMatchesSelection(safetyMetric, selectedSafetyMetric)
        ) {
          return null;
        }

        if (
          !hasAxisValueSchema &&
          userSelectedEfficacyMetric &&
          selectedEfficacyMetric &&
          !metricMatchesSelection(efficacyMetric, selectedEfficacyMetric)
        ) {
          return null;
        }

        const sae = hasLegacySchema
          ? parseNumericValue(p.ae_value)
          : hasAxisValueSchema
            ? parseNumericValue(p?.["x-axis"] ?? p?.x_axis)
            : parseNumericValue(p?.[safetyMetric]);
        const efficacy = hasLegacySchema
          ? parseNumericValue(p.endpoint_value)
          : hasAxisValueSchema
            ? parseNumericValue(p?.["y-axis"] ?? p?.y_axis)
            : parseNumericValue(p?.[efficacyMetric]);

        if (sae === null || efficacy === null || isNaN(sae) || isNaN(efficacy)) {
          return null;
        }

        // Only cap ORR at 100 — other metrics (PFS, OS, DLT, etc.) can exceed 100
        // Do not drop high values; axis scaling handles this.

	        const processedPoint = {
	          _uid: String(p.treatment_id || p.nct_id || p.id || idx),
	          treatment_id: p.treatment_id || p.nct_id || p.id,
	          regimen: p.regimen || p.treatment_name || p.arm_name || p.arm || p.intervention || null,
          sae,
          orr: efficacy,
	          safetyMetric,
	          efficacyMetric,
	          backbone: p.backbone,
          n: p.n,
          mode_of_administration: p.mode_of_administration,
          sizeValue: Math.max(60, Math.min(400, (p.n || 0) / 20)),
          // Include additional properties that might be needed for filtering
          phase: p.phase,
          line_of_therapy: p.line_of_therapy,
          stage: p.stage,
          country: p.country,
        };


	        return processedPoint;
		      })
		      .filter(Boolean);

	    if (DEBUG_EFFICACY_GRAPH && result.length === 0 && pointers.length > 0) {
	      const sample = sampledPointers[0] ?? pointers[0];
	      // eslint-disable-next-line no-console
	      console.warn("[EfficacyVsSafety] 0 parsed points details", {
	        selectedSafetyMetric,
	        selectedEfficacyMetric,
		        samplePointer: sample,
		        samplePointerKeys:
		          sample && typeof sample === "object"
		            ? Object.keys(sample).slice(0, 50)
		            : null,
		        hasLegacySchema:
		          sample &&
		          Object.prototype.hasOwnProperty.call(sample, "ae_value") &&
		          Object.prototype.hasOwnProperty.call(sample, "endpoint_value"),
		        hasAxisValueSchema:
		          sample &&
		          (Object.prototype.hasOwnProperty.call(sample, "x-axis") ||
		            Object.prototype.hasOwnProperty.call(sample, "y-axis") ||
		            Object.prototype.hasOwnProperty.call(sample, "x_axis") ||
		            Object.prototype.hasOwnProperty.call(sample, "y_axis")),
		        directSelectedSafetyValue:
		          sample && selectedSafetyMetric ? sample[selectedSafetyMetric] : undefined,
		        directSelectedEfficacyValue:
		          sample && selectedEfficacyMetric ? sample[selectedEfficacyMetric] : undefined,
		      });
		    }

	    if (DEBUG_EFFICACY_GRAPH) {
	      // eslint-disable-next-line no-console
	      console.warn("[EfficacyVsSafety] Parsed points", {
	        summary: efficacySafetyAPI?.summary,
	        pointersCount: pointers.length,
	        sampledPointersCount: sampledPointers.length,
	        parsedCount: result.length,
	        selectedSafetyMetric,
	        selectedEfficacyMetric,
	        userSelectedSafetyMetric,
	        userSelectedEfficacyMetric,
	        samplePointer: pointers[0],
	        samplePointerKeys:
	          pointers[0] && typeof pointers[0] === "object"
	            ? Object.keys(pointers[0]).slice(0, 30)
	            : null,
	        samplePointerType: typeof pointers[0],
	        sampleParsed: result[0],
	      });
	    }



	    return result;
	  }, [filters?.orr, filters?.sae, efficacySafetyAPI]);

  const filteredEfficacyData = useMemo(() => {
    // The efficacy/safety endpoint already applies the current page filters.
    // Render every point the API returns; local filtering here can hide valid
    // initial-load bubbles when default dropdown labels don't match row keys.
    return efficacyVsSafetyData;
	  }, [efficacyVsSafetyData]);
	  const getBaseBackbone = (val) => val?.toLowerCase().split("+")[0].trim();
	
  const finalEfficacyData = useMemo(() => {
    // The efficacy API response is already scoped by the shared Treatment
    // filters. Applying another local `backbone` match can hide valid points
    // because the scatter API's backbone labels do not always equal the
    // selected strategy/category labels.
    return filteredEfficacyData;
  }, [filteredEfficacyData]);

	  // (Removed) ResizeObserver-based overlap index. Overlap is value-based for stability.


  useEffect(() => {
    if (!DEBUG_EFFICACY_GRAPH) return;
    // eslint-disable-next-line no-console
    console.warn("[EfficacyVsSafety] Final data", {
      hasApi: Boolean(efficacySafetyAPI),
      summary: efficacySafetyAPI?.summary,
      efficacyVsSafetyData: efficacyVsSafetyData.length,
      filteredEfficacyData: filteredEfficacyData.length,
      finalEfficacyData: finalEfficacyData.length,
      chartFilters: { orr: filters?.orr, sae: filters?.sae },
      activeKeysCount: activeKeys.length,
      selectedRegimensCount: selectedRegimens.length,
    });
  }, [
    DEBUG_EFFICACY_GRAPH,
    efficacySafetyAPI,
    efficacyVsSafetyData.length,
    filteredEfficacyData.length,
    finalEfficacyData.length,
    filters?.orr,
    filters?.sae,
    activeKeys.length,
    selectedRegimens.length,
  ]);

  useEffect(() => {
    if (!DEBUG_EFFICACY_GRAPH) return;
    // eslint-disable-next-line no-console
    console.warn("[EfficacyVsSafety] Debug enabled", {
      dev: Boolean(import.meta?.env?.DEV),
      windowFlag: Boolean(window?.__DEBUG_EFFICACY__),
    });
  }, [DEBUG_EFFICACY_GRAPH]);

  useEffect(() => {
    const summary = Number(efficacySafetyAPI?.summary ?? 0);
    if (!summary) return;
    if (finalEfficacyData.length > 0) return;

    // Always surface this (warn level) when we have trials but no plotted points.
    // eslint-disable-next-line no-console
    console.warn("[EfficacyVsSafety] Summary > 0 but no plotted points", {
      summary,
      hasApi: Boolean(efficacySafetyAPI),
      chartKeys: Object.keys(efficacySafetyAPI?.chart || {}),
      pointsType: typeof efficacySafetyAPI?.chart?.points,
      pointerType: typeof efficacySafetyAPI?.chart?.pointer,
      chartFilters: { orr: filters?.orr, sae: filters?.sae },
      activeKeysCount: activeKeys.length,
      selectedRegimensCount: selectedRegimens.length,
    });
  }, [
    efficacySafetyAPI,
    finalEfficacyData.length,
    filters?.orr,
    filters?.sae,
    activeKeys.length,
    selectedRegimens.length,
  ]);

  const handleBack = () => {
    if (viewSummary) {
      setViewSummary(null);
    } else {
      setOpenDrawer(false);
    }
  };

  const scrollRefRight = useRef(null);
  // const treatmentStrategyChart = useMemo(() => {
  //   if (!treatmentStrategiesAPI?.chart?.pointer) return [];

  //   const result = {};
  //   const pointers = treatmentStrategiesAPI.chart.pointer;

  //   pointers.forEach((p) => {
  //     const year = p.x_axis;
  //     const key = p.backbone || p.category;

  //     if (!result[year]) {
  //       result[year] = { year };
  //     }

  //     result[year][key] = (result[year][key] || 0) + p.y_axis;
  //   });

  //   return Object.values(result).sort((a, b) => a.year - b.year);
  // }, [treatmentStrategiesAPI]);
  const treatmentStrategyChart = useMemo(() => {
    const pointers = getTreatmentStrategyPointers(treatmentStrategiesAPI?.chart);

    if (!pointers.length) return [];

    const shouldFilterByRegimenComplexity =
      activeTab === "Backbone" &&
      deferredRegimenComplexitySelection.size > 0 &&
      deferredRegimenComplexitySelection.size < REGIMEN_COMPLEXITY_KEYS.length;

    const filteredPointers = shouldFilterByRegimenComplexity
      ? pointers.filter((point) =>
          deferredRegimenComplexitySelection.has(getRegimenComplexityKey(point)),
        )
      : pointers;

    if (!filteredPointers.length) return [];

    const result = {};

    filteredPointers.forEach((p) => {
      const year = getTreatmentStrategyPointYear(p);
      const key = getTreatmentStrategyPointKey(p, activeTab);
      const value = getTreatmentStrategyPointValue(p);

      if (!year || !key) return;

      if (!result[year]) {
        result[year] = { year };
      }

      result[year][key] = (result[year][key] || 0) + value;
    });

    const finalResult = Object.values(result).sort((a, b) => a.year - b.year);
    return finalResult;
  }, [
    REGIMEN_COMPLEXITY_KEYS.length,
    activeTab,
    deferredRegimenComplexitySelection,
    treatmentStrategiesAPI,
  ]);

  const shouldUseStaticTreatmentFallback = useMemo(
    () =>
      !hasSharedFilters &&
      !treatmentStrategiesAPI &&
      !treatmentStrategyChart.length,
    [hasSharedFilters, treatmentStrategiesAPI, treatmentStrategyChart],
  );

  const getStrategySource = useCallback(
    (tab) => {
      if (tab === "Backbone") {
        return treatmentStrategyChart.length
          ? treatmentStrategyChart
          : shouldUseStaticTreatmentFallback
            ? treatmentData.chart_backbone
            : [];
      }

      if (tab === "Modality") {
        return treatmentStrategyChart.length
          ? treatmentStrategyChart
          : shouldUseStaticTreatmentFallback
            ? treatmentData.chart_moa
            : [];
      }

      if (tab === "MoA") {
        return treatmentStrategyChart.length
          ? treatmentStrategyChart
          : shouldUseStaticTreatmentFallback
            ? treatmentData.chart_regimen
            : [];
      }

      return [];
    },
    [shouldUseStaticTreatmentFallback, treatmentStrategyChart],
  );

  const apiStrategyKeys = useMemo(
    () => getChartSeriesKeys(treatmentStrategyChart),
    [treatmentStrategyChart],
  );

  const strategyKeys = useMemo(() => {
    if (apiStrategyKeys.length) {
      return apiStrategyKeys;
    }

    if (activeTab === "Backbone") {
      const backboneKeys =
        treatmentStrategiesAPI?.metrics?.backbone ||
        treatmentStrategiesAPI?.metrics?.category;

      if (backboneKeys?.length) {
        return backboneKeys;
      }
    }

    if (activeTab === "Modality") {
      const modalityKeys =
        treatmentStrategiesAPI?.metrics?.modality ||
        treatmentStrategiesAPI?.metrics?.category ||
        treatmentStrategiesAPI?.metrics?.backbone;

      if (modalityKeys?.length) {
        return modalityKeys;
      }
    }

    if (activeTab === "MoA") {
      const mapCategoryKeys = Object.keys(subCategoryMap || {});
      const categoryKeys =
        treatmentStrategiesAPI?.metrics?.category ||
        treatmentStrategiesAPI?.metrics?.moa_category ||
        mapCategoryKeys;

      if (categoryKeys?.length) {
        return categoryKeys;
      }

      const moaKeys =
        treatmentStrategiesAPI?.metrics?.sub_category ||
        treatmentStrategiesAPI?.metrics?.modality ||
        treatmentStrategiesAPI?.metrics?.regimen ||
        treatmentStrategiesAPI?.metrics?.category;

      if (moaKeys?.length) {
        return moaKeys;
      }
    }

    return shouldUseStaticTreatmentFallback ? Object.keys(STACK_COLORS) : [];
  }, [
    activeTab,
    apiStrategyKeys,
    shouldUseStaticTreatmentFallback,
    subCategoryMap,
    treatmentStrategiesAPI,
  ]);

  const efficacyBackboneKeys = useMemo(() => {
    if (!efficacyVsSafetyData || efficacyVsSafetyData.length === 0) return [];

    const unique = new Set();
    efficacyVsSafetyData.forEach((d) => {
      if (d?.backbone) {
        const base = getBaseBackbone(d.backbone);
        unique.add(base);
      }
    });

    return Array.from(unique);
  }, [efficacyVsSafetyData]);

	  const visibleKeys = useMemo(() => {
	    const source = getStrategySource(activeTab);

    if (!Array.isArray(source) || source.length === 0) {
      // Fallback to efficacy backbone keys if no treatment strategy data
      return efficacyBackboneKeys;
    }

    const result = getChartSeriesKeys(source);

    // If no keys from treatment strategy, use efficacy keys
    if (result.length === 0) {
      return efficacyBackboneKeys;
    }

	    return result;
	  }, [activeTab, getStrategySource, efficacyBackboneKeys]);

	  const knownEfficacyBackboneBases = useMemo(() => {
	    const keys = Array.isArray(visibleKeys) ? visibleKeys : [];
	    return new Set(keys.map((key) => getBaseBackbone(key)).filter(Boolean));
	  }, [visibleKeys]);
	
	  const strategySelectionKeys = useMemo(
	    () => (visibleKeys.length ? visibleKeys : strategyKeys),
	    [strategyKeys, visibleKeys],
	  );
  const areAllStrategyKeysSelected = useMemo(
    () =>
      strategySelectionKeys.length > 0 &&
      strategySelectionKeys.every((key) => activeKeys.includes(key)),
    [activeKeys, strategySelectionKeys],
  );

  const hasCategoryFilterApplied = useMemo(() => {
    if (!strategySelectionKeys.length) return false;

    if (hasExplicitEmptyCategorySelectionRef.current) return true;

    return !areAllStrategyKeysSelected;
  }, [areAllStrategyKeysSelected, strategySelectionKeys.length]);

  const hasSubCategoryFilterApplied = selectedRegimens.length > 0;

  const hasRegimenComplexityFilterApplied = useMemo(() => {
    return (
      regimenComplexitySelection.size > 0 &&
      regimenComplexitySelection.size < REGIMEN_COMPLEXITY_KEYS.length
    );
  }, [REGIMEN_COMPLEXITY_KEYS.length, regimenComplexitySelection.size]);

  // Regimen complexity selector is independent of the category/sub-category
  // lists — a selection in either list must not lock it.
  const isRegimenComplexityDisabled = false;

  const isBelowDisabledByRegimenComplexity = false;

  // Left and right lists are independent selections — a right-side
  // combination selection must not lock or grey out the left-side list.
  const isCategoryDisabled = false;

  // Regimen complexity (top header) only filters what options are shown — it does not lock selection.
  const isSubCategoryDisabled = false;

  // console.log(visibleKeys, "visibleKeys");

  // useEffect(() => {
  //   const sharedCategoryFilters = effectiveTopFilters.category || [];

  //   if (sharedCategoryFilters.length) {
  //     hasExplicitEmptyCategorySelectionRef.current = false;
  //     const restoredKeys = sharedCategoryFilters.filter((key) =>
  //       visibleKeys.includes(key),
  //     );

  //     setActiveKeys(restoredKeys.length ? restoredKeys : sharedCategoryFilters);
  //     return;
  //   }

  //   if (hasExplicitEmptyCategorySelectionRef.current) {
  //     setActiveKeys([]);
  //     return;
  //   }

  //   setActiveKeys(visibleKeys);
  // }, [effectiveTopFilters.category, visibleKeys]);
  const hasRestoredCategoryRef = useRef(false);
  useEffect(() => {
    const sharedCategoryFilters = effectiveTopFilters.category || [];

    // ✅ CASE 1: Shared URL restore
    if (sharedCategoryFilters.length > 0) {
      const restoredKeys = sharedCategoryFilters.filter((key) =>
        visibleKeys.includes(key),
      );

      setActiveKeys(restoredKeys.length ? restoredKeys : sharedCategoryFilters);

      hasRestoredCategoryRef.current = true;
      return;
    }

    // ✅ CASE 2: Explicit empty selection
    if (hasExplicitEmptyCategorySelectionRef.current) {
      setActiveKeys([]);
      return;
    }

    // ✅ CASE 3: Default (ONLY if not restored before)
    if (!hasRestoredCategoryRef.current) {
      setActiveKeys(visibleKeys);
    }
  }, [effectiveTopFilters.category, visibleKeys]);

  // ✅ NEW: Auto-populate activeKeys when efficacy data is available but activeKeys is empty
  useEffect(() => {
    // If we have efficacy data but no active keys, and no treatment strategy data
    if (
      efficacyVsSafetyData.length > 0 &&
      activeKeys.length === 0 &&
      efficacyBackboneKeys.length > 0 &&
      visibleKeys.length === 0
    ) {
      setActiveKeys(efficacyBackboneKeys);
    }
  }, [activeKeys, efficacyBackboneKeys, efficacyVsSafetyData, visibleKeys]);

  // useEffect(() => {
  //   const sharedSubCategoryFilters = effectiveTopFilters.sub_category || [];

  //   if (sharedSubCategoryFilters.length) {
  //     const restoredRegimens = sharedSubCategoryFilters.filter((regimen) =>
  //       regimens.includes(regimen),
  //     );

  //     setSelectedRegimens(
  //       restoredRegimens.length ? restoredRegimens : sharedSubCategoryFilters,
  //     );
  //     return;
  //   }

  //   setSelectedRegimens((prevRegimens) =>
  //     prevRegimens.filter((regimen) => regimens.includes(regimen)),
  //   );
  // }, [effectiveTopFilters.sub_category, regimens]);

  const hasRestoredRegimensRef = useRef(false);

  useEffect(() => {
    const sharedSubCategoryFilters = effectiveTopFilters.sub_category || [];

    if (sharedSubCategoryFilters.length > 0) {
      const restoredRegimens = sharedSubCategoryFilters.filter((regimen) =>
        regimens.includes(regimen),
      );

      setSelectedRegimens(
        restoredRegimens.length ? restoredRegimens : sharedSubCategoryFilters,
      );

      hasRestoredRegimensRef.current = true;
      return;
    }

    if (!hasRestoredRegimensRef.current) {
      setSelectedRegimens((prevRegimens) =>
        prevRegimens.filter((regimen) => regimens.includes(regimen)),
      );
    }
  }, [effectiveTopFilters.sub_category, regimens]);

  const resetChartSelections = useCallback(() => {
    resetSessionContextForManualTopFilterChange();
    setFilters((prev) => ({
      ...prev,
      orr: "",
      sae: "",
    }));
    setSelectedRegimens([]);
    setActiveKeys(visibleKeys);
    updateSharedFilters({
      ...effectiveTopFilters,
      efficacyvssafety_x_axis: "",
      efficacyvssafety_y_axis: "",
    });
  }, [
    effectiveTopFilters,
    resetSessionContextForManualTopFilterChange,
    updateSharedFilters,
    visibleKeys,
  ]);

  const [rightMetrics, setRightMetrics] = useState({
    content: 0,
    viewport: 1,
  });

  const chartData = useMemo(() => {
    const source = getStrategySource(activeTab);

    if (!Array.isArray(source)) return [];

    if (selectedRegimens.length > 0) {
      const pointers = getTreatmentStrategyPointers(treatmentStrategiesAPI?.chart);
      const selectedSubCategories = new Set(
        selectedRegimens.map((item) => normalizeFilterToken(item)),
      );
      const grouped = {};
      // Track seen point identities per year+subCategory to avoid double-counting
      // the same raw pointer when category and subcategory names overlap.
      const seen = new Set();

      pointers.forEach((point, idx) => {
        const year = getTreatmentStrategyPointYear(point);
        const value = getTreatmentStrategyPointValue(point);
        const subCategory =
          point.sub_category ||
          point.moa ||
          point.regimen ||
          point.treatment_name;

        if (!year || !subCategory) return;

        const normalizedSub = normalizeFilterToken(subCategory);

        // A point is included whenever its own sub_category was explicitly
        // selected in the right panel — the parent category checkbox state
        // (activeKeys) is not re-checked here, since the two lists are
        // independent selections and a sub-category can belong to a category
        // that isn't (or is no longer) checked on the left.
        if (!selectedSubCategories.has(normalizedSub)) {
          return;
        }

        // Deduplicate: same raw pointer index + year + subCategory = same data point
        const pointKey = `${idx}|${year}|${normalizedSub}`;
        if (seen.has(pointKey)) return;
        seen.add(pointKey);

        if (!grouped[year]) {
          grouped[year] = { year };
        }

        grouped[year][subCategory] = (grouped[year][subCategory] || 0) + value;
        // Also key by the space-stripped form, matching the MoA Bar dataKey
        // (activeTab === "MoA" strips whitespace from the series key at render time).
        const strippedKey = subCategory.replace(/\s+/g, "");
        if (strippedKey !== subCategory) {
          grouped[year][strippedKey] = grouped[year][subCategory];
        }
      });

      const nextChartData = Object.values(grouped).sort((a, b) => a.year - b.year);
      if (nextChartData.length) {
        return nextChartData;
      }
    }

    return source.map((yearData) => {
      const filtered = { year: yearData.year };

      if (activeTab === "MoA") {
        const regimensToUse = selectedRegimens.length
          ? selectedRegimens
          : activeKeys.length
            ? activeKeys
            : hasExplicitEmptyCategorySelectionRef.current
              ? []
              : strategySelectionKeys;

        regimensToUse.forEach((regimen) => {
          const key = regimen.replace(/\s+/g, "");
          const value = yearData[regimen] || yearData[key] || 0;
          filtered[regimen] = value;
          filtered[key] = value;
        });
      } else {
        const baseKeys = activeKeys.length > 0 ? activeKeys : strategyKeys;
        let keysToUse = baseKeys;

        if (selectedRegimens.length > 0) {
          const normalizedMatchedCategories = new Set();

          selectedRegimens.forEach((regimenToken) => {
            const normalizedToken = normalizeFilterToken(regimenToken);
            if (!normalizedToken) return;

            const categoryKeys = subCategoryToCategoryKeys?.[normalizedToken];
            if (!categoryKeys) return;

            categoryKeys.forEach((categoryKey) =>
              normalizedMatchedCategories.add(normalizeFilterToken(categoryKey)),
            );
          });

          if (normalizedMatchedCategories.size > 0) {
            keysToUse = baseKeys.filter((key) =>
              normalizedMatchedCategories.has(normalizeFilterToken(key)),
            );
          }
        }

        keysToUse.forEach((key) => {
          filtered[key] = yearData[key] || 0;
        });
      }

      return filtered;
    });
  }, [
    activeTab,
    activeKeys,
    getStrategySource,
    normalizeFilterToken,
    selectedRegimens,
    subCategoryToCategoryKeys,
    strategyKeys,
    strategySelectionKeys,
    treatmentStrategiesAPI,
  ]);

  const yAxisConfig = useMemo(() => {
    const yAxis = treatmentStrategiesAPI?.chart?.y_axis?.[0];

    const min = yAxis?.min ?? 0;
    const max = yAxis?.max ?? 100;

    return { min, max };
  }, [treatmentStrategiesAPI]);
  const stackedMax = useMemo(() => {
    if (!chartData?.length) return 0;

    return Math.max(
      ...chartData.map((row) => {
        return Object.keys(row)
          .filter((k) => k !== "year")
          .reduce((sum, key) => sum + (row[key] || 0), 0);
      }),
    );
  }, [chartData]);

  const yAxisTicks = useMemo(() => {
    const max = stackedMax;

    if (!max) return [0, 100];

    const step = Math.ceil(max / 5 / 10) * 10;

    const ticks = [];
    for (let i = 0; i <= max + step; i += step) {
      ticks.push(i);
    }

    return ticks;
  }, [stackedMax]);

  const finalMax = yAxisTicks[yAxisTicks.length - 1];

  const keyHasData = useCallback(
    (key) => {
      const source = getStrategySource(activeTab);

      if (!Array.isArray(source)) return false;

      return source.some((row) => row[key] && row[key] > 0);
    },
    [activeTab, getStrategySource],
  );
  const sortedKeys = useMemo(() => {
    const keysToSort = strategySelectionKeys.length
      ? strategySelectionKeys
      : ALL_KEYS;

    return [...keysToSort].sort((a, b) => {
      const aHas = keyHasData(a);
      const bHas = keyHasData(b);

      if (aHas !== bHas) return aHas ? -1 : 1;

      return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
    });
  }, [keyHasData, strategySelectionKeys]);

  const strategyKeyTotals = useMemo(() => {
    const source = getStrategySource(activeTab);
    if (!Array.isArray(source)) return {};

    const keysToMeasure = Array.from(
      new Set([
        ...ALL_KEYS,
        ...(sortedKeys || []),
        ...(activeKeys || []),
        ...(visibleKeys || []),
        ...(selectedRegimens || []),
      ]),
    );

    return keysToMeasure.reduce((acc, key) => {
      const sourceKey =
        activeTab === "MoA" && typeof key === "string"
          ? key.replace(/\s+/g, "")
          : key;
      acc[key] = source.reduce(
        (sum, row) =>
          sum + (Number(row?.[key]) || Number(row?.[sourceKey]) || 0),
        0,
      );
      return acc;
    }, {});
  }, [
    activeKeys,
    activeTab,
    getStrategySource,
    selectedRegimens,
    sortedKeys,
    visibleKeys,
  ]);

  const strategyTotalsDomain = useMemo(() => {
    const values = Object.values(strategyKeyTotals).filter(
      (value) => Number.isFinite(value) && value > 0,
    );

    if (!values.length) return { low: 0, high: 0 };

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    if (minValue === maxValue) return { low: maxValue, high: maxValue };

    const span = maxValue - minValue;
    return {
      low: minValue + span / 3,
      high: minValue + (span * 2) / 3,
    };
  }, [strategyKeyTotals]);

	  const getStrategyKeyColor = useCallback(
	    (key) => {
	      const normalizedKey = String(key || "").toLowerCase().trim();
	      const total = Number(strategyKeyTotals?.[key]) || 0;

	      if (total <= strategyTotalsDomain.low) return pickTreatmentShade(normalizedKey, 0);
	      if (total <= strategyTotalsDomain.high) return pickTreatmentShade(normalizedKey, 1);
	      return pickTreatmentShade(normalizedKey, 2);
	    },
	    [strategyKeyTotals, strategyTotalsDomain],
	  );

  const stableStrategyKeyColorRef = useRef({});
  const getStableStrategyKeyColor = useCallback(
    (key) => {
      const normalizedKey = typeof key === "string" ? key : String(key);
      const existing = stableStrategyKeyColorRef.current[normalizedKey];
      if (existing) return existing;

      const computed = getStrategyKeyColor(normalizedKey);
      stableStrategyKeyColorRef.current[normalizedKey] = computed;
      return computed;
    },
    [getStrategyKeyColor],
  );

  const sortedRegimens = useMemo(() => {
    if (!Array.isArray(regimens) || regimens.length === 0) return [];

    return [...regimens].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
    );
  }, [regimens]);

  // console.log(sortedKeys, "sortedKeyssortedKeys");

  useEffect(() => {
    if (!scrollRefRight.current) return;

    const el = scrollRefRight.current;

    const update = () => {
      setRightMetrics({
        content: el.scrollHeight,
        viewport: el.clientHeight,
      });
    };

    update();
  }, [regimens]);

  // const efficacyMetrics = useMemo(() => {
  //   const source =
  //     analytics?.efficacyvssafety?.[0] ?? treatmentData?.efficacyvssafety?.[0];

  //   return source?.metrics?.y_axis || [];
  // }, [analytics]);

  // const safetyMetrics = useMemo(() => {
  //   const source =
  //     analytics?.efficacyvssafety?.[0] ?? treatmentData?.efficacyvssafety?.[0];

  //   return source?.metrics?.x_axis || [];
  // }, [analytics]);

  const efficacyMetrics = useMemo(() => {
    const yAxisArr = efficacySafetyAPI?.chart?.y_axis || [];
    return yAxisArr.length
      ? yAxisArr.map((a) => a.label)
      : efficacySafetyAPI?.metrics?.y_axis || [];
  }, [efficacySafetyAPI]);

  const safetyMetrics = useMemo(() => {
    const xAxisArr = efficacySafetyAPI?.chart?.x_axis || [];
    return xAxisArr.length
      ? xAxisArr.map((a) => a.label)
      : efficacySafetyAPI?.metrics?.x_axis || [];
  }, [efficacySafetyAPI]);

  const displayedEfficacyMetric =
    resolveAxisSelection(filters?.orr, efficacyMetrics) || "ORR";
  const displayedSafetyMetric =
    resolveAxisSelection(filters?.sae, safetyMetrics) || "SAE";

  // Dynamic axis domains — use the global max across ALL metrics (not just selected)
  const getPercentile = (sortedValues = [], percentile = 0.99) => {
    if (!sortedValues.length) return 0;

    const clamped = Math.min(1, Math.max(0, percentile));
    const index = Math.max(
      0,
      Math.min(
        sortedValues.length - 1,
        Math.floor(clamped * (sortedValues.length - 1)),
      ),
    );

    return sortedValues[index];
  };

  const computeScatterDomain = (values = []) => {
    const numeric = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    if (!numeric.length) return [0, 100];

    // Use true min/max for medical accuracy (no percentile capping).
    const minValue = numeric[0];
    const maxValue = numeric[numeric.length - 1];

    const range = maxValue - minValue;
    const padding = range === 0 ? 10 : range * 0.08;
    const domainMin = Math.max(0, minValue - padding);
    const domainMax = maxValue + padding;

    if (!Number.isFinite(domainMin) || !Number.isFinite(domainMax)) {
      return [0, 100];
    }

    return domainMin <= domainMax
      ? [domainMin, domainMax]
      : [domainMax, domainMin];
  };

  const efficacyAxisRanges = useMemo(() => {
    const xAxis = Array.isArray(efficacySafetyAPI?.chart?.x_axis)
      ? efficacySafetyAPI.chart.x_axis
      : [];
    const yAxis = Array.isArray(efficacySafetyAPI?.chart?.y_axis)
      ? efficacySafetyAPI.chart.y_axis
      : [];

    const parseRange = (row) => {
      const min = Number(row?.min);
      const max = Number(row?.max);
      const label = String(row?.label || "");
      return {
        label,
        min: Number.isFinite(min) ? min : null,
        max: Number.isFinite(max) ? max : null,
      };
    };

    const xParsed = xAxis.map(parseRange).filter((r) => r.label);
    const yParsed = yAxis.map(parseRange).filter((r) => r.label);

    const buildMap = (arr) => {
      const map = new Map();
      arr.forEach((row) => {
        map.set(row.label, row);
      });
      return map;
    };

    const computeGlobal = (arr) => {
      const mins = arr.map((r) => r.min).filter((v) => v !== null);
      const sortedMaxes = arr
        .map((r) => r.max)
        .filter((v) => v !== null)
        .sort((a, b) => b - a);
      return {
        min: mins.length ? Math.min(...mins) : null,
        max: sortedMaxes[0] ?? null,
        // Skip the single largest outlier; use 2nd-largest as the default display cap
        secondMax: sortedMaxes.length > 1 ? sortedMaxes[1] : (sortedMaxes[0] ?? null),
      };
    };

    return {
      x: { ...computeGlobal(xParsed), byLabel: buildMap(xParsed), list: xParsed },
      y: { ...computeGlobal(yParsed), byLabel: buildMap(yParsed), list: yParsed },
    };
  }, [efficacySafetyAPI]);

  const hasChartFiltersApplied = Boolean(
    filters.orr || filters.sae || selectedRegimens.length,
  );

  // Add buffer to both ends of a domain: max(2, 5% of the boundary value).
  // e.g. min=-35 → -35 - max(2, 1.75) = -37, max=44900 → 44900 + max(2, 2245) = 47145
  const padAxisDomain = (min, max) => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [min, max];
    const minBuf = Math.max(5, Math.abs(min) * 0.30);
    const maxBuf = Math.max(5, Math.abs(max) * 0.30);
    return [Math.max(0, min - minBuf), max + maxBuf];
  };

  const efficacyXDomain = useMemo(() => {
    const xAxisList = efficacyAxisRanges?.x?.list || [];
    const selectedSafetyMetric = resolveAxisSelection(filters?.sae, safetyMetrics);
    const axisRow =
      xAxisList.find((row) => row?.label === selectedSafetyMetric) ||
      xAxisList.find((row) => metricMatchesSelection(row?.label, selectedSafetyMetric)) ||
      null;

    if (hasUserSetSaeAxisRef.current && filters?.sae && axisRow) {
      const min = axisRow?.min;
      const max = axisRow?.max;
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return padAxisDomain(min, max);
      }
    }

    if (finalEfficacyData.length > 0) {
      return computeScatterDomain(finalEfficacyData.map((point) => point?.sae));
    }

    if (!filters?.sae) {
      // Initial load: overall min + second-largest max across all safety metrics
      const gMin = efficacyAxisRanges?.x?.min;
      const gMax = efficacyAxisRanges?.x?.secondMax;
      if (Number.isFinite(gMin) && Number.isFinite(gMax)) {
        return padAxisDomain(gMin, gMax);
      }
    }

    // Safety filter selected: use that metric's exact min/max
    const min = axisRow?.min ?? efficacyAxisRanges?.x?.min;
    const max = axisRow?.max ?? efficacyAxisRanges?.x?.secondMax;

    if (Number.isFinite(min) && Number.isFinite(max)) {
      return padAxisDomain(min, max);
    }

    return computeScatterDomain([]);
  }, [
    efficacyAxisRanges,
    filters?.sae,
    finalEfficacyData,
    hasChartFiltersApplied,
    safetyMetrics,
  ]);

  const efficacyYDomain = useMemo(() => {
    const yAxisList = efficacyAxisRanges?.y?.list || [];
    const selectedEfficacyMetric = resolveAxisSelection(filters?.orr, efficacyMetrics);
    const axisRow =
      yAxisList.find((row) => row?.label === selectedEfficacyMetric) ||
      yAxisList.find((row) => metricMatchesSelection(row?.label, selectedEfficacyMetric)) ||
      null;

    if (hasUserSetOrrAxisRef.current && filters?.orr && axisRow) {
      const min = axisRow?.min;
      const max = axisRow?.max;
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return padAxisDomain(min, max);
      }
    }

    if (finalEfficacyData.length > 0) {
      return computeScatterDomain(finalEfficacyData.map((point) => point?.orr));
    }

    if (!filters?.orr) {
      // Initial load: overall min + second-largest max across all efficacy metrics
      const gMin = efficacyAxisRanges?.y?.min;
      const gMax = efficacyAxisRanges?.y?.secondMax;
      if (Number.isFinite(gMin) && Number.isFinite(gMax)) {
        return padAxisDomain(gMin, gMax);
      }
    }

    // Efficacy filter selected: use that metric's exact min/max
    const min = axisRow?.min ?? efficacyAxisRanges?.y?.min;
    const max = axisRow?.max ?? efficacyAxisRanges?.y?.secondMax;

    if (Number.isFinite(min) && Number.isFinite(max)) {
      return padAxisDomain(min, max);
    }

    return computeScatterDomain([]);
  }, [
    efficacyAxisRanges,
    efficacyMetrics,
    filters?.orr,
    finalEfficacyData,
    hasChartFiltersApplied,
  ]);

  // Overlap detection is computed on-hover via value keys.

  // Build evenly spaced ticks between API min/max so the axis labels keep equal visual gaps.
  // We still format the labels with `formatAxisNumber`, so large values remain compact.
  const buildNiceTickScale = (min, max, count = 6) => {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : 0;

    if (count < 2) return { domain: [safeMin, safeMax], ticks: [safeMin] };
    if (safeMin === safeMax) return { domain: [safeMin, safeMax], ticks: [safeMin] };

    const range = safeMax - safeMin;
    if (!Number.isFinite(range) || range <= 0) {
      return { domain: [safeMin, safeMax], ticks: [safeMin, safeMax] };
    }

    const intervals = Math.max(1, count - 1);
    const step = range / intervals;
    const ticks = Array.from({ length: count }, (_, index) => {
      const value = safeMin + step * index;
      return parseFloat(value.toPrecision(12));
    });

    ticks[0] = safeMin;
    ticks[ticks.length - 1] = safeMax;

    return { domain: [safeMin, safeMax], ticks };
  };

  const efficacyXScale = useMemo(() => {
    return buildNiceTickScale(efficacyXDomain[0], efficacyXDomain[1], 6);
  }, [efficacyXDomain]);

  const efficacyYScale = useMemo(() => {
    return buildNiceTickScale(efficacyYDomain[0], efficacyYDomain[1], 6);
  }, [efficacyYDomain]);

  const efficacyXDisplayDomain = efficacyXScale.domain;

  const efficacyXGuideValues = [];

  const efficacyKnownBases = useMemo(() => {
    return Array.from(knownEfficacyBackboneBases || []);
  }, [knownEfficacyBackboneBases]);

  const efficacyActiveBases = useMemo(() => {
    return activeKeys.map((key) => getBaseBackbone(key)).filter(Boolean);
  }, [activeKeys]);

  const efficacyColorMap = useMemo(() => {
    const map = {};
    efficacyKnownBases.forEach((base) => {
      map[base] = pickTreatmentShade(base, 1);
    });
    return map;
  }, [efficacyKnownBases]);

	  // (Removed) ordinal X positioning. Plot uses true SAE values for accuracy.

  // const trialsCount =
  //   analytics?.efficacyvssafety?.[0]?.summary ??
  //   treatmentData?.efficacyvssafety?.[0]?.summary ??
  //   0;

  const trialsCount = efficacySafetyAPI?.summary || 0;
  const hasTreatmentStrategyData = useMemo(
    () =>
      (chartData || []).some((row) =>
        Object.keys(row || {})
          .filter((key) => key !== "year")
          .some((key) => Number(row[key]) > 0),
      ),
    [chartData],
  );
  const hasEfficacyData = finalEfficacyData.length > 0;
  const showTopFilterEmptyState =
    hasSharedFilters &&
    !graphLoading &&
    !hasTreatmentStrategyData &&
    Number(treatmentStrategiesAPI?.summary ?? 0) === 0 &&
    Number(trialsCount ?? 0) === 0;
  const showTreatmentStrategyEmptyState =
    !graphLoading && !hasTreatmentStrategyData;
  const showEfficacyEmptyState = !graphLoading && !hasEfficacyData;
  // This will first fetch from api if it will get then show that either from the json file for the root
  const rootFilters = useMemo(() => {
    const apiFilters = analytics?.filters || {};
    const jsonFilters = treatmentData?.filters || {};

    return {
      cancer_stage: apiFilters.cancer_stage?.length
        ? apiFilters.cancer_stage
        : jsonFilters.cancer_stage || [],

      line_of_therapy: apiFilters.line_of_therapy?.length
        ? apiFilters.line_of_therapy
        : jsonFilters.line_of_therapy || [],

      phase: apiFilters.phase?.length
        ? apiFilters.phase
        : jsonFilters.phase || [],

      countries: apiFilters.countries?.length
        ? apiFilters.countries
        : jsonFilters.countries || [],

      backbone: apiFilters.backbone?.length
        ? apiFilters.backbone
        : jsonFilters.backbone || [],
    };
  }, [analytics]);

  // console.log(rootFilters);

  const efficacyChartData = useMemo(() => {
    const source =
      finalEfficacyData.length > 0
        ? finalEfficacyData
        : [{ sae: 0, orr: 0, sizeValue: 0, backbone: "dummy" }];

    const sampled = source.length <= 1500 ? source : downsampleStratifiedByX(source, 1500);

    return sampled.map((point) => ({
      ...point,
      _saeJ: point.sae,
      _orrJ: point.orr,
    }));
  }, [finalEfficacyData]);

  const efficacyOverlapIndex = useMemo(() => {
    if ((efficacyChartData || []).length > 1500) return new Map();

    const map = new Map();
    (efficacyChartData || []).forEach((point, idx) => {
      const key = buildOverlapKey(point, efficacyXDomain, efficacyYDomain);
      if (!key) return;
      const arr = map.get(key);
      if (arr) arr.push(idx);
      else map.set(key, [idx]);
    });
    return map;
  }, [efficacyChartData, efficacyXDomain, efficacyYDomain]);

  const renderPhaseValue = (selected) => {
    if (!selected) {
      return (
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(0,0,0,0.7)",
            fontFamily: "Rubik",
          }}
        >
          Phase
        </Typography>
      );
    }

    // const raw = selected?.replace(/Phase\s*/i, "")?.trim();

    const romanMap = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };

    const romanToNumber = (r) => {
      if (!/[IVXLCDM]/i.test(r)) return r;
      let num = 0;
      r = r.toUpperCase();

      for (let i = 0; i < r.length; i++) {
        if (romanMap[r[i]] < romanMap[r[i + 1]]) {
          num -= romanMap[r[i]];
        } else {
          num += romanMap[r[i]];
        }
      }

      return num;
    };

    // const number = isNaN(raw) ? romanToNumber(raw) : raw;

    return (
      <div className={classes.tabContainer}>
        <span style={{ color: "#444", fontFamily: "Rubik" }}>Phase</span>
        <span
          style={{
            background: "rgba(199,223,255,1)",
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {/* {number} */}
        </span>
      </div>
    );
  };

  const handleOpenShare = useCallback(async () => {
    setOpenShareModal(true);
    setShareUrl("");
    setShareLoading(true);

    try {
      const shareFilters = normalizeTreatmentAnalyticsFilters({
        ...effectiveTopFilters,
        category: activeKeys,
        sub_category: selectedRegimens,
        modality: selectedRegimens, // Also send as modality for new API structure
        efficacyvssafety_x_axis: filters.sae,
        efficacyvssafety_y_axis: filters.orr,
      });
      const topSessionKey =
        sessionKey || initialSessionKey || currentSessionKeyRef.current;
      const result = await getTreatmentShareableUrl({
        top_session_key: topSessionKey,
        filters: shareFilters,
        tab_name: "treatment",
      });

      const newSessionKey = result?.session_key;
      if (!newSessionKey) return;

      const tabPath = result?.tab_name || "treatment";
      const url = `${window.location.origin}/trials/${tabPath}?share_id=${encodeURIComponent(newSessionKey)}`;

      setShareUrl(url);
    } catch (error) {
      console.error("Share failed", error);
    } finally {
      setShareLoading(false);
    }
  }, [
    activeKeys,
    effectiveTopFilters,
    filters.orr,
    filters.sae,
    initialSessionKey,
    selectedRegimens,
    sessionKey,
  ]);

  const handleCopy = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    const ownerId = "treatment";
    if(activeSubTab == "Treatment") {
      setShareAction({ ownerId, onClick: handleOpenShare });
    } else {
      clearShareAction(ownerId);
    }
    return () => clearShareAction(ownerId);
  }, [clearShareAction, handleOpenShare, setShareAction, activeSubTab]);

  return (
    <>
      <div className={classes.root}>
        <div className={classes.container}>
          <div
            className={classes.filterRow}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className={classes.filterLeft}>
              {/* <FilterSelect
                  value={filters.cancerStage}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      cancerStage: e.target.value,
                    }))
                  }
                  placeholder="Cancer Stage"
                  // options={
                  //   analytics?.filters?.cancer_stage?.length
                  //     ? analytics.filters.cancer_stage
                  //     : ["Stage I", "Stage II", "Stage III", "Stage IV"]
                  // }
                  options={rootFilters.cancer_stage || []}
                  onClear={() => clearSingleFilter("cancerStage")}
                  className={classes.treatment_select}
                /> */}

              {/* <FilterSelect
                  value={filters.line_of_therapy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      line_of_therapy: e.target.value,
                    }))
                  }
                  placeholder="Line of Therapy"
                  // options={analytics?.filters?.line_of_therapy || []}
                  options={rootFilters.line_intent || []}
                  onClear={() => clearSingleFilter("line_of_therapy")}
                  className={classes.treatment_select}
                /> */}

              <FilterSelect
                value={effectiveTopFilters.line_intent[0] || ""}
                onOpen={() => fetchFilterOptions("line_intent")}
                onChange={(e) => {
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...effectiveTopFilters,
                    line_intent: [e.target.value],
                  };

                  updateSharedFilters(updatedFilters);
                }}
                placeholder="Line of Therapy"
                options={withSelectedOption(
                  rootFilters1.line_intent || [],
                  effectiveTopFilters.line_intent[0] || "",
                )}
                onClear={() => clearSingleFilter("line_intent")}
                className={classes.treatment_select}
                loading={loading.line_intent}
              />
              <FilterSelect
                value={effectiveTopFilters.phases[0] ?? ""}
                onOpen={() => fetchFilterOptions("phases")}
                onChange={(e) => {
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...effectiveTopFilters,
                    phases: [e.target.value],
                  };
                  updateSharedFilters(updatedFilters);
                }}
                placeholder="Phase"
                options={withSelectedOption(
                  rootFilters1.phases || [],
                  effectiveTopFilters.phases[0] || "",
                )}
                onClear={() => clearSingleFilter("phases")}
                className={classes.treatment_select}
                // renderValue={renderPhaseValue}
                loading={loading.phases}
              />

              <FilterSelect
                value={effectiveTopFilters.stage[0] || ""}
                onOpen={() => fetchFilterOptions("stage")}
                onChange={(e) => {
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...effectiveTopFilters,
                    stage: [e.target.value],
                  };

                  updateSharedFilters(updatedFilters);
                }}
                placeholder="Cancer Stage"
                options={withSelectedOption(
                  rootFilters1.stage || [],
                  effectiveTopFilters.stage[0] || "",
                )}
                onClear={() => clearSingleFilter("stage")}
                className={classes.treatment_select}
                loading={loading.stage}
              />

              <FilterSelect
                value={effectiveTopFilters.locations[0] || ""}
                onOpen={() => fetchFilterOptions("locations")}
                onChange={(e) => {
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...effectiveTopFilters,
                    locations: [e.target.value],
                  };

                  updateSharedFilters(updatedFilters);
                }}
                placeholder="Country"
                searchable
                typeahead
                menuWidth={260}
                searchPlaceholder="Search country"
                options={withSelectedOption(
                  rootFilters1.locations || [],
                  effectiveTopFilters.locations[0] || "",
                )}
                onClear={() => clearSingleFilter("locations")}
                className={classes.treatment_select}
                loading={loading.locations}
              />

              {/* TOP FILTER TABS */}
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div className={classes.tabContainer}>
                  <div className={classes.tabSwitch}>
                    {[
                      { value: "Backbone", label: "Backbone" },
                      { value: "Modality", label: "Modality" },
                      { value: "MoA", label: "MoA" },
                    ].map((tab) => {
                      const isActive = tab.value === activeTab;

                      return (
                        <div
                          className={`${classes.tabItem} ${isActive ? classes.tabActive : classes.tabInactive
                            }`}
                          key={tab.value}
                          onClick={() => {
                            setActiveTab(tab.value);
                            // Reset to "Select All" for the newly active tab's own
                            // category list, instead of carrying over whatever
                            // subset was checked on the previous tab.
                            hasExplicitEmptyCategorySelectionRef.current = false;
                            hasRestoredCategoryRef.current = false;
                            setSelectedRegimens([]);
                          }}
                        >
                          {tab.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* </div> */}
              </div>
            </div>
          </div>

          {/* CHART + RIGHT FILTER OUTSIDE */}
          {graphLoading ? (
            <TreatmentStrategyGraphSkeleton />
          ) : (
            <div className={classes.chartRow} style={{ position: "relative" }}>
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
              {/* LEFT : CHART CARD */}
              <div className={classes.chartCard}>
                {/* TOP RIGHT TRIALS BUTTON */}
                <div className={classes.chartHeader}>
                  <div className={classes.chartTitle}>
                    Treatment Strategies (Last 10 Years)
                  </div>

                  <div className={classes.trialsButtonWrapper}>
                    <div
                      className={classes.trials_text}
                      onClick={() =>
                        hasTreatmentStrategyData &&
                        handleOpenDrawer({
                          table: ["treatment_strategies"],
                        })
                      }
                      style={{
                        cursor: hasTreatmentStrategyData
                          ? "pointer"
                          : "default",
                        opacity: hasTreatmentStrategyData ? 1 : 0.65,
                      }}
                    >
                      {Number(
                        treatmentStrategiesAPI?.summary ?? 0,
                      ).toLocaleString("en-US")}{" "}
                      Arms
                    </div>
                  </div>
                </div>

                <div
                  ref={efficacyChartWrapRef}
                  style={{ position: "relative", flex: 1 }}
                >
                  {showTreatmentStrategyEmptyState ? (
                    <EmptyGraphState
                      title={
                        showTopFilterEmptyState
                          ? "No treatment data for these filters"
                          : "No treatment strategy data available"
                      }
                      description={
                        showTopFilterEmptyState
                          ? "Try a broader phase, stage, line of therapy, or country selection."
                          : selectedRegimens.length
                            ? "No treatment strategies match the selected regimen filters."
                            : "This view does not have treatment strategy data for the current selection."
                      }
                      actionLabel={
                        showTopFilterEmptyState
                          ? "Clear top filters"
                          : selectedRegimens.length
                            ? "Reset chart selections"
                            : null
                      }
                      onAction={
                        showTopFilterEmptyState
                          ? clearTopFilters
                          : selectedRegimens.length
                            ? resetChartSelections
                            : null
                      }
                    />
                  ) : null}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData || []}
                      barCategoryGap="32%"
                      barGap={4}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 8,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid
                        stroke="rgba(0,0,0,0.12)"
                        strokeDasharray="4 4"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="year"
                        tick={axisTick}
                        tickLine={false}
                        label={{
                          value: "Years",
                          position: "bottom",
                          offset: 8,
                          style: {
                            fill: "rgba(0,0,0,0.4)",
                            fontSize: 12,
                            fontWeight: 400,
                            fontFamily: "Rubik",
                          },
                        }}
                      />

                      <YAxis
                        tick={axisTick}
                        tickLine={false}
                        domain={[0, finalMax]}
                        ticks={yAxisTicks}
                        label={{
                          value: "Arms",
                          angle: -90,
                          position: "insideLeft",
                          dx: -2,
                          style: {
                            fill: "rgba(0,0,0,0.4)",
                            fontSize: 12,
                            fontWeight: 400,
                            fontFamily: "Rubik",
                            textAnchor: "middle",
                          },
                        }}
                      />

                      {/* <Tooltip
                      content={<CustomTooltipBar selected={selected} />}
                      cursor={false}
                    /> */}

                      <Tooltip
                        content={<CustomTooltipBar selected={selected} />}
                        isAnimationActive={false}
                        allowEscapeViewBox={{ x: true, y: true }}
                        wrapperStyle={{
                          transition: "none",
                          overflow: "visible",
                          zIndex: 1000,
                        }}
                        cursor={false}
                        shared={false}
                      />

                      {(activeTab === "MoA"
                        ? selectedRegimens.length > 0
                          ? selectedRegimens
                          : visibleKeys
                        : selectedRegimens.length > 0
                          ? selectedRegimens
                        : activeKeys
                      ).map((key) => {
                        const dataKey =
                          activeTab === "MoA"
                            ? key.replace(/\s+/g, "")
                            : key;
                        return (
                          <Bar
                            key={dataKey}
                            dataKey={dataKey}
                            stackId="a"
                            fill={getStableStrategyKeyColor(key)}
                            maxBarSize={38}
                            background={false}
                          >
                            {(chartData || []).map((entry, index) => {
                              const isSelected =
                                selected &&
                                selected.key === key &&
                                selected.year === entry.year;

                              const isSameYear =
                                selected && selected.year === entry.year;

                              return (
                                <Cell
                                  key={index}
                                  fill={getStableStrategyKeyColor(key)}
                                  opacity={
                                    !selected
                                      ? 1
                                      : isSelected
                                        ? 1
                                        : isSameYear
                                          ? 0.2
                                          : 1
                                  }
                                  onClick={() => {
                                    if (
                                      selected?.key === key &&
                                      selected?.year === entry.year
                                    ) {
                                      setSelected(null);
                                    } else {
                                      setSelected({
                                        key,
                                        year: entry.year,
                                        color: getStableStrategyKeyColor(key),
                                      });
                                    }
                                  }}
                                  style={{ cursor: "pointer" }}
                                />
                              );
                            })}
                          </Bar>
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RIGHT : FILTER CARD */}
              <div className={classes.rightPanelWrapper}>
                {/* SCROLL AREA */}
                <div
                  className={classes.rightPanelCard}
                  style={{ position: "relative" }}
                >
                  {showTreatmentStrategyEmptyState ? (
                    // Intentionally no empty-state overlay here; keep filters usable even when chart has no data.
                    null
                  ) : null}
                  {activeTab === "Backbone" && (
                  <div className={classes.regimenComplexityHeader}>
                    <div className={classes.regimenComplexityTitle}>
                      Regimen complexity
                    </div>
                    <div
                      className={classes.regimenComplexityOptions}
                      style={{
                        opacity: isRegimenComplexityDisabled ? 0.45 : 1,
                        pointerEvents: isRegimenComplexityDisabled
                          ? "none"
                          : "auto",
                        filter: isRegimenComplexityDisabled
                          ? "grayscale(1)"
                          : "none",
                      }}
                    >
                      {(() => {
                          const isAllChecked =
                            uiRegimenComplexitySelection.size ===
                            REGIMEN_COMPLEXITY_KEYS.length;

                        const options = [
                          { key: "all", label: "All", color: "#2563EB" },
                          {
                            key: "1",
                            label: "1",
                            color: REGIMEN_COMPLEXITY_COLORS["1"],
                          },
                          {
                            key: "2",
                            label: "2",
                            color: REGIMEN_COMPLEXITY_COLORS["2"],
                          },
                          {
                            key: "3",
                            label: "3",
                            color: REGIMEN_COMPLEXITY_COLORS["3"],
                          },
                          {
                            key: "4+",
                            label: "4+",
                            color: REGIMEN_COMPLEXITY_COLORS["4+"],
                          },
                        ];

                        const handleToggle = (key) => {
                          lastRightPanelFilterChangedRef.current =
                            "regimen_complexity";
                          resetSessionContextForManualTopFilterChange();

                          const nextSelection =
                            getNextRegimenComplexitySelection(
                              uiRegimenComplexitySelection,
                              key,
                              REGIMEN_COMPLEXITY_KEYS,
                            );

                          setUiRegimenComplexitySelection(nextSelection);

                          // Defer expensive chart updates.
                          startTransition(() => {
                            setRegimenComplexitySelection(() => nextSelection);
                          });

                          // Debounce shared filter updates to avoid rerender storms.
                          pendingRegimenComplexitySharedUpdateRef.current =
                            nextSelection;

                          if (regimenComplexitySharedUpdateTimerRef.current) {
                            clearTimeout(
                              regimenComplexitySharedUpdateTimerRef.current,
                            );
                          }

                          regimenComplexitySharedUpdateTimerRef.current =
                            setTimeout(() => {
                              const selection =
                                pendingRegimenComplexitySharedUpdateRef.current;
                              const normalized =
                                selection && selection.size > 0
                                  ? Array.from(selection)
                                  : [];

                              startTransition(() => {
                                updateSharedFilters({
                                  ...effectiveTopFilters,
                                  regimen_complexity:
                                    normalizeSelectionFilter(normalized),
                                });
                              });
                            }, 150);
                        };

                        return options.map((option) => {
                          const isChecked =
                            option.key === "all"
                              ? isAllChecked
                              : uiRegimenComplexitySelection.has(option.key);

                          return (
                            <label
                              key={option.key}
                              className={classes.regimenComplexityOption}
                              style={{
                                cursor: isRegimenComplexityDisabled
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggle(option.key)}
                                style={{
                                  position: "absolute",
                                  opacity: 0,
                                  pointerEvents: "none",
                                }}
                              />
                              <span
                                className={classes.regimenComplexityBox}
                                style={{
                                  backgroundColor: isChecked
                                    ? option.color
                                    : "transparent",
                                  borderColor: isChecked
                                    ? option.color
                                    : "rgba(0,0,0,0.15)",
                                }}
                              >
                                {isChecked && (
                                  <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 16 16"
                                  >
                                    <path
                                      d="M6.2 11.2L3.3 8.3l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z"
                                      fill="white"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span className={classes.regimenComplexityLabel}>
                                {option.label}
                              </span>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  )}
                  <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
                    <div
                      style={{
                        width: 135,
                        minWidth: 135,
                        flexShrink: 0,
                        height: "100%",
                        opacity: isCategoryDisabled ? 0.45 : 1,
                        pointerEvents: isCategoryDisabled ? "none" : "auto",
                        filter: isCategoryDisabled ? "grayscale(1)" : "none",
                      }}
                    >
                      <CustomScrollbar
                        height="100%"
                        trackTop={TRACK_PAD}
                        trackBottom={TRACK_PAD_BOTTOM}
                        trackRight={-10}
                      >
                        <div style={{ paddingLeft: 4 }}>
                          <label className={classes.checkboxLabel}>
                            {/* hidden input */}
                            <input
                              type="checkbox"
                              checked={areAllStrategyKeysSelected}
                              onChange={() => {
                                lastRightPanelFilterChangedRef.current =
                                  "category";
                                resetSessionContextForManualTopFilterChange();
                                const nextActiveKeys =
                                  areAllStrategyKeysSelected
                                    ? []
                                    : strategySelectionKeys;
                                hasExplicitEmptyCategorySelectionRef.current =
                                  nextActiveKeys.length === 0;
                                const availableRegimens =
                                  getRegimensForCategoryKeys(nextActiveKeys);
                                const nextRegimens = selectedRegimens.filter(
                                  (regimen) =>
                                    availableRegimens.includes(regimen),
                                );
                                const updatedFilters = {
                                  ...effectiveTopFilters,
                                  category:
                                    normalizeSelectionFilter(nextActiveKeys),
                                  sub_category:
                                    normalizeSelectionFilter(nextRegimens),
                                };

                                setActiveKeys(nextActiveKeys);
                                setSelectedRegimens(nextRegimens);
                                updateSharedFilters(updatedFilters);
                              }}
                              style={{
                                position: "absolute",
                                opacity: 0,
                                pointerEvents: "none",
                              }}
                            />

                            {/* custom checkbox */}
                            <div
                              className={`${classes.checkboxBox} ${areAllStrategyKeysSelected
                                  ? classes.checkboxChecked
                                  : classes.checkboxUnchecked
                                }`}
                            >
                              {areAllStrategyKeysSelected && (
                                <svg
                                  width="100%"
                                  height="100%"
                                  viewBox="0 0 16 16"
                                >
                                  <path
                                    d="M6.2 11.2L3.3 8.3l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z"
                                    fill="white"
                                  />
                                </svg>
                              )}
                            </div>
                            <span style={{ fontSize: "14px" }}>Select All</span>
                          </label>
                        </div>
                        {sortedKeys.map((key, i) => {
                          const isChecked = activeKeys.includes(key);
                          const hasData = keyHasData(key);
                          const color = getStableStrategyKeyColor(key);
                          return (
                            <div key={key} style={{ paddingLeft: 4 }}>
                              <label className={classes.checkboxLabel}>
                                {/* Hidden native checkbox (for accessibility) */}
                                <input
                                  type="checkbox"
                                  disabled={!hasData}
                                  checked={hasData ? isChecked : false}
                                  onChange={() => hasData && toggleKey(key)}
                                  style={{
                                    position: "absolute",
                                    opacity: 0,
                                    pointerEvents: "none",
                                  }}
                                />

                                {/* Custom checkbox */}
                                <div
                                  className={`${classes.checkboxBox} ${!isChecked ? classes.checkboxUnchecked : ""
                                    }`}
                                  style={
                                    hasData && isChecked
                                      ? { backgroundColor: color }
                                      : { backgroundColor: "#E5E7EB" }
                                  }
                                >
                                  {isChecked && (
                                    <svg
                                      width="100%"
                                      height="100%"
                                      viewBox="0 0 16 16"
                                      style={{ display: "block" }}
                                    >
                                      {hasData && isChecked && (
                                        <svg
                                          width="100%"
                                          height="100%"
                                          viewBox="0 0 16 16"
                                        >
                                          <path
                                            d="M6.2 11.2L3.3 8.3l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z"
                                            fill="white"
                                          />
                                        </svg>
                                      )}
                                      <path
                                        d="M6.2 11.2L3.3 8.3l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z"
                                        fill="white"
                                      />
                                    </svg>
                                  )}
                                </div>

                                {/* Label */}
                                <span
                                  style={{
                                    opacity: hasData ? 1 : 0.5,
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {hasData ? formatFilterLabel(key) : "--"}
                                </span>
                              </label>

                              {/* <div
                              style={{
                                // height: 1,
                                background: "#E5E7EB",
                                marginBottom: 8,
                              }}
                            /> */}
                            </div>
                          );
                        })}
                      </CustomScrollbar>
                    </div>
                    {/* RECTANGLE CONTAINER */}
                    <div
                      style={{
                        border: "1px solid rgba(240, 246, 254, 1)",
                        borderRadius: 1,
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        width: 135,
                        minWidth: 135,
                        height: "100%",
                        opacity: isSubCategoryDisabled ? 0.45 : 1,
                        pointerEvents: isSubCategoryDisabled ? "none" : "auto",
                        filter: isSubCategoryDisabled ? "grayscale(1)" : "none",
                      }}
                    >
                      {/* SCROLL ONLY INSIDE */}
                      <CustomScrollbar
                        height="100%"
                        trackTop={10}
                        trackBottom={10}
                        trackRight={2}
                      >
                        <label className={classes.regimenItem}>
                          {/* Hidden native checkbox */}
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleAll}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: 1,
                              height: 1,
                              opacity: 0,
                              pointerEvents: "none",
                            }}
                          />

                          {/* Custom checkbox */}
                          <div
                            className={`
                          ${classes.regimencheckboxBox}
                          
                          ${isAllSelected
                                ? classes.regimencheckboxChecked
                                : classes.regimencheckboxUnchecked
                              }
                        `}
                          >
                            {isAllSelected && (
                              <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 16 16"
                                style={{ display: "block" }}
                              >
                                <path
                                  d="M6.2 11.2L3.3 8.3l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z"
                                  fill="white"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Label */}
                          <span style={{ fontSize: "14px" }}>
                            {activeTab === "Modality"
                              ? "All Small Molecules"
                              : activeTab === "MoA"
                                ? "All Inhibitors"
                                : "All"}
                          </span>
                        </label>

                        {regimens?.length === 0 ? (
                          <div className={classes.noRegimens}>
                            No regimens available
                          </div>
                        ) : (
                          sortedRegimens.map((r, i) => {
                            const isSelected = selectedRegimens.includes(r);
                            const normalizedKey = String(r || "")
                              .toLowerCase()
                              .trim();

                            const normalizedToken = normalizeFilterToken(r);
                            const categoryKeySet =
                              subCategoryToCategoryKeys?.[normalizedToken];
                            const categoryKeys = categoryKeySet
                              ? Array.from(categoryKeySet)
                              : [];

                            const resolvedCategoryKey =
                              categoryKeys.find((k) =>
                                strategySelectionKeys.includes(k),
                              ) ||
                              categoryKeys.find((k) => strategyKeys.includes(k)) ||
                              categoryKeys[0] ||
                              null;

                            const isSubcategoryRenderedSeries =
                              selectedRegimens.length > 0;

                            const color = isSubcategoryRenderedSeries
                              ? getStableStrategyKeyColor(r)
                              : resolvedCategoryKey
                                ? getStableStrategyKeyColor(resolvedCategoryKey)
                                : pickTreatmentShade(normalizedKey, 1);

                            return (
                              <label
                                key={r}
                                className={`${classes.regimenItem} ${i === sortedRegimens.length - 1
                                    ? classes.regimenItemLast
                                    : ""
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    lastRightPanelFilterChangedRef.current =
                                      "subcategory";
                                    const nextRegimens =
                                      selectedRegimens.includes(r)
                                        ? selectedRegimens.filter(
                                          (regimen) => regimen !== r,
                                        )
                                        : [...selectedRegimens, r];

                                    resetSessionContextForManualTopFilterChange();
                                    setSelectedRegimens(nextRegimens);
                                    updateSharedFilters({
                                      ...effectiveTopFilters,
                                      category:
                                        normalizeSelectionFilter(activeKeys),
                                      sub_category:
                                        normalizeSelectionFilter(nextRegimens),
                                    });
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: 1,
                                    height: 1,
                                    opacity: 0,
                                    pointerEvents: "none",
                                  }}
                                />

                                <div
                                  className={`${classes.regimencheckboxBox} ${!isSelected
                                      ? classes.regimencheckboxUnchecked
                                      : ""
                                    }`}
                                  style={
                                    isSelected
                                      ? { backgroundColor: color }
                                      : { backgroundColor: "#E5E7EB" }
                                  }
                                >
                                  {isSelected && (
                                    <svg
                                      width="100%"
                                      height="100%"
                                      viewBox="0 0 16 16"
                                    >
                                      <path
                                        d="M6.2 11.2L3.3 8.3l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z"
                                        fill="white"
                                      />
                                    </svg>
                                  )}
                                </div>

                                <span
                                  style={{
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {formatFilterLabel(r)}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </CustomScrollbar>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  TOP 2 BUBBLE CHARTS  */}
      <div className={classes.bubbleChartContainer}>
        <div className={classes.bubbleRow}>
          {/* Efficacy vs Safety  */}
          {graphLoading ? (
            <EfficacyVsSafetyGraphSkeleton />
          ) : (
            <div
              className={classes.bubbleCard}
              style={{ flex: "0 0 50%", maxWidth: "50%", position: "relative" }}
            >
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
              <div className={classes.bubbleHeader}>
                <div className={classes.bubbleTitle}>Efficacy vs Safety</div>

                <div className={classes.bubbleChartFilterRow}>
                  <FilterSelect
                    value={filters.orr}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      hasUserSetEfficacyAxisRef.current = true;
                      hasUserSetOrrAxisRef.current = true;
                      setFilters((prev) => ({
                        ...prev,
                        orr: nextValue,
                      }));
                      startTransition(() => {
                        updateSharedFilters({
                          ...effectiveTopFilters,
                          efficacyvssafety_x_axis: hasUserSetSaeAxisRef.current
                            ? effectiveTopFilters.efficacyvssafety_x_axis
                            : "",
                          efficacyvssafety_y_axis: nextValue,
                        });
                      });
                    }}
                    placeholder="ORR"
                    options={efficacyMetrics}
                    onClear={() => clearSingleFilter("orr")}
                    className={classes.treatment_select}
                    width={96}
                  />
                  <FilterSelect
                    value={filters.sae}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      hasUserSetEfficacyAxisRef.current = true;
                      hasUserSetSaeAxisRef.current = true;
                      setFilters((prev) => ({
                        ...prev,
                        orr: hasUserSetOrrAxisRef.current ? prev.orr : "",
                        sae: nextValue,
                      }));
                      startTransition(() => {
                        updateSharedFilters({
                          ...effectiveTopFilters,
                          efficacyvssafety_y_axis: hasUserSetOrrAxisRef.current
                            ? effectiveTopFilters.efficacyvssafety_y_axis
                            : "",
                          efficacyvssafety_x_axis: nextValue,
                        });
                      });
                    }}
                    placeholder="SAE"
                    options={safetyMetrics}
                    onClear={() => clearSingleFilter("sae")}
                    className={classes.treatment_select}
                    width={96}
                  />

                  <div
                    className={classes.trials_text}
                    onClick={() =>
                      hasEfficacyData &&
                      handleOpenDrawer({
                        table: ["efficacyvssafety"],
                      })
                    }
                    style={{
                      cursor: hasEfficacyData ? "pointer" : "default",
                      opacity: hasEfficacyData ? 1 : 0.65,
                    }}
                  >
                    {Number(trialsCount ?? 0).toLocaleString("en-US")} Arms
                  </div>
                </div>
              </div>

              <div ref={efficacyScatterWrapRef} style={{ position: "relative", flex: 1 }}>
                {showEfficacyEmptyState ? (
                  <EmptyGraphState
                    title={
                      showTopFilterEmptyState
                        ? "No efficacy data for these filters"
                        : "No efficacy data for this selection"
                    }
                    description={
                      showTopFilterEmptyState
                        ? "Try broadening the top filters to bring comparable treatment data back."
                        : hasChartFiltersApplied
                          ? "Try clearing ORR, SAE, or regimen selections to see matching points."
                          : "This view does not have efficacy and safety points for the current selection."
                    }
                    actionLabel={
                      showTopFilterEmptyState
                        ? "Clear top filters"
                        : hasChartFiltersApplied
                          ? "Reset chart selections"
                          : null
                    }
                    onAction={
                      showTopFilterEmptyState
                        ? clearTopFilters
                        : hasChartFiltersApplied
                          ? resetChartSelections
                          : null
                    }
                  />
                ) : null}
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 10, right: 24, left: 18, bottom: 50 }}
                    overflow="hidden"
                  >
                    {/* Horizontal grid: dashed */}
                    <CartesianGrid
                      stroke="rgba(0,0,0,0.12)"
                      strokeDasharray="4 4"
                      vertical={false}
                      horizontal={true}
                    />
                    {/* Vertical grid: solid */}
                    <CartesianGrid
                      stroke="rgba(0,0,0,0.12)"
                      vertical={true}
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      dataKey="_saeJ"
                      name="SAE"
                      tick={axisTick}
                      tickFormatter={formatAxisNumber}
                      tickLine={false}
                      tickMargin={10}
                      height={20}
                      padding={{ left: 16, right: 16 }}
                      domain={efficacyXDisplayDomain}
                      ticks={efficacyXScale.ticks}
                      allowDataOverflow={true}
                      label={{
                        value: displayedSafetyMetric,
                        position: "bottom",
                        offset: 32,
                        ...axisLabel,
                      }}
                    />

                    <YAxis
                      type="number"
                      dataKey="_orrJ"
                      name="ORR"
                      tick={axisTick}
                      tickFormatter={formatAxisNumber}
                      tickLine={false}
                      tickMargin={10}
                      width={64}
                      padding={{ top: 15, bottom: 20 }}
                      domain={efficacyYScale.domain}
                      ticks={efficacyYScale.ticks}
                      allowDataOverflow={true}
                      label={{
                        value: displayedEfficacyMetric,
                        angle: -90,
                        position: "insideLeft",
                        dx: -14,
                        style: {
                          ...axisLabel,
                          textAnchor: "middle",
                        },
                      }}
                    />

                    {/* Tooltip rendered as overlay outside chart — see EfficacyTooltipOverlay below */}

                    <ZAxis dataKey="sizeValue" range={[80, 620]} />

                    <Scatter
                      data={efficacyChartData}
                      dataKey="_saeJ"
                      xAxisId={0}
                      yAxisId={0}
                      zAxisId={0}
                      isAnimationActive={false}
                      shape={(props) => {
                        const d = props.payload;
                        if (!d || d.backbone === "dummy") return null;

                        const cx =
                          Number.isFinite(props.cx)
                            ? props.cx
                            : Number.isFinite(props.x) && Number.isFinite(props.width)
                              ? props.x + props.width / 2
                              : null;
                        const cy =
                          Number.isFinite(props.cy)
                            ? props.cy
                            : Number.isFinite(props.y) && Number.isFinite(props.height)
                              ? props.y + props.height / 2
                              : null;

                        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

                        const n = Number(d.n) || 0;
                        const r = Math.max(6, Math.min(14, Math.sqrt(n) * 0.4));

                        const base = getBaseBackbone(d.backbone);
                        const backboneLower = String(d.backbone || "").toLowerCase().trim();
                        const isUnknownBackbone =
                          !base || base === "unknown" || backboneLower === "unknown";

                        const bubbleMatchesKey = (k) => {
                          const kLower = String(k || "").toLowerCase().trim();
                          const kBase = getBaseBackbone(k);
                          return (
                            kLower === backboneLower ||
                            kLower === base ||
                            kBase === base ||
                            kBase === backboneLower
                          );
                        };

                        // hasCategoryFilterApplied = true only when user has deselected at least one key
                        const isActive =
                          !hasCategoryFilterApplied ||
                          isUnknownBackbone ||
                          activeKeys.some(bubbleMatchesKey) ||
                          (selectedRegimens.length > 0 && selectedRegimens.some(bubbleMatchesKey));

                        if (!isActive) return null;

                        // Match the exact same color as the bar chart for active bubbles
                        const matchingKey = activeKeys.find(bubbleMatchesKey)
                          || strategySelectionKeys.find(bubbleMatchesKey);
                        const fill = getStableStrategyKeyColor(matchingKey || d.backbone || base || "unknown");

                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill={fill}
                            fillOpacity={0.56}
                            stroke="rgba(255,255,255,0.72)"
                            strokeWidth={0.8}
                            onMouseEnter={() => {
                              clearTimeout(efficacyTooltipTimeoutRef.current);

                              const overlapKey = buildOverlapKey(d, efficacyXDomain, efficacyYDomain);
                              const idxs = overlapKey ? efficacyOverlapIndex.get(overlapKey) : null;
                              const allItems = idxs?.length
                                ? idxs.map((i) => efficacyChartData[i]).filter(Boolean)
                                : [d];
                              const items = hasCategoryFilterApplied
                                ? allItems.filter((item) => {
                                    const bl = String(item.backbone || "").toLowerCase().trim();
                                    const bb = getBaseBackbone(item.backbone);
                                    return activeKeys.some((k) => {
                                      const kl = String(k || "").toLowerCase().trim();
                                      const kb = getBaseBackbone(k);
                                      return kl === bl || kl === bb || kb === bb || kb === bl;
                                    });
                                  })
                                : allItems;
                              const deduped = dedupeOverlapItems(items.length ? items : [d]);
                              const safeItems = deduped.length ? deduped : [d];

                              const _cx = cx ?? 0;
                              const _cy = cy ?? 0;
                              const _containerH = efficacyScatterWrapRef.current?.clientHeight ?? 9999;
                              const TOOLTIP_H = 310;
                              const _yPos = _cy + TOOLTIP_H > _containerH
                                ? Math.max(0, _cy - TOOLTIP_H - 10)
                                : _cy - 10;

                              // Update refs — no parent re-render, only overlay re-renders
                              efficacyTooltipDataRef.current = { active: true, items: safeItems };
                              efficacyTooltipPositionRef.current = { x: _cx + 14, y: _yPos };
                              efficacyTooltipTriggerRef.current?.();
                            }}
                            onMouseLeave={() => {
                              clearTimeout(efficacyTooltipTimeoutRef.current);
                              efficacyTooltipTimeoutRef.current = setTimeout(() => {
                                efficacyTooltipDataRef.current = { active: false, items: [] };
                                efficacyTooltipPositionRef.current = null;
                                efficacyTooltipTriggerRef.current?.();
                              }, 200);
                            }}
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                <EfficacyTooltipOverlay
                  dataRef={efficacyTooltipDataRef}
                  positionRef={efficacyTooltipPositionRef}
                  triggerRef={efficacyTooltipTriggerRef}
                  timeoutRef={efficacyTooltipTimeoutRef}
                  activeTab={activeTab}
                />
              </div>
            </div>
          )}

          {/*  Frequency vs Safety  */}
          {/* <div
              style={{
                opacity: "0.5",
            }}
            className={classes.bubbleCard}
          >
            <div className={classes.bubbleHeader}>
              <div className={classes.bubbleTitle}>Frequency vs Safety</div>

              <div className={classes.bubbleChartFilterRow}>
                <div
                  className={classes.trials_text}
                  onClick={() => !showTopFilterEmptyState && setOpenDrawer(true)}
                  style={{
                    cursor: showTopFilterEmptyState ? "default" : "pointer",
                    opacity: showTopFilterEmptyState ? 0.65 : 1,
                  }}
                >
                  {Number(172 ?? 0).toLocaleString("en-US")} Trials
                </div>
              </div>
            </div>
            <div style={{ position: "relative", flex: 1 }}>
              {showTopFilterEmptyState ? (
                <EmptyGraphState
                  title="No frequency data for these filters"
                  description="Try clearing the top filters to bring matching treatment data back into all graph views."
                  actionLabel="Clear top filters"
                  onAction={clearTopFilters}
                />
              ) : null}
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
              >
                <CartesianGrid
                  stroke="rgba(0,0,0,0.12)"
                  strokeDasharray="4 4"
                />

                <XAxis
                  type="number"
                  dataKey="sae"
                  name="SAE"
                  tick={axisTick}
                  tickLine={false}
                  domain={[3.2, -0.2]}
                  ticks={[3, 2.5, 0.5, 2, 0.1, 1.5, 1]}
                  allowDataOverflow={true}
                  interval={0}
                  label={{
                    value: "SAE",
                    position: "bottom",
                    offset: 10,
                    ...axisLabel,
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="trials"
                  name="Trials"
                  tick={axisTick}
                  tickLine={false}
                  label={{
                    value: "Number of Trials (Frequency)",
                    angle: -90,
                    position: "insideLeft",
                    dx: 0, // push label slightly left
                    style: {
                      ...axisLabel,
                      textAnchor: "middle",
                    },
                  }}
                />

                <ZAxis type="number" dataKey="trials" range={[60, 400]} /> */}

          {/* <Tooltip content={(props) => <CustomTooltip {...props} />} /> */}
          {/* <Tooltip
                  content={(props) => {
                    if (!props.active) return null;

                    return (
                      <div
                        onMouseEnter={() => {
                          clearTimeout(bubbleTooltipTimeoutRef.current);
                        }}
                        onMouseLeave={() => {
                          clearTimeout(bubbleTooltipTimeoutRef.current);
                          bubbleTooltipTimeoutRef.current = setTimeout(() => {
                            setBubbleScatterTooltip({
                              active: false,
                              payload: null,
                            });
                          }, 200);
                        }}
                      >
                        <CustomTooltip {...props} />
                      </div>
                    );
                  }}
                  active={bubbleScatterTooltip.active}
                  payload={
                    bubbleScatterTooltip.payload
                      ? [{ payload: bubbleScatterTooltip.payload }]
                      : []
                  }
                  isAnimationActive={false}
                  allowEscapeViewBox={{ x: false, y: false }}
                  wrapperStyle={{
                    transition: "none",
                    pointerEvents: "auto",
                  }}
                />

                {sortedKeys.map((key) => {
                  const isActive = activeKeys.includes(key);

                  return (
                    <Scatter
                      key={key}
                      data={filteredBubbleData}
                      shape={(props) => {
                        const d = props.payload;

                        if (d.backbone !== key) return null;

                        const trials = d.trials || 100;
                        const r = Math.sqrt(trials / Math.PI);

                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={r}
	                            fill={
	                              isActive
	                                ? pickTreatmentShade(String(key || "").toLowerCase().trim(), 1)
	                                : "#D1D5DB"
	                            }
                            stroke="#F0F0F3"
                            onMouseEnter={() => {
                              clearTimeout(bubbleTooltipTimeoutRef.current);
                              setBubbleScatterTooltip({
                                active: true,
                                payload: d,
                              });
                            }}
                            onMouseLeave={() => {
                              clearTimeout(bubbleTooltipTimeoutRef.current);
                              bubbleTooltipTimeoutRef.current = setTimeout(() => {
                                setBubbleScatterTooltip({
                                  active: false,
                                  payload: null,
                                });
                              }, 200);
                            }}
                          />
                        );
                      }}
                    />
                  );
                })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div> */}
        </div>
      </div>
      {/* </div> */}
      {/* </div> */}

      <CommonRightDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onBack={handleBack}
        title={
          !viewSummary &&
          `${isEfficacyTable ? "Efficacy vs Safety" : "Treatment Strategies"}`
        }
        width={950}
        paperSx={{
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "1px 8px 34px 0px rgba(153, 169, 190, 0.1)",
        }}
        onContentScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.target;
          handleTreatmentTableScroll(scrollTop, scrollHeight, clientHeight);
        }}
        rightHeader={
          !viewSummary && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              {/* Data Traceability (FIRST) */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Switch
                  checked={isAlertActive || false}
                  onChange={(e) => dispatch(toggleAlert(e.target.checked))}
                  sx={{
                    width: 44,
                    height: 25,
                    padding: 0,
                    '& .MuiSwitch-switchBase': {
                      padding: '2px',
                      '&.Mui-checked': {
                        color: '#fff',
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#2563EB',
                          opacity: 1,
                        },
                      },
                    },
                    '& .MuiSwitch-thumb': {
                      width: 20,
                      height: 20,
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: '#D1D5DB',
                      opacity: 1,
                      borderRadius: 14,
                    },
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  Data Traceability
                </span>
              </div>

              {/* Study / Results toggle (MIDDLE) - only for efficacy table */}
              {isEfficacyTable && (
                <div
                  role="tablist"
                  aria-label="Drawer view toggle"
                  style={{
                    display: "inline-flex",
                    borderRadius: 4,
                    border: "1.5px solid rgba(184, 212, 249, 1)",
                    overflow: "hidden",
                    background: "#fff",
                    opacity: 0.55,
                  }}
                >
                  {["study", "results"].map((mode) => {
                    const active = view === mode;
                    return (
                      <button
                        key={mode}
                        disabled
                        style={{
                          padding: "6px 10px",
                          border: "none",
                          background: active ? "rgba(38, 102, 190, 1)" : "transparent",
                          color: active ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 0.7)",
                          fontWeight: 500,
                          cursor: "not-allowed",
                          fontFamily: "Rubik",
                          fontSize: 14,
                        }}
                      >
                        {mode === "study" ? "Study" : "Results"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Download CSV (RIGHT) */}
              <div
                onClick={isDownloadingCSV ? undefined : handleDownloadCSV}
                aria-busy={isDownloadingCSV}
                style={{
                  ...styles.download,
                  opacity: isDownloadingCSV ? 0.7 : 1,
                  cursor: isDownloadingCSV ? "not-allowed" : "pointer",
                }}
              >
                {isDownloadingCSV ? (
                  <CircularProgress size={16} thickness={5} sx={{ color: "#2666BE" }} />
                ) : (
                  <img
                    src={downloadIcon}
                    alt="download"
                    style={{ width: 16, height: 16 }}
                  />
                )}
                {isDownloadingCSV ? "Downloading..." : "Download CSV"}
              </div>
            </div>
          )
        }
      >
        {!viewSummary ? (
          // drawerData?.efficacyvssafety_table?.views?.study?.sections?.map(
          //   (item, index) => (
          <TreatmentStrategies
            filters={filters}
            apiFilters={topFilters}
            data={tableRows}
            activeTable={activeTable}
            view={view}
            drawerLoading={drawerLoading}
            sessionKey={currentSessionKey}
            onSelect={(nct_id) => setViewSummary(nct_id)}
            isFetchingMore={isFetchingMoreRows}
          />
        ) : (
          <ExecuiteSummaryDrawer nctId={viewSummary} sessionKey={currentSessionKey} />
        )}
      </CommonRightDrawer>

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
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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

        {/* INPUT + COPY */}
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
            value={shareUrl}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: "12px",
                color: "rgba(0,0,0,0.6)",
                fontFamily: "Rubik",
              },
            }}
          />

          <div style={{ position: "relative" }}>
            <IconButton
              onClick={handleCopy}
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
                  width: 32,   // 🔥 FIX THIS (not 32)
                  height: 32,
                }}
              />
            </IconButton>

            {/* ✅ COPIED TOOLTIP */}
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


