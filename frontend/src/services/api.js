import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

export default apiClient;
