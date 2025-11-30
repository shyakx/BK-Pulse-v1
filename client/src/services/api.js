import axios from 'axios';

// In development, use relative URLs to leverage the proxy in package.json
// In production, use the full URL from environment variable or default
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    // If environment variable is set, use it (but validate it has protocol)
    const url = process.env.REACT_APP_API_URL;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it doesn't have protocol, assume it's a relative path or add http://
    if (url.startsWith('/')) {
      return url;
    }
    return `http://${url}`;
  }
  // In development, use relative URL to leverage proxy
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }
  // In production, default to localhost (should be overridden by env var)
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log API base URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const timeoutError = new Error('Request timeout. Please check your connection and try again.');
      timeoutError.isTimeout = true;
      return Promise.reject(timeoutError);
    }
    
    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error. Please check your connection.');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }
    
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
    return apiClient.get('/customers', {
      params,
      timeout: 0, // disable axios timeout; backend will control request duration
    });
  },

  getCustomer: (id, params = {}) => {
    return apiClient.get(`/customers/${id}`, { params });
  },

  updateCustomerPrediction: (id) => {
    // Use longer timeout for prediction calls (60 seconds)
    return apiClient.post(`/customers/${id}/predict`, {}, {
      timeout: 60000
    });
  },

  getCustomerStats: () => {
    return apiClient.get('/customers/stats/summary');
  },

  // Predictions
  predictChurn: (customerData) => {
    return apiClient.post('/predictions/single', customerData);
  },

  batchPredict: (options = {}) => {
    // Create a separate axios instance with longer timeout for batch operations
    const token = localStorage.getItem('token');
    return axios.post(`${API_BASE_URL}/predictions/batch`, options, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      timeout: 300000, // 5 minutes for batch predictions
    }).then(response => response.data).catch(error => {
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        const timeoutError = new Error('Request timeout. Please check your connection and try again.');
        timeoutError.isTimeout = true;
        return Promise.reject(timeoutError);
      }
      // Handle network errors
      if (!error.response) {
        const networkError = new Error('Network error. Please check your connection.');
        networkError.isNetworkError = true;
        return Promise.reject(networkError);
      }
      return Promise.reject(error.response?.data || error.message);
    });
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

  updateRetentionNote: (id, noteData) => {
    return apiClient.patch(`/retention-notes/${id}`, noteData);
  },

  // Tasks
  getTasks: (params = {}) => {
    return apiClient.get('/tasks', { params });
  },

  createTask: (taskData) => {
    return apiClient.post('/tasks', taskData);
  },

  // Assignments
  getMyAssignedCustomers: (params = {}) => {
    return apiClient.get('/assignments/my-assigned', { params });
  },

  removeAssignment: (customerId) => {
    return apiClient.delete(`/assignments/${customerId}`);
  },

  completeTask: (taskId) => {
    return apiClient.patch(`/tasks/${taskId}/complete`);
  },

  updateTask: (taskId, taskData) => {
    return apiClient.patch(`/tasks/${taskId}`, taskData);
  },

  deleteTask: (taskId) => {
    return apiClient.delete(`/tasks/${taskId}`);
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

  // Model Validation
  getModelValidationMetrics: () => {
    return apiClient.get('/model-validation/metrics');
  },

  getModelValidationComparison: (params = {}) => {
    return apiClient.get('/model-validation/comparison', { params });
  },

  // Recommendations
  getCustomerRecommendations: (customerId) => {
    return apiClient.get(`/customers/${customerId}/recommendations`);
  },

  // Model Performance
  getModelPerformance: () => {
    return apiClient.get('/model/performance');
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


  // Incentive Analytics
  getIncentiveAnalytics: (params = {}) => {
    return apiClient.get('/incentives/analytics', { params });
  },

  getIncentiveUsage: (params = {}) => {
    return apiClient.get('/incentives/usage', { params });
  },

  getIncentiveROI: (params = {}) => {
    return apiClient.get('/incentives/roi', { params });
  },

  // Data Quality Monitor
  getDataQualityMetrics: () => {
    return apiClient.get('/data-quality/metrics');
  },

  getDataQualityAlerts: () => {
    return apiClient.get('/data-quality/alerts');
  },

  getPipelineStatus: () => {
    return apiClient.get('/data-quality/pipeline-status');
  },

  getDataDrift: () => {
    return apiClient.get('/data-quality/drift');
  },

  // Notifications
  getNotifications: (params = {}) => {
    return apiClient.get('/notifications', { params });
  },

  markNotificationRead: (id) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllNotificationsRead: () => {
    return apiClient.patch('/notifications/read-all');
  },

  // Customer Management
  createCustomer: (customerData) => {
    return apiClient.post('/customers', customerData);
  },

  // User Profile
  updateProfile: (profileData) => {
    return apiClient.patch('/auth/profile', profileData);
  },

  updatePassword: (passwordData) => {
    return apiClient.patch('/auth/password', passwordData);
  },
};

export default api;

