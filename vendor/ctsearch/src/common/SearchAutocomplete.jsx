import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";

// Default export: a small, reusable MUI Autocomplete search component.
// Props:
//  - options: string[] (autocomplete suggestions)
//  - onSearch: function(query) called when user clicks search or presses Enter
//  - placeholder: string

export default function SearchAutocomplete({
    options = [],
    onSearch,
    placeholder = "Search...",
    className = "",
    sx = {},
}) {
    const [value, setValue] = React.useState(null);
    const [inputValue, setInputValue] = React.useState("");

    const handleSearch = (q) => {
        const query = (q ?? inputValue ?? "").trim();
        if (!query) return; // ignore empty searches
        if (onSearch) onSearch(query);
        else void query;
    };

    return (
        <Box className="w-full max-w-md">
            <Autocomplete
                freeSolo
                options={options}
                value={value}
                inputValue={inputValue}
                onChange={(event, newValue) => {
                    setValue(newValue);
                    // if user selects an option, trigger search immediately
                    if (typeof newValue === "string") handleSearch(newValue);
                }}
                sx={sx}

                onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        className={className}
                        placeholder={placeholder}
                        variant="outlined"
                        size="small"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch(inputValue);
                            }
                        }}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconButton
                                        edge="start"
                                        onClick={() => handleSearch(inputValue)}
                                        aria-label="search"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
        </Box>
    );
}

/*
Example usage (in your app):

import SearchAutocomplete from './SearchAutocomplete';

function App() {
  const options = ['Apple', 'Banana', 'Cherry', 'Durian'];
  const handleSearch = (q) => {
    // perform navigation, API call, etc.
    void q;
  };

  return (
    <div className="p-6">
      <SearchAutocomplete options={options} onSearch={handleSearch} placeholder="Search fruits..." />
    </div>
  );
}
*/
