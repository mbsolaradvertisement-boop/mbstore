import {useEffect,useMemo,useState} from "react";
import {FiAlertTriangle,FiPackage,FiRotateCcw,FiSearch,FiX} from "react-icons/fi";
import {useLocation,useNavigate,useSearchParams} from "react-router-dom";
import CatalogueHeader from "../../components/CatalogueHeader";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ProductSkeleton from "../../components/Loader/ProductSkeleton";
import ProductCard from "../../components/ProductCard";
import {useAuth} from "../../context/AuthContext";
import {useToast} from "../../context/ToastContext";
import api,{apiAsset,apiMessage} from "../../lib/api";
import {getCatalogueFilters,getCatalogueProducts,recordCatalogueProductView} from "../../services/catalogueService";
import {createQuotation} from "../../services/quotationService";

const valuesFrom=(params,key)=>String(params.get(key)||"").split(",").filter(Boolean);

function CheckboxGroup({label,options,selected,onToggle,getValue=item=>item,getLabel=item=>item}){
  const category=label==="Categories";
  return <fieldset className="border-t border-slate-100 px-4 py-4 first:border-t-0"><legend className="text-sm font-black text-slate-800">{label}</legend><div className={`mt-3 max-h-60 overflow-y-auto pr-1 ${category?"grid grid-cols-2 gap-2":"space-y-2.5"}`}>{options.map(item=>{const value=String(getValue(item)),active=selected.includes(value);return <label key={value} className={`flex cursor-pointer items-center gap-2 text-xs font-semibold transition ${category?`rounded-full border px-2.5 py-2 ${active?"border-teal-600 bg-teal-50 text-teal-800":"border-slate-200 text-slate-700 hover:border-teal-300"}`:"text-slate-600 hover:text-teal-700"}`}><input type="checkbox" checked={active} onChange={()=>onToggle(value)} className="size-4 shrink-0 rounded border-slate-300 accent-teal-600"/><span className="truncate">{getLabel(item)}</span></label>})}</div></fieldset>;
}

function BrandStrip({brands,selected,onSelect}){return <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{brands.map((brand)=>{const active=selected.includes(String(brand.companyName));return <button key={brand.id} type="button" onClick={()=>onSelect(String(brand.companyName))} className={`flex h-12 min-w-28 shrink-0 items-center justify-center rounded-full border bg-white px-4 transition ${active?"border-teal-600 ring-2 ring-teal-100":"border-slate-200 hover:border-teal-300"}`}>{brand.logoUrl?<img src={apiAsset(brand.logoUrl)} alt={brand.companyName} loading="lazy" decoding="async" className="max-h-7 max-w-22 object-contain"/>:<span className="text-xs font-black text-slate-600">{brand.companyName}</span>}</button>})}</div>}

function DetailsModal({product,onClose}){
  if(!product)return null;
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-4" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><article className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white"><header className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4"><div><p className="text-xs font-black uppercase text-sky-600">Product details</p><h2 className="text-xl font-black">{product.name}</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-slate-100"><FiX/></button></header><div className="grid gap-6 p-6 md:grid-cols-2"><div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">{product.image?<img src={apiAsset(product.image)} alt={product.name} className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center"><FiPackage/></div>}</div><div><p className="text-xs font-bold uppercase text-slate-400">Brand</p><p className="font-black">{product.brand}</p><p className="mt-5 text-xs font-bold uppercase text-slate-400">Listed by</p><p className="font-black">{product.sellerCompany}</p><p className="mt-5 text-xs font-bold uppercase text-slate-400">Category</p><p className="font-black">{product.category}</p></div><section className="md:col-span-2"><h3 className="font-black">Description</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{product.description}</p></section></div></article></div>;
}

function QuotationModal({product,onClose,onSuccess}){
  const [quantity,setQuantity]=useState(1);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [sending,setSending]=useState(false);
  async function submit(event){event.preventDefault();if(!Number.isInteger(Number(quantity))||Number(quantity)<1){setError("Units required must be a whole number greater than zero.");return}setSending(true);setError("");try{const {data}=await createQuotation({productId:product.id,quantity:Number(quantity),message});onSuccess(data.quotation.quotationNumber)}catch(requestError){setError(apiMessage(requestError))}finally{setSending(false)}}
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6"><div className="flex justify-between"><div><p className="text-xs font-black uppercase text-teal-700">Request Quotation</p><h2 className="text-2xl font-black">{product.name}</h2></div><button type="button" onClick={onClose}><FiX/></button></div><div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm"><p>Seller: <b>{product.sellerCompany}</b></p><p>Product ID: <b>{product.id}</b></p></div><label className="mt-5 block text-sm font-bold">Units Required<input type="number" min="1" step="1" value={quantity} onChange={event=>setQuantity(event.target.value)} className="input" required/></label><label className="mt-5 block text-sm font-bold">Additional Information<textarea rows="4" maxLength="1000" value={message} onChange={event=>setMessage(event.target.value)} className="input"/><span className="block text-right text-xs text-slate-400">{message.length}/1000</span></label>{error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-5 py-3 font-bold">Cancel</button><button disabled={sending} className="rounded-xl bg-teal-700 px-5 py-3 font-bold text-white disabled:opacity-60">{sending?"Sending...":"Send Quotation Request"}</button></div></form></div>;
}

function ReportModal({product,onClose,onSuccess}){
  const [reason,setReason]=useState(""),[error,setError]=useState(""),[sending,setSending]=useState(false);
  async function submit(event){event.preventDefault();const note=reason.trim();if(note.length<10){setError("Please describe the issue using at least 10 characters.");return}setSending(true);setError("");try{await api.post("/customer/product-reports",{productId:product.id,reason:note});onSuccess()}catch(requestError){setError(apiMessage(requestError))}finally{setSending(false)}}
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-xl text-red-600"><FiAlertTriangle/></span><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-slate-100"><FiX/></button></div><h2 className="mt-4 text-2xl font-black">Report this product</h2><p className="mt-2 text-sm text-slate-500">Tell the administrator what is wrong with <b>{product.name}</b>. Reports are reviewed before action is taken.</p><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p>Product ID: <b>{product.productCode}</b></p><p>Seller: <b>{product.sellerCompany}</b></p></div><label className="mt-5 block text-sm font-bold text-slate-700">Reason for report<textarea autoFocus required rows="5" minLength="10" maxLength="1000" value={reason} onChange={event=>setReason(event.target.value)} className="input" placeholder="Describe misleading information, an incorrect listing, prohibited content, or another concern..."/><span className="block text-right text-xs font-normal text-slate-400">{reason.length}/1000</span></label>{error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-5 py-3 font-bold">Cancel</button><button disabled={sending} className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-60">{sending?"Submitting...":"Submit Report"}</button></div></form></div>;
}

export default function Catalogue(){
  const {user}=useAuth();
  const {toast}=useToast();
  const navigate=useNavigate();
  const location=useLocation();
  const [params,setParams]=useSearchParams();
  const [products,setProducts]=useState([]);
  const [filters,setFilters]=useState({categories:[],brands:[],attributes:{}});
  const [pagination,setPagination]=useState({totalProducts:0});
  const [loading,setLoading]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [error,setError]=useState("");
  const [selected,setSelected]=useState(null);
  const [quoteProduct,setQuoteProduct]=useState(null);
  const [reportProduct,setReportProduct]=useState(null);
  const [filterOpen,setFilterOpen]=useState(false);
  const [brandSearch,setBrandSearch]=useState("");
  const search=params.get("search")||"";
  const categoryId=params.get("categoryId")||"";
  const sort=params.get("sort")||"newest";
  const selectedCategories=valuesFrom(params,"categoryId");
  const selectedBrands=valuesFrom(params,"brand").length?valuesFrom(params,"brand"):valuesFrom(params,"company");
  const visibleBrands=filters.brands.filter(item=>item.companyName.toLowerCase().includes(brandSearch.toLowerCase()));
  const query=useMemo(()=>{const next=Object.fromEntries(params.entries());delete next.page;return next},[params]);

  useEffect(()=>{let active=true;setLoading(true);getCatalogueProducts({...query,page:1,limit:12}).then(({data})=>{if(active){setProducts(data.products);setPagination(data.pagination);setError("")}}).catch(requestError=>active&&setError(apiMessage(requestError))).finally(()=>active&&setLoading(false));return()=>{active=false}},[query]);
  useEffect(()=>{getCatalogueFilters(categoryId?{categoryId}:{}).then(({data})=>setFilters(data)).catch(()=>{})},[categoryId]);

  function update(key,value){const next=new URLSearchParams(params);if(key==="brand")next.delete("company");if(value)next.set(key,value);else next.delete(key);if(key!=="page")next.delete("page");setParams(next)}
  function toggle(key,value){const current=valuesFrom(params,key);const next=current.includes(value)?current.filter(item=>item!==value):[...current,value];update(key,next.join(","))}
  function requestQuotation(product){if(!user){navigate("/login",{state:{returnTo:`${location.pathname}${location.search}`,quoteProductId:product.id}});return}if(user.role!=="Customer"){toast("Only customers can request quotations.","error");return}setQuoteProduct(product)}
  function reportProductIssue(product){if(!user){navigate("/login",{state:{returnTo:`${location.pathname}${location.search}`}});return}if(user.role!=="Customer"){toast("Only customers can report products.","error");return}setReportProduct(product)}
  function viewDetails(product){setSelected(product);if(user?.role==="Customer")recordCatalogueProductView(product.id).catch(()=>{});}
  async function loadMore(){if(loadingMore||pagination.currentPage>=pagination.totalPages)return;setLoadingMore(true);try{const {data}=await getCatalogueProducts({...query,page:pagination.currentPage+1,limit:12});setProducts(current=>[...current,...data.products]);setPagination(data.pagination)}catch(requestError){toast(apiMessage(requestError),"error")}finally{setLoadingMore(false)}}

  const cards=products.map(product=>{const attributes=Object.fromEntries(product.attributes.map(item=>[item.fieldKey,item.fieldValue]));return {id:product.id,productCode:product.productCode,name:product.productName,company:product.brand,brand:product.brand,sellerCompany:product.sellerCompany,description:product.description,availability:product.availability,category:product.categoryName,image:product.imageUrl,companyLogoUrl:product.companyLogoUrl,technology:attributes.technology||attributes.type,power:attributes.power||attributes.capacity}});

  useEffect(() => {
    const productId = location.state?.quoteProductId;
    if (!productId || user?.role !== "Customer") return;
    const product = cards.find((item) => String(item.id) === String(productId));
    if (!product) return;
    setQuoteProduct(product);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [cards, location.pathname, location.search, location.state, navigate, user]);

  return <><Navbar searchValue={search} onSearchChange={value=>update("search",value)}/><main className="min-h-screen bg-white py-6"><div className="section-shell">
    {filterOpen&&<button aria-label="Close filters" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={()=>setFilterOpen(false)}/>}
    <div className="grid items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[290px] overflow-y-auto border-r border-slate-200 bg-white shadow-xl transition-transform lg:sticky lg:top-24 lg:z-auto lg:h-[calc(100vh-7rem)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border lg:shadow-none ${filterOpen?"translate-x-0":"-translate-x-full"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4"><h2 className="font-black">Filters</h2><div className="flex items-center gap-3"><button onClick={()=>{setParams({});setBrandSearch("")}} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-600"><FiRotateCcw/>Clear All</button><button onClick={()=>setFilterOpen(false)} className="grid size-8 place-items-center rounded-full bg-slate-100 lg:hidden"><FiX/></button></div></div>
        <CheckboxGroup label="Categories" options={filters.categories} selected={selectedCategories} onToggle={value=>toggle("categoryId",value)} getValue={item=>item.id} getLabel={item=>item.name}/>
        <div className="border-t border-slate-100 px-4 pt-4"><p className="text-sm font-black text-slate-800">Brands / Companies</p><label className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-slate-400"><FiSearch/><input value={brandSearch} onChange={event=>setBrandSearch(event.target.value)} className="min-w-0 flex-1 text-xs text-slate-700 outline-none" placeholder="Search brand"/></label></div>
        <CheckboxGroup label="" options={visibleBrands} selected={selectedBrands} onToggle={value=>toggle("brand",value)} getValue={item=>item.companyName} getLabel={item=>item.companyName}/>
        {categoryId&&Object.entries(filters.attributes).map(([key,item])=><CheckboxGroup key={key} label={item.label} options={item.values} selected={valuesFrom(params,key)} onToggle={value=>toggle(key,value)}/>)}
      </aside>
      <section className="min-w-0"><CatalogueHeader count={pagination.totalProducts||0} sort={sort} onSort={value=>update("sort",value)} onOpenFilters={()=>setFilterOpen(true)}/><BrandStrip brands={filters.brands} selected={selectedBrands} onSelect={value=>toggle("brand",value)}/>{loading?<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{Array.from({length:8},(_,index)=><ProductSkeleton key={index}/>)}</div>:error?<div className="rounded-3xl bg-slate-50 p-10 text-center">{error}</div>:cards.length?<><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{cards.map(product=><ProductCard key={product.id} product={product} onDetails={viewDetails} onQuote={requestQuotation} onReport={reportProductIssue}/>)}</div>{pagination.currentPage<pagination.totalPages&&<div className="mt-8 text-center"><button type="button" onClick={loadMore} disabled={loadingMore} className="rounded-xl bg-slate-900 px-7 py-3 font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">{loadingMore?"Loading products...":"Load more products"}</button></div>}</>:<div className="grid min-h-96 place-items-center rounded-3xl bg-slate-50"><div className="text-center"><FiPackage className="mx-auto text-4xl"/><h2 className="mt-4 font-black">No products found</h2></div></div>}</section>
    </div>
  </div></main><Footer/><DetailsModal product={selected} onClose={()=>setSelected(null)}/>{quoteProduct&&<QuotationModal product={quoteProduct} onClose={()=>setQuoteProduct(null)} onSuccess={number=>{setQuoteProduct(null);toast(`Quotation ${number} sent successfully.`);navigate("/customer/quotations")}}/>}{reportProduct&&<ReportModal product={reportProduct} onClose={()=>setReportProduct(null)} onSuccess={()=>{setReportProduct(null);toast("Product report submitted to the administrator.")}}/>}</>;
}
