import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import ctStore from "@ct/redux/store/store";
import App from "./App.jsx";
import "./index.css";

// ctsearch's ExecuiteSummaryDrawer reads state.trials.isAlertActive, so the
// whole app runs inside ctsearch's own redux store -- that keeps the component
// unmodified rather than forking it to drop the redux dependency.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={ctStore}>
      <App />
    </Provider>
  </StrictMode>,
);
