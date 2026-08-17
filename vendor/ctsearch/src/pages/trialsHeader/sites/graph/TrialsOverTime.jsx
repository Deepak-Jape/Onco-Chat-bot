import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const defaultViewOptions = [
  { key: "annual", label: "Annual" },
  { key: "quarterly", label: "Quarterly" },
];

// ⭐ Plugin for dashed horizontal grid lines
const dashedGridLines = {
  id: "dashedGrid",
  beforeDraw: (chart) => {
    const {
      ctx,
      chartArea: { left, right },
      scales: { y },
    } = chart;

    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.15)"; // dashed line color
    ctx.setLineDash([5, 5]); // dash pattern

    y.ticks.forEach((_, i) => {
      const yPos = y.getPixelForTick(i);
      ctx.beginPath();
      ctx.moveTo(left, yPos);
      ctx.lineTo(right, yPos);
      ctx.stroke();
    });

    ctx.restore();
  },
};

export default function TrialsOverTime({
  data = [],
  activeView = "annual",
  onViewChange = () => {},
  viewOptions = defaultViewOptions,
  title = "Trials Over Time",
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const getDynamicMax = () => {
    const maxValue = Math.max(...data.map((d) => d.trials));
    if (maxValue <= 10) return 10;
    if (maxValue <= 20) return 20;
    if (maxValue <= 30) return 30;
    return Math.ceil(maxValue / 10) * 10;
  };

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "Trials",
            data: data.map((d) => d.trials),
            borderColor: "#6EE7B7",
            pointBackgroundColor: "#d1e2dcff",
            pointBorderColor: "#d1e2dcff",
            pointRadius: 5,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: "#ffffff",
            titleColor: "#111827",
            bodyColor: "#374151",
            borderColor: "#E5E7EB",
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            boxPadding: 8,
            callbacks: {
              title: (ctx) => ctx[0].label,
              label: () => "",
              afterTitle: (ctx) => {
                const index = ctx[0].dataIndex;
                const point = data[index];
                return [
                  `${point.trials} Trials`,
                  "",
                  `Phase I : ${point.phase1}`,
                  `Phase II : ${point.phase2}`,
                  `Phase III : ${point.phase3}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: true,
              drawBorder: false,
              color: "#E5E7EB", // solid vertical lines
              borderDash: [],
              lineWidth: 1,
            },
            ticks: {
              color: "#6B7280",
              font: { size: 11, family: "Inter, sans-serif" },
              padding: 8,
            },
          },
          y: {
            beginAtZero: true,
            max: getDynamicMax(),
            grid: {
              drawBorder: false, // no outer border
              drawOnChartArea: false, // disable default horizontal grid
            },
            ticks: {
              color: "#6B7280",
              font: { size: 11, family: "Inter, sans-serif" },
              padding: 8,
              stepSize: 4,
            },
          },
        },
        layout: {
          padding: {
            top: 10,
            right: 10,
            bottom: 5,
            left: 0,
          },
        },
      },
      plugins: [dashedGridLines], // ⭐ add plugin here
    });

    return () => chartInstanceRef.current?.destroy();
  }, [data]);

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-semibold text-gray-900">{title}</p>
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden bg-white">
          {viewOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onViewChange(option.key)}
              className={`px-2 py-1.5 text-sm font-medium transition-colors ${
                activeView === option.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 h-[300px] relative">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
