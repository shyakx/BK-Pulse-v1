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
  // Check for risk trend data (for analyst dashboard)
  const hasRiskTrendData = data?.riskTrend && data.riskTrend.labels && data.riskTrend.labels.length > 0;
  // Check for engagement trend data (for officer dashboard)
  const hasEngagementData = data?.engagementTrend && data.engagementTrend.labels && data.engagementTrend.labels.length > 0;
  
  // Use risk trend data if available (for analyst dashboard)
  const barData = hasRiskTrendData ? {
    labels: data.riskTrend.labels,
    datasets: [
      {
        label: 'High Risk',
        data: data.riskTrend.datasets.highRisk || [],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Medium Risk',
        data: data.riskTrend.datasets.mediumRisk || [],
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Low Risk',
        data: data.riskTrend.datasets.lowRisk || [],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  } : hasEngagementData ? {
    labels: data.engagementTrend.labels,
    datasets: [
      {
        label: 'Monthly Transactions',
        data: data.engagementTrend.datasets.monthlyTransactions || [],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Monthly Inflows',
        data: data.engagementTrend.datasets.monthlyInflows || [],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Monthly Outflows',
        data: data.engagementTrend.datasets.monthlyOutflows || [],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Digital Banking Activity',
        data: data.engagementTrend.datasets.digitalBankingActivity || [],
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  } : {
    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        label: 'Monthly Transactions',
        data: [45, 42, 38, 35, 32, 30],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Monthly Inflows',
        data: [12000, 11500, 11000, 10500, 10000, 9500],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Monthly Outflows',
        data: [8000, 7500, 7000, 6500, 6000, 5500],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Digital Banking Activity',
        data: [35, 33, 30, 28, 25, 22],
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
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

  // Calculate max value for better Y-axis scaling
  const allValues = barData.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues.filter(v => v !== undefined && v !== null), 1);
  const suggestedMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;
  const stepSize = suggestedMax <= 10 ? 1 : Math.max(1, Math.ceil(suggestedMax / 10));

  // Format values based on dataset type
  const formatValue = (value, datasetLabel) => {
    if (datasetLabel?.includes('Inflow') || datasetLabel?.includes('Outflow')) {
      return `RWF ${(value || 0).toLocaleString()}`;
    }
    return (value || 0).toLocaleString();
  };

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
            label += formatValue(value, context.dataset.label);
            return label;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax,
        ticks: {
          stepSize: stepSize,
          precision: 0,
          font: {
            size: 11
          },
          callback: function(value) {
            // Format large numbers (for inflows/outflows)
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        },
        title: {
          display: true,
          text: hasRiskTrendData ? 'Number of Customers' : 'Engagement Metrics',
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
    }
  };

  // Check if we have meaningful data
  const hasData = (hasRiskTrendData || hasEngagementData) && barData.labels.length > 0;
  const dataPointCount = barData.labels.length;

  return (
    <div className="bk-card">
      <div className="bk-card-header d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0">{title || 'Customer 6-Month Engagement Trend'}</h5>
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
              {!hasData ? (hasRiskTrendData ? 'No risk trend data available yet' : 'No engagement data available yet') : 'Insufficient data for trend analysis'}
            </p>
            <small className="text-muted">
              {hasRiskTrendData ? 'Risk trend metrics will appear as customer data is updated' : 'Engagement metrics will appear as customer data is updated'}
            </small>
          </div>
        ) : (
          <div className="chart-container" style={{ height: '320px', position: 'relative' }}>
            {type === 'doughnut' ? (
              <Doughnut data={doughnutData} options={options} />
            ) : (
              <Bar data={barData} options={options} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsChart;

