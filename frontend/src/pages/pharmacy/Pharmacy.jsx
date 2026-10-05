import { useState, useEffect, useCallback } from "react";
import {
  Pill,
  Search,
  Plus,
  CheckCircle,
  Clock,
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import {
  pharmacyService,
  prescriptionService,
  medicineService,
  patientService,
  doctorService,
} from "../../services/hospitalServices";

function Pharmacy() {
  const [activeTab, setActiveTab] = useState("prescriptions"); // "prescriptions" | "dispensing"
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensings, setDispensings] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dispense Form State
  const initialDispenseForm = {
    patient_id: "",
    prescription_id: "",
    medicine_id: "",
    quantity: 1,
    notes: "",
  };
  const [dispenseForm, setDispenseForm] = useState(initialDispenseForm);

  // New Prescription Form State
  const initialPrescriptionForm = {
    patient_id: "",
    doctor_id: "",
    diagnosis: "",
    notes: "",
    items: [
      {
        medicine_name: "",
        dosage: "500mg",
        frequency: "Three times daily",
        duration: "7 days",
        quantity: 21,
        instructions: "Take after meals with plenty of water",
      },
    ],
  };
  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rxRes, dispRes, medRes, patRes, docRes] = await Promise.all([
        prescriptionService.getAll(),
        pharmacyService.getAll(),
        medicineService.getAll(),
        patientService.getAll(),
        doctorService.getAll(),
      ]);

      if (rxRes.success) setPrescriptions(rxRes.data);
      if (dispRes.success) setDispensings(dispRes.data);
      if (medRes.success) setMedicines(medRes.data);
      if (patRes.success) setPatients(patRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch (err) {
      console.error("Error fetching pharmacy data:", err);
      setError("Failed to load pharmacy and dispensing records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDispenseModal = (presetRx = null) => {
    setDispenseForm({
      patient_id: presetRx?.patient_id || patients[0]?.id || "",
      prescription_id: presetRx?.id || "",
      medicine_id: medicines[0]?.id || "",
      quantity: 1,
      notes: presetRx ? `Dispensed for Rx ${presetRx.prescription_number || ""}` : "",
    });
    setError("");
    setSuccess("");
    setShowDispenseModal(true);
  };

  const handleOpenPrescriptionModal = () => {
    setPrescriptionForm({
      ...initialPrescriptionForm,
      patient_id: patients[0]?.id || "",
      doctor_id: doctors[0]?.id || "",
      items: [
        {
          medicine_name: medicines[0]?.name || "Amoxicillin",
          dosage: "500mg",
          frequency: "TDS",
          duration: "5 days",
          quantity: 15,
          instructions: "Take with water",
        },
      ],
    });
    setError("");
    setSuccess("");
    setShowPrescriptionModal(true);
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    if (!dispenseForm.patient_id || !dispenseForm.medicine_id) {
      setError("Please select both a patient and medicine.");
      return;
    }

    const selectedMed = medicines.find((m) => m.id === dispenseForm.medicine_id);
    if (selectedMed && selectedMed.quantity_in_stock < parseInt(dispenseForm.quantity, 10)) {
      setError(`Insufficient stock for ${selectedMed.name}! Available: ${selectedMed.quantity_in_stock}`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await pharmacyService.create({
        patient_id: dispenseForm.patient_id,
        prescription_id: dispenseForm.prescription_id || null,
        items: [
          {
            medicine_id: dispenseForm.medicine_id,
            quantity: parseInt(dispenseForm.quantity, 10),
            quantity_dispensed: parseInt(dispenseForm.quantity, 10),
            unit_price: selectedMed ? parseFloat(selectedMed.unit_price) : 0,
            instructions: "Take as prescribed",
          },
        ],
        notes: dispenseForm.notes,
      });

      if (res.success) {
        setSuccess("Medicine dispensed successfully and inventory stock updated atomically!");
        setShowDispenseModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to dispense medicine.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const randomRx = Math.floor(1000 + Math.random() * 9000);
      const res = await prescriptionService.create({
        ...prescriptionForm,
        prescription_number: `RX-${randomRx}`,
      });

      if (res.success) {
        setSuccess("Prescription written and queued for pharmacy dispensing!");
        setShowPrescriptionModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
      case "dispensed":
        return <Badge variant="success">Dispensed</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="warning">Active / Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Pharmacy Services"
          title="Prescriptions & Dispensing"
          description="Fulfill physician prescriptions, dispense medications, and maintain stock deduction logs."
          action={
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleOpenPrescriptionModal}>
                <Plus size={16} />
                New Prescription
              </Button>
              <Button onClick={() => handleOpenDispenseModal()}>
                <Pill size={16} />
                Dispense Medicine
              </Button>
            </div>
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

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
              activeTab === "prescriptions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Prescriptions Queue ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("dispensing")}
            className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
              activeTab === "dispensing"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Dispensed Logs ({dispensings.length})
          </button>
        </div>

        {/* Tab 1: Prescriptions */}
        {activeTab === "prescriptions" && (
          <Card>
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading prescriptions...</div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 text-center">
                <Pill size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No prescriptions found</p>
                <p className="text-xs text-slate-400 mt-1">Physician orders will appear here when created.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">{rx.prescription_number}</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {rx.patient_first_name} {rx.patient_last_name} ({rx.patient_number})
                          </span>
                          {getStatusBadge(rx.status)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Prescribed by Dr. {rx.doctor_first_name} {rx.doctor_last_name} • {new Date(rx.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {rx.status === "active" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenDispenseModal(rx)}
                        >
                          <Pill size={14} />
                          Dispense
                        </Button>
                      )}
                    </div>

                    {/* Prescription items */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Prescribed Medications</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {rx.items?.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-slate-800">{item.medicine_name}</span>
                              <Badge variant="neutral">{item.quantity} units</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Dosage: {item.dosage} • Frequency: {item.frequency} • {item.duration}
                            </p>
                            {item.instructions && (
                              <p className="text-xs text-slate-400 italic mt-0.5">
                                Instructions: {item.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Dispensed Logs */}
        {activeTab === "dispensing" && (
          <Card>
            {dispensings.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No medication dispensing logs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-3 font-medium">Patient</th>
                      <th className="pb-3 font-medium">Dispensed By</th>
                      <th className="pb-3 font-medium">Items Dispensed</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispensings.map((disp) => (
                      <tr key={disp.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-900">
                          {disp.patient_first_name} {disp.patient_last_name}
                          <span className="block text-xs font-normal text-slate-400">
                            {disp.patient_number}
                          </span>
                        </td>
                        <td className="py-3 text-slate-700 text-xs">
                          {disp.dispenser_first_name ? `${disp.dispenser_first_name} ${disp.dispenser_last_name}` : "Pharmacist"}
                        </td>
                        <td className="py-3 text-xs text-slate-800">
                          {disp.items?.map((it) => (
                            <div key={it.id} className="font-medium">
                              {it.medicine_name} — {it.quantity_dispensed ?? it.quantity} {it.unit || "units"}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 text-slate-500 text-xs">
                          {new Date(disp.dispensing_date).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <Badge variant="success">
                            <ShieldCheck size={12} className="mr-1 inline" /> Dispensed
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Dispense Modal */}
        {showDispenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Dispense Medication</h3>
                  <p className="text-xs text-slate-500">Atomic inventory deduction with verification.</p>
                </div>
                <button
                  onClick={() => setShowDispenseModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDispenseSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                  <select
                    required
                    value={dispenseForm.patient_id}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, patient_id: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine to Dispense *</label>
                  <select
                    required
                    value={dispenseForm.medicine_id}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, medicine_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.quantity_in_stock <= 0}>
                        {m.name} — {m.quantity_in_stock} {m.unit} in stock (${parseFloat(m.unit_price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Dispense *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dispenseForm.quantity}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacist Dispensing Notes</label>
                  <textarea
                    rows={2}
                    value={dispenseForm.notes}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                    placeholder="Patient verified, allergy check cleared..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowDispenseModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Fulfill & Dispense
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Prescription Modal */}
        {showPrescriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Write New Prescription</h3>
                  <p className="text-xs text-slate-500">Author clinical prescription for pharmacy fulfillment.</p>
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePrescriptionSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                    <select
                      required
                      value={prescriptionForm.patient_id}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patient_id: e.target.value })}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribing Doctor *</label>
                    <select
                      required
                      value={prescriptionForm.doctor_id}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctor_id: e.target.value })}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={prescriptionForm.items[0]?.medicine_name}
                    onChange={(e) => {
                      const updated = [...prescriptionForm.items];
                      updated[0].medicine_name = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, items: updated });
                    }}
                    placeholder="e.g. Paracetamol"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={prescriptionForm.items[0]?.dosage}
                      onChange={(e) => {
                        const updated = [...prescriptionForm.items];
                        updated[0].dosage = e.target.value;
                        setPrescriptionForm({ ...prescriptionForm, items: updated });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={prescriptionForm.items[0]?.frequency}
                      onChange={(e) => {
                        const updated = [...prescriptionForm.items];
                        updated[0].frequency = e.target.value;
                        setPrescriptionForm({ ...prescriptionForm, items: updated });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={prescriptionForm.items[0]?.quantity}
                      onChange={(e) => {
                        const updated = [...prescriptionForm.items];
                        updated[0].quantity = parseInt(e.target.value, 10);
                        setPrescriptionForm({ ...prescriptionForm, items: updated });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions for Patient</label>
                  <input
                    type="text"
                    value={prescriptionForm.items[0]?.instructions}
                    onChange={(e) => {
                      const updated = [...prescriptionForm.items];
                      updated[0].instructions = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, items: updated });
                    }}
                    placeholder="Take after food with water..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowPrescriptionModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Authorize Prescription
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

export default Pharmacy;