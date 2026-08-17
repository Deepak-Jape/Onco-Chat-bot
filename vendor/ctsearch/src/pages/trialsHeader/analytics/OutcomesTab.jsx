import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { getAnalytics } from "../../../services/analyticsService";
import AnalyticsHeaderSkeleton from "./AnalyticsHeaderSkeleton";
import OutcomesTabSkeleton from "./OutcomesTabSkeleton";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);


const OutcomesTab = () => {
  const [endpointData, setEndpointData] = useState([]);
  const [trialDuration, setTrialDuration] = useState([]);
  const [timeToEndpoint, setTimeToEndpoint] = useState([]);
  const [sponsorData, setSponsorData] = useState([]);
  const [uniquePhases, setUniquePhases] = useState([]);
  

  const [selectedChart, setSelectedChart] = useState("duration");
  const [loading, setLoading] = useState(true);


  const getColor = (value) => {
  if (value <= 50) return "bg-Info-300";
  if (value <= 300) return "bg-Info-400";
  if (value <= 700) return "bg-Info-500";
  return "bg-Info-600";
};

useEffect(() => {
  const load = async () => {
    const res = await getAnalytics();

    if (res && res.endpointFreqByPhase?.graphData) {
      const raw = res.endpointFreqByPhase.graphData;

      // 1️⃣ Extract ALL unique phases dynamically
      const phases = [...new Set(raw.map(item => item.phases_clean))];
      setUniquePhases(phases);

      // 2️⃣ Group data by outcome class
      const grouped = {};

      raw.forEach(item => {
        const cls = item.outcome_class || "Unknown";
        const phase = item.phases_clean;
        const freq = item.frequency || 0;

        if (!grouped[cls]) {
          grouped[cls] = { label: cls, phaseMap: {} };
        }

        // Add frequency to phaseMap
        grouped[cls].phaseMap[phase] = 
          (grouped[cls].phaseMap[phase] || 0) + freq;
      });

      setEndpointData(Object.values(grouped));
    }

    // 3️⃣ Other API sections (no change)
    if (res?.trialDuration?.graphData) {
      setTrialDuration(
        res.trialDuration.graphData.map(d => ({
          label: d.duration_label || d.label,
          value: d.frequency || d.value,
        }))
      );
    }

    if (res?.timeToEndpoint?.graphData) {
      setTimeToEndpoint(
        res.timeToEndpoint.graphData.map(d => ({
          label: d.time_label || d.label,
          value: d.frequency || d.value,
        }))
      );
    }

    setSponsorData(res?.mostActiveSponsors || []);
    setLoading(false);
  };

  load();
}, []);

  if (loading) {
    return (
      <div className="w-full px-4 overflow-hidden">
        <OutcomesTabSkeleton />
      </div>
    );
  }

  // ---------------- BUILD CHART (unchanged) ----------------
  const buildChart = (data) => {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.value);

    return {
      labels,
      datasets: [
        {
          label: "Number of Trials",
          data: values,
          backgroundColor: "#3A8BFF",
          borderColor: "#3A8BFF",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const activeChart =
    selectedChart === "duration"
      ? buildChart(trialDuration)
      : buildChart(timeToEndpoint);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      y: {
        title: { display: true, text: "Number of Trials", font: { size: 14, weight: "500" } },
        ticks: { color: "#374151" },
        grid: { color: "#E5E7EB" },
      },
      x: {
        title: {
          display: true,
          text: selectedChart === "duration" ? "Trial Duration" : "Time to Endpoint",
          font: { size: 14, weight: "500" },
        },
        ticks: { color: "#374151" },
        grid: { color: "#F3F4F6" },
      },
    },
  };


  return (
     <div
    className="w-full flex flex-col gap-6"
    style={{ width: "96%", margin: "0 auto" }}    
  >


      {/* ---------------- ROW 1 ---------------- */}
      <div className="flex flex-col lg:flex-row gap-4 ipad-content-fix">

{/* LEFT: Endpoint Table */}
<div className="w-full lg:w-1/2 bg-white rounded shadow outline outline-1 outline-gray-200/60
                px-4 py-4 flex flex-col"
     style={{ height: "343px" }}>

<h2
  style={{
    fontFamily: "Rubik",
    fontSize: "23px",         
    fontWeight: 500,          
    lineHeight: "24px",         
    color: "rgba(0,0,0,0.8)",    
    marginBottom: "16px",
  }}
>
  Endpoint Frequency by Phase
</h2>


<div
  className="overflow-x-auto overflow-y-auto scrollbar-hide w-full"
  style={{
     touchAction: "pinch-zoom",     
    WebkitUserDrag: "none",    
    userSelect: "none",         
  }}
>
  <div className="inline-block min-w-max">

    {/* Header */}
    <div className="flex mb-1">
      <div className="w-28 px-3 py-1 mr-2">
        <span
  style={{
    fontFamily: "Rubik",
    fontSize: "14px",            
    fontWeight: 500,              
    lineHeight: "16px",           
    color: "rgba(0,0,0,0.8)",      
  }}
>
  Endpoint
</span>
      </div>

      {uniquePhases.map((p, i) => (
  <div
    key={i}
    className="w-20 px-3 py-1 flex justify-center items-center mr-2"
    title={p}    // Tooltip
  >
    <span
      className="truncate"
      style={{
        fontFamily: "Rubik",
        fontSize: "14px",
        fontWeight: 500,
        lineHeight: "16px",
        color: "rgba(0,0,0,0.8)",
        maxWidth: "100%",        
        whiteSpace: "nowrap",    
        overflow: "hidden",      
        textOverflow: "ellipsis" 
      }}
    >
      {p}
    </span>
  </div>
))}
    </div>

    {/* Body */}
    {endpointData.map((row, idx) => (
      <div key={idx} className="flex mb-1">

        {/* Endpoint Label */}
        <div 
        title={row.label} 
        className="justify-start w-28 px-3 py-1 bg-gray-200 text-xs text-gray-700 font-medium truncate mr-2 font-Rubik leading-4"
              style={{
        fontFamily: "Rubik",
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: "16px",
        color: "rgba(0,0,0,0.6)",
      }}>
          {row.label}
        </div>

        {/* Value Boxes */}
        {uniquePhases.map((phase, i) => {
          const value = row.phaseMap[phase] || 0
          return (
            <div
              key={i}
              className={`w-20 px-3 py-1 flex justify-center font-Rubik items-center mr-2 ${getColor(
                value
              )}`}
            >
                       <span
            style={{
              fontFamily: "Rubik",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "16px",
              color: "rgba(0,0,0,0.6)",
            }}
          >
            {value}
          </span>
            </div>
          );
        })}

      </div>
    ))}

  </div>
</div>

<div className="flex items-center gap-3 mt-4">

  {/* Usage label */}
  <span
    style={{
      fontFamily: "Rubik",
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: "20px",
      color: "rgba(0,0,0,0.7)",
    }}
  >
    Usage:
  </span>

  {/* Low label */}
  <span
    style={{
      fontFamily: "Rubik",
      fontSize: "14px",
      fontWeight: 400,
      color: "rgba(0,0,0,0.6)",
    }}
  >
    Low
  </span>

  {/* All dots in one tight row */}
  <div className="flex items-center" style={{ gap: "4px" }}>
    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: "#BFDBFE",
      }}
    />

    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: "#93C5FD",
      }}
    />

    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: "#3B82F6",
      }}
    />

    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: "#1D4ED8",
      }}
    />
  </div>

  {/* High label */}
  <span
    style={{
      fontFamily: "Rubik",
      fontSize: "14px",
      fontWeight: 400,
      color: "rgba(0,0,0,0.6)",
    }}
  >
    High
  </span>
</div>

</div>


        {/* RIGHT: Chart */}
{/* <div className="w-full lg:w-1/2 bg-white rounded shadow outline outline-1 outline-gray-200/60 
     flex flex-col px-4 py-4"
     style={{ height: "343px" }}  
> */}

  {/* Header Row */}
  {/* <div className="flex justify-between items-center mb-2 flex-shrink-0">
   <h2
  style={{
    fontFamily: "Rubik",
    fontSize: "23px",           
    fontWeight: 500,           
    lineHeight: "24px",        
    color: "rgba(0,0,0,0.8)",   
    marginBottom: "16px",
  }}
> */}
{/* 
      {selectedChart === "duration" ? "Trial Duration" : "Time to Endpoint"}
    </h2>
<div className="flex gap-0 border border-blue-300 rounded-md overflow-hidden mb-4"> */}

  {/* Trial Duration Button */}
  {/* <button
    onClick={() => setSelectedChart("duration")}
    className="px-4 py-1 transition-all font-Rubik"
    style={{
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "24px",
      color:
        selectedChart === "duration"
          ? "white"
          : "rgba(0, 0, 0, 0.7)",
      backgroundColor:
        selectedChart === "duration"
          ? "#3B82F6"
          : "white",
    }}
  >
    Trial Duration
  </button> */}

  {/* Time to Endpoint Button */}
  {/* <button
    onClick={() => setSelectedChart("timetoe")}
    className="px-4 py-1 transition-all font-Rubik"
    style={{
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "24px",
      color:
        selectedChart === "timetoe"
          ? "white"
          : "rgba(0, 0, 0, 0.7)",
      backgroundColor:
        selectedChart === "timetoe"
          ? "#3B82F6"
          : "white",
    }}
  >
    Time to Endpoint
  </button>

</div> */}

{/* 
  </div> */}

  {/* Horizontal Scrollable Chart Area */}
  {/* <div className="overflow-x-auto scrollbar-hide overflow-y-hidden flex-1">
    <div className="min-w-[700px] h-full">
      {activeChart.labels.length === 0 ? (
        <p className="text-gray-500 text-sm">No chart data available.</p>
      ) : (
        <Bar
          data={activeChart}
          options={{ ...chartOptions, maintainAspectRatio: false }}
        />
      )}
    </div>
  </div>

</div> */}


      {/* </div> */}

      {/* ---------------- ROW 2: Sponsors ---------------- */}
{/* <div className="w-full lg:w-1/2 bg-white rounded shadow outline outline-1 outline-gray-200/60
                px-4 py-4 flex flex-col mb-5"
     style={{ height: "343px" } }>

<h2
  className="font-Rubik mb-4"
  style={{
    fontSize: "23px",            
    fontWeight: 500,          
    lineHeight: "24px",          
    letterSpacing: "-1%",        
    color: "rgba(0,0,0,0.8)",    
  }}
>
  Most Active Sponsors
</h2> */}

  {/* Scrollable Table Area */}
  {/* <div className="flex-1 overflow-y-auto scrollbar-hide overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[600px]">
<thead>
  <tr>
    {["#", "Company Name", "Trials", "P1", "P2", "P3", "P4"].map((col, i) => (
      <th
        key={i}
        className="py-2 px-2 font-Rubik"
        style={{
          fontSize: "14px",           
          fontWeight: 500,          
          lineHeight: "16px",     
          letterSpacing: "-1%",        
          color: "rgba(0,0,0,0.8)",   
          textAlign: "left",
        }}
      >
        {col}
      </th>
    ))}
  </tr>
</thead>
      <tbody>
        {sponsorData.length === 0 ? (
          <tr>
            <td colSpan="7" className="text-gray-500 text-sm py-4 text-center">
              No sponsor data available.
            </td>
          </tr>
        ) : (
          sponsorData.map((row, index) => (
            <tr key={index} className="bg-Info-100 hover:bg-Info-200 transition">
              <td className="py-2 px-2 text-sm">{row.id}</td>
              <td className="py-2 px-2 text-sm text-blue-600 underline cursor-pointer">
                {row.name}
              </td>
              <td className="py-2 px-2 text-sm">{row.trials}</td>
              <td className="py-2 px-2 text-sm">{row.P1}</td>
              <td className="py-2 px-2 text-sm">{row.P2}</td>
              <td className="py-2 px-2 text-sm">{row.P3}</td>
              <td className="py-2 px-2 text-sm">{row.P4}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

</div> */}
</div>


    </div>
  );
};

export default OutcomesTab;
