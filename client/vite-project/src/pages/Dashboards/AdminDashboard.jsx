import { useCallback, useEffect, useState } from "react";
import api, { apiMessage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import DashboardShell from "./DashboardShell";

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]); const [loading, setLoading] = useState(true); const { toast } = useToast();
  const load = useCallback(async () => { try { const { data } = await api.get("/admin/seller-requests"); setRequests(data.requests); } catch (error) { toast(apiMessage(error), "error"); } finally { setLoading(false); } }, [toast]);
  useEffect(() => { load(); }, [load]);
  const act = async (id, action) => { try { await api.put(`/admin/${action}/${id}`, action === "reject" ? { reason: "Rejected by administrator" } : {}); setRequests((items) => items.filter((item) => item.id !== id)); toast(`Seller ${action}d.`); } catch (error) { toast(apiMessage(error), "error"); } };
  return <DashboardShell eyebrow="Administration" title="Seller Verification"><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-220 text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Seller", "Email", "Business", "GST", "Created", "Actions"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading requests…</td></tr> : requests.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">No pending seller requests.</td></tr> : requests.map((item) => <tr key={item.id}><td className="px-5 py-4 font-bold">{item.name}</td><td className="px-5 py-4">{item.email}</td><td className="px-5 py-4">{item.businessName}</td><td className="px-5 py-4 font-mono text-sm">{item.gstNumber}</td><td className="px-5 py-4">{new Date(item.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => act(item.id, "approve")} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white">Approve</button><button onClick={() => act(item.id, "reject")} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Reject</button></div></td></tr>)}</tbody></table></div></DashboardShell>;
}
