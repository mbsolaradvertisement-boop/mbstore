import api from "../lib/api";
export const getCustomerDashboard = () => api.get("/customer/dashboard");
