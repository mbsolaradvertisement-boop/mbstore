import api from "../lib/api";
export const getSellerDashboard=params=>api.get("/seller/dashboard",{params});
