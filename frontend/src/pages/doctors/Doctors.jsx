import { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  Award,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { doctorService, departmentService } from "../../services/hospitalServices";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    license_number: "",
    specialty: "",
    consultation_fee: "150.00",
    years_of_experience: "5",
    is_available: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchDoctorsAndDepts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [docRes, deptRes] = await Promise.all([
        doctorService.getAll(departmentFilter ? { department_id: departmentFilter } : {}),
        departmentService.getAll(),
      ]);

      if (docRes.success) {
        setDoctors(docRes.data);
      }
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Failed to load doctor directory.");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    fetchDoctorsAndDepts();
  }, [fetchDoctorsAndDepts]);

  const handleOpenAddModal = () => {
    const randomLic = Math.floor(10000 + Math.random() * 90000);
    setFormData({
      ...initialForm,
      department_id: departments[0]?.id || "",
      license_number: `MED-${randomLic}`,
    });
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (doc) => {
    setSelectedDoctor(doc);
    setFormData({
      first_name: doc.first_name || "",
      last_name: doc.last_name || "",
      email: doc.email || "",
      phone: doc.phone || "",
      department_id: doc.department_id || "",
      license_number: doc.license_number || "",
      specialty: doc.specialty || "",
      consultation_fee: doc.consultation_fee || "0",
      years_of_experience: doc.years_of_experience || "0",
      is_available: doc.is_available,
    });
    setError("");
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    try {
      const res = await doctorService.create({
        ...formData,
        consultation_fee: parseFloat(formData.consultation_fee),
        years_of_experience: parseInt(formData.years_of_experience, 10),
      });
      if (res.success) {
        setSuccess(`Dr. ${formData.first_name} ${formData.last_name} added to staff successfully.`);
        setShowAddModal(false);
        fetchDoctorsAndDepts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add doctor.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    try {
      const res = await doctorService.update(selectedDoctor.id, {
        department_id: formData.department_id || null,
        specialty: formData.specialty,
        consultation_fee: parseFloat(formData.consultation_fee),
        years_of_experience: parseInt(formData.years_of_experience, 10),
        is_available: formData.is_available,
      });
      if (res.success) {
        setSuccess("Doctor details updated successfully.");
        setShowEditModal(false);
        fetchDoctorsAndDepts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update doctor.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${name}?`)) return;
    try {
      const res = await doctorService.delete(id);
      if (res.success) {
        setSuccess(`Dr. ${name} removed from active roster.`);
        fetchDoctorsAndDepts();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete doctor with active appointments.");
    }
  };

  const filteredDoctors = doctors.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.first_name && d.first_name.toLowerCase().includes(q)) ||
      (d.last_name && d.last_name.toLowerCase().includes(q)) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.department_name && d.department_name.toLowerCase().includes(q)) ||
      (d.license_number && d.license_number.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Clinical Staff"
          title="Doctors & Specialists"
          description="Manage hospital physicians, clinical specialties, and consultation availability."
          action={
            <Button onClick={handleOpenAddModal}>
              <Plus size={16} />
              Add Doctor
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
                  placeholder="Search doctors, specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{filteredDoctors.length}</span> doctor(s)
            </div>
          </div>

          {/* Doctors Table */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading doctor directory...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="py-12 text-center">
              <Stethoscope size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No doctors found</p>
              <p className="text-xs text-slate-400 mt-1">Adjust filters or click &quot;Add Doctor&quot; to onboard staff.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Physician</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Specialty</th>
                    <th className="pb-3 font-medium">License</th>
                    <th className="pb-3 font-medium">Fee / Exp</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-900">
                        Dr. {doc.first_name} {doc.last_name}
                        <div className="flex items-center gap-3 text-xs font-normal text-slate-400 mt-0.5">
                          {doc.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={12} /> {doc.email}
                            </span>
                          )}
                          {doc.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {doc.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">
                        {doc.department_name ? (
                          <Badge variant="neutral">{doc.department_name}</Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 font-medium text-blue-700">
                        {doc.specialty}
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-500">
                        {doc.license_number}
                      </td>
                      <td className="py-3 text-xs text-slate-700">
                        <div className="flex items-center gap-1 font-semibold text-emerald-600">
                          <DollarSign size={13} />
                          {doc.consultation_fee}
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Award size={13} />
                          {doc.years_of_experience} yrs exp
                        </div>
                      </td>
                      <td className="py-3">
                        {doc.is_available ? (
                          <Badge variant="success">Available</Badge>
                        ) : (
                          <Badge variant="neutral">Off Duty</Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(doc)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition"
                            title="Edit Doctor"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, `${doc.first_name} ${doc.last_name}`)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition"
                            title="Delete Doctor"
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

        {/* Add Doctor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Doctor</h3>
                  <p className="text-xs text-slate-500">Register physician user account and specialist credentials.</p>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="e.g. Hana"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="e.g. Bekele"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="dr.name@hospital.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 911 223344"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License # *</label>
                    <input
                      type="text"
                      required
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="e.g. Cardiologist, Pediatrician, Neurologist"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.years_of_experience}
                      onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={formSubmitting}>
                    Onboard Doctor
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Doctor Modal */}
        {showEditModal && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Edit Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </h3>
                  <p className="text-xs text-slate-500">Update specialty, fee, or clinical availability.</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.years_of_experience}
                      onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_available" className="text-sm font-medium text-slate-700">
                    Currently Available for Consultations
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={formSubmitting}>
                    Save Changes
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

export default Doctors;