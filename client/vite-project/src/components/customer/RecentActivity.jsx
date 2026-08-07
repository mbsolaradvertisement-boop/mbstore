import { motion } from "framer-motion";
import {
  HiOutlineEye,
  HiOutlineDocumentText,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentArrowDown,
  HiOutlineScale,
} from "react-icons/hi2";

const activities = [
  {
    id: 1,
    title: "Viewed Industrial Water Pump",
    description: "You viewed the product details.",
    time: "10 mins ago",
    icon: HiOutlineEye,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    title: "Quotation Requested",
    description: "Request sent to ABC Engineering.",
    time: "45 mins ago",
    icon: HiOutlineDocumentText,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 3,
    title: "Seller Replied",
    description: "XYZ Industries responded to your enquiry.",
    time: "2 hours ago",
    icon: HiOutlineChatBubbleLeftRight,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: 4,
    title: "Datasheet Downloaded",
    description: "Downloaded Motor Specification PDF.",
    time: "Yesterday",
    icon: HiOutlineDocumentArrowDown,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: 5,
    title: "Compared Products",
    description: "Compared three industrial motors.",
    time: "2 days ago",
    icon: HiOutlineScale,
    color: "bg-pink-100 text-pink-600",
  },
];

export default function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your latest interactions with products and sellers.
          </p>
        </div>

        <button className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          View All
        </button>
      </div>

      <div className="relative">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Timeline Line */}
              {index !== activities.length - 1 && (
                <div className="absolute left-6 top-12 h-full w-px bg-slate-200"></div>
              )}

              {/* Icon */}
              <div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${activity.color}`}
              >
                <Icon className="text-xl" />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {activity.title}
                  </h3>

                  <span className="text-xs text-slate-400">
                    {activity.time}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {activity.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}