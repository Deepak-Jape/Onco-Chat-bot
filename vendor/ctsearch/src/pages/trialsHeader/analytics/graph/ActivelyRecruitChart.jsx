// import Divider from "@mui/material/Divider";
// import React, { useMemo } from "react";

// const shades = ["#DBEAFE", "#93C5FD", "#60A5FA", "#2563EB"]; // low → high

// function getShade(v, max) {
//   if (!v) return shades[0];
//   const level = Math.ceil((v / max) * 4);
//   return shades[Math.min(level - 1, 3)];
// }

// export default function ActivelyRecruitChart({ data }) {
//   const conditions = data?.filters?.condition || [];
//   const regions = data?.filters?.country || [];

//   const maxValue = Math.max(
//     ...(data?.graphData?.map((g) => g.trial_count) ?? [1])
//   );

//   // Build map lookup → trial_count
//   const lookup = useMemo(() => {
//     const m = {};
//     data?.graphData?.forEach((g) => {
//       m[`${g.name}__${g.country}`] = g.trial_count;
//     });
//     return m;
//   }, [data]);

//   return (
//     <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
//       <h2 className="text-2xl font-semibold mb-1">
//         Actively Recruiting Trials by Country
//       </h2>

//       <div className="overflow-x-auto">
//         <table className="w-full text-sm pb-4" style={{ marginTop: "20px" }}>
//           <tbody>
//             {conditions.map((cond) => (
//               <tr key={cond}>
//                 <td
//                   className="py-1 pr-3 font-semibold"
//                   style={{ fontSize: "12px" }}
//                 >
//                   {cond}
//                 </td>

//                 {regions.map((r, index) => {
//                   const key = `${cond}__${r}`;
//                   const value = lookup[key] || 0;

//                   return (
//                     <td key={index} className="px-1 py-1 text-center">
//                       <div
//                         className="w-5 h-8 mx-auto rounded-sm"
//                         style={{ backgroundColor: getShade(value, maxValue) }}
//                         title={`${value} trials`}
//                       />
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}

//             {/* rotate country names */}
//             <tr>
//               <td></td>
//               {regions.map((r, idx) => (
//                 <td
//                   key={r + idx}
//                   className="px-1 py-1 text-center"
//                   style={{ height: "60px", verticalAlign: "bottom" }}
//                 >
//                   <div
//                     style={{
//                       writingMode: "vertical-rl",
//                       transform: "rotate(180deg)",
//                       fontSize: "10px",
//                       whiteSpace: "nowrap",
//                       opacity: 0.7,
//                     }}
//                   >
//                     {r}
//                   </div>
//                 </td>
//               ))}
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Legend */}
//       <div className="flex items-center gap-3 text-xs mt-4 flex-wrap">
//         <span className="flex items-center gap-1">
//           <span
//             className="inline-block w-3 h-3 rounded-full"
//             style={{ background: shades[3] }}
//           />{" "}
//           High
//         </span>
//         <span className="flex items-center gap-1">
//           <span
//             className="inline-block w-3 h-3 rounded-full"
//             style={{ background: shades[2] }}
//           />{" "}
//           Moderate
//         </span>
//         <span className="flex items-center gap-1">
//           <span
//             className="inline-block w-3 h-3 rounded-full"
//             style={{ background: shades[1] }}
//           />{" "}
//           Low
//         </span>
//         <span className="flex items-center gap-1">
//           <span
//             className="inline-block w-3 h-3 rounded-full"
//             style={{ background: shades[0] }}
//           />{" "}
//           Minimal
//         </span>
//       </div>
//     </div>
//   );
// }

import Divider from "@mui/material/Divider";
import React from "react";

const conditions = [
  "Breast cancer",
  "Cervical cancer",
  "Colorectal cancer",
  "Endometrial/Uterine cancer",
  "Esophageal cancer",
  "Gastroesophageal Junction cancer",
];

const regions = [
  "Switzerland",
  "France",
  "Canada",
  "Japan",
  "Australia",
  "Switzerland",
  "France",
  "Canada",
  "Japan",
  "Australia",
  "Switzerland",
  "France",
  "Canada",
];

const levels = [
  "High Activity (20+)",
  "Moderate (15-19)",
  "Low (5-14)",
  "Minimal (1-4)",
];

function cellShade(v) {
  const shades = ["#DBEAFE", "#93C5FD", "#60A5FA", "#2563EB"];
  return shades[v - 1];
}

const matrix = [
  [4, 2, 3, 2, 1, 4, 3, 2, 1, 1, 2, 2, 1, 1, 4],
  [4, 1, 2, 2, 1, 3, 3, 1, 1, 1, 2, 1, 1, 1, 3],
  [4, 3, 4, 2, 1, 4, 4, 2, 1, 1, 3, 2, 1, 1, 4],
  [1, 1, 3, 3, 2, 4, 4, 2, 2, 2, 3, 2, 1, 1, 3],
  [2, 2, 4, 2, 1, 4, 4, 2, 2, 1, 4, 3, 2, 1, 4],
  [2, 2, 3, 2, 1, 3, 4, 2, 1, 1, 3, 2, 1, 1, 4],
];

export default function ActivelyRecruitChart() {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-1">
        Actively Recruiting Trials by Country
      </h2>

      <div className="overflow-x-auto">
        <table
          style={{
            marginTop: "20px",
          }}
          className="w-full text-sm pb-4"
        >
          {/* <thead>
            <tr>
              <th className="text-left py-2 pr-3"></th>
              {regions.map((r, idx) => (
                <th key={r + idx} className="text-center py-2 px-2 rotate-90">
                  {r}
                </th>
              ))}
            </tr>
          </thead> */}

          <tbody>
            {conditions.map((cond, i) => (
              <tr key={cond}>
                <td
                  style={{
                    fontSize: "12px",
                    lineHeight: "12px",
                  }}
                  className="py-1 pr-3 font-semibold "
                >
                  {cond}
                </td>
                {regions.map((_, j) => (
                  <td key={j} className="px-1 py-1 text-center">
                    <div
                      className="w-5 h-8 mx-auto rounded-sm"
                      style={{ backgroundColor: cellShade(matrix[i][j]) }}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td></td>

              {regions.map((r, idx) => (
                <td
                  key={r + idx}
                  className="px-1 py-1 text-center"
                  style={{
                    height: "60px",
                    verticalAlign: "bottom",
                  }}
                >
                  <div
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: "10px",
                      whiteSpace: "nowrap",
                      opacity: 0.7,
                    }}
                  >
                    {r}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs mt-4 flex-wrap">
        {levels.map((l, idx) => (
          <span key={l} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: cellShade(4 - idx) }}
            />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
