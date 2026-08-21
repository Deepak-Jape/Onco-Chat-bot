/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

const verticalHoverLine = {
  id: "verticalHoverLine",
  afterDraw(chart) {
    if (!chart.tooltip?._active?.length) return;

    const ctx = chart.ctx;
    const activePoint = chart.tooltip._active[0];
    const x = activePoint.element.x;

    const topY = chart.chartArea.top;
    const bottomY = chart.chartArea.bottom;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
  },
};

ChartJS.register(verticalHoverLine);

const TrialTrendChart = ({ trialVolumeByPhase }) => {
  const graphData = trialVolumeByPhase?.graphData || [];
  const phaseList = trialVolumeByPhase?.filters?.Phase || [];

  const [timeRange, setTimeRange] = useState("Annual");

  //  Determine Min Year & Current Year
  const currentYear = new Date().getFullYear();

  const minYear = useMemo(() => {
    if (!graphData.length) return currentYear;
    return Math.min(...graphData.map((d) => Number(d.year)));
  }, [graphData]);

  // Group Data (Annual or Quarterly)
  const grouped = useMemo(() => {
    const result = {};

    graphData.forEach((item) => {
      const key =
        timeRange === "Annual"
          ? `${item.year}`
          : `${item.year}-Q${item.quarter}`;

      if (!result[key]) {
        result[key] = {};
        phaseList.forEach((ph) => (result[key][ph] = 0));
      }

      if (result[key][item.phase] !== undefined) {
        result[key][item.phase] += item.trial_count;
      }
    });

    return result;
  }, [graphData, phaseList, timeRange]);

  // Build full X-axis labels up to current year
  const labels = useMemo(() => {
    const arr = [];

    for (let yr = minYear; yr <= currentYear; yr++) {
      if (timeRange === "Annual") {
        arr.push(String(yr));
      } else {
        for (let q = 1; q <= 4; q++) {
          arr.push(`${yr}-Q${q}`);
        }
      }
    }

    return arr;
  }, [timeRange, minYear, currentYear]);

  // Ensure grouped has entries for all labels
  labels.forEach((label) => {
    if (!grouped[label]) {
      grouped[label] = {};
      phaseList.forEach((ph) => (grouped[label][ph] = 0));
    }
  });

  //  Phase Colors
  const phaseColors = {
    "Early Phase 1": "#8E44AD",
    "Phase 1": "rgba(47, 128, 237, 1)",
    "Phase 2": "rgba(39, 174, 96, 1)",
    "Phase 3": "rgba(241, 128, 16, 1)",
    "Phase 4": "rgba(241, 87, 87, 1)",
  };

  const baseDatasets = phaseList.map((phase) => ({
    label: phase,
    data: labels.map((key) => grouped[key]?.[phase] || 0),
    backgroundColor: phaseColors[phase] || "#999",
    borderColor: phaseColors[phase] || "#999",
    tension: 0.4,
    fill: true,
    stack: "stack1",
    pointRadius: 0,
  }));

  const data = {
    labels,
    datasets: baseDatasets,
  };

  // Dynamic Max Y
  const dynamicMaxY = useMemo(() => {
    let maxVal = 0;

    graphData.forEach((item) => {
      if (item.trial_count > maxVal) maxVal = item.trial_count;
    });

    labels.forEach((label) => {
      const total = phaseList.reduce(
        (s, ph) => s + (grouped[label]?.[ph] || 0),
        0
      );
      if (total > maxVal) maxVal = total;
    });

    const padded = maxVal * 1.15;

    if (padded <= 50) return 50;
    if (padded <= 100) return 100;

    return Math.ceil(padded / 50) * 50;
  }, [graphData, grouped, labels, phaseList]);

  //  Chart Options
  const options = {
    responsive: true,
    interaction: { mode: "nearest", axis: "x", intersect: false },

    plugins: {
      datalabels: { display: false },

      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "rgba(0, 0, 0, 0.8)",
        bodyColor: "rgba(0, 0, 0, 0.6)",
        titleFont: { size: 13, family: "Rubik" },
        bodyFont: { size: 12, family: "Rubik" },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label} : ${ctx.raw}`,
        },
      },

      legend: {
        position: "bottom",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 7,
          boxHeight: 7,
          padding: 15,
          font: { size: 12, family: "Rubik" },
          color: "rgba(0,0,0,0.75)",
        },
      },
    },

    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
        hoverBorderWidth: 0,
        hoverBackgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      line: { borderWidth: 2 },
    },

    scales: {
      x: { stacked: true },

      y: {
        stacked: true,
        beginAtZero: true,
        min: 0,
        max: dynamicMaxY,
        ticks: {
          stepSize: dynamicMaxY / 4,
          callback: function (value) {
            return Number.isInteger(value) ? value : Math.round(value);
          },
        },
        grid: {
          drawBorder: false,
          borderDash: [4, 4],
          color: "rgba(0,0,0,0.3)",
          lineWidth: 1,

        },
      },
    },
  };

  return (
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
          Trial Volume By Phase
        </h2>

        <div className="flex border rounded overflow-hidden h-7 mt-1">
          <button
            style={{
              background:
                timeRange === "Annual" ? "rgba(47, 128, 237, 1)" : "#FFFFFF",
              color: timeRange === "Annual" ? "#FFFFFF" : "rgba(0,0,0,0.7)",
              fontSize: "12px",
              fontFamily: "Rubik",
              width: "50px",
            }}
            onClick={() => setTimeRange("Annual")}
          >
            Annual
          </button>

          <button
            style={{
              background:
                timeRange === "Quarterly" ? "rgba(47, 128, 237, 1)" : "#FFFFFF",
              color: timeRange === "Quarterly" ? "#FFFFFF" : "rgba(0,0,0,0.7)",
              fontSize: "12px",
              fontFamily: "Rubik",
              width: "63px",
            }}
            onClick={() => setTimeRange("Quarterly")}
          >
            Quarterly
          </button>
        </div>
      </div>

      <div style={{ height: "250px" }}>
        <Line
          style={{
            fontFamily: "Rubik !important",
            fontSize: "12px !important",
          }}
          data={data}
          options={{ ...options, maintainAspectRatio: false }}
        />
      </div>
    </div>
  );
};

export default TrialTrendChart;
