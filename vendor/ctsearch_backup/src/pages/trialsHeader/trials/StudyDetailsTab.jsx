import {
  FemaleIcon,
  MailIcon,
  MaleIcon,
  MobileIcon,
  ProfileIcon,
} from "../../../assets";
import icon from "../../../assets/Icon.png";
import TrialSiteLocations from "./TrailSiteLocation";
import CommonTableCard from "../../../common/CommonTableCard";
import Timeline from "./TimeLine";
import EvidenceHoverHeader from "./EvidenceHoverCell";
import { getTraceability, getTraceabilityList } from "../../../utils/helpers/helper";
import { trialStyles } from "./style";
import React, { useRef, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CancerTypeIconSrc from "../../../assets/icons/cancer_type.svg";
import MaleIconSrc from "../../../assets/icons/male.svg";
import FemaleIconSrc from "../../../assets/icons/female.svg";
import PhysicalConditionIconSrc from "../../../assets/icons/physical_condition.svg";
import StageIconSrc from "../../../assets/icons/multi_layer.svg";
import LayersIcon from "@mui/icons-material/Layers";
import PriorTreatmentIconSrc from "../../../assets/icons/prior_treatment.svg";
import ComorbiditiesIconSrc from "../../../assets/icons/co-morbidities.svg";
import PersonIcon from "@mui/icons-material/Person";
import EndpointAnalysisCard from "./EndpointAnalysisCard";

// Only this OncoSuite study shows multi-traceability chips + swipe arrows.
const MULTI_TRACE_ONCOSUITE_ID = "wD7-VqO-nZf";

// The 11 hardcoded OncoSuite studies (the same ids as CUSTOM_RESULT_ONCOSUITE_IDS
// in ResultsTab) serve eligibility_criteria in a NEW split shape:
//   { key, values[], headings[], values_traceability[], headings_traceability[] }
// instead of the legacy { key, value, data_traceability }. `headings` entries
// carry the `**Bold Label:**` markdown; `values` are plain (pipe-separated).
// Each rendered row is index-matched to its own traceability record.
// See isSplitEligibilityItem / flattenSplitEligibilityItem below — the shape is
// detected from the item itself, so no id list has to be kept in sync here.

// Renders "|" separators in a lighter gray with breathing room so each
// pipe-separated value reads as a distinct item.
const renderPipes = (text, keyPrefix) => {
  const str = String(text ?? "");
  if (!str.includes("|")) return str;
  return str.split(/(\|)/g).map((part, i) =>
    part === "|" ? (
      <span key={`${keyPrefix}-${i}`} style={{ color: "rgba(0,0,0,0.3)", margin: "0 6px" }}>
        |
      </span>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  );
};

// The backend may wrap emphasis in markdown-style `**bold**`. Render those
// segments as real bold text and strip the surrounding asterisks. Plain
// (non-bold) segments still get pipe-separator styling.
// `normalizeSpacing` (gated to a single study) guarantees one space after a
// bold label's colon, fixing tight cases like "Biomarkers:CTLA-4".
const renderMarkdownBold = (text, normalizeSpacing = false) => {
  let str = String(text ?? "");
  if (normalizeSpacing) {
    // Insert a space when a "**label:**" is glued to the following text.
    str = str.replace(/(\*\*[^*]+:\*\*)(?=\S)/g, "$1 ");
  }
  if (!str.includes("**")) return renderPipes(str, "p");
  return str.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const match = /^\*\*([^*]+)\*\*$/.exec(part);
    if (match) {
      return (
        <strong key={i} style={{ fontWeight: 600 }}>
          {match[1]}
        </strong>
      );
    }
    return <React.Fragment key={i}>{renderPipes(part, `p-${i}`)}</React.Fragment>;
  });
};

const ELIGIBILITY_CATEGORIES = [
  { key: "prior_treatment",   label: "Prior Treatment",    icon: null,       iconSrc: PriorTreatmentIconSrc,   color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  { key: "cancer_type",       label: "Cancer Type",        icon: null,       iconSrc: CancerTypeIconSrc,        color: "#059669", bg: "rgba(5,150,105,0.12)" },
  { key: "stage",             label: "Disease Stage",      icon: null,       iconSrc: StageIconSrc,             color: "#D97706", bg: "rgba(217,119,6,0.12)" },
  { key: "comorbidities",     label: "Comorbidities",      icon: null,       iconSrc: ComorbiditiesIconSrc,     color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
  { key: "demographics",      label: "Demographics",       icon: PersonIcon, iconSrc: null,                     color: "#0891B2", bg: "rgba(8,145,178,0.12)" },
  { key: "physical_condition",label: "Physical Condition", icon: null,       iconSrc: PhysicalConditionIconSrc, color: "#EA580C", bg: "rgba(234,88,12,0.12)" },
];

const DEFAULT_INCLUSION = { icon: CheckRoundedIcon, color: "rgba(31,139,77,1)", bg: "rgba(34,154,94,0.14)" };
const DEFAULT_EXCLUSION = { icon: CloseRoundedIcon, color: "rgba(193,70,70,1)", bg: "rgba(239,68,68,0.14)" };

// Maps API key → ELIGIBILITY_CATEGORIES key
const API_KEY_TO_CATEGORY = {
  cancer_type:        "cancer_type",
  biomarker_variant:  "cancer_type",
  cancer_stage:       "stage",
  prior_therapy:      "prior_treatment",
  comorbidities:      "comorbidities",
  physical_condition: "physical_condition",
  physical_state:     "physical_condition",
};

function getEligibilityCategory(apiKey = "") {
  const key = (apiKey || "").trim();
  if (key === "Male")   return { ...ELIGIBILITY_CATEGORIES.find(c => c.key === "demographics"), iconSrc: MaleIconSrc, bothGenders: false };
  if (key === "Female") return { ...ELIGIBILITY_CATEGORIES.find(c => c.key === "demographics"), iconSrc: FemaleIconSrc, bothGenders: false };
  const catKey = API_KEY_TO_CATEGORY[key];
  if (!catKey) return null;
  return ELIGIBILITY_CATEGORIES.find(c => c.key === catKey) || null;
}

// Flattens an item whose value may be a string or array into individual display rows
function flattenEligibilityItem(item) {
  const values = Array.isArray(item.value) ? item.value : [item.value];
  return values.map(v => ({ ...item, value: v }));
}

// Flattens the NEW split shape into display rows. `headings` come first (they are
// the `**Bold Label:** a | b | c` group titles), then the plain `values`. Each row
// keeps the item's `key` so the category logo still resolves, and gets exactly the
// one traceability record at its own index — from headings_traceability for a
// heading row, values_traceability for a value row.
function flattenSplitEligibilityItem(item = {}) {
  const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

  const build = (text, trace) => ({
    key: item.key,
    value: text,
    // getTraceabilityList reads `data_traceability`; hand it this row's single
    // record so hover evidence lines up 1:1 with the text shown.
    data_traceability: trace ? [trace] : [],
  });

  const headings = asArray(item.headings);
  const headingTraces = asArray(item.headings_traceability);
  const values = asArray(item.values);
  const valueTraces = asArray(item.values_traceability);

  return [
    ...headings.map((text, i) => build(text, headingTraces[i])),
    ...values.map((text, i) => build(text, valueTraces[i])),
  ].filter((row) => String(row.value ?? "").trim() !== "");
}

// True when the payload item uses the new split shape rather than legacy `value`.
const isSplitEligibilityItem = (item = {}) =>
  Array.isArray(item?.values) || Array.isArray(item?.headings);

// Isolated component for each drug item to stabilize layout positioning references
const DrugHoverItem = ({ drugName, drugData }) => {
  const [isCurrentlyHovered, setIsCurrentlyHovered] = useState(false);
  const localItemRef = useRef(null);
  const normalizedDrugName = String(drugName || "").trim().toLowerCase();
  const isMeaningfulText = (value) => {
    const normalizedValue = String(value ?? "").trim().toLowerCase();
    if (!normalizedValue) return false;

    const placeholderTokens = new Set([
      "n",
      "a",
      "na",
      "none",
      "null",
      "not",
      "specified",
      "available",
    ]);

    const tokens = normalizedValue
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!tokens.length) return false;

    return !tokens.every((token) => placeholderTokens.has(token));
  };

  const drugNameTrace = getTraceability(drugData?.drug_name || {});
  const drugTrace = getTraceability(drugData || {});
  const sourceText = String(
    drugNameTrace.source_text || drugTrace.source_text || "",
  ).trim();
  const popupDetails = {
    route: isMeaningfulText(drugData.route?.value) ? drugData.route.value : "N/A",
    dosage: isMeaningfulText(drugData.dosage?.value) ? drugData.dosage.value : "N/A",
    duration: isMeaningfulText(drugData.duration?.value) ? drugData.duration.value : "N/A",
    schedule: isMeaningfulText(drugData.schedule?.value) ? drugData.schedule.value : "N/A",
  };

  // Per-field traceability record for the arm treatment popup (route/dosage/
  // duration/schedule). For the wD7 trial these carry `source_snippet_html`,
  // which EvidenceTraceCard renders as the traceability image.
  const fieldEvidence = (field, armLabel) => {
    const t = getTraceability(drugData?.[field] || {});
    return {
      highlight: t.source_text || "",
      reasoning: t.reasoning || "",
      confidence: t.confidence_score ?? 0,
      source: t.source || "",
      source_link: t.source_link || "",
      source_snippet_html: t.source_snippet_html,
      arm: armLabel,
    };
  };

  const hasPopupBodyData = Object.values(popupDetails).some((value) =>
    isMeaningfulText(value),
  );

  const evidenceData = {
    highlight: sourceText,
    reasoning: isMeaningfulText(drugNameTrace.reasoning)
      ? drugNameTrace.reasoning
      : isMeaningfulText(drugTrace.reasoning)
        ? drugTrace.reasoning
        : "",
    confidence: drugNameTrace.confidence_score ?? 0,
    source: sourceText,
    source_link: isMeaningfulText(drugNameTrace.source_link)
      ? drugNameTrace.source_link
      : isMeaningfulText(drugTrace.source_link)
        ? drugTrace.source_link
        : "",
    details: popupDetails,
  };

  const getPopupStyles = () => {
    if (!localItemRef.current) return {};
    const rect = localItemRef.current.getBoundingClientRect();

    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "10px",
      gap: "12px",
      position: "fixed",
      top: `${rect.bottom + 8}px`,
      left: `${rect.left + rect.width / 2}px`,
      transform: "translateX(-50%)",
      zIndex: 99999,
      width: "280px",
      background: "#FFFFFF",
      boxShadow: "2px 4px 20px rgba(132, 151, 177, 0.21)",
      borderRadius: "4px",
      boxSizing: "border-box",
      pointerEvents: "none"
    };
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "8px",
    padding: hasPopupBodyData ? "4px 10px" : "0",
    fontFamily: "Rubik",
    fontSize: "16px",
    lineHeight: "20px",
    fontWeight: 400,
    color: "rgba(0,0,0,0.68)",
    textTransform: "capitalize",
    backgroundColor: hasPopupBodyData ? "#F2F4F7" : "#FFFFFF",
    border: hasPopupBodyData ? "1px solid #E5E7EB" : "1px solid transparent",
    cursor: hasPopupBodyData ? "default" : "default",
    boxShadow: "none",
  };

  return (
    <div
      ref={localItemRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => hasPopupBodyData && setIsCurrentlyHovered(true)}
      onMouseLeave={() => hasPopupBodyData && setIsCurrentlyHovered(false)}
      style={hasPopupBodyData ? { cursor: "default" } : undefined}
    >
      <span style={chipStyle}>
        {drugName}
      </span>

      {hasPopupBodyData && isCurrentlyHovered && (
        <div style={getPopupStyles()}>
          <div
            style={{
              fontFamily: "'Rubik', sans-serif",
              fontStyle: "normal",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "20px",
              color: "#000000",
              textTransform: "capitalize",
              alignSelf: "stretch"
            }}
          >
            {drugData.drug_name?.value || drugName}
          </div>

          {/* Dosage Row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              width: "100%",
              alignSelf: "stretch"
            }}
          >
            <span style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)", whiteSpace: "nowrap" }}>Dosage:</span>
            <EvidenceHoverHeader
              containerSx={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)", textAlign: "right" }}
              label={evidenceData.details.dosage || "Not Specified"}
              evidence={fieldEvidence("dosage", "Dosage")}
            />
          </div>

          {/* Route Row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              width: "100%",
              alignSelf: "stretch"
            }}
          >
            <span style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)", whiteSpace: "nowrap" }}>Route:</span>
            <EvidenceHoverHeader
              containerSx={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)", textAlign: "right" }}
              label={evidenceData.details.route || "Not Specified"}
              evidence={fieldEvidence("route", "Route")}
            />
          </div>

          {/* Schedule Row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              width: "100%",
              alignSelf: "stretch"
            }}
          >
            <span style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)", whiteSpace: "nowrap" }}>Schedule:</span>
            <EvidenceHoverHeader
              containerSx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                color: "rgba(0, 0, 0, 0.6)",
                textAlign: "right",
                flex: 1,
                minWidth: 0,
                maxWidth: "150px",
                whiteSpace: "normal",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                display: "block",
                marginLeft: "auto",
              }}
              label={evidenceData.details.schedule || "Not Specified"}
              evidence={fieldEvidence("schedule", "Schedule")}
            />
          </div>
          {/* Duration Row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              width: "100%",
              alignSelf: "stretch"
            }}
          >
            <span style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0, 0, 0, 0.6)", whiteSpace: "nowrap" }}>Duration:</span>
            <EvidenceHoverHeader
              containerSx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                color: "rgba(0, 0, 0, 0.6)",
                textAlign: "right",
                flex: 1,
                minWidth: 0,
                whiteSpace: "normal",
                wordBreak: "normal",
                overflowWrap: "break-word",
              }}
              label={evidenceData.details.duration || "Not Specified"}
              evidence={fieldEvidence("duration", "Duration")}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const StudyDetailsTab = ({
  selectedIdData: baseSelectedIdData, // Use an alternative reference name to avoid overwriting parameters directly
  steps,
  nctId,
  source_date,
  version,
  studyDetails = {},
  isDrawerView = false,
  selectedPhase,
}) => {
  // Use fallbacks down the functional stream instead of mutations
  const selectedIdData = studyDetails || baseSelectedIdData;
  const conditionData = selectedIdData?.study_details?.study_design?.value?.condition;

  const getEvidence = (item) => ({
    source_date,
    version,
    nctId,
    highlight: item?.source_text || [],
    arm: item?.title || "Condition",
    reasoning: item?.reasoning,
    confidence: item?.confidence_score,
    source: item?.source,
    source_link: item?.source_link,
    // For the wD7 trial the card renders this HTML as the traceability image.
    // Falls back to the record's data_traceability entry when not flattened.
    source_snippet_html:
      item?.source_snippet_html ??
      getTraceabilityList(item || {})[0]?.source_snippet_html,
  });

  const activePhaseData = selectedIdData?.phases?.find(
    (p) => p.title === selectedPhase
  );

  // Extract nested endpoints derived directly from your active targeted dynamic phase data
  const phaseEndpoints =
    activePhaseData?.value?.[0]?.endpoint?.value ||
    activePhaseData?.endpoint?.value;

  // 2. Grab the nested site object details safely
  const targetStudyDetails = activePhaseData?.value?.[0]?.study_details;
  const sitesData = targetStudyDetails?.sites?.value;

  // The eligibility payload moved. It now lives under the ACTIVE PHASE's
  // study_details and carries an extra nesting level, i.e.
  //   phases[].value[0].study_details.eligibility_criteria.eligibility_criteria.value
  // where the code previously read the flat top-level
  //   study_details.eligibility_criteria.value
  // Both `.eligibility_criteria.value` and the doubled
  // `.eligibility_criteria.eligibility_criteria.value` are accepted, and the
  // candidate roots are tried in order, because `selectedIdData` resolves to
  // `studyDetails` (default `{}`, truthy) so it always wins over
  // `baseSelectedIdData` — the data can sit on either object. Any phase is
  // searched as a last resort so a `selectedPhase` mismatch can't blank the card.
  const readEligibility = (root) => {
    const node = root?.study_details?.eligibility_criteria;
    return node?.value || node?.eligibility_criteria?.value;
  };
  const phaseRoots = []
    .concat(selectedIdData?.phases || [], baseSelectedIdData?.phases || [])
    .flatMap((phase) => phase?.value || []);
  const eligibilityData =
    readEligibility(targetStudyDetails ? { study_details: targetStudyDetails } : null) ||
    readEligibility(selectedIdData) ||
    readEligibility(baseSelectedIdData) ||
    phaseRoots.map(readEligibility).find(Boolean);
  const inclusionList = eligibilityData?.inclusion || [];
  const exclusionList = eligibilityData?.exclusion || [];
  const implications = selectedIdData?.study_details?.strategic_implication?.value;
  const classes = trialStyles();



  const sections = [
    "regulatory_risk",
    "commercial_implication",
    "execution_risk",
    "scientific_opportunity",
  ];
  // const [expandedCols, setExpandedCols] = useState({
  //   inclusion: false,
  //   exclusion: false,
  // });

  // const handleToggle = (type) => {
  //   setExpandedCols((prev) => ({
  //     ...prev,
  //     [type]: !prev[type],
  //   }));
  // };
  // const isAnyExpanded = expandedCols.inclusion || expandedCols.exclusion;
  const [isExpanded, setIsExpanded] = useState(false);

const handleToggle = () => {
  setIsExpanded((prev) => !prev);
};

const isAnyExpanded = isExpanded;
  const CriteriaColumn = ({ title, list, type, isExpanded, onToggle, iconColor, showToggleButton, circleBg, ...props }) => {
    // Only the 11 hardcoded OncoSuite studies serve the split
    // values/headings + *_traceability shape, and it is self-identifying (arrays
    // named `values`/`headings` instead of a `value`), so detect it from the item
    // itself. Keying this off the oncosuite id instead was the bug: the id isn't
    // threaded through every render path, so items silently fell back to the
    // legacy `item.value` reader and the columns came out empty. Legacy payloads
    // still take the original `value` + `data_traceability` path untouched.
    const safeList = (list || []).flatMap((item) =>
      isSplitEligibilityItem(item)
        ? flattenSplitEligibilityItem(item)
        : flattenEligibilityItem(item)
    );
    const visibleItems = isExpanded ? safeList : safeList.slice(0, 5);
    const hasMore = safeList.length > 5;
    const getHex = (twClass) => twClass.match(/\[(.*?)\]/)?.[1] || "";

    return (
      <div
        className="rounded p-6 flex flex-col h-full"
        style={{
          backgroundColor: getHex(props.bgColor),
          borderRadius: 4,
        }}
      >
        <h3
          className="mb-4 pb-2 border-b border-gray-200/60"
          style={{
            fontFamily: "Rubik",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "20px",
            letterSpacing: "0%",
            color: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "start",
            width: "100%",
          }}
        >
          {title}
        </h3>

        <ul className="space-y-3 flex-grow min-w-0">
          {visibleItems.map((item, i) => {
            const cat = getEligibilityCategory(item.key || "");
            const defaults = type === "inclusion" ? DEFAULT_INCLUSION : DEFAULT_EXCLUSION;
            const IconComponent = cat ? cat.icon : defaults.icon;
            const iconFill = cat ? cat.color : defaults.color;
            const iconBg = cat ? cat.bg : defaults.bg;
            return (
            <li
              key={`${type}-${i}`}
              className="flex items-start gap-2.5 min-w-0"
            >
              <Tooltip title={cat ? cat.label : (type === "inclusion" ? "Inclusion" : "Exclusion")} placement="top" arrow>
              {cat?.bothGenders ? (
                <div className="flex-shrink-0 flex items-center gap-1" style={{ cursor: "default" }}>
                  <img src={MaleIconSrc} width={18} height={18} alt="Male" style={{ objectFit: "contain" }} />
                  <img src={FemaleIconSrc} width={18} height={18} alt="Female" style={{ objectFit: "contain" }} />
                </div>
              ) : (
                <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 18, height: 18, cursor: "default" }}>
                  {cat?.iconSrc ? (
                    <img src={cat.iconSrc} width={18} height={18} alt={cat?.label} style={{ width: 18, height: 18, objectFit: "contain", display: "block" }} />
                  ) : (
                    <IconComponent sx={{ width: 18, height: 18, color: iconFill, display: "block", flexShrink: 0 }} />
                  )}
                </div>
              )}
              </Tooltip>

              <div className="min-w-0 flex-1">
                {(() => {
                  const arm =
                    type === "inclusion" ? "Inclusion Criteria" : "Exclusion Criteria";
                  const fullList = getTraceabilityList(item).map((trace) => ({
                    source_date: source_date,
                    version: version,
                    highlight: trace.source_text || "-",
                    source: trace.source || "",
                    arm,
                    reasoning: trace.reasoning || "No reasoning provided.",
                    confidence: trace.confidence_score || "0",
                    nctId: nctId,
                    source_link: trace.source_link,
                    source_type: trace.source_type,
                    source_snippet_html: trace.source_snippet_html,
                    // Structured source-document snippet + terms to highlight in it.
                    snippet: trace.snippet,
                    keywords: trace.keywords,
                  }));
                  // Multi-traceability (chips + swipe arrows) is gated to a single
                  // OncoSuite study for now. Its traceability image URLs embed the
                  // id (…/traceability/wD7-VqO-nZf/…). Every other study keeps the
                  // original single-record behaviour.
                  const isMultiTraceEnabled = fullList.some((e) =>
                    String(e.source || "").includes(MULTI_TRACE_ONCOSUITE_ID)
                  );
                  // Heading rows in the split payload carry `**Label:**` markdown
                  // but their traces have a null `source`, so the multi-trace gate
                  // above can't drive bold-label spacing. Normalize whenever the
                  // text actually has a bold label — exactly when it matters.
                  const normalizeBoldSpacing =
                    isMultiTraceEnabled || String(item.value ?? "").includes("**");
                  const label = (
                    <span
                      className="cursor-pointer block w-full break-words whitespace-normal"
                      style={{
                        fontFamily: "Rubik",
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "20px",
                        letterSpacing: "0%",
                        color: "rgba(0,0,0,0.6)",
                      }}
                    >
                      {renderMarkdownBold(item.value, normalizeBoldSpacing)}
                    </span>
                  );
                  return isMultiTraceEnabled ? (
                    <EvidenceHoverHeader label={label} evidenceList={fullList} />
                  ) : (
                    <EvidenceHoverHeader label={label} evidence={fullList[0]} />
                  );
                })()}
              </div>
            </li>
            );
          })}
        </ul>

        {hasMore && showToggleButton && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-6 text-left flex items-center"
            style={{
              fontFamily: "Rubik",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "20px",
              letterSpacing: "0%",
              color: "rgba(0,0,0,0.8)",
            }}
          >
            {isExpanded ? "Show less" : "Show all"}
            <span
              className="ml-1"
              style={{
                display: "inline-block",
                transform: isExpanded ? "rotate(-90deg)" : "rotate(0deg)",
              }}
            >
              {">"}
            </span>
          </button>
        )}
      </div>
    );
  };

  const StrategicSection = ({ title, items }) => {
    if (!items || items.length === 0) return null;

    return (
      <>
        <p
          className="text-md font-semibold mt-4"
          style={{
            fontSize: "17px",
            fontWeight: "500",
            fontFamily: "Rubik",
            color: "rgba(0, 0, 0, 0.8)",
            lineHeight: "20px",
          }}
        >
          {title}
        </p>
        {items.map((text, index) => (
          <p
            key={index}
            className="mt-3 flex items-start space-x-2"
            style={{ color: "rgba(0, 0, 0, 0.8)" }}
          >
            <img src={icon} width={18} height={18} alt="bullet-icon" />
            <span
              style={{
                textAlign: "justify",
                color: "rgba(0, 0, 0, 0.6)",
                fontSize: "14px",
                fontFamily: "Rubik",
                fontWeight: "400",
                lineHeight: "18px",
              }}
            >
              {text}
            </span>
          </p>
        ))}
      </>
    );
  };

  return (
    <>
      <div>
        <div
          className="bg-white shadow-sm p-5 font-sans"
          style={{
            boxShadow: "1px 8px 34px 0px #99A9BE1A",
            borderRadius: 4,
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
<div className="flex w-full gap-4 items-stretch">
            <div className="flex-1">
              <CriteriaColumn
                title="Inclusion"
                type="inclusion"
                list={inclusionList}
                isExpanded={isExpanded}
                onToggle={handleToggle}
                showToggleButton={true}
                bgColor="bg-[#F0FDF4]"
                borderColor="border-[#DCFCE7]"
                circleBg="bg-[rgba(34,154,94,0.14)]"
                iconColor="text-[rgba(31,139,77,1)]"
                source_date={source_date}
                version={version}
                nctId={nctId}
              />
            </div>

            <div className="flex-1">
              <CriteriaColumn
                title="Exclusion"
                type="exclusion"
                list={exclusionList}
                isExpanded={isExpanded}
                onToggle={handleToggle}
                showToggleButton={false}
                bgColor="bg-[#FEF2F2]"
                borderColor="border-[#FEE2E2]"
                circleBg="bg-[rgba(239,68,68,0.14)]"
                iconColor="text-[rgba(239,68,68,1)]"
                source_date={source_date}
                version={version}
                nctId={nctId}
              />
            </div>
          </div>
        </div>

        {/* {!isDrawerView && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "1px 8px 34px 0px #99A9BE1A",
            borderRadius: 4,
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
          className="p-3 shadow-md mb-4 mt-5"
        >
          <h1 className={classes.headers_title}>
            {selectedIdData?.study_details?.patient_population?.title || "Age & Gender"}
          </h1>
          <div className="grid grid-cols-2 gap-10">
            {selectedIdData?.study_details?.age_gender?.value ? (
              Object.entries(selectedIdData.study_details.age_gender.value).map(
                ([key, detail]) => {
                  const lowerKey = key.toLowerCase();
                  const displayKey = `${key.replace(/_/g, " ").charAt(0).toUpperCase()}${key
                    .replace(/_/g, " ")
                    .slice(1)}`;

                  const isMale = lowerKey.includes("male") && !lowerKey.includes("female");

                  return (
                    <div key={key} className="flex items-center gap-1">
                      <img
                        src={isMale ? MaleIcon : FemaleIcon}
                        style={{ width: 18, height: 18 }}
                        alt={key}
                      />
                      <div className="flex items-center gap-1">
                        <span className={classes.male_text}>
                          {displayKey}:
                        </span>
                        <EvidenceHoverHeader
                          label={detail?.value || "-"}
                          evidence={getEvidence(detail)}
                          isCellLevel={true}
                          className={classes.patient_demo_value}
                        />
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <p className="text-gray-400 italic text-sm">
                No demographic data available
              </p>
            )}
          </div>
        </div>
        )} */}

        <h1 className={classes.headerMain_study_title}>Study Arms</h1>
        <CommonTableCard
          title="Study Arms"
          hideTitle={true}
          cardVariant="study_arms"
          useFigmaStyles={true}
          noTopMargin={true}
          columns={[
            { label: "Arm", key: "arm" },
            { label: "Treatment", key: "treatment" },
          ]}
          data={[...(selectedIdData?.study_details?.study_arms?.value || [])]
            .sort((a, b) => {
              const rank = (row) => {
                const t = row?.arm?.type?.toLowerCase() || "";
                if (t.includes("experimental")) return 0;
                if (t.includes("control")) return 1;
                return 2;
              };
              return rank(a) - rank(b);
            })
            .map((row) => {
            const isControl = row.arm?.type?.toLowerCase().includes("control");

            const getStatusColor = (status) => {
              const s = status?.toLowerCase() || "";
              if (s.includes("actively")) return "#22C55E";
              if (s.includes("not yet")) return "#F97316";
              if (s.includes("closed") || s.includes("completed")) return "#EF4444";
              return "#9CA3AF";
            };

            const statusTooltipSlotProps = {
              tooltip: {
                sx: {
                  backgroundColor: "#FFFFFF",
                  color: "rgba(0, 0, 0, 0.8)",
                  borderRadius: "8px",
                  padding: "10px",
                  boxShadow: "0px 4px 10px rgba(130, 143, 169, 0.15)",
                  fontFamily: "Rubik",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0%",
                  maxWidth: "none",
                },
              },
              arrow: {
                sx: {
                  color: "#FFFFFF",
                  "&:before": {
                    boxShadow: "0px 4px 10px rgba(130, 143, 169, 0.15)",
                  },
                },
              },
            };

            const armStatusColor = getStatusColor(row.arm?.arm_status);

            const armCell = isDrawerView ? (
              <div className="flex flex-col gap-2" style={{ minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "Rubik",
                    fontSize: "16px",
                    lineHeight: "20px",
                    fontWeight: 400,
                    color: "rgba(0,0,0,0.7)",
                    minWidth: 0,
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  {row.arm?.value || "—"}
                </span>
                <div>
                  <span
                    className="px-3 py-1 rounded-full border cursor-default arm-type-pill"
                    style={{
                      backgroundColor: "#F0F6FE",
                      borderColor: "#DCE9FC",
                      fontFamily: "Rubik",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "20px",
                    }}
                  >
                    {isControl ? "Control" : row.arm?.type || "Experimental"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2" style={{ minWidth: 0 }}>
                <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  {row.arm?.arm_status && (
                    <Tooltip
                      title={row.arm?.arm_status}
                      arrow
                      placement="top"
                      slotProps={statusTooltipSlotProps}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: armStatusColor,
                          flexShrink: 0,
                          display: "inline-block",
                          cursor: "pointer",
                        }}
                      />
                    </Tooltip>
                  )}
                  <span
                    style={{
                      fontFamily: "Rubik",
                      fontSize: "16px",
                      lineHeight: "20px",
                      fontWeight: 400,
                      color: "rgba(0,0,0,0.7)",
                      minWidth: 0,
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                  >
                    {row.arm?.value || "—"}
                  </span>
                </div>
                <div>
                  <span
                    className="px-3 py-1 rounded-full border cursor-default arm-type-pill"
                    style={{
                      backgroundColor: "#F0F6FE",
                      borderColor: "#DCE9FC",
                      fontFamily: "Rubik",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "20px",
                    }}
                  >
                    {isControl ? "Control" : row.arm?.type || "Experimental"}
                  </span>
                </div>
              </div>
            );

            const treatmentGroups = row.treatment?.value || [];
            // Show titles only when there are multiple treatment groups under the same arm
            const showStratificationTitles = treatmentGroups.length > 1;
            const treatmentCell = (
              <div className="flex flex-col gap-4">
                {treatmentGroups.map((treat, tIdx) => {
                  const isArrayData = Array.isArray(treat.value);

                  return (
                    <div key={tIdx} className="flex flex-col gap-1">
                      {treat.title && showStratificationTitles &&
                        (isDrawerView ? (
                          <span
                            style={{
                              fontFamily: "Rubik",
                              fontSize: "16px",
                              lineHeight: "20px",
                              fontWeight: 500,
                              color: "rgba(0,0,0,0.7)",
                            }}
                          >
                            {treat.title}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {treat.treatment_status && (
                              <Tooltip
                                title={treat.treatment_status}
                                arrow
                                placement="top"
                                slotProps={statusTooltipSlotProps}
                              >
                                <span
                                  style={{
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    backgroundColor: !isArrayData && (!treat.value || treat.value === "---")
                                      ? "#9CA3AF"
                                      : getStatusColor(treat.treatment_status),
                                    flexShrink: 0,
                                    display: "inline-block",
                                  }}
                                />
                              </Tooltip>
                            )}
                            <span
                              style={{
                                fontFamily: "Rubik",
                                fontSize: "16px",
                                lineHeight: "20px",
                                fontWeight: 500,
                                color: "rgba(0,0,0,0.7)",
                              }}
                            >
                              {treat.title}
                            </span>
                          </div>
                        ))}

                      {isArrayData ? (
                        <div className={`flex flex-col gap-1`}>
                          <div className="flex flex-wrap items-center gap-1 text-[16px]">
                            {treat.value.map((drug, index) => (
                              <React.Fragment key={index}>
                                <DrugHoverItem drugName={drug.drug_name?.value || "Unknown Drug"} drugData={drug} />
                                {index < treat.value.length - 1 && (
                                  <span
                                    className="inline-flex items-center justify-center mx-1"
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      color: "rgba(0,0,0,0.7)",
                                      fontSize: "18px",
                                      lineHeight: "18px",
                                      fontWeight: 400,
                                    }}
                                  >
                                    +
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ) : !treat.value || treat.value === "---" ? (
                        <div className="text-[16px] text-gray-400">
                          ---
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-2 text-[16px]">
                          {String(treat.value || "")
                            .split(/(\s*[+/]\s*)/)
                            .map((part, pIdx) => {
                              const trimmed = part.trim();
                              if (trimmed === "+" || trimmed === "/") {
                                return (
                                  <span
                                    key={pIdx}
                                    className="inline-flex items-center justify-center"
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      color: "rgba(0,0,0,0.7)",
                                      fontSize: "18px",
                                      lineHeight: "18px",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {trimmed}
                                  </span>
                                );
                              }
                              if (!trimmed) return null;
                              return (
                                <span key={pIdx}>
                                  <DrugHoverItem
                                    drugName={trimmed}
                                    drugData={(() => {
                                      const t = getTraceability(treat);
                                      return {
                                        source_text: t.source_text || "",
                                        reasoning: t.reasoning || "",
                                        confidence_score: t.confidence_score ?? 0,
                                        source: t.source || t.source_text || "",
                                        source_link: t.source_link || "",
                                      };
                                    })()}
                                  />
                                </span>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
            return { arm: armCell, treatment: treatmentCell };
          })}
        />

        <h1 className={classes.headerMain_study_title}>Endpoints</h1>
        <EndpointAnalysisCard 
          phaseEndpoints={phaseEndpoints}
          selectedIdData={selectedIdData}
          source_date={source_date}
          version={version}
          nctId={nctId}
        />
        {/* <CommonTableCard
          title="Endpoints"
          hideTitle={true}
          useFigmaStyles={true}
          columns={[
            { label: "Endpoint", key: "endpoint" },
            // { label: "Type & Rationale", key: "type_and_rationale" },
            { label: "Measurement & Criteria", key: "measurement_and_criteria" },
            { label: "Timing & Evaluator", key: "timing_and_evaluator" },
          ]}
          data={(
            phaseEndpoints ||
            selectedIdData?.endpoints?.value ||
            []
          ).map(
            (item, index) => {
              return {
                endpoint: (
                  <EvidenceHoverHeader
                    key={`endpoint-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.endpoint?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: item.endpoint?.source_text,
                      source: item.endpoint?.source || [],
                      arm: "Endpoint Details",
                      reasoning: item.endpoint?.reasoning,
                      confidence: item.endpoint?.confidence_score,
                      source_link: item.endpoint?.source_link,
                      nctId: nctId,
                      source_snippet_html:
                        item.endpoint?.source_snippet_html ??
                        getTraceabilityList(item.endpoint)[0]?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceabilityList(item.endpoint)[0]?.snippet,
                      keywords: getTraceabilityList(item.endpoint)[0]?.keywords,
                    }}
                  />
                ),
                // type_and_rationale: (
                //   <EvidenceHoverHeader
                //     key={`rationale-${index}`}
                //     label={<span className="cursor-pointer text-gray-700">{item.type_and_rationale?.value || "-"}</span>}
                //     evidence={{
                //       source_date: source_date,
                //       version: version,
                //       highlight: item.type_and_rationale?.source_text,
                //       source: item.type_and_rationale?.source || [],
                //       arm: "Type & Rationale",
                //       reasoning: item.type_and_rationale?.reasoning,
                //       confidence: item.type_and_rationale?.confidence_score,
                //       source_link: item.type_and_rationale?.source_link,
                //       nctId: nctId,
                //     }}
                //   />
                // ),
                measurement_and_criteria: (
                  <EvidenceHoverHeader
                    key={`criteria-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.measurement_and_criteria?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: item.measurement_and_criteria?.sourc_text,
                      source: item.measurement_and_criteria?.source || [],
                      arm: "Measurement Criteria",
                      reasoning: item.measurement_and_criteria?.reasoning,
                      source_link: item.measurement_and_criteria?.source_link,
                      confidence: item.measurement_and_criteria?.confidence_score,
                      nctId: nctId,
                      source_snippet_html:
                        item.measurement_and_criteria?.source_snippet_html ??
                        getTraceabilityList(item.measurement_and_criteria)[0]?.source_snippet_html,
                      // Structured source-document snippet + terms to highlight in it.
                      snippet: getTraceabilityList(item.measurement_and_criteria)[0]?.snippet,
                      keywords: getTraceabilityList(item.measurement_and_criteria)[0]?.keywords,
                    }}
                  />
                ),
                timing_and_evaluator: (
                  <EvidenceHoverHeader
                    key={`timing-${index}`}
                    label={<span className="cursor-pointer text-gray-700">{item.timing_and_evaluator?.value || "-"}</span>}
                    evidence={{
                      source_date: source_date,
                      version: version,
                      highlight: item.timing_and_evaluator?.source_text,
                      source: item.timing_and_evaluator?.source || [],
                      arm: "Timing & Evaluation",
                      reasoning: item.timing_and_evaluator?.reasoning,
                      confidence: item.timing_and_evaluator?.confidence_score,
                      nctId: nctId,
                    }}
                  />
                ),
              };
            },
          )}
        /> */}
        <div>
          {(() => {
            const contactsWithData = (selectedIdData?.trial_contacts?.value || []).filter(
              (contact) =>
                getContactField(contact, ["name", "full_name"]) ||
                getContactField(contact, ["phone", "phone_number", "contact_num"]) ||
                getContactField(contact, ["email", "email_address"]),
            );
            if (contactsWithData.length === 0) return null;
            return (
              <div>
                <h3
                  style={{
                    fontSize: "23px",
                    fontFamily: "Rubik",
                    fontWeight: "500",
                    color: "rgba(0, 0, 0, 0.8)",
                    lineHeight: "24px",
                    paddingTop: "24px",
                    paddingBottom: "24px",
                  }}
                >
                  {selectedIdData?.trial_contacts?.title ?? "Trial Contacts"}
                </h3>
                <div
                  className="bg-white border border-gray-200 rounded p-5 grid grid-cols-1 gap-4"
                  style={{
                    borderRadius: "4px",
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                    boxShadow: "1px 8px 34px 0px #99A9BE1A",
                  }}
                >
                  <h4 style={{ fontSize: "16px", fontFamily: "Rubik", fontWeight: "500", color: "rgba(0, 0, 0, 0.8)" }}>
                    Primary Contacts
                  </h4>
                  {contactsWithData.map((contact, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row items-start justify-between w-full gap-6">
                      {getContactField(contact, ["name", "full_name"]) && (
                        <ContactField icon={ProfileIcon} label={"Name"} value={getContactField(contact, ["name", "full_name"])} />
                      )}
                      {getContactField(contact, ["phone", "phone_number", "contact_num"]) && (
                        <ContactField icon={MobileIcon} label={"Contact No."} value={getContactField(contact, ["phone", "phone_number", "contact_num"])} />
                      )}
                      {getContactField(contact, ["email", "email_address"]) && (
                        <ContactField icon={MailIcon} label={"Email Address"} value={getContactField(contact, ["email", "email_address"])} isEmail />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {selectedIdData?.site_locations?.value?.length > 0 && (
          <>
            <h3 className={classes.trial_site_title}>
              {selectedIdData?.site_locations?.title ?? "Trial Site Locations"}
            </h3>
            <TrialSiteLocations data={selectedIdData?.site_locations?.value} />
          </>
        )}
      </div>
    </>
  );
};

export default StudyDetailsTab;

function getContactValue(value) {
  if (value && typeof value === "object") return value?.value;
  return value;
}

function getContactField(contact, keys) {
  for (const key of keys) {
    const raw = contact?.[key];
    const value = getContactValue(raw);
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "" &&
      String(value).trim().toLowerCase() !== "not available"
    )
      return value;
  }
  return undefined;
}

const ContactField = ({ icon, label, value, isEmail = false }) => (
  <div className={`flex items-center gap-4 w-full md:w-1/3`}>
    <div style={{ width: "38px", height: "38px", borderRadius: "4px" }}>
      <img src={icon} alt="" />
    </div>
    <div>
      <p style={{ lineHeight: "100%", fontSize: "14px", fontWeight: "400", color: "rgba(0,0,0,0.6)" }}>{label}</p>
      <p className={`${isEmail ? "break-all" : "break-words"} font-normal`} style={{ marginTop: "4px", fontSize: "14px", color: "rgba(0,0,0,0.8)" }}>
        {value}
      </p>
    </div>
  </div>
);
