import { useEffect, useMemo, useState } from "react";
import { FiPackage, FiX } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import BrandScroller from "../../components/BrandScroller";
import CatalogueHeader from "../../components/CatalogueHeader";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import SidebarFilters from "../../components/SidebarFilters";
import Footer from "../../components/Footer";
import { products } from "../../data/products";

const emptyFilters={category:[],brand:[],company:[],power:[],voltage:[],technology:[],availability:[]};
export default function Catalogue(){
  const [params,setParams]=useSearchParams();
  const initialCompany=params.get("company")||"";
  const [search,setSearch]=useState(params.get("q")||"");
  const [filters,setFilters]=useState({...emptyFilters,company:initialCompany?[initialCompany]:[]});
  const [sort,setSort]=useState("newest");
  const [mobileFilters,setMobileFilters]=useState(false);
  useEffect(()=>{setSearch(params.get("q")||"");const company=params.get("company")||"";setFilters(current=>({...current,company:company?[company]:[]}))},[params]);
  const toggle=(type,value)=>setFilters(current=>({...current,[type]:current[type].includes(value)?current[type].filter(item=>item!==value):[...current[type],value]}));
  const setBrand=(brand)=>setFilters(current=>({...current,brand:brand?[brand]:[]}));
  const reset=()=>{setFilters(emptyFilters);setSearch("");setParams({})};
  const changeSearch=(value)=>{setSearch(value);const next=new URLSearchParams(params);value?next.set("q",value):next.delete("q");setParams(next,{replace:true})};
  const results=useMemo(()=>{const term=search.trim().toLowerCase();const list=products.filter(product=>{const matchesSearch=!term||[product.name,product.company,product.brand,product.category,product.subcategory,product.technology].some(value=>value.toLowerCase().includes(term));const matchesFilters=Object.entries(filters).every(([type,values])=>!values.length||values.includes(product[type]));return matchesSearch&&matchesFilters});return [...list].sort((a,b)=>sort==="az"?a.name.localeCompare(b.name):sort==="popular"?Number(b.featured)-Number(a.featured):sort==="latest"?b.id-a.id:a.id-b.id)},[filters,search,sort]);
  return <><Navbar searchValue={search} onSearchChange={changeSearch}/><BrandScroller active={filters.brand[0]||""} onSelect={setBrand}/><main className="bg-slate-50 py-10 md:py-14"><div className="section-shell"><CatalogueHeader count={results.length} company={filters.company[0]} sort={sort} onSort={setSort} onOpenFilters={()=>setMobileFilters(true)}/><div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)]"><div className="hidden lg:block"><SidebarFilters filters={filters} onToggle={toggle} onReset={reset} className="sticky top-39 max-h-[calc(100vh-11rem)] overflow-y-auto"/></div><section aria-label="Product results">{results.length?<div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{results.map(product=><ProductCard key={product.id} product={product}/>)}</div>:<div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400"><FiPackage/></span><h2 className="text-xl font-black text-slate-900">No products found</h2><p className="mt-2 max-w-sm text-sm text-slate-500">Try removing a filter or searching with a broader product, company, or brand name.</p><button onClick={reset} className="mt-5 rounded-xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white">Reset Filters</button></div>}</section></div></div></main>{mobileFilters&&<div className="fixed inset-0 z-[70] bg-slate-950/50 lg:hidden" role="dialog" aria-modal="true" aria-label="Product filters"><div className="absolute inset-y-0 left-0 w-[min(88%,360px)] overflow-y-auto bg-slate-50 p-4"><button onClick={()=>setMobileFilters(false)} aria-label="Close filters" className="ml-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow"><FiX/></button><SidebarFilters filters={filters} onToggle={toggle} onReset={reset}/><button onClick={()=>setMobileFilters(false)} className="sticky bottom-3 mt-4 w-full rounded-xl bg-sky-600 px-5 py-3 font-extrabold text-white shadow-lg">Show {results.length} Products</button></div></div>}<Footer/></>
}
