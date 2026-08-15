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
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Clinical",
    items: [
      { name: "Patients", icon: Users },
      { name: "Doctors", icon: Stethoscope },
      { name: "Appointments", icon: CalendarDays },
      { name: "Medical Records", icon: FileText },
      { name: "Laboratory", icon: FlaskConical },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Pharmacy", icon: Pill },
      { name: "Billing", icon: Receipt },
      { name: "Inventory", icon: Package },
      { name: "Reports", icon: BarChart3 },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Hospital size={20} />
        </div>

        <div>
          <h1 className="text-sm font-bold text-slate-900">HMS</h1>
          <p className="text-xs text-slate-500">Hospital Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navigation.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.name === "Dashboard";

                return (
                  <button
                    key={item.name}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
          <Settings size={18} />
          Settings
        </button>

        <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600">
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;