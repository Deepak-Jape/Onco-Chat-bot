/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import MainLayout from "../layout/mainLayout/MainLayout";
import FilterChipsHeader from "../common/FilterChipsHeader";
import {
  Backdrop,
  Box,
  Button,
  Fade,
  Modal,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { getAccoutDetails, updateProfileDetails } from "../api/Profile";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import TrialsContainer from "./trialsHeader/trialsSubHeader/TrialsContainer";
import TrialsFilterNew from "./trialsHeader/trials/TrialFilterNew";
import shareIcon from "../assets/images/Share.svg";
import {
  ShareActionProvider,
  useShareAction,
} from "./trialsHeader/analytics/ShareActionContext";
import {
  getFiltersFromSearchParams,
  getSessionKeyFromSearchParams,
  getStoredFiltersForSession,
  getAnalyticsTabFromPathname,
} from "../utils/trialsUrlState";

function HeaderShareButton({ isHovered }) {
  const { shareAction } = useShareAction();
  const isVisible = Boolean(shareAction?.onClick) && isHovered;

  return (
    <Box
      onClick={() => shareAction?.onClick?.()}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        height: "36px",
        padding: "0 12px",
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: "8px",
        background: "#fff",
        cursor: "pointer",
        // Take Share out of the flex flow so filter-chip row can span full width.
        position: "absolute",
        top: 8,
        right: 20,
        zIndex: 3,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 120ms ease-in-out",
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize: "14px",
          color: "rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        Share
      </Box>
      <Box
        component="img"
        src={shareIcon}
        alt="share"
        sx={{
          width: "16px",
          height: "16px",
          display: "block",
        }}
      />
    </Box>
  );
}

const normalizeFiltersForCompare = (filters = {}) => {
  if (Array.isArray(filters)) {
    return filters
      .map((item) => normalizeFiltersForCompare(item))
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
  }

  if (filters && typeof filters === "object") {
    return Object.keys(filters)
      .sort()
      .reduce((normalizedFilters, key) => {
        normalizedFilters[key] = normalizeFiltersForCompare(filters[key]);
        return normalizedFilters;
      }, {});
  }

  return typeof filters === "string" ? filters.trim() : filters;
};

const areFiltersEqual = (leftFilters = {}, rightFilters = {}) =>
  JSON.stringify(normalizeFiltersForCompare(leftFilters)) ===
  JSON.stringify(normalizeFiltersForCompare(rightFilters));

const normalizeInterventionOption = (item, type) => {
  const label =
    typeof item === "string"
      ? item
      : item?.label || item?.title || item?.name || item?.value || "";

  if (!label) {
    return null;
  }

  return {
    ...((typeof item === "object" && item !== null) ? item : {}),
    id:
      (typeof item === "object" && item !== null && item.id) ||
      `${type}-${label}`,
    label,
    type,
  };
};

const normalizeRestoredSelectedFilters = (filters = {}) => {
  const normalizedFilters = { ...filters };
  const interventionTypes = Array.isArray(filters.intervention_type)
    ? filters.intervention_type
    : [];
  const interventionSubTypes = Array.isArray(filters.intervention_sub_types)
    ? filters.intervention_sub_types
    : [];

  if (interventionTypes.length || interventionSubTypes.length) {
    const normalizedInterventionFilters = [
      ...interventionTypes.map((item) =>
        item?.type
          ? normalizeInterventionOption(item, item.type)
          : normalizeInterventionOption(item, "parent"),
      ),
      ...interventionSubTypes.map((item) =>
        item?.type
          ? normalizeInterventionOption(item, item.type)
          : normalizeInterventionOption(item, "child"),
      ),
    ].filter(Boolean);

    normalizedFilters.intervention_type = normalizedInterventionFilters.filter(
      (item, index, array) =>
        array.findIndex((entry) => entry.id === item.id) === index,
    );

    delete normalizedFilters.intervention_sub_types;
  }

  return normalizedFilters;
};

const HomePage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [counts, setCounts] = useState({});
  const [open, setOpen] = useState(false);

  // Global Ctrl+F / Cmd+F shortcut to focus the main search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const inputEl = window.__trialsSearchInputRef?.current;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    designation: "",
  });

  const { data: trials, loading } = useSelector((state) => state.cards);
  // console.log(trials?.payload)
  const location = useLocation();
  const isAnalyticsRoute = Boolean(
    getAnalyticsTabFromPathname(location.pathname),
  );

  useEffect(() => {
    if (isAnalyticsRoute || !trials?.payload) return;

    const payload = trials?.payload;

    setSelectedFilters((prev) => {
      // 1. Prepare the new state based on payload
      const updatedFilters = {};
      Object.entries(payload).forEach(([key, value]) => {
        if (value && value.length > 0) {
          updatedFilters[key] = value;
        }
      });

      // 2. Simple string comparison to prevent infinite loop
      // Only update if the stringified content actually differs
      if (JSON.stringify(prev) === JSON.stringify(updatedFilters)) {
        return prev; // Returning the exact same reference prevents re-render
      }

      return updatedFilters;
    });
  }, [isAnalyticsRoute, trials?.payload]); // Listen specifically to the payload
  const activeFilters = useSelector((state) => state.cards.activeFilters || {});
  const [searchParams] = useSearchParams();
  const hydratedSessionKeyRef = useRef("");
  const hydratedUrlFiltersRef = useRef({});

  const handleFilterChange = (filters, count) => {
    setSelectedFilters(filters);
    setCounts(count);
  };

  // const handleRemoveFilter = (filterKey, value, index) => {
  //   setSelectedFilters((prev) => {
  //     const newFilters = { ...prev };
  //     if (!newFilters[filterKey] || !Array.isArray(newFilters[filterKey]))
  //       return prev;

  //     newFilters[filterKey] = newFilters[filterKey].filter(
  //       (_, i) => i !== index,
  //     );

  //     if (newFilters[filterKey].length === 0) {
  //       delete newFilters[filterKey];
  //     }
  //     return newFilters;
  //   });
  // };

  // const handleResetAllFilters = () => {
  //   setFilters({});
  //   setCounts({});
  //   setSelectedFilters([]);
  // };

  useEffect(() => {
    if (isAnalyticsRoute) {
      hydratedSessionKeyRef.current = "";
      hydratedUrlFiltersRef.current = {};
      return;
    }

    const urlSessionKey = getSessionKeyFromSearchParams(searchParams);
    const urlFilters = getFiltersFromSearchParams(searchParams);
    const storedSessionFilters = getStoredFiltersForSession(urlSessionKey);
    const hasPayloadFilters = Object.keys(activeFilters || {}).length > 0;
    const restoredFilters = {
      ...(activeFilters || {}),
      ...(storedSessionFilters || {}),
      ...(urlFilters || {}),
    };
    const hasActiveFilters = Object.keys(restoredFilters || {}).length > 0;
    const hasSelectedFilters = Object.keys(selectedFilters || {}).length > 0;

    if (!urlSessionKey || !hasActiveFilters) {
      if (!urlSessionKey) {
        hydratedSessionKeyRef.current = "";
        hydratedUrlFiltersRef.current = {};
      }
      return;
    }

    const normalizedRestoredFilters =
      normalizeRestoredSelectedFilters(restoredFilters);
    const isNewSession = hydratedSessionKeyRef.current !== urlSessionKey;

    if (isNewSession) {
      if (hasSelectedFilters) {
        return;
      }

      setSelectedFilters(normalizedRestoredFilters);
      hydratedSessionKeyRef.current = urlSessionKey;
      hydratedUrlFiltersRef.current =
        normalizeRestoredSelectedFilters(urlFilters);
      return;
    }

    const normalizedUrlFilters = hydratedUrlFiltersRef.current;
    const canMergePayloadFilters =
      hasPayloadFilters &&
      hasSelectedFilters &&
      areFiltersEqual(selectedFilters, normalizedUrlFilters) &&
      !areFiltersEqual(normalizedRestoredFilters, normalizedUrlFilters);

    if (canMergePayloadFilters) {
      setSelectedFilters(normalizedRestoredFilters);
      hydratedUrlFiltersRef.current = normalizedRestoredFilters;
    }
  }, [activeFilters, isAnalyticsRoute, searchParams, selectedFilters]);

  useEffect(() => {
    // Define the async function inside
    const fetchProfile = async () => {
      try {
        // fallback for refresh
        const savedProfile = await getAccoutDetails();
        if(savedProfile) {
          localStorage.setItem("UserData", JSON.stringify(savedProfile));
          localStorage.setItem("userRole", savedProfile?.role || "");
        }

        // Update state
        setForm(
          savedProfile || {
            first_name: "",
            last_name: "",
            designation: "",
            role: "",
          },
        );
        // Check if profile is empty to open the modal/view
        if (savedProfile.is_firstlogin) {
          setOpen(true);
        }
      } catch (error) {
        console.error("Error fetching account details:", error);
      }
    };

    fetchProfile();
  }, [location.state]); // Added loginUserAddress to dependency array

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.designation) return;

    try {
      const payload = {
        ...form,
      };
      // console.log("Calling updateProfileDetails with:", payload);
      // 1. Call your API
      await updateProfileDetails(payload);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
    localStorage.setItem("userProfile", JSON.stringify(form));
    localStorage.removeItem("incompleteProfile");
    setOpen(false);
  };

  const dispatch = useDispatch();
  // Get current state from Redux
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
 
  return (
    <>
      <ShareActionProvider>
        <MainLayout
          collapsed={collapsed}
          onFilterChange={handleFilterChange}
          filters={filters}
          setFilters={setFilters}
          // setStoreSessionKey={setStoreSessionKey}
          // storeSessionKey={storeSessionKey}
        >
           <Box
             data-trials-header="true"
              sx={{
                background: "rgba(255, 255, 255, 1)",
                // padding: "8px 14px",
                display: "flex",
               gap: "20px",
               // Don't vertically center Share against the entire (multi-row) filter area.
               alignItems: "flex-start",
               // Keep the top search/header fixed while the rest of the page scrolls.
               position: "fixed",
               top: 0,
               left: 68,
               right: 0,
               zIndex: 60,
             }}
             onMouseEnter={() => setIsHeaderHovered(true)}
             onMouseLeave={() => setIsHeaderHovered(false)}
           >
            {/* <Typography
              fontSize={27}
              fontFamily={"Rubik"}
              fontWeight={500}
              color="rgba(0, 0, 0, 0.8)"
            >
              Trials
            </Typography> */}
            {/* <TrialsFilter
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
            /> */}

          <TrialsFilterNew
            // searchSelections={searchSelections}
            // setSearchSelections={setSearchSelections}
            // onToggleCheckBox={onToggleCheckBox}
            isHeaderHovered={isHeaderHovered}
          />
          <HeaderShareButton isHovered={isHeaderHovered} />
          </Box>
           <div
             style={{
               background: "rgba(255, 255, 255, 1)",
               // Avoid content sitting underneath the fixed header (initial render fallback).
               paddingTop: "var(--trials-search-header-height, 0px)",
             }}
           >
            {/* Filter Chips and Alert Row */}
            {!isAnalyticsRoute && Object.keys(selectedFilters)?.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(240, 246, 254, 1)",
                }}
              >
                {/* Left side: Filter Chips */}
                {/* <Box sx={{ flexGrow: 1 }}>
                  <FilterChipsHeader
                    filters={selectedFilters}
                    onRemoveFilter={handleRemoveFilter}
                    onResetAll={handleResetAllFilters}
                  />
                </Box> */}
              </Box>
            )}
            <TrialsContainer
              // collapsed={collapsed}
              filters={selectedFilters}
              counts={counts}
            />
          </div>
        </MainLayout>
      </ShareActionProvider>

      <Modal
        open={open}
        disableEscapeKeyDown
        onClose={() => {}}
        BackdropComponent={Backdrop}
      >
        <Fade in={open}>
          <Box
            sx={{
              width: 400,
              p: 4,
              bgcolor: "#fff",
              borderRadius: 2,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" align="center">
              Complete Your Profile
            </Typography>

            <TextField
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />

            <TextField
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
            />

            <TextField
              label="Designation"
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
              required
            />

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={
                !form.first_name || !form.last_name || !form.designation
              }
            >
              Save
            </Button>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default HomePage;
