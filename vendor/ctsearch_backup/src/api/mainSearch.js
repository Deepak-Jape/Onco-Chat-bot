import axiosInstance from "./AxiosInstance";

export const searchClinicalTrials = async (
  searchTerm = "",
  flag = "main_filter",
  groupedFilters = {}
) => {
  const normalizedSearchTerm =
    typeof searchTerm === "string" ? searchTerm.trim() : "";
  const payload = {
    flag: flag,
    filters: {
      ...groupedFilters,
    },
  };

  const queryString = normalizedSearchTerm
    ? `?${new URLSearchParams({ search_term: normalizedSearchTerm }).toString()}`
    : "";

  try {
    const response = await fetch(
      `https://oncosuite.com/search/autocomplete_suggestions${queryString}`,
      // `http://204.168.157.213/search/autocomplete_suggestions${queryString}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call error:", error.response?.data || error.message);
    return {};
  }
};
export const getCardsData = async (
  flag = "main_filter",
  groupedFilters = {}
) => {
  const payload = {
    flag: flag,
    // filters: {
    ...groupedFilters,
    // },
  };
  try {
    const response = await axiosInstance.post("/search_results", payload);
    return response.data;
  } catch (error) {
    console.error("API call error:", error.response?.data || error.message);
    return null;
  }
};

export const createSearchSession = async ({
  flag,
  groupedFilters = {},
  page = 1,
  page_size = 20,
  session_key,
} = {}) => {
  const payload = {
    ...(flag ? { flag } : {}),
    ...groupedFilters,
  };

  try {
    const response = await axiosInstance.post("/search_results", payload, {
      params: {
        page,
        page_size,
        ...(session_key ? { session_key } : {}),
      },
    });

    return response.data;
  } catch (error) {
    console.error("Search session API error:", error.response?.data || error.message);
    throw error;
  }
};
