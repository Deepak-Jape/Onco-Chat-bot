// components/TrialCard/TrialCard.jsx
import React from "react";
import CardConditions from "./CardConditions";
import ParticipationIcons from "../assets/icons/participanticon.svg";
import { ExternalLinkLine, LocationIcon } from "../assets";
import LanguageIcon from "@mui/icons-material/Language";

const TrialCard = ({
  card,
  isSelected,
  onSelect,
  setModalItems,
  setModalTitle,
  setIsModalOpen,
}) => {
  return (
    <div
      className="relative w-full bg-white shadow-sm rounded-md p-4 cursor-pointer border-solid"
      onClick={() => onSelect(card, card.nct_id)}
      style={{
        background: isSelected ? "#DCE9FC" : "#eFF6FF",
        // height: "212px",
        minHeight: "160px",
      }}
    >
      {/* LEFT BLUE SELECTION BAR */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "4px",
            backgroundColor: "rgba(38, 102, 190, 1)",
            borderTopLeftRadius: "6px",
            borderBottomLeftRadius: "6px",
          }}
        />
      )}

      {/* HEADER */}
      <div className="flex items-center text-sm mb-2 flex-wrap">
        <div className="flex items-center space-x-2">
          {/* <a
            href={`https://clinicaltrials.gov/study/${card.nct_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium break-words"
            style={{
              color: "rgba(0, 0, 0, 0.7)",
              fontSize: "14px",
              display: "flex",
              gap: "3px",
              fontWeight: "400",
            }}
          > */}
          {/* {card.nct_id} */}
          {/* <img src={ExternalLinkLine} alt="external" /> */}
          {/* </a> */}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {card.phases && (
            <span
              style={{
                height: "22px",
                fontFamily: "Rubik",
                color: "rgba(38, 102, 190, 1)",
                fontSize: "14px",
                fontWeight: "400",
              }}
              className="text-xs font-medium px-2 py-0.5 rounded"
            >
              {card.phases}
            </span>
          )}
          <span
            style={{
              fontFamily: "Rubik",
              fontSize: "14px",
              fontWeight: "400",
              background:
                card.overall_status_clean === "Completed"
                  ? "rgba(218, 241, 228, 1)"
                  : card.overall_status_clean === "New"
                    ? "rgba(254, 246, 238, 1)"
                    : card.overall_status_clean === "Recruiting"
                      ? "rgba(253, 233, 214, 1)"
                      : "",
              color:
                card.overall_status_clean === "Completed"
                  ? "rgba(31, 139, 77, 1)"
                  : card.overall_status_clean === "New"
                    ? "rgba(96, 51, 6, 1)"
                    : card.overall_status_clean === "Recruiting"
                      ? "rgba(193, 102, 13, 1)"
                      : "rgba(253, 233, 214, 1)",
              height: "22px",
            }}
            className="text-xs font-medium px-2 py-0.5 rounded"
          >
            {card.overall_status_clean === "Unknown"
              ? ""
              : card.overall_status_clean}
          </span>
        </div>
      </div>

      {/* TITLE */}
      <div className="relative group w-full">
        <h2
          style={{
            fontFamily: "Rubik",
            color: isSelected ? "#1C4D8E" : "rgba(0, 0, 0, 0.8)",
            fontSize: "14px",
            fontWeight: "600",
          }}
          className="text-left line-clamp-2 mb-2 break-words cursor-pointer"
          title={card.brief_title}
        >
          {card.official_title}
        </h2>

        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-normal w-max max-w-xs z-[9999] shadow-lg">
          {card.brief_title}
        </div>
      </div>

      {/* CONDITIONS */}
      <div className="flex justify-between font-semibold pb-1">
        {/* <p style={{ fontSize: "11px", fontWeight: "500" }}>Conditions</p> */}
      </div>

      <CardConditions
        card={card}
        selectedCard={isSelected ? card : null}
        setModalItems={setModalItems}
        setModalTitle={setModalTitle}
        setIsModalOpen={setIsModalOpen}
      />

      {/* LOCATION & PARTICIPANTS */}
      {/* LOCATION / SITES / PARTICIPANTS COUNTS */}
      <div className="flex items-center gap-6 mt-3">
        {/* Countries */}
        <div className="flex items-center gap-2">
          {/* <img
            src={LocationIcon} // 🌍 replace with globe icon if you have one
            alt="countries"
            style={{ width: 16, height: 16 }}
          /> */}
          <LanguageIcon
            sx={{
              width: 16,
              height: 16,
              color: "rgba(0, 0, 0, 0.6)",
            }}
          />
          <span
            style={{
              fontFamily: "Rubik",
              fontSize: "16px",
              fontWeight: 500,
              color: "rgba(0,0,0,0.6)",
              lineHeight: "18px",
            }}
          >
            {card?.country_count ?? 0}
          </span>
        </div>

        {/* Sites / Locations */}
        <div className="flex items-center gap-2">
          <img
            src={LocationIcon} // 📍 pin icon
            alt="sites"
            style={{ width: 16, height: 16 }}
          />
          <span
            style={{
              fontFamily: "Rubik",
              fontSize: "16px",
              fontWeight: 500,
              color: "rgba(0,0,0,0.6)",
              lineHeight: "18px",
            }}
          >
            {card?.sites_count ?? 0}
          </span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2">
          <img
            src={ParticipationIcons}
            alt="participants"
            style={{ width: 16, height: 16 }}
          />
          <span
            style={{
              fontFamily: "Rubik",
              fontSize: "16px",
              fontWeight: 500,
              color: "rgba(0,0,0,0.6)",
              lineHeight: "18px",
            }}
          >
            {card?.enrollment_count ?? 0}
          </span>
        </div>
      </div>

      {/* </div> */}
    </div>
  );
};

export default TrialCard;
