import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_PREFIX = "scrollRestore:";

function storageKey(pathname) {
  return `${STORAGE_PREFIX}${pathname}`;
}

function readSavedScroll(pathname) {
  try {
    const key = storageKey(pathname);
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    const value = Number(raw);
    return raw && Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/**
 * Save-only half of the scroll-restoration pair, for shared components (e.g.
 * page headers) that trigger the navigation but do not own the page markup.
 *
 * Use this rather than useScrollRestoration() in such components: the full hook
 * consumes the stored offset on mount, so if both a header and its host page
 * called it, whichever mounted first would swallow the value and the page would
 * have nothing left to restore.
 */
export function useSaveScrollBeforeNavigate() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (to) => {
      try {
        sessionStorage.setItem(
          storageKey(pathname),
          String(window.scrollY || window.pageYOffset || 0),
        );
      } catch {
        /* sessionStorage unavailable */
      }
      navigate(to);
    },
    [navigate, pathname],
  );
}

/**
 * Preserves the scroll position of a long landing page across a round trip to
 * another route (e.g. /book-demo), so returning lands on the section the user
 * left from instead of the top of the page. Call this from the component that
 * owns the page markup, so it can apply `hiddenWhileRestoring`.
 *
 * Returns:
 *  - navigateWithScrollSaved(to): saves the current offset, then navigates.
 *  - isRestoring: true until the saved offset has been re-applied. Use it to
 *    hide the page (`visibility: hidden`) so the jump is never painted.
 *  - shouldMountEagerly: true during a restore. Pages that defer sections via
 *    IntersectionObserver must mount them all when this is set, otherwise the
 *    document is too short for the saved offset to be reachable.
 */
export default function useScrollRestoration() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Read during the initial render so the offset is known before first paint.
  const targetRef = useRef(null);
  if (targetRef.current === null) {
    targetRef.current = readSavedScroll(pathname);
  }
  const target = targetRef.current;

  const [isRestoring, setIsRestoring] = useState(target > 0);

  const navigateWithScrollSaved = useCallback(
    (to) => {
      try {
        sessionStorage.setItem(
          storageKey(pathname),
          String(window.scrollY || window.pageYOffset || 0),
        );
      } catch {
        /* sessionStorage unavailable */
      }
      navigate(to);
    },
    [navigate, pathname],
  );

  useLayoutEffect(() => {
    if (!isRestoring) return undefined;

    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, target);

    // Lazy chunks can resolve after the first frame and change the page
    // height, so keep re-applying until the offset sticks.
    let frame = 0;
    let attempts = 0;
    const settle = () => {
      window.scrollTo(0, target);
      attempts += 1;
      const reached =
        Math.abs((window.scrollY || window.pageYOffset || 0) - target) < 2;
      if (reached || attempts > 20) {
        document.documentElement.style.scrollBehavior = previousBehavior;
        setIsRestoring(false);
        return;
      }
      frame = window.requestAnimationFrame(settle);
    };
    frame = window.requestAnimationFrame(settle);

    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.style.scrollBehavior = previousBehavior;
    };
  }, [isRestoring, target]);

  return {
    navigateWithScrollSaved,
    isRestoring,
    shouldMountEagerly: target > 0,
    hiddenWhileRestoring: isRestoring ? { visibility: "hidden" } : undefined,
  };
}
