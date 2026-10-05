# Hospital Management System V2 (HMS V2)

A modern, production-oriented full-stack Hospital Management System built with **React 19**, **Node.js + Express 5**, and **PostgreSQL** hosted on **Supabase**.

---

## Architecture Overview

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

## Core Modules & Features

1. **Authentication & Authorization**:
   - User registration and login with bcrypt password hashing
   - JWT stateless token verification and user context (`/api/auth/me`)
   - Role-based access control (Admin, Doctor, Nurse, Pharmacist, Lab Technician, Accountant, Receptionist, Staff)
2. **Patient Management**:
   - Comprehensive CRUD, search by patient number, name, phone
   - Auto-generated patient numbers (`P-XXXX`)
   - Contact details, medical history, blood group, allergies, emergency contacts
3. **Departments & Doctors**:
   - Clinical department catalog with location and description
   - Doctor profiles linked to departments, specialty, license number, consultation fees
4. **Appointments**:
   - Scheduling with conflict checks (no double-booking doctor/room at same time)
   - Status transitions (`scheduled`, `completed`, `cancelled`, `no_show`)
5. **Medical Records**:
   - Clinical consultation notes, chief complaint, diagnosis, treatment plans
   - Vital signs recording (blood pressure, temperature, heart rate, respiratory rate, oxygen saturation, BMI)
6. **Prescriptions**:
   - Prescription issuance with medication items, dosage, frequency, duration, instructions
   - Status lifecycle (`active`, `completed`, `discontinued`)
7. **Medicines & Pharmacy Dispensing**:
   - Drug inventory management, batch numbers, expiry tracking, reorder thresholds
   - Low-stock alert queries
   - Atomic multi-item dispensing transactions with row-level stock deduction (`FOR UPDATE`)
8. **Laboratory & Diagnostics**:
   - Standard laboratory test catalog (CBC, Lipid Panel, Blood Glucose, Urinalysis, etc.)
   - Test orders with order items, clinical indications, priority (`routine`, `urgent`, `stat`)
   - Result recording with reference ranges, flags (`normal`, `abnormal`, `critical`), and automatic order completion
9. **Billing & Invoices**:
   - Invoices with line items, subtotal, discount, and tax calculations
   - Payment processing with multiple payment methods (cash, card, bank transfer, mobile money, insurance)
   - Real-time balance due and invoice status updates (`unpaid`, `partially_paid`, `paid`, `overdue`, `cancelled`)
10. **Executive Analytics & Reporting**:
    - Aggregated dashboard statistics (patients, doctors, appointments, revenue, low-stock medicines, pending labs)

---

## Directory Structure

```text
hospital-management-system-v2/
├── backend/
│   ├── .env                     # Environment variables (PORT, DATABASE_URL)
│   ├── database/
│   │   └── schema.sql           # Canonical PostgreSQL schema (17 tables)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # pg Pool configuration with SSL
│   │   ├── controllers/         # 12 Express controllers handling business logic
│   │   ├── middleware/
│   │   │   └── authMiddleware.js # authenticate and authorize middlewares
│   │   ├── routes/              # 12 Express routers mounted under /api/*
│   │   └── app.js               # Application bootstrap, CORS, JSON parsing, error handling
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components (Sidebar, Navbar, Card, Modal, Table, Badge, Button, StatsCard)
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication state & JWT handling
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # Main app shell
│   │   ├── pages/               # 10 clinical domain pages + Dashboard, Login, Register, Profile, Settings, NotFound
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx    # React Router DOM v7 route definitions with ProtectedRoute
│   │   └── services/            # Axios API client and domain service modules
│   ├── vite.config.js
│   └── package.json
├── PROJECT_OVERVIEW.md
├── PROJECT_STATUS.md
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 20+)
- PostgreSQL database (Supabase instance configured)

### Backend Setup
```bash
cd backend
npm install
# Ensure .env contains PORT and DATABASE_URL
npm run dev
# Server starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Web application starts on http://localhost:5173
```

To build for production:
```bash
cd frontend
npm run build
```
