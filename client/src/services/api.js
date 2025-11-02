/**
 * API Service for BK Pulse
 * Handles all API calls to the backend
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Unauthorized/Forbidden - clear token and redirect to login
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// API methods
export const api = {
  // Auth
  login: (email, password) => {
    return apiClient.post('/auth/login', { email, password });
  },

  getMe: () => {
    return apiClient.get('/auth/me');
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },

  // Dashboard
  getDashboard: () => {
    return apiClient.get('/dashboard/overview');
  },

  // Customers
  getCustomers: (params = {}) => {
    return apiClient.get('/customers', { params });
  },

  getCustomer: (id) => {
    return apiClient.get(`/customers/${id}`);
  },

  updateCustomerPrediction: (id) => {
    return apiClient.post(`/customers/${id}/predict`);
  },

  getCustomerStats: () => {
    return apiClient.get('/customers/stats/summary');
  },

  // Predictions
  predictChurn: (customerData) => {
    return apiClient.post('/predictions/single', customerData);
  },

  batchPredict: (options = {}) => {
    return apiClient.post('/predictions/batch', options);
  },

  getModelInfo: () => {
    return apiClient.get('/predictions/model-info');
  },

  // Retention Notes
  getRetentionNotes: (params = {}) => {
    return apiClient.get('/retention-notes', { params });
  },

  createRetentionNote: (noteData) => {
    return apiClient.post('/retention-notes', noteData);
  },

  // Tasks
  getTasks: (params = {}) => {
    return apiClient.get('/tasks', { params });
  },

  createTask: (taskData) => {
    return apiClient.post('/tasks', taskData);
  },

  completeTask: (taskId) => {
    return apiClient.patch(`/tasks/${taskId}/complete`);
  },

  // Performance
  getPerformance: (params = {}) => {
    return apiClient.get('/performance', { params });
  },

  getLeaderboard: (params = {}) => {
    return apiClient.get('/performance/leaderboard', { params });
  },

  // Campaigns
  getCampaigns: (params = {}) => {
    return apiClient.get('/campaigns', { params });
  },

  getCampaign: (id) => {
    return apiClient.get(`/campaigns/${id}`);
  },

  createCampaign: (campaignData) => {
    return apiClient.post('/campaigns', campaignData);
  },

  getCampaignPerformance: (id) => {
    return apiClient.get(`/campaigns/${id}/performance`);
  },

  getCampaignCustomers: (id, params = {}) => {
    return apiClient.get(`/campaigns/${id}/customers`, { params });
  },

  updateCampaign: (id, campaignData) => {
    return apiClient.patch(`/campaigns/${id}`, campaignData);
  },

  deleteCampaign: (id) => {
    return apiClient.delete(`/campaigns/${id}`);
  },

  // Segmentation
  getSegments: () => {
    return apiClient.get('/segmentation');
  },

  getSegment: (id) => {
    return apiClient.get(`/segmentation/${id}`);
  },

  createSegment: (segmentData) => {
    return apiClient.post('/segmentation', segmentData);
  },

  deleteSegment: (id) => {
    return apiClient.delete(`/segmentation/${id}`);
  },

  // Analytics
  getStrategicAnalytics: (params = {}) => {
    return apiClient.get('/analytics/strategic', { params });
  },

  getBudgetROI: (params = {}) => {
    return apiClient.get('/analytics/budget-roi', { params });
  },

  // SHAP Values
  getCustomerSHAP: (customerId) => {
    return apiClient.get(`/customers/${customerId}/shap`);
  },

  // Recommendations
  getCustomerRecommendations: (customerId) => {
    return apiClient.get(`/customers/${customerId}/recommendations`);
  },

  // Model Performance
  getModelPerformance: () => {
    return apiClient.get('/model/performance');
  },

  // Admin
  getMaintenanceInfo: () => {
    return apiClient.get('/admin/maintenance');
  },

  createBackup: () => {
    return apiClient.post('/admin/backup');
  },

  optimizeDatabase: () => {
    return apiClient.post('/admin/optimize');
  },

  // Team
  getTeam: () => {
    return apiClient.get('/team');
  },

  getTeamActivities: (id) => {
    return apiClient.get(`/team/${id}/activities`);
  },

  getTeamCustomers: (id, params = {}) => {
    return apiClient.get(`/team/${id}/customers`, { params });
  },

  // Recommendations Monitoring
  getAllRecommendations: (params = {}) => {
    return apiClient.get('/recommendations', { params });
  },

  updateRecommendationStatus: (id, status) => {
    return apiClient.patch(`/recommendations/${id}/status`, { status });
  },

  // Reports
  getPerformanceReport: (params = {}) => {
    return apiClient.get('/reports/performance', { params });
  },

  getCustomerReport: (params = {}) => {
    return apiClient.get('/reports/customer', { params });
  },

  // Admin
  getAdminDashboard: () => {
    return apiClient.get('/admin/dashboard');
  },

  getAdminUsers: () => {
    return apiClient.get('/admin/users');
  },

  createAdminUser: (userData) => {
    return apiClient.post('/admin/users', userData);
  },

  updateAdminUser: (id, userData) => {
    return apiClient.patch(`/admin/users/${id}`, userData);
  },

  getAdminModels: () => {
    return apiClient.get('/admin/models');
  },

  getAdminAudit: (params = {}) => {
    return apiClient.get('/admin/audit', { params });
  },

  getAdminSettings: () => {
    return apiClient.get('/admin/settings');
  },

  updateAdminSetting: (key, data) => {
    return apiClient.patch(`/admin/settings/${key}`, data);
  },

  getAdminData: () => {
    return apiClient.get('/admin/data');
  },

  generateCustomers: (count) => {
    return apiClient.post('/admin/customers/generate', { count });
  },
};

export default api;

