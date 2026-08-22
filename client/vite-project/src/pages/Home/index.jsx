import {lazy,useEffect} from "react";
import Navbar from "../../components/Navbar";
import Hero from "../../components/Hero";
import DeferredSection from "../../components/DeferredSection";

const CategoryGrid=lazy(()=>import("../../components/CategoryGrid"));
const HowItWorks=lazy(()=>import("../../components/HowItWorks"));
const FeaturedCompanies=lazy(()=>import("../../components/FeaturedCompanies"));
const WhyChooseUs=lazy(()=>import("../../components/WhyChooseUs"));
const FeaturedProducts=lazy(()=>import("../../components/FeaturedProducts"));
const CTA=lazy(()=>import("../../components/CTA"));
const Footer=lazy(()=>import("../../components/Footer"));

export default function Home(){useEffect(()=>{if(window.location.hash==="#categories")window.setTimeout(()=>document.getElementById("categories")?.scrollIntoView({behavior:"smooth",block:"start"}),100)},[]);return <><a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white transition focus:translate-y-0">Skip to content</a><Navbar/><main id="main-content"><Hero/><DeferredSection minHeight={420}><CategoryGrid/></DeferredSection><DeferredSection><HowItWorks/></DeferredSection><DeferredSection><FeaturedCompanies/></DeferredSection><DeferredSection><WhyChooseUs/></DeferredSection><DeferredSection><FeaturedProducts/></DeferredSection><DeferredSection minHeight={200}><CTA/></DeferredSection></main><DeferredSection minHeight={240}><Footer/></DeferredSection></>}
