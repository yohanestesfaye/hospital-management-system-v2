import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Search,
  CalendarPlus,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import {
  appointmentService,
  patientService,
  doctorService,
} from "../../services/hospitalServices";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const initialForm = {
    patient_id: "",
    doctor_id: "",
    appointment_date: defaultDate,
    appointment_time: "09:00",
    reason: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [aptRes, patRes, docRes] = await Promise.all([
        appointmentService.getAll(statusFilter ? { status: statusFilter } : {}),
        patientService.getAll(),
        doctorService.getAll(),
      ]);

      if (aptRes.success) setAppointments(aptRes.data);
      if (patRes.success) setPatients(patRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch (err) {
      console.error("Error fetching appointments data:", err);
      setError("Failed to load appointments schedule.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenScheduleModal = () => {
    setFormData({
      ...initialForm,
      patient_id: patients[0]?.id || "",
      doctor_id: doctors[0]?.id || "",
    });
    setError("");
    setSuccess("");
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id) {
      setError("Please select both a patient and a doctor.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await appointmentService.create(formData);
      if (res.success) {
        setSuccess("Appointment booked and scheduled successfully!");
        setShowScheduleModal(false);
        fetchAllData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await appointmentService.update(id, { status: newStatus });
      if (res.success) {
        setSuccess(`Appointment marked as ${newStatus}.`);
        fetchAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update appointment status.");
    }
  };

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

  const filteredAppointments = appointments.filter((apt) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const patName = `${apt.patient_first_name} ${apt.patient_last_name}`.toLowerCase();
    const docName = `${apt.doctor_first_name} ${apt.doctor_last_name}`.toLowerCase();
    return (
      patName.includes(q) ||
      docName.includes(q) ||
      (apt.patient_number && apt.patient_number.toLowerCase().includes(q)) ||
      (apt.reason && apt.reason.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Clinical Scheduling"
          title="Appointments Management"
          description="Schedule patient consultations, monitor daily queues, and track visitation status."
          action={
            <Button onClick={handleOpenScheduleModal}>
              <CalendarPlus size={16} />
              Schedule Appointment
            </Button>
          }
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <Card>
          {/* Controls */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search patient, doctor, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{filteredAppointments.length}</span> appointment(s)
            </div>
          </div>

          {/* Appointments Table */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading appointments schedule...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No appointments found</p>
              <p className="text-xs text-slate-400 mt-1">
                Book an appointment by clicking &quot;Schedule Appointment&quot; above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Date & Time</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Reason</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-900">
                        {apt.patient_first_name} {apt.patient_last_name}
                        <span className="block text-xs font-normal text-slate-400">
                          {apt.patient_number}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">
                        Dr. {apt.doctor_first_name} {apt.doctor_last_name}
                        <span className="block text-xs text-slate-400">
                          {apt.specialty}
                        </span>
                      </td>
                      <td className="py-3 text-slate-800">
                        <div className="font-medium text-slate-900">{apt.appointment_date}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} /> {apt.appointment_time}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 text-xs">
                        {apt.department_name || "—"}
                      </td>
                      <td className="py-3 text-slate-600 text-xs max-w-xs truncate">
                        {apt.reason || "General Consultation"}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {apt.status === "scheduled" && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, "confirmed")}
                              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                              title="Confirm Appointment"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {(apt.status === "scheduled" || apt.status === "confirmed") && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, "completed")}
                              className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition"
                              title="Mark as Completed"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {apt.status !== "cancelled" && apt.status !== "completed" && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, "cancelled")}
                              className="rounded p-1.5 text-red-500 hover:bg-red-50 transition"
                              title="Cancel Appointment"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Schedule Appointment Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Schedule Appointment</h3>
                  <p className="text-xs text-slate-500">Book clinical consultation with an active doctor.</p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                  >
                    <option value="">Choose Patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({p.patient_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor *</label>
                  <select
                    required
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                  >
                    <option value="">Choose Doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.first_name} {d.last_name} — {d.specialty} ({d.department_name || "General"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. Annual physical checkup, persistent chest cough"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Preparation instructions, vital history..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowScheduleModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Confirm & Book Appointment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Appointments;