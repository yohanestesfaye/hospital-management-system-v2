import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  FlaskConical,
  Pill,
  Receipt,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Hospital,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    label: "Clinical",
    items: [
      {
        name: "Patients",
        icon: Users,
        path: "/patients",
      },
      {
        name: "Doctors",
        icon: Stethoscope,
        path: "/doctors",
      },
      {
        name: "Appointments",
        icon: CalendarDays,
        path: "/appointments",
      },
      {
        name: "Medical Records",
        icon: FileText,
        path: "/medical-records",
      },
      {
        name: "Laboratory",
        icon: FlaskConical,
        path: "/laboratory",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Pharmacy",
        icon: Pill,
        path: "/pharmacy",
      },
      {
        name: "Billing",
        icon: Receipt,
        path: "/billing",
      },
      {
        name: "Inventory",
        icon: Package,
        path: "/inventory",
      },
      {
        name: "Reports",
        icon: BarChart3,
        path: "/reports",
      },
    ],
  },
];

function Sidebar({ mobileOpen, onClose }) {
  const { logout } = useAuth();
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Hospital size={20} />
            </div>

            <div>
              <h1 className="text-sm font-bold text-slate-900">
                HMS
              </h1>

              <p className="text-xs text-slate-500">
                Hospital Management
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

         <button
  type="button"
  onClick={logout}
  className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
>
  <LogOut size={18} />
  <span>Sign out</span>
</button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;