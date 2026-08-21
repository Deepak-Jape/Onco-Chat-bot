import React, { useMemo, useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { ChevronDown, ChevronRight } from "lucide-react";
import FilterSelect from "../../../common/FilterSelect";
import CustomScrollbar from "../../../common/CustomScrollbar";
import CommonRightDrawer from "../../../common/CommonRightDrawer";
import TrialsTableView, { DownloadCsvButton, downloadTrialsCsv } from "./TrialsTableView";
import {
  useTreatmentAnalyticsQuery,
  mapTreatmentDimensionToSection,
  mapEfficacyVsSafetyToScatter,
} from "../../../api/analytics/treatment";

/**
 * Mock "fetch sub-options for a parent" API call.
 * Simulates: GET /treatment/<panel>/<option>/children?parent=<parent>
 * Returns { filters:[{name}], data:[{name, phase1..4, ...}] } after a delay.
 *
 * Replace the body with a real fetch when the backend endpoint exists — keep
 * the same (option, parent) -> { filters, data } signature.
 */
function fetchChildren(optionDataset, parentName) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const payload =
        (optionDataset.childrenByParent && optionDataset.childrenByParent[parentName]) ||
        { filters: [], data: [] };
      resolve(payload);
    }, 400);
  });
}

/* ============================================================================
   SHARED TOKENS
   ============================================================================ */
const PHASES = [
  { key: "phase1", label: "Phase 1", color: "#778548" },
  { key: "phase2", label: "Phase 2", color: "#9aa733" },
  { key: "phase3", label: "Phase 3", color: "#c9ca03" },
  { key: "phase4", label: "Phase 4", color: "#f1e300" },
];
const FONT = "Rubik";
const CARD_SHADOW = "1px 8px 34px 0px rgba(153,169,190,0.1)";
const CHART_SHADOW = "1px 8px 17px 0px rgba(153,169,190,0.1)";

/* Top-filter selections shared from the filter bar to every chart section */
const TopFiltersContext = createContext({
  lineOfTherapy: "",
  phase: "",
  cancerStage: "",
  country: "",
});

/* Left-panel selections shared to the Efficacy/Adverse pairs.
   Each key holds the array of currently-checked category names for that panel.
   - backbone/biomarker/mode drive the TOP Efficacy/Adverse pair (+ each other).
   - controlArms drives the BOTTOM Efficacy/Adverse pair only. */
const LeftFiltersContext = createContext({
  register: () => {}, // (panelKey, selectedNames[]) => void
  selections: { backbone: null, biomarker: null, mode: null, controlArms: null },
});

/* Phase top-filter label ("Phase 2") -> the matching data column key */
const PHASE_KEY = {
  "Phase 1": "phase1",
  "Phase 2": "phase2",
  "Phase 3": "phase3",
  "Phase 4": "phase4",
};

/* Normalize an API metric option list into plain strings for the top-filter
   dropdowns. The backend may return an array of strings, an array of objects
   ({ label|value|name|title }), or an { option: count } map. Mirrors the
   Treatment tab's handling so both stay in sync. */
function normalizeMetricOptionList(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined && item !== "")
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "number") return String(item);
        return item?.label ?? item?.value ?? item?.name ?? item?.title ?? "";
      })
      .filter(Boolean);
  }
  // Some APIs return `{ option: count }` maps.
  if (value && typeof value === "object") {
    return Object.keys(value).filter(Boolean);
  }
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

/* Dimension-type key <-> UI label. The API returns raw dimension keys
   (metrics.dimension_type = ["backbone","drug","drug_class","moa"]); the panel
   dropdown shows them as "Top <Title Case>" and, on select, sends the raw key
   back as treatment_dimension_type / biomarker_dimension_type. */
const DIMENSION_LABEL_OVERRIDES = {
  moa: "Top MOA",
  drug_class: "Top Drug Classes",
  drug: "Top Drugs",
  backbone: "Top Backbones",
  biomarker: "Top Biomarkers",
  target: "Top Targets",
};
function dimensionKeyToLabel(key) {
  if (!key) return "";
  if (DIMENSION_LABEL_OVERRIDES[key]) return DIMENSION_LABEL_OVERRIDES[key];
  const titled = String(key)
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return `Top ${titled}`;
}
function dimensionLabelToKey(label, keys = []) {
  return keys.find((k) => dimensionKeyToLabel(k) === label) || label;
}

/* "Color by" options for the Efficacy vs Safety scatter. These are UI config
   (they key into COLOR_BY_CONFIG below), not data — kept static. */
const efficacyfilter = [
  "Color by Treatment Strategy",
  "Color by Biomarker / Target Strategy",
  "Color by Mode of Administration",
];

/* Palette used to give each category (bar + its checkbox) a color. Assigned in
   order — 1st category → 1st color, 2nd → 2nd, … — and reused cyclically. The
   same color always lands on the same position, so a repeated category picks
   up the same swatch. Deduped, first-appearance order preserved. */
// Axis position for points that report only one of the two selected metrics:
// a thin lane just below the plot, so they are visible without implying a
// measured zero.
const LANE = -6;

const CATEGORY_PALETTE = [
  "rgba(44, 95, 110, 1)",
  "rgba(40, 146, 136, 1)",
  "rgba(145, 52, 52, 1)",
  "rgba(122, 104, 97, 1)",
  "rgba(145, 77, 10, 1)",
  "rgba(109, 95, 150, 1)",
  "rgba(75, 145, 78, 1)",
  "rgba(44, 95, 110, 0.8)",
  "rgba(44, 95, 110, 0.7)",
  "rgba(144, 164, 174, 1)",
  "rgba(241, 87, 87, 1)",
  "rgba(241, 128, 16, 1)",
  "rgba(205, 174, 163, 1)",
  "rgba(188, 170, 240, 1)",
  "rgba(166, 228, 169, 1)",
  "rgba(141, 219, 212, 1)",
  "rgba(96, 125, 139, 1)",
  "rgba(193, 70, 70, 1)",
  "rgba(193, 102, 13, 1)",
  "rgba(159, 136, 128, 1)",
  "rgba(142, 124, 195, 1)",
  "rgba(129, 199, 132, 1)",
  "rgba(83, 186, 176, 1)",
];

/* Child rows are namespaced as "<parent> › <sub>" to keep their identity
   unique (a sub-category can share its parent's name). Strip the prefix for
   display so the panel + chart show just the sub-category label. */
function displayLabel(name) {
  const idx = String(name).indexOf(" › ");
  return idx === -1 ? name : name.slice(idx + 3);
}

/* ============================================================================
   GENERIC CHECKBOX
   ============================================================================ */
function Checkbox({ checked, indeterminate, onChange, color = "#334155" }) {
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      onClick={onChange}
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      style={{
        display: "flex",
        height: 18,
        width: 18,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        border: `2px solid ${active ? color : "#cbd5e1"}`,
        background: active ? color : "#ffffff",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {checked && (
        <svg viewBox="0 0 16 16" style={{ height: 12, width: 12, fill: "#fff" }}>
          <path d="M13.3 3.3 6 10.6 2.7 7.3 1.3 8.7l4.7 4.7 8.7-8.7z" />
        </svg>
      )}
      {indeterminate && !checked && (
        <span style={{ height: 2, width: 8, borderRadius: 9999, background: "#fff" }} />
      )}
    </button>
  );
}

/* ============================================================================
   GENERIC FILTER PANEL
   filterTree: [{ name: "IO", children: ["IO Monotherapy", ...] }, { name: "Chemo" }]
   dropdownLabel: optional text for the top "Field" dropdown (omit for flat lists
   like Mode of Administration)
   ============================================================================ */
function FilterPanel({
  filterTree,
  dropdownLabel,
  dropdownOptions,
  selectedField,
  onSelectField,
  checked,
  onToggle,
  onToggleAll,
  colorMap = {},
  onExpandParent,
  loadingParents = {},
}) {
  // Parents start collapsed so expanding triggers the (lazy) children fetch.
  const [expanded, setExpanded] = useState({});

  const allKeys = useMemo(
    () => filterTree.flatMap((f) => [f.name, ...(f.children || [])]),
    [filterTree]
  );
  const allOn = allKeys.every((k) => checked[k]);
  const someOn = allKeys.some((k) => checked[k]);

  const options = dropdownOptions || [];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: 469,
        width: 312,
        maxWidth: "100%",
        flexShrink: 0,
        flexDirection: "column",
        gap: 12,
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.05)",
        background: "#ffffff",
        // No right padding so the scrollbar can sit flush against the card's
        // right border; the header + list add their own right spacing instead.
        padding: "16px 0 16px 16px",
        boxShadow: CARD_SHADOW,
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      {dropdownLabel && (
  <div style={{ position: "relative", marginRight: 16 }}>
    <div
      onClick={() => setDropdownOpen((o) => !o)}
      style={{
        display: "flex",
        height: 32,
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 6,
        border: "1px solid rgba(0,0,0,0.05)",
        background: "#ffffff",
        padding: "0 12px",
        cursor: "pointer",
        boxShadow: CARD_SHADOW,
      }}
    >
      <span style={{ fontSize: 12, fontFamily: "Rubik", color: "rgba(0,0,0,0.6)" }}>
        {selectedField}
      </span>
      <ChevronDown
        style={{
          height: 18,
          width: 18,
          color: "rgba(0,0,0,0.4)",
          transition: "transform 0.15s",
          transform: dropdownOpen ? "rotate(180deg)" : "none",
        }}
      />
    </div>

    {dropdownOpen && (
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: 6,
          boxShadow: CARD_SHADOW,
          overflow: "hidden",
        }}
      >
        {options.map((item) => (
          <div
            key={item}
            onClick={() => {
              onSelectField && onSelectField(item);
              setDropdownOpen(false);
            }}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              fontFamily: "Rubik",
              fontWeight: 400,
              lineHeight: "18px",
              cursor: "pointer",
              color: "rgba(0,0,0,0.6)",
              background: selectedField === item ? "#f3f6fb" : "transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    )}
  </div>
)}


      <CustomScrollbar height={dropdownLabel ? 360 : 400} trackRight={0} style={{ paddingTop: 4, paddingRight: 12 }}>
        <label
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            gap: 4,
            padding: 4,
          }}
        >
          <Checkbox
            checked={allOn}
            indeterminate={someOn && !allOn}
            onChange={() => onToggleAll(allKeys, !allOn)}
          />
          <span style={{ fontSize: 14, fontFamily: "Rubik", color: "rgba(0,0,0,0.6)" }}>Select All</span>
        </label>

        {filterTree.map((group) => {
          // Expandable if it declares children upfront (hasChildren flag) or
          // children have already been loaded.
          const expandable =
            group.hasChildren || (group.children && group.children.length > 0);
          const isOpen = !!expanded[group.name];
          const isLoading = !!loadingParents[group.name];
          const loadedChildNames = group.children || [];

          // Parent checkbox derives from its sub-categories once they're
          // loaded: all subs on -> checked, some on -> indeterminate (dash),
          // none on -> unchecked. Before children load, fall back to the
          // parent's own flag.
          const hasLoadedChildren = loadedChildNames.length > 0;
          const childOnCount = loadedChildNames.filter((c) => checked[c]).length;
          const parentChecked = hasLoadedChildren
            ? childOnCount === loadedChildNames.length
            : !!checked[group.name];
          const parentIndeterminate =
            hasLoadedChildren &&
            childOnCount > 0 &&
            childOnCount < loadedChildNames.length;

          const toggleExpand = () => {
            const willOpen = !isOpen;
            setExpanded((e) => ({ ...e, [group.name]: willOpen }));
            // On first open, kick off the lazy fetch for this parent's children.
            if (willOpen && onExpandParent) onExpandParent(group.name);
          };

          return (
            <div
              key={group.name}
              style={{
                marginTop: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                borderRadius: 4,
                padding: 4,
                background: expandable && isOpen ? "#f3f6fb" : "transparent",
              }}
            >
              <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 4 }}>
                {expandable ? (
                  <button
                    onClick={toggleExpand}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <ChevronDown
                      style={{
                        height: 16,
                        width: 16,
                        color: "rgba(0,0,0,0.4)",
                        transition: "transform 0.15s",
                        transform: isOpen ? "none" : "rotate(-90deg)",
                      }}
                    />
                  </button>
                ) : (
                  <ChevronDown style={{ height: 16, width: 16, color: "rgba(0,0,0,0.4)" }} />
                )}
                <label
                  style={{ display: "flex", flex: 1, alignItems: "center", gap: 4 }}
                >
                  <Checkbox
                    checked={parentChecked}
                    indeterminate={parentIndeterminate}
                    onChange={() => onToggle(group.name)}
                    color={colorMap[group.name]}
                  />
                  <span style={{ fontSize: 14, color: "rgba(0,0,0,0.6)" }}>{group.name}</span>
                </label>
              </div>

              {isOpen && isLoading && (
                <div style={{ paddingLeft: 24, padding: "4px 0 4px 24px", fontSize: 13, color: "rgba(0,0,0,0.4)" }}>
                  Loading…
                </div>
              )}

              {isOpen &&
                !isLoading &&
                loadedChildNames.map((child) => (
                  <div
                    key={child}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 0",
                      paddingLeft: 24,
                    }}
                  >
                    <label
                      style={{ display: "flex", flex: 1, alignItems: "center", gap: 4 }}
                    >
                      <Checkbox
                        checked={checked[child]}
                        onChange={() => onToggle(child)}
                        color={colorMap[child]}
                      />
                      <span style={{ fontSize: 14, color: "rgba(0,0,0,0.6)" }}>{displayLabel(child)}</span>
                    </label>
                  </div>
                ))}
            </div>
          );
        })}
      </CustomScrollbar>
    </div>
  );
}

/* ============================================================================
   GENERIC "PHASE STACKED BAR" PANEL
   This is the piece that repeats across Top Backbones / Top Biomarkers /
   Mode of Administration / Control Arms. Pass it a title, an arms label,
   and a `data` array of { name, phase1, phase2, phase3, phase4 } and it
   renders the header, phase legend, By Phase/Over Time toggle, and chart.
   ============================================================================ */
/* Track the pointer position in viewport coords, for portal-positioned
   tooltips that must escape scroll containers. */
function usePointerPosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return pos;
}

/* "By Phase" bar tooltip — category name header, then Phase 1-4 with values.
   Rendered in a portal at document.body and positioned at the pointer, so it
   is never clipped by the chart's vertical scroll container. Flips above the
   cursor when near the bottom of the viewport. */
const PhaseBarTooltip = ({ active, payload }) => {
  const pointer = usePointerPosition();
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  if (!row) return null;

  const CARD_W = 240;
  const OFFSET = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  // Keep the card on-screen: flip left if near the right edge, flip above if
  // near the bottom.
  const left =
    pointer.x + OFFSET + CARD_W > vw ? pointer.x - CARD_W - OFFSET : pointer.x + OFFSET;
  const flipUp = pointer.y + 180 > vh;
  const top = flipUp ? pointer.y - 180 : pointer.y + OFFSET;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 9999,
        pointerEvents: "none",
        background: "#ffffff",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
        padding: "12px 16px",
        minWidth: 200,
        width: CARD_W,
        boxSizing: "border-box",
        fontFamily: "Rubik",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,0.85)", marginBottom: 8 }}>
        {displayLabel(row.name)}
      </div>
      {PHASES.map((p) => (
        <div
          key={p.key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: "3px 0",
            fontSize: 14,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ height: 10, width: 10, borderRadius: 9999, backgroundColor: p.color }} />
            <span style={{ color: "rgba(0,0,0,0.6)" }}>{p.label}</span>
          </span>
          <span style={{ fontWeight: 500, color: "rgba(0,0,0,0.8)" }}>{row[p.key] ?? 0}</span>
        </div>
      ))}
    </div>,
    document.body
  );
};

const OVER_TIME_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

/* Over Time bar tooltip — same style as the Treatment tab's CustomTooltipBar:
   tinted card, colored border, "<name>" + "<year>: <value>". */
const OverTimeTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]; // with shared={false} this is the hovered segment
  const name = data.name;
  const value = data.value;
  const year = data.payload?.year;
  const color = data.fill;

  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 5%, white)`,
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Rubik",
      }}
    >
      <div style={{ fontWeight: 500, fontFamily: "Rubik", color: "rgba(0,0,0,1)", fontSize: 14 }}>
        {name || "--"}
      </div>
      <div style={{ color: "rgba(0,0,0,0.6)", fontFamily: "Rubik", fontSize: 14 }}>
        {year}: {value ?? "--"}
      </div>
    </div>
  );
};

/**
 * Build "Over Time" series: one row per year, each visible category a stacked
 * segment. Derived deterministically from each category's phase totals so it
 * needs no extra data. Backend can replace with a real year-series later.
 */
function buildOverTimeData(visibleData) {
  return OVER_TIME_YEARS.map((year, yi) => {
    const row = { year: String(year) };
    visibleData.forEach((d, di) => {
      const total = (d.phase1 || 0) + (d.phase2 || 0) + (d.phase3 || 0) + (d.phase4 || 0);
      const base = total / OVER_TIME_YEARS.length;
      // Two out-of-phase waves keyed on BOTH year and category index so every
      // category has a different year-to-year shape (bars vary per year).
      const wave =
        0.5 +
        0.35 * Math.sin(yi * 0.9 + di * 2.3) +
        0.25 * Math.cos(yi * 1.7 + di * 0.7);
      row[d.name] = Math.max(2, Math.round(base * wave));
    });
    return row;
  });
}

/**
 * Compact dropdown for switching a chart between Experimental and Control arm.
 * Kept small (matches the 32px header controls) so the header doesn't crowd.
 */
const ARM_SCOPE_ITEMS = [
  { value: "experimental", label: "Experimental Arms" },
  { value: "control", label: "Control Arms" },
];

function ArmScopeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current =
    ARM_SCOPE_ITEMS.find((o) => o.value === value) || ARM_SCOPE_ITEMS[0];

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        style={{
          display: "flex",
          height: 32,
          alignItems: "center",
          gap: 4,
          borderRadius: 6,
          border: "1.5px solid #e2e8f0",
          padding: "0 8px",
          fontSize: 14,
          fontWeight: 500,
          color: "rgba(0,0,0,0.7)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          background: "#fff",
        }}
      >
        {current.label}
        <ChevronDown
          style={{
            height: 16,
            width: 16,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 0,
            zIndex: 20,
            minWidth: "100%",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {ARM_SCOPE_ITEMS.map((item) => (
            <div
              key={item.value}
              // onMouseDown so it fires before the trigger's onBlur closes it
              onMouseDown={() => {
                onChange(item.value);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: FONT,
                cursor: "pointer",
                color: "rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
                background: value === item.value ? "#f3f6fb" : "transparent",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Wrapping Y-axis tick — long category labels (e.g. "Hormonal/Endocrine
   Therapy", "Cell and Gene Therapy") are split across up to 2 lines and
   right-aligned to the axis so they stay fully visible instead of clipping. */
function WrappedYAxisTick({ x, y, payload }) {
  const label = displayLabel(String(payload?.value ?? ""));
  const MAX_PER_LINE = 20; // chars per line
  const MAX_LINES = 3; // long combo names get up to 3 lines, then ellipsis

  // Greedily pack words into lines in order (no reordering, no word dropping).
  const words = label.split(" ");
  const lines = [];
  let current = "";
  words.forEach((w) => {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= MAX_PER_LINE || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = w;
    }
  });
  if (current) lines.push(current);

  // Cap at MAX_LINES; if it overflows, ellipsize the last visible line.
  let visibleLines = lines;
  if (lines.length > MAX_LINES) {
    visibleLines = lines.slice(0, MAX_LINES);
    const last = visibleLines[MAX_LINES - 1];
    visibleLines[MAX_LINES - 1] =
      last.length > MAX_PER_LINE - 1
        ? `${last.slice(0, MAX_PER_LINE - 1)}…`
        : `${last}…`;
  }

  // Line spacing for the 14px label text — comfortable leading so wrapped
  // 2-3 line labels (e.g. "Chemotherapy + Immunotherapy (IO) + Targeted
  // Therapy") get proper space between each line instead of looking crammed.
  const lineHeight = 18;
  const startY = y - ((visibleLines.length - 1) * lineHeight) / 2;

  return (
    <g>
      <title>{label}</title>
      {visibleLines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={startY + i * lineHeight}
          dy={4}
          textAnchor="end"
          fontSize={14}
          fill="rgba(0,0,0,0.7)"
          fontFamily={FONT}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/* Over Time legend — shows a capped number of category swatches (so long
   selections don't push the chart down / break layout), then a "+N" chip.
   Hovering the chip reveals a scrollable popover listing every remaining item. */
function OverTimeLegend({ items, colorMap, activeSeries, onToggleSeries }) {
  const [showAll, setShowAll] = useState(false);
  // Category names are long, so ~2 fit on one line. Show 2 and put the rest
  // behind the "+N" chip so the legend stays a single line.
  const MAX_VISIBLE = 2;

  let visible = items.slice(0, MAX_VISIBLE);
  let hidden = items.slice(MAX_VISIBLE);

  // If the highlighted series is in the overflow group, surface it into the
  // visible row (swap for the last visible slot) so the user can see what's
  // active without opening the popover.
  if (activeSeries && hidden.some((d) => d.name === activeSeries)) {
    const activeItem = hidden.find((d) => d.name === activeSeries);
    hidden = [
      visible[visible.length - 1],
      ...hidden.filter((d) => d.name !== activeSeries),
    ];
    visible = [...visible.slice(0, MAX_VISIBLE - 1), activeItem];
  }

  const Swatch = ({ name, idx }) => (
    <span
      style={{
        height: 12,
        width: 12,
        flexShrink: 0,
        borderRadius: 9999,
        backgroundColor:
          colorMap[name] || CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
      }}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        // No overflow:hidden here — it clipped the "+N" chip and swallowed the
        // hover popover. Long labels truncate on their own (minWidth:0 +
        // textOverflow on the label span). Vertical padding gives the chip room.
        padding: "4px 0",
        minWidth: 0,
      }}
    >
      {visible.map((d, i) => {
        const dimmed = activeSeries && activeSeries !== d.name;
        return (
          <div
            key={d.name}
            onClick={() => onToggleSeries && onToggleSeries(d.name)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              minWidth: 0,
              cursor: "pointer",
              opacity: dimmed ? 0.4 : 1,
              fontWeight: activeSeries === d.name ? 600 : 400,
            }}
          >
            <Swatch name={d.name} idx={i} />
            <span
              style={{
                fontSize: 13,
                color: "rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayLabel(d.name)}
            </span>
          </div>
        );
      })}

      {hidden.length > 0 && (
        <div
          style={{ position: "relative", flexShrink: 0 }}
          onMouseEnter={() => setShowAll(true)}
          onMouseLeave={() => setShowAll(false)}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 22,
              padding: "0 10px",
              borderRadius: 9999,
              border: "1px solid #dce9fc",
              background: "#f3f6fb",
              fontSize: 12,
              fontWeight: 500,
              color: "#2666be",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            +{hidden.length} more
          </span>

          {showAll && (
            <div
              style={{
                position: "absolute",
                top: 28,
                right: 0,
                zIndex: 30,
                width: 320,
                maxHeight: 240,
                overflowY: "auto",
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {hidden.map((d, i) => {
                const dimmed = activeSeries && activeSeries !== d.name;
                return (
                  <div
                    key={d.name}
                    onClick={() => onToggleSeries && onToggleSeries(d.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      opacity: dimmed ? 0.4 : 1,
                      fontWeight: activeSeries === d.name ? 600 : 400,
                    }}
                  >
                    <Swatch name={d.name} idx={MAX_VISIBLE + i} />
                    <span style={{ fontSize: 13, color: "rgba(0,0,0,0.7)" }}>
                      {displayLabel(d.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhaseStackedBarChart({
  title,
  visibleData,
  colorMap = {},
  xDomain,
  xTicks,
  negativeOffset = 0,
  fixedTotal,
  onOpenTable,
  scope = "experimental",
}) {
  const [view, setView] = useState("phase");
  const [activePhase, setActivePhase] = useState(null); // null = all phases shown
  const [activeSeries, setActiveSeries] = useState(null); // Over Time: null = all

  const overTimeData = useMemo(() => buildOverTimeData(visibleData), [visibleData]);

  // Clear the Over Time highlight when leaving that view or when the selected
  // series is no longer visible (e.g. its checkbox was unchecked).
  useEffect(() => {
    if (view !== "time" && activeSeries) setActiveSeries(null);
  }, [view, activeSeries]);
  useEffect(() => {
    if (activeSeries && !visibleData.some((d) => d.name === activeSeries)) {
      setActiveSeries(null);
    }
  }, [visibleData, activeSeries]);

  const totalArms = useMemo(
    () =>
      fixedTotal != null
        ? fixedTotal
        : visibleData.reduce(
            (sum, d) => sum + d.phase1 + d.phase2 + d.phase3 + d.phase4,
            0
          ),
    [visibleData, fixedTotal]
  );

  // Reverse for top-to-bottom order; add an invisible negative segment so the
  // visible bars begin left of the 0 gridline (matches the design).
  const chartData = useMemo(
    () =>
      [...visibleData].reverse().map((d) => ({
        ...d,
        offset: negativeOffset ? -negativeOffset : 0,
      })),
    [visibleData, negativeOffset]
  );

  return (
    <div
      style={{
        display: "flex",
        height: 469,
        width: "100%",
        flexDirection: "column",
        gap: 16,
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.05)",
        background: "#ffffff",
        padding: 20,
        boxShadow: CHART_SHADOW,
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {/* Title yields space first so the controls keep their intrinsic width
            (Bug 816: the arms badge used to wrap onto 3 lines and overlap the
            By Phase / Over Time toggle). */}
        <h3
          style={{
            fontSize: 23,
            fontWeight: 500,
            color: "rgba(0,0,0,0.8)",
            margin: 0,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {scope === "control" ? "Control Arms" : title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              height: 32,
              overflow: "hidden",
              borderRadius: 6,
              border: "1.5px solid #e2e8f0",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setView("phase")}
              style={{
                height: "100%",
                padding: "0 12px",
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(0,0,0,0.7)",
                cursor: "pointer",
                border: "none",
                borderRight: view === "phase" ? "none" : "1.5px solid #dce9fc",
                background: view === "phase" ? "#d9d9e0" : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              By Phase
            </button>
            <button
              onClick={() => setView("time")}
              style={{
                height: "100%",
                padding: "0 12px",
                fontSize: 14,
                fontWeight: view === "time" ? 500 : 400,
                color: "rgba(0,0,0,0.7)",
                cursor: "pointer",
                border: "none",
                background: view === "time" ? "#d9d9e0" : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              Over Time
            </button>
          </div>
          <div
            onClick={onOpenTable}
            title="View trials"
            style={{
              display: "flex",
              height: 32,
              alignItems: "center",
              borderRadius: 4,
              border: "1px solid #dce9fc",
              padding: "0 8px",
              cursor: onOpenTable ? "pointer" : "default",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#2666be",
                whiteSpace: "nowrap",
              }}
            >
              {totalArms.toLocaleString()} Arms
            </span>
          </div>
        </div>
      </div>

      {view === "phase" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          {PHASES.map((p) => {
            const dimmed = activePhase && activePhase !== p.key;
            return (
              <div
                key={p.key}
                onClick={() =>
                  setActivePhase((cur) => (cur === p.key ? null : p.key))
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  opacity: dimmed ? 0.4 : 1,
                  fontWeight: activePhase === p.key ? 600 : 400,
                }}
              >
                <span
                  style={{ height: 16, width: 16, borderRadius: 9999, backgroundColor: p.color }}
                />
                <span style={{ fontSize: 14, color: "rgba(0,0,0,0.7)" }}>{p.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <OverTimeLegend
          items={visibleData}
          colorMap={colorMap}
          activeSeries={activeSeries}
          onToggleSeries={(name) =>
            setActiveSeries((cur) => (cur === name ? null : name))
          }
        />
      )}

      <div style={{ flex: 1, minHeight: 340, width: "100%" }}>
        {view === "phase" ? (
          (() => {
            // Fixed row height keeps bars readable; the bar area scrolls while
            // the X-axis stays pinned below. The scroll chart hides its own
            // X-axis; a separate short chart underneath renders ONLY the axis,
            // sharing the same domain/ticks/margins/Y-width so columns align.
            // Per-category row height. Sized so a wrapped 3-line label
            // (~54px at 18px line-height) still has clear vertical space
            // separating it from the next category's label.
            const ROW_H = 72;
            const VISIBLE_H = 300; // scroll viewport height (bars)
            const AXIS_H = 56; // fixed strip height for the pinned X-axis
            const CHART_MARGIN = { top: 0, right: 20, bottom: 0, left: 8 };
            const Y_WIDTH = 170;
            const innerH = Math.max(VISIBLE_H, chartData.length * ROW_H + 20);
            // Only the first section passes xDomain/xTicks; others let Recharts
            // auto-scale. Fall back to a numeric auto domain + derived ticks so
            // the pinned axis strip always has values to render.
            const axisDomain = xDomain || [0, "auto"];
            const axisTicks =
              xTicks ||
              (() => {
                const max = Math.max(
                  1,
                  ...chartData.map(
                    (d) =>
                      (d.phase1 || 0) +
                      (d.phase2 || 0) +
                      (d.phase3 || 0) +
                      (d.phase4 || 0)
                  )
                );
                const step = Math.max(1, Math.ceil(max / 5 / 10) * 10);
                const out = [];
                for (let v = 0; v <= step * 5; v += step) out.push(v);
                return out;
              })();
            return (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <CustomScrollbar
                  height={VISIBLE_H}
                  trackRight={0}
                  trackTop={8}
                  trackBottom={8}
                  wrapperStyle={{ marginRight: -20 }}
                  style={{ paddingRight: 20 }}
                >
                  <div style={{ height: innerH, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={CHART_MARGIN}
                        barCategoryGap="35%"
                      >
                        <CartesianGrid horizontal={false} stroke="#e8e8ec" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          domain={axisDomain}
                          ticks={axisTicks}
                          hide
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={Y_WIDTH}
                          interval={0}
                          tick={<WrappedYAxisTick />}
                          axisLine={{ stroke: "#e8e8ec" }}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<PhaseBarTooltip />}
                          cursor={{ fill: "rgba(0,0,0,0.04)" }}
                          isAnimationActive={false}
                          wrapperStyle={{ display: "none" }}
                        />
                        {negativeOffset > 0 && (
                          <Bar dataKey="offset" stackId="phases" fill="transparent" barSize={18} />
                        )}
                        {PHASES.map((p) => (
                          <Bar
                            key={p.key}
                            dataKey={p.key}
                            stackId="phases"
                            fill={p.color}
                            fillOpacity={activePhase && activePhase !== p.key ? 0.15 : 1}
                            radius={p.key === "phase4" ? [0, 4, 4, 0] : undefined}
                            barSize={18}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CustomScrollbar>

                {/* Fixed X-axis pinned below the scrolling bars. Uses a single
                    dummy row so the vertical layout lays out the number axis
                    normally (feeding the full chartData would collapse it). */}
                <div style={{ height: AXIS_H, width: "100%", flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={axisTicks.map((t) => ({ x: t, y: 0 }))}
                      margin={{ top: 0, right: 20, bottom: 22, left: Y_WIDTH + 8 }}
                    >
                      {/* Same vertical gridlines as the scroll chart, so they
                          visually continue down and touch the X-axis line. */}
                      <CartesianGrid horizontal={false} stroke="#e8e8ec" strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        domain={axisDomain}
                        ticks={axisTicks}
                        tick={{ fontSize: 12, fill: "rgba(0,0,0,0.7)" }}
                        axisLine={{ stroke: "#e8e8ec" }}
                        tickLine={false}
                        label={{
                          value: "Trials",
                          position: "insideBottom",
                          offset: -14,
                          fontSize: 12,
                          fill: "rgba(0,0,0,0.4)",
                        }}
                      />
                      <Line dataKey="y" stroke="transparent" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={overTimeData}
              margin={{ top: 0, right: 20, bottom: 20, left: 8 }}
              barCategoryGap="25%"
            >
              <CartesianGrid vertical={false} stroke="#e8e8ec" strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.7)" }}
                axisLine={{ stroke: "#e8e8ec" }}
                tickLine={false}
                label={{
                  value: "Years",
                  position: "insideBottom",
                  offset: -15,
                  fontSize: 12,
                  fill: "rgba(0,0,0,0.4)",
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.7)" }}
                axisLine={{ stroke: "#e8e8ec" }}
                tickLine={false}
                label={{
                  value: "Arms",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                  fill: "rgba(0,0,0,0.4)",
                }}
              />
              <Tooltip
                content={<OverTimeTooltip />}
                shared={false}
                isAnimationActive={false}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              {visibleData.map((d, i) => (
                <Bar
                  key={d.name}
                  dataKey={d.name}
                  stackId="years"
                  fill={colorMap[d.name] || CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                  fillOpacity={activeSeries && activeSeries !== d.name ? 0.15 : 1}
                  barSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   SECTION SKELETON — shown while a section's API data is still loading, so the
   panel+chart layout appears immediately without flashing dummy data first.
   Mirrors the FilterPanel (left) + PhaseStackedBarChart (right) dimensions.
   ============================================================================ */
function ShimmerBlock({ style }) {
  return (
    <div
      style={{
        borderRadius: 4,
        background:
          "linear-gradient(90deg, #eef1f6 25%, #f6f8fb 37%, #eef1f6 63%)",
        backgroundSize: "400% 100%",
        animation: "ctShimmer 1.4s ease infinite",
        ...style,
      }}
    />
  );
}

function FilteredPhaseBarSkeleton() {
  const rows = [0.95, 0.55, 0.4, 0.3, 0.22];
  return (
    <div style={{ display: "flex", width: "100%", flexWrap: "wrap", gap: 12 }}>
      {/* keyframes injected once; harmless if repeated */}
      <style>{`@keyframes ctShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>

      {/* Left filter-panel placeholder */}
      <div
        style={{
          display: "flex",
          height: 469,
          width: 312,
          maxWidth: "100%",
          flexShrink: 0,
          flexDirection: "column",
          gap: 14,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.05)",
          background: "#ffffff",
          padding: 16,
          boxShadow: CARD_SHADOW,
          boxSizing: "border-box",
        }}
      >
        <ShimmerBlock style={{ height: 32, width: "100%", borderRadius: 6 }} />
        <ShimmerBlock style={{ height: 18, width: 90, marginTop: 4 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShimmerBlock style={{ height: 18, width: 18 }} />
            <ShimmerBlock style={{ height: 14, width: `${55 + ((i * 13) % 35)}%` }} />
          </div>
        ))}
      </div>

      {/* Right chart placeholder */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <div
          style={{
            display: "flex",
            height: 469,
            width: "100%",
            flexDirection: "column",
            gap: 16,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.05)",
            background: "#ffffff",
            padding: 20,
            boxShadow: CHART_SHADOW,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <ShimmerBlock style={{ height: 26, width: 220 }} />
            <ShimmerBlock style={{ height: 32, width: 160, borderRadius: 6 }} />
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
              gap: 22,
            }}
          >
            {rows.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ShimmerBlock style={{ height: 12, width: 120, flexShrink: 0 }} />
                <ShimmerBlock style={{ height: 18, width: `${w * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   COMBINED SECTION: filter panel (left) + phase stacked bar chart (right).
   THIS is the "one filter, one chart, pass props" component you asked for —
   Top Backbones, Top Biomarkers, Mode of Administration, and Control Arms
   (paired with the Top Drugs filter) are all just different prop sets
   passed into this same component.
   ============================================================================ */
function FilteredPhaseBarSection({
  chartTitle,
  scope = "experimental", // controlled by the page-level arm toggle
  dropdownLabel,
  dropdownOptions,
  onSelectDimension, // (label) => void — when the dropdown drives a re-fetch
  section: sectionProp, // experimental { defaultOption, byOption: { <name>: { totalArms, data, filters } } }
  controlSection, // control-arm variant, shown when scope === "control"
  xDomain,
  xTicks,
  negativeOffset,
  onOpenTable,
  panelKey, // "backbone" | "biomarker" | "mode" — publishes selections to Efficacy/AE
}) {
  // Active dataset follows the (page-level) scope, falling back to experimental.
  const section = scope === "control" && controlSection ? controlSection : sectionProp;
  // Which dropdown option is active — drives filters, data and totals. When the
  // dropdown re-fetches (onSelectDimension), the section is rebuilt with a new
  // defaultOption, so track that as the source of truth.
  const [selectedOption, setSelectedOption] = useState(section.defaultOption);
  // Keep the local selection in sync when the section (its defaultOption)
  // changes underneath us — e.g. after a dimension-driven re-fetch.
  useEffect(() => {
    setSelectedOption(section.defaultOption);
  }, [section.defaultOption]);
  // The dropdown either drives a parent re-fetch (dimension types) or switches
  // a purely-local option. Pick the right handler.
  const handleSelectField = onSelectDimension || setSelectedOption;

  // Resolve the active option's dataset (fall back to the default).
  const active = section.byOption[selectedOption] || section.byOption[section.defaultOption];

  // Lazily-loaded sub-options per parent (fetched on expand).
  //   loadedChildren: { [parent]: { filters:[], data:[] } }
  //   loadingParents: Set-like map { [parent]: true } while a fetch is in flight
  const [loadedChildren, setLoadedChildren] = useState({});
  const [loadingParents, setLoadingParents] = useState({});

  // Reset loaded children whenever the dropdown option changes.
  useEffect(() => {
    setLoadedChildren({});
    setLoadingParents({});
  }, [selectedOption]);

  // When scope flips (experimental ↔ control), fall back to the new section's
  // default option so the chart reflects the switched dataset.
  useEffect(() => {
    setSelectedOption(section.defaultOption);
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch a parent's children on first expand; cache afterwards.
  const handleExpandParent = (parentName) => {
    if (loadedChildren[parentName] || loadingParents[parentName]) return;
    if (!active.childrenByParent || !active.childrenByParent[parentName]) return;
    setLoadingParents((p) => ({ ...p, [parentName]: true }));
    fetchChildren(active, parentName).then((payload) => {
      setLoadedChildren((prev) => ({ ...prev, [parentName]: payload }));
      setLoadingParents((p) => ({ ...p, [parentName]: false }));
      // Newly loaded children inherit the parent's current checked state:
      // if the parent is checked (incl. when the user just checked it, which
      // triggers this load), the children come in checked so their bars show;
      // if the parent is off, they stay off until individually checked.
      setChecked((prev) => {
        const parentOn = !!prev[parentName];
        const next = { ...prev };
        (payload.filters || []).forEach((c) => {
          if (next[c.name] === undefined) next[c.name] = parentOn;
        });
        return next;
      });
    });
  };

  // Merge loaded children into the filter tree (children shown under parents).
  const filterTree = useMemo(
    () =>
      active.filters.map((f) => {
        const loaded = loadedChildren[f.name];
        return loaded
          ? { ...f, children: loaded.filters.map((c) => c.name) }
          : f;
      }),
    [active.filters, loadedChildren]
  );

  // Apply the top filter bar selections (Line of Therapy / Stage / Country /
  // Phase) + cross-panel selections to the active option's rows.
  const topFilters = useContext(TopFiltersContext);
  const { selections: leftSelections } = useContext(LeftFiltersContext);
  const data = useMemo(() => {
    const { lineOfTherapy, cancerStage, country, phase } = topFilters;
    const matches = (arr, val) => !val || (Array.isArray(arr) && arr.includes(val));
    const phaseKey = PHASE_KEY[phase];

    // Cross-filter by the OTHER driving panels' selections (not this panel's
    // own — that's its checkboxes). ONLY the 3 driving panels take part; Control
    // Arms is fully independent. Untagged rows are kept.
    const DRIVING = ["backbone", "biomarker", "mode"];
    const crossMatch = (row) => {
      if (!DRIVING.includes(panelKey)) return true; // Control Arms: independent
      return DRIVING.every((k) => {
        if (k === panelKey) return true; // skip own panel
        const sel = leftSelections[k];
        if (!sel) return true; // that panel hasn't reported / no filter
        const rowVals = row[k];
        if (!Array.isArray(rowVals)) return true; // untagged row → keep
        return rowVals.some((v) => sel.includes(v));
      });
    };

    // A parent is represented by its SUB-CATEGORY bars, not an aggregate bar.
    // So once a parent's children are loaded, drop its aggregate row (else it
    // double-counts + shows a duplicate label). Keep the parent row only as a
    // placeholder while its children haven't loaded yet.
    const childRows = Object.values(loadedChildren).flatMap((c) => c.data || []);
    const parentRows = active.data.filter((row) => {
      const hasChildrenAvailable =
        active.childrenByParent && active.childrenByParent[row.name];
      const childrenLoaded = !!loadedChildren[row.name];
      // Leaf categories (no children) always keep their own bar.
      if (!hasChildrenAvailable) return true;
      // Parent with children: show its bar only until the children load.
      return !childrenLoaded;
    });
    const allRows = [...parentRows, ...childRows];

    return allRows
      .filter(
        (d) =>
          matches(d.lineOfTherapy, lineOfTherapy) &&
          matches(d.stage, cancerStage) &&
          matches(d.country, country) &&
          crossMatch(d)
      )
      .map((d) => {
        if (!phaseKey) return d;
        // A phase is selected — keep only that phase's segment in the stack.
        return {
          ...d,
          phase1: phaseKey === "phase1" ? d.phase1 : 0,
          phase2: phaseKey === "phase2" ? d.phase2 : 0,
          phase3: phaseKey === "phase3" ? d.phase3 : 0,
          phase4: phaseKey === "phase4" ? d.phase4 : 0,
        };
      });
  }, [active.data, active.childrenByParent, topFilters, loadedChildren, leftSelections, panelKey]);

  // Everything visible/checked by default for the active option.
  const [checked, setChecked] = useState(() => makeDefaultChecked(active.filters));

  // When the option changes, rebuild the checked map for the new filter set.
  useEffect(() => {
    setChecked(makeDefaultChecked(active.filters));
  }, [selectedOption]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload children for every parent that has sub-categories, so their
  // sub-category bars show at initial load (default-checked parents) without
  // the user having to expand the dropdown first.
  useEffect(() => {
    const byParent = active.childrenByParent || {};
    Object.keys(byParent).forEach((parent) => {
      handleExpandParent(parent);
    });
  }, [selectedOption, active.childrenByParent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle a checkbox. A PARENT category drives all its sub-categories:
  // checking it checks the parent bar + every sub-category (auto-loading them
  // if they haven't been fetched yet); unchecking clears them all. A leaf
  // sub-category toggles only itself.
  const toggle = (key) => {
    // Child names for this parent are known up-front from childrenByParent,
    // even before the lazy expand-load runs.
    const parentChildren =
      (active.childrenByParent &&
        active.childrenByParent[key] &&
        active.childrenByParent[key].filters.map((c) => c.name)) ||
      [];
    const isParent = parentChildren.length > 0;

    if (isParent) {
      // Match the derived checkbox the user sees: if children are loaded, base
      // the flip on whether they're all currently on (all on -> turn off, else
      // on). Before load, use the parent's own flag.
      const loaded = loadedChildren[key];
      const nextVal = loaded
        ? !parentChildren.every((c) => checked[c])
        : !checked[key];
      setChecked((prev) => {
        const next = { ...prev, [key]: nextVal };
        parentChildren.forEach((c) => {
          next[c] = nextVal;
        });
        return next;
      });
      // If turning ON and children aren't loaded yet, fetch them so their bars
      // actually render (they'll already be marked checked above).
      if (nextVal && !loadedChildren[key] && !loadingParents[key]) {
        handleExpandParent(key);
      }
      return;
    }

    // Leaf sub-category: flip only itself.
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleAll = (keys, value) =>
    setChecked((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = value));
      return next;
    });

  // Sort by total trials so the biggest bar shows first. The chart reverses
  // this list for top-to-bottom rendering, so sort ascending here → largest
  // ends up at the top.
  const visibleData = useMemo(() => {
    const total = (d) =>
      (d.phase1 || 0) + (d.phase2 || 0) + (d.phase3 || 0) + (d.phase4 || 0);
    return data
      .filter((d) => checked[d.name])
      .sort((a, b) => total(a) - total(b));
  }, [data, checked]);

  // Publish this panel's checked category names to the other charts + Efficacy
  // + Adverse Events (only the 3 driving panels; Control Arms has no panelKey).
  // Derived from `checked` (the user's intent) — NOT from the cross-filtered
  // data — so panels don't feed back into each other and loop.
  const { register } = useContext(LeftFiltersContext);
  const checkedNames = useMemo(
    () => Object.keys(checked).filter((k) => checked[k]),
    [checked]
  );
  useEffect(() => {
    if (panelKey && register) register(panelKey, checkedNames);
  }, [panelKey, register, checkedNames]);

  // Color map covers BOTH parents and their children, keyed off the stable
  // filter list (not the chart `data`, which drops a parent's aggregate row
  // once its children load — that left parent checkboxes without a color).
  // Every distinct key (parent, then its children) gets the next palette color
  // in sequence, so each checkbox AND each bar is a distinct palette color.
  const colorMap = useMemo(() => {
    const map = {};
    let i = 0;
    const assign = (name) => {
      if (map[name] === undefined) {
        map[name] = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
        i += 1;
      }
    };
    active.filters.forEach((f) => {
      assign(f.name);
      const children =
        (active.childrenByParent &&
          active.childrenByParent[f.name] &&
          active.childrenByParent[f.name].filters) ||
        [];
      children.forEach((c) => assign(c.name));
    });
    return map;
  }, [active.filters, active.childrenByParent]);

  // Use the option's headline total when unfiltered; otherwise let the chart
  // sum the (now reduced) visible rows so the pill reflects the filtered set.
  const anyTopFilter =
    topFilters.lineOfTherapy ||
    topFilters.cancerStage ||
    topFilters.country ||
    topFilters.phase;

  // Initial-load gate: parents-with-children preload their sub-category rows
  // asynchronously (see the preload effect above). Until every such parent has
  // finished loading, the chart would first paint the parent aggregate rows and
  // then swap them for child rows — a visible re-layout / label overlap flicker.
  // Hold the skeleton until that preload settles so the chart appears in one
  // finished state. `initialSettled` latches true once so later user-driven
  // expands don't re-trigger the skeleton.
  const [initialSettled, setInitialSettled] = useState(false);
  const parentsWithChildren = Object.keys(active.childrenByParent || {});
  const allChildrenLoaded = parentsWithChildren.every(
    (p) => loadedChildren[p]
  );
  useEffect(() => {
    if (allChildrenLoaded) setInitialSettled(true);
  }, [allChildrenLoaded]);
  // Reset the gate when the active option changes (its children reload).
  useEffect(() => {
    setInitialSettled(false);
  }, [selectedOption]);

  if (!initialSettled && !allChildrenLoaded) {
    return <FilteredPhaseBarSkeleton />;
  }

  return (
    <div style={{ display: "flex", width: "100%", flexWrap: "wrap", gap: 12 }}>
      <FilterPanel
        key={selectedOption}
        filterTree={filterTree}
        dropdownLabel={dropdownLabel}
        dropdownOptions={dropdownOptions}
        selectedField={selectedOption}
        onSelectField={handleSelectField}
        checked={checked}
        onToggle={toggle}
        onToggleAll={toggleAll}
        colorMap={colorMap}
        onExpandParent={handleExpandParent}
        loadingParents={loadingParents}
      />
      <div style={{ flex: 1, minWidth: 320 }}>
        <PhaseStackedBarChart
          title={chartTitle}
          scope={scope}
          visibleData={visibleData}
          colorMap={colorMap}
          xDomain={xDomain}
          xTicks={xTicks}
          negativeOffset={negativeOffset}
          fixedTotal={anyTopFilter ? undefined : active.totalArms}
          onOpenTable={onOpenTable}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   DATA — each panel section { defaultOption, byOption } comes from the
   treatment analytics API (see mapTreatmentDimensionToSection) and is passed
   straight into FilteredPhaseBarSection, which picks the active option's dataset.
   ============================================================================ */
function makeDefaultChecked(filters) {
  const out = {};
  filters.forEach((f) => {
    out[f.name] = true;
    (f.children || []).forEach((c) => (out[c] = false));
  });
  return out;
}

/* ============================================================================
   EFFICACY VS SAFETY — bubble/scatter chart
   ============================================================================ */
const TREATMENT_COLORS = {
  "IO + Chemotherapy": "#c0392b",
  IO: "#2f6f6f",
  Chemotherapy: "#e67e22",
  "Targeted Therapy": "#2980b9",
  Other: "#95a5a6",
};

/* Which data field + color palette to use for each "Color by" option */
const COLOR_BY_CONFIG = {
  "Color by Treatment Strategy": {
    field: "strategy",
    colors: {
      "IO + Chemotherapy": "#c0392b",
      IO: "#2f6f6f",
      Chemotherapy: "#e67e22",
      "Targeted Therapy": "#2980b9",
      Other: "#95a5a6",
    },
  },
  "Color by Biomarker / Target Strategy": {
    field: "biomarker",
    colors: {
      "PD-L1": "#8e44ad",
      EGFR: "#2980b9",
      KRAS: "#16a085",
      HER2: "#d35400",
      BRAF: "#c0392b",
      None: "#95a5a6",
    },
  },
  "Color by Mode of Administration": {
    field: "mode",
    colors: {
      IV: "#2666be",
      Oral: "#27ae60",
      SC: "#f39c12",
    },
  },
};

/* Efficacy vs Safety scatter tooltip — matches the Treatment tab's CustomTooltip:
   white 320px card, title, then N / ORR (Efficacy) / SAE (Safety) /
   Mode Of Administration rows in a two-column grid. */
function EfficacyTooltip({ active, payload, xMetric = "ORR", yMetric = "SAE" }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  if (!d) return null;

  const rowLabelStyle = { color: "rgba(0,0,0,0.6)" };
  const rowValueStyle = {
    color: "rgba(0,0,0,0.6)",
    justifySelf: "end",
    textAlign: "right",
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };

  const mode = Array.isArray(d.mode) ? d.mode.join(", ") : d.mode;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 8,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 16px 10px 16px",
        minWidth: 260,
        width: 320,
        maxWidth: 320,
        boxSizing: "border-box",
        fontFamily: "Rubik",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "rgba(0,0,0,1)",
          marginBottom: 10,
          fontFamily: "Rubik",
        }}
      >
        {d.name || "—"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px minmax(0, 1fr)",
          columnGap: 12,
          rowGap: 10,
          fontSize: 14,
          fontFamily: "Rubik",
          alignItems: "start",
        }}
      >
        <span style={rowLabelStyle}>N</span>
        <span style={rowValueStyle}>{d.n?.toLocaleString() ?? "—"}</span>

        <span style={rowLabelStyle}>{xMetric} (Efficacy)</span>
        {/* A point parked in the "not reported" lane must not show the lane
            coordinate as if it were a measurement. */}
        <span style={rowValueStyle}>{d.onlyY ? "Not reported" : `${d.orr ?? "—"}%`}</span>

        <span style={rowLabelStyle}>{yMetric} (Safety)</span>
        <span style={rowValueStyle}>{d.onlyX ? "Not reported" : (d.sae ?? "—")}</span>

        <span style={{ ...rowLabelStyle, lineHeight: "18px" }}>Mode Of Administration</span>
        <span style={{ ...rowValueStyle, justifySelf: "stretch", lineHeight: "18px" }}>
          {mode ?? "—"}
        </span>
      </div>
    </div>
  );
}

/* Small inline dropdown chip used in the Efficacy vs Safety header */
function Dropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderRadius: 4,
          border: "1px solid #e2e8f0",
          padding: "4px 8px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {value}
        <ChevronDown
          style={{
            height: 16,
            width: 16,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 0,
            zIndex: 20,
            minWidth: "100%",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {options.map((item) => (
            <div
              key={item}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                fontFamily: FONT,
                cursor: "pointer",
                color: "rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
                background: value === item ? "#f3f6fb" : "transparent",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Filter Efficacy/Adverse rows by the 3 left panels + the top filter bar.
 *
 * - Left panels: `selections` = { backbone:[names], biomarker:[names], mode:[names] }
 *   (or null when that panel hasn't reported / is showing everything). A row must
 *   match EVERY panel that currently has a selection. Matching is loose (either
 *   side contains the other) so "IO" matches "IO monotherapy".
 * - Top filters: lineOfTherapy / cancerStage / country matched against the row's
 *   attribute arrays when present.
 */
function filterByLeftAndTop(rows, selections = {}, topFilters = {}, scope = "experimental", isLive = false) {
  const loose = (a, b) => {
    const x = String(a || "").toLowerCase();
    const y = String(b || "").toLowerCase();
    return x && y && (x.includes(y) || y.includes(x));
  };
  const matchesPanel = (rowField, selected) =>
    !selected || selected.some((sel) => loose(rowField, sel));

  const { lineOfTherapy, cancerStage, country } = topFilters;
  const inArr = (arr, val) => !val || (Array.isArray(arr) && arr.includes(val));

  // Top filters apply to both scopes.
  const topOk = (r) =>
    inArr(r.lineOfTherapy, lineOfTherapy) &&
    inArr(r.stage, cancerStage) &&
    inArr(r.country, country);

  // Live API data is already filtered server-side by the request `filters`, and
  // its points aren't tagged with strategy/biomarker/mode for cross-panel
  // matching. So skip the left-panel cross-filter and return the rows as-is.
  if (isLive) return rows;

  if (scope === "control") {
    // Bottom pair: driven ONLY by the Control Arms panel (+ top filters).
    return rows.filter((r) => matchesPanel(r.strategy, selections.controlArms) && topOk(r));
  }

  // Top pair: driven by backbone/biomarker/mode panels (+ top filters).
  return rows.filter(
    (r) =>
      matchesPanel(r.strategy, selections.backbone) &&
      matchesPanel(r.biomarker, selections.biomarker) &&
      matchesPanel(r.mode, selections.mode) &&
      topOk(r)
  );
}

function EfficacyVsSafety({
  scope = "experimental", // controlled by the page-level arm toggle
  onOpenTable,
  liveData, // scatter rows from the API (empty until the query resolves)
  // Optional: when a caller's rows carry a `metrics` map, these drive the axis
  // dropdowns and let the axes actually re-plot. Without them the component
  // behaves exactly as before -- fixed ORR vs SAE, dropdowns relabel only.
  xOptions,
  yOptions,
  defaultX,
  defaultY,
  // Optional [{label, field}] -- lets a caller offer whatever grouping
  // dimensions its data actually carries instead of the static three.
  colorOptions,
  // Optional {"X|Y": armCount} used to annotate the axis dropdown labels.
  pairCounts,
}) {
  const colorChoices = colorOptions?.length
    ? colorOptions.map((c) => c.label)
    : efficacyfilter;
  const [colorBy, setColorBy] = useState(colorChoices[0]);
  const [xMetric, setXMetric] = useState(defaultX || "ORR");
  const [yMetric, setYMetric] = useState(defaultY || "SAE");

  // A caller-supplied option resolves to its own field; otherwise fall back to
  // the built-in COLOR_BY_CONFIG mapping.
  const config =
    (colorOptions || []).find((c) => c.label === colorBy) ||
    COLOR_BY_CONFIG[colorBy] ||
    COLOR_BY_CONFIG[efficacyfilter[0]];

  // Axis dropdown labels annotated with how many arms the pair would plot, e.g.
  // "AE (26)". pairCounts is supplied by the caller; without it the plain
  // metric names are used.
  const metricFromLabel = (label) => String(label).split(" (")[0];
  const countFor = (x, y) => pairCounts?.[`${x}|${y}`];
  const annotate = (metric, count) =>
    count == null ? metric : `${metric} (${count})`;
  const labelForX = (m) => annotate(m, countFor(m, yMetric));
  const labelForY = (m) => annotate(m, countFor(xMetric, m));
  const xLabels = (xOptions || ["ORR", "PFS", "OS", "DCR"]).map(labelForX);
  const yLabels = (yOptions || ["SAE", "AE", "Grade 3+", "Discontinuation"]).map(labelForY);

  // API data only — no mock fallback. Empty until the query resolves.
  const hasData = Array.isArray(liveData) && liveData.length > 0;

  // When rows carry a `metrics` map, the axis dropdowns re-plot: orr/sae are
  // re-read for the chosen pair and arms missing either metric are dropped
  // (a point needs both coordinates to mean anything). Rows without `metrics`
  // pass through untouched, preserving the original behaviour.
  const data = useMemo(() => {
    const rows = liveData || [];
    if (!rows.length || !rows[0]?.metrics) return rows;
    return rows
      .map((d) => {
        const x = d.metrics[xMetric];
        const y = d.metrics[yMetric];
        return {
          ...d,
          orr: x,
          sae: y,
          // A unit reporting only one of the two axes still belongs on the
          // chart. It is flagged so the tooltip can say the other metric is
          // unreported, rather than implying a measured zero.
          onlyX: x != null && y == null,
          onlyY: y != null && x == null,
        };
      })
      .filter((d) => d.orr != null || d.sae != null);
  }, [liveData, xMetric, yMetric]);

  // Points missing an axis are drawn in a thin "not reported" lane below the
  // plot rather than at 0, which would read as a measured value. Spread along
  // the lane so they do not stack into one blob.
  const laid = useMemo(() => {
    const partial = data.filter((d) => d.onlyX || d.onlyY);
    const step = partial.length > 1 ? 100 / (partial.length + 1) : 50;
    let i = 0;
    return data.map((d) => {
      if (!d.onlyX && !d.onlyY) return d;
      i += 1;
      return d.onlyX
        ? { ...d, sae: LANE }              // has X, no Y -> bottom lane
        : { ...d, orr: LANE, sae: d.sae ?? step * i };
    });
  }, [data]);

  // Driven by the relevant panels (see scope) + the top filter bar.
  const { selections } = useContext(LeftFiltersContext);
  const topFilters = useContext(TopFiltersContext);

  const filteredData = useMemo(
    () => filterByLeftAndTop(laid, selections, topFilters, scope, true),
    [laid, selections, topFilters, scope]
  );

  const groups = useMemo(() => {
    const byKey = {};
    filteredData.forEach((d) => {
      const key = d[config.field];
      byKey[key] = byKey[key] || [];
      byKey[key].push(d);
    });
    return byKey;
  }, [filteredData, config.field]);

  // Color map for the current "Color by" dimension — assign palette colors to
  // whatever distinct values are present (so any strategy/biomarker/mode value,
  // incl. "Unknown", gets a color).
  const colorFor = useMemo(() => {
    const keys = Object.keys(groups);
    const map = {};
    keys.forEach((key, i) => {
      map[key] = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
    });
    return (key) => map[key] || "#95a5a6";
  }, [groups]);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 544,
        flexDirection: "column",
        gap: 15,
        borderRadius: 8,
        border: "1px solid rgba(220,233,252,1)",
        background: "#ffffff",
        padding: 20,
        boxShadow: "4px 4px 20px 0px rgba(130,143,169,0.15)",
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "rgba(0,0,0,0.8)",
            margin: 0,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Efficacy vs Safety
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div
            onClick={onOpenTable}
            title="View trials"
            style={{
              display: "flex",
              height: 32,
              alignItems: "center",
              borderRadius: 4,
              border: "1px solid #dce9fc",
              padding: "0 8px",
              cursor: onOpenTable ? "pointer" : "default",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#2666be",
                whiteSpace: "nowrap",
              }}
            >
              {filteredData.length} Arms
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(0,0,0,0.6)" }}>
        <Dropdown options={colorChoices} value={colorBy} onChange={setColorBy} />
        {/* Axis options come from the data when the caller supplies them, so a
            metric no arm reports is never offered. Falls back to the original
            static lists when xOptions/yOptions are absent. */}
        {/* Labels carry the arm count for the resulting pair, so a combination
            that would plot almost nothing is visible before it is chosen. */}
        <Dropdown
          options={xLabels}
          value={labelForX(xMetric)}
          onChange={(v) => setXMetric(metricFromLabel(v))}
        />
        <Dropdown
          options={yLabels}
          value={labelForY(yMetric)}
          onChange={(v) => setYMetric(metricFromLabel(v))}
        />
      </div>
      {!hasData || !filteredData.length ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
            color: "rgba(0,0,0,0.4)",
            fontSize: 14,
          }}
        >
          {/* Distinguish "still loading" from "this metric pair has no arms" --
              showing Loading… forever for an empty combination reads as a bug. */}
          {!hasData
            ? "Loading…"
            : `No arms report both ${xMetric} and ${yMetric}. Try a different metric combination.`}
        </div>
      ) : (
      <>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#e8e8ec" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="sae"
            name="SAE"
            // Ascending left-to-right, starting at 0. ctsearch's original had
            // `reversed` (so lower SAE sat on the right) together with a
            // hardcoded domain of [0, 3], which suited its API's pre-normalised
            // 0-3 values. OncoSuite supplies a raw rate, so the fixed domain
            // pinned every point to one edge; "dataMax" scales to whatever the
            // data actually spans.
            domain={[LANE, "dataMax"]}
            allowDataOverflow={false}
            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.6)" }}
            label={{ value: yMetric, position: "insideBottom", offset: -10, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="orr"
            name="ORR"
            domain={[LANE, 100]}
            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.6)" }}
            label={{ value: `${xMetric} (%)`, angle: -90, position: "insideLeft", fontSize: 12 }}
          />
          <ZAxis type="number" dataKey="n" range={[80, 700]} />
          <Tooltip
            content={<EfficacyTooltip xMetric={xMetric} yMetric={yMetric} />}
            cursor={{ strokeDasharray: "3 3" }}
            isAnimationActive={false}
          />
          {Object.entries(groups).map(([key, points]) => (
            <Scatter
              key={key}
              name={key}
              data={points}
              fill={colorFor(key)}
              fillOpacity={0.85}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend — one swatch per group in the current "Color by" dimension */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, paddingTop: 4 }}>
        {Object.keys(groups).map((key) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                height: 10,
                width: 10,
                borderRadius: 9999,
                backgroundColor: colorFor(key),
              }}
            />
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.6)" }}>{key}</span>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}

/* ============================================================================
   ADVERSE EVENTS — expandable table
   ============================================================================ */
// No live AE endpoint yet — rendered as `comingSoon` (blurred, no rows).
const ADVERSE_EVENTS_DATA = [];
const CONTROL_ADVERSE_EVENTS_DATA = [];

const AE_GRID = "1fr 140px 140px";

function AdverseEvents({ totalArms = 172, scope = "experimental", comingSoon = false }) {
  const [expanded, setExpanded] = useState({});

  // Pick the dataset that matches the (page-level) scope.
  const sourceData = scope === "control" ? CONTROL_ADVERSE_EVENTS_DATA : ADVERSE_EVENTS_DATA;
  // Figma labels the pill just "N Arms" (Bug 816) — the longer
  // "N Experimental Arms" wrapped and overlapped the chart controls.
  const armsNoun = "Arms";

  // Reacts to the relevant panels (see scope) + top filters, like Efficacy.
  // (Mock rows aren't attributed, so real filtering happens once the backend
  //  returns AE rows carrying strategy/biomarker/mode/attribute fields.)
  const { selections } = useContext(LeftFiltersContext);
  const topFilters = useContext(TopFiltersContext);
  const filteredData = useMemo(
    () => filterByLeftAndTop(sourceData, selections, topFilters, scope),
    [sourceData, selections, topFilters, scope]
  );
  const data = filteredData;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 544,
        flexDirection: "column",
        gap: 15,
        borderRadius: 8,
        border: "1px solid rgba(220,233,252,1)",
        background: "#ffffff",
        padding: 20,
        boxShadow: "4px 4px 20px 0px rgba(130,143,169,0.15)",
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "rgba(0,0,0,0.8)",
            margin: 0,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Adverse Events
        </h3>
        {!comingSoon && (
          <div
            style={{
              borderRadius: 4,
              border: "1px solid #dce9fc",
              padding: "4px 8px",
              fontSize: 12,
              fontWeight: 500,
              color: "#2666be",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {totalArms} {armsNoun}
          </div>
        )}
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {/* Table body — blurred + non-interactive when the feature isn't ready */}
        <div
          style={{
            height: "100%",
            overflowY: comingSoon ? "hidden" : "auto",
            filter: comingSoon ? "blur(3px)" : "none",
            opacity: comingSoon ? 0.55 : 1,
            pointerEvents: comingSoon ? "none" : "auto",
            userSelect: comingSoon ? "none" : "auto",
          }}
        >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: AE_GRID,
            gap: 8,
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: 8,
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(0,0,0,0.5)",
          }}
        >
          <span>Type of adverse event</span>
          <span>AE 1+2</span>
          <span>SAE 3+</span>
        </div>
        {data.map((row) => {
          const hasChildren = row.children && row.children.length > 0;
          const isOpen = expanded[row.name];
          return (
            <div key={row.name}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: AE_GRID,
                  alignItems: "center",
                  gap: 8,
                  borderBottom: "1px solid #f8fafc",
                  padding: "8px 0",
                  fontSize: 14,
                }}
              >
                <button
                  onClick={() =>
                    hasChildren &&
                    setExpanded((e) => ({ ...e, [row.name]: !e[row.name] }))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                    color: "rgba(0,0,0,0.8)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: hasChildren ? "pointer" : "default",
                    fontSize: 14,
                    fontFamily: FONT,
                  }}
                >
                  {hasChildren ? (
                    isOpen ? (
                      <ChevronDown style={{ height: 16, width: 16, color: "rgba(0,0,0,0.4)" }} />
                    ) : (
                      <ChevronRight style={{ height: 16, width: 16, color: "rgba(0,0,0,0.4)" }} />
                    )
                  ) : (
                    <span style={{ width: 16 }} />
                  )}
                  {row.name}
                </button>
                <span style={{ color: "rgba(0,0,0,0.7)" }}>{row.ae12}</span>
                <span style={{ color: "rgba(0,0,0,0.7)" }}>{row.sae3}</span>
              </div>
              {hasChildren &&
                isOpen &&
                row.children.map((child) => (
                  <div
                    key={child.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: AE_GRID,
                      alignItems: "center",
                      gap: 8,
                      borderBottom: "1px solid #f8fafc",
                      padding: "8px 0",
                      paddingLeft: 24,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "rgba(0,0,0,0.7)" }}>{child.name}</span>
                    <span style={{ color: "rgba(0,0,0,0.7)" }}>{child.ae12}</span>
                    <span style={{ color: "rgba(0,0,0,0.7)" }}>{child.sae3}</span>
                  </div>
                ))}
            </div>
          );
        })}
        </div>

        {comingSoon && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(1px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 9999,
                background: "#ffffff",
                border: "1px solid rgba(220,233,252,1)",
                boxShadow: "0 6px 20px rgba(130,143,169,0.25)",
                fontSize: 14,
                fontWeight: 500,
                color: "#2666be",
              }}
            >
              <span
                style={{
                  height: 8,
                  width: 8,
                  borderRadius: 9999,
                  background: "#2666be",
                }}
              />
              Coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   TOP FILTER BAR — Line of Therapy / Phase / Cancer Stage / Country.
   Mirrors the top filters in TreatmentTab, positioned above the charts.
   ============================================================================ */
function TopFilterBar({ filters, setFilter, metrics }) {
  const { lineOfTherapy, phase, cancerStage, country } = filters;
  const setLineOfTherapy = (v) => setFilter("lineOfTherapy", v);
  const setPhase = (v) => setFilter("phase", v);
  const setCancerStage = (v) => setFilter("cancerStage", v);
  const setCountry = (v) => setFilter("country", v);

  // Options come from the API metrics only (empty until the query resolves).
  // Accept the first present key among a few plausible names — the phase
  // metric in particular comes back under `phases` (plural), matching the
  // filter payload key, not `phase`. Values may be strings, objects
  // ({label/value/name/title}) or an { option: count } map, so normalize to a
  // plain string list before handing them to FilterSelect.
  const opt = (...vals) => {
    const raw = vals.find(
      (v) =>
        (Array.isArray(v) && v.length > 0) ||
        (v && typeof v === "object" && Object.keys(v).length > 0)
    );
    return normalizeMetricOptionList(raw);
  };
  const options = {
    lineOfTherapy: opt(metrics?.line_of_therapy, metrics?.line_intent),
    phase: opt(metrics?.phases, metrics?.phase),
    cancerStage: opt(metrics?.cancer_stage, metrics?.stage),
    country: opt(metrics?.countries, metrics?.locations, metrics?.country),
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "4px 0",
      }}
    >
      <FilterSelect
        value={lineOfTherapy}
        onChange={(e) => setLineOfTherapy(e.target.value)}
        placeholder="Line of Therapy"
        options={options.lineOfTherapy}
        onClear={() => setLineOfTherapy("")}
      />
      <FilterSelect
        value={phase}
        onChange={(e) => setPhase(e.target.value)}
        placeholder="Phase"
        options={options.phase}
        onClear={() => setPhase("")}
      />
      <FilterSelect
        value={cancerStage}
        onChange={(e) => setCancerStage(e.target.value)}
        placeholder="Cancer Stage"
        options={options.cancerStage}
        onClear={() => setCancerStage("")}
      />
      <FilterSelect
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="Country"
        searchable
        typeahead
        menuWidth={260}
        searchPlaceholder="Search country"
        options={options.country}
        onClear={() => setCountry("")}
      />
    </div>
  );
}

/* ============================================================================
   FULL DASHBOARD — every section, assembled from the shared components
   above purely by passing different props/data
   ============================================================================ */
export default function TreatmentBackboneDashboard({ sessionKey = "" }) {
  const [topFilters, setTopFilters] = useState({
    lineOfTherapy: "",
    phase: "",
    cancerStage: "",
    country: "",
  });
  const setFilter = (key, value) =>
    setTopFilters((prev) => ({ ...prev, [key]: value }));

  // Global Experimental vs Control arm scope. The three top charts are
  // inter-connected and users think in one mode at a time, so a single
  // page-level toggle drives every chart rather than a per-chart switch.
  const [scope, setScope] = useState("experimental");

  // Map top-bar selections -> API filter arrays. Empty values are pruned by
  // the API layer's normalizer, so blank filters just send [].
  // Which dimension each dimension-driven graph is grouped by. Sourced from the
  // API's metrics.dimension_type list; the selected raw key is echoed back to
  // the API as treatment_dimension_type / biomarker_dimension_type. Empty ""
  // lets the backend use its own default until the user picks one.
  const [treatmentDimType, setTreatmentDimType] = useState("");
  const [biomarkerDimType, setBiomarkerDimType] = useState("");

  const treatmentApiFilters = useMemo(
    () => ({
      line_intent: topFilters.lineOfTherapy ? [topFilters.lineOfTherapy] : [],
      phases: topFilters.phase ? [topFilters.phase] : [],
      stage: topFilters.cancerStage ? [topFilters.cancerStage] : [],
      locations: topFilters.country ? [topFilters.country] : [],
      // Raw dimension keys the graphs are grouped by (blank = backend default).
      treatment_dimension_type: treatmentDimType || "",
      biomarker_dimension_type: biomarkerDimType || "",
    }),
    [topFilters, treatmentDimType, biomarkerDimType]
  );

  // Single request for all four graphs — the API accepts a `graph` array and
  // returns each key on the same envelope, so one call feeds every chart.
  const { data: treatmentResp } = useTreatmentAnalyticsQuery({
    session_key: sessionKey,
    graph: [
      "treatment_dimension",
      "biomarker_dimension",
      "mode_of_administration",
      "efficacy_vs_safety_scatter",
    ],
    filters: treatmentApiFilters,
    enabled: !!sessionKey,
  });

  // Response envelope: { treatment_dimension, biomarker_dimension,
  // mode_of_administration, efficacy_vs_safety_scatter, session_key, metrics }.
  // The shared top-level `metrics` block carries the top-filter option lists
  // AND the dimension_type list. Try the top level first (where the API puts
  // it), then a couple of fallbacks, unwrapping a nested `.metrics` wrapper.
  // Shared top-filter metrics (Line of Therapy / Phase / Stage / Country) —
  // ONLY from the true shared block, never a per-graph metrics, so it can't be
  // confused with a graph's own dimension_type list.
  const apiMetrics = useMemo(() => {
    if (!treatmentResp) return null;
    const raw = treatmentResp.metrics || treatmentResp.payload?.metrics || null;
    if (!raw) return null;
    return raw.metrics || raw;
  }, [treatmentResp]);

  // Dimension-type options (raw keys) driving each panel's dropdown. The
  // choice is echoed back as treatment_dimension_type / biomarker_dimension_type.
  // Each graph carries its OWN dimension_type list under its metrics (backbone
  // gets its own set, biomarker gets ["biomarker","target"]); fall back to the
  // shared top-level metrics.dimension_type if a graph doesn't carry its own.
  // Each graph carries its OWN dimension_type list under <graph>.by_phase.metrics
  // (same nesting the mapper reads chart/points from). Read ONLY that per-graph
  // list — no shared/top-level fallback, so the two dropdowns stay distinct
  // (backbone's set vs biomarker's ["biomarker","target"]).
  // The per-graph dimension_type list can be nested a few different ways
  // depending on the backend. Search the plausible locations and take the first
  // dimension_type found within THIS graph object (never the shared top-level),
  // so backbone and biomarker each get their own distinct list.
  const readGraphDimTypes = (graph) => {
    if (!graph || typeof graph !== "object") return [];
    const candidates = [
      graph.dimension_type,
      graph.metrics?.dimension_type,
      graph.by_phase?.dimension_type,
      graph.by_phase?.metrics?.dimension_type,
      graph.by_phase?.chart?.metrics?.dimension_type,
      graph.by_phase?.chart?.dimension_type,
      graph.chart?.metrics?.dimension_type,
    ];
    const found = candidates.find(
      (c) =>
        (Array.isArray(c) && c.length > 0) ||
        (c && typeof c === "object" && Object.keys(c).length > 0)
    );
    return normalizeMetricOptionList(found);
  };
  const treatmentDimTypes = useMemo(
    () => readGraphDimTypes(treatmentResp?.treatment_dimension),
    [treatmentResp]
  );
  const biomarkerDimTypes = useMemo(
    () => readGraphDimTypes(treatmentResp?.biomarker_dimension),
    [treatmentResp]
  );

  // TEMP DEBUG — print the FULL treatment/biomarker graph objects so we can see
  // exactly where dimension_type lives. Expand these in the console.
  useEffect(() => {
    if (!treatmentResp) return;
    console.log("FULL treatment_dimension =", treatmentResp.treatment_dimension);
    console.log("FULL biomarker_dimension =", treatmentResp.biomarker_dimension);
    console.log("FULL top-level metrics =", treatmentResp.metrics);
  }, [treatmentResp]);

  // The raw key actually in effect for each graph (selected, else default).
  const activeTreatmentDim =
    treatmentDimType || (treatmentDimTypes.includes("backbone") ? "backbone" : treatmentDimTypes[0]) || "backbone";
  const activeBiomarkerDim =
    biomarkerDimType || (biomarkerDimTypes.includes("biomarker") ? "biomarker" : biomarkerDimTypes[0]) || "biomarker";

  // ── Graph 1: Top Backbones (treatment_dimension) ──────────────────────
  const backboneSection = useMemo(() => {
    const td = treatmentResp?.treatment_dimension;
    if (!td) return null;
    return mapTreatmentDimensionToSection(td, dimensionKeyToLabel(activeTreatmentDim));
  }, [treatmentResp, activeTreatmentDim]);

  // ── Graph 2: Top Biomarkers (biomarker_dimension) ─────────────────────
  const biomarkerSection = useMemo(() => {
    const bd = treatmentResp?.biomarker_dimension;
    if (!bd) return null;
    return mapTreatmentDimensionToSection(bd, dimensionKeyToLabel(activeBiomarkerDim));
  }, [treatmentResp, activeBiomarkerDim]);

  // ── Graph 3: Mode of Administration (mode_of_administration) ──────────
  const modeSection = useMemo(() => {
    const md = treatmentResp?.mode_of_administration;
    if (!md) return null;
    return mapTreatmentDimensionToSection(md, "Mode of Administration");
  }, [treatmentResp]);

  // ── Graph 4: Efficacy vs Safety (efficacy_vs_safety_scatter) ──────────
  const efficacyScatter = useMemo(() => {
    const ed = treatmentResp?.efficacy_vs_safety_scatter;
    if (!ed) return null;
    return mapEfficacyVsSafetyToScatter(ed);
  }, [treatmentResp]);

  // Trial-table drawer: holds the graph key (backbone/biomarker/mode/controlArms)
  // whose columns + rows will come from the trials API; null when closed.
  // No live trials endpoint yet, so there is no data to show.
  const [tableKey, setTableKey] = useState(null);
  const openTable = (key) => setTableKey(key);
  const closeTable = () => setTableKey(null);
  const tableData = null;

  // Left-panel selections. backbone/biomarker/mode drive the TOP Efficacy/AE
  // pair; controlArms drives the BOTTOM pair only.
  const [leftSelections, setLeftSelections] = useState({
    backbone: null,
    biomarker: null,
    mode: null,
    controlArms: null,
  });
  const registerLeft = useCallback((panelKey, names) => {
    setLeftSelections((prev) => {
      const prevNames = prev[panelKey];
      // Skip state update if unchanged (avoids render loops).
      if (
        prevNames &&
        prevNames.length === names.length &&
        prevNames.every((n, i) => n === names[i])
      ) {
        return prev;
      }
      return { ...prev, [panelKey]: names };
    });
  }, []);
  const leftContextValue = useMemo(
    () => ({ register: registerLeft, selections: leftSelections }),
    [registerLeft, leftSelections]
  );

  return (
    <LeftFiltersContext.Provider value={leftContextValue}>
    <TopFiltersContext.Provider value={topFilters}>
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: 12,
        background: "#f9fbff",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      {/* Page-level arm switch — one control for the whole view, since the
          charts are inter-connected and users look at experimental OR control
          arms as a single mode. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <TopFilterBar filters={topFilters} setFilter={setFilter} metrics={apiMetrics} />
        <ArmScopeSelect value={scope} onChange={setScope} />
      </div>

      {backboneSection ? (
        <FilteredPhaseBarSection
          chartTitle={dimensionKeyToLabel(activeTreatmentDim)}
          scope={scope}
          dropdownLabel="Dimension"
          dropdownOptions={
            treatmentDimTypes.length
              ? treatmentDimTypes.map(dimensionKeyToLabel)
              : [backboneSection.defaultOption]
          }
          onSelectDimension={(label) =>
            setTreatmentDimType(dimensionLabelToKey(label, treatmentDimTypes))
          }
          section={backboneSection}
          controlSection={null}
          xDomain={[0, 400]}
          xTicks={[0, 50, 100, 150, 200, 250, 300, 350, 400]}
          panelKey="backbone"
          onOpenTable={() => openTable(scope === "control" ? "controlArms" : "backbone")}
        />
      ) : (
        <FilteredPhaseBarSkeleton />
      )}

      {biomarkerSection ? (
        <FilteredPhaseBarSection
          chartTitle={dimensionKeyToLabel(activeBiomarkerDim)}
          scope={scope}
          dropdownLabel="Dimension"
          dropdownOptions={
            biomarkerDimTypes.length
              ? biomarkerDimTypes.map(dimensionKeyToLabel)
              : [biomarkerSection.defaultOption]
          }
          onSelectDimension={(label) =>
            setBiomarkerDimType(dimensionLabelToKey(label, biomarkerDimTypes))
          }
          section={biomarkerSection}
          controlSection={null}
          panelKey="biomarker"
          onOpenTable={() => openTable(scope === "control" ? "controlArms" : "biomarker")}
        />
      ) : (
        <FilteredPhaseBarSkeleton />
      )}

      {modeSection ? (
        <FilteredPhaseBarSection
          chartTitle="Mode of Administration"
          scope={scope}
          dropdownLabel={null}
          section={modeSection}
          controlSection={null}
          panelKey="mode"
          onOpenTable={() => openTable(scope === "control" ? "controlArms" : "mode")}
        />
      ) : (
        <FilteredPhaseBarSkeleton />
      )}

      <div
        style={{
          display: "grid",
          width: "100%",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 12,
        }}
      >
        <EfficacyVsSafety
          scope={scope}
          liveData={efficacyScatter}
          onOpenTable={() => openTable(scope === "control" ? "controlArms" : "backbone")}
        />
        <AdverseEvents comingSoon scope={scope} />
      </div>
    </div>

    {/* Trial-table drawer — opened by clicking a chart's "N Arms"
        pill. Columns + rows will be graph-specific, driven by the trials API.
        No live trials endpoint yet, so the body shows a loading state. */}
    <CommonRightDrawer
      open={!!tableKey}
      onClose={closeTable}
      onBack={closeTable}
      width={760}
      contentSx={{ pt: 0 }}
      title={tableData?.title}
      rightHeader={
        tableData ? (
          <DownloadCsvButton
            onClick={() =>
              downloadTrialsCsv({
                title: tableData.title,
                columns: tableData.columns,
                rows: tableData.rows,
              })
            }
          />
        ) : null
      }
    >
      {tableData ? (
        <TrialsTableView
          hideHeader
          title={tableData.title}
          columns={tableData.columns}
          rows={tableData.rows}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 0",
            color: "rgba(0,0,0,0.4)",
            fontSize: 14,
            fontFamily: FONT,
          }}
        >
          Loading…
        </div>
      )}
    </CommonRightDrawer>
    </TopFiltersContext.Provider>
    </LeftFiltersContext.Provider>
  );
}

export {
  FilteredPhaseBarSection,
  PhaseStackedBarChart,
  FilterPanel,
  EfficacyVsSafety,
  AdverseEvents,
};
