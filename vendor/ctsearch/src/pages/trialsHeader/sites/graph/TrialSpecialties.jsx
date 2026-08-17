import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const defaultColors = [
  "#2563EB",
  "#22C55E",
  "#F97316",
  "#EC4899",
  "#14B8A6",
];

export default function TrialSpecialties({ data = [] }) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: defaultColors.slice(0, data.length),
        hoverOffset: 8,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: {
            size: 12,
            family: "Inter, sans-serif",
          },
          generateLabels: (chart) => {
            const data = chart.data;
            const dataset = data.datasets[0];
            const total = dataset.data.reduce((a, b) => a + b, 0);

            return data.labels.map((label, i) => ({
              text: `${label} ${((dataset.data[i] / total) * 100).toFixed(0)}%`,
              fillStyle: dataset.backgroundColor[i],
              strokeStyle: dataset.backgroundColor[i],
              pointStyle: "circle",
            }));
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.label}: ${context.formattedValue}%`,
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 border rounded h-[340px] md:h-[380px] lg:h-[400px] 2xl:h-[420px] w-full">
      <div className="flex items-center justify-between mb-16">
        <h2
          style={{
            fontWeight: "500",
            fontSize: "23px",
            color: "rgba(0, 0, 0, 0.8)",
            fontFamily: "Rubik",
          }}
        >
          Trial Specialties
        </h2>
      </div>

      <div className="h-[280px] mb-16">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
