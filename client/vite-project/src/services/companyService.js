import api from "../lib/api";
export const getCompanies = (params={limit:100}) => api.get("/companies", { params });
