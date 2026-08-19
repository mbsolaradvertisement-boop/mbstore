import api from "../lib/api";
export const getBanners=()=>api.get("/home/banners");
export const getAdminBanners=()=>api.get("/admin/banners");
export const createBanner=data=>api.post("/admin/banners",data);
export const updateBanner=(id,data)=>api.put(`/admin/banners/${id}`,data);
export const updateBannerStatus=(id,status)=>api.patch(`/admin/banners/${id}/status`,{status});
export const deleteBanner=id=>api.delete(`/admin/banners/${id}`);
