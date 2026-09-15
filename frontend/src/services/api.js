import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Admin Token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudscale-admin-token') || sessionStorage.getItem('cloudscale-admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-admin-token'] = token;
  }
  return config;
});

export const loginAdminApi = async (username, password, pin) => {
  const response = await apiClient.post('/auth/login', { username, password, pin });
  return response.data;
};

export const verifyAdminSessionApi = async () => {
  const response = await apiClient.get('/auth/verify');
  return response.data;
};

export const logoutAdminApi = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const fetchHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const fetchInfo = async () => {
  const response = await apiClient.get('/info');
  return response.data;
};

export const fetchServerInfo = async () => {
  const response = await apiClient.get('/server-info');
  return response.data;
};

export const fetchMetrics = async () => {
  const response = await apiClient.get('/metrics');
  return response.data;
};

export const setCapacity = async (action, desiredCapacity) => {
  const response = await apiClient.post('/capacity', { action, desiredCapacity });
  return response.data;
};

export const startLoadTest = async () => {
  const response = await apiClient.post('/load-test/start');
  return response.data;
};

export const stopLoadTest = async () => {
  const response = await apiClient.post('/load-test/stop');
  return response.data;
};

export const submitContact = async (data) => {
  const response = await apiClient.post('/contact', data);
  return response.data;
};

export const pingServer = async () => {
  const response = await apiClient.get('/ping');
  return response.data;
};

// --- Phase 2: AWS Infrastructure Control & Telemetry ---
export const fetchInfrastructureStatus = async () => {
  const response = await apiClient.get('/infrastructure/status');
  return response.data;
};

export const scaleIncrease = async () => {
  const response = await apiClient.post('/scaling/increase');
  return response.data;
};

export const scaleDecrease = async () => {
  const response = await apiClient.post('/scaling/decrease');
  return response.data;
};

export const fetchCpuMetrics = async () => {
  const response = await apiClient.get('/metrics/cpu');
  return response.data;
};

export const fetchRequestMetrics = async () => {
  const response = await apiClient.get('/metrics/requests');
  return response.data;
};

export const fetchInstanceMetrics = async () => {
  const response = await apiClient.get('/metrics/instances');
  return response.data;
};

export default apiClient;
