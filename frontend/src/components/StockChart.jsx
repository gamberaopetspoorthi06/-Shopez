import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const StockChart = ({ history = [], isPositive = true }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({ datasets: [] });

  useEffect(() => {
    if (history.length === 0) return;

    const chart = chartRef.current;
    if (!chart) return;

    // Format timestamps for the labels (e.g. "12:45 PM")
    const labels = history.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const prices = history.map(item => item.price);

    // Create glowing area gradient
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, chart.height || 300);
    
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(0, 255, 136, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 255, 136, 0.00)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 0, 85, 0.25)');
      gradient.addColorStop(1, 'rgba(255, 0, 85, 0.00)');
    }

    setChartData({
      labels,
      datasets: [
        {
          fill: true,
          label: 'Price',
          data: prices,
          borderColor: isPositive ? '#00ff88' : '#ff0055',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointBackgroundColor: isPositive ? '#00ff88' : '#ff0055',
          pointBorderColor: '#070913',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: isPositive ? '#00ff88' : '#ff0055',
          pointHoverBorderWidth: 2,
          lineTension: 0.2, // Smooth Bezier curve
          backgroundColor: gradient,
        }
      ]
    });
  }, [history, isPositive]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(13, 17, 36, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#f3f4f6',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: {
          family: 'Outfit, sans-serif',
          weight: '600'
        },
        bodyFont: {
          family: 'Inter, sans-serif'
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'Inter, sans-serif',
            size: 10
          },
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'Outfit, sans-serif',
            size: 11
          },
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  if (history.length === 0) {
    return <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Loading chart data...</div>;
  }

  return (
    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default StockChart;
