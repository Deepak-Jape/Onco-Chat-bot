import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  Typography, Checkbox, FormControlLabel,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Popper,
  Paper,
  ClickAwayListener,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CustomDateRangeCalender from "./CustomDateRangeCalendar";

dayjs.extend(customParseFormat);

// Preset options for study_start_date checkboxes
const DATE_PRESETS = [
  { label: "Last 12mo", months: 12 },
  { label: "Last 2yr", months: 24 },
  { label: "Last 5yr", months: 60 },
];

// Custom picker icon (exact tint per Figma when a date is selected)
const CustomDatePickerIcon = ({ active = false, style, ...props }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    {...props}
  >
    <path
      d="M4.66667 0V1.33333H8.66667V0H10V1.33333H12.6667C13.0349 1.33333 13.3333 1.63181 13.3333 2V12.6667C13.3333 13.0349 13.0349 13.3333 12.6667 13.3333H0.666667C0.29848 13.3333 0 13.0349 0 12.6667V2C0 1.63181 0.29848 1.33333 0.666667 1.33333H3.33333V0H4.66667ZM12 6.66667H1.33333V12H12V6.66667ZM6 8V10.6667H2.66667V8H6ZM3.33333 2.66667H1.33333V5.33333H12V2.66667H10V4H8.66667V2.66667H4.66667V4H3.33333V2.66667Z"
      fill={active ? "rgba(38, 102, 190, 1)" : "rgba(0, 0, 0, 0.4)"}
    />
  </svg>
);

const useStyles = makeStyles(() => ({
  label: {
    color: "#00000099",
    fontFamily: "Rubik !important",
    fontSize: "14px !important",
    fontWeight: "500 !important",
    textAlign: "left",
    marginBottom: "8px",
    marginTop: "4px",
  },
  picker_container: {
    display: "flex",
    gap: "10px",
    width: "100%",
    flexDirection: "row",
  },
  // ── NEW: wrapper for the checkbox list ──────────────────────────────────────
  checkbox_group: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "8px",
    gap: "2px",
  },
  // ── NEW: individual checkbox label ──────────────────────────────────────────
  checkbox_label: {
    "& .MuiFormControlLabel-label": {
      fontFamily: "Rubik !important",
      fontSize: "13px !important",
      color: "#00000099",
    },
  },
}));

export default function DatePickerBlock({
  label,
  value = {},
  onChange,
  keys,
  accordionExpanded,
  onAccordionChange,
}) {
  // debugger
  const classes = useStyles();
  const [isExpandMore, setIsExpandMore] = useState(false);
  const anchorRef = useRef(null);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [activeCalendarField, setActiveCalendarField] = useState("from"); // 'from' | 'to'
  const lastFieldIntentAtRef = useRef(0);
  const isAccordionControlled = typeof accordionExpanded === "boolean";
  const expanded = isAccordionControlled ? accordionExpanded : isExpandMore;

  // ── NEW: track which preset (if any) is currently selected ─────────────────
  // Tracks { label, status } where status = 'included' | 'excluded' | null
  const [activePreset, setActivePreset] = useState(
    value.selected_range
      ? { label: value.selected_range.label, status: value.type ?? 'included' }
      : null
  );

  const getNextStatus = (current) => {
    if (!current) return 'included';           // 1st click
    if (current === 'included') return 'excluded'; // 2nd click
    return null;                               // 3rd click → reset
  };

  const minKey = keys?.[0];
  const maxKey = keys?.[1];

  const rangeValue = useMemo(() => {
    const startDate = value?.[minKey]
      ? dayjs(value[minKey], "DD-MM-YYYY").toDate()
      : new Date();

    // If only "From" is set, keep the calendar selection as a single-day range
    // instead of stretching to today's date.
    const endDate = value?.[maxKey]
      ? dayjs(value[maxKey], "DD-MM-YYYY").toDate()
      : (value?.[minKey]
        ? dayjs(value[minKey], "DD-MM-YYYY").toDate()
        : new Date());

    return [
      {
        startDate,
        endDate,
        key: "selection",
      },
    ];
  }, [value, minKey, maxKey]);

  const computeLabel = (fromDDMMYYYY, toDDMMYYYY) => {
    const fromLabel = fromDDMMYYYY
      ? dayjs(fromDDMMYYYY, "DD-MM-YYYY").format("D MMM YY")
      : null;
    const toLabel = toDDMMYYYY
      ? dayjs(toDDMMYYYY, "DD-MM-YYYY").format("D MMM YY")
      : null;

    let computedLabel = label;
    if (label === "Study Start" || label === "Primary Completion") {
      const label_split = label.split(" ")[0];
      if (fromLabel && toLabel) computedLabel = `${label_split}: ${fromLabel} - ${toLabel}`;
      else if (fromLabel) computedLabel = `${label_split}: ${fromLabel}`;
      else if (toLabel) computedLabel = `${label_split}: ${toLabel}`;
    }

    return computedLabel;
  };

  const handleChange = (key) => (newValue) => {
    if (!newValue) return;

    const date = newValue.format("DD-MM-YYYY");
    const labelDate = newValue.format("D MMM YY");

    // Get the other date (already stored in value)
    const fromLabel = key === minKey
      ? labelDate  // current change is the from date
      : value[minKey] ? dayjs(value[minKey], "DD-MM-YYYY").format("D MMM YY") : null;

    const toLabel = key === maxKey
      ? labelDate  // current change is the to date
      : value[maxKey] ? dayjs(value[maxKey], "DD-MM-YYYY").format("D MMM YY") : null;

    // Build label based on what's available
    let computedLabel = label;
    if (label === 'Study Start' || label === "Primary Completion") {
      const label_split = label.split(" ")[0];
      if (fromLabel && toLabel) {
        computedLabel = `${label_split}: ${fromLabel} - ${toLabel}`;  // both present
      } else if (fromLabel) {
        computedLabel = `${label_split}: ${fromLabel}`;               // only from
      } else if (toLabel) {
        computedLabel = `${label_split}: ${toLabel}`;                 // only to
      }
    }

    setActivePreset(null); // clear preset when manually entering dates

    onChange?.({
      ...value,
      [key]: date,
      selected_range: null,
      type: 'included',
      label: computedLabel,
      label_key: label,
    });
  };

  const handleRangeSelect = (selection) => {
    if (!selection?.startDate && !selection?.endDate) return;

    setActivePreset(null);

    const startDDMMYYYY = selection?.startDate
      ? dayjs(selection.startDate).format("DD-MM-YYYY")
      : null;
    const endDDMMYYYY = selection?.endDate
      ? dayjs(selection.endDate).format("DD-MM-YYYY")
      : null;

    const pickNonNull = (...vals) => vals.find(Boolean) ?? null;

    const hasFrom = Boolean(value?.[minKey]);
    const hasTo = Boolean(value?.[maxKey]);

    const currentFrom = hasFrom ? dayjs(value[minKey], "DD-MM-YYYY", true) : null;
    const currentTo = hasTo ? dayjs(value[maxKey], "DD-MM-YYYY", true) : null;

    const commit = (from, to, nextType = "included") => {
      onChange?.({
        ...value,
        [minKey]: from ?? null,
        [maxKey]: to ?? null,
        selected_range: null,
        type: nextType,
        label: computeLabel(from ?? null, to ?? null),
        label_key: label,
      });
    };

    // Case A: both set -> edit active side (From/To).
    // Extra rule: clicking exactly on the active boundary clears that boundary.
    if (hasFrom && hasTo && currentFrom?.isValid() && currentTo?.isValid()) {
      const startSameAsCurrent = startDDMMYYYY === value[minKey];
      const endSameAsCurrent = endDDMMYYYY === value[maxKey];

      // If user clicked the current boundary day, `react-date-range` may report no change
      // (start/end stay the same). In that case, infer intent from which field the user
      // opened the calendar from (From/To icon).
      const inferredClickedDDMMYYYY =
        activeCalendarField === "from" ? value[minKey] : value[maxKey];

      // If one side changed while the other stayed, treat the changed side as the click.
      const clickedDDMMYYYY = (() => {
        if (startDDMMYYYY && !startSameAsCurrent && endSameAsCurrent) return startDDMMYYYY;
        if (endDDMMYYYY && !endSameAsCurrent && startSameAsCurrent) return endDDMMYYYY;
        // If both changed (react-date-range can do this when starting a new selection),
        // treat the clicked date as the side the user is editing.
        if (startDDMMYYYY && endDDMMYYYY && !startSameAsCurrent && !endSameAsCurrent) {
          // When both become the same new day, it's definitely the clicked day.
          if (startDDMMYYYY === endDDMMYYYY) return startDDMMYYYY;
          return activeCalendarField === "from" ? startDDMMYYYY : endDDMMYYYY;
        }
        // Otherwise fall back to the inferred boundary (enables boundary-click clearing).
        return inferredClickedDDMMYYYY;
      })();

      const clicked = dayjs(clickedDDMMYYYY, "DD-MM-YYYY", true);
      if (!clicked.isValid()) return;

      // If user clicks directly on the current start/end day, clear that side.
      // (If both are the same day, clear both.)
      if (clickedDDMMYYYY === value[minKey] && clickedDDMMYYYY === value[maxKey]) {
        commit(null, null, null);
        return;
      }
      if (clickedDDMMYYYY === value[minKey]) {
        commit(null, value[maxKey], null);
        return;
      }
      if (clickedDDMMYYYY === value[maxKey]) {
        commit(value[minKey], null, null);
        return;
      }

      // Decide which side to edit:
      // - Prefer the field the user interacted with (From/To input)
      // - If ambiguous (calendar was already open), pick the closest boundary
      //   so changing end (e.g. 31 -> 20) works even if user didn't click "To" first.
      const distanceToFrom = Math.abs(clicked.diff(currentFrom, "day"));
      const distanceToTo = Math.abs(clicked.diff(currentTo, "day"));
      const inferredEditingFrom = distanceToFrom <= distanceToTo;

      const hasRecentExplicitIntent = Date.now() - lastFieldIntentAtRef.current < 2000;
      const editingFrom = hasRecentExplicitIntent
        ? activeCalendarField === "from"
        : inferredEditingFrom;

      const rawFrom = editingFrom ? clicked : currentFrom;
      const rawTo = editingFrom ? currentTo : clicked;
      const swapped = rawFrom.isAfter(rawTo);
      const from = swapped ? rawTo.format("DD-MM-YYYY") : rawFrom.format("DD-MM-YYYY");
      const to = swapped ? rawFrom.format("DD-MM-YYYY") : rawTo.format("DD-MM-YYYY");
      commit(from, to, "included");
      return;
    }

    // Case B: only From set -> second click sets To (or clears if same day).
    if (hasFrom && !hasTo && currentFrom?.isValid()) {
      const clickedDDMMYYYY = (() => {
        if (endDDMMYYYY && endDDMMYYYY !== startDDMMYYYY) return endDDMMYYYY;
        return pickNonNull(startDDMMYYYY, endDDMMYYYY);
      })();
      if (!clickedDDMMYYYY) return;
      const clicked = dayjs(clickedDDMMYYYY, "DD-MM-YYYY", true);
      if (!clicked.isValid()) return;

      if (clickedDDMMYYYY === value[minKey]) {
        commit(null, null, null);
        return;
      }
      const swapped = clicked.isBefore(currentFrom);
      const from = swapped ? clickedDDMMYYYY : value[minKey];
      const to = swapped ? value[minKey] : clickedDDMMYYYY;
      commit(from, to, "included");
      return;
    }

    // Case C: only To set -> next click sets From (or clears if same day).
    if (!hasFrom && hasTo && currentTo?.isValid()) {
      const clickedDDMMYYYY = (() => {
        if (endDDMMYYYY && endDDMMYYYY !== startDDMMYYYY) return endDDMMYYYY;
        return pickNonNull(startDDMMYYYY, endDDMMYYYY);
      })();
      if (!clickedDDMMYYYY) return;
      const clicked = dayjs(clickedDDMMYYYY, "DD-MM-YYYY", true);
      if (!clicked.isValid()) return;

      if (clickedDDMMYYYY === value[maxKey]) {
        commit(null, null, null);
        return;
      }
      const swapped = clicked.isAfter(currentTo);
      const from = swapped ? value[maxKey] : clickedDDMMYYYY;
      const to = swapped ? clickedDDMMYYYY : value[maxKey];
      commit(from, to, "included");
      return;
    }

    // Case D: neither set -> first click sets From only.
    {
      const clickedDDMMYYYY = pickNonNull(startDDMMYYYY, endDDMMYYYY);
      if (!clickedDDMMYYYY) return;
      commit(clickedDDMMYYYY, null, "included");
    }
  };

  // (old implementation removed)

  // ── NEW: handle checkbox selection ──────────────────────────────────────────
  const handlePresetChange = (preset) => {
    const isSamePreset = activePreset?.label === preset.label;
    const currentStatus = isSamePreset ? activePreset.status : null;
    const nextStatus = getNextStatus(currentStatus);

    if (nextStatus === null) {
      // 3rd click → reset
      setActivePreset(null);
      onChange?.({
        ...value,
        [minKey]: null,
        [maxKey]: null,
        selected_range: null,
        type: null,
        label: label,
        label_key: label,
      });
    } else {
      // 1st click (new preset) → replaces previous, starts as included
      // 2nd click (same preset) → flips to excluded
      setActivePreset({ label: preset.label, status: nextStatus });

      const today = dayjs();
      const fromDate = today.subtract(preset.months, 'month');
      const label_split = label.split(" ")[0];
      onChange?.({
        ...value,
        [minKey]: fromDate.format('DD-MM-YYYY'),
        [maxKey]: today.format('DD-MM-YYYY'),
        selected_range: preset,
        type: nextStatus,                  // ✅ 'included' or 'excluded'
        label: `${label_split}: ${fromDate.format('D MMM YY')} - ${today.format('D MMM YY')}`,
        label_key: label,
      });
    }
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      height: "36px",
      padding: "0 14px",
      display: "flex",
      alignItems: "center",
      boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
    },

    "& .MuiInputBase-input": {
      fontSize: "15px",
      fontFamily: "Rubik",
      color: "#00000099",
      padding: "0",            // 🔥 important (removes default top offset)
      height: "100%",
      display: "flex",
      alignItems: "center",
    },

    "& input::placeholder": {
      fontSize: "15px",
      color: "#00000099",
      fontFamily: "Rubik",
      opacity: 1,
    },

    // 🔥 Fix label alignment
    "& .MuiInputLabel-root": {
      top: "-6px", // adjust based on your UI
      fontSize: "14px",
    },

    "& .MuiInputLabel-shrink": {
      top: "0px",
    },

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#E0E0E0",
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#E0E0E0",
    },
  };

  // ── NEW: shared checkbox sx (small square style matching the Figma) ─────────
  const checkboxSx = {
    padding: "3px 9px",
    color: "#00000040",
    "&.Mui-checked": {
      color: "#1976d2",
    },
    "& .MuiSvgIcon-root": {
      fontSize: 18,
    },
  };

  // Whether this field should show the preset checkboxes
  // const showCheckboxes = label === "Study Start";
  // Updated formatSelectedText
  const formatSelectedText = () => {
    if (value.selected_range) return { visible: value.selected_range.label, extra: 0 };
    if (value[minKey] || value[maxKey]) return { visible: "Custom Range", extra: 0 };
    return null;
  };

  const selectedSummary = formatSelectedText();

  useEffect(() => {
    if (!expanded) {
      setOpenCalendar(false);
    }
  }, [expanded]);

  return (
    <>
      <Accordion
        disableGutters
        elevation={0}
        TransitionProps={{ unmountOnExit: true, timeout: 0 }}
        expanded={expanded}
        onChange={(_, nextExpanded) => {
          if (!isAccordionControlled) {
            setIsExpandMore(nextExpanded);
          }
          if (!nextExpanded) {
            setOpenCalendar(false);
          }
          onAccordionChange?.(nextExpanded);
        }}
        // sx={{ background: '#F2F2F6', borderBottom: '1px solid #e0e0e0', '&:before': { display: 'none' } }}
        sx={{
          height: expanded ? 'auto' : '30px',
          background: expanded ? '#F2F2F6' : '#ffffff',
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ fontSize: 20, color: "#000000CC", flexShrink: 0 }} />}
          sx={{
            px: 2,
            py: 1,
            minHeight: "48px",
            "& .MuiAccordionSummary-content": {
              m: 0,
              overflow: "hidden",
              minWidth: 0,
            },
            "& .MuiAccordionSummary-expandIconWrapper": {
              transform: "none !important",
              flexShrink: 0,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {/* Label */}
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: "#000000CC",
                fontFamily: "Rubik",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {label}
            </Typography>

            {/* Selected summary */}
            <Typography
              sx={{
                fontSize: 13,
                color: selectedSummary ? "#000000CC" : "#00000066",
                fontFamily: "Rubik",
                textAlign: "right",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              {selectedSummary ? selectedSummary.visible : "Select"}
            </Typography>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 1, pb: 1, px: 2 }}>
          <Box sx={{ padding: '4px', borderRadius: '6px', backgroundColor: '#fff' }}>
            {/* <Typography className={classes.label}>{label}</Typography> */}

              {/* ── NEW: render checkbox presets only for study_start_date ────────── */}
              {/* {showCheckboxes && ( */}
              <div className={classes.checkbox_group}>
                {DATE_PRESETS.map((preset) => {
                  const isSame = activePreset?.label === preset.label;
                  const status = isSame ? activePreset.status : null; // null | 'included' | 'excluded'

                  return (
                    <FormControlLabel
                      key={preset.label}
                      className={classes.checkbox_label}
                      label={preset.label}
                      control={
                        <Checkbox
                          size="small"
                          checked={!!status}
                          icon={<CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: '#00000040' }} />}
                          checkedIcon={
                            status === 'included'
                              ? <CheckBoxIcon fontSize="small" sx={{ color: '#1976d2' }} />
                              : <DisabledByDefaultIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                          }
                          onChange={() => handlePresetChange(preset)}
                          sx={{ padding: '3px 9px' }}
                        />
                      }
                    />
                  );
                })}
              </div>
              {/* Date range picker (single calendar) */}
              <ClickAwayListener onClickAway={() => setOpenCalendar(false)}>
                <Box ref={anchorRef}>
                  <div className={classes.picker_container}>
                    <TextField
                      fullWidth
                      label="From"
                      value={value[minKey] ?? ""}
                      placeholder="DD-MM-YYYY"
                      sx={textFieldSx}
                      onClick={() => {
                        setActiveCalendarField("from");
                        lastFieldIntentAtRef.current = Date.now();
                        setOpenCalendar(true);
                      }}
                      onFocus={() => {
                        setActiveCalendarField("from");
                        lastFieldIntentAtRef.current = Date.now();
                      }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              disableRipple
                              onMouseEnter={() => {
                                setOpenCalendar(true);
                              }}
                              onClick={() => {
                                setActiveCalendarField("from");
                                lastFieldIntentAtRef.current = Date.now();
                                setOpenCalendar(true);
                              }}
                            >
                              <CustomDatePickerIcon active={!!value?.[minKey]} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="To"
                      value={value[maxKey] ?? ""}
                      placeholder="DD-MM-YYYY"
                      sx={textFieldSx}
                      onClick={() => {
                        setActiveCalendarField("to");
                        lastFieldIntentAtRef.current = Date.now();
                        setOpenCalendar(true);
                      }}
                      onFocus={() => {
                        setActiveCalendarField("to");
                        lastFieldIntentAtRef.current = Date.now();
                      }}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              disableRipple
                              onMouseEnter={() => {
                                setOpenCalendar(true);
                              }}
                              onClick={() => {
                                setActiveCalendarField("to");
                                lastFieldIntentAtRef.current = Date.now();
                                setOpenCalendar(true);
                              }}
                            >
                              <CustomDatePickerIcon active={!!value?.[maxKey]} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </div>

                  <Popper
                    open={openCalendar}
                    anchorEl={anchorRef.current}
                    placement="top-start"
                    style={{ zIndex: 99999 }}
                  >
                    <Paper
                      elevation={6}
                      sx={{ mt: 1, borderRadius: 2, overflow: "hidden" }}
                      onMouseEnter={() => setOpenCalendar(true)}
                      onMouseLeave={() => setOpenCalendar(false)}
                    >
                      <Box sx={{ p: 0, width: 284 }}>
                        <CustomDateRangeCalender
                          value={rangeValue}
                          onChange={handleRangeSelect}
                        />
                      </Box>
                    </Paper>
                  </Popper>
                </Box>
              </ClickAwayListener>

          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
