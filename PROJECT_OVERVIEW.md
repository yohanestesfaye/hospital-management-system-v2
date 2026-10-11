# Hospital Management System V2 — Project Overview

## Safe Development Rule

> The AI development agent must inspect existing code before modifying it. Working functionality must be preserved. Database credentials must never be exposed. Destructive database operations require explicit approval.

---

## 1. Project Purpose

Hospital Management System V2 (HMS V2) is a full-stack web application designed to manage core hospital and clinical workflows, including:
- Patients (records, demographics, medical background, emergency contacts)
- Doctors and Departments
- Appointments and scheduling
- Medical records and clinical consultations
- Prescriptions and prescription items
- Medicines and Pharmacy dispensing
- Laboratory tests, lab orders, test items, and results
- Invoices, invoice items, and payments
- Executive dashboard metrics and reporting

---

## 2. High-Level Architecture

```text
React 19 Frontend (Vite SPA + TailwindCSS)
             │ (JSON over HTTP + JWT Authorization)
             ▼
Node.js + Express 5 REST API (Port 5000)
             │ (node-postgres connection pool + SSL)
             ▼
PostgreSQL Database (Hosted on Supabase)
```

---

## 3. Backend Architecture

### Tech Stack
- **Runtime**: Node.js (CommonJS, `"type": "commonjs"`)
- **Web Framework**: Express v5.2.1
- **Database Client**: `pg` (node-postgres v8.23.0) with connection pooling and SSL enabled
- **Security & Utilities**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT auth), `cors`, `dotenv`
- **Development Tooling**: `nodemon` v3.1.14

### Directory Structure
```text
backend/
├── .env                       # Environment variables (PORT, DATABASE_URL) [Protected]
├── database/
│   └── schema.sql             # Canonical PostgreSQL schema definition (17 tables)
├── src/
│   ├── app.js                 # Express app bootstrap, CORS, JSON body parser, route registration, global error handler
│   ├── config/
│   │   └── database.js        # Pool setup, SSL configuration, testDatabaseConnection
│   ├── controllers/           # Domain controllers:
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── departmentController.js
│   │   ├── doctorController.js
│   │   ├── appointmentController.js
│   │   ├── medicalRecordController.js
│   │   ├── prescriptionController.js
│   │   ├── medicineController.js
│   │   ├── pharmacyController.js
│   │   ├── laboratoryController.js
│   │   ├── billingController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── authMiddleware.js  # authenticate and authorize(...roles)
│   └── routes/                # Express router mounts:
│       ├── authRoutes.js          -> /api/auth
│       ├── patientRoutes.js       -> /api/patients
│       ├── departmentRoutes.js    -> /api/departments
│       ├── doctorRoutes.js        -> /api/doctors
│       ├── appointmentRoutes.js   -> /api/appointments
│       ├── medicalRecordRoutes.js -> /api/medical-records
│       ├── prescriptionRoutes.js  -> /api/prescriptions
│       ├── medicineRoutes.js      -> /api/medicines
│       ├── pharmacyRoutes.js      -> /api/pharmacy
│       ├── laboratoryRoutes.js    -> /api/laboratory
│       ├── billingRoutes.js       -> /api/billing
│       └── reportRoutes.js        -> /api/reports
├── package.json
└── package-lock.json
```

### Database Import Pattern
In [database.js](file:///c:/Users/Yohannes/Desktop/hospital-management-system-v2/backend/src/config/database.js), the module exports `{ pool, testDatabaseConnection }`.
All controllers import the pool as:
```javascript
const { pool } = require("../config/database");
```

---

## 4. Frontend Architecture

### Tech Stack
- **Framework / Bundler**: React 19.2.8 + Vite 8.2.0 (ESM, `"type": "module"`)
- **Styling**: TailwindCSS 4.3.3 (`@tailwindcss/vite`, `tailwindcss`)
- **Routing**: `react-router-dom` 7.18.2
- **Icons**: `lucide-react` 1.31.0
- **HTTP Client**: `axios` 1.19.0
- **Linter**: `oxlint` 1.75.0

### Directory Structure
```text
frontend/
├── index.html
├── vite.config.js             # Vite configuration with React and Tailwind plugins
├── package.json
├── package-lock.json
└── src/
    ├── App.jsx                # Root app component mounting AppRoutes
    ├── main.jsx               # Entrypoint rendering AuthProvider and App inside StrictMode
    ├── index.css              # Global styles and Tailwind imports
    ├── context/
    │   └── AuthContext.jsx    # AuthProvider with user state, login, logout, and localStorage persistence
    ├── routes/
    │   └── AppRoutes.jsx      # Route definitions with ProtectedRoute guard
    ├── layouts/
    │   └── DashboardLayout.jsx # App shell containing Sidebar, Navbar, and content container
    ├── components/            # Reusable UI component library:
    │   ├── Sidebar.jsx
    │   ├── Navbar.jsx
    │   ├── Card.jsx
    │   ├── Button.jsx
    │   ├── Badge.jsx
    │   ├── Modal.jsx
    │   ├── Table.jsx
    │   └── StatsCard.jsx
    ├── services/              # API layer:
    │   ├── api.js             # Axios instance configured with baseURL and JWT request interceptor
    │   ├── authService.js     # login, register, getCurrentUser
    │   └── hospitalServices.js # Services for all 10 domain modules
    └── pages/                 # Full feature views:
        ├── auth/              # Login, Register
        ├── dashboard/         # Dashboard with live KPI cards and activity tables
        ├── patients/          # Patient list, registration, search, and details
        ├── doctors/           # Doctor profiles and department listings
        ├── appointments/      # Appointment booking and status management
        ├── medical-records/   # Consultation records, diagnoses, and vitals
        ├── prescriptions/     # Prescription creation and item management
        ├── pharmacy/          # Medicine stock catalog and dispensing workflows
        ├── laboratory/        # Lab tests, orders, and diagnostic results recording
        ├── billing/           # Invoices, itemized billing, and payment processing
        ├── reports/           # Executive summaries and operational metrics
        ├── profile/           # User profile management
        ├── settings/          # System configuration
        └── not-found/         # 404 page
```

---

## 5. Security & Verification Baseline

### Eight Configured Roles
- `admin`: Universal administrator access, user provisioning, system configuration, destructive deletes.
- `doctor`: Clinical workflows (Patients, Appointments, Medical Records, Prescriptions, Lab Orders).
- `nurse`: Inpatient and outpatient clinical care assistance (Patients, Vitals, Lab orders, Medicine viewing).
- `receptionist`: Patient admissions, appointment scheduling, and billing payment collection.
- `pharmacist`: Medicine inventory, prescription fulfillment, and atomic dispensing.
- `lab_technician`: Diagnostic catalog, lab order processing, and specimen test result entry.
- `accountant`: Financial ledger, invoicing, balance calculations, payments, and financial reports.
- `staff`: General hospital staff directory viewing (Departments, Doctors, Dashboard KPIs).

### Security Architecture
- **JWT Authentication & RBAC**: Stateless signed JSON Web Tokens checked on all protected endpoints.
- **Independent Authorization**: Backend strictly enforces `authorize(...roles)` regardless of frontend client behavior.
- **SQL Injection Defense**: 100% of queries use parameterized queries (`$1, $2, ...`) via `pg` connection pool.
- **Transaction Safety**: All multi-step operations (dispensing inventory deduction, lab orders with items, invoices with line items, payments with balance updates) execute inside `BEGIN ... COMMIT` with row-level locks (`FOR UPDATE`).
- **Scheduling Conflict Prevention**: Double booking doctors at identical date and time is rejected with HTTP 409 Conflict.
- **Inventory Protection**: Negative stock is rejected at database and transaction levels.
- **Financial Balances**: Overpayments on settled invoices are rejected with HTTP 400.

### Verification Baseline
- Automated Security Suite (`npm test`): **35 passed, 0 failed**.
- Comprehensive E2E Clinical Workflows (`node scratch/test_e2e_workflows.js`): **45 passed, 0 failed**.
- Frontend Production Build (`npm run build`): **1,880 modules transformed cleanly, 0 errors**.
- Database Integrity: Live Supabase PostgreSQL database intact; baseline patient `P-0001` (John Doe) preserved.

