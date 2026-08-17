/* eslint-disable react-hooks/exhaustive-deps */
// import { useState, useEffect, useRef } from "react";
// import { Autocomplete, TextField, Checkbox, Typography } from "@mui/material";
// import { makeStyles } from "@mui/styles";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
// import CheckBoxIcon from "@mui/icons-material/CheckBox";
// import { searchClinicalTrials } from "../api/mainSearch";

// const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
// const checkedIcon = <CheckBoxIcon fontSize="small" />;

// const useStyles = makeStyles({
//   root: {
//     "& .MuiOutlinedInput-root": {
//       height: 36,
//       paddingRight: 35,
//       padding: "7px !important",
//       borderRadius: 6,
//       boxShadow: "1px 4px 24px rgba(153, 169, 190, 0.2)",
//       "& input": {
//         fontSize: "15px",
//         fontFamily: "Rubik !important",
//         padding: "1.5px 4px !important",
//       },
//     },
//     "& .MuiAutocomplete-endAdornment": {
//       top: "50%",
//       transform: "translateY(-50%)",
//     },
//   },
//   popper: {
//     marginTop: 8,
//     borderRadius: 8,
//     boxShadow: "1px 4px 24px rgba(153, 169, 190, 0.2)",
//     "& .MuiAutocomplete-listbox": {
//       scrollbarWidth: "thin",
//       "& .MuiAutocomplete-option[aria-selected='true']": {
//         backgroundColor: "unset !important",
//         fontWeight: "559",
//       },
//       "& .MuiAutocomplete-option.Mui-focused": {
//         backgroundColor: "transparent !important",
//       },
//     },
//   },
//   option: {
//     fontSize: 14,
//     display: "flex",
//     alignItems: "center",
//     padding: "0 !important",
//   },
// });

// export default function DropdownWithChecklist({
//   placeholder,
//   value = [],
//   onChange,
//   options = [],
//   filters = {},
//   fieldType = "",
//   sectionType = "",
//   isGrouped = false,
// }) {
//   const inputRef = useRef(null);
//   const classes = useStyles();

//   const [open, setOpen] = useState(false);
//   const [loadedOptions, setLoadedOptions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [inputValue, setInputValue] = useState("");

//   const transformOptions = (apiData) => {
//     return Array.isArray(apiData)
//       ? apiData.map((item) => item.title || item.name || item)
//       : options;
//   };

//   useEffect(() => {
//     if (!open) return;

//     let active = true;
//     setLoading(true);

//     const debounce = setTimeout(async () => {
//       const data = await searchClinicalTrials(
//         inputValue,
//         isGrouped ? "main_filter" : fieldType,
//         filters,
//       );
//       if (active) {
//         setLoadedOptions(transformOptions(data?.[fieldType]));
//         setLoading(false);
//       }
//     }, 300);

//     return () => {
//       active = false;
//       clearTimeout(debounce);
//     };
//   }, [open, inputValue, filters, fieldType, sectionType]);

//   const highlightMatch = (text, searchValue) => {
//     if (!searchValue) return text;
//     const regex = new RegExp(`(${searchValue})`, "gi");
//     return text
//       .split(regex)
//       .map((part, i) =>
//         regex.test(part) ? <strong key={i}>{part}</strong> : part,
//       );
//   };

//   return (
//     <Autocomplete
//       multiple
//       disableCloseOnSelect
//       disableClearable
//       // options={options}
//       open={open}
//       onOpen={() => setOpen(true)}
//       onClose={() => setOpen(false)}
//       inputValue={inputValue}
//       onInputChange={(_, newValue) => setInputValue(newValue)}
//       options={loadedOptions}
//       loading={loading}
//       getOptionLabel={(option) => option}
//       noOptionsText="No result found"
//       popupIcon={<ExpandMoreIcon style={{ color: "rgba(0,0,0,0.4)" }} />}
//       value={value}
//       onChange={(event, newValue) => {
//         onChange && onChange(newValue);

//         setTimeout(() => {
//           inputRef.current?.blur();
//           document.activeElement?.blur();
//         }, 0);
//       }}
//       disablePortal={false}
//       slotProps={{
//         popper: {
//           sx: { zIndex: 99999 },
//         },
//       }}
//       classes={{
//         root: classes.root,
//         popper: classes.popper,
//         option: classes.option,
//       }}
//       renderValue={() => null}
//       renderOption={(props, option, { selected, inputValue }) => {
//         return (
//           <li {...props}>
//             <Checkbox
//               icon={icon}
//               checkedIcon={checkedIcon}
//               checked={selected}
//               size="small"
//               sx={{
//                 "& .MuiSvgIcon-root": {
//                   fontSize: 16,
//                 },
//                 "&.Mui-checked": { color: "#2666BE" },
//                 color: "#00000066",
//               }}
//             />
//             <Typography
//               fontSize={14}
//               fontFamily="Rubik !important"
//               color={selected ? "#000000" : "#00000099"}
//             >
//               {highlightMatch(option, inputValue)}
//             </Typography>
//           </li>
//         );
//       }}
//       renderInput={(params) => (
//         <TextField {...params} placeholder={placeholder} inputRef={inputRef} />
//       )}
//     />
//   );
// }

import { useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  Checkbox,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { searchClinicalTrials } from "../api/mainSearch";
import { apiPayloadInterventionType, buildFilterPayload, decodeUnicodeEscapes } from "../utils/helpers/helper";
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
// import { useDispatch } from "react-redux";
// import { fetchCards } from "../redux/trialsDataSlice";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const useStyles = makeStyles({
  root: {
    "& .MuiOutlinedInput-root": {
      height: 36,
      paddingRight: 35,
      padding: "7px !important",
      borderRadius: 6,
      boxShadow: "1px 4px 24px rgba(153, 169, 190, 0.2)",
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
  },
  popper: {
    marginTop: 8,
    borderRadius: 8,
    boxShadow: "1px 4px 24px rgba(153, 169, 190, 0.2)",
    "& .MuiAutocomplete-listbox": {
      scrollbarWidth: "thin",
      "& .MuiAutocomplete-option[aria-selected='true']": {
        backgroundColor: "unset !important",
        fontWeight: "559",
      },
      "& .MuiAutocomplete-option.Mui-focused": {
        backgroundColor: "rgba(0, 0, 0, 0.06) !important",
      },
    },
  },
  option: {
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    padding: "0 !important",
  },
});

const performanceStatusLabelMap = {
  0: "ECOG 0–1",
  1: "ECOG 0–2",
  2: "ECOG 0–3",
  3: "ECOG 0–4",
};

export default function DropdownWithChecklist({
  placeholder,
  value = [],
  onChange,
  options = [],
  filters = {},
  fieldType = "",
  sectionType = "",
  isGrouped = false,
  accordionExpanded,
  onAccordionChange,
}) {
  const inputRef = useRef(null);
  const highlightedRef = useRef(null);
  const classes = useStyles();

  const [open, setOpen] = useState(false);
  const [loadedOptions, setLoadedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const isAccordionControlled = typeof accordionExpanded === "boolean";
  const [localExpandMore, setLocalExpandMore] = useState(false);
  const isExpandMore = isAccordionControlled ? accordionExpanded : localExpandMore;
  // const dispatch = useDispatch();

  const transformOptions = (apiData) => {
    if (!Array.isArray(apiData)) return options;

    // ✅ Special handling for performance_status
    if (fieldType === "performance_status") {
      return apiData
        .slice()
        .sort((a, b) => a - b)
        .map((value) => ({
          id: value,
          label: performanceStatusLabelMap[value] || value,
          value: value,
        }));
    }

    // Default behavior
    return apiData.map((item) => decodeUnicodeEscapes(item.title || item.name || item));
  };

  useEffect(() => {
    if (!open) return;
    // debugger
    let active = true;
    setLoading(true);
    const payloadFilters = buildFilterPayload(filters, 1);
    const debounce = setTimeout(async () => {
      let data = await searchClinicalTrials(
        inputValue,
        isGrouped ? "main_filter" : fieldType,
        // apiPayloadInterventionType(filters),
        payloadFilters
      );
      if (active) {
        if (fieldType === "primary_endpoint_main") {
          // data = {
          //   "Survival-based": [
          //     "OS (Overall Survival)",
          //     "PFS (Progression-Free Survival)",
          //     "DFS (Disease-Free Survival)",
          //     "EFS (Event-Free Survival)",
          //     "TTP (Time to Progression)"
          //   ],
          //   "Response-based": [
          //     "ORR (Overall Response Rate)",
          //     "pCR (Pathologic Complete Response)",
          //     "DOR (Duration of Response)",
          //     "DCR (Disease Control Rate)",
          //     "MRD negativity"
          //   ],
          //   "Biomarker / Molecular": [
          //     "ctDNA clearance",
          //     "Biomarker response rate"
          //   ],
          //   "Molecular remission Safety": [
          //     "DLT (Dose-Limiting Toxicity)",
          //     "MTD (Maximum Tolerated Dose)",
          //     "RP2D (Recommended Phase 2 Dose)"
          //   ],
          //   "AE rate Other": [
          //     "PRO / QoL",
          //     "PK / Pharmacokinetics",
          //     "Immunogenicity"
          //   ]
          // }

          const formatted = [];

          Object.entries(data).forEach(([title, subtypes]) => {
            // Push parent
            formatted.push({
              id: title,
              label: decodeUnicodeEscapes(title),
              flag: "parent",
              type: null,
              children: subtypes,
            });

            // Push children
            subtypes.forEach((sub) => {
              formatted.push({
                id: `${title}-${sub}`,
                label: decodeUnicodeEscapes(sub),
                flag: "child",
                type: null,
                parent: title,
                len: subtypes.length
              });
            });
          });
          setLoadedOptions(formatted);
          setLoading(false);
        } else {

          // Need to remove this dummy data logic
          if (!data || data.error) {
            data = {
              [fieldType]: []
            }
          }

          const transform_data = transformOptions(data?.[fieldType]);
          const stageObjects = transform_data.map((item) => ({
            label: item,
            type: null // or 'include' based on your default
          }));

          setLoadedOptions(stageObjects);
          // if(data) {
          //   dispatch(
          //     fetchCards({
          //       groupedFilters: payloadFilters,
          //       flag: isGrouped ? "main_filter" : fieldType,
          //       // session_key: sessionKey,
          //     }),
          //   ).then((res) => {
          //     console.log(
          //       "Fetched cards after filter update:",
          //       res.payload.session_key,
          //     );
          //     // setFilters(...filters, res.payload.payload);
          //     // setStoreSessionKey(res.payload.session_key);
          //   });
          // }
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [open, inputValue, filters, fieldType, sectionType]);

  const highlightMatch = (text, searchValue) => {
    if (!searchValue) return text;
    const regex = new RegExp(`(${searchValue})`, "gi");
    return text
      .split(regex)
      .map((part, i) =>
        regex.test(part) ? <strong key={i}>{part}</strong> : part,
      );
  };

  const getOptionKey = (option) => {
    if (fieldType === "intervention_type") {
      return option?.id ?? `${option?.parent || "root"}-${option?.label || ""}`;
    }

    if (fieldType === "performance_status") {
      return option?.id ?? option?.value ?? option?.label;
    }

    if (typeof option === "string") {
      return option;
    }

    return option?.id ?? option?.value ?? option?.label ?? option?.title;
  };

  const formatSelectedText = () => {
    const selected = filters?.[fieldType] ?? [];

    const labels = selected.map((item) => {
      if (typeof item === "object") return item.label ?? item.value ?? "";
      return item;
    }).filter(Boolean);

    if (labels.length === 0) return null;

    const firstLabel = labels[0];
    const extra = labels.length > 1 ? labels.length - 1 : 0;

    // ✅ Truncate first label at 20 chars
    const truncated = firstLabel.length > 20
      ? `${firstLabel.slice(0, 17)}...`
      : firstLabel;

    return { visible: truncated, extra };
  };

  const selectedSummary = formatSelectedText();
  const overflowCount = filters[fieldType]?.length > 0 ? filters[fieldType]?.length - 1 : 0;
  return (

    <Accordion
      disableGutters
      elevation={0}
      expanded={isExpandMore}
      onChange={(_, expanded) => {
        if (isAccordionControlled) {
          onAccordionChange?.(expanded);
        } else {
          setLocalExpandMore(expanded);
        }
        if (expanded) {
          setTimeout(() => inputRef.current?.focus(), 50);
        } else {
          setOpen(false);
        }
      }}
      TransitionProps={{ unmountOnExit: true, timeout: 0 }}
      sx={{ height: isExpandMore ? 'auto' : '30px', background: isExpandMore ? '#F2F2F6' : '#ffffff', }}
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
            flexShrink: 0,
            transition: "transform 150ms ease",
          },
          "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
            transform: "rotate(180deg)",
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
            minWidth: 0,          // key — allows children to shrink
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
              whiteSpace: "nowrap",   // never wrap
              flexShrink: 0,          // label never shrinks
            }}
          >
            {placeholder}
          </Typography>

          {/* Selected summary */}
          <Typography
            sx={{
              fontSize: 13,
              color: selectedSummary ? "#000000CC" : "#00000066",
              fontFamily: "Rubik",
              textAlign: "right",
              whiteSpace: "nowrap",     // never wrap
              overflow: "hidden",
              textOverflow: "ellipsis", // truncate with ...
              minWidth: 0,
              flexShrink: 1,            // shrinks before label does
            }}
          >
            {selectedSummary ? (
              <>
                {selectedSummary.visible}
                {selectedSummary.extra > 0 && (
                  <Box component="span" sx={{ color: "#2666BE", fontWeight: 600, ml: 0.5 }}>
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
          multiple
          disableCloseOnSelect
          disableClearable
          // options={options}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
          options={loadedOptions}
          loading={loading}
          // getOptionLabel={(option) => option}
          getOptionLabel={(option) => {
            if (fieldType === "intervention_type") return option.label;
            if (fieldType === "performance_status") return option.label;
            return option.value || option.label || "";
          }}
          // isOptionEqualToValue={(opt, val) => opt.id === val.id}
          isOptionEqualToValue={(opt, val) => {
            if (fieldType === "intervention_type") {
              return opt?.id === val?.id;
            }

            if (fieldType === "performance_status") {
              return opt?.value === val?.value;
            }

            return opt.label === val.label;
          }}
          // noOptionsText="No result found"
          noOptionsText={
            inputValue.trim().length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 3,
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: "#e0e0e0",
                    mb: 1,
                  }}
                />
                <Typography
                  sx={{ fontSize: 14, fontFamily: "Rubik", color: "#555" }}
                >
                  No results!
                  {/* found for{" "}
                                                          <strong>&quot;{inputValue}&quot;</strong> */}
                </Typography>
                <Typography
                  sx={{ fontSize: 14, fontFamily: "Rubik", color: "#555" }}
                >
                  No results!
                  {/* Try a different keyword or contact us. */}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    // your contact us handler here
                    window.open("mailto:support@oncosuite.com", "_blank");
                  }}
                  sx={{
                    mt: 1,
                    textTransform: "none",
                    fontFamily: "Rubik",
                    fontSize: 13,
                    backgroundColor: "#e3edf9",
                    color: "#1976d2",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#cfe0f5",
                      boxShadow: "none",
                    },
                  }}
                >
                  Contact Us
                </Button>
              </Box>
            ) : "No records found"
          }
          // popupIcon={<ExpandMoreIcon style={{ color: "rgba(0,0,0,0.4)" }} />}
          popupIcon={null}
          value={value}
          // onChange={(event, newValue) => {
          //   onChange && onChange(newValue);

          //   setTimeout(() => {
          //     inputRef.current?.blur();
          //     document.activeElement?.blur();
          //   }, 0);
          // }}
          onHighlightChange={(_, option) => { highlightedRef.current = option; }}
          onChange={(event, newValue, reason, details) => {
            if (event?.type === 'keydown' && event?.key === 'Enter') return;
            const option = details.option;
            if (fieldType === "performance_status") {
              onChange(newValue.map((item) => item.value));
            } else if (fieldType === "primary_endpoint_main") {
              const count = value.filter(x => x.id.includes(option.parent) && x.id !== option.id).length;
              if (count + 1 === option.len) {
                let data = loadedOptions.find(x => x.id === option.parent)
                const obj = { ...option, parentData: data }
                onChange(obj);
              } else {
                onChange(option)
              }
            } else {
              onChange(option);
            }
          }}

          // onChange={(event, newValue, reason, details) => {
          //                               debugger
          //                               if (reason === 'selectOption' || reason === 'removeOption') {
          //                                   onChange(details.option);
          //                               }
          //                           }}
          disablePortal
          filterOptions={(x) => x}
          classes={{
            root: classes.root,
            popper: classes.popper,
            option: classes.option,
          }}
          renderValue={() => null}
          renderOption={(props, option, { selected, inputValue }) => {
            const { key, ...optionProps } = props;
            const isChild = option?.flag == "child";
            const status = Object.keys(filters).length > 0 ? filters[fieldType]?.find(x => x.label === option.label)?.type : null;

            return (
              <li key={key} {...optionProps}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    pl: isChild ? 4 : 1.5,
                  }}
                >
                  <Checkbox
                    icon={icon}
                    checkedIcon={
                      status === 'included' ? (
                        <CheckBoxIcon fontSize="small" sx={{ color: '#1976d2' }} />
                      ) : (
                        <DisabledByDefaultIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                      )
                    }
                    checked={selected}
                    size="small"
                    sx={{
                      "& .MuiSvgIcon-root": {
                        fontSize: 16,
                      },
                      "&.Mui-checked": { color: "#2666BE" },
                      color: "#00000066",
                    }}
                  />

                  <Typography
                    fontSize={14}
                    fontFamily="Rubik"
                    fontWeight={isChild ? 400 : 500}
                    color={selected ? "#000000" : "#00000099"}
                  >
                    {fieldType === "intervention_type"
                      ? option.label
                      : fieldType === "performance_status"
                        ? option.label
                        : highlightMatch(option.label, inputValue)}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#FFFFFF",
                },
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && highlightedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  const option = highlightedRef.current;
                  if (fieldType === "performance_status") {
                    const already = value.some(v => v === option.value);
                    onChange(already
                      ? value.filter(v => v !== option.value)
                      : [...value, option.value]
                    );
                  } else if (fieldType === "primary_endpoint_main") {
                    const count = value.filter(x => x.id.includes(option.parent) && x.id !== option.id).length;
                    if (count + 1 === option.len) {
                      const parentData = loadedOptions.find(x => x.id === option.parent);
                      onChange({ ...option, parentData });
                    } else {
                      onChange(option);
                    }
                  } else {
                    onChange(option);
                  }
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: "rgba(0,0,0,0.4)" }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </AccordionDetails>
    </Accordion>
  );
}
