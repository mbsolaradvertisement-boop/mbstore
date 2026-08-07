import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineEye,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const enquiries = [
  {
    id: "ENQ-1001",
    product: "Industrial Water Pump",
    seller: "ABC Engineering",
    status: "Pending",
    created: "06 Aug 2026",
    updated: "1 hour ago",
  },
  {
    id: "ENQ-1002",
    product: "Three Phase Motor",
    seller: "PowerTech Industries",
    status: "Seller Replied",
    created: "05 Aug 2026",
    updated: "30 mins ago",
  },
  {
    id: "ENQ-1003",
    product: "Control Panel",
    seller: "Delta Controls",
    status: "Quotation Received",
    created: "04 Aug 2026",
    updated: "Yesterday",
  },
  {
    id: "ENQ-1004",
    product: "Air Compressor",
    seller: "MaxAir Solutions",
    status: "Closed",
    created: "02 Aug 2026",
    updated: "2 days ago",
  },
];

const statusStyles = {
  Pending: "bg-amber-100 text-amber-700",
  "Seller Replied": "bg-blue-100 text-blue-700",
  "Quotation Received": "bg-emerald-100 text-emerald-700",
  Closed: "bg-slate-100 text-slate-700",
};

export default function LatestEnquiries() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Latest Enquiries
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track the status of your recent enquiries.
          </p>
        </div>

        <Link
          to="/customer/enquiries"
          className="flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          View All
          <HiOutlineArrowRight />
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-semibold text-slate-600">
              <th className="px-6 py-4">Enquiry ID</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Seller</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Updated</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {enquiries.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-6 py-5 font-semibold text-slate-800">
                  {item.id}
                </td>

                <td className="px-6 py-5">{item.product}</td>

                <td className="px-6 py-5 text-slate-600">
                  {item.seller}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="px-6 py-5 text-slate-500">
                  {item.created}
                </td>

                <td className="px-6 py-5 text-slate-500">
                  {item.updated}
                </td>

                <td className="px-6 py-5">
                  <div className="flex justify-center gap-2">
                    <button className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100">
                      <HiOutlineEye className="text-lg text-slate-700" />
                    </button>

                    <button className="rounded-xl bg-teal-700 p-2 text-white hover:bg-teal-800">
                      <HiOutlineChatBubbleLeftRight className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 p-5 lg:hidden">
        {enquiries.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{item.product}</h3>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
              >
                {item.status}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-sm text-slate-500">
              <p>
                <strong>ID:</strong> {item.id}
              </p>

              <p>
                <strong>Seller:</strong> {item.seller}
              </p>

              <p>
                <strong>Created:</strong> {item.created}
              </p>

              <p>
                <strong>Updated:</strong> {item.updated}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 py-2 font-semibold hover:bg-slate-100">
                View
              </button>

              <button className="flex-1 rounded-xl bg-teal-700 py-2 font-semibold text-white hover:bg-teal-800">
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}