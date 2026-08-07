import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiBell,
  FiChevronDown,
  FiMenu,
  FiSearch,
} from "react-icons/fi";

export default function CustomerNavbar({
  title,
  setSidebarOpen,
}) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left */}

        <div className="flex items-center gap-4">

          {/* Mobile Menu */}

          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-slate-200 p-2 lg:hidden"
          >
            <FiMenu size={20} />
          </button>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Customer Dashboard
            </p>

            <h1 className="text-2xl font-bold text-slate-900">
              {title}
            </h1>
          </div>
        </div>

        {/* Search */}

        <div className="hidden w-full max-w-xl lg:block">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search Products, Companies, Categories..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Right */}

        <div className="flex items-center gap-5">

          {/* Notifications */}

          <button className="relative rounded-2xl border border-slate-200 p-3 hover:bg-slate-100">
            <FiBell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Profile */}

          <Link
            to="/customer/profile"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>

            <div className="hidden text-left lg:block">
              <p className="font-semibold text-slate-900">
                {user?.name || "Customer"}
              </p>

              <p className="text-sm text-slate-500">
                Customer
              </p>
            </div>

            <FiChevronDown className="hidden text-slate-400 lg:block" />
          </Link>
        </div>
      </div>
    </header>
  );
}