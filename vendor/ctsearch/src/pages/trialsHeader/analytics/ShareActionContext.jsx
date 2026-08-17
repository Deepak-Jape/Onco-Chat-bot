import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ShareActionContext = createContext(null);

export function ShareActionProvider({ children }) {
  const [shareAction, setShareActionState] = useState(null);

  const setShareAction = useCallback((nextAction) => {
    setShareActionState(nextAction);
  }, []);

  const clearShareAction = useCallback((ownerId) => {
    setShareActionState((prev) => {
      if (!ownerId) return null;
      if (!prev) return null;
      return prev.ownerId === ownerId ? null : prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      shareAction,
      setShareAction,
      clearShareAction,
    }),
    [shareAction, setShareAction, clearShareAction],
  );

  return (
    <ShareActionContext.Provider value={value}>
      {children}
    </ShareActionContext.Provider>
  );
}

export function useShareAction() {
  const ctx = useContext(ShareActionContext);
  if (!ctx) {
    throw new Error("useShareAction must be used within a ShareActionProvider");
  }
  return ctx;
}
