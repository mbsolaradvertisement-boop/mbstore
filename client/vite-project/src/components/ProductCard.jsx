import { memo, useState } from "react";
import { FiArrowRight, FiHeart, FiMessageSquare, FiPackage } from "react-icons/fi";
import { apiAsset } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { recordCatalogueProductView } from "../services/catalogueService";

const FAVORITES_KEY="mb-store-favorite-products";
const availabilityStyle={in_stock:["In Stock","bg-emerald-100 text-emerald-700"],low_stock:["Low Stock","bg-amber-100 text-amber-700"],out_of_stock:["Out of Stock","bg-red-100 text-red-700"]};
function storedFavorites(){
  try{return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]").map(String));}catch{return new Set();}
}

function ProductCard({ product, onDetails, onQuote }) {
  const { user } = useAuth();
  const [favorite,setFavorite]=useState(()=>storedFavorites().has(String(product.id)));
  const toggleFavorite=()=>setFavorite(current=>{
    const next=!current, favorites=storedFavorites(), id=String(product.id);
    if(next)favorites.add(id);
    else favorites.delete(id);
    localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]));
    return next;
  });
  const [availabilityLabel,availabilityTone]=availabilityStyle[product.availability]||availabilityStyle.in_stock;
  const openDetails=()=>{
    onDetails?.(product);
    if(user?.role==="Customer")recordCatalogueProductView(product.id).catch(()=>{});
  };
  return <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl">
    <div className="placeholder-pattern relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 text-slate-400">
      {product.image
        ? <img src={apiAsset(product.image)} alt={product.name} loading="lazy" decoding="async" className="absolute inset-0 block h-full w-full object-cover object-center" />
        : <div className="absolute inset-0 flex flex-col items-center justify-center"><FiPackage className="mb-2 text-3xl"/><span className="text-[11px] font-bold">Image Placeholder</span></div>}
      <span className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-4.75rem)] items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-sky-700 shadow-sm">
        {product.companyLogoUrl && <img src={apiAsset(product.companyLogoUrl)} alt={`${product.company} logo`} className="h-5 w-5 shrink-0 rounded-full bg-white object-contain"/>}
        <span className="truncate">{product.company}</span>
      </span>
      <button type="button" onClick={toggleFavorite} aria-label={favorite?"Remove from favorites":"Add to favorites"} aria-pressed={favorite} className={`absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-white text-lg shadow-md transition hover:scale-110 ${favorite?"text-red-600":"text-slate-500 hover:text-red-600"}`}><FiHeart className={favorite?"fill-current":""}/></button>
      <span className={`absolute bottom-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm ${availabilityTone}`}>{availabilityLabel}</span>
    </div>
    <div className="flex flex-1 flex-col p-2 pt-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">{product.category}</p>
      <h2 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-slate-900 sm:text-base">{product.name}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500"><span className="rounded-lg bg-slate-50 px-2 py-1.5">{product.technology || product.brand}</span><span className="rounded-lg bg-slate-50 px-2 py-1.5">{product.power || product.category}</span></div>
      <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2"><button type="button" onClick={openDetails} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">Details<FiArrowRight/></button><button type="button" onClick={()=>onQuote?.(product)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2 py-2.5 text-xs font-extrabold text-white transition hover:bg-red-700"><FiMessageSquare/>Quote</button></div>
    </div>
  </article>;
}

export default memo(ProductCard);
