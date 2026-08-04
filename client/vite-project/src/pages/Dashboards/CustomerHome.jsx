import { Link } from "react-router-dom";
import DashboardShell from "./DashboardShell";
export default function CustomerHome(){return <DashboardShell eyebrow="Customer account" title="Welcome to MB Store"><div className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-xl font-black">Discover industrial products</h2><p className="mt-2 text-slate-500">Browse verified companies and connect directly with sellers.</p><Link to="/catalogue" className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-bold text-white">Browse catalogue</Link></div></DashboardShell>}
