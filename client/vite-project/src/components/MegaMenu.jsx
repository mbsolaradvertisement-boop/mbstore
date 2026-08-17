import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../services/categoryService";

export default function MegaMenu(){
  const navigate=useNavigate();
  const [categories,setCategories]=useState([]);
  useEffect(()=>{let active=true;getCategories().then(({data})=>{if(active)setCategories(data.data||[])}).catch(()=>{});return()=>{active=false}},[]);
  if(!categories.length)return null;
  return <div className="border-t border-slate-100 bg-white shadow-sm"><nav aria-label="Product categories" className="section-shell flex gap-1 overflow-x-auto py-1 [scrollbar-width:none]">{categories.map((category)=><button key={category.id} type="button" onClick={()=>navigate(`/catalogue?categoryId=${category.id}`)} className="shrink-0 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 xl:text-sm">{category.name}</button>)}</nav></div>;
}
