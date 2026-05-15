// ============================================================
// src/services/api.ts
// Axios instance configured to talk to the backend API
// ============================================================

import axios from 'axios';

// Base URL comes from Vite env variable (see .env in frontend root)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----------------------------------------------------------
// Request Interceptor
// Automatically attach JWT token to every outgoing request
// ----------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------------
// Response Interceptor
// Handle 401 Unauthorized globally (e.g., expired token)
// ----------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
