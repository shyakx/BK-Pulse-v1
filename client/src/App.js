import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Analysis from './pages/Analysis';
import ModelInsights from './pages/ModelInsights';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Team from './pages/Team';
import Approvals from './pages/Approvals';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminData from './pages/AdminData';
import AdminModels from './pages/AdminModels';
import AdminAudit from './pages/AdminAudit';
import AdminSettings from './pages/AdminSettings';
import Unauthorized from './pages/Unauthorized';
// Retention Officer pages
import RetentionNotes from './pages/RetentionNotes';
import MyTasks from './pages/MyTasks';
import Performance from './pages/Performance';
// Retention Analyst pages
import BulkPrediction from './pages/BulkPrediction';
import CampaignManagement from './pages/CampaignManagement';
import CampaignPerformance from './pages/CampaignPerformance';
import CustomerSegmentation from './pages/CustomerSegmentation';
// Manager pages
import StrategicAnalytics from './pages/StrategicAnalytics';
import BudgetROI from './pages/BudgetROI';
// Admin pages
import BackupMaintenance from './pages/BackupMaintenance';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Dashboard routes for all roles */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Customer management routes */}
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              
              {/* Retention Officer routes */}
              <Route path="retention-notes" element={<RetentionNotes />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="performance" element={<Performance />} />
              
              {/* Retention Analyst routes */}
              <Route path="analysis" element={<Analysis />} />
              <Route path="model-insights" element={<ModelInsights />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="bulk-prediction" element={<BulkPrediction />} />
              <Route path="campaigns" element={<CampaignManagement />} />
              <Route path="campaigns/:id/performance" element={<CampaignPerformance />} />
              <Route path="segmentation" element={<CustomerSegmentation />} />
              
              {/* Retention Manager routes */}
              <Route path="team" element={<Team />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="strategic-analytics" element={<StrategicAnalytics />} />
              <Route path="budget-roi" element={<BudgetROI />} />
              
              {/* Reports route for all roles */}
              <Route path="reports" element={<Reports />} />
              
              {/* Admin routes */}
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/data" element={<AdminData />} />
              <Route path="admin/models" element={<AdminModels />} />
              <Route path="admin/audit" element={<AdminAudit />} />
              <Route path="admin/settings" element={<AdminSettings />} />
              <Route path="admin/maintenance" element={<BackupMaintenance />} />
              <Route path="admin/reports" element={<Reports />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
