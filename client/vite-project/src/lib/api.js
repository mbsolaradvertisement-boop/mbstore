import axios from "axios";

const configuredUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const baseURL = configuredUrl.replace(/\/$/, "").endsWith("/api") ? configuredUrl.replace(/\/$/, "") : `${configuredUrl.replace(/\/$/, "")}/api`;
const api = axios.create({ baseURL, withCredentials: true, timeout: 15000 });
let refreshRequest = null;
const noRefresh = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout", "/auth/forgot-password", "/auth/reset-password"];
api.interceptors.response.use(response => response, async error => {
  const original = error.config;
  const path = String(original?.url || "");
  if (error.response?.status !== 401 || !original || original._sessionRetry || noRefresh.some(route => path.includes(route))) return Promise.reject(error);
  original._sessionRetry = true;
  try {
    if (!refreshRequest) refreshRequest = api.post("/auth/refresh").finally(() => { refreshRequest = null; });
    await refreshRequest;
    return api(original);
  } catch (refreshError) {
    window.dispatchEvent(new CustomEvent("mbstore:session-expired", { detail: { message: refreshError.response?.data?.message || "Your session has expired. Please login again." } }));
    return Promise.reject(refreshError);
  }
});
export const apiMessage = (error) => error.response?.data?.message || (error.code === "ECONNABORTED" ? "The request timed out. Please try again." : error.message || "Something went wrong. Please try again.");
export const apiAsset = (path) => {
  if (!path) return "";
  if (/^(?:data:|blob:|https?:\/\/)/i.test(path)) return path;
  return `${baseURL}${path.startsWith("/") ? path : `/${path}`}`;
};
export default api;
