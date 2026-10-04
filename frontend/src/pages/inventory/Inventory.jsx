import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { medicineService } from "../../services/hospitalServices";

function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: "",
    generic_name: "",
    category: "Antibiotics",
    manufacturer: "",
    unit: "tablets",
    quantity_in_stock: "100",
    reorder_level: "20",
    unit_price: "5.00",
    batch_number: "",
    expiry_date: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = lowStockOnly
        ? await medicineService.getLowStock()
        : await medicineService.getAll(search ? { search } : {});

      if (res.success) setMedicines(res.data);
    } catch (err) {
      console.error("Error fetching medicine stock:", err);
      setError("Failed to load inventory from server.");
    } finally {
      setLoading(false);
    }
  }, [search, lowStockOnly]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleOpenAddModal = () => {
    const randomBatch = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      ...initialForm,
      batch_number: `BAT-${randomBatch}`,
    });
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (med) => {
    setSelectedMedicine(med);
    setFormData({
      name: med.name || "",
      generic_name: med.generic_name || "",
      category: med.category || "",
      manufacturer: med.manufacturer || "",
      unit: med.unit || "unit",
      quantity_in_stock: med.quantity_in_stock.toString(),
      reorder_level: med.reorder_level.toString(),
      unit_price: med.unit_price.toString(),
      batch_number: med.batch_number || "",
      expiry_date: med.expiry_date ? med.expiry_date.substring(0, 10) : "",
    });
    setError("");
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await medicineService.create({
        ...formData,
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10),
        reorder_level: parseInt(formData.reorder_level, 10),
        unit_price: parseFloat(formData.unit_price),
      });
      if (res.success) {
        setSuccess(`Medicine "${formData.name}" added to inventory.`);
        setShowAddModal(false);
        fetchMedicines();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add medicine.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await medicineService.update(selectedMedicine.id, {
        ...formData,
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10),
        reorder_level: parseInt(formData.reorder_level, 10),
        unit_price: parseFloat(formData.unit_price),
      });
      if (res.success) {
        setSuccess(`Updated "${formData.name}" stock level.`);
        setShowEditModal(false);
        fetchMedicines();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update medicine.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name} from pharmacy inventory?`)) return;
    try {
      const res = await medicineService.delete(id);
      if (res.success) {
        setSuccess(`Medicine "${name}" removed from inventory.`);
        fetchMedicines();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove medicine.");
    }
  };

  const lowStockCount = medicines.filter((m) => m.quantity_in_stock <= m.reorder_level).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Pharmacy Operations"
          title="Medicine Inventory"
          description="Stock levels, reorder alerts, drug batches, and unit pricing catalog."
          action={
            <Button onClick={handleOpenAddModal}>
              <Plus size={16} />
              Add Medicine
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
                  placeholder="Search medicine, generic name, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  lowStockOnly
                    ? "bg-red-600 text-white"
                    : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                <AlertTriangle size={14} />
                Low Stock Only ({lowStockCount})
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{medicines.length}</span> item(s)
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading inventory stock...
            </div>
          ) : medicines.length === 0 ? (
            <div className="py-12 text-center">
              <Package size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No medicines found</p>
              <p className="text-xs text-slate-400 mt-1">Add medications to inventory by clicking &quot;Add Medicine&quot;.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Medicine</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Stock / Status</th>
                    <th className="pb-3 font-medium">Reorder Level</th>
                    <th className="pb-3 font-medium">Unit Price</th>
                    <th className="pb-3 font-medium">Batch / Expiry</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((med) => {
                    const isLow = med.quantity_in_stock <= med.reorder_level;
                    return (
                      <tr key={med.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-900">
                          {med.name}
                          {med.generic_name && (
                            <span className="block text-xs font-normal text-slate-400">
                              {med.generic_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          <Badge variant="neutral">{med.category || "General"}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {med.quantity_in_stock}
                            </span>
                            <span className="text-xs text-slate-400">{med.unit}</span>
                            {isLow && (
                              <Badge variant="danger">
                                <AlertTriangle size={11} className="mr-1 inline" /> Low
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          {med.reorder_level} {med.unit}
                        </td>
                        <td className="py-3 font-semibold text-emerald-600 text-xs">
                          <div className="flex items-center">
                            <DollarSign size={13} />
                            {parseFloat(med.unit_price).toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3 text-xs text-slate-500">
                          <span className="font-mono block">{med.batch_number || "—"}</span>
                          {med.expiry_date && (
                            <span className="flex items-center gap-1 text-slate-400 mt-0.5">
                              <Calendar size={11} /> {med.expiry_date.substring(0, 10)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(med)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition"
                              title="Update Stock"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(med.id, med.name)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition"
                              title="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add Medicine Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Medicine to Inventory</h3>
                  <p className="text-xs text-slate-500">Catalog medication details, initial stock, and reorder levels.</p>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Amoxicillin"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name</label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      placeholder="e.g. Amoxicillin Trihydrate"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Antibiotics"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                    <input
                      type="text"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g. tablets, vials, ml"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity in Stock *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity_in_stock}
                      onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Alert Level *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Add to Inventory
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Medicine Modal */}
        {showEditModal && selectedMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Update Stock: {selectedMedicine.name}</h3>
                  <p className="text-xs text-slate-500">Replenish stock count and modify inventory pricing.</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity in Stock *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity_in_stock}
                      onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Update Inventory
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

export default Inventory;