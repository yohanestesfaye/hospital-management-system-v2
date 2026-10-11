import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
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
  Shield,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        roles: ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician", "accountant", "staff"],
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
        roles: ["admin", "doctor", "nurse", "receptionist", "accountant"],
      },
      {
        name: "Doctors",
        icon: Stethoscope,
        path: "/doctors",
        roles: ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician", "accountant", "staff"],
      },
      {
        name: "Departments",
        icon: Building2,
        path: "/departments",
        roles: ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician", "accountant", "staff"],
      },
      {
        name: "Appointments",
        icon: CalendarDays,
        path: "/appointments",
        roles: ["admin", "doctor", "nurse", "receptionist"],
      },
      {
        name: "Medical Records",
        icon: FileText,
        path: "/medical-records",
        roles: ["admin", "doctor", "nurse"],
      },
      {
        name: "Laboratory",
        icon: FlaskConical,
        path: "/laboratory",
        roles: ["admin", "doctor", "nurse", "lab_technician"],
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
        roles: ["admin", "pharmacist"],
      },
      {
        name: "Billing",
        icon: Receipt,
        path: "/billing",
        roles: ["admin", "accountant", "receptionist"],
      },
      {
        name: "Inventory",
        icon: Package,
        path: "/inventory",
        roles: ["admin", "pharmacist"],
      },
      {
        name: "Reports",
        icon: BarChart3,
        path: "/reports",
        roles: ["admin", "accountant", "doctor"],
      },
    ],
  },
];

function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const userRole = user?.role || "staff";

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles || userRole === "admin") return true;
        return item.roles.includes(userRole);
      }),
    }))
    .filter((section) => section.items.length > 0);

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
        {/* Logo & Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Hospital size={20} />
            </div>

            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                HMS V2
              </h1>

              <p className="text-[11px] text-slate-500">
                Hospital System
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

        {/* Current Role Banner */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
            <Shield size={13} className="text-blue-600" />
            Role:
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold uppercase text-[10px] tracking-wider">
            {userRole.replace("_", " ")}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {filteredNavigation.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                        `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-blue-50 text-blue-700 shadow-xs font-semibold"
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
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
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