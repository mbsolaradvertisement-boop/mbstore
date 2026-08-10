import { useEffect, useState } from "react";
import { FiArrowRight, FiBriefcase } from "react-icons/fi";
import { Link } from "react-router-dom";
import { apiAsset } from "../lib/api";
import { getCatalogueFilters } from "../services/catalogueService";
import { Reveal, SectionHeading } from "./common";

export default function FeaturedCompanies(){
  const [companies,setCompanies]=useState([]);
  useEffect(()=>{getCatalogueFilters().then(({data})=>setCompanies(data.brands.slice(0,4))).catch(()=>setCompanies([]));},[]);
  return <section id="companies" className="py-20 md:py-28"><div className="section-shell"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><SectionHeading eyebrow="Verified network" title="Featured Companies" copy="Explore product catalogues from trusted manufacturers and suppliers."/><Link to="/companies" className="mb-10 inline-flex items-center gap-2 font-extrabold text-sky-700">View all companies <FiArrowRight/></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{companies.map((company,index)=><Reveal key={company.id} delay={index*.06}><article className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl"><div className="mb-5 flex aspect-[2/1] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-4 text-slate-400">{company.logoUrl?<img src={apiAsset(company.logoUrl)} alt={`${company.companyName} logo`} className="h-full w-full object-contain"/>:<FiBriefcase className="text-3xl"/>}</div><h3 className="text-lg font-black text-slate-900">{company.companyName}</h3><Link to={`/catalogue?brand=${encodeURIComponent(company.companyName)}`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-sky-700">View Products <FiArrowRight className="transition group-hover:translate-x-1"/></Link></article></Reveal>)}</div></div></section>;
}
