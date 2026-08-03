import Navbar from "../../components/Navbar";
import Hero from "../../components/Hero";
import CategoryGrid from "../../components/CategoryGrid";
import HowItWorks from "../../components/HowItWorks";
import FeaturedCompanies from "../../components/FeaturedCompanies";
import WhyChooseUs from "../../components/WhyChooseUs";
import FeaturedProducts from "../../components/FeaturedProducts";
import CTA from "../../components/CTA";
import Footer from "../../components/Footer";

export default function Home(){return <><a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white transition focus:translate-y-0">Skip to content</a><Navbar/><main id="main-content"><Hero/><CategoryGrid/><HowItWorks/><FeaturedCompanies/><WhyChooseUs/><FeaturedProducts/><CTA/></main><Footer/></>}
