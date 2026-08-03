import { useState } from "react";
import { FiHeadphones, FiLogIn, FiMenu, FiPhone, FiSearch, FiUserPlus, FiX } from "react-icons/fi";

const actions = [{ label: "Call", icon: FiPhone, href: "tel:+910000000000" }, { label: "Support", icon: FiHeadphones, href: "#support" }, { label: "Login", icon: FiLogIn, href: "#login" }];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <nav className="section-shell flex h-18 items-center gap-4" aria-label="Primary navigation">
      <a href="#top" className="shrink-0" aria-label="MB Store home"><img src="/assests/mb.png" alt="MB Store" className="h-15 w-43 rounded-lg object-contain" /></a>
      <form className="hidden flex-1 md:block" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="nav-search" className="sr-only">Search products, companies or categories</label>
        <div className="relative"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600" /><input id="nav-search" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" placeholder="Search products, companies or categories" /></div>
      </form>
      <div className="ml-auto hidden items-center gap-1 lg:flex">
        {actions.map(({label, icon: Icon, href}) => <a key={label} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"><Icon />{label}</a>)}
        <a href="#register" className="ml-2 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700"><FiUserPlus />Register</a>
      </div>
      <a href="#login" className="ml-auto rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white md:hidden">Login</a>
      <button className="rounded-lg p-2 text-2xl text-slate-700 lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Toggle navigation">{open ? <FiX /> : <FiMenu />}</button>
    </nav>
    <div className="section-shell pb-3 md:hidden"><div className="relative"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600" /><input aria-label="Search" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm" placeholder="Search products, companies or categories" /></div></div>
    {open && <div id="mobile-menu" className="border-t border-slate-100 bg-white p-4 lg:hidden"><div className="section-shell grid gap-2">{actions.slice(0,2).map(({label, icon: Icon, href}) => <a key={label} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-3 font-bold text-slate-700 hover:bg-sky-50"><Icon />{label}</a>)}<a href="#register" onClick={() => setOpen(false)} className="rounded-xl bg-red-600 p-3 text-center font-bold text-white">Register as Seller</a></div></div>}
  </header>;
}
