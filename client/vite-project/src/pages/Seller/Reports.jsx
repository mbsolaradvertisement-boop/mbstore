import { useCallback, useEffect, useMemo, useState } from "react";
import { FiActivity, FiCalendar, FiCheck, FiDownload, FiFileText, FiRefreshCw, FiRotateCcw, FiX } from "react-icons/fi";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useToast } from "../../context/ToastContext";
import { apiMessage } from "../../lib/api";
import { downloadSellerReportPdf, getSellerReport } from "../../services/reportService";

const card = "rounded-[20px] border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,.04)]";
const colors = ["#0f766e", "#14b8a6", "#5eead4", "#94a3b8", "#6366f1", "#38bdf8", "#f59e0b", "#f472b6"];
const emptyReport = { monthlyLeads: [], leadConversion: [], mostEnquiredProducts: [], customerLocations: [] };

const iso = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
function rangeForMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return { from: `${value}-01`, to: iso(new Date(year, month, 0)) };
}
function currentRange() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  return { month, ...rangeForMonth(month), groupBy: "brand" };
}

export default function SellerReports() {
  const { toast } = useToast();
  const initial = useMemo(currentRange, []);
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDraft, setExportDraft] = useState(initial);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await getSellerReport({ from: filters.from, to: filters.to, groupBy: filters.groupBy });
      setReport(data);
      setUpdatedAt(data.generatedAt);
    } catch (requestError) {
      setError("Unable to load report data.");
      toast(apiMessage(requestError), "error");
    } finally { setLoading(false); }
  }, [filters, toast]);
  useEffect(() => { load(); }, [load]);

  function chooseMonth(value) {
    setDraft((current) => ({ ...current, month: value, ...(value ? rangeForMonth(value) : {}) }));
  }
  function apply() {
    if (!draft.from || !draft.to || draft.from > draft.to) { toast("Select a valid From and To date.", "error"); return; }
    setFilters({ ...draft });
  }
  function clear() { const next=currentRange(); setDraft(next); setFilters(next); }
  function changeGrouping(value) { setDraft(current=>({...current,groupBy:value})); setFilters(current=>({...current,groupBy:value})); }

  function openExport(){setExportDraft({...filters});setExportOpen(true)}
  async function generatePdf(){
    if(!exportDraft.from||!exportDraft.to||exportDraft.from>exportDraft.to){toast("Select a valid report period.","error");return}
    setGenerating(true);
    try{
      if(exportDraft.from!==filters.from||exportDraft.to!==filters.to){const next={...exportDraft};const {data}=await getSellerReport({from:next.from,to:next.to,groupBy:next.groupBy});setReport(data);setUpdatedAt(data.generatedAt);setDraft(next);setFilters(next)}
      const response=await downloadSellerReportPdf({from:exportDraft.from,to:exportDraft.to,groupBy:exportDraft.groupBy});
      const url=URL.createObjectURL(response.data),link=document.createElement("a");link.href=url;link.download=`MBStore_Seller_Report_${exportDraft.from}_to_${exportDraft.to}.pdf`;link.click();URL.revokeObjectURL(url);setExportOpen(false);toast("Business report generated successfully.");
    }catch{toast("Unable to generate report. Please try again.","error")}finally{setGenerating(false)}
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-black tracking-tight text-slate-900">Reports</h1><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500"/>Live data</span></div><p className="mt-1 text-sm text-slate-500">Understand your business performance, customer demand and lead conversion.</p>{updatedAt&&<p className="mt-1 text-xs text-slate-400">Last updated: {new Date(updatedAt).toLocaleString("en-IN")}</p>}</div><button disabled={loading||error} onClick={openExport} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"><FiDownload/>Export Report</button></div>
    <section className={`${card} mb-6 overflow-hidden bg-gradient-to-r from-white via-white to-teal-50/40`}>
      <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-end">
        <div className="flex min-w-52 items-center gap-3 xl:pb-1">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-lg text-teal-700 ring-1 ring-teal-100"><FiCalendar/></span>
          <div><h2 className="text-sm font-black text-slate-900">Report period</h2><p className="mt-0.5 text-xs text-slate-400">Filter all analytics together</p></div>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterDate label="Month"><input type="month" value={draft.month} onChange={e=>chooseMonth(e.target.value)} className="h-11 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"/></FilterDate>
          <FilterDate label="From"><input type="date" value={draft.from} onChange={e=>setDraft({...draft,month:"",from:e.target.value})} className="h-11 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"/></FilterDate>
          <FilterDate label="To"><input type="date" value={draft.to} onChange={e=>setDraft({...draft,month:"",to:e.target.value})} className="h-11 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"/></FilterDate>
        </div>
        <div className="flex flex-wrap gap-3 sm:self-end">
          <button onClick={apply} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-md sm:flex-none"><FiCheck/>Apply</button>
          <button onClick={clear} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-none"><FiRotateCcw/>Clear</button>
          <button disabled={loading} onClick={load} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50 sm:flex-none"><FiRefreshCw className={loading?"animate-spin":""}/>Refresh</button>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2 text-[11px] font-semibold text-slate-400">Currently showing <span className="text-slate-600">{filters.from}</span> to <span className="text-slate-600">{filters.to}</span></div>
    </section>
    {error&&<div className="mb-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"><span>{error}</span><button onClick={load} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2"><FiRefreshCw/>Retry</button></div>}
    {!loading&&!error&&report.overview&&<div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{[["Total Leads",report.overview.totalLeads],["Enquiries",report.overview.totalEnquiries],["Quotations",report.overview.totalQuotations],["Converted",report.overview.convertedLeads],["Active Products",report.overview.activeProducts],["Conversion Rate",`${report.overview.conversionRate}%`]].map(([label,value])=><article key={label} className={`${card} p-4`}><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><strong className="mt-2 block text-2xl text-slate-900">{value}</strong></article>)}</div>}
    <div className="grid gap-6 lg:grid-cols-2">
      <ReportCard title="Monthly Leads" loading={loading} empty={!report.monthlyLeads.length} emptyText="No leads found for this period."><ResponsiveContainer><AreaChart data={report.monthlyLeads}><defs><linearGradient id="reportLeads" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#14b8a6" stopOpacity=".25"/><stop offset="1" stopColor="#14b8a6" stopOpacity=".05"/></linearGradient></defs><CartesianGrid stroke="#eef2f7" vertical={false}/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip formatter={value=>[value,"Leads"]}/><Area type="monotone" dataKey="value" stroke="#0f766e" fill="url(#reportLeads)" strokeWidth={2}/></AreaChart></ResponsiveContainer></ReportCard>
      <ReportCard title="Lead Conversion" loading={loading} empty={!report.leadConversion.length} emptyText="No conversion data for this period."><ResponsiveContainer><BarChart data={report.leadConversion}><CartesianGrid stroke="#eef2f7" vertical={false}/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip formatter={value=>[value,"Converted Leads"]}/><Bar dataKey="value" radius={[6,6,0,0]}>{report.leadConversion.map((_,i)=><Cell key={i} fill={colors[i%4]}/>)}</Bar></BarChart></ResponsiveContainer></ReportCard>
      <ReportCard title="Most Enquired Products" loading={loading} empty={!report.mostEnquiredProducts.length} emptyText="No product enquiries found." action={<select value={filters.groupBy} onChange={e=>changeGrouping(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"><option value="brand">By Brand</option><option value="product">By Product</option></select>}><ResponsiveContainer><BarChart data={report.mostEnquiredProducts} layout="vertical" margin={{left:20}}><CartesianGrid stroke="#eef2f7" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis dataKey="name" type="category" width={110} tick={{fontSize:11}}/><Tooltip formatter={value=>[value,"Enquiries"]}/><Bar dataKey="value" radius={[0,6,6,0]}>{report.mostEnquiredProducts.map((_,i)=><Cell key={i} fill={colors[i%4]}/>)}</Bar></BarChart></ResponsiveContainer></ReportCard>
      <ReportCard title="Customer Locations" loading={loading} empty={!report.customerLocations.length} emptyText="No customer location data available."><ResponsiveContainer><PieChart><Pie data={report.customerLocations} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={1}>{report.customerLocations.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={value=>[value,"Enquiries"]}/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer></ReportCard>
    </div>
    {!loading&&!error&&<div className="mt-6 grid gap-6 lg:grid-cols-2"><section className={`${card} p-5`}><div className="flex items-center gap-2"><FiActivity className="text-teal-700"/><h2 className="font-black">Business Insights</h2></div><div className="mt-4 space-y-3">{report.insights?.map(item=><p key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{item}</p>)}</div></section><section className={`${card} p-5`}><h2 className="font-black">Period Comparison</h2>{report.comparison?.available?<div className="mt-4 grid grid-cols-2 gap-3">{[["Leads",report.comparison.leads],["Conversions",report.comparison.conversions]].map(([label,item])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><b className="mt-1 block text-xl">{item.current}</b><span className={`text-xs font-bold ${item.changePercent>=0?"text-emerald-600":"text-red-600"}`}>{item.changePercent>=0?"↑":"↓"} {Math.abs(item.changePercent)}% from previous period</span></div>)}</div>:<p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No previous-period data available.</p>}</section></div>}
    {exportOpen&&<ExportModal value={exportDraft} setValue={setExportDraft} generating={generating} onClose={()=>!generating&&setExportOpen(false)} onGenerate={generatePdf}/>} 
  </>;
}

function ReportCard({title,loading,empty,emptyText,action,children}) {
  return <section className={`${card} p-5`}><div className="flex items-center justify-between gap-3"><h2 className="font-black">{title}</h2>{action}</div><div className="mt-5 h-64">{loading?<div className="h-full animate-pulse rounded-2xl bg-slate-100"/>:empty?<div className="grid h-full place-items-center text-center text-sm font-bold text-slate-400">{emptyText}</div>:children}</div></section>;
}

function FilterDate({label,children}) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span><span className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-teal-500 focus-within:ring-3 focus-within:ring-teal-100">{children}</span></label>;
}

function ExportModal({value,setValue,generating,onClose,onGenerate}){
  function month(valueText){setValue(current=>({...current,month:valueText,...(valueText?rangeForMonth(valueText):{})}))}
  return <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><article className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-xl text-teal-700"><FiFileText/></span><h2 className="mt-4 text-2xl font-black">Generate Business Report</h2><p className="mt-1 text-sm leading-6 text-slate-500">Create a professional PDF from your current business analytics.</p></div><button disabled={generating} onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-slate-100"><FiX/></button></div><div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Report period</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><FilterDate label="Month"><input type="month" value={value.month} onChange={e=>month(e.target.value)} className="h-11 w-full bg-transparent text-sm font-semibold outline-none"/></FilterDate><div/><FilterDate label="From"><input type="date" value={value.from} onChange={e=>setValue({...value,month:"",from:e.target.value})} className="h-11 w-full bg-transparent text-sm font-semibold outline-none"/></FilterDate><FilterDate label="To"><input type="date" value={value.to} onChange={e=>setValue({...value,month:"",to:e.target.value})} className="h-11 w-full bg-transparent text-sm font-semibold outline-none"/></FilterDate></div></div><div className="mt-5"><h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Included in PDF</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{["Lead Analytics","Conversion Performance","Product Demand","Customer Locations","Enquiry Summary","Business Insights"].map(item=><span key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><FiCheck className="text-teal-600"/>{item}</span>)}</div></div><div className="mt-7 flex justify-end gap-3"><button disabled={generating} onClick={onClose} className="rounded-xl border px-5 py-3 font-bold">Cancel</button><button disabled={generating} onClick={onGenerate} className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white disabled:opacity-60">{generating?<><FiRefreshCw className="animate-spin"/>Generating Report...</>:<><FiDownload/>Generate PDF</>}</button></div></article></div>
}
