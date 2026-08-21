/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { makeStyles } from "@mui/styles";
import { searchClinicalTrials } from "../api/mainSearch";
import { apiPayloadInterventionType, decodeUnicodeEscapes } from "../utils/helpers/helper";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from "@mui/material";
// import { fetchCards } from "../redux/trialsDataSlice";

const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;

const dedupeOptions = (options = [], getKey) => {
  const seen = new Set();

  return options.filter((option) => {
    const key = getKey(option);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const useStyles = makeStyles({
  autocomplete: {
    "& .MuiOutlinedInput-root": {
      height: 36,
      paddingRight: 35,
      padding: "7px !important",
      borderRadius: 6,
      boxShadow: "1px 4px 24px rgba(153, 169, 190, 0.2)",
      backgroundColor: "#FFFFFF",
      fontSize: "15px",
      fontFamily: "Rubik !important",
      "&:hover input::placeholder": {
        color: "#000000ff !important",
      },
      "& input": {
        fontSize: "15px",
        fontFamily: "Rubik !important",
        padding: "1.5px 4px !important",
      },
      "&.Mui-focused fieldset": {
        borderColor: "rgba(0, 0, 0, 0.8) !important",
        borderWidth: "2px",
      },
    },
    "& .MuiAutocomplete-endAdornment": {
      top: "50%",
      transform: "translateY(-50%)",
    },
    "& .MuiInputBase-root": {
      padding: "2px 5px",
    },
    "& .MuiButtonBase-root": {
      display: "none",
    },
    "& .MuiAutocomplete-input, & .MuiAutocomplete-tag": {
      color: "#000000B2",
    },
  },
  paper: {
    borderRadius: 12,
    boxShadow: "1px 24px 24px rgba(153, 169, 190, 0.2)",
    zIndex: 99999,
  },
  listbox: {
    padding: "6px 0",
    scrollbarWidth: "thin",
    "& .MuiAutocomplete-option[aria-selected='true']": {
      backgroundColor: "unset !important",
    },
  },
  option: {
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    padding: "0 !important",
  },
  groupLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#0000004D",
    fontFamily: "Rubik",
    padding: "8px 14px 4px",
    textTransform: "none",
  },
});

export default function CommonAutocompleteNew({
  placeholder,
  value = [],
  onChange,
  filters = {},
  fieldType = "cancer_type",
  isGrouped = false, // true for MainSearch, false for Filter
  accordionExpanded,
  onAccordionChange,
}) {
  const classes = useStyles();
  const highlightedRefNew = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loadedOptions, setLoadedOptions] = useState([]);
  const isAccordionControlled = typeof accordionExpanded === "boolean";
  const normalizedFilterPayload = useMemo(
    () => apiPayloadInterventionType(filters),
    [filters],
  );
  const serializedFilterPayload = useMemo(
    () => JSON.stringify(normalizedFilterPayload || {}),
    [normalizedFilterPayload],
  );

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);

    const debounce = setTimeout(async () => {
      const filterPayload = serializedFilterPayload
        ? JSON.parse(serializedFilterPayload)
        : {};
      const data = await searchClinicalTrials(
        inputValue,
        isGrouped ? "main_filter" : fieldType,
        filterPayload,
      );

      if (active) {
        setLoadedOptions(transformOptions(data));
        setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [
    open,
    inputValue,
    fieldType,
    isGrouped,
    serializedFilterPayload,
  ]);

  const transformOptions = useCallback(
    (apiData = {}) => {
      if (typeof apiData !== "object" || Array.isArray(apiData)) return [];

      if (isGrouped) {
        const groupedOptions = Object.entries(apiData).flatMap(([group, items]) =>
          Array.isArray(items)
            ? items.map((item) => ({
              title: decodeUnicodeEscapes(
                typeof item === "string"
                  ? item
                  : (item?.title ?? item?.name ?? String(item)),
              ),
              group,
            }))
            : [],
        );

        return dedupeOptions(
          groupedOptions,
          (option) => `${option.group}::${option.title}`,
        );
      } else {
        const flatOptions = Object.entries(apiData).flatMap(([group, items]) =>
          Array.isArray(items)
            ? items.map((item) =>
              decodeUnicodeEscapes(
                typeof item === "string"
                  ? item
                  : (item?.name ?? item?.title ?? String(item)),
              ),
            )
            : [],
        );

        return dedupeOptions(flatOptions, (option) => option);
      }
    },
    [isGrouped],
  );

  const handleChange = useCallback(
    (e, newValue) => {
      onChange?.(newValue);
      // const groupedFilters = isGrouped
      //   ? newValue.reduce((acc, option) => {
      //       if (!acc[option.group]) acc[option.group] = [];
      //       acc[option.group].push(option.title);
      //       return acc;
      //     }, {})
      //   : { ...filters, [fieldType]: newValue };

      // dispatch(
      //   fetchCards({
      //     groupedFilters,
      //     flag: isGrouped ? "main_filter" : fieldType,
      //   }),
      // );
      // setTimeout(() => {
      //   e?.target?.blur?.();
      //   document.activeElement?.blur();
      // }, 0);
    },
    [onChange],
  );

  const highlightMatch = (text, searchValue) => {
    if (!searchValue) return text;
    const regex = new RegExp(`(${searchValue})`, "gi");
    return text
      .split(regex)
      .map((part, i) =>
        regex.test(part) ? <strong key={i}>{part}</strong> : part,
      );
  };

  const formatSelectedText = () => {
    const selected = filters?.[fieldType] ?? [];
    const labels = selected
      .map((item) => (typeof item === "object" ? item.label ?? item.value ?? "" : item))
      .filter(Boolean);

    if (labels.length === 0) return null;

    const firstLabel = labels[0];
    const extra = labels.length > 1 ? labels.length - 1 : 0;

    const truncated = firstLabel.length > 20
      ? `${firstLabel.slice(0, 17)}...`
      : firstLabel;

    return { visible: truncated, extra };
  };
  const selectedSummary = formatSelectedText();
  const overflowCount = selectedSummary?.extra ?? 0;

  return (

    <Accordion
      disableGutters
      elevation={0}
      {...(isAccordionControlled
        ? {
            expanded: accordionExpanded,
            onChange: (_, nextExpanded) => {
              if (!nextExpanded) setOpen(false);
              onAccordionChange?.(nextExpanded);
            },
          }
        : {})}
      sx={{
        height: accordionExpanded ? "auto" : "30px",
        background: "#ffffff",
        borderRadius: "6px",
        "&:before": { display: "none" },
        "&.Mui-expanded": {
          background: "#F2F2F6",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 20, color: "#000000CC", flexShrink: 0 }} />}
        sx={{
          px: 2,
          py: 1,
          minHeight: "48px",
          borderRadius: "6px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "background-color 150ms ease",
          "&.Mui-expanded": {
            minHeight: "48px",
          },
          "& .MuiAccordionSummary-content": { m: 0, overflow: "hidden", minWidth: 0 },
          "& .MuiAccordionSummary-content.Mui-expanded": { margin: 0 },
          "& .MuiAccordionSummary-expandIconWrapper": {
            transition: "transform 150ms ease",
          },
          "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
            transform: "rotate(180deg)",
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Label (Histology) */}
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
            {placeholder}
          </Typography>

          {/* Selected Filters Design */}
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
            {selectedSummary ? (
              <>
                {selectedSummary.visible}
                {selectedSummary.extra > 0 && (
                  <Box component="span" sx={{ color: '#2666BE', fontWeight: 600, ml: 0.5 }}>
                    +{selectedSummary.extra}
                  </Box>
                )}
              </>
            ) : (
              "Select"
            )}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pb: 2 }}>

        <Autocomplete
          fullWidth
          multiple
          limitTags={0}
          renderTags={() => null}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          options={loadedOptions}
          loading={loading}
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
          value={value}
          onChange={(e, newValue, reason, details) => {
            if (e?.type === 'keydown' && e?.key === 'Enter') return;
            handleChange(e, newValue);
          }}
          onHighlightChange={(_, option) => { highlightedRefNew.current = option; }}
          className={classes.autocomplete}
          disableCloseOnSelect
          getOptionLabel={(option) => (isGrouped ? option.title : option)}
          getOptionKey={(option) =>
            isGrouped ? `${option.group}::${option.title}` : option
          }
          groupBy={isGrouped ? (option) => option.group : null}
          disablePortal={false}
          noOptionsText="No result found"
          freeSolo={isGrouped}
          isOptionEqualToValue={
            isGrouped
              ? (option, value) =>
                option.title === value.title && option.group === value.group
              : undefined
          }
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            const optionLabel = isGrouped ? option.title : option;
            const status = !isGrouped && filters?.[fieldType]?.find(
              (item) => item.label === optionLabel,
            )?.type;

            return (
              <li key={key} {...optionProps}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", pl: 1.5 }}>
                  {!isGrouped && (
                    <Checkbox
                      icon={uncheckedIcon}
                      checkedIcon={
                        status === "included" ? (
                          <CheckBoxIcon fontSize="small" sx={{ color: "#1976d2" }} />
                        ) : (
                          <DisabledByDefaultIcon fontSize="small" sx={{ color: "#d32f2f" }} />
                        )
                      }
                      checked={selected}
                      size="small"
                      sx={{
                        "& .MuiSvgIcon-root": { fontSize: 16 },
                        "&.Mui-checked": { color: "#2666BE" },
                        color: "#00000066",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "Rubik",
                      fontSize: "14px",
                      lineHeight: "18px",
                      fontWeight: 500,
                      color: selected ? "#000000" : "#00000099",
                    }}
                  >
                    {highlightMatch(optionLabel, inputValue)}
                  </span>
                </Box>
              </li>
            );
          }}
          slotProps={{
            popper: {
              sx: { zIndex: 99999 },
            },
          }}
          classes={{
            paper: classes.paper,
            listbox: classes.listbox,
            option: classes.option,
          }}
          renderGroup={
            isGrouped
              ? (params) => (
                <li key={params.key}>
                  <div className={classes.groupLabel}>{params.group}</div>
                  <ul>{params.children}</ul>
                </li>
              )
              : undefined
          }
          renderInput={(params) => (
            <TextField
              {...params}
              // placeholder={placeholder}
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && highlightedRefNew.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  const opt = highlightedRefNew.current;
                  const already = value.some(v =>
                    isGrouped
                      ? v.title === opt.title && v.group === opt.group
                      : v === opt
                  );
                  handleChange(e, already
                    ? value.filter(v => isGrouped ? !(v.title === opt.title && v.group === opt.group) : v !== opt)
                    : [...value, opt]
                  );
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start" sx={{ mr: 0 }}>
                        <SearchIcon style={{ color: "rgba(0,0,0,0.4)" }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: <>{params.InputProps.endAdornment}</>,
                },
              }}
            />
          )}
        />
      </AccordionDetails>
    </Accordion>
  );
}
