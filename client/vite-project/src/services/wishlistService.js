import api from "../lib/api";
export const getWishlist=()=>api.get("/customer/wishlist");
export const getWishlistIds=()=>api.get("/customer/wishlist/ids");
export const toggleWishlist=productId=>api.post("/customer/wishlist/toggle",{productId});
export const removeFromWishlist=productId=>api.delete(`/customer/wishlist/${productId}`);
