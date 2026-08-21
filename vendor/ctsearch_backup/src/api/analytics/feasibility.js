import axios from "axios";
import { baseURL } from "../AxiosInstance";

const normalizeDownloadTableName = (tablename) => {
  if (Array.isArray(tablename)) {
    return tablename[0] || "";
  }

  return tablename || "";
};

const normalizeFilterArray = (value) => {
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

export const normalizeFeasibilityAnalyticsFilters = (filters = {}) => ({
  ...filters,
  line_intent: normalizeFilterArray(filters.line_intent),
  stage: normalizeFilterArray(filters.stage),
  phases: normalizeFilterArray(filters.phases),
  locations: normalizeFilterArray(filters.locations),
  counties: normalizeFilterArray(filters.counties),
  ammendments: normalizeFilterArray(filters.ammendments),
});

export const getFeasibilityAnalytics = async ({
  comb_backbone,
  session_key,
  filters = {},
  graph = [],
  table = [],
  page,
  page_size,
}) => {
  try {
    const normalizedFilters = normalizeFeasibilityAnalyticsFilters(filters);
    const requestBody = {
      graph,
      table,
    };

    if (hasNonEmptyFilterValues(normalizedFilters)) {
      requestBody.filters = normalizedFilters;
    }

    const response = await axios.post(
      `${baseURL}analytics/feasibility`,
      requestBody,
      {
        params: {
          ...(comb_backbone ? { comb_backbone } : {}),
          ...(session_key ? { session_key } : {}),
          ...(page != null ? { page } : {}),
          ...(page_size != null ? { page_size } : {}),
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Feasibility Analytics API Error:", error);
    throw error;
  }
};

export const getFeasibilityShareableUrl = async ({
  top_session_key,
  filters = {},
  tab_name = "feasibility",
}) => {
  try {
    const normalizedFilters = normalizeFeasibilityAnalyticsFilters(filters);
    const feasibilityFilters = pruneEmptyFilters(normalizedFilters);
    const requestBody = hasNonEmptyFilterValues(feasibilityFilters)
      ? { feasibility_filters: feasibilityFilters }
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
      },
    );

    return response.data;
  } catch (error) {
    console.error("Feasibility Shareable URL API Error:", error);
    throw error;
  }
};

// export const downloadTableCSV = async ({ tablename, session_key }) => {
//     try {
//         const response = await axios.get(
//             `https://204.168.157.213.sslip.io/analytics/downloadcsv?tablename=${tablename}&session_key=${session_key}`

//         );

//         return response.data;
//     } catch (error) {
//         console.error("Download CSV API Error:", error);
//         throw error;
//     }
// };

export const downloadTableCSV = async ({ tablename, session_key }) => {
  try {
    const normalizedTableName = normalizeDownloadTableName(tablename);

    const response = await axios.get(
      "https://oncosuite.com/analytics/downloadcsv",
      {
        params: {
          tablename: normalizedTableName,
          ...(session_key ? { session_key } : {}),
        },
        responseType: "blob",
      },
    );

    return response.data;
  } catch (error) {
    console.error("Download CSV API Error:", error);
    throw error;
  }
};

// import axiosInstance from "../AxiosInstance";

// export const getTreatmentAnalytics = async ({
//     comb_backbone,
//     session_key,
//     graph = [],
//     table = [],
// }) => {
//     const response = await axiosInstance.post(
//         `/analytics/treatment`,
//         {
//             graph,
//             table,
//         },
//         {
//             params: {
//                 comb_backbone,
//                 session_key,
//             },
//         }
//     );

//     return response.data;
// };
