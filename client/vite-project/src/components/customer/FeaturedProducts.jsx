import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineHeart,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineCube,
  HiOutlinePhoto,
} from "react-icons/hi2";

const products = [
  {
    id: 1,
    name: "Industrial Water Pump",
    company: "ABC Engineering",
    category: "Pumps",
    description:
      "High-efficiency industrial water pump suitable for manufacturing units.",
  },
  {
    id: 2,
    name: "Three Phase Motor",
    company: "PowerTech Industries",
    category: "Motors",
    description:
      "Energy-efficient three phase motor with premium performance.",
  },
  {
    id: 3,
    name: "Control Panel",
    company: "Delta Controls",
    category: "Electrical",
    description:
      "Industrial automation control panel with advanced protection.",
  },
  {
    id: 4,
    name: "Air Compressor",
    company: "MaxAir Solutions",
    category: "Compressors",
    description:
      "Heavy-duty compressor designed for industrial applications.",
  },
];

export default function FeaturedProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Featured Products
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Discover verified industrial products from trusted companies.
          </p>
        </div>

        <Link
          to="/catalogue"
          className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          View All
        </Link>
      </div>

      {/* Products */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -6 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg"
          >
            {/* Placeholder Image */}
            <div className="flex h-44 items-center justify-center bg-slate-100">
              <div className="text-center text-slate-400">
                <HiOutlinePhoto className="mx-auto mb-2 text-5xl" />
                <p className="text-sm">Image Placeholder</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900">
                {product.name}
              </h3>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <HiOutlineBuildingOffice2 />
                {product.company}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <HiOutlineCube />
                {product.category}
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {product.description}
              </p>

              {/* Buttons */}
              <div className="mt-6 flex gap-2">
                <Link
                  to={`/catalogue/${product.id}`}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View Details
                </Link>

                <button className="rounded-xl bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-800">
                  <HiOutlineDocumentText className="text-lg" />
                </button>

                <button className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600">
                  <HiOutlineHeart className="text-lg" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}