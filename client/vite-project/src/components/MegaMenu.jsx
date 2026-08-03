import { useState } from "react";
import { FiChevronDown, FiImage } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { categories } from "../data/categories";

export default function MegaMenu(){
  const navigate=useNavigate();
  const [open,setOpen]=useState(null);
  const select=(term)=>{setOpen(null);navigate(`/catalogue?q=${encodeURIComponent(term)}`)};
  return <div className="border-t border-slate-100 bg-white shadow-sm"><div className="section-shell flex gap-1 overflow-x-auto py-1 [scrollbar-width:none]" onMouseLeave={()=>setOpen(null)}>{categories.map((category)=><div key={category.name} className="shrink-0" onMouseEnter={()=>setOpen(category.name)}><button onClick={()=>setOpen(open===category.name?null:category.name)} aria-expanded={open===category.name} className="flex items-center gap-1 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 xl:text-sm">{category.name}<FiChevronDown className={`transition ${open===category.name?"rotate-180":""}`}/></button>{open===category.name&&<div className="absolute left-0 right-0 z-40 border-y border-slate-200 bg-white shadow-2xl"><div className="section-shell grid gap-8 py-8 lg:grid-cols-[1fr_260px]"><div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{category.children.map(group=><div key={group.title}><h3 className="mb-3 text-sm font-black text-slate-900">{group.title}</h3><ul className="space-y-2">{group.items.map(item=><li key={item}><button onClick={()=>select(item)} className="text-left text-sm text-slate-500 transition hover:translate-x-1 hover:text-sky-700">{item}</button></li>)}</ul></div>)}</div><button onClick={()=>select(category.name)} className="placeholder-pattern flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition hover:border-sky-300 hover:text-sky-600"><FiImage className="mb-2 text-3xl"/><span className="text-xs font-bold">Image Placeholder</span><strong className="mt-3 text-sm text-slate-700">Explore {category.name}</strong></button></div></div>}</div>)}</div></div>
}
