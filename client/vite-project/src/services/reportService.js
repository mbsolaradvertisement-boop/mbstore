import api from "../lib/api";

export const getSellerReport = (params) => api.get("/seller/reports", { params });
export const downloadSellerReportPdf = (params) => api.get("/seller/reports/pdf", { params, responseType: "blob" });
