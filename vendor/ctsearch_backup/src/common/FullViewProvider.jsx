import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { FullViewContext, FullViewRegistry } from "./fullViewContext";

const FONT = "'Rubik', sans-serif";
const INK = "rgba(17,24,39,1)";
const INK_60 = "rgba(17,24,39,0.6)";
const INK_40 = "rgba(17,24,39,0.4)";
const HAIRLINE = "rgba(17,24,39,0.08)";
const INFO_700 = "#1c4d8e";
const WHITE = "#ffffff";

const KEYFRAMES = `
@keyframes fvw-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes fvw-panel-in {
  from { opacity: 0; transform: translateY(8px) scale(0.985) }
  to   { opacity: 1; transform: translateY(0) scale(1) }
}
@keyframes fvw-slide-l { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: translateX(0) } }
@keyframes fvw-slide-r { from { opacity: 0; transform: translateX(-24px) } to { opacity: 1; transform: translateX(0) } }
body.fvw-open .MuiTooltip-popper,
body.fvw-open .MuiPopper-root { z-index: 2000001 !important; }`;

/**
 * Wrap a set of FullViewWrapper tables in ONE provider so their full views form
 * a single carousel: opening any table's "Full view" launches a shared modal
 * that pages through every registered table (arrows, dots, ←/→ keys, swipe).
 *
 *   <FullViewProvider>
 *     <FullViewWrapper title="Safety">...</FullViewWrapper>
 *     <FullViewWrapper title="Adverse Events">...</FullViewWrapper>
 *   </FullViewProvider>
 */
export default function FullViewProvider({ children }) {
  // Ordered list of registered tables. We keep them in a ref-backed state so
  // registration order (DOM order) is stable across renders.
  const [items, setItems] = useState([]); // [{ id, title, render }]
  const [activeId, setActiveId] = useState(null); // open table id (null = closed)
  const [dir, setDir] = useState(0); // -1 back, +1 forward, 0 none (for slide anim)
  const seq = useRef(0);

  const register = useCallback((entry) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== entry.id);
      next.push(entry);
      // Sort by the DOM order captured at registration (`order`).
      next.sort((a, b) => a.order - b.order);
      return next;
    });
    return () => setItems((prev) => prev.filter((i) => i.id !== entry.id));
  }, []);

  const nextOrder = useCallback(() => (seq.current += 1), []);
  const open = useCallback((id) => {
    setDir(0);
    setActiveId(id);
  }, []);
  const close = useCallback(() => setActiveId(null), []);

  const ctx = useMemo(
    () => ({ register, nextOrder, open }),
    [register, nextOrder, open]
  );

  const activeIndex = items.findIndex((i) => i.id === activeId);
  const isOpen = activeIndex >= 0;

  const go = useCallback(
    (delta) => {
      setItems((cur) => {
        const idx = cur.findIndex((i) => i.id === activeId);
        if (idx < 0) return cur;
        const nextIdx = Math.min(Math.max(idx + delta, 0), cur.length - 1);
        if (nextIdx !== idx) {
          setDir(delta);
          setActiveId(cur[nextIdx].id);
        }
        return cur;
      });
    },
    [activeId]
  );

  const panelRef = useRef(null);

  // Escape to close, arrows to navigate, lock background scroll, and manage
  // focus (move into the dialog on open, restore to the trigger on close) —
  // the accessibility standard for a modal dialog.
  useEffect(() => {
    if (!isOpen) return undefined;
    // Find the active table's vertical scroll element (if any).
    const getScroller = () => panelRef.current?.querySelector(".custom-scroll");
    const canScroll = (el) => el && el.scrollHeight > el.clientHeight + 1;

    // All focusable elements inside the modal, in DOM order — for the focus trap.
    const FOCUSABLE =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => {
      const root = panelRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
      );
    };

    const onKey = (e) => {
      // Focus trap: keep Tab / Shift+Tab cycling within the dialog so focus can
      // never reach the page hidden behind the overlay (WCAG dialog pattern).
      if (e.key === "Tab") {
        const items = getFocusable();
        if (items.length === 0) {
          e.preventDefault();
          panelRef.current?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const activeEl = document.activeElement;
        const inside = panelRef.current?.contains(activeEl);
        if (e.shiftKey) {
          if (!inside || activeEl === first || activeEl === panelRef.current) {
            e.preventDefault();
            last.focus();
          }
        } else if (!inside || activeEl === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      // Don't hijack keys while typing in a field inside the table.
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowRight") { go(1); return; }
      if (e.key === "ArrowLeft") { go(-1); return; }

      // Up/Down/PageUp/PageDown/Home/End scroll the table vertically.
      const el = getScroller();
      if (!canScroll(el)) return;
      const page = el.clientHeight * 0.9;
      const step =
        e.key === "ArrowDown" ? 60
        : e.key === "ArrowUp" ? -60
        : e.key === "PageDown" ? page
        : e.key === "PageUp" ? -page
        : null;
      if (step != null) {
        e.preventDefault();
        el.scrollBy({ top: step, behavior: "auto" });
      } else if (e.key === "Home") {
        e.preventDefault();
        el.scrollTo({ top: 0 });
      } else if (e.key === "End") {
        e.preventDefault();
        el.scrollTo({ top: el.scrollHeight });
      }
    };
    const prevActive = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("fvw-open");
    window.addEventListener("keydown", onKey);
    // Focus the panel so keyboard users are inside the dialog immediately.
    const raf = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("fvw-open");
      window.removeEventListener("keydown", onKey);
      if (prevActive && typeof prevActive.focus === "function") prevActive.focus();
    };
  }, [isOpen, close, go]);

  // Touch swipe.
  const touch = useRef(null);
  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    // Horizontal swipe that clearly beats vertical movement.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1);
    }
    touch.current = null;
  };

  const active = isOpen ? items[activeIndex] : null;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < items.length - 1;
  // Names of the tables the arrows would navigate to (shown on hover).
  const prevTitle = hasPrev ? items[activeIndex - 1].title : "";
  const nextTitle = hasNext ? items[activeIndex + 1].title : "";

  const navBtnSx = (enabled) => ({
    width: 44,
    height: 44,
    borderRadius: "50%",
    flexShrink: 0,
    color: enabled ? INFO_700 : INK_40,
    // Always fully opaque so the button never blends into whatever (e.g. the
    // dark app sidebar) shows through the scrim behind it.
    bgcolor: WHITE,
    border: `1px solid rgba(17,24,39,0.12)`,
    boxShadow: enabled
      ? "0 6px 16px -4px rgba(15,23,42,0.35), 0 2px 6px -2px rgba(15,23,42,0.25)"
      : "0 2px 6px -2px rgba(15,23,42,0.2)",
    opacity: enabled ? 1 : 0.55,
    pointerEvents: enabled ? "auto" : "none",
    transition: "background-color .15s ease, box-shadow .15s ease, transform .1s ease",
    // Solid (opaque) tint on hover — no transparency, so nothing shows through.
    "&:hover": {
      bgcolor: "#eef3fb",
      boxShadow: "0 8px 20px -4px rgba(15,23,42,0.4), 0 3px 8px -2px rgba(15,23,42,0.28)",
    },
    "&:active": { transform: "scale(0.94)" },
  });

  return (
    <FullViewRegistry.Provider value={ctx}>
      {children}

      {isOpen &&
        createPortal(
          <>
            <style>{KEYFRAMES}</style>
            <Box
              role="dialog"
              aria-modal="true"
              aria-label={active?.title}
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: 2000000,
                bgcolor: "rgba(15,23,42,0.55)",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: "12px", md: "28px" },
                animation: "fvw-backdrop-in .18s ease-out",
              }}
              onClick={close}
            >
              {/* Left arrow — sits just outside the panel and stays glued to it
                  at any viewport width (part of the centered flex row). */}
              {items.length > 1 && (
                <Tooltip title={hasPrev ? prevTitle : "No previous table"} arrow placement="right">
                  <ButtonBase
                    onClick={(e) => { e.stopPropagation(); go(-1); }}
                    aria-label={hasPrev ? `Previous: ${prevTitle}` : "Previous table"}
                    sx={{ ...navBtnSx(hasPrev), mr: { xs: "8px", md: "16px" } }}
                  >
                    <ChevronLeftRoundedIcon />
                  </ButtonBase>
                </Tooltip>
              )}

              {/* Panel */}
              <Box
                ref={panelRef}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                sx={{
                  flex: 1,
                  height: "100%",
                  maxWidth: "1680px",
                  outline: "none",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  bgcolor: WHITE,
                  borderRadius: "14px",
                  border: `1px solid ${HAIRLINE}`,
                  boxShadow: "0 24px 60px -12px rgba(15,23,42,0.35), 0 8px 24px -8px rgba(15,23,42,0.2)",
                  overflow: "hidden",
                  animation: "fvw-panel-in .22s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    px: "24px",
                    py: "16px",
                    borderBottom: `1px solid ${HAIRLINE}`,
                    background: "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 100%)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: "12px", minWidth: 0 }}>
                    <Typography
                      component="h2"
                      sx={{
                        fontFamily: FONT, fontWeight: 700, fontSize: 19, lineHeight: "26px", color: INK,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {active?.title}
                    </Typography>
                    {items.length > 1 && (
                      <Typography sx={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: INK_40, flexShrink: 0 }}>
                        {activeIndex + 1} / {items.length}
                      </Typography>
                    )}
                  </Box>

                  <Tooltip title="Close (Esc)" arrow placement="left">
                    <ButtonBase
                      onClick={close}
                      aria-label="Close full view"
                      sx={{
                        flexShrink: 0, width: 34, height: 34, borderRadius: "8px", color: INK_60,
                        transition: "background-color .15s ease, color .15s ease",
                        "&:hover": { bgcolor: "rgba(17,24,39,0.06)", color: INK },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 20 }} />
                    </ButtonBase>
                  </Tooltip>
                </Box>

                {/* Body — keyed so switching tables replays the slide animation. */}
                <Box
                  key={active?.id}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    p: "16px 20px 12px",
                    animation: `${dir < 0 ? "fvw-slide-r" : dir > 0 ? "fvw-slide-l" : "fvw-panel-in"} .22s cubic-bezier(0.16,1,0.3,1)`,
                    "& > *": {
                      height: "100%", minHeight: 0,
                      border: "none !important", boxShadow: "none !important", borderRadius: "0 !important",
                    },
                    "& div:has(.custom-scroll)": { height: "100% !important", maxHeight: "none !important" },
                    "& .custom-scroll": { height: "100% !important", maxHeight: "none !important" },
                    "& .custom-scrollbar-track": { width: "10px !important" },
                    "& .custom-scrollbar-thumb": { borderRadius: "6px" },
                  }}
                >
                  <FullViewContext.Provider value={true}>
                    {active?.render()}
                  </FullViewContext.Provider>
                </Box>

                {/* Dot indicators */}
                {items.length > 1 && (
                  <Box
                    sx={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      py: "12px",
                      borderTop: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    {items.map((it, i) => {
                      const isActive = i === activeIndex;
                      return (
                        <Tooltip key={it.id} title={it.title} arrow placement="top">
                          <ButtonBase
                            onClick={() => { setDir(i > activeIndex ? 1 : -1); setActiveId(it.id); }}
                            aria-label={`Go to ${it.title}`}
                            sx={{
                              height: 8,
                              width: isActive ? 22 : 8,
                              borderRadius: 999,
                              bgcolor: isActive ? INFO_700 : "rgba(17,24,39,0.18)",
                              transition: "width .2s ease, background-color .2s ease",
                              "&:hover": { bgcolor: isActive ? INFO_700 : "rgba(17,24,39,0.32)" },
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Right arrow */}
              {items.length > 1 && (
                <Tooltip title={hasNext ? nextTitle : "No next table"} arrow placement="left">
                  <ButtonBase
                    onClick={(e) => { e.stopPropagation(); go(1); }}
                    aria-label={hasNext ? `Next: ${nextTitle}` : "Next table"}
                    sx={{ ...navBtnSx(hasNext), ml: { xs: "8px", md: "16px" } }}
                  >
                    <ChevronRightRoundedIcon />
                  </ButtonBase>
                </Tooltip>
              )}
            </Box>
          </>,
          document.body
        )}
    </FullViewRegistry.Provider>
  );
}
