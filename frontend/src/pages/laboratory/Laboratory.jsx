import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  Search,
  Plus,
  CheckCircle,
  Clock,
  X,
  FileCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import {
  labService,
  patientService,
  doctorService,
} from "../../services/hospitalServices";

function Laboratory() {
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "catalog"
  const [orders, setOrders] = useState([]);
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Order Form State
  const initialOrderForm = {
    patient_id: "",
    doctor_id: "",
    priority: "normal",
    clinical_notes: "",
    selected_test_ids: [],
  };
  const [orderForm, setOrderForm] = useState(initialOrderForm);

  // New Test Form State
  const initialTestForm = {
    name: "",
    code: "",
    category: "Hematology",
    description: "",
    price: "45.00",
    normal_range: "",
  };
  const [testForm, setTestForm] = useState(initialTestForm);

  // Result Form State
  const [resultData, setResultData] = useState({
    result_value: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRes, testRes, patRes, docRes] = await Promise.all([
        labService.getOrders(),
        labService.getTests(),
        patientService.getAll(),
        doctorService.getAll(),
      ]);

      if (orderRes.success) setOrders(orderRes.data);
      if (testRes.success) setTests(testRes.data);
      if (patRes.success) setPatients(patRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch (err) {
      console.error("Error fetching lab data:", err);
      setError("Failed to load laboratory data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenOrderModal = () => {
    setOrderForm({
      ...initialOrderForm,
      patient_id: patients[0]?.id || "",
      doctor_id: doctors[0]?.id || "",
      selected_test_ids: tests.length > 0 ? [tests[0].id] : [],
    });
    setError("");
    setSuccess("");
    setShowOrderModal(true);
  };

  const handleTestSelection = (testId) => {
    setOrderForm((prev) => {
      const exists = prev.selected_test_ids.includes(testId);
      return {
        ...prev,
        selected_test_ids: exists
          ? prev.selected_test_ids.filter((id) => id !== testId)
          : [...prev.selected_test_ids, testId],
      };
    });
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.patient_id || !orderForm.doctor_id) {
      setError("Please select both a patient and requesting doctor.");
      return;
    }
    if (orderForm.selected_test_ids.length === 0) {
      setError("Please select at least one laboratory test to order.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const randomOrd = Math.floor(1000 + Math.random() * 9000);
      const res = await labService.createOrder({
        order_number: `LAB-${randomOrd}`,
        patient_id: orderForm.patient_id,
        doctor_id: orderForm.doctor_id,
        priority: orderForm.priority,
        clinical_notes: orderForm.clinical_notes,
        test_ids: orderForm.selected_test_ids,
      });

      if (res.success) {
        setSuccess("Laboratory requisition order created successfully!");
        setShowOrderModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lab requisition order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await labService.createTest({
        ...testForm,
        price: parseFloat(testForm.price),
      });

      if (res.success) {
        setSuccess(`Lab test "${testForm.name}" added to diagnostic catalog.`);
        setShowTestModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add test to catalog.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResultModal = (item, order) => {
    setSelectedItem({ ...item, order_number: order.order_number, patient_name: `${order.patient_first_name} ${order.patient_last_name}` });
    setResultData({
      result_value: item.result_value || "",
      notes: item.notes || "",
    });
    setError("");
    setShowResultModal(true);
  };

  const handleSaveResult = async (e) => {
    e.preventDefault();
    if (!resultData.result_value.trim()) {
      setError("Please enter the diagnostic result value.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await labService.updateItemResult(selectedItem.id, resultData);
      if (res.success) {
        setSuccess(`Test result recorded for ${selectedItem.test_name}.`);
        setShowResultModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save test result.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "in_progress":
        return <Badge variant="info">In Progress</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Diagnostic Services"
          title="Laboratory & Pathology"
          description="Manage lab test requisitions, record specimen findings, and maintain diagnostic catalog."
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTestForm(initialTestForm);
                  setShowTestModal(true);
                }}
              >
                <Plus size={16} />
                Add Test to Catalog
              </Button>
              <Button onClick={handleOpenOrderModal}>
                <FlaskConical size={16} />
                Order Lab Test
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
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
              activeTab === "orders"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Requisition Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
              activeTab === "catalog"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Diagnostic Test Catalog ({tests.length})
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <Card>
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <FlaskConical size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No laboratory orders recorded</p>
                <p className="text-xs text-slate-400 mt-1">Requisition a lab test by clicking &quot;Order Lab Test&quot;.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">{ord.order_number}</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {ord.patient_first_name} {ord.patient_last_name} ({ord.patient_number})
                          </span>
                          {getStatusBadge(ord.status)}
                          {ord.priority === "urgent" && (
                            <Badge variant="danger">URGENT</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Requested by Dr. {ord.doctor_first_name} {ord.doctor_last_name} • {new Date(ord.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {ord.clinical_notes && (
                        <p className="text-xs text-slate-500 max-w-sm italic">
                          &quot;{ord.clinical_notes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Order items */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tests Requested</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ord.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-800">{item.test_name}</p>
                              {item.result_value ? (
                                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                                  Result: {item.result_value}
                                </p>
                              ) : (
                                <p className="text-xs text-amber-600 mt-0.5">Awaiting result analysis</p>
                              )}
                            </div>

                            <div>
                              {item.result_value ? (
                                <Badge variant="success">
                                  <CheckCircle size={11} className="mr-1 inline" /> Logged
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenResultModal(item, ord)}
                                >
                                  <FileCheck size={14} />
                                  Enter Result
                                </Button>
                              )}
                            </div>
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

        {/* Tab 2: Catalog */}
        {activeTab === "catalog" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Test Name</th>
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Normal / Reference Range</th>
                    <th className="pb-3 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tests.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-900">
                        {t.name}
                        {t.description && (
                          <span className="block text-xs font-normal text-slate-400">
                            {t.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-xs text-blue-700 font-semibold">
                        {t.code}
                      </td>
                      <td className="py-3 text-slate-600 text-xs">
                        <Badge variant="neutral">{t.category || "General"}</Badge>
                      </td>
                      <td className="py-3 text-xs text-slate-600 font-mono">
                        {t.normal_range || "—"}
                      </td>
                      <td className="py-3 text-sm font-semibold text-emerald-600">
                        ${parseFloat(t.price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Lab Requisition Order</h3>
                  <p className="text-xs text-slate-500">Select tests, priority, and clinical indications.</p>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                    <select
                      required
                      value={orderForm.patient_id}
                      onChange={(e) => setOrderForm({ ...orderForm, patient_id: e.target.value })}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ordering Doctor *</label>
                    <select
                      required
                      value={orderForm.doctor_id}
                      onChange={(e) => setOrderForm({ ...orderForm, doctor_id: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT (Emergency)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Tests to Perform ({orderForm.selected_test_ids.length} selected) *
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-slate-200 p-3 bg-slate-50">
                    {tests.map((test) => (
                      <label
                        key={test.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:bg-blue-50/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={orderForm.selected_test_ids.includes(test.id)}
                            onChange={() => handleTestSelection(test.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-800">{test.name}</span>
                          <span className="font-mono text-xs text-slate-400">({test.code})</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">${parseFloat(test.price || 0).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indications / Notes</label>
                  <textarea
                    rows={2}
                    value={orderForm.clinical_notes}
                    onChange={(e) => setOrderForm({ ...orderForm, clinical_notes: e.target.value })}
                    placeholder="Rule out infection, routine checkup..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowOrderModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Issue Lab Order
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Result Modal */}
        {showResultModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Test Result</h3>
                  <p className="text-xs text-slate-500">{selectedItem.test_name} • {selectedItem.patient_name}</p>
                </div>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveResult} className="mt-5 space-y-4">
                {selectedItem.normal_range && (
                  <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                    <span className="font-semibold">Normal Reference Range:</span> {selectedItem.normal_range}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observed Diagnostic Value *
                  </label>
                  <input
                    type="text"
                    required
                    value={resultData.result_value}
                    onChange={(e) => setResultData({ ...resultData, result_value: e.target.value })}
                    placeholder="e.g. 14.5 g/dL, Negative, 98 mg/dL"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pathologist / Technician Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={resultData.notes}
                    onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                    placeholder="Sample verified, within normal parameters..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowResultModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Save & Complete Test
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Test to Catalog Modal */}
        {showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Test to Catalog</h3>
                  <p className="text-xs text-slate-500">Define laboratory test specifications and fee.</p>
                </div>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTest} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    placeholder="e.g. Thyroid Stimulating Hormone (TSH)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      value={testForm.code}
                      onChange={(e) => setTestForm({ ...testForm, code: e.target.value })}
                      placeholder="e.g. TSH-01"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={testForm.category}
                      onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={testForm.price}
                      onChange={(e) => setTestForm({ ...testForm, price: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Normal Range</label>
                    <input
                      type="text"
                      value={testForm.normal_range}
                      onChange={(e) => setTestForm({ ...testForm, normal_range: e.target.value })}
                      placeholder="e.g. 0.4 - 4.0 mIU/L"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowTestModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Add to Catalog
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

export default Laboratory;