import React, { useEffect, useMemo, useRef, useState } from "react";
import CardConditions from "./CardConditions";
import ParticipationIcons from "../assets/icons/participanticon.svg";
import { LocationIcon } from "../assets";
import LanguageIcon from "@mui/icons-material/Language";
import { Typography, Tooltip } from "@mui/material";

const statusStyles = {
  Completed: "bg-green-100 text-green-700",
  New: "bg-orange-50 text-orange-800",
  Recruiting: "bg-orange-100 text-orange-700",
};

const TrialCard = ({
  card,
  isSelected,
  onSelect,
  setModalItems,
  setModalTitle,
  setIsModalOpen,
}) => {
  const unwrapValue = (val) => {
    let current = val;
    // Some API fields are shaped like { value: { value: "..." } }
    for (let i = 0; i < 5; i += 1) {
      if (current && typeof current === "object" && "value" in current) {
        current = current.value;
      } else {
        break;
      }
    }
    return current;
  };

  const hasTopBadges =
    Boolean(card?.phases) &&
    String(card?.phases).trim().length > 0 ||
    (card?.overall_status_clean && card.overall_status_clean !== "Unknown");

  const subtitleText = useMemo(
    () =>
      [card?.histology?.[0], ...(card?.treatment || []), card?.biomarkers?.[0]]
        .map(unwrapValue)
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .join(" • "),
    [card?.histology, card?.treatment, card?.biomarkers],
  );
  const fullTitleText = unwrapValue(card?.official_title) || unwrapValue(card?.brief_title) || "";
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [isSubtitleTruncated, setIsSubtitleTruncated] = useState(false);

  const recomputeTruncation = () => {
    const titleEl = titleRef.current;
    const subtitleEl = subtitleRef.current;

    if (titleEl) {
      // Multi-line clamp overflow detection
      setIsTitleTruncated(titleEl.scrollHeight - titleEl.clientHeight > 1);
    }

    if (subtitleEl) {
      // Single line overflow detection
      setIsSubtitleTruncated(subtitleEl.scrollWidth - subtitleEl.clientWidth > 1);
    }
  };

  useEffect(() => {
    recomputeTruncation();

    const titleEl = titleRef.current;
    const subtitleEl = subtitleRef.current;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recomputeTruncation) : null;

    if (ro && titleEl) ro.observe(titleEl);
    if (ro && subtitleEl) ro.observe(subtitleEl);

    if (!ro) {
      window.addEventListener("resize", recomputeTruncation);
    }

    return () => {
      if (ro) ro.disconnect();
      if (!ro) window.removeEventListener("resize", recomputeTruncation);
    };
  }, [fullTitleText, subtitleText]);

  return (
    <div
      onClick={() => onSelect(card, card.oncosuite_id)}
      className="relative w-full cursor-pointer rounded-md p-[15px] space-y-[12px] px-4 transition-all duration-200"
      style={{
        // minHeight: "130px",
        // boxShadow: "0px 8px 34px rgba(153,169,190,0.1)",
        // border: "2px solid",
        // borderColor: isSelected
        //   ? "rgba(38, 102, 190, 1)"
        //   : "rgba(240, 240, 243, 1)",
        // boxSizing: "border-box",
        width: "304px",
        minHeight: "121px",
        gap: "15px",
        transform: "rotate(0deg)",
        opacity: 1,
        padding: "15px",
        paddingBottom: "44px",
        borderRadius: "4px",
        borderWidth: isSelected ? "2px" : "1px",
        borderStyle: "solid",
        borderColor: isSelected
          ? "var(--Info-600, #2666BE)"
          : "var(--Slate-200, #F0F0F3)",
        background: "#FFFFFF",
        boxShadow: "1px 8px 34px 0px #99A9BE1A"

      }}
    >
      {/* LEFT SELECTION BAR */}
      {isSelected && (
        <div className="absolute left-0 top-0 h-full w-[4px] bg-blue-600 rounded-l-md" />
      )}

      {/* TOP BADGES */}
      {hasTopBadges && (
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {card.phases && (
              <span className="text-xs px-2 py-[2px] rounded text-blue-700 bg-blue-100">
                {/* {card.phases} */}
              </span>
            )}

            {card.overall_status_clean !== "Unknown" && (
              <span
                className={`text-xs px-2 py-[2px] rounded ${statusStyles[card.overall_status_clean] ||
                  "bg-gray-100 text-gray-600"
                  }`}
              >
                {card.overall_status_clean}
              </span>
            )}
          </div>
        </div>
      )}

      {/* TITLE */}
      <Typography
        ref={titleRef}
        title={isTitleTruncated ? fullTitleText : undefined}
        sx={{
          fontSize: "16px",
          fontWeight: 600,
          lineHeight: "18px",
          letterSpacing: "0%",
          fontFamily: "Rubik",
          color: "rgba(0,0,0,0.8)",
          mb: 0.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        {fullTitleText}
      </Typography>

      <Tooltip
        title={isSubtitleTruncated ? subtitleText : ""}
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "#FFFFFF",
              color: "rgba(0, 0, 0, 0.8)",
              borderRadius: "8px",
              padding: "10px 12px",
              boxShadow: "0px 4px 10px rgba(130, 143, 169, 0.15)",
              fontFamily: "Rubik",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
              letterSpacing: "0%",
              maxWidth: "320px",
            },
          },
          arrow: {
            sx: {
              color: "#FFFFFF",
              "&:before": {
                boxShadow: "0px 4px 10px rgba(130, 143, 169, 0.15)",
              },
            },
          },
        }}
      >
        <Typography
          ref={subtitleRef}
          sx={{
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            fontFamily: "Rubik",
            color: "rgba(0,0,0,0.6)",

            textAlign: "left",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitleText}
        </Typography>
      </Tooltip>

      {/* CONDITIONS */}
      <CardConditions
        card={card}
        selectedCard={isSelected ? card : null}
        setModalItems={setModalItems}
        setModalTitle={setModalTitle}
        setIsModalOpen={setIsModalOpen}
      />

      {/* STATS */}
      <div
        className="flex items-center gap-6 text-gray-600"
        style={{
          position: "absolute",
          left: 15,
          right: 15,
          bottom: 12,
        }}
      >
        {/* Countries */}
        <div className="flex items-center gap-2">
          <LanguageIcon sx={{ width: 16, height: 16 }} />
          <span className="text-[16px] font-medium">
            {card?.country_count ?? 0}
          </span>
        </div>

        {/* Sites */}
        <div className="flex items-center gap-2">
          <img src={LocationIcon} alt="sites" className="w-4 h-4" />
          <span className="text-[16px] font-medium">{card?.sites_count ?? 0}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2">
          <img
            src={ParticipationIcons}
            alt="participants"
            className="w-4 h-4"
          />
          <span className="text-[16px] font-medium">
            {card?.enrollment_count ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrialCard);
