import { useMemo, useState, useEffect } from "react";
import { MapPin, Mail, Phone, Building2, Download } from "lucide-react";
import TrialsOverTime from "../trialsHeader/sites/graph/TrialsOverTime";
import TrialsbyPhase from "../trialsHeader/sites/graph/TrialsbyPhase";
import leadResearcherMock from "../../json/leadResearchers.json"
import help from "../../assets/help (1).png"
import bookmark from "../../assets/icons/bookmark-line.svg"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import response from "../../json/response.json"
import PopUpModal from "../trialsHeader/trials/PopUpModal";
import TrialSkeleton from "../trialsHeader/trials/CardSkeleton";
const cardsPerPage = 4;

// Performance metric configurations (now in frontend)
const performanceMetrics = [
  {
    id: "recruitSpeed",
    badge: "Fast",
    label: "Recruit Speed",
    unit: "patients/month",
    theme: "mint",
    getBadge: (value) =>
      value >= 25 ? "Fast" : value >= 15 ? "Moderate" : "Slow",
  },
  {
    id: "dropoutRate",
    badge: "Low",
    label: "Dropout Rate",
    unit: "%",
    theme: "softBlue",
    getBadge: (value) => (value <= 5 ? "Low" : value <= 10 ? "Medium" : "High"),
  },
  {
    id: "enrollTarget",
    badge: "Average",
    label: "Enroll Target Achievement",
    unit: "%",
    theme: "amber",
    getBadge: (value) =>
      value >= 75 ? "High" : value >= 50 ? "Average" : "Low",
  },
  {
    id: "completionRate",
    badge: "High",
    label: "Trials Completion Rate",
    unit: "%",
    theme: "mint",
    getBadge: (value) =>
      value >= 75 ? "High" : value >= 50 ? "Medium" : "Low",
  },
];

const metricThemes = {
  mint: {
    container: "bg-lightBlue border-lightBlueBorder",
    badge: "text-green-600",
  },
  softBlue: {
    container: "bg-sLightBlue border-sLightBlueBorder",
    badge: "text-blue-600",
  },
  amber: {
    container: "bg-lightPink border-borderlightPink",
    badge: "text-orangeWarning",
  },
};

const phaseLabels = ["Phase I", "Phase II", "Phase III", "Phase IV"];
const TAB_HEADER_OFFSET = 210;
const panelHeight = `calc(100vh - ${TAB_HEADER_OFFSET}px)`;

export default function FavoriteResearcher() {
  const { leadResearchers = [], meta = {} } = leadResearcherMock || {};
  const [selectedId, setSelectedId] = useState(leadResearchers[0]?.id ?? null);
  const [timeframe, setTimeframe] = useState("annual");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState([]);

  const { trials } = response;
  const filteredCards = trials || [];
  const currentCards = filteredCards;

  const totalPages = Math.max(
    1,
    meta.totalPages ?? Math.ceil(leadResearchers.length / cardsPerPage)
  );

  const paginatedResearchers = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return leadResearchers.slice(start, start + cardsPerPage);
  }, [currentPage, leadResearchers]);

  const selectedResearcher = useMemo(() => {
    return (
      leadResearchers.find((researcher) => researcher.id === selectedId) ||
      leadResearchers[0] ||
      null
    );
  }, [leadResearchers, selectedId]);

  if (!leadResearchers.length || !selectedResearcher) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        Lead researcher data is not available yet.
      </div>
    );
  }

  const handleSelectResearcher = (id) => {
    setSelectedId(id);
    setTimeframe("annual");
  };

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      if (direction === "next") {
        return Math.min(prev + 1, totalPages);
      }
      return Math.max(prev - 1, 1);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Transform trials over time data for graph component
  const trialsOverTimeData = useMemo(() => {
    const rawData = selectedResearcher.trialsOverTime?.[timeframe] ?? [];

    if (timeframe === "annual") {
      return rawData.map((item) => ({
        label: item.year.toString(),
        trials: item.total,
        phase1: item.p1,
        phase2: item.p2,
        phase3: item.p3,
      }));
    } else {
      // quarterly format: "2024-Q1" → "Q1 '24"
      return rawData.map((item) => {
        const [year, quarter] = item.quarter.split("-");
        return {
          label: `${quarter} '${year.slice(2)}`,
          trials: item.total,
          phase1: item.p1,
          phase2: item.p2,
          phase3: item.p3,
        };
      });
    }
  }, [selectedResearcher, timeframe]);

  // Transform trials by phase data
  const trialsByPhaseData = useMemo(() => {
    const counts = selectedResearcher.trialsByPhase ?? [0, 0, 0, 0];
    return counts.map((count, index) => ({
      phase: phaseLabels[index],
      count: count,
    }));
  }, [selectedResearcher]);

  // Build performance cards from numeric data
  const performanceCards = useMemo(() => {
    const performance = selectedResearcher.performance ?? {};
    return performanceMetrics.map((metric) => {
      const value = performance[metric.id] ?? 0;
      return {
        ...metric,
        value,
        badge: metric.getBadge(value),
      };
    });
  }, [selectedResearcher]);

  return (
    <>
      {isLoading ? (
        <div className="z-20">
          <TrialSkeleton />
        </div>
      ) : (
        <div className="flex" style={{ width: "85%", minHeight: panelHeight }}>
          {/* Sidebar */}
          <aside
            style={{ width: "28.5%" }}
            className="flex-shrink-0 font-inter"
          >
            <div
              className="sticky  bg-blue-50 shadow-sm flex flex-col overflow-hidden"
              style={{ top: `${TAB_HEADER_OFFSET}px`, height: panelHeight }}
            >
              {/* Top Header - Sticky */}
              <div className="sticky top-0 z-10 bg-white flex-shrink-0 border-b border-gray-200">
                <div className="bg-warning  px-4 py-3 shadow-sm flex items-center justify-between gap-2">
                 <span className="font-semibold text-black text-sm">
                        {leadResearchers.length} Saved Researchers
                        </span>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
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

                {/* Popup Menu */}
                {isOpen && (
                  <div className="absolute right-4 mt-2 w-48 bg-white text-gray-800 rounded-md border border-gray-200 shadow-lg z-[9999]">
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
                          className={`block w-full text-left px-4 py-2 text-sm transition-colors
                        ${
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

              {/* Cards - Scrollable with fixed height */}
              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
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
        background-color: gray;
      }
    `}
                </style>

                <div className="space-y-2">
                  {paginatedResearchers.map((researcher) => {
                    const isActive = researcher.id === selectedResearcher.id;
                    return (
                      <button
                        type="button"
                        key={researcher.id}
                        onClick={() => handleSelectResearcher(researcher.id)}
                        className={`relative w-full text-left p-4 rounded-xl border transition-all duration-300 shadow-sm ${
                          isActive
                            ? "bg-blue-50 border-2  border-blue-600 shadow-md scale-[1.01]"
                            : "border border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm"
                        }`}
                      >
                        <img
                        src = {bookmark}
                            className="w-5 h-5 text-blue-600 absolute top-3 right-3"
                            strokeWidth={2.2}
                        />

                        {/* Title and Location */}
                        <div className="flex flex-col mb-3">
                          <h3 className="font-semibold text-base text-gray-900">
                            {researcher.name}
                          </h3>
                          <div className="flex text-sm text-gray-500 items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {researcher.location}
                          </div>
                        </div>

                        {/* Trials Stats */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span className="font-semibold text-gray-500">
                              Active Trials (Filtered)
                            </span>
                            <span className="font-semibold text-gray-900">
                              {researcher.cardStats?.activeTrialsFiltered ??
                                "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span className="font-semibold text-gray-500">
                              Total Trials (All Time)
                            </span>
                            <span className="font-semibold text-gray-900">
                              {researcher.cardStats?.totalTrials ?? "-"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pagination & Export Button - Sticky at bottom */}
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
        {currentPage}
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
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
      >
        Prev
      </button>

      {/* Next Button */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
      >
        Next
      </button>
      </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div
            className="flex-1 overflow-y-auto h-full"
            style={{
              scrollbarWidth: "thin",
              padding: "20px 0px 20px 20px",
              width: "71.5%",
              maxHeight: panelHeight,
            }}
          >
            <div className="space-y-6">
              {/* Researcher Info Card */}
              <div className="rounded w-full max-w-[820px] mx-auto">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedResearcher.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">
                        {selectedResearcher.name}
                      </p>
                      <span className="text-sm text-gray-500">
                        {selectedResearcher.specialty}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {selectedResearcher.contact?.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {selectedResearcher.contact?.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-2">
                {/* Performance Metrics */}
                <div className="mt-4 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Performance Metrics
                  </h2>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {performanceCards.map((card, index) => {
                      const theme =
                        metricThemes[card.theme] ?? metricThemes.mint;
                      return (
                        <div
                          key={card.id}
                          className={`${theme.container} border rounded py-4 px-2`}
                        >
                          <p className="font-semibold text-gray-700">
                            {card.badge}
                            <br />
                            <div className="flex gap-1 justify-center items-center mt-1">
                              <p className="font-normal text-sm">
                                {card.label}
                              </p>
                              <img src={help} className="w-3 h-3" alt="help" />
                            </div>
                          </p>
                          {index === 0 ? (
                            <div className="flex justify-center items-center gap-2 mt-2">
                              <p
                                className={`${theme.badge} font-bold text-3xl`}
                              >
                                {card.value}
                              </p>
                              <p className="text-sm text-gray-500">
                                patients <br /> /month
                              </p>
                            </div>
                          ) : (
                            <p
                              className={`${theme.badge} font-bold text-3xl mt-2`}
                            >
                              {card.value}%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Charts Section */}
                <div className="pt-9">
                  <div className="flex flex-col xl:flex-row gap-6 mb-9 w-full">
                    {/* Trials Over Time Chart */}
                    <div className="flex-1 bg-white p-4 border rounded h-[340px] md:h-[380px] lg:h-[400px] 2xl:h-[420px] max-w-[720px] 2xl:max-w-[820px] w-full mx-auto">
                      <TrialsOverTime
                        data={trialsOverTimeData}
                        activeView={timeframe}
                        onViewChange={setTimeframe}
                      />
                    </div>

                    {/* Trials by Phase Chart */}
                    <div className="flex-1 bg-white p-4 border rounded h-[340px] md:h-[380px] lg:h-[400px] 2xl:h-[420px] max-w-[720px] 2xl:max-w-[820px] w-full mx-auto">
                      <TrialsbyPhase data={trialsByPhaseData} />
                    </div>
                  </div>

                  {/* Top Sponsors */}
                  <div className="bg-white border rounded p-4 w-full max-w-[820px] mx-auto lg:h-[260px] flex overflow-x-auto mb-6">
                    <div className="flex-1 min-w-[640px]">
                      <h2 className="text-lg font-bold text-gray-900 mb-3">
                        Top Sponsors
                      </h2>
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="text-gray-400 border-b">
                            <th className="py-2 pr-4">#</th>
                            <th className="py-2 pr-4">Company Name</th>
                            <th className="py-2 pr-4">Trials</th>
                            <th className="py-2 pr-2">P1</th>
                            <th className="py-2 pr-2">P2</th>
                            <th className="py-2 pr-2">P3</th>
                            <th className="py-2 pr-2">P4</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResearcher.topSponsors?.map((sponsor, i) => (
                            <tr
                              key={sponsor.name}
                              className={`${
                                i % 2 === 0 ? "bg-gray-50" : ""
                              } border-b`}
                            >
                              <td className="text-gray-400 py-2 pr-4 font-medium">
                                {i + 1}
                              </td>
                              <td
                                style={{ color: "#2666BE" }}
                                className="py-2 pr-4 font-medium underline"
                              >
                                {sponsor.name}
                              </td>
                              <td className="py-2 pr-4 font-bold">
                                {sponsor.total}
                              </td>
                              <td className="py-2 pr-2">{sponsor.p1 ?? "-"}</td>
                              <td className="py-2 pr-2">{sponsor.p2 ?? "-"}</td>
                              <td className="py-2 pr-2">{sponsor.p3 ?? "-"}</td>
                              <td className="py-2 pr-2">{sponsor.p4 ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Related Trials */}
                <div className="w-full flex flex-col pb-10">
                  {filteredCards.length === 0 ? (
                    <div className="text-center text-gray-600 text-lg mt-10">
                      No Records Found
                    </div>
                  ) : (
                    <>
                      <div className="pt-10 mt-2 mb-2">
                        <span className="font-semibold text-xl text-[#23272B]">
                          Related Trial Studies
                        </span>
                      </div>

                      {/* Cards grid  */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {currentCards.slice(0, 4).map((card, index) => (
                          <div
                            key={`${card.id}-${index}`}
                            className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:shadow-md transition-all cursor-pointer min-w-0"
                            onClick={() => setSelectedCard(card)}
                          >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium min-w-0">
                                <span className="truncate max-w-[160px]">
                                  {card.id}
                                </span>
                                <FontAwesomeIcon
                                  icon={faUpRightFromSquare}
                                  className="w-3 h-3 text-gray-500"
                                />
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                    card.status === "Completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-pink-100 text-pink-700"
                                  }`}
                                >
                                  {card.status}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                    card.phase === "Phase 1"
                                      ? "bg-red-100 text-red-700"
                                      : card.phase === "Phase 2"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {card.phase}
                                </span>
                              </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-sm font-semibold mb-3 leading-snug line-clamp-2">
                              {card.title}
                            </h2>

                            {/* Conditions */}
                            <p className="text-xs font-semibold mb-1 text-gray-700">
                              Conditions
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {card.conditions
                                .slice(0, 2)
                                .map((condition, i) => (
                                  <span
                                    key={i}
                                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100"
                                  >
                                    {condition}
                                  </span>
                                ))}
                              {card.conditions.length > 2 && (
                                <span
                                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalTitle("Conditions");
                                    setModalItems(card.conditions);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  +{card.conditions.length - 2}
                                </span>
                              )}
                            </div>

                            {/* Location and Participants */}
                            <div className="flex justify-between items-center text-xs text-gray-600">
                              <div className="flex items-center gap-1 min-w-0">
                                <FontAwesomeIcon
                                  icon="fa-solid fa-location-dot"
                                  className="w-3 h-3 text-gray-500"
                                />
                                {/* <span className="truncate max-w-[180px]">{card?.location[0]}</span>
                                              {card?.location.length > 1 && (
                                              <span
                                                  className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded cursor-pointer whitespace-nowrap"
                                                  onClick={() => {
                                                  setModalTitle("Locations");
                                                  setModalItems(card?.location);
                                                  setIsModalOpen(true);
                                                  }}
                                              >
                                                  +{card?.location?.length - 1}
                                              </span>
                                              )} */}
                              </div>
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon
                                  icon="fa-solid fa-user-group"
                                  className="w-3 h-3 text-gray-500"
                                />
                                {/* <span className="font-medium">{card?.participants}</span> */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {isModalOpen && (
                  <PopUpModal
                    modalItems={modalItems}
                    modalTitle={modalTitle}
                    setIsModalOpen={setIsModalOpen}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
