import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "../pages/dashboard/Dashboard";
import Patients from "../pages/patients/Patients";
import Doctors from "../pages/doctors/Doctors";
import Appointments from "../pages/appointments/Appointments";
import MedicalRecords from "../pages/medical-records/MedicalRecords";
import Laboratory from "../pages/laboratory/Laboratory";
import Pharmacy from "../pages/pharmacy/Pharmacy";
import Billing from "../pages/billing/Billing";
import Inventory from "../pages/inventory/Inventory";
import Reports from "../pages/reports/Reports";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/laboratory" element={<Laboratory />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;