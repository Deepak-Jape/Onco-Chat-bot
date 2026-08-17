import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance, { baseURL } from "../api/AxiosInstance";
import axios from "axios";

// Async thunk to fetch cards
export const fetchCards = createAsyncThunk(
  "cards/fetchCards",
  async (
    { flag, groupedFilters = {}, page = 1, page_size = 20, session_key, sorting_method = "best_search" },
    thunkAPI,
  ) => {
    try {
      // Body data
      const payload = {
        flag,
        ...groupedFilters,
      };

      const response = await axios.post(
        `${baseURL}search/search_results`,
        payload,
        {
          // Axios automatically appends these to the URL: ?page=x&page_size=y&session_key=z
          params: {
            page,
            page_size,
            sorting_method,
            ...(session_key ? { session_key, id: session_key } : {}),
          },
          signal: thunkAPI.signal,
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        return thunkAPI.rejectWithValue("cancelled");
      }
      console.error("API call error:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  },
);

const cardsSlice = createSlice({
  name: "cards",
  initialState: {
    data: null,
    loading: false,
    error: null,
    sessionKey: null,
    activeFilters: {},
    lastRequest: null,
    latestRequestId: null,
    // Applied top_filters ({ include, exclude, applied_filters }) restored from a
    // shared analytics session (share_id). Only the analytics APIs return these,
    // so analytics tabs publish them here for the header to render as chips.
    sharedChipFilters: null,
    // The latest session key returned by an analytics API (Treatment/Feasibility/
    // Population). When one tab applies a filter it gets a NEW search: key; we
    // publish it here so sibling tabs use the same session instead of the stale
    // share_id from the URL.
    analyticsSessionKey: null,
  },
  reducers: {
    clearCards: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
      state.sessionKey = null;
      state.activeFilters = {};
      state.lastRequest = null;
      state.latestRequestId = null;
      state.sharedChipFilters = null;
      state.analyticsSessionKey = null;
    },
    setSharedChipFilters: (state, action) => {
      state.sharedChipFilters = action.payload || null;
    },
    setAnalyticsSessionKey: (state, action) => {
      state.analyticsSessionKey = action.payload || null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.latestRequestId = action.meta.requestId;
        state.lastRequest = action.meta.arg || null;
        state.activeFilters = action.meta.arg.groupedFilters || {};
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        // Ignore results from superseded requests
        if (action.meta.requestId !== state.latestRequestId) return;
        state.loading = false;
        state.data = action.payload;
        state.sessionKey = action.payload.session_key;

        if (action.payload.payload) {
          state.activeFilters = action.payload.payload;
        }
      })
      .addCase(fetchCards.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCards, setSharedChipFilters, setAnalyticsSessionKey } = cardsSlice.actions;
export default cardsSlice.reducer;
