import React from "react";
import { PieChart, Pie, ResponsiveContainer } from "recharts";  
import { Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { helpIcon } from "../../../assets/";

const RiskTab = () => {
  /* ================= BAR CHART (RECHARTS) ================= */
  const barData = [
    { label: "Treatment", value: 8 },
    { label: "Dosage", value: 4 },
    { label: "Eligibility Criteria", value: 2 },
    { label: "Patient Demographics", value: 10 }
  ];

  /* ================= PIE CHART (RECHARTS) ================= */
const pieChartData = [
  { name: "Increased Target", value: 58, fill: "#22C55E" }, // green
  { name: "Decreased Target", value: 42, fill: "#F97316" }, // orange
];


  return (
         <div
    className="w-full flex flex-col gap-6"
    style={{ width: "96%", margin: "0 auto", height:"343px" }}    
  >

    <div className="w-full flex flex-col lg:flex-row gap-6">

      {/* LEFT CARD */}
    <div className="w-full lg:w-1/2 bg-white rounded-lg shadow-md p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Typography
          sx={{
            fontFamily: "Rubik",
            fontSize: "23px",
            fontWeight: 500,
            lineHeight: "28px",
            color: "rgba(0,0,0,0.8)",
            mb: 2,
          }}
        >
          Top Protocol Changes
        </Typography>

                  <img
  src={helpIcon}
  alt="help"
  className="w-5 h-5 cursor-pointer -mt-3"
/>
        </div>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
  type="number"
  dataKey="value"
  domain={[0, 10]}
  ticks={[0, 2, 4, 6, 8, 10]}
  interval={0}
  scale="linear"
  padding={{ right: 20 }}
    tick={{
    fill: "rgba(0,0,0,0.7)",   
    fontSize: 10,             
    fontWeight: 400,       
    fontFamily: "Rubik",      
    lineHeight: 14,           
  }}   
/>
              <YAxis
                dataKey="label"
                type="category"
                width={95}
                
                tick={{
                  fill: "rgba(0, 0, 0, 0.8)",
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: "Rubik"
                }}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#3B82F6"
                radius={[0, 6, 6, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RIGHT CARD */}
      <div className="w-full lg:w-1/2 bg-white h-80 rounded-lg shadow-md p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
<Typography
  sx={{
    fontFamily: "Rubik",
    fontSize: "23px",
    fontWeight: 500,
    lineHeight: "28px",
    color: "rgba(0,0,0,0.8)",
    mb: 2,
  }}
>
  Changes in Enrollment Target
</Typography>

          <img
  src={helpIcon}
  alt="help"
  className="w-5 h-5 cursor-pointer -mt-3"
/>
        </div>

<div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">

  {/* === PIE CHART === */}
  <div className="flex justify-center w-full lg:w-auto">
    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieChartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            outerRadius="90%"
            innerRadius={0}
            paddingAngle={0}
            stroke="none"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* === LEGEND === */}
<div className="flex flex-col gap-6 text-sm font-Rubik text-gray-700 w-full lg:w-auto leading-4 font-normal">

  {/* Increased Target */}
  <div className="flex items-center justify-start gap-5 w-full max-w-xs">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22C55E" }}></span>

      <span
        style={{
          fontFamily: "Rubik",
          fontWeight: 400,
          fontSize: "12px",
          lineHeight: "16px",
          color: "rgba(0,0,0,0.6)",
        }}
      >
        Increased Target (58%)
      </span>
    </div>

    {/* 87 Trials (Medium 500) */}
    <span
      style={{
        fontFamily: "Rubik",
        fontWeight: 500,
        fontSize: "12px",
        lineHeight: "16px",
        color: "rgba(0,0,0,0.6)",
      }}
    >
      87 trials
    </span>
  </div>

  {/* Decreased Target */}
  <div className="flex items-center justify-start gap-5 w-full max-w-xs">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F97316" }}></span>

      <span
        style={{
          fontFamily: "Rubik",
          fontWeight: 400,
          fontSize: "12px",
          lineHeight: "16px",
          color: "rgba(0,0,0,0.6)",
        }}
      >
        Decreased Target (42%)
      </span>
    </div>

    {/* 63 Trials (Medium 500) */}
    <span
      style={{
        fontFamily: "Rubik",
        fontWeight: 500,
        fontSize: "12px",
        lineHeight: "16px",
        color: "rgba(0,0,0,0.6)",
      }}
    >
      63 trials
    </span>
  </div>
</div>


</div>
</div>
</div>
</div>
  );
};

export default RiskTab;
