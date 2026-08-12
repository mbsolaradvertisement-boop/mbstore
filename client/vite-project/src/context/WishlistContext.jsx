import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {getWishlistIds,toggleWishlist} from "../services/wishlistService";

const WishlistContext=createContext(null);

export function WishlistProvider({children}){
  const {user,checking}=useAuth();
  const [ids,setIds]=useState(new Set());
  const [loading,setLoading]=useState(false);

  const refresh=useCallback(async()=>{
    if(!user?.id||user.role!=="Customer"){setIds(new Set());return}
    setLoading(true);
    try{const {data}=await getWishlistIds();setIds(new Set(data.productIds.map(Number)))}catch{setIds(new Set())}finally{setLoading(false)}
  },[user?.id,user?.role]);

  useEffect(()=>{if(!checking)refresh()},[checking,refresh]);

  const toggle=useCallback(async productId=>{
    const id=Number(productId),previous=new Set(ids),optimistic=new Set(ids);
    if(optimistic.has(id))optimistic.delete(id);
    else optimistic.add(id);
    setIds(optimistic);
    try{const {data}=await toggleWishlist(id);setIds(current=>{const next=new Set(current);if(data.wishlisted)next.add(id);else next.delete(id);return next});return data.wishlisted}catch(error){setIds(previous);throw error}
  },[ids]);

  const removeLocal=useCallback(productId=>setIds(current=>{const next=new Set(current);next.delete(Number(productId));return next}),[]);
  const value=useMemo(()=>({ids,loading,isWishlisted:id=>ids.has(Number(id)),toggle,refresh,removeLocal}),[ids,loading,toggle,refresh,removeLocal]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist=()=>useContext(WishlistContext);
