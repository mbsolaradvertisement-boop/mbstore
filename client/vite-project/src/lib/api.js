import axios from "axios";

const configuredUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const baseURL = configuredUrl.replace(/\/$/, "").endsWith("/api") ? configuredUrl.replace(/\/$/, "") : `${configuredUrl.replace(/\/$/, "")}/api`;
const api = axios.create({ baseURL, withCredentials: true, timeout: 15000 });
export const apiMessage = (error) => error.response?.data?.message || (error.code === "ECONNABORTED" ? "The request timed out. Please try again." : error.message || "Something went wrong. Please try again.");
export default api;
