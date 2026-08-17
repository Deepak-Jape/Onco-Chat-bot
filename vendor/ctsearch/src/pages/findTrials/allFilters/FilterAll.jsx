import { useState } from "react";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons"; // cross icon
import { useSelector, useDispatch } from "react-redux";
import {
  fetchConditions,
  fetchCount,
  fetchInterventions,
  fetchComparativeTreatment,
  fetchLocation,
  fetchFacility,
  fetchLeadSponsers,
  fetchLeadResercher,
  fetchBiomarker,
  fetchResponseCriteria,
  fetchBackbone,
  fetchNctId,
  fetchMoaIntervention,
  fetchMoaComparator,
} from "../../../redux/actions/searchAction";
import map from "../../../assets/map-pin-line.png";
import clockIcon from "../../../assets/clock.png";
import { useCallback } from "react";
import {
  AllFilterComparatorType,
  AllFilterLineofTherapy,
  AllFilterPrimaryOutcomes,
  AllFilterRandomization,
  AllFilterStagesList,
  monthOptions,
  phasesOptions,
} from "../../../utils/helpers/helper";
import { Box, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import CustomDateRangeCalender from "../../../common/CustomDateRangeCalendar";
import { DownArrow } from "../../../assets";
import { headerStyles } from "../../trialsHeader/trialsSubHeader/style";
import { useDebouncedSearch } from "../../../common/useDebounceSearch";
import AutoCompleteLimit from "../../../common/AutoCompleteLimit";

// import clockIcon from "../../assets/clock.png"
const FilterAll = ({
  isFilterOpen,
  onFilterClose,
  collapsed,
  onFilterChange,
  selectedConditions,
  setSelectedConditions,
  selectedPhases,
  setSelectedPhases,
  selectedStudyTypes,
  setSelectedStudyTypes,
  setSelectedStudyStatus,
  selectedStudyStatus,
  selectedReadout,
  setSelectedReadout,
  setSelectedInterventional,
  selectedInterventional,
  selectedComparative,
  setSelectedComparative,
  selectedMoaIntervention,
  setSelectedMoaIntervention,
  selectedMoaComparator,
  setSelectedMoaComparator,
  selectedComparativeType,
  setSelectedComparativeType,
  chosen,
  setChosen,
  blindChosen,
  setBlindChosen,
  selectedEndpoints,
  setSelectedEndpoints,
  selectedLineOfTherapy,
  setSelectedLineOfTherapy,
  selectedStages,
  setSelectedStages,
  selectedBiomarker,
  setSelectedBiomarker,
  selectedCriteria,
  setSelectedCriteria,
  selectedBackbone,
  setSelectedBackbone,
  enrollmentSlider,
  setEnrollmentSlider,
  sitesSlider,
  setSitesSlider,
  selectedLocation,
  setSelectedLocation,
  selectedFacility,
  setSelectedFacility,
  weightSlider,
  setWeightSlider,
  genderChosen,
  setGenderChosen,
  selectedPerformanceStatus,
  setSelectedPerformanceStatus,
  selectedSponsors,
  setSelectedSponsors,
  selectedleadSponsor,
  setSelectedleadSponsor,
  selectedLeadResearcher,
  setSelectedLeadResearcher,
  resultChosen,
  setResultChosen,
  selectedStudyDocument,
  setSelectedStudyDocument,
  studyStartTo,
  setStudyStartTo,
  studyStartFrom,
  setStudyStartFrom,
  primaryCompletionTo,
  setPrimaryCompletionTo,
  primaryCompletionFrom,
  setPrimaryCompletionFrom,
  selectedNctId,
  setSelectedNctId,
  selected,
  setSelected,
  selectedRange,
  setSelectedRange,
  searchInterventional,
  setSearchInterventional,
  setTreatmentFilter,
  treatmentFilter,
}) => {
  const dispatch = useDispatch();
  const classes = headerStyles();
  const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);

    const debouncedCallback = useCallback(
      (...args) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
      [callback, delay]
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return debouncedCallback;
  };

  //conditions
  const conditionState = useSelector((state) => state.conditionData);

  const { conditions } = conditionState;

  const [isConditionPopupOpen, setIsConditionPopupOpen] = useState(false);
  const [showAllConditions, setShowAllConditions] = useState(false);
  // const [selectedConditions, setSelectedConditions] = useState([]);
  const [searchCondition, setSearchCondition] = useState("");
  const [selectedConditionss, setSelectedConditionss] = useState([]);
  //interventionals

  const interventionsState = useSelector(
    (state) => state.conditionData.interventions
  );
  const [isIntervantionPopupOpen, setIsIntervantionPopupOpen] = useState(false);
  // const [searchInterventional, setSearchInterventional] = useState("");
  const [showAllInterventional, setShowAllInterventional] = useState(false);
  // const [selectedInterventional, setSelectedInterventional] = useState([]);
  // const [chosen, setChosen] = useState("");
  // const [resultChosen, setResultChosen] = useState("");

  // const [blindChosen, setBlindChosen] = useState("");

  //studyStatus
  const [isStudyStatusOpen, setIsStudyStatusOpen] = useState(false);
  const [isPhasePopupOpen, setIsPhasePopupOpen] = useState(false);
  const [showAllStudyStatus, setShowAllStudyStatus] = useState(false);
  // const [selectedStudyStatus, setSelectedStudyStatus] = useState([]);

  // States for dates
  // const [studyStartFrom, setStudyStartFrom] = useState("");
  // const [studyStartTo, setStudyStartTo] = useState("");

  // States for Primary Completion dates
  // const [primaryCompletionFrom, setPrimaryCompletionFrom] = useState("");
  // const [primaryCompletionTo, setPrimaryCompletionTo] = useState("");

  //compatarative
  const comparativeState = useSelector(
    (state) => state.conditionData.comparativeTreatment
  );
  const [isComparativePopupOpen, setIsComparativePopupOpen] = useState(false);
  const [searchComparative, setSearchComparative] = useState("");
  const [showAllComparative, setShowAllComparative] = useState(false);
  // const [selectedComparative, setSelectedComparative] = useState([]);
  // const [selectedComparativeType, setSelectedComparativeType] = useState([]);

  //studyPhase
  const [isStudyPhaseOpen, setIsStudyPhaseOpen] = useState(false);
  // const [selectedPhases, setSelectedPhases] = useState([]);

  //StudyType
  const [isStudyTypeOpen, setIsStudyTypeOpen] = useState(false);
  // const [selectedStudyTypes, setSelectedStudyTypes] = useState([]);
  const [open, setOpen] = useState(false);

  //locations
  const locationState = useSelector((state) => state.conditionData.locations);
  const [isLocationPopupOpen, setIsLocationPopupOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [showAllLocation, setShowAllLocation] = useState(false);
  // const [selectedLocation, setSelectedLocation] = useState([]);

  //facility
  const facilityState = useSelector((state) => state.conditionData.facility);
  const [isFacilityPopupOpen, setIsFacilityPopupOpen] = useState(false);
  const [searchFacility, setSearchFacility] = useState("");
  const [showAllFacility, setShowAllFacility] = useState(false);
  // const [selectedFacility, setSelectedFacility] = useState([]);

  //Lead Sponsor
  const leadSponsorState = useSelector(
    (state) => state.conditionData.leadSponsers
  );
  const [isleadSponsorPopupOpen, setIsleadSponsorPopupOpen] = useState(false);
  const [searchleadSponsor, setSearchleadSponsor] = useState("");
  const [showAllleadSponsor, setShowAllleadSponsor] = useState(false);
  // const [selectedleadSponsor, setSelectedleadSponsor] = useState([]);

  //Lead Researcher
  const leadResearcherState = useSelector(
    (state) => state.conditionData.leadResearcher
  );
  const [isLeadResearcherPopupOpen, setIsLeadResearcherPopupOpen] =
    useState(false);
  const [searchLeadResearcher, setSearchLeadResearcher] = useState("");
  const [showAllLeadResearcher, setShowAllLeadResearcher] = useState(false);
  // const [selectedLeadResearcher, setSelectedLeadResearcher] = useState([]);

  //Biomarker
  const biomarkerState = useSelector((state) => state.conditionData.biomarker);
  const [isBiomarkerPopupOpen, setIsBiomarkerPopupOpen] = useState(false);
  const [searchBiomarker, setSearchBiomarker] = useState("");
  const [showAllBiomarker, setShowAllBiomarker] = useState(false);
  // const [selectedBiomarker, setSelectedBiomarker] = useState([]);

  //ResponseCriteria
  const responseCriteriaState = useSelector(
    (state) => state.conditionData.responseCriteria
  );
  const [isCriteriaPopupOpen, setIsCriteriaPopupOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState("");
  const [showAllCriteria, setShowAllCriteria] = useState(false);
  // const [selectedCriteria, setSelectedCriteria] = useState([]);

  //CombinationBackbone
  const backboneState = useSelector((state) => state.conditionData.backbone);
  const [isBackbonePopupOpen, setIsBackbonePopupOpen] = useState(false);
  const [searchBackbone, setSearchBackbone] = useState("");
  const [showAllBackbone, setShowAllBackbone] = useState(false);
  // const [selectedBackbone, setSelectedBackbone] = useState([]);

  //NctId
  const nctIdState = useSelector((state) => state.conditionData.nctId);
  const [isNctIdPopupOpen, setIsNctIdPopupOpen] = useState(false);
  const [searchNctId, setSearchNctId] = useState("");
  const [showAllNctId, setShowAllNctId] = useState(false);
  // const [selectedNctId, setSelectedNctId] = useState([]);

  //MoaIntervention
  const moaInterventionState = useSelector(
    (state) => state.conditionData.moaIntervention
  );
  const [isMoaInterventionPopupOpen, setIsMoaInterventionPopupOpen] =
    useState(false);
  const [searchMoaIntervention, setSearchMoaIntervention] = useState("");
  const [showAllMoaIntervention, setShowAllMoaIntervention] = useState(false);
  // const [selectedMoaIntervention, setSelectedMoaIntervention] = useState([]);

  //MoaComparator
  const moaComparatorState = useSelector(
    (state) => state.conditionData.moaComparator
  );
  const [isMoaComparatorPopupOpen, setIsMoaComparatorPopupOpen] =
    useState(false);
  const [searchMoaComparator, setSearchMoaComparator] = useState("");
  const [showAllMoaComparator, setShowAllMoaComparator] = useState(false);
  // const [selectedMoaComparator, setSelectedMoaComparator] = useState([]);

  // States
  const [firstPostedFrom, setFirstPostedFrom] = useState("");
  const [firstPostedTo, setFirstPostedTo] = useState("");
  const [resultFirstPostedFrom, setResultFirstPostedFrom] = useState("");
  const [resultFirstPostedTo, setResultFirstPostedTo] = useState("");

  const { conditionCount } = useSelector((state) => state.conditionData);

  const [rangeValues, setRangeValues] = useState([0, 500]); // [from, to]
  // const [enrollmentSlider, setEnrollmentSlider] = useState({ from: 0, to: 0 });
  // const [weightSlider, setWeightSlider] = useState({ from: 0, to: 0 }); // new slider for Weight
  const [selectedAgeRange, setSelectedAgeRange] = useState([]);

  const debouncedEnrollmentChange = useDebounce((from, to) => {
    handleCheckboxChange([from, to], "planned_enrollment");
  }, 500);

  // ✅ NEW: Enrollment slider handler
  const handleEnrollmentChange = (from, to) => {
    setEnrollmentSlider({ from, to });
    debouncedEnrollmentChange(from, to);
  };

  // ✅ Sites Debounce (NEW)
  const debouncedSitesChange = useDebounce((from, to) => {
    handleCheckboxChange([from, to], "sites_count");
  }, 500);

  const handleSitesChange = (from, to) => {
    setSitesSlider({ from, to });
    debouncedSitesChange(from, to);
  };

  // ✅ Age Debounce
  const debouncedAgeChange = useDebounce((from, to) => {
    handleCheckboxChange([from, to], "age");
  }, 500);

  const handleAgeChange = (from, to) => {
    setWeightSlider({ from, to });
    debouncedAgeChange(from, to);
  };

  // useEffect(() => {
  //   dispatch(fetchConditions());
  //   dispatch(fetchCount());
  //   dispatch(fetchInterventions());
  //   dispatch(fetchComparativeTreatment());
  //   dispatch(fetchLocation());
  //   dispatch(fetchFacility());
  //   dispatch(fetchLeadSponsers());
  //   dispatch(fetchLeadResercher());
  //   dispatch(fetchBiomarker());
  //   dispatch(fetchResponseCriteria());
  //   dispatch(fetchBackbone());
  //   dispatch(fetchNctId());
  //   dispatch(fetchMoaIntervention());
  //   dispatch(fetchMoaComparator());
  // }, [dispatch]);

  // useEffect(() => {
  //   const delayDebounce = setTimeout(() => {
  //     dispatch(fetchConditions(searchCondition));
  //     dispatch(fetchInterventions(searchInterventional));
  //     dispatch(fetchComparativeTreatment(searchComparative));
  //     dispatch(fetchLocation(searchLocation));
  //     dispatch(fetchFacility(searchFacility));
  //     dispatch(fetchLeadSponsers(searchleadSponsor));
  //     dispatch(fetchLeadResercher(searchLeadResearcher));
  //     dispatch(fetchBiomarker(searchBiomarker));
  //     dispatch(fetchResponseCriteria(searchCriteria));
  //     dispatch(fetchBackbone(searchBackbone));
  //     dispatch(fetchNctId(searchNctId))
  //     dispatch(fetchMoaIntervention(searchMoaIntervention));
  //     dispatch(fetchMoaComparator(searchMoaComparator));
  //   }, 500);

  //   return () => clearTimeout(delayDebounce);
  // }, [searchCondition, searchInterventional, searchComparative, searchLocation, searchFacility, searchleadSponsor, searchLeadResearcher, searchBiomarker, searchCriteria, searchBackbone, searchNctId, searchMoaIntervention, searchMoaIntervention, dispatch]);

  // 🔹 Debounce utility hook
  function useDebouncedEffect(callback, deps, delay = 400) {
    useEffect(() => {
      const handler = setTimeout(() => callback(), delay);
      return () => clearTimeout(handler);
    }, deps);
  }

  // 🔹 Initial data fetch (first load)
  // useEffect(() => {
  //   dispatch(fetchConditions());
  //   dispatch(fetchCount());
  //   dispatch(fetchInterventions());
  //   dispatch(fetchComparativeTreatment());
  //   dispatch(fetchLocation());
  //   dispatch(fetchFacility());
  //   dispatch(fetchLeadSponsers());
  //   dispatch(fetchLeadResercher());
  //   dispatch(fetchBiomarker());
  //   dispatch(fetchResponseCriteria());
  //   dispatch(fetchBackbone());
  //   dispatch(fetchNctId());
  //   dispatch(fetchMoaIntervention());
  //   dispatch(fetchMoaComparator());
  // }, [dispatch]);

  // 🔹 Debounced search effects

  // useDebouncedEffect(() => {
  //   if (searchCondition !== undefined)
  //     dispatch(fetchConditions(searchCondition));
  // }, [searchCondition]);

  // useDebouncedEffect(() => {
  //   if (searchInterventional !== undefined)
  //     dispatch(fetchInterventions(searchInterventional));
  // }, [searchInterventional]);

  // useDebouncedEffect(() => {
  //   if (searchComparative !== undefined)
  //     dispatch(fetchComparativeTreatment(searchComparative));
  // }, [searchComparative]);

  // useDebouncedEffect(() => {
  //   if (searchLocation !== undefined) dispatch(fetchLocation(searchLocation));
  // }, [searchLocation]);

  // useDebouncedEffect(() => {
  //   if (searchFacility !== undefined) dispatch(fetchFacility(searchFacility));
  // }, [searchFacility]);

  // useDebouncedEffect(() => {
  //   if (searchleadSponsor !== undefined)
  //     dispatch(fetchLeadSponsers(searchleadSponsor));
  // }, [searchleadSponsor]);

  // useDebouncedEffect(() => {
  //   if (searchLeadResearcher !== undefined)
  //     dispatch(fetchLeadResercher(searchLeadResearcher));
  // }, [searchLeadResearcher]);

  // useDebouncedEffect(() => {
  //   if (searchBiomarker !== undefined)
  //     dispatch(fetchBiomarker(searchBiomarker));
  // }, [searchBiomarker]);

  // useDebouncedEffect(() => {
  //   if (searchCriteria !== undefined)
  //     dispatch(fetchResponseCriteria(searchCriteria));
  // }, [searchCriteria]);

  // useDebouncedEffect(() => {
  //   if (searchBackbone !== undefined) dispatch(fetchBackbone(searchBackbone));
  // }, [searchBackbone]);

  // useDebouncedEffect(() => {
  //   if (searchNctId !== undefined) dispatch(fetchNctId(searchNctId));
  // }, [searchNctId]);

  // useDebouncedEffect(() => {
  //   if (searchMoaIntervention !== undefined)
  //     dispatch(fetchMoaIntervention(searchMoaIntervention));
  // }, [searchMoaIntervention]);

  // useDebouncedEffect(() => {
  //   if (searchMoaComparator !== undefined)
  //     dispatch(fetchMoaComparator(searchMoaComparator));
  // }, [searchMoaComparator]);






  // 🔹 Call all APIs ONLY once on first load
  useEffect(() => {
    dispatch(fetchConditions());
    dispatch(fetchCount());
    dispatch(fetchInterventions());
    dispatch(fetchComparativeTreatment());
    dispatch(fetchLocation());
    dispatch(fetchFacility());
    dispatch(fetchLeadSponsers());
    dispatch(fetchLeadResercher());
    dispatch(fetchBiomarker());
    dispatch(fetchResponseCriteria());
    dispatch(fetchBackbone());
    dispatch(fetchNctId());
    dispatch(fetchMoaIntervention());
    dispatch(fetchMoaComparator());
  }, []);  // 👈 no dependencies means call ONLY once



  useDebouncedSearch(searchCondition, () => {
    dispatch(fetchConditions(searchCondition));
  });

  useDebouncedSearch(searchInterventional, () => {
    dispatch(fetchInterventions(searchInterventional));
  });

  useDebouncedSearch(searchComparative, () => {
    dispatch(fetchComparativeTreatment(searchComparative));
  });

  useDebouncedSearch(searchLocation, () => {
    dispatch(fetchLocation(searchLocation));
  });

  useDebouncedSearch(searchFacility, () => {
    dispatch(fetchFacility(searchFacility));
  });

  useDebouncedSearch(searchleadSponsor, () => {
    dispatch(fetchLeadSponsers(searchleadSponsor));
  });

  useDebouncedSearch(searchLeadResearcher, () => {
    dispatch(fetchLeadResercher(searchLeadResearcher));
  });

  useDebouncedSearch(searchBiomarker, () => {
    dispatch(fetchBiomarker(searchBiomarker));
  });

  useDebouncedSearch(searchCriteria, () => {
    dispatch(fetchResponseCriteria(searchCriteria));
  });

  useDebouncedSearch(searchBackbone, () => {
    dispatch(fetchBackbone(searchBackbone));
  });

  useDebouncedSearch(searchNctId, () => {
    dispatch(fetchNctId(searchNctId));
  });

  useDebouncedSearch(searchMoaIntervention, () => {
    dispatch(fetchMoaIntervention(searchMoaIntervention));
  });

  useDebouncedSearch(searchMoaComparator, () => {
    dispatch(fetchMoaComparator(searchMoaComparator));
  });





































  const [selectedIndex, setSelectedIndex] = useState(0);

  const toggleCondition = (condition) => {
    setSelectedConditionss((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  // performance status

  const performanceStatusList = [
    [
      "ECOG 0",
      "ECOG 1",
      "ECOG 2",
      "ECOG 3+",
      "Karnofsky >=90",
      "Karnofsky 70-89",
      "Karnofsky <70",
    ],
  ];

  const [selectedPerformanceIndex, setSelectedPerformanceIndex] = useState(0);

  const togglePerformanceStatus = (status) => {
    setSelectedPerformanceStatus(
      (prev) =>
        prev.includes(status)
          ? prev.filter((s) => s !== status) // agar selected hai to hata do
          : [...prev, status] // otherwise add kar do
    );
  };
  // comparator type

  const comparatorTypeList = [
    ["Standard care", "Active", "Placebo", "Single-arm"],
  ];
  const [selectedComparatorTypes, setSelectedComparatorTypes] = useState([]);
  const [selectedComparatorIndex, setSelectedComparatorIndex] = useState(0);



  const [selectedStageIndex, sIndex] = useState(0);

  const toggleStage = (stage) => {
    ss(
      (prev) =>
        prev.includes(stage)
          ? prev.filter((s) => s !== stage) // agar selected hai to hata do
          : [...prev, stage] // otherwise add kar do
    );
  };

  const choices = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "any", label: "Any" },
  ];

  const [studyStatusChosen, setstudyStatusChosen] = useState("");

  const studyDocument = [
    { value: "Study Protocols", label: "Study Protocols" },
    {
      value: "Statistical Analysis Plans (SAPs)",
      label: "Statistical Analysis Plans (SAPs)",
    },
    {
      value: "Informed Consent Forms (ICFs)",
      label: "Informed Consent Forms (ICFs)",
    },
  ];
  const [blindedChoice, setBlindedChoice] = useState("yes");

  const choice = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "any", label: "Any" },
  ];

  const blindChoices = [
    { value: "none", label: "None" },
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "any", label: "Any" },
  ];

  // intervantion
  const [interventionOpen, setInterventionOpen] = useState(false);
  const interventionMenuRef = useRef(null);

  const handleInterventionClickOutside = (e) => {
    if (
      interventionMenuRef.current &&
      !interventionMenuRef.current.contains(e.target)
    ) {
      setInterventionOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleInterventionClickOutside);
    return () =>
      document.removeEventListener("click", handleInterventionClickOutside);
  }, []);

  // comparative Treatment
  const [comparativeOpen, setComparativeOpen] = useState(false);
  const comparativeMenuRef = useRef(null);

  const handleComparativeClickOutside = (e) => {
    if (
      comparativeMenuRef.current &&
      !comparativeMenuRef.current.contains(e.target)
    ) {
      setComparativeOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleComparativeClickOutside);
    return () =>
      document.removeEventListener("click", handleComparativeClickOutside);
  }, []);

  // Response criteria
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseSelected, setResponseSelected] = useState([]);
  const [responseSearch, setResponseSearch] = useState("");
  const responseMenuRef = useRef(null);

  const handleResponseClickOutside = (e) => {
    if (
      responseMenuRef.current &&
      !responseMenuRef.current.contains(e.target)
    ) {
      setResponseOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleResponseClickOutside);
    return () =>
      document.removeEventListener("click", handleResponseClickOutside);
  }, []);

  // Combination Backbone
  const [backboneOpen, setBackboneOpen] = useState(false);
  const [backboneSelected, setBackboneSelected] = useState([]);
  const [backboneSearch, setBackboneSearch] = useState("");
  const backboneMenuRef = useRef(null);

  const handleBackboneClickOutside = (e) => {
    if (
      backboneMenuRef.current &&
      !backboneMenuRef.current.contains(e.target)
    ) {
      setBackboneOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleBackboneClickOutside);
    return () =>
      document.removeEventListener("click", handleBackboneClickOutside);
  }, []);

  const endpointList = [
    [
      "Survival / Time-To-Event",
      "Response",
      "Functional / PRO",
      "Safety",
      "PK/PD",
      "Diagnostic Accuracy",
    ],
  ];

  // population radio button
  // const [genderChosen, setGenderChosen] = useState("");

  const genderChoice = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Any" },
  ];

  // const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  // const [selectedLineOfTherapy, setSelectedLineOfTherapy] = useState([]);
  // const [selectedStages, setSelectedStages] = useState([]);
  // const [selectedPerformanceStatus, setSelectedPerformanceStatus] = useState(
  //   []
  // );

  // state variables with unique names
  // const [sitesSlider, setSitesSlider] = useState({ from: 0, to: 0 });

  // new change handler
  const onSliderChange = (setter) => (e) => {
    setter(Number(e.target.value));
  };

  // position calculator
  const getThumbPosition = (value, min, max) => {
    const percent = ((value - min) / (max - min)) * 100;
    return percent;
  };

  // Sponsor and transparency

  const sponsorList = [
    [
      "NIH",
      "Industry",
      "Network",
      "US Government",
      "Non-US Government",
      "Individual",
      "Others",
    ],
  ];

  // const [selectedSponsors, setSelectedSponsors] = useState([]);
  const [selectedSponsorIndex, setSelectedSponsorIndex] = useState(0);
  // const [selectedStudyDocument, setSelectedStudyDocument] = useState([]);

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

  // ✅ Study Type options (matching the image)
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

  const readoutOptions = [
    { label: "This Month", value: "This Month" },
    { label: "Next 6 Months", value: "Next 6 month" },
    { label: "Next 12 Months", value: "Next 12 month" },
    { label: "Next 18 Months", value: "Next 18 month" },
    { label: "Next 24 Months", value: "24 month" },
  ];

  const [sliderValues, setSliderValues] = useState({});
  // Helper function to calculate start_date and end_date
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

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    if (customStartDate || customEndDate) {
      sendPayloadWithReadout({
        ...(customStartDate ? { custom_start_date: customStartDate } : {}),
        ...(customEndDate ? { custom_end_date: customEndDate } : {}),
      });
    }
  }, [customStartDate, customEndDate]);

  const sendPayloadWithReadout = (readoutOverride = null) => {
    const readoutObj = {};

    const processReadout = (val) => {
      if (!val) return null;

      // Handle "This Month"
      if (val === "This Month") return { bulk_date: calculateDateRange(0) };

      // Handle "6 month", "12 month", etc.
      const match = val.match(/(\d+)/);
      if (match) {
        const months = parseInt(match[0], 10);
        return { bulk_date: calculateDateRange(months) };
      }

      // Default fallback
      return { bulk_date: val };
    };
    // 🔸 Priority 1: Custom Date
    if (customStartDate || customEndDate) {
      readoutObj.custom_start_date = customStartDate || undefined;
      readoutObj.custom_end_date = customEndDate || undefined;
    }
    // 🔸 Priority 2: Preset (only if no custom date)
    else if (readoutOverride && readoutOverride.bulk_date) {
      Object.assign(readoutObj, processReadout(readoutOverride.bulk_date));
    } else if (selectedReadout && selectedReadout.length > 0) {
      Object.assign(readoutObj, processReadout(selectedReadout[0]));
    }
    const payload = {
      ...(selectedConditions.length > 0 && { condition: selectedConditions }),
      ...(selectedInterventional.length > 0 && {
        intervention: selectedInterventional,
      }),
      ...(selectedComparative?.length > 0 && {
        comparative: selectedComparative,
      }),
      ...(selectedLocation.length > 0 && { location: selectedLocation }),
      ...(selectedFacility.length > 0 && { facility: selectedFacility }),
      ...(selectedMoaIntervention.length > 0 && {
        moa: selectedMoaIntervention,
      }),
      ...(selectedMoaComparator.length > 0 && {
        moa_comparator: selectedMoaComparator,
      }),
      ...(selectedNctId.length > 0 && { nct_id: selectedNctId }),
      ...(selectedBackbone.length > 0 && { backbone: selectedBackbone }),
      ...(selectedCriteria.length > 0 && {
        response_criteria: selectedCriteria,
      }),
      ...(selectedBiomarker.length > 0 && { biomarker: selectedBiomarker }),
      ...(selectedleadSponsor.length > 0 && {
        lead_sponsor: selectedleadSponsor,
      }),
      ...(selectedLeadResearcher.length > 0 && {
        lead_researcher: selectedLeadResearcher,
      }),
      ...(selectedComparativeType?.length > 0 && {
        comparator_type: selectedComparativeType,
      }),
      ...(selectedPhases.length > 0 && {
        study_phase: selectedPhases.map((p) => p.value),
      }),
      ...(selectedStudyStatus?.length > 0 && {
        study_status: selectedStudyStatus,
      }),
      ...(selectedStudyTypes.length > 0 && { study_type: selectedStudyTypes }),
      ...(selectedEndpoints.length > 0 && { endpoints: selectedEndpoints }),
      ...(selectedLineOfTherapy.length > 0 && {
        line_therapy: selectedLineOfTherapy,
      }),
      ...(selectedStages.length > 0 && { stages: selectedStages }),
      ...(selectedPerformanceStatus.length > 0 && {
        performance_status: selectedPerformanceStatus,
      }),
      ...(selectedSponsors.length > 0 && { sponsers_type: selectedSponsors }),
      ...(selectedStudyDocument.length > 0 && {
        study_document: selectedStudyDocument,
      }),
      ...(chosen && { randomized: chosen }),
      ...(blindChosen && { blinding: blindChosen }),
      ...(genderChosen && { sex: genderChosen }),
      ...(resultChosen && { result_posted: resultChosen }),
      ...(studyStatusChosen && { study_chosen: studyStatusChosen }),
      ...sliderValues,
      ...(Object.keys(readoutObj).length > 0 && { readout: readoutObj }),
    };
    setIsCountLoading(true);
    dispatch(fetchCount(payload)).finally(() => {
      setIsCountLoading(false);
    });
  };

  const handleCheckboxChange = (item, type, commitAppliedState = false) => {
    let updatedConditions = [...selectedConditions];
    let updatedInterventional = [...selectedInterventional];
    let updatedAgeRange = [...selectedAgeRange];
    let updatedComparative = [...selectedComparative];
    let updatedComparativeType = [...selectedComparativeType];
    let updatedLocation = [...selectedLocation];
    let updatedPhases = [...selectedPhases];
    let updatedStatus = [...selectedStudyStatus];
    let updatedTypes = [...selectedStudyTypes];
    let updatedReadout = [...selectedReadout];
    let updatedEndpoints = [...selectedEndpoints];
    let updatedLineOfTherapy = [...selectedLineOfTherapy];
    let updatedSelectedStages = [...selectedStages];
    let updatedSelectedPerformance = [...selectedPerformanceStatus];
    let updatedSelectedSponsors = [...selectedSponsors];
    let updatedSelectedstudyDocument = [...selectedStudyDocument];
    let updatedFacility = [...selectedFacility];
    let updatedMaoIntervantion = [...selectedMoaIntervention];
    let updatedMoaComparator = [...selectedMoaComparator];
    let updatedNctId = [...selectedNctId];
    let updatedBackbone = [...selectedBackbone];
    let updatedResponseCriteria = [...selectedCriteria];
    let updatedBiomarker = [...selectedBiomarker];
    let updatedleadSponsor = [...selectedleadSponsor];
    let updatedleadResearcher = [...selectedLeadResearcher];
    let updatedRandomized = chosen;
    let updatedBlinding = blindChosen;
    let updatedSex = genderChosen;
    let updatedResultPosted = resultChosen;
    let updatedStudyChosen = studyStatusChosen;
    let updatedSliders = { ...sliderValues };
    const getItemValue = (obj) => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj.name || obj.text || obj.value || "";
    };

    switch (type) {
      case "interventional":
        const interventionalName = getItemValue(item);
        updatedInterventional = updatedInterventional.includes(
          interventionalName
        )
          ? updatedInterventional.filter((c) => c !== interventionalName)
          : [...updatedInterventional, interventionalName];
        setSelectedInterventional(updatedInterventional);
        break;

      case "comparative":
        const comparativeName = getItemValue(item);
        updatedComparative = updatedComparative.includes(comparativeName)
          ? updatedComparative.filter((c) => c !== comparativeName)
          : [...updatedComparative, comparativeName];
        setSelectedComparative(updatedComparative);
        break;

      case "location":
        const LocationName = getItemValue(item);
        updatedLocation = updatedLocation.includes(LocationName)
          ? updatedLocation.filter((c) => c !== LocationName)
          : [...updatedLocation, LocationName];
        setSelectedLocation(updatedLocation);
        break;

      case "facility":
        const facilityName = getItemValue(item);
        updatedFacility = updatedFacility.includes(facilityName)
          ? updatedFacility.filter((f) => f !== facilityName)
          : [...updatedFacility, facilityName];
        setSelectedFacility(updatedFacility);
        break;

      case "moaIntervantion":
        const moaIntervantionName = getItemValue(item);
        updatedMaoIntervantion = updatedMaoIntervantion.includes(
          moaIntervantionName
        )
          ? updatedMaoIntervantion.filter((f) => f !== moaIntervantionName)
          : [...updatedMaoIntervantion, moaIntervantionName];
        setSelectedMoaIntervention(updatedMaoIntervantion);
        break;

      case "moaComparator":
        const moaComparatorName = getItemValue(item);
        updatedMoaComparator = updatedMoaComparator.includes(moaComparatorName)
          ? updatedMoaComparator.filter((f) => f !== moaComparatorName)
          : [...updatedMoaComparator, moaComparatorName];
        setSelectedMoaComparator(updatedMoaComparator); // ✅ Correct setter
        break;

      case "planned_enrollment":
        updatedSliders.planned_enrollment = item;
        setSliderValues(updatedSliders);
        break;

      case "nctId":
        const nctIdName = getItemValue(item);
        updatedNctId = updatedNctId.includes(nctIdName)
          ? updatedNctId.filter((f) => f !== nctIdName)
          : [...updatedNctId, nctIdName];
        setSelectedNctId(updatedNctId);
        break;

      case "responseCriteria":
        const responseCriteriaName = getItemValue(item);
        updatedResponseCriteria = updatedResponseCriteria.includes(
          responseCriteriaName
        )
          ? updatedResponseCriteria.filter((f) => f !== responseCriteriaName)
          : [...updatedResponseCriteria, responseCriteriaName];
        setSelectedCriteria(updatedResponseCriteria);
        break;

      case "backbone":
        const backboneName = getItemValue(item);
        updatedBackbone = updatedBackbone.includes(backboneName)
          ? updatedBackbone.filter((f) => f !== backboneName)
          : [...updatedBackbone, backboneName];
        setSelectedBackbone(updatedBackbone);
        break;

      case "biomarker":
        const biomarkerName = getItemValue(item);
        updatedBiomarker = updatedBiomarker.includes(biomarkerName)
          ? updatedBiomarker.filter((f) => f !== biomarkerName)
          : [...updatedBiomarker, biomarkerName];
        setSelectedBiomarker(updatedBiomarker);
        break;

      case "comparativeType":
        const compTypeName = getItemValue(item);
        updatedComparativeType = updatedComparativeType.includes(compTypeName)
          ? updatedComparativeType.filter((c) => c !== compTypeName)
          : [...updatedComparativeType, compTypeName];
        setSelectedComparativeType(updatedComparativeType);
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

        // Is it one of the preset dropdown labels?
        const isPreset = readoutOptions.some((opt) => opt.label === readoutVal);

        if (isPreset) {
          setSelectedReadout([readoutVal]);
          setCustomStartDate("");
          setCustomEndDate("");
          setOpen(false);
        } else {
          setSelectedReadout((prev) => {
            const newArr = prev.includes(readoutVal)
              ? prev.filter((r) => r !== readoutVal)
              : [...prev, readoutVal];
            return newArr;
          });
        }
        break;
      }

      case "endpoint":
        const endpointVal = getItemValue(item);
        updatedEndpoints = updatedEndpoints.includes(endpointVal)
          ? updatedEndpoints.filter((e) => e !== endpointVal)
          : [...updatedEndpoints, endpointVal];
        setSelectedEndpoints(updatedEndpoints);
        break;

      case "lineTherapy":
        const lineVal = getItemValue(item);
        updatedLineOfTherapy = updatedLineOfTherapy.includes(lineVal)
          ? updatedLineOfTherapy.filter((e) => e !== lineVal)
          : [...updatedLineOfTherapy, lineVal];
        setSelectedLineOfTherapy(updatedLineOfTherapy);
        break;

      case "stage":
        const stageVal = getItemValue(item);
        updatedSelectedStages = updatedSelectedStages.includes(stageVal)
          ? updatedSelectedStages.filter((e) => e !== stageVal)
          : [...updatedSelectedStages, stageVal];
        setSelectedStages(updatedSelectedStages);
        break;

      case "performanceStatus":
        const perfVal = getItemValue(item);
        updatedSelectedPerformance = updatedSelectedPerformance.includes(
          perfVal
        )
          ? updatedSelectedPerformance.filter((e) => e !== perfVal)
          : [...updatedSelectedPerformance, perfVal];
        setSelectedPerformanceStatus(updatedSelectedPerformance);
        break;

      case "sponserType":
        const sponsorVal = getItemValue(item);
        updatedSelectedSponsors = updatedSelectedSponsors.includes(sponsorVal)
          ? updatedSelectedSponsors.filter((e) => e !== sponsorVal)
          : [...updatedSelectedSponsors, sponsorVal];
        setSelectedSponsors(updatedSelectedSponsors);
        break;

      case "studyDocument":
        const docVal = getItemValue(item);
        updatedSelectedstudyDocument = updatedSelectedstudyDocument.includes(
          docVal
        )
          ? updatedSelectedstudyDocument.filter((e) => e !== docVal)
          : [...updatedSelectedstudyDocument, docVal];
        setSelectedStudyDocument(updatedSelectedstudyDocument);
        break;

      case "randomized":
        updatedRandomized = getItemValue(item);
        setChosen(updatedRandomized);
        break;

      case "blinding":
        updatedBlinding = getItemValue(item);
        setBlindChosen(updatedBlinding);
        break;

      case "sex":
        updatedSex = getItemValue(item);
        setGenderChosen(updatedSex);
        break;

      case "resultPosted":
        updatedResultPosted = getItemValue(item);
        setResultChosen(updatedResultPosted);
        break;

      case "leadSponsor":
        const leadSponsorName = getItemValue(item);
        updatedleadSponsor = updatedleadSponsor.includes(leadSponsorName)
          ? updatedleadSponsor.filter((f) => f !== leadSponsorName)
          : [...updatedleadSponsor, leadSponsorName];
        setSelectedleadSponsor(updatedleadSponsor);
        break;

      case "leadResearcher":
        const leadResearcherName = getItemValue(item);
        updatedleadResearcher = updatedleadResearcher.includes(
          leadResearcherName
        )
          ? updatedleadResearcher.filter((f) => f !== leadResearcherName)
          : [...updatedleadResearcher, leadResearcherName];
        setSelectedLeadResearcher(updatedleadResearcher);
        break;

      case "studyChosen":
        updatedStudyChosen = getItemValue(item);
        setstudyStatusChosen(updatedStudyChosen);
        break;

      default:
        updatedSliders[type] = item;
        setSliderValues(updatedSliders);
        break;
    }
    let readoutPayload = {};
    if (updatedReadout.length > 0) {
      const val = updatedReadout[0];
      if (val === "This Month") {
        readoutPayload.bulk_date = calculateDateRange(0);
      } else if (
        ["6 month", "12 month", "18 month", "24 month"].includes(val)
      ) {
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
      ...(updatedInterventional.length > 0 && {
        treatment: updatedInterventional,
      }),
      ...(updatedComparative.length > 0 && { comparative: updatedComparative }),
      ...(updatedLocation.length > 0 && { location: updatedLocation }),
      ...(updatedFacility.length > 0 && { facility: updatedFacility }),
      ...(updatedMaoIntervantion.length > 0 && {
        moa: updatedMaoIntervantion,
      }),
      ...(updatedMoaComparator.length > 0 && {
        moa_comparator: updatedMoaComparator,
      }),
      ...(updatedNctId.length > 0 && { nct_id: updatedNctId }),
      ...(updatedResponseCriteria.length > 0 && {
        response_criteria: updatedResponseCriteria,
      }),
      ...(updatedBiomarker.length > 0 && { biomarker: updatedBiomarker }),
      ...(updatedBackbone.length > 0 && { backbone: updatedBackbone }),
      ...(updatedleadSponsor.length > 0 && {
        lead_sponsor: updatedleadSponsor,
      }),
      ...(updatedleadResearcher.length > 0 && {
        lead_researcher: updatedleadResearcher,
      }),
      ...(updatedComparativeType.length > 0 && {
        comparator_type: updatedComparativeType,
      }),
      ...(updatedPhases.length > 0 && {
        study_phase: updatedPhases.map((p) => p.value),
      }),
      ...(updatedStatus.length > 0 && { study_status: updatedStatus }),
      ...(updatedTypes.length > 0 && { study_type: updatedTypes }),
      ...(Object.keys(readoutPayload).length > 0 && {
        readout: readoutPayload,
      }),
      ...(updatedEndpoints.length > 0 && { endpoints: updatedEndpoints }),
      ...(updatedLineOfTherapy.length > 0 && {
        line_therapy: updatedLineOfTherapy,
      }),
      ...(updatedSelectedStages.length > 0 && {
        stages: updatedSelectedStages,
      }),
      ...(updatedSelectedPerformance.length > 0 && {
        performance_status: updatedSelectedPerformance,
      }),
      ...(updatedSelectedSponsors.length > 0 && {
        sponsers_type: updatedSelectedSponsors,
      }),
      ...(updatedSelectedstudyDocument.length > 0 && {
        study_document: updatedSelectedstudyDocument,
      }),
      ...(updatedSex && { sex: updatedSex }),
      ...(updatedResultPosted && { result_posted: updatedResultPosted }),
      ...(updatedStudyChosen && { study_chosen: updatedStudyChosen }),
      ...(updatedBlinding && { blinding: updatedBlinding }),
      ...(updatedRandomized && { randomized: updatedRandomized }),
      ...updatedSliders,
    };
    setIsCountLoading(true); // start loader before API
    dispatch(fetchCount(payload)).finally(() => {
      setIsCountLoading(false); // stop loader after API completes
    });

    if (commitAppliedState) {
      const filteredFilters = buildAppliedFilters(payload);
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
    }
  };

  const buildAppliedFilters = (payload = {}) =>
    Object.fromEntries(
      Object.entries(payload).filter(([_, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== "",
      ),
    );
  const [isCountLoading, setIsCountLoading] = useState(false);
  const tabs = document.querySelectorAll("#tabs .tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // sabko inactive karo
      tabs.forEach((btn) => {
        btn.classList.remove("bg-white", "text-black", "font-bold");
        btn.classList.add("text-white", "border", "border-white");
      });

      // jispe click hua usko active banao
      tab.classList.add("bg-white", "text-black", "font-bold");
      tab.classList.remove("text-white", "border", "border-white");
    });
  });

  const [isReadoutPopupOpen, setIsReadoutPopupOpen] = useState(false);
  // const [selectedReadout, setSelectedReadout] = useState([]);
  const [activeTab, setActiveTab] = useState("presets");
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedBand, setSelectedBand] = useState("");
  const [enrollmentValue, setEnrollmentValue] = useState(0);
  const [sitesValue, setSitesValue] = useState(0);
  // const [search, setSearch] = useState("");
  // const [selected, setSelected] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [ageValue, setAgeValue] = useState(0);

  const handleSliderChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleSliderChange2 = (setter) => (e) => {
    setter(e.target.value);
  };

  useEffect(() => {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach((slider) => {
      slider.style.background = `linear-gradient(to right, #9b59b6 ${(slider.value / 200) * 100
        }%, #e0e0e0 ${(slider.value / 200) * 100}%, #e0e0e0 100%)`;
    });
  }, [enrollmentValue, sitesValue]);

  useEffect(() => {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach((slider) => {
      slider.style.background = `linear-gradient(
      to right, 
      #9b59b6 ${(slider.value / 200) * 100}%, 
      #e0e0e0 ${(slider.value / 200) * 100}%, 
      #e0e0e0 100%
    )`;
    });
  }, [enrollmentValue, sitesValue, ageValue]); // ✅ ageValue added here

  const [selectedOption, setSelectedOption] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const option = [
    { value: "option1", label: "Next 6 Months" },
    { value: "option2", label: "Next 12 Months" },
    { value: "option3", label: "Next 18 Months" },
    { value: "option4", label: "Next 24 Months" },
  ];

  const handleOptionChange = (value) => {
    setSelectedOption(value);
    setIsOpen(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const collaboratorRef = useRef(null); // pehle wala
  const sponsorRef = useRef(null);

  // Sponsor Lead dropdown state
  const [isSponsorLeadOpen, setIsSponsorLeadOpen] = useState(false);
  const [selectedSponsorLead, setSelectedSponsorLead] = useState([]);
  const [searchLead, setSearchLead] = useState("");


  const [selectedlineConditionss, setSelectedlineConditionss] = useState([]);
  const togglelineCondition = (lineCondition) => {
    setSelectedlineConditionss((prev) =>
      prev.includes(lineCondition)
        ? prev.filter((c) => c !== lineCondition)
        : [...prev, lineCondition]
    );
  };

  // Key Exclusions
  const conditionOptions = [["Brain Mets", "Autoimmune", "Steroid Dependence"]];
  const [selectedCustomConditions, setSelectedCustomConditions] = useState([]);

  const toggleCustomCondition = (condition) => {
    setSelectedCustomConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };
  // Performance Status
  const [selectedStatusOption, setSelectedStatusOption] = useState("");
  const statusOptions = ["Option 1", "Option 2", "Option 3"];

  // Endpoint Creadibility
  const [selectedEndOptions, setSelectedEndOptions] = useState([]);

  const toggleEndOption = (option) => {
    setSelectedEndOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };
  const endpointOptions = ["Accepted", "Weak", "Any"];

  // third tab

  const [immunologyOpen, setImmunologyOpen] = useState(false);
  const [immunologySelected, setImmunologySelected] = useState([]);
  const immunologyMenuRef = useRef(null);

  const immunologyOptions = [
    "Cytokine signaling",
    "Complement cascade",
    "Toll-like receptor",
    "JAK-STAT",
    "Interferon response",
  ];

  const toggleImmunologyOption = (value) => {
    setImmunologySelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleImmunologyClickOutside = (e) => {
    if (
      immunologyMenuRef.current &&
      !immunologyMenuRef.current.contains(e.target)
    ) {
      setImmunologyOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleImmunologyClickOutside);
    return () =>
      document.removeEventListener("click", handleImmunologyClickOutside);
  }, []);

  // Autuimmune Diseases Subtype

  const [autoImmuneOpen, setAutoImmuneOpen] = useState(false);
  const [autoImmuneSelected, setAutoImmuneSelected] = useState([]);
  const [autoImmuneSearch, setAutoImmuneSearch] = useState("");
  const autoImmuneMenuRef = useRef(null);

  const autoImmuneOptions = [
    "Cytokine signaling",
    "Complement cascade",
    "Toll-like receptor",
    "JAK-STAT",
    "Interferon response",
    "NF-κB pathway",
    "Apoptosis signaling",
  ];

  const toggleAutoImmuneOption = (value) => {
    setAutoImmuneSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleAutoImmuneClickOutside = (e) => {
    if (
      autoImmuneMenuRef.current &&
      !autoImmuneMenuRef.current.contains(e.target)
    ) {
      setAutoImmuneOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleAutoImmuneClickOutside);
    return () =>
      document.removeEventListener("click", handleAutoImmuneClickOutside);
  }, []);

  const filteredAutoImmuneOptions = autoImmuneOptions.filter((opt) =>
    opt.toLowerCase().includes(autoImmuneSearch.toLowerCase())
  );

  // Patient Stratification
  const [autoImmunePatientOpen, setAutoImmunePatientOpen] = useState(false);
  const [autoImmunePatientSelected, setAutoImmunePatientSelected] = useState(
    []
  );
  const [autoImmunePatientSearch, setAutoImmunePatientSearch] = useState("");
  const autoImmunePatientMenuRef = useRef(null);

  const autoImmunePatientOptions = [
    "Age group",
    "Genetic markers",
    "Disease stage",
    "Biomarker levels",
    "Response to therapy",
    "Comorbidity profile",
  ];

  const toggleAutoImmunePatientOption = (value) => {
    setAutoImmunePatientSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleAutoImmunePatientClickOutside = (e) => {
    if (
      autoImmunePatientMenuRef.current &&
      !autoImmunePatientMenuRef.current.contains(e.target)
    ) {
      setAutoImmunePatientOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleAutoImmunePatientClickOutside);
    return () =>
      document.removeEventListener(
        "click",
        handleAutoImmunePatientClickOutside
      );
  }, []);

  const filteredAutoImmunePatientOptions = autoImmunePatientOptions.filter(
    (opt) => opt.toLowerCase().includes(autoImmunePatientSearch.toLowerCase())
  );

  const [heightSlider, setHeightSlider] = useState(50);
  const [heightMin, setHeightMin] = useState(0);
  const [heightMax, setHeightMax] = useState(0);

  // Handlers
  const onSliderChangeHeight = (e) => setHeightSlider(Number(e.target.value));
  const getThumbPositionHeight = (value, min, max) =>
    ((value - min) / (max - min)) * 100;

  const onMinChange = (e) => setHeightMin(Number(e.target.value));
  const onMaxChange = (e) => setHeightMax(Number(e.target.value));

  const [orphanSelectedOption, setOrphanSelectedOption] = useState("");
  const [orphanDropdownOpen, setOrphanDropdownOpen] = useState(false);
  const orphanDropdownRef = useRef(null);

  const orphanOptionsList = ["Option 1", "Option 2", "Option 3"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        orphanDropdownRef.current &&
        !orphanDropdownRef.current.contains(event.target)
      ) {
        setOrphanDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Natural History comparators
  const [orphanNaturalHistory, setOrphanNaturalHistory] = useState("");
  const [openSurrogate, setOpenSurrogate] = useState(false);
  const [selectedSurrogate, setSelectedSurrogate] = useState([]);
  const [searchSurrogate, setSearchSurrogate] = useState("");
  const dropdownRefSurrogate = useRef(null);
  const optionsSurrogate = ["Option 1", "Option 2", "Option 3", "Option 4"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRefSurrogate.current &&
        !dropdownRefSurrogate.current.contains(event.target)
      ) {
        setOpenSurrogate(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOptionSurrogate = (optionSurrogate) => {
    if (selectedSurrogate.includes(optionSurrogate)) {
      setSelectedSurrogate(
        selectedSurrogate.filter((o) => o !== optionSurrogate)
      );
    } else {
      setSelectedSurrogate([...selectedSurrogate, optionSurrogate]);
    }
  };

  const filteredOptionsSurrogate = optionsSurrogate.filter((o) =>
    o.toLowerCase().includes(searchSurrogate.toLowerCase())
  );

  // Surrogate Endpoints
  const [openSurrogateEndpoints, setOpenSurrogateEndpoints] = useState(false);
  const [selectedSurrogateEndpoints, setSelectedSurrogateEndpoints] = useState(
    []
  );
  const [searchSurrogateEndpoints, setSearchSurrogateEndpoints] = useState("");
  const dropdownRefSurrogateEndpoints = useRef(null);
  const optionsSurrogateEndpoints = [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Option 5",
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRefSurrogateEndpoints.current &&
        !dropdownRefSurrogateEndpoints.current.contains(event.target)
      ) {
        setOpenSurrogateEndpoints(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOptionSurrogateEndpoints = (option) => {
    if (selectedSurrogateEndpoints.includes(option)) {
      setSelectedSurrogateEndpoints(
        selectedSurrogateEndpoints.filter((o) => o !== option)
      );
    } else {
      setSelectedSurrogateEndpoints([...selectedSurrogateEndpoints, option]);
    }
  };

  const handleShowResults = (filterType) => {
    let readoutPayload = {};
    if (selectedReadout && selectedReadout.length > 0) {
      const val = selectedReadout[0].toLowerCase().trim();
      if (val === "this month") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = today;

        readoutPayload.bulk_date = {
          start_date: start.toISOString().split("T")[0],
          end_date: end.toISOString().split("T")[0],
        };
      } else if (val.includes("month")) {
        const months = parseInt(val.match(/\d+/)?.[0] || 0, 10);
        if (months > 0) {
          const { start_date, end_date } = calculateDateRange(months);
          readoutPayload.bulk_date = { start_date, end_date };
        }
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
    const filters = {
      condition: selectedConditions,
      study_phase:
        selectedPhases?.length > 0 ? selectedPhases.map((p) => p.value) : [],
      study_status: selectedStudyStatus,
      study_type: selectedStudyTypes,
      readout:
        Object.keys(readoutPayload).length > 0 ? readoutPayload : undefined,
      treatment: selectedInterventional,
      comparative: selectedComparative,
      comparator_type: selectedComparativeType,
      location: selectedLocation,
      endpoints: selectedEndpoints,
      line_therapy: selectedLineOfTherapy,
      stages: selectedStages,
      performance_status: selectedPerformanceStatus,
      sponsers_type: selectedSponsors,
      study_document: selectedStudyDocument,
      facility: selectedFacility,
      moa: selectedMoaIntervention,
      moa_comparator: selectedMoaComparator,
      nct_id: selectedNctId,
      backbone: selectedBackbone,
      response_criteria: selectedCriteria,
      biomarker: selectedBiomarker,
      lead_sponsor: selectedleadSponsor,
      lead_researcher: selectedLeadResearcher,
      randomized: chosen,
      blinding: blindChosen,
      sex: genderChosen,
      result_posted: resultChosen,
      study_chosen: studyStatusChosen,
      ...(sliderValues?.planned_enrollment && {
        planned_enrollment: sliderValues.planned_enrollment,
      }),
      ...(sliderValues?.sites_count && {
        sites_count: sliderValues.sites_count,
      }),
      ...(sliderValues?.age && { age: sliderValues.age }),
    };
    const filteredFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== ""
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
    onFilterClose();
    if (filterType === "condition") setIsConditionPopupOpen(false);
    if (filterType === "phase") setIsStudyPhaseOpen(false);
    if (filterType === "status") setIsStudyStatusOpen(false);
    if (filterType === "studyType") setIsStudyTypeOpen(false);
    if (filterType === "readout") setIsReadoutPopupOpen(false);
  };

  const [dropdownWidth, setDropdownWidth] = useState("250px");
  const [filteredConditions, setFilteredConditions] = useState([]);
  const [filteredInterventions, setFilteredInterventions] = useState([]);
  const [isSearchingCondition, setIsSearchingCondition] = useState(false);

  // const [treatmentFilter, setTreatmentFilter] = useState([]);

  useEffect(() => {
    if (!dropdownRef.current) return;

    // --- Filter both dropdown lists ---
    const filteredCond = conditions.filter((c) =>
      c.name.toLowerCase().includes(searchCondition.toLowerCase())
    );
    const filteredInterv = interventionsState.filter((i) =>
      i.name.toLowerCase().includes(searchInterventional.toLowerCase())
    );
    setFilteredConditions(filteredCond);
    setFilteredInterventions(filteredInterv);
    setTreatmentFilter(filteredInterv);

    // --- Find longest visible text among both dropdowns ---
    const allVisibleItems = [...filteredCond, ...filteredInterv];
    if (allVisibleItems.length > 0) {
      const longestName = allVisibleItems.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;

      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchCondition, searchInterventional, conditions, interventionsState]);

  const toggleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks inside the dropdown OR the toggle button
      if (
        dropdownRef.current?.contains(event.target) ||
        toggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsConditionPopupOpen(false);
      // setIsIntervantionPopupOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const interventionDropdownRef = useRef(null);
  const interventionToggleRef = useRef(null);

  // Filtering + dynamic width
  useEffect(() => {
    const filtered = interventionsState.filter((i) =>
      i.name.toLowerCase().includes(searchInterventional.toLowerCase())
    );
    setFilteredInterventions(filtered);
    setTreatmentFilter(filtered);

    const allVisible = filtered;
    if (allVisible.length > 0) {
      const longestName = allVisible.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("510px");
    }
  }, [searchInterventional, interventionsState]);

  // Click-outside using mousedown (keeps same behavior as your condition code)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If click is inside dropdown OR toggle, ignore
      if (
        interventionDropdownRef.current?.contains(event.target) ||
        interventionToggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsIntervantionPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [filteredComparative, setFilteredComparative] = useState([]);

  const comparatorDropdownRef = useRef(null);
  const comparatorToggleRef = useRef(null);

  useEffect(() => {
    const filtered = comparativeState.filter((item) =>
      item.name.toLowerCase().includes(searchComparative.toLowerCase())
    );
    setFilteredComparative(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("510px");
    }
  }, [searchComparative, comparativeState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        comparatorDropdownRef.current?.contains(event.target) ||
        comparatorToggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsComparativePopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [filteredMoaIntervention, setFilteredMoaIntervention] = useState([]);

  const moaInterventionDropdownRef = useRef(null);
  const moaInterventionToggleRef = useRef(null);

  useEffect(() => {
    const filtered = moaInterventionState.filter((item) =>
      item.name.toLowerCase().includes(searchMoaIntervention.toLowerCase())
    );
    setFilteredMoaIntervention(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchMoaIntervention, moaInterventionState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moaInterventionDropdownRef.current?.contains(event.target) ||
        moaInterventionToggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsMoaInterventionPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [filteredMoaComparator, setFilteredMoaComparator] = useState([]);
  const moaComparatorDropdownRef = useRef(null);
  const moaComparatorToggleRef = useRef(null);

  useEffect(() => {
    const filtered = moaComparatorState.filter((item) =>
      item.name.toLowerCase().includes(searchMoaComparator.toLowerCase())
    );
    setFilteredMoaComparator(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchMoaComparator, moaComparatorState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moaComparatorDropdownRef.current?.contains(event.target) ||
        moaComparatorToggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsMoaComparatorPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [filteredBiomarker, setFilteredBiomarker] = useState([]);
  const biomarkerDropdownRef = useRef(null);
  const biomarkerToggleRef = useRef(null);

  useEffect(() => {
    const filtered = biomarkerState.filter((item) =>
      item.name.toLowerCase().includes(searchBiomarker.toLowerCase())
    );
    setFilteredBiomarker(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("510px");
    }
  }, [searchBiomarker, biomarkerState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        biomarkerDropdownRef.current?.contains(event.target) ||
        biomarkerToggleRef.current?.contains(event.target)
      )
        return;
      setIsBiomarkerPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [filteredCriteria, setFilteredCriteria] = useState([]);
  const criteriaDropdownRef = useRef(null);
  const criteriaToggleRef = useRef(null);

  useEffect(() => {
    const filtered = responseCriteriaState.filter((item) =>
      item.name.toLowerCase().includes(searchCriteria.toLowerCase())
    );
    setFilteredCriteria(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("510px");
    }
  }, [searchCriteria, responseCriteriaState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        criteriaDropdownRef.current?.contains(event.target) ||
        criteriaToggleRef.current?.contains(event.target)
      )
        return;
      setIsCriteriaPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // combination backbone
  const [filteredBackbone, setFilteredBackbone] = useState([]);
  const backboneDropdownRef = useRef(null);
  const backboneToggleRef = useRef(null);

  useEffect(() => {
    const filtered = backboneState.filter((item) =>
      item.name.toLowerCase().includes(searchBackbone.toLowerCase())
    );
    setFilteredBackbone(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("510px");
    }
  }, [searchBackbone, backboneState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        backboneDropdownRef.current?.contains(event.target) ||
        backboneToggleRef.current?.contains(event.target)
      )
        return;
      setIsBackbonePopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Location
  const [filteredLocation, setFilteredLocation] = useState([]);
  const locationDropdownRef = useRef(null);
  const locationToggleRef = useRef(null);

  useEffect(() => {
    const filtered = locationState.filter((item) =>
      item.name.toLowerCase().includes(searchLocation.toLowerCase())
    );
    setFilteredLocation(filtered);
    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchLocation, locationState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locationDropdownRef.current?.contains(event.target) ||
        locationToggleRef.current?.contains(event.target)
      )
        return;
      setIsLocationPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hooks for Facility
  const [filteredFacility, setFilteredFacility] = useState([]);
  const facilityDropdownRef = useRef(null);
  const facilityToggleRef = useRef(null);

  useEffect(() => {
    const filtered = facilityState.filter((item) =>
      item.name.toLowerCase().includes(searchFacility.toLowerCase())
    );
    setFilteredFacility(filtered);
    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchFacility, facilityState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        facilityDropdownRef.current?.contains(event.target) ||
        facilityToggleRef.current?.contains(event.target)
      )
        return;
      setIsFacilityPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // lead sponsor
  const [filteredLeadSponsor, setFilteredLeadSponsor] = useState([]);
  const [searchLeadSponsor, setSearchLeadSponsor] = useState("");
  const leadSponsorDropdownRef = useRef(null);
  const leadSponsorToggleRef = useRef(null);
  useEffect(() => {
    const filtered = leadSponsorState.filter((item) =>
      item.name.toLowerCase().includes(searchLeadSponsor.toLowerCase())
    );
    setFilteredLeadSponsor(filtered);
    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchLeadSponsor, leadSponsorState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        leadSponsorDropdownRef.current?.contains(event.target) ||
        leadSponsorToggleRef.current?.contains(event.target)
      )
        return;

      setIsleadSponsorPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // lead reachercher
  const [filteredLeadResearcher, setFilteredLeadResearcher] = useState([]);
  const leadResearcherDropdownRef = useRef(null);
  const leadResearcherToggleRef = useRef(null);

  useEffect(() => {
    const filtered = leadResearcherState.filter((item) =>
      item.name.toLowerCase().includes(searchLeadResearcher.toLowerCase())
    );
    setFilteredLeadResearcher(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchLeadResearcher, leadResearcherState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        leadResearcherDropdownRef.current?.contains(event.target) ||
        leadResearcherToggleRef.current?.contains(event.target)
      )
        return;

      setIsLeadResearcherPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // nctid
  const [filteredNctId, setFilteredNctId] = useState([]);
  const nctIdDropdownRef = useRef(null);
  const nctIdToggleRef = useRef(null);

  // --- Filtering + dynamic width ---
  useEffect(() => {
    const filtered = nctIdState.filter((item) =>
      item.name.toLowerCase().includes(searchNctId.toLowerCase())
    );
    setFilteredNctId(filtered);

    if (filtered.length > 0) {
      const longestName = filtered.reduce(
        (a, b) => (a.name.length > b.name.length ? a : b),
        { name: "" }
      ).name;
      const width = Math.min(Math.max(longestName.length * 8 + 100, 250), 540);
      setDropdownWidth(`${width}px`);
    } else {
      setDropdownWidth("250px");
    }
  }, [searchNctId, nctIdState]);

  // --- Click Outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        nctIdDropdownRef.current?.contains(event.target) ||
        nctIdToggleRef.current?.contains(event.target)
      )
        return;
      setIsNctIdPopupOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const phaseToggleRef = useRef(null);
  const phaseDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        phaseDropdownRef.current?.contains(event.target) ||
        phaseToggleRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsStudyPhaseOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

    const [isCountLoading, setIsCountLoading] = useState(false);
  }, []);

  const typeToggleRef = useRef(null);
  const typeDropdownRef = useRef(null);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        typeToggleRef.current?.contains(event.target) ||
        typeDropdownRef.current?.contains(event.target)
      ) {
        return; // Click inside → do nothing
      }
      setIsStudyTypeOpen(false); // Click outside → close
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusToggleRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusToggleRef.current?.contains(event.target) ||
        statusDropdownRef.current?.contains(event.target)
      ) {
        return; // Click inside → do nothing
      }
      setIsStudyStatusOpen(false); // Click outside → close
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsStudyStatusOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        toggleRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      )
        return;

      setIsReadoutPopupOpen(false);
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsReadoutPopupOpen, setOpen]);

  // const cancerStages = [
  //   { label: "Pathologic Stage III Esophageal Adenocarcinoma AJCC v8", value: 1 },
  //   { label: "Pathologic Stage III Esophageal Squamous Cell Carcinoma AJCC v8", value: 2 },
  //   { label: "Pathologic Stage III Gastric Cancer AJCC v8", value: 3 },
  //   { label: "Pathologic Stage III Gastroesophageal Junction Adenocarcinoma AJCC v8", value: 4 },
  //   { label: "Pathologic Stage IIIA Esophageal Adenocarcinoma AJCC v8", value: 5 },
  // ];

  const [conditionsFilter, setconditionsFilter] = useState([]);

  const [showCalendar, setShowCalendar] = useState(false);
  const handleSelect = (value) => {
    setSelected(value);
    setOpen(false);
  };

  const handleEstimatedReadout = (value) => {
    if (value === "custom") {
      setSelected("custom");
      setShowCalendar(true);
      return;
    }
    handleSelect(value);
    setShowCalendar(false);
    setSelectedReadout([value]);
    setOpen(false);
    setCustomStartDate("");
    setCustomEndDate("");
    sendPayloadWithReadout({
      bulk_date: value,
    });

    setSelected(value);
  };

  const handleRangeChange = (range) => {
    const formattedRange = {
      startDate: range.startDate.toISOString().split("T")[0],
      endDate: range.endDate.toISOString().split("T")[0],
      key: range.key,
    };
    setCustomStartDate(formattedRange?.startDate);
    setSelectedRange(formattedRange);
  };

  return (
    <>
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={onFilterClose}
        ></div>
      )}
      <div
        className={`fixed top-0 right-0 h-full w-580w border-l border-gray-200 z-50 
  transform transition-transform duration-300 
  overflow-y-scroll overflow-x-hidden scrollbar-hide 
  ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 1)",
            border: "1px solid rgba(224, 225, 230, 1)",
            marginRight: "-1px",
            boxShadow: "0px 4px 8px rgba(138, 160, 190, 0.15)",
          }}
          className="sticky z-50 h-102x top-0 right-0 bg-filterHeader pl-20p gap-14 pr-20p pt-16p pb-16p py-2"
        >
          <div
            style={{
              alignItems: "center",
            }}
            className="flex justify-between items-start px-4 py-2 "
          >
            <h1
              style={{
                fontSize: "23px",
                fontFamily: "Rubik",
                fontWeight: "500",
                color: "rgba(0, 0, 0, 0.8)",
              }}
              className="text-lg font-semibold"
            >
              All Filters
            </h1>
            <button
              style={{
                display: "flex",
                alignItems: "center",
              }}
              onClick={onFilterClose}
            >
              <FontAwesomeIcon
                icon={faTimes}
                style={{
                  color: "rgba(0, 0, 0, 0.8)",
                  width: "20px",
                  height: "20px",
                }}
              />
            </button>
          </div>
        </div>
        <div class="bg-sLightBlue">
          <div className="p-4">

            {/* <AutoCompleteLimit /> */}
            <div
              className="relative w-510w"
              ref={dropdownRef}
              onMouseEnter={() => {
                if (!isConditionPopupOpen) {
                  setIsConditionPopupOpen(true);
                  setIsSearchingCondition(true);
                }
                setIsIntervantionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsPhasePopupOpen(false);
                setIsComparativePopupOpen(false);
                setIsStudyPhaseOpen(false);
                setIsStudyTypeOpen(false);
                setIsLocationPopupOpen(false);
                setIsFacilityPopupOpen(false);
                setIsleadSponsorPopupOpen(false);
                setIsLeadResearcherPopupOpen(false);
                setIsBiomarkerPopupOpen(false);
                setIsCriteriaPopupOpen(false);
                setIsBackbonePopupOpen(false);
                setIsNctIdPopupOpen(false);
                setIsMoaInterventionPopupOpen(false);
                setIsMoaComparatorPopupOpen(false);
                setIsReadoutPopupOpen(false);
              }}
              onMouseLeave={() => setIsConditionPopupOpen(false)}
            >
              <div
                className={`w-510w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
transition-all duration-300 ease-in-out hover:border-black group
focus:outline-none focus:ring-2 focus:ring-blue-400 
flex items-center justify-between px-4 text-gray-500 text-sm`}
                ref={toggleRef}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                  {selectedConditions?.length === 0 ? (
                    <input
                      type="text"
                      value={searchCondition}
                      onChange={(e) => setSearchCondition(e.target.value)}
                      placeholder="Condition"
                      autoFocus={isConditionPopupOpen}
                      className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 
transition-colors duration-300 group-hover:text-black custom-placeholder"
                    />
                  ) : (
                    <>
                      {selectedConditions
                        ?.slice(0, 2)
                        ?.map((condition, index) => (
                          <span
                            key={index}
                            className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                          >
                            <button
                              className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(
                                  { name: condition },
                                  "condition",
                                  true,
                                );
                                if (selectedConditions.length === 1) {
                                  setIsSearchingCondition(true);
                                }
                              }}
                            >
                              ×
                            </button>
                            <span className="truncate">{condition}</span>
                          </span>
                        ))}
                      {selectedConditions?.length > 2 && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                          +{selectedConditions.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isConditionPopupOpen && (
                <div className="absolute top-43x w-510w z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
                  <div className="pr-1 max-h-40 overflow-y-auto">
                    {conditions
                      .filter((condition) =>
                        condition?.name
                          .toLowerCase()
                          ?.includes(searchCondition.toLowerCase())
                      )
                      ?.slice(0, showAllConditions ? conditions.length : 5)
                      ?.map((condition) => (
                        <label
                          key={condition.id}
                          style={{
                            padding: "5px",
                          }}
                          className="responsive-checkbox-label"
                        // className="flex items-center text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 accent-blue-500"
                            checked={selectedConditions?.includes(
                              condition?.name
                            )}
                            onChange={() =>
                              handleCheckboxChange(condition, "condition")
                            }
                            onClick={(e) => e.stopPropagation()} // prevent dropdown closing
                          />
                          {condition.name}
                        </label>
                      ))}

                    {conditions?.filter((condition) =>
                      condition.name
                        .toLowerCase()
                        .includes(searchCondition.toLowerCase())
                    )?.length === 0 && (
                        <p className="text-xs text-gray-500 italic text-center py-2">
                          No results found
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Treatment Block */}
            <div
              className="relative w-510w"
              ref={interventionToggleRef}
              onMouseEnter={() => {
                if (!isIntervantionPopupOpen) {
                  setIsIntervantionPopupOpen(true);
                  setIsSearchingCondition(true);
                }
                setIsConditionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsPhasePopupOpen(false);
                setIsComparativePopupOpen(false);
                setIsStudyTypeOpen(false);
                setIsStudyPhaseOpen(false);
                setIsLocationPopupOpen(false);
                setIsFacilityPopupOpen(false);
                setIsleadSponsorPopupOpen(false);
                setIsLeadResearcherPopupOpen(false);
                setIsBiomarkerPopupOpen(false);
                setIsCriteriaPopupOpen(false);
                setIsBackbonePopupOpen(false);
                setIsNctIdPopupOpen(false);
                setIsMoaInterventionPopupOpen(false);
                setIsMoaComparatorPopupOpen(false);
                setIsReadoutPopupOpen(false);
              }}
              onMouseLeave={() => { setSearchInterventional(""); setIsIntervantionPopupOpen(false) }}
            >
              <div
                style={{
                  marginTop: "2%",
                }}
                ref={interventionToggleRef}
                className={`w-510w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
transition-all duration-300 ease-in-out hover:border-black group
focus:outline-none focus:ring-2 focus:ring-blue-400 
flex items-center justify-between px-4 text-gray-500 text-sm`}
              // ref={toggleRef}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                  {selectedInterventional?.length === 0 ? (
                    <input
                      type="text"
                      value={searchInterventional}
                      onChange={(e) => setSearchInterventional(e.target.value)}
                      placeholder="Treatment"
                      autoFocus={isIntervantionPopupOpen}
                      className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 
transition-colors duration-300 group-hover:text-black custom-placeholder"
                    />
                  ) : (
                    <>
                      {selectedInterventional
                        ?.slice(0, 5)
                        ?.map((condition, index) => (
                          <span
                            key={index}
                            className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                          >
                            <button
                              className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(
                                  { name: condition },
                                  "interventional",
                                  true,
                                );
                                if (selectedInterventional.length === 1) {
                                  setIsSearchingCondition(true);
                                }
                              }}
                            >
                              ×
                            </button>
                            <span className="truncate">{condition}</span>
                          </span>
                        ))}
                      {selectedInterventional?.length > 2 && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                          +{selectedInterventional.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isIntervantionPopupOpen && (
                <div className="absolute top-43x w-510w z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
                  <div className="pr-1 max-h-40 overflow-y-auto">
                    {treatmentFilter?.slice(0, 5)?.map((condition) => (
                      <label
                        key={condition.id}
                        style={{
                          padding: "5px",
                          textTransform: "capitalize",
                        }}
                        className="responsive-checkbox-label"
                      // className="flex items-center text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <input
                          type="checkbox"
                          className="mr-2 accent-blue-500"
                          checked={selectedInterventional?.includes(
                            condition?.name
                          )}
                          onChange={() => {
                            handleCheckboxChange(condition, "interventional");
                          }}
                          onClick={(e) => e.stopPropagation()} // prevent dropdown closing
                        />
                        {condition.name}
                      </label>
                    ))}

                    {treatmentFilter?.filter((condition) =>
                      condition.name
                        ?.toLowerCase()
                        ?.includes(searchInterventional.toLowerCase())
                    )?.length === 0 && (
                        <p className="text-xs text-gray-500 italic text-center py-2">
                          No results found
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2">
              <div className="flex w-510w text-xs gap-2.5">
                {/* ✅ Phase Dropdown (updated with popup) */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (!isStudyPhaseOpen) {
                      setIsStudyPhaseOpen(true);
                    }
                    setIsConditionPopupOpen(false);
                    setIsIntervantionPopupOpen(false);
                    setIsStudyStatusOpen(false);
                    setIsPhasePopupOpen(false);
                    setIsComparativePopupOpen(false);
                    setIsStudyTypeOpen(false);
                    setIsLocationPopupOpen(false);
                    setIsFacilityPopupOpen(false);
                    setIsleadSponsorPopupOpen(false);
                    setIsLeadResearcherPopupOpen(false);
                    setIsBiomarkerPopupOpen(false);
                    setIsCriteriaPopupOpen(false);
                    setIsBackbonePopupOpen(false);
                    setIsNctIdPopupOpen(false);
                    setIsMoaInterventionPopupOpen(false);
                    setIsMoaComparatorPopupOpen(false);
                    setIsReadoutPopupOpen(false);
                  }}
                  onMouseLeave={() => setIsStudyPhaseOpen(false)}
                >
                  {/* Trigger box */}
                  <div
                    ref={phaseToggleRef}
                    className="h-11 p-3 w-252w rounded-md border bg-inputBg flex items-center justify-between text-left text-gray-500 text-sm cursor-pointer whitespace-nowrap hover:border-black transition-all duration-300"
                  >
                    <span className="text-sm text-gray-400">
                      {selectedPhases.length > 0
                        ? selectedPhases[0].text
                        : "Study Phase"}
                    </span>

                    {selectedPhases?.length > 1 && (
                      <span
                        style={{
                          background: "rgba(220, 233, 252, 1)",
                          color: "rgba(47, 128, 237, 1)",
                        }}
                        className="ml-2 w-5 h-5 flex items-center justify-center text-white text-xs rounded"
                      >
                        +{selectedPhases?.length}
                      </span>
                    )}

                    <svg
                      className={`w-4 h-4 ml-2 transform transition-transform duration-300 ${isStudyPhaseOpen ? "rotate-180" : "rotate-0"
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

                  {/* Dropdown popup */}
                  {isStudyPhaseOpen && (
                    <div
                      ref={phaseDropdownRef}
                      className="absolute top-full w-60 p-4 border text-gray-500 text-sm shadow-xl bg-white z-20 transition-all duration-200 animate-[fadeIn_0.2s_ease-out]"
                    >
                      {phasesOptions?.map((phase) => (
                        <label
                          key={phase.id}
                          className="responsive-checkbox-label"
                        // className="flex items-center mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 accent-green-500"
                            checked={selectedPhases.some(
                              (p) => p.value === phase.value
                            )}
                            onChange={() =>
                              handleCheckboxChange(phase, "phase")
                            }
                            onClick={(e) => e.stopPropagation()} // prevent dropdown closing
                          />
                          {phase.text}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {/* // Study Type Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (!isStudyTypeOpen) {
                      setIsStudyTypeOpen(true);
                    }
                    setIsConditionPopupOpen(false);
                    setIsIntervantionPopupOpen(false);
                    setIsStudyStatusOpen(false);
                    setIsPhasePopupOpen(false);
                    setIsComparativePopupOpen(false);
                    setIsStudyPhaseOpen(false);
                    setIsLocationPopupOpen(false);
                    setIsFacilityPopupOpen(false);
                    setIsleadSponsorPopupOpen(false);
                    setIsLeadResearcherPopupOpen(false);
                    setIsBiomarkerPopupOpen(false);
                    setIsCriteriaPopupOpen(false);
                    setIsBackbonePopupOpen(false);
                    setIsNctIdPopupOpen(false);
                    setIsMoaInterventionPopupOpen(false);
                    setIsMoaComparatorPopupOpen(false);
                    setIsReadoutPopupOpen(false);
                  }}
                  onMouseLeave={() => setIsStudyTypeOpen(false)}
                >
                  {/* Toggle Button */}
                  <div
                    ref={typeToggleRef}
                    className="h-11 p-2 border w-252w bg-inputBg rounded-md shadow-sm flex items-center justify-between cursor-pointer text-gray-500 text-sm whitespace-nowrap hover:border-black transition-all duration-300"
                  >
                    <span className="text-sm text-gray-400">
                      {selectedStudyTypes.length > 0
                        ? selectedStudyTypes[0]
                        : "Study Type"}
                    </span>

                    {selectedStudyTypes.length > 1 && (
                      <span
                        style={{
                          background: "rgba(220, 233, 252, 1)",
                          color: "rgba(47, 128, 237, 1)",
                        }}
                        className="ml-2 w-5 h-5 flex items-center justify-center text-white text-xs rounded-[4px]"
                      >
                        +{selectedStudyTypes.length}
                      </span>
                    )}

                    <svg
                      className={`w-4 h-4 ml-2 transform transition-transform duration-300 ${isStudyTypeOpen ? "rotate-180" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Dropdown */}
                  {isStudyTypeOpen && (
                    <div
                      ref={typeDropdownRef}
                      className="absolute top-full text-sm text-gray-500 w-60 p-4 border shadow-xl bg-white z-20 transition-all duration-200 animate-[fadeIn_0.2s_ease-out]"
                    >
                      {studyTypes.map((studyType) => (
                        <div key={studyType.id}>
                          <label
                            className="responsive-checkbox-label"
                          //  className="flex items-center mb-2 text-xs text-gray-600 cursor-pointer transition-colors whitespace-nowrap hover:text-blue-600"
                          >
                            <input
                              type="checkbox"
                              className="mr-2 accent-green-500"
                              checked={selectedStudyTypes.includes(
                                studyType.text
                              )}
                              onChange={() =>
                                handleCheckboxChange(studyType, "studyType")
                              }
                              onClick={(e) => e.stopPropagation()} // prevent unwanted close
                            />
                            <span className="truncate">{studyType.text}</span>
                          </label>

                          {studyType.children && (
                            <div className="ml-6">
                              {studyType.children.map((child) => (
                                <label
                                  key={child.id}
                                  className="flex items-center mb-2 text-xs text-gray-600 cursor-pointer transition-colors whitespace-nowrap hover:text-blue-600"
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-2 accent-green-500"
                                    checked={selectedStudyTypes.includes(
                                      child.text
                                    )}
                                    onChange={() =>
                                      handleCheckboxChange(child, "studyType")
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="truncate">{child.text}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex w-510w text-xs gap-2.5 mt-2">
                {/* ✅ Study Status Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (!isStudyStatusOpen) {
                      setIsStudyStatusOpen(true);
                    }
                    setIsConditionPopupOpen(false);
                    setIsIntervantionPopupOpen(false);
                    setIsPhasePopupOpen(false);
                    setIsComparativePopupOpen(false);
                    setIsStudyTypeOpen(false);
                    setIsStudyPhaseOpen(false);
                    setIsLocationPopupOpen(false);
                    setIsFacilityPopupOpen(false);
                    setIsleadSponsorPopupOpen(false);
                    setIsLeadResearcherPopupOpen(false);
                    setIsBiomarkerPopupOpen(false);
                    setIsCriteriaPopupOpen(false);
                    setIsBackbonePopupOpen(false);
                    setIsNctIdPopupOpen(false);
                    setIsMoaInterventionPopupOpen(false);
                    setIsMoaComparatorPopupOpen(false);
                    setIsReadoutPopupOpen(false);
                  }}
                  onMouseLeave={() => setIsStudyStatusOpen(false)}
                >
                  <div
                    ref={statusToggleRef}
                    className="h-11 w-252w rounded-md border border-gray-300 bg-inputBg
      shadow-md cursor-pointer transition-all duration-300 
      focus:outline-none focus:ring-2 focus:ring-blue-400 
      flex items-center justify-between px-3 text-gray-500 text-sm whitespace-nowrap hover:border-black"
                  >
                    <span className="text-sm text-gray-400">
                      {selectedStudyStatus?.length > 0
                        ? selectedStudyStatus[0]
                        : "Study Status"}
                    </span>
                    {selectedStudyStatus?.length > 1 && (
                      <div
                        style={{
                          background: "rgba(220, 233, 252, 1)",
                          color: "rgba(47, 128, 237, 1)",
                        }}
                        className="ml-2 flex items-center justify-center w-5 h-5  text-white text-xs rounded-[4px]"
                      >
                        +{selectedStudyStatus?.length}
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 ml-2 transform transition-transform duration-300 ${isStudyStatusOpen ? "rotate-180" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {isStudyStatusOpen && (
                    <div
                      ref={statusDropdownRef}
                      className="absolute top-full w-64 p-4 border border-gray-200 
        shadow-2xl bg-white z-20 transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                    >
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        {studyStatus
                          .slice(0, showAllStudyStatus ? studyStatus.length : 8)
                          .map((status) => (
                            <label
                              key={status.id}
                              className="responsive-checkbox-label"
                            // className="flex items-center mb-1 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                className="mr-2 accent-green-500"
                                checked={selectedStudyStatus.includes(
                                  status.text
                                )}
                                onChange={() =>
                                  handleCheckboxChange(status, "status")
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="truncate">{status.text}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (!isReadoutPopupOpen) {
                      setIsReadoutPopupOpen(true);
                    }
                    setIsConditionPopupOpen(false);
                    setIsIntervantionPopupOpen(false);
                    setIsStudyStatusOpen(false);
                    setIsPhasePopupOpen(false);
                    setIsComparativePopupOpen(false);
                    setIsStudyTypeOpen(false);
                    setIsStudyPhaseOpen(false);
                    setIsLocationPopupOpen(false);
                    setIsFacilityPopupOpen(false);
                    setIsleadSponsorPopupOpen(false);
                    setIsLeadResearcherPopupOpen(false);
                    setIsBiomarkerPopupOpen(false);
                    setIsCriteriaPopupOpen(false);
                    setIsBackbonePopupOpen(false);
                    setIsNctIdPopupOpen(false);
                    setIsMoaInterventionPopupOpen(false);
                    setIsMoaComparatorPopupOpen(false);
                  }}
                  onMouseLeave={() => setIsReadoutPopupOpen(false)}
                >
                  {/* Toggle Button */}
                  <div
                    ref={toggleRef}
                    className="h-11 w-252w rounded-md border border-gray-300 bg-inputBg shadow-md cursor-pointer 
    transition-all duration-300 hover:scale-105 flex items-center justify-between px-3 text-gray-500 text-sm"
                  >
                    {/* <span className="text-sm text-gray-400">
                      Estimated Readout
                    </span> */}
                    <span
                      style={{
                        color: "rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      {selectedReadout.length > 0
                        ? selectedReadout[0]
                        : "Estimated Readout"}
                    </span>

                    {selectedReadout.length > 1 && (
                      <div className="dropdown-badge">
                        {selectedReadout.length}
                      </div>
                    )}

                    <svg
                      className={`w-4 h-4 ml-2 transform transition-transform duration-300 ${isReadoutPopupOpen ? "rotate-180" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {isReadoutPopupOpen && (
                    <div
                      style={{
                        width: "250px",
                      }}
                      ref={dropdownRef}
                      className="absolute right-1 top-full border border-gray-200 shadow-2xl bg-white z-20 rounded-lg p-5 transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                    >
                      {/* Inner select */}
                      <div className="relative w-full">
                        {/* <button
                          onClick={() => setOpen((prev) => !prev)}
                          className="w-full border border-gray-300 bg-white rounded-md px-4 py-2 flex justify-between items-center text-sm"
                        >
                          <span
                            className={
                              selectedReadout.length
                                ? "text-black"
                                : "text-gray-400"
                            }
                          >
                            {selectedReadout.length > 0
                              ? selectedReadout[0]
                              : "Start Date"}
                          </span>
                          <i className="fa-solid fa-chevron-down text-gray-500"></i>
                        </button> */}

                        <RadioGroup
                          value={selected}
                          onChange={(e) =>
                            handleEstimatedReadout(e.target.value)
                          }
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
                                          "& .MuiSvgIcon-root": {
                                            fontSize: 14,
                                          },
                                          "& .MuiFormControlLabel-label": {
                                            fontSize: "13px",
                                            fontFamily: "Rubik",
                                          },
                                        }}
                                      />
                                    }
                                    label={opt.label}
                                    sx={{
                                      fontSize: "12px",
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
                                      marginTop: "3px",
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
                            {readoutOptions.map((opt) => (
                              <label
                                key={opt.value}
                                className="flex items-center gap-2 px-4 py-1 hover:bg-gray-100 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="customSelect"
                                  value={opt.value}
                                  checked={selectedReadout[0] === opt.value}
                                  // onChange={() => {
                                  //   setSelectedReadout([opt.value]);
                                  //   setOpen(false);
                                  //   sendPayloadWithReadout({
                                  //     bulk_date: opt.value,
                                  //   });
                                  // }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* <h3 className="text-left mt-5 font-semibold">Custom</h3>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setCustomStartDate(newStart);
                            setSelectedReadout([]);
                          }}
                          className="border-2 px-2 py-1 rounded-lg w-1/2 text-gray-500"
                        />
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            setCustomEndDate(newEnd);
                            setSelectedReadout([]);
                          }}
                          className="border-2 px-2 py-1 rounded-lg w-1/2 text-gray-500"
                        />
                      </div> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Design poster */}
          <div>
            <div className={`w-32 ${classes.filtersection_heading_div}`}>
              <h2
                className={`text-left mt-5 font-bold text-blue-800 py-1 text-sm pl-4 rounded-tr-md rounded-br-md ${classes.filtersection_heading}`}
              >
                Design Posture
              </h2>
            </div>

            {/* comparator */}

            <div>
              {/* MOA Intervantion */}
              <div
                style={{
                  marginLeft: "20px",
                  marginTop: "20px",
                }}
                className="relative w-510w"
                onMouseEnter={() => {
                  if (!isMoaInterventionPopupOpen)
                    setIsMoaInterventionPopupOpen(true);
                  setIsStudyStatusOpen(false);
                  setIsPhasePopupOpen(false);
                  setIsReadoutPopupOpen(false);
                  setIsConditionPopupOpen(false);
                  setIsComparativePopupOpen(false);
                  setIsNctIdPopupOpen(false);
                  setIsIntervantionPopupOpen(false);
                  setIsBackbonePopupOpen(false);
                  setIsCriteriaPopupOpen(false);
                  setIsBiomarkerPopupOpen(false);
                  setIsLeadResearcherPopupOpen(false);
                  setIsleadSponsorPopupOpen(false);
                  setIsLocationPopupOpen(false);
                }}
                onMouseLeave={() => setIsMoaInterventionPopupOpen(false)}
              >
                {/* Custom Select Box */}
                <div
                  ref={moaInterventionToggleRef}
                  className={`w-510w h-11 p-2 rounded-lg border border-gray-300 bg-inputBg shadow-md cursor-text 
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-400 
    flex items-center px-4 text-gray-500 text-sm`}
                >
                  {/* Left Side (Search + Tags) */}
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    {selectedMoaIntervention.length === 0 ? (
                      <input
                        type="text"
                        value={searchMoaIntervention}
                        onChange={(e) =>
                          setSearchMoaIntervention(e.target.value)
                        }
                        placeholder="Mechanism of Action"
                        autoFocus={isMoaInterventionPopupOpen}
                        className="w-full outline-none text-gray-700 text-sm bg-transparent"
                      />
                    ) : (
                      <>
                        {selectedMoaIntervention
                          .slice(0, 2)
                          .map((item, idx) => (
                            <span
                              key={idx}
                              className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                            >
                              <button
                                className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxChange(
                                    { name: item },
                                    "moaIntervantion",
                                    true,
                                  );
                                }}
                              >
                                ×
                              </button>
                              <span className="truncate">{item}</span>
                            </span>
                          ))}
                        {selectedMoaIntervention.length > 2 && (
                          <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                            +{selectedMoaIntervention.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-gray-400 ml-2 shrink-0">
                    <i
                      className={`fa-solid fa-chevron-${isMoaInterventionPopupOpen ? "up" : "down"
                        } transition-transform duration-200`}
                    ></i>
                  </span>
                </div>
                {isMoaInterventionPopupOpen && (
                  <div
                    ref={moaInterventionDropdownRef}
                    className="top-43x text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white 
      transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                  >
                    <div className="pr-1 max-h-40 overflow-y-auto">
                      {filteredMoaIntervention
                        .slice(
                          0,
                          showAllMoaIntervention
                            ? filteredMoaIntervention.length
                            : 5
                        )
                        .map((moa) => (
                          <label
                            key={moa.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                          >
                            <input
                              type="checkbox"
                              className="mr-2 accent-blue-500"
                              checked={selectedMoaIntervention.includes(
                                moa.name
                              )}
                              onChange={() =>
                                handleCheckboxChange(moa, "moaIntervantion")
                              }
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                            {moa.name}
                          </label>
                        ))}
                      {filteredMoaIntervention.length === 0 && (
                        <p className="text-xs text-gray-500 italic text-center py-2">
                          No results found
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* comparator type */}
            <div
              style={{
                marginLeft: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontFamily: "Rubik",
                  fontWeight: "500",
                  color: "rgba(0, 0, 0, 0.8)",
                }}
                className="text-left mt-4 font-bold text-sm"
              >
                Comparator Type
              </h2>
              <div className="mt-2 space-y-4">
                {AllFilterComparatorType.map((conditions, idx) => (
                  <div key={idx} className="rounded-lg ">
                    <div className="flex flex-wrap gap-2">
                      {conditions.map((condition, i) => {
                        const isSelected =
                          selectedComparativeType.includes(condition);
                        return (
                          <span
                            key={i}
                            onClick={() =>
                              handleCheckboxChange(condition, "comparativeType")
                            }
                            style={{
                              height: "24px",
                            }}
                            className={`flex items-center gap-1 cursor-pointer text-sm px-2  rounded border transition-all ${isSelected
                              ? "bg-black text-white border-black"
                              : "bg-whiteCol text-gray-700 border-lightGray hover:border-black hover:bg-gray-200 hover:text-black"
                              }`}
                          >
                            {isSelected && (
                              <img
                                src={clockIcon}
                                alt="clock"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                }}
                                className="object-contain"
                              />
                            )}
                            {condition}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginLeft: "20px",
              }}
              className="text-sm text-left pt-4"
            >
              <span className={classes.filterHeader_title}>Randomization</span>
              {/* <div className="flex gap-5 pt-3">
                {choices.map((choice) => {
                  const isSelected = chosen === choice.value;
                  return (
                    <label
                      key={choice.value}
                      className={`flex items-center cursor-pointer ${isSelected ? "text-black" : "text-gray-500"
                        }`}
                    >
                      <input
                        type="radio"
                        name="randomized"
                        value={choice.value}
                        checked={isSelected}
                        onChange={() => {
                          setChosen(choice.value);
                          handleCheckboxChange(choice.value, "randomized");
                        }}
                        className="hidden"
                      />
                      <span
                        className={`w-4 h-4 mr-2 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-filterBtn" : "border-gray-400"
                          }`}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-filterBtn"></span>
                        )}
                      </span>
                      {choice.label}
                    </label>
                  );
                })}
              </div> */}
              <div className="mt-2 space-y-4">
                {AllFilterRandomization.map((conditions, idx) => (
                  <div key={idx} className="rounded-lg ">
                    <div className="flex flex-wrap gap-2">
                      {conditions.map((condition, i) => {
                        const isSelected = true;
                        return (
                          <span
                            key={i}
                            // onClick={() =>
                            //   handleCheckboxChange(condition, "comparativeType")
                            // }
                            style={{
                              height: "24px",
                            }}
                            className={`flex items-center gap-1 cursor-pointer text-sm px-2  rounded border transition-all ${isSelected
                              ? "bg-black text-white border-black"
                              : "bg-whiteCol text-gray-700 border-lightGray hover:border-black hover:bg-gray-200 hover:text-black"
                              }`}
                          >
                            {isSelected && (
                              <img
                                src={clockIcon}
                                alt="clock"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                }}
                                className="object-contain"
                              />
                            )}
                            {condition}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginLeft: "20px",
            }}
            className="text-sm text-left pt-4"
          >
            <span className={classes.filterHeader_title}>
              Primary Outcome Class (Optimized)
            </span>
            {/* <div className="flex gap-5 pt-3">
              {blindChoices.map((choice) => {
                const isSelected = blindChosen === choice.value;
                return (
                  <label
                    key={choice.value}
                    className={`flex items-center cursor-pointer ${isSelected ? "text-black" : "text-gray-500"
                      }`}
                  >
                    <input
                      type="radio"
                      name="blinding"
                      value={choice.value}
                      checked={isSelected}
                      onChange={() =>
                        handleCheckboxChange(choice.value, "blinding")
                      }
                      className="hidden"
                    />
                    <span
                      className={`w-4 h-4 mr-2 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-filterBtn" : "border-gray-400"
                        }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-filterBtn"></span>
                      )}
                    </span>
                    {choice.label}
                  </label>
                );
              })}
            </div> */}
            <div className="mt-2 space-y-4">
              {AllFilterPrimaryOutcomes.map((conditions, idx) => (
                <div key={idx} className="rounded-lg ">
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((condition, i) => {
                      const isSelected = false;
                      return (
                        <span
                          key={i}
                          // onClick={() =>
                          //   handleCheckboxChange(condition, "comparativeType")
                          // }
                          style={{
                            height: "24px",
                          }}
                          className={`flex items-center gap-1 cursor-pointer text-sm px-2  rounded border transition-all ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-whiteCol text-gray-700 border-lightGray hover:border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                              className="object-contain"
                            />
                          )}
                          {condition}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* <div>
            <h2 className="text-left mt-4 font-bold text-sm pl-4">
              Primary Outcome Classes
            </h2>
            <div className="mt-2 space-y-4">
              {endpointList.map((endpoints, idx) => (
                <div key={idx} className="rounded-lg ">
                  <div className="flex flex-wrap gap-2">
                    {endpoints.map((endpoint, i) => {
                      const isSelected = selectedEndpoints.includes(endpoint);
                      return (
                        <span
                          key={i}
                          onClick={() =>
                            handleCheckboxChange(endpoint, "endpoint")
                          }
                          className={`ml-4 flex items-center gap-1 cursor-pointer text-sm px-2  rounded border transition-all ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-whiteCol text-gray-700 border-lightGray hover:border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          {endpoint}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Line / Intent */}
          <div className={`w-24 ${classes.filtersection_heading_div}`}>
            <h2 className={`${classes.filtersection_heading} text-left mt-5 font-bold text-blue-800 py-1 text-sm pl-4 bg-blue-100 rounded-tr-md rounded-br-md`}>
              Oncology
            </h2>
          </div>
          <div style={{ marginLeft: "20px", marginTop: "20px" }}>
            <h2 className={`${classes.filterHeader_title} text-left font-bold text-sm`}>
              Line of therapy
            </h2>
            {/* <div className=" space-y-4">
              {lineSettingsList.map((settings, idx) => (
                <div key={idx} className="rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {settings.map((lineCondition, i) => {
                      const isSelected =
                        selectedLineOfTherapy.includes(lineCondition);
                      return (
                        <span
                          key={i}
                          onClick={() =>
                            handleCheckboxChange(lineCondition, "lineTherapy")
                          }
                          className={`ml-4 flex items-center gap-1 cursor-pointer text-sm px-2  border-lightGray hover:border-black rounded border  transition-all ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-whiteCol text-gray-700 border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          {lineCondition}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div> */}

            <div className="mt-2 space-y-4">
              {AllFilterLineofTherapy.map((conditions, idx) => (
                <div key={idx} className="rounded-lg ">
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((condition, i) => {
                      const isSelected = true;
                      return (
                        <span
                          key={i}
                          // onClick={() =>
                          //   handleCheckboxChange(condition, "comparativeType")
                          // }
                          style={{
                            height: "24px",
                          }}
                          className={`flex items-center gap-1 cursor-pointer text-sm px-2  rounded border transition-all ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-whiteCol text-gray-700 border-lightGray hover:border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              style={{
                                width: "12px",
                                height: "12px",
                              }}
                              className="object-contain"
                            />
                          )}
                          {condition}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* stage */}
          <div style={{ marginLeft: "20px" }}>
            <h2 className={`text-left mt-4 font-bold text-sm ${classes.filterHeader_title}`}>Stage</h2>
            <div className="mt-2 space-y-4">
              {/* {stagesList.map((stages, idx) => (
                <div key={idx} className="rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage, i) => {
                      const isSelected = selectedStages.includes(stage);
                      return (
                        <span
                          key={i}
                          onClick={() => handleCheckboxChange(stage, "stage")}
                          className={`ml-4 flex items-center gap-1 cursor-pointer text-sm px-2  rounded border border-lightGray hover:border-black transition-all ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-whiteCol text-gray-700 border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          {stage}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))} */}

              <div className="mt-2 space-y-4">
                {AllFilterStagesList.map((conditions, idx) => (
                  <div key={idx} className="rounded-lg ">
                    <div className="flex flex-wrap gap-2">
                      {conditions.map((condition, i) => {
                        const isSelected = true;
                        return (
                          <span
                            key={i}
                            // onClick={() =>
                            //   handleCheckboxChange(condition, "comparativeType")
                            // }
                            style={{
                              height: "24px",
                            }}
                            className={`flex items-center gap-1 cursor-pointer text-sm px-2  rounded border transition-all ${isSelected
                              ? "bg-black text-white border-black"
                              : "bg-whiteCol text-gray-700 border-lightGray hover:border-black hover:bg-gray-200 hover:text-black"
                              }`}
                          >
                            {isSelected && (
                              <img
                                src={clockIcon}
                                alt="clock"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                }}
                                className="object-contain"
                              />
                            )}
                            {condition}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Biomarker */}
          <div

            className={`relative w-510w ${classes.filter_block_spacing}`}
            onMouseEnter={() => {
              if (!isBiomarkerPopupOpen) setIsBiomarkerPopupOpen(true);
              setIsMoaComparatorPopupOpen(false);
              setIsMoaInterventionPopupOpen(false);
              setIsConditionPopupOpen(false);
              setIsIntervantionPopupOpen(false);
              setIsStudyStatusOpen(false);
              setIsPhasePopupOpen(false);
              setIsComparativePopupOpen(false);
              setIsReadoutPopupOpen(false);
              setIsNctIdPopupOpen(false);
              setIsBackbonePopupOpen(false);
              setIsCriteriaPopupOpen(false);
              setIsLeadResearcherPopupOpen(false);
              setIsleadSponsorPopupOpen(false);
              setIsLocationPopupOpen(false);
            }}
            onMouseLeave={() => setIsBiomarkerPopupOpen(false)}
          >
            <div
              ref={biomarkerToggleRef}
              className={`w-510w h-11 p-2 rounded-lg border border-gray-300 bg-inputBg shadow-md cursor-text transition-all duration-300 ease-in-out hover:scale-105 hover:border-black flex items-center justify-between px-4 text-gray-500 text-sm`}
            >
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                {selectedBiomarker?.length === 0 ? (
                  <input
                    type="text"
                    value={searchBiomarker}
                    onChange={(e) => setSearchBiomarker(e.target.value)}
                    placeholder="Biomarkers"
                    autoFocus={isBiomarkerPopupOpen}
                    className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500"
                  />
                ) : (
                  <>
                    {selectedBiomarker.slice(0, 2).map((item, idx) => (
                      <span
                        key={idx}
                        className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                      >
                        <button
                          className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(
                              { name: item },
                              "biomarker",
                              true,
                            );
                          }}
                        >
                          ×
                        </button>
                        <span className="truncate">{item}</span>
                      </span>
                    ))}
                    {selectedBiomarker.length > 2 && (
                      <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                        +{selectedBiomarker.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {isBiomarkerPopupOpen && (
              <div
                ref={biomarkerDropdownRef}
                className="absolute w-510w top-43x z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white 
      transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
              >
                <div className="pr-1 max-h-40 overflow-y-auto">
                  {filteredBiomarker
                    .slice(0, showAllBiomarker ? filteredBiomarker.length : 5)
                    .map((biomarker) => (
                      <label
                        key={biomarker.id}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <input
                          type="checkbox"
                          className="mr-2 accent-blue-500"
                          checked={selectedBiomarker.includes(biomarker.name)}
                          onChange={() =>
                            handleCheckboxChange(biomarker, "biomarker")
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        {biomarker.name}
                      </label>
                    ))}
                  {filteredBiomarker.length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-2">
                      No results found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* response criteria */}
          <div
            className={`relative w-510w ${classes.filter_block_spacing}`}
            onMouseEnter={() => {
              if (!isCriteriaPopupOpen) setIsCriteriaPopupOpen(true);
              setIsBiomarkerPopupOpen(false);
              setIsMoaComparatorPopupOpen(false);
              setIsMoaInterventionPopupOpen(false);
              setIsConditionPopupOpen(false);
              setIsIntervantionPopupOpen(false);
              setIsStudyStatusOpen(false);
              setIsPhasePopupOpen(false);
              setIsComparativePopupOpen(false);
              setIsReadoutPopupOpen(false);
              setIsNctIdPopupOpen(false);
              setIsBackbonePopupOpen(false);
              setIsLeadResearcherPopupOpen(false);
              setIsleadSponsorPopupOpen(false);
              setIsLocationPopupOpen(false);
            }}
            onMouseLeave={() => setIsCriteriaPopupOpen(false)}
          >
            <div
              ref={criteriaToggleRef}
              className={`w-510w h-11 p-2 rounded-lg border border-gray-300 bg-inputBg shadow-md cursor-text transition-all duration-300 ease-in-out hover:scale-105 hover:border-black flex items-center justify-between px-4 text-gray-500 text-sm`}
            >
              {/* Left Section */}
              <div className="flex items-center gap-2 w-full overflow-hidden">
                {selectedCriteria.length === 0 ? (
                  <input
                    type="text"
                    value={searchCriteria}
                    onChange={(e) => setSearchCriteria(e.target.value)}
                    placeholder="Response criteria"
                    autoFocus={isCriteriaPopupOpen}
                    className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500"
                  />
                ) : (
                  <>
                    {selectedCriteria.slice(0, 2).map((item, idx) => (
                      <span
                        key={idx}
                        className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                      >
                        <button
                          className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(
                              { name: item },
                              "responseCriteria",
                              true,
                            );
                          }}
                        >
                          ×
                        </button>
                        <span className="truncate">{item}</span>
                      </span>
                    ))}
                    {selectedCriteria.length > 2 && (
                      <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                        +{selectedCriteria.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>
              <span className="text-gray-400 ml-2 shrink-0 transition-transform duration-200">
                <i
                  className={`fa-solid fa-chevron-${isCriteriaPopupOpen ? "up" : "down"
                    }`}
                ></i>
              </span>
            </div>
            {isCriteriaPopupOpen && (
              <div
                ref={criteriaDropdownRef}
                className="absolute w-510w top-43x z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
              >
                <div className="pr-1 max-h-40 overflow-y-auto">
                  {filteredCriteria
                    .slice(0, showAllCriteria ? filteredCriteria.length : 5)
                    .map((criteria) => (
                      <label
                        key={criteria.id}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <input
                          type="checkbox"
                          className="mr-2 accent-blue-500"
                          checked={selectedCriteria.includes(criteria.name)}
                          onChange={() =>
                            handleCheckboxChange(criteria, "responseCriteria")
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        {criteria.name}
                      </label>
                    ))}
                  {filteredCriteria.length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-2">
                      No results found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Combination Backbone */}
          <div
            className={`relative w-510w ${classes.filter_block_spacing}`}
            onMouseEnter={() => {
              if (!isBackbonePopupOpen) setIsBackbonePopupOpen(true);
              setIsBiomarkerPopupOpen(false);
              setIsCriteriaPopupOpen(false);
              setIsMoaComparatorPopupOpen(false);
              setIsMoaInterventionPopupOpen(false);
              setIsConditionPopupOpen(false);
              setIsIntervantionPopupOpen(false);
              setIsStudyStatusOpen(false);
              setIsPhasePopupOpen(false);
              setIsComparativePopupOpen(false);
              setIsReadoutPopupOpen(false);
              setIsNctIdPopupOpen(false);
              setIsLeadResearcherPopupOpen(false);
              setIsleadSponsorPopupOpen(false);
              setIsLocationPopupOpen(false);
            }}
            onMouseLeave={() => setIsBackbonePopupOpen(false)}
          >
            <div
              ref={backboneToggleRef}
              className={`w-510w h-11 p-2 rounded-lg border border-gray-300 bg-inputBg shadow-md cursor-text transition-all duration-300 ease-in-out hover:scale-105 hover:border-black flex items-center justify-between px-4 text-gray-500 text-sm`}
            >
              {/* Left Section */}
              <div className="flex items-center gap-2 w-full overflow-hidden">
                {selectedBackbone.length === 0 ? (
                  <input
                    type="text"
                    value={searchBackbone}
                    onChange={(e) => setSearchBackbone(e.target.value)}
                    placeholder="Combination backbone"
                    autoFocus={isBackbonePopupOpen}
                    className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500"
                  />
                ) : (
                  <>
                    {selectedBackbone.slice(0, 2).map((item, idx) => (
                      <span
                        key={idx}
                        className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                      >
                        <button
                          className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(
                              { name: item },
                              "backbone",
                              true,
                            );
                          }}
                        >
                          ×
                        </button>
                        <span className="truncate">{item}</span>
                      </span>
                    ))}
                    {selectedBackbone.length > 2 && (
                      <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                        +{selectedBackbone.length - 2}
                      </span>
                    )}
                  </>
                )}
              </div>
              {/* Right Section - Chevron Icon */}
              <span className="text-gray-400 ml-2 shrink-0 transition-transform duration-200">
                <i
                  className={`fa-solid fa-chevron-${isBackbonePopupOpen ? "up" : "down"
                    }`}
                ></i>
              </span>
            </div>
            {isBackbonePopupOpen && (
              <div
                ref={backboneDropdownRef}
                className="absolute w-510w top-43x z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white 
      transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
              >
                <div className="pr-1 max-h-40 overflow-y-auto">
                  {filteredBackbone
                    .slice(0, showAllBackbone ? filteredBackbone.length : 5)
                    .map((backbone) => (
                      <label
                        key={backbone.id}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        <input
                          type="checkbox"
                          className="mr-2 accent-blue-500"
                          checked={selectedBackbone.includes(backbone.name)}
                          onChange={() =>
                            handleCheckboxChange(backbone, "backbone")
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        {backbone.name}
                      </label>
                    ))}

                  {filteredBackbone.length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-2">
                      No results found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scale & footprint */}
          <div className={`w-36 ${classes.filtersection_heading_div}`}>
            <h2 className={`text-left mt-5 font-bold text-filterHeader bg-lightGray  text-sm pl-4 py-1  rounded-tr-md rounded-br-md ${classes.filtersection_heading}`}>
              Scale & footprint
            </h2>
          </div>
          <div>
            <div className={`mb-6 ${classes.filter_block_spacing}`}>
              <label className={`block text-sm font-medium text-left ${classes.filterHeader_title}`}>
                Enrollment
              </label>
              <div className="relative w-500w pl-5">
                <div className="relative h-16">
                  {/* Track Background */}
                  <div
                    className="absolute w-full h-1 bg-gray-200 rounded-lg"
                    style={{ top: "26px" }}
                  ></div>
                  <div
                    className="absolute top-6 h-1 bg-filterBtn rounded-lg"
                    style={{
                      left: `${(enrollmentSlider.from / 1500) * 100}%`,
                      width: `${((enrollmentSlider.to - enrollmentSlider.from) / 1500) *
                        100
                        }%`,
                      top: "26px",
                    }}
                  ></div>
                  {/* From Slider */}
                  <input
                    type="range"
                    min="0"
                    max="1500"
                    value={enrollmentSlider.from}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= enrollmentSlider.to) {
                        handleEnrollmentChange(value, enrollmentSlider.to);
                      }
                    }}
                    className="absolute top-6 w-full h-2 cursor-pointer z-20 opacity-0"
                  />
                  {/* To Slider */}
                  <input
                    type="range"
                    min="0"
                    max="1500"
                    value={enrollmentSlider.to}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= enrollmentSlider.from) {
                        handleEnrollmentChange(enrollmentSlider.from, value);
                      }
                    }}
                    className="absolute top-6 w-full h-2 cursor-pointer z-30 opacity-0"
                  />
                  {/* Visual Thumb for From */}
                  <div
                    className={`absolute w-5 h-5 bg-white border-4 border-filterBtn rounded-md cursor-pointer shadow-lg hover:scale-110 transition-transform ${isBackbonePopupOpen ? "z-10" : "z-40"
                      }`}
                    style={{
                      left: `calc(${(enrollmentSlider.from / 1500) * 100
                        }% - 12px)`,
                      top: "18px",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startValue = enrollmentSlider.from;
                      const maxValue = enrollmentSlider.to;
                      const handleMouseMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaValue = (deltaX / 500) * 1500;
                        let newValue = Math.round(startValue + deltaValue);
                        newValue = Math.max(0, Math.min(maxValue, newValue));
                        if (newValue !== enrollmentSlider.from) {
                          handleEnrollmentChange(newValue, enrollmentSlider.to);
                        }
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener(
                          "mousemove",
                          handleMouseMove
                        );
                        document.removeEventListener("mouseup", handleMouseUp);
                      };
                      document.addEventListener("mousemove", handleMouseMove);
                      document.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      {enrollmentSlider.from}
                    </div>
                  </div>
                  {/* Visual Thumb for To */}
                  <div
                    className={`absolute w-5 h-5 bg-white border-4 border-filterBtn rounded-md cursor-pointer shadow-lg hover:scale-110 transition-transform ${isBackbonePopupOpen ? "z-10" : "z-40"
                      }`}
                    style={{
                      left: `calc(${(enrollmentSlider.to / 1500) * 100
                        }% - 12px)`,
                      top: "18px",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startValue = enrollmentSlider.to;
                      const minValue = enrollmentSlider.from;
                      const handleMouseMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaValue = (deltaX / 500) * 1500;
                        let newValue = Math.round(startValue + deltaValue);
                        newValue = Math.max(minValue, Math.min(1500, newValue));
                        if (newValue !== enrollmentSlider.to) {
                          handleEnrollmentChange(
                            enrollmentSlider.from,
                            newValue
                          );
                        }
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener(
                          "mousemove",
                          handleMouseMove
                        );
                        document.removeEventListener("mouseup", handleMouseUp);
                      };
                      document.addEventListener("mousemove", handleMouseMove);
                      document.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      {enrollmentSlider.to}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sites */}
            <div className="mb-6">
              <label className="block text-sm font-medium pl-4 pt-4 text-left">
                Sites (Count)
              </label>
              <div className="relative w-500w pl-7 pt-2">
                <div className="relative h-16">
                  {/* Track Background */}
                  <div
                    className="absolute w-full h-1 bg-gray-200 rounded-lg"
                    style={{ top: "26px" }}
                  ></div>
                  <div
                    className="absolute h-1 bg-filterBtn rounded-lg"
                    style={{
                      left: `${(sitesSlider.from / 200) * 100}%`,
                      width: `${((sitesSlider.to - sitesSlider.from) / 200) * 100
                        }%`,
                      top: "26px",
                    }}
                  ></div>
                  {/* From Slider */}
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={sitesSlider.from}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= sitesSlider.to) {
                        handleSitesChange(value, sitesSlider.to);
                      }
                    }}
                    className="absolute top-6 w-full h-2 cursor-pointer z-20 opacity-0"
                  />
                  {/* To Slider */}
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={sitesSlider.to}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= sitesSlider.from) {
                        handleSitesChange(sitesSlider.from, value);
                      }
                    }}
                    className="absolute top-6 w-full h-2 cursor-pointer z-30 opacity-0"
                  />
                  {/* Visual Thumb for From */}
                  <div
                    className="absolute w-5 h-5 bg-white border-4 border-filterBtn rounded-md cursor-pointer z-40 shadow-lg hover:scale-110 transition-transform"
                    style={{
                      left: `calc(${(sitesSlider.from / 200) * 100}% - 12px)`,
                      top: "18px",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startValue = sitesSlider.from;
                      const maxValue = sitesSlider.to;
                      const handleMouseMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaValue = (deltaX / 500) * 200;
                        let newValue = Math.round(startValue + deltaValue);
                        newValue = Math.max(0, Math.min(maxValue, newValue));
                        if (newValue !== sitesSlider.from) {
                          handleSitesChange(newValue, sitesSlider.to);
                        }
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener(
                          "mousemove",
                          handleMouseMove
                        );
                        document.removeEventListener("mouseup", handleMouseUp);
                      };
                      document.addEventListener("mousemove", handleMouseMove);
                      document.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      {sitesSlider.from}
                    </div>
                  </div>

                  {/* Visual Thumb for To */}
                  <div
                    className="absolute w-5 h-5 bg-white border-4 border-filterBtn rounded-md cursor-pointer z-40 shadow-lg hover:scale-110 transition-transform"
                    style={{
                      left: `calc(${(sitesSlider.to / 200) * 100}% - 12px)`,
                      top: "18px",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startValue = sitesSlider.to;
                      const minValue = sitesSlider.from;
                      const handleMouseMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaValue = (deltaX / 500) * 200;
                        let newValue = Math.round(startValue + deltaValue);
                        newValue = Math.max(minValue, Math.min(200, newValue));
                        if (newValue !== sitesSlider.to) {
                          handleSitesChange(sitesSlider.from, newValue);
                        }
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener(
                          "mousemove",
                          handleMouseMove
                        );
                        document.removeEventListener("mouseup", handleMouseUp);
                      };
                      document.addEventListener("mousemove", handleMouseMove);
                      document.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      {sitesSlider.to}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <!-- Location Dropdown --> */}
            <div class="flex gap-2">
              <div
                className="relative pl-4"
                onMouseEnter={() => {
                  if (!isLocationPopupOpen) setIsLocationPopupOpen(true);
                  setIsBiomarkerPopupOpen(false);
                  setIsCriteriaPopupOpen(false);
                  setIsBackbonePopupOpen(false);
                  setIsMoaComparatorPopupOpen(false);
                  setIsMoaInterventionPopupOpen(false);
                  setIsConditionPopupOpen(false);
                  setIsIntervantionPopupOpen(false);
                  setIsStudyStatusOpen(false);
                  setIsPhasePopupOpen(false);
                  setIsComparativePopupOpen(false);
                  setIsReadoutPopupOpen(false);
                  setIsNctIdPopupOpen(false);
                  setIsLeadResearcherPopupOpen(false);
                  setIsleadSponsorPopupOpen(false);
                }}
                onMouseLeave={() => setIsLocationPopupOpen(false)}
              >
                <div
                  ref={locationToggleRef}
                  className={`w-252w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
    transition-all duration-300 ease-in-out hover:scale-105 hover:border-black group
    focus:outline-none focus:ring-2 focus:ring-blue-400 
    flex items-center justify-between px-4 text-gray-500 text-sm`}
                >
                  <div className="flex items-center justify-between w-full">
                    {/* Left Section */}
                    <div className="flex items-center gap-2 overflow-hidden">
                      {selectedLocation.length === 0 ? (
                        <input
                          type="text"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          placeholder="Location"
                          autoFocus={isLocationPopupOpen}
                          className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 transition-colors duration-300 group-hover:text-black custom-placeholder"
                        />
                      ) : (
                        <>
                          {selectedLocation.slice(0, 2).map((item, idx) => (
                            <span
                              key={idx}
                              className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                            >
                              <button
                              className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(
                                  { name: item },
                                  "location",
                                  true,
                                );
                              }}
                            >
                                ×
                              </button>
                              <span className="truncate">{item}</span>
                            </span>
                          ))}
                          {selectedLocation.length > 2 && (
                            <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                              +{selectedLocation.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {/* Right Section (Map Icon) */}
                    <div className="ml-2 text-gray-500">
                      <img src={map} className="w-4 h-4" alt="map icon" />
                    </div>
                  </div>
                </div>

                {/* Popup */}
                {isLocationPopupOpen && (
                  <div
                    ref={locationDropdownRef}
                    className="absolute w-60 top-43x z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                  >
                    <div className="pr-1 max-h-40 overflow-y-auto">
                      {filteredLocation
                        .slice(0, showAllLocation ? filteredLocation.length : 5)
                        .map((location) => (
                          <label
                            key={location.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                          >
                            <input
                              type="checkbox"
                              className="mr-2 accent-blue-500"
                              checked={selectedLocation.includes(location.name)}
                              onChange={() =>
                                handleCheckboxChange(location, "location")
                              }
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                            {location.name}
                          </label>
                        ))}
                      {filteredLocation.length === 0 && (
                        <p className="text-xs text-gray-500 italic text-center py-2">
                          No results found
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="relative"
                onMouseEnter={() => {
                  if (!isFacilityPopupOpen) setIsFacilityPopupOpen(true);
                  setIsBiomarkerPopupOpen(false);
                  setIsCriteriaPopupOpen(false);
                  setIsBackbonePopupOpen(false);
                  setIsMoaComparatorPopupOpen(false);
                  setIsMoaInterventionPopupOpen(false);
                  setIsConditionPopupOpen(false);
                  setIsIntervantionPopupOpen(false);
                  setIsStudyStatusOpen(false);
                  setIsPhasePopupOpen(false);
                  setIsComparativePopupOpen(false);
                  setIsReadoutPopupOpen(false);
                  setIsNctIdPopupOpen(false);
                  setIsLeadResearcherPopupOpen(false);
                  setIsleadSponsorPopupOpen(false);
                  setIsLocationPopupOpen(false);
                }}
                onMouseLeave={() => setIsFacilityPopupOpen(false)}
              >
                <div
                  ref={facilityToggleRef}
                  className={`w-252w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
    transition-all duration-300 ease-in-out hover:scale-105 hover:border-black group
    focus:outline-none focus:ring-2 focus:ring-blue-400 
    flex items-center justify-between px-4 text-gray-500 text-sm`}
                >
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    {selectedFacility.length === 0 ? (
                      <input
                        type="text"
                        value={searchFacility}
                        onChange={(e) => setSearchFacility(e.target.value)}
                        placeholder="Facility Name"
                        autoFocus={isFacilityPopupOpen}
                        className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 
          transition-colors duration-300 group-hover:text-black custom-placeholder"
                      />
                    ) : (
                      <>
                        {selectedFacility.slice(0, 2).map((item, idx) => (
                          <span
                            key={idx}
                            className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                          >
                            <button
                              className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(
                                  { name: item },
                                  "facility",
                                  true,
                                );
                              }}
                            >
                              ×
                            </button>
                            <span className="truncate">{item}</span>
                          </span>
                        ))}
                        {selectedFacility.length > 2 && (
                          <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                            +{selectedFacility.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Popup */}
                {isFacilityPopupOpen && (
                  <div
                    ref={facilityDropdownRef}
                    className="absolute w-60 top-43x z-20 text-left p-4 border border-gray-200 rounded-sm shadow-2xl bg-white 
      transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                  >
                    <div className="pr-1 max-h-40 overflow-y-auto">
                      {filteredFacility
                        .slice(0, showAllFacility ? filteredFacility.length : 5)
                        .map((facility) => (
                          <label
                            key={facility.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors w-full whitespace-nowrap"
                          >
                            <input
                              type="checkbox"
                              className="mr-2 accent-blue-500 flex-shrink-0"
                              checked={selectedFacility.includes(facility.name)}
                              onChange={() =>
                                handleCheckboxChange(facility, "facility")
                              }
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                            <span className="truncate w-full">
                              {facility.name}
                            </span>
                          </label>
                        ))}

                      {filteredFacility.length === 0 && (
                        <p className="text-xs text-gray-500 italic text-center py-2">
                          No results found
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-36">
            <h2 className="text-left mt-5 font-bold  text-sm pl-4 py-1 text-filterHeader bg-lightGray rounded-tr-md rounded-br-md">
              Population Basic
            </h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium pl-4 pt-4 text-left">
              Age(Years)
            </label>
            <div className="relative w-500w pl-7 pt-2 mb-4">
              <div className="relative h-16">
                <div
                  className="absolute top-26x w-full h-1 bg-gray-200 rounded-lg"
                  style={{ top: "26px" }}
                ></div>
                <div
                  className="absolute h-1 bg-filterBtn rounded-lg"
                  style={{
                    left: `${(weightSlider.from / 150) * 100}%`,
                    width: `${((weightSlider.to - weightSlider.from) / 150) * 100
                      }%`,
                    top: "26px",
                  }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={weightSlider.from}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value <= weightSlider.to) {
                      handleAgeChange(value, weightSlider.to);
                    }
                  }}
                  className="absolute top-6 w-full h-2 cursor-pointer z-20 opacity-0"
                />
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={weightSlider.to}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= weightSlider.from) {
                      handleAgeChange(weightSlider.from, value);
                    }
                  }}
                  className="absolute top-6 w-full h-2 cursor-pointer z-30 opacity-0"
                />
                <div
                  className={`absolute w-5 h-5 bg-white border-4 border-filterBtn rounded-md cursor-pointer shadow-lg hover:scale-110 transition-transform ${isLocationPopupOpen || isFacilityPopupOpen ? "z-10" : "z-40"
                    }`}
                  style={{
                    left: `calc(${(weightSlider.from / 150) * 100}% - 12px)`,
                    top: "18px",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startValue = weightSlider.from;
                    const maxValue = weightSlider.to;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaValue = (deltaX / 500) * 150;
                      let newValue = Math.round(startValue + deltaValue);
                      newValue = Math.max(0, Math.min(maxValue, newValue));
                      if (newValue !== weightSlider.from) {
                        handleAgeChange(newValue, weightSlider.to);
                      }
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                    {weightSlider.from}
                  </div>
                </div>

                {/* Visual Thumb for To */}
                <div
                  className={`absolute w-5 h-5 bg-white border-4 border-filterBtn rounded-md cursor-pointer shadow-lg hover:scale-110 transition-transform ${isLocationPopupOpen || isFacilityPopupOpen ? "z-10" : "z-40"
                    }`}
                  style={{
                    left: `calc(${(weightSlider.to / 150) * 100}% - 12px)`,
                    top: "18px",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startValue = weightSlider.to;
                    const minValue = weightSlider.from;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaValue = (deltaX / 500) * 150;
                      let newValue = Math.round(startValue + deltaValue);
                      newValue = Math.max(minValue, Math.min(150, newValue));
                      if (newValue !== weightSlider.to) {
                        handleAgeChange(weightSlider.from, newValue);
                      }
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                    {weightSlider.to}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-sm text-left pl-4 ">
            <span className="font-bold">Sex</span>
            <div className="flex gap-5 pt-3">
              {genderChoice.map((choice) => {
                const isSelected = genderChosen === choice.value;
                return (
                  <label
                    key={choice.value}
                    className={`flex items-center cursor-pointer ${isSelected ? "text-black" : "text-gray-500"
                      }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={choice.value}
                      checked={isSelected}
                      onChange={() => {
                        setGenderChosen(choice.value);
                        handleCheckboxChange(choice.value, "sex");
                      }}
                      className="hidden"
                    />
                    <span
                      className={`w-4 h-4 mr-2 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-filterBtn" : "border-gray-400"
                        }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-filterBtn"></span>
                      )}
                    </span>
                    {choice.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* performance status */}
          <div>
            <h2 className="text-left mt-4 font-bold text-sm pl-4">
              Performance Status
            </h2>
            <div className="mt-2 space-y-4">
              {performanceStatusList.map((statuses, idx) => (
                <div key={idx} className="rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status, i) => {
                      const isSelected =
                        selectedPerformanceStatus.includes(status);
                      return (
                        <span
                          key={i}
                          onClick={() =>
                            handleCheckboxChange(status, "performanceStatus")
                          }
                          className={`ml-4 flex items-center gap-1 cursor-pointer text-sm px-2 rounded border border-lightGray hover:border-black transition-all 
                      ${isSelected
                              ? "bg-black text-white border-black"
                              : "bg-whiteCol text-gray-700 border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          {status}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-48">
            <h2 className="text-left mt-5 font-bold text-filterHeader bg-lightGray  text-sm pl-4 py-1  rounded-tr-md rounded-br-md">
              Sponsor & Transparency{" "}
            </h2>
          </div>
          <div>
            <h2 className="text-left mt-4 font-bold text-sm pl-4">
              Sponsor type
            </h2>
            <div className="mt-2 space-y-4">
              {sponsorList.map((sponsors, idx) => (
                <div key={idx} className="rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {sponsors.map((sponsor, i) => {
                      const isSelected = selectedSponsors.includes(sponsor);
                      return (
                        <span
                          key={i}
                          onClick={() =>
                            handleCheckboxChange(sponsor, "sponserType")
                          }
                          className={`ml-4 flex items-center gap-1 cursor-pointer text-xs px-2 rounded border border-lightGray hover:border-black text-sm transition-all ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-whiteCol text-gray-700 border-black hover:bg-gray-200 hover:text-black"
                            }`}
                        >
                          {isSelected && (
                            <img
                              src={clockIcon}
                              alt="clock"
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          {sponsor}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex pt-4 gap-2">
            <div
              className="relative pl-4"
              onMouseEnter={() => {
                if (!isleadSponsorPopupOpen) setIsleadSponsorPopupOpen(true);
                setIsConditionPopupOpen(false);
                setIsIntervantionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsPhasePopupOpen(false);
                setIsComparativePopupOpen(false);
                setIsStudyPhaseOpen(false);
                setIsStudyTypeOpen(false);
                setIsLocationPopupOpen(false);
                setIsFacilityPopupOpen(false);
                setIsLeadResearcherPopupOpen(false);
                setIsBiomarkerPopupOpen(false);
                setIsCriteriaPopupOpen(false);
                setIsBackbonePopupOpen(false);
                setIsNctIdPopupOpen(false);
                setIsMoaInterventionPopupOpen(false);
                setIsMoaComparatorPopupOpen(false);
                setIsReadoutPopupOpen(false);
              }}
              onMouseLeave={() => setIsleadSponsorPopupOpen(false)}
            >
              <div
                ref={leadSponsorToggleRef}
                className={`w-252w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
    transition-all duration-300 ease-in-out hover:scale-105 hover:border-black group
    focus:outline-none focus:ring-2 focus:ring-blue-400 
    flex items-center justify-between px-4 text-gray-500 text-sm`}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>

                  {selectedleadSponsor.length === 0 ? (
                    <input
                      type="text"
                      value={searchleadSponsor}
                      onChange={(e) => setSearchleadSponsor(e.target.value)}
                      placeholder="Lead Sponsor"
                      autoFocus={isleadSponsorPopupOpen}
                      className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 
          transition-colors duration-300 group-hover:text-black custom-placeholder"
                    />
                  ) : (
                    <>
                      {selectedleadSponsor.slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                        >
                          <button
                          className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(
                              { name: item },
                              "leadSponsor",
                              true,
                            );
                          }}
                        >
                            ×
                          </button>
                          <span className="truncate">{item}</span>
                        </span>
                      ))}
                      {selectedleadSponsor.length > 2 && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                          +{selectedleadSponsor.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isleadSponsorPopupOpen && (
                <div
                  ref={leadSponsorDropdownRef}
                  className="absolute w-60 top-43x z-20 text-left p-4 border border-gray-200 
      rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                >
                  <div className="pr-1 max-h-40 overflow-y-auto">
                    {filteredLeadSponsor
                      .slice(
                        0,
                        showAllleadSponsor ? filteredLeadSponsor.length : 5
                      )
                      .map((item) => (
                        <label
                          key={item.id}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors w-full whitespace-nowrap"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 accent-blue-500 flex-shrink-0"
                            checked={selectedleadSponsor.includes(item.name)}
                            onChange={() =>
                              handleCheckboxChange(item, "leadSponsor")
                            }
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          <span className="truncate w-full">{item.name}</span>
                        </label>
                      ))}
                    {filteredLeadSponsor.length === 0 && (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No results found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => {
                if (!isLeadResearcherPopupOpen)
                  setIsLeadResearcherPopupOpen(true);
                setIsConditionPopupOpen(false);
                setIsIntervantionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsPhasePopupOpen(false);
                setIsComparativePopupOpen(false);
                setIsStudyPhaseOpen(false);
                setIsStudyTypeOpen(false);
                setIsLocationPopupOpen(false);
                setIsFacilityPopupOpen(false);
                setIsleadSponsorPopupOpen(false);
                setIsBiomarkerPopupOpen(false);
                setIsCriteriaPopupOpen(false);
                setIsBackbonePopupOpen(false);
                setIsNctIdPopupOpen(false);
                setIsMoaInterventionPopupOpen(false);
                setIsMoaComparatorPopupOpen(false);
                setIsReadoutPopupOpen(false);
              }}
              onMouseLeave={() => setIsLeadResearcherPopupOpen(false)}
            >
              <div
                ref={leadResearcherToggleRef}
                className={`w-252w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
    transition-all duration-300 ease-in-out hover:scale-105 hover:border-black group
    focus:outline-none focus:ring-2 focus:ring-blue-400 
    flex items-center justify-between px-4 text-gray-500 text-sm`}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>

                  {selectedLeadResearcher.length === 0 ? (
                    <input
                      type="text"
                      value={searchLeadResearcher}
                      onChange={(e) => setSearchLeadResearcher(e.target.value)}
                      placeholder="Lead Researcher"
                      autoFocus={isLeadResearcherPopupOpen}
                      className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 
          transition-colors duration-300 group-hover:text-black custom-placeholder"
                    />
                  ) : (
                    <>
                      {selectedLeadResearcher.slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                        >
                          <button
                          className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(
                              { name: item },
                              "leadResearcher",
                              true,
                            );
                          }}
                        >
                            ×
                          </button>
                          <span className="truncate">{item}</span>
                        </span>
                      ))}
                      {selectedLeadResearcher.length > 2 && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                          +{selectedLeadResearcher.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isLeadResearcherPopupOpen && (
                <div
                  ref={leadResearcherDropdownRef}
                  className="absolute w-60 top-43x z-20 text-left p-4 border border-gray-200 
      rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                >
                  <div className="pr-1 max-h-40 overflow-y-auto">
                    {filteredLeadResearcher
                      .slice(
                        0,
                        showAllLeadResearcher
                          ? filteredLeadResearcher.length
                          : 5
                      )
                      .map((item) => (
                        <label
                          key={item.id}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 accent-blue-500"
                            checked={selectedLeadResearcher.includes(item.name)}
                            onChange={() =>
                              handleCheckboxChange(item, "leadResearcher")
                            }
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          {item.name}
                        </label>
                      ))}
                    {filteredLeadResearcher.length === 0 && (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No results found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result Posted Group */}
          <div className="text-sm text-left pl-4 pt-4">
            <span className="font-bold">Result Posted</span>
            <div className="flex gap-5 pt-3">
              {choices.map((choice) => {
                const isSelected = resultChosen === choice.value;
                return (
                  <label
                    key={choice.value}
                    className={`flex items-center cursor-pointer ${isSelected ? "text-black" : "text-gray-500"
                      }`}
                  >
                    <input
                      type="radio"
                      name="resultPosted"
                      value={choice.value}
                      checked={isSelected}
                      onChange={() => {
                        setResultChosen(choice.value);
                        handleCheckboxChange(choice.value, "resultPosted");
                      }}
                      className="hidden"
                    />
                    <span
                      className={`w-4 h-4 mr-2 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-filterBtn" : "border-gray-400"
                        }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-filterBtn"></span>
                      )}
                    </span>
                    {choice.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="w-36">
            <h2 className="text-left mt-5 font-bold text-filterHeader bg-lightGray  text-sm pl-4 py-1  rounded-tr-md rounded-br-md">
              Study Details
            </h2>
          </div>
          <div className="text-sm">
            <h2 className="text-left mt-4 font-bold text-sm pl-4">
              Study Document
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 pl-4">
              {studyDocument.map((choice) => {
                const isSelected = selectedStudyDocument.includes(choice.value);
                return (
                  <label
                    key={choice.value}
                    className={`flex items-center gap-2 whitespace-nowrap cursor-pointer basis-[48%] ${isSelected ? "text-black" : "text-gray-500"
                      }`}
                    onClick={() =>
                      handleCheckboxChange(choice.value, "studyDocument")
                    }
                  >
                    <input
                      type="checkbox"
                      name="studyDocument"
                      value={choice.value}
                      checked={isSelected}
                      onChange={() =>
                        handleCheckboxChange(choice.value, "studyDocument")
                      }
                      className="cursor-pointer"
                      style={{
                        accentColor: "filterBtn",
                      }}
                    />
                    {choice.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-6  mt-4 pl-4 pr-4">
            <div>
              <h3 className="text-left font-medium">Study Start</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="relative">
                    {/* Placeholder text */}
                    {!studyStartFrom && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        From
                      </span>
                    )}
                    <input
                      type="date"
                      value={studyStartFrom}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStudyStartFrom(value);
                        handleCheckboxChange(value, "studyStartFrom");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
      ${studyStartFrom ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
                {/* To Date */}
                <div>
                  <div className="relative">
                    {/* Placeholder text */}
                    {!studyStartTo && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        To
                      </span>
                    )}
                    <input
                      type="date"
                      value={studyStartTo}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStudyStartTo(value);
                        handleCheckboxChange(value, "studyStartTo");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
      ${studyStartTo ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Primary Completion */}
            <div>
              <h3 className="text-left font-medium">Primary Completion</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* From Date */}
                <div>
                  <div className="relative">
                    {/* Placeholder text */}
                    {!primaryCompletionFrom && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        From
                      </span>
                    )}
                    <input
                      type="date"
                      value={primaryCompletionFrom}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPrimaryCompletionFrom(value);
                        handleCheckboxChange(value, "primaryCompletionFrom");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
          ${primaryCompletionFrom ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
                {/* To Date */}
                <div>
                  <div className="relative">
                    {/* Placeholder text */}
                    {!primaryCompletionTo && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        To
                      </span>
                    )}
                    <input
                      type="date"
                      value={primaryCompletionTo}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPrimaryCompletionTo(value);
                        handleCheckboxChange(value, "primaryCompletionTo");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
          ${primaryCompletionTo ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* First Posted */}
            <div>
              <h3 className="text-left font-medium">First Posted</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* From */}
                <div>
                  <div className="relative">
                    {/* Placeholder text */}
                    {!firstPostedFrom && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        From
                      </span>
                    )}
                    <input
                      type="date"
                      value={firstPostedFrom}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFirstPostedFrom(value);
                        handleCheckboxChange(value, "firstPostedFrom");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
          ${firstPostedFrom ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    {/* Placeholder text */}
                    {!firstPostedTo && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        To
                      </span>
                    )}
                    <input
                      type="date"
                      value={firstPostedTo}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFirstPostedTo(value);
                        handleCheckboxChange(value, "firstPostedTo");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
          ${firstPostedTo ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Result First Posted */}
            <div>
              <h3 className="text-left font-medium">Result First Posted</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="relative">
                    {!resultFirstPostedFrom && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        From
                      </span>
                    )}
                    <input
                      type="date"
                      value={resultFirstPostedFrom}
                      onChange={(e) => {
                        const value = e.target.value;
                        setResultFirstPostedFrom(value);
                        handleCheckboxChange(value, "resultFirstPostedFrom");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
          ${resultFirstPostedFrom ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    {!resultFirstPostedTo && (
                      <span className="absolute left-3 top-2 text-gray-400 pointer-events-none">
                        To
                      </span>
                    )}
                    <input
                      type="date"
                      value={resultFirstPostedTo}
                      onChange={(e) => {
                        const value = e.target.value;
                        setResultFirstPostedTo(value);
                        handleCheckboxChange(value, "resultFirstPostedTo");
                      }}
                      className={`w-full border rounded-md p-2 pl-3 text-sm cursor-pointer
          ${resultFirstPostedTo ? "text-gray-900" : "text-transparent"}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              className="relative py-4"
              onMouseEnter={() => {
                if (!isNctIdPopupOpen) setIsNctIdPopupOpen(true);
                setIsComparativePopupOpen(false);
                setIsConditionPopupOpen(false);
                setIsIntervantionPopupOpen(false);
                setIsStudyStatusOpen(false);
                setIsPhasePopupOpen(false);
                setIsStudyPhaseOpen(false);
                setIsStudyTypeOpen(false);
                setIsLocationPopupOpen(false);
                setIsFacilityPopupOpen(false);
                setIsleadSponsorPopupOpen(false);
                setIsLeadResearcherPopupOpen(false);
                setIsBiomarkerPopupOpen(false);
                setIsCriteriaPopupOpen(false);
                setIsBackbonePopupOpen(false);
                setIsMoaInterventionPopupOpen(false);
                setIsMoaComparatorPopupOpen(false);
                setIsReadoutPopupOpen(false);
              }}
              onMouseLeave={() => setIsNctIdPopupOpen(false)}
            >
              <div
                ref={nctIdToggleRef}
                className={`w-510w h-11 p-2 rounded-md border border-gray-300 bg-inputBg shadow-md cursor-text 
    transition-all duration-300 ease-in-out hover:scale-105 hover:border-black group
    focus:outline-none focus:ring-2 focus:ring-blue-400 
    flex items-center justify-between px-4 text-gray-500 text-sm`}
              >
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <span className="text-gray-500 shrink-0 transition-colors duration-300 group-hover:text-black">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                  {selectedNctId.length === 0 ? (
                    <input
                      type="text"
                      value={searchNctId}
                      onChange={(e) => setSearchNctId(e.target.value)}
                      placeholder="Trial ID Search"
                      autoFocus={isNctIdPopupOpen}
                      className="w-full outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-500 
          transition-colors duration-300 group-hover:text-black custom-placeholder"
                    />
                  ) : (
                    <>
                      {selectedNctId.slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded truncate max-w-[100px]"
                        >
                          <button
                          className="mr-1 text-[10px] text-gray-500 hover:text-red-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                              handleCheckboxChange(
                                { name: item },
                                "nctId",
                                true,
                              );
                          }}
                        >
                            ×
                          </button>
                          <span className="truncate">{item}</span>
                        </span>
                      ))}
                      {selectedNctId.length > 2 && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded shrink-0">
                          +{selectedNctId.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isNctIdPopupOpen && (
                <div
                  ref={nctIdDropdownRef}
                  className="absolute mt-2 w-510w z-20 text-left p-4 border border-gray-200 
      rounded-sm shadow-2xl bg-white transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
                  style={{
                    top:
                      filteredNctId.length === 0
                        ? "-55px"
                        : filteredNctId.length === 1
                          ? "-50px"
                          : filteredNctId.length <= 2
                            ? "-105px"
                            : filteredNctId.length <= 4
                              ? "-130px"
                              : "-150px",
                  }}
                >
                  <div className="pr-1 max-h-40 overflow-y-auto">
                    {filteredNctId
                      .slice(0, showAllNctId ? filteredNctId.length : 5)
                      .map((item) => (
                        <label
                          key={item.id}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="flex items-center mb-2 text-xs text-gray-600 hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 accent-blue-500"
                            checked={selectedNctId.includes(item.name)}
                            onChange={() => handleCheckboxChange(item, "nctId")}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          <span className="truncate w-full">{item.name}</span>
                        </label>
                      ))}
                    {filteredNctId.length === 0 && (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No results found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex sticky bottom-0 justify-end z-50 mt-3 space-x-3 bg-white p-2">
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded-md hover:text-gray-700 transition-all"
              onClick={onFilterClose}
            >
              Cancel
            </button>
            <button
              className="popup-apply-btn flex items-center justify-center gap-2"
              onClick={() => handleShowResults("condition")}
              disabled={
                isCountLoading ||
                ((selectedConditions?.length > 0 ||
                  selectedInterventional?.length > 0 ||
                  selectedComparative?.length > 0 ||
                  selectedLocation?.length > 0 ||
                  selectedFacility?.length > 0 ||
                  selectedMoaIntervention?.length > 0 ||
                  selectedMoaComparator?.length > 0 ||
                  selectedNctId?.length > 0 ||
                  selectedBackbone?.length > 0 ||
                  selectedCriteria?.length > 0 ||
                  selectedBiomarker?.length > 0 ||
                  selectedleadSponsor?.length > 0 ||
                  selectedLeadResearcher?.length > 0 ||
                  selectedComparativeType?.length > 0 ||
                  selectedPhases?.length > 0 ||
                  selectedStudyStatus?.length > 0 ||
                  selectedStudyTypes.length > 0 ||
                  selectedEndpoints?.length > 0 ||
                  selectedLineOfTherapy?.length > 0 ||
                  selectedStages?.length > 0 ||
                  selectedPerformanceStatus?.length > 0 ||
                  selectedSponsors?.length > 0 ||
                  selectedStudyDocument?.length > 0 ||
                  chosen ||
                  blindChosen ||
                  genderChosen ||
                  resultChosen ||
                  studyStatusChosen ||
                  customStartDate ||
                  customEndDate ||
                  Object.keys(sliderValues)?.length > 0) &&
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
                  Show {conditionCount > 0 ? Number(conditionCount).toLocaleString() : ""} Result
                  {conditionCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
          <style jsx>{`
            .group:hover .custom-placeholder::placeholder {
              color: black;
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
              font-family: Rubik;
            }

            .responsive-checkbox-label:hover {
              color: #2563eb;
              background: #dbeafe;
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default FilterAll;