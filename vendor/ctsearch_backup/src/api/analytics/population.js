import axios from "axios";

const normalizeFilterArray = (value) => {
    if (Array.isArray(value)) {
        return value.filter(
            (item) => item !== null && item !== undefined && item !== ""
        );
    }

    if (value === null || value === undefined || value === "") {
        return [];
    }

    return [value];
};

const hasNonEmptyFilterValues = (filters = {}) =>
    Object.values(filters || {}).some((value) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return value !== null && value !== undefined && value !== "";
    });

const pruneEmptyFilters = (filters = {}) =>
    Object.entries(filters || {}).reduce((prunedFilters, [key, value]) => {
        if (Array.isArray(value)) {
            if (value.length > 0) {
                prunedFilters[key] = value;
            }

            return prunedFilters;
        }

        if (value !== null && value !== undefined && value !== "") {
            prunedFilters[key] = value;
        }

        return prunedFilters;
    }, {});

export const normalizePopulationAnalyticsFilters = (filters = {}) => ({
    ...filters,
    country: normalizeFilterArray(filters.country),
    organ: normalizeFilterArray(filters.organ),
    histology: normalizeFilterArray(filters.histology),
    biomarkers: normalizeFilterArray(filters.biomarkers),
    stage: normalizeFilterArray(filters.stage),
    line_intent: normalizeFilterArray(filters.line_intent),
});

/**
 * Population Analytics API Integration
 * @param {Array} graph - Array of graph types (e.g., ["new_cancer_cases"])
 * @param {Object} filters - Dynamic filters (country, organ, histology, etc.)
 * @param {string} country_name - Country name parameter
 * @param {string} session_key - Optional analytics session key for restoring shared URLs
 */
export const getPopulationAnalytics = async ({
    graph = ["new_cancer_cases_flow"],
    filters = {},
    country_name,
    session_key,
} = {}) => {
    try {
        const normalizedFilters = normalizePopulationAnalyticsFilters(filters);
        const requestBody = { graph };

requestBody.filters = normalizedFilters;

        // Add country_name to the request body if provided
        if (country_name) {
            requestBody.country_name = country_name;
        }

        const response = await axios.post(
            "https://oncosuite.com/analytics/population",
            requestBody,
            {
                params: {
                    ...(session_key ? { session_key } : {}),
                },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Population Analytics API Error:", error);
        throw error;
    }
};

export const getPopulationShareableUrl = async ({
    top_session_key,
    filters = {},
    tab_name = "population",
} = {}) => {
    try {
        const normalizedFilters = normalizePopulationAnalyticsFilters(filters);
        const populationFilters = pruneEmptyFilters(normalizedFilters);
        const requestBody = hasNonEmptyFilterValues(populationFilters)
            ? { population_filters: populationFilters }
            : {};

        const response = await axios.post(
            "https://oncosuite.com/analytics/shareable_url",
            requestBody,
            {
                params: {
                    tab_name,
                    ...(top_session_key ? { top_session_key } : {}),
                },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Population Shareable URL API Error:", error);
        throw error;
    }
};
