import { useMemo, useState, useEffect } from "react";
import { MapPin, Building2, Download } from "lucide-react";
import TrialTrendChart from "../trialsHeader/analytics/graph/TrialTrendChart"
import institutionsMock from "../../json/institutions.json"
import TrialSpecialties from "../trialsHeader/sites/graph/TrialSpecialties"
import leadResearchersMock from "../../json/leadResearchers.json"
import { callIcon, mailIcon } from "../../assets"
import { Bookmark } from "lucide-react";
import bookmark from "../../assets/icons/bookmark-line.svg"



import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import response from "../../json/response.json"
import PopUpModal from "../trialsHeader/trials/PopUpModal";
import TrialSkeleton from "../trialsHeader/trials/CardSkeleton";


// import PopUpModal from "../trials/PopUpModal";
// import TrialSkeleton from "../trials/CardSkeleton";
// import RightCardSkeleton from "../trials/RightCardSkeleton";
// import LeftCardSkeleton from "../trials/LeftCardSkeleton";

const cardsPerPage = 4;
const TAB_HEADER_OFFSET = 205;
const panelHeight = `calc(100vh - ${TAB_HEADER_OFFSET}px)`;

const phaseList = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

const defaultVolumeTemplate = [
  { year: 2020, values: [3, 2, 2, 1] },
  { year: 2021, values: [4, 3, 3, 2] },
  { year: 2022, values: [5, 4, 4, 3] },
  { year: 2023, values: [6, 5, 5, 4] },
  { year: 2024, values: [7, 6, 6, 5] },
];

const performanceConfigs = [
  {
    id: "recruitSpeed",
    badge: "Fast",
    label: "Recruit Speed",
    unitLabel: "patients /month",
    theme: "mint",
    getter: (institution) => {
      const enrollmentRate =
        institution.performanceMetrics?.enrollmentRate ?? 0;
      return Math.max(10, Math.round(enrollmentRate * 0.45));
    },
  },
  {
    id: "dropoutRate",
    badge: "Low",
    label: "Dropout Rate",
    unitLabel: "%",
    theme: "softBlue",
    getter: (institution) => institution.performanceMetrics?.dropoutRate ?? 0,
  },
  {
    id: "eventTarget",
    badge: "Average",
    label: "Enroll Target Achievement",
    unitLabel: "%",
    theme: "amber",
    getter: (institution) => institution.performanceMetrics?.eventTarget ?? 0,
  },
  {
    id: "completionRate",
    badge: "High",
    label: "Trials Completion Rate",
    unitLabel: "%",
    theme: "mint",
    getter: (institution) =>
      institution.performanceMetrics?.completionRate ?? 0,
  },
];

const metricThemes = {
  mint: {
    container: "bg-lightBlue border border-lightBlueBorder",
    badge: "text-green-600",
  },
  softBlue: {
    container: "bg-sLightBlue border border-sLightBlueBorder",
    badge: "text-blue-600",
  },
  amber: {
    container: "bg-lightPink border border-borderlightPink",
    badge: "text-orangeWarning",
  },
};

const topLeadResearchers =
  leadResearchersMock?.leadResearchers?.slice(0, 8) ?? [];

const buildTrialVolumeByPhase = (institution) => {
  if (institution.trialVolumeByPhase) {
    return institution.trialVolumeByPhase;
  }

  const totalTrials = institution.summary?.totalTrialsAllTime ?? 1;
  const multiplier = Math.max(1, totalTrials / 40);

  const graphData = defaultVolumeTemplate.flatMap((entry) =>
    entry.values.map((value, idx) => ({
      year: entry.year,
      quarter: idx + 1,
      phase: phaseList[idx],
      trial_count: Math.round(value * multiplier),
    }))
  );

  return {
    filters: { Phase: phaseList },
    graphData,
  };
};

export default function InstitutionFavorites() {
  const { institutions = [], meta = {} } = institutionsMock || {};
  const [selectedId, setSelectedId] = useState(institutions[0]?.id ?? null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("");
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
    meta.totalPages ?? Math.ceil(institutions.length / cardsPerPage)
  );

  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return institutions.slice(start, start + cardsPerPage);
  }, [currentPage, institutions]);

  const selectedInstitution = useMemo(() => {
    return (
      institutions.find((institution) => institution.id === selectedId) ||
      institutions[0] ||
      null
    );
  }, [institutions, selectedId]);

  if (!institutions.length || !selectedInstitution) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        Institution data is not available yet.
      </div>
    );
  }

  const summary = selectedInstitution.summary ?? {};
  const facilities = selectedInstitution.facilitiesAndResources ?? [];
  const topSponsors = selectedInstitution.topSponsors ?? [];
  const trialSpecialties = selectedInstitution.trialSpecialties ?? [];

  const performanceCards = performanceConfigs.map((config) => ({
    ...config,
    value: config.getter(selectedInstitution),
  }));

  const trialVolumeByPhaseData = buildTrialVolumeByPhase(selectedInstitution);

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

  const handleSelectInstitution = (id) => {
    setSelectedId(id);
  };

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
              className="sticky bg-blue-50 shadow-sm flex flex-col overflow-hidden"
              style={{ top: `${TAB_HEADER_OFFSET}px`, height: panelHeight }}
            >
              {/* Top Header */}
              <div className="sticky top-0 z-10 bg-white flex-shrink-0 border-b border-gray-200">
                <div className="bg-warning px-4 py-3 shadow-sm flex items-center justify-between gap-2">
                  <span className="font-semibold text-black text-sm">
                    {institutions.length} Saved Institutions
                  
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
                            setSelectedSort(item);
                            setIsOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedSort === item
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

              {/* Cards */}
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
                  {paginatedInstitutions.map((institution) => {
                    const isActive = institution.id === selectedInstitution.id;
                    return (
                   <button
  type="button"
  key={institution.id}
  onClick={() => handleSelectInstitution(institution.id)}
  className={`relative w-full text-left p-4 rounded-xl border transition-all duration-300 shadow-sm ${
    isActive
      ? "bg-blue-50 border-2 border-blue-600 shadow-md scale-[1.01]"
      : "border border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm"
  }`}
>
  {/* BOOKMARK ICON (Top Right) */}
  <img
  src = {bookmark}
    className="w-5 h-5 text-blue-600 absolute top-3 right-3"
    strokeWidth={2.2}
  />

  <div className="flex flex-col mb-3">
    <h3 className="font-semibold text-base text-gray-900">
      {institution.name}
    </h3>
    <div className="flex text-sm text-gray-500 items-center mt-1">
      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
      {institution.location}
    </div>
  </div>

  <div className="space-y-1 text-xs text-gray-600">
    <div className="flex justify-between font-semibold">
      <span>Active Trials (Filtered)</span>
      <span className="text-gray-900">
        {institution.summary?.activeTrialsFiltered ?? "-"}
      </span>
    </div>
    <div className="flex justify-between font-semibold">
      <span>Total Trials (All Time)</span>
      <span className="text-gray-900">
        {institution.summary?.totalTrialsAllTime ?? "-"}
      </span>
    </div>
    <div className="flex justify-between font-semibold">
      <span>Lead Researchers (Filtered)</span>
      <span className="text-gray-900">
        {institution.summary?.leadResearchersFiltered ?? "-"}
      </span>
    </div>
  </div>

  <div className="flex flex-wrap gap-2 mt-3">
    {institution.summary?.tags?.map((tag) => (
      <span
        key={tag}
        className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium"
      >
        {tag}
      </span>
    ))}
  </div>
</button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
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
              {/* Institution Header */}
              <div className="">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <p className="font-semibold text-2xl text-gray-900">
                        {selectedInstitution.name}
                      </p>
                      <p className="text-sm text-gray-500 flex gap-2 items-center">
                        <MapPin className="w-4 h-4" />
                        {selectedInstitution.location}
                      </p>
                    </div>
                    {selectedInstitution.type && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedInstitution.type}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-2 space-y-8">
                {/* Performance Metrics */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                    {performanceCards.map((card, index) => {
                      const theme =
                        metricThemes[card.theme] ?? metricThemes.mint;
                      const isSpeedCard = index === 0;
                      return (
                        <div
                          key={card.id}
                          className={`${theme.container} rounded py-4 px-3 shadow-sm`}
                        >
                          <p className="font-semibold text-gray-700">
                            {card.badge}
                            <br />
                            <span className="font-normal text-sm">
                              {card.label}
                            </span>
                          </p>
                          {isSpeedCard ? (
                            <div className="flex justify-center items-center gap-2 mt-2">
                              <p
                                className={`${theme.badge} font-bold text-3xl`}
                              >
                                {card.value}
                              </p>
                              <p className="text-sm text-gray-500 text-left">
                                {card.unitLabel}
                              </p>
                            </div>
                          ) : (
                            <p
                              className={`${theme.badge} font-bold text-3xl mt-2`}
                            >
                              {card.value}
                              {card.unitLabel}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Charts */}
                <div className="flex flex-col xl:flex-row gap-6">
                  <div className="flex-1">
                    <TrialTrendChart
                      trialVolumeByPhase={trialVolumeByPhaseData}
                    />
                  </div>
                  <div className="flex-1">
                    <TrialSpecialties data={trialSpecialties} />
                  </div>
                </div>

                {/* Top Sponsors */}
                <div className="bg-white border rounded p-4 w-full max-w-[920px] mx-auto flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Top Sponsors
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[620px]">
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
                        {topSponsors.map((sponsor) => (
                          <tr
                            key={sponsor.rank}
                            className={`${
                              sponsor.rank % 2 === 0 ? "bg-gray-50" : ""
                            } border-b`}
                          >
                            <td className="text-gray-400 py-2 pr-4 font-medium">
                              {sponsor.rank}
                            </td>
                            <td
                              style={{ color: "#2666BE" }}
                              className="py-2 pr-4 font-medium underline"
                            >
                              {sponsor.companyName}
                            </td>
                            <td className="py-2 pr-4 font-bold">
                              {sponsor.total}
                            </td>
                            <td className="py-2 pr-2">
                              {sponsor.phase1 ?? "-"}
                            </td>
                            <td className="py-2 pr-2">
                              {sponsor.phase2 ?? "-"}
                            </td>
                            <td className="py-2 pr-2">
                              {sponsor.phase3 ?? "-"}
                            </td>
                            <td className="py-2 pr-2">
                              {sponsor.phase4 ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lead Researchers */}
                <div className="bg-white border rounded p-4 w-full max-w-[920px] mx-auto flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Lead Researchers
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[640px]">
                      <thead>
                        <tr className="text-gray-400 border-b">
                          <th className="py-2 pr-4">#</th>
                          <th className="py-2 pr-4">Researcher Name</th>
                          <th className="py-2 pr-4">Contact Information</th>
                          <th className="py-2 pr-2">Active Trials</th>
                          <th className="py-2 pr-2">Past Trials</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topLeadResearchers.map((researcher, index) => (
                          <tr
                            key={researcher.id}
                            className={`${
                              index % 2 === 0 ? "bg-gray-50" : ""
                            } border-b`}
                          >
                            <td className="text-gray-400 py-2 pr-4 font-medium">
                              {index + 1}
                            </td>
                            <td
                              style={{ color: "#2666BE" }}
                              className="py-2 pr-4 font-medium underline"
                            >
                              {researcher.name}
                            </td>
                            <td className="py-2 pr-4 text-gray-500 font-semibold space-y-1">
                              <div className="flex items-center gap-2">
                                <img
                                  src={mailIcon}
                                  className="w-4 h-4"
                                  alt="email"
                                />
                                <span>{researcher.contact?.email}</span>
                              </div>
                              <div className="flex items-center  gap-2">
                                <img
                                  src={callIcon}
                                  className="w-4 h-4"
                                  alt="phone"
                                />
                                <span>{researcher.contact?.phone}</span>
                              </div>
                            </td>
                            <td className="py-2 pr-2 font-bold text-gray-700">
                              {researcher.cardStats?.activeTrialsFiltered ??
                                researcher.activeTrials ??
                                "-"}
                            </td>
                            <td className="py-2 pr-2 font-bold text-gray-700">
                              {researcher.cardStats?.totalTrials ??
                                researcher.pastTrials ??
                                "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Facilities */}
                <div className="bg-white border rounded p-4 w-full max-w-[920px] mx-auto flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Facilities & Resources
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {facilities.map((facility) => (
                      <div
                        key={facility.id}
                        className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          {facility.name}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                          {facility.status}
                        </span>
                      </div>
                    ))}
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
                            {card.conditions.slice(0, 2).map((condition, i) => (
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
      )}
    </>
  );
}
