import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AlertsChart = ({ type = 'bar', data, title }) => {
  // Use real data if provided, otherwise use placeholder
  const barData = data?.riskTrend ? {
    labels: data.riskTrend.labels.length > 0 ? data.riskTrend.labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'High Risk Customers',
        data: data.riskTrend.datasets.highRisk.length > 0 ? data.riskTrend.datasets.highRisk : [12, 19, 3, 5, 2, 3],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Medium Risk Customers',
        data: data.riskTrend.datasets.mediumRisk.length > 0 ? data.riskTrend.datasets.mediumRisk : [8, 15, 7, 12, 9, 11],
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Low Risk Customers',
        data: data.riskTrend.datasets.lowRisk.length > 0 ? data.riskTrend.datasets.lowRisk : [20, 25, 15, 18, 22, 19],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  } : {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'High Risk Alerts',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Medium Risk Alerts',
        data: [8, 15, 7, 12, 9, 11],
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Low Risk Alerts',
        data: [20, 25, 15, 18, 22, 19],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // Handle alerts data - can be object {highRisk, mediumRisk, lowRisk} or array [{label, value}]
  const getAlertsData = () => {
    if (!data?.alerts) {
      return { highRisk: 0, mediumRisk: 0, lowRisk: 0 };
    }
    
    if (Array.isArray(data.alerts)) {
      // Convert array format to object format
      return data.alerts.reduce((acc, alert) => {
        const key = alert.label?.toLowerCase().replace(/\s+/g, '') || '';
        if (key.includes('high')) acc.highRisk = alert.value || 0;
        else if (key.includes('medium')) acc.mediumRisk = alert.value || 0;
        else if (key.includes('low')) acc.lowRisk = alert.value || 0;
        return acc;
      }, { highRisk: 0, mediumRisk: 0, lowRisk: 0 });
    }
    
    // Already in object format
    return {
      highRisk: data.alerts.highRisk || 0,
      mediumRisk: data.alerts.mediumRisk || 0,
      lowRisk: data.alerts.lowRisk || 0
    };
  };

  const alertsData = getAlertsData();
  
  const doughnutData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [alertsData.highRisk, alertsData.mediumRisk, alertsData.lowRisk],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 0
      }
    ]
  };

  // Calculate max value for better Y-axis scaling (after barData is defined)
  const allValues = barData.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues.filter(v => v !== undefined && v !== null), 1);
  const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;
  const stepSize = suggestedMax <= 10 ? 1 : Math.max(1, Math.ceil(suggestedMax / 10));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = context.parsed.y !== null && context.parsed.y !== undefined 
              ? context.parsed.y 
              : 0;
            label += (value || 0).toLocaleString() + ' customers';
            return label;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: type === 'bar' ? {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax,
        ticks: {
          stepSize: stepSize,
          precision: 0,
          font: {
            size: 11
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        },
        title: {
          display: true,
          text: 'Number of Customers',
          font: {
            size: 12,
            weight: 'normal'
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    } : {}
  };

  // Check if we have meaningful data
  const hasData = data?.riskTrend && data.riskTrend.labels.length > 0;
  const dataPointCount = barData.labels.length;

  return (
    <div className="bk-card">
      <div className="bk-card-header d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0">{title || 'Alerts Overview'}</h5>
        {hasData && (
          <small className="text-muted">
            Last 6 months
          </small>
        )}
      </div>
      <div className="bk-card-body">
        {!hasData || dataPointCount < 2 ? (
          <div className="text-center py-5">
            <p className="text-muted mb-2">
              {!hasData ? 'No trend data available yet' : 'Insufficient data for trend analysis'}
            </p>
            <small className="text-muted">
              Update customer predictions to see risk trends over time
            </small>
          </div>
        ) : (
          <div className="chart-container" style={{ height: '320px', position: 'relative' }}>
            {type === 'bar' ? (
              <Bar data={barData} options={options} />
            ) : (
              <Doughnut data={doughnutData} options={options} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsChart;

