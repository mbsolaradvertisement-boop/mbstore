import {Autoplay,Navigation,Pagination} from "swiper/modules";
import {Swiper,SwiperSlide} from "swiper/react";
import {FiArrowRight,FiImage} from "react-icons/fi";
import {Link} from "react-router-dom";
import useLiveHomeData from "../hooks/useLiveHomeData";

const emptyBanners={data:[]};

export default function Hero(){
  const response=useLiveHomeData("/home/banners",emptyBanners),rows=response?.data??null;
  return <section id="top" className="bg-slate-100"><div className="w-full px-3 py-3 sm:px-5 lg:px-8 lg:py-4">
    {rows===null?<div className="h-[clamp(18rem,32vw,32rem)] animate-pulse rounded-3xl bg-slate-200"/>:rows.length?
      <Swiper
        modules={[Autoplay,Navigation,Pagination]}
        autoplay={rows.length>1?{delay:4000,disableOnInteraction:false,pauseOnMouseEnter:true}:false}
        navigation={rows.length>1}
        pagination={rows.length>1?{clickable:true}:false}
        loop={rows.length>1}
        speed={700}
        className="home-banner-swiper overflow-hidden rounded-3xl bg-slate-900 shadow-xl"
      >
        {rows.map((banner,index)=><SwiperSlide key={banner.id}>
          <article className="relative h-[clamp(18rem,32vw,32rem)] w-full overflow-hidden">
            <img src={banner.imageUrl} alt={banner.title} loading={index===0?"eager":"lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover object-center"/>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/35 to-transparent"/>
            <div className="absolute inset-0 flex max-w-2xl flex-col justify-center px-16 py-8 text-white sm:px-20 lg:px-24">
              {banner.subtitle&&<p className="text-sm font-bold text-sky-300">{banner.subtitle}</p>}
              <h1 className="mt-2 text-3xl font-black md:text-5xl">{banner.title}</h1>
              {banner.description&&<p className="mt-4 line-clamp-3 text-sm md:text-lg">{banner.description}</p>}
              {banner.buttonText&&<Link to={banner.buttonLink||"/catalogue"} className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold transition hover:bg-red-700">{banner.buttonText}<FiArrowRight/></Link>}
            </div>
          </article>
        </SwiperSlide>)}
      </Swiper>:
      <div className="grid min-h-72 place-items-center rounded-3xl bg-gradient-to-br from-sky-100 to-amber-50 text-center"><div><FiImage className="mx-auto text-5xl text-sky-500"/><h1 className="mt-4 text-3xl font-black">Discover MB Store</h1><p className="mt-2 text-slate-600">Industrial products from trusted sellers.</p></div></div>}
  </div></section>
}
