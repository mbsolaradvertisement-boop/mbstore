import { useState } from "react";
import {
  FiActivity, FiBell, FiBox, FiChevronDown, FiGrid, FiHelpCircle,
  FiImage, FiLayers, FiLogOut, FiMenu, FiSearch, FiSettings,
  FiShoppingBag, FiTag, FiUsers, FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const adminNavigation = [
  ["Dashboard", FiGrid, "/admin/dashboard"], ["Company Management", FiShoppingBag, "/admin/companies"],
  ["Seller Management", FiUsers, "/admin/sellers"], ["Customer Management", FiUsers, "/admin/customers"],
  ["Support Management", FiHelpCircle, "/admin/support"],
  ["Product Management", FiBox], ["Categories", FiLayers, "/admin/categories"], ["Brands", FiTag],
  ["Reports", FiActivity], ["Website CMS", FiSettings], ["Banner Management", FiImage],
  ["Notifications", FiBell], ["Support Tickets", FiHelpCircle], ["Analytics", FiActivity],
];

export default function DashboardShell({ title, eyebrow, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const leave = async () => { await logout(); navigate("/"); };

  if (user?.role !== "Admin") return <div className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><div className="section-shell flex items-center justify-between py-4"><Link to="/" className="font-black text-teal-800">MB Store</Link><button onClick={leave} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"><FiLogOut />Logout</button></div></header><main className="section-shell py-10"><p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-black text-slate-900">{title}</h1><p className="mt-2 text-slate-500">Signed in as {user?.email}</p><div className="mt-8">{children}</div></main></div>;

  return <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
    {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-70 flex-col bg-[#15171b] text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between border-b border-white/8 px-5"><Link to="/" className="flex items-center"><img src="/assests/mb.png" alt="MB Store" className="h-12 w-44 object-contain object-left"/></Link><button className="text-xl text-slate-400 lg:hidden" onClick={() => setSidebarOpen(false)}><FiX /></button></div>
      <nav className="flex-1 overflow-y-auto px-4 py-6"><p className="px-3 text-[11px] font-bold uppercase tracking-[.16em] text-slate-500">Admin modules</p><div className="mt-3 space-y-1">{adminNavigation.map(([label, Icon, path]) => path ? <Link key={label} to={path} onClick={()=>setSidebarOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${location.pathname === path ? "bg-white/10 font-bold text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon className="text-lg" />{label}</Link> : <button key={label} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><Icon className="text-lg" />{label}{label === "Notifications" && <span className="ml-auto rounded-md bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">3</span>}</button>)}</div></nav>
      <div className="border-t border-white/8 p-4"><button onClick={leave} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"><FiLogOut />Logout</button></div>
    </aside>
    <div className="lg:pl-70"><header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><button className="text-xl lg:hidden" onClick={() => setSidebarOpen(true)}><FiMenu /></button><label className="flex max-w-md flex-1 items-center gap-3 rounded-xl bg-slate-100 px-4 py-2.5 text-slate-400"><FiSearch /><input className="w-full bg-transparent text-sm text-slate-700 outline-none" placeholder="Search dashboard" /></label><button className="relative grid size-10 place-items-center rounded-full border border-slate-200 text-slate-500"><FiBell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" /></button><div className="hidden h-9 w-px bg-slate-200 sm:block" /><div className="hidden items-center gap-3 sm:flex"><span className="grid size-10 place-items-center rounded-full bg-emerald-100 font-black text-emerald-800">{user?.name?.[0] || "A"}</span><div className="leading-tight"><p className="text-sm font-bold">{user?.name || "Administrator"}</p><p className="text-xs text-slate-400">Super Admin</p></div><FiChevronDown className="text-slate-400" /></div></header>
      <main className="p-4 sm:p-7 xl:p-8">{children}</main>
    </div>
  </div>;
}
