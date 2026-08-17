import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(PointElement, LinearScale, Tooltip, Legend, Title);

const ComparatorChart = () => {
  const data = {
    datasets: [
      {
        label: 'Placebo',
        data: [{ x: 42, y: 4 }],
        backgroundColor: 'blue',
        pointRadius: 6,
        pointHoverRadius: 7,
      },
      {
        label: 'Standard of Care',
        data: [{ x: 56, y: 3 }],
        backgroundColor: 'orange',
        pointRadius: 6,
        pointHoverRadius: 7,
      },
      {
        label: 'Pembrolizumab',
        data: [{ x: 101, y: 2 }],
        backgroundColor: 'green',
        pointRadius: 6,
        pointHoverRadius: 7,
      },
      {
        label: 'Bevacizumab',
        data: [{ x: 205, y: 1 }],
        backgroundColor: 'red',
        pointRadius: 6,
        pointHoverRadius: 7,
    
      },

    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
          display: false, 
      },
    },
    
    scales: {
      x: {
        min: 0,      // starts earlier
        max: 250,
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: false,
          color: '#e0e0e0',
          borderDash: [4, 4],
        },
        border: {
          display: true,
          color: '#e0e0e0',
        },
        title: {
          display: true,
          text: 'Frequency',
        },
      },
      y: {
        max: 5,
        min: 0,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            const labels = [
              '',
              'Bevacizumab',
              'Pembrolizumab',
              'Standard of Care',
              'Placebo',
            ];
            return labels[value];
          },
        },
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: false,
          color: '#e0e0e0',
          borderDash: [4, 4],
        },
        border: {
          display: true,
          color: '#e0e0e0',
          dash: [4, 4],
        },
      },
    },
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 xl:pb-9 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-1 text-left">
        Comparator Landscape Map
      </h2>
      <p className="text-gray-500 text-md mb-4 text-left">
        Visualize what drugs/standards of care are being used as comparators and their frequency
      </p>
      <div style={{ height: '282px', }}>
        <Scatter data={data} options={{ ...options, maintainAspectRatio: false }} />
      </div>
        <div className="flex flex-col gap-2 ">
          <div className="flex gap-2">
            <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-1.5 text-sm font-medium flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-gray-800">Placebo</span>
              </div>
              <span className="text-gray-700 font-semibold">42</span>
            </div>
            <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-1.5 text-sm font-medium flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="text-gray-800">Standard of Care</span>
              </div>
              <span className="text-gray-700 font-semibold">56</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-1.5 text-sm font-medium flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-gray-800">Pembrolizumab</span>
              </div>
              <span className="text-gray-700 font-semibold">101</span>
            </div>
            <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-1.5 text-sm font-medium flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-gray-800">Bevacizumab</span>
              </div>
              <span className="text-gray-700 font-semibold">205</span>
            </div>
          </div>
        </div>


    </div>
  );
};

export default ComparatorChart;
