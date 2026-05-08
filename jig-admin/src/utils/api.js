import axios from "axios";

// Base URL — ubah sesuai backend kamu
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jig_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan. Coba lagi.";
    return Promise.reject(new Error(msg));
  }
);

// ─── BOOKING API ──────────────────────────────────────────────────────────
export const bookingApi = {
  getAll: ()           => api.get("/bookings"),
  getById: (id)        => api.get(`/bookings/${id}`),
  create: (data)       => api.post("/bookings", data),
  update: (id, data)   => api.put(`/bookings/${id}`, data),
  delete: (id)         => api.delete(`/bookings/${id}`),
  syncFromSheets: ()   => api.get("/sync-bookings"),
};

// ─── CAR API ──────────────────────────────────────────────────────────────
export const carApi = {
  getAll: ()           => api.get("/cars"),
  update: (id, data)   => api.put(`/cars/${id}`, data),
};

export default api;

// ─── DASHBOARD API ─────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get("/dashboard"),
};