import { FiSearch } from "react-icons/fi";

export default function SearchBar({ value = "", onChange, onSubmit, compact = false }) {
  return <form className="w-full" role="search" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
    <label htmlFor={compact ? "mobile-site-search" : "site-search"} className="sr-only">Search products, companies, brands</label>
    <div className="relative"><FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-sky-600" aria-hidden="true"/><input id={compact ? "mobile-site-search" : "site-search"} value={value} onChange={(event)=>onChange?.(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" placeholder="Search Products, Companies, Brands..."/></div>
  </form>;
}
