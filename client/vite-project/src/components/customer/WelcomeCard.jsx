import { Link } from "react-router-dom";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineHeart,
  HiOutlineClock,
} from "react-icons/hi2";
import { motion } from "framer-motion";

export default function WelcomeCard() {
  const quickActions = [
    {
      title: "Browse Products",
      icon: HiOutlineMagnifyingGlass,
      link: "/catalogue",
      color: "bg-teal-600 hover:bg-teal-700",
    },
    {
      title: "My Enquiries",
      icon: HiOutlineDocumentText,
      link: "/customer/enquiries",
      color: "bg-slate-800 hover:bg-slate-900",
    },
    {
      title: "Favorites",
      icon: HiOutlineHeart,
      link: "/customer/favorites",
      color: "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] bg-white border border-slate-200 shadow-sm p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Section */}
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
            <HiOutlineBuildingOffice2 className="text-3xl text-teal-700" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Welcome back 
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              Customer Name
            </h2>

            <p className="mt-3 max-w-xl text-slate-600 leading-7">
              Explore verified industrial products, compare specifications,
              connect with trusted companies, and request quotations directly
              from sellers.
            </p>

            <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <HiOutlineClock className="text-teal-600" />
                Member Since Jan 2026
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                Active Account
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.link}
                className={`${action.color} rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <Icon className="text-2xl" />
                  <span className="text-sm font-semibold">
                    {action.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}