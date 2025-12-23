import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://stock-market-26i6.onrender.com/api',
});

export const fetchQuote = (symbol) => api.get("/stocks/quote", { params: { symbol } });
export const fetchHistory = (symbol, range = "6mo") => api.get("/stocks/history", { params: { symbol, range } });
export const fetchPrediction = (symbol) => api.get("/stocks/predict", { params: { symbol } });
export const loginUser = (credentials) => api.post("/auth/login", credentials);
export const registerUser = (userData) => api.post("/auth/register", userData);

// Watchlist
export const addToWatchlist = (data) => api.post("/watchlist/add", data);
export const getWatchlist = (userId) => api.get(`/watchlist/${userId}`);
export const removeFromWatchlist = (userId, symbol) => api.delete(`/watchlist/${userId}/${symbol}`);

// News
export const fetchStockNews = (symbol) => api.get(`/stocks/news?symbol=${symbol}`);

// User Profile
export const updateUserProfile = (userId, userData) => api.put(`/auth/profile/${userId}`, userData);

// Alerts (ADDED THIS)
export const createAlert = (data) => api.post("/alerts/create", data);
export const getUserAlerts = (userId) => api.get(`/alerts/${userId}`);

// In api.js
// In api.js
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    throw error;
  }
};

// In api.js
export const resetPassword = async (token, newPassword, confirmPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
};

export default api;