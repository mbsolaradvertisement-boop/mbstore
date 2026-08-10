import { useCallback, useEffect, useState } from "react";
import { FiBell, FiCheckCircle, FiFileText, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import CustomerLayout from "../../layout/customer/CustomerLayout";
import { apiMessage } from "../../lib/api";
import {
  deleteAllCustomerNotifications,
  deleteSelectedCustomerNotifications,
  getCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "../../services/notificationService";

const timestamp = (value) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

export default function CustomerNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await getCustomerNotifications({ limit: 50 });
      setItems(data.data);
      setUnread(data.unread);
    } catch (error) {
      if (!silent) toast(apiMessage(error), "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load({ silent: true }), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function open(item) {
    if (!item.readAt) {
      await markCustomerNotificationRead(item.id);
      setItems((current) => current.map((value) => value.id === item.id
        ? { ...value, readAt: new Date().toISOString() }
        : value));
      setUnread((current) => Math.max(0, current - 1));
    }
    if (item.entityType === "quotation") navigate("/customer/quotations");
  }

  async function markAll() {
    try {
      await markAllCustomerNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnread(0);
      toast("All notifications marked as read.");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  }

  const toggle = (id) => setSelected((current) => current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id]);
  const selectAll = () => setSelected(selected.length === items.length ? [] : items.map((item) => item.id));

  async function deleteSelected() {
    if (!selected.length || !window.confirm(`Delete ${selected.length} selected notification${selected.length === 1 ? "" : "s"}?`)) return;
    try {
      const { data } = await deleteSelectedCustomerNotifications(selected);
      const removed = new Set(selected);
      const unreadRemoved = items.filter((item) => removed.has(item.id) && !item.readAt).length;
      setItems((current) => current.filter((item) => !removed.has(item.id)));
      setUnread((current) => Math.max(0, current - unreadRemoved));
      setSelected([]);
      toast(`${data.deleted} notification${data.deleted === 1 ? "" : "s"} deleted.`);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  }

  async function deleteAll() {
    if (!window.confirm("Permanently delete all your notifications? This cannot be undone.")) return;
    try {
      const { data } = await deleteAllCustomerNotifications();
      setItems([]);
      setSelected([]);
      setUnread(0);
      toast(`${data.deleted} notification${data.deleted === 1 ? "" : "s"} deleted.`);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  }

  return <CustomerLayout title="Notifications"><section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-teal-700">Quotation updates</p><h1 className="text-3xl font-black">Notifications</h1><p className="mt-1 text-sm text-slate-500">{unread} unread notification{unread===1?"":"s"}</p></div><div className="flex flex-wrap gap-3"><button disabled={!selected.length} onClick={deleteSelected} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><FiTrash2/>Delete Selected ({selected.length})</button><button disabled={!items.length} onClick={deleteAll} className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-40"><FiTrash2/>Delete All</button><button disabled={!unread} onClick={markAll} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold disabled:opacity-40"><FiCheckCircle/>Mark all read</button></div></div>{loading?<div className="mt-6 space-y-3">{[1,2,3].map(value=><div key={value} className="h-24 animate-pulse rounded-2xl bg-slate-200"/>)}</div>:items.length?<div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><label className="flex items-center gap-3 border-b bg-slate-50 px-5 py-3 text-sm font-bold"><input type="checkbox" checked={selected.length===items.length} onChange={selectAll} className="size-4 accent-teal-600"/>Select All</label>{items.map(item=><div key={item.id} className={`flex items-start gap-3 border-b p-5 last:border-0 ${item.readAt?"bg-white":"bg-teal-50/60"}`}><input type="checkbox" checked={selected.includes(item.id)} onChange={()=>toggle(item.id)} className="mt-3 size-4 shrink-0 accent-teal-600"/><button onClick={()=>open(item)} className="flex min-w-0 flex-1 items-start gap-4 text-left"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.readAt?"bg-slate-100":"bg-teal-100 text-teal-700"}`}>{item.entityType==="quotation"?<FiFileText/>:<FiBell/>}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap justify-between gap-2"><b className="text-sm">{item.title}</b><time className="text-xs text-slate-400">{timestamp(item.createdAt)}</time></span><span className="mt-1 block text-sm text-slate-600">{item.message}</span></span>{!item.readAt&&<span className="mt-2 size-2 rounded-full bg-teal-600"/>}</button></div>)}</div>:<div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed bg-white text-center"><div><FiBell className="mx-auto text-4xl text-slate-300"/><h2 className="mt-3 font-black">No notifications yet</h2></div></div>}</section></CustomerLayout>;
}
