import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiX, FiXCircle } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";
import { apiMessage } from "../../lib/api";
import { getSellerQuotations, rejectQuotation, respondToQuotation } from "../../services/quotationService";

const statusTone = {
  pending: "bg-amber-50 text-amber-700",
  quoted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function SellerQuotations() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ pricePerUnit: "", deliveryTime: "", message: "", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getSellerQuotations();
      setRows(data.data);
      setStats(data.stats);
    } catch (error) {
      toast(apiMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (action === "respond") await respondToQuotation(selected.id, form);
      else await rejectQuotation(selected.id, form.reason);
      toast(action === "respond" ? "Quotation sent successfully." : "Request rejected.");
      setAction(null);
      setSelected(null);
      await load();
    } catch (error) {
      toast(apiMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  const currentWeek = Number(stats.recentEnquiries || 0);
  const previousWeek = Number(stats.lastWeekEnquiries || 0);
  const trend = previousWeek > 0
    ? Math.round(((currentWeek - previousWeek) / previousWeek) * 100)
    : currentWeek > 0 ? 100 : 0;
  const recentValue = <span className="mt-1 flex items-end justify-between gap-3"><span><b className="block text-3xl">{currentWeek}</b><small className="text-xs font-medium text-slate-400">This week</small></span><span className="text-right"><b className="block text-lg">{previousWeek}</b><small className="text-xs font-medium text-slate-400">Past week</small><em className={`mt-1 block text-[10px] not-italic ${trend>=0?"text-emerald-600":"text-red-600"}`}>{trend>=0?"↑":"↓"} {Math.abs(trend)}%</em></span></span>;

  const summaryCards = [
    ["Total Quotations", stats.totalQuotations || 0, FiFileText, "bg-violet-50 text-violet-700"],
    ["Recent Enquiries", recentValue, FiClock, "bg-blue-50 text-blue-700"],
    ["Approved Quotations", stats.approvedQuotations || 0, FiCheckCircle, "bg-emerald-50 text-emerald-700"],
    ["Rejected Quotations", stats.rejectedQuotations || 0, FiXCircle, "bg-red-50 text-red-700"],
  ];

  return <section><p className="text-xs font-black uppercase text-violet-700">Customer requests</p><h1 className="text-3xl font-black">Quotations</h1><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summaryCards.map(([label,value,Icon,tone])=><article key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon/></span><p className="mt-3 text-sm text-slate-500">{label}</p><strong className="text-3xl">{value}</strong></article>)}</div>{loading?<div className="mt-6 h-72 animate-pulse rounded-2xl bg-slate-200"/>:<QuotationTable rows={rows} onView={setSelected}/>} {selected&&<Details quotation={selected} onClose={()=>setSelected(null)} onAction={setAction}/>} {action&&<ActionModal action={action} form={form} setForm={setForm} busy={busy} onCancel={()=>setAction(null)} onSubmit={submit}/>}</section>;
}

function QuotationTable({ rows, onView }) {
  if (!rows.length) return <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed bg-white"><p className="font-bold">No quotation requests</p></div>;
  const headings=["Quotation","Customer","Mobile","Product","Quantity","Requested","Status","Action"];
  return <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-250 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr>{headings.map(item=><th key={item} className="px-5 py-4">{item}</th>)}</tr></thead><tbody className="divide-y">{rows.map(row=><tr key={row.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs">{row.quotation_number}</td><td className="px-5 py-4 font-bold">{row.customerName}</td><td className="px-5 py-4">{row.customer_phone||"Not provided"}</td><td className="px-5 py-4">{row.product_name_snapshot}</td><td className="px-5 py-4">{row.quantity}</td><td className="px-5 py-4">{new Date(row.created_at).toLocaleDateString()}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${statusTone[row.status]}`}>{row.status}</span></td><td className="px-5 py-4"><button onClick={()=>onView(row)} className="rounded-xl border px-4 py-2 font-bold">View</button></td></tr>)}</tbody></table></div></div>;
}

function Details({quotation,onClose,onAction}) {
  const details=[["Customer",quotation.customerName],["Mobile",quotation.customer_phone||"Not provided"],["Product",quotation.product_name_snapshot],["Brand",quotation.brand_snapshot],["Category",quotation.categoryName],["Quantity",`${quotation.quantity} units`],["Status",quotation.status]];
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4"><article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6"><div className="flex justify-between"><h2 className="text-2xl font-black">{quotation.quotation_number}</h2><button onClick={onClose}><FiX/></button></div><dl className="mt-5 grid gap-3 sm:grid-cols-2">{details.map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-400">{label}</dt><dd className="font-bold capitalize">{value}</dd></div>)}</dl><p className="mt-4 rounded-xl border p-4">{quotation.customer_message||"No additional information."}</p>{quotation.status==="pending"&&<div className="mt-6 flex justify-end gap-3"><button onClick={()=>onAction("reject")} className="rounded-xl border px-5 py-3 font-bold text-red-700">Reject</button><button onClick={()=>onAction("respond")} className="rounded-xl bg-teal-700 px-5 py-3 font-bold text-white">Send Quotation</button></div>}</article></div>;
}

function ActionModal({action,form,setForm,busy,onCancel,onSubmit}) {
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-3xl bg-white p-6"><h2 className="text-2xl font-black">{action==="respond"?"Send Quotation":"Reject Request"}</h2>{action==="respond"?<><label className="mt-5 block font-bold">Price Per Unit<input type="number" min="0.01" step="0.01" required value={form.pricePerUnit} onChange={event=>setForm({...form,pricePerUnit:event.target.value})} className="input"/></label><label className="mt-4 block font-bold">Delivery Time<input required maxLength="160" value={form.deliveryTime} onChange={event=>setForm({...form,deliveryTime:event.target.value})} className="input"/></label><label className="mt-4 block font-bold">Message<textarea maxLength="1000" value={form.message} onChange={event=>setForm({...form,message:event.target.value})} className="input"/></label></>:<label className="mt-5 block font-bold">Reason<textarea required maxLength="1000" value={form.reason} onChange={event=>setForm({...form,reason:event.target.value})} className="input"/></label>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-xl border px-5 py-3 font-bold">Cancel</button><button disabled={busy} className="rounded-xl bg-teal-700 px-5 py-3 font-bold text-white">{busy?"Sending...":"Submit"}</button></div></form></div>;
}
