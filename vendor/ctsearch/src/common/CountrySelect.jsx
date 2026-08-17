import { useMemo } from "react";
import { FormControl, Select, MenuItem, Box, Typography } from "@mui/material";
import { getData } from "country-list";

export default function CountrySelect({
  value,
  onChange,
  label = "Select Country",
  fullWidth = true,
  disabled = false,
  size = "medium",
  width = "",
  height = "",
  flag = false,
  onOpen,
}) {
  const countries = useMemo(() => {
    return getData().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const getFlagUrl = (code) =>
    `https://flagcdn.com/w20/${code.toLowerCase()}.png`;

  return (
    <FormControl fullWidth={fullWidth} size={size}>
      <Select
        value={value || ""}
        onChange={onChange}
        displayEmpty
        onOpen={onOpen}
        disabled={disabled}
        renderValue={(selected) => {
          if (!selected) return label;

          const selectedCountry = countries?.find((c) => c.name === selected);

          return (
            <Box display="flex" alignItems="center" gap={1}>
              {flag && (
                <img
                  src={getFlagUrl(selectedCountry.code)}
                  alt={selectedCountry.name}
                  width="20"
                  height="14"
                  style={{ borderRadius: "2px" }}
                />
              )}
              <Typography sx={{ fontSize: "14px", fontFamily: "Rubik" }}>
                {selected}
              </Typography>
            </Box>
          );
        }}
        sx={{
          fontSize: "14px",
          fontFamily: "Rubik",
          background: "#FFFFFF",
          width: width || "",
          height: height || "",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D0D5DD",
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#98A2B3",
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#344054",
            borderWidth: "2px",
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              mt: 1,
              borderRadius: 2,
            },
          },
        }}
      >
        {countries?.map((country) => (
          <MenuItem
            key={country.code}
            value={country.name}
            sx={{
              fontSize: "14px",
              fontFamily: "Rubik",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {flag && (
                <img
                  src={getFlagUrl(country.code)}
                  alt={country.name}
                  width="20"
                  height="14"
                  style={{ borderRadius: "2px" }}
                />
              )}
              {country.name}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
