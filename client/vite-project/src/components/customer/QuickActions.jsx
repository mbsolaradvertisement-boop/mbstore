import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineHeart,
} from "react-icons/hi2";

const actions = [
  {
    title: "Browse Products",
    description: "Explore verified industrial products",
    icon: HiOutlineMagnifyingGlass,
    link: "/catalogue",
  },
  {
    title: "Request Quotation",
    description: "Send quotation requests to sellers",
    icon: HiOutlineDocumentText,
    link: "/customer/quotations",
  },
  {
    title: "Favorites",
    description: "View your saved products",
    icon: HiOutlineHeart,
    link: "/customer/favorites",
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Frequently used shortcuts for faster navigation.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -5,
              }}
            >
              <Link
                to={action.link}
                className="group flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-teal-600 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 transition group-hover:bg-teal-600">
                  <Icon className="text-2xl text-teal-700 transition group-hover:text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
