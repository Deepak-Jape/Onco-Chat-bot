import { SettingLogo, TrialsLogo, LocationSidebar, drugIcon } from "../../assets";

export const decodeUnicodeEscapes = (value) => {
  if (typeof value !== "string" || !value.includes("\\u")) return value;

  return value.replace(/\\u[0-9a-fA-F]{4}/g, (match) =>
    String.fromCharCode(parseInt(match.slice(2), 16)),
  );
};

export const FILTER_SECTIONS = [
  {
    "title": "Cohort",
    "filters": [
      {
        "type": "checklist",
        "placeholder": "Organ",
        "key": "organ"
      },
      {
        "type": "checklist",
        "placeholder": "Histology",
        "key": "histology" //by Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Biomarker",
        "key": "biomarkers"
      },
      {
        "type": "checklist",
        "placeholder": "Cancer Stage",
        "key": "cancer_stage",
      },
      {
        "type": "checklist",
        "placeholder": "Line of Therapy",
        "key": "line_of_therapy"
      },
      {
        "type": "checklist",
        "placeholder": "Co-Morbidities",
        "key": "comorbidities"
      },
      {
        "type": "checklist",
        "placeholder": "Other physical conditions",
        "key": "physical_state" //by Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Prior Therapy",
        "key": "prior_therapy"
      },
      {
        "type": "checklist",
        "placeholder": "Sex/Gender",
        "key": "sex",
      },
      {
        "type": "checklist",
        "placeholder": "Age",
        "key": "age"
      },
      {
        "type": "checklist",
        "placeholder": "ECOG",
        "key": "ecog", // By Utkarsh
      }
    ]
  },
  {
    "title": "Treatment",
    "filters": [
      {
        "type": "autocomplete",
        "placeholder": "Drug Name",
        "key": "drug_name"
      },
      {
        "type": "checklist",
        "placeholder": "Regimen Combination Strategy",
        "key": "regimen_combination_strategy"
      },
      {
        "type": "checklist",
        "placeholder": "Regimen Complexity",
        "key": "regimen_complexity" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Modality",
        "key": "modality" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Class",
        "key": "classes" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "MoA category",
        "key": "moa_category" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "MoA",
        "key": "moa" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Target",
        "key": "target" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Mode of Administration",
        "key": "mode_of_administration"
      },
      {
        "type": "checklist",
        "placeholder": "Arm type",
        "key": "arm_type"
      },
      {
        "type": "checklist",
        "placeholder": "Stratification",
        "key": "stratification" // By Utkarsh
      }
    ]
  },
  {
    "title": "Design",
    "filters": [
      {
        "type": "checklist",
        "placeholder": "Study Design",
        "key": "study_design"
      },
      {
        "type": "checklist",
        "placeholder": "Intervention Type",
        // "key": "intervention_type"
        "key": "intervention_study_type"
      },
      {
        "type": "checklist",
        "placeholder": "Study Phase",
        "key": "phases"
      },
      {
        "type": "checklist",
        "placeholder": "Trial Architecture",
        "key": "trial_architecture" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Type of Primary Endpoint",
        "key": "primary_endpoint_main"
      },
      {
        "type": "checklist",
        "placeholder": "Control Type",
        "key": "control_type" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Response Criteria",
        "key": "response_criteria"
      },
      {
        "type": "checklist",
        "placeholder": "Blinding",
        "key": "blinding_info" // By Utkarsh
      }
    ]
  },
  {
    "title": "Operations",
    "filters": [
      {
        "type": "checklist",
        "placeholder": "Trial Status",
        "key": "trial_status" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Sponsor",
        "key": "sponsor_name"
      },
      {
        "type": "checklist",
        "placeholder": "Trial Location",
        "key": "locations"
      },
      {
        "type": "daterange",
        "label": "Study Start",
        "key": "study_start",
        keys: ["start_date_min", "start_date_max", "selected_range", "label", "type"],
        defaultValue: { start_date_min: null, start_date_max: null },
      },
      {
        "type": "checklist",
        "placeholder": "Target Enrollment",
        "key": "target_enrollment",
        // defaultValue: { selectedAge: "adult", range: [18, 64] },
      },
      {
        "type": "checklist",
        "placeholder": "Funding Source",
        "key": "funding_source" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Last Updated",
        "key": "last_updated_on" // By Utkarsh
      }
    ]
  },

  {
    "title": "Other",
    "filters": [
      {
        "type": "daterange",
        "label": "Primary Completion",
        "key": "completion_date",
        keys: ["start_date_min", "start_date_max", "selected_range", "label", "type"],
        defaultValue: { completion_date_min: null, completion_date_max: null }
      },
      {
        "type": "checklist",
        "placeholder": "Site",
        "key": "sites" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Site Type",
        "key": "site_type" // By Utkarsh
      },
      {
        "type": "checklist",
        "placeholder": "Lead Researcher",
        "key": "lead_researcher"
      },
      {
        "type": "checklist",
        "placeholder": "Result Posted",
        "key": "result_posted"
      },
      {
        "type": "checklist",
        "placeholder": "Site count",
        "key": "sites_count_string",
        // defaultValue: { selectedAge: "adult", range: [18, 64] },
      }
    ]
  },
  // Commented below JSON as per new Figma Requirement
  // {
  //   title: "Disease & Therapy",
  //   filters: [
  //     {
  //       type: "autocomplete",
  //       placeholder: "Cancer Type",
  //       key: "cancer_type",
  //     },
  //     {
  //       type: "autocomplete",
  //       placeholder: "Target,MoA, Biom...",
  //       key: "moa_biomarkers_pathways",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Intervention Type",
  //       key: "intervention_type",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Combination",
  //       key: "combination_backbone",
  //     },
  //     { type: "autocomplete", placeholder: "Regimen", key: "regimen" },
  //     {
  //       type: "checklist",
  //       placeholder: "Stage",
  //       key: "stage",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Line of Treatment",
  //       key: "line_intent",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Mode of Administration",
  //       key: "route_of_administration",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Dosing Frequency",
  //       key: "dosing_frequency",
  //     },
  //   ],
  // },
  // {
  //   title: "Trial Design",
  //   filters: [
  //     {
  //       type: "checklist",
  //       placeholder: "Trial Objective",
  //       key: "trialObjective",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Study Type",
  //       key: "study_type",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Study Design",
  //       key: "study_design",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Trial Status",
  //       key: "overall_status",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Number of Arms",
  //       key: "arm_number",
  //     },
  //     {
  //       type: "daterange",
  //       label: "Study Start",
  //       key: "study_start_date",
  //       keys: ["start_date_min", "start_date_max"],
  //       defaultValue: { start_date_min: null, start_date_max: null },
  //     },
  //     {
  //       type: "daterange",
  //       label: "Primary Completion",
  //       key: "completion_date",
  //       keys: ["completion_date_min", "completion_date_max"],
  //       defaultValue: { completion_date_min: null, completion_date_max: null },
  //     },
  //     {
  //       type: "daterange",
  //       label: "First Posted",
  //       key: "first_posted",
  //       keys: ["study_first_post_date_min", "study_first_post_date_max"],
  //       defaultValue: {
  //         study_first_post_date_min: null,
  //         study_first_post_date_max: null,
  //       },
  //     },
  //     {
  //       type: "daterange",
  //       label: "Result First Posted",
  //       key: "result_first_posted",
  //       keys: ["result_first_posted_min", "result_first_posted_max"],
  //       defaultValue: {
  //         result_first_posted_min: null,
  //         result_first_posted_max: null,
  //       },
  //     },
  //   ],
  // },
  // {
  //   title: "Patient Population",
  //   filters: [
  //     {
  //       type: "radiorange",
  //       placeholder: "Age",
  //       key: "age",
  //     },
  //     {
  //       type: "radiobutton",
  //       placeholder: "Sex",
  //       key: "sex",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Performance Status",
  //       key: "performance_status",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Prior Treatment",
  //       key: "prior_treatment",
  //     },
  //     {
  //       type: "autocomplete",
  //       placeholder: "Co-Morbidities",
  //       key: "comorbidities",
  //     },
  //   ],
  // },
  // {
  //   title: "Outcomes & Endpoints",
  //   filters: [
  //     {
  //       type: "checklist",
  //       placeholder: "Type of Primary..",
  //       key: "primary_endpoint_type",
  //       // options: primaryEndpointTypeOptions,
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Primary Endpoint",
  //       key: "primary_endpoints",
  //       // options: primaryEndpointOptions,
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Disease Status",
  //       key: "diseaseStatus",
  //       // options: diseaseStatusOptions,
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Response Criteria",
  //       key: "response_criteria",
  //       // options: responseCriteriaOptions,
  //     },
  //   ],
  // },
  // {
  //   title: "Safety Profile",
  //   filters: [
  //     {
  //       type: "checklist",
  //       placeholder: "Risk Severity",
  //       key: "risk_severity",
  //       // options: safetyProfileRiskSeverityOptions,
  //     },
  //   ],
  // },
  // {
  //   title: "Operations & Site",
  //   filters: [
  //     { type: "autocomplete", placeholder: "Location", key: "locations" },
  //     {
  //       type: "radiorange",
  //       placeholder: "Sites",
  //       key: "sites_count",
  //       defaultValue: { selectedAge: "adult", range: [18, 64] },
  //     },
  //     { type: "autocomplete", placeholder: "Institution", key: "institution" },
  //     {
  //       type: "autocomplete",
  //       placeholder: "Lead Researcher",
  //       key: "lead_researcher",
  //     },
  //     {
  //       type: "autocomplete",
  //       placeholder: "Sponsor",
  //       key: "lead_sponsor_name",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Type of Sponsor",
  //       key: "sponsor_type",
  //       // options: sponsorTypeOptions,
  //     },
  //     {
  //       type: "radiorange",
  //       placeholder: "Estimated Enrollment",
  //       key: "estimated_enrollment",
  //       defaultValue: { selectedAge: "adult", range: [18, 64] },
  //     },
  //   ],
  // },
  // {
  //   title: "Documentation & Regulatory",
  //   filters: [
  //     {
  //       type: "autocomplete",
  //       placeholder: "Trial ID",
  //       key: "NCT ID",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Regulatory Flag",
  //       key: "regulatoryFlag",
  //     },
  //     {
  //       type: "radiobutton",
  //       placeholder: "Result Posted",
  //       key: "has_results",
  //       defaultValue: "",
  //     },
  //     {
  //       type: "checklist",
  //       placeholder: "Document Available",
  //       key: "study_document",
  //     },
  //   ],
  // },
];

export const DRUG_FILTER_SECTIONS = [
  {
    title: "Drug Profile",
    filters: [
      {
        type: "autocomplete",
        placeholder: "Drug Name",
        key: "drug_name",
      },
      {
        type: "checklist",
        placeholder: "Sponsor",
        key: "sponsor_name",
      },
      {
        type: "checklist",
        placeholder: "MOA",
        key: "moa",
      },
      {
        type: "checklist",
        placeholder: "Drug Class",
        key: "drug_class",
      },
      {
        type: "checklist",
        placeholder: "Backbone",
        key: "backbone", // want keys from Utkarsh
      },
      {
        type: "checklist",
        placeholder: "Target",
        key: "target",
      },
      {
        type: "checklist",
        placeholder: "Route of Administration",
        key: "route_of_administration",
      },
      {
        type: "checklist",
        placeholder: "Originator Country",
        key: "originator_country",
      },
    ],
  },

  {
    title: "Clinical & Regulatory Status",
    filters: [
      {
        type: "checklist",
        placeholder: "Status",
        key: "trial_status",
      },
      {
        type: "checklist",
        placeholder: "Target Indication",
        key: "target_indication",
      },
      {
        type: "checklist",
        placeholder: "Approved Indication",
        key: "approved_indication",
      },
      {
        type: "checklist",
        placeholder: "Regulator",
        key: "regulator",
      },
      {
        type: "checklist",
        placeholder: "Approval Type",
        key: "approval_type",
      },
      {
        type: "daterange",
        label: "First Approval",
        key: "first_approval",
        keys: [
          "start_date_min",
          "start_date_max",
          "selected_range",
          "label",
          "type",
        ],
        defaultValue: {
          start_date_min: null,
          start_date_max: null,
        },
      },
      {
        type: "checklist",
        placeholder: "Withdrawn",
        key: "withdrawn",
      },
    ],
  },

  {
    title: "Patient Population",
    filters: [
      {
        type: "checklist",
        placeholder: "Organ",
        key: "organ",
      },
      {
        type: "checklist",
        placeholder: "Histology",
        key: "histology",
      },
      {
        type: "checklist",
        placeholder: "Biomarker",
        key: "biomarkers",
      },
      {
        type: "checklist",
        placeholder: "Line of Therapy",
        key: "line_of_therapy",
      },
      {
        type: "checklist",
        placeholder: "Cancer Stage",
        key: "cancer_stage",
      },
      {
        type: "checklist",
        placeholder: "Age",
        key: "age",
      },
      {
        type: "checklist",
        placeholder: "Sex",
        key: "sex",
      },
      {
        type: "checklist",
        placeholder: "Prior Therapy",
        key: "prior_therapy",
      },
      {
        type: "checklist",
        placeholder: "ECOG",
        key: "ecog",
      },
    ],
  },

  {
    title: "Patents & Exclusivity",
    filters: [
      {
        type: "checklist",
        placeholder: "Patent Type",
        key: "patent_type",
      },
      {
        type: "checklist",
        placeholder: "Patent Expiry",
        key: "patent_expiry",
      },
      {
        type: "checklist",
        placeholder: "Exclusivity Type",
        key: "exclusivity_type",
      },
      {
        type: "checklist",
        placeholder: "Patent Litigation",
        key: "patent_litigation",
      },
      {
        type: "checklist",
        placeholder: "Generic/Biosimilar Competition",
        key: "generic_competition",
      },
      {
        type: "checklist",
        placeholder: "Patent Extension",
        key: "patent_extension",
      },
      {
        type: "checklist",
        placeholder: "Loss of Exclusivity",
        key: "loss_exclusivity",
      },
    ],
  },
];

export const analyticsHeaderTabs = [
  "Landscape",
  "Evidence",
  "Feasibility",
  "Risks",
  "Outcomes",
];
export const FavoritesHeaderTab = [
  "Trials",
  "Sponsors",
  "Institutions",
  "Researchers",
  "Saved Searches"

]
export const settingtabs = [
  "Account",
  "Organization",
  // "Subscriptions & Billing",
]

export const sitesHeaderTabs = ["Lead Researcher", "Institution"];

export const mainHeaderTabs = [
  "Find",
  "Analyze",
  // "Sites",
  // "Sponsors",
  // "Favorites",
];

export const analyticsGraphBody = [
  "enrollmentByPhase",
  "landscapeMap",
  "endpointFrequency",
  "geographicSites",
  "trialCompletionTrend",
];

export const getCardHeightByTab = (activeTab) => {
  switch (activeTab) {
    case "Landscape":
      return "91px";

    case "Evidence":
      return "111px";

    case "Feasibility":
      return "111px";

    case "Outcomes":
      return "91px";

    case "Scouting":
      return "155px";

    case "OncoSignal":
      return "155px";

    default:
      return "91px"; // fallback
  }
};

const tabCardSize = {
  Landscape: { height: "91px" },
  Evidence: { height: "111px" },
  Feasibility: { height: "111px" },
  Outcomes: { height: "91px" }, // 3 per row
  Scouting: { height: "155px" },
  OncoSignal: { height: "155px" },
};

export const getCardSize = (activeTab) => {
  return tabCardSize[activeTab] || { width: "203px", height: "91px" };
};

export const monthOptions = [
  { label: "Next 6 Months", value: "Next 6 Months" },
  { label: "6–12 Months", value: "6–12 Months" },
  { label: "12–24 Months", value: "12–24 Months" },
  { label: "24–36 Months", value: "24–36 Months" },
  { label: "36+ Months", value: "36+ Months" },
  { label: "Custom", value: "custom" },
];

export const prepareEligibilityRows = (exclusion = [], inclusion = []) => {
  const maxLen = Math?.max(exclusion?.length, inclusion?.length);

  return Array.from({ length: maxLen }).map((_, i) => ({
    exclusion: exclusion[i] || "",
    inclusion: inclusion[i] || "",
  }));
};

// Pulls the first non-null traceability record out of a field's `data_traceability`
// array, falling back to legacy top-level fields for backward compatibility.
export const getTraceability = (item = {}) => {
  const raw = item?.data_traceability;
  const record = Array.isArray(raw)
    ? raw.find((entry) => entry && typeof entry === "object")
    : raw && typeof raw === "object"
      ? raw
      : null;
  return {
    source_text: record?.source_text ?? item?.source_text,
    source: record?.source ?? item?.source,
    source_link: record?.source_link ?? item?.source_link,
    reasoning: record?.reasoning ?? item?.reasoning,
    confidence_score: record?.confidence_score ?? item?.confidence_score,
    // For the wD7 trial the card renders this HTML as the traceability image.
    source_snippet_html: record?.source_snippet_html ?? item?.source_snippet_html,
    // Structured source-document snippet ({ heading, sub_heading, values[] })
    // plus the terms to highlight within it. The card renders these as a mock
    // of the source page (see snippetSource.css).
    snippet: record?.snippet ?? item?.snippet,
    keywords: record?.keywords ?? item?.keywords,
  };
};

// Normalizes a source_type string into one of the two canonical buckets.
// Backend sends values like "Clincal Trials" (note the typo) and "PubMed Trials".
export const normalizeSourceType = (sourceType = "") => {
  const text = String(sourceType ?? "").toLowerCase();
  if (text.includes("pubmed") || text.includes("ncbi")) return "PubMed";
  // default everything else (incl. the "Clincal Trials" typo) to Clinical Trials
  return "Clinical Trials";
};

// Returns the FULL list of traceability records for a field, each normalized to
// the shape EvidenceTraceCard consumes. Falls back to legacy top-level fields
// when no `data_traceability` array exists so single-record callers keep working.
export const getTraceabilityList = (item = {}) => {
  const raw = item?.data_traceability;
  const records = Array.isArray(raw)
    ? raw.filter((entry) => entry && typeof entry === "object")
    : raw && typeof raw === "object"
      ? [raw]
      : [];

  const normalize = (record = {}) => ({
    source_text: record?.source_text ?? item?.source_text,
    source: record?.source ?? item?.source,
    source_link: record?.source_link ?? item?.source_link,
    reasoning: record?.reasoning ?? item?.reasoning,
    confidence_score: record?.confidence_score ?? item?.confidence_score,
    source_type: normalizeSourceType(record?.source_type ?? item?.source_type),
    // Raw HTML snippet of the source page region. For certain records (e.g. the
    // wD7-VqO-nZf OncoSuite id) the card rasterizes this into an image instead
    // of loading the `source` image URL.
    source_snippet_html: record?.source_snippet_html ?? item?.source_snippet_html,
    // Structured source-document snippet + terms to highlight within it.
    snippet: record?.snippet ?? item?.snippet,
    keywords: record?.keywords ?? item?.keywords,
  });

  if (records.length === 0) {
    // Legacy single-record fallback.
    return [normalize({})];
  }
  return records.map(normalize);
};

export const phasesOptions = [
  { id: 1, text: "Early Phase I", value: "Early Phase I" },
  { id: 2, text: "Phase I", value: "Phase I" },
  { id: 3, text: "Phase II", value: "Phase II" },
  { id: 4, text: "Phase III", value: "Phase III" },
  { id: 5, text: "Phase IV", value: "Phase IV" },
  { id: 6, text: "Phase I / II", value: "Phase I / II" },
  { id: 7, text: "Phase II / III", value: "Phase II / III" },
  { id: 8, text: "Not applicable", value: "Not applicable" },
];

export const landscapeGraphPayload = [
  "trialsByPhase",
  "trialsByTTPE",
  "activeRecruitingTrialsByCountry",
];

export const homepageTabs = ["Study Details", "Results"];

export const AllFilterComparatorType = [
  [
    "Standard of Care",
    "Active Comparator",
    "Placebo / Sham",
    "Single-arm",
    "External Control",
    "Best Supportive Care",
  ],
];

export const AllFilterRandomization = [
  ["Randomized", "Non-randomized", "Single-arm", "Unknown/Not Reported"],
];

export const AllFilterPrimaryOutcomes = [
  [
    "Survival / Time-to-Event",
    "Response (ORR / CR / PR)",
    "Safety (DLTs / AEs)",
    "PK / PD",
    "Functional / PRO",
    "Biomarker / Diagnostic",
  ],
];

export const AllFilterLineofTherapy = [
  [
    "1L",
    "2L+",
    "3L+",
    "NeoAdjuvant",
    "Adjuvant",
    "Maintenance",
    "Consolidation",
  ],
];

export const AllFilterStagesList = [
  [
    "Localized (I–II)",
    "Locally Advanced (III)",
    "Metastatic (IV)",
    "Relapsed / Refractory",
    "MRD+",
    "MRD-",
  ],
];

/* Trial status colours, per the Figma status legend. Keys are normalised:
   lower-cased, with en/em dashes folded to "-" and whitespace collapsed, so
   "Active – Not Recruiting" and "Active - Not Recruiting" both match. */
const STATUS_COLORS = {
  "completed": "rgba(75, 145, 78, 1)",
  "approved for marketing": "rgba(129, 199, 132, 1)",
  "recruiting": "rgba(0, 113, 227, 1)",
  "enrolling - by invite": "rgba(94, 118, 237, 1)",
  "available": "rgba(36, 153, 208, 1)",
  "active - not recruiting": "rgba(84, 110, 122, 1)",
  "suspended": "rgba(145, 77, 10, 1)",
  "not yet recruiting": "rgba(230, 126, 34, 1)",
  "terminated": "rgba(192, 57, 43, 1)",
  "withdrawn": "rgba(249, 105, 105, 1)",
  "temporarily not available": "rgba(127, 140, 141, 1)",
  "no longer available": "rgba(168, 168, 168, 1)",
  "unknown": "rgba(202, 202, 202, 1)",
};

const DEFAULT_STATUS_COLOR = STATUS_COLORS.unknown;

export const getStatusColor = (status = "") => {
  const key = String(status)
    .trim()
    .toLowerCase()
    // Fold hyphen/figure/en/em dashes (U+2010-U+2015) to a plain "-".
    .replace(/[‐-―]/g, "-")
    .replace(/\s+/g, " ");

  return STATUS_COLORS[key] || DEFAULT_STATUS_COLOR;
};


export const colorThemes = [
  {
    bg: "rgba(254, 246, 238, 1)",
    border: "rgba(253, 233, 214, 1)",
    title: "rgba(193, 102, 13, 1)",
  },
  {
    bg: "rgba(240, 246, 254, 1)",
    border: "rgba(220, 233, 252, 1)",
    title: "rgba(38, 102, 190, 1)",
  },
  {
    bg: "rgba(240, 249, 244, 1)",
    border: "rgba(218, 241, 228, 1)",
    title: "rgba(31, 139, 77, 1)",
  },
  {
    bg: "rgba(252, 242, 248, 1)",
    border: "rgba(248, 223, 239, 1)",
    title: "rgba(171, 51, 127, 1)",
  },
];



export const privacy_policy_colors = {
  info900: "rgba(12, 32, 59, 1)",
  info600: "#2563EB",
  black800: "rgba(0,0,0,0.8)",
  black700: "rgba(0,0,0,0.7)",
  black600: "rgba(0,0,0,0.6)",
  white100: "#FFFFFF",
};



export const SideBarOptions = [
  {
    icon: TrialsLogo,
    label: "Trials",
    link: "/trials",
    tab: "TRIALS",
    disable: false,
  },
  // {
  //   icon: compliance,
  //   label: "Compliance & Security",
  //   link: "",
  //   tab: "SECURITY",
  //   disable: true,
  // },
  {
    icon: LocationSidebar,
    label: "Location",
    link: "/admin/site_intelligence",
    tab: "SITE INTELLIGENCE",
    disable: false,
  },
  {
    link: "/admin/drug_intelligence",
    icon: drugIcon,
    label: "Drug Intelligence",
    tab: "DRUG INTELLIGENCE",
    disable: false,
  },
  // {
  //   icon: Research,
  //   label: "Research Center",
  //   link: "",
  //   tab: "Research Center",
  //   disable: true,
  // },
  {
    icon: SettingLogo,
    label: "Settings",
    link: "/settings",
    tab: "SETTINGS",
    disable: false,
  },
  // role === "OncoSuits Admin" || role === "Global Admin"
  //   ? {
  //       icon: Container6,
  //       label: "Organizations",
  //       link: "/admin/users",
  //       tab: "ORGANIZATIONS",
  //       disable: false,
  //     }
  //   : {},
];


export const ROLES = {
  ONCO_SUITE_ADMIN: "OncoSuits Admin",
  SUPER_ADMIN: "Super Admin",
  TEAM_MANAGER: "Team Manager",
};

export const getRolesAccess = (role = localStorage.getItem("userRole") || "") => {
  return {
    role, // the raw role string
    isOncoSuiteAdmin: role === ROLES.ONCO_SUITE_ADMIN,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isTeamManager: role === ROLES.TEAM_MANAGER,
  };
};

export const notAvailableText = "N/A";


export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
export const ANALYTICS_TABS = [
  { label: "Patients", value: "Population", disabled: false },
  { label: "Treatment", value: "Treatment", disabled: false },
  { label: "Endpoints", value: "Outcomes", disabled: true },
  { label: "Biomarker", value: "Biomarker", disabled: true },
  { label: "Trial Design", value: "Landscape", disabled: true },
  { label: "Feasibility", value: "Feasibility", disabled: false },
  // { label: "Risk", value: "Risks", disabled: true },
  { label: "Sponsor", value: "Sponsor", disabled: true },
];



// export const ChevronUpSmall = ({ color = "#2666BE" }) => (
//   <svg
//     width="10.6"
//     height="6.5"
//     viewBox="0 0 10.6 6.5"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//     style={{ display: "block", flexShrink: 0 }}
//   >
//     <path
//       d="M1 5.5L5.3 1L9.6 5.5"
//       stroke={color}
//       strokeWidth="1.6"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//   </svg>
// );


// export const ChevronDownSmall = ({ color = "#2666BE" }) => (
//   <svg
//     width="10.6"
//     height="6.5"
//     viewBox="0 0 10.6 6.5"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//     style={{ display: "block", flexShrink: 0 }}
//   >
//     <path
//       d="M1 1L5.3 5.5L9.6 1"
//       stroke={color}
//       strokeWidth="1.6"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//   </svg>
// );

export const apiPayloadInterventionType = (filters) => {
  const payload = { ...filters };

  if (Array.isArray(filters.intervention_type)) {
    const parents = filters.intervention_type
      .filter((item) => item.type === "parent")
      .map((item) => item.label);

    const children = filters.intervention_type
      .filter((item) => item.type === "child")
      .map((item) => item.label);

    delete payload.intervention_type;

    if (parents.length) {
      payload.intervention_type = parents;
    }

    if (children.length) {
      payload.intervention_subtypes = children;
    }
  }

  return payload;
};


// Method to convert the object to request payload format
const formatDate = (dateStr) => {
  // Input: "19-04-2025" → Output: "2025-04-19" (ISO for backend)
  if (!dateStr) return undefined;
  const [day, month, year] = dateStr.split("-");
  return `${year}-${month}-${day}`;
};

export const buildFilterPayload = (chipHeaderData, flag = 0) => {
  // debugger

  const include = {};
  const exclude = {};
  const searchBarCategoryToFilterKey = {
    Organ: "organ",
    Histology: "histology",
    "Sub Histology": "histology",
    "Histology Variant": "histology",
    "Histology + Sub Histology": "histology",
    "Sub Histology + Histology Variant": "histology",
    "Organ + Histology": "histology",
    "Line Of Therapy": "line_of_therapy",
    "Line of Therapy": "line_of_therapy",
    "Primary Endpoints": "primary_endpoints",
    Locations: "locations",
    Sponsor: "sponsor_name",
    Biomarker: "biomarkers",
    "Biomarkers + Biomarkers Variant": "biomarkers",
    "Cancer Stage": "cancer_stage",
    "Co-Morbidities": "comorbidities",
    "Co-morbidities": "comorbidities",
    "Other Physical Conditions": "physical_state",
    "Other physical conditions": "physical_state",
    "Prior Therapy": "prior_therapy",
    MoA: "moa",
    "MoA category": "moa_category",
    Target: "target",
    "Drug Name": "drug_name",
    "Regimen Combination Strategy": "regimen_combination_strategy",
    "Regimen Complexity": "regimen_complexity",
    Modality: "modality",
    Class: "classes",
    ECOG: "ecog",
    "Mode of Administration": "mode_of_administration",
    "Mode Of Administration": "mode_of_administration",
    "Arm type": "arm_type",
    Stratification: "stratification",
    "Study Design": "study_design",
    "Study Phase": "phases",
    "Trial Architecture": "trial_architecture",
    "Control Type": "control_type",
    "Response Criteria": "response_criteria",
    Blinding: "blinding_info",
    "Trial Status": "trial_status",
    "Funding Source": "funding_source",
    "Trial Acronyms": "trial_acronym",
    "Trial Acronym": "trial_acronym",
  };

  // Identifier search (NCT number or OncoSuite id) is tagged "Unique Identifier"
  // in the dropdown. The backend filters these via BOTH `nct_id` and
  // `unique_identifier` keys in include/exclude (same values in both). It is not
  // a single structured key like the categories above, so it's handled
  // separately below — without this the chip mapped to no key at all, sent an
  // empty payload, and the list never filtered.
  const IDENTIFIER_CATEGORIES = new Set([
    "Unique Identifier",
    "Unique identifier",
    "NCT ID",
    "NCT Number",
  ]);
  // Trial acronym chips (e.g. "SQUIRE", "PACIFIC-5") are tagged "Trial Acronyms"
  // in the dropdown and filter via the `trial_acronym` key. Handled explicitly
  // here — like the identifier categories above — so the chip always emits its
  // include/exclude key regardless of whether the category was registered in
  // FILTER_SECTIONS or returned by the current API response.
  const ACRONYM_CATEGORIES = new Set([
    "Trial Acronyms",
    "Trial Acronym",
    "trial_acronym",
    "trial_acronyms",
  ]);
  const searchBarOverrides = {};

  // Categories returned by non-"main_filter" API flags (e.g. searching "phase") come back
  // keyed by the raw flag name itself (e.g. "phases") rather than a display name — fall back
  // to treating the category as the filter key directly when it already is one.
  const VALID_FILTER_KEYS = new Set(
    FILTER_SECTIONS.flatMap((section) => section.filters.map((f) => f.key)),
  );
  const resolveStructuredKey = (category) => {
    const direct =
      searchBarCategoryToFilterKey[category] ??
      (VALID_FILTER_KEYS.has(category) ? category : undefined);
    if (direct) return direct;
    // Compound categories (e.g. "Sub Histology + Histology Variant") aren't listed
    // explicitly — fall back to the first part's structured key so these selections
    // are still sent to the backend (e.g. → "histology") instead of being dropped.
    if ((category ?? "").includes("+")) {
      const firstPart = category.split("+")[0].trim();
      return (
        searchBarCategoryToFilterKey[firstPart] ??
        (VALID_FILTER_KEYS.has(firstPart) ? firstPart : undefined)
      );
    }
    return undefined;
  };

  const push = (bucket, key, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      // Dedupe: identifier chips render a mirror `nct_id` chip AND go through the
      // search_bar identifier branch, so the same value can be pushed twice.
      const merged = [...(bucket[key] ?? []), ...value];
      bucket[key] = [...new Set(merged)];
    } else {
      bucket[key] = value;
    }
  };

  if (Array.isArray(chipHeaderData?.search_bar)) {
    chipHeaderData.search_bar.forEach(({ label, category, type }) => {
      const filterKey = resolveStructuredKey(category);
      if (!filterKey || !label) return;

      if (!searchBarOverrides[filterKey]) searchBarOverrides[filterKey] = {};
      searchBarOverrides[filterKey][label.toString().trim().toLowerCase()] = type;
    });
  }

  Object.entries(chipHeaderData).forEach(([filterKey, items]) => {
    if (filterKey === "search_bar") {
      items.forEach(({ label, rawLabel, category, type }) => {
        const bucket = type === "included" ? include : exclude;

        // Identifier chips (NCT number / OncoSuite id) have no single structured
        // key — the backend expects the value under BOTH nct_id and
        // unique_identifier. Emit both so the search_results API can match on
        // either identifier type.
        if (IDENTIFIER_CATEGORIES.has(category)) {
          if (!label) return;
          push(bucket, "nct_id", [label]);
          push(bucket, "unique_identifier", [label]);
          return;
        }

        // Trial acronym chips emit `trial_acronym` directly, for the same reason
        // identifiers are handled above — don't depend on category registration.
        if (ACRONYM_CATEGORIES.has(category)) {
          if (!label) return;
          push(bucket, "trial_acronym", [label]);
          return;
        }

        const structuredKey = resolveStructuredKey(category);
        if (!structuredKey) return;
        // Locations strip the short form (e.g. "United States (US)" → "United States")
        // for display, but the backend expects the full value including the short form.
        const payloadValue =
          structuredKey === "locations" && rawLabel ? rawLabel : label;
        push(bucket, structuredKey, [payloadValue]);
      });
      return;
    }

    if (filterKey === "study_start") {
      items.forEach(({ start_date_min, start_date_max, type }) => {
        const bucket = type === "included" ? include : exclude;
        push(bucket, "start_date_min", formatDate(start_date_min));
        push(bucket, "start_date_max", formatDate(start_date_max));
      });
      return;
    }

    if (filterKey === "completion_date") {
      items.forEach(({ start_date_min, start_date_max, type }) => {
        const bucket = type === "included" ? include : exclude;
        push(bucket, "primary_completion_date_min", formatDate(start_date_min));
        push(bucket, "primary_completion_date_max", formatDate(start_date_max));
      });
      return;
    }

    if (filterKey === "primary_endpoint_main") {
      items.forEach(({ label, type, children }) => {
        const bucket = type === "included" ? include : exclude;
        if (children) {
          push(bucket, "primary_endpoint_type", [label]);
          return;
        }
        flag == 1 && push(bucket, "primary_endpoint_main", [label]);
        push(bucket, "primary_endpoints", [label]);
      });
      return;
    }



    items.forEach(({ label, type }) => {
      const overrideType = searchBarOverrides[filterKey]?.[
        label?.toString().trim().toLowerCase()
      ];
      if (overrideType) return;

      const bucket = type === "included" ? include : exclude;
      push(bucket, filterKey, [label]);
    });
  });

  // ✅ Use let so reassignment works
  let filterData = {}
  // A search_bar chip whose category has no structured-key mapping (e.g.
  // "Unique Identifier" / an NCT number) contributes nothing to include/exclude,
  // but it IS a real applied filter the backend must receive via search_bar.
  // Treat the presence of any search_bar / obj-based filter as "has filters" so
  // the payload isn't collapsed to {} — that empty payload was why applying an
  // NCT-number chip on initial load hit the API with no filter and only worked
  // after toggling to a mapped category.
  const hasObjFilters =
    chipHeaderData?.search_bar?.length > 0 ||
    chipHeaderData?.primary_endpoint_main?.length > 0 ||
    chipHeaderData?.study_start?.length > 0 ||
    chipHeaderData?.completion_date?.length > 0;
  const hasAnyFilter =
    Object.keys(include).length > 0 ||
    Object.keys(exclude).length > 0 ||
    hasObjFilters;

  if (hasAnyFilter) {
    filterData = {
      ...(chipHeaderData?.primary_endpoint_main?.length > 0
        ? { primary_endpoint_obj: chipHeaderData.primary_endpoint_main }
        : {}),
      ...(chipHeaderData?.study_start?.length > 0
        ? { study_start_obj: chipHeaderData.study_start }
        : {}),
      ...(chipHeaderData?.completion_date?.length > 0
        ? { primary_completion_obj: chipHeaderData.completion_date }
        : {}),
      ...(chipHeaderData?.search_bar?.length > 0
        ? { search_bar: chipHeaderData.search_bar }
        : {}),
    };
  }

  const request = {
    include: Object.keys(include).length > 0 ? include : {},
    exclude: Object.keys(exclude).length > 0 ? exclude : {},
    applied_filters: filterData
  };

  if (hasAnyFilter) {
    return request;
  } else {
    return {};
  }
};
//Endof Method to convert the object to request payload format


// Method to convert the Payload Json to original format;
// const parseDate = (dateStr) => {
//   // Input: "2025-04-19" (ISO) → Output: "19-04-2025" (display)
//   if (!dateStr) return undefined;
//   const [year, month, day] = dateStr.split("-");
//   return `${day}-${month}-${year}`;
// };

export const parseFilterPayload = (payload) => {
  const chipHeaderData = {};

  const push = (key, item) => {
    if (!chipHeaderData[key]) chipHeaderData[key] = [];
    chipHeaderData[key].push(item);
  };

  const processBucket = (bucket, type) => {
    if (!bucket || Object.keys(bucket).length === 0) return;

    Object.entries(bucket).forEach(([key, value]) => {

      // --- Date range fields ---
      // if (key === "start_date_min" || key === "start_date_max") {
      //   // Merge into a single study_start entry
      //   const existing = chipHeaderData["study_start"]?.find(i => i.type === type);
      //   if (existing) {
      //     if (key === "start_date_min") existing.start_date_min = parseDate(value);
      //     if (key === "start_date_max") existing.start_date_max = parseDate(value);
      //   } else {
      //     push("study_start", {
      //       start_date_min: key === "start_date_min" ? parseDate(value) : undefined,
      //       start_date_max: key === "start_date_max" ? parseDate(value) : undefined,
      //       type,
      //     });
      //   }
      //   return;
      // }

      // if (key === "primary_completion_date_min" || key === "primary_completion_date_max") {
      //   // Merge into a single completion_date entry
      //   const existing = chipHeaderData["completion_date"]?.find(i => i.type === type);
      //   if (existing) {
      //     if (key === "primary_completion_date_min") existing.start_date_min = parseDate(value);
      //     if (key === "primary_completion_date_max") existing.start_date_max = parseDate(value);
      //   } else {
      //     push("completion_date", {
      //       start_date_min: key === "primary_completion_date_min" ? parseDate(value) : undefined,
      //       start_date_max: key === "primary_completion_date_max" ? parseDate(value) : undefined,
      //       type,
      //     });
      //   }
      //   return;
      // }

      // --- primary_endpoint_main: restore as child items (no parent) ---
      // if (key === "primary_endpoint_main") {
      //   (Array.isArray(value) ? value : [value]).forEach((label) => {
      //     push("primary_endpoint_main", { label, type });
      //   });
      //   return;
      // }

      // --- All other fields: restore as label items ---
      (Array.isArray(value) ? value : [value]).forEach((label) => {
        push(key, { label, type });
      });
    });
  };

  processBucket(payload?.include, "included");
  processBucket(payload?.exclude, "excluded");

  // Delete date and parent/child data
  delete chipHeaderData["primary_completion_date_max"];
  delete chipHeaderData["primary_completion_date_min"];
  delete chipHeaderData["start_date_max"];
  delete chipHeaderData["start_date_min"];
  delete chipHeaderData["primary_endpoint_main"];
  delete chipHeaderData["primary_endpoint_type"];
  delete chipHeaderData["primary_endpoints"];
  // Identifier searches are stored under BOTH nct_id and unique_identifier in
  // include/exclude, but they render as a single "Unique Identifier" search_bar
  // chip (restored from applied_filters.search_bar below). Drop the raw buckets
  // so we don't also create phantom nct_id / unique_identifier chips on reload.
  delete chipHeaderData["nct_id"];
  delete chipHeaderData["unique_identifier"];
  // Same for trial acronyms: they render as a single "Trial Acronyms" search_bar
  // chip (restored from applied_filters.search_bar below), so drop the raw
  // bucket to avoid a duplicate trial_acronym chip on reload.
  delete chipHeaderData["trial_acronym"];




  Object.assign(chipHeaderData, {
    ...(payload?.applied_filters?.primary_endpoint_obj?.length > 0
      ? { primary_endpoint_main: payload.applied_filters.primary_endpoint_obj }
      : {}),
    ...(payload?.applied_filters?.study_start_obj?.length > 0
      ? { study_start: payload.applied_filters.study_start_obj }
      : {}),
    ...(payload?.applied_filters?.primary_completion_obj?.length > 0
      ? { completion_date: payload.applied_filters.primary_completion_obj }
      : {}),
    ...(payload?.applied_filters?.search_bar?.length > 0
      ? { search_bar: payload.applied_filters.search_bar }
      : {}),
  });


  return chipHeaderData;
};
// Endof Method to convert the Payload Json to original format;
