/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { makeStyles } from "@mui/styles";
import { searchClinicalTrials } from "../api/mainSearch";
import { apiPayloadInterventionType } from "../utils/helpers/helper";
// import { fetchCards } from "../redux/trialsDataSlice";

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
    background: "white",

    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      height: 36,
      fontSize: "15px",
      fontFamily: "Rubik !important",
      "&:hover input::placeholder": {
        color: "#000000ff !important",
      },
    },

    "&.Mui-focused fieldset": {
      borderColor: "rgba(0, 0, 0, 0.8) !important",
      borderWidth: "1px",
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
    boxShadow: "1px 4px 24px 0px rgba(153, 169, 190, 0.2)",
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
    fontSize: "15px !important",
    fontFamily: "Rubik !important",
    color: "#00000099 !important",
    padding: "6px 14px",
    "&.Mui-focused": {
      backgroundColor: "none !important",
    },
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

export default function CommonAutocomplete({
  placeholder,
  value = [],
  onChange,
  filters = {},
  fieldType = "cancer_type",
  isGrouped = false, // true for MainSearch, false for Filter
}) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loadedOptions, setLoadedOptions] = useState([]);
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
                title:
                  typeof item === "string"
                    ? item
                    : (item?.title ?? item?.name ?? String(item)),
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
                typeof item === "string"
                  ? item
                  : (item?.name ?? item?.title ?? String(item)),
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

  const highlightedRef = useRef(null);

  return (
    <Autocomplete
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
      onChange={handleChange}
      className={classes.autocomplete}
      getOptionLabel={(option) => (isGrouped ? option.title : option)}
      getOptionKey={(option) =>
        isGrouped ? `${option.group}::${option.title}` : option
      }
      groupBy={isGrouped ? (option) => option.group : null}
      disablePortal={false}
      noOptionsText="No result found"
      freeSolo={isGrouped}
      disableCloseOnSelect
      onHighlightChange={(_, option) => { highlightedRef.current = option; }}
      isOptionEqualToValue={
        isGrouped
          ? (option, value) =>
              option.title === value.title && option.group === value.group
          : undefined
      }
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;

        return (
        <li key={key} {...optionProps}>
          <span
            style={{
              fontFamily: "Rubik",
              fontSize: "14px",
              color: selected ? "#000000" : "#00000099",
            }}
          >
            {highlightMatch(isGrouped ? option.title : option, inputValue)}
          </span>
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
          placeholder={placeholder}
          size="small"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && highlightedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              handleChange(e, value.some(v =>
                isGrouped
                  ? v.title === highlightedRef.current.title && v.group === highlightedRef.current.group
                  : v === highlightedRef.current
              )
                ? value.filter(v =>
                    isGrouped
                      ? !(v.title === highlightedRef.current.title && v.group === highlightedRef.current.group)
                      : v !== highlightedRef.current
                  )
                : [...value, highlightedRef.current]
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
                    <SearchIcon fontSize="small" />
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
  );
}
