import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import {
    Box,
    TextField,
    Autocomplete,
    CircularProgress,
    ClickAwayListener,
    Checkbox,
    Typography,
    Popper,
    Paper,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Grid,
    Skeleton,
    Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import debounce from "lodash.debounce";
import { searchClinicalTrials } from "../../../api/mainSearch";
import { makeStyles } from "@mui/styles";
// import SearchIcon from "@mui/icons-material/Search";
import SearchIcon from '../../../assets/icons/search_icon.svg';
import { FILTER_SECTIONS } from "../../../utils/helpers/helper";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "../../../assets/icons/delete_icon.svg";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CommonAutocompleteNew from "../../../common/CommonAutocompleteNew";
import DropdownWithChecklist from "../../../common/Dropdownwithchecklist";
import DatePickerBlock from "../../../common/FilterDatePicker";
import RadioButtonWithRange from "../../../common/RadioButtonWithRange";
import DropdownRadioButton from "../../../common/DropdownRadioButton";
import { useDispatch } from "react-redux";
import { fetchCards } from "../../../redux/trialsDataSlice";
import { buildFilterPayload, parseFilterPayload, decodeUnicodeEscapes } from "../../../utils/helpers/helper"
import { Switch } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    getSessionKeyFromSearchParams,
    setSessionKeySearchParam,
    setStoredFiltersForSession,
    getStoredFiltersForSession,
} from "../../../utils/trialsUrlState";
import { saveSavedFilter, getSavedFilters, deleteSavedFilter } from "../../../api/savedFilters";
import { useSnackbar } from "../../../common/GlobalSnackbar";

const useStyles = makeStyles(() => ({
    dropdown_list_title: {
        borderRadius: "6px",
        gap: "8px",
        fontSize: "16px",
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

// Derives a backend filter key from any API category name automatically.
// e.g. "Organ + Histology" → "organ_histology", "Line Of Therapy" → "line_of_therapy"
const deriveFilterKey = (category) =>
    category
        .toLowerCase()
        .replace(/\s*\+\s*/g, "_")   // "+" → "_"
        .replace(/\s+/g, "_")        // spaces → "_"
        .replace(/[^a-z0-9_]/g, ""); // strip anything else

// Known overrides where the derived key doesn't match the actual backend key.
// Only add entries here when the backend uses a non-obvious key name.
const CATEGORY_TO_FILTER_KEY = {
    "Organ": "organ",
    "Histology": "histology",
    "Sub Histology": "histology",
    "Histology Variant": "histology",
    "Histology + Sub Histology": "histology",
    "Sub Histology + Histology Variant": "histology",
    "Organ + Histology": "histology",
    "Line Of Therapy": "line_of_therapy",
    "Line of Therapy": "line_of_therapy",
    "Primary Endpoints": "primary_endpoints",
    "Locations": "locations",
    "Sponsor": "sponsor_name",
    "Biomarker": "biomarkers",
    "Biomarkers + Biomarkers Variant": "biomarkers",
    "Cancer Stage": "cancer_stage",
    "Co-Morbidities": "comorbidities",
    "Co-morbidities": "comorbidities",
    "Other Physical Conditions": "physical_state",
    "Other physical conditions": "physical_state",
    "Prior Therapy": "prior_therapy",
    "MoA": "moa",
    "MoA category": "moa_category",
    "Target": "target",
    "Drug Name": "drug_name",
    "Regimen Combination Strategy": "regimen_combination_strategy",
    "Regimen Complexity": "regimen_complexity",
    "Modality": "modality",
    "Class": "classes",
    "ECOG": "ecog",
    "Mode of Administration": "mode_of_administration",
    "Mode Of Administration": "mode_of_administration",
    "Arm type": "arm_type",
    "Stratification": "stratification",
    "Study Design": "study_design",
    "Study Phase": "phases",
    "Trial Architecture": "trial_architecture",
    "Control Type": "control_type",
    "Response Criteria": "response_criteria",
    "Blinding": "blinding_info",
    "Trial Status": "trial_status",
    "Funding Source": "funding_source",
    "Trial Acronyms": "trial_acronym",
    "Trial Acronym": "trial_acronym",
    // NCT number / OncoSuite id. Mapping it to a structured key lets syncFilters
    // create a mirror chip so the selection is visible as a chip (search_bar
    // items alone don't render chips). buildFilterPayload handles the actual
    // include/exclude payload for identifiers separately (both nct_id and
    // unique_identifier), so this key is used only for the chip mirror.
    "Unique Identifier": "nct_id",
};

// Compound API category names remapped to their simpler display equivalent.
// Items from these categories are shown under the target category in the dropdown
// and sync to the same filter key.
const CATEGORY_REMAP = {
    "Organ + Histology": "Histology",
    "Biomarkers + Biomarkers Variant": "Biomarkers",
};

export default function TrialsFilterNew({
    // searchSelections,
    // setSearchSelections,
    // setSelectedFilters
    // onToggleCheckBox
    isHeaderHovered = false,
}) {
    // const [searchSelections, setSearchSelections] = useState([])
    const anchorRef = useRef(null);
    const searchInputRef = useRef(null);
    // Register ref globally so Ctrl+K shortcut in MainPage can focus it
    useEffect(() => {
        window.__trialsSearchInputRef = searchInputRef;
        return () => { window.__trialsSearchInputRef = null; };
    }, []);
    const [searchOptions, setSearchOptions] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const classes = useStyles();
    const [openSearchDropdownState, setOpenSearchDropdownState] = useState(false);
    const openSearchDropdown = openSearchDropdownState;
    // Expose dropdown-open state so the page-level keyboard handler can yield
    // arrow keys to the search while its dropdown is open (until the user
    // presses Esc), even if the input momentarily loses focus after a select.
    //
    // The flag MUST update synchronously with the state setter — the previous
    // effect-based approach lagged one render behind AND its cleanup reset the
    // flag to false on every unrelated re-render, opening a window where the
    // page-level arrow-key handler stole focus right after a selection. So we
    // wrap the setter to write window.__trialsSearchDropdownOpen inline.
    const openSearchDropdownRef = useRef(false);
    const setOpenSearchDropdown = useCallback((next) => {
        const resolved = typeof next === 'function'
            ? next(openSearchDropdownRef.current)
            : next;
        openSearchDropdownRef.current = resolved;
        // Update the global guard synchronously so the page-level keyboard
        // handler sees the new value on the very next keystroke.
        window.__trialsSearchDropdownOpen = resolved;
        setOpenSearchDropdownState(resolved);
    }, []);
    useEffect(() => {
        return () => { window.__trialsSearchDropdownOpen = false; };
    }, []);
    const highlightedOptionRef = useRef(null);
    const searchListboxRef = useRef(null);
    const [openFilterPanel, setOpenFilterPanel] = useState(false);
    // Tracks the advanced-filter-panel open state synchronously so the input's
    // onFocus / inputValue effect don't race the chevron's onMouseDown and
    // reopen the suggestion dropdown on top of the advanced search panel.
    const openFilterPanelRef = useRef(false);
    const [expandedFilterKey, setExpandedFilterKey] = useState(null);
    const [chipHeaderData, setChipHeaderData] = useState({})

    // Lock the search dropdown's scroll position across checkbox selections.
    // MUI's useAutocomplete internally re-syncs the highlighted option after
    // any `multiple` selection and auto-scrolls it into view — often jumping
    // far from whatever the user just clicked. Rather than chase MUI's exact
    // effect timing, we actively hold the listbox at a "locked" scrollTop
    // (updated only by real user scroll gestures) and reassert it via
    // MutationObserver whenever MUI mutates the list.
    //
    // Implemented as a CALLBACK ref (not useRef + useEffect) because MUI can
    // swap out the listbox DOM node itself (not just its children) when the
    // option list re-renders — a plain useEffect keyed on `openSearchDropdown`
    // would only ever attach to the first node and go stale the moment MUI
    // mounts a replacement, silently orphaning the whole lock.
    const searchListboxCleanupRef = useRef(null);
    // Set true while the user is navigating options with arrow keys, so the
    // scroll-lock lets MUI scroll the highlighted option into view.
    const keyboardNavActiveRef = useRef(false);
    const searchListboxCallbackRef = useCallback((listboxEl) => {
        // Detach from whatever node we were previously watching.
        if (searchListboxCleanupRef.current) {
            searchListboxCleanupRef.current();
            searchListboxCleanupRef.current = null;
        }
        searchListboxRef.current = listboxEl;
        if (!listboxEl) return;

        // Any native 'scroll' event is trusted as user-driven (wheel, touch,
        // scrollbar-thumb drag, keyboard, etc.). We only ever *correct*
        // scrollTop in direct response to a DOM mutation (MUI re-syncing its
        // highlighted option), never from the scroll event itself — so a
        // real user drag is never fought.
        let lockedScrollTop = listboxEl.scrollTop;

        const handleUserScroll = () => {
            lockedScrollTop = listboxEl.scrollTop;
        };
        listboxEl.addEventListener('scroll', handleUserScroll, { passive: true });

        const enforceLock = () => {
            // While the user is navigating with arrow keys, let MUI scroll the
            // highlighted option into view instead of yanking scrollTop back —
            // otherwise keyboard nav dies at the visible boundary.
            if (keyboardNavActiveRef.current) {
                lockedScrollTop = listboxEl.scrollTop;
                return;
            }
            if (listboxEl.scrollTop !== lockedScrollTop) {
                listboxEl.scrollTop = lockedScrollTop;
            }
        };

        const observer = new MutationObserver(enforceLock);
        observer.observe(listboxEl, { childList: true, subtree: true, attributes: true });

        searchListboxCleanupRef.current = () => {
            observer.disconnect();
            listboxEl.removeEventListener('scroll', handleUserScroll);
        };
    }, []);

    const [isHovered, setIsHovered] = useState(false);
    const [openSavedSearches, setOpenSavedSearches] = useState(false);
    const [selectedSavedSearchId, setSelectedSavedSearchId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const isResetFilter = useRef(false);
    const skipFilterRestoration = useRef(false);
    const searchOptionsCacheRef = useRef({});
    // Pre-seed with all known category→filterKey mappings so syncFilters always works
    // regardless of which categories the API happens to return in a given session.
    const categoryMappingRef = useRef({ ...CATEGORY_TO_FILTER_KEY });

    // Category priority: cohort-level filters (Histology, Organ, etc.) surface first
    const CATEGORY_PRIORITY = {
        "Histology": 0,
        "Organ": 1,
        "Biomarker": 2,
        "Cancer Stage": 3,
        "Line Of Therapy": 4,
        "Locations": 5,
        "Sponsor": 6,
    };
    const getCategoryPriority = (cat) => CATEGORY_PRIORITY[cat] ?? 99;

    // Narrow, API-order-preserving dedup: drop a compound-category row ("X + Y") only when the
    // SAME label (case-insensitive) also appears under a plain (non-compound) category. That is
    // the only case that makes the Autocomplete's option matching ambiguous and a row unclickable
    // (e.g. "Papillary adenocarcinoma" under both "Histology" and "Sub Histology + Histology
    // Variant"). Everything else — including unique compound items and all plain items — is kept
    // exactly as the API returned it, so results like "egfr" stay 1:1 with the API response.
    const dropCrossCategoryLabelDuplicates = (items) => {
        const plainLabels = new Set(
            (items || [])
                .filter((opt) => !(opt?.category ?? "").includes("+"))
                .map((opt) => (opt?.label ?? "").toString().trim().toLowerCase()),
        );
        return (items || []).filter((opt) => {
            const isCompound = (opt?.category ?? "").includes("+");
            if (!isCompound) return true;
            const label = (opt?.label ?? "").toString().trim().toLowerCase();
            return !plainLabels.has(label);
        });
    };

    // Lifts the SINGLE best match for the typed query to the very top, then leaves everything
    // else in strict API order. We lift only one row so a category is never split into two
    // blocks — e.g. searching "egfr" (which matches "EGFR" under both Biomarkers and Target)
    // pulls just the first "EGFR" up and keeps the rest of the API structure intact. The lifted
    // row is the strongest match: an exact label match wins over a full prefix; if several share
    // the strongest tier, the first one in API order is chosen. Input is assumed already deduped.
    const liftBestMatchKeepApiOrder = (items, query) => {
        const q = (query ?? "").toString().trim().toLowerCase();
        if (!q || !Array.isArray(items) || items.length === 0) return items;
        // Only exact (0) and full-prefix (1) matches are strong enough to lift.
        const liftScore = (label) => {
            const text = (label ?? "").toString().trim().toLowerCase();
            if (!text) return 99;
            if (text === q) return 0;              // exact match
            if (text.startsWith(q)) return 1;      // full prefix (e.g. "sclc" -> "SCLC ...")
            return 99;                             // not strong enough to lift
        };
        // Find the first item with the best (lowest) lift score.
        let bestIdx = -1;
        let bestScore = 99;
        items.forEach((opt, idx) => {
            const s = liftScore(opt?.label);
            if (s < bestScore) {
                bestScore = s;
                bestIdx = idx;
            }
        });
        // Nothing strong enough, or the best match is already first → leave API order untouched.
        if (bestIdx <= 0) return items;
        const lifted = items[bestIdx];
        return [lifted, ...items.slice(0, bestIdx), ...items.slice(bestIdx + 1)];
    };

    const sortByQueryPriority = (items, query, recentLabels = []) => {
        const q = (query ?? "").toString().trim().toLowerCase();
        if (!q) return items;

        const recentSet = new Set(recentLabels.map((l) => l.toLowerCase()));

        const score = (label) => {
            const text = (label ?? "").toString().trim().toLowerCase();
            if (!text) return 999;
            if (text === q) return 0;                                          // exact match
            if (text.startsWith(q)) return 1;                                 // full prefix
            if (text.split(/\s+/).some((w) => w.startsWith(q))) return 2;    // word-boundary
            if (text.includes(q)) return 3;                                   // substring
            return 4;
        };

        const isCompoundCategory = (cat) => (cat ?? "").includes("+");

        return items
            .slice()
            .sort((a, b) => {
                const la = score(a?.label);
                const lb = score(b?.label);
                // 1. Exact matches always first
                const aExact = la === 0 ? 0 : 1;
                const bExact = lb === 0 ? 0 : 1;
                if (aExact !== bExact) return aExact - bExact;
                // 2. All compound category items before all single-category items
                const ac = isCompoundCategory(a?.category) ? 0 : 1;
                const bc = isCompoundCategory(b?.category) ? 0 : 1;
                if (ac !== bc) return ac - bc;
                // 3. Within each group sort by match quality
                if (la !== lb) return la - lb;
                // 4. Recent selections float up within their score+category group
                const ar = recentSet.has((a?.label ?? "").toLowerCase()) ? 0 : 1;
                const br = recentSet.has((b?.label ?? "").toLowerCase()) ? 0 : 1;
                if (ar !== br) return ar - br;
                // 5. Tie-break by category priority
                const ca = getCategoryPriority(a?.category);
                const cb = getCategoryPriority(b?.category);
                if (ca !== cb) return ca - cb;
                return (a?.label ?? "").localeCompare(b?.label ?? "");
            });
    };

    const formatDisplayLabel = (text) => {
        const raw = (text ?? "").toString();
        if (!raw) return "";
        return text;  //Kuldeep - added this line due to keep the same label as per API response;

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

    // Category names come back from the API as raw filter keys (e.g. "line_of_therapy").
    // Unlike option labels (kept verbatim), categories are always safe to prettify for display.
    const formatCategoryLabel = (text) => {
        const raw = (text ?? "").toString().trim();
        if (!raw) return "";
        return raw
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

    // Para for dropdown array button
    const [activeSection, setActiveSection] = useState(FILTER_SECTIONS[0].title);

    const dispatch = useDispatch();
    const { showSnackbar } = useSnackbar();
    const { data: trials } = useSelector((state) => state.cards);
    const [isSavedFilterOn, setIsSavedFilterOn] = useState(false);
    const [isSavingFilter, setIsSavingFilter] = useState(false);
    const [savedFilterId, setSavedFilterId] = useState(null);

    const [savedSearches, setSavedSearches] = useState([]);
    const [savedSearchPage, setSavedSearchPage] = useState(1);
    const [savedSearchTotalPages, setSavedSearchTotalPages] = useState(1);
    const [savedSearchLoading, setSavedSearchLoading] = useState(false);
    const [hasSavedSearches, setHasSavedSearches] = useState(false);
    const savedSearchesScrollRef = useRef(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const getSavedSearchLabels = (item) => {
        const payload = item?.saved_filters_json?.payload || {};

        const appliedSearchBar = Array.isArray(payload?.applied_filters?.search_bar)
            ? payload.applied_filters.search_bar
            : [];

        const appliedLabels = appliedSearchBar
            .map((f) => (f?.label ?? "").toString().trim())
            .filter(Boolean);

        // Flatten include bucket values into labels (excluding empty strings).
        const include = payload?.include || {};
        const includeLabels = Object.entries(include).flatMap(([key, val]) => {
            if (key === "search_bar") return [];
            const arr = Array.isArray(val) ? val : [val];
            return arr;
        });

        const includeNormalized = includeLabels
            .map((v) => (v ?? "").toString().trim())
            .filter(Boolean);

        const includeSearchBar = Array.isArray(payload?.include?.search_bar)
            ? payload.include.search_bar
            : [];
        const includeSearchBarNormalized = includeSearchBar
            .map((v) => (v ?? "").toString().trim())
            .filter(Boolean);

        return Array.from(
            new Set([...appliedLabels, ...includeSearchBarNormalized, ...includeNormalized]),
        );
    };

    const updateSavedSearchAvailability = async () => {
        try {
            const res = await getSavedFilters({ page: 1, page_size: 1 });
            const firstPageData = Array.isArray(res?.data) ? res.data : [];
            const total =
                Number(
                    res?.total ??
                    res?.count ??
                    res?.total_count ??
                    res?.total_results ??
                    0,
                ) || 0;

            setHasSavedSearches(total > 0 || firstPageData.length > 0);
        } catch (err) {
            console.error("Failed to check saved searches:", err?.response?.data || err?.message || err);
            setHasSavedSearches(false);
        }
    };

    useEffect(() => {
        updateSavedSearchAvailability();
    }, []);

    // Pre-fetch base (empty-query) options on mount so the cache is warm before the user types.
    // Also builds categoryMappingRef dynamically from the API response keys — any category the
    // API returns that exists in CATEGORY_TO_FILTER_KEY gets registered; unknown ones are skipped.
    useEffect(() => {
        const prefetch = async () => {
            try {
                const res = await searchClinicalTrials("", "main_filter", {});
                const raw = Object.entries(res).flatMap(([category, values]) => {
                    if (!Array.isArray(values) || values.length === 0) return [];
                    // Register only categories that actually have values — use known override
                    // if present, otherwise derive the filter key automatically from the name.
                    if (!(category in categoryMappingRef.current)) {
                        categoryMappingRef.current[category] =
                            CATEGORY_TO_FILTER_KEY[category] ?? deriveFilterKey(category);
                    }
                    const isLocations = category.toLowerCase() === "locations";
                    const displayCategory = isLocations ? "Locations" : (CATEGORY_REMAP[category] ?? category);
                    return values
                        .filter((v) => typeof v !== "string" || v.trim().length > 0)
                        .map((value) => ({
                            label: isLocations
                                ? decodeUnicodeEscapes(value).replace(/\(.*?\)/g, "").trim()
                                : decodeUnicodeEscapes(value),
                            // Preserve the un-stripped value (e.g. "United States (US)") so the
                            // short form survives into the applied-filter payload.
                            ...(isLocations ? { rawLabel: decodeUnicodeEscapes(value).trim() } : {}),
                            category: displayCategory,
                        }));
                });
                searchOptionsCacheRef.current["main_filter"] = uniqueByCategoryAndLabel(raw);
                // Silently pre-warm common single-letter prefixes in background so first
                // keystrokes are always cache hits instead of live API calls.
                const COMMON_PREFIXES = ["a", "b", "c", "l", "m", "n", "p", "s", "t"];
                for (const prefix of COMMON_PREFIXES) {
                    try {
                        const pRes = await searchClinicalTrials(prefix, "main_filter", {});
                        const pRaw = Object.entries(pRes).flatMap(([cat, vals]) => {
                            if (!Array.isArray(vals) || vals.length === 0) return [];
                            // Only include options whose category was confirmed by the API
                            // in the base prefetch — skip any unknown/stale categories.
                            if (!(cat in categoryMappingRef.current)) return [];
                            const isLocations = cat.toLowerCase() === "locations";
                            return vals
                                .filter((v) => typeof v !== "string" || v.trim().length > 0)
                                .map((v) => ({
                                    label: isLocations
                                        ? decodeUnicodeEscapes(v).replace(/\(.*?\)/g, "").trim()
                                        : decodeUnicodeEscapes(v),
                                    ...(isLocations ? { rawLabel: decodeUnicodeEscapes(v).trim() } : {}),
                                    category: isLocations ? "Locations" : cat,
                                }));
                        });
                        const existing = searchOptionsCacheRef.current["main_filter"] ?? [];
                        searchOptionsCacheRef.current["main_filter"] = uniqueByCategoryAndLabel([
                            ...existing, ...pRaw,
                        ]);
                    } catch (_) { /* silently ignore */ }
                }
            } catch (_) {
                // silently ignore — typed search will still work without the cache
            }
        };
        prefetch();
    }, []);

    const fetchSavedSearchesPage = async (page) => {
        if (savedSearchLoading) return;

        setSavedSearchLoading(true);
        try {
            const res = await getSavedFilters({ page, page_size: 10 });
            const nextData = Array.isArray(res?.data) ? res.data : [];
            const totalPages = Number(res?.total_pages ?? 1) || 1;

            setSavedSearchTotalPages(totalPages);
            setSavedSearchPage(Number(res?.page ?? page) || page);
            setSavedSearches((prev) =>
                page === 1 ? nextData : [...prev, ...nextData],
            );
            if (page === 1) {
                setHasSavedSearches(nextData.length > 0);
            }

            if (page === 1) {
                setSelectedSavedSearchId((prev) => prev ?? nextData?.[0]?.id ?? null);
            }
        } catch (err) {
            console.error("Failed to load saved searches:", err?.response?.data || err?.message || err);
            showSnackbar({
                message: "Failed to load saved searches.",
                type: "error",
            });
        } finally {
            setSavedSearchLoading(false);
        }
    };

    const handleDeleteSavedSearch = (e, item) => {
        e?.stopPropagation?.();
        if (!item?.id) return;
        setDeleteTarget(item);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteSavedSearch = async () => {
        const id = deleteTarget?.id;
        if (!id) {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
            return;
        }

        try {
            const res = await deleteSavedFilter(id);
            showSnackbar({
                message: "Saved search deleted successfully",
                type: "success",
            });

            setSavedSearches((prev) => prev.filter((x) => x?.id !== id));
            setSelectedSavedSearchId((prev) => (prev === id ? null : prev));
            if (savedFilterId === id) {
                setIsSavedFilterOn(false);
                setSavedFilterId(null);
            }
            updateSavedSearchAvailability();
        } catch (err) {
            console.error("Failed to delete saved search:", err?.response?.data || err?.message || err);
            showSnackbar({
                message: "Failed to delete saved search.",
                type: "error",
            });
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    const openSavedSearchesDialog = () => {
        setOpenSavedSearches(true);
        setSavedSearches([]);
        setSavedSearchPage(1);
        setSavedSearchTotalPages(1);
        setSelectedSavedSearchId(null);
        fetchSavedSearchesPage(1);
    };

    const applySavedSearch = (item) => {
        // Apply the saved filters in UI (groupedFilters mode) so results + left list update reliably
        // without needing a page reload. Session key will be updated from search_results response.
        const nextParams = setSessionKeySearchParam(searchParams, "");
        nextParams.set("page", "1");
        setSearchParams(nextParams, { replace: true });

        // Ensure the upcoming chipHeaderData update triggers a fresh groupedFilters search.
        skipNextFilterDispatchRef.current = false;
        lastFetchKeyRef.current = "";

        const savedPayload = item?.saved_filters_json?.payload;
        const savedFiltersForStorage =
            savedPayload && typeof savedPayload === "object"
                ? {
                    include: savedPayload.include || {},
                    exclude: savedPayload.exclude || {},
                    applied_filters: savedPayload.applied_filters || {},
                }
                : {};

        if (Object.keys(savedFiltersForStorage || {}).length > 0) {
            setChipHeaderData(parseFilterPayload(savedFiltersForStorage));
        } else {
            setChipHeaderData({});
        }

        isResetFilter.current = false;
        setInputValue("");
        // Since user opened a saved search, reflect that in the Save toggle state.
        setIsSavedFilterOn(true);
        setSavedFilterId(item?.id ?? null);

        setOpenSavedSearches(false);
    };

    const PLACEHOLDER_KEY_MAP = FILTER_SECTIONS.flatMap(
        (section) => section.filters,
    ).reduce((acc, filter) => {
        if (filter.placeholder) {
            acc[filter.placeholder.toLowerCase().trim()] = filter.key;
        }
        return acc;
    }, {});

    // Placeholder broken into its individual words, so a single whole-word query
    // (e.g. "phase") can resolve to the right filter key even when it isn't the
    // full placeholder text (e.g. "Study Phase").
    const PLACEHOLDER_WORD_KEY_MAP = FILTER_SECTIONS.flatMap(
        (section) => section.filters,
    ).reduce((acc, filter) => {
        if (filter.placeholder) {
            filter.placeholder
                .toLowerCase()
                .trim()
                .split(/\s+/)
                .forEach((word) => {
                    // Skip words shared by multiple placeholders — ambiguous match
                    // is worse than falling back to "main_filter".
                    if (acc[word] === undefined) {
                        acc[word] = filter.key;
                    } else if (acc[word] !== filter.key) {
                        acc[word] = null;
                    }
                });
        }
        return acc;
    }, {});

    const resolveSearchFilterKey = (normalizedText) => {
        if (PLACEHOLDER_KEY_MAP[normalizedText]) {
            return PLACEHOLDER_KEY_MAP[normalizedText];
        }
        const wordMatch = PLACEHOLDER_WORD_KEY_MAP[normalizedText];
        return wordMatch || "main_filter";
    };

    const BLOCKED_CATEGORIES = new Set(["Biomarkers + Biomarkers Variant"]);
    const filterKnownCategories = (opts) => {
        const mapped = opts
            .filter((opt) => !BLOCKED_CATEGORIES.has(opt?.category))
            .map((opt) =>
                CATEGORY_REMAP[opt?.category]
                    ? { ...opt, category: CATEGORY_REMAP[opt.category] }
                    : opt
            );

        // The taxonomy API can list the same label under both a plain category
        // (e.g. "Histology") and a compound cross-reference of it (e.g.
        // "Histology + Sub Histology", "Sub Histology + Histology Variant").
        // When the plain category is present for a label, drop the compound
        // duplicates so the same term doesn't render twice in the dropdown.
        const plainLabels = new Set(
            mapped
                .filter((opt) => !(opt?.category ?? "").includes("+"))
                .map((opt) => `${opt.category}::${(opt.label ?? "").toLowerCase()}`),
        );
        // Labels present under ANY plain (non-compound) category, regardless of which one.
        // Used to drop compound duplicates whose label already exists as a plain option even
        // when the plain category isn't literally one of the compound's parts (e.g. "Papillary
        // adenocarcinoma" lives under "Histology" but the compound is "Sub Histology + Histology
        // Variant"). Case-insensitive so "Papillary Adenocarcinoma" == "Papillary adenocarcinoma".
        const plainLabelsAnyCategory = new Set(
            mapped
                .filter((opt) => !(opt?.category ?? "").includes("+"))
                .map((opt) => (opt.label ?? "").toLowerCase()),
        );
        const isRedundantCompound = (opt) => {
            const category = opt?.category ?? "";
            if (!category.includes("+")) return false;
            const label = (opt.label ?? "").toLowerCase();
            const parts = category.split("+").map((p) => p.trim());
            return (
                parts.some((part) => plainLabels.has(`${part}::${label}`)) ||
                plainLabelsAnyCategory.has(label)
            );
        };

        return mapped.filter((opt) => !isRedundantCompound(opt));
    };

    const fetchSearchResults = async (text) => {
        try {
            setLoading(true);
            const normalizedText = text.toLowerCase().trim();
            const filterKey = resolveSearchFilterKey(normalizedText);
            const query = normalizedText;
            // Step 1: Always get base cache (all taxonomy entries, all tags).
            // If not yet warm, fetch it now — this is the reliable source of truth.
            let baseOptions = searchOptionsCacheRef.current?.[filterKey];
            if (!Array.isArray(baseOptions) || baseOptions.length === 0) {
                const baseRes = await searchClinicalTrials("", filterKey, {});
                const baseRaw = Object.entries(baseRes).flatMap(([category, values]) => {
                    const isLocations = category.toLowerCase() === "locations";
                    return Array.isArray(values)
                        ? values
                            .filter((v) => typeof v !== "string" || v.trim().length > 0)
                            .map((value) => ({
                                label: isLocations
                                    ? decodeUnicodeEscapes(value).replace(/\(.*?\)/g, "").trim()
                                    : decodeUnicodeEscapes(value),
                                ...(isLocations ? { rawLabel: decodeUnicodeEscapes(value).trim() } : {}),
                                category: isLocations ? "Locations" : category,
                            }))
                        : [];
                });
                baseOptions = uniqueByCategoryAndLabel(baseRaw);
                searchOptionsCacheRef.current[filterKey] = baseOptions;
            }

            // Step 2: For empty query, show full base cache directly.
            if (query.length === 0) {
                setSearchOptions(filterKnownCategories(baseOptions));
                return;
            }

            // Step 3: Filter base cache locally — split multi-word queries so each word
            // must appear somewhere in the label (e.g. "micropapillary adeno" matches
            // "Micropapillary adenocarcinoma" even though full string doesn't match).
            const queryWords = query.split(/\s+/).filter(Boolean);
            const labelMatchesQuery = (label) => {
                const text = (label ?? "").toString().toLowerCase();
                return queryWords.every((w) => text.includes(w));
            };
            const matchingBase = baseOptions.filter((opt) => labelMatchesQuery(opt?.label));

            // Step 4: For short queries (< 2 chars) skip the live API call.
            if (query.length < 2) {
                setSearchOptions(sortByQueryPriority(filterKnownCategories(matchingBase), query, recentSearchLabelsRef.current));
                return;
            }

            // Step 5: Also fetch live API results (phrase-level matches, longer descriptions).
            const res = await searchClinicalTrials(text, filterKey, {});
            const liveRaw = Object.entries(res).flatMap(([category, values]) => {
                if (!Array.isArray(values) || values.length === 0) return [];
                if (BLOCKED_CATEGORIES.has(category)) return [];
                const isLocations = category.toLowerCase() === "locations";
                // Remap compound categories to their display equivalent
                const displayCategory = isLocations ? "Locations" : (CATEGORY_REMAP[category] ?? category);
                return values
                    .filter((v) => typeof v !== "string" || v.trim().length > 0)
                    .map((value) => ({
                        label: isLocations
                            ? decodeUnicodeEscapes(value).replace(/\(.*?\)/g, "").trim()
                            : decodeUnicodeEscapes(value),
                        ...(isLocations ? { rawLabel: decodeUnicodeEscapes(value).trim() } : {}),
                        category: displayCategory,
                    }));
            });
            const liveOptions = uniqueByCategoryAndLabel(liveRaw);

            // Structure-preserving view of the live API response: keeps every non-empty
            // category exactly as the API named it (no blocking, no remapping) and in the
            // API's own key order. This is what we render when the live API brings a proper
            // structured result, so the dropdown mirrors the API 1:1.
            const liveApiOrdered = uniqueByCategoryAndLabel(
                Object.entries(res).flatMap(([category, values]) => {
                    if (!Array.isArray(values) || values.length === 0) return [];
                    const isLocations = category.toLowerCase() === "locations";
                    return values
                        .filter((v) => typeof v !== "string" || v.trim().length > 0)
                        .map((value) => ({
                            label: isLocations
                                ? decodeUnicodeEscapes(value).replace(/\(.*?\)/g, "").trim()
                                : decodeUnicodeEscapes(value),
                            ...(isLocations ? { rawLabel: decodeUnicodeEscapes(value).trim() } : {}),
                            category: isLocations ? "Locations" : category,
                        }));
                })
            );

            // Accumulate live results into cache so future searches can find phrase-level
            // items (e.g. "Micropapillary adenocarcinoma") when user types a different word.
            if (liveOptions.length > 0) {
                const existing = searchOptionsCacheRef.current[filterKey] ?? [];
                searchOptionsCacheRef.current[filterKey] = uniqueByCategoryAndLabel([...existing, ...liveOptions]);
            }

            // Step 6: Merge — base (canonical taxonomy) first, live (phrases) second.
            let merged = uniqueByCategoryAndLabel([...matchingBase, ...liveOptions]);

            // Step 6b: Always search the full accumulated cache — catches phrase-level items
            // that arrived via previous searches (e.g. "Micropapillary adenocarcinoma" cached
            // when user previously searched "adenocarcinoma").
            if (query.length >= 2) {
                const accumulatedCache = searchOptionsCacheRef.current[filterKey] ?? [];
                const cacheHits = accumulatedCache.filter((opt) => labelMatchesQuery(opt?.label));
                merged = uniqueByCategoryAndLabel([...merged, ...cacheHits]);
            }

            // Step 6c: Fire live API with the first word's 5-char root prefix to discover
            // items in other categories not returned by the exact-query API call (cold session).
            if (query.length >= 4) {
                const root = queryWords[0]?.slice(0, Math.min(queryWords[0]?.length ?? 0, 5)) ?? query.slice(0, 5);
                // Skip root fetch if root === the full query (would be duplicate API call)
                const skipRoot = root === query || root === text.toLowerCase().trim();
                try {
                    const rootRes = skipRoot ? {} : await searchClinicalTrials(root, filterKey, {});
                    const rootRaw = Object.entries(rootRes).flatMap(([cat, vals]) => {
                        if (!Array.isArray(vals) || vals.length === 0) return [];
                        if (!(cat in categoryMappingRef.current)) return [];
                        const isLocations = cat.toLowerCase() === "locations";
                        return vals
                            .filter((v) => typeof v !== "string" || v.trim().length > 0)
                            .map((v) => ({
                                label: isLocations
                                    ? decodeUnicodeEscapes(v).replace(/\(.*?\)/g, "").trim()
                                    : decodeUnicodeEscapes(v),
                                ...(isLocations ? { rawLabel: decodeUnicodeEscapes(v).trim() } : {}),
                                category: isLocations ? "Locations" : cat,
                            }));
                    });
                    const rootOptions = uniqueByCategoryAndLabel(rootRaw);
                    // Accumulate into cache for future lookups
                    searchOptionsCacheRef.current[filterKey] = uniqueByCategoryAndLabel([
                        ...(searchOptionsCacheRef.current[filterKey] ?? []), ...rootOptions,
                    ]);
                    merged = uniqueByCategoryAndLabel([
                        ...merged,
                        ...rootOptions.filter((opt) => labelMatchesQuery(opt?.label)),
                    ]);
                } catch (_) { /* silently ignore */ }
            }

            // Step 6d: Synonym expansion — "lung cancer" → also search for "nsclc", "sclc" etc.
            const synonymTerms = expandQueryWithSynonyms(query);
            if (synonymTerms && synonymTerms.length > 0) {
                const accumulatedCache = searchOptionsCacheRef.current[filterKey] ?? [];
                const synonymMatches = accumulatedCache
                    .filter((opt) =>
                        synonymTerms.some((term) =>
                            (opt?.label ?? "").toString().toLowerCase().includes(term)
                        )
                    )
                    .map((opt) => ({ ...opt, _isSynonym: true }));
                merged = uniqueByCategoryAndLabel([...merged, ...synonymMatches]);
            }

            // Step 6e: Fuzzy fallback — typo tolerance when still no results found.
            let isFuzzyResult = false;
            if (merged.length === 0 && query.length >= 4) {
                const accumulatedCache = searchOptionsCacheRef.current[filterKey] ?? [];
                const fuzzyFallback = accumulatedCache.filter((opt) => fuzzyMatch(opt?.label, query));
                merged = uniqueByCategoryAndLabel(fuzzyFallback);
                isFuzzyResult = merged.length > 0;
            }
            setFuzzyHintText(isFuzzyResult ? text.trim() : "");

            // Default: when the live API returns a proper structured result, render it exactly
            // as the API brought it — every non-empty category, original names, API key order,
            // no UI re-sorting. Only fall back to the UI relevance sort (sortByQueryPriority) as
            // an edge case: fuzzy fallback, or when the live API brought nothing and we're showing
            // the cached base options (matchingBase) instead.
            const usingApiStructure = liveApiOrdered.length > 0 && !isFuzzyResult;
            if (usingApiStructure) {
                // Render the API result EXACTLY as it comes — every non-empty category, original
                // names, API key order (no BLOCKED_CATEGORIES / CATEGORY_REMAP reshaping). We only
                // drop a compound-category row when the identical label (case-insensitive) also
                // exists under a plain category, because two same-label options confuse the
                // Autocomplete's option matching and make the duplicate row unselectable. Genuinely
                // unique compound items (e.g. "Micropapillary adenocarcinoma") are kept.
                const deduped = dropCrossCategoryLabelDuplicates(liveApiOrdered);
                setSearchOptions(liftBestMatchKeepApiOrder(deduped, query));
            } else {
                const finalOptions = filterKnownCategories(merged.length > 0 ? merged : matchingBase);
                setSearchOptions(sortByQueryPriority(finalOptions, query, recentSearchLabelsRef.current));
            }
        } catch (err) {
            console.error(err);
            // On error, fall back to whatever the base cache has
            const baseOptions = searchOptionsCacheRef.current?.["main_filter"] ?? [];
            const query = text.toLowerCase().trim();
            const filtered = filterKnownCategories(baseOptions).filter((opt) =>
                (opt?.label ?? "").toString().toLowerCase().includes(query)
            );
            setSearchOptions(sortByQueryPriority(filtered, query, recentSearchLabelsRef.current));
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useMemo(
        () => debounce((text) => fetchSearchResults(text), 200),
        [],
    );

    // Empty input — show recent searches if available, like Google.
    // Returns true if recents were shown, false otherwise.
    const showRecentSearches = () => {
        const recents = recentSearchLabelsRef.current ?? [];
        if (recents.length > 0) {
            const baseOptions = searchOptionsCacheRef.current?.["main_filter"] ?? [];
            const recentOptions = uniqueByCategoryAndLabel(
                recents
                    .map((label) =>
                        baseOptions.find((opt) => (opt?.label ?? "").toLowerCase() === label.toLowerCase())
                    )
                    .filter(Boolean)
            ).slice(0, 5);
            if (recentOptions.length > 0) {
                setSearchOptions(recentOptions);
                setFuzzyHintText("");
                setOpenSearchDropdown(true);
                setOpenFilterPanel(false);
                return true;
            }
        }
        return false;
    };

    // Keep the ref in sync with every openFilterPanel change (close via
    // ClickAwayListener, showRecentSearches, etc.) so the guard never gets stuck.
    useEffect(() => {
        openFilterPanelRef.current = openFilterPanel;
    }, [openFilterPanel]);

    useEffect(() => {
        // The advanced filter panel takes priority — don't let a stale/late
        // inputValue change reopen the suggestion dropdown over it.
        if (openFilterPanelRef.current) return;
        if (inputValue?.trim()?.length > 0) {
            setOpenSearchDropdown(true);
            setOpenFilterPanel(false);
            // Don't re-fetch options when a selection was just made — keeps the list stable
            if (skipNextSearchFetchRef.current) {
                skipNextSearchFetchRef.current = false;
                return;
            }
            debouncedSearch(inputValue);
        } else {
            // Text input is empty — prefer recent searches (like Google), even if
            // chips are already selected. Fall back to closing the dropdown.
            if (showRecentSearches()) return;
            if (chipHeaderData['search_bar']?.length > 0) {
                setOpenSearchDropdown(true);
                setOpenFilterPanel(false);
                if (skipNextSearchFetchRef.current) {
                    skipNextSearchFetchRef.current = false;
                    return;
                }
                debouncedSearch(inputValue);
                return;
            }
            setSearchOptions([]);
            setFuzzyHintText("");
            setOpenSearchDropdown(false);
        }
    }, [inputValue]);

    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const words = query.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return text;

        // Build a list of [start, end] ranges to bold, then render as segments
        const lower = text.toLowerCase();
        const ranges = [];
        for (const w of words) {
            const wl = w.toLowerCase();
            let idx = 0;
            while (idx < lower.length) {
                const pos = lower.indexOf(wl, idx);
                if (pos === -1) break;
                ranges.push([pos, pos + wl.length]);
                idx = pos + wl.length;
            }
        }
        if (ranges.length === 0) return text;

        // Merge overlapping ranges and sort
        ranges.sort((a, b) => a[0] - b[0]);
        const merged = [ranges[0]];
        for (let i = 1; i < ranges.length; i++) {
            const last = merged[merged.length - 1];
            if (ranges[i][0] < last[1]) last[1] = Math.max(last[1], ranges[i][1]);
            else merged.push(ranges[i]);
        }

        // Build output segments
        const result = [];
        let cursor = 0;
        for (const [start, end] of merged) {
            if (cursor < start) result.push(<span key={cursor}>{text.slice(cursor, start)}</span>);
            result.push(<span key={start} style={{ fontWeight: 700 }}>{text.slice(start, end)}</span>);
            cursor = end;
        }
        if (cursor < text.length) result.push(<span key={cursor}>{text.slice(cursor)}</span>);
        return result;
    };

    // Logic for the tri-state cycle
    const getNextStatus = (currentStatus) => {
        if (!currentStatus) return 'included';    // Step 1: Blue (Include)
        if (currentStatus === 'included') return 'excluded'; // Step 2: Red (Exclude)
        return null; // Step 3: Reset
    };

    // Handle the custom click logic
    //     const handleOptionClick = (option) => {
    //        
    //         const existingIndex = searchSelections.findIndex(
    //             (item) => item.label === option.label && item.category === option.category
    //         );

    //         let newSelections = [...searchSelections];

    //         if (existingIndex === -1) {
    //             // First click: Add as included
    //             newSelections.push({ ...option, type: 'included' });
    //         } else {
    //             const currentStatus = newSelections[existingIndex].type;
    //             const nextStatus = getNextStatus(currentStatus);

    //             if (nextStatus === null) {
    //                 // Remove from list on third click
    //                 newSelections.splice(existingIndex, 1);
    //             } else {
    //                 // Update to excluded
    //                 newSelections[existingIndex] = { ...option, type: nextStatus };
    //             }
    //         }
    //         // setSearchSelections(newSelections);
    //         setChipHeaderData((prev) => ({
    //             ...prev,
    //             'search_bar': newSelections
    //         }));

    //     console.log("newSelections", newSelections)
    //     // onToggleCheckBox({ 'search_bar': newSelections })
    // };

    // Methods for the chip header

    // These must be declared before removeFilterFromChipState so the search_bar sync works
    const search_filter_mapping_early = Object.entries(categoryMappingRef.current).map(
        ([category, key]) => ({ key, category })
    );
    const categoryToKey_early = Object.fromEntries(
        search_filter_mapping_early.map(({ key, category }) => [category, key])
    );
    const keyToCategory_early = Object.fromEntries(
        search_filter_mapping_early.map(({ key, category }) => [key, category])
    );

    const removeFilterFromChipState = (prev, filterKey, value, index) => {
        const newFilters = { ...prev };
        if (!newFilters[filterKey]) {
            return prev;
        }
        // Single-value (non-array) filter — just delete the key entirely
        if (!Array.isArray(newFilters[filterKey])) {
            delete newFilters[filterKey];
            isResetFilter.current = Object.keys(newFilters).length === 0;
            return newFilters;
        }

        const normalize = (text) =>
            (text ?? "").toString().trim().toLowerCase();
        const getItemText = (item) =>
            normalize(item?.label ?? item?.title ?? item?.name ?? item?.value ?? item);
        const targetText = getItemText(value);

        newFilters[filterKey] = newFilters[filterKey].filter((_, i) => i !== index);
        if (newFilters[filterKey].length === 0) {
            delete newFilters[filterKey];
        }

        if (filterKey === "search_bar") {
            const structuredKeys = value?.category
                ? [categoryToKey_early[value.category]].filter(Boolean)
                : Object.keys(keyToCategory_early);

            structuredKeys.forEach((structuredKey) => {
                if (!Array.isArray(newFilters[structuredKey])) return;
                newFilters[structuredKey] = newFilters[structuredKey].filter(
                    (item) => getItemText(item) !== targetText,
                );
                if (newFilters[structuredKey].length === 0) {
                    delete newFilters[structuredKey];
                }
            });

            if (Array.isArray(newFilters["search_bar"])) {
                newFilters["search_bar"] = newFilters["search_bar"].filter((item) => {
                    const sameLabel = getItemText(item) === targetText;
                    const sameCategory =
                        !value?.category ||
                        item?.category === value?.category;
                    return !(sameLabel && sameCategory);
                });
                if (newFilters["search_bar"].length === 0) {
                    delete newFilters["search_bar"];
                }
            }
        } else if (keyToCategory_early[filterKey]) {
            const category = keyToCategory_early[filterKey];
            if (newFilters["search_bar"]) {
                newFilters["search_bar"] = newFilters["search_bar"].filter(
                    (item) =>
                        !(
                            normalize(item?.label) === targetText &&
                            item?.category === category
                        ),
                );
                if (newFilters["search_bar"].length === 0) {
                    delete newFilters["search_bar"];
                }
            }
        }

        isResetFilter.current = Object.keys(newFilters).length > 0 ? false : true;
        return newFilters;
    };

    const onRemoveFilter = (filterKey, value, index) => {
        // debugger
        setChipHeaderData((prev) => {
            const newFilters = { ...prev };
            if (!newFilters[filterKey] || !Array.isArray(newFilters[filterKey]))
                return prev;

            const normalize = (text) =>
                (text ?? "").toString().trim().toLowerCase();
            const getItemText = (item) =>
                normalize(item?.label ?? item?.title ?? item?.name ?? item?.value ?? item);
            const targetText = getItemText(value);

            // Remove the item from its own filter key
            newFilters[filterKey] = newFilters[filterKey].filter((_, i) => i !== index);
            if (newFilters[filterKey].length === 0) {
                delete newFilters[filterKey];
            }

            // ── Sync to search_bar ──────────────────────────────────────
            if (filterKey === "search_bar") {
                // Removing from search_bar should also remove the linked structured filter.
                const structuredKeys = value?.category
                    ? [categoryToKey[value.category]].filter(Boolean)
                    : Object.keys(keyToCategory);

                structuredKeys.forEach((structuredKey) => {
                    if (!Array.isArray(newFilters[structuredKey])) return;
                    newFilters[structuredKey] = newFilters[structuredKey].filter(
                        (item) => getItemText(item) !== targetText,
                    );
                    if (newFilters[structuredKey].length === 0) {
                        delete newFilters[structuredKey];
                    }
                });

                if (Array.isArray(newFilters["search_bar"])) {
                    newFilters["search_bar"] = newFilters["search_bar"].filter((item) => {
                        const sameLabel = getItemText(item) === targetText;
                        const sameCategory =
                            !value?.category ||
                            item?.category === value?.category;
                        return !(sameLabel && sameCategory);
                    });
                    if (newFilters["search_bar"].length === 0) {
                        delete newFilters["search_bar"];
                    }
                }
            } else if (keyToCategory[filterKey]) {
                // Removing from a structured filter → also remove from search_bar
                const category = keyToCategory[filterKey];
                if (newFilters["search_bar"]) {
                    newFilters["search_bar"] = newFilters["search_bar"].filter(
                        (item) =>
                            !(
                                normalize(item?.label) === targetText &&
                                item?.category === category
                            ),
                    );
                    if (newFilters["search_bar"].length === 0) {
                        delete newFilters["search_bar"];
                    }
                }
            }
            // ────────────────────────────────────────────────────────────

            isResetFilter.current = Object.keys(newFilters).length > 0 ? false : true;
            return newFilters;
        });
    };

    const handleDelete = (chip) => {
        const nextFilters = removeFilterFromChipState(
            chipHeaderData,
            chip.filterKey,
            chip.value,
            chip.index,
        );

        // Safety net: force-remove from search_bar by label match (same as Ctrl+Shift+X shortcut)
        const removedLabel = (chip.value ?? '').toString().trim().toLowerCase();
        if (Array.isArray(nextFilters.search_bar)) {
            nextFilters.search_bar = nextFilters.search_bar.filter(
                (item) => {
                    const itemLabel = (item?.label ?? '').toString().trim().toLowerCase();
                    return itemLabel !== removedLabel;
                }
            );
            if (nextFilters.search_bar.length === 0) delete nextFilters.search_bar;
        }

        isResetFilter.current = Object.keys(nextFilters).length === 0;
        skipNextFilterDispatchRef.current = true;
        skipFilterRestoration.current = true;
        setChipHeaderData(nextFilters);
        changeCardDataOnFilterChange(nextFilters, { skipRestore: true });
    }

    const onResetAll = () => {
        isResetFilter.current = true;
        skipNextFilterDispatchRef.current = false;
        setChipHeaderData({});
        setInputValue("");
        setIsSavedFilterOn(false);
        setSavedFilterId(null);
        // Also clear URL session so subsequent filter changes use groupedFilters mode.
        // const nextParams = setSessionKeySearchParam(searchParams, "");
        // nextParams.delete("_ss");
        // nextParams.set("page", "1");
        // setSearchParams(nextParams, { replace: true });
    };

    const stripCountryCode = (str) =>
        typeof str === "string" ? str.replace(/\s*\(\s*[A-Z]{2,4}\s*\)/g, "").trim() : str;

    const getLabel = (value) => {
        if (typeof value === "object" && value !== null) {
            const raw = value.title || value.label || value.name || value.value || JSON.stringify(value);
            return stripCountryCode(raw);
        }
        return stripCountryCode(String(value));
    };

    // Monotonic request id. Each filter fetch increments it; only the latest
    // request is allowed to run its post-fetch restore/session side-effects.
    // Prevents a stale in-flight fetch (e.g. the default empty-filter fetch
    // fired on initial page load) from resolving LATE and calling
    // setChipHeaderData(originalFilter) — which would wipe the filter the user
    // just applied. That stale overwrite is why the first apply "didn't stick"
    // and only worked on the second try.
    const filterFetchSeqRef = useRef(0);
    const changeCardDataOnFilterChange = useCallback(
        (filters, { skipRestore = false } = {}) => {
            const sessionKey = getSessionKeyFromSearchParams(searchParams);
            const payloadFilters = buildFilterPayload(filters);
            const shouldSkipRestore = skipRestore;
            const requestSeq = ++filterFetchSeqRef.current;

            dispatch(
                fetchCards({
                    groupedFilters:
                        Object.keys(payloadFilters).length > 0
                            ? payloadFilters
                            : {},
                    flag: "",
                    page: 1,
                    session_key:
                        isResetFilter.current ||
                            Object.keys(payloadFilters).length > 0
                            ? ""
                            : Object.keys(payloadFilters).length == 0 &&
                                !sessionKey?.includes("RBNvo1WzZ4oRRq0W")
                                ? sessionKey
                                : "",
                }),
            ).then((res) => {
                // A newer filter fetch started after this one — this response is
                // stale. Skip its chip-restore so it can't clobber the filter the
                // user applied in the meantime.
                const isStale = requestSeq !== filterFetchSeqRef.current;
                if (
                    !isStale &&
                    !shouldSkipRestore &&
                    Object.keys(payloadFilters).length == 0 &&
                    !sessionKey?.includes("RBNvo1WzZ4oRRq0W") &&
                    res.payload.payload &&
                    !isResetFilter.current
                ) {
                    const originalFilter = parseFilterPayload(res.payload.payload);
                    setChipHeaderData(originalFilter);
                    // Persist payload-backed filters so hard reload with same session_key restores chips.
                    if (res?.payload?.session_key) {
                        setStoredFiltersForSession(res.payload.session_key, res.payload.payload);
                    }
                }
                if (res?.payload?.session_key) {
                    const nextSessionKey = res?.payload?.session_key || "";
                    // Do NOT call setSearchParams here — it uses the current pathname at call time,
                    // which may still be the old oncosuite_id before ListTabContainer's navigate commits.
                    // ListTabContainer's selection-sync navigate already includes the session_key.
                    // We only persist the filter→session mapping for reload restoration.
                    // const nextParams = setSessionKeySearchParam(searchParams, nextSessionKey);
                    // setSearchParams(nextParams, { replace: true });
                    // if(!nextSessionKey?.includes("RBNvo1WzZ4oRRq0W")) {
                    //     setSearchParams((prev) => {
                    //         const p = new URLSearchParams(prev);
                    //         p.set("session_key", res?.payload?.session_key);
                    //         return p;
                    //     }, { replace: true });
                    // }
                    setStoredFiltersForSession(nextSessionKey, payloadFilters || {});
                }
            });
        },
        [dispatch, searchParams, setSearchParams],
    );

    const chips = useMemo(() => {
        const list = [];

        Object.entries(chipHeaderData).forEach(([filterKey, filterValue]) => {
            if (!filterValue || (Array.isArray(filterValue) && !filterValue.length) || filterKey === 'search_bar')
                return;

            const excludedKeys = [
                "start_date_min",
                "start_date_max",
                "completion_date_min",
                "completion_date_max",
                "study_first_post_date_min",
                "study_first_post_date_max",
                "result_first_posted",
                "age",
                "sex",
                "estimatedEnrollment",
                "resultPosted",
                "sites",
            ];

            // if (excludedKeys.some((key) => filterKey.includes(key))) return;

            // Multi-select filters
            if (Array.isArray(filterValue)) {
                filterValue.forEach((value, index) => {
                    list.push({
                        id: `${filterKey}-${value?.id ?? value.label}-${index}`,
                        filterKey,
                        value: value.label,
                        index,
                        label: getLabel(value.label),
                        type: value.type
                    });
                });
                return;
            }

            // Single value filters
            list.push({
                id: `${filterKey}`,
                filterKey,
                value: filterValue,
                label: getLabel(filterValue),
            });
        });
        return list;
    }, [chipHeaderData]);
    // End of Method for the chip header

    const lastFetchKeyRef = useRef("");
    const skipNextFilterDispatchRef = useRef(false);
    const skipNextSearchFetchRef = useRef(false);

    // Recent searches — persist selected labels so they surface first in future searches
    const RECENT_SEARCHES_KEY = "ct_recent_search_labels";
    const MAX_RECENT = 8;
    const recentSearchLabelsRef = useRef(() => {
        try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"); } catch { return []; }
    });
    if (typeof recentSearchLabelsRef.current === "function") {
        recentSearchLabelsRef.current = recentSearchLabelsRef.current();
    }
    const addRecentSearchLabel = (label) => {
        const prev = recentSearchLabelsRef.current;
        // Dedup case-insensitively and ignore whitespace differences so the same term added
        // via different code paths (onChange vs the search_bar backfill effect) can't produce
        // two "recent" entries for what is really one label.
        const norm = (l) => (l ?? "").toString().trim().toLowerCase();
        const key = norm(label);
        const next = [label, ...prev.filter((l) => norm(l) !== key)].slice(0, MAX_RECENT);
        recentSearchLabelsRef.current = next;
        try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    };

    // Backfill recents with any search_bar chips that are already selected but
    // weren't tracked yet (e.g. restored from a shared/saved URL) so they still
    // surface as recent searches.
    useEffect(() => {
        (chipHeaderData['search_bar'] || []).forEach((chip) => {
            if (chip?.label) addRecentSearchLabel(chip.label);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chipHeaderData['search_bar']]);

    // Levenshtein distance for typo tolerance
    const levenshtein = (a, b) => {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[m][n];
    };
    const fuzzyMatch = (label, query) => {
        const q = query.toLowerCase();
        return (label ?? "").toString().toLowerCase().split(/\s+/).some((word) => {
            if (word.length < 4 || q.length < 4) return false;
            const maxDist = q.length <= 6 ? 1 : 2;
            return levenshtein(word.slice(0, q.length + 1), q) <= maxDist;
        });
    };

    // Synonym map — common aliases expand to additional search terms
    const SYNONYM_MAP = {
        "lung cancer": ["nsclc", "sclc", "lung"],
        "breast cancer": ["breast", "her2", "er+"],
        "colon cancer": ["colorectal", "colon", "crc"],
        "skin cancer": ["melanoma"],
        "blood cancer": ["leukemia", "lymphoma", "myeloma"],
        "brain cancer": ["glioma", "glioblastoma", "gbm"],
        "liver cancer": ["hepatocellular", "hcc"],
        "kidney cancer": ["renal cell", "rcc"],
        "prostate cancer": ["prostate"],
        "ovarian cancer": ["ovarian"],
    };
    const expandQueryWithSynonyms = (q) => {
        const lower = q.toLowerCase().trim();
        return SYNONYM_MAP[lower] ?? null;
    };

    const [fuzzyHintText, setFuzzyHintText] = useState("");

    useEffect(() => {
        // Avoid side-effects during render and prevent redundant fetch loops.
        const nextKey = JSON.stringify(buildFilterPayload(chipHeaderData));
        if (nextKey === lastFetchKeyRef.current) {
            return;
        }

        const shareIdParam = searchParams.get("share_id");
        const urlSessionKey = getSessionKeyFromSearchParams(searchParams);
        const isSharedFind =
            typeof urlSessionKey === "string" && urlSessionKey.startsWith("share:");
        const onAnalyticsShare = Boolean(shareIdParam) && !isSharedFind;
        const hasChips = Object.keys(buildFilterPayload(chipHeaderData)).length > 0;

        const fire = () => {
            // Fire synchronously (no setTimeout). The previous deferred version
            // returned clearTimeout as the effect cleanup — on initial load of a
            // shared session (session_key=search:...), the searchParams /
            // sharedChipFilters effects churn many re-renders in the same tick,
            // and each re-run's cleanup cancelled the pending fetch before it
            // ran. The chip stayed checked but the list never filtered until the
            // user toggled it off/on. lastFetchKeyRef already dedupes identical
            // payloads, so a direct dispatch can't loop and needs no debounce.
            lastFetchKeyRef.current = nextKey;
            changeCardDataOnFilterChange(chipHeaderData);
        };

        // Chips changed to a NON-EMPTY set: always reapply and fetch, ignoring
        // any skip flag a hydrator set. This covers the shared link (send the
        // chip's filter payload like a normal apply) even if the URL lost the
        // share: key. We only reach here when nextKey differs from the last
        // dispatched key, so this won't loop.
        if (hasChips) {
            skipNextFilterDispatchRef.current = false;
            return fire();
        }

        if (skipNextFilterDispatchRef.current) {
            skipNextFilterDispatchRef.current = false;
            return;
        }

        // Shared link with no chips yet: don't fire the default empty-filter fetch.
        if (isSharedFind || onAnalyticsShare) {
            return;
        }

        return fire();
    }, [changeCardDataOnFilterChange, chipHeaderData, searchParams]);

    // Hydrate chips when session_key in URL changes (e.g. Saved Search) without full reload.
    const lastUrlSessionKeyRef = useRef("");
    useEffect(() => {
        const urlSessionKey = getSessionKeyFromSearchParams(searchParams);
        if (!urlSessionKey) return;
        // Shared sessions (share:...) are handled by the shared-chip hydrator
        // below, which fires the filtered fetch. Don't restore from local
        // storage here (it would set the skip flag and suppress that fetch).
        if (urlSessionKey.startsWith("share:")) return;
        if (lastUrlSessionKeyRef.current === urlSessionKey) return;
        lastUrlSessionKeyRef.current = urlSessionKey;

        // Skip restoration if we just deleted filters
        if (skipFilterRestoration.current) {
            skipFilterRestoration.current = false;
            return;
        }

        const stored = getStoredFiltersForSession(urlSessionKey);
        if (stored && typeof stored === "object" && Object.keys(stored).length > 0) {
            // stored shape matches buildFilterPayload response: { include, exclude, applied_filters }
            skipNextFilterDispatchRef.current = true;
            setChipHeaderData(parseFilterPayload(stored));
        }
        setInputValue("");
    }, [searchParams]);

    // Hydrate the search-bar chips from a shared analytics session. Only the
    // analytics APIs return the applied `top_filters`; the analytics tab
    // publishes them to redux (sharedChipFilters) and we render them as chips.
    // Applies to both the analytics view (share_id in URL) and the Find view
    // (session_key=share:...).
    const sharedChipFilters = useSelector((state) => state.cards.sharedChipFilters);
    const lastSharedChipKeyRef = useRef("");
    useEffect(() => {
        const shareIdParam = searchParams.get("share_id");
        const urlSessionKey = getSessionKeyFromSearchParams(searchParams);
        const isSharedFind =
            typeof urlSessionKey === "string" && urlSessionKey.startsWith("share:");
        const onAnalyticsShare = Boolean(shareIdParam) && !urlSessionKey;

        // Only act on a shared context (analytics share_id URL or Find share: URL).
        if (!onAnalyticsShare && !isSharedFind) return;
        if (!sharedChipFilters || Object.keys(sharedChipFilters).length === 0) return;

        const nextChips = parseFilterPayload(sharedChipFilters);
        const nextKey = JSON.stringify(nextChips);
        if (lastSharedChipKeyRef.current === nextKey) return;
        lastSharedChipKeyRef.current = nextKey;

        // On the analytics view there is no list to fetch, so suppress the fetch.
        // On the Find view we WANT the fetch to fire with these shared filters so
        // the list is filtered — so do NOT set the skip flag there.
        if (onAnalyticsShare) {
            skipNextFilterDispatchRef.current = true;
        }
        setChipHeaderData(nextChips);
        setInputValue("");
    }, [searchParams, sharedChipFilters]);

    const resolveSessionKey = () => {
        const urlSessionKey = getSessionKeyFromSearchParams(searchParams);
        if (urlSessionKey) return urlSessionKey;
        const apiSessionKey = trials?.session_key;
        if (apiSessionKey) return apiSessionKey;
        return "";
    };

    const handleSaveToggle = async (e) => {
        const nextChecked = Boolean(e?.target?.checked);
        if (!nextChecked) {
            setIsSavedFilterOn(false);
            return;
        }

        const filterPayload = buildFilterPayload(chipHeaderData);
        if (!filterPayload || Object.keys(filterPayload).length === 0) {
            showSnackbar({
                message: "Apply at least one filter to save.",
                type: "warning",
            });
            setIsSavedFilterOn(false);
            return;
        }

        const userData = JSON.parse(localStorage.getItem("UserData") || "{}");
        const userId = userData?.user_id ?? userData?.id ?? "";
        const sessionKey = resolveSessionKey();
        const trialCount = Number(trials?.total_found ?? 0);

        if (!userId || !sessionKey) {
            showSnackbar({
                message: "Missing user/session info. Please re-login and try again.",
                type: "error",
            });
            setIsSavedFilterOn(false);
            return;
        }

        setIsSavingFilter(true);
        try {
            const res = await saveSavedFilter({
                user_id: String(userId),
                trial_count: trialCount,
                session_key: String(sessionKey),
                saved_filters_json: {
                    payload: filterPayload,
                },
                is_deleted: false,
                ...(savedFilterId ? { id: savedFilterId } : {}),
            });

            setIsSavedFilterOn(true);
            if (res?.id != null) setSavedFilterId(res.id);
            setHasSavedSearches(true);

            showSnackbar({
                message: res?.message || "Saved filter successfully",
                type: "success",
            });
        } catch (err) {
            console.error("Failed to save filter:", err?.response?.data || err?.message || err);
            setIsSavedFilterOn(false);
            showSnackbar({
                message: "Failed to save filter. Please try again.",
                type: "error",
            });
        } finally {
            setIsSavingFilter(false);
        }
    };



    // Global keyboard shortcuts for filter actions
    useEffect(() => {
        const handler = (e) => {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod || !e.shiftKey) return;
            // Ctrl/Cmd + Shift + E → Reset all filters (R conflicts with browser reload on Mac)
            if (e.key === 'E' || e.key === 'e') {
                e.preventDefault();
                onResetAll();
            }
            // Ctrl/Cmd + Shift + S → Toggle Save
            if (e.key === 'S' || e.key === 's') {
                e.preventDefault();
                handleSaveToggle({ target: { checked: !isSavedFilterOn } });
            }
            // Ctrl/Cmd + Shift + X → Immediately remove last visible chip
            if (e.key === 'X' || e.key === 'x') {
                e.preventDefault();
                // Build visible chips the same way the chips useMemo does (excluding search_bar).
                // Then remove the last one using removeFilterFromChipState so both the structured
                // key AND search_bar stay in sync, and call changeCardDataOnFilterChange directly.
                const visibleChips = Object.entries(chipHeaderData).flatMap(([filterKey, filterValue]) => {
                    if (!filterValue || (Array.isArray(filterValue) && !filterValue.length) || filterKey === 'search_bar') return [];
                    if (Array.isArray(filterValue)) {
                        return filterValue.map((value, index) => ({ filterKey, value: value.label, index }));
                    }
                    return [{ filterKey, value: filterValue, index: undefined }];
                });
                if (visibleChips.length > 0) {
                    const lastChip = visibleChips[visibleChips.length - 1];
                    const nextFilters = removeFilterFromChipState(
                        chipHeaderData,
                        lastChip.filterKey,
                        lastChip.value,
                        lastChip.index,
                    );
                    // removeFilterFromChipState may not clean search_bar if keyToCategory
                    // isn't populated yet — force-remove by label match as a safety net.
                    const removedLabel = (lastChip.value ?? '').toString().trim().toLowerCase();
                    if (Array.isArray(nextFilters.search_bar)) {
                        nextFilters.search_bar = nextFilters.search_bar.filter(
                            (item) => (item?.label ?? '').toString().trim().toLowerCase() !== removedLabel
                        );
                        if (nextFilters.search_bar.length === 0) delete nextFilters.search_bar;
                    }
                    isResetFilter.current = Object.keys(nextFilters).length === 0;
                    skipNextFilterDispatchRef.current = true;
                    setChipHeaderData(nextFilters);
                    changeCardDataOnFilterChange(nextFilters);
                }
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isSavedFilterOn, chipHeaderData, changeCardDataOnFilterChange, onResetAll, handleSaveToggle]);

    // Methods for the dropdown arrow click functionality...
    const filterConfigMap = useMemo(() => {
        const map = {};
        FILTER_SECTIONS.forEach((section) => {
            section.filters.forEach((filter) => {
                map[filter.key] = filter;
            });
        });
        return map;
    }, []);

    const getFilterValue = useCallback(
        (filterKey, defaultValue = []) => {
            const filterConfig = filterConfigMap[filterKey];

            if (filterConfig?.type === "daterange" && filterConfig.keys) {
                const obj = {};
                filterConfig.keys.forEach((key) => {
                    obj[key] = chipHeaderData[filterKey]?.[0]?.[key] ?? null;
                });
                return obj;
            }

            return chipHeaderData[filterKey] ?? defaultValue;
        },
        [chipHeaderData, filterConfigMap],
    );

    const expandParentToList = (parentObj, type) => [
        { ...parentObj, 'type': type },
        ...parentObj.children.map((child) => ({
            id: `${parentObj.id}-${child}`,
            label: child,
            type: type,
            parent: parentObj.id,
        })),
    ];

    // Built dynamically from the live API response (categoryMappingRef), which is seeded
    // from CATEGORY_TO_FILTER_KEY on mount and updated as the API returns new category keys.
    const search_filter_mapping = Object.entries(categoryMappingRef.current).map(
        ([category, key]) => ({ key, category })
    );

    // Helper lookups
    const categoryToKey = Object.fromEntries(
        search_filter_mapping.map(({ key, category }) => [category, key])
    );
    // { "Organ": "organ", "Sponsor": "sponsor_name", ... }
    // Categories from non-"main_filter" API flags (e.g. searching "phase") come back keyed by
    // the raw flag name itself (e.g. "phases") — fall back to treating it as the key directly.
    const VALID_FILTER_KEYS = new Set(
        FILTER_SECTIONS.flatMap((section) => section.filters.map((f) => f.key)),
    );
    const resolveStructuredKey = (category) => {
        const direct = categoryToKey[category] ?? (VALID_FILTER_KEYS.has(category) ? category : undefined);
        if (direct) return direct;
        // Compound categories ("Sub Histology + Histology Variant") aren't registered as their
        // own filter key — fall back to the first part's structured key so selecting them still
        // syncs to the correct advanced-panel filter (e.g. → "Sub Histology" / "Histology").
        if ((category ?? "").includes("+")) {
            const firstPart = category.split("+")[0].trim();
            return categoryToKey[firstPart] ?? (VALID_FILTER_KEYS.has(firstPart) ? firstPart : undefined);
        }
        return undefined;
    };

    const keyToCategory = Object.fromEntries(
        search_filter_mapping.map(({ key, category }) => [key, category])
    );
    // { "organ": "Organ", "sponsor_name": "Sponsor", ... }

    const handleFilterUpdate = useCallback(
        (section, filterKey, option) => {
            skipNextFilterDispatchRef.current = false;
            lastFetchKeyRef.current = "";

            if (filterKey === 'primary_endpoint_main') {
                setChipHeaderData((prev) => {

                    const updated = { ...prev };

                    // Get the current array for this specific filter (e.g., 'category')
                    const currentList = updated[filterKey] || [];

                    // Find if this specific value (e.g., 'A') is already in the array
                    const existingIndex = currentList.findIndex((item) => item.label === option.label);

                    let newList = [...currentList];
                    let formatted = []

                    if (existingIndex === -1) {
                        // State 1: Not found -> Add as 'included'
                        if (option.children) {
                            newList = currentList.filter(item => !item.id.includes(option.id));
                            formatted = expandParentToList(option, 'included')
                            newList.push(...formatted);
                        } else {
                            if (option.parentData) {
                                newList.push({ ...option.parentData, type: 'included' })
                                delete option.parentData;
                                newList.push({ ...option, type: 'included' })
                            } else {
                                newList.push({ ...option, type: 'included' });
                            }
                        }
                    } else {
                        // State 2 & 3: Found -> Get next status
                        const nextStatus = getNextStatus(newList[existingIndex].type);


                        if (option.children && nextStatus != null) {
                            //need to set all childs and parent as excluded
                            newList = currentList.map(item =>
                                item.id.includes(option.id)
                                    ? { ...item, type: 'excluded' }
                                    : item
                            );
                        } else if (option.children && nextStatus == null) {
                            //need to remove all childs along with parent
                            newList = currentList.filter(item => !item.id.includes(option.id));
                        } else if (!option.children && nextStatus != null) {
                            newList[existingIndex] = { ...option, type: nextStatus };
                        } else if (!option.children && nextStatus == null) {
                            newList.splice(existingIndex, 1)
                            newList = newList.filter(item => item.id !== option.parent)
                        }



                        // if (nextStatus === null) {
                        //     // State 3: Remove from list
                        //     newList.splice(existingIndex, 1);
                        // } else {
                        //     // State 2: Update type (e.g., 'included' -> 'excluded')
                        //     newList[existingIndex] = { ...option, type: nextStatus };
                        // }
                    }

                    // Update the key or remove it entirely if the array is empty
                    if (newList.length > 0) {
                        updated[filterKey] = newList;
                    } else {
                        delete updated[filterKey];
                    }
                    isResetFilter.current = Object.keys(updated).length > 0 ? false : true;
                    return updated;
                });
            } else if (filterKey == 'study_start' || filterKey == "completion_date") {
                setChipHeaderData((prev) => {
                    const updated = { ...prev };
                    const currentList = updated[filterKey] || [];
                    const existingIndex = currentList.findIndex((item) => item.label_key === option.label_key);
                    let newList = [...currentList];
                    if (existingIndex === -1) {
                        // State 1: Not found -> Add as 'included'
                        newList.push({ ...option, type: 'included' });
                    } else if (option.start_date_max !== null || option.start_date_min !== null) {
                        // Update with date values
                        const newObj = {
                            ...(option.start_date_max != null && { start_date_max: option.start_date_max }),
                            ...(option.start_date_min != null && { start_date_min: option.start_date_min }),
                        };
                        newList[existingIndex] = {
                            ...newList[existingIndex],
                            ...newObj,
                            selected_range: option.selected_range,
                            type: option?.selected_range?.label == undefined ? 'included' : option.selected_range?.label != newList[existingIndex]?.selected_range?.label ? "included" : "excluded",
                            label: option.label
                        };
                    } else {
                        newList.splice(existingIndex, 1)
                    }

                    // Update the key or remove it entirely if the array is empty
                    if (newList.length > 0) {
                        updated[filterKey] = newList;
                    } else {
                        delete updated[filterKey];
                    }
                    isResetFilter.current = Object.keys(updated).length > 0 ? false : true;
                    return updated;
                })
            } else {
                setChipHeaderData((prev) => {
                    const updated = { ...prev };
                    const currentList = updated[filterKey] || [];
                    const existingIndex = currentList.findIndex((item) =>
                        filterKey === "search_bar"
                            ? item.label === option.label && item.category === option.category
                            : item.label === option.label,
                    );

                    let newList = [...currentList];
                    let finalType = null; // track what type ended up being applied

                    if (existingIndex === -1) {
                        finalType = "included";
                        newList.push({ ...option, type: finalType });
                    } else {
                        const nextStatus = getNextStatus(newList[existingIndex].type);
                        finalType = nextStatus; // null means "removed"

                        if (nextStatus === null) {
                            newList.splice(existingIndex, 1);
                        } else {
                            newList[existingIndex] = { ...option, type: nextStatus };
                        }
                    }

                    if (newList.length > 0) {
                        updated[filterKey] = newList;
                    } else {
                        delete updated[filterKey];
                    }

                    // ✅ Two-way sync
                    syncFilters(updated, filterKey, newList, option, finalType);

                    isResetFilter.current = Object.keys(updated).length > 0 ? false : true;
                    return updated;
                });

            }
        },
        [chipHeaderData]
    );


    const syncFilters = (updated, filterKey, newList, option, type) => {

        // ── search_bar → structured filter ──────────────────────────
        if (filterKey === "search_bar" && option?.category) {
            const structuredKey = resolveStructuredKey(option.category);

            if (structuredKey) {
                const structuredList = updated[structuredKey] || [];
                const existingIndex = structuredList.findIndex(
                    (item) => item.label === option.label
                );

                let newStructuredList = [...structuredList];

                if (type === null) {
                    // Removed from search_bar → remove from structured too
                    newStructuredList = newStructuredList.filter(
                        (item) => item.label !== option.label
                    );
                } else if (existingIndex === -1) {
                    // New item → add to structured
                    newStructuredList.push({ label: option.label, type });
                } else {
                    // Update type in structured
                    newStructuredList[existingIndex] = {
                        ...newStructuredList[existingIndex],
                        type,
                    };
                }

                if (newStructuredList.length > 0) {
                    updated[structuredKey] = newStructuredList;
                } else {
                    delete updated[structuredKey];
                }
            }
        }

        // ── structured filter → search_bar ──────────────────────────
        if (filterKey !== "search_bar" && keyToCategory[filterKey]) {
            const category = keyToCategory[filterKey];
            const searchList = updated["search_bar"] || [];
            const existingIndex = searchList.findIndex(
                (item) => item.label === option.label && item.category === category
            );

            let newSearchList = [...searchList];

            if (type === null) {
                // Removed from structured → remove from search_bar too
                newSearchList = newSearchList.filter(
                    (item) => !(item.label === option.label && item.category === category)
                );
            } else if (existingIndex === -1) {
                // New item → add to search_bar
                newSearchList.push({ label: option.label, category, type });
            } else {
                // Update type in search_bar
                newSearchList[existingIndex] = {
                    ...newSearchList[existingIndex],
                    type,
                };
            }

            if (newSearchList.length > 0) {
                updated["search_bar"] = newSearchList;
            } else {
                delete updated["search_bar"];
            }
        }

        return updated;
    };

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
            const mainSearchValues = []
                .filter((item) => item.group === key)
                .map((item) => item.title);

            const combinedValue =
                type === "autocomplete"
                    ? [
                        ...new Set([
                            ...(value || []).map((item) =>
                                typeof item === "object" ? item.label : item,
                            ),
                            ...mainSearchValues,
                        ]),
                    ]
                    : value;

            switch (type) {
                case "autocomplete": {
                    // CommonAutocompleteNew (non-grouped) returns the full array of plain-string
                    // selections on every change, but handleFilterUpdate expects a single
                    // {label, type} option at a time (like DropdownWithChecklist provides).
                    // Diff against the current value and forward just the item that changed.
                    const onAutocompleteChange = (newValues = []) => {
                        const previousLabels = (combinedValue || []).map((item) =>
                            typeof item === "object" ? item.label : item,
                        );
                        const nextLabels = (newValues || []).map((item) =>
                            typeof item === "object" ? item.label : item,
                        );

                        const added = nextLabels.find((label) => !previousLabels.includes(label));
                        if (added !== undefined) {
                            onChange({ label: added });
                            return;
                        }

                        const removed = previousLabels.find((label) => !nextLabels.includes(label));
                        if (removed !== undefined) {
                            onChange({ label: removed });
                        }
                    };

                    return (
                        <CommonAutocompleteNew
                            placeholder={placeholder}
                            value={combinedValue}
                            onChange={onAutocompleteChange}
                            filters={chipHeaderData}
                            fieldType={key}
                            isGrouped={false}
                            accordionExpanded={expandedFilterKey === key}
                            onAccordionChange={(nextExpanded) =>
                                setExpandedFilterKey(nextExpanded ? key : null)
                            }
                        />
                    );
                }

                case "checklist":
                    return (
                        <DropdownWithChecklist
                            placeholder={placeholder}
                            value={value}
                            onChange={onChange}
                            options={options}
                            filters={chipHeaderData}
                            fieldType={key}
                            isGrouped={false}
                            accordionExpanded={expandedFilterKey === key}
                            onAccordionChange={(nextExpanded) =>
                                setExpandedFilterKey(nextExpanded ? key : null)
                            }
                        />
                    );

                case "daterange":
                    return (
                        <DatePickerBlock
                            label={label}
                            value={value}
                            onChange={onChange}
                            keys={filter?.keys}
                            accordionExpanded={expandedFilterKey === key}
                            onAccordionChange={(nextExpanded) =>
                                setExpandedFilterKey(nextExpanded ? key : null)
                            }
                        />
                    );

                case "radiobutton":
                    return (
                        <DropdownRadioButton
                            placeholder={placeholder}
                            value={value}
                            onChange={onChange}
                            filter={chipHeaderData}
                            fieldType={key}
                        />
                    );

                case "radiorange":
                    return (
                        <RadioButtonWithRange
                            placeholder={placeholder}
                            value={value}
                            onChange={onChange}
                            filter={chipHeaderData}
                            fieldType={key}
                        />
                    );
                default:
                    return null;
            }
        },
        [getFilterValue, chipHeaderData, expandedFilterKey, handleFilterUpdate],
        // [],
    );
    // End of Methods for the dropdown arrow click functionality...

    const chipScrollRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    // ✅ Check overflow whenever chips change
    useEffect(() => {
        const el = chipScrollRef.current;
        if (!el) return;

        // ── Overflow check ──────────────────────────────────────────
        const checkOverflow = () => {
            setIsOverflowing(el.scrollWidth > el.clientWidth);
        };
        checkOverflow();
        const observer = new ResizeObserver(checkOverflow);
        observer.observe(el);

        // ── Mouse wheel horizontal scroll ───────────────────────────
        const handleWheel = (e) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };
        el.addEventListener("wheel", handleWheel, { passive: false });

        // ── Click + drag to scroll ──────────────────────────────────
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const onMouseDown = (e) => {
            // Don't start drag if clicking on a chip delete icon or the chip itself
            if (e.target.closest('.MuiChip-deleteIcon')) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            if (e.target.closest('.MuiChip-root')) return;
            isDown = true;
            el.style.cursor = "grabbing";
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        };

        const onMouseLeave = () => {
            isDown = false;
            el.style.cursor = "grab";
        };

        const onMouseUp = () => {
            isDown = false;
            el.style.cursor = "grab";
        };

        const onMouseMove = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = x - startX; // distance dragged
            el.scrollLeft = scrollLeft - walk;
        };

        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("mouseleave", onMouseLeave);
        el.addEventListener("mouseup", onMouseUp);
        el.addEventListener("mousemove", onMouseMove);

        return () => {
            observer.disconnect();
            el.removeEventListener("wheel", handleWheel);
            el.removeEventListener("mousedown", onMouseDown);
            el.removeEventListener("mouseleave", onMouseLeave);
            el.removeEventListener("mouseup", onMouseUp);
            el.removeEventListener("mousemove", onMouseMove);
        };
    }, [chips]);

    // Stable PaperComponent reference for the search Autocomplete's popup.
    // MUI treats a changed component reference as an entirely different
    // component and unmounts/remounts it — an inline arrow function here
    // would get a new identity on every render (i.e. every checkbox click,
    // since that updates `chipHeaderData`), tearing down and rebuilding the
    // whole listbox DOM (and its scroll position) on every selection. This
    // was the actual root cause of the dropdown resetting to the top.
    const searchDropdownPaperComponent = useCallback(
        ({ children, ...paperProps }) => (
            <Paper {...paperProps}>
                {/* "Did you mean?" — shown when fuzzy match is active */}
                {fuzzyHintText && (
                    <Box sx={{ px: 2, pt: 1.5, pb: 0.5, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <Typography sx={{ fontSize: 12, fontFamily: "Rubik", color: "rgba(0,0,0,0.45)" }}>
                            No exact match for &ldquo;<strong style={{ color: "rgba(0,0,0,0.65)" }}>{fuzzyHintText}</strong>&rdquo; — showing closest results
                        </Typography>
                    </Box>
                )}
                {/* Recent searches header — shown on empty input */}
                {!inputValue.trim() && searchOptions.length > 0 && (recentSearchLabelsRef.current ?? []).length > 0 && (
                    <Box sx={{ px: 2, pt: 1.5, pb: 0.5, borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography sx={{ fontSize: 11, fontFamily: "Rubik", fontWeight: 600, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Recent searches
                        </Typography>
                    </Box>
                )}
                {children}
            </Paper>
        ),
        [fuzzyHintText, inputValue, searchOptions],
    );

    return (
        <>
            <Box
                data-trials-header="true"
                display="flex"
                flexDirection="column"
                sx={{ width: "100%", minWidth: 0 }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    sx={{ width: "100%" }}
                >
                    <Typography
                        fontSize={27}
                        fontFamily={"Rubik"}
                        fontWeight={500}
                        sx={{ padding: "8px 18px" }}
                        color="rgba(0, 0, 0, 0.8)"
                    >
                        Trials
                    </Typography>
                    <ClickAwayListener
                        onClickAway={() => {
                            setOpenFilterPanel(false);
                            setOpenSearchDropdown(false);
                        }}
                    >
                        <Box
                            sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1, minWidth: 0 }}
                        >
                            <Box sx={{ width: { xs: "100%", md: 600 }, minWidth: 0 }} ref={anchorRef}>
                                {/* ================= SEARCH ================= */}
                                {/* Code for manual enter data in the dropdown input */}
                                <Autocomplete
                                    // freeSolo
                                    multiple
                                    disableCloseOnSelect
                                    className="trials-search-input"
                                    open={openSearchDropdown}
                                    filterOptions={(x) => x}

                                    value={chipHeaderData['search_bar'] || []}
                                    options={searchOptions || []}

                                    inputValue={inputValue}
                                    renderTags={() => null}
                                    loading={loading}
                                    noOptionsText={
                                        inputValue.trim().length > 0 && inputValue.trim().length < 2 ? (
                                            <Typography
                                                sx={{
                                                    fontSize: 14,
                                                    fontFamily: "Rubik",
                                                    color: "#555",
                                                    py: 2,
                                                    textAlign: "center",
                                                }}
                                            >
                                                Type at least 2 characters to search
                                            </Typography>
                                        ) : inputValue.trim().length > 0 ? (
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
                                                    No results found
                                                    {/* found for{" "}
                                                <strong>&quot;{inputValue}&quot;</strong> */}
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

                                    isOptionEqualToValue={(option, value) => {
                                        return option.category === value.category &&
                                            option.label === value.label;
                                    }}

                                    onHighlightChange={(event, option) => {
                                        highlightedOptionRef.current = option;
                                    }}

                                    // ✅ Update searchSelections (array)
                                    onChange={(event, newValue, reason, details) => {
                                        if (event?.keyCode == 8 && inputValue?.length == 0) return;

                                        // Skip keyboard Enter — handled by onKeyDown to preserve highlight
                                        if (event?.type === 'keydown' && event?.key === 'Enter') return;

                                        if (reason === 'selectOption' || reason === 'removeOption') {
                                            skipNextSearchFetchRef.current = true;
                                            if (reason === 'selectOption' && details.option?.label) {
                                                addRecentSearchLabel(details.option.label);
                                            }
                                            handleFilterUpdate(null, 'search_bar', details.option);
                                            // Keep focus in the search input so keyboard nav
                                            // continues after selecting (no re-click needed).
                                            requestAnimationFrame(() => searchInputRef.current?.focus());
                                        }
                                    }}

                                    onInputChange={(event, newValue, reason) => {
                                        if (reason === "input") {
                                            // Typing re-fetches the list — re-arm the scroll-lock
                                            // so the re-render jump is suppressed again.
                                            keyboardNavActiveRef.current = false;
                                            setInputValue(newValue);

                                        }
                                    }}
                                    getOptionLabel={(option) =>
                                        typeof option === "string" ? option : option?.label || ""
                                    }
                                    // Give every option a unique identity of category+label. Labels
                                    // can repeat across categories (e.g. "Papillary adenocarcinoma"
                                    // under both "Histology" and "Sub Histology + Histology Variant").
                                    // Without a category-aware key, MUI collapses same-label options
                                    // to one internal entry, so a click on the duplicate row resolves
                                    // to the first occurrence and the duplicate row can't be selected.
                                    getOptionKey={(option) =>
                                        `${option?.category ?? ""}::${option?.label ?? ""}`
                                    }
                                    ListboxProps={{
                                        className: "app-scroll",
                                        ref: searchListboxCallbackRef,
                                        // Cap the suggestion list height and let it scroll
                                        // when there are more results than fit (e.g. 30+),
                                        // instead of overflowing the Paper and getting clipped.
                                        style: { maxHeight: 320, overflowY: "auto", scrollBehavior: "smooth" },
                                    }}
                                    PaperComponent={searchDropdownPaperComponent}
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
                                            inputRef={searchInputRef}
                                            placeholder="Cancer type, biomarker, phase..."
                                            onFocus={() => {
                                                // Don't reopen the suggestion dropdown if the chevron just
                                                // opened the advanced filter panel.
                                                if (openFilterPanelRef.current) return;
                                                if (!inputValue?.trim()) {
                                                    showRecentSearches();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                                    // Release the scroll-lock so MUI can scroll the
                                                    // highlighted option into view during keyboard nav.
                                                    keyboardNavActiveRef.current = true;
                                                    if (!openSearchDropdown) setOpenSearchDropdown(true);
                                                    return;
                                                }
                                                if (e.key === 'Enter' && highlightedOptionRef.current) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    skipNextSearchFetchRef.current = true;
                                                    if (highlightedOptionRef.current?.label) {
                                                        addRecentSearchLabel(highlightedOptionRef.current.label);
                                                    }
                                                    handleFilterUpdate(null, 'search_bar', highlightedOptionRef.current);
                                                    // Keep the dropdown open and focus in the
                                                    // input so arrow keys / further selections
                                                    // keep working without re-clicking. The state
                                                    // update re-renders the list and can blur the
                                                    // input, which would hand arrow keys to the
                                                    // page — so restore focus across the next two
                                                    // frames (after React commits + MUI settles).
                                                    keyboardNavActiveRef.current = false;
                                                    setOpenSearchDropdown(true);
                                                    requestAnimationFrame(() => {
                                                        searchInputRef.current?.focus();
                                                        requestAnimationFrame(() => searchInputRef.current?.focus());
                                                    });
                                                } else if (e.key === 'Escape' || e.key === 'Tab') {
                                                    setOpenSearchDropdown(false);
                                                    // Move keyboard focus to card list
                                                    setTimeout(() => document.dispatchEvent(new CustomEvent('focusCardList')), 0);
                                                    if (e.key === 'Tab') e.preventDefault();
                                                }
                                            }}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        {/* <SearchIcon sx={{ color: "#9e9e9e", mr: 1 }} /> */}
                                                        <img src={SearchIcon} alt="" />
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

                                                                const next = !openFilterPanelRef.current;
                                                                openFilterPanelRef.current = next;
                                                                setOpenFilterPanel(next);
                                                                setOpenSearchDropdown(false);
                                                            }}
                                                        >
                                                            <ExpandMoreIcon
                                                                sx={{
                                                                    color: "rgba(0, 0, 0, 0.6)",
                                                                    transition: "transform 200ms ease",
                                                                    transform: openFilterPanel ? "rotate(180deg)" : "rotate(0deg)",
                                                                }}
                                                            />
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

                                    renderOption={(props, option, { selected }, ...rest2) => {

                                        const { key, ...rest } = props;
                                        const stableKey = `${option?.category ?? "cat"}::${option?.label ?? "label"}`;
                                        const selection = chipHeaderData['search_bar']?.find(
                                            (s) => s.label === option.label && s.category === option.category
                                        ) || null;
                                        const status = selection?.type;

                                        // Category group header — show when category changes from previous item
                                        const currentIndex = searchOptions.findIndex(
                                            (o) => o.label === option.label && o.category === option.category
                                        );
                                        const prevOption = currentIndex > 0 ? searchOptions[currentIndex - 1] : null;
                                        const showCategoryHeader = inputValue.trim() && prevOption?.category !== option.category;

                                        return (
                                            <Fragment key={stableKey}>
                                                {showCategoryHeader && (
                                                    <Box
                                                        key={`header-${option.category}`}
                                                        sx={{
                                                            px: 2, py: 0.5,
                                                            backgroundColor: "rgba(0,0,0,0.02)",
                                                            borderTop: currentIndex > 0 ? "1px solid rgba(0,0,0,0.06)" : "none",
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: 10, fontFamily: "Rubik", fontWeight: 600, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                                                            {formatCategoryLabel(option.category)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <li
                                                    key={stableKey}
                                                    {...rest}
                                                    className={classes.dropdown_option_text}
                                                    style={{ cursor: 'pointer', borderBottom: '1px solid rgb(224 224 224 / 35%)' }}
                                                >
                                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                                        <span style={{ display: "flex", alignItems: "center" }}>
                                                            <Checkbox
                                                                style={{ marginRight: 8 }}
                                                                checked={!!status}
                                                                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                                                checkedIcon={
                                                                    status === 'included' ? (
                                                                        <CheckBoxIcon fontSize="small" sx={{ color: '#1976d2' }} />
                                                                    ) : (
                                                                        <DisabledByDefaultIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                                                                    )
                                                                }
                                                            />
                                                            <span>{highlightMatch(formatDisplayLabel(option.label), inputValue)}</span>
                                                            <span className={classes.dropdown_option_text_label} style={{ marginLeft: 6 }}>
                                                                {formatCategoryLabel(option.category)}
                                                            </span>
                                                            {option._isSynonym && (
                                                                <span style={{ marginLeft: 6, fontSize: 10, color: "rgba(0,0,0,0.35)", fontFamily: "Rubik", fontStyle: "italic" }}>
                                                                    via synonym
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                </li>
                                            </Fragment>
                                        )
                                    }}
                                />

                                {/* Code for click of the dropdown arrow button */}
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
                                                    width: 160,
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
                                                    p: 2,
                                                    overflowY: "auto",
                                                    width: "440px",
                                                }}
                                                className="app-scroll"
                                            >
                                                {FILTER_SECTIONS.find(
                                                    (section) => section.title === activeSection,
                                                )?.filters.map((filter) => (
                                                    <Box key={filter.key} mb={"4px"}>
                                                        {renderFilter(filter, activeSection)}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Popper>

                            </Box>

                            {hasSavedSearches && (
                                <Box
                                    role="button"
                                    tabIndex={0}
                                    onClick={openSavedSearchesDialog}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            openSavedSearchesDialog();
                                        }
                                    }}
                                    sx={{
                                        fontFamily: "Rubik",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: "rgba(38, 102, 190, 1)",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        textDecoration: "none",
                                        opacity: isHeaderHovered ? 1 : 0,
                                        pointerEvents: isHeaderHovered ? "auto" : "none",
                                        transition: "opacity 150ms ease",
                                        "&:hover": { textDecoration: "none" },
                                    }}
                                >
                                    Saved searches
                                </Box>
                            )}
                        </Box>
                    </ClickAwayListener>

                    {/* Make the hover-target span the full row width */}
                    <Box sx={{ flexGrow: 1 }} />
                </Box>

                <Dialog
                    open={openSavedSearches}
                    onClose={() => setOpenSavedSearches(false)}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            width: 860,
                            maxWidth: "calc(100vw - 48px)",
                            height: 720,
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            boxShadow: "4px 4px 20px rgba(130, 143, 169, 0.15)",
                            overflow: "hidden",
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontFamily: "Rubik",
                            fontWeight: 500,
                            fontSize: 20,
                            lineHeight: "18px",
                            letterSpacing: "0%",
                            color: "rgba(0, 0, 0, 0.8)",
                            py: 1.5,
                        }}
                    >
                        Manage saved searches
                        <IconButton
                            onClick={() => setOpenSavedSearches(false)}
                            size="small"
                            sx={{ color: "rgba(0,0,0,0.55)" }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent
                        className="app-scroll"
                        sx={{
                            p: "32px",
                            height: "100%",
                        }}
                        ref={savedSearchesScrollRef}
                        onScroll={(e) => {
                            const el = e.currentTarget;
                            const thresholdPx = 120;
                            const isNearBottom =
                                el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;

                            if (!isNearBottom) return;
                            if (savedSearchLoading) return;
                            if (savedSearchPage >= savedSearchTotalPages) return;

                            fetchSavedSearchesPage(savedSearchPage + 1);
                        }}
                    >
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    md: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: "16px",
                            }}
                        >
                            {savedSearchLoading && savedSearches.length === 0 && (
                                Array.from({ length: 6 }).map((_, idx) => (
                                    <Paper
                                        key={`saved-search-skel-${idx}`}
                                        elevation={0}
                                        sx={{
                                            height: 164,
                                            borderRadius: "6px",
                                            p: "15px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "15px",
                                            backgroundColor: "#fff",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                            boxShadow: "0px 4px 12px rgba(137,148,164,0.12)",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                            <Skeleton variant="rounded" width={72} height={22} />
                                            <Skeleton variant="rounded" width={92} height={22} />
                                            <Skeleton variant="rounded" width={64} height={22} />
                                        </Box>
                                        <Box sx={{ flex: 1 }} />
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <Skeleton variant="rounded" width="100%" height={32} />
                                            <Skeleton variant="rounded" width={32} height={32} />
                                        </Box>
                                    </Paper>
                                ))
                            )}
                            {savedSearches.map((item) => {
                                const labels = getSavedSearchLabels(item);
                                const shown = labels.slice(0, 4);
                                const remaining = labels.slice(4);
                                const extra = remaining.length;
                                const isSelected = selectedSavedSearchId === item.id;

                                return (
                                    <Paper
                                        key={item.id}
                                        elevation={0}
                                        sx={{
                                            height: 164,
                                            borderRadius: "6px",
                                            p: "15px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "15px",
                                            backgroundColor: "#fff",
                                            border: isSelected
                                                ? "1px solid rgba(28, 77, 142, 1)"
                                                : "1px solid rgba(0,0,0,0.08)",
                                            boxShadow: "0px 4px 12px rgba(137,148,164,0.12)",
                                            boxSizing: "border-box",
                                            transition: "box-shadow 150ms ease",
                                            "&:hover": {
                                                boxShadow: "0px 10px 22px rgba(137,148,164,0.14)",
                                            },
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setSelectedSavedSearchId(item.id)}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "8px",
                                                // Keep divider aligned across cards by constraining
                                                // the "chips" block to a consistent height.
                                                minHeight: 56,
                                                alignContent: "flex-start",
                                            }}
                                        >
                                            {shown.map((f) => (
                                                <Box
                                                    key={f}
                                                    sx={{
                                                        px: "8px",
                                                        py: "2px",
                                                        borderRadius: "4px",
                                                        fontFamily: "Rubik",
                                                        fontSize: 12,
                                                        lineHeight: "16px",
                                                        color: "rgba(0,0,0,0.7)",
                                                        background: "rgba(240, 246, 254, 1)",
                                                    }}
                                                >
                                                    {f}
                                                </Box>
                                            ))}
                                            {extra > 0 ? (
                                                <Tooltip
                                                    arrow
                                                    placement="top"
                                                    title={
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap: "wrap",
                                                                gap: "6px",
                                                                p: "4px",
                                                            }}
                                                        >
                                                            {remaining.map((f) => (
                                                                <Box
                                                                    key={f}
                                                                    sx={{
                                                                        px: "8px",
                                                                        py: "2px",
                                                                        borderRadius: "4px",
                                                                        fontFamily: "Rubik",
                                                                        fontSize: 12,
                                                                        lineHeight: "16px",
                                                                        color: "rgba(255,255,255,0.92)",
                                                                        background: "rgba(255,255,255,0.14)",
                                                                    }}
                                                                >
                                                                    {f}
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    }
                                                >
                                                    <Box
                                                        sx={{
                                                            px: "8px",
                                                            py: "2px",
                                                            borderRadius: "4px",
                                                            fontFamily: "Rubik",
                                                            fontSize: 12,
                                                            lineHeight: "16px",
                                                            color: "rgba(38, 102, 190, 1)",
                                                            background: "rgba(240, 246, 254, 1)",
                                                            cursor: "default",
                                                            transition:
                                                                "background-color 120ms ease, color 120ms ease",
                                                            "&:hover": {
                                                                background: "rgba(0, 0, 0, 0.9)",
                                                                color: "rgba(47, 129, 243, 0.85)",
                                                            },
                                                        }}
                                                    >
                                                        +{extra}
                                                    </Box>
                                                </Tooltip>
                                            ) : null}
                                        </Box>

                                        <Box sx={{ flex: 1 }} />

                                        <Box sx={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />

                                        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <Button
                                                variant={isSelected ? "contained" : "outlined"}
                                                fullWidth
                                                endIcon={<ArrowForwardIcon />}
                                                disableElevation
                                                disableRipple
                                                disableFocusRipple
                                                sx={{
                                                    height: 32,
                                                    textTransform: "none",
                                                    fontFamily: "Rubik",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    borderRadius: "6px",
                                                    backgroundColor: isSelected
                                                        ? "rgba(38, 102, 190, 1)"
                                                        : "transparent",
                                                    color: isSelected
                                                        ? "rgba(255, 255, 255, 1)"
                                                        : "rgba(38, 102, 190, 1)",
                                                    borderColor: "rgba(38, 102, 190, 1)",
                                                    justifyContent: "space-between",
                                                    px: 1.25,
                                                    "&:hover": {
                                                        backgroundColor: isSelected
                                                            ? "rgba(38, 102, 190, 1)"
                                                            : "transparent",
                                                        borderColor: "rgba(38, 102, 190, 1)",
                                                    },
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSavedSearchId(item.id);
                                                    applySavedSearch(item);
                                                }}
                                            >
                                                See {Number(item.trial_count ?? 0)} Trials
                                            </Button>

                                            <IconButton
                                                size="small"
                                                disableRipple
                                                disableFocusRipple
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "6px",
                                                    background: "rgba(254, 242, 242, 1)",
                                                    "&:hover": {
                                                        background: "rgba(254, 242, 242, 1)",
                                                    },
                                                }}
                                                onClick={(e) => {
                                                    handleDeleteSavedSearch(e, item);
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={DeleteIcon}
                                                    alt="delete"
                                                    sx={{ width: 18, height: 18 }}
                                                />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                );
                            })}

                            {!savedSearchLoading && savedSearches.length === 0 && (
                                <Box
                                    sx={{
                                        gridColumn: "1 / -1",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "100%",
                                        minHeight: 260,
                                        fontFamily: "Rubik",
                                        fontSize: 14,
                                        color: "rgba(0,0,0,0.55)",
                                    }}
                                >
                                    No saved searches found.
                                </Box>
                            )}
                            {savedSearchLoading && (
                                <Box
                                    sx={{
                                        gridColumn: "1 / -1",
                                        display: "flex",
                                        justifyContent: "center",
                                        py: 2,
                                        fontFamily: "Rubik",
                                        fontSize: 13,
                                        color: "rgba(0,0,0,0.55)",
                                    }}
                                >
                                    <Skeleton variant="text" width={120} />
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={deleteConfirmOpen}
                    onClose={() => {
                        setDeleteConfirmOpen(false);
                        setDeleteTarget(null);
                    }}
                    fullWidth
                    maxWidth="xs"
                    PaperProps={{
                        sx: {
                            borderRadius: "8px",
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontFamily: "Rubik",
                            fontWeight: 500,
                            fontSize: 18,
                            color: "rgba(0, 0, 0, 0.8)",
                        }}
                    >
                        Delete saved search
                    </DialogTitle>
                    <DialogContent
                        sx={{
                            fontFamily: "Rubik",
                            fontSize: 14,
                            color: "rgba(0, 0, 0, 0.65)",
                        }}
                    >
                        Are you sure you want to delete this saved search?
                    </DialogContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                            px: 3,
                            pb: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setDeleteTarget(null);
                            }}
                            sx={{
                                textTransform: "none",
                                fontFamily: "Rubik",
                                borderRadius: "8px",
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={confirmDeleteSavedSearch}
                            sx={{
                                textTransform: "none",
                                fontFamily: "Rubik",
                                borderRadius: "8px",
                                backgroundColor: "rgba(38, 102, 190, 1)",
                                "&:hover": { backgroundColor: "rgba(28, 77, 142, 1)" },
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                </Dialog>


                {/* UI for the chip header */}
                {(chips?.length > 0) && (
                    <Box
                        data-trials-chip-row="true"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            // Keep chip row constrained to the header container so it doesn't push siblings (e.g. Share)
                            width: "100%",
                            minWidth: 0,
                            bgcolor: "#F0F6FE",
                            maxHeight: "56px",
                            paddingRight: !isHovered ? "16px" : "0"
                        }}
                    >
                        {/* ✅ Scrollable chips — always takes full width when not hovered */}
                        <Box
                            ref={chipScrollRef}
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexWrap: "nowrap",
                                gap: 1,
                                alignItems: "center",
                                overflowX: "auto",
                                overflowY: "hidden",
                                px: 2,
                                py: 1.5,
                                scrollbarWidth: "none",
                                "&::-webkit-scrollbar": { display: "none" },
                                WebkitOverflowScrolling: "touch",
                                minWidth: 0,
                                cursor: "grab",
                                userSelect: "none",
                            }}
                        >
                            {chips?.map((chip) => (
                                <Chip
                                    key={chip.id}
                                    label={chip.label}
                                    icon={
                                        chip.type === "excluded" ? (
                                            <DisabledByDefaultIcon style={{ color: "#d32f2f", fontSize: "16px" }} />
                                        ) : undefined
                                    }
                                    size="small"
                                    variant="outlined"
                                    onDelete={(e) => {
                                        e?.stopPropagation?.();
                                        handleDelete(chip);
                                    }}
                                    deleteIcon={<CloseIcon style={{ pointerEvents: "auto" }} onClick={(e) => { e.stopPropagation(); }} />}
                                    sx={{
                                        fontSize: 12,
                                        gap: "3px",
                                        flexShrink: 0,
                                        height: "27px !important",
                                        borderRadius: "20px",
                                        border: "1px solid #E0E1E6 !important",
                                        color: "#00000099",
                                        // fontWeight: 450,
                                        fontFamily: "Rubik",
                                        transition: "all 0.2s ease",

                                        "&:hover": {
                                            color: "#000000",
                                        },

                                        "&:hover .MuiChip-label": {
                                            color: "#000000",
                                        },

                                        "& .MuiChip-deleteIcon": {
                                            color: "#00000099",
                                            fontSize: "16px",
                                            borderRadius: "50%",
                                            padding: "2px",
                                            margin: "0 4px 0 -2px",
                                            cursor: "pointer",
                                        },

                                        "&:hover .MuiChip-deleteIcon": {
                                            color: "#000000",
                                        },
                                    }}
                                />
                            ))}
                            {(!isOverflowing && isHovered) && (
                                <Typography
                                    onClick={onResetAll}
                                    sx={{
                                        fontSize: 13,
                                        fontFamily: "Rubik",
                                        fontWeight: 600,
                                        color: "#C14646",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        "&:hover": { opacity: 0.8 },
                                    }}
                                >
                                    Reset
                                </Typography>
                            )}
                        </Box>

                        {/* ✅ Buttons — keep mounted to avoid flicker when hover affects overflow */}
                        <Box
                            sx={{
                                display: isHovered ? "flex" : "none",
                                alignItems: "center",
                                gap: 1,
                                flexShrink: 0,
                                pr: 2,
                                pl: 2,
                                bgcolor: "#F0F6FE",
                                visibility: isHovered ? "visible" : "hidden",
                                pointerEvents: isHovered ? "auto" : "none",
                            }}
                        >
                            {/* Reset (only when chips overflow) */}
                            {isOverflowing && (
                                <Typography
                                    onClick={onResetAll}
                                    sx={{
                                        fontSize: 13,
                                        fontFamily: "Rubik",
                                        fontWeight: 600,
                                        color: "#C14646",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        "&:hover": { opacity: 0.8 },
                                    }}
                                >
                                    Reset
                                </Typography>
                            )}

                            {/* Save + Switch */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        fontFamily: "Rubik",
                                        color: "#00000099",
                                        fontWeight: 500,
                                    }}
                                >
                                    Save
                                </Typography>

                                {/* ✅ Larger toggle matching Figma */}
                                <Switch
                                    size="small"
                                    checked={isSavedFilterOn}
                                    onChange={handleSaveToggle}
                                    disabled={isSavingFilter}
                                    sx={{
                                        width: 44,
                                        height: 24,
                                        padding: 0,
                                        "& .MuiSwitch-switchBase": {
                                            padding: "3px",
                                            "&.Mui-checked": {
                                                transform: "translateX(20px)",
                                                color: "#fff",
                                                "& + .MuiSwitch-track": {
                                                    backgroundColor: "#2666BE",
                                                    opacity: 1,
                                                },
                                            },
                                        },
                                        "& .MuiSwitch-thumb": {
                                            width: 18,
                                            height: 18,
                                            backgroundColor: "#fff",
                                            boxShadow: "0px 1px 3px rgba(0,0,0,0.2)",
                                        },
                                        "& .MuiSwitch-track": {
                                            borderRadius: 12,
                                            backgroundColor: "#C4C4C4",
                                            opacity: 1,
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </>
    );
}
