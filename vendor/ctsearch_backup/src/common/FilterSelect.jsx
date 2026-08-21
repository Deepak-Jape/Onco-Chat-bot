import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  MenuItem,
  Typography,
  IconButton,
  CircularProgress,
  Box,
  ListSubheader,
  TextField,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
// Filter search glass (Bug 818) — icon supplied by design. The MUI SearchIcon
// tinted rgba(0,0,0,0.4) rendered lighter than the Figma spec.
import findIcon from "../assets/icons/find_icon.png";

const SEARCH_ICON_SIZE = 14;

const stripCountryCode = (str) =>
  String(str ?? "").replace(/\s*\(\s*[A-Z]{2,3}\s*\)\s*$/, "").trim();

const normalizeOption = (opt) => {
  if (typeof opt === "string") return { value: opt, label: stripCountryCode(opt) };
  const label = opt?.label ?? opt?.value ?? "";
  return { value: opt?.value, label: stripCountryCode(label) };
};

const scoreMatch = (label = "", query = "") => {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const l = String(label).toLowerCase();
  const idx = l.indexOf(q);
  if (idx === 0) return 0;
  if (idx > 0) return 1;
  return 2;
};

const FilterSelect = ({
  value,
  onChange,
  placeholder,
  options = [],
  onClear,
  width = 138, // Defaulted to Figma 'Field' width
  menuWidth,
  className,
  renderValue,
  onOpen,
  loading,
  searchable = false,
  searchPlaceholder,
  showSearchIcon = false,
  typeahead = false,
}) => {
  const [query, setQuery] = useState("");

  const normalizedOptions = useMemo(
    () => (Array.isArray(options) ? options.map(normalizeOption) : []),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = normalizedOptions;

    if (searchable && q) {
      list = list.filter((o) => {
        const label = String(o.label).toLowerCase();
        // For typeahead (e.g., Country), users expect prefix-matching when typing.
        return typeahead ? label.startsWith(q) : label.includes(q);
      });
    }

    if (searchable && value) {
      const hasSelected = list.some((o) => o.value === value);
      if (!hasSelected) {
        const fromAll = normalizedOptions.find((o) => o.value === value);
        list = [fromAll || { value, label: value }, ...list];
      }
    }

    if (searchable) {
      list = [...list].sort((a, b) => {
        const aSelected = value && a.value === value;
        const bSelected = value && b.value === value;
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;

        if (q) {
          const sa = scoreMatch(a.label, q);
          const sb = scoreMatch(b.label, q);
          if (sa !== sb) return sa - sb;
        }

        return String(a.label).localeCompare(String(b.label));
      });
    }

    return list;
  }, [normalizedOptions, query, searchable, typeahead, value]);

  useEffect(() => {
    if (!typeahead) return;
    const match = normalizedOptions.find((o) => o.value === value);
    setQuery(value ? match?.label ?? String(value) : "");
  }, [normalizedOptions, typeahead, value]);

  if (typeahead) {
    const selectedOption =
      filteredOptions.find((o) => o.value === value) ||
      (value ? { value, label: value } : null);

    return (
      <Box
        className={className}
        sx={{
          position: "relative",
          display: "inline-block",
          width: width, // keep same width behavior as Select version
        }}
      >
        <Autocomplete
          options={filteredOptions}
          loading={!!loading}
          value={selectedOption}
          inputValue={query}
          onInputChange={(_e, newInputValue, reason) => {
            // Prevent query from being unexpectedly reset when options/value update.
            // This can happen while the user is typing (e.g., async option loads),
            // causing the dropdown to jump back to an A/B-sorted list.
            if (reason === "reset" && newInputValue === "") return;
            setQuery(newInputValue);
          }}
          onChange={(_e, newOption) => {
            const nextValue = newOption?.value || "";
            setQuery(newOption?.label || "");
            onChange?.({ target: { value: nextValue } });
          }}
          openOnFocus
          disableClearable
          forcePopupIcon={false}
          popupIcon={null}
          disablePortal
          getOptionLabel={(o) => (typeof o === "string" ? o : o?.label || "")}
          isOptionEqualToValue={(opt, val) =>
            (opt?.value ?? opt) === (val?.value ?? val)
          }
          slotProps={{
            popper: {
              placement: "bottom-start",
              modifiers: [
                { name: "offset", options: { offset: [0, 8] } },
                { name: "flip", enabled: false },
                { name: "preventOverflow", enabled: false },
              ],
              sx: menuWidth
                ? {
                    width: menuWidth,
                    minWidth: menuWidth,
                    zIndex: 99999,
                  }
                : { zIndex: 99999 },
            },
            paper: {
              className: "app-scroll",
              sx: {
                maxHeight: 260,
                overflowY: "auto",
                "& .MuiAutocomplete-option[aria-selected='true']": {
                  backgroundColor: "#E8EFF9",
                },
                "& .MuiAutocomplete-option": {
                  paddingLeft: "36px",
                },
              },
            },
            listbox: {
              className: "app-scroll",
              sx: {
                maxHeight: 260,
                overflowY: "auto",
                p: 0,
              },
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={placeholder}
              size="small"
              onFocus={(e) => onOpen?.(e)}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="img"
                      src={findIcon}
                      alt=""
                      sx={{
                        width: SEARCH_ICON_SIZE,
                        height: SEARCH_ICON_SIZE,
                        display: "block",
                        flexShrink: 0,
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress size={14} sx={{ mr: 1 }} />
                    ) : null}
                    {value ? (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClear?.();
                        }}
                        sx={{
                          p: "2px",
                          backgroundColor: "#f5f5f5",
                          "&:hover": { backgroundColor: "#ffebee", color: "#d32f2f" },
                        }}
                      >
                        <ClearIcon sx={{ fontSize: "10px" }} />
                      </IconButton>
                    ) : null}
                  </>
                ),
              }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  height: "32px", // matches Select
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D9D9E0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.2)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2666BE",
                    borderWidth: "1.5px",
                  },
                },
                "& .MuiInputBase-input": {
                  padding: "0px 12px",
                  height: "32px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "12px",
                  fontFamily: "'Rubik', sans-serif",
                  lineHeight: "24px",
                  color: value ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
                },
                "& .MuiInputBase-input::placeholder": {
                  opacity: 1,
                  color: "rgba(0, 0, 0, 0.4)",
                },
              }}
            />
          )}
          renderOption={(props, opt) => (
            <li
              {...props}
              key={opt.value}
              style={{
                ...(props.style || {}),
                fontSize: "14px",
                fontFamily: "Rubik",
                color: "rgba(0, 0, 0, 0.7)",
              }}
            >
              {opt.label}
            </li>
          )}
        />
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        position: "relative",
        display: "inline-block",
        width: width,
      }}
    >
      <Select
        value={value || ""}
        displayEmpty
        onOpen={(e) => {
          setQuery("");
          onOpen?.(e);
        }}
        onChange={onChange}
        IconComponent={KeyboardArrowDown}
        renderValue={(selected) => {
          if (renderValue) return renderValue(selected);

          return (
            <Typography
              sx={{
                fontSize: "12px",
                color: selected ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.7)",
                fontFamily: "'Rubik', sans-serif",
                lineHeight: "24px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selected ? selected : placeholder}
            </Typography>
          );
        }}
        sx={{
          width: "100%",
          height: "32px", // Matches Figma 'Field' height
          backgroundColor: "#FFFFFF",
          borderRadius: "6px", // Matches Figma border-radius

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D9D9E0", // Matches Figma border color
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.2)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2666BE", // Brand blue for focus
            borderWidth: "1.5px",
          },

          // Adjusting the internal padding to match Figma "0px 12px"
          "& .MuiSelect-select": {
            padding: showSearchIcon ? "0px 12px 0px 32px" : "0px 12px",
            display: "flex",
            alignItems: "center",
            height: "32px",
            paddingRight: value ? "40px !important" : "32px !important",
          },

          // Icon styling
          "& .MuiSelect-icon": {
            right: "8px",
            fontSize: "18px", // Matches Figma arrow-down-s-line
            color: "rgba(0, 0, 0, 0.4)",
          },
        }}
        MenuProps={{
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          PaperProps: {
            className: "app-scroll",
            sx: {
              borderRadius: "6px",
              mt: 0.5,
              boxShadow: "1px 8px 34px rgba(153, 169, 190, 0.1)", // Matches Figma shadow
              minWidth: menuWidth || "100%",
              maxHeight: 260,
              overflowY: "auto",
            },
          },
          MenuListProps: {
            sx: { maxHeight: 260 },
          },
        }}
      >
        {searchable && !loading && (
          <ListSubheader
            sx={{
              bgcolor: "#fff",
              lineHeight: "unset",
              py: 1,
              px: 1,
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <TextField
              autoFocus
              size="small"
              value={query}
              placeholder={searchPlaceholder || `Search ${placeholder}`}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="img"
                      src={findIcon}
                      alt=""
                      sx={{
                        width: SEARCH_ICON_SIZE,
                        height: SEARCH_ICON_SIZE,
                        display: "block",
                        flexShrink: 0,
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  fontFamily: "Rubik",
                  fontSize: "12px",
                },
              }}
            />
          </ListSubheader>
        )}
        {loading ? (
          <MenuItem disabled sx={{ fontSize: "12px", fontFamily: "Rubik" }}>
            <CircularProgress size={14} sx={{ mr: 1 }} />
            Loading...
          </MenuItem>
        ) : (
          filteredOptions.map((opt) => {
            const val = opt.value;
            const label = opt.label;
            return (
              <MenuItem
                key={val}
                value={val}
                sx={{
                  fontSize: "14px", // Standard dropdown item size
                  fontFamily: "Rubik",
                  color: "rgba(0, 0, 0, 0.7)",
                  "&.Mui-selected": {
                    backgroundColor: "#E8EFF9",
                  }
                }}
              >
                {label}
              </MenuItem>
            );
          })
        )}
      </Select>

      {/* Search icon */}
      {showSearchIcon && (
        <Box
          component="img"
          src={findIcon}
          alt=""
          sx={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: SEARCH_ICON_SIZE,
            height: SEARCH_ICON_SIZE,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}

      {/* Loader icon */}
      {loading && (
        <CircularProgress
          size={14}
          sx={{
            position: "absolute",
            right: 30,
            top: "50%",
            marginTop: "-7px", // Perfect vertical center
            zIndex: 3,
          }}
        />
      )}
      {/* Clear Button */}
      {value && !loading && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onClear?.();
          }}
          size="small"
          sx={{
            position: "absolute",
            right: 28,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            padding: "2px",
            backgroundColor: "#f5f5f5",
            "&:hover": { backgroundColor: "#ffebee", color: "#d32f2f" },
          }}
        >
          <ClearIcon sx={{ fontSize: "10px" }} />
        </IconButton>
      )}
    </Box>
  );
};

export default FilterSelect;
