import { lazy } from "react";

/* Chart registry -- the single contract between the Python answer pipeline and
   the UI.

   Every entry maps a chart NAME (what the LLM selects and what Python puts in
   the `chart` field of a block) to a component imported straight out of the
   ctsearch submodule via the `@ct` alias. Nothing is copied: these are the same
   files the ctsearch app renders, so a fix there flows here on a submodule bump.

   React.lazy keeps the cost of the big files off the initial bundle -- a chart
   is only fetched once an answer actually asks for it.

   `enabled: false` gates a chart whose backing data does not exist yet. The
   component is fully wired; flipping the flag is the only change needed once
   the data lands (this is how KMCurve is handled today). */

export const REGISTRY = {
  // Cohort landscape + adverse events both render through ctsearch's generic
  // Figma-styled table card, which already takes {columns, data} as props.
  CohortTable: {
    // Built to the Figma spec (column widths, filter dropdowns, pagination,
    // Download CSV) rather than ctsearch's generic CommonTableCard, which has a
    // different header/row layout.
    component: lazy(() => import("./CohortTable.jsx")),
    label: "Cohort table",
    useWhen: "listing cohorts/trials with phase, regimen, N and status",
    requires: ["columns", "data"],
    enabled: true,
  },

  // Both panels share PanelTable so the card, header and typography match the
  // cohort table's Figma tokens. ctsearch's CommonTableCard renders a different
  // layout (and pulls react-router in through EvidenceTraceCard), so it is not
  // used for these.
  EndpointSummaryTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Endpoint summary",
    useWhen: "the question asks which endpoints trials measure",
    requires: ["columns", "data"],
    enabled: true,
  },

  AdverseEventsTable: {
    // Expandable organ-system grouping, per the design.
    component: lazy(() => import("./AdverseEventsTable.jsx")),
    label: "Adverse events table",
    useWhen: "the question asks about safety, toxicity or adverse events",
    requires: ["groups"],
    enabled: true,
  },

  EfficacySafetyScatter: {
    // ctsearch's own recharts bubble chart (colour-by dropdown, reversed SAE
    // axis, ZAxis bubble sizing, legend). It is a named export of
    // NewTreatment.jsx and takes `liveData` in the shape
    // mapEfficacyVsSafetyToScatter produces.
    component: lazy(async () => ({
      default: (await import("@ct/pages/trialsHeader/analytics/NewTreatment"))
        .EfficacyVsSafety,
    })),
    label: "Efficacy vs safety",
    useWhen: "comparing response rates against toxicity across arms",
    requires: ["liveData", "xOptions", "yOptions"],
    enabled: true,
  },

  EndpointsTable: {
    component: lazy(() => import("@ct/pages/trialsHeader/trials/EndpointsTable")),
    label: "Endpoint outcomes table",
    useWhen:
      "the question asks about trial endpoints, outcomes, ORR/PFS/OS values, or " +
      "primary vs secondary endpoint results",
    requires: ["arms", "primaryRows", "secondaryRows"],
    enabled: true,
  },

  EfficacySafetyRows: {
    // The unaggregated rows behind the scatter -- one per arm+endpoint, which
    // is what the production API query returns (452 rows for 153 arms).
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Efficacy / safety endpoint rows",
    useWhen: "the question asks for the raw endpoint rows behind the chart",
    requires: ["columns", "data"],
    enabled: true,
  },

  // Feasibility-tab charts (analytics schema).
  CompetitionVsEnrollment: {
    component: lazy(async () => ({
      default: (await import("./FeasibilityCharts.jsx")).FeasibilityScatter,
    })),
    label: "Competition intensity vs enrollment speed",
    useWhen: "comparing competition intensity against recruitment speed",
    requires: ["points"],
    enabled: true,
  },

  AmendmentRisk: {
    component: lazy(async () => ({
      default: (await import("./FeasibilityCharts.jsx")).FeasibilityScatter,
    })),
    label: "Amendment risk vs enrollment speed",
    useWhen: "the question asks about protocol amendments",
    requires: ["points"],
    enabled: true,
  },

  TrialDurationByCountry: {
    // Thin wrapper over ctsearch's chart + its own row mapper, so flags, risk
    // badges and percentile tooltips all come from their code.
    component: lazy(() => import("./TrialDuration.jsx")),
    label: "Trial duration by country",
    useWhen: "study start-up, recruitment window or data-lock duration",
    requires: ["points", "minTrials", "maxTrials"],
    enabled: true,
  },

  // Analytics-schema panels. All three are plain {columns, data} tables, so
  // they share PanelTable with the endpoint / adverse-event panels.
  TreatmentStrategiesTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Treatment strategies",
    useWhen: "the question asks about mechanisms of action or drug modality",
    requires: ["columns", "data"],
    enabled: true,
  },

  FeasibilityTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Feasibility by country",
    useWhen: "the question asks about start-up time, recruitment or feasibility",
    requires: ["columns", "data"],
    enabled: true,
  },

  CompetitionTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Competition intensity",
    useWhen: "the question asks about competition or recruitment speed",
    requires: ["columns", "data"],
    enabled: true,
  },

  // Median PFS/OS/ORR by drug mechanism/backbone for NSCLC or SCLC, from
  // verified oncosuite_gold outcomes -- the analytics-schema efficacy tables
  // have zero OS/PFS rows for any condition, so this is built straight from
  // trial_info/drug_info/results_outcomes_basic_info instead.
  EfficacyByMoATable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Effectiveness by mechanism of action",
    useWhen: "comparing PFS/OS/ORR across drug mechanisms of action for NSCLC/SCLC",
    requires: ["columns", "data"],
    enabled: true,
  },

  EfficacyByBackboneTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Effectiveness by treatment backbone",
    useWhen: "comparing PFS/OS/ORR across treatment backbones for NSCLC/SCLC",
    requires: ["columns", "data"],
    enabled: true,
  },

  DifferentiationMatrixTable: {
    // Same PanelTable as the other plain {columns, data} panels. One row per
    // cohort (biomarker/stage/line-of-therapy/regimen vary by cohort within a
    // trial, not just by trial), scoped to whichever trials the question
    // already resolved -- see chart_data.build_differentiation_matrix.
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Competing programs comparison",
    useWhen:
      "the question asks how competing trials/programs differ or compare " +
      "on trial design, patient selection, biomarker strategy, line of " +
      "therapy or combination regimen",
    requires: ["columns", "data"],
    enabled: true,
  },

  PopulationMap: {
    // ctsearch's full choropleth map (density bands, legend, hover cards).
    // Data behind this chart is trial-SITE density from facility_info, NOT
    // real cancer incidence -- chart_data.py passes legendTitle/totalLabel
    // overrides so the UI states this honestly. See CaseBurdenMap for the
    // real-epidemiology version of this same component.
    component: lazy(() => import("@ct/components/MapView")),
    label: "Trial site density map (by country/region)",
    useWhen:
      "the question asks where trial sites are concentrated geographically, " +
      "or wants a density/heatmap view of site distribution across countries",
    requires: ["data"],
    enabled: true,
  },

  CaseStageBreakdownTable: {
    // Same PanelTable as the other plain {columns, data} panels. Country x
    // cancer-stage annual new-case counts for a named lung-cancer driver
    // biomarker, from oncosuite_gold.case_filters -- the only source with a
    // stage dimension (CaseBurdenMap's map_view_population has none).
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Cancer cases by stage",
    useWhen:
      "the question asks for annual new cancer cases broken down by cancer " +
      "stage for a named biomarker (EGFR, ALK, KRAS, ...)",
    requires: ["columns", "data"],
    enabled: true,
  },

  CaseBurdenMap: {
    // Same MapView component as PopulationMap, but fed real epidemiology
    // data (annual new cancer cases, population, density by country/city)
    // from oncosuite_gold.map_view_population -- see map_data.py's
    // build_case_burden_map. legendTitle/totalLabel are set server-side to
    // "New cancer cases" / "cases per year" since this data is real.
    component: lazy(() => import("@ct/components/MapView")),
    label: "Cancer case burden map (by country/city)",
    useWhen:
      "the question asks about real cancer incidence, new/annual cancer " +
      "case counts, case burden, or population/case-ratio by country or city",
    requires: ["data"],
    enabled: true,
  },

  SiteMap: {
    // Same MapView component as PopulationMap/CaseBurdenMap (see
    // chart_data.build_site_map, which now delegates to map_data.
    // build_map_points -- the same real trial-site-density data
    // PopulationMap uses). Previously rendered through ctsearch's UsHeatMap,
    // a DIFFERENT component that ignored the title/data passed in and always
    // showed its own hardcoded "Population Density" legend regardless of
    // what was actually plotted -- a real answer under a wrong label.
    component: lazy(() => import("@ct/components/MapView")),
    label: "Trial site density map",
    useWhen:
      "the question asks where specific trials or their sites/facilities are " +
      "located or running",
    requires: ["data"],
    enabled: true,
  },

  // Cross-table relationship panels (complex_insights.py). All four are plain
  // {columns, data} tables, so they share PanelTable like the other panels.
  DrugCombinationTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Drug combination network",
    useWhen: "the question asks which drug combinations recur across trials",
    requires: ["columns", "data"],
    enabled: true,
  },

  BiomarkerOutcomeTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Hazard ratio by biomarker",
    useWhen: "the question asks how outcomes differ by biomarker status",
    requires: ["columns", "data"],
    enabled: true,
  },

  SponsorMoATable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Sponsor mechanism specialization",
    useWhen: "the question asks which sponsors specialize in which mechanisms",
    requires: ["columns", "data"],
    enabled: true,
  },

  SiteFeasibilityTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Site density vs. disease burden",
    useWhen: "the question asks which countries are under/over-served by trial sites",
    requires: ["columns", "data"],
    enabled: true,
  },

  PayloadSafetyTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Payload mechanism vs. safety profile",
    useWhen: "the question asks how ADC payload/mechanism relates to adverse events",
    requires: ["columns", "data"],
    enabled: true,
  },

  RegionFootprintTable: {
    component: lazy(() => import("./PanelTable.jsx")),
    label: "Site footprint by region",
    useWhen: "the question asks about geographic/regional trial-site distribution",
    requires: ["columns", "data"],
    enabled: true,
  },

  KMCurve: {
    // EfficacyExplorerCard takes a single `explorer` prop (array of
    // {graph_type, endpoint, disease, data:{x_axis, y_axis, points}}) --
    // ChartBlock spreads `props` straight onto the component, so
    // chart_data.build_km_curve's returned {"explorer": [...]} lands as
    // exactly that prop. Backed by oncosuite_gold.results_analytics.
    component: lazy(() => import("@ct/pages/trialsHeader/trials/EfficacyExplorerCard")),
    label: "Kaplan-Meier survival curve",
    useWhen:
      "the question asks about survival over time -- KM curves, median PFS/OS " +
      "over a time axis, or at-risk counts across intervals",
    requires: ["explorer"],
    enabled: true,
  },
};

/** Names the LLM is allowed to choose from right now. */
export const enabledCharts = () =>
  Object.entries(REGISTRY)
    .filter(([, v]) => v.enabled)
    .map(([name]) => name);

export const getChart = (name) => {
  const entry = REGISTRY[name];
  return entry && entry.enabled ? entry : null;
};
