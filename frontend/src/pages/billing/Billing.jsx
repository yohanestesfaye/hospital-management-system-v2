import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  Plus,
  CreditCard,
  DollarSign,
  CheckCircle,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import {
  billingService,
  patientService,
} from "../../services/hospitalServices";

function Billing() {
  const [activeTab, setActiveTab] = useState("invoices"); // "invoices" | "payments"
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Invoice Form
  const initialInvoiceForm = {
    patient_id: "",
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    tax_amount: "0.00",
    discount_amount: "0.00",
    notes: "",
    items: [
      {
        item_type: "consultation",
        description: "Specialist Physician Consultation",
        quantity: 1,
        unit_price: "150.00",
      },
    ],
  };
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);

  // Record Payment Form
  const initialPaymentForm = {
    amount: "",
    payment_method: "cash",
    transaction_reference: "",
    notes: "",
  };
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [invRes, payRes, patRes] = await Promise.all([
        billingService.getInvoices(statusFilter ? { status: statusFilter } : {}),
        billingService.getPayments(),
        patientService.getAll(),
      ]);

      if (invRes.success) setInvoices(invRes.data);
      if (payRes.success) setPayments(payRes.data);
      if (patRes.success) setPatients(patRes.data);
    } catch (err) {
      console.error("Error loading billing data:", err);
      setError("Failed to load invoices and payments.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenInvoiceModal = () => {
    setInvoiceForm({
      ...initialInvoiceForm,
      patient_id: patients[0]?.id || "",
    });
    setError("");
    setSuccess("");
    setShowInvoiceModal(true);
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const randomTx = Math.floor(100000 + Math.random() * 900000);
    setPaymentForm({
      amount: invoice.balance_due.toString(),
      payment_method: "cash",
      transaction_reference: `TX-${randomTx}`,
      notes: `Settlement for ${invoice.invoice_number}`,
    });
    setError("");
    setShowPaymentModal(true);
  };

  const handleAddLineItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_type: "service",
          description: "Hospital Care & Service",
          quantity: 1,
          unit_price: "50.00",
        },
      ],
    }));
  };

  const handleRemoveLineItem = (index) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    setInvoiceForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const calculateSubtotal = () => {
    return invoiceForm.items.reduce((sum, item) => {
      return sum + (parseInt(item.quantity, 10) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.patient_id) {
      setError("Please select a patient.");
      return;
    }
    if (invoiceForm.items.length === 0) {
      setError("Please add at least one billable line item.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const randomInv = Math.floor(1000 + Math.random() * 9000);
      const res = await billingService.createInvoice({
        invoice_number: `INV-${randomInv}`,
        patient_id: invoiceForm.patient_id,
        due_date: invoiceForm.due_date,
        tax_amount: parseFloat(invoiceForm.tax_amount || 0),
        discount_amount: parseFloat(invoiceForm.discount_amount || 0),
        notes: invoiceForm.notes,
        items: invoiceForm.items.map((it) => ({
          ...it,
          quantity: parseInt(it.quantity, 10),
          unit_price: parseFloat(it.unit_price),
        })),
      });

      if (res.success) {
        setSuccess("Patient invoice generated successfully!");
        setShowInvoiceModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const payAmt = parseFloat(paymentForm.amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }
    if (payAmt > parseFloat(selectedInvoice.balance_due)) {
      setError(`Payment cannot exceed outstanding balance ($${selectedInvoice.balance_due})`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await billingService.recordPayment({
        invoice_id: selectedInvoice.id,
        amount: payAmt,
        payment_method: paymentForm.payment_method,
        transaction_reference: paymentForm.transaction_reference,
        notes: paymentForm.notes,
      });

      if (res.success) {
        setSuccess(`Payment of $${payAmt.toFixed(2)} recorded and balance updated!`);
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const getInvoiceStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Fully Paid</Badge>;
      case "partially_paid":
        return <Badge variant="info">Partially Paid</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="warning">Unpaid</Badge>;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const patName = `${inv.patient_first_name} ${inv.patient_last_name}`.toLowerCase();
    return (
      patName.includes(q) ||
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.patient_number && inv.patient_number.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Financial Operations"
          title="Billing & Patient Accounts"
          description="Issue invoices, compute insurance/taxes, record settlements, and track balances."
          action={
            <Button onClick={handleOpenInvoiceModal}>
              <Plus size={16} />
              Create Invoice
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

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
              activeTab === "invoices"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
              activeTab === "payments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Payment Receipts ({payments.length})
          </button>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === "invoices" && (
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
                    placeholder="Search invoice #, patient..."
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
                  <option value="">All Payment Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Fully Paid</option>
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filteredInvoices.length}</span> invoice(s)
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No invoices found</p>
                <p className="text-xs text-slate-400 mt-1">Generate a patient invoice by clicking &quot;Create Invoice&quot;.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-3 font-medium">Invoice #</th>
                      <th className="pb-3 font-medium">Patient</th>
                      <th className="pb-3 font-medium">Due Date</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Paid</th>
                      <th className="pb-3 font-medium">Balance Due</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono font-bold text-blue-700 text-xs">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 font-medium text-slate-900">
                          {inv.patient_first_name} {inv.patient_last_name}
                          <span className="block text-xs font-normal text-slate-400">
                            {inv.patient_number}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          {inv.due_date ? inv.due_date.substring(0, 10) : "—"}
                        </td>
                        <td className="py-3 font-semibold text-slate-800">
                          ${parseFloat(inv.total_amount).toFixed(2)}
                        </td>
                        <td className="py-3 font-semibold text-emerald-600">
                          ${parseFloat(inv.paid_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 font-bold text-rose-600">
                          ${parseFloat(inv.balance_due).toFixed(2)}
                        </td>
                        <td className="py-3">
                          {getInvoiceStatusBadge(inv.status)}
                        </td>
                        <td className="py-3 text-right">
                          {parseFloat(inv.balance_due) > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPaymentModal(inv)}
                            >
                              <CreditCard size={14} />
                              Pay
                            </Button>
                          ) : (
                            <Badge variant="success">Settled</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Payments */}
        {activeTab === "payments" && (
          <Card>
            {payments.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-3 font-medium">Receipt #</th>
                      <th className="pb-3 font-medium">Invoice #</th>
                      <th className="pb-3 font-medium">Patient</th>
                      <th className="pb-3 font-medium">Method</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono text-xs text-slate-600">
                          {p.payment_number}
                        </td>
                        <td className="py-3 font-mono text-xs text-blue-700 font-semibold">
                          {p.invoice_number}
                        </td>
                        <td className="py-3 font-medium text-slate-900">
                          {p.patient_first_name} {p.patient_last_name}
                        </td>
                        <td className="py-3 capitalize text-slate-600 text-xs">
                          <Badge variant="neutral">{p.payment_method.replace("_", " ")}</Badge>
                        </td>
                        <td className="py-3 font-bold text-emerald-600">
                          ${parseFloat(p.amount).toFixed(2)}
                        </td>
                        <td className="py-3 text-slate-400 text-xs">
                          {new Date(p.payment_date).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Create Invoice Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Patient Invoice</h3>
                  <p className="text-xs text-slate-500">Bill clinical consultations, lab tests, and hospital charges.</p>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                    <select
                      required
                      value={invoiceForm.patient_id}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, patient_id: e.target.value })}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
                    <input
                      type="date"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700">Line Items & Services *</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddLineItem}
                    >
                      <Plus size={14} /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoiceForm.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                          className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                        />
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                          title="Quantity"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(index, "unit_price", e.target.value)}
                          className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                          title="Unit Price"
                        />
                        {invoiceForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Discount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.discount_amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_amount: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tax / VAT ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.tax_amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_amount: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="text-right text-sm">
                  <span className="text-slate-500">Estimated Total: </span>
                  <span className="text-lg font-bold text-slate-900">
                    ${(
                      calculateSubtotal() +
                      parseFloat(invoiceForm.tax_amount || 0) -
                      parseFloat(invoiceForm.discount_amount || 0)
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowInvoiceModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Issue Invoice
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Settlement Payment</h3>
                  <p className="text-xs text-slate-500">{selectedInvoice.invoice_number} • Balance: ${selectedInvoice.balance_due}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Pay ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.balance_due}
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="insurance">Insurance Coverage</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={paymentForm.transaction_reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Confirm Payment
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

export default Billing;