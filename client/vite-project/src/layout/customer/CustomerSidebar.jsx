import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiHome,
  FiSearch,
  FiHeart,
  FiClipboard,
  FiBell,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
} from "react-icons/fi";

const menu = [
  {
    title: "Dashboard",
    icon: FiHome,
    path: "/customer/home",
  },
  {
    title: "Browse Products",
    icon: FiSearch,
    path: "/catalogue",
  },
  {
    title: "Wishlist",
    icon: FiHeart,
    path: "/customer/wishlist",
  },
  {
    title: "Quotations",
    icon: FiClipboard,
    path: "/customer/quotations",
  },
  {
    title: "Notifications",
    icon: FiBell,
    path: "/customer/notifications",
  },
  {
    title: "Profile",
    icon: FiUser,
    path: "/customer/profile",
  },
  {
    title: "Settings",
    icon: FiSettings,
    path: "/customer/settings",
  },
  {
    title: "Support Tickets",
    icon: FiHelpCircle,
    path: "/customer/support",
  },
];

export default function CustomerSidebar({
  sidebarOpen,
  setSidebarOpen,
  collapsed,
  setCollapsed,
  unreadNotifications,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <>
      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
        fixed
        top-0
        left-0
        z-50
        h-screen
        bg-white
        border-r
        border-slate-200
        transition-all
        duration-300
        shadow-sm

        ${collapsed ? "w-20" : "w-64"}

        ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Logo */}

        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
          <Link
            to="/customer/home"
            className="flex items-center gap-3"
          >
            <img src="/assests/mb.png" alt="MB Store" className={`h-12 object-contain object-left ${collapsed ? "w-11 object-cover" : "w-44"}`} />
          </Link>

          {/* Mobile Close */}

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Menu */}

        <div className="mt-4 px-3">
          {menu.map((item) => {
            const Icon = item.icon;

            const active = location.pathname === item.path;

            return (
              <Link
                key={item.title}
                to={item.path}
                className={`mb-2 flex items-center rounded-2xl px-4 py-3 transition-all duration-200

                ${
                  active
                    ? "bg-teal-700 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="relative shrink-0"><Icon size={20} />{item.path === "/customer/notifications" && unreadNotifications > 0 && collapsed && <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</span>

                {!collapsed && (
                  <span className="ml-4 font-medium">
                    {item.title}
                  </span>
                )}
                {!collapsed && item.path === "/customer/notifications" && unreadNotifications > 0 && <span className="ml-auto grid min-w-6 place-items-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-6 text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
              </Link>
            );
          })}
        </div>

        {/* Bottom */}

        <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mb-3 flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 hover:bg-slate-100"
          >
            {collapsed ? (
              <FiChevronRight />
            ) : (
              <>
                <FiChevronLeft />

                <span className="ml-2 text-sm">
                  Collapse
                </span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl bg-red-50 py-3 text-red-600 hover:bg-red-100"
          >
            <FiLogOut />

            {!collapsed && (
              <span className="ml-2">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Open Button */}

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-5 left-5 z-30 rounded-full bg-teal-700 p-4 text-white shadow-lg lg:hidden"
      >
        <FiMenu />
      </button>
    </>
  );
}
