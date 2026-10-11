# Hospital Management System V2 — Role Permission Matrix

This document defines the Role-Based Access Control (RBAC) authorization matrix for all eight configured roles in HMS V2 across every backend API endpoint.

Authorization is enforced on the backend via `authenticate` and `authorize(...allowedRoles)` middleware, completely independent of frontend navigation or client-side UI visibility.

---

## 1. Supported Roles

1. `admin`: Hospital Administrator (universal access, user provisioning, system configuration, destructive deletes).
2. `doctor`: Attending Physician / Clinician (patient care, medical records, prescriptions, lab orders, appointment management).
3. `nurse`: Nursing Staff (patient care assistance, triage, vitals/records view, medicine catalog read, lab order dispatch).
4. `receptionist`: Front Desk & Patient Admission (patient registration, appointment scheduling, billing invoices and payment collection).
5. `pharmacist`: Pharmacy & Inventory Manager (medicine catalog management, stock replenishment, prescription fulfillment, atomic dispensing).
6. `lab_technician`: Laboratory Specialist (diagnostic test catalog, specimen processing, lab orders, test result recording).
7. `accountant`: Financial Officer (invoicing, billing adjustments, payment recording, ledger balancing, financial reporting).
8. `staff`: General Hospital Staff (department and doctor directory read, personal dashboard; strict zero-access to clinical and financial records).

---

## 2. Role-Versus-Endpoint Matrix

Legend:
- `C`: Create (`POST`)
- `R`: Read (`GET`)
- `U`: Update (`PUT` / `PATCH`)
- `D`: Delete (`DELETE`)
- `-`: Access Denied (HTTP 403 Forbidden or HTTP 401 Unauthorized)

| Endpoint Resource | Admin | Doctor | Nurse | Receptionist | Pharmacist | Lab Tech | Accountant | Staff |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Users** | | | | | | | | |
| `POST /api/auth/register` (self-service) | C (staff) | C (staff) | C (staff) | C (staff) | C (staff) | C (staff) | C (staff) | C (staff) |
| `POST /api/auth/register` (admin provisioning) | CRUD | - | - | - | - | - | - | - |
| `POST /api/auth/login` | R | R | R | R | R | R | R | R |
| `GET /api/auth/me` | R | R | R | R | R | R | R | R |
| `GET /api/auth/users` | R | - | - | - | - | - | - | - |
| `PUT /api/auth/users/:id/role` | U | - | - | - | - | - | - | - |
| `PUT /api/auth/users/:id/status` | U | - | - | - | - | - | - | - |
| **Patients** | | | | | | | | |
| `GET /api/patients` | R | R | R | R | - | - | R | - |
| `POST /api/patients` | C | C | C | C | - | - | - | - |
| `GET /api/patients/:id` | R | R | R | R | - | - | R | - |
| `PUT /api/patients/:id` | U | U | U | U | - | - | - | - |
| `DELETE /api/patients/:id` | D | - | - | - | - | - | - | - |
| **Departments** | | | | | | | | |
| `GET /api/departments` | R | R | R | R | R | R | R | R |
| `POST /api/departments` | C | - | - | - | - | - | - | - |
| `GET /api/departments/:id` | R | R | R | R | R | R | R | R |
| `PUT /api/departments/:id` | U | - | - | - | - | - | - | - |
| `DELETE /api/departments/:id` | D | - | - | - | - | - | - | - |
| **Doctors** | | | | | | | | |
| `GET /api/doctors` | R | R | R | R | R | R | R | R |
| `POST /api/doctors` | C | - | - | - | - | - | - | - |
| `GET /api/doctors/:id` | R | R | R | R | R | R | R | R |
| `PUT /api/doctors/:id` | U | U (self) | - | - | - | - | - | - |
| `DELETE /api/doctors/:id` | D | - | - | - | - | - | - | - |
| **Appointments** | | | | | | | | |
| `GET /api/appointments` | R | R | R | R | - | - | - | - |
| `POST /api/appointments` | C | C | C | C | - | - | - | - |
| `GET /api/appointments/:id` | R | R | R | R | - | - | - | - |
| `PUT /api/appointments/:id` | U | U | U | U | - | - | - | - |
| `DELETE /api/appointments/:id` | D | - | - | D | - | - | - | - |
| **Medical Records (Clinical Privacy)** | | | | | | | | |
| `GET /api/medical-records` | R | R | R | - | - | - | - | - |
| `POST /api/medical-records` | C | C | - | - | - | - | - | - |
| `GET /api/medical-records/:id` | R | R | R | - | - | - | - | - |
| `PUT /api/medical-records/:id` | U | U | - | - | - | - | - | - |
| `DELETE /api/medical-records/:id` | D | - | - | - | - | - | - | - |
| **Prescriptions** | | | | | | | | |
| `GET /api/prescriptions` | R | R | R | - | R | - | - | - |
| `POST /api/prescriptions` | C | C | - | - | - | - | - | - |
| `GET /api/prescriptions/:id` | R | R | R | - | R | - | - | - |
| `PUT /api/prescriptions/:id` | U | U | - | - | U | - | - | - |
| `DELETE /api/prescriptions/:id` | D | - | - | - | - | - | - | - |
| **Medicines Inventory** | | | | | | | | |
| `GET /api/medicines` | R | R | R | - | R | - | - | - |
| `POST /api/medicines` | C | - | - | - | C | - | - | - |
| `GET /api/medicines/:id` | R | R | R | - | R | - | - | - |
| `PUT /api/medicines/:id` | U | - | - | - | U | - | - | - |
| `DELETE /api/medicines/:id` | D | - | - | - | - | - | - | - |
| **Pharmacy Dispensing** | | | | | | | | |
| `GET /api/pharmacy/dispensing` | R | R | R | - | R | - | - | - |
| `POST /api/pharmacy/dispense` | C | - | - | - | C | - | - | - |
| `GET /api/pharmacy/dispensing/:id` | R | R | R | - | R | - | - | - |
| `PUT /api/pharmacy/dispensing/:id/status` | U | - | - | - | U | - | - | - |
| **Laboratory (Catalog & Orders)** | | | | | | | | |
| `GET /api/lab/tests` | R | R | R | - | - | R | - | - |
| `POST /api/lab/tests` | C | - | - | - | - | C | - | - |
| `GET /api/lab/tests/:id` | R | R | R | - | - | R | - | - |
| `PUT /api/lab/tests/:id` | U | - | - | - | - | U | - | - |
| `DELETE /api/lab/tests/:id` | D | - | - | - | - | D | - | - |
| `GET /api/lab/orders` | R | R | R | - | - | R | - | - |
| `POST /api/lab/orders` | C | C | C | - | - | - | - | - |
| `GET /api/lab/orders/:id` | R | R | R | - | - | R | - | - |
| `PUT /api/lab/orders/:id` | U | U | - | - | - | U | - | - |
| `PUT /api/lab/items/:itemId/result` | U | - | - | - | - | U | - | - |
| `DELETE /api/lab/orders/:id` | D | - | - | - | - | - | - | - |
| **Billing & Invoices** | | | | | | | | |
| `GET /api/billing/invoices` | R | - | - | R | - | - | R | - |
| `POST /api/billing/invoices` | C | - | - | - | - | - | C | - |
| `GET /api/billing/invoices/:id` | R | - | - | R | - | - | R | - |
| `PUT /api/billing/invoices/:id` | U | - | - | - | - | - | U | - |
| `DELETE /api/billing/invoices/:id` | D | - | - | - | - | - | - | - |
| `GET /api/billing/payments` | R | - | - | R | - | - | R | - |
| `POST /api/billing/payments` | C | - | - | C | - | - | C | - |
| `GET /api/billing/reports` | R | - | - | - | - | - | R | - |
| **Executive Dashboard & KPIs** | | | | | | | | |
| `GET /api/dashboard/stats` | R | R | R | R | R | R | R | R |

---

## 3. Privilege Escalation Defenses

1. **Self-Registration Constraint**:
   - `POST /api/auth/register` does not allow unauthenticated clients to register as `admin`, `doctor`, `nurse`, `accountant`, or other privileged roles.
   - Any public registration request requesting a role other than `staff` is rejected with `HTTP 403 Forbidden` (`Self-registration is only allowed for the 'staff' role`).
   - Only authenticated administrators holding a verified JWT with `role === 'admin'` can provision staff into elevated clinical or financial roles.

2. **Destructive Operations Isolation**:
   - Patient deletion (`DELETE /api/patients/:id`) is restricted exclusively to `admin`. Doctors, nurses, and receptionists receive `HTTP 403 Forbidden`.
   - Medical record deletion (`DELETE /api/medical-records/:id`) is restricted exclusively to `admin`.
   - Department deletion (`DELETE /api/departments/:id`) is restricted exclusively to `admin`.

3. **Clinical Confidentiality**:
   - Medical records (`/api/medical-records`) and Prescriptions (`/api/prescriptions`) are inaccessible to front desk staff (`receptionist`), financial officers (`accountant`), and general staff (`staff`).
   - Direct requests to read or modify clinical records by non-clinical roles receive `HTTP 403 Forbidden`.

4. **Financial Segregation**:
   - Invoicing creation (`POST /api/billing/invoices`) is restricted to `accountant` and `admin`.
   - Physicians (`doctor`) and nurses (`nurse`) are blocked from billing and invoice deletion with `HTTP 403 Forbidden`.
