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
- Pharmacy inventory, stock levels, and dispensing
- Laboratory tests, lab orders, test items, and results
- Billing, invoices, invoice items, and payments

---

## 2. High-Level Architecture

```text
React 19 (Vite SPA + TailwindCSS)
  ↓
REST API (JSON over HTTP)
  ↓
Node.js + Express 5
  ↓
PostgreSQL 15+
  ↓
Supabase
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
│   └── schema.sql             # Canonical PostgreSQL schema definition
├── src/
│   ├── app.js                 # Express app initialization, middleware, routes, server startup
│   ├── config/
│   │   └── database.js        # Pool setup, SSL configuration, testDatabaseConnection
│   ├── controllers/
│   │   └── patientController.js # getPatients, createPatient
│   ├── middleware/            # Middleware functions (auth, validation, etc.) [Empty]
│   ├── routes/
│   │   └── patientRoutes.js   # /api/patients route definitions
│   └── services/              # Business logic / domain services [Empty]
├── package.json
└── package-lock.json
```

### Database Import Pattern
In [database.js](file:///c:/Users/Yohannes/Desktop/hospital-management-system-v2/backend/src/config/database.js), the module exports `{ pool, testDatabaseConnection }`.
All controllers and services must import the pool as:
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
    │   └── AuthContext.jsx    # AuthProvider with mock user state and localStorage persistence
    ├── routes/
    │   ├── AppRoutes.jsx      # Route definitions (public and protected layout routes)
    │   └── ProtectedRoute.jsx # Route guard checking isAuthenticated from AuthContext
    ├── components/
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx # Shell layout with Topbar, Sidebar, and main content area
    │   │   ├── Sidebar.jsx         # Navigation menu with module links
    │   │   └── Topbar.jsx          # Header with user profile and notifications
    │   └── ui/
    │       ├── Badge.jsx           # Variant badge component
    │       ├── Button.jsx          # Reusable styled button component
    │       ├── Card.jsx            # Container card component
    │       └── PageHeader.jsx      # Standard page title & actions header
    └── pages/
        ├── PagePlaceholder.jsx     # Placeholder component for upcoming modules
        ├── auth/
        │   └── Login.jsx           # Login page with mock credential validation
        ├── dashboard/
        │   └── Dashboard.jsx       # Overview dashboard with metrics, quick actions, appointments
        ├── appointments/
        ├── billing/
        ├── doctors/
        ├── inventory/
        ├── laboratory/
        ├── medical-records/
        ├── patients/
        │   └── Patients.jsx        # Currently renders PagePlaceholder
        ├── pharmacy/
        └── reports/
```

---

## 5. Database Schema & Relationships

The database schema is defined in [schema.sql](file:///c:/Users/Yohannes/Desktop/hospital-management-system-v2/backend/database/schema.sql). All 17 tables are active and verified in Supabase PostgreSQL:

1. **`users`**: System users (admins, doctors, nurses, receptionists, pharmacists, lab technicians, accountants, staff).
2. **`departments`**: Hospital clinical and administrative departments.
3. **`patients`**: Patient demographics, unique `patient_number`, contact details, blood type, and allergy history.
4. **`doctors`**: Doctor profile referencing `users(id)` and `departments(id)`, license number, specialty, consultation fee, experience.
5. **`appointments`**: Appointment bookings linking patient, doctor, and department with status (`scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`).
6. **`medical_records`**: Clinical records linking patient, doctor, and appointment with diagnosis, symptoms, and treatment plan.
7. **`prescriptions`**: Doctor prescriptions linked to patient and medical record, with status (`active`, `completed`, `cancelled`).
8. **`prescription_items`**: Line items for prescriptions specifying medicine name, dosage, frequency, duration, quantity, and instructions.
9. **`medicines`**: Pharmacy catalog with generic names, stock quantities, reorder thresholds, unit prices, batch numbers, and expiry dates.
10. **`pharmacy_dispensing`**: Dispensing transactions linked to patient and prescription, managed by pharmacy staff.
11. **`pharmacy_dispensing_items`**: Medicines dispensed in each dispensing transaction with quantity and unit price.
12. **`lab_tests`**: Diagnostic test catalog with pricing, reference ranges, and units.
13. **`lab_orders`**: Lab orders requested by doctors for patients with workflow statuses (`ordered`, `sample_collected`, `processing`, `completed`, `cancelled`).
14. **`lab_order_items`**: Individual lab test items within an order with test results, reference ranges, technician notes, and completion timestamps.
15. **`invoices`**: Billing invoices linking patient and appointment with subtotal, discounts, tax, total, paid amounts, balance due, and status (`unpaid`, `partially_paid`, `paid`, `overdue`, `cancelled`).
16. **`invoice_items`**: Itemized invoice line items with descriptions, quantities, unit prices, and line totals.
17. **`payments`**: Payment records against invoices with payment methods (`cash`, `card`, `bank_transfer`, `mobile_money`, `insurance`) and transaction references.

---

## 6. Development Commands

### Backend (`cd backend`)
- **`npm run dev`**: Runs backend server with nodemon (`nodemon src/app.js`)
- **`npm start`**: Runs backend server with node (`node src/app.js`)

### Frontend (`cd frontend`)
- **`npm run dev`**: Starts Vite development server
- **`npm run build`**: Builds production bundle using Vite (`vite build`)
- **`npm run preview`**: Previews production build (`vite preview`)
- **`npm run lint`**: Lints frontend code using Oxlint (`oxlint`)
