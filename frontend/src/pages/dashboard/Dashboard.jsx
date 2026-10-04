import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Stethoscope,
  CreditCard,
  ArrowUpRight,
  UserPlus,
  CalendarPlus,
  FilePlus2,
  AlertTriangle,
  FlaskConical,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/hospitalServices";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Unable to load real-time statistics from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Patients",
      value: stats ? stats.totalPatients : "-",
      description: "Active registered patients",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      path: "/patients",
    },
    {
      title: "Active Doctors",
      value: stats ? stats.totalDoctors : "-",
      description: "Available medical specialists",
      icon: Stethoscope,
      color: "bg-emerald-50 text-emerald-600",
      path: "/doctors",
    },
    {
      title: "Today's Appointments",
      value: stats ? stats.todayAppointments : "-",
      description: "Scheduled for today",
      icon: CalendarDays,
      color: "bg-amber-50 text-amber-600",
      path: "/appointments",
    },
    {
      title: "Pending Lab Orders",
      value: stats ? stats.pendingLabOrders : "-",
      description: "Awaiting test results",
      icon: FlaskConical,
      color: "bg-purple-50 text-purple-600",
      path: "/laboratory",
    },
    {
      title: "Unpaid Invoices",
      value: stats ? `$${stats.unpaidInvoicesAmount.toLocaleString()}` : "-",
      description: stats ? `${stats.unpaidInvoicesCount} invoices pending` : "Outstanding balance",
      icon: CreditCard,
      color: "bg-rose-50 text-rose-600",
      path: "/billing",
    },
    {
      title: "Low Stock Medicines",
      value: stats ? stats.lowStockMedicines : "-",
      description: "Need immediate reorder",
      icon: AlertTriangle,
      color: stats?.lowStockMedicines > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600",
      path: "/inventory",
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success">Confirmed</Badge>;
      case "completed":
        return <Badge variant="info">Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="danger">No Show</Badge>;
      default:
        return <Badge variant="warning">Scheduled</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <PageHeader
          eyebrow="Hospital Overview"
          title={`Good day, ${user?.first_name || user?.name || "Staff"}`}
          description="Real-time clinical, operational, and financial overview across the hospital."
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                loading={loading}
              >
                <RefreshCw size={15} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/patients")}
              >
                <UserPlus size={16} />
                Register Patient
              </Button>
            </div>
          }
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link key={stat.title} to={stat.path}>
                <Card className="hover:border-blue-300 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        {stat.title}
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    </div>

                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Dashboard Content */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Recent Appointments */}
          <Card
            title="Recent Appointments"
            description="Latest appointments recorded in the system"
            className="xl:col-span-2"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/appointments")}
              >
                View all
                <ArrowUpRight size={15} />
              </Button>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading appointments...</div>
            ) : !stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No appointments currently scheduled. Click &quot;Schedule Appointment&quot; to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-slate-100">
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 font-medium">Patient</th>
                      <th className="pb-3 font-medium">Doctor</th>
                      <th className="pb-3 font-medium">Date & Time</th>
                      <th className="pb-3 font-medium">Reason</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {stats.recentAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-800">
                          {apt.patient_first_name} {apt.last_name}
                          <span className="block text-xs font-normal text-slate-400">
                            {apt.patient_number}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">
                          Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                          <span className="block text-xs text-slate-400">
                            {apt.specialty}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">
                          {apt.appointment_date}
                          <span className="block text-xs text-slate-400">
                            {apt.appointment_time}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          {apt.reason || "General visit"}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(apt.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quick Actions & Recent Patients */}
          <div className="space-y-6">
            <Card title="Quick Actions" description="Fast clinical workflows">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => navigate("/patients")}
                >
                  <UserPlus size={16} />
                  Register New Patient
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => navigate("/appointments")}
                >
                  <CalendarPlus size={16} />
                  Schedule Appointment
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => navigate("/medical-records")}
                >
                  <FilePlus2 size={16} />
                  Create Medical Record
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => navigate("/billing")}
                >
                  <CreditCard size={16} />
                  Create Patient Invoice
                </Button>
              </div>
            </Card>

            <Card
              title="Recent Patients"
              description="Recently admitted or registered"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/patients")}
                >
                  All
                  <ArrowUpRight size={14} />
                </Button>
              }
            >
              {!stats?.recentPatients || stats.recentPatients.length === 0 ? (
                <p className="text-xs text-slate-400">No patients registered yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentPatients.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.patient_number} • {p.gender || "N/A"}
                        </p>
                      </div>
                      <Badge variant="neutral">
                        {p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : "Age N/A"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;