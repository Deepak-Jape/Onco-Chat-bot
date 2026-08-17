import { useRef } from "react";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const icon = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />;
const checkedIcon = <CheckBoxIcon sx={{ fontSize: 16 }} />;

export default function MultiSelectWithCheckbox({
  options,
  placeholder,
  width,
  value,
  onChange,
  padding,
  onSelectChange,
}) {
  const highlightedRef = useRef(null);

  return (
    <Autocomplete
      multiple
      popupIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
      id="checkboxes-tags-demo"
      options={options}
      limitTags={1}
      value={value}
      clearIcon={null}
      onChange={(event, newValue, reason, details) => {
        if (event?.type === 'keydown' && event?.key === 'Enter') return;
        onChange(newValue);
        if (details?.option && onSelectChange) {
          onSelectChange(details.option);
        }
      }}
      onHighlightChange={(_, option) => { highlightedRef.current = option; }}
      disableCloseOnSelect
      getOptionLabel={(option) => option.name}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <li
            style={{
              height: "23px",
              fontSize: "12px",
              fontFamily: "Rubik",
            }}
            key={key}
            {...optionProps}
          >
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{
                marginRight: 4,
              }}
              checked={selected}
            />
            {option.name}
          </li>
        );
      }}
      style={{
        width: width,
        background: "rgba(255, 255, 255, 0.5)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "Rubik",
      }}
      sx={{
        "& .MuiInputBase-root": {
          minHeight: "44px",
          alignItems: "center",
          color: "#6B7280",
        },

        "& .MuiInputBase-root.MuiInputBase-sizeSmall": {
          minHeight: "44px",
        },

        "& .MuiAutocomplete-inputRoot": {
          padding: padding,
        },
        "& .MuiAutocomplete-tag": {
          marginTop: "1.5px",
          marginBottom: "1.5px",
          borderRadius: "4px",
          fontSize: "12px",
          height: "19px",
          fontFamily: "Rubik",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          color: "#6B7280",
          width: "200px",
          "& .MuiAutocomplete-tagSizeMedium": {
            fontSize: "14px",
            width: "40px !important",
            color: "#6B7280",
          },
        },
        "& .MuiInputAdornment-root": {
          fontSize: "16px !important",
          fontFamily: "Rubik",
          color: "#6B7280",
        },
        "& .MuiChip-deleteIcon": {
          height: "16px",
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            // borderColor: "transparent",
          },
          "&:hover fieldset": {
            borderColor: "transparent",
          },
          "&.Mui-focused fieldset": {
            borderColor: "transparent",
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value?.length ? "" : placeholder}
          sx={{
            fontSize: "12px",
            fontFamily: "Rubik",
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && highlightedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              const opt = highlightedRef.current;
              const already = value?.some(v => v.name === opt.name);
              const newValue = already ? value.filter(v => v.name !== opt.name) : [...(value || []), opt];
              onChange(newValue);
              if (onSelectChange) onSelectChange(opt);
            }
          }}
          InputProps={{
            ...params.InputProps,

            startAdornment: (
              <>
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>

                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
