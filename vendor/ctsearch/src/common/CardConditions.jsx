// components/TrialCard/CardConditions.jsx
import React from "react";

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
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      {firstChip && (
        <div
          className="flex items-center px-2 rounded whitespace-nowrap"
          style={{
            background:
              selectedCard?.oncosuite_id === card.oncosuite_id
                ? "#FFFFFF"
                : "rgba(240, 246, 254, 1)",
            color:
              selectedCard?.oncosuite_id === card.oncosuite_id
                ? "rgba(0,0,0,0.7)"
                : "rgba(19,51,95,1)",
            fontSize: "14px",
            height: "22px",
            lineHeight: "1", // 🔑 important
            fontFamily: "Rubik",
            fontWeight: "400",
          }}
        >
          {firstChip}
        </div>
      )}

      {remaining > 0 && (
        <div
          className="px-2 rounded-md cursor-pointer"
          style={{
            background: "rgba(220,233,252,1)",
            color: "rgba(47,128,237,1)",
            height: "22px",
            fontSize: "14px",
          }}
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

export default CardConditions;
