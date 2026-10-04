import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import {
  medicalRecordService,
  patientService,
  doctorService,
} from "../../services/hospitalServices";

function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    patient_id: "",
    doctor_id: "",
    diagnosis: "",
    symptoms: "",
    treatment_plan: "",
    notes: "",
    record_date: new Date().toISOString().split("T")[0],
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchRecordsAndDropdowns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recRes, patRes, docRes] = await Promise.all([
        medicalRecordService.getAll(),
        patientService.getAll(),
        doctorService.getAll(),
      ]);

      if (recRes.success) setRecords(recRes.data);
      if (patRes.success) setPatients(patRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch (err) {
      console.error("Error loading medical records:", err);
      setError("Failed to load medical records from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordsAndDropdowns();
  }, [fetchRecordsAndDropdowns]);

  const handleOpenAddModal = () => {
    setFormData({
      ...initialForm,
      patient_id: patients[0]?.id || "",
      doctor_id: doctors[0]?.id || "",
    });
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.doctor_id) {
      setError("Please select both a patient and an attending doctor.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await medicalRecordService.create(formData);
      if (res.success) {
        setSuccess("Medical record saved and linked to patient file!");
        setShowAddModal(false);
        fetchRecordsAndDropdowns();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create medical record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;
    try {
      const res = await medicalRecordService.delete(id);
      if (res.success) {
        setSuccess("Medical record deleted.");
        fetchRecordsAndDropdowns();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete record.");
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const patName = `${r.patient_first_name} ${r.patient_last_name}`.toLowerCase();
    return (
      patName.includes(q) ||
      (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
      (r.symptoms && r.symptoms.toLowerCase().includes(q)) ||
      (r.patient_number && r.patient_number.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Clinical Documentation"
          title="Medical Records"
          description="Patient diagnoses, symptoms history, consultations, and treatment plans."
          action={
            <Button onClick={handleOpenAddModal}>
              <Plus size={16} />
              New Medical Record
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
          {/* Search bar */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search diagnosis, patient, symptoms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{filteredRecords.length}</span> record(s)
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading medical records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No medical records found</p>
              <p className="text-xs text-slate-400 mt-1">
                Document clinical findings by clicking &quot;New Medical Record&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Attending Doctor</th>
                    <th className="pb-3 font-medium">Diagnosis</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Treatment Plan</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-900">
                        {rec.patient_first_name} {rec.patient_last_name}
                        <span className="block text-xs font-normal text-slate-400">
                          {rec.patient_number}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">
                        Dr. {rec.doctor_first_name} {rec.doctor_last_name}
                        <span className="block text-xs text-slate-400">
                          {rec.specialty}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-blue-800">
                        {rec.diagnosis || "Undiagnosed"}
                      </td>
                      <td className="py-3 text-slate-600 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {rec.record_date}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 text-xs max-w-xs truncate">
                        {rec.treatment_plan || "Observation"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedRecord(rec);
                              setShowDetailModal(true);
                            }}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="View Record"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* New Medical Record Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">New Medical Record</h3>
                  <p className="text-xs text-slate-500">Document clinical consultation, diagnosis, and prescription notes.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                    <select
                      required
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="">Select Patient</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} ({p.patient_number})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor *</label>
                    <select
                      required
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.first_name} {d.last_name} ({d.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis *</label>
                    <input
                      type="text"
                      required
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      placeholder="e.g. Acute Bronchitis, Type 2 Diabetes"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Record Date</label>
                    <input
                      type="date"
                      value={formData.record_date}
                      onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms Reported</label>
                  <textarea
                    rows={2}
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="Dry cough for 3 days, mild fever (38.2C), chest tightness..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan & Medication</label>
                  <textarea
                    rows={2}
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                    placeholder="Amoxicillin 500mg TDS x 7 days, rest, hydrate..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Patient instructed to return in 10 days if symptoms persist."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Save Medical Record
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Detail Modal */}
        {showDetailModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedRecord.patient_first_name} {selectedRecord.patient_last_name}
                  </h3>
                  <p className="text-xs text-slate-500">Record Date: {selectedRecord.record_date}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 block mb-1">
                    Primary Diagnosis
                  </span>
                  <p className="text-base font-bold text-blue-950">
                    {selectedRecord.diagnosis || "No diagnosis logged"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Attending Physician
                  </span>
                  <p className="text-slate-800 font-medium">
                    Dr. {selectedRecord.doctor_first_name} {selectedRecord.doctor_last_name} ({selectedRecord.specialty})
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Symptoms
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedRecord.symptoms || "None recorded"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Treatment Plan
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedRecord.treatment_plan || "None recorded"}
                  </p>
                </div>

                {selectedRecord.notes && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Doctor Notes
                    </span>
                    <p className="text-slate-600 text-xs italic">
                      &quot;{selectedRecord.notes}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowDetailModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MedicalRecords;