import React from "react";

const heatmapData = [
    { endpoint: "Overall Survival", values: [3, 8, 18, 21] },
    { endpoint: "Progression-Free", values: [4, 20, 20, 16] },
    { endpoint: "Objective Response", values: [21, 21, 12, 7] },
    { endpoint: "Safety/Tolerability", values: [19, 26, 12, 13] },
    { endpoint: "Pharmacokinetics", values: [47, 11, 19, 3] },
    { endpoint: "Quality of Life", values: [6, 14, 18, 40] },
];

// Dynamic blue shade based on value
function getDynamicColor(value) {
    const percent = Math.min(100, Math.max(0, value));
    const lightness = 90 - percent * 0.6; // higher value → darker
    return `hsl(217, 95%, ${lightness}%)`;
}

const EndpointHeatmap = () => {
    return (
        <div className="space-y-2 my-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-2xl font-semibold">Endpoint Frequency Heatmap</h2>
            <p className="text-gray-600 text-sm">
                Visualize what endpoints are most used in your therapeutic area and how usage shifts by phase
            </p>

            <div className="overflow-x-auto ">
                <table
                    style={{ borderCollapse: "separate", borderSpacing: "0px 8px" }}
                    className="w-full text-sm "
                >
                    <thead>
                        <tr>
                            <th className="text-left p-2 text-xs w-36">Endpoint</th>
                            <th className="p-2 text-center w-28 text-xs">Phase I</th>
                            <th className="p-2 text-center w-28 text-xs">Phase II</th>
                            <th className="p-2 text-center w-36 text-xs">Phase III</th>
                            <th className="p-2 text-center w-28 text-xs">Phase IV</th>
                        </tr>
                    </thead>

                    <tbody>
                        {heatmapData.map((row, idx) => (
                            <tr key={idx}>
                                {/* Endpoint column */}
                                <td className="text-left px-2 text-gray-700 truncate bg-gray-200 w-36">
                                    {row.endpoint}
                                </td>

                                {/* Phase I–IV columns */}
                                {row.values.map((val, i) => {
                                    const bgColor = getDynamicColor(val);
                                    const isDark = val > 35;
                                    return (
                                        <td
                                            key={i}
                                            className={`text-center px-3 py-1 font-medium ${isDark ? "text-white" : "text-gray-800"
                                                }`}
                                            style={{
                                                backgroundColor: bgColor,
                                                width: "90px",
                                                // Create gaps only in table body
                                                ...(i === 0
                                                    ? { borderLeft: "12px solid white" } // double gap before Phase I
                                                    : { borderLeft: "6px solid white" }), // regular gap between others
                                            }}
                                        >
                                            {val}%
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-sm text-gray-500 pt-3 pb-4 flex items-center">
                <span className="mr-2 font-medium">Usage:</span>
                <span className="ml-2 mr-1">Low </span>
                <div className="flex  justify-center">
                <span
                    className="inline-block w-4 h-4 mr-1 rounded-full"
                    style={{ backgroundColor: getDynamicColor(5) }}
                ></span>
                <span
                    className="inline-block w-4 h-4 mr-1 rounded-full"
                    style={{ backgroundColor: getDynamicColor(15) }}
                ></span>
                <span
                    className="inline-block w-4 h-4 mr-1 rounded-full"
                    style={{ backgroundColor: getDynamicColor(30) }}
                ></span>
                <span
                    className="inline-block w-4 h-4  rounded-full"
                    style={{ backgroundColor: getDynamicColor(50) }}
                ></span>
                </div>
                <span className="ml-1"> High</span>
            </div>
        </div>
    );
};

export default EndpointHeatmap;
