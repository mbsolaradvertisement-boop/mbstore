import {useEffect,useMemo,useState} from "react";
import {FiPackage,FiRotateCcw,FiX} from "react-icons/fi";
import {useLocation,useNavigate,useSearchParams} from "react-router-dom";
import CatalogueHeader from "../../components/CatalogueHeader";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ProductSkeleton from "../../components/Loader/ProductSkeleton";
import ProductCard from "../../components/ProductCard";
import {useAuth} from "../../context/AuthContext";
import {useToast} from "../../context/ToastContext";
import {apiAsset,apiMessage} from "../../lib/api";
import {getCatalogueFilters,getCatalogueProducts} from "../../services/catalogueService";
import {createQuotation} from "../../services/quotationService";

const valuesFrom=(params,key)=>String(params.get(key)||"").split(",").filter(Boolean);

function CheckboxGroup({label,options,selected,onToggle,getValue=item=>item,getLabel=item=>item}){
  return <fieldset className="mt-5 border-t border-slate-100 pt-4"><legend className="text-sm font-black text-slate-800">{label}</legend><div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">{options.map(item=>{const value=String(getValue(item));return <label key={value} className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600 hover:text-sky-700"><input type="checkbox" checked={selected.includes(value)} onChange={()=>onToggle(value)} className="size-4 rounded accent-sky-600"/><span>{getLabel(item)}</span></label>})}</div></fieldset>;
}

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
  const [error,setError]=useState("");
  const [selected,setSelected]=useState(null);
  const [quoteProduct,setQuoteProduct]=useState(null);
  const search=params.get("search")||"";
  const categoryId=params.get("categoryId")||"";
  const sort=params.get("sort")||"newest";
  const selectedCategories=valuesFrom(params,"categoryId");
  const selectedBrands=valuesFrom(params,"brand").length?valuesFrom(params,"brand"):valuesFrom(params,"company");
  const query=useMemo(()=>Object.fromEntries(params.entries()),[params]);

  useEffect(()=>{let active=true;setLoading(true);getCatalogueProducts({...query,limit:20}).then(({data})=>{if(active){setProducts(data.products);setPagination(data.pagination);setError("")}}).catch(requestError=>active&&setError(apiMessage(requestError))).finally(()=>active&&setLoading(false));return()=>{active=false}},[query]);
  useEffect(()=>{getCatalogueFilters(categoryId?{categoryId}:{}).then(({data})=>setFilters(data)).catch(()=>{})},[categoryId]);

  function update(key,value){const next=new URLSearchParams(params);if(key==="brand")next.delete("company");if(value)next.set(key,value);else next.delete(key);if(key!=="page")next.delete("page");setParams(next)}
  function toggle(key,value){const current=valuesFrom(params,key);const next=current.includes(value)?current.filter(item=>item!==value):[...current,value];update(key,next.join(","))}
  function requestQuotation(product){if(!user){navigate("/login",{state:{returnTo:`${location.pathname}${location.search}`,quoteProductId:product.id}});return}if(user.role!=="Customer"){toast("Only customers can request quotations.","error");return}setQuoteProduct(product)}

  const cards=products.map(product=>{const attributes=Object.fromEntries(product.attributes.map(item=>[item.fieldKey,item.fieldValue]));return {id:product.id,name:product.productName,company:product.brand,brand:product.brand,sellerCompany:product.sellerCompany,description:product.description,availability:product.availability,category:product.categoryName,image:product.imageUrl,companyLogoUrl:product.companyLogoUrl,technology:attributes.technology||attributes.type,power:attributes.power||attributes.capacity}});

  useEffect(() => {
    const productId = location.state?.quoteProductId;
    if (!productId || user?.role !== "Customer") return;
    const product = cards.find((item) => String(item.id) === String(productId));
    if (!product) return;
    setQuoteProduct(product);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [cards, location.pathname, location.search, location.state, navigate, user]);

  return <><Navbar searchValue={search} onSearchChange={value=>update("search",value)}/><main className="bg-slate-50 py-10"><div className="section-shell"><CatalogueHeader count={pagination.totalProducts||0} sort={sort} onSort={value=>update("sort",value)} onOpenFilters={()=>{}}/><div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)]"><aside className="h-fit rounded-2xl border bg-white p-5"><div className="flex justify-between"><h2 className="font-black">Filters</h2><button onClick={()=>setParams({})} className="flex items-center gap-1 text-xs font-bold text-red-600"><FiRotateCcw/>Reset</button></div><CheckboxGroup label="Categories" options={filters.categories} selected={selectedCategories} onToggle={value=>toggle("categoryId",value)} getValue={item=>item.id} getLabel={item=>item.name}/><CheckboxGroup label="Brands / Companies" options={filters.brands} selected={selectedBrands} onToggle={value=>toggle("brand",value)} getValue={item=>item.companyName} getLabel={item=>item.companyName}/>{categoryId&&Object.entries(filters.attributes).map(([key,item])=><CheckboxGroup key={key} label={item.label} options={item.values} selected={valuesFrom(params,key)} onToggle={value=>toggle(key,value)}/>)}</aside><section>{loading?<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{Array.from({length:8},(_,index)=><ProductSkeleton key={index}/>)}</div>:error?<div className="rounded-3xl bg-white p-10 text-center">{error}</div>:cards.length?<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{cards.map(product=><ProductCard key={product.id} product={product} onDetails={setSelected} onQuote={requestQuotation}/>)}</div>:<div className="grid min-h-96 place-items-center rounded-3xl bg-white"><div className="text-center"><FiPackage className="mx-auto text-4xl"/><h2 className="mt-4 font-black">No products found</h2></div></div>}</section></div></div></main><Footer/><DetailsModal product={selected} onClose={()=>setSelected(null)}/>{quoteProduct&&<QuotationModal product={quoteProduct} onClose={()=>setQuoteProduct(null)} onSuccess={number=>{setQuoteProduct(null);toast(`Quotation ${number} sent successfully.`);navigate("/customer/quotations")}}/>}</>;
}
