import { createSlice } from "@reduxjs/toolkit";

const accountSlice = createSlice({
    name: "account",
    initialState: {
        accountDetails: null,
    },
    reducers: {
        setAccountDetails: (state, action) => {
            state.accountDetails = action.payload;
        },
        clearAccountDetails: (state) => {
            state.accountDetails = null;
        },
    },
});

export const { setAccountDetails, clearAccountDetails } = accountSlice.actions;

export default accountSlice.reducer;
