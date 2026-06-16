import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopez_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => API.get('/auth/me'),
};

export const stocksAPI = {
  getAll: () => API.get('/stocks'),
  search: (query) => API.get(`/stocks/search?q=${query}`),
  getBySymbol: (symbol) => API.get(`/stocks/${symbol}`),
};

export const tradesAPI = {
  buy: (tradeData) => API.post('/trades/buy', tradeData),
  sell: (tradeData) => API.post('/trades/sell', tradeData),
  getPortfolio: () => API.get('/trades/portfolio'),
  getHistory: () => API.get('/trades/history'),
};

export const adminAPI = {
  getAnalytics: () => API.get('/admin/analytics'),
  getUsers: () => API.get('/admin/users'),
  updateUserRole: (id, role) => API.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  createStock: (stockData) => API.post('/admin/stocks', stockData),
  deleteStock: (symbol) => API.delete(`/admin/stocks/${symbol}`),
  getAllTrades: () => API.get('/admin/trades'),
};

export default API;
