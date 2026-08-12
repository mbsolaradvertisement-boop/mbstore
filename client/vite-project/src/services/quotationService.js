import api from "../lib/api";

export function createQuotation(payload) {
  return api.post("/quotations", payload);
}

export function getCustomerQuotations(params) {
  return api.get("/customer/quotations", { params });
}

export function decideQuotation(id, decision) {
  return api.post(`/customer/quotations/${id}/decision`, { decision });
}

export function getSellerQuotations(params) {
  return api.get("/seller/quotations", { params });
}

export function respondToQuotation(id, payload) {
  return api.post(`/seller/quotations/${id}/respond`, payload);
}

export function rejectQuotation(id, reason) {
  return api.post(`/seller/quotations/${id}/reject`, { reason });
}
