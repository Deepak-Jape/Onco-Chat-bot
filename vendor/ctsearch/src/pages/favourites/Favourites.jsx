import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { fetchTrials } from "../../redux/actions/searchAction";

import saveBlue from "../../assets/bookmark-line.png";
import saveWhite from "../../assets/saveWhite.png";
import download from "../../assets/download_2.png";
import help from "../../assets/help (1).png";
import icon from "../../assets/Icon.png";
import ExecutiveResult from "../../pages/trialsHeader/trials/ExecutiveResult";
import shareIcon from "../../assets/icons/share-icon.svg";
import alertIcon from "../../assets/icons/alert-icon.svg";
import exportIcon from "../../assets/icons/export-icon.svg";
import ParticipationIcons from "../../assets/icons/participanticon.svg";
import { LocationIcon } from "../../assets";

// const sampleContacts = [
//   {
//     title: "Primary Contact",
//     items: [
//       { label: "Name", value: "Jana Musilova, PhD", icon: "user" },
//       { label: "Phone", value: "+41 031 389 91 91", icon: "phone" },
//       {
//         label: "Email",
//         value: "trials@swisscancerinstitute.ch",
//         icon: "email",
//       },
//     ],
//   },
//   {
//     title: "Secondary Contact",
//     items: [
//       { label: "Name", value: "John Doe", icon: "user" },
//       { label: "Phone", value: "+41 123 456 789", icon: "phone" },
//       { label: "Email", value: "john@example.com", icon: "email" },
//     ],
//   },
//   {
//     title: "seccccc Contact",
//     items: [
//       { label: "Name", value: "John Doe", icon: "user" },
//       { label: "Phone", value: "+41 123 456 789", icon: "phone" },
//       { label: "Email", value: "john@example.com", icon: "email" },
//     ],
//   },
// ];
function Icon({ type }) {
  const baseClass = "w-5 h-5 shrink-0 mt-0.5";
  if (type === "user")
    return (
      <svg
        className={baseClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.121 17.804A9.004 9.004 0 0112 15c2.485 0 4.735.998 6.364 2.637M15 10a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    );
  if (type === "phone")
    return (
      <svg
        className={baseClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.293 4.293a1 1 0 00.217.957l1.414 1.414a1 1 0 001.414 0L12 18l2.828 2.828a1 1 0 001.414 0l1.414-1.414a1 1 0 00.217-.957L17 13"
        />
      </svg>
    );
  return (
    <svg
      className={baseClass}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
const Favorites = ({ filters = {}, counts = {} }) => {
  const dispatch = useDispatch();
  const [hoveredCard, setHoveredCard] = useState(null);
  const trials = useSelector((state) => state.conditionData.trials);
  const countData = useSelector((state) => state.conditionData.count);
  // Add this component inside your Favorites component
  const SafeRender = ({ children, fallback = "Not available" }) => {
    try {
      if (children === null || children === undefined) return fallback;
      if (typeof children === "string" || typeof children === "number")
        return children;
      if (Array.isArray(children)) return children.join(", ");
      if (typeof children === "object") {
        console.warn("SafeRender: Attempted to render object:", children);
        return fallback;
      }
      return children;
    } catch (error) {
      console.error("SafeRender error:", error);
      return fallback;
    }
  };
  // const studyData = [
  //   { label: "Study Phase", value: "Phase 3" },
  //   { label: "Primary Purpose", value: "Prevention" },
  //   { label: "Indication", value: "Prophylaxis against HIV infection" },
  //   { label: "Study Type", value: "Interventional" },
  //   {
  //     label: "Interventional: Model",
  //     value: "Parallel This is a multi site study.",
  //   },
  //   { label: "Type of control", value: "Active Comparator" },
  //   { label: "Study Blinding", value: "Double – blind" },
  //   { label: "Blinding Roles", value: "Participant , Investigator , Sponser" },
  //   {
  //     label: "Estimated Duration Of study",
  //     value:
  //       "The Sponsor estimates that the study will require approximately 27 months from the time the first participant (or their legally acceptable representative) provides ",
  //   },
  // ];
  // const armsData = [
  //   {
  //     title: "Arm A (Monotherapy)",
  //     arms: [
  //       {
  //         name: "Active Arm",
  //         dosage: "200 mg orally once daily",
  //         schedule: "Continuous daily dosing in 28-day cycles",
  //         duration:
  //           "Until progression or unacceptable toxicity (up to 24 months)",
  //         patients: "200 (planned)",
  //       },
  //       {
  //         name: "Arm B (Combination therapy)",
  //         dosage:
  //           "Investigational drug 150 mg PO once daily + Agent X 100 mg IV q8w",
  //         schedule:
  //           "Daily oral drug in 28-day cycles + Agent X IV every 3 weeks",
  //         duration:
  //           "Until progression or unacceptable toxicity (combination phase up to 12 months, single-agent extension optional)",
  //         patients: "200 (planned)",
  //       },
  //       {
  //         name: "Arm B (Combination therapy)",
  //         dosage:
  //           "Investigational drug 150 mg PO once daily + Agent X 100 mg IV q8w",
  //         schedule:
  //           "Daily oral drug in 28-day cycles + Agent X IV every 3 weeks",
  //         duration:
  //           "Until progression or unacceptable toxicity (combination phase up to 12 months, single-agent extension optional)",
  //         patients: "200 (planned)",
  //       },
  //     ],
  //   },
  // ];
  // const followUpProcedure = [
  //   { label: "Imaging frequency", value: "Every 8 weeks during treatment" },
  //   { label: "Safety follow-up period", value: "6 months after last dose" },
  //   { label: "Average visits", value: "10 visits/year" },
  //   {
  //     label: "Procedures (per patient)",
  //     value: "2 biopsies, 6 CT scans, 10 blood draws",
  //   },
  // ];
  const saveButtonRef = useRef(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [selectedIdData, setSelectedIdData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState([]);
  const [activeTab, setActiveTab] = useState("study");
  const [activeCountry, setActiveCountry] = useState(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllSites, setShowAllSites] = useState(false);
  // Set first country as default
  useEffect(() => {
    if (selectedIdData?.sites_locations?.value?.length > 0) {
      setActiveCountry(selectedIdData.sites_locations.value[0]);
    }
  }, [selectedIdData]);
  const countries = selectedIdData?.sites_locations?.value || [];
  const displayedCountries = showAllCountries
    ? countries
    : countries.slice(0, 5);
  const selectedSites = activeCountry?.facility?.value || [];
  const displayedSites = showAllSites
    ? selectedSites
    : selectedSites.slice(0, 5);

  const cardsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  // Optional: Auto select first card of current page
  const [selectedCard, setSelectedCard] = useState(0);

  const prevFiltersRef = useRef();
  const prevPageRef = useRef();

  useEffect(() => {
    const filtersChanged =
      JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    const pageChanged = currentPage !== prevPageRef.current;

    if (filtersChanged || pageChanged) {
      dispatch(fetchTrials(filters, cardsPerPage, currentPage));
    }

    prevFiltersRef.current = filters;
    prevPageRef.current = currentPage;
  }, [filters, currentPage, dispatch]);
  
  const filteredCards = trials || [];
  const currentCards = filteredCards; // no slicing — backend paginates
  const totalPages = Math.ceil(
    counts?.conditionCount / cardsPerPage ||
    countData?.trial_count / cardsPerPage
  );
  useEffect(() => {
    if (!saveButtonRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyHeader(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(saveButtonRef.current);
    return () => {
      if (saveButtonRef.current) observer.unobserve(saveButtonRef.current);
    };
  }, []);
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen((prev) => !prev);
  const handelGetCardDetails = async (card, nct_id) => {
    setSelectedCard(card);
    try {
      const res = await axios.get(
        `https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net/search/ExecutiveSummary/?NCTId=${nct_id}`
      );
      setSelectedIdData(res.data);
    } catch (err) {
      console.error("Error fetching card details:", err);
    }
  };

  const [favoritesActiveTab, setFavoritesActiveTab] = useState("saved");
  const exclusion =
    selectedIdData?.study_details?.study_at_a_glance?.value?.population?.value
      ?.exclusion || [];
  const inclusion =
    selectedIdData?.study_details?.study_at_a_glance?.value?.population?.value
      ?.inclusion || [];
  const [showAll, setShowAll] = useState(false);
  // Show only first 5 if collapsed
  const exclusionToShow = showAll ? exclusion : exclusion.slice(0, 5);
  const inclusionToShow = showAll ? inclusion : inclusion.slice(0, 5);
  const totalCount = Math.max(exclusion.length, inclusion.length);
  const hiddenCount = totalCount - 5;
  return (
    <>
      {filteredCards.length === 0 ? (
        <div className="text-center w-full h-screen z-20 text-gray-600 text-lg">
          No Records Found
        </div>
      ) : (
        <>
          <div className="pt-4 relative z-30 bg-mainBlue">
            {/* <h2 className="text-2xl text-left font-bold mb-3">Favorites</h2> */}
            <div className="flex flex-wrap space-x-3 sm:space-x-6 border-b border-gray-200">
              {/* Saved Trials Tab */}
              <button
                onClick={() => setFavoritesActiveTab("saved")}
                className={`flex items-center space-x-2 p-2 rounded-lg font-semibold pb-2 transition-colors duration-200 ${favoritesActiveTab === "saved"
                  ? " text-blue-800"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <span>Saved Trials</span>
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${favoritesActiveTab === "saved"
                    ? "bg-gray-200 text-blue-800"
                    : "bg-gray-200 text-gray-600"
                    }`}
                >
                  02
                </span>
              </button>

              {/* Search Alerts Tab */}
              <button
                onClick={() => setFavoritesActiveTab("alerts")}
                className={`flex items-center space-x-2 p-2 rounded-lg font-semibold pb-2 transition-colors duration-200 ${favoritesActiveTab === "alerts"
                  ? " text-blue-800"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <span>Search Alerts</span>
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${favoritesActiveTab === "alerts"
                    ? " text-blue-800 bg-gray-200"
                    : "bg-gray-200 text-gray-600"
                    }`}
                >
                  03
                </span>
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row w-full h-screen space-y-3 lg:space-y-0 lg:space-x-3 z-30 bg-mainBlue pr-2 sm:pr-5">
            {/* Left: Left Panel */}
            <div
              className="w-80 h-full flex flex-col font-inter"
              style={{
                maxHeight: "calc(100vh - 12rem)",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Fixed Header */}
              <div className="sticky top-0 z-10 bg-warning rounded-sm mt-2 sm:mt-3 px-2 sm:px-4  py-2 sm:py-3 shadow-sm text-left flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 gap-2 sm:gap-0">
                {/* Left Section */}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-black truncate">
                    2 Trial Saved
                  </span>
                </div>
                {/* Right: Set Alert Section */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 sm:gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Filter Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="black"
                      className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6h18M3 12h12M3 18h8"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div
                className="mt-4 space-y-1 flex-1 overflow-y-auto"
                style={{
                  maxHeight: "calc(100vh - 12rem)",
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE and Edge
                }}
              >
                <style>
                  {`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}
                </style>
                {currentCards?.map((card, index) => (
                  <div
                    key={`${card.nct_id}-${index}`}
                    className={`w-full bg-white shadow-sm rounded-md p-2 sm:p-4 border cursor-pointer transition-all duration-200 ${selectedCard?.nct_id === card.nct_id
                      ? "border-blue-600 border-4"
                      : "border-gray-200 border-4"
                      }`}
                    onClick={() => handelGetCardDetails(card, card.nct_id)}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm mb-1 sm:mb-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="text-gray-600 font-medium break-words text-xs">
                          {card.nct_id}
                        </span>
                        <FontAwesomeIcon
                          icon={faUpRightFromSquare}
                          className="w-2 sm:w-3 h-2 sm:h-3 text-gray-500 flex-shrink-0"
                        />
                        <span
                          className={`bg-${card.phases === "PHASE1"
                            ? "red"
                            : card.phases === "PHASE2"
                              ? "orange"
                              : "purple"
                            }-100 text-${card.phases === "PHASE1"
                              ? "red"
                              : card.phases === "PHASE2"
                                ? "orange"
                                : "purple"
                            }-700 text-xs font-medium px-1 sm:px-2 py-0.5 rounded`}
                        >
                          {card.phases}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 mt-1 sm:mt-0">
                        {/* <span className={`bg-${card.overall_status === "RECRUITING" ? "pink" : "green"}-100 text-${card.overall_status === "RECRUITING" ? "pink" : "green"}-700 text-xs font-medium px-1 sm:px-2 py-0.5 rounded`}>
                                                        {card.overall_status}
                                                    </span> */}
                      </div>

                      <img src={saveBlue} className="w-4 h-4" />
                    </div>
                    {/* Title */}
                    <h2 className="text-xs sm:text-sm text-left font-semibold line-clamp-2 mb-1 sm:mb-2 break-words">
                      {card.brief_title}
                    </h2>
                    {/* Conditions */}
                    <div className="flex justify-between font-semibold pb-1 text-xs">
                      <p>Conditions</p>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-1 sm:mb-2">
                      {card.conditions.slice(0, 2).map((condition, idx) => (
                        <div
                          key={idx}
                          className="flex items-center bg-gray-100 text-gray-700 hover:text-black text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded break-words mr-1 sm:mr-2 mb-1 sm:mb-2"
                        >
                          <span>{condition}</span>
                        </div>
                      ))}
                      {card.conditions.length > 2 && (
                        <div
                          className="flex items-center bg-blue-500 hover:bg-black text-white text-xs font-medium px-1 sm:px-2 mb-1 sm:mb-2 rounded-md cursor-pointer"
                          onClick={() => {
                            setModalItems(card.conditions);
                            setModalTitle("Conditions");
                            setIsModalOpen(true);
                          }}
                        >
                          +{card.conditions.length - 2}
                        </div>
                      )}
                    </div>
                    {/* Location and Participants */}
                    <div className="flex flex-col sm:flex-row justify-between font-semibold text-xs gap-1 sm:gap-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 font-medium rounded-full flex-shrink-0 break-words">
                        <img
                          style={{
                            width: "14px",
                            height: "14px",
                          }}
                          src={LocationIcon}
                          className="w-5 h-4"
                        />
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {card?.locations
                            ?.slice(0, 2)
                            ?.map((location, idx) => (
                              <div
                                key={idx}
                                className="flex items-center text-gray-700 text-xs rounded break-words pt-1 sm:pt-2 mb-1 sm:mb-2"
                              >
                                <span>{location}</span>
                              </div>
                            ))}
                          {card?.locations?.length > 2 && (
                            <div
                              className="flex items-center bg-blue-500 text-white hover:bg-black text-xs font-medium px-1 sm:px-2 mt-2 sm:mt-3 mb-1 sm:mb-2 pb-0.5 sm:pb-1 rounded-md cursor-pointer"
                              onClick={() => {
                                setModalItems(card?.locations);
                                setModalTitle("Locations");
                                setIsModalOpen(true);
                              }}
                            >
                              +{card?.locations?.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-medium px-1 sm:px-2 py-1 rounded-full flex-shrink-0 break-words">
                        <img
                          style={{
                            width: "14px",
                            height: "14px",
                          }}
                          src={ParticipationIcons}
                        />
                        <span>{card.participants}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center space-x-3 text-sm mt-6 mb-10 bg-gray-50 py-3 rounded-md border border-gray-200">
                <span className="text-gray-700">Page</span>

                <span className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-800 font-medium">
                  {currentPage}
                </span>

                <span className="text-gray-700">of {totalPages}</span>

                <button
                  className={`px-3 py-1 border rounded ${currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                  onClick={() =>
                    currentPage > 1 && handlePageChange(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                >
                  Prev
                </button>

                <button
                  className={`px-3 py-1 border rounded ${currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                  onClick={() =>
                    currentPage < totalPages &&
                    handlePageChange(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
            {/* Right: Side Panel */}
            <div
              className="flex-1 overflow-y-auto space-y-6 pl-2 min-w-0 lg:pr-10 xl:pr-40 2xl:pr-40 mx-auto max-w-screen lg:max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1600px]  border-l border-gray-300 text-left bg-white "
              style={{ maxHeight: "calc(100vh - 13rem)" }}
            >
              {selectedCard ? (
                <>
                  <div>
                    {!showStickyHeader && (
                      <div className="mt-2 sm:mt-4">
                        <a
                          href="#"
                          className="text-blue-600 text-xs sm:text-sm font-medium underline"
                        >
                          <SafeRender>
                            {selectedIdData?.top_info?.value?.nctid?.value}
                          </SafeRender>
                        </a>
                        <h2 className="text-xl sm:text-2xl font-semibold mt-1 mb-1 sm:mb-2 lg-custom:pr-32">
                          <SafeRender>
                            {
                              selectedIdData?.top_info?.value?.study_title
                                ?.value
                            }
                          </SafeRender>
                        </h2>
                      </div>
                    )}
                    {/* Sponsor Section - Completely rewritten for safety */}
                    <div className="gap-x-2 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-700 lg-custom:pr-32">
                      <div className="flex flex-col sm:flex-row items-start mt-4 sm:mt-8 sm:items-center text-xs sm:text-sm text-gray-700">
                        <div className="flex-1 w-full sm:w-auto mb-2 sm:mb-0">
                          <span className="text-gray-500 block">
                            {selectedIdData?.top_info?.value?.sponsor?.title ||
                              "Sponsor"}
                          </span>
                          <p className="font-semibold">
                            <SafeRender>
                              {selectedIdData?.top_info?.value?.sponsor?.value}
                            </SafeRender>
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 border-l border-gray-300 mx-4"></div>
                        <div className="flex-1 w-full sm:w-auto mb-2 sm:mb-0">
                          <span className="text-gray-500 block">
                            {selectedIdData?.top_info?.value?.latest_update
                              ?.title || "Latest Update"}{" "}
                          </span>
                          <p className="font-semibold">
                            <SafeRender>
                              {
                                selectedIdData?.top_info?.value?.latest_update
                                  ?.value
                              }
                            </SafeRender>
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 border-l border-gray-300 mx-4"></div>
                        <div className="flex-1 w-full sm:w-auto">
                          <span className="text-gray-500 block">
                            {selectedIdData?.top_info?.value?.reporting_unit
                              ?.title || "Reporting Unit"}
                          </span>
                          <p className="font-semibold">
                            <SafeRender>
                              {
                                selectedIdData?.top_info?.value?.reporting_unit
                                  ?.value
                              }
                            </SafeRender>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start text-xs sm:text-sm text-gray-700 mt-2 sm:mt-3">
                        <div className="flex-1 w-full sm:w-auto mb-2 sm:mb-0">
                          <span className="text-gray-500 block">
                            {selectedIdData?.top_info?.value?.status?.title ||
                              "Status"}
                          </span>
                          <p className="font-semibold text-orangeWarning">
                            <SafeRender>
                              {selectedIdData?.top_info?.value?.status?.value}
                            </SafeRender>
                          </p>
                        </div>
                        <div className="flex-1 w-full sm:w-auto border-l border-gray-300 sm:pl-4 mb-2 sm:mb-0">
                          <span className="text-gray-500 pl-0 sm:pl-4 block">
                            {selectedIdData?.top_info?.value?.phase?.title ||
                              "Phase"}
                          </span>
                          <p className="font-semibold pl-0 sm:pl-4">
                            <SafeRender>
                              {selectedIdData?.top_info?.value?.phase?.value}
                            </SafeRender>
                          </p>
                        </div>
                        <div className="flex-1 w-full sm:w-auto border-l border-gray-300 sm:ml-4 mb-2 sm:mb-0">
                          <span className="text-gray-500 ml-0 sm:ml-4 block">
                            {selectedIdData?.top_info?.value?.condition
                              ?.title || "Condition"}
                          </span>
                          <p className="font-semibold ml-0 sm:ml-4">
                            <SafeRender>
                              {
                                selectedIdData?.top_info?.value?.condition
                                  ?.value
                              }
                            </SafeRender>
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons - marker for sticky */}
                    <div
                      ref={saveButtonRef}
                      className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-4 "
                    >
                      <button className="flex w-full sm:w-87w h-44x items-center justify-center gap-2 px-2 sm:px-3 sm:px-4 py-2 border border-blue-300 rounded-md text-xs sm:text-sm font-semibold bg-filterBtn text-white hover:bg-blue-700 transition-all duration-300 ease-out shadow-sm fa-bookmark">
                        <img src={saveWhite} className="w-4 h-4" />
                        <span className="fa-bookmark">Save</span>
                      </button>
                      <button className="flex items-center w-full sm:w-120w gap-2 px-2 sm:px-3 sm:px-4 h-44x border-2 border-blue-600 text-blue-600 rounded-md">
                        <img src={download} className="w-3 h-4" />
                        <span className="font-medium">Download</span>
                      </button>
                      <div className="relative inline-block">
                        <button
                          className="flex h-44x w-full sm:w-48w items-center justify-center gap-2 px-2 sm:px-3 sm:px-4 py-3 rounded-md text-xs sm:text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-200 transition-all duration-200 hover:border-blue-700 border-2 border-filterBtn shadow-sm"
                          onClick={toggleMenu}
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-gray-600"></i>
                        </button>
                        {open && (
                          <div className="absolute right-0 left-0 sm:left-auto sm:right-auto mt-2 w-full sm:w-40 bg-white border border-gray-200 rounded-sm shadow-lg z-10">
                            <ul className="py-1">
                              <li className="flex items-center gap-2 px-2 sm:px-3 sm:px-4 py-2 text-filterBtn hover:bg-gray-100 cursor-pointer hover:animate-vibrate">
                                <img
                                  src={shareIcon}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                  }}
                                />
                                Share
                              </li>

                              <li className="flex items-center gap-2 px-2 sm:px-3 sm:px-4 py-2 text-filterBtn hover:bg-gray-100 cursor-pointer hover:animate-vibrate">
                                <img
                                  src={exportIcon}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                  }}
                                />
                                Export
                              </li>

                              <li className="flex items-center gap-2 px-2 sm:px-3 sm:px-4 py-2 text-filterBtn hover:bg-gray-100 cursor-pointer hover:animate-vibrate">
                                <img
                                  src={alertIcon}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                  }}
                                />
                                Alert
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* two tabs....................... */}
                  <div className="w-full lg-custom:pr-32">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                      <div className="flex flex-wrap space-x-2 sm:space-x-6 -mx-2 sm:-mx-4 sm:-mx-0">
                        {/* Study Details Tab */}
                        <button
                          className={`py-1 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium ${activeTab === "study"
                            ? "text-blue-600 border-b-2 border-blue-600"
                            : "text-gray-400"
                            }`}
                          onClick={() => setActiveTab("study")}
                        >
                          Study Details
                        </button>
                        {/* Result Tab */}
                        <button
                          className={`py-1 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium ${activeTab === "result"
                            ? "text-blue-600 border-b-2 border-blue-600"
                            : "text-gray-400"
                            }`}
                        // onClick={() => setActiveTab("result")}
                        >
                          Result
                        </button>
                      </div>
                    </div>
                    {/* Tab Content */}
                    <div className="mt-2 sm:mt-4">
                      {activeTab === "study" && (
                        <div>
                          <h1 className="text-lg sm:text-xl font-bold">
                            <SafeRender>
                              {
                                selectedIdData?.study_details
                                  ?.trial_quality_scores?.title
                              }
                            </SafeRender>
                          </h1>
                          {/* Evidence / Operational / Differentiation */}
                          <div className="max-w-4xl mx-auto mt-2">
                            <section
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 transition-all duration-1000 ease-out"
                              style={{
                                paddingBottom: hoveredCard ? "100px" : "0",
                              }}
                            >
                              {/* Card 1: Evidence Strength */}
                              <div
                                className="h-140x relative group border rounded-md p-3 sm:p-5 bg-blue-50 text-left shadow-sm hover:shadow-md transition-all duration-1000 ease-out"
                                onMouseEnter={() => setHoveredCard("evidence")}
                                onMouseLeave={() => setHoveredCard(null)}
                              >
                                <div className="flex gap-2 sm:gap-4">
                                  <div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-700">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.title
                                        }
                                      </SafeRender>
                                    </p>
                                  </div>
                                  <div>
                                    <img
                                      src={help}
                                      className="w-3 h-3 mt-1.5"
                                    />
                                  </div>
                                </div>
                                <p className="mt-2">
                                  <SafeRender>
                                    {selectedCard.evidence_strength}
                                  </SafeRender>
                                  <span className="text-3xl font-bold text-success">
                                    79
                                  </span>
                                  /100
                                </p>
                                <p className="text-xs text-gray-700 mt-2">
                                  +13 compared to benchmark
                                </p>
                                {/* Tooltip - Now appears inside the card */}
                                <div
                                  className={`absolute left-0 top-0 w-full h-100px bg-white border-2 border-blue-200 rounded-md p-3 sm:p-5 text-xs sm:text-sm text-gray-700 z-20 space-y-2 transition-all ease-out ${hoveredCard === "evidence"
                                    ? "opacity-100 transform translate-y-0 pointer-events-auto"
                                    : "opacity-0 transform translate-y-4 pointer-events-none"
                                    }`}
                                  style={{
                                    transitionDuration: "2s",
                                    boxShadow:
                                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                  }}
                                >
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.evidence_strength?.value
                                          ?.active_comparator?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.value
                                            ?.active_comparator?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.evidence_strength?.value?.blinding
                                          ?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.value?.blinding
                                            ?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.evidence_strength?.value
                                          ?.number_of_arms?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.value
                                            ?.number_of_arms?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.evidence_strength?.value
                                          ?.number_of_sites?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.value
                                            ?.number_of_sites?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.evidence_strength?.value
                                          ?.primary_endpoint_is_surrogate_only
                                          ?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.value
                                            ?.primary_endpoint_is_surrogate_only
                                            ?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.evidence_strength?.value?.randomized
                                          ?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.evidence_strength?.value
                                            ?.randomized?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <hr className="my-2 border-blue-200" />
                                  <div className="text-left font-semibold text-blue-700">
                                    Subtotal: 10 → Floored at 0
                                  </div>
                                  <div className="text-blue-600 text-left text-xs">
                                    Very weak: exploratory, not
                                    decision-changing on its own.
                                  </div>
                                </div>
                              </div>
                              {/* Card 2: Operational Feasibility */}
                              <div
                                className="bg-lightPink h-140x relative group border-borderlightPink rounded-md p-3 sm:p-5 bg-orange-50 text-center shadow-sm hover:shadow-md transition-all duration-500 ease-in-out"
                                onMouseEnter={() =>
                                  setHoveredCard("operational")
                                }
                                onMouseLeave={() => setHoveredCard(null)}
                              >
                                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.trial_quality_scores?.value
                                        ?.operational_feasibility?.title
                                    }
                                  </SafeRender>
                                </p>
                                <p className="mt-2">
                                  <SafeRender>
                                    {selectedCard.operational_feasibility}
                                  </SafeRender>
                                  <span className="text-3xl font-bold text-orangeWarning">
                                    65
                                  </span>
                                  /100
                                </p>
                                <p className="text-xs text-gray-700 mt-2">
                                  +13 compared to benchmark
                                </p>
                                {/* Tooltip - Now appears inside the card */}
                                <div
                                  className={`absolute left-0 top-0 w-full h-100px bg-white border-2 border-blue-200 rounded-md p-3 sm:p-5 text-xs sm:text-sm text-gray-700 z-20 space-y-2 transition-all ease-out ${hoveredCard === "operational"
                                    ? "opacity-100 transform translate-y-0 pointer-events-auto"
                                    : "opacity-0 transform translate-y-4 pointer-events-none"
                                    }`}
                                  style={{
                                    transitionDuration: "2s",
                                    boxShadow:
                                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                  }}
                                >
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.operational_feasibility?.value?.ecog
                                          ?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.operational_feasibility?.value
                                            ?.ecog?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.operational_feasibility?.value
                                          ?.number_of_regions?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.operational_feasibility?.value
                                            ?.number_of_regions?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.operational_feasibility?.value
                                          ?.number_of_sites?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.operational_feasibility?.value
                                            ?.number_of_sites?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.operational_feasibility?.value
                                          ?.rare_biomarker?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.operational_feasibility?.value
                                            ?.rare_biomarker?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="text-left flex">
                                    <span className="flex items-center justify-center w-6 h-6 pb-1 mr-2 bg-gray-100 border border-gray-300 rounded">
                                      {">"}
                                    </span>
                                    <span className="text-xs mt-1">
                                      {
                                        selectedIdData?.study_details
                                          ?.trial_quality_scores?.value
                                          ?.operational_feasibility?.value
                                          ?.tissue?.title
                                      }
                                      :
                                      <span>
                                        {" "}
                                        {
                                          selectedIdData?.study_details
                                            ?.trial_quality_scores?.value
                                            ?.operational_feasibility?.value
                                            ?.tissue?.value
                                        }{" "}
                                      </span>
                                    </span>
                                  </div>
                                  <hr className="my-2 border-blue-200" />
                                  <div className="text-left font-semibold text-blue-700">
                                    Subtotal: 10 → Floored at 0
                                  </div>
                                  <div className="text-blue-600 text-left text-xs">
                                    Very weak: exploratory, not
                                    decision-changing on its own.
                                  </div>
                                </div>
                              </div>
                            </section>
                          </div>
                          <h1 className="text-lg sm:text-xl mt-6 sm:mt-8 sm:mt-14 mb-2 sm:mb-4 font-bold">
                            <SafeRender>
                              {
                                selectedIdData?.study_details?.study_at_a_glance
                                  ?.title
                              }
                            </SafeRender>
                          </h1>
                          <section className="mb-4 sm:mb-6 sm:mb-8">
                            <div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                                <div className="border rounded-lg p-2 sm:p-3">
                                  <p className="text-base sm:text-lg font-semibold text-black">
                                    <SafeRender>
                                      {
                                        selectedIdData?.study_details
                                          ?.study_at_a_glance?.value?.enrollment
                                          ?.title
                                      }
                                    </SafeRender>
                                  </p>
                                  <p className="text-base text-gray-800">
                                    <span className="ml-1 text-sm text-gray-500 font-normal leading-20x tracking-normal">
                                      <strong className="font-semibold text-gray-800">
                                        {
                                          selectedIdData?.study_details
                                            ?.study_at_a_glance?.value
                                            ?.enrollment?.value?.Planned
                                        }
                                      </strong>
                                      &nbsp;(Planned)
                                    </span>
                                  </p>

                                  <p className="text-base text-gray-800">
                                    <span className="ml-1 text-sm text-gray-500 font-normal leading-20x tracking-normal">
                                      <strong className="font-semibold text-gray-800">
                                        {
                                          selectedIdData?.study_details
                                            ?.study_at_a_glance?.value
                                            ?.enrollment?.value?.Actual
                                        }
                                      </strong>
                                      &nbsp;(Completed)
                                    </span>
                                  </p>
                                  {/* {(() => {
                                      const dynamicValue = selectedIdData?.study_details?.study_at_a_glance?.value?.enrollment?.value;
                                      const match = dynamicValue?.match(/^(\d+)\s*(\(.*\))$/);
                                      if (match) {
                                        const numberPart = match[1]; // "192"
                                        const labelPart = match[2]; // "(Actual)"
                                        return (
                                          <p className="text-base font-medium text-gray-800">
                                            <SafeRender>{numberPart}</SafeRender> <span className="text-gray-400">{labelPart}</span>
                                          </p>
                                        );
                                      }
                                      return (
                                        <p className="text-base font-medium text-gray-800">
                                          <SafeRender>{dynamicValue}</SafeRender>
                                        </p>
                                      );
                                    })()} */}
                                </div>
                                <div className="border rounded-lg p-2 sm:p-3">
                                  <p className="text-base sm:text-lg font-semibold text-black">
                                    <SafeRender>
                                      {
                                        selectedIdData?.study_details
                                          ?.study_at_a_glance?.value?.sites
                                          ?.title
                                      }
                                    </SafeRender>
                                  </p>
                                  <p className="text-base font-medium text-gray-800">
                                    Countries:
                                    <span className="ml-1 text-gray-500 text-xs sm:text-sm font-normal leading-20x tracking-normal">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.study_at_a_glance?.value?.sites
                                            ?.value?.countries
                                        }
                                      </SafeRender>
                                    </span>
                                  </p>
                                  <p className="text-base font-medium text-gray-800">
                                    Sites:
                                    <span className="ml-1 text-gray-500 text-xs sm:text-sm font-normal leading-20x tracking-normal">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.study_at_a_glance?.value?.sites
                                            ?.value?.sites
                                        }
                                      </SafeRender>
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="border-bottom rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.study_at_a_glance?.value?.intervention
                                        ?.title
                                    }
                                  </SafeRender>
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-bottom rounded-md text-xs sm:text-sm">
                                    <thead>
                                      <tr>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b w-32 sm:w-40">
                                          ARM
                                        </th>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b w-40 sm:w-52">
                                          Type
                                        </th>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b">
                                          Description
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {selectedIdData?.study_details?.study_at_a_glance?.value?.intervention?.value?.map(
                                        (value, index) => (
                                          <tr key={index}>
                                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">
                                              {value.ARM}
                                            </td>
                                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">
                                              {value.type}
                                            </td>
                                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">
                                              {value.description}
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="border-bottom rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.study_at_a_glance?.value?.comparator
                                        ?.title
                                    }
                                  </SafeRender>
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-bottom rounded-md text-xs sm:text-sm">
                                    <thead>
                                      <tr>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b w-32 sm:w-40">
                                          ARM
                                        </th>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b w-40 sm:w-52">
                                          Type
                                        </th>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b">
                                          Description
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {selectedIdData?.study_details?.study_at_a_glance?.value?.comparator?.value?.map(
                                        (value, index) => (
                                          <tr key={index}>
                                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">
                                              {value.ARM}
                                            </td>
                                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">
                                              {value.type}
                                            </td>
                                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800">
                                              {value.description}
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="bg-white border rounded-lg shadow-sm p-3 sm:p-4">
                                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                  {selectedIdData?.study_details
                                    ?.study_at_a_glance?.value?.population
                                    ?.title || "Population"}
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-collapse text-xs sm:text-sm">
                                    <thead>
                                      <tr>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b w-full sm:w-1/2">
                                          Exclusion
                                        </th>
                                        <th className="text-left text-xs sm:text-sm font-semibold text-gray-700 px-2 sm:px-4 py-2 border-b w-full sm:w-1/2">
                                          Inclusion
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {Array.from({
                                        length: Math.max(
                                          exclusionToShow.length,
                                          inclusionToShow.length
                                        ),
                                      }).map((_, index) => (
                                        <tr key={index}>
                                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 align-top leading-relaxed text-justify break-words">
                                            {exclusionToShow[index] || ""}
                                          </td>
                                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 align-top leading-relaxed text-justify break-words">
                                            {inclusionToShow[index] || ""}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {/* Toggle Button */}
                                {totalCount > 5 && (
                                  <div className="mt-2 sm:mt-3">
                                    <button
                                      onClick={() => setShowAll(!showAll)}
                                      className="text-blue-600 text-xs sm:text-sm font-medium hover:underline"
                                    >
                                      {showAll
                                        ? "Show less"
                                        : `Show all ${hiddenCount} criteria >`}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-2 sm:mt-4">
                                <div className="bg-white border rounded-sm shadow-sm w-full sm:w-1/2 p-3 sm:p-4">
                                  <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                    <SafeRender>
                                      {
                                        selectedIdData?.study_details
                                          ?.study_at_a_glance?.value?.condition
                                          ?.title
                                      }
                                    </SafeRender>
                                  </p>
                                  {selectedIdData?.study_details?.study_at_a_glance?.value?.condition?.value.map(
                                    (value) => (
                                      <>
                                        <p className="text-xs sm:text-sm text-gray-800 mb-1">
                                          <span className="font-semibold">
                                            Disease:{" "}
                                          </span>
                                          {value.disease}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-800 mb-1">
                                          <span className="font-semibold">
                                            ICD-10:{" "}
                                          </span>
                                          {value.icd_10}
                                          <span className="font-semibold">
                                            {" "}
                                            SNOMED CT:{" "}
                                          </span>{" "}
                                          {value.snomed}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-800">
                                          <span className="font-semibold">
                                            Stage:{" "}
                                          </span>
                                          {value.stage}
                                        </p>
                                      </>
                                    )
                                  )}
                                </div>
                                <div className="border rounded-sm p-3 sm:p-4 w-full sm:w-1/2">
                                  <p className="text-base sm:text-lg font-semibold text-black">
                                    <SafeRender>
                                      {
                                        selectedIdData?.study_details
                                          ?.study_at_a_glance?.value
                                          ?.primary_endpoint?.title
                                      }
                                    </SafeRender>
                                  </p>
                                  <p className="ml-1 text-gray-500 text-xs sm:text-sm font-normal leading-20x tracking-normal">
                                    <SafeRender>
                                      {
                                        selectedIdData?.study_details
                                          ?.study_at_a_glance?.value
                                          ?.primary_endpoint?.value
                                      }
                                    </SafeRender>
                                  </p>
                                </div>
                              </div>
                              <div className="bg-white p-4 sm:p-8 -ml-2 sm:-ml-5">
                                <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-10">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details?.timeline
                                        ?.title
                                    }
                                  </SafeRender>
                                </h2>
                                <div className="relative flex flex-col sm:flex-row justify-between -ml-4 sm:-ml-16 items-start">
                                  <div className="absolute top-2.5 left-8 sm:left-20 w-32 sm:w-36 right-0 h-1 bg-green-500 z-0">
                                    <span className="absolute top-0 left-16 sm:left-36 w-32 sm:w-36 bg-orangeWarning right-0 h-1"></span>
                                  </div>
                                  <div className="absolute top-2.5 left-[0.625rem] w-[30%] h-0.5 bg-green-500 z-0 hidden sm:block"></div>
                                  <div className="absolute top-2.5 right-8 sm:right-20 h-1 w-48 sm:w-72 bg-gray-200 z-0"></div>
                                  <div className="flex flex-col items-center w-full sm:w-1/5 relative z-10 mb-4 sm:mb-0">
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-1">
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                    <p className="text-sm sm:text-md font-semibold mt-2 text-center ml-16 sm:ml-24 -mx-2 leading-tight">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.commencement
                                            ?.title
                                        }
                                      </SafeRender>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-2 ml-8 sm:ml-14">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.commencement
                                            ?.value
                                        }
                                      </SafeRender>
                                    </p>
                                  </div>
                                  {/* Step 2 */}
                                  <div className="flex flex-col items-center w-full sm:w-1/5 relative z-10 mb-4 sm:mb-0">
                                    <div className="w-4 h-4 mt-1 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                    <div className="text-sm sm:text-md font-semibold mt-2 text-center leading-tight ml-2 sm:ml-4">
                                      {(() => {
                                        const title =
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.first_submission
                                            ?.title || "";
                                        const [first, second] =
                                          title.split(" ");
                                        return (
                                          <>
                                            <SafeRender>{first}</SafeRender>
                                            <br />
                                            <span className="ml-8 sm:ml-12">
                                              <SafeRender>{second}</SafeRender>
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 ml-6 sm:ml-11">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.first_submission
                                            ?.value
                                        }
                                      </SafeRender>
                                    </p>
                                  </div>
                                  {/* Step 3 */}
                                  <div className="flex flex-col items-center w-full sm:w-1/5 relative z-20 mb-4 sm:mb-0">
                                    <div className="w-4 h-4 mt-1 rounded-full border-2 border-orangeWarning bg-orangeWarning"></div>
                                    <div className="text-sm sm:text-md font-semibold mt-2 text-center leading-tight ml-2 sm:ml-4">
                                      {(() => {
                                        const title =
                                          selectedIdData?.study_details
                                            ?.timeline?.value
                                            ?.primary_completion?.title || "";
                                        const [first, second] =
                                          title.split(" ");
                                        return (
                                          <>
                                            <SafeRender>{first}</SafeRender>
                                            <br />
                                            <span className="ml-4 sm:ml-7">
                                              <SafeRender>{second}</SafeRender>
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 ml-4 sm:ml-7">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value
                                            ?.primary_completion?.value
                                        }
                                      </SafeRender>
                                    </p>
                                  </div>
                                  {/* Step 4 */}
                                  <div className="flex flex-col items-center w-full sm:w-1/5 relative z-20 mb-4 sm:mb-0">
                                    <div className="w-4 h-4 mt-1 rounded-full border-2 border-gray-400 bg-white"></div>
                                    <p className="text-sm sm:text-md font-semibold mt-2 ml-10 sm:ml-16 text-center leading-tight">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.completion?.title
                                        }
                                      </SafeRender>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-2 ml-2 sm:ml-6">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.completion?.value
                                        }
                                      </SafeRender>
                                    </p>
                                  </div>
                                  {/* Step 5 */}
                                  <div className="flex flex-col items-center w-full sm:w-1/5 relative z-10">
                                    <div className="w-4 h-4 rounded-full border-2 mt-1 border-gray-400 bg-white"></div>
                                    <div className="text-sm sm:text-md font-semibold mt-2 text-center leading-tight ml-2 sm:ml-4">
                                      {(() => {
                                        const title =
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.results_published
                                            ?.title || "";
                                        const [first, second] =
                                          title.split(" ");
                                        return (
                                          <>
                                            <SafeRender>{first}</SafeRender>
                                            <br />
                                            <span className="ml-2 sm:ml-5">
                                              <SafeRender>{second}</SafeRender>
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 ml-6 sm:ml-11">
                                      <SafeRender>
                                        {
                                          selectedIdData?.study_details
                                            ?.timeline?.value?.results_published
                                            ?.value
                                        }
                                      </SafeRender>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 sm:mt-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                                  Endpoints
                                </h3>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4">
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                                    <SafeRender>
                                      {selectedIdData?.study_details?.endpoints
                                        ?.value?.primary_endpoints?.title ||
                                        "Primary Endpoints"}
                                    </SafeRender>
                                  </p>
                                  {selectedIdData?.study_details?.endpoints?.value?.primary_endpoints?.value?.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className={`py-2 sm:py-3 ${index !== 0
                                          ? "border-t border-gray-200 mt-2"
                                          : ""
                                          }`}
                                      >
                                        <div className="flex items-start space-x-2">
                                          <p className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">
                                            {item.description}
                                            <span className="inline-block ml-1 text-gray-500 cursor-pointer">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 sm:w-5 h-4 sm:h-5 inline"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M12 18h.01M8.22 8.22a3 3 0 115.56 1.56c-.37.64-.78 1.02-1.13 1.29-.36.28-.65.5-.82.9-.09.21-.13.46-.13.73v.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                            </span>
                                          </p>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                          {item.timeline}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-4">
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4">
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium ">
                                    <SafeRender>
                                      {selectedIdData?.study_details?.endpoints
                                        ?.value?.secondary_endpoints?.title ||
                                        "Secondary Endpoint"}
                                    </SafeRender>
                                  </p>
                                  {selectedIdData?.study_details?.endpoints?.value?.secondary_endpoints?.value?.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className={`py-2 sm:py-3 ${index !== 0
                                          ? "border-t border-gray-200 mt-2"
                                          : ""
                                          }`}
                                      >
                                        <div className="flex items-start space-x-2">
                                          <p className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">
                                            {item.description}
                                            <span className="inline-block ml-1 text-gray-500 cursor-pointer">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 sm:w-5 h-4 sm:h-5 inline"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M12 18h.01M8.22 8.22a3 3 0 115.56 1.56c-.37.64-.78 1.02-1.13 1.29-.36.28-.65.5-.82.9-.09.21-.13.46-.13.73v.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                            </span>
                                          </p>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                          {item.timeline}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-4">
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4">
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium ">
                                    <SafeRender>
                                      {selectedIdData?.study_details?.endpoints
                                        ?.value?.exploratory_endpoints?.title ||
                                        "Exploratory Endpoints"}
                                    </SafeRender>
                                  </p>
                                  {selectedIdData?.study_details?.endpoints?.value?.exploratory_endpoints?.value?.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className={`py-2 sm:py-3 ${index !== 0
                                          ? "border-t border-gray-200 mt-2"
                                          : ""
                                          }`}
                                      >
                                        <div className="flex items-start space-x-2">
                                          <p className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">
                                            {item.description}
                                            <span className="inline-block ml-1 text-gray-500 cursor-pointer">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 sm:w-5 h-4 sm:h-5 inline"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M12 18h.01M8.22 8.22a3 3 0 115.56 1.56c-.37.64-.78 1.02-1.13 1.29-.36.28-.65.5-.82.9-.09.21-.13.46-.13.73v.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                            </span>
                                          </p>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                          {item.timeline}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-4">
                                <h1 className="font-bold text-2xl sm:text-3xl">
                                  <SafeRender>
                                    {selectedIdData?.study_details
                                      ?.scientific_rationale?.title ||
                                      "Scientific Background and Rationale"}
                                  </SafeRender>
                                </h1>
                                <p className="text-xs sm:text-sm mt-4">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.scientific_rationale?.value
                                    }
                                  </SafeRender>
                                </p>
                              </div>
                              <div>
                                <h3 className="font-xxl mt-2 sm:mt-4 font-semibold text-base sm:text-lg mb-2 sm:mb-3">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.strategic_implication?.title
                                    }
                                  </SafeRender>
                                </h3>
                                <p className="text-sm sm:text-md font-semibold">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.strategic_implication?.value
                                        ?.regulatory_risk?.title
                                    }
                                  </SafeRender>
                                </p>
                                {selectedIdData?.study_details?.strategic_implication?.value?.regulatory_risk?.value?.map(
                                  (value, index) => (
                                    <p
                                      key={index}
                                      className="text-gray-500 mt-2 sm:mt-3 flex items-start space-x-2 text-xs sm:text-sm"
                                    >
                                      <img
                                        src={icon}
                                        className="w-3 h-3 mt-2"
                                      />
                                      <span>
                                        <SafeRender>{value}</SafeRender>
                                      </span>
                                    </p>
                                  )
                                )}
                                <p className="text-sm sm:text-md font-semibold mt-2 sm:mt-4">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.strategic_implication?.value
                                        ?.execution_risk?.title
                                    }
                                  </SafeRender>
                                </p>
                                {selectedIdData?.study_details?.strategic_implication?.value?.execution_risk?.value?.map(
                                  (value, index) => (
                                    <p
                                      key={index}
                                      className="text-gray-500 mt-2 sm:mt-3 flex items-start space-x-2 text-xs sm:text-sm"
                                    >
                                      <img
                                        src={icon}
                                        className="w-3 h-3 mt-2"
                                      />
                                      <span>
                                        <SafeRender>{value}</SafeRender>
                                      </span>
                                    </p>
                                  )
                                )}
                                <p className="text-sm sm:text-md font-semibold mt-2 sm:mt-4">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details
                                        ?.strategic_implication?.value
                                        ?.strategic_options?.title
                                    }
                                  </SafeRender>
                                </p>
                                {selectedIdData?.study_details?.strategic_implication?.value?.strategic_options?.value?.map(
                                  (value, index) => (
                                    <p
                                      key={index}
                                      className="text-gray-500 mt-2 sm:mt-3 flex items-start space-x-2 text-xs sm:text-sm"
                                    >
                                      <img
                                        src={icon}
                                        className="w-3 h-3 mt-2"
                                      />
                                      <span>
                                        <SafeRender>{value}</SafeRender>
                                      </span>
                                    </p>
                                  )
                                )}
                                <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 mt-2 sm:mt-4">
                                  <SafeRender>
                                    {
                                      selectedIdData?.study_details?.contacts
                                        ?.title
                                    }
                                  </SafeRender>
                                </h3>
                                <div className="grid grid-cols-1 gap-2 sm:gap-4">
                                  {selectedIdData?.study_details?.contacts?.value?.map(
                                    (contact, idx) => (
                                      <div
                                        key={idx}
                                        className="border rounded-lg p-3 sm:p-4 bg-white w-full flex flex-col md:flex-row justify-between items-start"
                                      >
                                        {/* Name Section */}
                                        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-1/3 mb-2 sm:mb-4 md:mb-0">
                                          <div className="bg-red-50 p-2 rounded">
                                            <svg
                                              className="w-6 sm:w-8 h-6 sm:h-8 text-black"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5.121 17.804A9.004 9.004 0 0112 15c2.485 0 4.735.998 6.364 2.637M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                                              />
                                            </svg>
                                          </div>
                                          <div>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                              <SafeRender>
                                                {contact.name.title}
                                              </SafeRender>
                                            </p>
                                            <p className="break-words font-medium text-xs sm:text-sm">
                                              <SafeRender>
                                                {contact.name.value}
                                              </SafeRender>
                                            </p>
                                          </div>
                                        </div>
                                        {/* Contact Section */}
                                        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-1/3 mb-2 sm:mb-4 md:mb-0">
                                          <div className="bg-green-50 p-2 rounded">
                                            <svg
                                              className="w-6 sm:w-8 h-6 sm:h-8 text-black"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.293 4.293a1 1 0 00.217.957l1.414 1.414a1 1 0 001.414 0L12 18l2.828 2.828a1 1 0 001.414 0l1.414-1.414a1 1 0 00.217-.957L17 13"
                                              />
                                            </svg>
                                          </div>
                                          <div>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                              <SafeRender>
                                                {contact.contact_num.title}
                                              </SafeRender>
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                              <SafeRender>
                                                {contact.contact_num.value}
                                              </SafeRender>
                                            </p>
                                          </div>
                                        </div>
                                        {/* Email Section */}
                                        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-1/3">
                                          <div className="bg-green-50 p-2 rounded">
                                            <svg
                                              className="w-6 sm:w-8 h-6 sm:h-8 text-black"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                              />
                                            </svg>
                                          </div>
                                          <div>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                              <SafeRender>
                                                {contact?.email?.title}
                                              </SafeRender>
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                              <SafeRender>
                                                {contact?.email?.value}
                                              </SafeRender>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </section>
                          <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 mt-2 sm:mt-4">
                            <SafeRender>
                              {selectedIdData?.sites_locations?.title ||
                                "Trial Site Locations"}
                            </SafeRender>
                          </h3>
                          <div className="flex flex-col sm:flex-row w-full max-w-5xl mx-auto overflow-hidden shadow-sm">
                            <div className="w-full sm:w-1/3 border-r pr-1 sm:pr-2">
                              {displayedCountries.map((country, index) => (
                                <div
                                  key={index}
                                  onClick={() => {
                                    setActiveCountry(country);
                                    setShowAllSites(false);
                                  }}
                                  className={`cursor-pointer pl-1 sm:pl-2 pr-4 sm:pr-20 py-1 flex items-left gap-2 sm:gap-3 bg-gray-50 rounded-md ${activeCountry?.country?.value ===
                                    country?.country?.value
                                    ? "bg-blue-100"
                                    : ""
                                    } mb-2 sm:mb-4 mr-2 sm:mr-4 text-xs sm:text-sm`}
                                >
                                  <span className="text-lg sm:text-2xl">
                                    <SafeRender>FH</SafeRender>
                                  </span>
                                  <div>
                                    <div className="font-medium">
                                      <SafeRender>
                                        {country?.country?.value}
                                      </SafeRender>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      <SafeRender>
                                        {country?.sites?.value}
                                      </SafeRender>{" "}
                                      sites
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {/* Show More / Less Button for Countries */}
                              {countries.length > 5 && (
                                <button
                                  onClick={() =>
                                    setShowAllCountries(!showAllCountries)
                                  }
                                  className="text-blue-600 text-xs sm:text-sm font-medium ml-1 sm:ml-2 mt-2 underline"
                                >
                                  {showAllCountries
                                    ? "Show less"
                                    : `Show ${countries.length - 5} more`}
                                </button>
                              )}
                            </div>
                            {/* Right Side - Sites */}
                            <div className="w-full sm:w-2/3 h-[320px] overflow-y-auto bg-white border">
                              {displayedSites.map((site, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col sm:flex-row justify-between px-2 sm:px-4 py-2 sm:py-4 border-b text-xs sm:text-sm"
                                >
                                  <div className="mb-2 sm:mb-0">
                                    <div className="font-semibold">
                                      <SafeRender>{site?.name}</SafeRender>
                                    </div>
                                    <div className="text-gray-500">
                                      <SafeRender>{site?.city}</SafeRender>
                                    </div>
                                  </div>
                                  <div className="text-right text-gray-700">
                                    <div className="font-medium">
                                      <SafeRender>
                                        {site?.name?.value}
                                      </SafeRender>
                                    </div>
                                    <div className="text-gray-500">
                                      <SafeRender>
                                        {site?.city?.value}
                                      </SafeRender>
                                    </div>
                                    <div className="text-gray-500">
                                      <SafeRender>
                                        {site?.state?.value}
                                      </SafeRender>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {/* Show More / Less Button for Sites */}
                              {selectedSites.length > 5 && (
                                <div className="text-center py-2">
                                  <button
                                    onClick={() =>
                                      setShowAllSites(!showAllSites)
                                    }
                                    className="text-blue-600 text-xs sm:text-sm font-medium underline"
                                  >
                                    {showAllSites
                                      ? "Show less"
                                      : `Show ${selectedSites.length - 5} more`}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === "result" && (
                        <div>
                          <ExecutiveResult />
                          <div>
                            <div className="">
                              <h3 className="font-semibold text-gray-800 text-xl sm:text-2xl mb-1">
                                Results
                              </h3>
                              {/* <p className="text-sm font-semibold">Evidence Strength</p> */}
                              <p className="text-gray-500 block text-xs sm:text-sm">
                                Lorem, ipsum dolor sit amet consectetur
                                adipisicing elit. Expedita enim, odio autem.
                              </p>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <p className="text-base sm:text-lg text-gray-700 font-semibold">
                                Intracting Drugs
                              </p>
                              <div className="flex text-sm sm:text-md flex-col sm:flex-row">
                                <p className="text-gray-500 mt-0.5 flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-0">
                                  <svg
                                    width="32"
                                    height="12"
                                    viewBox="0 0 32 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="shrink-0 w-6 h-3 sm:w-8 sm:h-4"
                                  >
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="6"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                    <circle
                                      cx="16"
                                      cy="6"
                                      r="4"
                                      fill="#4B5563"
                                    />
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="26"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </p>
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Drug A :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md flex-col sm:flex-row">
                                <p className="text-gray-500 mt-0.5 flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-0">
                                  <svg
                                    width="32"
                                    height="12"
                                    viewBox="0 0 32 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="shrink-0 w-6 h-3 sm:w-8 sm:h-4"
                                  >
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="6"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                    <circle
                                      cx="16"
                                      cy="6"
                                      r="4"
                                      fill="#4B5563"
                                    />
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="26"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </p>
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Drug B :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md flex-col sm:flex-row">
                                <p className="text-gray-500 mt-0.5 flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-0">
                                  <svg
                                    width="32"
                                    height="12"
                                    viewBox="0 0 32 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="shrink-0 w-6 h-3 sm:w-8 sm:h-4"
                                  >
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="6"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                    <circle
                                      cx="16"
                                      cy="6"
                                      r="4"
                                      fill="#4B5563"
                                    />
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="26"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </p>
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Type :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md flex-col sm:flex-row">
                                <p className="text-gray-500 mt-0.5 flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-0">
                                  <svg
                                    width="32"
                                    height="12"
                                    viewBox="0 0 32 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="shrink-0 w-6 h-3 sm:w-8 sm:h-4"
                                  >
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="6"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                    <circle
                                      cx="16"
                                      cy="6"
                                      r="4"
                                      fill="#4B5563"
                                    />
                                    <line
                                      x1="20"
                                      y1="6"
                                      x2="26"
                                      y2="6"
                                      stroke="#4B5563"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </p>
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Focus :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-5">
                              <p className="text-base sm:text-lg text-gray-700 font-semibold">
                                Efficacy Metrics
                              </p>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Overall Response Rate:
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Disease Control Rate :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Median PFS :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Overall Survival :
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex items-start space-x-3">
                                <p className="text-gray-500 flex-1 min-w-0 text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Summary:
                                  </span>{" "}
                                  Lorem ipsum dolor, sit amet consectetur
                                  adipisicing elit. Tenetur nihil in magnam
                                  eveniet numquam iusto, error, adipisci
                                  inventore aspernatur molestiae non.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-5">
                              <p className="text-base sm:text-lg text-gray-700 font-semibold">
                                Safety/Adverse Events Profile{" "}
                              </p>
                              <p className="text-gray-500 text-xs sm:text-sm">
                                Lorem ipsum dolor sit amet consectetur
                                adipisicing elit. Velit, odio voluptatem totam
                                officia blanditiis dolorem quas veniam ullam
                                error quam asperiores.
                              </p>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Discontinuations due to AEs:
                                  </span>
                                  ~ 5%
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Treatment-related SAEs :{" "}
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Summary :{" "}
                                  </span>{" "}
                                  Lorem, ipsum dolor sit amet consectetur
                                  adipisicing elit.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-5">
                              <p className="text-base sm:text-lg text-gray-700 font-semibold">
                                Chemical & Phisical Features
                              </p>
                              <div className="flex text-sm sm:text-md">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Stability :
                                  </span>
                                  Lorem ipsum dolor sit, amet consectetur
                                  adipisicing elit. Hic ipsam molestias
                                  reprehenderit officiis eum eos quos aliquid
                                  magnam ut minus dolor numquam facere, earum
                                  nemo illo eligendi ullam natus asperiores.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-5">
                              <p className="text-base sm:text-lg text-gray-700 font-semibold">
                                Chemical Formula
                              </p>
                              <div className=" space-y-2 sm:space-y-3">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Gemcitabine :
                                  </span>
                                  Lorem ipsum dolor sit, amet consectetur
                                  adipisicing elit. Hic ipsam molestias
                                  reprehenderit officiis eum eos quos aliquid
                                  magnam ut minus dolor numquam facere, earum
                                  nemo illo eligendi ullam natus asperiores.
                                </p>
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Ivonescimab :
                                  </span>
                                  Lorem ipsum dolor sit, amet consectetur
                                  adipisicing elit. Hic ipsam molestias
                                  reprehenderit officiis eum eos quos aliquid
                                  magnam ut minus dolor numquam facere, earum
                                  nemo illo eligendi ullam natus asperiores.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-5">
                              <p className="text-base sm:text-lg text-gray-700 font-semibold">
                                Biochemical Properties
                              </p>
                              <div className=" space-y-2 sm:space-y-3">
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Gemcitabine :
                                  </span>
                                  Lorem ipsum dolor sit, amet consectetur
                                  adipisicing elit. Hic ipsam molestias
                                  reprehenderit officiis eum eos quos aliquid
                                  magnam ut minus dolor numquam facere, earum
                                  nemo illo eligendi ullam natus asperiores.
                                </p>
                                <p className="text-gray-500 block text-xs sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    Ivonescimab :
                                  </span>
                                  Lorem ipsum dolor sit, amet consectetur
                                  adipisicing elit. Hic ipsam molestias
                                  reprehenderit officiis eum eos quos aliquid
                                  magnam ut minus dolor numquam facere, earum
                                  nemo illo eligendi ullam natus asperiores.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center py-4 sm:py-8">
                  Click a card to view details
                </p>
              )}
              {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
                  <div className="bg-white rounded-lg shadow-2xl w-full max-w-md sm:w-500w max-w-full">
                    {/* Header */}
                    <div className="bg-blue-800 text-white px-3 sm:px-4 py-3 flex justify-between items-center rounded-t-lg">
                      <h2 className="text-sm font-semibold">{modalTitle}</h2>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-xl font-bold"
                      >
                        &times;
                      </button>
                    </div>
                    {/* Body */}
                    <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {modalItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-gray-800 text-xs sm:text-sm"
                        >
                          <i className="fa-solid fa-circle-dot text-gray-400 mr-2 text-xs"></i>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
export default Favorites;
