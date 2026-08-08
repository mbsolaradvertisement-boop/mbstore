import api from "../lib/api";
export const getSellerProducts=params=>api.get("/seller/products",{params});
export const getSellerProduct=id=>api.get(`/seller/products/${id}`);
export const createProduct=data=>api.post("/seller/products",data);
export const updateProduct=(id,data)=>api.put(`/seller/products/${id}`,data);
export const deleteProduct=id=>api.delete(`/seller/products/${id}`);
