import api from "../lib/api";
export const getCustomerSettings=()=>api.get("/customer/settings");
export const updateCustomerSettings=settings=>api.put("/customer/settings",settings);
