import { useRef, useEffect } from "react";

export function useDebouncedSearch(value, callback, delay = 400) {
  const didMount = useRef(false);

  useEffect(() => {
    // ⛔ Do NOT run search on initial mount
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    // ⛔ If value is empty → do NOT call API
    if (value === "" || value === undefined || value === null) return;

    const timer = setTimeout(() => {
      callback();
    }, delay);

    return () => clearTimeout(timer);
  }, [value]);
}
