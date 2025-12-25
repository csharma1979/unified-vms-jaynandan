import axios from 'axios';

// Determine the base URL based on the environment
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side (browser environment)
    if (process.env.NODE_ENV === 'development') {
      // In development, use relative path (will be proxied by Vite)
      return '/api';
    } else {
      // In production, use the backend API URL
      // Check if a BACKEND_URL environment variable is set, otherwise use default
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://209.145.53.86:4000';
      return `${backendUrl}/api`;
    }
  }
  // Server-side rendering (if any) - fallback to relative path
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
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

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;