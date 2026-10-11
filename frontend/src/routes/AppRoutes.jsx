import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "../pages/dashboard/Dashboard";
import Login from "../pages/auth/Login";
import AccessDenied from "../pages/auth/AccessDenied";

import Patients from "../pages/patients/Patients";
import Doctors from "../pages/doctors/Doctors";
import Departments from "../pages/departments/Departments";
import Appointments from "../pages/appointments/Appointments";
import MedicalRecords from "../pages/medical-records/MedicalRecords";
import Laboratory from "../pages/laboratory/Laboratory";
import Pharmacy from "../pages/pharmacy/Pharmacy";
import Billing from "../pages/billing/Billing";
import Inventory from "../pages/inventory/Inventory";
import Reports from "../pages/reports/Reports";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Protected routes - General (All authenticated staff) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/departments" element={<Departments />} />
        </Route>

        {/* Patients: admin, doctor, nurse, receptionist, accountant */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "doctor", "nurse", "receptionist", "accountant"]}
            />
          }
        >
          <Route path="/patients" element={<Patients />} />
        </Route>

        {/* Appointments: admin, doctor, nurse, receptionist */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "doctor", "nurse", "receptionist"]}
            />
          }
        >
          <Route path="/appointments" element={<Appointments />} />
        </Route>

        {/* Clinical Records: admin, doctor, nurse */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "doctor", "nurse"]}
            />
          }
        >
          <Route path="/medical-records" element={<MedicalRecords />} />
        </Route>

        {/* Laboratory: admin, doctor, nurse, lab_technician */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "doctor", "nurse", "lab_technician"]}
            />
          }
        >
          <Route path="/laboratory" element={<Laboratory />} />
        </Route>

        {/* Pharmacy & Medicines: admin, pharmacist */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "pharmacist"]}
            />
          }
        >
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/inventory" element={<Inventory />} />
        </Route>

        {/* Billing: admin, accountant, receptionist */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "accountant", "receptionist"]}
            />
          }
        >
          <Route path="/billing" element={<Billing />} />
        </Route>

        {/* Reports: admin, accountant, doctor */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "accountant", "doctor"]}
            />
          }
        >
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;