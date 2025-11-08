import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'));
const Analysis = lazy(() => import('./pages/Analysis'));
const ModelInsights = lazy(() => import('./pages/ModelInsights'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Reports = lazy(() => import('./pages/Reports'));
const Team = lazy(() => import('./pages/Team'));
const Approvals = lazy(() => import('./pages/Approvals'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminData = lazy(() => import('./pages/AdminData'));
const AdminModels = lazy(() => import('./pages/AdminModels'));
const AdminAudit = lazy(() => import('./pages/AdminAudit'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const RetentionNotes = lazy(() => import('./pages/RetentionNotes'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const Performance = lazy(() => import('./pages/Performance'));
const BulkPrediction = lazy(() => import('./pages/BulkPrediction'));
const PredictionInsights = lazy(() => import('./pages/PredictionInsights'));
const CampaignManagement = lazy(() => import('./pages/CampaignManagement'));
const CampaignPerformance = lazy(() => import('./pages/CampaignPerformance'));
const StrategicAnalytics = lazy(() => import('./pages/StrategicAnalytics'));
const BudgetROI = lazy(() => import('./pages/BudgetROI'));
const BackupMaintenance = lazy(() => import('./pages/BackupMaintenance'));

// Loading component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

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
              <Route path="dashboard" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              } />
              
              {/* Customer management routes */}
              <Route path="customers" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Customers />
                </Suspense>
              } />
              <Route path="customers/:id" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <CustomerDetails />
                </Suspense>
              } />
              
              {/* Retention Officer routes */}
              <Route path="retention-notes" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <RetentionNotes />
                </Suspense>
              } />
              <Route path="tasks" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <MyTasks />
                </Suspense>
              } />
              <Route path="performance" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Performance />
                </Suspense>
              } />
              
              {/* Retention Analyst routes - Core Daily Use */}
              <Route path="prediction-insights" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PredictionInsights />
                </Suspense>
              } />
              <Route path="recommendations" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Recommendations />
                </Suspense>
              } />
              
              {/* Retention Analyst routes - Analytical & Strategic */}
              <Route path="behavioral-analysis" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Analysis />
                </Suspense>
              } />
              <Route path="campaigns" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <CampaignManagement />
                </Suspense>
              } />
              <Route path="campaigns/:id/performance" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <CampaignPerformance />
                </Suspense>
              } />
              <Route path="explainability" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ModelInsights />
                </Suspense>
              } />
              
              {/* Retention Analyst routes - Advanced Tools */}
              <Route path="model-insights" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ModelInsights />
                </Suspense>
              } />
              <Route path="data-management" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminData />
                </Suspense>
              } />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="analysis" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Analysis />
                </Suspense>
              } />
              <Route path="bulk-prediction" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <BulkPrediction />
                </Suspense>
              } />
              
              {/* Retention Manager routes */}
              <Route path="team" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Team />
                </Suspense>
              } />
              <Route path="approvals" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Approvals />
                </Suspense>
              } />
              <Route path="strategic-analytics" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <StrategicAnalytics />
                </Suspense>
              } />
              <Route path="budget-roi" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <BudgetROI />
                </Suspense>
              } />
              
              {/* Reports route for all roles */}
              <Route path="reports" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Reports />
                </Suspense>
              } />
              
              {/* Admin routes */}
              <Route path="admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminUsers />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/data" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminData />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/models" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminModels />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/audit" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminAudit />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminSettings />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/maintenance" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <BackupMaintenance />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="admin/reports" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Reports />
                  </Suspense>
                </ProtectedRoute>
              } />
              
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
