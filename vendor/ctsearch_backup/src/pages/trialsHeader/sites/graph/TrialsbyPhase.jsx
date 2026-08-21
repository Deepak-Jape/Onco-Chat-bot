import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

export default function TrialsbyPhase({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartReady, setChartReady] = useState(false);

  // ⭐ Plugin to draw dashed horizontal lines
  const dashedGridLines = {
    id: 'dashedGrid',
    beforeDraw: (chart) => {
      const {
        ctx,
        chartArea: { left, right },
        scales: { y },
      } = chart;

      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; // dashed line color
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

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    const labels = data.map((item) => item.phase);
    const counts = data.map((item) => item.count);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Trials',
            data: counts,
            backgroundColor: '#2563eb',
            borderRadius: 0,
            borderSkipped: false,
            barThickness: 'flex',
            maxBarThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            borderRadius: 6,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `${context.parsed.y} trials`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 20,
            ticks: {
              stepSize: 5,
              font: {
                size: 12,
                family: 'Inter, sans-serif',
              },
              color: '#9ca3af',
            },
            grid: {
              drawBorder: false, // no border line
              drawTicks: false,  // remove tick marks
              color: 'transparent', // hide default grid lines
            },
          },
          x: {
            ticks: {
              font: {
                size: 12,
                family: 'Inter, sans-serif',
              },
              color: '#374151',
            },
            grid: {
              display: false, // remove vertical lines
            },
          },
        },
      },
      plugins: [dashedGridLines], // ⭐ add dashed horizontal lines plugin
    });

    setChartReady(true);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Trials by Phase</h3>
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={chartRef}
          className="w-full h-full"
          style={{ maxHeight: '100%' }}
        />
      </div>
    </div>
  );
}
