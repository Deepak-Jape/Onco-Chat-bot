import { useState, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import ButtonBase from "@mui/material/ButtonBase";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomScrollbar from "../../../common/CustomScrollbar";

// ---- design tokens taken directly from the Figma file ----
const COLOR = {
  black800: "rgba(0,0,0,0.8)",
  black600: "rgba(0,0,0,0.6)",
  black50: "rgba(0,0,0,0.05)",
  headerBg: "#f9f9fb",
  info700: "#1c4d8e",
  white: "#ffffff",
};

const FONT = "'Rubik', sans-serif";

const DASH = "-";
const show = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? DASH : s;
};

// Horizontal row divider, inset 12px from the left and right card edges.
// Drawn as a ::before line so it doesn't affect the grid column layout.
const INSET_DIVIDER = {
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "12px",
    right: "12px",
    height: "1px",
    bgcolor: COLOR.black50,
  },
};

function InfoIcon() {
  return <InfoOutlinedIcon sx={{ fontSize: 14, color: "rgba(0,0,0,0.35)" }} />;
}

// Info icon that reveals `tooltip` text on hover. Falls back to a plain icon
// when no tooltip is supplied.
function InfoIconWithTip({ tooltip }) {
  if (!tooltip) return <InfoIcon />;
  return (
    <Tooltip
      title={tooltip}
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: COLOR.white,
            color: "rgba(0,0,0,0.8)",
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: "20px",
            borderRadius: "8px",
            px: "10px",
            py: "10px",
            boxShadow: "0px 4px 5px rgba(130,143,169,0.15)",
          },
        },
        arrow: { sx: { color: COLOR.white } },
      }}
    >
      <Box sx={{ display: "inline-flex" }}>
        <InfoIcon />
      </Box>
    </Tooltip>
  );
}

function EndpointCell({ label, tooltip }) {
  const content = (
    <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <Typography sx={{ fontFamily: FONT, fontWeight: 500, fontSize: 14, lineHeight: "20px", color: COLOR.black600 }}>
        {label}
      </Typography>
      {tooltip && <InfoIcon />}
    </Box>
  );

  if (!tooltip) return content;

  return (
    <Tooltip
      title={tooltip}
      arrow
      placement="right"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: COLOR.white,
            color: "rgba(0,0,0,0.8)",
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: "20px",
            borderRadius: "8px",
            px: "10px",
            py: "10px",
            boxShadow: "0px 4px 5px rgba(130,143,169,0.15)",
          },
        },
        arrow: { sx: { color: COLOR.white } },
      }}
    >
      <Box sx={{ display: "inline-flex" }}>{content}</Box>
    </Tooltip>
  );
}

function StackedText({ top, bottom, ciLevel, topTooltip, align = "flex-start" }) {
  // Constrain to the parent cell width and wrap long values so text stays
  // inside the cell padding and never crosses the vertical divider.
  const textSx = {
    fontFamily: FONT,
    lineHeight: "20px",
    color: COLOR.black600,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
  // If the value has a trailing parenthesized range, e.g.
  // "0.25 Proportion of participants (0.006 to .806)", show the text on the
  // first line and move the "(range)" onto its own line below.
  let topMain = top;
  let topRange = "";
  if (typeof top === "string") {
    const m = top.match(/^(.*?)\s*(\([^()]*\))\s*$/);
    if (m) {
      topMain = m[1].trim();
      topRange = m[2];
    }
  }
  // Append the per-arm CI level after the range, e.g. "(10.9 to 18.0) CI 95%".
  const level = String(ciLevel ?? "").trim();
  if (topRange && level) topRange = `${topRange} CI ${level}`;
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align,
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      <Typography sx={{ ...textSx, fontWeight: 500, fontSize: 14, display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {topMain}
        {topTooltip && <InfoIconWithTip tooltip={topTooltip} />}
      </Typography>
      {topRange && (
        <Typography sx={{ ...textSx, fontWeight: 500, fontSize: 14 }}>{topRange}</Typography>
      )}
      {bottom && (
        <Typography sx={{ ...textSx, fontWeight: 400, fontSize: 13 }}>{bottom}</Typography>
      )}
    </Box>
  );
}

// A single grid cell. Vertical divider = left border on every cell after the
// first (`divider`). Alignment controlled by `align` (flex align-items value).
function Cell({ children, divider, align = "center", justify = "center", py = "8px" }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: justify,
        justifyContent: "center",
        minWidth: 0,
        px: "12px",
        py,
        textAlign: align,
        borderLeft: divider ? `1px solid ${COLOR.black50}` : "none",
        // Keep any cell content within the padded width so nothing overlaps the
        // vertical dividers.
        "& > *": {
          maxWidth: "100%",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        },
      }}
    >
      {children}
    </Box>
  );
}

// One data row rendered as grid cells (React fragment — cells become direct
// children of the parent grid so they share its column template).
function RowCells({ row, armCount }) {
  return (
    <>
      <Cell divider={false} align="left" justify="flex-start">
        <EndpointCell label={row.endpoint} tooltip={row.tooltip} />
      </Cell>
      <Cell divider>
        <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: "20px", color: COLOR.black600 }}>
          {show(row.popn)}
        </Typography>
      </Cell>
      <Cell divider>
        <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: "20px", color: COLOR.black600 }}>
          {show(row.assessor)}
        </Typography>
      </Cell>
      <Cell divider>
        <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: "20px", color: COLOR.black600, textAlign: "center" }}>
          {show(row.dataCut?.[0])}
        </Typography>
      </Cell>

      {Array.from({ length: armCount }).map((_, i) => (
        <Cell key={i} divider align="left" justify="flex-start">
          <StackedText top={show(row.arms?.[i]?.top)} topTooltip={row.arms?.[i]?.topTooltip} ciLevel={row.arms?.[i]?.ciLevel} bottom={row.arms?.[i]?.bottom} />
        </Cell>
      ))}

      <Cell divider align="left" justify="flex-start">
        <EffectText effect={row.effect} ciRange={row.ciRange || row.ci} ciLevel={row.ciLevel} pValue={row.pValue} />
      </Cell>
    </>
  );
}

// Effect cell: stacks the effect value (with the trailing number bolded), the
// CI interval range, and the p-value, each on its own line.
function EffectText({ effect, ciRange, ciLevel, pValue }) {
  const effectText = show(effect);
  // Bold the trailing numeric value and put a colon after the label,
  // e.g. "HR 0.75" -> "HR: 0.75".
  let effectNode = effectText;
  const m = typeof effectText === "string" && effectText.match(/^(.*?)(\s*[-+]?\d[\d.,]*%?)\s*$/);
  if (m) {
    // Add a ":" after the (non-empty) label if it doesn't already end with one.
    const label = m[1].trim();
    const labelWithColon = label ? (label.endsWith(":") ? label : `${label}:`) : "";
    effectNode = (
      <>
        {labelWithColon ? `${labelWithColon} ` : ""}
        <Box component="span" sx={{ fontWeight: 700 }}>{m[2].trim()}</Box>
      </>
    );
  }
  const level = String(ciLevel ?? "").trim();
  const range = [String(ciRange ?? "").trim(), level ? `CI ${level}` : ""].filter(Boolean).join(" ");
  const p = String(pValue ?? "").trim();
  const lineSx = {
    fontFamily: FONT,
    lineHeight: "20px",
    color: COLOR.black600,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, maxWidth: "100%" }}>
      <Typography sx={{ ...lineSx, fontWeight: 400, fontSize: 14 }}>{effectNode}</Typography>
      {range && <Typography sx={{ ...lineSx, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{range}</Typography>}
      {p && <Typography sx={{ ...lineSx, fontWeight: 400, fontSize: 13 }}>{p}</Typography>}
    </Box>
  );
}

export default function EndpointsTable({
  arms = [],
  primaryRows = [],
  secondaryRows = [],
  // Section labels. The Additional Outcomes table reuses this exact table but
  // has no primary/secondary split — it passes a single label and no primary
  // rows, so the primary block (and its empty state) is skipped entirely.
  primaryLabel = "Primary endpoints",
  secondaryLabel,
  showPrimarySection = true,
}) {
  const [secondaryOpen, setSecondaryOpen] = useState(true);
  // `expanded` is controlled by the parent (ResultsTab) so the toggle can live
  // beside the "Endpoint Outcomes" heading. Only this one table is affected.
  const armCount = Math.max(arms.length, 1);

  // Measure the (multi-line) sticky header so the vertical scrollbar track
  // starts exactly below it, not behind it.
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(60);
  useLayoutEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, [arms, secondaryOpen]);

  // Per-column [minPx, flex]. Min widths let the table grow wider than the card
  // (→ horizontal scroll); flex fills any extra space when it fits.
  const columnSpecs = [
    [180, 1.6], // Endpoint
    [90, 1], // Popn
    [110, 1], // Assessor
    [170, 1.4], // Data cut
    ...Array.from({ length: armCount }, () => [170, 1.4]), // arms
    [180, 1.4], // Effect (value + CI range + p-value stacked)
  ];

  // Shared column template — every row (header + body) uses this exact string.
  const gridTemplateColumns = columnSpecs
    .map(([min, flex]) => `minmax(${min}px, ${flex}fr)`)
    .join(" ");

  // Sum of column minimums → the content min-width that triggers horizontal
  // scroll when it exceeds the card width.
  const contentMinWidth = columnSpecs.reduce((sum, [min]) => sum + min, 0);

  const headers = [
    { label: "Endpoint", align: "left", justify: "flex-start" },
    { label: "Popn" },
    { label: "Assessor" },
    {
      label: "Data cut (f/u)",
      info: true,
      infoTip: "Data cut-off (follow-up): the point up to which outcome data was collected and analyzed for this endpoint.",
    },
    ...arms.map((a) => ({ label: a.label, n: a.n, align: "left", justify: "flex-start" })),
    { label: "Effect", align: "left", justify: "flex-start" },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        bgcolor: COLOR.white,
        border: `1px solid ${COLOR.black50}`,
        borderRadius: "4px",
        boxShadow: "1px 8px 34px 0px rgba(153,169,190,0.1)",
        overflow: "hidden",
      }}
    >

      {/* ONE CustomScrollbar (single scroll container → sticky header safe) that
          shows BOTH #CDCED6 thumbs: vertical (right, below the header) and a
          cloned horizontal (bottom) via withHorizontal. */}
      <CustomScrollbar
        height="50vh"
        useMaxHeight
        trackTop={headerHeight + 8}
        trackBottom={8}
        trackRight={0}
        trackWidth={5}
        lockPageScroll
        withHorizontal
        trackLeft={8}
        trackRightH={8}
        trackBottomH={0}
        style={{ overflowX: "auto" }}
      >
      <Box sx={{ minWidth: `${contentMinWidth}px` }}>
      {/* HEADER ROW — sticky: stays visible on vertical scroll. */}
      <Box
        ref={headerRef}
        sx={{
          display: "grid",
          gridTemplateColumns,
          bgcolor: COLOR.headerBg,
          borderBottom: `1px solid ${COLOR.black50}`,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        {headers.map((h, i) => (
          <Cell
            key={`${h.label}-${i}`}
            divider={i > 0}
            align={h.align || "center"}
            justify={h.justify || "center"}
            py="6px"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: h.justify === "flex-start" ? "flex-start" : "center" }}>
              <Typography sx={{ fontFamily: FONT, fontWeight: 500, fontSize: 14, lineHeight: "18px", color: COLOR.black800 }}>
                {h.label}
              </Typography>
              {h.info && <InfoIconWithTip tooltip={h.infoTip} />}
            </Box>
            {h.n && (
              <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, lineHeight: "14px", color: COLOR.black600 }}>
                {h.n}
              </Typography>
            )}
          </Cell>
        ))}
      </Box>

      {/* PRIMARY SECTION LABEL */}
      {showPrimarySection && (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", py: "8px", px: "12px" }}>
        <Typography sx={{ fontFamily: FONT, fontWeight: 450, fontSize: 14, lineHeight: "28px", color: COLOR.info700 }}>
          {primaryLabel}
        </Typography>
      </Box>
      )}

      {/* PRIMARY ROWS */}
      {!showPrimarySection ? null : primaryRows.length > 0 ? (
        primaryRows.map((row, i) => (
          <Box
            key={i}
            sx={{
              display: "grid",
              gridTemplateColumns,
              alignItems: "stretch",
              ...INSET_DIVIDER,
            }}
          >
            <RowCells row={row} armCount={armCount} />
          </Box>
        ))
      ) : (
        <Box sx={{ py: "16px", textAlign: "center", borderTop: `1px solid ${COLOR.black50}` }}>
          <Typography sx={{ fontFamily: FONT, fontSize: 13, color: COLOR.black600 }}>
            No primary endpoints.
          </Typography>
        </Box>
      )}

      {/* SECONDARY SECTION */}
      {secondaryRows.length > 0 && (
        <>
          <ButtonBase
            onClick={() => setSecondaryOpen((v) => !v)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "8px",
              py: "8px",
              px: "12px",
              width: "100%",
              ...INSET_DIVIDER,
            }}
          >
            <Typography sx={{ fontFamily: FONT, fontWeight: 450, fontSize: 14, lineHeight: "28px", color: COLOR.info700 }}>
              {secondaryLabel ?? `${secondaryRows.length} Secondary endpoints`}
            </Typography>
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 18,
                color: COLOR.info700,
                transform: secondaryOpen ? "scaleY(-1) rotate(180deg)" : "scaleY(-1)",
                transition: "transform 0.15s ease",
              }}
            />
          </ButtonBase>

          {secondaryOpen &&
            secondaryRows.map((row, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns,
                  alignItems: "stretch",
                  ...INSET_DIVIDER,
                }}
              >
                <RowCells row={row} armCount={armCount} />
              </Box>
            ))}
        </>
      )}
      </Box>
      </CustomScrollbar>
    </Box>
  );
}
