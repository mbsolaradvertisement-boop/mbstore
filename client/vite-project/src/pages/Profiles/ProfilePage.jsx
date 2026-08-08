import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiEdit2, FiSave, FiX } from "react-icons/fi";
import api, { apiMessage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import CustomerLayout from "../../layout/customer/CustomerLayout";

const customerSections = [["Personal Information",[["customerId","Customer ID",true],["customerName","Customer Name"],["email","Email"],["phoneNumber","Phone Number"]]],["Address Information",[["address","Address"],["state","State"],["district","District"],["area","Area"],["landmark","Landmark"]]]];
const sellerSections = [["Personal Information",[["sellerId","Seller ID",true],["sellerName","Seller Name"],["email","Email"],["phoneNumber","Phone Number"]]],["Business Information",[["companyName","Company Name"],["businessEmail","Business Email"],["gst","GST"],["website","Website (optional)"]],],["Address Information",[["address","Address"],["state","State"],["district","District"],["area","Area"],["landmark","Landmark"]]]];
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/, phonePattern=/^[6-9]\d{9}$/, gstPattern=/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

function validateField(key, rawValue) {
  const value=String(rawValue||"").trim();
  if(key==="website") { if(!value)return ""; try { const url=new URL(value); return /^https?:$/.test(url.protocol)?"":"Website must start with http:// or https://."; } catch { return "Enter a valid website URL including http:// or https://."; } }
  if(!value)return "This field is required.";
  if(key==="customerName"||key==="sellerName")return value.length<2?"Name must contain at least 2 characters.":value.length>120?"Name cannot exceed 120 characters.":"";
  if(key==="email"||key==="businessEmail")return emailPattern.test(value)?"":"Enter a valid email address.";
  if(key==="phoneNumber")return phonePattern.test(value)?"":"Enter a valid 10-digit Indian mobile number.";
  if(key==="gst")return gstPattern.test(value.toUpperCase())?"":"Enter a valid 15-character Indian GST number.";
  const maximum=key==="address"?255:160;
  if(value.length<2)return "Enter at least 2 characters.";
  if(value.length>maximum)return `Cannot exceed ${maximum} characters.`;
  return "";
}

export function ProfileContent({ role }) {
  const lower=role.toLowerCase(), sections=role==="Seller"?sellerSections:customerSections, {toast}=useToast();
  const [profile,setProfile]=useState(null), [form,setForm]=useState({}), [editing,setEditing]=useState(false), [saving,setSaving]=useState(false), [fieldErrors,setFieldErrors]=useState({}), [touched,setTouched]=useState({});
  const load=useCallback(()=>api.get(`/${lower}/profile`).then(({data})=>{setProfile(data.profile);setForm(data.profile)}).catch(error=>toast(apiMessage(error),"error")),[lower,toast]);
  useEffect(()=>{load()},[load]);
  const missing=useMemo(()=>new Set(profile?.missingFields||[]),[profile]);
  const validate=(key,value)=>{const message=validateField(key,value);setFieldErrors(current=>({...current,[key]:message}));return !message;};
  const changeField=(key,value)=>{const normalized=key==="gst"?value.toUpperCase():value;setForm(current=>({...current,[key]:normalized}));setTouched(current=>({...current,[key]:true}));validate(key,normalized);};
  const blurField=(key)=>{setTouched(current=>({...current,[key]:true}));validate(key,form[key]);};
  const startEditing=()=>{setForm(profile);setFieldErrors({});setTouched({});setEditing(true)};
  const cancel=()=>{setEditing(false);setForm(profile);setFieldErrors({});setTouched({})};
  const save=async()=>{const editable=sections.flatMap(([,fields])=>fields).filter(([, ,readOnly])=>!readOnly).map(([key])=>key);const errors={};for(const key of editable){const message=validateField(key,form[key]);if(message)errors[key]=message}setFieldErrors(errors);setTouched(Object.fromEntries(editable.map(key=>[key,true])));if(Object.keys(errors).length){toast("Please correct the highlighted fields.","error");return}setSaving(true);try{const {data}=await api.put(`/${lower}/profile`,form);setProfile(data.profile);setForm(data.profile);setEditing(false);setFieldErrors({});setTouched({});window.dispatchEvent(new CustomEvent(`mb:${lower}-profile-updated`,{detail:data.profile}));toast(data.message)}catch(error){toast(apiMessage(error),"error")}finally{setSaving(false)}};
  if(!profile)return <div className="space-y-4">{[1,2,3].map(x=><div key={x} className="h-36 animate-pulse rounded-2xl bg-slate-200"/>)}</div>;
  return <div className="mx-auto max-w-5xl space-y-6"><section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-300">{role} profile</p><h1 className="mt-2 text-3xl font-black">Profile Completion</h1><p className="mt-2 text-sm text-slate-300">Keep your details accurate and up to date.</p></div><strong className="text-4xl text-teal-300">{profile.profileCompletion}%</strong></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-teal-400" style={{width:`${profile.profileCompletion}%`}}/></div>{role==="Seller"&&<p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><FiCheckCircle/>Status: {profile.verificationStatus}</p>}</section>
  {sections.map(([title,fields])=><section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">{title}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{fields.map(([key,label,readOnly])=>{const error=touched[key]&&fieldErrors[key];return <label key={key} className="text-sm font-bold text-slate-600">{label}{editing&&!readOnly?<><input value={form[key]||""} onChange={event=>changeField(key,event.target.value)} onBlur={()=>blurField(key)} aria-invalid={Boolean(error)} aria-describedby={error?`${key}-error`:undefined} className={`mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none transition focus:ring-4 ${error?"border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-100":missing.has(key)?"border-amber-300 bg-amber-50/40 focus:border-teal-600 focus:ring-teal-100":"border-slate-200 focus:border-teal-600 focus:ring-teal-100"}`}/>{error&&<span id={`${key}-error`} className="mt-1.5 block text-xs font-semibold text-red-600">{error}</span>}</>:<p className="mt-2 min-h-6 font-semibold text-slate-900">{profile[key]||<span className="font-normal text-slate-400">Not provided</span>}</p>}</label>})}</div></section>)}
  <div className="flex justify-end gap-3">{editing?<><button onClick={cancel} className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold"><FiX/>Cancel</button><button disabled={saving||Object.values(fieldErrors).some(Boolean)} onClick={save} className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><FiSave/>{saving?"Saving...":"Save Changes"}</button></>:<button onClick={startEditing} className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white"><FiEdit2/>Edit Profile</button>}</div></div>;
}
export function CustomerProfilePage(){return <CustomerLayout title="Profile"><ProfileContent role="Customer"/></CustomerLayout>}
export function SellerProfilePage(){return <ProfileContent role="Seller"/>}
