/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Autocomplete,
  Popper,
  Paper,
  CircularProgress,
  ClickAwayListener,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import debounce from "lodash.debounce";
import { searchClinicalTrials } from "../../../api/mainSearch";
import { makeStyles } from "@mui/styles";
import SearchIcon from "@mui/icons-material/Search";
import { FILTER_SECTIONS } from "../../../utils/helpers/helper";
import CommonAutocomplete from "../../../common/CommonAutocomplete";
import DropdownWithChecklist from "../../../common/Dropdownwithchecklist";
import DatePickerBlock from "../../../common/FilterDatePicker";
import DropdownRadioButton from "../../../common/DropdownRadioButton";
import RadioButtonWithRange from "../../../common/RadioButtonWithRange";
import SearchFieldFilter from "../../../common/SearchFieldFilter";

const useStyles = makeStyles(() => ({
  dropdown_list_title: {
    borderRadius: "6px",
    gap: "8px",
    fontSize: "14px",
    fontFamily: "Rubik",
    padding: "8px 12px",
    cursor: "pointer",
  },
  dropdown_option_text: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    fontFamily: "Rubik",
    fontSize: 14,
    cursor: "pointer", // Essential for visual feedback
    transition: "background-color 0.2s ease", // Smooths the hover effect
    
    // This handles the hover state and keyboard navigation highlight
    "&:hover, &[aria-selected='true'], &.Mui-focused": {
      backgroundColor: "rgba(0, 0, 0, 0.04) !important",
    },
    
    // Optional: Add a slightly darker shade when clicking
    "&:active": {
      backgroundColor: "rgba(0, 0, 0, 0.08) !important",
    },
  },
  dropdown_option_text_label: {
    fontSize: 12,
    backgroundColor: "rgba(218, 241, 228, 1)",
    color: "rgba(0, 0, 0, 0.6)",
    padding: "2px 8px",
    borderRadius: 12,
    fontFamily: "Rubik",
    pointerEvents: "none", // Ensures the label doesn't interfere with clicking the row
  },
  expand_more_box: {
    width: "50px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(243, 246, 251, 1)",
    cursor: "pointer",
    borderTopRightRadius: "4px",
    borderBottomRightRadius: "4px",
    borderLeft: "1px solid #D9D9D9",
    "&:hover": {
      backgroundColor: "rgba(230, 235, 245, 1)", // Slight hover for the toggle button too
    },
  },
}));

export default function TrialsFilter(props) {
  // const filters = {};
  const { selectedFilters, setSelectedFilters } = props;
  const anchorRef = useRef(null);
  const [searchOptions, setSearchOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const classes = useStyles();
  const [openSearchDropdown, setOpenSearchDropdown] = useState(false);
  const [openFilterPanel, setOpenFilterPanel] = useState(false);
  const searchOptionsCacheRef = useRef({});
  // const [activeCategory, setActiveCategory] = useState(filterCategories[0]);
  const [activeSection, setActiveSection] = useState(FILTER_SECTIONS[0].title);
  const [searchValue, setSearchValue] = useState([]);

  const sortByQueryPriority = (items, query) => {
    const q = (query ?? "").toString().trim().toLowerCase();
    if (!q) return items;

    const score = (label) => {
      const text = (label ?? "").toString().trim().toLowerCase();
      if (!text) return 999;
      if (text === q) return 0;
      if (text.startsWith(q)) return 1;
      if (text.includes(q)) return 2;
      return 3;
    };

    return items
      .slice()
      .sort((a, b) => {
        const d = score(a?.label) - score(b?.label);
        if (d !== 0) return d;
        return (a?.label ?? "").localeCompare(b?.label ?? "");
      });
  };

  const formatDisplayLabel = (text) => {
    const raw = (text ?? "").toString();
    if (!raw) return "";
    const cleaned = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    if (!cleaned) return "";

    const ACRONYMS = new Set([
      "NSCLC",
      "ECOG",
      "OS",
      "PFS",
      "DFS",
      "EFS",
      "TTP",
      "ORR",
      "DOR",
      "DCR",
      "MRD",
      "DLT",
      "MTD",
      "RP2D",
      "PRO",
      "PK",
      "QOL",
      "CTDNA",
    ]);

    return cleaned
      .split(" ")
      .map((word) => {
        const upper = word.toUpperCase();
        if (/^[A-Z0-9]+$/.test(word) && (/[0-9]/.test(word) || ACRONYMS.has(upper))) {
          return upper;
        }
        const lower = word.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  };

  const uniqueByCategoryAndLabel = (items) => {
    const seen = new Set();
    const out = [];
    (items || []).forEach((opt) => {
      const label = (opt?.label ?? "").toString().trim();
      const category = (opt?.category ?? "").toString().trim();
      if (!label) return;
      const k = `${category}::${label}`.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(opt);
    });
    return out;
  };

  const PLACEHOLDER_KEY_MAP = FILTER_SECTIONS.flatMap(
    (section) => section.filters,
  ).reduce((acc, filter) => {
    if (filter.placeholder) {
      acc[filter.placeholder.toLowerCase().trim()] = filter.key;
    }
    return acc;
  }, {});

  const fetchSearchResults = async (text) => {
    try {
      setLoading(true);

      const normalizedText = text.toLowerCase().trim();

      // Case-insensitive match
      const filterKey = PLACEHOLDER_KEY_MAP[normalizedText] || "main_filter";

      const query = normalizedText;

      // Backend often returns empty for 1-char queries; fallback to cached base options.
      if (query.length > 0 && query.length < 2) {
        let baseOptions = searchOptionsCacheRef.current?.[filterKey];

        if (!Array.isArray(baseOptions) || baseOptions.length === 0) {
          const baseRes = await searchClinicalTrials("", filterKey, {});
          const baseFormattedRaw = Object.entries(baseRes).flatMap(
            ([category, values]) =>
              (values || [])
                .filter((v) => typeof v !== "string" || v.trim().length > 0)
                .map((value) => ({
                  label: value,
                  category: category,
                })),
          );
          const baseFormatted = uniqueByCategoryAndLabel(baseFormattedRaw);
          searchOptionsCacheRef.current[filterKey] = baseFormatted;
          baseOptions = baseFormatted;
        }

        const filtered = baseOptions.filter((opt) =>
          (opt?.label ?? "").toLowerCase().includes(query),
        );
        setSearchOptions(sortByQueryPriority(filtered, query));
        return;
      }

      const res = await searchClinicalTrials(text, filterKey, {});

      const formattedOptionsRaw = Object.entries(res).flatMap(
        ([category, values]) =>
          (values || [])
            .filter((v) => typeof v !== "string" || v.trim().length > 0)
            .map((value) => ({
              label: value,
              category: category,
            })),
      );
      const formattedOptions = uniqueByCategoryAndLabel(formattedOptionsRaw);

      // If API is empty but we have cached base options, locally filter as fallback.
      if (formattedOptions.length === 0) {
        const baseOptions = searchOptionsCacheRef.current?.[filterKey];
        if (Array.isArray(baseOptions) && baseOptions.length > 0) {
          const filtered = baseOptions.filter((opt) =>
            (opt?.label ?? "").toLowerCase().includes(query),
          );
          setSearchOptions(sortByQueryPriority(filtered, query));
          return;
        }
      }

      setSearchOptions(sortByQueryPriority(formattedOptions, query));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((text) => fetchSearchResults(text), 400),
    [],
  );

  useEffect(() => {
    if (inputValue?.trim()?.length > 0) {
      setOpenSearchDropdown(true);
      setOpenFilterPanel(false);
      debouncedSearch(inputValue);
    } else {
      setSearchOptions([]); // clear old results
      setOpenSearchDropdown(false);
    }
  }, [inputValue]);

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text?.split(regex);

    return parts?.map((part, index) =>
      part?.toLowerCase() === query?.toLowerCase() ? (
        <span
          key={index}
          style={{
            fontWeight: 600,
            fontFamily: "Rubik",
            fontSize: "14px",
          }}
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  // const handleFilterUpdate = useCallback(
  //   (section, filterKey, value) => {
  //     const newFilters = { ...selectedFilters };

  //     // Handle daterange fields with multiple keys
  //     const filterConfig = FILTER_SECTIONS.flatMap((s) => s.filters).find(
  //       (f) => f.key === filterKey,
  //     );
  //     if (filterConfig?.type === "daterange" && filterConfig.keys) {
  //       // Preserve existing values and only update the changed ones
  //       filterConfig.keys.forEach((key) => {
  //         if (key in value) {
  //           newFilters[key] = value[key];
  //         } else if (!(key in newFilters)) {
  //           newFilters[key] = selectedFilters[key] || null;
  //         }
  //       });
  //     } else {
  //       newFilters[filterKey] = value;
  //     }

  //     const currentMainSearchValues = searchValue.filter(
  //       (item) => item.group !== filterKey,
  //     );
  //     const newMainSearchItems = Array.isArray(value)
  //       ? value.map((title) => ({ title, group: filterKey }))
  //       : value
  //         ? [{ title: value, group: filterKey }]
  //         : [];

  //     const updatedSearchValue = [
  //       ...currentMainSearchValues,
  //       ...newMainSearchItems,
  //     ];
  //     setSearchValue(updatedSearchValue);

  //     const groupedFilters = { ...selectedFilters };
  //     if (filterConfig?.type === "daterange" && filterConfig.keys) {
  //       filterConfig.keys.forEach((key) => {
  //         if (key in value) {
  //           groupedFilters[key] = value[key];
  //         } else {
  //           groupedFilters[key] = selectedFilters[key] || null;
  //         }
  //       });
  //     } else {
  //       groupedFilters[filterKey] = value;
  //     }
  //     const cleanedSelectedFilters = Object.fromEntries(
  //       Object.entries(groupedFilters).filter(([_, v]) => {
  //         if (Array.isArray(v)) return v.length > 0;
  //         return v !== null && v !== undefined && v !== "";
  //       }),
  //     );

  //     setSelectedFilters(cleanedSelectedFilters);

  //     // dispatch(
  //     //   fetchCards({
  //     //     groupedFilters,
  //     //     flag: filterKey,
  //     //     // session_key: sessionKey,
  //     //   }),
  //     // ).then((res) => {
  //     //   console.log(
  //     //     "Fetched cards after filter update:",
  //     //     res.payload.session_key,
  //     //   );
  //     //   // setFilters(...filters, res.payload.payload);
  //     //   // setStoreSessionKey(res.payload.session_key);
  //     // });

  //     // onFilterChange?.(newFilters, {});
  //   },
  //   [selectedFilters, searchValue, dispatch],
  // );

  // const getFilterValue = useCallback(
  //   (section, filterKey, defaultValue = []) => {
  //     const filterConfig = FILTER_SECTIONS.flatMap((s) => s.filters).find(
  //       (f) => f.key === filterKey,
  //     );
  //     if (filterConfig?.type === "daterange" && filterConfig.keys) {
  //       // For daterange, return an object with both min and max values
  //       const dateRangeValue = {};
  //       filterConfig.keys.forEach((key) => {
  //         dateRangeValue[key] = selectedFilters[key] || null;
  //       });
  //       return dateRangeValue;
  //     }
  //     return selectedFilters[filterKey] ?? defaultValue;
  //   },
  //   [selectedFilters],
  // );

  // const renderFilter = useCallback(
  //   (filter, sectionTitle) => {
  //     const {
  //       type,
  //       placeholder,
  //       label,
  //       key,
  //       defaultValue = [],
  //       options = [],
  //     } = filter;
  //     const value = getFilterValue(sectionTitle, key, defaultValue);
  //     const onChange = (val) => handleFilterUpdate(sectionTitle, key, val);

  //     // Get values from main search that match this filter's fieldType
  //     const mainSearchValues = searchValue
  //       .filter((item) => item.group === key)
  //       .map((item) => item.title);

  //     // Combine filter values with main search values
  //     const combinedValue =
  //       type === "autocomplete"
  //         ? [...new Set([...value, ...mainSearchValues])]
  //         : value;

  //     switch (type) {
  //       case "autocomplete":
  //         return (
  //           <CommonAutocomplete
  //             placeholder={placeholder}
  //             value={combinedValue}
  //             onChange={onChange}
  //             filters={selectedFilters}
  //             fieldType={key}
  //             isGrouped={false}
  //           />
  //         );
  //       case "checklist":
  //         return (
  //           <DropdownWithChecklist
  //             placeholder={placeholder}
  //             value={value}
  //             onChange={onChange}
  //             options={options}
  //             filters={selectedFilters}
  //             sectionType={sectionTitle}
  //             fieldType={key}
  //             isGrouped={false}
  //           />
  //         );
  //       case "daterange":
  //         return (
  //           <DatePickerBlock
  //             label={label}
  //             value={value}
  //             onChange={onChange}
  //             keys={filter.keys}
  //           />
  //         );
  //       case "radiobutton":
  //         return (
  //           <DropdownRadioButton
  //             placeholder={placeholder}
  //             value={value}
  //             onChange={onChange}
  //             filter={selectedFilters}
  //             sectionType={sectionTitle}
  //             fieldType={key}
  //           />
  //         );
  //       case "radiorange":
  //         return (
  //           <RadioButtonWithRange
  //             placeholder={placeholder}
  //             value={value}
  //             onChange={onChange}
  //             filter={selectedFilters}
  //             sectionType={sectionTitle}
  //             fieldType={key}
  //           />
  //         );
  //       default:
  //         return null;
  //     }
  //   },
  //   [getFilterValue, selectedFilters, handleFilterUpdate, searchValue],
  // );

  const filterConfigMap = useMemo(() => {
    const map = {};
    FILTER_SECTIONS.forEach((section) => {
      section.filters.forEach((filter) => {
        map[filter.key] = filter;
      });
    });
    return map;
  }, []);

  const handleFilterUpdate = useCallback(
    (section, filterKey, value) => {
      const filterConfig = filterConfigMap[filterKey];
      setSelectedFilters((prev) => {
        let updated = { ...prev };

        // Handle Date Range
        if (filterConfig?.type === "daterange" && filterConfig.keys) {
          filterConfig.keys.forEach((key) => {
            updated[key] = value?.[key] ?? null;
          });
        } else {
          updated[filterKey] = value;
        }

        // Clean empty values
        return Object.fromEntries(
          Object.entries(updated).filter(([_, v]) => {
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === "object" && v !== null)
              return Object.values(v).some(Boolean);
            return v !== null && v !== undefined && v !== "";
          }),
        );
      });
      // Sync with main search
      setSearchValue((prev) => {
        const filtered = prev.filter((item) => item.group !== filterKey);

        const newItems = Array.isArray(value)
          ? value.map((title) => ({ title, group: filterKey }))
          : value
            ? [{ title: value, group: filterKey }]
            : [];

        return [...filtered, ...newItems];
      });
    },
    [filterConfigMap],
  );

  const getFilterValue = useCallback(
    (filterKey, defaultValue = []) => {
      const filterConfig = filterConfigMap[filterKey];

      if (filterConfig?.type === "daterange" && filterConfig.keys) {
        const obj = {};
        filterConfig.keys.forEach((key) => {
          obj[key] = selectedFilters[key] ?? null;
        });
        return obj;
      }

      return selectedFilters[filterKey] ?? defaultValue;
    },
    [selectedFilters, filterConfigMap],
  );

  const renderFilter = useCallback(
    (filter) => {
      const {
        type,
        placeholder,
        label,
        key,
        defaultValue = [],
        options = [],
      } = filter;

      const value = getFilterValue(key, defaultValue);
      const onChange = (val) => handleFilterUpdate(null, key, val);

      // Merge main search values for autocomplete
      const mainSearchValues = searchValue
        .filter((item) => item.group === key)
        .map((item) => item.title);

      const combinedValue =
        type === "autocomplete"
          ? [...new Set([...(value || []), ...mainSearchValues])]
          : value;

      switch (type) {
        case "autocomplete":
          return (
            <CommonAutocomplete
              placeholder={placeholder}
              value={combinedValue}
              onChange={onChange}
              filters={selectedFilters}
              fieldType={key}
              isGrouped={false}
            />
          );

        case "checklist":
          return (
            <DropdownWithChecklist
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              options={options}
              filters={selectedFilters}
              fieldType={key}
              isGrouped={false}
            />
          );

        case "daterange":
          return (
            <DatePickerBlock
              label={label}
              value={value}
              onChange={onChange}
              keys={filter?.keys}
            />
          );

        case "radiobutton":
          return (
            <DropdownRadioButton
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              filter={selectedFilters}
              fieldType={key}
            />
          );

        case "radiorange":
          return (
            <RadioButtonWithRange
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              filter={selectedFilters}
              fieldType={key}
            />
          );
        // case "search":
        //   return (
        //     <SearchFieldFilter
        //       placeholder={placeholder}
        //       value={value}
        //       onChange={onChange}
        //       filters={selectedFilters}
        //       fieldType={key}
        //     />
        //   );
        default:
          return null;
      }
    },
    [getFilterValue, selectedFilters, handleFilterUpdate, searchValue],
  );

  return (
    <ClickAwayListener
      onClickAway={() => {
        setOpenFilterPanel(false);
        setOpenSearchDropdown(false);
      }}
    >
      <Box sx={{ width: 600 }} ref={anchorRef}>
        {/* ================= SEARCH ================= */}

        <Autocomplete
          freeSolo
          multiple
          open={openSearchDropdown}
          options={searchOptions}
          filterOptions={(x) => x}
          value={selectedFilters}
          inputValue={inputValue}
          renderTags={() => null}
          noOptionsText="No records found"
          onChange={(e, newValue) => setSelectedFilters(newValue)}
          onInputChange={(e, newValue) => setInputValue(newValue)}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option?.label || ""
          }
          ListboxProps={{
            className: "app-scroll",
          }}
          sx={{
            ".MuiOutlinedInput-root": {
              fontSize: 14,
              fontFamily: "Rubik",
              padding: "0px 0px 0px 8px !important",
              "& fieldset": {
                borderColor: "#D9D9D9",
              },

              "&:hover fieldset": {
                borderColor: "#D9D9D9",
              },

              "&.Mui-focused fieldset": {
                borderColor: "#D9D9D9",
                borderWidth: "1px",
              },
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Cancer type, biomarker, phase..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon sx={{ color: "#9e9e9e", mr: 1 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),

                endAdornment: (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {loading && (
                      <CircularProgress
                        size={18}
                        sx={{ color: "#9e9e9e", mr: 1 }}
                      />
                    )}

                    <Box
                      className={classes.expand_more_box}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        setOpenFilterPanel((prev) => !prev);
                        setOpenSearchDropdown(false);
                      }}
                    >
                      <ExpandMoreIcon sx={{ color: "rgba(0, 0, 0, 0.6)" }} />
                    </Box>
                  </Box>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  paddingRight: 0, // remove extra padding
                },
                fontSize: 14,
                fontFamily: "Rubik",
              }}
            />
          )}
          // renderOption={(props, option) => (
          //   <li {...props} className={classes.dropdown_option_text}>
          //     <span>
          //       {highlightMatch(option.label, inputValue)} &nbsp;{" "}
          //       <span className={classes.dropdown_option_text_label}>
          //         {option.category}
          //       </span>
          //     </span>
          //   </li>
          // )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const stableKey = `${option?.category ?? "cat"}::${option?.label ?? "label"}`;

            return (
              <li
                key={stableKey}
                {...optionProps}
                className={classes.dropdown_option_text}
                style={{ cursor: "pointer" }}
              >
                <span>
                  {highlightMatch(formatDisplayLabel(option.label), inputValue)} &nbsp;{" "}
                  <span className={classes.dropdown_option_text_label}>
                    {option.category}
                  </span>
                </span>
              </li>
            );
          }}
        />

        <Popper
          open={openFilterPanel}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{
            position: "relative",
            zIndex: "10000",
            width: anchorRef.current?.offsetWidth,
          }}
        >
          {/* <Paper
            elevation={6}
            sx={{
              mt: 1,
              p: 3,
              maxHeight: 500,
              overflowY: "auto",
              borderRadius: 2,
            }}
          >
            {filterCategories.map((category) => (
              <Box key={category.title} mb={3}>
                <Typography fontWeight={600} mb={1}>
                  {category.title}
                </Typography>

                {category.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={selectedFilters.includes(option)}
                        onChange={() => handleFilterChange(option)}
                      />
                    }
                    label={option}
                  />
                ))}
              </Box>
            ))}
          </Paper> */}
          <Paper
            elevation={6}
            data-filter-card="true"
            sx={{
              mt: 1,
              display: "flex",
              height: 500,
              borderRadius: 2,
              overflow: "visible",
              position: "relative",
            }}
          >
            <Box sx={{ display: "flex", height: "100%" }}>
              {/* LEFT TABS */}
              <Box
                sx={{
                  width: 240,
                  borderRight: "1px solid rgba(224, 225, 230, 1)",
                  padding: "20px 16px 20px 20px",
                }}
              >
                {FILTER_SECTIONS.map((section) => (
                  <Box
                    key={section.title}
                    onClick={() => setActiveSection(section.title)}
                    sx={{
                      cursor: "pointer",
                      fontFamily: "Rubik",
                      fontSize: 14,
                      fontWeight: activeSection === section.title ? 600 : 400,
                      background:
                        activeSection === section.title
                          ? "#E6F0FF"
                          : "transparent",
                      color:
                        activeSection === section.title
                          ? "rgba(38, 102, 190, 1)"
                          : "rgba(0, 0, 0, 0.5)",
                    }}
                    className={classes.dropdown_list_title}
                  >
                    {section.title}
                  </Box>
                ))}
              </Box>

              {/* RIGHT FILTER PANEL */}
              <Box
                sx={{
                  flex: 1,
                  p: 3,
                  overflowY: "auto",
                  width: "360px",
                }}
                className="app-scroll"
              >
                {FILTER_SECTIONS.find(
                  (section) => section.title === activeSection,
                )?.filters.map((filter) => (
                  <Box key={filter.key} mb={2}>
                    {renderFilter(filter, activeSection)}
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
