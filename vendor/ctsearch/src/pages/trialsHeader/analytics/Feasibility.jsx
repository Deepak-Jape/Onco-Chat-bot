import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import TreatmentStrategies from "./TreatmentStrategies";
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
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ZAxis,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import Flag from "react-world-flags";
import { styles } from "./style";

import timeData from "./timeToPrimaryData.json";
import {
  getFeasibilityAnalytics,
  getFeasibilityShareableUrl,
  normalizeFeasibilityAnalyticsFilters,
} from "../../../api/analytics/feasibility";
import { useShareAction } from "./ShareActionContext";
import { fea_styles } from "./style";
import { downloadIcon } from "../../../assets";
// import ReactECharts from "echarts-for-react";
import { ReferenceDot } from "recharts";
const ReactECharts = lazy(() => import("echarts-for-react"));
import crown from "../../../assets/crown.svg";
// import { FLAG_MAP } from "../../../assets/flags";
import CustomScrollbar from "../../../common/CustomScrollbar";
import FilterSelect from "../../../common/FilterSelect";

import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import Copyicon from "../../../assets/icons/Copy.svg";
import {
  getAnalyticsSharedFiltersFromSearchParams,
  getSessionKeyFromSearchParams,
  getSharedSessionFallbackFilters,
  isDefaultSearchSession,
  // setSessionKeySearchParam,
} from "../../../utils/trialsUrlState";

countries.registerLocale(en);
import CommonRightDrawer from "../../../common/CommonRightDrawer";
import ExecuiteSummaryDrawer from "./ExecuiteSummaryDrawer";
import FeasibilityStrategies from "./FeasibilityStrategies";
import CompetitionChartSkeleton from "./CompetitionChartSkeleton";
import EnrollmentSpeedGraphSkeleton from "./EnrollmentSpeedGraphSkeleton";
import AmendmentRiskGraphSkeleton from "./AmendmentRiskGraphSkeleton";
import { useDispatch, useSelector } from "react-redux";
import { toggleAlert } from "../../../redux/trialsSlice";
import { setSharedChipFilters, setAnalyticsSessionKey } from "../../../redux/trialsDataSlice";

const COMPETITION_Y_PADDING_BOTTOM = 22;

const AMENDMENT_COLOR_FAMILIES = [
  ["rgba(144, 164, 174, 1)", "rgba(96, 125, 139, 1)", "rgba(44, 95, 110, 1)"],
  ["rgba(241, 87, 87, 1)", "rgba(193, 70, 70, 1)", "rgba(145, 52, 52, 1)"],
  ["rgba(241, 128, 16, 1)", "rgba(193, 102, 13, 1)", "rgba(145, 77, 10, 1)"],
  ["rgba(205, 174, 163, 1)", "rgba(159, 136, 128, 1)", "rgba(122, 104, 97, 1)"],
  ["rgba(188, 170, 240, 1)", "rgba(142, 124, 195, 1)", "rgba(109, 95, 150, 1)"],
  ["rgba(166, 228, 169, 1)", "rgba(129, 199, 132, 1)", "rgba(75, 145, 78, 1)"],
  ["rgba(141, 219, 212, 1)", "rgba(83, 186, 176, 1)", "rgba(40, 146, 136, 1)"],
];

const normalizePhaseValue = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed === "N/A") return trimmed;
  if (!trimmed.toLowerCase().startsWith("phase ")) return trimmed;

  const raw = trimmed.slice("Phase ".length).trim();
  if (!raw) return trimmed;

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return `Phase ${asNumber}`;
  }

  const romanMap = { I: 1, V: 5, X: 10 };
  const roman = raw.toUpperCase();
  let total = 0;
  let prev = 0;

  for (let idx = roman.length - 1; idx >= 0; idx -= 1) {
    const current = romanMap[roman[idx]];
    if (!current) return trimmed;

    if (current < prev) {
      total -= current;
    } else {
      total += current;
      prev = current;
    }
  }

  return total ? `Phase ${total}` : trimmed;
};

const normalizeFilterOptionArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item) => item !== null && item !== undefined && item !== "",
    );
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [value];
};

const normalizeAnalyticsFilterOptions = (apiFilters = {}) => {
  const scopedFilters =
    apiFilters?.graph_filters || apiFilters?.top_filters || apiFilters || {};

  return {
    stage: normalizeFilterOptionArray(
      scopedFilters.stage || scopedFilters.cancer_stage,
    ),
    line_intent: normalizeFilterOptionArray(
      scopedFilters.line_intent || scopedFilters.line_of_therapy,
    ),
    phases: normalizeFilterOptionArray(
      scopedFilters.phases || scopedFilters.phase,
    ).map(normalizePhaseValue),
    locations: normalizeFilterOptionArray(
      scopedFilters.locations || scopedFilters.countries,
    ),
    counties: normalizeFilterOptionArray(scopedFilters.counties).map((value) =>
      typeof value === "string" ? value.split("(")[0].trim() : value,
    ),
    ammendments: normalizeFilterOptionArray(
      scopedFilters.ammendments || scopedFilters.amendments,
    ),
  };
};

const normalizeFeasibilityMetricFilterOptions = (apiMetrics = {}) => {
  const scopedMetrics = apiMetrics?.metrics || apiMetrics || {};

  return {
    stage: normalizeFilterOptionArray(
      scopedMetrics.cancer_type || scopedMetrics.cancer_stage || scopedMetrics.stage,
    ),
    line_intent: normalizeFilterOptionArray(
      scopedMetrics.line_of_treatment ||
        scopedMetrics.line_of_therapy ||
        scopedMetrics.line_intent,
    ),
    phases: normalizeFilterOptionArray(scopedMetrics.phase || scopedMetrics.phases).map(
      normalizePhaseValue,
    ),
    locations: normalizeFilterOptionArray(
      scopedMetrics.countries || scopedMetrics.locations || scopedMetrics.country,
    ),
  };
};

const normalizeComparableString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
};

const filterFeasibilityGraphPoints = (points = [], filters = {}) => {
  if (!Array.isArray(points) || !points.length) return [];

  const selectedStage = Array.isArray(filters.stage) ? filters.stage : [];
  const selectedLineIntent = Array.isArray(filters.line_intent)
    ? filters.line_intent
    : [];
  const selectedPhases = Array.isArray(filters.phases)
    ? filters.phases.map(normalizePhaseValue)
    : [];

  const shouldFilterStage = selectedStage.length > 0;
  const shouldFilterLine = selectedLineIntent.length > 0;
  const shouldFilterPhase = selectedPhases.length > 0;

  if (!shouldFilterStage && !shouldFilterLine && !shouldFilterPhase) {
    return points;
  }

  const canFilterStage =
    !shouldFilterStage ||
    points.some(
      (point) =>
        Array.isArray(point?.cancer_type) && point.cancer_type.length > 0,
    );
  const canFilterLine =
    !shouldFilterLine ||
    points.some(
      (point) =>
        (Array.isArray(point?.line_of_treatment) && point.line_of_treatment.length > 0) ||
        (Array.isArray(point?.line_intent) && point.line_intent.length > 0) ||
        (Array.isArray(point?.line_of_therapy) && point.line_of_therapy.length > 0),
    );
  const canFilterPhase =
    !shouldFilterPhase ||
    points.some(
      (point) => Array.isArray(point?.phase) && point.phase.length > 0,
    );

  const normalizedSelectedStage = selectedStage.map(normalizeComparableString);
  const normalizedSelectedLine = selectedLineIntent.map(
    normalizeComparableString,
  );
  const normalizedSelectedPhases = selectedPhases.map((value) =>
    normalizeComparableString(normalizePhaseValue(value)),
  );

  return points.filter((point) => {
    const cancerTypes = Array.isArray(point?.cancer_type)
      ? point.cancer_type
      : [];
    const lineOfTreatment = Array.isArray(point?.line_of_treatment) && point.line_of_treatment.length > 0
      ? point.line_of_treatment
      : Array.isArray(point?.line_intent) && point.line_intent.length > 0
      ? point.line_intent
      : Array.isArray(point?.line_of_therapy) && point.line_of_therapy.length > 0
      ? point.line_of_therapy
      : [];
    const phases = Array.isArray(point?.phase)
      ? point.phase.map(normalizePhaseValue)
      : [];

    if (shouldFilterStage && canFilterStage) {
      const normalizedCancerTypes = cancerTypes.map(normalizeComparableString);
      const matchesStage = normalizedSelectedStage.some((value) =>
        normalizedCancerTypes.includes(value),
      );
      if (!matchesStage) return false;
    }

    if (shouldFilterLine && canFilterLine) {
      const normalizedLineOfTreatment = lineOfTreatment.map(
        normalizeComparableString,
      );
      const matchesLine = normalizedSelectedLine.some((value) =>
        normalizedLineOfTreatment.includes(value),
      );
      if (!matchesLine) return false;
    }

    if (shouldFilterPhase && canFilterPhase) {
      const normalizedPointPhases = phases.map((value) =>
        normalizeComparableString(normalizePhaseValue(value)),
      );
      const matchesPhase = normalizedSelectedPhases.some((value) =>
        normalizedPointPhases.includes(value),
      );
      if (!matchesPhase) return false;
    }

    return true;
  });
};

const filterFeasibilityGraph = (graphData, filters) => {
  if (!graphData?.chart) return graphData;

  const points = graphData.chart?.points || [];
  const filteredPoints = filterFeasibilityGraphPoints(points, filters);

  if (filteredPoints === points) return graphData;

  return {
    ...graphData,
    chart: {
      ...graphData.chart,
      points: filteredPoints,
    },
  };
};

const createEmptyTopFilters = () => ({
  stage: [],
  line_intent: [],
  phases: [],
  locations: [],
  counties: [],
  ammendments: [],
});

const FEASIBILITY_GRAPH_KEYS = [
  "competitionintensity",
  "amendment_graph",
  "trial_duration_country",
];

const unwrapFeasibilityValue = (value, fallback = "") => {
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return value.value ?? fallback;
  }

  return value ?? fallback;
};

const getFeasibilityField = (row, keys, fallback = "") => {
  const sourceKey = keys.find((key) => row?.[key] !== undefined && row?.[key] !== null);
  return unwrapFeasibilityValue(sourceKey ? row[sourceKey] : undefined, fallback);
};

const getFeasibilityEvidenceField = (row, keys) => {
  const sourceKey = keys.find((key) => row?.[key] !== undefined && row?.[key] !== null);
  const rawValue = sourceKey ? row[sourceKey] : undefined;

  return {
    rawValue,
    value: unwrapFeasibilityValue(rawValue, ""),
  };
};

const normalizeFeasibilityDrawerRow = (row = {}) => {
  const regimenField = getFeasibilityEvidenceField(row, ["regimen", "Regimen"]);
  const countriesField = getFeasibilityEvidenceField(row, ["countries", "Countries"]);
  const countriesList = Array.isArray(countriesField.value)
    ? countriesField.value
    : countriesField.value
      ? [countriesField.value]
      : [];
  const regimenValue = Array.isArray(regimenField.value)
    ? regimenField.value
    : regimenField.value
      ? [regimenField.value]
      : [];

  return {
    ...row,
    id: row.id || row.oncosuite_id || row.oncosuiteId || row.oncosuite_id,
    oncosuite_id: getFeasibilityField(row, ["oncosuite_id", "oncosuiteId", "OncoSuiteID"], ""),
    oncosuite_id_evidence: getFeasibilityEvidenceField(
      row,
      ["oncosuite_id", "oncosuiteId", "OncoSuiteID"],
    ).rawValue,
    trial_name: getFeasibilityField(row, ["trial_name", "TrialName", "trialName"], ""),
    trial_name_evidence: getFeasibilityEvidenceField(
      row,
      ["trial_name", "TrialName", "trialName"],
    ).rawValue,
    regimen: regimenValue,
    regimen_evidence: regimenField.rawValue,
    countries: countriesList,
    countries_evidence: countriesField.rawValue,
    patients_per_month_site: getFeasibilityField(
      row,
      ["patients_per_month_site", "PatientsPerMonthSite", "patients_per_month_per_site"],
      "",
    ),
    patients_per_month_site_evidence: getFeasibilityEvidenceField(
      row,
      ["patients_per_month_site", "PatientsPerMonthSite", "patients_per_month_per_site"],
    ).rawValue,
    site_count: getFeasibilityField(row, ["site_count", "SiteCount", "Sites"], ""),
    site_count_evidence: getFeasibilityEvidenceField(row, ["site_count", "SiteCount", "Sites"])
      .rawValue,
    planned_patients: getFeasibilityField(row, ["planned_patients", "PlannedPatients"], ""),
    planned_patients_evidence: getFeasibilityEvidenceField(
      row,
      ["planned_patients", "PlannedPatients"],
    ).rawValue,
    completed_patients: getFeasibilityField(row, ["completed_patients", "CompletedPatients"], ""),
    completed_patients_evidence: getFeasibilityEvidenceField(
      row,
      ["completed_patients", "CompletedPatients"],
    ).rawValue,
  };
};

const normalizeSharedFilterEntry = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeSharedFiltersForCompare = (filters = {}) =>
  Object.keys(createEmptyTopFilters()).reduce((normalizedFilters, key) => {
    const values = Array.isArray(filters[key]) ? filters[key] : [];

    normalizedFilters[key] = values
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(normalizeSharedFilterEntry)
      .sort((left, right) => String(left).localeCompare(String(right)));

    return normalizedFilters;
  }, createEmptyTopFilters());

const areSharedFiltersEquivalent = (leftFilters = {}, rightFilters = {}) =>
  JSON.stringify(normalizeSharedFiltersForCompare(leftFilters)) ===
  JSON.stringify(normalizeSharedFiltersForCompare(rightFilters));

const hasFeasibilitySharedFilters = (filters = {}) =>
  Object.values(normalizeSharedFiltersForCompare(filters)).some(
    (value) => value.length > 0,
  );

const createFeasibilityFetchKey = (filters = {}, sessionKey = "") =>
  JSON.stringify({
    sessionKey: sessionKey || "",
    filters: normalizeSharedFiltersForCompare(filters),
  });

const EmptyGraphState = ({ title, description, actionLabel, onAction }) => (
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

// ---- Trial Duration by Country chart (stacked-bar) ----
const TD_COLOR = {
  black800: "rgba(0,0,0,0.8)",
  black700: "rgba(0,0,0,0.7)",
  black400: "rgba(0,0,0,0.4)",
  info200: "#dce9fc",
  info600: "#2666be",
  segment1: "#778548", // Study startup
  segment2: "#9aa733", // Recruitment window
  segment3: "#c9ca03", // Analytics & data lock
};

const TD_RISK = {
  veryHigh: { label: "Very High", bg: "#c34941" },
  high: { label: "High", bg: "#e0865d" },
  medium: { label: "Medium", bg: "#f0af29" },
  low: { label: "Low", bg: "#39b778" },
  veryLow: { label: "Very Low", bg: "#1eb020" },
};

const TD_FONT = "'Rubik', sans-serif";

const TD_LEGEND = [
  { label: "Study startup", color: TD_COLOR.segment1 },
  { label: "Recruitment window", color: TD_COLOR.segment2 },
  { label: "Analytics & data lock", color: TD_COLOR.segment3 },
];

// Map total_trials (relative to the visible min/max) to a risk band.
// Fewer trials → higher feasibility risk.
const getTrialDurationRisk = (trialCount, minTrials, maxTrials) => {
  if (maxTrials === minTrials) return TD_RISK.medium;
  const ratio = (trialCount - minTrials) / (maxTrials - minTrials);
  if (ratio >= 0.8) return TD_RISK.veryLow;
  if (ratio >= 0.6) return TD_RISK.low;
  if (ratio >= 0.4) return TD_RISK.medium;
  if (ratio >= 0.2) return TD_RISK.high;
  return TD_RISK.veryHigh;
};

// Build the chart rows from the trial_duration_country API points. Each point
// now carries three per-phase stat blocks (study_startup_stats /
// recruitment_window_stats / analytics_datalock_stats), each with
// min/25_perc/median/75_perc/max in months. The bar segment value is the
// phase's median duration and the bar total is their sum. The flat
// study_startup / recruitment_window / analytics_datalock fields are now trial
// counts, not durations. Risk is banded from total_trials against the visible
// min/max.
const buildTrialDurationRows = (points = [], minTrials = 0, maxTrials = 1) => {
  const segMedian = (stats) => Number(stats?.median) || 0;

  return points.map((p) => {
    const codeMatch = p.country.match(/\((.*?)\)/);
    const iso3 = codeMatch ? codeMatch[1].trim().toUpperCase() : "";
    const countryName = p.country.split("(")[0].trim();
    const iso2 =
      countries.alpha3ToAlpha2(iso3) ||
      countries.getAlpha2Code(countryName, "en") ||
      "";

    const studyStartupStats = p.study_startup_stats || {};
    const recruitmentWindowStats = p.recruitment_window_stats || {};
    const analyticsDatalockStats = p.analytics_datalock_stats || {};

    const studyStartup = segMedian(studyStartupStats);
    const recruitmentWindow = segMedian(recruitmentWindowStats);
    const analyticsDatalock = segMedian(analyticsDatalockStats);
    const total = studyStartup + recruitmentWindow + analyticsDatalock || 1;

    // Per-segment stats keyed by label so the tooltip can show the stat block
    // for whichever segment the cursor is over.
    const pickStats = (stats) => ({
      trials: stats.trials,
      max: stats.max,
      p75: stats["75_perc"],
      median: stats.median,
      p25: stats["25_perc"],
      min: stats.min,
    });

    return {
      country: countryName,
      // Show the 3-letter ISO code (USA, ESP, CAN) from the API, not the
      // 2-letter one. iso2 is still kept below for the flag.
      code: (iso3 || iso2 || countryName).toUpperCase(),
      iso2: (iso2 || "").toLowerCase(),
      total,
      risk: getTrialDurationRisk(p.total_trials, minTrials, maxTrials),
      segments: [
        {
          label: "Study startup",
          value: studyStartup,
          color: TD_COLOR.segment1,
          stats: pickStats(studyStartupStats),
        },
        {
          label: "Recruitment window",
          value: recruitmentWindow,
          color: TD_COLOR.segment2,
          stats: pickStats(recruitmentWindowStats),
        },
        {
          label: "Analytics & data lock",
          value: analyticsDatalock,
          color: TD_COLOR.segment3,
          stats: pickStats(analyticsDatalockStats),
        },
      ],
      // raw stats for the hover tooltip — defaults to the recruitment window
      // block (the primary timeline phase) when no segment is hovered.
      stats: {
        completedTrials: p.total_trials,
        ...pickStats(recruitmentWindowStats),
      },
    };
  });
};

const formatTdStat = (v) =>
  v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString();

function TrialDurationTooltip({ row, segment }) {
  // Which timeline segment the cursor is over (dark → Study startup,
  // mid → Recruitment window, light → Analytics & data lock). Falls back to the
  // first segment so the tooltip is never empty.
  const activeSegment = segment || (row.segments && row.segments[0]) || {
    label: "Study startup",
    value: 0,
  };
  // Percentile stats belong to the hovered segment now (each phase carries its
  // own min/median/max), falling back to the row-level block.
  const stats = activeSegment.stats || row.stats || {};
  const line = (label, value, bold) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "10px 0",
      }}
    >
      <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: bold ? 500 : 400 }}>{label}</span>
      <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: bold ? 500 : 400 }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ width: 300, fontFamily: TD_FONT }}>
      {/* header: flag + country */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {row.iso2 ? (
          <Flag code={row.iso2} style={{ width: 26, height: 18, objectFit: "cover", borderRadius: 2 }} />
        ) : null}
        <span style={{ fontSize: 16, lineHeight: "20px", letterSpacing: 0, fontWeight: 500, color: "rgba(0,0,0,1)" }}>{row.country}</span>
      </div>

      {/* Hovered segment (Study startup / Recruitment window / Analytics & data
          lock) — shows that segment's duration in months */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 400 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: activeSegment.color, flexShrink: 0 }} />
          {activeSegment.label}
        </span>
        <span style={{ color: "#2666be", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 500 }}>
          {formatTdStat(stats.trials)} Trials
        </span>
      </div>

      <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />

      {line("Max", `${formatTdStat(stats.max)} mo`)}
      {line("75% percentile", `${formatTdStat(stats.p75)} mo`)}
      {line("Median", `${formatTdStat(stats.median)} mo`, true)}
      {line("25% percentile", `${formatTdStat(stats.p25)} mo`)}
      {line("Min", `${formatTdStat(stats.min)} mo`)}
    </div>
  );
}

function TrialDurationCompetitionTooltip({ row }) {
  const comp = row.competition || {};
  const line = (label, value) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "10px 0",
      }}
    >
      <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 400 }}>{label}</span>
      <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 400 }}>{value}</span>
    </div>
  );

  // Show the exact competition_score value the API returns (e.g. 0.03845) with
  // a % suffix — no rounding, no ×100 conversion.
  const formatScore = (v) =>
    v === null || v === undefined || v === "" ? "-" : `${v}%`;

  return (
    <div style={{ width: 300, fontFamily: TD_FONT }}>
      {/* header: flag + country */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {row.iso2 ? (
          <Flag code={row.iso2} style={{ width: 26, height: 18, objectFit: "cover", borderRadius: 2 }} />
        ) : null}
        <span style={{ fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 500, color: "rgba(0,0,0,1)" }}>{row.country}</span>
      </div>

      {/* Competition Score (risk badge) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
        <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 400 }}>Competition Score</span>
        <TrialDurationRiskBadge risk={row.risk} />
      </div>

      {/* Actively Recruiting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
        <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 400 }}>Actively Recruiting</span>
        <span style={{ color: "#2666be", fontSize: 14, lineHeight: "20px", letterSpacing: 0, fontWeight: 500 }}>
          {formatTdStat(comp.activeTrials)} Trials
        </span>
      </div>

      <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />

      {line(
        "Population",
        comp.population === null ||
          comp.population === undefined ||
          comp.population === ""
          ? "-"
          : comp.population,
      )}
      {line("Planned Patients", formatTdStat(comp.plannedPatients))}
      {line("Competition Score", formatScore(comp.competitionScore))}
    </div>
  );
}

function TrialDurationRiskBadge({ risk }) {
  return (
    <div
      style={{
        backgroundColor: risk.bg,
        color: "#fff",
        borderRadius: 20,
        padding: "1px 8px",
        width: 79,
        textAlign: "center",
        flexShrink: 0,
        fontFamily: TD_FONT,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: "20px",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {risk.label}
    </div>
  );
}

// Left gutter sized so the bars' x=0 line lands ~80px from the card's inner
// edge — matching the Competition chart's Y-axis position (ScatterChart
// margin.left 20 + Recharts default YAxis width ~60). The +6 connector tick is
// included, so 74 + 6 = 80.
const TD_LABEL_WIDTH = 74; // left gutter for flag + country code
const TD_BADGE_WIDTH = 99; // right gutter for the risk badge

const TD_BAR_HEIGHT = 28; // matches reference design
// Fixed height for the rows viewport: fits ~6 rows (28px bar + 36px gap each);
// with more countries the card stays fixed and the CustomScrollbar kicks in.
const TD_ROWS_VIEWPORT = 6 * TD_BAR_HEIGHT + 5 * 36 + 24; // ≈ 372

function TrialDurationBarRow({ row, axisMax, onSegmentHover, onLeave, onBadgeHover }) {
  const totalPct = axisMax > 0 ? Math.min((row.total / axisMax) * 100, 100) : 0;
  const segSum = row.segments.reduce((a, s) => a + s.value, 0) || 1;

  return (
    <div style={{ display: "flex", alignItems: "center", height: TD_BAR_HEIGHT }}>
      {/* left gutter: flag + code, OUTSIDE the plot / Y-axis */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: TD_LABEL_WIDTH,
          flexShrink: 0,
          justifyContent: "flex-end",
          paddingRight: 8,
        }}
      >
        {row.iso2 ? (
          <Flag code={row.iso2} style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2 }} />
        ) : null}
        <span
          style={{
            fontFamily: TD_FONT,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: "16px",
            color: TD_COLOR.black700,
            whiteSpace: "nowrap",
          }}
        >
          {row.code}
        </span>
      </div>

      {/* small connector tick between the code and the Y-axis */}
      <div style={{ width: 6, height: 1, backgroundColor: "rgba(0,0,0,0.4)", flexShrink: 0 }} />

      {/* plot track: bars start exactly at the Y-axis (x = 0) */}
      <div style={{ flex: 1, position: "relative", height: TD_BAR_HEIGHT }}>
        {/* horizontal dashed gridline running through the row, behind the bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            borderTop: "1px dashed rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{ position: "relative", display: "flex", height: TD_BAR_HEIGHT, width: `${totalPct}%` }}
          onMouseLeave={onLeave}
        >
          {row.segments.map((seg, i) => (
            <div
              key={i}
              style={{
                width: `${(seg.value / segSum) * 100}%`,
                backgroundColor: seg.color,
                borderRadius: 4,
                marginRight: i < row.segments.length - 1 ? 4 : 0,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => onSegmentHover(row, seg, e)}
              onMouseMove={(e) => onSegmentHover(row, seg, e)}
            />
          ))}
        </div>
      </div>

      {/* right gutter: risk badge, OUTSIDE the plot */}
      <div style={{ width: TD_BADGE_WIDTH, flexShrink: 0, display: "flex", justifyContent: "flex-end", paddingLeft: 12 }}>
        <div
          style={{ cursor: "pointer" }}
          onMouseEnter={(e) => onBadgeHover(row, e)}
          onMouseMove={(e) => onBadgeHover(row, e)}
          onMouseLeave={onLeave}
        >
          <TrialDurationRiskBadge risk={row.risk} />
        </div>
      </div>
    </div>
  );
}

const TD_TOOLTIP_W = 300 + 36; // content width + padding
const TD_TOOLTIP_H = 320; // approximate tooltip height for clamping (header + 6 stat rows + padding)

function TrialDurationChart({ rows, axisMax }) {
  // Build "nice" evenly-spaced ticks across [0, axisMax].
  const tickCount = 8;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((axisMax / tickCount) * i),
  );

  const containerRef = useRef(null);
  const [tip, setTip] = useState(null); // { row, x, y, kind, segment }
  const closeTimerRef = useRef(null);

  // Legend toggle: null = show all three segments; otherwise a single segment
  // label to show in isolation. Clicking the active legend item resets to all.
  const [soloSegment, setSoloSegment] = useState(null);

  const toggleSoloSegment = (label) =>
    setSoloSegment((prev) => (prev === label ? null : label));

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const showTip = (row, e, kind, segment = null) => {
    cancelClose();
    // Position in VIEWPORT coordinates and render via a portal to document.body
    // so the tooltip is never clipped by the card's `overflow: hidden`.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = e.clientX + 16;
    let y = e.clientY + 16;
    // flip left if it would overflow the right edge
    if (x + TD_TOOLTIP_W > vw) x = e.clientX - TD_TOOLTIP_W - 16;
    if (x < 4) x = 4;
    // keep the tooltip pinned near the cursor: if it would overflow the bottom
    // edge, just slide it up the minimum amount to stay on-screen (don't flip
    // it fully above the cursor — that leaves a big gap)
    if (y + TD_TOOLTIP_H > vh) y = Math.max(4, vh - TD_TOOLTIP_H - 4);
    if (y < 4) y = 4;
    setTip({ row, x, y, kind, segment });
  };

  useEffect(() => () => cancelClose(), []);

  const handleSegmentHover = (row, seg, e) =>
    showTip(row, e, "duration", seg);
  const handleBadgeHover = (row, e) => showTip(row, e, "competition");

  // delay the close so the cursor can travel from the bar onto the tooltip
  const handleLeave = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setTip(null), 150);
  };

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {/* legend — click an item to show only that segment; click it again to
          show all three */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        {TD_LEGEND.map((item) => {
          const dimmed = soloSegment !== null && soloSegment !== item.label;
          return (
            <div
              key={item.label}
              onClick={() => toggleSoloSegment(item.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                opacity: dimmed ? 0.4 : 1,
                userSelect: "none",
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: TD_FONT, fontWeight: 400, fontSize: 14, lineHeight: "20px", color: TD_COLOR.black700 }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* chart area: a FIXED-HEIGHT rows viewport (scrolls via CustomScrollbar
          when there are more countries than fit) + the X-axis line below it.
          The gridlines + Y-axis line live INSIDE the scroll area so they scroll
          with the rows and always span the full content height. */}
      <div style={{ position: "relative" }}>
        <CustomScrollbar
          height={TD_ROWS_VIEWPORT}
          useMaxHeight
          trackRight={-16}
          trackTop={4}
          trackBottom={4}
        >
          <div style={{ position: "relative", paddingBottom: 20 }}>
            {/* gridlines + Y-axis line — span the full rows content height */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: TD_LABEL_WIDTH + 6,
                right: TD_BADGE_WIDTH,
                display: "flex",
                justifyContent: "space-between",
                pointerEvents: "none",
              }}
            >
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  style={{
                    width: 1,
                    backgroundColor: i === 0 ? "rgba(0,0,0,0.4)" : "transparent",
                    borderLeft: i === 0 ? "none" : "1px solid rgba(0,0,0,0.12)",
                  }}
                />
              ))}
            </div>

            {/* rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 36, position: "relative", paddingTop: 4 }}>
              {rows.map((row, i) => {
                // When a legend item is soloed, keep only that segment; the bar
                // then shows just that phase's duration on the same axis.
                const displayRow =
                  soloSegment === null
                    ? row
                    : (() => {
                        const segments = row.segments.filter(
                          (seg) => seg.label === soloSegment,
                        );
                        const total = segments.reduce(
                          (sum, seg) => sum + seg.value,
                          0,
                        );
                        return { ...row, segments, total };
                      })();

                return (
                  <TrialDurationBarRow
                    key={`${row.country}-${i}`}
                    row={displayRow}
                    axisMax={axisMax}
                    onSegmentHover={handleSegmentHover}
                    onBadgeHover={handleBadgeHover}
                    onLeave={handleLeave}
                  />
                );
              })}
            </div>
          </div>
        </CustomScrollbar>
      </div>

      {/* x-axis line + tick labels (same track geometry as the gridlines) */}
      <div
        style={{
          marginLeft: TD_LABEL_WIDTH + 6,
          marginRight: TD_BADGE_WIDTH,
          borderTop: "1px solid rgba(0,0,0,0.4)",
          paddingTop: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {ticks.map((tick, i) => (
            <span key={i} style={{ fontFamily: TD_FONT, fontWeight: 400, fontSize: 12, color: TD_COLOR.black700, textAlign: "center" }}>
              {tick}
            </span>
          ))}
        </div>
        <div style={{ fontFamily: TD_FONT, fontWeight: 400, fontSize: 12, color: TD_COLOR.black400, textAlign: "center", marginTop: 8 }}>
          Months
        </div>
      </div>

      {/* single, mouse-following tooltip — portaled to <body> and positioned in
          viewport coords so the card's `overflow: hidden` can't clip it */}
      {tip
        ? createPortal(
            <div
              onMouseEnter={cancelClose}
              onMouseLeave={handleLeave}
              style={{
                position: "fixed",
                left: tip.x,
                top: tip.y,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                padding: "14px 18px",
                zIndex: 9999,
              }}
            >
              {tip.kind === "competition" ? (
                <TrialDurationCompetitionTooltip row={tip.row} />
              ) : (
                <TrialDurationTooltip row={tip.row} segment={tip.segment} />
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default function TimeToPrimaryEndpoint({activeSubTab, session_keys}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSessionKey = searchParams.get("share_id")
  // const initialSessionKey = getSessionKeyFromSearchParams(searchParams);
  const searchSessionKey = useSelector((state) => state.cards.sessionKey);
  const analyticsSessionKey = useSelector((state) => state.cards.analyticsSessionKey);
  const reduxActiveFilters = useSelector((state) => state.cards.activeFilters || {});
  const [data, setData] = useState([]);
  const [bubbleData, setBubbleData] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(3);
  const [openPhase, setOpenPhase] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const phases = [...new Set(data.map((d) => d.phase))];
  const [competitionApiData, setCompetitionApiData] = useState([]);
  const [amendmentApi, setAmendmentApi] = useState(null);
  const [rawCompetitionIntensity, setRawCompetitionIntensity] = useState(null);
  const [rawEnrollmentSpeed, setRawEnrollmentSpeed] = useState(null);
  const [rawAmendmentGraph, setRawAmendmentGraph] = useState(null);
  const [rawTrialDuration, setRawTrialDuration] = useState(null);
  const [finalCountryList, setFinalCountryList] = useState([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryHighlightIndex, setCountryHighlightIndex] = useState(-1);
  const countryListRef = useRef(null);
  //adding this
  const pendingScrollRestoreRef = useRef(null); // { scrollEl, lockedScrollTop } | null
  const classes = fea_styles();
  const filteredCountryList = countrySearch.trim()
    ? (() => {
        const q = countrySearch.toLowerCase();
        return finalCountryList
          .filter((c) => c.country.toLowerCase().includes(q))
          .sort((a, b) => {
            const aStarts = a.country.toLowerCase().startsWith(q);
            const bStarts = b.country.toLowerCase().startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.country.localeCompare(b.country);
          });
      })()
    : finalCountryList;

  useEffect(() => {
    if (countryHighlightIndex < 0 || !countryListRef.current) return;
    const el = countryListRef.current.querySelector(`[data-country-idx="${countryHighlightIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [countryHighlightIndex]);

  const [view, setView] = useState("Active");
const [copied, setCopied] = useState(false);
  const dispatch = useDispatch();
  const isAlertActive = useSelector((state) => state.trials.isAlertActive);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);
  const competitionTooltipTimeoutRef = useRef(null);
  const amendmentsTooltipTimeoutRef = useRef(null);
  const [competitionScatterTooltip, setCompetitionScatterTooltip] = useState({
    active: false,
    payload: null,
  });
  const [amendmentsScatterTooltip, setAmendmentsScatterTooltip] = useState({
    active: false,
    payload: null,
  });
  const [openDrawer, setOpenDrawer] = useState(false);
  const [graphLoading, setGraphLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [amendmentGraphLoading, setAmendmentGraphLoading] = useState(true);
  const [enrollmentGraphLoading, setEnrollmentGraphLoading] = useState(true);
  const [initialFeasibilityLoadComplete, setInitialFeasibilityLoadComplete] =
    useState(false);
  const [competitionSummary, setCompetitionSummary] = useState(0);
  const [countriesCount, setCountriesCount] = useState(0);
  const [viewSummary, setViewSummary] = useState(null);
  const shouldSortCountriesRef = useRef(false);
  const hasPinnedCountryOrderRef = useRef(false);
  const pinnedCountrySelectionKeyRef = useRef("");
  const [competitionGraph, setCompetitionGraph] = useState(null);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const hasInitializedAmendmentsRef = useRef(false);
  const shouldApplyInitialSortRef = useRef(false);
  const [filters, setFilters] = useState({
    stage: "",
    line_intent: "",
    phases: "",
    locations: "",
  });
  const [openShareModal, setOpenShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const { setShareAction, clearShareAction } = useShareAction();

  const [topFilters, setTopFilters] = useState(() =>
    getAnalyticsSharedFiltersFromSearchParams(searchParams),
  );
  const [currentSessionKey, setCurrentSessionKey] = useState(
    () => initialSessionKey,
  );
  const currentSessionKeyRef = useRef(initialSessionKey);
  const preserveSharedSessionKeyRef = useRef(Boolean(initialSessionKey));
  const skipNextFetchRequestKeyRef = useRef("");
  const isManualTopFilterChangeRef = useRef(false);
  const reduxSyncedFiltersRef = useRef({});

  useLayoutEffect(() => {
    const pending = pendingScrollRestoreRef.current;
    if (pending) {
      pending.scrollEl.scrollTop = pending.lockedScrollTop;
      pendingScrollRestoreRef.current = null;
    }
  }, [selectedCountries]);

  // console.log(filters, "filtersfiltersfilters");

  // const [country, setCountry] = useState("");

  // The below function subCategoryMap is reponsible for briging the data for subctegoriess

  const subCategoryMap = useMemo(() => {
    return competitionGraph?.metrics?.sub_category_map || {};
  }, [competitionGraph]);

  const [rootFilters1, setRootFilters1] = useState({
    stage: [],
    line_intent: [],
    phases: [],
    locations: [],
    counties: [],
    ammendments: [],
  });

  const [loading, setLoading] = useState({
    line_intent: false,
    phases: false,
    stage: false,
    locations: false,
  });

  // Sort Country data
  const sortedCountryList = [...filteredCountryList].sort((a, b) => {
    const aSelected = selectedCountries.includes(a.country);
    const bSelected = selectedCountries.includes(b.country);

    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;

    return a.country.localeCompare(b.country);
  });

  const findScrollableAncestor = (el) => {
    let node = el;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  // const syncSessionKeyInUrl = useCallback(
  //   (nextSessionKey) => {
  //     const currentParams = new URLSearchParams(window.location.search);
  //     const preservedPage = currentParams.get("page");
  //     const preservedTab = currentParams.get("tab");
  //     const preservedSubtab = currentParams.get("subtab");
  //     const nextParams = setSessionKeySearchParam(
  //       currentParams,
  //       nextSessionKey,
  //     );

  //     ["line_intent", "phases", "stage", "locations"].forEach((key) => {
  //       nextParams.delete(key);
  //     });

  //     if (preservedPage) {
  //       nextParams.set("page", preservedPage);
  //     }

  //     if (preservedTab) {
  //       nextParams.set("tab", preservedTab);
  //     }

  //     if (preservedSubtab) {
  //       nextParams.set("subtab", preservedSubtab);
  //     }

  //     setSearchParams(nextParams, { replace: true });
  //   },
  //   [setSearchParams],
  // );

  const resetSessionContextForManualTopFilterChange = useCallback(() => {
    preserveSharedSessionKeyRef.current = false;
    currentSessionKeyRef.current = "";
    skipNextFetchRequestKeyRef.current = "";
  }, []);

  const fetchFilterOptions = async (key) => {
    setLoading((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  useEffect(() => {
    // const nextSessionKey = getSessionKeyFromSearchParams(searchParams);
    const nextSessionKey = searchParams.get("share_id")
    const nextFilters = getAnalyticsSharedFiltersFromSearchParams(searchParams);
    const hasUrlFilters = hasFeasibilitySharedFilters(nextFilters);

    if (nextSessionKey) {
      preserveSharedSessionKeyRef.current = true;
      currentSessionKeyRef.current = nextSessionKey;
      setCurrentSessionKey((prevSessionKey) =>
        prevSessionKey === nextSessionKey ? prevSessionKey : nextSessionKey,
      );
      return;
    }

    preserveSharedSessionKeyRef.current = false;
    currentSessionKeyRef.current = "";
    setCurrentSessionKey((prevSessionKey) =>
      prevSessionKey ? "" : prevSessionKey,
    );

    if (hasUrlFilters) {
      setTopFilters((prevFilters) =>
        areSharedFiltersEquivalent(prevFilters, nextFilters)
          ? prevFilters
          : nextFilters,
      );
    }
  }, [searchParams]);

  useEffect(() => {
    currentSessionKeyRef.current = currentSessionKey;
  }, [currentSessionKey]);

  useEffect(() => {
    if (!searchSessionKey || searchSessionKey === currentSessionKeyRef.current) return;
    // Don't let the live/default search session clobber an active shared
    // session (share_id) — that caused a refetch with the default key that
    // replaced the shared data right after opening a share URL.
    if (preserveSharedSessionKeyRef.current) return;
    // Belt-and-suspenders: while a share link is open, never adopt the default
    // search session even if preserve mode was cleared elsewhere.
    if (searchParams.get("share_id") && isDefaultSearchSession(searchSessionKey)) return;
    preserveSharedSessionKeyRef.current = false;
    currentSessionKeyRef.current = searchSessionKey;
    setCurrentSessionKey(searchSessionKey);
  }, [searchSessionKey]);

  // Adopt a session key published by a sibling analytics tab (Treatment /
  // Patients) after it applied a filter, so all tabs share the same session.
  useEffect(() => {
    if (!analyticsSessionKey || analyticsSessionKey === currentSessionKeyRef.current) return;
    if (isDefaultSearchSession(analyticsSessionKey)) return;
    preserveSharedSessionKeyRef.current = false;
    currentSessionKeyRef.current = analyticsSessionKey;
    setCurrentSessionKey(analyticsSessionKey);
  }, [analyticsSessionKey]);

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
      // Main search was reset — clear only the keys we originally synced from Redux
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

    setTopFilters((prev) => {
      // Always apply the latest Redux filters so removals of individual chips propagate
      return {
        ...prev,
        ...mappedFilters,
      };
    });
  }, [reduxActiveFilters]);

  const phaseFilteredData = data.filter((d) => d.phase === selectedPhase);
  const totalTrials = phaseFilteredData.reduce((sum, d) => sum + d.trials, 0);
  const getScrollbarThumb = (contentHeight, viewportHeight, scrollTop) => {
    const thumbHeight = Math.max(
      (viewportHeight / contentHeight) * viewportHeight,
      32,
    );

    const maxScroll = contentHeight - viewportHeight;

    const thumbTop =
      maxScroll > 0
        ? (scrollTop / maxScroll) * (viewportHeight - thumbHeight)
        : 0;

    return { thumbHeight, thumbTop };
  };
  const CARD_HEIGHT = 365;
  const HEADER_HEIGHT = 72; // title + margin
  // const VIEWPORT_HEIGHT = 389;
  const FILTER_HEIGHT = 0;
  const TRACK_PAD = 0;
  const TRACK_PAD_BOTTOM = 48;
  const VIEWPORT_HEIGHT = CARD_HEIGHT - HEADER_HEIGHT;

  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const competitionData = competitionApiData;
  const contentHeight = competitionData.length * 48;
  const { thumbHeight, thumbTop } = getScrollbarThumb(
    contentHeight,
    VIEWPORT_HEIGHT,
    scrollTop,
  );
  const amendmentFilterKeys = useMemo(() => {
    const metricTypes =
      amendmentApi?.metrics?.ammendments_type ||
      amendmentApi?.metrics?.amendments_type ||
      [];

    if (metricTypes.length) {
      return metricTypes;
    }

    return (amendmentApi?.chart?.points || [])
      .map((point) => point.ammendment_name || point.amendment_name)
      .filter(Boolean);
  }, [amendmentApi]);

  const amendmentContentHeight = amendmentFilterKeys.length * 44;

  const [activeKeys, setActiveKeys] = useState([]);
  const amendmentBaseColorMap = useMemo(
    () => {
      const colorMap = amendmentFilterKeys.reduce((acc, key, index) => {
        const family =
          AMENDMENT_COLOR_FAMILIES[index % AMENDMENT_COLOR_FAMILIES.length];
        const shadeOffset =
          Math.floor(index / AMENDMENT_COLOR_FAMILIES.length) % 3;
        acc[key] = { family, shadeOffset };
        return acc;
      }, {});

      const normaliseKey = (value) =>
        typeof value === "string" ? value.trim().toLowerCase() : "";

      const moreInfoKey = amendmentFilterKeys.find(
        (key) => normaliseKey(key) === "more information",
      );
      const baselineKey = amendmentFilterKeys.find(
        (key) => normaliseKey(key) === "baseline characteristics",
      );

      if (moreInfoKey) {
        const baselineFamily = baselineKey ? colorMap[baselineKey]?.family : null;
        const currentFamily = colorMap[moreInfoKey]?.family;
        const usedFamilies = new Set(
          Object.values(colorMap).map((entry) => entry?.family),
        );

        const pickFamily = (predicate) => {
          for (const family of AMENDMENT_COLOR_FAMILIES) {
            if (predicate(family)) return family;
          }
          return null;
        };

        const nextFamily =
          pickFamily(
            (family) =>
              family !== currentFamily &&
              (!baselineFamily || family !== baselineFamily) &&
              !usedFamilies.has(family),
          ) ||
          pickFamily(
            (family) =>
              family !== currentFamily &&
              (!baselineFamily || family !== baselineFamily),
          ) ||
          currentFamily;

        if (nextFamily) {
          colorMap[moreInfoKey] = {
            ...colorMap[moreInfoKey],
            family: nextFamily,
          };
        }
      }

      return colorMap;
    },
    [amendmentFilterKeys],
  );

  // const [activeKeys, setActiveKeys] = useState(FILTER_KEYS);
  // const STACK_COLORS = {
  //   "Biomarker Stratification": "#1F7A8C",
  //   "Weekly Visit Schedule": "#9AA5B1",
  //   ECOG: "#B0BEC5",
  //   Endpoints: "#8B2E2E",
  //   "Study Arms": "#C44",
  //   "Line of therapy": "#E55",
  //   "Eligibility Criteria": "#A65A00",
  // };
  const toSafeNumber = (value, fallback = 0) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  };

  const getDynamicAxisDomain = (axis = {}, values = [], fallback = [0, 1]) => {
    const numericValues = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    let min = Number.isFinite(Number(axis?.min))
      ? Number(axis.min)
      : numericValues.length
        ? Math.min(...numericValues)
        : fallback[0];
    let max = Number.isFinite(Number(axis?.max))
      ? Number(axis.max)
      : numericValues.length
        ? Math.max(...numericValues)
        : fallback[1];

    if (min === max) {
      const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
      min -= padding;
      max += padding;
    }

    return [min, max];
  };

  const formatAxisTick = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return value;
    }

    return Number.isInteger(numericValue)
      ? numericValue.toString()
      : numericValue.toFixed(1);
  };

  const buildUniformTicks = (domain, count = 6) => {
    const min = Number(domain?.[0]);
    const max = Number(domain?.[1]);

    if (!Number.isFinite(min) || !Number.isFinite(max) || count < 2) {
      return undefined;
    }

    if (min === max) {
      return [min];
    }

    const step = (max - min) / (count - 1);

    return Array.from({ length: count }, (_, idx) => min + step * idx);
  };
  const sortedAmendmentKeys = useMemo(() => {
    return [...amendmentFilterKeys].sort((a, b) => {
      const aSelected = activeKeys.includes(a);
      const bSelected = activeKeys.includes(b);

      // selected first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // keep stable order (NO alphabetical override)
      return 0;
    });
  }, [amendmentFilterKeys, activeKeys]);

  const finalAmendmentKeys = useMemo(() => {
    // ✅ Apply sorting ONLY once
    if (shouldApplyInitialSortRef.current) {
      return [...amendmentFilterKeys].sort((a, b) => {
        const aSelected = activeKeys.includes(a);
        const bSelected = activeKeys.includes(b);

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;

        return 0;
      });
    }

    return amendmentFilterKeys;
  }, [amendmentFilterKeys, activeKeys]);

  useEffect(() => {
    if (shouldApplyInitialSortRef.current) {
      // ✅ turn off sorting after first render
      shouldApplyInitialSortRef.current = false;
    }
  }, []);

  const toggleKey = (key) => {
    // resetSessionContextForManualTopFilterChange();
    const nextActiveKeys = activeKeys.includes(key)
      ? activeKeys.filter((activeKey) => activeKey !== key)
      : [...activeKeys, key];

    setActiveKeys(nextActiveKeys);
    // setTopFilters((prevFilters) => ({
    //   ...prevFilters,
    //   ammendments: nextActiveKeys,
    // }));
  };

  // useEffect(() => {
  //   const selectedAmendments = topFilters.ammendments || [];

  //   if (selectedAmendments.length) {
  //     const availableSelections = selectedAmendments.filter((key) =>
  //       amendmentFilterKeys.includes(key),
  //     );

  //     setActiveKeys(
  //       availableSelections.length ? availableSelections : selectedAmendments,
  //     );
  //     return;
  //   }

  //   setActiveKeys(amendmentFilterKeys);
  // }, [amendmentFilterKeys, topFilters.ammendments]);
  // useEffect(() => {
  //   // Only set default when user has NOT interacted AND no session data
  //   if (
  //     activeKeys.length === 0 &&
  //     !preserveSharedSessionKeyRef.current
  //   ) {
  //     setActiveKeys(amendmentFilterKeys);
  //   }
  // }, [amendmentFilterKeys]);

  // useEffect(() => {
  //   const selectedAmendments = topFilters.ammendments || [];

  //   if (selectedAmendments.length > 0) {
  //     setActiveKeys(selectedAmendments);
  //     return;
  //   }

  //   // fallback (default)
  //   if (!preserveSharedSessionKeyRef.current) {
  //     setActiveKeys(amendmentFilterKeys);
  //   }
  // }, [topFilters.ammendments, amendmentFilterKeys]);
  useEffect(() => {
    if (!amendmentFilterKeys.length) return;

    // ✅ CASE 1: Shared URL
    if (topFilters.ammendments?.length) {
      setActiveKeys(topFilters.ammendments);

      // enable sorting only once
      shouldApplyInitialSortRef.current = true;
      shouldSortCountriesRef.current = true;

      return;
    }

    // ✅ CASE 2: Top filters change OR first load
    setActiveKeys(amendmentFilterKeys);
  }, [amendmentFilterKeys, topFilters.ammendments]);
  // const xMin = competitionData.length
  //   ? Math.min(...competitionData.map((d) => d.x || 0))
  //   : 0;

  // const xMin = competitionData.length
  //   ? Math.min(...competitionData.map((d) => d.x || 0))
  //   : 0;

  // const xMax = competitionData.length
  //   ? Math.max(...competitionData.map((d) => d.x || 0))
  //   : 100;

  // const yMax = competitionData.length
  //   ? Math.max(...competitionData.map((d) => d.y || 0))
  //   : 0.01;
  const handleBack = () => {
    if (viewSummary) {
      setViewSummary(null);
    } else {
      setOpenDrawer(false);
    }
  };

  const amendmentChartData = useMemo(
    () =>
      (amendmentApi?.chart?.points || []).map((point) => ({
        name: point.ammendment_name || point.amendment_name || "Unknown",
        recruitmentSpeed: toSafeNumber(point.recruitment_speed),
        avgAmendments: toSafeNumber(point.avg_amendments),
        completedPatients: toSafeNumber(point.completed_patients),
        completedTrials: toSafeNumber(point.completed_trials),
        size: toSafeNumber(point.completed_trials, 1),
      })),
    [amendmentApi],
  );

  const amendmentCompletedTrialsDomain = useMemo(() => {
    const values = amendmentChartData
      .map((point) => point.completedTrials)
      .filter((value) => Number.isFinite(value));

    if (!values.length) {
      return { low: 0, high: 0 };
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue === maxValue) {
      return { low: maxValue, high: maxValue };
    }

    const span = maxValue - minValue;

    return {
      low: minValue + span / 3,
      high: minValue + (span * 2) / 3,
    };
  }, [amendmentChartData]);

  const getAmendmentBubbleColor = useCallback(
    (point) => {
      const entry =
        amendmentBaseColorMap[point?.name] || {
          family: AMENDMENT_COLOR_FAMILIES[0],
          shadeOffset: 0,
        };
      return entry.family[0];
    },
    [amendmentBaseColorMap],
  );

  const filteredAmendments = useMemo(
    () =>
      amendmentChartData
        .filter((point) => activeKeys.includes(point.name))
        .sort((a, b) => b.size - a.size), // largest bubbles first so smaller ones render on top
    [activeKeys, amendmentChartData],
  );

  const amendmentXAxisDomain = useMemo(
    () =>
      getDynamicAxisDomain(
        amendmentApi?.chart?.x_axis,
        amendmentChartData.map((point) => point.recruitmentSpeed),
        [0, 1],
      ),
    [amendmentApi, amendmentChartData],
  );

  const amendmentYAxisDomain = useMemo(
    () =>
      getDynamicAxisDomain(
        amendmentApi?.chart?.y_axis,
        amendmentChartData.map((point) => point.avgAmendments),
        [0, 1],
      ),
    [amendmentApi, amendmentChartData],
  );

  const amendmentCenterX =
    (amendmentXAxisDomain[0] + amendmentXAxisDomain[1]) / 2;
  const amendmentCenterY =
    (amendmentYAxisDomain[0] + amendmentYAxisDomain[1]) / 2;
  const amendmentLeftX = (amendmentXAxisDomain[0] + amendmentCenterX) / 2;
  const amendmentRightX = (amendmentCenterX + amendmentXAxisDomain[1]) / 2;
  const amendmentBottomY = (amendmentYAxisDomain[0] + amendmentCenterY) / 2;
  const amendmentTopY = (amendmentCenterY + amendmentYAxisDomain[1]) / 2;
  const amendmentCrownX = amendmentLeftX;
  const amendmentCrownY =
    amendmentYAxisDomain[0] +
    (amendmentYAxisDomain[1] - amendmentYAxisDomain[0]) * 0.02;
  const amendmentSummary = toSafeNumber(amendmentApi?.summary);
  const amendmentTypeCount =
    toSafeNumber(
      amendmentApi?.metrics?.ammendments_count ??
        amendmentApi?.metrics?.amendments_count,
      amendmentFilterKeys.length,
    ) || amendmentFilterKeys.length;
  const amendmentXAxisLabel =
    amendmentApi?.chart?.x_axis?.label || "Patients per site per month";
  const amendmentYAxisLabel =
    amendmentApi?.chart?.y_axis?.label || "Avg Amendments (Risk)";
  const amendmentXAxisTicks = useMemo(
    () => buildUniformTicks(amendmentXAxisDomain, 6),
    [amendmentXAxisDomain],
  );
  const amendmentYAxisTicks = useMemo(
    () => buildUniformTicks(amendmentYAxisDomain, 6),
    [amendmentYAxisDomain],
  );

  /*
  // Jitter overlapping bubbles so smaller ones stay accessible
  const allJitteredAmendments = useMemo(() => {
    if (!amendmentChartData.length) return amendmentChartData;

    const xRange = amendmentXAxisDomain[1] - amendmentXAxisDomain[0] || 1;
    const yRange = amendmentYAxisDomain[1] - amendmentYAxisDomain[0] || 1;
    const [minSize, maxSize] = amendmentSizeDomain;
    const sizeRange = maxSize - minSize || 1;

    // ZAxis maps size → pixel area [160,1000], radius ≈ sqrt(area/π)
    // We use data-space units: bubble radius in data units ≈ (pixelRadius / chartPx) * dataRange
    const getDataRadius = (size) => {
      const normalised = (size - minSize) / sizeRange; // 0..1
      const pixelArea = 160 + normalised * (1000 - 160);
      const pixelRadius = Math.sqrt(pixelArea / Math.PI);
      return {
        rx: (pixelRadius / AMENDMENT_CHART_WIDTH) * xRange,
        ry: (pixelRadius / AMENDMENT_CHART_HEIGHT) * yRange,
      };
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const result = [...amendmentChartData]
      .sort((a, b) => b.size - a.size || a.name.localeCompare(b.name))
      .map((p) => ({
        ...p,
        plotRecruitmentSpeed: p.recruitmentSpeed,
        plotAvgAmendments: p.avgAmendments,
      }));

    // For each pair that overlaps, nudge them apart (Y-only to keep X values stable).
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const { rx: rxa, ry: rya } = getDataRadius(a.size);
        const { rx: rxb, ry: ryb } = getDataRadius(b.size);

        const dx = (b.plotRecruitmentSpeed - a.plotRecruitmentSpeed) / xRange;
        const dy = (b.plotAvgAmendments - a.plotAvgAmendments) / yRange;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Combined radius threshold in normalised space
        const threshold = ((rxa + rxb) / xRange + (rya + ryb) / yRange) / 2;

        if (dist < threshold && dist < 0.15) {
          const push = (threshold - dist) / 2;
          const directionY =
            dy === 0
              ? a.name.localeCompare(b.name) < 0
                ? 1
                : -1
              : Math.sign(dy);
          const pushY = directionY * push * yRange;

          b.plotAvgAmendments = clamp(
            b.plotAvgAmendments + pushY,
            amendmentYAxisDomain[0],
            amendmentYAxisDomain[1],
          );
          a.plotAvgAmendments = clamp(
            a.plotAvgAmendments - pushY,
            amendmentYAxisDomain[0],
            amendmentYAxisDomain[1],
          );
        }
      }
    }

    return result;
  }, [amendmentChartData, amendmentSizeDomain, amendmentXAxisDomain, amendmentYAxisDomain]);

  const jitteredAmendments = useMemo(
    () =>
      allJitteredAmendments.filter((point) => activeKeys.includes(point.name)),
    [activeKeys, allJitteredAmendments],
  );
  */

  const jitteredAmendments = useMemo(
    () => filteredAmendments,
    [filteredAmendments],
  );

  const clearSingleFilter = (key) => {
    isManualTopFilterChangeRef.current = true;
    hasPinnedCountryOrderRef.current = false;
    pinnedCountrySelectionKeyRef.current = "";
    resetSessionContextForManualTopFilterChange();
    const updatedFilters = {
      ...topFilters,
      [key]: [],
    };

    setTopFilters(updatedFilters);
  };

  // const [filters, setFilters] = useState({
  //   country: "",
  //   backbone: "",
  //   phase: "",
  //   orr: "",
  //   sae: "",
  //   lineOfTherapy: "",
  // });

  const linesOfTherapy = [...new Set(data.map((item) => item.lineOfTherapy))];
  const [viewMode, setViewMode] = useState("country");

  useEffect(() => {
    // Later replace with API
    setData(timeData);
  }, []);

  const getColor = (trials) => {
    if (trials >= 300) return "rgba(47, 128, 237, 1)";
    if (trials >= 250) return "#3F8AEF";
    if (trials >= 200) return "#5A9CF2";
    if (trials >= 150) return "#7FB1F5";
    if (trials >= 100) return "#9CC5F7";
    return "#C4DFFD";
  };
  const filteredData = data
    .filter((d) =>
      filters.lineOfTherapy ? d.lineOfTherapy === filters.lineOfTherapy : true,
    )
    .filter((d) =>
      filters.country
        ? d.country.toLowerCase().includes(filters.country.toLowerCase())
        : true,
    );
  const applyCompetitionAnalytics = useCallback((apiData) => {
    if (!apiData) {
      setCompetitionGraph(null);
      setCompetitionSummary(0);
      setCountriesCount(0);
      setCompetitionApiData([]);
      setSelectedCountries([]);
      return;
    }

    setCompetitionGraph(apiData.chart);
    setCompetitionSummary(apiData.summary || 0);
    setCountriesCount(apiData.metrics?.countries_count || 0);

    const points = apiData.chart?.points || [];
    const formatted = points.map((point) => {
      const codeMatch = point.country.match(/\((.*?)\)/);
      const iso3 = codeMatch ? codeMatch[1].trim().toUpperCase() : "";
      const countryName = point.country.split("(")[0].trim();

      const iso2 =
        countries.alpha3ToAlpha2(iso3) ||
        countries.getAlpha2Code(countryName, "en") ||
        "";

      return {
        country: point.country.split("(")[0].trim(),
        code: iso2?.toLowerCase(),
        x: point.recruitment_speed,
        y: point.competition_intensity,
        size: point.active_trials,
        patient: point.population_million,
        plannedPatients: point.planned_patients,
        activeTrials: point.active_trials,
        competitionIntensity: point.competition_intensity,
        recruitmentSpeed: point.recruitment_speed,
      };
    });

    const sorted = [...formatted].sort((left, right) => right.x - left.x);

    setCompetitionApiData(sorted);
  }, []);

  const fetchFeasibilityAnalytics = useCallback(
    async (analyticsFilters = {}) => {
      const shouldShowHardLoading = !isManualTopFilterChangeRef.current && !hasLoadedOnceRef.current;

      if (shouldShowHardLoading) {
        setGraphLoading(true);
        setEnrollmentGraphLoading(true);
        setAmendmentGraphLoading(true);
      } else if (hasLoadedOnceRef.current) {
        setIsFetching(true);
      }

      try {
        const normalizedFilters =
          normalizeFeasibilityAnalyticsFilters(analyticsFilters);
        const result = await getFeasibilityAnalytics({
          session_key: currentSessionKeyRef.current,
          filters: normalizedFilters,
          graph: FEASIBILITY_GRAPH_KEYS,
          table: [],
        });

        const nextSessionKey = result?.session_key || "";
        const resolvedSessionKey =
          nextSessionKey || currentSessionKeyRef.current;

        // On a shared session (share_id), publish applied top_filters so the
        // header renders them as chips (analytics API is the only source).
        if (preserveSharedSessionKeyRef.current && result?.top_filters) {
          dispatch(setSharedChipFilters(result.top_filters));
        }

        const normalizedPayloadFilters = normalizeAnalyticsFilterOptions(
          result?.payload,
        );
        const fallbackAppliedFilters =
          normalizeAnalyticsFilterOptions(normalizedFilters);
        const mergedPayloadFilters = {
          ...normalizedPayloadFilters,
          ...getSharedSessionFallbackFilters(
            fallbackAppliedFilters,
            normalizedPayloadFilters,
          ),
        };
        const responsePayloadFilters = hasFeasibilitySharedFilters(
          mergedPayloadFilters,
        )
          ? mergedPayloadFilters
          : fallbackAppliedFilters;
        const metricFilterOptions = normalizeFeasibilityMetricFilterOptions(
          result?.metrics || result?.payload?.metrics,
        );
        const nextFilterOptions = normalizeAnalyticsFilterOptions(result?.filters);

        setRootFilters1((prev) => ({
          stage: metricFilterOptions.stage.length
            ? metricFilterOptions.stage
            : nextFilterOptions.stage.length
              ? nextFilterOptions.stage
              : prev.stage,
          line_intent: metricFilterOptions.line_intent.length
            ? metricFilterOptions.line_intent
            : nextFilterOptions.line_intent.length
              ? nextFilterOptions.line_intent
              : prev.line_intent,
          phases: metricFilterOptions.phases.length
            ? metricFilterOptions.phases
            : nextFilterOptions.phases.length
              ? nextFilterOptions.phases
              : prev.phases,
          locations: metricFilterOptions.locations.length
            ? metricFilterOptions.locations
            : nextFilterOptions.locations.length
              ? nextFilterOptions.locations
              : prev.locations,
        }));

        setRawCompetitionIntensity(result?.competition_intensity || null);
        // setRawEnrollmentSpeed(result?.enrollment_speed || null);
        setRawAmendmentGraph(result?.amendment_graph || null);
        setRawTrialDuration(result?.trial_duration_country || null);

        skipNextFetchRequestKeyRef.current = createFeasibilityFetchKey(
          createEmptyTopFilters(),
          resolvedSessionKey,
        );

        if (nextSessionKey) {
          currentSessionKeyRef.current = nextSessionKey;

          // Only keep the session in component state / URL for true shared-link flows.
          // For normal filter changes, updating the URL here makes the page look like it reloads.
          if (preserveSharedSessionKeyRef.current) {
            setCurrentSessionKey(nextSessionKey);
            // syncSessionKeyInUrl(nextSessionKey);
          } else if (
            searchParams.get("share_id") &&
            !isDefaultSearchSession(nextSessionKey)
          ) {
            // Manual filter change during a share flow → publish the new session
            // so sibling analytics tabs (Treatment, Patients) stay in sync.
            dispatch(setAnalyticsSessionKey(nextSessionKey));
          }
        }

        setTopFilters((prevFilters) => {
          const reduxFilters = reduxSyncedFiltersRef.current || {};
          const mergedWithRedux = {
            ...responsePayloadFilters,
            ...Object.fromEntries(
              Object.entries(reduxFilters).filter(([, v]) => Array.isArray(v) && v.length > 0),
            ),
          };
          return areSharedFiltersEquivalent(prevFilters, mergedWithRedux)
            ? prevFilters
            : mergedWithRedux;
        });

        return result;
      } catch (error) {
        console.error("Failed to fetch feasibility analytics:", error);
        setRawCompetitionIntensity(null);
        setRawEnrollmentSpeed(null);
        setRawAmendmentGraph(null);
        setRawTrialDuration(null);
        applyCompetitionAnalytics(null);
        setEnrollmentApi(null);
        setAmendmentApi(null);
        setTrialDurationApi(null);
        return null;
      } finally {
        hasLoadedOnceRef.current = true;
        setGraphLoading(false);
        setEnrollmentGraphLoading(false);
        setAmendmentGraphLoading(false);
        setIsFetching(false);
        isManualTopFilterChangeRef.current = false;
      }
    },
    [applyCompetitionAnalytics,
      //  syncSessionKeyInUrl
      ],
  );

  const clearTopFilters = useCallback(() => {
    hasPinnedCountryOrderRef.current = false;
    pinnedCountrySelectionKeyRef.current = "";
    reduxSyncedFiltersRef.current = {};
    setIsUserInteracted(false);
    resetSessionContextForManualTopFilterChange();
    const nextFilters = createEmptyTopFilters();
    setTopFilters(nextFilters);
  }, [resetSessionContextForManualTopFilterChange]);

  const top10Countries = [...competitionApiData]
    .sort((a, b) => b.size - a.size) // descending
    .slice(0, 10);

  const toRoman = (num) => {
    const map = [
      "",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
    ];
    return map[num] || num;
  };

  const phaseViewData = Object.values(
    filteredData.reduce((acc, d) => {
      if (!acc[d.phase]) {
        acc[d.phase] = {
          phase: `Phase ${toRoman(d.phase)}`,
          min: d.min,
          q1: d.q1,
          median: d.median,
          q3: d.q3,
          max: d.max,
          trials: d.trials,
        };
      }
      return acc;
    }, {}),
  );
  const [enrollmentApi, setEnrollmentApi] = useState(null);
  const [trialDurationApi, setTrialDurationApi] = useState(null);

  // const chartData = viewMode === "country" ? filteredData : phaseViewData;

  // Flag circle radius scales monotonically with a country's trial count:
  // more trials → bigger flag, always. (The previous buckets were inverted —
  // <100 trials rendered LARGER than the 100–299 range, which made a
  // high-volume country look smaller than tiny ones after filtering.)
  const getRadius = (trials) => {
    const n = Number(trials) || 0;
    if (n >= 300) return 24;
    if (n >= 250) return 22;
    if (n >= 200) return 20;
    if (n >= 150) return 18;
    if (n >= 100) return 17;
    if (n >= 50) return 16;
    return 10;
  };
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const d = payload[0].payload;

    return (
      <div
        style={{
          background: "#fff",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
          width: "350px", // ✅ fixed width (IMPORTANT)
          // pointerEvents: "none",
        }}
      >
        {/* TITLE */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 10,
            color: "rgba(0,0,0,1)",
          }}
        >
          {d.country}
        </div>

        {/* ROWS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Population */}
          <div style={rowStyle}>
            <span style={labelStyle}>Population</span>
            <span style={valueStyle}>{d.patient}</span>
          </div>

          {/* Planned Patients */}
          <div style={rowStyle}>
            <span style={labelStyle}>Planned Patients (Active Trials)</span>
            <span style={valueStyle}>{d.plannedPatients.toLocaleString()}</span>
          </div>

          {/* Active Trials */}
          <div style={rowStyle}>
            <span style={labelStyle}># of Active Trials</span>
            <span style={valueStyle}>{d.activeTrials}</span>
          </div>

          {/* Competition */}
          <div style={rowStyle}>
            <span style={labelStyle}>Competition Intensity</span>
            <span style={valueStyle}>{d.competitionIntensity}%</span>
          </div>

          {/* Enrollment Speed (SPECIAL CASE) */}
          <div style={rowStyle}>
            <span style={labelStyle}>Enrollment Speed</span>
            <span style={valueStyle}>
              {Number(d.recruitmentSpeed) ? (
                <>
                  <span style={{ whiteSpace: "nowrap" }}>
                    {d.recruitmentSpeed} patients
                  </span>
                  <br />
                  per month per site
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const rowStyle = {
    display: "flex",
    alignItems: "flex-start",
  };
  const labelStyle = {
    color: "rgba(0,0,0,0.6)",
    fontSize: 14,
    flex: "0 0 60%", // ✅ fixed width
    // whiteSpace: "nowrap",
    // overflow: "hidden",     // ✅ prevent overflow
    // textOverflow: "ellipsis", // ✅ show ...
  };

  const valueStyle = {
    color: "rgba(0,0,0,0.7)",
    fontSize: 14,
    flex: "0 0 40%", // ✅ fixed width
    textAlign: "right",
    lineHeight: "18px",
  };

  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  const handleDownloadCSV = async () => {
    if (isDownloadingCSV) return;
    setIsDownloadingCSV(true);

    const downloadTableName = Array.isArray(activeTable)
      ? activeTable[0]
      : activeTable;
    const activeSessionKey = currentSessionKeyRef.current;

    if (!downloadTableName || !activeSessionKey) {
      setIsDownloadingCSV(false);
      return;
    }

    const url = new URL(
      "https://oncosuite.com/analytics/downloadcsv",
    );
    url.searchParams.set("tablename", downloadTableName);
    url.searchParams.set("session_key", activeSessionKey);

    // Trigger download without navigating away / opening a new tab.
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url.toString();

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

  const CustomTooltipAmendments = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    const formatValue = (value, suffix = "") => {
      if (value === null || value === undefined || value === "") return "-";
      return `${value}${suffix}`;
    };

    const rowStyle = {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) max-content",
      columnGap: "16px",
      alignItems: "baseline",
      fontFamily: "Rubik",
      fontSize: "14px",
      lineHeight: "20px",
      marginTop: "8px",
    };

    const labelStyle = {
      color: "rgba(0,0,0,0.6)",
      overflowWrap: "anywhere",
    };

    const valueStyle = {
      color: "rgba(0,0,0,0.6)",
      justifySelf: "end",
      textAlign: "right",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    };

    return (
      <div
        style={{
          background: "#FFFFFF",
          padding: "14px",
          borderRadius: "4px",
          boxShadow: "0px 4px 20px rgba(132,151,177,0.21)",
          minWidth: "270px",
          maxWidth: "340px",
        }}
      >
        {/* TITLE */}
        <div
          style={{
            fontWeight: 500,
            fontSize: "14px",
            color: "rgba(0,0,0,1)",
            marginBottom: "6px",
          }}
        >
          {formatValue(data.name)}
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Completed Patients (Completed Trials)</span>
          <span style={valueStyle}>
            {formatValue(
              data.completedPatients?.toLocaleString?.() ||
                data.completedPatients,
            )}
          </span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}># Completed Trials</span>
          <span style={valueStyle}>{formatValue(data.completedTrials)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>
            Avg Amendments
          </span>
          <span style={valueStyle}>{formatValue(data.avgAmendments)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>
            {amendmentApi?.chart?.x_axis?.label || "Patients per monthg per site"}
          </span>
          <span style={valueStyle}>{formatValue(data.recruitmentSpeed)}</span>
        </div>
      </div>
    );
  };

  const transformEnrollmentData = (apiData, selectedCountries = []) => {
    if (!apiData)
      return {
        chartData: [],
        categories: [],
        finalPoints: [],
        minTrials: 0,
        maxTrials: 1,
      };

    let points = apiData?.chart?.points || [];

    if (selectedCountries.length > 0) {
      points = points.filter((p) =>
        selectedCountries.includes(p.country.split("(")[0].trim()),
      );
    }

    let finalPoints;
    if (selectedCountries.length > 0) {
      finalPoints = points;
    } else if (!isUserInteracted) {
      const sorted = [...points].sort((a, b) => b.median - a.median);
      finalPoints = sorted.slice(0, 10);
    } else {
      finalPoints = points;
    }

    if (!finalPoints.length) {
      return {
        chartData: [],
        categories: [],
        finalPoints: [],
        minTrials: 0,
        maxTrials: 1,
      };
    }

    // Sort by completed_trials descending (highest at top, lowest at bottom)
    finalPoints = [...finalPoints].sort(
      (a, b) => b.completed_trials - a.completed_trials,
    );

    const trialCounts = finalPoints.map((p) => p.completed_trials);
    const minTrials = Math.min(...trialCounts);
    const maxTrials = Math.max(...trialCounts);

    const chartData = finalPoints.map((p) => {
      const min = toSafeNumber(p.min);
      const q1 = toSafeNumber(p["25_perc"]);
      const median = toSafeNumber(p.median);
      const q3 = toSafeNumber(p["75_perc"]);
      const max = toSafeNumber(p.max);

      // When q1 === q3 the box body has zero width and ECharts renders it
      // invisible. Nudge q1 and q3 slightly so the box is always visible,
      // keeping whiskers (min/max) at their real API values.
      // The tooltip always reads from the raw API fields so it is unaffected.
      const boxSpread = q3 - q1;
      let visualMin = min;
      let visualQ1 = q1;
      let visualQ3 = q3;
      let visualMax = max;
      if (boxSpread === 0) {
        // All five values identical — create a synthetic spread so ECharts
        // can draw a visible box. Use median as centre; if median is also 0
        // fall back to a fixed unit spread.
        const centre = median || 1;
        const half = centre * 0.15;
        visualMin = centre - half * 2;
        visualQ1 = centre - half;
        visualQ3 = centre + half;
        visualMax = centre + half * 2;
      }
      const visualValues = [visualMin, visualQ1, median, visualQ3, visualMax];

      return {
        value: visualValues,
        trials: p.completed_trials,
      };
    });

    const categories = finalPoints.map((p) => p.country.split("(")[0].trim());

    return { chartData, categories, finalPoints, minTrials, maxTrials };
  };
  useEffect(() => {
    const requestKey = createFeasibilityFetchKey(
      createEmptyTopFilters(),
      currentSessionKeyRef.current,
    );

    if (skipNextFetchRequestKeyRef.current === requestKey) {
      skipNextFetchRequestKeyRef.current = "";
      return;
    }

    const filtersToSend = {
      ...createEmptyTopFilters(),
      ...reduxSyncedFiltersRef.current,
    };

    fetchFeasibilityAnalytics(filtersToSend);
  }, [currentSessionKey, fetchFeasibilityAnalytics]);

  const prevGraphFiltersRef = useRef(null);
  const isFetchingFromFilterRef = useRef(false);

  useEffect(() => {
    if (prevGraphFiltersRef.current === null) {
      prevGraphFiltersRef.current = topFilters;
      return;
    }

    if (isFetchingFromFilterRef.current) {
      prevGraphFiltersRef.current = topFilters;
      return;
    }

    const prev = prevGraphFiltersRef.current;
    const graphFilterKeys = ["line_intent", "phases", "stage", "locations"];
    const changed = graphFilterKeys.some(
      (key) =>
        JSON.stringify(prev[key] || []) !==
        JSON.stringify(topFilters[key] || []),
    );

    if (!changed) return;
    prevGraphFiltersRef.current = topFilters;

    isManualTopFilterChangeRef.current = true;
    isFetchingFromFilterRef.current = true;
    fetchFeasibilityAnalytics(topFilters).finally(() => {
      isFetchingFromFilterRef.current = false;
    });
  }, [topFilters, fetchFeasibilityAnalytics]);

  useEffect(() => {
    if (
      !rawCompetitionIntensity &&
      !rawEnrollmentSpeed &&
      !rawAmendmentGraph &&
      !rawTrialDuration
    ) {
      // Only mark load complete if loading is done (API responded with no data)
      if (!graphLoading && !enrollmentGraphLoading && !amendmentGraphLoading) {
        setInitialFeasibilityLoadComplete(true);
      }
      return;
    }

    const filteredCompetition = filterFeasibilityGraph(
      rawCompetitionIntensity,
      topFilters,
    );
    const filteredEnrollment = filterFeasibilityGraph(
      rawEnrollmentSpeed,
      topFilters,
    );
    const filteredAmendment = filterFeasibilityGraph(
      rawAmendmentGraph,
      topFilters,
    );
    const filteredTrialDuration = filterFeasibilityGraph(
      rawTrialDuration,
      topFilters,
    );

    applyCompetitionAnalytics(filteredCompetition);
    setEnrollmentApi(filteredEnrollment || null);
    setAmendmentApi(filteredAmendment || null);
    setTrialDurationApi(filteredTrialDuration || null);
    setInitialFeasibilityLoadComplete(true);
  }, [
    applyCompetitionAnalytics,
    rawAmendmentGraph,
    rawCompetitionIntensity,
    rawEnrollmentSpeed,
    rawTrialDuration,
    topFilters,
    graphLoading,
    enrollmentGraphLoading,
    amendmentGraphLoading,
  ]);

  const { chartData, categories, finalPoints, minTrials, maxTrials } =
    useMemo(() => {
      return transformEnrollmentData(enrollmentApi, selectedCountries);
    }, [enrollmentApi, selectedCountries]);

  // Trial Duration by Country is driven by its own API graph
  // (trial_duration_country). Points carry the three timeline segments plus the
  // competition stats used by the risk-badge tooltip, so no cross-graph merge
  // is needed.
  const trialDurationRows = useMemo(() => {
    let points = trialDurationApi?.chart?.points || [];
    if (!points.length) return [];

    // Only show countries selected in the country picker card (empty = all).
    if (selectedCountries.length > 0) {
      points = points.filter((p) =>
        selectedCountries.includes(p.country.split("(")[0].trim()),
      );
    }
    if (!points.length) return [];

    // Sort by total_trials descending (most trials on top), matching the
    // reference design where high-volume countries lead.
    const sortedPoints = [...points].sort(
      (a, b) => (b.total_trials || 0) - (a.total_trials || 0),
    );

    // Risk band range: prefer the API legends, else derive from the points.
    const legends = trialDurationApi?.chart?.legends || {};
    const trialCounts = sortedPoints.map((p) => p.total_trials || 0);
    const minTrials = Number.isFinite(Number(legends.trial_min))
      ? Number(legends.trial_min)
      : trialCounts.length
        ? Math.min(...trialCounts)
        : 0;
    const maxTrials = Number.isFinite(Number(legends.trial_max))
      ? Number(legends.trial_max)
      : trialCounts.length
        ? Math.max(...trialCounts)
        : 1;

    const rows = buildTrialDurationRows(sortedPoints, minTrials, maxTrials);

    return rows.map((row, index) => {
      const point = sortedPoints[index] || {};
      return {
        ...row,
        competition: {
          activeTrials: point.actively_recruiting_trials,
          population: point.population,
          plannedPatients: point.planned_patients,
          competitionScore:
            point.competition_score != null
              ? point.competition_score
              : null,
        },
      };
    });
  }, [trialDurationApi, selectedCountries]);

  // Total trials shown in the card header (replaces the old hardcoded value).
  // With a country selection active, reflect only the visible countries; with
  // no selection, prefer the API-provided summary.
  const trialDurationTotalTrials = useMemo(() => {
    if (selectedCountries.length > 0) {
      return trialDurationRows.reduce(
        (sum, r) => sum + (Number(r.stats?.completedTrials) || 0),
        0,
      );
    }
    const summary = trialDurationApi?.chart?.summary;
    if (Number.isFinite(Number(summary))) return Number(summary);
    return (trialDurationApi?.chart?.points || []).reduce(
      (sum, p) => sum + (Number(p.total_trials) || 0),
      0,
    );
  }, [trialDurationApi, trialDurationRows, selectedCountries]);

  const hasTrialDurationData = trialDurationRows.length > 0;

  const trialDurationAxisMax = useMemo(() => {
    const maxTotal = trialDurationRows.length
      ? Math.max(...trialDurationRows.map((r) => r.total))
      : 0;
    if (maxTotal <= 0) return 24;
    // round up to the next multiple of 4 for tidy ticks
    return Math.ceil(maxTotal / 4) * 4;
  }, [trialDurationRows]);

  //   useEffect(() => {
  //     const selectedCounties = topFilters.counties || [];

  //     if (selectedCounties.length) {
  //       setSelectedCountries(selectedCounties);
  //       setIsUserInteracted(true);
  //       return;
  //     }

  //     setSelectedCountries(
  //       competitionData.slice(0, 10).map((country) => country.country),
  //     );
  //     setIsUserInteracted(false);
  // }, [competitionData, topFilters.counties]);

  useEffect(() => {
    const selectedCounties = topFilters.counties || [];

    if (selectedCounties.length) {
      setSelectedCountries(selectedCounties);
      setIsUserInteracted(true);
      return;
    }

    // 👇 ONLY set default if user has NOT interacted
    if (!isUserInteracted) {
      const xValues = competitionData.map((d) => d.x || 0);
      const xMean = xValues.reduce((a, b) => a + b, 0) / (xValues.length || 1);
      const xStd = Math.sqrt(xValues.reduce((a, b) => a + Math.pow(b - xMean, 2), 0) / (xValues.length || 1));
      setSelectedCountries(
        competitionData
          .filter((d) => (d.x || 0) <= xMean + 2 * xStd)
          .slice(0, 10)
          .map((country) => country.country),
      );
    }
  }, [competitionData, topFilters.counties, isUserInteracted]);

  const finalPointsRef = useRef([]);
  const enrollmentTooltipPosRef = useRef({ key: null, pos: null });
  useEffect(() => {
    finalPointsRef.current = finalPoints || [];
  }, [finalPoints]);

  const filteredCompetition = competitionData.filter((d) =>
    selectedCountries.length === 0
      ? true
      : selectedCountries.includes(d.country),
  );

  const hasTopFilters = useMemo(
    () => hasFeasibilitySharedFilters(topFilters),
    [topFilters],
  );
  const hasCompetitionData = competitionData.length > 0;
  const hasFilteredCompetitionData = filteredCompetition.length > 0;
  const hasEnrollmentData = finalPoints.length > 0;
  const hasAmendmentData = amendmentChartData.length > 0;
  const hasVisibleAmendmentData = filteredAmendments.length > 0;

  const resetCompetitionSelection = useCallback(() => {
    // resetSessionContextForManualTopFilterChange();
    setSelectedCountries([]);
    // setTopFilters((prevFilters) => ({
    //   ...prevFilters,
    //   counties: [],
    // }));
  }, [resetSessionContextForManualTopFilterChange]);

  const resetAmendmentSelection = useCallback(() => {
    // resetSessionContextForManualTopFilterChange();
    setActiveKeys([]);
    // setTopFilters((prevFilters) => ({
    //   ...prevFilters,
    //   ammendments: [],
    // }));
  }, [resetSessionContextForManualTopFilterChange]);

  const showCompetitionTopFilterEmptyState =
    initialFeasibilityLoadComplete &&
    hasTopFilters &&
    !graphLoading &&
    !hasCompetitionData;
  const showCompetitionSelectionEmptyState =
    initialFeasibilityLoadComplete &&
    !graphLoading &&
    hasCompetitionData &&
    !hasFilteredCompetitionData;
  const showCompetitionEmptyState =
    initialFeasibilityLoadComplete &&
    !graphLoading &&
    !hasFilteredCompetitionData;
  const showCompetitionPanelEmptyState =
    initialFeasibilityLoadComplete && !graphLoading && !hasCompetitionData;

  // Trial Duration by Country card empty states (own data source).
  const showTrialDurationTopFilterEmptyState =
    initialFeasibilityLoadComplete &&
    hasTopFilters &&
    !enrollmentGraphLoading &&
    !hasTrialDurationData;
  const showTrialDurationEmptyState =
    initialFeasibilityLoadComplete &&
    !enrollmentGraphLoading &&
    !hasTrialDurationData;

  const showAmendmentTopFilterEmptyState =
    initialFeasibilityLoadComplete &&
    hasTopFilters &&
    !amendmentGraphLoading &&
    !hasAmendmentData;
  const showAmendmentSelectionEmptyState =
    initialFeasibilityLoadComplete &&
    !amendmentGraphLoading &&
    hasAmendmentData &&
    !hasVisibleAmendmentData;
  const showAmendmentEmptyState =
    initialFeasibilityLoadComplete &&
    !amendmentGraphLoading &&
    !hasVisibleAmendmentData;
  const showAmendmentPanelEmptyState =
    initialFeasibilityLoadComplete &&
    !amendmentGraphLoading &&
    !hasAmendmentData;

  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeTable, setActiveTable] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableHasMore, setTableHasMore] = useState(true);
  const [isFetchingMoreRows, setIsFetchingMoreRows] = useState(false);
  const tableFetchKeyRef = useRef("");

  const xMin = 0;
  const apiXMax = Number(competitionGraph?.x_axis?.max);
  const apiYMax = Number(competitionGraph?.y_axis?.max);

  // Use filtered points for axis scaling so axis stays tight after filter changes
  const safeData = filteredCompetition.length ? filteredCompetition : (competitionData.length ? competitionData : [{ x: 0, y: 0 }]);

  const xMaxData = Math.max(...safeData.map((d) => d.x || 0));
  const yMaxData = Math.max(...safeData.map((d) => Number(d.y) || 0));

  const yMin = 0;
  const xMaxEffective = xMaxData > 0 ? xMaxData : (Number.isFinite(apiXMax) && apiXMax > 0 ? apiXMax : 20);
  const xMax = xMaxEffective * 1.2;

  const xRawStep = xMax / 5;
  // Don't floor xRawStep at 1 before taking log10 — that forced xMagnitude to
  // always be 1 for fractional data, which in turn forced xTickStep to 1 and
  // collapsed the axis to just "0"/"1" regardless of the real (small) range.
  const xMagnitude = Math.pow(10, Math.floor(Math.log10(Math.max(xRawStep, 0.0001))));
  const xNiceMultiples = [1, 2, 2.5, 5, 10];
  const xNormalised = xRawStep / xMagnitude;
  const xNiceMult = xNiceMultiples.find((m) => m >= xNormalised) || 10;
  const xTickStep = xMax >= 5 ? Math.max(1, xNiceMult * xMagnitude) : xNiceMult * xMagnitude;
  const xTickCount = Math.ceil(xMax / xTickStep);
  const xAxisMax = xTickStep * xTickCount;

  const competitionYTicks = useMemo(() => {
    if (!yMaxData || yMaxData <= 0) return undefined;

    // Pick a clean round step that gives ~5-6 ticks
    const rawStep = yMaxData / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;

    // Add one extra step of headroom so a data point sitting at the max
    // value isn't pinned to the top edge (its bubble/flag would get clipped).
    const count = Math.floor(yMaxData / step) + 2;
    return Array.from({ length: count }, (_, i) =>
      parseFloat((i * step).toPrecision(10)),
    );
  }, [yMaxData]);

  // Domain max = last tick so nothing floats above the chart
  const yMax = competitionYTicks?.length
    ? competitionYTicks[competitionYTicks.length - 1]
    : (yMaxData > 0 ? yMaxData : 0.05);

  // Format a Y tick value into its display string (shared with the axis)
  const formatCompetitionYTick = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return `${v}`;
    if (n === 0) return "0.001";
    const decimals = Math.max(0, Math.ceil(-Math.log10(n)) + 1);
    return parseFloat(n.toFixed(decimals)).toString();
  };

  // Dynamically size the Y axis gutter from the longest formatted tick label,
  // so tiny decimals (e.g. 0.008) don't overlap the axis title after filtering.
  const competitionYAxisWidth = useMemo(() => {
    const labels = (competitionYTicks || []).map(formatCompetitionYTick);
    const maxLen = labels.reduce((m, s) => Math.max(m, s.length), 1);
    // ~7px per char for the numbers + ~22px reserved for the rotated title
    return Math.max(48, Math.round(maxLen * 7) + 22);
  }, [competitionYTicks]);

  const xMid = xAxisMax / 2;
  const yMid = yMax / 2;

  const ticks = Array.from({ length: xTickCount + 1 }, (_, i) => xTickStep * i);
  const xTickMin = ticks?.[0];
  const xTickMax = ticks?.[ticks.length - 1];

  const XAxisBoundaryTick = ({ x, y, payload }) => {
    const value = payload?.value;
    const isMax = Number.isFinite(xTickMax) && value === xTickMax;
    const isMin = Number.isFinite(xTickMin) && value === xTickMin;

    const textAnchor = isMax ? "end" : isMin ? "start" : "middle";
    const dx = isMax ? -6 : isMin ? 6 : 0;

    // Whole-number ranges show whole numbers. Small/fractional ranges
    // (xAxisMax < 5) show decimals instead of collapsing every tick to "0"/"1".
    const decimals = xAxisMax >= 5 ? 0 : xAxisMax < 2 ? 2 : 1;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          dx={dx}
          textAnchor={textAnchor}
          style={{
            fontSize: 12,
            fontFamily: "Rubik",
            fill: "rgba(0,0,0,0.7)",
          }}
        >
          {Number(value).toFixed(decimals)}
        </text>
      </g>
    );
  };

  const PAGE_SIZE = 50;
  const SCROLL_TRIGGER_THRESHOLD = 40;

  const extractSectionsFromRes = (res) => {
    const data =
      res?.competition_intensity_active ||
      res?.competition_intensity_non_active ||
      res?.competition_intensity ||
      res?.trial_duration_country ||
      null;
    return data?.views?.study?.sections || [];
  };

  const handleCompetitionViewChange = async (nextView) => {
    if (nextView === view) return;
    setView(nextView);
    prevTopFiltersRef.current = topFilters;
    const tableKey = nextView === "Active"
      ? "competitionintensity_active"
      : "competitionintensity_non_active";
    const fetchKey = `${tableKey}`;
    tableFetchKeyRef.current = fetchKey;
    try {
      setDrawerLoading(true);
      setActiveTable([tableKey]);
      setTableRows([]);
      setTablePage(1);
      setTableHasMore(true);
      const res = await getFeasibilityAnalytics({
        session_key: currentSessionKeyRef.current,
        filters: topFilters,
        graph: [],
        table: [tableKey],
        page: 1,
        page_size: PAGE_SIZE,
      });
      if (tableFetchKeyRef.current !== fetchKey) return;
      setDrawerData(res);
      const sections = extractSectionsFromRes(res);
      setTableRows(sections.map(normalizeFeasibilityDrawerRow));
      setTableHasMore(sections.length === PAGE_SIZE);
      setTablePage(2);
    } catch (error) {
      console.error("Drawer API error:", error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenDrawer = async ({
    table = [],
    graph = [],
    comb_backbone = "",
    title = "",
  }) => {
    setDrawerTitle(title || "Undefined");
    setView("Active");
    setOpenDrawer(true);
    prevTopFiltersRef.current = topFilters;
    const fetchKey = `${table.join(",")}-${comb_backbone}`;
    tableFetchKeyRef.current = fetchKey;
    try {
      setDrawerLoading(true);
      setActiveTable(table);
      setTableRows([]);
      setTablePage(1);
      setTableHasMore(true);
      const res = await getFeasibilityAnalytics({
        comb_backbone,
        session_key: currentSessionKeyRef.current,
        filters: topFilters,
        graph,
        table,
        page: 1,
        page_size: PAGE_SIZE,
      });
      if (tableFetchKeyRef.current !== fetchKey) return;
      setDrawerData(res);
      const sections = extractSectionsFromRes(res);
      setTableRows(sections.map(normalizeFeasibilityDrawerRow));
      setTableHasMore(sections.length === PAGE_SIZE);
      setTablePage(2);
    } catch (error) {
      console.error("Drawer API error:", error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleTableScroll = useCallback(async (scrollTop, scrollHeight, clientHeight) => {
    const rowsFromBottom = Math.round((scrollHeight - scrollTop - clientHeight) / 60);
    if (rowsFromBottom > SCROLL_TRIGGER_THRESHOLD) return;
    if (!tableHasMore || isFetchingMoreRows || drawerLoading) return;

    const currentTable = activeTable;
    const currentPage = tablePage;
    const fetchKey = tableFetchKeyRef.current;

    setIsFetchingMoreRows(true);
    try {
      const res = await getFeasibilityAnalytics({
        session_key: currentSessionKeyRef.current,
        filters: topFilters,
        graph: [],
        table: currentTable,
        page: currentPage,
        page_size: PAGE_SIZE,
      });
      if (tableFetchKeyRef.current !== fetchKey) return;
      const sections = extractSectionsFromRes(res);
      setTableRows((prev) => [...prev, ...sections.map(normalizeFeasibilityDrawerRow)]);
      setTableHasMore(sections.length === PAGE_SIZE);
      setTablePage((p) => p + 1);
    } catch (error) {
      console.error("Fetch more rows error:", error);
    } finally {
      setIsFetchingMoreRows(false);
    }
  }, [tableHasMore, isFetchingMoreRows, drawerLoading, activeTable, tablePage, topFilters]);
  const normalizedSections = tableRows.map((row) => ({
    ...row,
    metrics: [
      { label: "Regimen", value: row.regimen?.length || 0 },
      { label: "Countries", value: row.countries?.length || 0 },
      { label: "Sites", value: row.site_count },
      { label: "Patients", value: row.planned_patients },
    ],
  }));
  // LEFT = midpoint between min and mid
  const leftX = xMid / 2;
  const rightX = xMid + xMid / 2;

  const bottomY = yMid / 2;
  const topY = yMid + yMid / 2;

  const allValues = chartData.flat();

  const dynamicMin = Math.min(...allValues);
  const dynamicMax = Math.max(...allValues);
  const padding = (dynamicMax - dynamicMin) * 0.05;

  const min1 = 0;

  // const max1 = finalPoints?.length
  //   ? Math.max(...finalPoints.map((p) => p.max)) * 1.05
  //   : (enrollmentApi?.chart?.x_axis?.max ?? 1000);

  // Use rendered boxplot values for the axis max so "single trial" synthetic
  // whiskers (median * 1.4) are included and don't overflow the plot.
  const rawMax =
    chartData?.length && chartData.some((d) => Array.isArray(d?.value))
      ? Math.max(...chartData.map((d) => Math.max(...d.value)))
      : finalPoints?.length
        ? Math.max(...finalPoints.map((p) => p.max))
        : (enrollmentApi?.chart?.x_axis?.max ?? 1000);

  // Add a small headroom so points that land on the edge (e.g. max === axis max)
  // don't render outside the plot area due to stroke/box width.
  const paddedMax = rawMax > 0 ? rawMax * 1.05 : rawMax;

  // create "nice" step based on size
  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(Math.max(0.001, paddedMax))),
  );
  const step = magnitude / 2; // gives good spacing

  // Axis max = the real max across all displayed countries, plus headroom —
  // sized to the data actually being shown instead of a fixed stretch factor
  // that reserved most of the chart as empty space regardless of the dataset.
  const max1 = Math.ceil(paddedMax / step) * step;

  const getBoxColor = (trials) => {
    if (maxTrials === minTrials) return "rgba(146,54,54,1)";
    const ratio = (trials - minTrials) / (maxTrials - minTrials);
    const r = Math.round(220 - ratio * 74); // 220 → 146
    const g = Math.round(180 - ratio * 126); // 180 → 54
    const b = Math.round(180 - ratio * 126); // 180 → 54
    return `rgba(${r},${g},${b},1)`;
  };

  const min = min1;
  const max = max1;

  const zoneStep = (max - min) / 3;
  const fastZoneStart = min + zoneStep * 2;

  const dividerLines = [
    { xAxis: min + zoneStep },
  ];

  const handleOpenShare = useCallback(async () => {
    setOpenShareModal(true);
    setShareUrl("");
    setShareLoading(true);

    try {
      const shareFilters = normalizeFeasibilityAnalyticsFilters({
        ...topFilters,
        counties: selectedCountries,
        ammendments: activeKeys,
      });
      const topSessionKey =
        searchSessionKey || initialSessionKey || currentSessionKeyRef.current;
      const result = await getFeasibilityShareableUrl({
        top_session_key: topSessionKey,
        filters: shareFilters,
        tab_name: "feasibility",
      });

      const newSessionKey = result?.session_key;
      if (!newSessionKey) return;

      const tabPath = result?.tab_name || "feasibility";
      const url = `${window.location.origin}/trials/${tabPath}?share_id=${encodeURIComponent(newSessionKey)}`;

      setShareUrl(url);
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setShareLoading(false);
    }
  }, [
    activeKeys,
    initialSessionKey,
    searchSessionKey,
    selectedCountries,
    topFilters,
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
    const ownerId = "feasibility";
    if(activeSubTab == "Feasibility") {
      setShareAction({ ownerId, onClick: handleOpenShare });
    } else {
      clearShareAction(ownerId);
    }
    return () => clearShareAction(ownerId);
  }, [clearShareAction, handleOpenShare, setShareAction, activeSubTab]);

  useEffect(() => {
    if (!competitionData.length) return;

    const shouldPinSharedSelectedCountries =
      preserveSharedSessionKeyRef.current &&
      Array.isArray(topFilters.counties) &&
      topFilters.counties.length > 0;
    const shouldPinInitialTopCountries =
      !isUserInteracted &&
      Array.isArray(selectedCountries) &&
      selectedCountries.length > 0;
    const currentSelectionKey = [...selectedCountries]
      .slice()
      .sort((left, right) => left.localeCompare(right))
      .join("|");

    setFinalCountryList((prev) => {
      const hasDatasetChanged =
        prev.length !== competitionData.length ||
        prev.some(
          (item) =>
            !competitionData.some((entry) => entry.country === item.country),
        );
      const hasPinnedSelectionChanged =
        pinnedCountrySelectionKeyRef.current !== currentSelectionKey;

      if (shouldPinSharedSelectedCountries || shouldPinInitialTopCountries) {
        if (
          hasPinnedCountryOrderRef.current &&
          !hasDatasetChanged &&
          !hasPinnedSelectionChanged
        ) {
          return prev;
        }

        hasPinnedCountryOrderRef.current = true;
        pinnedCountrySelectionKeyRef.current = currentSelectionKey;

        return [...competitionData].sort((a, b) => {
          const aSelected = selectedCountries.includes(a.country);
          const bSelected = selectedCountries.includes(b.country);

          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;

          return a.country.localeCompare(b.country);
        });
      }

      hasPinnedCountryOrderRef.current = false;
      pinnedCountrySelectionKeyRef.current = "";

      if (!hasDatasetChanged) return prev;
      return [...competitionData].sort((a, b) =>
        a.country.localeCompare(b.country),
      );
    });
  }, [
    competitionData,
    isUserInteracted,
    selectedCountries,
    topFilters.counties,
  ]);

  useEffect(() => {
    if (!isUserInteracted && competitionData.length) {
      // Drop extreme x-axis (enrollment speed) outliers — e.g. China sits far
      // to the right and squashes every other flag against the left edge — then
      // pick the 10 countries with the most active trials.
      const xValues = competitionData.map((d) => d.x || 0);
      const xMean = xValues.reduce((a, b) => a + b, 0) / (xValues.length || 1);
      const xStd = Math.sqrt(
        xValues.reduce((a, b) => a + Math.pow(b - xMean, 2), 0) /
          (xValues.length || 1),
      );

      const top10 = [...competitionData]
        .filter((d) => (d.x || 0) <= xMean + 2 * xStd)
        .sort((a, b) => (b.activeTrials || 0) - (a.activeTrials || 0))
        .slice(0, 10)
        .map((c) => c.country);

      setSelectedCountries(top10);
    }
  }, [competitionData, isUserInteracted]);

  const prevTopFiltersRef = useRef(null);

  useEffect(() => {
    if (!openDrawer || activeTable.length === 0) return;
    if (prevTopFiltersRef.current === null) {
      prevTopFiltersRef.current = topFilters;
      return;
    }
    if (areSharedFiltersEquivalent(prevTopFiltersRef.current, topFilters)) return;
    prevTopFiltersRef.current = topFilters;

    const fetchKey = `${activeTable.join(",")}-filter`;
    tableFetchKeyRef.current = fetchKey;

    const refetch = async () => {
      setDrawerLoading(true);
      setTableRows([]);
      setTablePage(1);
      setTableHasMore(true);
      try {
        const res = await getFeasibilityAnalytics({
          session_key: currentSessionKeyRef.current,
          filters: topFilters,
          graph: [],
          table: activeTable,
          page: 1,
          page_size: PAGE_SIZE,
        });
        if (tableFetchKeyRef.current !== fetchKey) return;
        setDrawerData(res);
        const sections = extractSectionsFromRes(res);
        setTableRows(sections.map(normalizeFeasibilityDrawerRow));
        setTableHasMore(sections.length === PAGE_SIZE);
        setTablePage(2);
      } catch (error) {
        console.error("Drawer filter refetch error:", error);
      } finally {
        setDrawerLoading(false);
      }
    };

    refetch();
  }, [topFilters, openDrawer, activeTable]);

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
              <FilterSelect
                value={topFilters.line_intent[0] || ""}
                onOpen={() => fetchFilterOptions("line_intent")}
                onChange={(e) => {
                  isManualTopFilterChangeRef.current = true;
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...topFilters,
                    line_intent: [e.target.value],
                  };

                  setTopFilters(updatedFilters);
                }}
                placeholder="Line of Therapy"
                options={rootFilters1.line_intent || []}
                onClear={() => clearSingleFilter("line_intent")}
                className={classes.treatment_select}
                loading={loading.line_intent}
              />

              <FilterSelect
                value={topFilters.phases[0] ?? ""}
                onOpen={() => fetchFilterOptions("phases")}
                onChange={(e) => {
                  isManualTopFilterChangeRef.current = true;
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...topFilters,
                    phases: [e.target.value],
                  };

                  setTopFilters(updatedFilters);
                }}
                placeholder="Phase"
                options={rootFilters1.phases || []}
                onClear={() => clearSingleFilter("phases")}
                className={classes.treatment_select}
                // renderValue={renderPhaseValue}
                loading={loading.phases}
              />
              <FilterSelect
                value={topFilters.stage[0] || ""}
                onOpen={() => fetchFilterOptions("stage")}
                onChange={(e) => {
                  isManualTopFilterChangeRef.current = true;
                  resetSessionContextForManualTopFilterChange();
                  const updatedFilters = {
                    ...topFilters,
                    stage: [e.target.value],
                  };

                  setTopFilters(updatedFilters);
                }}
                placeholder="Cancer Stage"
                options={rootFilters1.stage || []}
                onClear={() => clearSingleFilter("stage")}
                className={classes.treatment_select}
                loading={loading.stage}
              />
            </div>
          </div>

          <div className={classes.leftSection}>
            {graphLoading ? (
              <CompetitionChartSkeleton />
            ) : (
              <div className={classes.chartRow}>
                {/* LEFT FILTER PANEL (outside the card) */}
                <div style={{ position: "relative" }}>
                  {showCompetitionPanelEmptyState ? (
                    <EmptyGraphState
                      title="Nothing to refine yet"
                      description={
                        showCompetitionTopFilterEmptyState
                          ? "Broaden the top filters to see countries again."
                          : "Country selections will appear here when competition data is available."
                      }
                      actionLabel={
                        showCompetitionTopFilterEmptyState
                          ? "Clear top filters"
                          : null
                      }
                      onAction={
                        showCompetitionTopFilterEmptyState
                          ? clearTopFilters
                          : null
                      }
                    />
                  ) : null}
                  <div className={classes.filterPanel}>
                    {/* Header */}
                    <div className={classes.filterTitle}>
                      {competitionData.length} Countries
                    </div>
                    <div
                      style={{
                        border: "1px solid rgba(240, 246, 254, 1)",
                        margin: "0 -16px 12px -16px",
                      }}
                    />
                    {/* Country search */}
                    <div className={classes.countrySearch}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <input
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={(e) => { setCountrySearch(e.target.value); setCountryHighlightIndex(-1); }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setCountryHighlightIndex(i => Math.min(i + 1, filteredCountryList.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setCountryHighlightIndex(i => Math.max(i - 1, 0));
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const item = filteredCountryList[countryHighlightIndex];
                            if (item) {
                              setIsUserInteracted(true);
                              setSelectedCountries(prev =>
                                prev.includes(item.country)
                                  ? prev.filter(c => c !== item.country)
                                  : [...prev, item.country]
                              );
                            }
                          } else if (e.key === 'Escape') {
                            setCountrySearch('');
                            setCountryHighlightIndex(-1);
                          }
                        }}
                      />
                    </div>
                    {/* Scroll area */}
                    <CustomScrollbar
                      height={VIEWPORT_HEIGHT}
                      trackTop={TRACK_PAD}
                      trackBottom={8}
                      trackRight={-16}
                      trackWidth={6}
                      wrapperStyle={{ flex: 1, minHeight: 0 }}
                      style={{ height: "100%" }}
                    >
                      <div ref={countryListRef}>
                        {filteredCountryList.length === 0 ? (
                          <div style={{ fontSize: 12, fontFamily: "Rubik", color: "rgba(0,0,0,0.4)", padding: "12px 0", textAlign: "center" }}>
                            No countries found
                          </div>
                        ) : sortedCountryList.map((c, idx) => (
                          <div
                            key={c.country}
                            data-country-idx={idx}
                            data-country-name={c.country}
                            style={countryHighlightIndex === idx ? { background: "rgba(38,102,190,0.08)", borderRadius: 4 } : {}}
                          >
                            <label className={classes.countryLabel}>
                              <input
                                type="checkbox"
                                checked={selectedCountries.includes(c.country)}
                                onChange={() => {
                                  setIsUserInteracted(true);
                                  const listEl = countryListRef.current;
                                  const scrollEl = findScrollableAncestor(listEl);

                                  // Just record what we want to restore to — the actual restoration
                                  // happens in useLayoutEffect below, BEFORE the browser paints.
                                  if (scrollEl) {
                                    pendingScrollRestoreRef.current = {
                                      scrollEl,
                                      lockedScrollTop: scrollEl.scrollTop,
                                    };
                                  }

                                  const nextSelectedCountries = selectedCountries.includes(c.country)
                                    ? selectedCountries.filter((country) => country !== c.country)
                                    : [...selectedCountries, c.country];

                                  setSelectedCountries(nextSelectedCountries);
                                }}
                              />
                              {c.country}
                            </label>

                            <div className={classes.countryDivider} />
                          </div>
                        ))}
                      </div>
                    </CustomScrollbar>
                  </div>
                </div>

                {/* GRAPH CARD (right) */}
                <div className={classes.card} style={{ position: "relative", flex: 1, minWidth: 0, marginTop: 0, height: 469 }}>
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
                <div className={classes.cardHeader}>
                  <div className={classes.cardTitle}>
                    Competition Intensity vs Enrollment Speed
                  </div>
                  <div className={classes.trialsButtonWrapper}>
                    <div
                      className={classes.trials_text}
                      onClick={() =>
                        hasCompetitionData &&
                        handleOpenDrawer({
                          table: ["competitionintensity_active"],
                          title: "Competition Intensity vs Enrollment Speed",
                        })
                      }
                      style={{
                        cursor: hasCompetitionData ? "pointer" : "default",
                        opacity: hasCompetitionData ? 1 : 0.65,
                      }}
                    >
                      {Number(competitionSummary).toLocaleString()} Trials
                    </div>
                  </div>
                </div>

                <div className={classes.chartRow} style={{ marginTop: 20 }}>
                  {/* CHART */}
                  <div className={classes.chartContainer}>
                    {showCompetitionEmptyState ? (
                      <EmptyGraphState
                        title={
                          showCompetitionTopFilterEmptyState
                            ? "No competition data for these filters"
                            : showCompetitionSelectionEmptyState
                              ? "No countries selected"
                              : "No competition data available"
                        }
                        description={
                          showCompetitionTopFilterEmptyState
                            ? "Try a broader phase, stage, or line of therapy selection."
                            : showCompetitionSelectionEmptyState
                              ? "Select one or more countries to compare competition intensity."
                              : "This view does not have competition data for the current selection."
                        }
                        actionLabel={
                          showCompetitionTopFilterEmptyState
                            ? "Clear top filters"
                            : showCompetitionSelectionEmptyState
                              ? "Reset countries"
                              : null
                        }
                        onAction={
                          showCompetitionTopFilterEmptyState
                            ? clearTopFilters
                            : showCompetitionSelectionEmptyState
                              ? resetCompetitionSelection
                              : null
                        }
                      />
                    ) : null}

                    <ResponsiveContainer>
                      <ScatterChart
                        margin={{ top: 20, right: 40, left: 8, bottom: 18 }}
                      >
                        {/* <Tooltip content={<CustomTooltip />} cursor={false} /> */}
                        <ReferenceLine
                          x={xMid}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />

                        <ReferenceLine
                          y={yMid}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />

                        <ReferenceDot
                          x={leftX}
                          y={topY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={16}
                            >
                              <tspan x={viewBox.x} dy="-6">
                                High Competition
                              </tspan>
                              <tspan x={viewBox.x} dy="18">
                                Slow Recruitment
                              </tspan>
                            </text>
                          )}
                        />

                        <ReferenceDot
                          x={rightX}
                          y={topY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={16}
                            >
                              <tspan x={viewBox.x} dy="-6">
                                High Competition
                              </tspan>
                              <tspan x={viewBox.x} dy="18">
                                Fast Recruitment
                              </tspan>
                            </text>
                          )}
                        />

                        <ReferenceDot
                          x={leftX}
                          y={bottomY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={16}
                            >
                              <tspan x={viewBox.x} dy="-6">
                                Low Competition
                              </tspan>
                              <tspan x={viewBox.x} dy="18">
                                Slow Recruitment
                              </tspan>
                            </text>
                          )}
                        />

                        <ReferenceDot
                          x={rightX}
                          y={bottomY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={16}
                            >
                              <tspan x={viewBox.x} dy="-6">
                                Low Competition
                              </tspan>
                              <tspan x={viewBox.x} dy="18">
                                Fast Recruitment
                              </tspan>
                            </text>
                          )}
                        />
                        <ReferenceArea
                          x1={xMid}
                          x2={xAxisMax}
                          y1={yMin}
                          y2={yMid}
                          fill="rgba(0, 128, 0, 0.08)"
                          shape={(props) => {
                            const {
                              x,
                              y,
                              width,
                              height,
                              fill: areaFill,
                            } = props;
                            return (
                              <rect
                                x={x - 1}
                                y={y}
                                width={(Number(width) || 0) + 1}
                                height={
                                  (Number(height) || 0) +
                                  COMPETITION_Y_PADDING_BOTTOM
                                }
                                fill={areaFill}
                              />
                            );
                          }}
                        />
                        <Tooltip
                          content={(props) => {
                            if (!props.active) return null;

                            return (
                              <div
                                onMouseEnter={() => {
                                  clearTimeout(
                                    competitionTooltipTimeoutRef.current,
                                  );
                                }}
                                onMouseLeave={() => {
                                  clearTimeout(
                                    competitionTooltipTimeoutRef.current,
                                  );
                                  competitionTooltipTimeoutRef.current =
                                    setTimeout(() => {
                                      setCompetitionScatterTooltip({
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
                          active={competitionScatterTooltip.active}
                          payload={
                            competitionScatterTooltip.payload
                              ? [{ payload: competitionScatterTooltip.payload }]
                              : []
                          }
                          isAnimationActive={false}
                          allowEscapeViewBox={{ x: false, y: false }}
                          cursor={false}
                          wrapperStyle={{
                            zIndex: 9999,
                            transition: "none",
                            pointerEvents: "auto",
                          }}
                        />
                        {/* Horizontal grid (dashed) */}
                        <CartesianGrid
                          horizontal={true}
                          vertical={false}
                          stroke="rgba(0,0,0,0.12)"
                          strokeDasharray="4 4"
                        />

                        {/* Vertical grid (solid) */}
                        <CartesianGrid
                          horizontal={false}
                          vertical={true}
                          stroke="rgba(240, 249, 244, 1)"
                        />
                        {/* here adde -10 to move 0 slightly right due to overlapping of flag on xaxis */}
                        <XAxis
                          type="number"
                          dataKey="x"
                          domain={[0, xAxisMax]}
                          allowDataOverflow={false}
                          ticks={ticks}
                          tickMargin={2}
                          tick={<XAxisBoundaryTick />}
                          tickFormatter={(v) => v.toFixed(xAxisMax >= 5 ? 0 : xAxisMax < 2 ? 2 : 1)}
                          label={{
                            value:
                              competitionGraph?.x_axis?.label ||
                              "Patients per month per site",
                            position: "bottom",
                            offset: 2,
                            style: {
                              fill: "rgba(0,0,0,0.4)",
                              fontSize: 12,
                              fontWeight: "400",
                              fontFamily: "Rubik",
                            },
                          }}
                          axisLine={{ stroke: "#9CA3AF" }}
                          tickLine={false}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          width={competitionYAxisWidth}
                          domain={[yMin, yMax]}
                          padding={{ bottom: COMPETITION_Y_PADDING_BOTTOM }}
                          ticks={competitionYTicks}
                          tickFormatter={formatCompetitionYTick}
                          tick={{
                            fontSize: 12,
                            fontFamily: "Rubik",
                            fill: "rgba(0,0,0,0.7)",
                          }}
                          axisLine={{ stroke: "#9CA3AF" }}
                          tickLine={false}
                          label={{
                            value:
                              competitionGraph?.y_axis?.label ||
                              "Planned Patient By Population (%)",
                            angle: -90,
                            position: "insideLeft",
                            offset: 3,
                            dx: 0,
                            style: {
                              textAnchor: "middle",
                              fontSize: 12,
                              fontWeight: "400",
                              fill: "rgba(0,0,0,0.4)",
                              fontFamily: "Rubik",
                            },
                          }}
                        />

                        <ZAxis
                          type="number"
                          dataKey="size"
                          range={[200, 1500]}
                        />
                        <Scatter
                          data={filteredCompetition}
                          isAnimationActive={false}
                          shape={({ cx, cy, payload }) => {
                            const r = getRadius(payload.size);
                            const iso2 = payload.code;
                            const safeCx = Math.max(cx, r + 4);
                            // Keep the bubble's top edge inside the plot area so
                            // it isn't clipped by the SVG's top boundary (the
                            // ScatterChart top margin is only 20px).
                            const safeCy = Math.max(cy, r + 4);

                            return (
                              <foreignObject
                                x={safeCx - r}
                                y={safeCy - r}
                                width={r * 2}
                                height={r * 2}
                                style={{ overflow: "visible" }}
                              >
                                <div
                                  onMouseEnter={() => {
                                    clearTimeout(
                                      competitionTooltipTimeoutRef.current,
                                    );
                                    setCompetitionScatterTooltip({
                                      active: true,
                                      payload,
                                    });
                                  }}
                                  onMouseLeave={() => {
                                    clearTimeout(
                                      competitionTooltipTimeoutRef.current,
                                    );
                                    competitionTooltipTimeoutRef.current =
                                      setTimeout(() => {
                                        setCompetitionScatterTooltip({
                                          active: false,
                                          payload: null,
                                        });
                                      }, 200);
                                  }}
                                  style={{
                                    width: r * 2,
                                    height: r * 2,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    background: "#fff",
                                    boxShadow:
                                      "0px 4px 10px rgba(0, 0, 0, 0.18)",

                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {iso2 && (
                                    <Flag
                                      code={iso2.toUpperCase()}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  )}
                                </div>
                              </foreignObject>
                            );
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* CHART 1 */}
            {enrollmentGraphLoading ? (
              <EnrollmentSpeedGraphSkeleton />
            ) : (
              <div className={classes.card} style={{ position: "relative" }}>
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
                <div className={classes.cardHeader}>
                  <div className={classes.cardTitle}>
                    Trial Duration by Country
                  </div>
                  <div className={classes.trialsButtonWrapper}>
                    <div
                      className={classes.trials_text}
                      onClick={() =>
                        hasTrialDurationData &&
                        handleOpenDrawer({
                          table: ["trial_duration_country"],
                          title: "Trial Duration by Country",
                        })
                      }
                      style={{
                        cursor: hasTrialDurationData ? "pointer" : "default",
                        opacity: hasTrialDurationData ? 1 : 0.65,
                      }}
                    >
                      {trialDurationTotalTrials.toLocaleString()} Trials
                    </div>
                  </div>
                </div>

                {/* CHART + LEGEND ROW */}
                <div
                  className={classes.contentRow}
                  style={{ position: "relative" }}
                >
                  {showTrialDurationEmptyState ? (
                    <EmptyGraphState
                      title={
                        showTrialDurationTopFilterEmptyState
                          ? "No trial duration data for these filters"
                          : "No trial duration data available"
                      }
                      description={
                        showTrialDurationTopFilterEmptyState
                          ? "Try a broader phase, stage, or line of therapy selection."
                          : "This view does not have trial duration data for the current selection."
                      }
                      actionLabel={
                        showTrialDurationTopFilterEmptyState
                          ? "Clear top filters"
                          : null
                      }
                      onAction={
                        showTrialDurationTopFilterEmptyState
                          ? clearTopFilters
                          : null
                      }
                    />
                  ) : null}
                  {/* CHART */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TrialDurationChart
                      rows={trialDurationRows}
                      axisMax={trialDurationAxisMax}
                    />
                  </div>
                </div>
              </div>
            )}

            {amendmentGraphLoading ? (
              <AmendmentRiskGraphSkeleton />
            ) : (
              <div className={classes.chartRow} style={{ marginTop: 20 }}>
                {/* LEFT FILTER PANEL (outside the card) */}
                <div style={{ position: "relative" }}>
                  {showAmendmentPanelEmptyState ? (
                    <EmptyGraphState
                      title="Nothing to refine yet"
                      description={
                        showAmendmentTopFilterEmptyState
                          ? "Broaden the top filters to see available amendment types again."
                          : "Amendment types will appear here when graph data is available."
                      }
                      actionLabel={
                        showAmendmentTopFilterEmptyState
                          ? "Clear top filters"
                          : null
                      }
                      onAction={
                        showAmendmentTopFilterEmptyState
                          ? clearTopFilters
                          : null
                      }
                    />
                  ) : null}
                  <div className={classes.filterPanel}>
                    <div className={classes.filterTitle}>
                      {amendmentTypeCount} Types of Amendments
                    </div>

                    <div
                      style={{
                        border: "1px solid rgba(240, 246, 254, 1)",
                        background: "#E5E7EB",
                        width: "calc(100% + 32px)", // 16 left + 16 right padding
                        marginLeft: -16,
                        marginRight: -16,
                        marginTop: 6,
                        marginBottom: 10,
                      }}
                    />
                    {/* SCROLL AREA */}
                    <CustomScrollbar
                      height={VIEWPORT_HEIGHT}
                      trackTop={TRACK_PAD}
                      trackBottom={8}
                      trackRight={-16}
                      trackWidth={6}
                      wrapperStyle={{ flex: 1, minHeight: 0 }}
                      style={{ height: "100%" }}
                    >
                      <div>
                        {!amendmentFilterKeys.length ? (
                          <div
                            style={{
                              fontFamily: "Rubik",
                              fontSize: 14,
                              color: "rgba(0,0,0,0.5)",
                              paddingTop: 8,
                              paddingRight: 12,
                            }}
                          >
                            {amendmentGraphLoading
                              ? "Loading amendment types..."
                              : "No amendment types returned by the API"}
                          </div>
                        ) : (
                          finalAmendmentKeys.map((key, i) => {
                            const isChecked = activeKeys.includes(key);
                            const entry =
                              amendmentBaseColorMap[key] || {
                                family: AMENDMENT_COLOR_FAMILIES[0],
                                shadeOffset: 0,
                              };
                            const color = entry.family[0];
                            const isLast =
                              i === amendmentFilterKeys.length - 1;

                            return (
                              <div key={key}>
                                <label
                                  className={classes.filterLabel}
                                  style={{ position: "relative" }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleKey(key)}
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      opacity: 0,
                                      width: 1,
                                      height: 1,
                                      margin: 0,
                                      padding: 0,
                                      pointerEvents: "none",
                                    }}
                                  />
                                  <span
                                    aria-hidden="true"
                                    style={{
                                      width: 14,
                                      height: 14,
                                      marginRight: 10,
                                      borderRadius: 3,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background: isChecked ? color : "#fff",
                                      border: `1px solid ${
                                        isChecked ? color : "#D1D5DB"
                                      }`,
                                      boxSizing: "border-box",
                                      flex: "0 0 14px",
                                    }}
                                  >
                                    {isChecked ? (
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M4.8 9.2L2.3 6.7l1-1 1.5 1.5 4-4 1 1-5 5z"
                                          fill="#fff"
                                        />
                                      </svg>
                                    ) : null}
                                  </span>
                                  {key}
                                </label>

                                {!isLast && (
                                  <div
                                    style={{
                                      border:
                                        "1px solid rgba(240, 246, 254, 1)",
                                      background: "#E5E7EB",
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CustomScrollbar>
                  </div>
                </div>

                {/* GRAPH CARD (right) */}
                <div className={classes.card} style={{ position: "relative", flex: 1, minWidth: 0, marginTop: 0, height: 469 }}>
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
                <div className={classes.cardHeader}>
                  <div className={classes.cardTitle}>
                    Amendment Risk vs Enrollment Speed
                  </div>
                  <div className={classes.trialsButtonWrapper}>
                    <div
                      className={classes.trials_text}
                      style={{
                        cursor: hasAmendmentData ? "pointer" : "default",
                        opacity: hasAmendmentData ? 1 : 0.65,
                      }}
                    >
                      {Number(amendmentSummary || 0).toLocaleString("en-US")}{" "}
                      Trials
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                  <div style={{ flex: 1, height: 383, position: "relative" }}>
                    {showAmendmentEmptyState ? (
                      <EmptyGraphState
                        title={
                          showAmendmentTopFilterEmptyState
                            ? "No amendment data for these filters"
                            : showAmendmentSelectionEmptyState
                              ? "No amendment types selected"
                              : "No amendment data available"
                        }
                        description={
                          showAmendmentTopFilterEmptyState
                            ? "Try a broader phase, stage, or line of therapy selection."
                            : showAmendmentSelectionEmptyState
                              ? "Select one or more amendment types to compare risk and enrollment speed."
                              : "This view does not have amendment graph data for the current selection."
                        }
                        actionLabel={
                          showAmendmentTopFilterEmptyState
                            ? "Clear top filters"
                            : showAmendmentSelectionEmptyState
                              ? "Reset amendment types"
                              : null
                        }
                        onAction={
                          showAmendmentTopFilterEmptyState
                            ? clearTopFilters
                            : showAmendmentSelectionEmptyState
                              ? resetAmendmentSelection
                              : null
                        }
                      />
                    ) : null}
                    <ResponsiveContainer>
                      <ScatterChart
                        margin={{ top: 20, right: 40, left: 0, bottom: 6 }}
                      >
                        <CartesianGrid
                          horizontal={true}
                          vertical={false}
                          stroke="rgba(0,0,0,0.12)"
                          strokeDasharray="4 4"
                        />

                        {/* Vertical grid (solid) */}
                        <CartesianGrid
                          horizontal={false}
                          vertical={true}
                          stroke="rgba(0,0,0,0.12)"
                        />
                        <XAxis
                          type="number"
                          dataKey="recruitmentSpeed"
                          domain={amendmentXAxisDomain}
                          ticks={amendmentXAxisTicks}
                          allowDuplicatedCategory={false}
                          minTickGap={20}
                          tick={((minTick, maxTick) => (props) => {
                            const value = props?.payload?.value;
                            const isMax = Number.isFinite(maxTick) && value === maxTick;
                            const isMin = Number.isFinite(minTick) && value === minTick;

                            const textAnchor = isMax ? "end" : isMin ? "start" : "middle";
                            const dx = isMax ? -6 : isMin ? 6 : 0;

                            return (
                              <g transform={`translate(${props.x},${props.y})`}>
                                <text
                                  x={0}
                                  y={0}
                                  dy={12}
                                  dx={dx}
                                  textAnchor={textAnchor}
                                  style={{
                                    fontSize: 12,
                                    fontFamily: "Rubik",
                                    fill: "rgba(0,0,0,0.7)",
                                    fontWeight: 400,
                                  }}
                                >
                                  {formatAxisTick(value)}
                                </text>
                              </g>
                            );
                          })(amendmentXAxisTicks?.[0], amendmentXAxisTicks?.[amendmentXAxisTicks?.length - 1])}
                          axisLine={{ stroke: "rgba(0,0,0,0.3)" }}
                          tickMargin={2}
                          tickLine={false}
                          label={{
                            value: amendmentXAxisLabel,
                            position: "insideBottom",
                            offset: -4,
                            style: {
                              fontSize: 12,
                              fontFamily: "Rubik",
                              fill: "rgba(0,0,0,0.4)",
                              textAnchor: "middle",
                              fontWeight: 400,
                            },
                          }}
                        />

                        <YAxis
                          type="number"
                          dataKey="avgAmendments"
                          domain={amendmentYAxisDomain}
                          padding={{ bottom: 22 }}
                          ticks={amendmentYAxisTicks}
                          axisLine={{
                            show: true,
                            stroke: "#9CA3AF",
                            strokeWidth: 1,
                          }}
                          tickLine={false}
                          tickFormatter={(value) => {
                            const numericValue = Number(value);
                            if (!Number.isFinite(numericValue)) return value;
                            if (numericValue === 0) return "0.1";

                            const span =
                              Number(amendmentYAxisDomain?.[1]) -
                              Number(amendmentYAxisDomain?.[0]);

                            if (Number.isFinite(span) && span > 0) {
                              const decimals = span <= 0.1 ? 3 : span <= 1 ? 2 : 1;
                              return Number.isInteger(numericValue)
                                ? numericValue.toString()
                                : numericValue.toFixed(decimals);
                            }

                            return formatAxisTick(numericValue);
                          }}
                          tick={{
                            fontSize: 12,
                            fill: "rgba(0,0,0,0.7)",
                            fontFamily: "Rubik",
                          }}
                          label={{
                            value: amendmentYAxisLabel,
                            angle: -90,
                            position: "insideLeft",
                            offset: 3,
                            dx: 10,
                            style: {
                              textAnchor: "middle",
                              fontSize: 12,
                              fill: "rgba(0, 0, 0, 0.4)",
                              fontWeight: 400,
                              fontFamily: "Rubik",
                            },
                          }}
                        />

                        <ReferenceLine
                          x={amendmentCenterX}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />
                        <ReferenceLine
                          y={amendmentCenterY}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />

                        <ReferenceArea
                          x1={amendmentXAxisDomain[0]}
                          x2={amendmentCenterX}
                          y1={amendmentCenterY}
                          y2={amendmentYAxisDomain[1]}
                          fill="rgba(153, 27, 27, 0.08)"
                        />
                        <ReferenceLine
                          x={amendmentCrownX}
                          stroke="rgba(250, 212, 174, 1)"
                          strokeWidth={1}
                        />
                        <ReferenceDot
                          x={amendmentLeftX}
                          y={amendmentTopY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={20}
                              fontFamily="Rubik"
                            >
                              <tspan x={viewBox.x} dy="-6">
                                High Risk
                              </tspan>
                              <tspan x={viewBox.x} dy="22">
                                Slow Recruitment
                              </tspan>
                            </text>
                          )}
                        />

                        {/* TOP RIGHT */}
                        <ReferenceDot
                          x={amendmentRightX}
                          y={amendmentTopY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={20}
                              fontFamily="Rubik"
                            >
                              <tspan x={viewBox.x} dy="-6">
                                High Risk
                              </tspan>
                              <tspan x={viewBox.x} dy="22">
                                Fast Recruitment
                              </tspan>
                            </text>
                          )}
                        />

                        {/* BOTTOM LEFT */}
                        <ReferenceDot
                          x={amendmentLeftX}
                          y={amendmentBottomY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={20}
                              fontFamily="Rubik"
                            >
                              <tspan x={viewBox.x} dy="-6">
                                Low Risk
                              </tspan>
                              <tspan x={viewBox.x} dy="22">
                                Slow Recruitment
                              </tspan>
                            </text>
                          )}
                        />

                        {/* BOTTOM RIGHT */}
                        <ReferenceDot
                          x={amendmentRightX}
                          y={amendmentBottomY}
                          r={0}
                          label={({ viewBox }) => (
                            <text
                              x={viewBox.x}
                              y={viewBox.y}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.35)"
                              fontSize={20}
                              fontFamily="Rubik"
                            >
                              <tspan x={viewBox.x} dy="-6">
                                Low Risk
                              </tspan>
                              <tspan x={viewBox.x} dy="22">
                                Fast Recruitment
                              </tspan>
                            </text>
                          )}
                        />
                        <ZAxis
                          type="number"
                          dataKey="size"
                          range={[160, 1000]}
                        />
                        <Tooltip
                          content={(props) => {
                            if (!props.active) return null;

                            return (
                              <div
                                onMouseEnter={() => {
                                  clearTimeout(
                                    amendmentsTooltipTimeoutRef.current,
                                  );
                                }}
                                onMouseLeave={() => {
                                  clearTimeout(
                                    amendmentsTooltipTimeoutRef.current,
                                  );
                                  amendmentsTooltipTimeoutRef.current =
                                    setTimeout(() => {
                                      setAmendmentsScatterTooltip({
                                        active: false,
                                        payload: null,
                                      });
                                    }, 200);
                                }}
                              >
                                <CustomTooltipAmendments {...props} />
                              </div>
                            );
                          }}
                          active={amendmentsScatterTooltip.active}
                          payload={
                            amendmentsScatterTooltip.payload
                              ? [{ payload: amendmentsScatterTooltip.payload }]
                              : []
                          }
                          isAnimationActive={false}
                          allowEscapeViewBox={{ x: false, y: false }}
                          wrapperStyle={{
                            transition: "none",
                            pointerEvents: "auto",
                            zIndex: 5,
                          }}
                        />
                        <Scatter
                          data={jitteredAmendments}
                          isAnimationActive={false}
                        >
                          {jitteredAmendments.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={getAmendmentBubbleColor(entry)}
                              onMouseEnter={() => {
                                clearTimeout(
                                  amendmentsTooltipTimeoutRef.current,
                                );
                                setAmendmentsScatterTooltip({
                                  active: true,
                                  payload: entry,
                                });
                              }}
                              onMouseLeave={() => {
                                clearTimeout(
                                  amendmentsTooltipTimeoutRef.current,
                                );
                                amendmentsTooltipTimeoutRef.current =
                                  setTimeout(() => {
                                    setAmendmentsScatterTooltip({
                                      active: false,
                                      payload: null,
                                    });
                                  }, 200);
                              }}
                            />
                          ))}
                        </Scatter>
                        <ReferenceDot
                          x={amendmentCrownX}
                          y={amendmentCrownY}
                          r={0}
                          isFront
                          shape={({ cx, cy }) => (
                            <image
                              href={crown}
                              x={cx - 7}
                              y={cy + 14}
                              width={14}
                              height={14}
                            />
                          )}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                </div>
              </div>
            )}
            <CommonRightDrawer
              open={openDrawer}
              onClose={() => setOpenDrawer(false)}
              onBack={handleBack}
              title={drawerTitle}
              width={950}
              onContentScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                handleTableScroll(scrollTop, scrollHeight, clientHeight);
              }}
              rightHeader={
                !viewSummary && (
                  <div style={styles.controls}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      {/* Data Traceability Toggle Switch */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Switch
                          checked={isAlertActive || false}
                          onChange={(e) =>
                            dispatch(toggleAlert(e.target.checked))
                          }
                          sx={{
                            width: 44,
                            height: 25,
                            padding: 0,
                            "& .MuiSwitch-switchBase": {
                              padding: "2px",
                              "&.Mui-checked": {
                                color: "#fff",
                                "& + .MuiSwitch-track": {
                                  backgroundColor: "#2563EB",
                                  opacity: 1,
                                },
                              },
                            },
                            "& .MuiSwitch-thumb": {
                              width: 20,
                              height: 20,
                              backgroundColor: "#fff",
                            },
                            "& .MuiSwitch-track": {
                              backgroundColor: "#D1D5DB",
                              opacity: 1,
                              borderRadius: 14,
                            },
                          }}
                        />
                        <span
                          style={{
                            fontSize: "14px",
                            fontFamily: "Rubik",
                            color: "rgba(0, 0, 0, 0.8)",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Data Traceability
                        </span>
                      </div>

                      {/* Active / Non-Active Buttons (competition intensity only) */}
                      {activeTable.some((t) =>
                        String(t).startsWith("competitionintensity"),
                      ) && (
                        <div style={styles.toggle}>
                          {["Active", "Non-Active"].map((v) => (
                            <button
                              key={v}
                              onClick={() => handleCompetitionViewChange(v)}
                              style={{
                                ...styles.toggleBtn,
                                ...(view === v ? styles.toggleActive : {}),
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

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
                        <CircularProgress
                          size={16}
                          thickness={5}
                          sx={{ color: "#2666BE" }}
                        />
                      ) : (
                        <img
                          src={downloadIcon}
                          alt="download"
                          style={{
                            width: 16,
                            height: 16,
                            display: "block",
                          }}
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
                <FeasibilityStrategies
                  filters={filters}
                  apiFilters={topFilters}
                  data={normalizedSections}
                  activeTable={activeTable}
                  view={view}
                  drawerLoading={drawerLoading}
                  sessionKey={currentSessionKey}
                  onSelect={(nct_id) => setViewSummary(nct_id)}
                  onScroll={handleTableScroll}
                  isFetchingMore={isFetchingMoreRows}
                />
              ) : (
                <ExecuiteSummaryDrawer nctId={viewSummary} sessionKey={currentSessionKey} />
              )}
            </CommonRightDrawer>
          </div>
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
        {/* HEADER */}
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

export { TrialDurationChart, buildTrialDurationRows };
