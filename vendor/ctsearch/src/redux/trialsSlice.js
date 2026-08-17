import { createSlice } from "@reduxjs/toolkit";

const trialSlice = createSlice({
  name: "filter", // name doesn't matter for reducer key
  initialState: {
    filterData: [],
    isAlertActive: false,
  },
  reducers: {
    setFilterData: (state, action) => {
      state.filterData = action.payload;
    },
    toggleAlert: (state, action) => {
      state.isAlertActive = action.payload;
    },
  },
});

export const { setFilterData, toggleAlert } = trialSlice.actions;
export default trialSlice.reducer;
