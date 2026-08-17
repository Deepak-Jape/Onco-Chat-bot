import React from "react";

const conditions = [
  "Breast cancer",
  "Cervical cancer",
  "Colorectal cancer",
  "Endometrial/Uterine cancer",
  "Esophageal cancer",
  "Gastroesophageal Junction cancer",
];

const regions = ["Africa", "Asia", "Europe", "N America", "S America"];

const levels = ["High Activity (20+)", "Moderate (15-19)", "Low (5-14)", "Minimal (1-4)"];

function cellShade(v) {
  const shades = ["#DBEAFE", "#93C5FD", "#60A5FA", "#2563EB"];
  return shades[Math.min(3, Math.max(0, v - 1))];
}

export default function RecruitmentCompetition() {
  // generate stable demo data 1-4
  const matrix = conditions.map((_, r) => regions.map((_, c) => ((r * 3 + c * 2) % 4) + 1));

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-1">Recruitment Competition Index</h2>
      <p className="text-gray-600 text-sm mb-3">Reveals number of actively recruiting trials per condition and region simultaneously</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm pb-4">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 text-gray-800 border-b border-gray-200">Condition</th>
              {regions.map((r) => (
                <th key={r} className="text-center py-2 px-2 text-gray-800 border-b border-gray-200">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conditions.map((cond, i) => (
              <tr key={cond}>
                <td className="py-2 pr-3 font-semibold text-gray-700 border-b border-gray-200">
                  {cond}
                </td>
                {regions.map((r, j) => (
                  <td
                    key={r + j}
                    className="px-2 py-2 text-center border-b border-gray-200"
                  >
                    <div
                      className="w-15 h-7 mx-auto rounded-sm"
                      style={{
                        backgroundColor: cellShade(matrix[i][j]),
                        minWidth: "4rem",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600 mt-4 mb-5 flex-wrap">
        {/* <span className="font-medium">Legend:</span> */}
        {levels.map((l, idx) => (
          <span key={l} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: cellShade(4 - idx) }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}


