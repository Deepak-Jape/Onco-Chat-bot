import { useEffect, useState } from "react";
import {
  FormControl,
  MenuItem,
  Radio,
  Select,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { searchClinicalTrials } from "../api/mainSearch";

const useStyles = makeStyles({
  select: {
    height: "36px",
    borderRadius: "6px",
    background: "white",
    "& .MuiSelect-select": {
      textAlign: "left",
      color: "#00000099",
      fontSize: "15px",
      fontFamily: "Rubik !important",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(0, 0, 0, 0.8) !important",
      borderWidth: "2px",
    },
    "& .MuiTypography-root": {
      fontSize: "15px",
    },
  },
  paper: {
    borderRadius: "12px",
    boxShadow: "0px 4px 20px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    fontFamily: "Rubik !important",
    color: "#00000099",
    padding: "0px 16px",
  },
  radio: {
    "&.Mui-checked": {
      color: "#2666BE",
    },
  },
  placeholder: {
    color: "#999",
    textAlign: "left",
  },
  typography: {
    fontFamily: "Rubik !important",
    color: "#00000099",
  },
});

export default function DropdownRadioButton({
  placeholder,
  value = "",
  onChange,
  inputValue = "",
  filters = {},
  fieldType = "",
  isGrouped = false,
}) {
  const classes = useStyles();
  const [loadedOptions, setLoadedOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    searchClinicalTrials(
      inputValue,
      isGrouped ? "main_filter" : fieldType,
      filters,
    ).then((res) => setLoadedOptions(res?.[fieldType]));
  }, [open]);

  return (
    <FormControl fullWidth>
      <Select
        displayEmpty
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          onChange?.(val ? [val] : []);
        }}
        IconComponent={ExpandMoreIcon}
        renderValue={(selected) =>
          selected?.length ? (
            selected[0]
          ) : (
            <Typography className={classes.placeholder}>
              {placeholder}
            </Typography>
          )
        }
        className={classes.select}
        MenuProps={{
          disablePortal: true,
          container: document.body,
          PaperProps: {
            sx: {
              borderRadius: "12px",
              boxShadow:
                "0px 4px 20px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)",
              zIndex: 999999,
            },
          },
          anchorOrigin: {
            vertical: "top",
          },
          transformOrigin: {
            horizontal: "center",
          },
        }}
      >
        {loadedOptions
          ?.filter((opt) => opt && opt !== "")
          ?.map((opt) => (
            <MenuItem
              key={opt}
              value={opt}
              sx={{
                display: "flex",
                alignItems: "center",
                fontFamily: "Rubik !important",
                color: "#00000099",
                padding: "0px 8px",
              }}
            >
              <Radio
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "Rubik !important",
                  color: "#00000099",
                  padding: "3px",
                  fontSize: "14px",
                  "& .MuiSvgIcon-root": {
                    fontSize: 18,
                  },
                }}
                checked={Array?.isArray(value) && value?.includes(opt)}
                className={classes.radio}
              />
              <Typography
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "Rubik !important",
                  color: "#00000099",
                  padding: "0px 8px",
                  fontSize: "14px !important",
                }}
                className={classes.typography}
                fontSize={16}
              >
                {opt}
              </Typography>
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
