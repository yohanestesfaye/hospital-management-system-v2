import {
  Users,
  CalendarDays,
  Stethoscope,
  CreditCard,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";

const stats = [
  {
    title: "Total Patients",
    value: "1,248",
    change: "+8.2%",
    icon: Users,
  },
  {
    title: "Appointments Today",
    value: "86",
    change: "+4.5%",
    icon: CalendarDays,
  },
  {
    title: "Available Doctors",
    value: "24",
    change: "+2",
    icon: Stethoscope,
  },
  {
    title: "Today's Revenue",
    value: "$12,480",
    change: "+6.8%",
    icon: CreditCard,
  },
];

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            Hospital overview
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Good morning, Admin
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Here's what's happening across the hospital today.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-4 text-xs font-medium text-emerald-600">
                  {stat.change} from last period
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Today's Appointments
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Scheduled appointments for today
                </p>
              </div>

              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 font-medium text-slate-800">
                      Abebe Kebede
                    </td>
                    <td className="py-4 text-slate-500">Dr. Hana</td>
                    <td className="py-4 text-slate-500">09:00 AM</td>
                    <td className="py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Confirmed
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-4 font-medium text-slate-800">
                      Sara Ahmed
                    </td>
                    <td className="py-4 text-slate-500">Dr. Daniel</td>
                    <td className="py-4 text-slate-500">10:30 AM</td>
                    <td className="py-4">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Waiting
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-4 font-medium text-slate-800">
                      John Smith
                    </td>
                    <td className="py-4 text-slate-500">Dr. Hana</td>
                    <td className="py-4 text-slate-500">11:30 AM</td>
                    <td className="py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Scheduled
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Quick Actions
            </h3>

            <div className="mt-4 space-y-2">
              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                Register New Patient
              </button>

              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                Schedule Appointment
              </button>

              <button className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;