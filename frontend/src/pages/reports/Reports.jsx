import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  Stethoscope,
  FlaskConical,
  Package,
  CalendarDays,
  Download,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import {
  dashboardService,
  departmentService,
  billingService,
  medicineService,
} from "../../services/hospitalServices";

function Reports() {
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const [statsRes, deptRes, invRes, stockRes] = await Promise.all([
          dashboardService.getStats(),
          departmentService.getAll(),
          billingService.getInvoices(),
          medicineService.getLowStock(),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (deptRes.success) setDepartments(deptRes.data);
        if (invRes.success) setInvoices(invRes.data);
        if (stockRes.success) setLowStock(stockRes.data);
      } catch (err) {
        console.error("Error loading analytics report:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const totalBilled = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0);
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "100.0";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Executive Analytics"
          title="Hospital Operational Reports"
          description="Consolidated clinical activity, financial metrics, and resource utilization reports."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Download size={15} />
              Export / Print Summary
            </Button>
          }
        />

        {/* Financial Highlights */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">${totalBilled.toFixed(2)}</p>
            <p className="mt-2 text-xs text-slate-400">Total billings generated</p>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Collected</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">${totalCollected.toFixed(2)}</p>
            <p className="mt-2 text-xs text-slate-400">Recorded patient payments</p>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">${totalOutstanding.toFixed(2)}</p>
            <p className="mt-2 text-xs text-slate-400">Pending receivables</p>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Ratio</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{collectionRate}%</p>
            <p className="mt-2 text-xs text-slate-400">Billing conversion efficiency</p>
          </Card>
        </div>

        {/* Clinical Operations Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Clinical Capacity & Operations" description="Live patient and physician census">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Active Registered Patients</p>
                    <p className="text-xs text-slate-400">All registered clinical files</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.totalPatients || 0}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Licensed Medical Doctors</p>
                    <p className="text-xs text-slate-400">Available specialists and physicians</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.totalDoctors || 0}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <FlaskConical size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Pending Lab Orders</p>
                    <p className="text-xs text-slate-400">Awaiting specimen result analysis</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.pendingLabOrders || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Low Stock Pharmacy Items</p>
                    <p className="text-xs text-slate-400">Below threshold reorder level</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-600">{lowStock.length}</span>
              </div>
            </div>
          </Card>

          {/* Department Breakdown */}
          <Card title="Departmental Coverage" description="Active clinical services and wings">
            <div className="space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                    <p className="text-xs text-slate-500">{dept.phone || "Internal wing"}</p>
                  </div>
                  <Badge variant={dept.is_active ? "success" : "neutral"}>
                    {dept.is_active ? "Operational" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Reports;