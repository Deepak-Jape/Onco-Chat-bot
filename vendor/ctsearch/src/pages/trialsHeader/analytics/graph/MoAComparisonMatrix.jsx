import Card from "@mui/material/Card";
import React from "react";

const mockData = {
  headers: [
    "Intervention MoA",
    "Anti-TNF",
    "Checkpoint",
    "Tyrosine Kinase",
    "Bispecific",
  ],
  rows: [
    { label: "Monoclonal Ab", values: [12, 28, 8, 15] },
    { label: "Checkpoint Inhibitor", values: [4, 35, 18, 22] },
    { label: "Tyrosine Kinase", values: [6, 16, 24, 14] },
    { label: "Bispecific Ab", values: [8, 19, 11, 18] },
    { label: "Small Molecule", values: [5, 12, 16, 9] },
    { label: "Cell Therapy", values: [2, 14, 5, 8] },
  ],
};

const getBg = (value) => {
  if (value > 30) return "bg-blue-700 text-white";
  if (value > 20) return "bg-blue-500 text-white";
  if (value > 10) return "bg-blue-300";
  return "bg-blue-100";
};

export default function MoAComparisonMatrix({ data = mockData }) {
  return (
    <Card className="p-4 w-full">
      <h2 className="text-xl font-semibold mb-4">MoA Comparison Matrix</h2>

      <div className="grid grid-cols-5 gap-5 font-semibold text-gray-600 mb-2">
        {data.headers.map((header) => (
          <div
            style={{
              fontSize: "12px",
              whiteSpace: "nowrap",
              fontFamily: "Rubik",
              textAlign: "center",
            }}
            key={header}
            className="p-1"
          >
            {header}
          </div>
        ))}
      </div>

      {data.rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-5 gap-2 items-center mb-2"
        >
          <div
            style={{
              fontSize: "12px",
              fontFamily: "Rubik",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              color: "rgba(0, 0, 0, 0.6)",
              background: "rgba(240, 240, 243, 1)",
            }}
            className="p-1 text-gray-700 font-medium"
          >
            {row.label}
          </div>

          {row.values.map((val, i) => (
            <div
              key={i}
              style={{
                padding: "4px",
                fontFamily: "Rubik",
                fontSize: "12px",
              }}
              className={` text-center ${getBg(val)}`}
            >
              {val}
            </div>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
        <span
          style={{
            color: "rgba(0, 0, 0, 0.7)",
            fontWeight: "500",
            fontFamily: "Rubik",
          }}
        >
          Usage:
        </span>
        <span className="flex items-center gap-1">
          Low
          <span className="w-3 h-3 bg-blue-100 rounded-full" />
          <span className="w-3 h-3 bg-blue-300 rounded-full" />
          <span className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="w-3 h-3 bg-blue-700 rounded-full" />
          High
        </span>
      </div>
    </Card>
  );
}
