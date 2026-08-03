import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiGrid, FiPackage, FiUsers } from "react-icons/fi";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ImagePlaceholder } from "./common";

const stats = [{ value: "5,000+", label: "Products", icon: FiPackage, color: "bg-sky-500" }, { value: "200+", label: "Companies", icon: FiBriefcase, color: "bg-amber-500" }, { value: "100+", label: "Verified Sellers", icon: FiCheckCircle, color: "bg-red-500" }];

export default function Hero() {
  return <section id="top" className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-amber-50 py-14 md:py-22">
    <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" /><div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-yellow-200/50 blur-3xl" />
    <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
      <motion.div initial={{opacity:0,x:-25}} animate={{opacity:1,x:0}} transition={{duration:.6}}>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-sky-700 shadow-sm"><FiCheckCircle /> India&apos;s growing B2B network</div>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-5xl md:text-6xl">Find Industrial Products <span className="text-sky-600">From Trusted Companies</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">Explore products from multiple companies, connect directly with verified sellers, and request quotations instantly.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/catalogue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 font-extrabold text-white shadow-lg shadow-red-200 transition hover:-translate-y-1 hover:bg-red-700">Browse Collections <FiArrowRight /></Link><Link to="/companies" className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-6 py-3.5 font-extrabold text-sky-700 transition hover:-translate-y-1 hover:border-sky-400 hover:bg-sky-50"><FiGrid /> Explore Companies</Link></div>
        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-500"><FiUsers className="text-sky-600" /> No cart. No checkout. Connect and deal directly.</p>
      </motion.div>
      <motion.div initial={{opacity:0,x:25}} animate={{opacity:1,x:0}} transition={{duration:.65}} className="relative mx-auto w-full max-w-xl pb-10">
        <Swiper modules={[Autoplay, Pagination]} autoplay={{delay:3500, disableOnInteraction:false}} pagination={{clickable:true}} loop className="rounded-3xl border-8 border-white bg-white shadow-2xl shadow-sky-200/60">
          {["Industrial Product Showcase", "Trusted Company Network", "Direct Seller Connection"].map((label) => <SwiperSlide key={label}><ImagePlaceholder label={label} className="aspect-[4/3] !rounded-2xl border-0" /></SwiperSlide>)}
        </Swiper>
        <div className="absolute -bottom-4 left-1/2 z-10 grid w-[96%] -translate-x-1/2 grid-cols-3 gap-2 sm:gap-3">{stats.map(({value,label,icon:Icon,color}) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-lg sm:flex sm:items-center sm:gap-3"><span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-white sm:mb-0 ${color}`}><Icon /></span><div><strong className="block text-sm text-slate-900 sm:text-base">{value}</strong><span className="text-[10px] font-bold text-slate-500 sm:text-xs">{label}</span></div></div>)}</div>
      </motion.div>
    </div>
  </section>;
}
