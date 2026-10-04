import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { patientService } from "../../services/hospitalServices";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state
  const initialFormState = {
    patient_number: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_type: "",
    allergies: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await patientService.getAll(search ? { search } : {});
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patients from the server.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleOpenAddModal = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      ...initialFormState,
      patient_number: `P-${randomNum}`,
    });
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      patient_number: patient.patient_number || "",
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      date_of_birth: patient.date_of_birth ? patient.date_of_birth.substring(0, 10) : "",
      gender: patient.gender || "male",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      blood_type: patient.blood_type || "",
      allergies: patient.allergies || "",
    });
    setError("");
    setShowEditModal(true);
  };

  const handleOpenDetailModal = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    try {
      const res = await patientService.create(formData);
      if (res.success) {
        setSuccess(`Patient ${formData.first_name} ${formData.last_name} registered successfully!`);
        setShowAddModal(false);
        fetchPatients();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register patient. Check inputs.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    try {
      const res = await patientService.update(selectedPatient.id, formData);
      if (res.success) {
        setSuccess(`Patient ${formData.first_name} ${formData.last_name} updated successfully!`);
        setShowEditModal(false);
        fetchPatients();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update patient.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate or remove patient "${name}"?`)) {
      return;
    }
    try {
      const res = await patientService.delete(id);
      if (res.success) {
        setSuccess(`Patient "${name}" deleted successfully.`);
        fetchPatients();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete patient because linked records exist.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Clinical Management"
          title="Patients Directory"
          description="Register, search, view, and manage comprehensive patient records."
          action={
            <Button onClick={handleOpenAddModal}>
              <UserPlus size={16} />
              Register Patient
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
          {/* Search bar & count */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name, ID, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{patients.length}</span> active patient(s)
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No patients found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new patient.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Number</th>
                    <th className="pb-3 font-medium">Gender / Age</th>
                    <th className="pb-3 font-medium">Phone / Contact</th>
                    <th className="pb-3 font-medium">Blood Type</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => {
                    const age = p.date_of_birth
                      ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
                      : null;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-900">
                          {p.first_name} {p.last_name}
                          {p.email && (
                            <span className="block text-xs font-normal text-slate-400">
                              {p.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-600 font-mono text-xs">
                          {p.patient_number}
                        </td>
                        <td className="py-3 text-slate-600 capitalize">
                          {p.gender || "—"} {age !== null ? `(${age} yrs)` : ""}
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          {p.phone || "—"}
                        </td>
                        <td className="py-3">
                          {p.blood_type ? (
                            <Badge variant="info">{p.blood_type}</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenDetailModal(p)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition"
                              title="Edit patient"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition"
                              title="Delete patient"
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

        {/* Register / Add Patient Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Register New Patient</h3>
                  <p className="text-xs text-slate-500">Enter personal and medical demographics for clinical records.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Number *</label>
                    <input
                      type="text"
                      name="patient_number"
                      required
                      value={formData.patient_number}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Type</label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="">Unknown / Not set</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+251 911 000000"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="patient@example.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Bole, Addis Ababa"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleFormChange}
                      placeholder="Full Name"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="text"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleFormChange}
                      placeholder="+251 922 000000"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies / Pre-conditions</label>
                  <textarea
                    rows={2}
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleFormChange}
                    placeholder="Penicillin, NSAIDs, Asthma, etc."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={formSubmitting}
                  >
                    Save & Register Patient
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Patient Modal */}
        {showEditModal && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Patient Details</h3>
                  <p className="text-xs text-slate-500">Updating record for {selectedPatient.first_name} {selectedPatient.last_name}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Number</label>
                    <input
                      type="text"
                      name="patient_number"
                      disabled
                      value={formData.patient_number}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Type</label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white"
                    >
                      <option value="">Unknown / Not set</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="text"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies</label>
                  <textarea
                    rows={2}
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={formSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Patient Details Modal */}
        {showDetailModal && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h3>
                    <Badge variant="info">{selectedPatient.patient_number}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Clinical Profile & Medical Record</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">Gender</span>
                    <span className="font-medium text-slate-800 capitalize">{selectedPatient.gender || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Date of Birth</span>
                    <span className="font-medium text-slate-800">{selectedPatient.date_of_birth ? selectedPatient.date_of_birth.substring(0, 10) : "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Blood Type</span>
                    <span className="font-semibold text-rose-600">{selectedPatient.blood_type || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Registration Date</span>
                    <span className="font-medium text-slate-800">{selectedPatient.created_at ? new Date(selectedPatient.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={15} className="text-slate-400" />
                    <span>{selectedPatient.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail size={15} className="text-slate-400" />
                    <span>{selectedPatient.email || "No email provided"}</span>
                  </div>
                  <div className="text-slate-700 pl-6">
                    <span className="text-xs text-slate-400 block">Address:</span>
                    <span>{selectedPatient.address || "No address provided"}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Emergency Contact</p>
                  <p className="text-slate-800 font-medium">{selectedPatient.emergency_contact_name || "None listed"}</p>
                  <p className="text-slate-500 text-xs">{selectedPatient.emergency_contact_phone || "—"}</p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-1">
                    <HeartPulse size={15} />
                    <span>Known Allergies & Warnings</span>
                  </div>
                  <p className="text-slate-700 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 text-xs">
                    {selectedPatient.allergies || "No known allergies documented."}
                  </p>
                </div>
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

export default Patients;