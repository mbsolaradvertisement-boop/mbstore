import { useState } from "react";
import CustomerSidebar from "./CustomerSidebar";
import CustomerNavbar from "./CustomerNavbar";
import ProfileCompletionPrompt from "../../components/ProfileCompletionPrompt";
import useUnreadNotifications from "../../hooks/useUnreadNotifications";

export default function CustomerLayout({
  children,
  title = "Dashboard",
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const unreadNotifications = useUnreadNotifications("Customer");

  return (
    <div className="min-h-screen bg-slate-50">
      <ProfileCompletionPrompt role="Customer" />
      {/* Sidebar */}
      <CustomerSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        unreadNotifications={unreadNotifications}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <CustomerNavbar
          title={title}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          unreadNotifications={unreadNotifications}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
