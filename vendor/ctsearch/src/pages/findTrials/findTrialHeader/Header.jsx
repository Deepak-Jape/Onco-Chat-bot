import { useState, useEffect, useRef } from "react";
import FilterAll from "../allFilters/FilterAll";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchConditions,
  fetchCount,
  fetchInterventions,
} from "../../../redux/actions/searchAction";
import { monthOptions, phasesOptions } from "../../../utils/helpers/helper";
import {
  Box,
  Collapse,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import CustomDateRangeCalender from "../../../common/CustomDateRangeCalendar";
import { DownArrow } from "../../../assets";
import { headerStyles } from "../../trialsHeader/trialsSubHeader/style";
import FilterBar from "../../../common/FilterBar";
import CommonTooltip from "../../../common/CommonTooltip";

const Header = ({ collapsed, onFilterChange }) => {
  const arraysEqualPrimitives = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => sa[i] === sb[i]);
  };
  const classes = headerStyles();
  const arraysEqualPhases = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const va = a.map((p) => p?.value ?? p).sort();
    const vb = b.map((p) => p?.value ?? p).sort();
    return va.every((v, i) => va[i] === vb[i]);
  };
  const [selectedInterventional, setSelectedInterventional] = useState([]);
  const [selectedComparative, setSelectedComparative] = useState([]);
  const [selectedMoaIntervention, setSelectedMoaIntervention] = useState([]);
  const [selectedMoaComparator, setSelectedMoaComparator] = useState([]);
  const [selectedComparativeType, setSelectedComparativeType] = useState([]);
  const [chosen, setChosen] = useState("");
  const [blindChosen, setBlindChosen] = useState("");
  const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  const [selectedLineOfTherapy, setSelectedLineOfTherapy] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedBiomarker, setSelectedBiomarker] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [selectedBackbone, setSelectedBackbone] = useState([]);
  const [enrollmentSlider, setEnrollmentSlider] = useState({ from: 0, to: 0 });
  const [sitesSlider, setSitesSlider] = useState({ from: 0, to: 0 });
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState([]);
  const [weightSlider, setWeightSlider] = useState({ from: 0, to: 0 });
  const [genderChosen, setGenderChosen] = useState("");
  const [selectedPerformanceStatus, setSelectedPerformanceStatus] = useState(
    []
  );
  const headerRef = useRef(null);
  const [selectedSponsors, setSelectedSponsors] = useState([]);
  const [selectedleadSponsor, setSelectedleadSponsor] = useState([]);
  const [selectedLeadResearcher, setSelectedLeadResearcher] = useState([]);
  const [resultChosen, setResultChosen] = useState("");
  const [selectedStudyDocument, setSelectedStudyDocument] = useState([]);
  const [studyStartFrom, setStudyStartFrom] = useState("");
  const [studyStartTo, setStudyStartTo] = useState("");
  const [primaryCompletionFrom, setPrimaryCompletionFrom] = useState("");
  const [primaryCompletionTo, setPrimaryCompletionTo] = useState("");
  const [selectedNctId, setSelectedNctId] = useState([]);

  const dispatch = useDispatch();
  const conditionState = useSelector((state) => state.conditionData);
  const [isConditionPopupOpen, setIsConditionPopupOpen] = useState(false);
  const [isTreatmentPopupOpen, setIsTreatmentPopupOpen] = useState(false);
  const [isStudyStatusOpen, setIsStudyStatusOpen] = useState(false);
  const [isPhasePopupOpen, setIsPhasePopupOpen] = useState(false);
  const [showAllConditions, setShowAllConditions] = useState(false);
  const [showAllStudyStatus, setShowAllStudyStatus] = useState(false);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedStudyStatus, setSelectedStudyStatus] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [isStudyPhaseOpen, setIsStudyPhaseOpen] = useState(false);
  const [isStudyTypeOpen, setIsStudyTypeOpen] = useState(false);
  const [selectedStudyTypes, setSelectedStudyTypes] = useState([]);
  const [isReadoutPopupOpen, setIsReadoutPopupOpen] = useState(false);
  const [selectedReadout, setSelectedReadout] = useState([]);
  const [activeTab, setActiveTab] = useState("presets");
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedBand, setSelectedBand] = useState("");
  const [searchCondition, setSearchCondition] = useState("");
  const [tempReadout, setTempReadout] = useState([]);
  const mlValue = collapsed ? "6rem" : "13rem";
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sliderValues, setSliderValues] = useState({});
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { loading, conditions, error } = conditionState;
  const countData = useSelector((state) => state.conditionData.count);
  const [clearTrigger, setClearTrigger] = useState(false);
  const {
    conditionCount,
    studyPhaseCount,
    studyTypeCount,
    studyStatusCount,
    readoutCount,
  } = useSelector((state) => state.conditionData);

  useEffect(() => {
    dispatch(fetchConditions());
    dispatch(fetchCount());
  }, [dispatch]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchConditions(searchCondition));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchCondition, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsConditionPopupOpen(false);
        setIsSearchingCondition(false);
      }
    };
    if (isConditionPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isConditionPopupOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTreatmentPopupOpen(false);
        setIsSearchingCondition(false);
      }
    };
    if (isTreatmentPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTreatmentPopupOpen]);

  const studyStatus = [
    { id: 1, text: "Not Yet Recruiting" },
    { id: 2, text: "Recruiting" },
    { id: 3, text: "Enrolling - By Invite" },
    { id: 4, text: "Active - Not Recruiting" },
    { id: 5, text: "Suspended" },
    { id: 6, text: "Withdrawn" },
    { id: 7, text: "Completed" },
    { id: 8, text: "Terminated" },
  ];

  const studyTypes = [
    { id: 1, text: "Interventional" },
    {
      id: 2,
      text: "Observational",
      children: [{ id: 3, text: "Patient Registries" }],
    },
    {
      id: 4,
      text: "Expanded Access",
      children: [
        { id: 5, text: "Individual Patients" },
        { id: 6, text: "Intermediate Size Population" },
        { id: 7, text: "Treatment IND/Protocol" },
      ],
    },
  ];

  const calculateDateRange = (months = 0) => {
    const start = new Date();
    const end = new Date();

    if (months === 0) {
      // 🔸 THIS MONTH
      start.setDate(1);
      // End date = today
    } else {
      // 🔸 FUTURE MONTH RANGE
      end.setMonth(end.getMonth() + months);
    }
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    if (customStartDate || customEndDate) {
      sendPayloadWithReadout({
        custom_start_date: customStartDate || undefined,
        custom_end_date: customEndDate || undefined,
      });
    }
  }, [customStartDate, customEndDate]);

  const sendPayloadWithReadout = (readoutOverride = null) => {
    const readoutObj = {};

    const processReadout = (val) => {
      const match = val.match(/(\d+)/);
      if (val === "This Month") return calculateDateRange(0);
      if (match) return calculateDateRange(parseInt(match[0]));
      return val;
    };

    // 🔸 Priority 1: Custom Date
    if (customStartDate || customEndDate) {
      readoutObj.custom_start_date = customStartDate || undefined;
      readoutObj.custom_end_date = customEndDate || undefined;
    }
    // 🔸 Priority 2: Preset (only if no custom date)
    else if (readoutOverride) {
      readoutObj.bulk_date = processReadout(readoutOverride.bulk_date);
    } else if (selectedReadout && selectedReadout.length > 0) {
      const val = selectedReadout[0];
      readoutObj.bulk_date = processReadout(val);
    }

    const payload = {
      ...(selectedConditions.length > 0 && { condition: selectedConditions }),
      ...(selectedPhases.length > 0 && {
        study_phase: selectedPhases.map((p) => p.value),
      }),
      ...(selectedStudyStatus.length > 0 && {
        study_status: selectedStudyStatus,
      }),
      ...(selectedStudyTypes.length > 0 && { study_type: selectedStudyTypes }),
      ...sliderValues,
      ...(Object.keys(readoutObj).length > 0 && { readout: readoutObj }),
    };

    setIsCountLoading(true); // start loader before API
    dispatch(fetchCount(payload)).finally(() => {
      setIsCountLoading(false); // stop loader after API completes
    });
  };

  useEffect(() => {
    if (customStartDate || customEndDate) {
      // 🔸 When custom date selected → remove preset readout
      setSelectedReadout([]);
      // 🔸 Call API immediately
      sendPayloadWithReadout();
    }
  }, [customStartDate, customEndDate]);

  const handleReset = () => {
    setSelected("");
    setSelectedRange({
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    });
    setEnrollmentSlider({ from: 0, to: 0 });
    setSitesSlider({ from: 0, to: 0 });
    setWeightSlider({ from: 0, to: 0 });
    setGenderChosen("");
    setSelectedPerformanceStatus([]);
    setSelectedSponsors([]);
    setResultChosen("");
    setStudyStartFrom("");
    setStudyStartTo("");
    setPrimaryCompletionFrom("");
    setPrimaryCompletionTo("");
    setSelectedNctId([]);
    setSelectedStudyDocument([]);
    setSelectedleadSponsor([]);
    setSelectedLeadResearcher([]);
    setSelectedFacility([]);
    setSelectedLocation([]);
    setSelectedBackbone([]);
    setSelectedCriteria([]);
    setSelectedBiomarker([]);
    setSelectedStages([]);
    setSelectedLineOfTherapy([]);
    setSelectedEndpoints([]);
    setChosen("");
    setBlindChosen("");
    setSelectedComparativeType([]);
    setSelectedMoaComparator([]);
    setSelectedMoaIntervention([]);
    setSelectedInterventional([]);
    setSelectedComparative([]);
    setSelectedConditions([]);
    setSelectedInterventional([]) // Reset Conditions
    setSelectedPhases([]); // Reset Study Phase
    setSelectedStudyStatus([]); // Reset Study Status
    setSelectedStudyTypes([]); // Reset Study Type
    setSelectedReadout([]); // Reset Readout Window
    setCustomStartDate(""); // Reset Custom Start Date
    setCustomEndDate(""); // Reset Custom End Date
    setSliderValues({}); // Reset Slider Values (if applicable)
    setSearchCondition(""); // Reset Search Condition
    setSelected(""); // Reset Selected Value for Readout Dropdown
    dispatch(fetchCount({}));
    const filteredFilters = {};
    const counts = {};
    onFilterChange(filteredFilters, counts);
  };

  const handleCheckboxChange = (item, type) => {
    let updatedConditions = [...selectedConditions];
    let updatedPhases = [...selectedPhases];
    let updatedStatus = [...selectedStudyStatus];
    let updatedTypes = [...selectedStudyTypes];
    let updatedReadout = [...selectedReadout];
    let updatedSliders = { ...sliderValues };
    let updatedInterventional = [...selectedInterventional];
    const getItemValue = (obj) => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj.name || obj.text || obj.value || "";
    };
    switch (type) {
      case "treatment":
        const treatments = getItemValue(item);
        updatedInterventional = updatedInterventional.includes(treatments)
          ? updatedInterventional.filter((c) => c !== treatments)
          : [...updatedInterventional, treatments];
        setSelectedInterventional(updatedInterventional);
        break;
      case "condition":
        const condName = getItemValue(item);
        updatedConditions = updatedConditions.includes(condName)
          ? updatedConditions.filter((c) => c !== condName)
          : [...updatedConditions, condName];
        setSelectedConditions(updatedConditions);
        break;
      case "phase":
        const exists = updatedPhases.find((p) => p.value === item.value);
        updatedPhases = exists
          ? updatedPhases.filter((p) => p.value !== item.value)
          : [...updatedPhases, { text: item.text, value: item.value }];
        setSelectedPhases(updatedPhases);
        break;
      case "status":
        const statusVal = getItemValue(item);
        updatedStatus = updatedStatus.includes(statusVal)
          ? updatedStatus.filter((s) => s !== statusVal)
          : [...updatedStatus, statusVal];
        setSelectedStudyStatus(updatedStatus);
        break;
      case "studyType":
        const typeVal = getItemValue(item);
        updatedTypes = updatedTypes.includes(typeVal)
          ? updatedTypes.filter((t) => t !== typeVal)
          : [...updatedTypes, typeVal];
        setSelectedStudyTypes(updatedTypes);
        break;
      case "readout": {
        const readoutVal = getItemValue(item);
        const isPreset = options.some((opt) => opt.label === readoutVal);
        if (isPreset) {
          // Selecting a preset clears custom dates
          setSelectedReadout([readoutVal]);
          setCustomStartDate("");
          setCustomEndDate("");
          setOpen(false);
          sendPayloadWithReadout({ bulk_date: readoutVal }); // 🔸 Auto-call API
        } else {
          setSelectedReadout((prev) =>
            prev.includes(readoutVal)
              ? prev.filter((r) => r !== readoutVal)
              : [...prev, readoutVal]
          );
        }
        break;
      }
      default:
        updatedSliders[type] = item;
        setSliderValues(updatedSliders);
        break;
    }
    let readoutPayload = {};
    if (updatedReadout.length > 0) {
      const val = updatedReadout[0];
      if (["6 month", "12 month", "18 month", "24 month"].includes(val)) {
        const months = parseInt(val.split(" ")[0], 10);
        readoutPayload.bulk_date = calculateDateRange(months);
      } else {
        readoutPayload.bulk_date = val;
      }
    }
    if (customStartDate || customEndDate) {
      readoutPayload = {
        ...(customStartDate && { custom_start_date: customStartDate }),
        ...(customEndDate && { custom_end_date: customEndDate }),
      };
    }
    const payload = {
      ...(updatedConditions.length > 0 && { condition: updatedConditions }),
      ...(updatedInterventional.length > 0 && { treatment: updatedInterventional }),
      ...(updatedPhases.length > 0 && {
        study_phase: updatedPhases.map((p) => p.value),
      }),
      ...(updatedStatus.length > 0 && { study_status: updatedStatus }),
      ...(updatedTypes.length > 0 && { study_type: updatedTypes }),
      ...(Object.keys(readoutPayload).length > 0 && {
        readout: readoutPayload,
      }),
      ...updatedSliders,
    };
    setIsCountLoading(true); // start loader before API
    dispatch(fetchCount(payload)).finally(() => {
      setIsCountLoading(false); // stop loader after API completes
    });
  };

  const options = [
    { label: "This Month", value: "This Month" },
    { label: "Next 6 Months", value: "Next 6 month" },
    { label: "Next 12 Months", value: "Next 12 month" },
    { label: "Next 18 Months", value: "Next 18 month" },
    { label: "Next 24 Months", value: "Next 24 month" },
  ];
  const handleSelect = (value) => {
    setSelected(value);
    setOpen(false);
  };

  const [stagingSelectedConditions, setStagingSelectedConditions] = useState([
    ...selectedConditions,
  ]);
  const [stagingSelectedTreatment, setStagingSelectedTreatment] = useState([
    ...selectedInterventional,
  ]);
  const [stagingSelectedPhases, setStagingSelectedPhases] = useState([
    ...selectedPhases,
  ]);
  const [stagingSelectedStudyStatus, setStagingSelectedStudyStatus] = useState([
    ...selectedStudyStatus,
  ]);
  const [stagingSelectedStudyTypes, setStagingSelectedStudyTypes] = useState([
    ...selectedStudyTypes,
  ]);
  const [stagingSelectedReadout, setStagingSelectedReadout] = useState([
    ...selectedReadout,
  ]);


  const buildCountPayload = ({
    conditions = [],
    phases = [],
    statuses = [],
    types = [],
    readoutArr = [],
    treatment = [],
    sliders = sliderValues,
    customStart = customStartDate,
    customEnd = customEndDate,
  } = {}) => {
    let readoutPayload = {};
    const processReadout = (val) => {
      if (!val) return undefined;

      const lower = val.toLowerCase();

      if (lower === "this month") {
        return calculateDateRange(0);
      }
      const match = lower.match(/(\d+)\s*month/);
      if (match) {
        const months = parseInt(match[1], 10);
        return calculateDateRange(months);
      }
      return val;
    };
    if (customStart || customEnd) {
      readoutPayload = {
        ...(customStart && { custom_start_date: customStart }),
        ...(customEnd && { custom_end_date: customEnd }),
      };
    } else if (readoutArr && readoutArr.length > 0) {
      const val = readoutArr[0];
      const processed = processReadout(val);

      if (typeof processed === "object" && processed.start_date) {
        readoutPayload.bulk_date = {
          start_date: processed.start_date,
          end_date: processed.end_date,
        };
      } else {
        readoutPayload.bulk_date = processed;
      }
    }
    const payload = {
      ...(conditions.length > 0 && { condition: conditions }),
      ...(treatment.length > 0 && { treatment: treatment }),
      ...(phases.length > 0 && {
        study_phase: phases.map((p) => p.value ?? p),
      }),
      ...(statuses.length > 0 && { study_status: statuses }),
      ...(types.length > 0 && { study_type: types }),
      ...(Object.keys(readoutPayload).length > 0 && {
        readout: readoutPayload,
      }),
      ...sliders,
    };
    return payload;
  };

  const fetchCountForSelections = (selections) => {
    const payload = buildCountPayload(selections);
    setIsCountLoading(true);
    return dispatch(fetchCount(payload)).finally(() => {
      setIsCountLoading(false);
    });
  };

  const handlePopupOpen = (type) => {
    // copy applied -> staging (no fetch)
    if (type === "phase") {
      setStagingSelectedPhases([...selectedPhases]);
      setIsStudyPhaseOpen(true);
    } else if (type === "condition") {
      setStagingSelectedConditions([...selectedConditions]);
      setIsConditionPopupOpen(true);
    } else if (type === "treatment") {
      setStagingSelectedTreatment([...selectedInterventional]);
      setIsTreatmentPopupOpen(true);
    } else if (type === "status") {
      setStagingSelectedStudyStatus([...selectedStudyStatus]);
      setIsStudyStatusOpen(true);
    } else if (type === "studyType") {
      setStagingSelectedStudyTypes([...selectedStudyTypes]);
      setIsStudyTypeOpen(true);
    } else if (type === "readout") {
      // ✅ If nothing applied yet, keep previous staging intact
      const applied =
        selectedReadout.length > 0
          ? [...selectedReadout]
          : [...stagingSelectedReadout];

      setStagingSelectedReadout(applied);
      setTempReadout(applied);
      setIsReadoutPopupOpen(true);

      // ✅ Clear custom date when opening preset
      if (applied.length > 0) {
        setCustomStartDate("");
        setCustomEndDate("");
      }

      // ✅ Fetch count preview for current selection (if exists)
      if (applied.length > 0) {
        fetchCountForSelections({
          ...getPayloadFromStaging(),
          readoutArr: applied,
        });
      }
    }
  };

  const handlePopupCancel = (type) => {
    if (type === "phase") {
      const changed = !arraysEqualPhases(stagingSelectedPhases, selectedPhases);
      // revert staging
      setStagingSelectedPhases([...selectedPhases]);
      // only refetch if user had changed staging (we need to refresh counts back to applied state)
      if (changed) {
        fetchCountForSelections({
          phases: selectedPhases,
          conditions: selectedConditions,
          statuses: selectedStudyStatus,
          types: selectedStudyTypes,
          readoutArr: selectedReadout,
        });
      }
      setIsStudyPhaseOpen(false);
    }

    if (type === "treatment") {
      const changed = !arraysEqualPhases(stagingSelectedTreatment, selectedInterventional);
      // revert staging
      setStagingSelectedTreatment([...selectedInterventional]);
      // only refetch if user had changed staging(we need to refresh counts back to applied state)
      if (changed) {
        fetchCountForSelections({
          phases: selectedPhases,
          conditions: selectedConditions,
          statuses: selectedStudyStatus,
          types: selectedStudyTypes,
          readoutArr: selectedReadout,
          treatment: selectedInterventional,
        });
      }
      setIsTreatmentPopupOpen(false);
    }

    if (type === "condition") {
      const changed = !arraysEqualPrimitives(
        stagingSelectedConditions,
        selectedConditions
      );
      setStagingSelectedConditions([...selectedConditions]);
      if (changed) {
        fetchCountForSelections({
          conditions: selectedConditions,
          phases: selectedPhases,
          statuses: selectedStudyStatus,
          types: selectedStudyTypes,
          readoutArr: selectedReadout,
        });
      }
      setIsConditionPopupOpen(false);
    }

    if (type === "studyType") {
      const changed = !arraysEqualPrimitives(
        stagingSelectedStudyTypes,
        selectedStudyTypes
      );
      setStagingSelectedStudyTypes([...selectedStudyTypes]);
      if (changed) {
        fetchCountForSelections({
          conditions: selectedConditions,
          phases: selectedPhases,
          statuses: selectedStudyStatus,
          types: selectedStudyTypes,
          readoutArr: selectedReadout,
        });
      }
      setIsStudyTypeOpen(false);
    }

    if (type === "status") {
      const changed = !arraysEqualPrimitives(
        stagingSelectedStudyStatus,
        selectedStudyStatus
      );
      setStagingSelectedStudyStatus([...selectedStudyStatus]);
      if (changed) {
        fetchCountForSelections({
          statuses: selectedStudyStatus,
          conditions: selectedConditions,
          phases: selectedPhases,
          types: selectedStudyTypes,
          readoutArr: selectedReadout,
        });
      }
      setIsStudyStatusOpen(false);
    }

    if (type === "readout") {
      const hasUserNotApplied =
        !arraysEqualPrimitives(
          stagingSelectedReadout.map((r) => String(r || "")),
          selectedReadout.map((r) => String(r || ""))
        ) ||
        customStartDate !== "" ||
        customEndDate !== "";

      // ✅ revert visual and data both if user didn’t apply
      if (hasUserNotApplied) {
        setStagingSelectedReadout([...selectedReadout]);
        setTempReadout([...selectedReadout]); // UI label fix
        setCustomStartDate("");
        setCustomEndDate("");
      } else {
        // ✅ ensure UI label matches applied data
        setTempReadout([...selectedReadout]);
      }

      // ✅ restore count back to applied filters
      fetchCountForSelections({
        phases: selectedPhases,
        conditions: selectedConditions,
        statuses: selectedStudyStatus,
        types: selectedStudyTypes,
        readoutArr: selectedReadout,
      });

      setIsReadoutPopupOpen(false);
    }
  };

  const handleStagingCheckboxChange = (item, type) => {
    if (type === "phase") {
      const exists = stagingSelectedPhases.find((p) => p.value === item.value);
      const next = exists
        ? stagingSelectedPhases.filter((p) => p.value !== item.value)
        : [...stagingSelectedPhases, { text: item.text, value: item.value }];
      setStagingSelectedPhases(next);
      fetchCountForSelections({
        phases: next,
        conditions: stagingSelectedConditions.length
          ? stagingSelectedConditions
          : selectedConditions,
        statuses: stagingSelectedStudyStatus.length
          ? stagingSelectedStudyStatus
          : selectedStudyStatus,
        types: stagingSelectedStudyTypes.length
          ? stagingSelectedStudyTypes
          : selectedStudyTypes,
        readoutArr: stagingSelectedReadout.length
          ? stagingSelectedReadout
          : selectedReadout,
        treatment: stagingSelectedTreatment.length ? stagingSelectedTreatment : selectedInterventional,
      });
      return;
    }
    if (type === "condition") {
      const val =
        typeof item === "string"
          ? item
          : item.name || item.text || item.value || "";
      const next = stagingSelectedConditions.includes(val)
        ? stagingSelectedConditions.filter((c) => c !== val)
        : [...stagingSelectedConditions, val];
      setStagingSelectedConditions(next);

      fetchCountForSelections({
        conditions: next,
        phases: stagingSelectedPhases.length
          ? stagingSelectedPhases
          : selectedPhases,
        statuses: stagingSelectedStudyStatus.length
          ? stagingSelectedStudyStatus
          : selectedStudyStatus,
        types: stagingSelectedStudyTypes.length
          ? stagingSelectedStudyTypes
          : selectedStudyTypes,
        readoutArr: stagingSelectedReadout.length
          ? stagingSelectedReadout
          : selectedReadout,
        treatment: stagingSelectedTreatment.length ? stagingSelectedTreatment : selectedInterventional
      });
      return;
    }
    if (type === "treatment") {
      const val =
        typeof item === "string"
          ? item
          : item.name || item.text || item.value || "";
      const next = stagingSelectedTreatment.includes(val)
        ? stagingSelectedTreatment.filter((c) => c !== val)
        : [...stagingSelectedTreatment, val];
      setStagingSelectedTreatment(next);
      fetchCountForSelections({
        treatment: next,
        conditions: stagingSelectedConditions.length
          ? stagingSelectedConditions
          : selectedConditions,
        phases: stagingSelectedPhases.length
          ? stagingSelectedPhases
          : selectedPhases,
        statuses: stagingSelectedStudyStatus.length
          ? stagingSelectedStudyStatus
          : selectedStudyStatus,
        types: stagingSelectedStudyTypes.length
          ? stagingSelectedStudyTypes
          : selectedStudyTypes,
        readoutArr: stagingSelectedReadout.length
          ? stagingSelectedReadout
          : selectedReadout,
      });
      return;
    }

    if (type === "status") {
      const val =
        typeof item === "string"
          ? item
          : item.name || item.text || item.value || "";
      const next = stagingSelectedStudyStatus.includes(val)
        ? stagingSelectedStudyStatus.filter((s) => s !== val)
        : [...stagingSelectedStudyStatus, val];
      setStagingSelectedStudyStatus(next);
      fetchCountForSelections({
        statuses: next,
        conditions: stagingSelectedConditions,
        phases: stagingSelectedPhases,
        types: stagingSelectedStudyTypes,
        readoutArr: stagingSelectedReadout,
        treatment: stagingSelectedTreatment
      });
      return;
    }
    if (type === "studyType") {
      const val =
        typeof item === "string"
          ? item
          : item.name || item.text || item.value || "";
      const next = stagingSelectedStudyTypes.includes(val)
        ? stagingSelectedStudyTypes.filter((t) => t !== val)
        : [...stagingSelectedStudyTypes, val];
      setStagingSelectedStudyTypes(next);
      fetchCountForSelections({
        types: next,
        conditions: stagingSelectedConditions,
        phases: stagingSelectedPhases,
        statuses: stagingSelectedStudyStatus,
        readoutArr: stagingSelectedReadout,
        treatment: stagingSelectedTreatment
      });
      return;
    }
    if (type === "readout") {
      const readoutVal =
        typeof item === "string"
          ? item
          : item.name || item.text || item.value || "";
      const isPreset = options.some(
        (opt) => opt.label === readoutVal || opt.value === readoutVal
      );

      if (isPreset) {
        setStagingSelectedReadout([readoutVal]);
        setCustomStartDate("");
        setCustomEndDate("");
        fetchCountForSelections({
          ...getPayloadFromStaging(),
          readoutArr: [readoutVal],
        });
        setOpen(false);
      } else {
        const next = stagingSelectedReadout.includes(readoutVal)
          ? stagingSelectedReadout.filter((r) => r !== readoutVal)
          : [...stagingSelectedReadout, readoutVal];
        setStagingSelectedReadout(next);
        fetchCountForSelections({
          ...getPayloadFromStaging(),
          readoutArr: next,
        });
      }
      return;
    }
  };
  const handleApplyFromStaging = (filterType) => {
    if (filterType === "phase") {
      setSelectedPhases([...stagingSelectedPhases]);
    }
    if (filterType === "condition") {
      setSelectedConditions([...stagingSelectedConditions]);
    }
    if (filterType === "status") {
      setSelectedStudyStatus([...stagingSelectedStudyStatus]);
    }
    if (filterType === "studyType") {
      setSelectedStudyTypes([...stagingSelectedStudyTypes]);
    }
    if (filterType === "treatment") {
      setSelectedInterventional([...stagingSelectedTreatment]);
    }
    if (filterType === "readout") {
      setSelectedReadout([...stagingSelectedReadout]); // ✅ apply properly
      setTempReadout([...stagingSelectedReadout]); // ✅ update label
      if (stagingSelectedReadout.length > 0) {
        setCustomStartDate("");
        setCustomEndDate("");
      }
    }

    const filters = {
      condition:
        filterType === "condition"
          ? stagingSelectedConditions
          : selectedConditions,
      study_phase:
        filterType === "phase"
          ? stagingSelectedPhases.map((p) => p.value)
          : selectedPhases.map((p) => p.value),
      study_status:
        filterType === "status"
          ? stagingSelectedStudyStatus
          : selectedStudyStatus,
      study_type:
        filterType === "studyType"
          ? stagingSelectedStudyTypes
          : selectedStudyTypes,
      readout: undefined,
    };
    let readoutPayload = {};
    const useReadout = stagingSelectedReadout.length
      ? stagingSelectedReadout
      : selectedReadout;
    if (useReadout && useReadout.length > 0) {
      const val =
        typeof useReadout[0] === "string"
          ? useReadout[0].toLowerCase().trim()
          : useReadout[0];
      if (val === "this month") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = today;
        readoutPayload.bulk_date = {
          start_date: start.toISOString().split("T")[0],
          end_date: end.toISOString().split("T")[0],
        };
      } else if (typeof val === "string" && val.includes("month")) {
        const months = parseInt(val.match(/\d+/)?.[0] || 0, 10);
        if (months > 0) {
          const { start_date, end_date } = calculateDateRange(months);
          readoutPayload.bulk_date = { start_date, end_date };
        }
      } else {
        readoutPayload.bulk_date = useReadout[0];
      }
    }

    if (customStartDate || customEndDate) {
      readoutPayload = {
        ...(customStartDate && { custom_start_date: customStartDate }),
        ...(customEndDate && { custom_end_date: customEndDate }),
      };
    }
    if (Object.keys(readoutPayload).length > 0) {
      filters.readout = readoutPayload;
    }
    const filteredFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) =>
        Array.isArray(value)
          ? value.length > 0
          : value !== "" && value !== undefined
      )
    );
    const counts = { conditionCount };
    const shouldIncludeCounts =
      conditionCount !== 0 &&
      conditionCount !== null &&
      conditionCount !== undefined;
    if (shouldIncludeCounts) {
      onFilterChange(filteredFilters, counts);
    } else {
      onFilterChange(filteredFilters);
    }
    if (filterType === "phase") setIsStudyPhaseOpen(false);
    if (filterType === "condition") setIsConditionPopupOpen(false);
    if (filterType === "status") setIsStudyStatusOpen(false);
    if (filterType === "studyType") setIsStudyTypeOpen(false);
    if (filterType === "readout") setIsReadoutPopupOpen(false);
    if (filterType === "treatment") setIsTreatmentPopupOpen(false);
    setClearTrigger((prev) => !prev);
  };

  const commitAppliedFilters = (nextState = {}) => {
    const nextConditions = nextState.conditions ?? selectedConditions;
    const nextInterventional = nextState.treatment ?? selectedInterventional;
    const nextPhases = nextState.phases ?? selectedPhases;
    const nextStudyStatus = nextState.statuses ?? selectedStudyStatus;
    const nextStudyTypes = nextState.types ?? selectedStudyTypes;
    const nextReadout = nextState.readoutArr ?? selectedReadout;

    const filters = {
      ...(nextConditions.length > 0 && { condition: nextConditions }),
      ...(nextPhases.length > 0 && {
        study_phase: nextPhases.map((p) => p.value),
      }),
      ...(nextStudyStatus.length > 0 && { study_status: nextStudyStatus }),
      ...(nextStudyTypes.length > 0 && { study_type: nextStudyTypes }),
      ...(nextInterventional.length > 0 && { treatment: nextInterventional }),
      ...(nextReadout.length > 0 && {
        readout: { bulk_date: nextReadout[0] },
      }),
    };

    const filteredFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) =>
        Array.isArray(value)
          ? value.length > 0
          : value !== "" && value !== undefined,
      ),
    );

    const counts = { conditionCount };
    const shouldIncludeCounts =
      conditionCount !== 0 &&
      conditionCount !== null &&
      conditionCount !== undefined;

    if (shouldIncludeCounts) {
      onFilterChange(filteredFilters, counts);
    } else {
      onFilterChange(filteredFilters);
    }
  };

  const getPayloadFromStaging = () => {
    return {
      phases: stagingSelectedPhases.length
        ? stagingSelectedPhases
        : selectedPhases,
      conditions: stagingSelectedConditions.length
        ? stagingSelectedConditions
        : selectedConditions,
      statuses: stagingSelectedStudyStatus.length
        ? stagingSelectedStudyStatus
        : selectedStudyStatus,
      types: stagingSelectedStudyTypes.length
        ? stagingSelectedStudyTypes
        : selectedStudyTypes,
      readoutArr: stagingSelectedReadout.length
        ? stagingSelectedReadout
        : selectedReadout,
    };
  };

  const [isSearchingCondition, setIsSearchingCondition] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState("540px");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (dropdownRef.current) {
      const visibleConditions = conditions.filter((c) =>
        c.name.toLowerCase().includes(searchCondition.toLowerCase())
      );
      if (visibleConditions.length > 0) {
        const longestName = visibleConditions.reduce(
          (a, b) => (a.name.length > b.name.length ? a : b),
          { name: "" }
        ).name;
        const width = Math.min(
          Math.max(longestName.length * 8 + 100, 250),
          540
        );
        setDropdownWidth(`${width}px`);
      } else {
        setDropdownWidth("250px");
      }
    }
  }, [searchCondition, conditions]);

  const [isCountLoading, setIsCountLoading] = useState(false);

  const phaseToggleRef = useRef(null);
  const phaseDropdownRef = useRef(null);

  const typeToggleRef = useRef(null);
  const typeDropdownRef = useRef(null);

  const statusToggleRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const readOutToggleRef = useRef(null);
  const readOutDropdownRef = useRef(null);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleEstimatedReadout = (value) => {
    if (value === "custom") {
      setSelected("custom");
      setShowCalendar(true);
      return;
    }

    setShowCalendar(false);
    handleSelect(value);
    setStagingSelectedReadout([value]);
    setTempReadout([value]);
    setCustomStartDate("");
    setCustomEndDate("");
    setOpen(false);

    fetchCountForSelections({
      ...getPayloadFromStaging(),
      readoutArr: [value],
    });

    setSelected(value);
  };

  const [selectedRange, setSelectedRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  const handleRangeChange = (range) => {
    const formattedRange = {
      startDate: range.startDate.toISOString().split("T")[0],
      endDate: range.endDate.toISOString().split("T")[0],
      key: range.key,
    };
    setCustomStartDate(formattedRange?.startDate);
    setStagingSelectedReadout([]);
    setTempReadout([]);
    fetchCountForSelections({
      ...getPayloadFromStaging(),
      customStart: formattedRange?.startDate,
      customEnd: formattedRange?.endDate,
    });
    setSelectedRange(formattedRange);
  };

  const highlightBold = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "i");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-semibold text-black">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const [treatmentFilter, setTreatmentFilter] = useState([]);
  const [searchInterventional, setSearchInterventional] = useState("");
  function useDebouncedEffect(callback, deps, delay = 400) {
    useEffect(() => {
      const handler = setTimeout(() => callback(), delay);
      return () => clearTimeout(handler);
    }, deps);
  }

  useDebouncedEffect(() => {
    if (searchInterventional !== undefined)
      dispatch(fetchInterventions(searchInterventional)).then((res) => {
        const filteredInterv = res.filter((i) =>
          i.name.toLowerCase().includes(searchInterventional.toLowerCase())
        );
        setTreatmentFilter(filteredInterv);
      });
  }, [searchInterventional]);

  useEffect(() => {
    dispatch(fetchInterventions()).then((res) => {
      const filteredInterv = res.filter((i) =>
        i.name.toLowerCase().includes(searchInterventional.toLowerCase())
      );
      setTreatmentFilter(filteredInterv);
    });
  }, [dispatch]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => {
      const height = el.offsetHeight || 0;
      document.documentElement.style.setProperty(
        "--trials-search-header-height",
        `${height}px`,
      );
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);


  return (
    <div
      ref={headerRef}
      style={{
        left: 68,
        right: 0,
      }}
      data-trials-header="true"
      className="bg-white fixed top-0 z-50 transition-all duration-300"
    >
      <div style={{ padding: "0.8% 1%" }}>
        <div className="mb-2 w-full">
          <h2 className={classes.headerTitle}>Trials</h2>
        </div>
        {/* <FilterBar /> */}
        <div className="responsive-filter-container rounded-md ">
          {/* ✅ Condition Dropdown */}
          <div
            style={{
              display: "flex",
              minWidth: "400px",
            }}
            className="responsive-dropdown shadow-all-sides condition-dropdown border-l rounded-md"
          // onMouseEnter={() => {
          //   handlePopupOpen("condition");
          // }}
          // onMouseLeave={() => {
          //   handlePopupCancel("condition"); // revert on leave
          // }}
          >
            {/*Condition Block*/}
            <div
              onMouseEnter={() => {
                handlePopupOpen("condition");
              }}
              onMouseLeave={() => {
                handlePopupCancel("condition"); // revert on leave
              }}
              style={{
                minWidth: "200px",
              }}
            >
              <div
                className="responsive-dropdown-trigger condition-trigger"
                onClick={() => {
                  if (!isConditionPopupOpen) {
                    handlePopupOpen("condition");
                  }
                }}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>

                  {/* ✅ If nothing applied (not staging), show search */}
                  {selectedConditions.length === 0 ? (
                    <input
                      type="text"
                      value={searchCondition}
                      onChange={(e) => setSearchCondition(e.target.value)}
                      placeholder="Condition"
                      autoFocus={isConditionPopupOpen}
                      className="responsive-search-input"
                    />
                  ) : (
                    <>
                      {/* ✅ Show only applied chips (not staging) */}
                      {selectedConditions
                        .slice(0, 2)
                        .map((condition, index) => (
                          <span key={index} className="filter-chip">
                            <button
                              className="chip-close-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextConditions = selectedConditions.filter(
                                  (item) => item !== condition,
                                );
                                setSelectedConditions(nextConditions);
                                commitAppliedFilters({
                                  conditions: nextConditions,
                                });
                                if (selectedConditions.length === 1) {
                                  setIsSearchingCondition(true);
                                  setSearchCondition("");
                                }
                              }}
                            >
                              ×
                            </button>
                            <span
                              className="truncate"
                              style={{ fontSize: "13px" }}
                            >
                              {condition}
                            </span>
                          </span>
                        ))}

                      {selectedConditions.length > 2 && (
                        <span className="chip-count">
                          +{selectedConditions.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Dropdown arrow */}
                <svg
                  className={`dropdown-arrow transform transition-transform duration-300 ${isConditionPopupOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
              {isConditionPopupOpen && (
                <div
                  className="responsive-popup condition-popup"
                  style={{
                    width: "200px",
                    // width: dropdownWidth,
                    // minWidth: "320px",
                  }}
                >
                  <div className="pr-1 max-h-60 overflow-auto">
                    {conditions
                      .filter((condition) =>
                        condition.name
                          .toLowerCase()
                          .includes(searchCondition.toLowerCase())
                      )
                      .slice(0, showAllConditions ? conditions.length : 5)
                      .map((condition) => {
                        const isSelected = stagingSelectedConditions.includes(
                          condition.name
                        );

                        return (
                          <label
                            key={condition.id}
                            onClick={() =>
                              handleStagingCheckboxChange(
                                condition,
                                "condition"
                              )
                            }
                            style={{
                              marginBottom: "3px",
                            }}
                            className={`responsive-checkbox-label flex items-center cursor-pointer py-1 px-2 rounded 
            ${isSelected ? "bg-blue-100" : "hover:bg-gray-100"}
          `}
                          >
                            <span className="text-gray-500 shrink-0 mr-2">
                              <i className="fa-solid fa-magnifying-glass"></i>
                            </span>

                            {/* Tooltip added here */}

                            <CommonTooltip title={condition.name}>
                              <span
                                className="truncate"
                                style={{
                                  display: "inline-block",
                                  maxWidth: "240px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  verticalAlign: "middle",
                                }}
                              >
                                {highlightBold(condition.name, searchCondition)}
                              </span>
                            </CommonTooltip>

                            {/* {isSelected && (
                              <span className="ml-auto text-blue-600">
                                <i className="fa-solid fa-check"></i>
                              </span>
                            )} */}
                          </label>
                        );
                      })}

                    {/* No match */}
                    {conditions.filter((condition) =>
                      condition.name
                        .toLowerCase()
                        .includes(searchCondition.toLowerCase())
                    ).length === 0 && (
                        <p className="no-results-message text-gray-400">
                          No results found
                        </p>
                      )}
                  </div>

                  {/* <div className="pr-1 max-h-60 overflow-auto">
                    {conditions
                      .filter((condition) =>
                        condition.name
                          .toLowerCase()
                          .includes(searchCondition.toLowerCase())
                      )
                      .slice(0, showAllConditions ? conditions.length : 5)
                      .map((condition) => (
                        <label
                          key={condition.id}
                          className="responsive-checkbox-label"
                        >
                          <span style={{
                            marginRight: "10px"
                          }} className="text-gray-500 shrink-0">
                            <i className="fa-solid fa-magnifying-glass"></i>
                          </span>
                          <input
                            type="checkbox"
                            className="mr-2 accent-green-500"
                            checked={stagingSelectedConditions.includes(
                              condition.name
                            )} // ✅ staging used
                            onChange={() =>
                              handleStagingCheckboxChange(
                                condition,
                                "condition"
                              )
                            }
                          />
                          <span className="truncate">{condition.name}</span>
                        </label>
                      ))}

                    No match
                    {conditions.filter((condition) =>
                      condition.name
                        .toLowerCase()
                        .includes(searchCondition.toLowerCase())
                    ).length === 0 && (
                        <p className="no-results-message text-gray-400">
                          No results found
                        </p>
                      )}
                  </div> */}

                  <hr className="popup-divider" />

                  {/* ✅ Action Buttons */}
                  <div className="popup-actions">
                    <button
                      className="popup-cancel-btn"
                      onClick={() => handlePopupCancel("condition")} // revert to applied
                    >
                      Cancel
                    </button>
                    <button
                      className="popup-apply-btn flex items-center justify-center gap-2"
                      onClick={() => handleApplyFromStaging("condition")} // commit to applied
                      disabled={
                        isCountLoading ||
                        (stagingSelectedConditions.length > 0 &&
                          conditionCount === 0)
                      }
                    >
                      {isCountLoading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          Show {conditionCount > 0 ? conditionCount : ""} Result
                          {conditionCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* {Treatment Block} */}
            <div
              onMouseEnter={() => {
                handlePopupOpen("treatment");
              }}
              onMouseLeave={() => {
                handlePopupCancel("treatment"); // revert on leave
              }}
              style={{
                minWidth: "200px",
              }}
            >
              <div
                style={{
                  borderRadius: "0",
                }}
                className="responsive-dropdown-trigger condition-trigger"
                onClick={() => {
                  if (!isTreatmentPopupOpen) {
                    handlePopupOpen("treatment");
                  }
                }}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>

                  {/* ✅ If nothing applied (not staging), show search */}
                  {selectedInterventional.length === 0 ? (
                    <input
                      type="text"
                      value={searchInterventional}
                      onChange={(e) => setSearchInterventional(e.target.value)}
                      placeholder="Treatment"
                      autoFocus={isTreatmentPopupOpen}
                      className="responsive-search-input"
                    />
                  ) : (
                    <>
                      {/* ✅ Show only applied chips (not staging) */}
                      {selectedInterventional
                        .slice(0, 2)
                        .map((condition, index) => (
                          <span key={index} className="filter-chip">
                            <button
                              className="chip-close-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextTreatment = selectedInterventional.filter(
                                  (item) => item !== condition,
                                );
                                setSelectedInterventional(nextTreatment);
                                commitAppliedFilters({
                                  treatment: nextTreatment,
                                });
                                if (selectedInterventional.length === 1) {
                                  setIsSearchingCondition(true);
                                }
                              }}
                            >
                              ×
                            </button>
                            <span
                              className="truncate"
                              style={{ fontSize: "13px" }}
                            >
                              {condition}
                            </span>
                          </span>
                        ))}

                      {selectedInterventional.length > 2 && (
                        <span className="chip-count">
                          +{selectedInterventional.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Dropdown arrow */}
                <svg
                  className={`dropdown-arrow transform transition-transform duration-300 ${isTreatmentPopupOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {isTreatmentPopupOpen && (
                <div
                  className="responsive-popup condition-popup"
                  style={{
                    width: "200px",
                  }}
                >
                  <div className="pr-1 max-h-60 overflow-auto">
                    {treatmentFilter?.slice(0, 5).map((condition) => {
                      const isSelected = stagingSelectedTreatment.includes(
                        condition.name
                      );
                      return (
                        <label
                          key={condition.id}
                          className={`responsive-checkbox-label ${isSelected ? "bg-blue-100" : "hover:bg-gray-100"}`}
                          onClick={() =>
                            handleStagingCheckboxChange(
                              condition,
                              "treatment"
                            )
                          }
                          style={{
                            marginBottom: "3px",
                          }}
                        >
                          <span className="text-gray-500 shrink-0 mr-2">
                            <i className="fa-solid fa-magnifying-glass"></i>
                          </span>

                          {/* Tooltip added here */}

                          {/* <CommonTooltip title={condition.name}> */}
                          <span
                            className="truncate"
                            style={{
                              display: "inline-block",
                              maxWidth: "240px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              verticalAlign: "middle",
                              textTransform: "capitalize",
                            }}
                          >
                            {highlightBold(condition.name, searchInterventional)}
                          </span>
                          {/* </CommonTooltip> */}
                        </label>
                      )
                    })}

                    {/* No match */}
                    {treatmentFilter.filter((condition) =>
                      condition.name
                        .toLowerCase()
                        .includes(searchInterventional.toLowerCase())
                    ).length === 0 && (
                        <p className="no-results-message text-gray-400">
                          No results found
                        </p>
                      )}
                  </div>

                  <hr className="popup-divider" />

                  {/* ✅ Action Buttons */}
                  <div className="popup-actions">
                    <button
                      className="popup-cancel-btn"
                      onClick={() => handlePopupCancel("treatment")} // revert to applied
                    >
                      Cancel
                    </button>
                    <button
                      className="popup-apply-btn flex items-center justify-center gap-2"
                      onClick={() => handleApplyFromStaging("treatment")} // commit to applied
                      disabled={
                        isCountLoading ||
                        (stagingSelectedConditions.length > 0 &&
                          conditionCount === 0)
                      }
                    >
                      {isCountLoading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          Show {conditionCount > 0 ? conditionCount : ""} Result
                          {conditionCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="responsive-dropdown-group shadow-all-sides -ml-2 cursor-pointer">
            {/* ✅ Phase Dropdown (updated with popup) */}
            <div
              className="responsive-dropdown"
              onMouseEnter={() => {
                handlePopupOpen("phase");
                setIsConditionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsStudyTypeOpen(false);
                setIsTreatmentPopupOpen(false);
              }}
              onMouseLeave={() => {
                handlePopupCancel("phase");
              }}
            >
              <div
                className="responsive-dropdown-trigger middle-trigger"
                ref={phaseToggleRef}
                onClick={() => {
                  // clicking the trigger should *not* toggle selection here; it simply keeps popup open (hover handles open).
                  setIsConditionPopupOpen(false);
                  setIsStudyStatusOpen(false);
                  setIsStudyTypeOpen(false);
                  setIsTreatmentPopupOpen(false);
                }}
              >
                <span>
                  {selectedPhases.length > 0
                    ? selectedPhases[0].text
                    : "Study Phase"}
                </span>
                {selectedPhases?.length > 1 && (
                  <span className="dropdown-badge">
                    +{selectedPhases?.length}
                  </span>
                )}
                <svg
                  className={`dropdown-arrow transform transition-transform duration-300 ${isStudyPhaseOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {isStudyPhaseOpen && (
                <div className="responsive-popup" ref={phaseDropdownRef}>
                  {phasesOptions?.map((phase) => (
                    <label key={phase.id} className="responsive-checkbox-label">
                      <input
                        type="checkbox"
                        className="mr-2 accent-green-500"
                        // NOTE: use stagingSelectedPhases for the immediate UI
                        checked={stagingSelectedPhases.some(
                          (p) => p.value === phase.value
                        )}
                        onChange={() =>
                          handleStagingCheckboxChange(phase, "phase")
                        }
                      />
                      {phase.text}
                      {studyPhaseCount && studyPhaseCount[phase.value] && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({studyPhaseCount[phase.value]})
                        </span>
                      )}
                    </label>
                  ))}

                  <hr className="popup-divider" />
                  <div className="popup-actions">
                    <button
                      className="popup-cancel-btn"
                      onClick={() => handlePopupCancel("phase")}
                    >
                      Cancel
                    </button>
                    <button
                      className="popup-apply-btn flex items-center justify-center gap-2"
                      onClick={() => handleApplyFromStaging("phase")}
                      disabled={
                        isCountLoading ||
                        (stagingSelectedPhases.length > 0 &&
                          conditionCount === 0)
                      }
                    >
                      {isCountLoading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          Show {conditionCount > 0 ? conditionCount : ""} Result
                          {conditionCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Study Type Dropdown */}
            <div
              className="responsive-dropdown"
              onMouseEnter={() => {
                handlePopupOpen("studyType");
                setIsConditionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsStudyPhaseOpen(false);
                setIsTreatmentPopupOpen(false);
                setIsPhasePopupOpen(false);
                setIsReadoutPopupOpen(false);
              }}
              onMouseLeave={() => {
                handlePopupCancel("studyType");
              }}
            >
              <div
                className="responsive-dropdown-trigger middle-trigger"
                ref={typeToggleRef}
                onClick={() => {
                  // clicking should not toggle selection here; hover handles open
                  setIsConditionPopupOpen(false);
                  setIsStudyStatusOpen(false);
                  setIsStudyPhaseOpen(false);
                  setIsPhasePopupOpen(false);
                  setIsReadoutPopupOpen(false);
                  setIsTreatmentPopupOpen(false);
                }}
              >
                <span className="line-clamp-1 word-break">
                  {selectedStudyTypes.length > 0
                    ? selectedStudyTypes[0].text || selectedStudyTypes[0]
                    : "Study Type"}
                </span>
                {selectedStudyTypes.length > 1 && (
                  <span className="dropdown-badge">
                    +{selectedStudyTypes.length}
                  </span>
                )}
                <svg
                  className={`dropdown-arrow transform transition-transform duration-300 ${isStudyTypeOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {isStudyTypeOpen && (
                <div className="responsive-popup" ref={typeDropdownRef}>
                  {studyTypes.map((studyType) => (
                    <div key={studyType.id}>
                      <label className="responsive-checkbox-label">
                        <input
                          type="checkbox"
                          className="mr-2 accent-green-500"
                          checked={stagingSelectedStudyTypes.includes(
                            studyType.text
                          )}
                          onChange={() =>
                            handleStagingCheckboxChange(studyType, "studyType")
                          }
                        />
                        <span className="truncate">{studyType.text}</span>
                        {studyTypeCount && studyTypeCount[studyType.text] && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({studyTypeCount[studyType.text]})
                          </span>
                        )}
                      </label>

                      {/* Children */}
                      {studyType.children && (
                        <div className="nested-options">
                          {studyType.children.map((child) => (
                            <label
                              key={child.id}
                              className="responsive-checkbox-label nested-label"
                            >
                              <input
                                type="checkbox"
                                className="mr-2 accent-green-500"
                                checked={stagingSelectedStudyTypes.includes(
                                  child.text
                                )}
                                onChange={() =>
                                  handleStagingCheckboxChange(
                                    child,
                                    "studyType"
                                  )
                                }
                              />
                              <span className="truncate">{child.text}</span>
                              {studyTypeCount && studyTypeCount[child.text] && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({studyTypeCount[child.text]})
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <hr className="popup-divider" />

                  <div className="popup-actions">
                    <button
                      className="popup-cancel-btn"
                      onClick={() => handlePopupCancel("studyType")}
                    >
                      Cancel
                    </button>
                    <button
                      className="popup-apply-btn flex items-center justify-center gap-2"
                      onClick={() => handleApplyFromStaging("studyType")}
                      disabled={
                        isCountLoading ||
                        (stagingSelectedStudyTypes.length > 0 &&
                          conditionCount === 0)
                      }
                    >
                      {isCountLoading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          Show {conditionCount > 0 ? conditionCount : ""} Result
                          {conditionCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Study Status Dropdown */}
            <div
              className="responsive-dropdown"
              onMouseEnter={() => {
                handlePopupOpen("status");
                setIsStudyTypeOpen(false);
                setIsConditionPopupOpen(false);
                setIsStudyPhaseOpen(false);
                setIsPhasePopupOpen(false);
                setIsReadoutPopupOpen(false);
                setIsTreatmentPopupOpen(false);
              }}
              onMouseLeave={() => {
                handlePopupCancel("status");
              }}
            >
              <div
                className="responsive-dropdown-trigger middle-trigger"
                ref={statusToggleRef}
                onClick={() => {
                  setIsStudyTypeOpen(false);
                  setIsConditionPopupOpen(false);
                  setIsStudyPhaseOpen(false);
                  setIsPhasePopupOpen(false);
                  setIsReadoutPopupOpen(false);
                  setIsTreatmentPopupOpen(false);
                }}
              >
                <span className="line-clamp-1 word-break">
                  {selectedStudyStatus.length > 0
                    ? selectedStudyStatus[0].text || selectedStudyStatus[0]
                    : "Study Status"}
                </span>
                {selectedStudyStatus?.length > 1 && (
                  <span className="dropdown-badge">
                    +{selectedStudyStatus?.length}
                  </span>
                )}
                <svg
                  className={`dropdown-arrow transform transition-transform duration-300 ${isStudyStatusOpen ? "rotate-180" : "rotate-0"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {isStudyStatusOpen && (
                <div className="responsive-popup" ref={statusDropdownRef}>
                  {studyStatus.map((status) => (
                    <div key={status.id}>
                      <label className="responsive-checkbox-label">
                        <input
                          type="checkbox"
                          className="mr-2 accent-green-500"
                          checked={stagingSelectedStudyStatus.includes(
                            status.text
                          )}
                          onChange={() =>
                            handleStagingCheckboxChange(status, "status")
                          }
                        />
                        <span className="truncate">{status.text}</span>
                        {studyStatusCount && studyStatusCount[status.text] && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({studyStatusCount[status.text]})
                          </span>
                        )}
                      </label>

                      {/* Children */}
                      {status.children && (
                        <div className="nested-options">
                          {status.children.map((child) => (
                            <label
                              key={child.id}
                              className="responsive-checkbox-label nested-label"
                            >
                              <input
                                type="checkbox"
                                className="mr-2 accent-green-500"
                                checked={stagingSelectedStudyStatus.includes(
                                  child.text
                                )}
                                onChange={() =>
                                  handleStagingCheckboxChange(child, "status")
                                }
                              />
                              <span className="truncate">{child.text}</span>
                              {studyStatusCount &&
                                studyStatusCount[child.text] && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({studyStatusCount[child.text]})
                                  </span>
                                )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <hr className="popup-divider" />

                  <div className="popup-actions">
                    <button
                      className="popup-cancel-btn"
                      onClick={() => handlePopupCancel("status")}
                    >
                      Cancel
                    </button>
                    <button
                      className="popup-apply-btn flex items-center justify-center gap-2"
                      onClick={() => handleApplyFromStaging("status")}
                      disabled={
                        isCountLoading ||
                        (stagingSelectedStudyStatus.length > 0 &&
                          conditionCount === 0)
                      }
                    >
                      {isCountLoading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          Show {conditionCount > 0 ? conditionCount : ""} Result
                          {conditionCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Readout Window */}
          <div
            className="responsive-dropdown readout-dropdown rounded-md -ml-2 cursor-pointer shadow-right"
            onMouseEnter={() => {
              handlePopupOpen("readout");
              setIsConditionPopupOpen(false);
              setIsStudyStatusOpen(false);
              setIsPhasePopupOpen(false);
              setIsStudyPhaseOpen(false);
              setIsStudyTypeOpen(false);
              setIsTreatmentPopupOpen(false);
            }}
            onMouseLeave={() => {
              handlePopupCancel("readout");
              setOpen(false);
              setIsDateFocused(false);
            }}
          >
            <div
              className="responsive-dropdown-trigger readout-trigger"
              ref={readOutToggleRef}
              onClick={() => {
                setIsConditionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsPhasePopupOpen(false);
                setIsStudyPhaseOpen(false);
                setIsStudyTypeOpen(false);
                setIsTreatmentPopupOpen(false);
              }}
            >
              <span>
                {selectedReadout.length > 0
                  ? selectedReadout[0]
                  : tempReadout.length > 0
                    ? tempReadout[0]
                    : "Estimated Readout"}
              </span>

              {selectedReadout.length > 1 && (
                <div className="dropdown-badge">{selectedReadout.length}</div>
              )}

              <svg
                className={`dropdown-arrow transform transition-transform duration-300 ${isReadoutPopupOpen ? "rotate-180" : "rotate-0"
                  }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
            {isReadoutPopupOpen && (
              <div
                ref={readOutDropdownRef}
                className={`responsive-popup readout-popup transition-all duration-300 ${open || isDateFocused ? "h-478x" : "h-238x"
                  }`}
              >
                <div className="relative w-full">
                  {/* <button
                    onClick={() => setOpen((prev) => !prev)}
                    className="w-full border border-gray-300 bg-white rounded-md px-4 py-2 flex justify-between items-center text-sm"
                  >
                    <span
                      className={
                        stagingSelectedReadout.length
                          ? "text-black"
                          : "text-gray-400"
                      }
                    >
                      {stagingSelectedReadout.length > 0
                        ? stagingSelectedReadout[0]
                        : "Start Date"}
                    </span>
                    <i className="fa-solid fa-chevron-down text-gray-500"></i>
                  </button> */}
                  <RadioGroup
                    value={selected}
                    onChange={(e) => handleEstimatedReadout(e.target.value)}
                  >
                    {monthOptions?.map((opt) => {
                      const isCustom = opt.value === "custom";
                      return (
                        <Box
                          key={opt.value}
                          onClick={() =>
                            isCustom && handleEstimatedReadout("custom")
                          } // ⬅ toggle calendar on custom click
                          sx={{
                            "&:hover": {
                              color: "#2563eb",
                              background: "#dbeafe",
                            },
                            cursor: isCustom ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingLeft: "12px",
                            paddingRight: "8px",
                            py: 0.1,
                            borderRadius: "4px",
                          }}
                        >
                          {/* Label & Radio / No Radio for Custom */}
                          {!isCustom ? (
                            <FormControlLabel
                              value={opt.value}
                              control={
                                <Radio
                                  sx={{
                                    p: 0.5,
                                    "& .MuiSvgIcon-root": { fontSize: 14 },
                                    "& .MuiFormControlLabel-label": {
                                      fontSize: "13px",
                                      fontFamily: "Rubik",
                                    },
                                  }}
                                />
                              }
                              label={opt.label}
                              sx={{
                                fontSize: "13px",
                                fontFamily: "Rubik",
                                color: "rgba(0, 0, 0, 0.6)",
                                "& .MuiFormControlLabel-label": {
                                  fontSize: "13px",
                                  fontFamily: "Rubik",
                                },
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontFamily: "Rubik",
                                fontSize: "13px",
                                color: "rgba(0, 0, 0, 0.6)",
                              }}
                            >
                              {opt.label}
                            </span>
                          )}

                          {isCustom && (
                            <span
                              style={{
                                fontSize: 16,
                                marginRight: 6,
                                transform: showCalendar
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "0.2s",
                              }}
                            >
                              <img src={DownArrow} />
                            </span>
                          )}
                        </Box>
                      );
                    })}
                  </RadioGroup>

                  {selected === "custom" && showCalendar && (
                    <CustomDateRangeCalender
                      value={[
                        {
                          startDate: new Date(selectedRange.startDate),
                          endDate: new Date(selectedRange.endDate),
                          key: "selection",
                        },
                      ]}
                      onChange={handleRangeChange}
                    />
                  )}

                  {open && (
                    <div className="w-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
                      {options.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-4 py-1 hover:bg-gray-100 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="customSelect"
                            value={opt.value}
                            checked={
                              stagingSelectedReadout.length > 0 &&
                              stagingSelectedReadout[0].toLowerCase() ===
                              opt.value.toLowerCase()
                            }
                            onChange={() => {
                              // setStagingSelectedReadout([opt.value]);
                              // setTempReadout([opt.value]);
                              // setCustomStartDate("");
                              // setCustomEndDate("");
                              // setOpen(false);
                              // fetchCountForSelections({
                              //   ...getPayloadFromStaging(),
                              //   readoutArr: [opt.value],
                              // });
                            }}
                          />
                          <span>{opt.label}</span>
                          {readoutCount && readoutCount[opt.value] && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({readoutCount[opt.value]})
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {/* <h3 className="text-left font-semibold">Custom</h3>
                <div className="custom-date-inputs">
                  <input
                    type="date"
                    value={customStartDate}
                    onFocus={() => setIsDateFocused(true)}
                    onBlur={() => setIsDateFocused(false)}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setCustomStartDate(newStart);
                      setStagingSelectedReadout([]);
                      setTempReadout([]);
                      fetchCountForSelections({
                        ...getPayloadFromStaging(),
                        customStart: newStart,
                        customEnd: customEndDate,
                      });
                    }}
                    className="date-input"
                    style={{
                      position: "relative",
                      zIndex: 9999,
                      backgroundColor: "white",
                    }}
                  />

                  <input
                    type="date"
                    value={customEndDate}
                    onFocus={() => setIsDateFocused(true)}
                    onBlur={() => setIsDateFocused(false)}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setCustomEndDate(newEnd);
                      setStagingSelectedReadout([]);
                      setTempReadout([]);
                      fetchCountForSelections({
                        ...getPayloadFromStaging(),
                        customStart: customStartDate,
                        customEnd: newEnd,
                      });
                    }}
                    className="date-input"
                    style={{
                      position: "relative",
                      zIndex: 9999, // ✅ same here
                      backgroundColor: "white",
                    }}
                  />
                </div> */}

                <hr
                  className="popup-divider"
                  style={{
                    transition: "margin-top 0.3s ease-in-out",
                  }}
                />
                <div
                  className="transition-all duration-300"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "1.5rem",
                    gap: " 0.75rem",
                    transition: "margin-top 0.3s ease-in-out",
                  }}
                >
                  <button
                    className="popup-cancel-btn"
                    onClick={() => handlePopupCancel("readout")}
                  >
                    Cancel
                  </button>
                  <button
                    className="popup-apply-btn flex items-center justify-center gap-2"
                    onClick={() => handleApplyFromStaging("readout")}
                    disabled={
                      isCountLoading ||
                      ((stagingSelectedReadout.length > 0 ||
                        customStartDate ||
                        customEndDate) &&
                        conditionCount === 0)
                    }
                  >
                    {isCountLoading ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        Show {conditionCount > 0 ? conditionCount : ""} Result
                        {conditionCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="responsive-action-buttons rounded-md">
            {/* Filter Button */}
            <button
              className="filter-btn   -ml-2 shadow-all-sides"
              onClick={() => {
                setIsFilterOpen(true);

                // setIsReadoutPopupOpen(false)
                // setIsConditionPopupOpen(false);
                // setIsStudyStatusOpen(false);
                // setIsPhasePopupOpen(false);
                // setIsStudyPhaseOpen(false);
                // setIsStudyTypeOpen(false);
              }}
            >
              All Filters
            </button>
            {(selectedConditions?.length > 0 ||
              selectedReadout?.length > 0 ||
              selectedPhases?.length > 0 ||
              selectedStudyStatus?.length > 0 ||
              selectedStudyTypes?.length > 0 ||
              customStartDate?.length > 0 ||
              selectedInterventional?.length > 0 ||
              selectedComparative?.length > 0 ||
              selectedMoaIntervention?.length > 0 ||
              selectedMoaComparator?.length > 0 ||
              selectedComparativeType?.length > 0 ||
              chosen ||
              blindChosen ||
              selectedEndpoints?.length > 0 ||
              selectedLineOfTherapy?.length > 0 ||
              selectedStages?.length > 0 ||
              selectedBiomarker?.length > 0 ||
              selectedCriteria?.length > 0 ||
              selectedBackbone?.length > 0 ||
              enrollmentSlider?.to > 0 ||
              sitesSlider?.to > 0 ||
              selectedLocation?.length > 0 ||
              selectedFacility?.length > 0 ||
              weightSlider?.to > 0 ||
              genderChosen ||
              selectedPerformanceStatus?.length > 0 ||
              selectedSponsors?.length > 0 ||
              selectedleadSponsor?.length > 0 ||
              selectedLeadResearcher?.length > 0 ||
              resultChosen ||
              selectedStudyDocument?.length > 0 ||
              studyStartTo ||
              primaryCompletionTo ||
              selectedNctId?.length > 0 ||
              primaryCompletionFrom ||
              studyStartFrom ||
              customStartDate?.length > 0) && (
                <button className="reset-btn" onClick={handleReset}>
                  Reset
                </button>
              )}
          </div>
        </div>
      </div>
      {isFilterOpen && (
        <FilterAll
          isFilterOpen={isFilterOpen}
          conditions={conditions}
          onFilterClose={() => {
            setIsFilterOpen(false);
            if (conditionCount === 0) {
              handleReset();
            }
          }}
          onFilterChange={onFilterChange}
          setSelectedConditions={setSelectedConditions}
          selectedConditions={selectedConditions}
          selectedPhases={selectedPhases}
          setSelectedPhases={setSelectedPhases}
          selectedStudyTypes={selectedStudyTypes}
          setSelectedStudyTypes={setSelectedStudyTypes}
          selectedStudyStatus={selectedStudyStatus}
          setSelectedStudyStatus={setSelectedStudyStatus}
          selectedReadout={selectedReadout}
          setSelectedReadout={setSelectedReadout}
          setSelectedInterventional={setSelectedInterventional}
          selectedInterventional={selectedInterventional}
          selectedComparative={selectedComparative}
          setSelectedComparative={setSelectedComparative}
          selectedMoaIntervention={selectedMoaIntervention}
          setSelectedMoaIntervention={setSelectedMoaIntervention}
          selectedMoaComparator={selectedMoaComparator}
          setSelectedMoaComparator={setSelectedMoaComparator}
          selectedComparativeType={selectedComparativeType}
          setSelectedComparativeType={setSelectedComparativeType}
          chosen={chosen}
          setChosen={setChosen}
          blindChosen={blindChosen}
          setBlindChosen={setBlindChosen}
          selectedEndpoints={selectedEndpoints}
          setSelectedEndpoints={setSelectedEndpoints}
          selectedLineOfTherapy={selectedLineOfTherapy}
          setSelectedLineOfTherapy={setSelectedLineOfTherapy}
          selectedStages={selectedStages}
          setSelectedStages={setSelectedStages}
          selectedBiomarker={selectedBiomarker}
          setSelectedBiomarker={setSelectedBiomarker}
          selectedCriteria={selectedCriteria}
          setSelectedCriteria={setSelectedCriteria}
          selectedBackbone={selectedBackbone}
          setSelectedBackbone={setSelectedBackbone}
          enrollmentSlider={enrollmentSlider}
          setEnrollmentSlider={setEnrollmentSlider}
          sitesSlider={sitesSlider}
          setSitesSlider={setSitesSlider}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedFacility={selectedFacility}
          setSelectedFacility={setSelectedFacility}
          weightSlider={weightSlider}
          setWeightSlider={setWeightSlider}
          genderChosen={genderChosen}
          setGenderChosen={setGenderChosen}
          selectedPerformanceStatus={selectedPerformanceStatus}
          setSelectedPerformanceStatus={setSelectedPerformanceStatus}
          selectedSponsors={selectedSponsors}
          setSelectedSponsors={setSelectedSponsors}
          selectedleadSponsor={selectedleadSponsor}
          setSelectedleadSponsor={setSelectedleadSponsor}
          selectedLeadResearcher={selectedLeadResearcher}
          setSelectedLeadResearcher={setSelectedLeadResearcher}
          resultChosen={resultChosen}
          setResultChosen={setResultChosen}
          selectedStudyDocument={selectedStudyDocument}
          setSelectedStudyDocument={setSelectedStudyDocument}
          studyStartTo={studyStartTo}
          setStudyStartTo={setStudyStartTo}
          studyStartFrom={studyStartFrom}
          setStudyStartFrom={setStudyStartFrom}
          primaryCompletionTo={primaryCompletionTo}
          setPrimaryCompletionTo={setPrimaryCompletionTo}
          primaryCompletionFrom={primaryCompletionFrom}
          setPrimaryCompletionFrom={setPrimaryCompletionFrom}
          selectedNctId={selectedNctId}
          setSelectedNctId={setSelectedNctId}
          selected={selected}
          setSelected={setSelected}
          selectedRange={selectedRange}
          setSelectedRange={setSelectedRange}
          searchInterventional={searchInterventional}
          setSearchInterventional={setSearchInterventional}
          treatmentFilter={treatmentFilter}
          setTreatmentFilter={setTreatmentFilter}
        />
      )}
      <style jsx>{`
        /* Responsive CSS */
        .responsive-header {
          // margin-left: ${mlValue};
          // width: calc(100% - ${mlValue});
        }

        .responsive-filter-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          align-items: stretch;
        }

        .responsive-dropdown {
          position: relative;
          flex: 1;
          min-width: 120px;
        }

        .condition-dropdown {
          flex: 1;
          min-width: 200px;
        }

        .readout-dropdown {
          flex: 1.2;
          min-width: 160px;
        }

        .responsive-dropdown-group {
          display: flex;
          flex: 3;
          min-width: 300px;
        }

        .responsive-dropdown-group .responsive-dropdown {
          flex: 1;
        }

        .responsive-dropdown-trigger {
          height: 2.75rem;
          padding: 0.5rem;
          background: white;
          // cursor: pointer;
          transition: all 0.3s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-left: none !important;
          // border-right: none !important;

          width: 100%;
          height: 100%;
          position: relative; /* Added for pseudo-element positioning */
        }

        .condition-trigger {
          border-radius: 0.375rem 0 0 0.375rem;
          border-right: none; /* Removed direct border-right */
          /* Add pseudo-element for shortened vertical border */
        }
        .condition-trigger::after {
          content: "";
          position: absolute;
          right: 0;
          top: 20%; /* Start 20% from top - adjust as needed (e.g., 15% for shorter) */
          bottom: 20%; /* End 20% from bottom */
          width: 1px;
          background-color: #d1d5db;
        }

        .middle-trigger {
          border-radius: 0;
          border-right: none; /* Removed direct border-right */
          /* Add pseudo-element for shortened vertical border */
        }
        .middle-trigger::after {
          content: "";
          position: absolute;
          right: 0;
          top: 20%; /* Start 20% from top - adjust as needed */
          bottom: 20%; /* End 20% from bottom */
          width: 1px;
          background-color: #d1d5db;
        }

        .readout-trigger {
          border-radius: 0 0.375rem 0.375rem 0;
        }

        .responsive-search-input {
          width: 100%;
          outline: none;
          color: #374151;
          font-size: 0.875rem;
          background: transparent;
        }

        .filter-chip {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          color: #374151;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chip-close-btn {
          margin-right: 0.25rem;
          font-size: 0.625rem;
          color: #6b7280;
        }

        .chip-close-btn:hover {
          color: #dc2626;
        }

        .chip-count {
          margin-left: 0.5rem;
          background: #dbeafe;
          color: #2563eb;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .dropdown-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          background: rgba(220, 233, 252, 1);
          color: rgba(47, 128, 237, 1);
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .dropdown-arrow {
          width: 1rem;
          height: 1rem;
          transition: transform 0.3s;
        }

        .responsive-popup {
          position: absolute;
          top: 100%;
          // margin-top: 0.25rem;
          z-index: 50;
          text-align: left;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
          animation: fadeIn 0.2s ease-out;
          min-width: 250px;
          width: 100%;
        }

        .condition-popup {
          min-width: 320px;
        }

        .readout-popup {
          right: 0;
          width: 300px;
        }

        .responsive-checkbox-label {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.3s;
          white-space: nowrap;
          padding: 5px;
        }

        .responsive-checkbox-label:hover {
          color: #2563eb;
          background: #dbeafe;
        }

        .popup-apply-btn {
          padding: 0.375rem 0.75rem;
          background: #2666be;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .popup-apply-btn:hover:not(:disabled) {
          background: #1e5499;
        }

        .popup-apply-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
          /* Blur effect like DeepSeek */
          filter: blur(0.3px);
          transform: scale(0.98);
        }

        .popup-apply-btn:disabled:hover {
          background: #9ca3af;
          transform: scale(0.98);
        }

        .nested-options {
          margin-left: 1.5rem;
        }

        .nested-label {
          font-size: 0.75rem;
        }

        .no-results-message {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
          text-align: center;
          padding: 0.5rem 0;
        }

        .popup-divider {
          margin-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
          width: 100%;
          position: absolute;
          left: 0;
        }

        .popup-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
          gap: 0.75rem;
        }

        .popup-cancel-btn {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0.375rem;
          transition: all 0.3s;
        }

        .popup-cancel-btn:hover {
          color: #374151;
        }

        .popup-apply-btn {
          padding: 0.375rem 0.75rem;
          background: #2666be;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .popup-apply-btn:hover {
          background: #374151;
        }

        .custom-date-inputs {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .date-input {
          border: 2px solid #d1d5db;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          width: 50%;
          color: #6b7280;
        }

        .responsive-action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-left: 0.75rem;
        }

        .filter-btn {
          background: white;
          font-size: 0.875rem;
          padding: 0.5rem;
          width: 5.625rem;
          height: 2.75rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2666be;
          border: 1px solid #2666be;
          font-weight: 600;
          transition: all 0.3s;
        }

        .filter-btn:hover {
          background: #dbeafe;
          color: #0d3161;
          border: 1px solid #0d3161;
        }

        .reset-btn {
          width: 2.5rem;
          height: 2.75rem;
          padding: 0.5rem;
          margin-left: 0.5rem;
          border-radius: 0.5rem;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .reset-btn:hover {
          color: #374151;
        }

        /* Media Queries for Responsive Design */
        @media (max-width: 1200px) {
          .responsive-dropdown-group {
            flex: 4;
          }

          .condition-dropdown {
            flex: 2.5;
          }
        }

        @media (max-width: 992px) {
          .responsive-filter-container {
            flex-direction: column;
          }

          .responsive-dropdown,
          .condition-dropdown,
          .readout-dropdown,
          .responsive-dropdown-group {
            min-width: 100%;
            flex: 1;
          }

          .responsive-dropdown-group {
            flex-direction: column;
          }

          .condition-trigger,
          .middle-trigger,
          .readout-trigger {
            border-radius: 0.375rem;
            margin-bottom: 0.5rem;
          }

          .responsive-action-buttons {
            margin-left: 0;
            justify-content: center;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          // .responsive-header {
          //   margin-left: ${collapsed ? "6rem" : "13rem"};
          //   width: calc(100% - ${collapsed ? "6rem" : "13rem"});
          // }

          .responsive-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90vw;
            max-width: 400px;
          }

          .readout-popup {
            right: auto;
            width: 90vw;
            max-width: 400px;
          }

          .condition-popup {
            min-width: unset;
            width: 90vw;
            max-width: 400px;
          }
        }

        @media (max-width: 576px) {
          // .responsive-header {
          //   margin-left: 0;
          //   width: 100%;
          // }

          .custom-date-inputs {
            flex-direction: column;
          }

          .date-input {
            width: 100%;
          }

          .popup-actions {
            flex-direction: column;
          }

          .responsive-action-buttons {
            flex-direction: column;
          }

          .filter-btn,
          .reset-btn {
            width: 100%;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
export default Header;
