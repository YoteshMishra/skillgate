import axios from "axios";

// Set VITE_API_URL on Netlify, e.g. https://your-service.onrender.com/api
// Locally it falls back to your dev server.
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

// Server address without "/api", used for links to uploaded files
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_URL,
});

// Automatically attach the JWT token (if present) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;