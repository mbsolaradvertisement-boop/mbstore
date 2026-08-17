import { useCallback, useEffect, useState } from "react";
import { FiBox, FiBriefcase, FiCheck, FiEye, FiFileText, FiFilter, FiShield, FiUsers, FiX } from "react-icons/fi";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { apiAsset, apiMessage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "./DashboardShell";

const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const rangeFor = (days) => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  return { from: isoDate(from), to: isoDate(to) };
};
const statusClass = {
  accepted: "bg-emerald-50 text-emerald-700", quoted: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700", rejected: "bg-red-50 text-red-700", declined: "bg-slate-100 text-slate-600",
};
const initials = (value = "") => value.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "—";
const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const chartColors = ["#0f766e", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

function StatCard({ label, value, icon: Icon, tone }) {
  return <article className={`rounded-2xl p-5 ${tone}`}>
    <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-3 text-3xl font-black tracking-tight">{value}</p></div><span className="grid size-11 place-items-center rounded-xl bg-white/70 text-xl"><Icon /></span></div>
    <p className="mt-5 text-xs font-semibold text-slate-500">Live platform total</p>
  </article>;
}
function SectionTitle({ children, action }) {
  return <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><h2 className="font-black">{children}</h2>{action}</div>;
}
function Empty({ children }) { return <div className="px-5 py-10 text-center text-sm text-slate-400">{children}</div>; }

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [range, setRange] = useState(() => rangeFor(30));
  const [preset, setPreset] = useState("30");
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResponse, requestsResponse] = await Promise.all([
        api.get("/admin/dashboard", { params: range }), api.get("/admin/seller-requests"),
      ]);
      setDashboard(dashboardResponse.data);
      setRequests(requestsResponse.data.requests || []);
    } catch (error) { toast(apiMessage(error), "error"); }
    finally { setLoading(false); }
  }, [range, toast]);
  useEffect(() => { load(); }, [load]);

  const choosePreset = (value) => {
    setPreset(value);
    if (value !== "custom") setRange(rangeFor(Number(value)));
  };
  const changeDate = (key, value) => {
    setPreset("custom");
    setRange((current) => ({ ...current, [key]: value }));
  };
  const act = async (id, action) => {
    try {
      await api.put(`/admin/${action}/${id}`, action === "reject" ? { reason: "Rejected by administrator" } : {});
      toast(`Seller ${action === "approve" ? "approved" : "rejected"}.`);
      await load();
    } catch (error) { toast(apiMessage(error), "error"); }
  };

  const stats = dashboard?.stats || {};
  const chartData = dashboard?.analytics || [];
  const productStatus = dashboard?.productStatus || [];
  const quotationStatus = dashboard?.quotationStatus || [];
  return <DashboardShell><div className="mx-auto max-w-[1600px]">
    <div className="relative z-20 mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-black sm:text-3xl">Welcome back, {user?.name?.split(" ")[0] || "Admin"}!</h1><p className="mt-1 text-sm text-slate-500">Here’s what’s happening across MB Store today.</p></div>
      <div className="relative">
        <button type="button" aria-label="Open analytics filters" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)} className={`relative grid size-11 place-items-center rounded-xl border text-lg shadow-sm transition ${filterOpen ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}>
          {filterOpen ? <FiX /> : <FiFilter />}
          {!filterOpen && preset !== "30" && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-teal-600" />}
        </button>
        {filterOpen && <div className="absolute right-0 top-14 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10">
          <div className="mb-4"><p className="text-sm font-black text-slate-900">Analytics filters</p><p className="mt-1 text-xs text-slate-400">Choose the period used across dashboard analytics.</p></div>
          <div className="grid grid-cols-2 gap-2">
            {[["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["180", "6 months"], ["365", "1 year"], ["custom", "Custom"]].map(([value, label]) => <button key={value} type="button" onClick={() => choosePreset(value)} className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${preset === value ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:border-teal-300"}`}>{label}</button>)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-500">From<input type="date" value={range.from} max={range.to} onChange={(event) => changeDate("from", event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-teal-600" /></label>
            <label className="text-xs font-bold text-slate-500">To<input type="date" value={range.to} min={range.from} max={isoDate(new Date())} onChange={(event) => changeDate("to", event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-teal-600" /></label>
          </div>
          <div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">{loading ? "Refreshing…" : "Filters applied"}</span><button type="button" onClick={() => setFilterOpen(false)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800">Done</button></div>
        </div>}
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard label="Total Companies" value={formatNumber(stats.totalCompanies)} icon={FiBriefcase} tone="bg-[#f9eee1]" /><StatCard label="Total Sellers" value={formatNumber(stats.totalSellers)} icon={FiUsers} tone="bg-[#eaf3e4]" /><StatCard label="Total Customers" value={formatNumber(stats.totalCustomers)} icon={FiUsers} tone="bg-[#e7eef9]" /><StatCard label="Total Products" value={formatNumber(stats.totalProducts)} icon={FiBox} tone="bg-[#e7f3f1]" /><StatCard label="Suspended Products" value={formatNumber(stats.suspendedProducts)} icon={FiShield} tone="bg-[#fce8e8]" /><StatCard label="Total Quotations" value={formatNumber(stats.totalQuotations)} icon={FiFileText} tone="bg-[#f1eafa]" />
    </div>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white"><SectionTitle action={<span className="text-xs font-semibold text-slate-400">All platform activity in the selected period</span>}><span>Platform Overview</span></SectionTitle><div className="h-[390px] p-4 sm:p-6">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 5 }}><CartesianGrid stroke="#eef0f3" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} tick={{ fill: "#94a3b8", fontSize: 12 }}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}/><Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 14 }}/><Line type="monotone" dataKey="sellers" name="New sellers" stroke={chartColors[0]} strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="customers" name="New customers" stroke={chartColors[1]} strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="products" name="New products" stroke={chartColors[2]} strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="companies" name="New companies" stroke={chartColors[3]} strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="quotations" name="Quotations" stroke={chartColors[4]} strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer> : <Empty>No platform activity in this period.</Empty>}</div></section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(310px,.8fr)]">
      <div className="grid gap-6 md:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Product Status</span></SectionTitle><div className="h-72 p-4">{productStatus.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={productStatus} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="76%" paddingAngle={3}>{productStatus.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatNumber(value)} /><Legend iconType="circle" formatter={(value) => <span className="capitalize text-xs text-slate-600">{value}</span>} /></PieChart></ResponsiveContainer> : <Empty>No product data.</Empty>}</div></section><section className="rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Quotation Outcomes</span></SectionTitle><div className="h-72 p-4">{quotationStatus.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={quotationStatus} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid stroke="#eef0f3" horizontal={false}/><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={65} axisLine={false} tickLine={false} tick={{ fontSize: 11 }}/><Tooltip formatter={(value) => formatNumber(value)} /><Bar dataKey="value" name="Quotations" radius={[0, 8, 8, 0]}>{quotationStatus.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer> : <Empty>No quotation data.</Empty>}</div></section></div>
      <section className="rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Most Sold Products</span></SectionTitle>{dashboard?.mostSoldProducts?.length ? <div className="divide-y divide-slate-100 px-5">{dashboard.mostSoldProducts.map((product) => <div key={product.id} className="flex items-center gap-3 py-4">{product.imageUrl ? <img src={apiAsset(product.imageUrl)} alt="" className="size-12 shrink-0 rounded-xl bg-slate-100 object-cover"/> : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><FiBox /></span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.productName}</p><p className="truncate text-xs text-slate-400">{product.company}</p></div><span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-right text-xs font-bold">{formatNumber(product.sales)} sales<br/><small className="font-medium text-slate-400">{formatNumber(product.unitsSold)} units</small></span></div>)}</div> : <Empty>No accepted sales in this period.</Empty>}</section>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(310px,.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Recent Quotations</span></SectionTitle><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400"><tr>{["Product", "Seller company", "Quote ID", "Date", "Status", ""].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{dashboard?.recentOrders?.length ? dashboard.recentOrders.map((order) => <tr key={order.id}><td className="px-5 py-4 font-bold">{order.product}</td><td className="px-5 py-4 text-slate-500">{order.company}</td><td className="px-5 py-4 text-slate-500">{order.quotationNumber}</td><td className="px-5 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass[order.status] || statusClass.declined}`}>{order.status}</span></td><td className="px-5 text-slate-400"><FiEye /></td></tr>) : <tr><td colSpan="6"><Empty>No quotations in this period.</Empty></td></tr>}</tbody></table></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Top Quoted Companies</span></SectionTitle>{dashboard?.topQuotedCompanies?.length ? <div className="divide-y divide-slate-100 px-5">{dashboard.topQuotedCompanies.map((company) => <div key={company.sellerId} className="flex items-center gap-3 py-4"><span className="grid size-11 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">{initials(company.company)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{company.company}</p><p className="truncate text-xs text-slate-400">{formatNumber(company.quotationCount)} quotations · {company.sellerName}</p></div></div>)}</div> : <Empty>No seller quotations in this period.</Empty>}</section>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(310px,.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Pending Seller Approvals</span></SectionTitle><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400"><tr>{["Seller", "Business", "GST", "Joined", "Actions"].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading && !dashboard ? <tr><td colSpan="5"><Empty>Loading approvals…</Empty></td></tr> : requests.length === 0 ? <tr><td colSpan="5"><Empty>No pending seller approvals.</Empty></td></tr> : requests.slice(0, 5).map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-bold">{item.name}</p><p className="text-xs text-slate-400">{item.email}</p></td><td className="px-5 py-4 text-slate-500">{item.businessName}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{item.gstNumber}</td><td className="px-5 py-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString("en-IN")}</td><td className="px-5 py-4"><div className="flex gap-2"><button title="Approve" onClick={() => act(item.id, "approve")} className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><FiCheck /></button><button title="Reject" onClick={() => act(item.id, "reject")} className="grid size-8 place-items-center rounded-lg bg-red-50 font-bold text-red-700">×</button></div></td></tr>)}</tbody></table></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white"><SectionTitle><span>Recent Sellers This Month</span></SectionTitle>{dashboard?.recentSellers?.length ? <div className="divide-y divide-slate-100 px-5">{dashboard.recentSellers.map((seller) => <div key={seller.id} className="flex items-center gap-3 py-4"><span className="grid size-11 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">{initials(seller.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{seller.name}</p><p className="truncate text-xs text-slate-400">{seller.businessName}</p></div><span className="text-xs text-slate-400">{new Date(seller.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span></div>)}</div> : <Empty>No sellers joined this month.</Empty>}</section>
    </div>
  </div></DashboardShell>;
}
