import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineArrowRight, HiOutlineBuildingOffice2, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText, HiOutlineInboxArrowDown, HiOutlineUserGroup } from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const stats = [
  ["Open Tickets", "openTickets", HiOutlineInboxArrowDown],
  ["Pending Enquiries", "pendingEnquiries", HiOutlineClock],
  ["Resolved Tickets", "resolvedTickets", HiOutlineCheckCircle],
  ["Today's Requests", "todaysRequests", HiOutlineDocumentText],
];
const actions = [
  ["Customer Enquiries", "Review customer questions and assistance requests", HiOutlineUserGroup],
  ["Seller Enquiries", "Help verified sellers with account and platform issues", HiOutlineBuildingOffice2],
  ["Support Tickets", "Open and manage incoming support tickets", HiOutlineDocumentText],
];

export default function SupportDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({});
  useEffect(() => { api.get("/support/dashboard").then(({data}) => setMetrics(data.metrics)).catch(() => setMetrics({})); }, []);
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month:"short", year:"numeric" }) : "MB Store";
  return <div className="space-y-6">
    <motion.section initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5"><span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-teal-100"><HiOutlineBuildingOffice2 className="text-3xl text-teal-700"/></span><div><p className="text-sm font-medium text-slate-500">Welcome back</p><h2 className="mt-1 text-3xl font-bold">{user?.name || "Support User"}</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Assist customers and sellers, respond to enquiries, and keep every MB Store support request moving toward resolution.</p><div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-500"><span className="flex items-center gap-2"><HiOutlineClock className="text-teal-600"/>Member Since {joined}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-emerald-500"/>Active Account</span></div></div></div>
        <div className="grid grid-cols-2 gap-3"><button className="flex min-w-36 flex-col items-center gap-2 rounded-2xl bg-teal-600 px-5 py-4 font-semibold text-white transition hover:-translate-y-1 hover:bg-teal-700"><HiOutlineInboxArrowDown className="text-2xl"/>View Tickets</button><button className="flex min-w-36 flex-col items-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-700 transition hover:-translate-y-1 hover:bg-slate-50"><HiOutlineUserGroup className="text-2xl"/>Enquiries</button></div>
      </div>
    </motion.section>
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label,key,Icon],index)=><motion.section key={key} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:index*.08}} whileHover={{y:-4}} className="flex min-h-48 flex-col items-start rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50"><Icon className="h-7 w-7 text-teal-700"/></span><div className="mt-auto pt-6"><h3 className="text-3xl font-bold leading-none">{metrics[key] ?? 0}</h3><p className="mt-3 text-sm font-medium text-slate-500">{label}</p></div></motion.section>)}</div>
    <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Quick Actions</h2><p className="mt-1 text-sm text-slate-500">Frequently used shortcuts for faster support handling.</p><div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{actions.map(([title,description,Icon],index)=><motion.button key={title} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.08}} whileHover={{y:-4}} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-teal-600 hover:bg-white hover:shadow-md"><span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 transition group-hover:bg-teal-600"><Icon className="text-2xl text-teal-700 group-hover:text-white"/></span><span className="flex-1"><strong>{title}</strong><span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span></span><HiOutlineArrowRight className="mt-2 text-slate-400"/></motion.button>)}</div></section>
  </div>;
}
