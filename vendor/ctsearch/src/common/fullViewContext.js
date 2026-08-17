import { createContext, useContext } from "react";

// True for tables rendered inside the FullViewWrapper overlay. Consumed by
// CommonTableCard so it can show all rows (and drop the "Show all" toggle)
// when the table is expanded to full screen.
export const FullViewContext = createContext(false);
export const useIsFullView = () => useContext(FullViewContext);

// Registry shared by all FullViewWrapper instances inside one FullViewProvider.
// Each wrapper registers its { id, title, render } so the shared modal can page
// through every table on the tab (carousel). `null` means no provider is
// mounted — the wrapper then falls back to its own standalone modal.
export const FullViewRegistry = createContext(null);
export const useFullViewRegistry = () => useContext(FullViewRegistry);
