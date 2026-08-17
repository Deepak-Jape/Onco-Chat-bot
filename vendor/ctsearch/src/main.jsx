import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./public.css";
import { SnackbarProvider } from "./common/GlobalSnackbar";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

document.documentElement.lang = "en";
document.documentElement.setAttribute("lang", "en");
document.documentElement.setAttribute("xml:lang", "en");

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <SnackbarProvider>
      <App />
    </SnackbarProvider>
  </QueryClientProvider>
);