import { memo } from "react";
import { FiArrowRight, FiFlag, FiMessageSquare, FiPackage } from "react-icons/fi";
import { apiAsset } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { recordCatalogueProductView } from "../services/catalogueService";
import WishlistButton from "./WishlistButton";

const availabilityStyle={in_stock:["In Stock","bg-emerald-50 text-emerald-700"],low_stock:["Low Stock","bg-amber-50 text-amber-700"],out_of_stock:["Out of Stock","bg-red-50 text-red-700"]};

function ProductCard({ product, onDetails, onQuote, onReport }) {
  const { user } = useAuth();
  const [availabilityLabel,availabilityTone]=availabilityStyle[product.availability]||[];
  const openDetails=()=>{onDetails?.(product);if(user?.role==="Customer")recordCatalogueProductView(product.id).catch(()=>{});};
  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
    <div className="flex items-center justify-between px-4 pb-2 pt-4">
      <div className="flex min-w-0 items-center gap-2">{product.companyLogoUrl?<img src={apiAsset(product.companyLogoUrl)} alt={`${product.company} logo`} loading="lazy" decoding="async" className="size-7 shrink-0 rounded-md object-contain"/>:<span className="grid size-7 place-items-center rounded-md bg-slate-100 text-[10px] font-black text-slate-500">{product.company?.slice(0,2).toUpperCase()}</span>}<span className="truncate text-xs font-black text-teal-700">{product.company}</span></div>
      <WishlistButton productId={product.id} className="relative right-auto top-auto size-8 border border-slate-100 shadow-none"/>
    </div>
    <div className="relative mx-4 aspect-square overflow-hidden rounded-2xl bg-[#fafafa]">
      {product.image?<img src={apiAsset(product.image)} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"/>:<div className="grid h-full place-items-center text-slate-300"><div className="text-center"><FiPackage className="mx-auto text-4xl"/><span className="mt-2 block text-[11px] font-bold">Image unavailable</span></div></div>}
      {availabilityLabel&&<span className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-black ${availabilityTone}`}>{availabilityLabel}</span>}
    </div>
    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
      <p className="text-[10px] font-black uppercase tracking-[.12em] text-sky-600">{product.category}</p>
      <h2 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-900">{product.name}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-500"><span className="rounded-md bg-slate-50 px-2 py-1">{product.technology||product.brand}</span>{product.power&&<span className="rounded-md bg-slate-50 px-2 py-1">{product.power}</span>}</div>
    </div>
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
      <button type="button" onClick={openDetails} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700">Details<FiArrowRight/></button>
      <button type="button" onClick={()=>onQuote?.(product)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-2 py-2.5 text-xs font-bold text-white transition hover:bg-red-600"><FiMessageSquare/>Quote</button>
      <button type="button" onClick={()=>onReport?.(product)} aria-label="Report product" title="Report product" className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"><FiFlag/></button>
    </div>
  </article>;
}

export default memo(ProductCard);
