import { useState } from "react";
import { FiBell, FiChevronDown, FiChevronLeft, FiChevronRight, FiClipboard, FiGrid, FiLogOut, FiMenu, FiMessageCircle, FiSearch, FiUser, FiUsers, FiX,FiBriefcase,FiFileText,FiClock,FiAlertTriangle,FiCheckCircle } from "react-icons/fi";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  ["Dashboard", FiGrid, "/support/dashboard"],
  ["All Tickets", FiClipboard, "/support/tickets"],
  ["My Tickets", FiUser, "/support/tickets/my"],
  ["Unassigned", FiClock, "/support/tickets/unassigned"],
  ["High Priority", FiAlertTriangle, "/support/tickets/high-priority"],
  ["Resolved", FiCheckCircle, "/support/tickets/resolved"],
  ["Customer Support", FiUsers, "/support/customers"],
  ["Seller Support", FiBriefcase, "/support/sellers"],
  ["Quotations", FiFileText, "/support/quotations"],
  ["Conversations", FiMessageCircle, "/support/conversations"],
  ["Follow-ups", FiClock, "/support/follow-ups"],
  ["Notifications", FiBell, "/support/notifications"],
  ["Profile", FiUser, "/support/profile"],
];

export default function SupportLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const leave = async () => { await logout(); navigate("/login"); };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${collapsed ? "w-20" : "w-64"} ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
        <Link to="/support/dashboard"><img src="/assests/mb.png" alt="MB Store" className={`h-12 object-contain object-left ${collapsed ? "w-10 object-cover" : "w-44"}`} /></Link>
        <button onClick={() => setOpen(false)} className="lg:hidden"><FiX size={22} /></button>
      </div>
      <nav className="mt-4 flex-1 overflow-y-auto px-3">
        {navigation.map(([label, Icon, path]) => path ? <NavLink key={label} to={path} onClick={() => setOpen(false)} className={({isActive}) => `mb-2 flex items-center rounded-2xl px-4 py-3 transition ${isActive ? "bg-teal-700 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}><Icon size={20} className="shrink-0" />{!collapsed && <span className="ml-4 font-medium">{label}</span>}</NavLink> : <button key={label} disabled className="mb-2 flex w-full items-center rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 disabled:cursor-default"><Icon size={20} className="shrink-0" />{!collapsed && <span className="ml-4 font-medium">{label}</span>}</button>)}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <button onClick={() => setCollapsed(!collapsed)} className="mb-3 flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 hover:bg-slate-100">{collapsed ? <FiChevronRight /> : <><FiChevronLeft /><span className="ml-2 text-sm">Collapse</span></>}</button>
        <button onClick={leave} className="flex w-full items-center justify-center rounded-xl bg-red-50 py-3 text-red-600 hover:bg-red-100"><FiLogOut />{!collapsed && <span className="ml-2">Logout</span>}</button>
      </div>
    </aside>
    <div className={`transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-20 items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-4"><button onClick={() => setOpen(true)} className="rounded-xl border border-slate-200 p-2 lg:hidden"><FiMenu size={20}/></button><div><p className="text-xs uppercase tracking-widest text-slate-400">Support Dashboard</p><h1 className="text-2xl font-bold">{location.pathname.endsWith("profile") ? "Profile" : "Dashboard"}</h1></div></div>
          <label className="relative hidden w-full max-w-xl lg:block"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input placeholder="Search tickets, customers, sellers..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white"/></label>
          <div className="flex shrink-0 items-center gap-5"><button className="relative rounded-2xl border border-slate-200 p-3 hover:bg-slate-100"><FiBell size={20}/></button><Link to="/support/profile" className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "S"}</span><span className="hidden text-left lg:block"><strong className="block text-sm">{user?.name || "Support User"}</strong><span className="text-sm text-slate-500">Support · Active</span></span><FiChevronDown className="hidden text-slate-400 lg:block"/></Link></div>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
    <button onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-30 rounded-full bg-teal-700 p-4 text-white shadow-lg lg:hidden"><FiMenu/></button>
  </div>;
}
