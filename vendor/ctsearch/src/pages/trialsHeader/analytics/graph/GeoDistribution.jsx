import React from "react";
import { Chart } from "react-google-charts";

export default function GeoDistribution() {
  const regions = [
    { name: "Africa", trials: 440, pct: 36.7 },
    { name: "Europe", trials: 512, pct: 13.0 },
    { name: "South America", trials: 27, pct: 2.2 },
    { name: "Asia", trials: 156, pct: 42.7 },
    { name: "North America", trials: 65, pct: 5.4 },
    { name: "Australasia", trials: 65, pct: 5.4 },
  ];

  // Use continent region codes for mapData
  // See: Africa=002, Europe=150, South America=005, Asia=142, North America=021, Oceania=009
  const mapData = [
    ["Continent", "Trials"],
    ["002", 440], // Africa
    ["150", 512], // Europe
    ["005", 27],  // South America
    ["142", 156], // Asia
    ["021", 65],  // North America
    ["009", 65],  // Oceania (used instead of Australasia)
  ];

  const mapOptions = {
    region: "world",
    resolution: "continents", // Enable continent level coloring
    displayMode: "regions",
    colorAxis: {
      colors: ["#E3F2FD", "#1976D2"], // Blue gradient
    },
    backgroundColor: "#f8f9fa",
    datalessRegionColor: "#f5f5f5",
    defaultColor: "#f5f5f5",
    width: "100%",
    height: "350px",
    keepAspectRatio: true,
    tooltip: {
      textStyle: {
        color: "#333",
        fontSize: 12,
      },
    },
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Geographic Site Distribution</h2>
          <p className="text-gray-600 text-sm mb-3">
            Visualize regional concentration of clinical trials to identify geographic hotspots and gaps
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <select className="border rounded px-2 py-1">
            <option>Indication</option>
          </select>
          <select className="border rounded px-2 py-1">
            <option>TA</option>
          </select>
          <select className="border rounded px-2 py-1">
            <option>Phase</option>
          </select>
        </div>
      </div>

      {/* Google GeoChart World Map */}
      <div className="w-full mt-2 mb-3">
        <Chart
          chartType="GeoChart"
          data={mapData}
          options={mapOptions}
          width="100%"
          height="300px"
        />
      </div>

      {/* Region stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
        {regions.map((r) => (
          <div key={r.name} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 border border-gray-200">
            <p className="text-gray-800 text-sm font-semibold">{r.name}</p>
            <div className=" flex">
              <p className="text-gray-600 text-right font-semibold text-xs mr-1 ">{r.trials} trials</p>
              <p className="w-10 text-right text-gray-500 font-semibold text-xs">{r.pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
