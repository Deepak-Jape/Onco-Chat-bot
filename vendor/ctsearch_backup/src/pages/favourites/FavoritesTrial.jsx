import React, { useState, useEffect, useRef } from "react";

import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { fetchTrials } from "../../redux/actions/searchAction";
import bookmark from "../../assets/icons/bookmark-line.svg";

import save from "../../assets/Vector (1).png";
import download from "../../assets/download_2.png";
import PopUpModal from "../trialsHeader/trials/PopUpModal";
import ParticipationIcons from "../../assets/icons/participanticon.svg";
import TrialSkeleton from "../trialsHeader/trials/CardSkeleton";
import RightCardSkeleton from "../trialsHeader/trials/RightCardSkeleton";
import LeftCardSkeleton from "../trialsHeader/trials/LeftCardSkeleton";
import {
  AIicon,
  ExternalLinkLine,
  LocationIcon,
  MailIcon,
  MobileIcon,
  ProfileIcon,
  QuestionHelp,
} from "../../assets";
import {
  analyticsHeaderTabs,
  getStatusColor,
  homepageTabs,
  prepareEligibilityRows,
} from "../../utils/helpers/helper";
import CommonTabs from "../../common/Tabs";
import ResultsTab from "../trialsHeader/trials/ResultsTab";
import StudyDetailsTab from "../trialsHeader/trials/StudyDetailsTab";

const TAB_HEADER_OFFSET = 205;
const panelHeight = `calc(100vh - ${TAB_HEADER_OFFSET}px)`;
const FavoriteCardList = ({
  filters = {},
  counts = {},
  currentPage,
  setCurrentPage,
}) => {
  const dispatch = useDispatch();
  const [hoveredCard, setHoveredCard] = useState(null);

  const { trials, loadingTrials, queryId } = useSelector(
    (state) => state.conditionData
  );
  const countData = useSelector((state) => state.conditionData.count);

  const SafeRender = ({ children, fallback = "" }) => {
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

  const saveButtonRef = useRef(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  // const [selectedIdData, setSelectedIdData] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState([]);
  const [activeTab, setActiveTab] = useState("Study Details");
  const [activeCountry, setActiveCountry] = useState(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllSites, setShowAllSites] = useState(false);
  const [hoveredTitle, setHoveredTitle] = useState(null);
  const [selectedCard, setSelectedCard] = useState(() => {
    const saved = localStorage.getItem("selectedCard");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedIdData, setSelectedIdData] = useState(() => {
    const saved = localStorage.getItem("selectedIdData");
    return saved ? JSON.parse(saved) : {};
  });
  const onChangeTab = (tab) => {
    setActiveTab(tab);
  };

  const [isSticky, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const stickyRef = useRef(null);
  const scrollRef = useRef(null);

  // Save to localStorage whenever selectedCard or selectedIdData changes
  useEffect(() => {
    if (selectedCard) {
      localStorage.setItem("selectedCard", JSON.stringify(selectedCard));
    }
  }, [selectedCard]);

  useEffect(() => {
    if (selectedIdData && Object.keys(selectedIdData).length > 0) {
      localStorage.setItem("selectedIdData", JSON.stringify(selectedIdData));
    }
  }, [selectedIdData]);

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
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };
  const visiblePageRange = 4;

  const getPageRangeDisplayed = () => {
    if (currentPage <= 0) return visiblePageRange;
    return visiblePageRange;
  };

  const [isOn, setIsOn] = useState(false);

  const handleToggle = () => {
    setIsOn(!isOn);
  };

  const getMarginPagesDisplayed = () => {
    return currentPage === 0 ? 1 : 0;
  };

  const cardsPerPage = 10;
  // const [currentPage, setCurrentPage] = useState(1);
  // const prevFiltersRef = useRef();
  // const prevPageRef = useRef();

  const defaultQueryId = "0256ae9d-b8fc-4c11-a07c-04a908c638fb";

  useEffect(() => {}, []);

  // useEffect(() => {
  //   const filtersChanged =
  //     JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
  //   const pageChanged = currentPage !== prevPageRef.current;
  //   const hasFilters =
  //     filters &&
  //     Object.keys(filters).some(
  //       (key) =>
  //         filters[key] !== null &&
  //         filters[key] !== undefined &&
  //         filters[key] !== "" &&
  //         (Array.isArray(filters[key]) ? filters[key].length > 0 : true)
  //     );
  //   if (filtersChanged) {
  //     // Check if filters are empty
  //     if (hasFilters) {
  //       // 🔹 Filters exist → exclude queryId
  //       dispatch(fetchTrials(filters, cardsPerPage, 1));
  //     } else {
  //       // 🔹 No filters → include queryId
  //       dispatch(fetchTrials(filters, cardsPerPage, 1, defaultQueryId));
  //     }
  //     setCurrentPage(1);
  //     // Update refs
  //     prevFiltersRef.current = filters;
  //     prevPageRef.current = 1;
  //   }
  //   if (pageChanged && !filtersChanged) {
  //     if (hasFilters) {
  //       // 🔹 Filters exist → exclude queryId
  //       dispatch(fetchTrials(filters, cardsPerPage, currentPage, queryId))
  //     } else {
  //       // 🔹 No filters → include queryId
  //       dispatch(
  //         fetchTrials(filters, cardsPerPage, currentPage, defaultQueryId)
  //       );
  //     }
  //     // dispatch(fetchTrials(filters, cardsPerPage, currentPage, queryId));
  //     prevPageRef.current = currentPage;
  //   }
  // }, [filters, currentPage, cardsPerPage, dispatch, queryId, defaultQueryId]);

  const offset = (currentPage - 1) * cardsPerPage;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // const [selectedCard, setSelectedCard] = useState(0);

  const filteredCards = trials || [];
  const currentCards = filteredCards;
  const startIndex = offset + 1;
  const endIndex = Math.min(offset + cardsPerPage, filteredCards.length);

  const totalPages = Math.ceil(
    counts?.conditionCount / cardsPerPage || countData / cardsPerPage
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

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const handleClear = () => clearSelectedCard();
    window.addEventListener("clear-selected-data", handleClear);

    return () => window.removeEventListener("clear-selected-data", handleClear);
  }, []);

  const clearSelectedCard = () => {
    setSelectedCard(null);
    setSelectedIdData({});
    localStorage.removeItem("selectedCard");
    localStorage.removeItem("selectedIdData");
  };

  const handelGetCardDetails = async (card, nct_id) => {
    setIsSticky(false);
    setScrollProgress(0);
    setIsLoading(true);
    setSelectedCard(card);
    setActiveTab("Study Details");
    try {
      const res = await axios.get(
        `https://trialsearch-fbb8g2e0c2aqfee9.centralindia-01.azurewebsites.net/search/ExecutiveSummary/?NCTId=${nct_id}`
      );
      setSelectedIdData(res.data);
    } catch (err) {
      console.error("Error fetching card details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const exclusion =
    selectedIdData?.study_details?.study_at_a_glance?.value?.population?.value
      ?.exclusion || [];
  const inclusion =
    selectedIdData?.study_details?.study_at_a_glance?.value?.population?.value
      ?.inclusion || [];

  const eligibilityRows = prepareEligibilityRows(exclusion, inclusion);

  const demographics =
    selectedIdData?.study_details?.study_at_a_glance?.value?.demographics
      ?.value;

  const patientDempgraphicRows = demographics
    ? Object.entries(demographics).map(([sex, age]) => ({
        sex,
        age,
      }))
    : [];

  const [showAll, setShowAll] = useState(false);

  // Show only first 5 if collapsed
  const exclusionToShow = showAll ? exclusion : exclusion.slice(0, 5);
  const inclusionToShow = showAll ? inclusion : inclusion.slice(0, 5);

  const totalCount = Math.max(exclusion.length, inclusion.length);
  const hiddenCount = totalCount - 5;

  const handleScroll33 = () => {
    const el = scrollRef.current;
    if (!el) return;

    const current = el.scrollTop;

    setIsSticky(current > 0);

    const total = el.scrollHeight - el.clientHeight;
    const progress = (current / total) * 100;

    setScrollProgress(progress);
  };

  useEffect(() => {
    const scrollContainer = stickyRef.current?.closest(".scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const rect = stickyRef.current?.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      setIsSticky(rect?.top <= containerRect.top + 1);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [downloadOpen, setDownloadOpen] = useState(false);

  const timelineArray = selectedIdData?.study_details?.timeline?.value || [];

  const customOrder = [
    "Commencement",
    "First Submission",
    "Primary Completion",
    "Completion",
    "Results Published",
  ];
  const sortedTimeline = [...timelineArray].sort(
    (a, b) => customOrder.indexOf(a.title) - customOrder.indexOf(b.title)
  );

  const steps = timelineArray
    .sort((a, b) => a.index - b.index)
    .map((item) => ({
      title: item.title,
      date: item.value,
      color: "#3cb371",
      active: true,
    }));

  const value = selectedIdData?.top_info?.value?.phase?.value || "";
  const matched = value.match(/^(Phase\s*\d+)(.*)$/);
  const trueValue = true;

  const CardConditions = ({
    card,
    selectedCard,
    setModalItems,
    setModalTitle,
    setIsModalOpen,
  }) => {
    const total = card?.conditions?.length || 0;

    const firstChip = total > 0 ? card.conditions[0] : null;
    const remaining = total > 1 ? total - 1 : 0;

    return (
      <div className="flex items-center gap-2 mb-3 overflow-hidden">
        {/* First chip */}
        {firstChip && (
          <div
            style={{
              background:
                selectedCard?.nct_id === card.nct_id
                  ? "rgba(255, 255, 255, 1)"
                  : "rgba(240, 246, 254, 1)",
              color:
                selectedCard?.nct_id === card.nct_id
                  ? "rgba(0, 0, 0, 0.7)"
                  : "rgba(19, 51, 95, 1)",
              fontSize: "14px",
              height: "22px",
            }}
            className={`flex items-center
              
               text-gray-700 hover:text-black whitespace-nowrap text-xs px-2 py-1 rounded`}
          >
            {firstChip}
          </div>
        )}

        {/* +N Count */}
        {remaining > 0 && (
          <div
            style={{
              background: "rgba(220, 233, 252, 1)",
              color: "rgba(47, 128, 237, 1)",
              height: "22px",
              fontSize: "14px",
              fontWeight: "400",
            }}
            className="flex items-center text-white text-xs font-medium px-2 rounded-md cursor-pointer whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              setModalItems(card.conditions);
              setModalTitle("Conditions");
              setIsModalOpen(true);
            }}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  const isResultDisabled =
    !selectedIdData?.result_section ||
    Object.keys(selectedIdData.result_section)?.length === 0;

  const isTerminatedDisabled =
    !selectedIdData?.terminated_section ||
    Object.keys(selectedIdData.terminated_section)?.length === 0;

  return (
    <>
      {
        // trueValue
        filteredCards?.length === 0 ? (
          <div className="text-center w-full h-screen mt-3 z-20 text-gray-600 text-lg">
            <TrialSkeleton />
          </div>
        ) : (
          <>
            <div
              style={{
                width: "85%",
              }}
              className="flex bg-mainBlue "
            >
              {/* Left: Left Panel */}

              <div
                className="h-full flex flex-col font-inter bg-blue-50"
                style={{
                  maxHeight: panelHeight,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  width: "28%",
                }}
              >
                <div
                  className="flex-1 overflow-y-hidden overflow-x-hidden space-y-4"
                  style={{
                    maxHeight: "calc(100vh - 10rem)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        height: "54px",
                        padding: "5%",
                      }}
                      className="flex bg-borderlightPink rounded-sm  shadow-sm text-left items-center justify-between z-50"
                    >
                      <div className="flex flex-col">
                        <div
                          style={{
                            gap: "10%",
                          }}
                          className="flex items-baseline justify-between"
                        >
                          <span
                            className="text-sm font-semibold"
                            style={{
                              fontFamily: "Rubik",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "rgba(0,0,0,0.8)",
                            }}
                          >
                            {counts?.conditionCount ?? countData} Trials Saved
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          {/* <span
                            style={{
                              fontSize: "13px",
                              color: "rgba(0, 0, 0, 0.7)",
                            }}
                            className="text-sm text-black-700 "
                          >
                            Set alert
                          </span> */}
                          {/* <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isOn}
                              onChange={handleToggle}
                            />
                            <div
                              className={`w-40w h-6 rounded-full transition-colors duration-300 ${
                                isOn ? "bg-filterBtn" : "bg-toggleDark"
                              }`}
                            ></div>
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                                isOn ? "left-4 ml-0.5" : "left-0.5"
                              }`}
                            ></div>
                          </label> */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="black"
                            className="w-5 h-5 cursor-pointer"
                            onClick={() => setIsOpen((prev) => !prev)}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 6h18M3 12h12M3 18h8"
                            />
                          </svg>
                        </div>

                        {isOpen && (
                          <div
                            ref={menuRef} // <-- attach ref here
                            className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md border border-gray-200 shadow-lg z-[9999]"
                            style={{ marginTop: "40px" }}
                          >
                            <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                              Sort by
                            </p>
                            {["New", "Recently Updated", "OncoSuite Score"].map(
                              (item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setSelected(item);
                                    setIsOpen(false);
                                  }}
                                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                    selected === item
                                      ? "bg-gray-100 text-gray-700"
                                      : "hover:bg-gray-50 hover:text-gray-500"
                                  }`}
                                >
                                  {item}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {loadingTrials ? (
                    <div>
                      <LeftCardSkeleton />
                    </div>
                  ) : (
                    <div
                      className="mt-4 flex-1 overflow-y-scroll px-2 ml-1 custom-scrollbar space-y-0"
                      style={{ maxHeight: "calc(100vh - 18rem)" }}
                    >
                      <style>
                        {`
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  min-height: 80px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: "rgba(0, 0, 0, 0.2);
}

.inner-shadow-top {
  box-shadow: inset 0 8px 8px -8px rgba(0, 0, 0, 0.25);
}
`}
                      </style>

                      {currentCards?.map((card, index) => (
                        <div
                          key={`${card.nct_id}-${index}`}
                          className={`relative w-full bg-white shadow-sm rounded-md p-4 cursor-pointer border-solid ${
                            selectedCard?.nct_id === card.nct_id
                              ? "bg-blue-50 border-2"
                              : "border-gray-200 border hover:border-blue-600 transition-colors duration-500 ease-in-out"
                          }`}
                          onClick={() =>
                            handelGetCardDetails(card, card.nct_id)
                          }
                          style={{
                            marginBottom: "15px",
                            borderColor:
                              selectedCard?.nct_id === card.nct_id
                                ? "rgba(28, 77, 142, 1)"
                                : "",
                            height: "100%",
                            minHeight: "212px",
                          }}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            {/* LEFT SIDE */}
                            <div className="flex items-center space-x-2">
                              {/* NCT ID */}
                              <a
                                href={`https://clinicaltrials.gov/study/${card.nct_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "rgba(0, 0, 0, 0.7)",
                                  fontSize: "14px",
                                  display: "flex",
                                  gap: "3px",
                                  fontWeight: "400",
                                  fontFamily: "Rubik",
                                }}
                                className="break-words"
                              >
                                {card.nct_id}
                                <img src={ExternalLinkLine} />
                              </a>

                              {/* PHASE BADGE */}
                              <span
                                style={{
                                  background: "rgba(227, 220, 255, 1)",
                                  color: "rgba(47, 32, 102, 1)",
                                  height: "22px",
                                  fontFamily: "Rubik",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  padding: "0px 8px",
                                  borderRadius: "4px",
                                }}
                                className="flex items-center"
                              >
                                {card.phases}
                              </span>
                            </div>

                            {/* BOOKMARK ICON */}
                            <img
                              src={bookmark}
                              alt="bookmark"
                              className="w-5 h-5 text-blue-600 absolute top-3 right-3"
                            />
                          </div>
                          {/* Title */}
                          <div className="relative group w-full">
                            <h2
                              style={{
                                fontFamily: "Rubik",
                                color: "rgba(0, 0, 0, 0.8)",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                              className="text-12x text-left font-semibold line-clamp-2 mb-2 break-words cursor-pointer"
                              title={card.brief_title}
                            >
                              {card.brief_title}
                            </h2>

                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-normal w-max max-w-xs z-[9999] shadow-lg">
                              {card.brief_title}
                            </div>
                          </div>

                          {/* Conditions */}
                          <div className="flex justify-between font-semibold pb-1 text-10x">
                            <p
                              style={{
                                fontSize: "11px",
                                fontWeight: "500",
                              }}
                            >
                              Conditions
                            </p>
                          </div>
                          {/* <div className="flex flex-wrap gap-2 mb-2">
                            {card.conditions
                              .slice(0, 2)
                              .map((condition, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center ${selectedCard?.nct_id === card.nct_id
                                    ? "bg-white"
                                    : "bg-gray-100"
                                    } text-gray-700 hover:text-black text-xs px-2 py-1 rounded break-words mr-2 mb-2`}
                                >
                                  <span>{condition}</span>
                                </div>
                              ))}
                            {card.conditions.length > 2 && (
                              <div
                                className="flex items-center bg-blue-500 hover:bg-black text-white text-xs font-medium px-2 mb-2 rounded-md cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalItems(card.conditions);
                                  setModalTitle("Conditions");
                                  setIsModalOpen(true);
                                }}
                              >
                                +{card.conditions.length - 2}
                              </div>
                            )}
                          </div> */}
                          <CardConditions
                            key={card.nct_id}
                            card={card}
                            setModalItems={setModalItems}
                            setModalTitle={setModalTitle}
                            setIsModalOpen={setIsModalOpen}
                            selectedCard={selectedCard}
                          />

                          {/* Location & Participants */}
                          <div
                            style={{
                              marginBottom: "-2px",
                            }}
                            className="flex justify-between font-semibold text-10x"
                          >
                            <p
                              style={{
                                fontSize: "11px",
                                fontWeight: "500",
                              }}
                            >
                              Trial Location
                            </p>
                            <p
                              style={{
                                fontSize: "11px",
                                fontWeight: "500",
                              }}
                            >
                              Participants
                            </p>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1 font-medium text-10x rounded-full flex-shrink-0 break-words">
                              <img
                                style={{
                                  width: "14px",
                                  height: "14px",
                                }}
                                src={LocationIcon}
                              />
                              <div className="flex flex-wrap gap-2">
                                {card?.locations
                                  ?.slice(0, 2)
                                  ?.map((location, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center text-gray-700 text-xs rounded break-words pt-2 mb-2"
                                    >
                                      <span
                                        style={{
                                          fontSize: "14px",
                                          fontFamily: "Rubik",
                                          fontWeight: "400",
                                        }}
                                      >
                                        {location}
                                      </span>
                                    </div>
                                  ))}
                                {card?.locations?.length > 2 && (
                                  <div
                                    className="flex items-center bg-blue-500 text-white hover:bg-black text-xs font-medium px-2 mt-3 mb-2 pb-1 rounded-md cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalItems(card?.locations);
                                      setModalTitle("Locations");
                                      setIsModalOpen(true);
                                    }}
                                    style={{
                                      fontSize: "14px",
                                      fontFamily: "Rubik",
                                      fontWeight: "400",
                                    }}
                                  >
                                    +{card?.locations?.length - 2}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 font-medium text-10x py-1 rounded-full flex-shrink-0 break-words">
                              <img
                                style={{
                                  width: "14px",
                                  height: "14px",
                                }}
                                src={ParticipationIcons}
                              />
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontFamily: "Rubik",
                                  fontWeight: "400",
                                }}
                                className="text-xs"
                              >
                                {card.participants}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {loadingTrials ? (
                  <div className=""></div>
                ) : (
                  <div className="mt-auto bg-mainBlue border-t border-gray-200">
                    <div className="bg-mainBlue border-t border-gray-200">
                      <div className="flex items-center justify-between bg-gray-50 py-3 px-6 rounded-b-2xl text-sm">
                        {/* LEFT SECTION */}
                        <div className="flex items-center space-x-3">
                          {/* Page label */}
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "rgba(0,0,0,0.4)",
                            }}
                          >
                            Page
                          </span>

                          {/* Current Page */}
                          <span
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "2px",
                              border: "1px solid #2F80ED",
                              background: "rgba(255,255,255,0.3)",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#2666BE",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {currentPage || 1}
                          </span>

                          {/* of X */}
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "rgba(0,0,0,0.4)",
                            }}
                          >
                            of {totalPages}
                          </span>
                        </div>

                        {/* RIGHT SECTION */}
                        <div className="flex items-center space-x-3">
                          {/* Prev Button */}
                          <button
                            disabled={currentPage === 1}
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            style={{
                              minWidth: "52px",
                              height: "28px",
                              padding: "0 12px",
                              borderRadius: "4px",
                              border: "1px solid #2F80ED",
                              background: "#fff",
                              color: "#2F80ED",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor:
                                currentPage === 1 ? "not-allowed" : "pointer",
                              opacity: currentPage === 1 ? 0.5 : 1,
                            }}
                          >
                            Prev
                          </button>

                          {/* Next Button */}
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            style={{
                              minWidth: "52px",
                              height: "28px",
                              padding: "0 12px",
                              borderRadius: "4px",
                              border: "1px solid #2F80ED",
                              background: "#fff",
                              color: "#2F80ED",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor:
                                currentPage === totalPages
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: currentPage === totalPages ? 0.5 : 1,
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Side Panel */}

              <div
                style={{
                  width: "57%",
                  padding: "2% 11.5% 2% 2%",
                  boxShadow: "inset 0px 4px 6px rgba(138, 160, 190, 0.15)",
                }}
                className="flex-1 overflow-y-auto border-t border-l border-gray-300 text-left bg-white pb-48"
              >
                {isLoading ? (
                  <div>
                    <RightCardSkeleton />
                  </div>
                ) : selectedCard ? (
                  <>
                    {/* Sticky Header Section */}

                    <div
                      className="custom-scrollbar"
                      style={{
                        overflowY: "auto",
                        paddingRight: "20px",
                        paddingBottom: "20px",
                        maxHeight: "calc(100vh - 12rem)",
                      }}
                      ref={scrollRef}
                      onScroll={handleScroll33}
                    >
                      <div className="sticky top-0 bg-white z-50 pt-0">
                        <div
                          style={{
                            marginBottom: isSticky ? "3px" : "20px",
                          }}
                          className={`transition-all duration-500 ease-in-out`}
                          ref={stickyRef}
                        >
                          {!isSticky && (
                            <a
                              href={`https://clinicaltrials.gov/study/${selectedIdData?.top_info?.value?.nctid?.value}`}
                              target="_blank"
                              style={{
                                color: "rgba(38, 102, 190, 1)",
                                textDecoration: "underline",
                                fontSize: "14px",
                              }}
                            >
                              <SafeRender>
                                {selectedIdData?.top_info?.value?.nctid?.value}
                              </SafeRender>
                            </a>
                          )}
                          <h2
                            style={{
                              fontFamily: "Rubik",
                              color: "rgba(0,0,0,0.9)",
                              fontWeight: 500,
                              transition: "all 0.4s ease-in-out",
                              fontSize: isSticky ? "19px" : "27px",
                              whiteSpace: isSticky ? "nowrap" : "normal",
                              overflow: isSticky ? "hidden" : "visible",
                              textOverflow: isSticky ? "ellipsis" : "unset",
                              lineHeight: "36px",
                            }}
                          >
                            <SafeRender>
                              {
                                selectedIdData?.top_info?.value?.study_title
                                  ?.value
                              }
                            </SafeRender>
                          </h2>
                        </div>
                        {scrollProgress > 0 && (
                          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-150"
                              style={{ width: `${scrollProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <div className="gap-x-6 gap-y-2 text-sm text-gray-700">
                        <div className="flex items-start text-sm text-gray-700">
                          <div className="flex-1">
                            <span className="text-gray-500 block">
                              {selectedIdData?.top_info?.value?.sponsor
                                ?.title || "Sponsor"}
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontFamily: "Rubik",
                                fontWeight: "500",
                                color: "rgba(0, 0, 0, 0.8)",
                              }}
                              className=""
                            >
                              <SafeRender>
                                {
                                  selectedIdData?.top_info?.value?.sponsor
                                    ?.value
                                }
                              </SafeRender>
                            </p>
                          </div>
                          <div className="h-10 border-l border-gray-300 mx-4"></div>
                          <div className="flex-1">
                            <span className="text-gray-500 block">
                              {selectedIdData?.top_info?.value?.latest_update
                                ?.title || "Latest Update"}{" "}
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontFamily: "Rubik",
                                fontWeight: "500",
                                color: "rgba(0, 0, 0, 0.8)",
                              }}
                              className=""
                            >
                              <SafeRender>
                                {
                                  selectedIdData?.top_info?.value?.latest_update
                                    ?.value
                                }
                              </SafeRender>
                            </p>
                          </div>
                          <div className="h-10 border-l border-gray-300 mx-4"></div>
                          <div className="flex-1">
                            <span className="text-gray-500 block">
                              {selectedIdData?.top_info?.value?.reporting_unit
                                ?.title || "Reporting Unit"}
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontFamily: "Rubik",
                                fontWeight: "500",
                                color: "rgba(0, 0, 0, 0.8)",
                              }}
                              className=""
                            >
                              <SafeRender>
                                {
                                  selectedIdData?.top_info?.value
                                    ?.reporting_unit?.value
                                }
                              </SafeRender>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start text-sm text-gray-700 mt-3">
                          <div className="flex-1">
                            <span className="text-gray-500 block">
                              {selectedIdData?.top_info?.value?.status?.title ||
                                "Status"}
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontFamily: "Rubik",
                                fontWeight: "500",
                                color: getStatusColor(
                                  selectedIdData?.top_info?.value?.status?.value
                                ),
                              }}
                              className=""
                            >
                              <SafeRender>
                                {selectedIdData?.top_info?.value?.status?.value}
                              </SafeRender>
                            </p>
                          </div>
                          <div className="flex-1 border-l border-gray-300">
                            <span className="text-gray-500 pl-4 block">
                              {selectedIdData?.top_info?.value?.phase?.title ||
                                "Phase"}
                            </span>
                            <p className="font-semibold pl-4 ">
                              {matched ? (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontFamily: "Rubik",
                                    fontWeight: "500",
                                    color: "rgba(0, 0, 0, 0.8)",
                                  }}
                                  className="your-class"
                                >
                                  <span>{matched[1]}</span>
                                  {matched[2]}
                                </div>
                              ) : (
                                <div className="your-class">{value}</div>
                              )}
                            </p>
                          </div>

                          <div className="flex-1 border-l border-gray-300 ml-4">
                            <span className="text-gray-500 ml-4 block">
                              {selectedIdData?.top_info?.value?.condition
                                ?.title || "Condition"}
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontFamily: "Rubik",
                                fontWeight: "500",
                                color: "rgba(0, 0, 0, 0.8)",
                              }}
                              className=" ml-4"
                            >
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

                      {/* Action Buttons */}
                      <div ref={saveButtonRef} className="flex gap-4 mt-4">
                        <button
                          style={{
                            height: "44px",
                          }}
                          className="flex w-87w items-center justify-center gap-2 px-4 py-2 
                border border-blue-300 rounded-md text-sm font-semibold
                bg-filterBtn text-white hover:bg-blue-700 
                transition-all duration-300 ease-out shadow-sm fa-bookmark"
                        >
                          <img src={save} className="w-3 h-4" />
                          <span className="fa-bookmark">Save</span>
                        </button>

                        <div
                          className="relative inline-block"
                          onMouseEnter={() => setDownloadOpen(true)}
                          onMouseLeave={() => setDownloadOpen(false)}
                        >
                          {/* BUTTON */}
                          <button
                            style={{
                              height: "44px",
                            }}
                            className="flex items-center gap-2 px-4 h-10 border-2 border-blue-600 text-blue-600 rounded-md bg-white"
                          >
                            <img
                              src={download}
                              className="w-3 h-4"
                              alt="download icon"
                            />
                            <span className="font-medium">Download</span>
                          </button>

                          {/* DROPDOWN */}
                          {downloadOpen && (
                            <div className="absolute left-0 mt-2 w-52 bg-white shadow-md border rounded-lg p-2 z-50">
                              <p className="text-gray-400 text-xs px-2 mb-1">
                                Available Documents
                              </p>

                              <ul className="text-sm">
                                <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                                  Study Protocol (PDF)
                                </li>
                                <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                                  Informed Consent Form
                                </li>
                                <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                                  Statistical Analysis Plan
                                </li>
                                <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                                  Trial Results (Not Available)
                                </li>
                                <li className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                                  Executive Summary
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tabs and Content */}
                      <div className="mt-6">
                        <div>
                          <div className="flex space-x-6">
                            {/* Study Details Tab */}
                            <CommonTabs
                              tabs={homepageTabs}
                              onChange={onChangeTab}
                              defaultValue="Study Details"
                              disabledTabs={
                                isResultDisabled && isTerminatedDisabled
                                  ? ["Result"]
                                  : []
                              }
                            />
                          </div>
                        </div>

                        {/* Tab Content - Your existing tab content goes here */}
                        <div className="mt-4">
                          {activeTab === "Study Details" && (
                            <StudyDetailsTab
                              selectedIdData={selectedIdData}
                              selectedCard={selectedCard}
                              patientDempgraphicRows={patientDempgraphicRows}
                              eligibilityRows={eligibilityRows}
                              steps={sortedTimeline}
                            />
                          )}
                          {activeTab === "Result" && (
                            <div>
                              <ResultsTab
                                data={selectedIdData}
                                isResultDisabled={isResultDisabled}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-center py-4 sm:py-8">
                    Click a card to view details
                  </p>
                )}
                {isModalOpen && (
                  <PopUpModal
                    modalItems={modalItems}
                    modalTitle={modalTitle}
                    setIsModalOpen={setIsModalOpen}
                  />
                )}
              </div>
            </div>
          </>
        )
      }
    </>
  );
};

export default FavoriteCardList;
