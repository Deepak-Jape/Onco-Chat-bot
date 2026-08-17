import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
);

const dashedGridLines = {
  id: "dashedGrid",
  beforeDraw: (chart) => {
    const {
      ctx,
      chartArea: { left, right },
      scales: { y },
    } = chart;

    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.setLineDash([5, 5]);

    y.ticks.forEach((_, index) => {
      const yPos = y.getPixelForTick(index);
      ctx.beginPath();
      ctx.moveTo(left, yPos);
      ctx.lineTo(right, yPos);
      ctx.stroke();
    });

    ctx.restore();
  },
};

export default function TrialDurationBenchmark({ data }) {
  const [timeRange, setTimeRange] = useState("Monthly");

  // ---------------- MONTHLY (0–60 + 60+) ----------------
  const monthlyData = useMemo(() => {
    const monthMap = {};
    let over60Total = 0;

    data?.graphData?.forEach((item) => {
      const m = parseInt(item?.months);
      const trialCount = item?.trials || 0;

      if (m <= 60) {
        monthMap[m] = (monthMap[m] || 0) + trialCount;
      } else {
        over60Total += trialCount;
      }
    });

    const labels = Object.keys(monthMap)
      .sort((a, b) => a - b)
      .map((m) => `${m} Months`);

    const values = Object.keys(monthMap)
      .sort((a, b) => a - b)
      .map((m) => monthMap[m]);

    if (over60Total > 0) {
      labels.push("60+ Months");
      values.push(over60Total);
    }

    return { labels, values };
  }, [data]);

  // ---------------- ANNUAL (0–15 + 15+) ----------------
  const annualData = useMemo(() => {
    const yearMap = {};
    let over15 = 0;

    data?.graphData?.forEach((item) => {
      const y = parseInt(item?.year);
      const trials = item?.trials || 0;

      if (y <= 15) {
        yearMap[y] = (yearMap[y] || 0) + trials;
      } else {
        over15 += trials;
      }
    });

    const labels = Object.keys(yearMap)
      .sort((a, b) => a - b)
      .map((y) => `Year ${y}`);

    const values = Object.keys(yearMap)
      .sort((a, b) => a - b)
      .map((y) => yearMap[y]);

    if (over15 > 0) {
      labels.push("15+ Years");
      values.push(over15);
    }

    return { labels, values };
  }, [data]);

  const isMonthly = timeRange === "Monthly";
  const active = isMonthly ? monthlyData : annualData;

  // 📌 Y-Axis fix → scale using max of first 60 points only
  const yMax =
    isMonthly && active.values.length > 1
      ? Math.max(...active.values.slice(0, active.values.length - 1)) * 1.15
      : Math.max(...active.values) * 1.15;

  const chartData = {
    labels: active.labels,
    datasets: [
      {
        label: "Trials",
        data: active.values,
        backgroundColor: "rgba(47,128,237,0.85)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.raw} Trials`,
        },
      },
      datalabels: { display: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: isMonthly
            ? "Months to Primary Completion"
            : "Years to Primary Completion",
          font: { size: 12 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: yMax,
        title: {
          display: true,
          text: "# of Trials",
          font: { size: 12 },
        },
      },
    },
  };

  const chartWidth = Math.max(700, active.labels.length * 50);

  return (
    // <div
    //   className="bg-white shadow-sm rounded-lg p-4 pb-2 border border-gray-200"
    //   style={{ height: "350px", display: "flex", flexDirection: "column" }}
    // >
    //   <div className="flex justify-between">
    //     <h2 className="text-[23px] font-[500] text-black">
    //       Time to Primary Completion
    //     </h2>

    //     <div className="flex border rounded overflow-hidden h-7 mt-1">
    //       <button
    // style={{
    //   background: isMonthly ? "rgba(47, 128, 237, 1)" : "#FFFFFF",
    //   color: isMonthly ? "#FFFFFF" : "rgba(0,0,0,0.7)",
    //   fontSize: "12px",
    //   width: "50px",
    // }}
    //         onClick={() => setTimeRange("Monthly")}
    //       >
    //         Monthly
    //       </button>
    //       <button
    // style={{
    //   background: !isMonthly ? "rgba(47, 128, 237, 1)" : "#FFFFFF",
    //   color: !isMonthly ? "#FFFFFF" : "rgba(0,0,0,0.7)",
    //   fontSize: "12px",
    //   width: "63px",
    // }}
    //         onClick={() => setTimeRange("Annual")}
    //       >
    //         Annual
    //       </button>
    //     </div>
    //   </div>

    //   <div
    //     className="overflow-x-auto"
    //     style={{ scrollbarWidth: "none", width: "100%" }}
    //   >
    //     <div style={{ width: chartWidth, height: "260px" }}>
    //       <Bar data={chartData} options={options} plugins={[dashedGridLines]} />
    //     </div>
    //   </div>
    // </div>

    <div
      style={{
        height: "350px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
      className="bg-white shadow-sm rounded-lg p-4 pb-2 border border-gray-200"
    >
      <div className="flex justify-between">
        <h2
          style={{
            fontWeight: "500",
            fontSize: "23px",
            color: "rgba(0, 0, 0, 0.8)",
            fontFamily: "Rubik",
          }}
        >
          Time to Primary Completion
        </h2>

        <div className="flex border rounded overflow-hidden h-7 mt-1">
          <button
            style={{
              background: isMonthly ? "rgba(47, 128, 237, 1)" : "#FFFFFF",
              color: isMonthly ? "#FFFFFF" : "rgba(0,0,0,0.7)",
              fontSize: "12px",
              width: "50px",
              fontFamily: "Rubik"
            }}
            onClick={() => setTimeRange("Monthly")}
          >
            Monthly
          </button>

          <button
            style={{
              background: !isMonthly ? "rgba(47, 128, 237, 1)" : "#FFFFFF",
              color: !isMonthly ? "#FFFFFF" : "rgba(0,0,0,0.7)",
              fontSize: "12px",
              width: "63px", fontFamily: "Rubik"
            }}
            onClick={() => setTimeRange("Annual")}
          >
            Annual
          </button>
        </div>
      </div>

      <div
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none", width: "100%" }}
      >
        <div style={{ width: chartWidth, height: "260px" }}>
          <Bar data={chartData} options={options} plugins={[dashedGridLines]} />
        </div>
      </div>
    </div>
  );
}
