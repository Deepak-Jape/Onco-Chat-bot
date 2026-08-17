export const ANALYTICS_TAB_TO_SLUG = {
  Population: "population",
  Treatment: "treatment",
  Feasibility: "feasibility",
};

export const ANALYTICS_SLUG_TO_TAB = Object.fromEntries(
  Object.entries(ANALYTICS_TAB_TO_SLUG).map(([tab, slug]) => [slug, tab]),
);

// export const SHARE_ID_QUERY_PARAM = "session_key";
export const SESSION_KEY_QUERY_PARAM = "session_key";

// The default/live search session the app boots with. Analytics tabs must never
// adopt or propagate this key over a shared session (share_id) — doing so
// refetches the whole unfiltered dataset.
export const DEFAULT_SEARCH_SESSION_SENTINEL = "RBNvo1WzZ4oRRq0W";
export const isDefaultSearchSession = (key = "") =>
  typeof key === "string" && key.includes(DEFAULT_SEARCH_SESSION_SENTINEL);

export const FILTERS_QUERY_PARAM = "filters";
const SESSION_FILTERS_STORAGE_KEY = "trialSessionFiltersByKey";
const LEGACY_SESSION_KEY_QUERY_PARAMS = ["session_key", "id"];
const ANALYTICS_SHARED_FILTER_KEYS = [
  "line_intent",
  "phases",
  "stage",
  "locations",
  "category",
  "sub_category",
  "regimen_complexity",
];

const decodeQueryParamValue = (value = "") => {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

const parseFiltersValue = (value = "") => {
  if (!value) return null;

  const candidates = [value, decodeQueryParamValue(value)].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

const hasNonEmptyFilterValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(Boolean);
  }

  return value !== null && value !== undefined && value !== "";
};

const normalizeFilterValueForCompare = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeFilterValueForCompare(item))
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((normalizedValue, key) => {
        normalizedValue[key] = normalizeFilterValueForCompare(value[key]);
        return normalizedValue;
      }, {});
  }

  return typeof value === "string" ? value.trim() : value;
};

const areFilterValuesEqual = (leftValue, rightValue) =>
  JSON.stringify(normalizeFilterValueForCompare(leftValue)) ===
  JSON.stringify(normalizeFilterValueForCompare(rightValue));

const readSessionFiltersStorage = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(SESSION_FILTERS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};

    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch (error) {
    return {};
  }
};

const writeSessionFiltersStorage = (filtersBySession = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SESSION_FILTERS_STORAGE_KEY,
      JSON.stringify(filtersBySession),
    );
  } catch (error) {
    console.error("error while setting the filters into localstorage", error);
    return;
  }
};

export const getFiltersFromSearchParams = (searchParams) => {
  if (!searchParams) return {};

  return parseFiltersValue(searchParams.get(FILTERS_QUERY_PARAM)) || {};
};

export const setFiltersSearchParam = (searchParams, filters = {}) => {
  const nextParams = new URLSearchParams(searchParams);
  const hasFilters = Object.values(filters || {}).some(hasNonEmptyFilterValue);

  if (hasFilters) {
    nextParams.set(FILTERS_QUERY_PARAM, JSON.stringify(filters));
  } else {
    nextParams.delete(FILTERS_QUERY_PARAM);
  }

  return nextParams;
};

export const getSharedSessionFallbackFilters = (
  appliedFilters = {},
  payloadFilters = {},
) =>
  Object.entries(appliedFilters || {}).reduce(
    (fallbackFilters, [key, value]) => {
      if (!hasNonEmptyFilterValue(value)) {
        return fallbackFilters;
      }

      if (areFilterValuesEqual(value, payloadFilters?.[key])) {
        return fallbackFilters;
      }

      fallbackFilters[key] = value;
      return fallbackFilters;
    },
    {},
  );

export const hasAnalyticsSharedFilters = (filters = {}) =>
  ANALYTICS_SHARED_FILTER_KEYS.some((key) => {
    const value = filters[key];

    if (Array.isArray(value)) {
      return value.some(
        (item) => item !== null && item !== undefined && item !== "",
      );
    }

    return value !== null && value !== undefined && value !== "";
  });

export const getAnalyticsTabFromPathname = (pathname = "") => {
  const slug = pathname.split("/").filter(Boolean).pop();
  return ANALYTICS_SLUG_TO_TAB[slug] || null;
};

export const getAnalyticsPath = (tab = "Population") => {
  const slug = ANALYTICS_TAB_TO_SLUG[tab] || ANALYTICS_TAB_TO_SLUG.Population;
  return `/trials/${slug}`;
};

export const getSessionKeyFromSearchParams = (searchParams) => {
  if (!searchParams) return "";
  const sessionKey = searchParams.get(SESSION_KEY_QUERY_PARAM);
  if (sessionKey) {
    return decodeQueryParamValue(sessionKey);
  }

  for (const legacyParam of LEGACY_SESSION_KEY_QUERY_PARAMS) {
    const legacyValue = searchParams.get(legacyParam);
    if (legacyValue) {
      return decodeQueryParamValue(legacyValue);
    }
  }

  const legacyFiltersValue = searchParams.get(FILTERS_QUERY_PARAM);
  if (legacyFiltersValue && !parseFiltersValue(legacyFiltersValue)) {
    return decodeQueryParamValue(legacyFiltersValue);
  }

  return "";
};

export const getStoredFiltersForSession = (sessionKey = "") => {
  if (!sessionKey) {
    return {};
  }

  const filtersBySession = readSessionFiltersStorage();
  const storedFilters = filtersBySession[sessionKey];

  return storedFilters && typeof storedFilters === "object" ? storedFilters : {};
};

export const setStoredFiltersForSession = (sessionKey = "", filters = {}) => {
  if (!sessionKey) {
    return;
  }

  const hasFilters = Object.values(filters || {}).some(hasNonEmptyFilterValue);

  const filtersBySession = readSessionFiltersStorage();

  if (!hasFilters) {
    delete filtersBySession[sessionKey];
    writeSessionFiltersStorage(filtersBySession);
    return;
  }

  // Overwrite instead of merge so removed filters do not reappear after reload.
  filtersBySession[sessionKey] = {
    ...filters,
  };

  writeSessionFiltersStorage(filtersBySession);
};

export const setSessionKeySearchParam = (searchParams, sessionKey) => {
  const nextParams = new URLSearchParams(searchParams);

  nextParams.delete("id");

  if (sessionKey) {
    nextParams.set(SESSION_KEY_QUERY_PARAM, sessionKey);
  } else {
    nextParams.delete(SESSION_KEY_QUERY_PARAM);
  }

  return nextParams;
};

export const getAnalyticsSharedFiltersFromSearchParams = (searchParams) =>
  ANALYTICS_SHARED_FILTER_KEYS.reduce(
    (filters, key) => {
      const values = searchParams.getAll(key).filter(Boolean);

      return {
        ...filters,
        [key]: values.length
          ? values
          : searchParams.get(key)
            ? [searchParams.get(key)]
            : [],
      };
    },
    {
      line_intent: [],
      phases: [],
      stage: [],
      locations: [],
      category: [],
      sub_category: [],
      regimen_complexity: [],
    },
  );

export const setAnalyticsSharedFiltersInSearchParams = (
  searchParams,
  filters = {},
) => {
  const nextParams = new URLSearchParams(searchParams);

  ANALYTICS_SHARED_FILTER_KEYS.forEach((key) => {
    const values = Array.isArray(filters[key])
      ? filters[key].filter(Boolean)
      : filters[key]
        ? [filters[key]]
        : [];

    nextParams.delete(key);

    if (values.length) {
      values.forEach((value) => {
        nextParams.append(key, value);
      });
    } else {
      nextParams.delete(key);
    }
  });

  return nextParams;
};
