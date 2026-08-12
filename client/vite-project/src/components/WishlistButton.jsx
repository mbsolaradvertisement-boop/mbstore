import {useState} from "react";
import {FiHeart,FiX} from "react-icons/fi";
import {useLocation,useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {useToast} from "../context/ToastContext";
import {useWishlist} from "../context/WishlistContext";
import {apiMessage} from "../lib/api";

export default function WishlistButton({productId,className=""}){
  const {user}=useAuth(),{toast}=useToast(),wishlist=useWishlist(),navigate=useNavigate(),location=useLocation();
  const [busy,setBusy]=useState(false),[loginPrompt,setLoginPrompt]=useState(false);
  const active=wishlist.isWishlisted(productId);
  async function click(event){event.stopPropagation();if(!user){setLoginPrompt(true);return}if(user.role!=="Customer"){toast("Only customers can use the wishlist.","error");return}if(busy)return;setBusy(true);try{const added=await wishlist.toggle(productId);toast(added?"Added to wishlist":"Removed from wishlist")}catch(error){toast(apiMessage(error),"error")}finally{setBusy(false)}}
  return <><button type="button" onClick={click} disabled={busy} aria-label={active?"Remove from wishlist":"Add to wishlist"} aria-pressed={active} className={`grid size-9 place-items-center rounded-full bg-white text-lg shadow-md transition hover:scale-110 disabled:opacity-60 ${active?"text-red-600":"text-slate-500 hover:text-red-600"} ${className}`}><FiHeart className={active?"fill-current":""}/></button>{loginPrompt&&<div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/60 p-4" onClick={event=>event.target===event.currentTarget&&setLoginPrompt(false)}><section className="w-full max-w-md rounded-3xl bg-white p-6"><div className="flex justify-between"><h2 className="text-2xl font-black">Login Required</h2><button onClick={()=>setLoginPrompt(false)}><FiX/></button></div><p className="mt-3 text-slate-600">Please login as a customer to save products to your wishlist.</p><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setLoginPrompt(false)} className="rounded-xl border px-5 py-3 font-bold">Cancel</button><button onClick={()=>navigate("/login",{state:{returnTo:`${location.pathname}${location.search}`}})} className="rounded-xl bg-teal-700 px-5 py-3 font-bold text-white">Login</button></div></section></div>}</>;
}
