import React, { useState, useRef, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Box,
  Typography,
  Paper,
  Popper,
  ClickAwayListener,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { makeStyles } from "@mui/styles";
import { searchClinicalTrials } from "../api/mainSearch";

const useStyles = makeStyles({
  inputBox: {
    "& .MuiOutlinedInput-root": {
      height: 36,
      paddingRight: 35,
      borderRadius: 6,
      boxShadow: "1px 4px 24px rgba(153, 169, 190, 0.2)",
      "&.Mui-focused fieldset": {
        borderColor: "rgba(0, 0, 0, 0.8) !important",
        borderWidth: "2px",
      },
      "& input": {
        fontSize: "15px",
        fontFamily: "Rubik !important",
      },
    },
    "& .MuiAutocomplete-endAdornment": {
      top: "50%",
      transform: "translateY(-50%)",
    },
  },
  popper: {
    zIndex: 99999,
  },
  dropdown: {
    borderRadius: 12,
    padding: 10,
    boxShadow: "1px 4px 24px rgba(153,169,190,0.2)",
    width: "100%",
  },
  radioOption: {
    margin: 0,
    width: "100%",
    marginLeft: "0px !important",
    // padding: "6px 0",
  },
  sliderBox: {
    paddingTop: 10,
  },
  typography_label: {
    color: "#00000099",
    fontFamily: "Rubik !important",
    fontSize: "14px",
    fontWeight: "420",
  },
  slider: {
    height: 4,
    "& .MuiSlider-track": {
      border: "none",
      height: 4,
      backgroundColor: "#2666BE",
    },

    "& .MuiSlider-rail": {
      opacity: 1,
      height: 4,
      backgroundColor: "#E0E0E0",
    },
    "& .MuiSlider-valueLabel": {
      fontSize: "12px",
      fontFamily: "Rubik",
      background: "#FFFFFF !important",
      color: "#60545C !important",
    },
    "& .MuiSlider-thumb": {
      width: 22,
      height: 22,
      borderRadius: "8px",
      backgroundColor: "white",
      border: "4px solid #2666BE",
      boxShadow: "none",
      //  For the Box Shadow
      //   "&:hover": {
      //     boxShadow: "0px 0px 4px rgba(26,115,232,0.4)",
      //   },

      //   "&.Mui-active": {
      //     boxShadow: "0px 0px 6px rgba(26,115,232,0.5)",
      //   },
    },
  },
});

const AGE_OPTIONS = [
  { label: "Pediatric (<18)", value: "pediatric", range: [0, 17] },
  { label: "Adolescent & Young Adult (15-39)", value: "aya", range: [15, 39] },
  { label: "Adult (18-64)", value: "adult", range: [18, 64] },
  { label: "Older adults (>65)", value: "older", range: [65, 100] },
  { label: "All ages", value: "all", range: [18, 64], isCustom: true },
];

const SITE_OPTIONS = [
  { label: "Single Site", value: "single", range: [1, 1] },
  { label: "2–20", value: "2_20", range: [2, 20] },
  { label: "20–100", value: "20_100", range: [20, 100] },
  { label: "≥500", value: "500_plus", range: [500, 1000] },
];

const ESTIMATEDENROLLMENT_OPTIONS = [
  { label: "< 50", value: "lt_50", range: [1, 49] },
  { label: "50–150", value: "50_150", range: [50, 150] },
  { label: "150–500", value: "150_500", range: [150, 500] },
  { label: "All", value: "all", range: [1, 1000], isAll: true },
];

export default function RadioButtonWithRange({
  placeholder,
  value = [18, 64],
  onChange,
  inputValue = "",
  filters = {},
  fieldType = "",
  isGrouped = false,
}) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const popperRef = useRef(null);
  const [loadedOptions, setLoadedOptions] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (fieldType === "age") {
      setLoadedOptions(AGE_OPTIONS);
    } else if (fieldType === "sites_count") {
      setLoadedOptions(SITE_OPTIONS);
    } else if (fieldType === "estimated_enrollment") {
      setLoadedOptions(ESTIMATEDENROLLMENT_OPTIONS);
    } else {
      searchClinicalTrials(
        inputValue,
        isGrouped ? "main_filter" : fieldType,
        filters,
      ).then((res) => setLoadedOptions(res?.[fieldType]));
    }
  }, [open, fieldType]);

  const handleSliderChange = (e, val) => {
    onChange?.(val);
  };

  const handleRadioChange = (e) => {
    const selectedValue = e.target.value;
    const found = loadedOptions.find((o) => o.value === selectedValue);

    if (!found) return;
    onChange?.(found.range);
  };

  const selectedRadioValue = React.useMemo(() => {
    if (!Array.isArray(value)) return "";

    const match = loadedOptions.find(
      (opt) =>
        opt.range && opt.range[0] === value[0] && opt.range[1] === value[1],
    );

    return match?.value || "";
  }, [value, loadedOptions]);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box width="100%" position="relative">
        {/* INPUT */}
        <Autocomplete
          ref={anchorRef}
          open={false}
          options={[]}
          disableClearable
          popupIcon={
            !open ? (
              <ExpandMoreIcon style={{ color: "rgba(0,0,0,0.4)" }} />
            ) : (
              <ExpandLessIcon style={{ color: "rgba(0,0,0,0.4)" }} />
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              onClick={() => setOpen(!open)}
              placeholder={placeholder}
              className={classes.inputBox}
            />
          )}
        />

        {/* CUSTOM POPPER */}
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          className={classes.popper}
          modifiers={[
            { name: "offset", options: { offset: [0, 6] } },
            {
              name: "sameWidth",
              enabled: true,
              phase: "beforeWrite",
              requires: ["computeStyles"],
              fn: ({ state }) => {
                state.styles.popper.width = `${state.rects.reference.width}px`;
              },
              effect: ({ instance }) => {
                const observer = new ResizeObserver(() => {
                  instance.update();
                });
                observer.observe(instance.state.elements.reference);
                return () => observer.disconnect();
              },
            },
          ]}
        >
          <Paper ref={popperRef} className={classes.dropdown}>
            {/* RADIO LIST */}
            <RadioGroup value={selectedRadioValue} onChange={handleRadioChange}>
              {loadedOptions?.map((item) => (
                <FormControlLabel
                  key={item.value}
                  value={item.value}
                  control={
                    <Radio
                      size="small"
                      sx={{
                        "&.Mui-checked": {
                          color: "#2666BE",
                        },
                      }}
                    />
                  }
                  sx={{
                    "& .MuiFormControlLabel-root": {
                      marginLeft: "0px !Important",
                    },
                  }}
                  label={
                    <Typography
                      sx={{
                        color: "#00000099",
                        fontFamily: "Rubik",
                        fontSize: "15px",
                        fontWeight: "440",
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                  className={classes.radioOption}
                />
              ))}
            </RadioGroup>

            {/* SLIDER */}
            <Box className={classes.sliderBox}>
              <Box
                display="flex"
                justifyContent="space-between"
                gap="20px"
                mb={1}
              >
                <Typography className={classes.typography_label}>
                  {fieldType === "sites_count"
                    ? 1
                    : fieldType === "estimated_enrollment"
                      ? 0
                      : 0}
                </Typography>

                <Slider
                  className={classes.slider}
                  // value={Array.isArray(value) ? value : [18, 64]}
                  value={
                    Array.isArray(value) && value?.length === 2
                      ? value
                      : fieldType === "sites_count"
                        ? [1, 20]
                        : fieldType === "estimated_enrollment"
                          ? [50, 150]
                          : [18, 64]
                  }
                  onChange={handleSliderChange}
                  min={
                    fieldType === "sites_count"
                      ? 1
                      : fieldType === "estimated_enrollment"
                        ? 0
                        : 0
                  }
                  max={
                    fieldType === "sites_count"
                      ? 1000
                      : fieldType === "estimated_enrollment"
                        ? 500
                        : 100
                  }
                  step={1}
                  disableSwap
                  valueLabelDisplay="on"
                />
                {/* {Array.isArray(value) &&
                  value.map((val, index) => {
                    const percent = (val / 100) * 100;

                    return (
                      <Typography
                        key={index}
                        sx={{
                          position: "absolute",
                          top: 235, // adjust based on slider height
                          left: `calc(${percent}% - -25px)`,
                          transform: "translateX(-50%)",
                          fontSize: "13px",
                          fontFamily: "Rubik",
                          color: "#00000099",
                        }}
                      >
                        {val}
                      </Typography>
                    );
                  })} */}
                <Typography className={classes.typography_label}>
                  {fieldType === "sites_count"
                    ? 1000
                    : fieldType === "estimated_enrollment"
                      ? 500
                      : 100}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
