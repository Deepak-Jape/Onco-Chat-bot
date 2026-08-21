import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FullViewContext, useFullViewRegistry } from "./fullViewContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const FONT = "'Rubik', sans-serif";
const INFO_700 = "#1c4d8e";
const INK = "rgba(17,24,39,1)";
const INK_60 = "rgba(17,24,39,0.6)";
const HAIRLINE = "rgba(17,24,39,0.08)";
const WHITE = "#ffffff";

const KEYFRAMES = `
@keyframes fvw-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes fvw-panel-in {
  from { opacity: 0; transform: translateY(8px) scale(0.985) }
  to   { opacity: 1; transform: translateY(0) scale(1) }
}
body.fvw-open .MuiTooltip-popper,
body.fvw-open .MuiPopper-root { z-index: 2000001 !important; }`;

/**
 * Wraps a Result-tab table with a heading row + a "Full view" toggle.
 *
 * When rendered inside a <FullViewProvider>, the full views of all sibling
 * tables form one carousel (arrows / dots / ←→ keys / swipe) — this component
 * just registers its content and asks the provider to open at its index.
 *
 * With no provider, it falls back to a standalone single-table modal.
 *
 *   <FullViewProvider>
 *     <FullViewWrapper title="Safety"><CommonTableCard ... hideTitle /></FullViewWrapper>
 *     <FullViewWrapper title="Adverse Events">...</FullViewWrapper>
 *   </FullViewProvider>
 */
export default function FullViewWrapper({ title, subtitle, children }) {
  const registry = useFullViewRegistry();
  const id = useId();

  // Register this table with the provider (if any) so the carousel can page to
  // it. `render` returns the same children; we re-register when they change.
  const orderRef = useRef(null);
  useEffect(() => {
    if (!registry) return undefined;
    if (orderRef.current == null) orderRef.current = registry.nextOrder();
    return registry.register({ id, title, order: orderRef.current, render: () => children });
  }, [registry, id, title, children]);

  const openTrigger = () => {
    if (registry) registry.open(id);
    else setStandaloneOpen(true);
  };

  // ---- Standalone fallback (no provider) ----
  const [standaloneOpen, setStandaloneOpen] = useState(false);
  useEffect(() => {
    if (!standaloneOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setStandaloneOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("fvw-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("fvw-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [standaloneOpen]);

  return (
    <>
      {/* Hover group: the quiet expand icon stays faint until the pointer is
          anywhere over this table's block, then it brightens. */}
      <Box
        className="fvw-group"
        sx={{
          "&:hover .fvw-expand": { opacity: 1 },
          "&:hover .fvw-expand-btn": {
            borderColor: "rgba(28,77,142,0.25)",
            bgcolor: "rgba(28,77,142,0.06)",
          },
        }}
      >
        {/* Heading row: title left, quiet expand icon right. */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "12px" }}>
          <Typography
            component="h2"
            sx={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, lineHeight: "28px", color: INK }}
          >
            {title}
          </Typography>

          <Tooltip title="Open full view" arrow placement="top">
            <ButtonBase
              className="fvw-expand-btn"
              onClick={openTrigger}
              aria-label="Open full view"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: "transparent",
                border: "1px solid transparent",
                color: INFO_700,
                transition: "background-color .15s ease, border-color .15s ease, opacity .15s ease",
                // Focus-visible keeps it reachable by keyboard even when faint.
                "&:focus-visible": {
                  opacity: 1,
                  borderColor: "rgba(28,77,142,0.35)",
                  bgcolor: "rgba(28,77,142,0.06)",
                },
              }}
            >
              <FullscreenIcon
                className="fvw-expand"
                sx={{ fontSize: 19, opacity: 0.32, transition: "opacity .15s ease" }}
              />
            </ButtonBase>
          </Tooltip>
        </Box>

        {/* Inline table. */}
        {children}
      </Box>

      {/* Standalone modal (only used when there is no FullViewProvider). */}
      {standaloneOpen &&
        createPortal(
          <>
            <style>{KEYFRAMES}</style>
            <Box
              role="dialog"
              aria-modal="true"
              aria-label={title}
              sx={{
                position: "fixed", inset: 0, zIndex: 2000000,
                bgcolor: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                p: { xs: "12px", md: "28px" }, animation: "fvw-backdrop-in .18s ease-out",
              }}
              onClick={() => setStandaloneOpen(false)}
            >
              <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                  width: "100%", height: "100%", maxWidth: "1680px",
                  display: "flex", flexDirection: "column", minHeight: 0,
                  bgcolor: WHITE, borderRadius: "14px", border: `1px solid ${HAIRLINE}`,
                  boxShadow: "0 24px 60px -12px rgba(15,23,42,0.35), 0 8px 24px -8px rgba(15,23,42,0.2)",
                  overflow: "hidden", animation: "fvw-panel-in .22s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "16px", px: "24px", py: "16px", borderBottom: `1px solid ${HAIRLINE}`,
                    background: "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 100%)",
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <Typography component="h2" sx={{ fontFamily: FONT, fontWeight: 700, fontSize: 19, lineHeight: "26px", color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {title}
                    </Typography>
                    {subtitle && (
                      <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, lineHeight: "18px", color: INK_60 }}>
                        {subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title="Close (Esc)" arrow placement="left">
                    <ButtonBase
                      onClick={() => setStandaloneOpen(false)}
                      aria-label="Close full view"
                      sx={{ flexShrink: 0, width: 34, height: 34, borderRadius: "8px", color: INK_60, transition: "background-color .15s ease, color .15s ease", "&:hover": { bgcolor: "rgba(17,24,39,0.06)", color: INK } }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 20 }} />
                    </ButtonBase>
                  </Tooltip>
                </Box>

                <Box
                  sx={{
                    flex: 1, minHeight: 0, p: "16px 20px 20px",
                    "& > *": { height: "100%", minHeight: 0, border: "none !important", boxShadow: "none !important", borderRadius: "0 !important" },
                    "& div:has(.custom-scroll)": { height: "100% !important", maxHeight: "none !important" },
                    "& .custom-scroll": { height: "100% !important", maxHeight: "none !important" },
                    "& .custom-scrollbar-track": { width: "10px !important" },
                    "& .custom-scrollbar-thumb": { borderRadius: "6px" },
                  }}
                >
                  <FullViewContext.Provider value={true}>{children}</FullViewContext.Provider>
                </Box>
              </Box>
            </Box>
          </>,
          document.body
        )}
    </>
  );
}
