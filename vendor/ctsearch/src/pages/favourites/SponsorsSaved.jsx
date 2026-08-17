import { useState, useMemo, useEffect } from "react";
import { MapPin } from "lucide-react";
import bookmark from "../../assets/icons/bookmark-line.svg";
import { Typography } from "@mui/material";
import LeftCardSkeleton from "../trialsHeader/trials/LeftCardSkeleton";

// ---- STATIC SPONSOR LIST ----
const sponsorsMock = [
  {
    id: 1,
    name: "Pharma Corp",
    location: "Basel, Switzerland",
    summary: {
      activeTrialsFiltered: 28,
      totalTrialsAllTime: 156,
      tags: ["High performance", "Fast recruiting"],
    },
  },
  {
    id: 2,
    name: "NovaCura Therapeutics",
    location: "Houston, TX",
    summary: {
      activeTrialsFiltered: 18,
      totalTrialsAllTime: 32,
      tags: ["Excellent recruitment"],
    },
  },
  {
    id: 3,
    name: "Cellaris Oncology",
    location: "Houston, TX",
    summary: {
      activeTrialsFiltered: 9,
      totalTrialsAllTime: 15,
      tags: [],
    },
  },
  {
    id: 4,
    name: "Vigorion Therapeutics",
    location: "Houston, TX",
    summary: {
      activeTrialsFiltered: 12,
      totalTrialsAllTime: 27,
      tags: [],
    },
  },
];

// how many cards per page
const cardsPerPage = 4;

export default function SponsorSaved() {
  const [selectedId, setSelectedId] = useState(sponsorsMock[0].id);
  const [currentPage, setCurrentPage] = useState(3); // example
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 1200);

  return () => clearTimeout(timer);
}, []);
useEffect(() => {
  setCurrentPage(1); // force reset on page load
}, []);

const totalPages = 50;


const paginatedSponsors = useMemo(() => {
  const start = (currentPage - 1) * cardsPerPage;
  return sponsorsMock.slice(start, start + cardsPerPage);
}, [currentPage]);

  return (
    <div className="flex" style={{ width: "85%", minHeight: "100vh" }}>
      
      {/* LEFT SIDEBAR */}
      <aside style={{ width: "28.5%" }} className="flex-shrink-0 font-inter">
          {isLoading ? (
    <LeftCardSkeleton />   // 🔥 ONLY YOUR LEFT SKELETON
  ) : (
        <div className="sticky bg-blue-50 shadow-sm flex flex-col overflow-hidden"
          style={{ top: "200px", height: "calc(100vh - 205px)" }}
        >

          {/* HEADER */}
          <div className="sticky z-10 bg-white border-b border-gray-200">
            <div className="bg-warning px-4 py-3 shadow-sm flex items-center justify-between">
              <span className="font-semibold text-black text-sm">
                {sponsorsMock.length} Sponsors Saved
              </span>

              {/* SORT ICON */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="black"
                className="w-5 h-5 cursor-pointer"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h8" />
              </svg>
            </div>

            {isOpen && (
              <div className="absolute right-4 mt-2 w-48 bg-white border rounded-md shadow-lg z-[9999]">
                <p className="px-4 py-2 text-xs text-gray-500 border-b">Sort by</p>
                <button className="block px-4 py-2 text-sm hover:bg-gray-50 w-full text-left">New</button>
                <button className="block px-4 py-2 text-sm hover:bg-gray-50 w-full text-left">Recently Updated</button>
                <button className="block px-4 py-2 text-sm hover:bg-gray-50 w-full text-left">OncoSuite Score</button>
              </div>
            )}
          </div>

          {/* CARD LIST */}
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <style>
              {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(0,0,0,0.2);
                  border-radius: 3px;
                }
              `}
            </style>

            <div className="space-y-2">
              {paginatedSponsors.map((sponsor) => {
                const isActive = sponsor.id === selectedId;

                return (
                 <button
  key={sponsor.id}
  className={`relative w-full text-left p-4 rounded-xl transition-all duration-300 shadow-sm ${
    isActive
      ? "bg-blue-50 border-2 border-blue-600 shadow-md scale-[1.01]"
      : "bg-white border border-gray-200 hover:border-blue-400 hover:shadow-sm"
  }`}
  onClick={() => setSelectedId(sponsor.id)}
>
  {/* BOOKMARK */}
  <img
    src={bookmark}
    alt="bookmark"
    className="w-5 h-5 absolute top-3 right-3"
  />

  {/* NAME */}
  <Typography
    sx={{
      fontFamily: "Rubik",
      fontSize: "17px",
      fontWeight: 700,
      lineHeight: "20px",
      style:"bold",
      color: "rgba(0,0,0,0.8)",
      mb: "4px",
    }}
  >
    {sponsor.name}
  </Typography>

  {/* LOCATION */}
  <div className="flex items-center">
    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
    <Typography
      sx={{
        fontFamily: "Rubik",
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: "14px",
        color: "rgba(0,0,0,0.7)",
      }}
    >
      {sponsor.location}
    </Typography>
  </div>

  {/* TRIAL STATS */}
  <div className="space-y-1 text-xs mt-3">

    {/* Active Trials Label + Value */}
    <div className="flex justify-between">
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "30px",
          color: "rgba(0,0,0,1)",
        }}
      >
        Active Trials (Filtered)
      </Typography>

      <Typography
        sx={{
          fontFamily: "Rubik",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "30px",
          color: "rgba(0,0,0,0.7)",
        }}
      >
        {sponsor.summary.activeTrialsFiltered}
      </Typography>
    </div>

    {/* Total Trials Label + Value */}
    <div className="flex justify-between">
      <Typography
        sx={{
          fontFamily: "Rubik",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "14px",
          color: "rgba(0,0,0,1)",
        }}
      >
        Total Trials (All Time)
      </Typography>

      <Typography
        sx={{
          fontFamily: "Rubik",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "14px",
          color: "rgba(0,0,0,0.7)",
        }}
      >
        {sponsor.summary.totalTrialsAllTime}
      </Typography>
    </div>

  </div>
</button>

                );
              })}
            </div>
          </div>

          {/* FOOTER PAGINATION */}
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
          )}
      </aside>

      {/* RIGHT SIDE EMPTY FOR NOW */}
      <div className="flex-1 bg-gray-100"></div>

    </div>
  );
}
