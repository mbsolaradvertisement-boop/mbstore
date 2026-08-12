import api from "../lib/api";
export const getSellerSettings=()=>api.get("/seller/settings");
export const updateSellerSettings=settings=>api.put("/seller/settings",settings);
