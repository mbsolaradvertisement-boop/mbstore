import api from "../lib/api";
export const getCatalogueProducts = params => api.get("/catalogue/products", { params });
export const getCatalogueFilters = params => api.get("/catalogue/filters", { params });
export const recordCatalogueProductView = id => api.post(`/catalogue/products/${id}/view`);
