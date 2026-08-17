import { useState } from "react";
import { Paper, Box, Popover } from "@mui/material";
import EvidenceTraceCard from "../../../common/EvidenceTraceCard";
import { useSelector } from "react-redux";

const PLACEHOLDER_VALUES = new Set([
  "no reasoning provided.",
  "no reasoning provided for this metric.",
  "no direct source text available.",
  "not available",
  "n/a",
  "na",
  "-",
]);

const meaningful = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  if (!text) return false;
  return !PLACEHOLDER_VALUES.has(text.toLowerCase());
};

const hasTraceabilityData = (evidence) => {
  if (!evidence) return false;
  return (
    meaningful(evidence.highlight) ||
    meaningful(evidence.reasoning) ||
    meaningful(evidence.source) ||
    meaningful(evidence.source_link) ||
    (meaningful(evidence.confidence) && Number(evidence.confidence) > 0)
  );
};

const EvidenceHoverHeader = ({ label, evidence, evidenceList, className, containerSx }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const isAlertActive = useSelector((state) => state.trials.isAlertActive);
  const open = Boolean(anchorEl);
  // When a list is supplied, base the "has evidence" check on any record in it.
  const list = Array.isArray(evidenceList) ? evidenceList.filter(Boolean) : null;
  const hasEvidence =
    list && list.length > 0
      ? list.some(hasTraceabilityData)
      : hasTraceabilityData(evidence);

  const handleMouseEnter = (event) => {
    if (!isAlertActive || !hasEvidence) return;
    setAnchorEl(event.currentTarget);
  };
  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      onMouseLeave={handleMouseLeave}
      sx={{
        display: "block",
        width: "100%",
        minWidth: 0,
      }}
    >
      <Box
        component="div"
        onMouseEnter={handleMouseEnter}
        sx={{
          cursor: "default",
          display: "block",
          width: "100%",
          minWidth: 0,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          ...containerSx,
        }}
        className={className}
      >
        {label}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        // --- POSITIONING LOGIC ---
        anchorOrigin={{
          vertical: "center", // Align to the middle of the text height
          horizontal: "left", // Attach to the right side of the text
        }}
        transformOrigin={{
          vertical: "center", // Align the middle of the popup
          horizontal: "right", // To the start of the popup
        }}
        // --------------------------
        slotProps={{
          paper: {
            onMouseEnter: () => setAnchorEl(anchorEl),
            onMouseLeave: () => setAnchorEl(null),
            sx: {
              borderRadius: "6px",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
              width: "min(464px, calc(100vw - 32px))",
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              marginRight: "8px", 
            },
          },
        }}
        marginThreshold={16}
        sx={{ pointerEvents: "none" }}
      >
        <Box sx={{ pointerEvents: "auto" }}>
          {list && list.length > 0 ? (
            <EvidenceTraceCard list={list} />
          ) : (
            <EvidenceTraceCard data={evidence} />
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default EvidenceHoverHeader;
