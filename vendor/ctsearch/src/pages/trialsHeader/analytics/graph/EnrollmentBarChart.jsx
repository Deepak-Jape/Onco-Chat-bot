import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const phases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV'];
const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335'];


const data = {
  labels: phases,
  datasets: [
    {
      label: 'Enrollment Size',
      data: [200, 500, 1100, 1500],
      backgroundColor: ['#4285F4', '#34A853', '#FBBC05', '#EA4335'],
      borderRadius: 0,
      barThickness: 60
    }
  ]
};

// Chart Options
const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false, // ✅ hide default legend
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        drawOnChartArea: true,
        drawTicks: false,
        color: '#e0e0e0',
        borderDash: [4, 4] // dashed vertical grid lines
      },
      border: {
        display: true,
        color: '#e0e0e0',
      }
    },
    y: {
      beginAtZero: true,
      max: 2000,
      ticks: {
        stepSize: 500,
        callback: (value) => (value >= 1000 ? value / 1000 + 'k' : value)
      },
      grid: {
        display: true,
        drawOnChartArea: true,
        drawTicks: false,
        color: '#e0e0e0',
        borderDash: [4, 4] // dashed horizontal grid lines
      },
      border: {
        display: true,
        color: '#e0e0e0',
        dash: [4, 4] // ⬅️ this makes the LEFT line solid
      }
    }
  }
};



export default function EnrollmentBarChart() {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
      <h2 className='text-2xl font-semibold mb-1 text-left'>Enrollment Size vs Phase Distribution</h2>
      <p className='text-gray-500 text-md mb-4 text-left'>
        Analyze enrollment patterns across trial phases to identify underpowered studies or unusually large early-phase investments
      </p>
      <div style={{ height: '270px' }}>
        <Bar data={data} options={{ ...options, maintainAspectRatio: false }} />
      </div>

      <div className="flex  gap-3 mt-4">
        {phases.map((phase, index) => (
          <div key={phase} className="flex items-center ">
            <span
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: colors[index] }}
            ></span>
            <span className="text-gray-700 text-sm">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
