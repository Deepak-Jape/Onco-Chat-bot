import React, { useState } from "react";

const GuidelineTableCard = ({ title = "", columns = [], data = [] }) => {
  if (!data || data.length === 0) return null;

  const [showAll, setShowAll] = useState(false);

  const visibleRows = showAll ? data : data.slice(0, 5);
  const hiddenCount = data.length - 5;

  const colWidth = columns?.length > 0 ? `${100 / columns.length}%` : "auto";

  const formatValue = (value) => {
    if (!value || value === "Not Available") return "—";
    return value;
  };

  return (
    <div className="bg-white border rounded-lg shadow-all-sides mt-4 p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="text-left text-md font-semibold text-gray-700 py-2 border-b break-words whitespace-normal"
                  style={{
                    width: colWidth,
                    maxWidth: colWidth,
                    paddingRight: "20px",
                    fontFamily: "Rubik",
                    color: "rgba(0, 0, 0, 0.6)",
                    fontWeight: "500",
                    fontSize: "15px",
                    textAlign: "left",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="py-3 align-top break-words whitespace-normal leading-relaxed"
                    style={{
                      width: colWidth,
                      maxWidth: colWidth,
                      paddingRight: "20px",

                      fontFamily: "Rubik",
                      textAlign: "left",
                      fontSize: colIndex === 0 ? "14px" : "14px",
                      fontWeight: colIndex === 0 ? 500 : 400,
                      color:
                        colIndex === 0
                          ? "rgba(0, 0, 0, 0.8)"
                          : "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    {formatValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 5 && (
        <div className="mt-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            {showAll ? "Show less" : `Show all ${hiddenCount} >`}
          </button>
        </div>
      )}
    </div>
  );
};

export default GuidelineTableCard;
