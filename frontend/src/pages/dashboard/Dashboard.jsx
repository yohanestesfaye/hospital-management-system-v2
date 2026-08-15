import {
  Users,
  CalendarDays,
  Stethoscope,
  CreditCard,
  ArrowUpRight,
  UserPlus,
  CalendarPlus,
  FilePlus2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";

const stats = [
  {
    title: "Total Patients",
    value: "1,248",
    change: "+8.2%",
    description: "from last month",
    icon: Users,
  },
  {
    title: "Appointments Today",
    value: "86",
    change: "+4.5%",
    description: "from yesterday",
    icon: CalendarDays,
  },
  {
    title: "Available Doctors",
    value: "24",
    change: "+2",
    description: "currently available",
    icon: Stethoscope,
  },
  {
    title: "Today's Revenue",
    value: "$12,480",
    change: "+6.8%",
    description: "from yesterday",
    icon: CreditCard,
  },
];

const appointments = [
  {
    patient: "Abebe Kebede",
    doctor: "Dr. Hana",
    time: "09:00 AM",
    type: "General Checkup",
    status: "Confirmed",
    statusVariant: "success",
  },
  {
    patient: "Sara Ahmed",
    doctor: "Dr. Daniel",
    time: "10:30 AM",
    type: "Consultation",
    status: "Waiting",
    statusVariant: "warning",
  },
  {
    patient: "John Smith",
    doctor: "Dr. Hana",
    time: "11:30 AM",
    type: "Follow-up",
    status: "Scheduled",
    statusVariant: "info",
  },
  {
    patient: "Marta Bekele",
    doctor: "Dr. Samuel",
    time: "01:00 PM",
    type: "Dental",
    status: "Confirmed",
    statusVariant: "success",
  },
];

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <PageHeader
          eyebrow="Hospital overview"
          title="Good morning, Admin"
          description="Here's what's happening across the hospital today."
          action={
            <Button>
              <UserPlus size={17} />
              Register Patient
            </Button>
          }
        />

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={20} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <ArrowUpRight size={14} />
                    {stat.change}
                  </span>

                  <span className="text-xs text-slate-400">
                    {stat.description}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Dashboard Content */}
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {/* Appointments */}
          <Card
            title="Today's Appointments"
            description="Scheduled appointments for today"
            className="xl:col-span-2"
            action={
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight size={15} />
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-100">
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appointment) => (
                    <tr key={`${appointment.patient}-${appointment.time}`}>
                      <td className="py-4">
                        <p className="font-medium text-slate-800">
                          {appointment.patient}
                        </p>
                      </td>

                      <td className="py-4 text-slate-500">
                        {appointment.doctor}
                      </td>

                      <td className="py-4 text-slate-500">
                        {appointment.time}
                      </td>

                      <td className="py-4 text-slate-500">
                        {appointment.type}
                      </td>

                      <td className="py-4">
                        <Badge variant={appointment.statusVariant}>
                          {appointment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card
            title="Quick Actions"
            description="Common hospital tasks"
          >
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <UserPlus size={17} />
                Register New Patient
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <CalendarPlus size={17} />
                Schedule Appointment
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <FilePlus2 size={17} />
                Create Medical Record
              </Button>
            </div>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card
            title="Hospital Activity"
            description="Recent activity across the system"
          >
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <UserPlus size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    New patient registered
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Abebe Kebede was added to the system
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    10 minutes ago
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CalendarDays size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Appointment completed
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Patient consultation completed successfully
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    35 minutes ago
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <CreditCard size={17} />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Payment received
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Invoice payment successfully recorded
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Department Overview"
            description="Current hospital capacity"
          >
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    General Medicine
                  </span>

                  <span className="text-xs text-slate-500">
                    78%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[78%] rounded-full bg-blue-600" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Emergency
                  </span>

                  <span className="text-xs text-slate-500">
                    64%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[64%] rounded-full bg-amber-500" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Pediatrics
                  </span>

                  <span className="text-xs text-slate-500">
                    52%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[52%] rounded-full bg-emerald-500" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Surgery
                  </span>

                  <span className="text-xs text-slate-500">
                    41%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[41%] rounded-full bg-violet-500" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;