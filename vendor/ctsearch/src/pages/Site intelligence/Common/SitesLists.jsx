import React, { useState, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Switch,
  Checkbox,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Divider,
  Slider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SortIcon from "@mui/icons-material/Sort";
import { makeStyles } from "@mui/styles";
import SiteDetailView from "./SiteDetailView";
import ScoreIndicator from "./ScoreIndicator";
import smallLocationIcon from "../../../assets/icons/location_small.svg";
import RightCardSkeleton from "../../../../src/pages/trialsHeader/trials/RightCardSkeleton";
import CohortFilter from "./CohortFilter";
import CountryFlag from '../../../common/GetFlags';
// import editInfoIcon from "../../../assets/icons/editInfo.svg"
// Real SVG flag components (no font/emoji rendering involved) — this avoids
// the classic cross-platform bug where flag *emoji* (built from Unicode
// regional-indicator letters) silently falls back to plain two-letter text
// on platforms whose fonts lack flag glyphs, most notably Windows/Chrome.
// `npm install country-flag-icons` to add this dependency.
// import { US } from "country-flag-icons/react/3x2";

// Central place to add more countries as the app supports them —
// keeps the mapping in one spot instead of scattering `if` chains.
// const COUNTRY_FLAG_COMPONENTS = {
//   US,
// };

// const CountryFlag = ({ countryCode, size = 18 }) => {
//   const FlagComponent = COUNTRY_FLAG_COMPONENTS[countryCode];
//   if (!FlagComponent) return null;
//   return (
//     <FlagComponent
//       title={countryCode}
//       style={{ width: size, height: size * 0.75, borderRadius: "2px", flexShrink: 0 }}
//     />
//   );
// };

// Single source of truth for dropdown height — both FilterDropdown and the
// CohortFilter wrapper reference this so they can never drift apart again.
const DROPDOWN_HEIGHT = 40;
const EditInfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8" stroke="#2666BE" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.2494 1.75015C12.5146 1.48493 12.8743 1.33594 13.2494 1.33594C13.6245 1.33594 13.9842 1.48493 14.2494 1.75015C14.5146 2.01537 14.6636 2.37508 14.6636 2.75015C14.6636 3.12522 14.5146 3.48493 14.2494 3.75015L8.24075 9.75948C8.08244 9.91765 7.88688 10.0334 7.67208 10.0962L5.75674 10.6562C5.69938 10.6729 5.63857 10.6739 5.58068 10.6591C5.5228 10.6442 5.46996 10.6141 5.42771 10.5719C5.38546 10.5296 5.35534 10.4768 5.34051 10.4189C5.32568 10.361 5.32668 10.3002 5.34341 10.2428L5.90341 8.32748C5.96643 8.11285 6.08243 7.91752 6.24075 7.75948L12.2494 1.75015Z" stroke="#2666BE" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

const SitesLists = ({ cohorts }) => {
  const [selectedSiteName, setSelectedSiteName] = useState(
    "Memorial Sloan Kettering Cancer Center",
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // NEW: "Auto-select best sites" toggle state
  const [autoSelectBestSites, setAutoSelectBestSites] = useState(false);
const [fitScore, setFitScore] = useState([10, 90]);

  // NEW: tracks which sites are checked (comparison/selection use-case),
  // kept separate from `selectedSiteName` (which drives the detail panel)
  // because a user should be able to check multiple sites while only
  // ever viewing one detail panel at a time.
  const [checkedSiteIds, setCheckedSiteIds] = useState(new Set());

  const scrollRef = useRef(null);
  const fullReportRef = useRef(null);
  const handleScroll33 = (e) => {
    /* your scroll logic */
  };

  const countries = [
    { id: 1, name: "US", country: "United States" },
    { id: 2, name: "CH", country: "China" },
    { id: 3, name: "UK", country: "United Kingdom" },
  ];
  const [selected, setSelected] = useState(countries[0].id);

  const sites = [
    {
      name: "Memorial Sloan Kettering Cancer Center",
      score: 89,
      location: "New York, NY",
      countryCode: "US",
    },
    {
      name: "MD Anderson Cancer Center",
      score: 88,
      location: "Houston, TX",
      countryCode: "US",
    },
    {
      name: "Dana-Farber Cancer Institute",
      score: 85,
      location: "Boston, MA",
      countryCode: "US",
    },
    {
      name: "Stanford Cancer Institute",
      score: 84,
      location: "Stanford, CA",
      countryCode: "US",
    },
    {
      name: "Stanford Cancer Institute 2",
      score: 84,
      location: "Stanford, CA",
      countryCode: "US",
    },
    {
      name: "MD Anderson Cancer Center 2",
      score: 84,
      location: "Houston, TX",
      countryCode: "US",
    },
  ];

  // Auto-select best sites: when toggled on, automatically checks the
  // top-scoring sites instead of requiring manual selection. Recomputed
  // whenever the toggle or underlying site list changes.
  const autoSelectedIds = useMemo(() => {
    if (!autoSelectBestSites) return new Set();
    const topN = [...sites]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.name);
    return new Set(topN);
  }, [autoSelectBestSites]);

  const effectiveCheckedIds = autoSelectBestSites
    ? autoSelectedIds
    : checkedSiteIds;

  const toggleSiteChecked = (siteName) => {
    if (autoSelectBestSites) return; // ignore manual checks while automated
    setCheckedSiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteName)) {
        next.delete(siteName);
      } else {
        next.add(siteName);
      }
      return next;
    });
  };

  const selectedCard = sites.find((site) => site.name === selectedSiteName);

  return (
    <div
      className="flex h-screen w-full bg-blue-50"
      style={{ paddingBottom: "8%" }}
    >
      {loading ? (
        <div className="text-center w-full h-screen mt-3 z-20 text-gray-600 text-lg">
          {/* NOTE: `TrialSkeleton` was referenced but never imported in the
              original file. Swap this placeholder for your real skeleton
              component / import once you confirm its location. */}
          <RightCardSkeleton />
        </div>
      ) : (
        <>
          {/* LEFT COLUMN: Sites List Panel */}
          <div
            className="h-full flex flex-col font-inter"
            style={{ width: "25%", minWidth: "350px" }}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                height: "80%",
                gap: "12px",
              }}
            >
              {/* FIXED HEADER */}
              <Box
                sx={{
                  p: 3,
                  pb: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Rubik",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    {sites.length + " "}
                    <span style={{ fontWeight: 400, color: "#00000099" }}>
                      Sites
                    </span>
                  </Typography>
                  <SortIcon
                    sx={{
                      fontSize: 20,
                      color: "rgba(0,0,0,0.7)",
                      cursor: "pointer",
                    }}
                  />
                </Box>

                {/* NEW: Auto-select best sites toggle */}
                  <AutoSelectBestSitesCard
                    checked={autoSelectBestSites}
                    onChange={(checked) => setAutoSelectBestSites(checked)}
                  fitScore={fitScore}
                  onFitScoreChange={setFitScore}
                />

                <TextField
                  placeholder="Search sites..."
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "38px",
                      backgroundColor: "#FFF",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontFamily: "Rubik",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                    },
                    "& fieldset": { border: "none" },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{ fontSize: 20, color: "rgba(0,0,0,0.4)" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                  {/* Simple flex:1 wrapper so CohortFilter shares equal width
                      with FilterDropdown — CohortFilter's own width: '100%'
                      (see CohortFilter.jsx) fills whatever space this gives it,
                      no forced/!important overrides needed anymore. */}
                  {  
                  // cohorts?.length > 1 &&
                    (
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <CohortFilter open={true} cohorts={cohorts} />
                    </Box>
                    )
                  }
                  {/* Country dropdown now shows a real SVG flag via the
                      reusable `icon` prop on FilterDropdown */}
                  {/* <FilterDropdown
                    label="United States"
                    icon={
                      <span>
                        <CountryFlag width={18} height={12} country={'United States'} />
                      </span>
                  }
                  /> */}
                    <Select
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                      size="small"
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0px 12px",
                        flex: 1,
                        minWidth: 0, // required for text-overflow ellipsis to work inside a flex child
                        height: `${DROPDOWN_HEIGHT}px`,
                        // boxSizing: "border-box",
                        backgroundColor: "#FFFFFF",
                        // border: "1px solid rgba(0, 0, 0, 0.15)",
                        borderRadius: "6px",
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                        '&:hover': {
                          borderColor: 'rgba(0, 0, 0, 0.3)',
                        },
                        '&.Mui-focused': {
                          borderColor: 'rgba(0, 0, 0, 0.4)',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '& .MuiSelect-select': {
                          padding: '0 14px',
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: 0, // lets the truncatable <span> above actually shrink instead of overflowing
                          overflow: 'hidden',
                        },
                      }}
                    >
                      {countries.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CountryFlag width={18} height={12} country={item.country} />
                            <span>{item.name}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                </Box>
              </Box>

              {/* SCROLLABLE LIST AREA */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  px: 2,
                  pb: 3,
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "#CBD5E1",
                    borderRadius: "10px",
                  },
                }}
                className="app-scroll"
              >
                {sites
                  .filter((site) =>
                    site.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((site, index) => (
                    <SiteCard
                      key={`${site.name}-${index}`}
                      site={site}
                      isSelected={selectedSiteName === site.name}
                      isChecked={effectiveCheckedIds.has(site.name)}
                      checkboxDisabled={autoSelectBestSites}
                      onClick={() => setSelectedSiteName(site.name)}
                      onCheckToggle={() => toggleSiteChecked(site.name)}
                    />
                  ))}
              </Box>
            </Box>
          </div>

          {/* RIGHT COLUMN: Detail View */}
          <div
            style={{
              width: "75%",
              padding: "1.5% 6.5% 0% 1.5%",
            }}
            className="flex flex-col flex-1 min-h-0 text-left"
          >
            {!selectedCard ? (
              <div>
                <RightCardSkeleton />
              </div>
            ) : (
              <div
                className="app-scroll"
                style={{
                  overflowY: "auto",
                  background: "#FFFFFF",
                  borderRadius: "8px",
                  boxShadow: "0 0 10px rgba(130, 143, 169, 0.15)",
                  height: "100%",
                }}
                ref={scrollRef}
                onScroll={handleScroll33}
              >
                <div ref={fullReportRef} className="executive-summary">
                  <SiteDetailView siteName={selectedSiteName} cohorts={cohorts} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- NEW Sub-component: Auto-select best sites toggle ---
// Extracted as its own component (rather than inline JSX) so the toggle's
// styling and behavior can be reused/tested independently, and so the
// parent component doesn't get more cluttered.
const AutoSelectBestSitesCard = ({
  checked,
  onChange,
  fitScore,
  onFitScoreChange,
}) => {
  return (
    <Box
      sx={{
        // width: 304,
        height: 112,
        background: "#F5F9FF",
        border: "1px solid #B8D4F9",
        borderRadius: "8px",
        boxShadow: "1px 8px 34px rgba(153,169,190,.10)",
        p: "12px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Switch
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disableRipple
          sx={{
            width: 36,
            height: 20,
            p: 0,

            "& .MuiSwitch-switchBase": {
              p: "2px",

              "&.Mui-checked": {
                transform: "translateX(16px)",
                color: "#fff",

                "& + .MuiSwitch-track": {
                  bgcolor: "#2666BE",
                  opacity: 1,
                },
              },
            },

            "& .MuiSwitch-thumb": {
              width: 16,
              height: 16,
            },

            "& .MuiSwitch-track": {
              borderRadius: 20,
              bgcolor: "#CBD5E1",
              opacity: 1,
            },
          }}
        />

        <Typography
          sx={{
            ml: 1.5,
            fontSize: 14,
            color: "#4A4A4A",
            fontWeight: 400,
          }}
        >
          Auto-select best sites
        </Typography>

        <Box
          sx={{
            ml: "auto",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* <img src={editInfoIcon} alt="" width={18}/> */}
          <EditInfoIcon />
        </Box>
      </Box>

      <Divider
        sx={{
          mt: 1.2,
          mb: 1.2,
          borderColor: "#0000000D",
        }}
      />

      {/* Fit Score */}
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 400,
          color: "#000000CC",
          mb: "6px",
          textAlign: "left",
        }}
      >
        Fit Score
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            width: "9px",
            color: "#00000066",
            fontSize: 14,
          }}
        >
          0
        </Typography>

        <Slider
          value={fitScore}
          onChange={(_, newValue) => onFitScoreChange(newValue)}
          min={0}
          max={100}
          disableSwap
          valueLabelDisplay="auto"
          sx={{
            mx: 1,
            flex: 1,
            color: "#2666BE",

            "& .MuiSlider-track": {
              height: 3,
              border: "none",
            },

            "& .MuiSlider-rail": {
              height: 3,
              opacity: 1,
              backgroundColor: "#0000001A",
            },

            "& .MuiSlider-thumb": {
              width: 18,
              height: 18,
              backgroundColor: "#FFFFFF",
              border: "3px solid #2666BE",

              "&:hover": {
                boxShadow: "none",
              },

              "&.Mui-focusVisible": {
                boxShadow: "none",
              },

              "&::before": {
                display: "none",
              },
            },

            "& .MuiSlider-valueLabel": {
              backgroundColor: "#FFFFFF",
              color: "#000000CC",
              borderRadius: "8px",
              boxShadow: "0px 4px 10px 0px #828FA926",
              height: "32px",
              width: "36px",
              fontSize: "13px",

              "&:before": {
                backgroundColor: "#FFFFFF",
              },
            },
          }}
        />

        <Typography
          sx={{
            width: 24,
            textAlign: "right",
            color: "#00000066",
            fontSize: 14,
          }}
        >
          100
        </Typography>
      </Box>
    </Box>
  );
};


// --- Helper: Filter Dropdown Component ---
// UPDATED: now accepts an optional `icon` node (used for the country flag)
// rendered before the label, so this stays a single generic, reusable
// component rather than forking a near-duplicate "CountryDropdown".
// const FilterDropdown = ({ label, icon }) => (
//   <Box
//     title={label} // native browser tooltip shows the full label on hover when truncated
//     sx={{
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: "0px 12px",
//       flex: 1,
//       minWidth: 0, // required for text-overflow ellipsis to work inside a flex child
//       height: `${DROPDOWN_HEIGHT}px`,
//       boxSizing: "border-box",
//       backgroundColor: "#FFFFFF",
//       border: "1px solid rgba(0, 0, 0, 0.15)",
//       borderRadius: "6px",
//       cursor: "pointer",
//       "&:hover": { borderColor: "rgba(0, 0, 0, 0.3)" },
//     }}
//   >
//     <Box
//       sx={{
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//         minWidth: 0, // same reason as above — lets the label truncate instead of pushing the arrow out
//         overflow: "hidden",
//       }}
//     >
//       {icon}
//       <Typography
//         noWrap // MUI shorthand for overflow: hidden; textOverflow: ellipsis; whiteSpace: nowrap
//         sx={{
//           fontFamily: "Rubik",
//           fontSize: "13px",
//           color: "rgba(0, 0, 0, 0.6)",
//         }}
//       >
//         {label}
//       </Typography>
//     </Box>
//     <KeyboardArrowDownIcon
//       sx={{ fontSize: 18, color: "rgba(0,0,0,0.4)", flexShrink: 0 }}
//     />
//   </Box>
// );

// --- Style definitions for the Progress Ring ---
const useStyles = makeStyles(() => ({
  scoreCircle: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scoreProgress: {
    position: "absolute",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid #27AE60",
    clipPath:
      "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)",
  },
}));

// --- Sub-component: Individual Site Card ---
// UPDATED: adds the checkbox shown in the Figma design (Image 1). Clicking
// the checkbox toggles selection WITHOUT changing the detail-view card,
// so the two interactions (view details vs. select for comparison) don't
// interfere with each other.
const SiteCard = ({
  site,
  isSelected,
  isChecked,
  checkboxDisabled,
  onClick,
  onCheckToggle,
}) => {
  const classes = useStyles();
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: "100%",
        height: 85,
        borderRadius: "4px",
        gap: "15px",
        opacity: 1,
        padding: "15px",
        borderWidth: "1px",
        background: "#FFFFFF80",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
        border: isSelected
          ? "2px solid var(--Info-600, #2666BE)"
          : "1px solid var(--Slate-200, #F0F0F3)",
        boxShadow: "1px 8px 34px 0px #99A9BE1A",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": { backgroundColor: "#FFF", borderColor: "#2666BE" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <Checkbox
          checked={isChecked}
          disabled={checkboxDisabled}
          onClick={(e) => e.stopPropagation()} // don't trigger card select
          onChange={onCheckToggle}
          size="small"
          sx={{
            padding: 0,
            marginTop: "1px",
            color: "rgba(0,0,0,0.3)",
            "&.Mui-checked": { color: "#2666BE" },
          }}
        />
        <Tooltip title={site.name} arrow>          
          <Typography
            sx={{
              fontFamily: "'Rubik'",
              fontWeight: 600,
              fontSize: "14px",
              color: "#0F172B",
              textAlign: "start",
              lineHeight: "17.5px",
              letterSpacing: "-0.15px",

              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "default",
              textWrap: 'nowrap'
            }}
          >
            {site.name}
          </Typography>
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          marginLeft: "26px", // aligns under the name, past the checkbox
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <ScoreIndicator score={site.score} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <img
            className="scorecard__iconImg"
            src={smallLocationIcon}
            alt=""
            aria-hidden="true"
          />
          <Typography
            sx={{
              fontFamily: "Rubik",
              fontWeight: 500,
              fontSize: "12px",
              color: "#45556C",
              lineHeight: "16px",
              letterSpacing: "0px",
            }}
          >
            {site.location}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default SitesLists;