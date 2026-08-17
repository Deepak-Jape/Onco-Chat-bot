import axiosInstance from "../AxiosInstance";
import { useQuery } from "@tanstack/react-query";

const normalizeDownloadTableName = (tablename) => {
    if (Array.isArray(tablename)) {
        return tablename[0] || "";
    }

    return tablename || "";
};

const hasNonEmptyFilterValues = (filters = {}) =>
    Object.values(filters).some((value) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return value !== null && value !== undefined && value !== "";
    });

const normalizeFilterArray = (value) => {
    if (Array.isArray(value)) {
        return value.filter(
            (item) =>
                item !== null &&
                item !== undefined &&
                item !== ""
        );
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return [];
    }

    return [value];
};

const pruneEmptyFilters = (filters = {}) =>
    Object.entries(filters).reduce(
        (acc, [key, value]) => {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    acc[key] = value;
                }

                return acc;
            }

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {
                acc[key] = value;
            }

            return acc;
        },
        {}
    );

export const normalizeTreatmentAnalyticsFilters = (
    filters = {}
) => ({
    ...filters,
    line_intent: normalizeFilterArray(filters.line_intent),
    phases: normalizeFilterArray(filters.phases),
    stage: normalizeFilterArray(filters.stage),
    locations: normalizeFilterArray(filters.locations),
    category: normalizeFilterArray(filters.category),
    sub_category: normalizeFilterArray(filters.sub_category),
    modality: normalizeFilterArray(filters.modality),
    regimen_complexity: normalizeFilterArray(
        filters.regimen_complexity
    ),
    // Scalar keys selecting which dimension each dimension-driven graph is
    // grouped by (e.g. "backbone", "drug", "moa"). Blank = backend default.
    treatment_dimension_type:
        filters.treatment_dimension_type || "",
    biomarker_dimension_type:
        filters.biomarker_dimension_type || "",
    efficacyvssafety_x_axis:
        filters.efficacyvssafety_x_axis || "",
    efficacyvssafety_y_axis:
        filters.efficacyvssafety_y_axis || "",
});

/* ============================================================================
   MAPPER — treatment_dimension API response → chart section shape.

   API shape (per point in treatment_dimension.by_phase.chart.points):
     { x_axis, y_axis, category, sub_category, line_of_therapy[], stage[], country[] }
     - x_axis is EITHER a phase name ("Early Phase 1" | "Phase 1".."Phase 4"
       | "Not Specified") OR a year ("2025", "2026", ...).
     - y_axis is the trial/arm count for that (x_axis, category, sub_category) cell.

   Chart shape (consumed by FilteredPhaseBarSection):
     { defaultOption, byOption: { <optionName>: {
         totalArms, filters:[{name}], data:[{ name, phase1..4,
           lineOfTherapy[], stage[], country[], overTime:{ [year]: count } }] } } }
   ============================================================================ */

// API phase label -> chart phase column. "Early Phase 1" folds into phase1.
// Anything not in this map (e.g. "Not Specified") is dropped from the stack.
const PHASE_LABEL_TO_KEY = {
    "Early Phase 1": "phase1",
    "Phase 1": "phase1",
    "Phase 2": "phase2",
    "Phase 3": "phase3",
    "Phase 4": "phase4",
};

// A year x_axis looks like "2025" / "2026". Detect 4-digit strings.
const isYear = (x) => /^\d{4}$/.test(String(x).trim());

// Case/whitespace-insensitive name comparison. sub_category_map keys arrive
// lowercased from the API while point categories can be title-cased, so
// parent/child identity has to be compared on a normalised form.
const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();

// Merge attribute arrays (line_of_therapy / stage / country) uniquely.
const mergeUnique = (target, incoming = []) => {
    incoming.forEach((v) => {
        if (v != null && v !== "" && !target.includes(v)) target.push(v);
    });
    return target;
};

/**
 * Convert one treatment_dimension response into the section shape the
 * "Top Backbones" chart consumes. Groups the flat point list by `category`
 * (the bar rows), splitting phase-named points into phase1..4 columns and
 * year-named points into an `overTime` map.
 *
 * @param {object} treatmentDimension - response.treatment_dimension
 * @param {string} optionName - label shown in the panel's dropdown
 * @returns {{ defaultOption: string, byOption: object }} single-option section.
 */
export const mapTreatmentDimensionToSection = (
    treatmentDimension = {},
    optionName = "Treatment Strategy"
) => {
    const points =
        treatmentDimension?.by_phase?.chart?.points || [];
    const subCategoryMap =
        treatmentDimension?.by_phase?.metrics?.sub_category_map || {};

    // Group points by category -> a single bar row with phase columns.
    const rowsByCategory = {};

    points.forEach((p) => {
        const category = p.category;
        if (!category) return;

        if (!rowsByCategory[category]) {
            rowsByCategory[category] = {
                name: category,
                phase1: 0,
                phase2: 0,
                phase3: 0,
                phase4: 0,
                lineOfTherapy: [],
                stage: [],
                country: [],
                overTime: {}, // { "2025": count, ... } — real over-time series
            };
        }
        const row = rowsByCategory[category];
        const count = Number(p.y_axis) || 0;

        if (isYear(p.x_axis)) {
            // Over-time bucket (real data — replaces buildOverTimeData later).
            row.overTime[p.x_axis] =
                (row.overTime[p.x_axis] || 0) + count;
        } else {
            const phaseKey = PHASE_LABEL_TO_KEY[p.x_axis];
            // Unmapped phase labels ("Not Specified") are dropped from the stack.
            if (phaseKey) row[phaseKey] += count;
        }

        // Carry the row's attribute arrays for top-filter matching.
        mergeUnique(row.lineOfTherapy, p.line_of_therapy);
        mergeUnique(row.stage, p.stage);
        mergeUnique(row.country, p.country);
    });

    const data = Object.values(rowsByCategory);

    // Build child rows per parent by grouping the SAME points on sub_category.
    // A sub_category can belong to several parents (see sub_category_map), so a
    // child row under parent P is built from points where category === P AND
    // sub_category === that child. Shape matches what fetchChildren returns:
    //   childrenByParent[P] = { filters:[{name}], data:[{name, phase1..4, ...}] }
    const childrenByParent = {};
    Object.keys(subCategoryMap).forEach((parent) => {
        const subNames = subCategoryMap[parent] || [];

        // A parent whose only sub_category is itself (e.g. "hormonal":
        // ["hormonal"], "Inhalation (INH)": ["Inhalation (INH)"]) is not a real
        // hierarchy — expanding it would just repeat the parent's own name as a
        // single child row. Treat those as flat leaves: no caret, no child row.
        const meaningfulSubs = subNames.filter(
            (s) => norm(s) !== norm(parent)
        );
        if (meaningfulSubs.length === 0) return;

        const childRowsByName = {};

        points.forEach((p) => {
            if (p.category !== parent) return;
            const sub = p.sub_category;
            // Only genuine sub-categories become child rows. The self-named sub
            // ("adc" under parent "adc") is excluded via meaningfulSubs: the
            // parent's own row already carries that aggregate, so listing it
            // again produced a child visually identical to its parent.
            if (!sub || !meaningfulSubs.includes(sub)) return;

            if (!childRowsByName[sub]) {
                childRowsByName[sub] = {
                    // Unique key: a sub_category can share its name with the
                    // parent (e.g. parent "ADC" has child "ADC"), which would
                    // collide in the `checked` map and the chart's category
                    // axis. Namespace the identity, keep `label` for display.
                    name: `${parent} › ${sub}`,
                    label: sub,
                    phase1: 0,
                    phase2: 0,
                    phase3: 0,
                    phase4: 0,
                    lineOfTherapy: [],
                    stage: [],
                    country: [],
                    overTime: {},
                };
            }
            const crow = childRowsByName[sub];
            const ccount = Number(p.y_axis) || 0;
            if (isYear(p.x_axis)) {
                crow.overTime[p.x_axis] =
                    (crow.overTime[p.x_axis] || 0) + ccount;
            } else {
                const pk = PHASE_LABEL_TO_KEY[p.x_axis];
                if (pk) crow[pk] += ccount;
            }
            mergeUnique(crow.lineOfTherapy, p.line_of_therapy);
            mergeUnique(crow.stage, p.stage);
            mergeUnique(crow.country, p.country);
        });

        const childData = Object.values(childRowsByName);
        if (childData.length > 0) {
            childrenByParent[parent] = {
                filters: childData.map((c) => ({ name: c.name })),
                data: childData,
            };
        }
    });

    // A combination name can arrive BOTH as a sub_category under a parent and as
    // a top-level `category` of its own (e.g. "io + chemo" is a child of "chemo"
    // and also its own category). Listing it in both places is the duplicate the
    // user sees, so a name already owned as somebody's child is not repeated as a
    // root row. Parents themselves are never dropped — only nested-elsewhere names.
    const parentNames = new Set(Object.keys(childrenByParent).map(norm));
    const claimedAsChild = new Set();
    Object.keys(childrenByParent).forEach((parent) => {
        childrenByParent[parent].data.forEach((c) => {
            if (!parentNames.has(norm(c.label))) claimedAsChild.add(norm(c.label));
        });
    });

    // Filter tree = the categories (parents). Flag hasChildren only when we
    // actually built child rows for that parent, so the expand caret appears.
    const filters = data
        .filter((row) => !claimedAsChild.has(norm(row.name)))
        .map((row) =>
            childrenByParent[row.name]
                ? { name: row.name, hasChildren: true }
                : { name: row.name }
        );

    const totalArms = data.reduce(
        (sum, r) => sum + r.phase1 + r.phase2 + r.phase3 + r.phase4,
        0
    );

    return {
        defaultOption: optionName,
        byOption: {
            [optionName]: {
                totalArms,
                filters,
                data,
                subCategoryMap,
                // Pre-built children so the chart's lazy expand serves them
                // instantly without a second request.
                childrenByParent,
            },
        },
    };
};

/* ============================================================================
   MAPPER — efficacy_vs_safety_scatter API response → scatter row shape.

   API shape (per point in efficacy_vs_safety_scatter.by_phase.chart.points):
     { "x-axis" (ORR), "y-axis" (SAE), arm_id, treatment_strategy,
       line_of_therapy[], phase[], stage[], country[] }

   Scatter shape (consumed by EfficacyVsSafety):
     [{ name, orr, sae, n, strategy, biomarker, mode,
        lineOfTherapy[], stage[], country[] }]
   ============================================================================ */
export const mapEfficacyVsSafetyToScatter = (
    efficacyDimension = {}
) => {
    const points =
        efficacyDimension?.by_phase?.chart?.points || [];

    return points.map((p) => ({
        // arm_id is the unique identifier -> tooltip title.
        name: p.arm_id != null ? String(p.arm_id) : "—",
        orr: Number(p["x-axis"]) || 0,
        sae: Number(p["y-axis"]) || 0,
        // No bubble-size metric in the API yet; keep a constant so points render.
        n: 1,
        // COLOR_BY_CONFIG groups by these fields. treatment_strategy is always
        // present; biomarker/mode are added by the backend per point (fall back
        // to "Unknown" so grouping/legend still works if one is missing).
        strategy: p.treatment_strategy || "Unknown",
        biomarker: p.biomarker || "Unknown",
        mode: p.mode || "Unknown",
        // Attribute arrays for the top-filter bar matching.
        lineOfTherapy: Array.isArray(p.line_of_therapy) ? p.line_of_therapy : [],
        stage: Array.isArray(p.stage) ? p.stage : [],
        country: Array.isArray(p.country) ? p.country : [],
    }));
};

export const getTreatmentAnalytics = async ({
    comb_backbone,
    session_key,
    filters = {},
    graph = [],
    table = [],
    page,
    page_size,
}) => {
    const normalizedFilters =
        normalizeTreatmentAnalyticsFilters(filters);

    const payload = {
        graph,
        table,
        ...(hasNonEmptyFilterValues(normalizedFilters)
            ? { filters: normalizedFilters }
            : {}),
    };

    const { data } = await axiosInstance.post(
        "/analytics/treatment",
        payload,
        {
            params: {
                ...(comb_backbone && { comb_backbone }),
                ...(session_key && { session_key }),
                ...(page != null && { page }),
                ...(page_size != null && { page_size }),
            },
        }
    );

    return data;
};

export const getTreatmentShareableUrl = async ({
    top_session_key,
    filters = {},
    tab_name = "treatment",
}) => {
    const normalizedFilters =
        normalizeTreatmentAnalyticsFilters(filters);

    const treatmentFilters =
        pruneEmptyFilters(normalizedFilters);

    const payload =
        hasNonEmptyFilterValues(treatmentFilters)
            ? {
                  treatment_filters:
                      treatmentFilters,
              }
            : {};

    const { data } = await axiosInstance.post(
        "/analytics/shareable_url",
        payload,
        {
            params: {
                tab_name,
                ...(top_session_key && {
                    top_session_key,
                }),
            },
        }
    );

    return data;
};

export const downloadTableCSV = async ({
    tablename,
    session_key,
}) => {
    const normalizedTableName =
        normalizeDownloadTableName(tablename);

    const response = await axiosInstance.get(
        "/analytics/downloadcsv",
        {
            params: {
                tablename: normalizedTableName,
                ...(session_key && {
                    session_key,
                }),
            },
            responseType: "blob",
        }
    );

    return response.data;
};







export const useTreatmentAnalyticsQuery = ({
    comb_backbone,
    session_key,
    filters = {},
    graph = [],
    table = [],
    enabled = true,
}) => {
    return useQuery({
        queryKey: [
            "treatmentAnalytics",
            comb_backbone,
            session_key,
            JSON.stringify(filters),
            JSON.stringify(graph),
            JSON.stringify(table),
        ],

        queryFn: () =>
            getTreatmentAnalytics({
                comb_backbone,
                session_key,
                filters,
                graph,
                table,
            }),

        enabled,

        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,

        retry: 1,

        refetchOnWindowFocus: false,
        refetchOnReconnect: false,

        placeholderData: (prev) => prev,
    });
};