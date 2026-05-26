import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your deployed server URL
export const BASE_URL = 'https://your-server.com/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await AsyncStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          await AsyncStorage.setItem('access_token', res.data.access);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api(error.config);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp/', { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp/', { phone, code }),
  setPin: (pin) => api.post('/auth/set-pin/', { pin }),
  verifyPin: (pin) => api.post('/auth/verify-pin/', { pin }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/update/', data),
};

// ── Children ─────────────────────────────────────────────────
export const childrenAPI = {
  list: () => api.get('/children/'),
  create: (data) => api.post('/children/', data),
  detail: (id) => api.get(`/children/${id}/`),
  update: (id, data) => api.put(`/children/${id}/`, data),
  delete: (id) => api.delete(`/children/${id}/`),
  linkDevice: (data) => api.post('/children/link-device/', data),
};

// ── App Control ───────────────────────────────────────────────
export const appsAPI = {
  getPermissions: (childId) => api.get(`/apps/${childId}/permissions/`),
  createPermission: (childId, data) => api.post(`/apps/${childId}/permissions/`, data),
  updatePermission: (childId, permId, data) => api.put(`/apps/${childId}/permissions/${permId}/`, data),
  syncApps: (childId, apps) => api.post(`/apps/${childId}/sync/`, { apps }),
  checkAllowed: (childId, pkg) => api.get(`/apps/${childId}/check/${pkg}/`),
  reportUsage: (childId, usage) => api.post(`/apps/${childId}/report-usage/`, { usage }),
  getUsage: (childId, date) => api.get(`/apps/${childId}/usage/`, { params: { date } }),
};

// ── Education ─────────────────────────────────────────────────
export const educationAPI = {
  getTest: (childId, subject) => api.get(`/education/${childId}/test/${subject}/`),
  submitTest: (childId, subject, answers) => api.post(`/education/${childId}/test/${subject}/submit/`, { answers }),
  history: (childId) => api.get(`/education/${childId}/history/`),
};

// ── Location ─────────────────────────────────────────────────
export const locationAPI = {
  current: (childId) => api.get(`/location/${childId}/current/`),
  history: (childId) => api.get(`/location/${childId}/history/`),
  update: (childId, data) => api.post(`/location/${childId}/update/`, data),
};

export default api;
