import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
Chart.register(CategoryScale, LinearScale, PointElement, LineElement);

const sparklineData = [
  [12, 14, 18, 22, 30], 
  [10, 15, 19, 19, 27], 
  [9, 9, 13, 14, 18],   
  [8, 11, 13, 13, 16],  
  [12, 13, 13, 17, 18], 
  [8, 10, 14, 17, 20],  
];

const getSparkOptions = {
  scales: {
    x: { display: false },
    y: { display: false, min: 0 },
  },
  elements: {
    point: { radius: 0 }, 
    line: { borderWidth: 2, borderColor: "#18a058", fill: "start", backgroundColor: "rgba(34,197,94,0.06)" },
  },
  plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: {
            display: false, 
        },  },
  responsive: true,
  maintainAspectRatio: false,
};

const rows = [
  { id: 1, name: "Pharma Corp", trials: 150, p:32, growth: "+18%" },
  { id: 2, name: "BioInnovate", trials: 120, p:32, growth: "+15%" },
  { id: 3, name: "Genetech", trials: 85, p:32, growth: "+8%" },
  { id: 4, name: "Pfizer", trials: 85, p:32, growth: "+8%" },
  { id: 5, name: "Novartis", trials: 85, p:32, growth: "+8%" },
  { id: 6, name: "Merck", trials: 85, p:32, growth: "+8%" },
];

export default function SponsorLeaderboard() {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-1">Sponsor Activity Leaderboard</h2>
      <p className="text-gray-600 text-sm mb-3">
        Rank companies by number of active trials, phase distribution, and growth rate
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-5">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Company Name</th>
              <th className="py-2 pr-3">Trials</th>
              <th className="py-2 pr-3">P1</th>
              <th className="py-2 pr-3">P2</th>
              <th className="py-2 pr-3">P3</th>
              <th className="py-2 pr-3">P4</th>
              <th className="py-2 pr-3">Growth YoY</th>
              <th className="py-2 pr-0">5Y Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`${i % 2 === 0 ? "bg-gray-100" : ""} border-b`}>
                <td className="py-2 pr-3 font-medium text-gray-600 pl-1">{r.id}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600">{r.name}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600 ">{r.trials}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600  ">{r.p}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600  ">{r.p}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600  ">{r.p}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600  ">{r.p}</td>
                <td className="py-2 pr-3 font-semibold text-gray-600  ">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">{r.growth}</span>
                </td>
                <td className="py-2 pr-0 w-28 h-6">
                  <div style={{ width: '100px', height: '28px' }}>
                    <Line
                      data={{
                        labels: ["", "", "", "", ""], 
                        datasets: [{
                          data: sparklineData[i],
                          borderColor: "#18a058",
                          backgroundColor: "rgba(34,197,94,0.07)",
                          tension: 0.2,
                          fill: true
                        }]
                      }}
                      options={getSparkOptions}
                      height={28}
                      width={100}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
