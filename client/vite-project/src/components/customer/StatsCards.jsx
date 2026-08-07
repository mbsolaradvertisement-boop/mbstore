import { motion } from "framer-motion";
import {
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineDocumentText,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";

const stats = [
  {
    title: "Products Viewed",
    value: "128",
    change: "+12%",
    icon: HiOutlineEye,
  },
  {
    title: "Favorite Products",
    value: "24",
    change: "+5%",
    icon: HiOutlineHeart,
  },
  {
    title: "Pending Quotations",
    value: "8",
    change: "+2",
    icon: HiOutlineDocumentText,
  },
  {
    title: "Unread Messages",
    value: "5",
    change: "+1",
    icon: HiOutlineChatBubbleLeftRight,
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: index * 0.1,
            }}
            whileHover={{
              y: -5,
            }}
            className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
                <Icon className="text-3xl text-teal-700" />
              </div>

              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <HiOutlineArrowTrendingUp />
                {item.change}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-3xl font-bold text-slate-900">
                {item.value}
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                {item.title}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}