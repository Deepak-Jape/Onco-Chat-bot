import { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import { searchClinicalTrials } from "../api/mainSearch";

const useStyles = makeStyles({
  textfield: {
    "& .MuiOutlinedInput-root": {
      height: "36px",
      borderRadius: "6px",
      background: "#fff",

      "&.Mui-focused fieldset": {
        borderColor: "rgba(0,0,0,0.8)",
        borderWidth: "2px",
      },
    },
  },
});

const SearchFieldFilter = ({
  placeholder,
  value = [],
  onChange,
  filters,
  fieldType,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [loadedOptions, setLoadedOptions] = useState([]);

  // Sync when external filter changes
  useEffect(() => {
    setInputValue(value?.[0] || "");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    searchClinicalTrials(inputValue, fieldType, filters).then((res) =>
      setLoadedOptions(res?.[fieldType]),
    );
  }, [open]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // IMPORTANT: always send array
    if (val.trim()) {
      onChange([val.trim()]);
    } else {
      onChange([]);
    }
  };
  const classes = useStyles();
  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      className={classes.textfield}
    />
  );
};

export default SearchFieldFilter;
