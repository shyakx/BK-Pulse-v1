import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ChurnOverviewCard from '../components/Dashboard/ChurnOverviewCard';
import TaskList from '../components/Dashboard/TaskList';
import AlertsChart from '../components/Dashboard/AlertsChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentTasks();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.getDashboard();
      if (response.success || response.assignedCustomers !== undefined) {
        // Normalize alerts data for charts (handle both object and array formats)
        let normalizedAlerts = { highRisk: 0, mediumRisk: 0, lowRisk: 0 };
        
        if (response.alerts) {
          if (Array.isArray(response.alerts)) {
            // Convert array format [{label, value}] to object format
            normalizedAlerts = response.alerts.reduce((acc, alert) => {
              const key = alert.label?.toLowerCase().replace(/\s+/g, '') || '';
              if (key.includes('high')) acc.highRisk = alert.value || 0;
              else if (key.includes('medium')) acc.mediumRisk = alert.value || 0;
              else if (key.includes('low')) acc.lowRisk = alert.value || 0;
              return acc;
            }, { highRisk: 0, mediumRisk: 0, lowRisk: 0 });
          } else {
            // Already in object format
            normalizedAlerts = {
              highRisk: response.alerts.highRisk || 0,
              mediumRisk: response.alerts.mediumRisk || 0,
              lowRisk: response.alerts.lowRisk || 0
            };
          }
        }
        
        // Ensure all data is properly formatted
        setDashboardData({
          ...response,
          alerts: normalizedAlerts
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const response = await api.getTasks({ limit: 5, status: 'pending' });
      if (response.success && response.tasks) {
        const formattedTasks = response.tasks.slice(0, 5).map(task => ({
          title: `Follow up with ${task.customer_name || 'Customer'}`,
          description: task.description || `${task.action_type || 'Task'} - ${task.customer_name || 'Customer'}`,
          priority: task.priority || 'medium',
          dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'
        }));
        setTasks(formattedTasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      // Fallback to empty array
      setTasks([]);
    }
  };

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'retentionOfficer':
        return (
          <>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Total Customers"
                  value={dashboardData?.totalCustomers || 0}
                  change={dashboardData?.totalCustomersChange || 'Loading...'}
                  trend="up"
                  icon="people"
                  color="primary"
                  delay={100}
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="My Assigned Customers"
                  value={dashboardData?.assignedCustomers || 0}
                  change={dashboardData?.assignedCustomersChange || 'Loading...'}
                  trend="up"
                  icon="people"
                  color="info"
                  delay={200}
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="High Risk Cases (My)"
                  value={dashboardData?.highRiskCases || 0}
                  change={dashboardData?.highRiskChange || 'Loading...'}
                  trend="down"
                  icon="warning"
                  color="danger"
                  delay={300}
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Total High Risk"
                  value={dashboardData?.totalHighRiskCases || 0}
                  change={dashboardData?.totalHighRiskChange || 'Loading...'}
                  trend="down"
                  icon="warning"
                  color="warning"
                  delay={400}
                />
              </div>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Retention Rate"
                  value={dashboardData?.retentionRate ? `${dashboardData.retentionRate}%` : '0%'}
                  change={dashboardData?.retentionChange || 'Loading...'}
                  trend="up"
                  icon="trending-up"
                  color="success"
                  delay={500}
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Actions Completed"
                  value={dashboardData?.actionsCompleted || 0}
                  change={dashboardData?.actionsChange || 'Loading...'}
                  trend="up"
                  icon="check"
                  color="info"
                  delay={600}
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-8 mb-4">
                <AlertsChart title="Customer Risk Trends" data={dashboardData} />
              </div>
              <div className="col-md-4 mb-4">
                <TaskList tasks={tasks.length > 0 ? tasks : []} />
              </div>
            </div>
          </>
        );

      case 'retentionAnalyst':
        return (
          <>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Total Customers"
                  value={dashboardData?.totalCustomers?.toLocaleString() || '0'}
                  change={dashboardData?.totalCustomersChange || 'Loading...'}
                  trend="up"
                  icon="people"
                  color="primary"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Churn Rate"
                  value={dashboardData?.churnRate ? `${dashboardData.churnRate}%` : '0%'}
                  change={dashboardData?.churnRateChange || 'Loading...'}
                  trend="down"
                  icon="trending-down"
                  color="success"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Segments Analyzed"
                  value={dashboardData?.segmentsAnalyzed?.toString() || '0'}
                  change={dashboardData?.segmentsChange || 'Loading...'}
                  trend="up"
                  icon="analytics"
                  color="info"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Model Accuracy"
                  value={dashboardData?.modelAccuracy ? `${dashboardData.modelAccuracy}%` : '0%'}
                  change={dashboardData?.modelAccuracyChange || 'Loading...'}
                  trend="up"
                  icon="check"
                  color="success"
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-8 mb-4">
                <AlertsChart title="Customer Risk Trends" data={dashboardData} />
              </div>
              <div className="col-md-4 mb-4">
                <AlertsChart type="doughnut" title="Risk Distribution" data={dashboardData} />
              </div>
            </div>
          </>
        );

      case 'retentionManager':
        return (
          <>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Total Customers"
                  value={dashboardData?.assignedCustomers?.toLocaleString() || '0'}
                  change={dashboardData?.assignedCustomersChange || 'Loading...'}
                  trend="up"
                  icon="people"
                  color="primary"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="High Risk Cases"
                  value={dashboardData?.highRiskCases?.toLocaleString() || '0'}
                  change={dashboardData?.highRiskChange || 'Loading...'}
                  trend="down"
                  icon="warning"
                  color="danger"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Team Performance"
                  value={dashboardData?.teamPerformance ? `${dashboardData.teamPerformance}%` : '0%'}
                  change={dashboardData?.teamPerformanceChange || 'Loading...'}
                  trend="up"
                  icon="trending-up"
                  color="success"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Revenue Impact"
                  value={dashboardData?.revenueImpact ? `$${(dashboardData.revenueImpact / 1000000).toFixed(1)}M` : '$0'}
                  change={dashboardData?.revenueChange || 'Loading...'}
                  trend="up"
                  icon="trending-up"
                  color="info"
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-8 mb-4">
                <AlertsChart title="Customer Risk Trends" data={dashboardData} />
              </div>
              <div className="col-md-4 mb-4">
                <AlertsChart type="doughnut" title="Risk Distribution" data={dashboardData} />
              </div>
            </div>
          </>
        );

      case 'admin':
        return (
          <>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Total Customers"
                  value={dashboardData?.assignedCustomers?.toLocaleString() || '0'}
                  change={dashboardData?.assignedCustomersChange || 'Loading...'}
                  trend="up"
                  icon="people"
                  color="primary"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="High Risk Cases"
                  value={dashboardData?.highRiskCases?.toLocaleString() || '0'}
                  change={dashboardData?.highRiskChange || 'Loading...'}
                  trend="down"
                  icon="warning"
                  color="danger"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="System Health"
                  value={dashboardData?.systemHealth ? `${dashboardData.systemHealth}%` : '0%'}
                  change={dashboardData?.systemHealthChange || 'Loading...'}
                  trend="up"
                  icon="check"
                  color="success"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Active Users"
                  value={dashboardData?.activeUsers?.toString() || '0'}
                  change={dashboardData?.activeUsersChange || 'Loading...'}
                  trend="up"
                  icon="people"
                  color="info"
                />
              </div>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-8 mb-4">
                <AlertsChart title="Customer Risk Trends" data={dashboardData} />
              </div>
              <div className="col-md-4 mb-4">
                <AlertsChart type="doughnut" title="Risk Distribution" data={dashboardData} />
              </div>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="ETL Jobs"
                  value={dashboardData?.etlJobs?.toString() || '0'}
                  change={dashboardData?.etlJobsStatus || 'Loading...'}
                  trend="up"
                  icon="storage"
                  color="info"
                />
              </div>
              <div className="col-md-3 mb-3">
                <ChurnOverviewCard
                  title="Data Quality"
                  value={dashboardData?.dataQuality ? `${dashboardData.dataQuality}%` : '0%'}
                  change={dashboardData?.dataQualityChange || 'Loading...'}
                  trend="up"
                  icon="check"
                  color="success"
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-8 mb-4">
                <AlertsChart title="System Performance" data={dashboardData?.systemPerformance} />
              </div>
              <div className="col-md-4 mb-4">
                <AlertsChart type="doughnut" title="User Activity" data={dashboardData?.userActivity} />
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-5">
            <h3>Welcome to BK Pulse</h3>
            <p className="text-muted">Please contact your administrator to set up your role.</p>
          </div>
        );
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            {user?.role === 'retentionAnalyst' ? 'Overview Dashboard' : `Welcome back, ${user?.name || user?.email}!`}
          </h2>
          <p className="text-muted mb-0">
            {user?.role === 'retentionAnalyst' 
              ? "High-level churn trends and KPIs. Monitor customer risk levels, model performance, and segment analysis."
              : user?.role === 'retentionOfficer'
              ? "Track your assigned high-risk customers, retention activities, and performance metrics."
              : user?.role === 'retentionManager'
              ? "Overview of team performance, customer risk trends, and revenue impact across all customers."
              : user?.role === 'admin'
              ? "System-wide dashboard with customer metrics, system health, and user activity monitoring."
              : `Here's what's happening with your ${user?.role?.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} dashboard today.`}
          </p>
        </div>
        <div className="text-end">
          <small className="text-muted">Last updated: {new Date().toLocaleString()}</small>
        </div>
      </div>

      {getDashboardContent()}
    </div>
  );
};

export default Dashboard;

