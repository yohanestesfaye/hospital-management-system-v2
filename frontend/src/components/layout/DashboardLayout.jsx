import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function DashboardLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const closeSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={closeSidebar}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={openSidebar} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;