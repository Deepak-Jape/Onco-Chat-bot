import Divider from "@mui/material/Divider";
import { trialStyles } from "./style";
import Grid from "@mui/material/Grid";
import MetricsCards from "./MetricCard";
import ResultPrimaryEndpoint from "./ResultPrimaryEndpoint";
import { colorThemes, getTraceability } from "../../../utils/helpers/helper";
import ParticipantFlow from "./ResultParticipantFlow";
import CommonTableCard from "../../../common/CommonTableCard";
import EndpointsTable from "./EndpointsTable";
import { useState } from "react";
import EvidenceHoverHeader from "./EvidenceHoverCell";
import EfficacyExplorerCard from "./EfficacyExplorerCard";

import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import moment from "moment/moment";
import FullViewWrapper from "../../../common/FullViewWrapper";
import FullViewProvider from "../../../common/FullViewProvider";

// Normalize a raw CI level to a "NN%" string. Accepts "95", "95%", "95 %", 95.
// Only a plain number (optionally with a trailing %) is a valid level — anything
// else (e.g. a stray URL from a traceability fallback) returns "" so it never
// becomes a bogus CI column.
// Given a shown value ("78.95 (13.918) UoS") and its expanded form
// ("78.95 (13.918) units on a scale"), return only the expanded unit that
// replaces the trailing abbreviation ("units on a scale"). Returns "" when
// there's no expansion (missing original, identical strings, or no shared
// numeric prefix).
const expandedUnit = (shown, full) => {
  const s = String(shown ?? "").trim();
  const f = String(full ?? "").trim();
  if (!f || f === s) return "";
  // Everything up to and including the last ")" is the numeric part; the unit
  // is whatever trails it. Without a "(range)" there's nothing to expand.
  const idx = s.lastIndexOf(")");
  if (idx < 0) return "";
  const prefix = s.slice(0, idx + 1);
  if (!f.startsWith(prefix)) return "";
  const shownUnit = s.slice(idx + 1).trim();
  const fullUnit = f.slice(prefix.length).trim();
  // Only expand when the units genuinely differ (abbreviation vs. full form).
  if (!fullUnit || fullUnit === shownUnit) return "";
  return fullUnit;
};

const normalizeCiLevel = (raw) => {
  const s = String(raw ?? "").trim().replace(/%\s*$/, "").trim();
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return "";
  return `${s}%`;
};

/* CSS-drawn "└" tree connector for indented sub-rows. Drawn with borders
   instead of the Unicode glyph so it renders identically in every table
   regardless of font fallback (the glyph looked bolder/lighter across fonts). */
const TreeConnector = () => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: "8px",
      height: "8px",
      flexShrink: 0,
      borderLeft: "1px solid rgba(0, 0, 0, 0.2)",
      borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
      alignSelf: "center",
    }}
  />
);

/* Patient Flow grouped table — Stage/Event rows grouped under section headers
   (Screening / Allocation / Follow-up / Analysis), one value column per arm.
   Static data for now; swap `PATIENT_FLOW` for API data when available. */
const PATIENT_FLOW_ARMS = [
  { label: "Arm A", sub: "Gem + Ivonescimab" },
  { label: "Arm B", sub: "Ivonescimab mono" },
  { label: "Arm C", sub: "Control (SoC)" },
];

const PATIENT_FLOW = [
  {
    section: "Screening",
    rows: [
      { label: "Assessed for eligibility", indent: false, values: ["3,420", "2,810", "1,960"] },
      { label: "Excluded", indent: true, values: ["1,250", "1,090", "770"] },
      { label: "Not meet inclusion criteria", indent: true, values: ["980", "860", "610"] },
      { label: "Declined to participate", indent: true, values: ["210", "185", "130"] },
      { label: "Other reason", indent: true, values: ["60", "45", "30"] },
    ],
  },
  {
    section: "Allocation",
    rows: [
      { label: "Randomised", indent: false, values: ["2,170", "1,720", "1,190"] },
      { label: "Allocated to treatment", indent: false, values: ["2,170", "1,720", "1,190"] },
      { label: "Received allocated treatment", indent: true, values: ["2,143 (98.8%)", "1,698 (98.7%)", "1,171 (98.4%)"] },
      { label: "Declined to participate", indent: true, values: ["27 (1.2%)", "22 (1.3%)", "19 (1.6%)"] },
    ],
  },
  {
    section: "Follow-up",
    rows: [
      { label: "Lost to follow-up", indent: false, values: ["38 (1.7%)", "31 (1.8%)", "22 (1.8%)"] },
      { label: "Discontinued intervention", indent: false, values: ["412 (19.0%)", "396 (23.0%)", "214 (18.0%)"] },
      { label: "Disease progression", indent: true, values: ["298 (13.7%)", "301 (17.5%)", "158 (13.3%)"] },
      { label: "Adverse event", indent: true, values: ["72 (3.3%)", "62 (3.6%)", "36 (3.0%)"] },
      { label: "Patient withdrawal", indent: true, values: ["29 (1.3%)", "24 (1.4%)", "14 (1.2%)"] },
      { label: "Investigator decision", indent: true, values: ["13 (0.6%)", "9 (0.5%)", "6 (0.5%)"] },
    ],
  },
  {
    section: "Analysis",
    rows: [
      { label: "Analysed (ITT)", indent: false, values: ["2,170", "1,720", "1,190"] },
      { label: "Excluded from per-protocol analysis", indent: true, values: ["87 (4.0%)", "74 (4.3%)", "49 (4.1%)"] },
    ],
  },
];

// True when a Patient Flow trace has anything worth showing in the hover card.
// The static demo rows carry no trace at all, so they render as plain text.
const hasFlowTrace = (trace) =>
  !!trace &&
  !!(
    trace.source ||
    trace.source_text ||
    trace.reasoning ||
    trace.source_link ||
    trace.snippet
  );

// Map a normalized trace onto the shape EvidenceTraceCard consumes, including
// the structured `snippet`/`keywords` that drive the source-document mock.
const flowEvidence = (trace, displayValue) => ({
  highlight: trace?.source_text || "",
  reasoning: trace?.reasoning || "No reasoning provided.",
  confidence: trace?.confidence_score ?? 0,
  source: trace?.source,
  source_link: trace?.source_link,
  source_type: trace?.source_type,
  display_value: displayValue,
  snippet: trace?.snippet,
  keywords: trace?.keywords,
});

const PatientFlowTable = ({ arms, sections, hideTitle = false }) => {
  // When dynamic data is passed use it; otherwise fall back to the static demo.
  const flowArms = arms && arms.length > 0 ? arms : PATIENT_FLOW_ARMS;
  const flowSections = sections && sections.length > 0 ? sections : PATIENT_FLOW;
  const gridCols = `minmax(220px, 1.6fr) repeat(${flowArms.length}, minmax(140px, 1fr))`;
  // Slate/100 tint used behind the header, section rows, and top-level rows.
  const TINT = "rgba(249,249,251,1)";
  // Black/50 hairline border.
  const HAIRLINE = "rgba(0,0,0,0.05)";

  return (
    <div className="w-full font-rubik">
      {!hideTitle && (
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Rubik" }}>
          Patient Flow
        </h2>
      )}

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: "8px",
          background: "#ffffff",
        }}
      >
        <div style={{ minWidth: "700px" }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              alignItems: "center",
              padding: "12px 16px",
              background: TINT,
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            {/* Stage / Event — Rubik 13/500/19.5, Black/700 */}
            <div
              style={{
                fontFamily: "Rubik",
                fontSize: "13px",
                fontWeight: 500,
                lineHeight: "19.5px",
                color: "rgba(0,0,0,0.7)",
                borderRight: `1px solid ${HAIRLINE}`,
                paddingRight: "16px",
              }}
            >
              Stage / Event
            </div>
            {flowArms.map((arm, ai) => (
              <div
                key={arm.label}
                style={{
                  textAlign: "center",
                  borderRight:
                    ai < flowArms.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                }}
              >
                {/* Arm label — Rubik 13/500, Black/800 */}
                <div
                  style={{
                    fontFamily: "Rubik",
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: "20px",
                    color: "rgba(0,0,0,0.8)",
                  }}
                >
                  {arm.label}
                </div>
                {/* Regimen sub-label — Rubik 13/400, Black/600 */}
                <div
                  style={{
                    fontFamily: "Rubik",
                    fontSize: "13px",
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "rgba(0,0,0,0.6)",
                  }}
                >
                  {arm.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Sections */}
          {flowSections.map((group) => (
            <div key={group.section}>
              {/* Section header row — Rubik 14/500/28, Black/800, tinted,
                  top+bottom Black/50 hairline */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  alignItems: "center",
                  padding: "6px 16px",
                  minHeight: "40px",
                  background: "#ffffff",
                  borderTop: `1px solid ${HAIRLINE}`,
                  borderBottom: `1px solid ${HAIRLINE}`,
                }}
              >
                <div
                  style={{
                    fontFamily: "Rubik",
                    fontSize: "14px",
                    fontWeight: 500,
                    lineHeight: "28px",
                    color: "rgba(0,0,0,0.8)",
                  }}
                >
                  {group.section}
                </div>
              </div>

              {/* Data rows — top-level rows tinted (Slate/100), sub-rows white;
                  both with bottom Black/50 hairline */}
              {group.rows.map((row, ri) => (
                <div
                  key={`${group.section}-${ri}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridCols,
                    alignItems: "stretch",
                    padding: "0 16px",
                    borderBottom: `1px solid ${HAIRLINE}`,
                    background: row.indent ? "#ffffff" : TINT,
                  }}
                >
                  {/* Event label — Rubik 14/400/20, Black/600 */}
                  <div
                    style={{
                      fontFamily: "Rubik",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "20px",
                      color: "rgba(0,0,0,0.6)",
                      paddingLeft: row.indent ? "20px" : 0,
                      paddingRight: "16px",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      borderRight: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    {row.indent && (
<TreeConnector />
                    )}
                    {/* Wrap the label in the hover card when this row carries
                        traceability (dynamic data); the static demo rows don't. */}
                    {hasFlowTrace(row.labelTrace) ? (
                      <EvidenceHoverHeader
                        label={<span className="cursor-pointer">{row.label}</span>}
                        evidence={flowEvidence(row.labelTrace, row.label)}
                      />
                    ) : (
                      row.label
                    )}
                  </div>
                  {row.values.map((v, vi) => {
                    // Cells are {text, trace} for dynamic data, plain strings
                    // for the static demo table.
                    const cellText = v && typeof v === "object" ? v.text : v;
                    const cellTrace = v && typeof v === "object" ? v.trace : null;
                    return (
                    <div
                      key={vi}
                      style={{
                        fontFamily: "Rubik",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "20px",
                        color: "rgba(0,0,0,0.6)",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                        borderRight:
                          vi < row.values.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                      }}
                    >
                      {hasFlowTrace(cellTrace) ? (
                        <EvidenceHoverHeader
                          label={<span className="cursor-pointer">{cellText}</span>}
                          evidence={flowEvidence(cellTrace, cellText)}
                        />
                      ) : (
                        cellText
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResultsTab = ({ data, isResultDisabled, oncosuite_id }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedArmIndex, setSelectedArmIndex] = useState(0);
  // Results sub-tabs: Endpoints (Endpoint Outcomes / Hazard / Odds), Data Tables
  // (Safety, AEs, Patient Characteristics, Study Population, Participant Flow),
  // and Analytics (placeholder).
  const [resultSubTab, setResultSubTab] = useState("Endpoints");
  const RESULT_SUB_TABS = ["Endpoints", "Data Tables", "Analytics"];
  const FigmaSwitch = styled(Switch)(({ theme }) => ({
    width: 40,
    height: 24,
    padding: 0,
    overflow: "visible",
    display: "flex",

    "& .MuiSwitch-switchBase": {
      padding: 2,
      top: 0,
      left: 0,
      transitionDuration: "300ms",

      "&.Mui-checked": {
        transform: "translateX(16px)",

        "& + .MuiSwitch-track": {
          backgroundColor: "rgba(38,102,190,1)",
          opacity: 1,
        },
      },
    },

    "& .MuiSwitch-thumb": {
      width: 20,
      height: 20,
      backgroundColor: "#ffffff",
      borderRadius: "100px",
      boxShadow:
        "0px 3px 1px rgba(0,0,0,0.06), 0px 3px 8px rgba(0,0,0,0.15), 0px 0px 1px rgba(0,0,0,0.04)",
    },

    "& .MuiSwitch-track": {
      borderRadius: 24,
      backgroundColor: "rgba(0,0,0,0.2)",
      opacity: 1,
    },
  }));

  const classes = trialStyles();

  // The API groups results under result_section.{result_section_endpoint,
  // result_section_data_table}. Flatten those into the single `resultsData`
  // shape the rest of this component consumes. `most_common_adverse_events`
  // and `population_characteristics` are double-nested in the data table
  // (foo.foo.value), so unwrap one level to expose a plain `.value`.
  const buildResultData = (rs) => {
    if (!rs || Object.keys(rs).length === 0) return null;
    const endpoint = rs.result_section_endpoint || {};
    // Older/normal studies expose endpoints_outcomes, safety, etc. directly on
    // result_section — pass the whole thing through untouched. Only the new
    // shape (result_section_endpoint.endpoints[] with a sibling
    // result_section_data_table) needs remapping.
    const isNewShape =
      endpoint.endpoints != null ||
      endpoint.endpoints_outcomes != null ||
      rs.result_section_data_table != null;
    if (!isNewShape) return rs;
    const dataTable = rs.result_section_data_table || {};
    // Some payloads already carry a finished endpoints_outcomes object
    // (endpoint_name[] + total_enrollment) inside result_section_endpoint —
    // use it as-is. Others expose flat endpoint.endpoints[] that we rebuild.
    const endpointsOutcomes = endpoint.endpoints_outcomes
      ? endpoint.endpoints_outcomes
      : {
          endpoint_name: endpoint.endpoints || [],
          total_enrollment: endpoint.total_enrollment,
          arms_comparison: endpoint.arms_comparison || [],
        };
    const mcae =
      dataTable.most_common_adverse_events?.most_common_adverse_events ??
      dataTable.most_common_adverse_events;
    const popChar =
      dataTable.population_characteristics?.population_characteristics ??
      dataTable.population_characteristics;
    return {
      // Endpoint outcomes: endpoint_name[] rows + total_enrollment + arms_comparison
      endpoints_outcomes: endpointsOutcomes,
      // Additional outcomes: same shape as endpoints_outcomes, sibling key in
      // result_section_endpoint. Rendered as its own table below endpoints.
      additional_outcomes: endpoint.additional_outcomes || null,
      // Data-table sections. Safety is double-nested (safety.safety.value)
      // like mcae/popChar/patient_flow — unwrap one level so downstream code
      // can read resultsData.safety.value.
      safety: (() => {
        const s = dataTable.safety?.safety ?? dataTable.safety;
        return s && Object.keys(s).length > 0 ? s : null;
      })(),
      most_common_adverse_events: mcae,
      population_characteristics: popChar,
      patient_flow:
        dataTable.patient_flow?.patient_flow ?? dataTable.patient_flow,
    };
  };

  const resultsData =
    data?.terminated_section && Object.keys(data.terminated_section)?.length > 0
      ? data?.terminated_section
      : data?.withdrawn_section &&
        Object.keys(data?.withdrawn_section)?.length > 0
        ? data.withdrawn_section
        : buildResultData(data?.result_section);

  // For this specific OncoSuite study the arm columns must be swapped so the
  // treatment arm (Durvalumab) shows before the Placebo arm across every result
  // table. Reverse the 2-arm order only for this id; leave others untouched.
  const currentOncosuiteId = data?.top_info?.value?.oncosuite_id?.value;
  // Studies that use the bespoke Results-tab treatment: the rich EndpointsTable
  // and the dynamic (data-driven) Patient Flow. Add new ids here to opt them in.
  const CUSTOM_RESULT_ONCOSUITE_IDS = [
    "cDN-mDL-2OK",
    "xwI-UNF-BRc",
    "nSi-Xwb-aM1",
    "TL7-aPc-M1G",
    "Koj-uUF-Bi6",
    "ImB-vbR-ba7",
    "IYh-svi-zRB",
    "wD7-VqO-nZf",
    "omR-xo1-EhU",
    "6wc-bkd-5h2",
    "a5F-zek-qEK",
  ];
  const usesCustomResultTables =
    CUSTOM_RESULT_ONCOSUITE_IDS.includes(currentOncosuiteId);

  // Results › Analytics reads whatever KM-curve data this study's own payload
  // actually carries at result_section_analysis.efficacy_explorer[] -- the
  // tab is data-driven (hasAnalytics below), not tied to one hardcoded study
  // id, so it lights up automatically for every trial the backend has real
  // curve data for.
  const efficacyExplorer =
    data?.result_section?.result_section_analysis?.efficacy_explorer;
  const hasAnalytics =
    Array.isArray(efficacyExplorer) && efficacyExplorer.length > 0;

  // 1. Extract Dynamic Columns
  // We look at the first AE entry to see how many arms exist
  // 1. Access the base value object
  // 1. Access the base value object
  const taeValue = resultsData?.most_common_adverse_events?.value;
  // Follow the API arm order (e.g. Durvalumab before Placebo) — do NOT swap.
  const dynamicArms = taeValue?.arms || [];

  // 2. Generate Dynamic Columns
  const dynamicColumns = [
    {
      label: "Adverse Event",
      key: "ae",
      isFixed: true,
      // Indent each event name under its section with the same "└" connector
      // used by the Patient Flow table. Section header rows render plain.
      render: (value, row) =>
        row?._isSectionHeader ? (
          value
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingLeft: "20px",
            }}
          >
<TreeConnector />
            {value}
          </span>
        ),
    },
    ...dynamicArms.map((arm, armIndex) => {
      // Column keys changed in the API: serious / others (were all_grade /
      // grade_3_4). Sub-columns for each arm reflect the new keys.
      const severityConfigs = [
        { label: "SAE", key: "serious" },
        { label: "AE", key: "others" }
      ];

      return {
        label: arm.arm_label?.value || `Arm ${armIndex + 1}`,
        // Corrected: Accessing arm_size.value from your JSON
        nValue: arm.arm_size?.value ? `N=${arm.arm_size.value}` : "",
        isGroup: true,
        subColumns: severityConfigs.map((config) => ({
          label: config.label,
          key: `arm_${armIndex}_${config.key}`,
        })),
      };
    }),
  ];

  // 3. Map the Data Rows
  // Corrected: Your JSON has adverse_events as a nested array [[{...}]], so we flatten it
  const rawAdverseEvents = Array.isArray(taeValue?.adverse_events)
    ? taeValue.adverse_events.flat()
    : [];

  const mapAdverseEventRow = (event) => {
    // Row header (The AE Name). Traceability is nested under
    // name.data_traceability[], so pull it via helper.
    const nameTrace = getTraceability(event.name || {});
    const rowData = {
      ae: event.name?.value ?? "-",
      ae_metadata: {
        source: nameTrace.source ?? "",
        source_text: nameTrace.source_text ?? "",
        reasoning: nameTrace.reasoning ?? "",
        confidence_score: nameTrace.confidence_score ?? 0,
        source_link: nameTrace.source_link ?? "",
        // Structured source-document snippet + terms to highlight in it.
        snippet: nameTrace.snippet,
        keywords: nameTrace.keywords,
      }
    };

    // Map each arm's values
    event.value?.forEach((armData) => {
      // Match by exact arm_label value from the arms array
      const armIndex = dynamicArms.findIndex(a => a.arm_label.value === armData.arm_name);

      if (armIndex !== -1) {
        const severities = ["serious", "others"];

        severities.forEach((sKey) => {
          const columnKey = `arm_${armIndex}_${sKey}`;
          const dataPoint = armData[sKey];

          // Set the display value
          rowData[columnKey] = dataPoint?.value || "-";

          // Store metadata. Traceability is nested under
          // dataPoint.data_traceability[], so pull it via helper.
          const trace = getTraceability(dataPoint || {});
          rowData[`${columnKey}_metadata`] = {
            source: trace.source ?? "",
            source_text: trace.source_text ?? "",
            reasoning: trace.reasoning ?? "",
            confidence_score: trace.confidence_score ?? 0,
            source_link: trace.source_link ?? "",
            // Structured source-document snippet + terms to highlight in it.
            snippet: trace.snippet,
            keywords: trace.keywords,
          };
        });
      }
    });

    return rowData;
  };

  // Group the flat adverse_events[] rows under their `section` sub-heading
  // (e.g. "Blood and lymphatic system disorders"). Inject a full-width section
  // header row before each group — CommonTableCard renders rows flagged with
  // `_isSectionHeader` as a bold category row (same pattern as Patient Flow /
  // Population Characteristics).
  const topAdverseEventsData = (() => {
    const rows = [];
    let lastSection = null;
    rawAdverseEvents.forEach((event) => {
      const section = String(event.section ?? "").trim();
      if (section && section !== lastSection) {
        rows.push({ ae: section, _isSectionHeader: true });
        lastSection = section;
      }
      rows.push(mapAdverseEventRow(event));
    });
    return rows;
  })();

  // 1. Generate Dynamic Columns based on the Arms in the Safety data
  // We pull from the first item in the safety value array
  /* ==========================================
    SAFETY TABLE LOGIC
    ========================================== */
  // 1. Access the base value object (It's an object, not an array index 0)
  const safetyGroup = resultsData?.safety?.value;
  // Follow the API arm order (e.g. Durvalumab before Placebo) — do NOT swap.
  const safetyArms = safetyGroup?.arms || [];

  // 2. Build dynamic columns — one value column per arm, in API order.
  const safetyColumns = [
    { label: "Adverse Event", key: "ae" },
    ...safetyArms.map((arm, armIndex) => ({
      label: arm?.arm_label?.value || `Arm ${armIndex + 1}`,
      key: `arm_${arm?.arm_label?.value ?? armIndex}`,
    })),
  ];

  // 3. Build rows. Both `name.value` and each value[] cell's `value` are the
  //    { value, source, ... } shape, so read `.value.value` for display text
  //    and pull traceability off the `.value` object itself.
  const safetyTableData = Array.isArray(safetyGroup?.adverse_events)
    ? safetyGroup.adverse_events.map((event) => {
      const nameVal = event.name?.value || {};
      const rowData = {
        ae: nameVal.value ?? "-",
        ae_metadata: {
          source: nameVal.source ?? "",
          source_text: nameVal.source_text ?? "",
          reasoning: nameVal.reasoning ?? "",
          confidence_score: nameVal.confidence_score ?? 0,
          source_link: nameVal.source_link ?? "",
        },
      };

      (event.value ?? []).forEach((armVal) => {
        // Align each cell to its arm column by arm_name (order-independent).
        const matchedArm = safetyArms.find(
          (arm) => arm?.arm_label?.value === armVal.arm_name
        );
        const armKey = `arm_${matchedArm?.arm_label?.value ?? armVal.arm_name}`;
        const cellVal = armVal.value || {};

        rowData[armKey] = cellVal.value || "-";
        rowData[`${armKey}_metadata`] = {
          source: cellVal.source ?? "",
          source_text: cellVal.source_text ?? "",
          reasoning: cellVal.reasoning ?? "",
          confidence_score: cellVal.confidence_score ?? 0,
          source_link: cellVal.source_link ?? "",
        };
      });

      return rowData;
    })
    : [];

  /* ==========================================
     HAZARD RATIO LOGIC (Updated)
     ========================================== */
  const hazardData = resultsData?.hazard_ratio?.value
  // Initialize with empty defaults so the rest of the component continues
  let hazardColumns = [];
  let hazardTableData = [];
  // Only run the mapping logic if hazardData exists
  if (hazardData) {
    const comparisonArms = hazardData.arms_comparison || [];
    const hazardEndpoints = hazardData.hazard_endpoints || [];

    hazardColumns = [
      { label: "HR", key: "hr" },
      ...comparisonArms.map((arm) => ({
        label: arm.arm_label?.value || "Comparison",
        key: `arm_${arm.arm_label?.value}`,
      })),
    ];
    hazardTableData = hazardEndpoints?.map((event) => {
      const rowData = {
        hr: event.name?.value ?? "-",
        hr_metadata: {
          source: event.name?.source ?? "",
          source_text: event.name?.source_text ?? "",
          reasoning: event.name?.reasoning ?? "",
          confidence_score: event.name?.confidence_score ?? 0,
          source_link: event.name?.source_link ?? "",
        },
      };
      // A single comparison (e.g. "Durvalumab vs Placebo") can appear more than
      // once in event.value with different HR/CI/p-values. Group by arm_name so
      // all values for one column render side by side instead of overwriting.
      const valuesByArm = (event.value ?? []).reduce((acc, armVal) => {
        const name = armVal.arm_name;
        (acc[name] = acc[name] || []).push(armVal);
        return acc;
      }, {});

      Object.entries(valuesByArm).forEach(([armName, armValues]) => {
        const armKey = `arm_${armName}`;
        const meaningful = armValues.filter((v) => v.hr_value?.value);

        rowData[armKey] = meaningful.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "row", gap: "24px", flexWrap: "wrap" }}>
            {meaningful.map((armVal, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontFamily: "Rubik", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0,0,0,0.6)" }}>
                  {armVal.hr_value.value}
                </div>
                <div style={{ display: "flex", gap: "8px", fontFamily: "Rubik", fontWeight: 400, fontSize: "12px", lineHeight: "20px", color: "rgba(0,0,0,0.6)" }}>
                  <span>{`CI: ${armVal.ci_value?.value ?? "-"}`}</span>
                  <span>{`P-Value: ${armVal.p_value?.value ?? "-"}`}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          "-"
        );

        // Cell-level traceability: the API nests it under
        // <field>.data_traceability[]. Any of hr/ci/p may carry it (and some
        // rows only have it on ci_value or p_value), so fall through until we
        // find a record with an actual source.
        const firstVal = meaningful[0] ?? armValues[0] ?? {};
        const cellTrace = [firstVal.hr_value, firstVal.ci_value, firstVal.p_value]
          .map((field) => getTraceability(field || {}))
          .find((t) => t.source || t.source_text || t.reasoning) || {};
        rowData[`${armKey}_metadata`] = {
          source: cellTrace.source ?? "",
          source_text: cellTrace.source_text ?? "",
          reasoning: cellTrace.reasoning ?? "",
          confidence_score: cellTrace.confidence_score ?? 0,
          source_link: cellTrace.source_link ?? "",
        };
      });

      return rowData;
    });
  }

  // End of Hazard Ratio code..

  /* ==========================================
     ODDS RATIO LOGIC (same shape as Hazard Ratio,
     only the keys differ: orr_ratio / orr_endpoints)
     ========================================== */
  const oddsData = resultsData?.orr_ratio?.value;
  let oddsColumns = [];
  let oddsTableData = [];
  if (oddsData) {
    const comparisonArms = oddsData.arms_comparison || [];
    const oddsEndpoints = oddsData.orr_endpoints || [];

    oddsColumns = [
      { label: "OR", key: "or" },
      ...comparisonArms.map((arm) => ({
        label: arm.arm_label?.value || "Comparison",
        key: `arm_${arm.arm_label?.value}`,
      })),
    ];
    oddsTableData = oddsEndpoints?.map((event) => {
      const rowData = {
        or: event.name?.value ?? "-",
        or_metadata: {
          source: event.name?.source ?? "",
          source_text: event.name?.source_text ?? "",
          reasoning: event.name?.reasoning ?? "",
          confidence_score: event.name?.confidence_score ?? 0,
          source_link: event.name?.source_link ?? "",
        },
      };
      // A single comparison can appear more than once in event.value with
      // different OR/CI/p-values. Group by arm_name so all values for one
      // column render side by side instead of overwriting.
      const valuesByArm = (event.value ?? []).reduce((acc, armVal) => {
        const name = armVal.arm_name;
        (acc[name] = acc[name] || []).push(armVal);
        return acc;
      }, {});

      Object.entries(valuesByArm).forEach(([armName, armValues]) => {
        const armKey = `arm_${armName}`;
        const meaningful = armValues.filter((v) => v.hr_value?.value);

        rowData[armKey] = meaningful.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "row", gap: "24px", flexWrap: "wrap" }}>
            {meaningful.map((armVal, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontFamily: "Rubik", fontWeight: 400, fontSize: "14px", lineHeight: "20px", color: "rgba(0,0,0,0.6)" }}>
                  {armVal.hr_value.value}
                </div>
                <div style={{ display: "flex", gap: "8px", fontFamily: "Rubik", fontWeight: 400, fontSize: "12px", lineHeight: "20px", color: "rgba(0,0,0,0.6)" }}>
                  <span>{`CI: ${armVal.ci_value?.value ?? "-"}`}</span>
                  <span>{`P-Value: ${armVal.p_value?.value ?? "-"}`}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          "-"
        );

        // Cell-level traceability uses the first value's source.
        const firstOr = meaningful[0]?.hr_value ?? armValues[0]?.hr_value;
        rowData[`${armKey}_metadata`] = {
          source: firstOr?.source ?? "",
          source_text: firstOr?.source_text ?? "",
          reasoning: firstOr?.reasoning ?? "",
          confidence_score: firstOr?.confidence_score ?? 0,
          source_link: firstOr?.source_link ?? "",
        };
      });

      return rowData;
    });
  }
  // End of Odds Ratio code

  const nctId = data?.top_info?.value?.oncosuite_id?.value ?? "-";

  /* ==========================================
     PATIENT FLOW LOGIC
     result_section_data_table.patient_flow.value = { arms[], adverse_events[] }.
     There are no section groups in the API, so we render one ungrouped section.
     Both name and cell values may be single- or double-nested ({value:{value}}).
     ========================================== */
  const unwrap = (o) =>
    o && typeof o === "object" && "value" in o ? unwrap(o.value) : o;

  // Dynamic patient-flow mapping is only wired for the custom-result studies;
  // every other study keeps the existing static PATIENT_FLOW demo table.
  const usePatientFlowFromData = usesCustomResultTables;
  const patientFlowRaw = usePatientFlowFromData
    ? resultsData?.patient_flow?.value
    : null;
  // Follow the API arm order (e.g. Durvalumab before Placebo) — do NOT swap.
  const patientFlowArmsOrdered = patientFlowRaw?.arms || [];
  const patientFlowArms = patientFlowArmsOrdered.map((arm) => ({
    label: arm?.arm_label?.value ?? "",
    sub: "",
  }));
  // Group the flat adverse_events[] rows under their `section` sub-heading
  // (e.g. "Overall Study", "Reason Not Completed"), preserving the order the
  // API returns them in. Every row is rendered as an indented detail row under
  // its section heading so all sections share the same structure.
  const buildFlowRow = (event) => ({
    label: unwrap(event.name) ?? "-",
    // Indent every row so each section (Overall Study, Reason Not Completed, …)
    // renders with the same nested "⌐" connector.
    indent: true,
    // Traceability for the row label. `event.name` is double-nested
    // ({value:{value, data_traceability}}), so read the inner object.
    labelTrace: getTraceability(event.name?.value ?? event.name ?? {}),
    // Align each cell to its arm column by arm_name so column order matches
    // the (possibly swapped) header order. Each cell carries its own
    // traceability so the hover card can show that figure's evidence.
    values: patientFlowArmsOrdered.map((arm) => {
      const armName = arm?.arm_label?.value;
      const cell = (event.value || []).find((c) => c.arm_name === armName);
      return {
        text: cell ? unwrap(cell) ?? "-" : "-",
        trace: cell ? getTraceability(cell.value ?? cell) : null,
      };
    }),
  });

  const patientFlowSections =
    patientFlowArms.length > 0 && Array.isArray(patientFlowRaw?.adverse_events)
      ? patientFlowRaw.adverse_events.reduce((sections, event) => {
          const name = String(event.section ?? "").trim() || "Overall Study";
          let group = sections[sections.length - 1];
          // Start a new section whenever the section label changes.
          if (!group || group.section !== name) {
            group = { section: name, rows: [] };
            sections.push(group);
          }
          group.rows.push(buildFlowRow(event));
          return sections;
        }, [])
      : [];

  return isResultDisabled ? (
    <div className="overflow-hidden">
      <div className={classes.terminated_div}>
        <div className={classes.terminated_time_div}>
          <div>
            <span className={classes.timeduration_text}>Trial Duration:</span>
            <span className={classes.timeduration_text_value}>

              {resultsData?.duration} Months
            </span>
          </div>
          <div className={classes.withdrawn_text}>
            {data?.withdrawn_section ? "Withdrawn" : "Terminated"} On
            {moment(resultsData?.trial_date).format("DD MMMM YYYY")}
          </div>
        </div>
        <Divider style={{ margin: "2px 0px 10px 0px" }} />
        <div className={classes.reason_withdraw_div}>
          <span className={classes.reason_withdraw_title}>
            Reason for {data?.withdrawn_section ? "Withdrawal" : "Termination"}
          </span>
          <span className={classes.reason_withdraw_value}>
            {resultsData?.reason}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <>
      <div className="overflow-hidden">

        {/* Results sub-tab bar: Endpoints | Data Tables | Analytics
            (matches Figma: white 32px pill, 1.5px Slate/300 border, active
             item gets a Slate/500 grey fill) */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "32px",
            borderRadius: "6px",
            border: "1.5px solid rgba(232,232,236,1)",
            background: "rgba(255,255,255,1)",
            marginBottom: "20px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {RESULT_SUB_TABS.map((tab, i) => {
            const active = resultSubTab === tab;
            const isLast = i === RESULT_SUB_TABS.length - 1;
            // Analytics is enabled only for studies that ship analysis data.
            const disabled = tab === "Analytics" && !hasAnalytics;
            return (
              <button
                key={tab}
                onClick={() => !disabled && setResultSubTab(tab)}
                disabled={disabled}
                title={disabled ? "Coming soon" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  padding: "0 12px",
                  border: "none",
                  // Divider between items (Slate/300), none after the last.
                  borderRight: isLast ? "none" : "1.5px solid rgba(232,232,236,1)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontFamily: "Rubik",
                  fontSize: "14px",
                  lineHeight: "24px",
                  letterSpacing: "0%",
                  fontWeight: active ? 500 : 400,
                  color: disabled ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)",
                  background: active ? "rgba(217,217,224,1)" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ── ENDPOINTS sub-tab ── */}
        <div style={{ display: resultSubTab === "Endpoints" ? "block" : "none" }}>
        <FullViewProvider>

        {/* Operational Metrics */}
        {/* <div className="max-w-[1400px]">
          <h2 className={classes.header_title}>
            {resultsData?.operational_metrics?.title === "operational_metrics"
              ? "Operational Metrics"
              : "Operational Metrics"}
          </h2>
          <div className={classes.metrics_div}>
            <MetricsCards data={resultsData?.operational_metrics?.value} />
          </div>
        </div> */}

        {/* {resultsData?.endpoints?.endpoints_basic?.value?.length > 0 && (
          <div className="max-w-[1400px]">
            <h2 className={classes.header_title}>
              {resultsData?.endpoints?.endpoints_basic?.title ??
                "Primary Endpoint & Outcome"}
            </h2>
            <div className={classes.metrics_div}>
              <ResultPrimaryEndpoint
                data={resultsData?.endpoints?.endpoints_basic?.value}
              />
            </div>
          </div>
        )} */}
        {/* Endpoint Results */}
        {(() => {
          // For the custom-result OncoSuite studies, render the bespoke Figma
          // EndpointsTable (Primary/Secondary sections, Popn/Assessor/Effect/
          // CI columns) instead of the generic Endpoint Outcomes table.
          if (usesCustomResultTables) {
            const eo = resultsData?.endpoints_outcomes;
            const rows = eo?.endpoint_name || [];

            // Arm columns come from total_enrollment.arms (label + N). Fall back
            // to the arm titles present on the first endpoint row if enrollment
            // arms are missing.
            // Keep the arm order exactly as the API provides it (do NOT apply
            // orderArms here — the endpoint table should follow the backend
            // order, e.g. Durvalumab before Placebo).
            const enrollmentArms = eo?.total_enrollment?.arms || [];
            const armsForTable = (
              enrollmentArms.length > 0
                ? enrollmentArms.map((a) => ({
                    label: a?.arm_label?.value ?? "",
                    n: a?.arm_size?.value ? `n=${a.arm_size.value}` : "",
                  }))
                : (rows[0]?.value || []).map((v) => ({
                    label: v?.title ?? "",
                    n: v?.n?.value != null ? `n=${v.n.value}` : "",
                  }))
            ).filter((a) => a.label);

            // These endpoint fields share a { value, data_traceability[] } shape.
            // The real text sometimes lands in .value and sometimes only in the
            // traceability source (e.g. data_cut today) — read value first, then
            // fall back to the source so all columns populate once data arrives.
            const fieldText = (f) =>
              f?.value || f?.data_traceability?.[0]?.source || "";

            const toRow = (r) => {
              const effectType = fieldText(r?.effect_type);
              const effectValue = fieldText(r?.effect_value);
              const pText = fieldText(r?.p_value);
              // The CI interval range lives on p_value.range (e.g. "(0.63–0.93)").
              const ciRange = r?.p_value?.range || "";
              // Endpoint label: prefer the abbreviation (e.g. "OS") and expose the
              // full endpoint name on hover via an info icon. When no abbreviation
              // exists, show the full name and render no icon.
              const fullName = r?.name?.value || "-";
              const abbr = String(r?.abbreviation?.value ?? "").trim();
              return {
                endpoint: abbr || fullName,
                tooltip: abbr ? fullName : "",
                popn: r?.population?.value || "",
                assessor: r?.assessor?.value || "",
                // Data cut / follow-up (e.g. "Up to 12 months").
                dataCut: [fieldText(r?.data_cut)],
                // One cell per arm column, matched by title to preserve column order.
                arms: armsForTable.map((arm) => {
                  const cell = (r?.value || []).find((v) => v?.title === arm.label);
                  const topText = cell?.value?.value || "-";
                  // Expanded unit only. The shown value ends in an abbreviation
                  // (e.g. "78.95 (13.918) UoS") and original_value carries the
                  // full form ("78.95 (13.918) units on a scale"). Strip the
                  // common numeric prefix so the tooltip shows just the expanded
                  // unit ("units on a scale"). Empty when there's nothing to expand.
                  const unitTooltip = expandedUnit(topText, cell?.value?.value);
                  return {
                    top: topText,
                    topTooltip: unitTooltip,
                    // Per-arm CI level (e.g. "95%") shown after the range.
                    ciLevel: normalizeCiLevel(cell?.ci?.value),
                    bottom: cell?.n?.value != null ? `n: ${cell.n.value}` : "",
                  };
                }),
                // Effect = "<type> <value>" (e.g. "HR: 0.49"); empty until data.
                effect:
                  effectType || effectValue
                    ? `${effectType} ${effectValue}`.trim()
                    : "",
                ci: fieldText(r?.ci_value),
                // CI interval range (e.g. "(0.578–0.986)") shown under the
                // effect value in the Effect column.
                ciRange,
                pValue: pText ? `p: ${pText}` : "",
                // This row's CI level (e.g. "95%", "98%") — decides which CI column
                // it fills. Read ONLY from ci_value.value (never the traceability
                // source, which is a URL) and normalize to a "NN%" string.
                ciLevel: normalizeCiLevel(r?.ci_value?.value),
                // CI cell content (interval range + p-value). The level itself is
                // now the column header, so it isn't repeated inside the cell.
                ciLines: [ciRange, pText ? `p: ${pText}` : ""].filter(Boolean),
              };
            };

            const primaryRows = rows
              .filter((r) => String(r?.role?.value).toLowerCase() === "primary")
              .map(toRow);
            const secondaryRows = rows
              .filter((r) => String(r?.role?.value).toLowerCase() !== "primary")
              .map(toRow);

            // Additional Outcomes: same row shape as endpoints_outcomes, so it
            // reuses toRow/armsForTable and the identical EndpointsTable. There
            // is no primary/secondary split here — all rows go in one group.
            const additionalRows = (
              resultsData?.additional_outcomes?.endpoint_name || []
            ).map(toRow);

            return (
              <>
                <FullViewWrapper title="Endpoint Outcomes">
                  <EndpointsTable
                    arms={armsForTable}
                    primaryRows={primaryRows}
                    secondaryRows={secondaryRows}
                  />
                </FullViewWrapper>

                {additionalRows.length > 0 && (
                  <div className="mt-8">
                    <FullViewWrapper title="Additional Outcomes">
                      <EndpointsTable
                        arms={armsForTable}
                        primaryRows={[]}
                        showPrimarySection={false}
                        secondaryRows={additionalRows}
                        secondaryLabel={`${additionalRows.length} Additional outcomes`}
                      />
                    </FullViewWrapper>
                  </div>
                )}
              </>
            );
          }

          const endpointResult = resultsData?.endpoints_outcomes;
          if (!endpointResult) return null;

          // 1. DATA EXTRACTION
          const basicData = endpointResult.endpoint_name || [];
          const totalEnrollmentRaw =
            endpointResult?.total_enrollment?.value?.value ??
            endpointResult?.total_enrollment?.value;
          const totalEnrollmentArms = Array.isArray(endpointResult?.total_enrollment?.arms)
            ? endpointResult.total_enrollment.arms
            : [];

          const formatNumber = (val) => {
            const n = Number(String(val ?? "").replace(/,/g, ""));
            if (!Number.isFinite(n)) return String(val ?? "").trim();
            return n.toLocaleString("en-US");
          };

          const isMeaningfulEnrollmentValue = (val) => {
            if (val === null || val === undefined) return false;
            const text = String(val).trim();
            if (!text || ["-", "na", "n/a", "not available", "unknown"].includes(text.toLowerCase())) {
              return false;
            }
            const numeric = Number(text.replace(/,/g, ""));
            return Number.isFinite(numeric) ? numeric > 0 : true;
          };

          const hasEnrollmentData =
            isMeaningfulEnrollmentValue(totalEnrollmentRaw) ||
            totalEnrollmentArms.some((arm) => isMeaningfulEnrollmentValue(arm?.arm_size?.value));

          /* ==========================================
             2. DYNAMIC COLUMNS LOGIC
             Jitne names 'value' array mein honge, utne columns banege
             ========================================== */
          const simpleColumns = [
            { label: "Endpoint", key: "endpoint" },
            ...((basicData[0]?.value || [])?.map((armRes, i) => ({
              label: armRes.title || `Arm ${i + 1}`,
              key: `arm_${i}`,
            })) || []),
          ];

          /* ==========================================
             3. TABLE DATA LOGIC
             ========================================== */
          const simpleTableData = [
            // --- N Row (First Row) ---
            ...(hasEnrollmentData
              ? [
                (() => {
                  const nRow = {
                    endpoint: `N (${formatNumber(totalEnrollmentRaw)})`,
                    endpoint_abbr: `N (${formatNumber(totalEnrollmentRaw)})`,
                    endpoint_role: "",
                    endpoint_metadata: {
                      source: endpointResult?.total_enrollment?.value?.source ?? "",
                      source_text: endpointResult?.total_enrollment?.value?.source_text ?? "",
                      reasoning: endpointResult?.total_enrollment?.value?.reasoning ?? "",
                      confidence_score: endpointResult?.total_enrollment?.value?.confidence_score ?? 0,
                    },
                  };

                  // Map N values to each arm column
                  totalEnrollmentArms.forEach((arm, i) => {
                    const colKey = `arm_${i}`;
                    const sizeObj = arm?.arm_size || {};
                    nRow[colKey] = isMeaningfulEnrollmentValue(sizeObj.value)
                      ? formatNumber(sizeObj.value)
                      : "-";
                    nRow[`${colKey}_metadata`] = {
                      source: sizeObj.source,
                      source_text: sizeObj.source_text,
                      reasoning: sizeObj.reasoning || "",
                      confidence_score: sizeObj.confidence_score,
                    };
                  });
                  return nRow;
                })(),
              ]
              : []),

            // --- Dynamic Endpoint Rows ---
            ...basicData.map((row) => {
              const endpointName = row.name?.value || "-";
              const endpointRole = row.role?.value || "";

              const dataRow = {
                endpoint: endpointName,
                endpoint_abbr: endpointName,
                endpoint_role: endpointRole,
                endpoint_metadata: {
                  source: row.name?.source ?? "",
                  source_text: row.name?.source_text ?? "",
                  reasoning: row.name?.reasoning ?? "",
                  confidence_score: row.name?.confidence_score ?? 0,
                  source_link: row.name?.source_link ?? "",
                },
              };

              // Loop through the 'value' array in JSON to fill arm columns
              (row.value || []).forEach((armResult, i) => {
                const valObj = armResult.value || {};
                const colKey = `arm_${i}`;

                dataRow[colKey] = valObj.value || "-";

                // Storing metadata for the cell (used for tooltips/icons in CommonTableCard)
                dataRow[`${colKey}_metadata`] = {
                  source: valObj.source,
                  source_text: valObj.source_text,
                  reasoning: valObj.reasoning || "",
                  confidence_score: valObj.confidence_score,
                  source_link: valObj.source_link,
                };
              });

              return dataRow;
            }),
          ];

          /* ==========================================
             4. RENDER
             ========================================== */
          return (
            <div className="mb-6">
              <FullViewWrapper title="Endpoint Outcomes">
                <CommonTableCard
                  title="Endpoint Outcomes"
                  columns={simpleColumns}
                  data={simpleTableData}
                  nctId={nctId}
                  isResultTab={true}
                  hideTitle={true}
                />
              </FullViewWrapper>
            </div>
          );
        })()}
        {/* Hazard Ratio Code  */}
        {resultsData?.hazard_ratio?.value?.arms_comparison?.length > 0 && (
          <div className="mt-8">
            <FullViewWrapper title="Hazard Ratio">
              <CommonTableCard
                title="Hazard Ratio"
                columns={hazardColumns} // Using the dynamic columns generated above
                data={hazardTableData} // Using the mapped data
                nctId={nctId}
                isResultTab={true}
                hideTitle={true}
              />
            </FullViewWrapper>
          </div>
        )}
        {/* End of Hazard Ratio code */}

        {/* Odds Ratio Code */}
        {resultsData?.orr_ratio?.value?.arms_comparison?.length > 0 && (
          <div className="mt-8">
            <FullViewWrapper title="Odds Ratio">
              <CommonTableCard
                title="Odds Ratio"
                columns={oddsColumns} // Using the dynamic columns generated above
                data={oddsTableData} // Using the mapped data
                nctId={nctId}
                isResultTab={true}
                hideTitle={true}
              />
            </FullViewWrapper>
          </div>
        )}
        {/* End of Odds Ratio code */}

        </FullViewProvider>
        </div>
        {/* ── END ENDPOINTS sub-tab ── */}

        {/* ── DATA TABLES sub-tab ── */}
        <div style={{ display: resultSubTab === "Data Tables" ? "block" : "none" }}>
        <FullViewProvider>

        {resultsData?.safety?.value?.arms?.length > 0 && (
          <div>
            <FullViewWrapper title="Safety">
              <CommonTableCard
                title="Safety"
                columns={safetyColumns} // Using the dynamic columns generated above
                data={safetyTableData} // Using the mapped data
                nctId={nctId}
                isResultTab={true}
                hideTitle={true}
              />
            </FullViewWrapper>
          </div>
        )}


        {resultsData?.most_common_adverse_events?.value?.arms?.length > 0 && <div className="mt-8">
          <FullViewWrapper title="Adverse Events">
            <CommonTableCard
              title="Most Common Adverse Effects"
              columns={dynamicColumns} // Pass the dynamically generated columns here
              data={topAdverseEventsData}
              nctId={nctId}
              isResultTab={true}
              isBorder={true}
              hideTitle={true}
            />
          </FullViewWrapper>
        </div>}

        {(() => {
          const baselineRaw = resultsData?.population_characteristics?.value;
          if (!baselineRaw) return null;

          // Follow the API arm order (e.g. Durvalumab before Placebo) — no swap.
          const armsHeader = baselineRaw.arms || [];
          const characteristics = baselineRaw.characteristics || []; // Fixed typo from 'characterstics'

          /* 1. MAP DATA ROWS — inject section header rows and subcategories */
          const populationTableData = characteristics.flatMap((char) => {
            // Section header row (e.g., "Region of Enrollment", "Sex: Female, Male")
            const headerRow = {
              characteristic: char.title?.value || "-",
              _isSectionHeader: true,
            };

            // Subcategory data rows (indented)
            const subRows = (char.value?.subcategory || []).map((sub) => {
              const dataRow = {
                characteristic: sub.title?.value ?? sub.title ?? char.title?.value,
                _isSectionHeader: false,
                // Traceability lives under `data_traceability[]`, not as flat
                // fields — read it via the helper, preferring the row's own
                // entry (sub.title) over the group heading's (char.title).
                characteristic_metadata: (() => {
                  const t = getTraceability(sub.title ?? {});
                  const g = getTraceability(char.title ?? {});
                  const pick = t.source || t.source_text || t.snippet ? t : g;
                  return {
                    source: pick.source ?? "",
                    source_text: pick.source_text ?? "",
                    reasoning: pick.reasoning ?? "",
                    confidence_score: pick.confidence_score ?? 0,
                    source_link: pick.source_link ?? "",
                    source_type: pick.source_type,
                    snippet: pick.snippet,
                    keywords: pick.keywords,
                  };
                })(),
              };

              // Map values to the correct arm column
              sub.value?.forEach((val) => {
                const armIndex = armsHeader.findIndex(
                  (a) => a.arm_label.value === val.arm_name
                );
                if (armIndex !== -1) {
                  const colKey = `arm_${armIndex}`;
                  dataRow[colKey] = val.value || "-";
                  // Same here: the cell's evidence is under data_traceability[].
                  const vt = getTraceability(val ?? {});
                  dataRow[`${colKey}_metadata`] = {
                    source: vt.source ?? "",
                    source_text: vt.source_text ?? "",
                    reasoning: vt.reasoning ?? "",
                    confidence_score: vt.confidence_score ?? 0,
                    source_link: vt.source_link ?? "",
                    source_type: vt.source_type,
                    snippet: vt.snippet,
                    keywords: vt.keywords,
                  };
                }
              });

              return dataRow;
            });

            return [headerRow, ...subRows];
          });

          /* 2. GENERATE DYNAMIC COLUMNS */
          const populationColumns = [
            {
              label: "Characteristics",
              key: "characteristic",
              isFixed: true,
              render: (value, row) =>
                row._isSectionHeader ? (
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "Rubik",
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    {value}
                  </span>
                ) : (
                  <span
                    style={{
                      paddingLeft: "12px", // Increased padding for better hierarchy
                      fontFamily: "Rubik",
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "rgba(0, 0, 0, 0.6)",
                      textTransform: "capitalize" // Subcategories often look better capitalized
                    }}
                  >
                    {String(value ?? "").toLowerCase()}
                  </span>
                ),
            },
            ...armsHeader.map((arm, i) => ({
              label: arm.arm_label?.value || `Arm ${i + 1}`,
              // Corrected: Path to arm_size value from your JSON
              nValue: arm.arm_size?.value ? `N=${arm.arm_size.value}` : "",
              key: `arm_${i}`,
            })),
          ];

          /* 3. RENDER TABLE */
          return (
            <div className="mt-8 max-w-[820px] max-h[auto] w-full flex flex-col font-rubik">
              <FullViewWrapper title="Patient Characteristics">
                {/* Main Table Container Box matching specific border, background, shadow, and padding specs */}
                <div className="w-full bg-white px-[15px] pb-[15px] pt-[6px]">
                  <CommonTableCard
                    title="Patient Characteristics"
                    columns={populationColumns}
                    data={populationTableData}
                    nctId={nctId}
                    isResultTab={true}
                    isBorder={true}
                    hideTitle={true}
                  />
                </div>
              </FullViewWrapper>
            </div>
          );
        })()}
        {/* Secondary Endpoints & Outcomes*/}
        {/* {resultsData?.endpoint_result?.value
          ?.secondary_endpoints?.value?.length > 0 && (
            <>
              
              <div className="max-w-[1400px] mt-4">
                <h2 className={classes.header_title}>
                  {resultsData?.endpoint_result?.title ??
                    "Secondary Endpoints & Outcomes"}
                </h2>
              </div>
              <div className="pt-4 pb-5">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-3">
                    {
                      resultsData?.endpoint_result?.value
                        .secondary_endpoints.title
                    }
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {resultsData?.endpoint_result?.value.secondary_endpoints.value.map(
                      (value, index) => (
                        <div key={index}>
                          <p className={classes.secondary_title}>{value.title}</p>
                          <p className={classes.secondary_value}>{value.value}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </>
          )} */}

        {/* {resultsData?.endpoint_result?.value
          ?.secondary_outcomes?.value?.length > 0 && (
            <div className="py-0">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-4">
                  {
                    resultsData?.endpoint_result?.value
                      ?.secondary_outcomes.title
                  }
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-gray-700">
                    <thead className="border-b border-gray-200 text-gray-500">
                      <tr>
                        <th
                          className={`${classes.secondary_outcomes_header} pb-2 pr-4`}
                        >
                          Treatment ARM
                        </th>
                        <th
                          className={`${classes.secondary_outcomes_header} pb-2 pr-4`}
                        >
                          Median OS
                        </th>
                        <th
                          className={`${classes.secondary_outcomes_header} pb-2 pr-4`}
                        >
                          ORR
                        </th>
                        <th
                          className={`${classes.secondary_outcomes_header} pb-2 pr-4`}
                        >
                          Median DoR
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {resultsData?.endpoint_result?.value?.secondary_outcomes?.value.map(
                        (value, index) => {
                          // Determine color based on row index or arm title
                          const armTitle = String(
                            value?.col_1?.value ?? ""
                          ).toLowerCase();
                          let colorClass = "text-gray-800"; // default

                          if (armTitle.includes("arm a"))
                            colorClass = "text-blue-600";
                          else if (armTitle.includes("arm b"))
                            colorClass = "text-green-600";
                          else if (armTitle.includes("arm c"))
                            colorClass = "text-green-600";
                          else if (armTitle.includes("arm d"))
                            colorClass = "text-pink-600";
                          // you can extend this logic if more arms appear later

                          return (
                            <tr key={index}>
                              {/* Arm Name
                              <td className="py-3 pr-4">{value?.col_1?.value}</td>

                              {/* Column 2 
                              <td className="py-3 pr-4">
                                <span
                                  style={{ color: "rgba(0, 0, 0, 0.6)" }}
                                  className={`font-semibold ${colorClass}`}
                                >
                                  {value?.col_2?.value?.[0]}
                                </span>
                                <br />
                                <span className="text-xs text-gray-500">
                                  {value?.col_2?.value?.[1]}
                                </span>
                              </td>

                              {/* Column 3
                              <td className="py-3 pr-4">
                                <span
                                  style={{ color: "rgba(0, 0, 0, 0.6)" }}
                                  className={`font-semibold ${colorClass}`}
                                >
                                  {value?.col_3?.value?.[0]}
                                </span>
                                <br />
                                <span
                                  style={{ color: "rgba(0, 0, 0, 0.6)" }}
                                  className="text-xs text-gray-500"
                                >
                                  {value?.col_3?.value?.[1]}
                                </span>
                              </td>

                              {/* Column 4 
                              <td className="py-3">
                                <span
                                  style={{ color: "rgba(0, 0, 0, 0.6)" }}
                                  className={`font-semibold ${colorClass}`}
                                >
                                  {value?.col_4?.value?.[0]}
                                </span>
                                <br />
                                <span className="text-xs text-gray-500">
                                  {value?.col_4?.value?.[1]}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )} */}

        {/* {resultsData?.safety?.value?.length > 0 && (
          <div className="py-4">
            <h2 className={classes.header_title}>
              {resultsData?.safety?.title ??
                "Safety / Adverse Events Profile"}
            </h2>

            Define color themes for each arm
            <div style={{ marginTop: "15px" }}>
              {resultsData?.safety?.value && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resultsData.safety.value.map(
                    (value, index) => {
                      const theme = colorThemes[index % colorThemes?.length];

                      return (
                        <div
                          key={index}
                          style={{
                            background: theme.bg,
                            border: `1px solid ${theme.border}`,
                          }}
                          className={`rounded-lg p-4`}
                        >
                          // {/* Arm Title 
                          <h3
                            style={{
                              fontSize: "15px",
                              fontWeight: "500",
                              fontFamily: "Rubik",
                              color: theme.title,
                            }}
                            className={`mb-2`}
                          >
                            {value?.title || "Untitled Arm"}
                          </h3>

                          Common Side Effects
                          <div className="mb-4">
                            <p className={`${classes.commonside_title} mb-2`}>
                              {value?.value?.common_side_effects?.title}
                            </p>
                            <div className="text-sm text-gray-700 space-y-1">
                              {value?.value?.common_side_effects?.value?.map(
                                (side, i) => (
                                  <div key={i} className="flex justify-between">
                                    <span className={classes.common_side_title}>
                                      {side?.title}
                                    </span>
                                    <span className={classes.common_side_title}>
                                      {side?.value}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          // {/* Serious Events 
                          <div>
                            <p className={`${classes.commonside_title} mb-2`}>
                              {value?.serious_events?.title}
                            </p>
                            <div className="text-sm text-gray-700 space-y-1">
                              {value?.serious_events?.value?.map((event, j) => (
                                <div key={j} className="flex justify-between">
                                  <span className={classes.common_side_title}>
                                    {event?.title}
                                  </span>
                                  <span className={classes.common_side_title}>
                                    {event?.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        )} */}

        <div className="max-w-3xl mx-auto py-4 bg-white space-y-4">
          <h2 className={classes.header_title}>
            {resultsData?.study_population?.title}
          </h2>

          {[
            "condition",
            "population",
            "baseline",
            "geography",
            "implication",
          ].map((key) => {
            const item = resultsData?.study_population?.value?.[key];
            if (!item) return null;

            return (
              <p key={key} className="text-sm text-gray-800 mb-2">
                <span className={classes.study_population_shorttitle}>
                  {item?.title}:
                </span>
                <span className={classes.study_population_shortvalue}>
                  {item?.value}
                </span>
              </p>
            );
          })}
        </div>

        {resultsData?.participant_flow?.value?.length > 0 && (
          <div className="max-w-3xl mx-auto py-4 bg-white space-y-4">
            <h2 className={classes.header_title}>
              {resultsData?.participant_flow?.title}
            </h2>

            <ParticipantFlow data={resultsData?.participant_flow?.value} />
          </div>
        )}

        <div className="max-w-3xl mx-auto py-4 bg-white space-y-4">
          <h2 className={classes.header_title}>
            {resultsData?.study_population?.title}
          </h2>

          {[
            "condition",
            "population",
            "baseline",
            "geography",
            "implication",
          ].map((key) => {
            const item = resultsData?.study_population?.value?.[key];
            if (!item) return null;

            return (
              <p key={key} className="text-sm text-gray-800 mb-2">
                <span className={classes.study_population_shorttitle}>
                  {item?.title}:
                </span>
                <span className={classes.study_population_shortvalue}>
                  {item?.value}
                </span>
              </p>
            );
          })}
        </div>

        {resultsData?.participant_flow?.value?.length > 0 && (
          <div className="max-w-3xl mx-auto py-4 bg-white space-y-4">
            <h2 className={classes.header_title}>
              {resultsData?.participant_flow?.title}
            </h2>

            <ParticipantFlow data={resultsData?.participant_flow?.value} />
          </div>
        )}

        {/* Patient Flow — grouped table (Stage/Event × arms) */}
        <FullViewWrapper title="Patient Flow">
          <PatientFlowTable arms={patientFlowArms} sections={patientFlowSections} hideTitle />
        </FullViewWrapper>

        </FullViewProvider>
        </div>
        {/* ── END DATA TABLES sub-tab ── */}

        {/* ── ANALYTICS sub-tab ── */}
        <div style={{ display: resultSubTab === "Analytics" ? "block" : "none" }}>
          {hasAnalytics ? (
            <EfficacyExplorerCard explorer={efficacyExplorer} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "240px",
                fontFamily: "Rubik",
                fontSize: "14px",
                color: "rgba(0,0,0,0.5)",
              }}
            >
              Analytics coming soon
            </div>
          )}
        </div>
        {/* ── END ANALYTICS sub-tab ── */}
      </div>
    </>
  );
};

export default ResultsTab;
