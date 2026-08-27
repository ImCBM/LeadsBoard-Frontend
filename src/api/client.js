import axios from 'axios';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const client = axios.create({
  baseURL: rawBaseUrl ? `${rawBaseUrl}/api/v1` : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor: attach Sanctum bearer token ──
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: redirect to /login on 401 ──
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
