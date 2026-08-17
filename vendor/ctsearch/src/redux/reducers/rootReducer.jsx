import { combineReducers } from "redux";
import conditionReducer from "./searchReducer";
import trialsReducer from "../trialsSlice";
import cardsReducer from "../trialsDataSlice";
import accountReducer from "../accountSlice";

const rootReducer = combineReducers({
  conditionData: conditionReducer,
  trials: trialsReducer,
  cards: cardsReducer,
  account: accountReducer,
});

export default rootReducer;
