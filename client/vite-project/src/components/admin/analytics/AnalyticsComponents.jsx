import { FiFilter, FiRefreshCw } from "react-icons/fi";

export function AnalyticsKpiCard({ label, value, note, icon: Icon, tone = "bg-teal-50 text-teal-700" }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>{Icon && <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon /></span>}</div></article>;
}

export function ChartPanel({ title, subtitle, children, className = "" }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}</div>{children}</section>;
}

export function AnalyticsTable({ columns, rows, empty = "No data available for the selected filters." }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr>{columns.map((column) => <th key={column.key} className={`px-4 py-3 font-bold ${column.align === "right" ? "text-right" : ""}`}>{column.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, index) => <tr key={row.id || row.productId || row.sellerId || row.customerUserId || row.companyId || `${index}-${Object.values(row)[0]}`} className="hover:bg-slate-50">{columns.map((column) => <td key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right font-semibold" : ""}`}>{column.render ? column.render(row, index) : row[column.key]}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">{empty}</td></tr>}</tbody></table></div>;
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500">{label}{children}</label>; }
const control = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-teal-600";

export function AnalyticsFilters({ draft, setDraft, options, onApply, onReset, loading }) {
  const change = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }));
  const districts = draft.state ? options.districts.filter((item) => item.state === draft.state) : options.districts;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><FiFilter className="text-teal-700"/><div><h2 className="font-black">Analytics Filters</h2><p className="text-xs text-slate-400">Filters are combined and calculated by the server.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
    <Field label="Date period"><select value={draft.period} onChange={change("period")} className={control}><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last_7_days">Last 7 Days</option><option value="last_30_days">Last 30 Days</option><option value="this_month">This Month</option><option value="last_month">Last Month</option><option value="this_year">This Year</option><option value="custom">Custom Date</option></select></Field>
    {draft.period === "custom" && <><Field label="From Date"><input type="date" value={draft.startDate} max={draft.endDate || undefined} onChange={change("startDate")} className={control}/></Field><Field label="To Date"><input type="date" value={draft.endDate} min={draft.startDate || undefined} onChange={change("endDate")} className={control}/></Field></>}
    <Field label="Grouping"><select value={draft.grouping} onChange={change("grouping")} className={control}><option value="">Automatic</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></Field>
    <Field label="Seller"><select value={draft.sellerId} onChange={change("sellerId")} className={control}><option value="">All sellers</option>{options.sellers.map((item) => <option key={item.id} value={item.id}>{item.sellerCompany}</option>)}</select></Field>
    <Field label="Company"><select value={draft.companyId} onChange={change("companyId")} className={control}><option value="">All companies</option>{options.companies.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}</select></Field>
    <Field label="Category"><select value={draft.categoryId} onChange={change("categoryId")} className={control}><option value="">All categories</option>{options.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Brand"><select value={draft.brand} onChange={change("brand")} className={control}><option value="">All brands</option>{options.brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
    <Field label="Product"><select value={draft.productId} onChange={change("productId")} className={control}><option value="">All products</option>{options.products.map((item) => <option key={item.id} value={item.id}>{item.productName}</option>)}</select></Field>
    <Field label="State"><select value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value, district: "" }))} className={control}><option value="">All states</option>{options.states.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
    <Field label="District"><select value={draft.district} onChange={change("district")} className={control}><option value="">All districts</option>{districts.map((item) => <option key={`${item.state}-${item.district}`} value={item.district}>{item.district}</option>)}</select></Field>
  </div><div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={onReset} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"><FiRefreshCw/>Reset</button><button type="button" onClick={onApply} disabled={loading} className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Loading..." : "Apply Filters"}</button></div></section>;
}

export function AnalyticsSkeleton() { return <div className="space-y-5">{["h-32","h-96","h-72","h-72"].map((height, index) => <div key={index} className={`${height} animate-pulse rounded-2xl bg-slate-200`} />)}</div>; }
export function EmptyChart({ text }) { return <div className="grid h-full place-items-center px-5 text-center text-sm text-slate-400">{text}</div>; }
