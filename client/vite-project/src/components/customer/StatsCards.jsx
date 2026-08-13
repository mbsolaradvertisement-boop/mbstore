import {motion} from "framer-motion";
import {HiOutlineEye,HiOutlineHeart,HiOutlineDocumentText,HiOutlineBell} from "react-icons/hi2";

export default function StatsCards({stats={},loading=false}) {
  const items=[
    ["Products Viewed",stats.productsViewed,HiOutlineEye],
    ["Favorite Products",stats.favoriteProducts,HiOutlineHeart],
    ["Pending Quotations",stats.pendingQuotations,HiOutlineDocumentText],
    ["Unread Notifications",stats.unreadNotifications,HiOutlineBell]
  ];
  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">{items.map(([title,value,Icon],index)=><motion.div key={title} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.35,delay:index*.08}} whileHover={{y:-5}} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"><div className="grid size-14 place-items-center rounded-2xl bg-teal-50"><Icon className="text-3xl text-teal-700"/></div><div className="mt-6"><h3 className="text-3xl font-bold text-slate-900">{loading?"—":value??0}</h3><p className="mt-2 text-sm font-medium text-slate-500">{title}</p></div></motion.div>)}</div>;
}
