const http = require("http");
const jwt = require("jsonwebtoken");
const { pool } = require("../src/config/database");
const { JWT_SECRET } = require("../src/middleware/authMiddleware");

// Helper to make HTTP requests
const request = ({ method = "GET", path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(rawData);
          } catch {
            json = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json,
          });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
};

async function runE2EWorkflowTests() {
  console.log("================================================================");
  console.log("  HMS V2 — PHASE 2 & 4: COMPREHENSIVE E2E WORKFLOW VERIFICATION ");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  };

  // Tracking test artifacts for safe cleanup
  const cleanupIds = {
    users: [],
    patients: [],
    departments: [],
    medicines: [],
    appointments: [],
    medicalRecords: [],
    prescriptions: [],
    labOrders: [],
    invoices: [],
  };

  try {
    // ----------------------------------------------------
    // STEP 0: Establish Admin Context
    // ----------------------------------------------------
    console.log("--- STEP 0: ESTABLISH AUTHENTICATED ROLES ---");
    const adminQuery = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'admin' AND is_active = true LIMIT 1"
    );
    assert(adminQuery.rows.length > 0, "Admin account found in database");
    const adminUser = adminQuery.rows[0];
    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Create isolated test accounts for all roles
    const timestamp = Date.now();
    const roleAccounts = {};
    const testRoles = [
      "doctor",
      "nurse",
      "receptionist",
      "pharmacist",
      "lab_technician",
      "accountant",
      "staff",
    ];

    for (const r of testRoles) {
      const email = `test_${r}_${timestamp}@hospital.test`;
      const regRes = await request({
        method: "POST",
        path: "/api/auth/register",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          first_name: "Test",
          last_name: r.charAt(0).toUpperCase() + r.slice(1),
          email,
          password: "password123",
          role: r,
        },
      });

      assert(
        regRes.status === 201 && regRes.data?.user?.role === r,
        `Admin created isolated test user with role '${r}'`
      );
      if (regRes.data?.user?.id) {
        cleanupIds.users.push(regRes.data.user.id);
        roleAccounts[r] = {
          id: regRes.data.user.id,
          token: regRes.data.token,
          email,
        };
      }
    }

    roleAccounts["admin"] = {
      id: adminUser.id,
      token: adminToken,
      email: adminUser.email,
    };

    // ----------------------------------------------------
    // WORKFLOW 1: Authentication & Invalid Tokens
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 1: AUTHENTICATION, LOGIN & TOKEN VALIDATION ---");
    const invalidLogin = await request({
      method: "POST",
      path: "/api/auth/login",
      body: { email: adminUser.email, password: "wrong_password_999" },
    });
    assert(invalidLogin.status === 401, "Invalid password rejected with 401");

    const validLogin = await request({
      method: "POST",
      path: "/api/auth/login",
      body: { email: roleAccounts.receptionist.email, password: "password123" },
    });
    assert(
      validLogin.status === 200 && validLogin.data?.token,
      "Valid login returns JWT token and user profile"
    );

    const meCheck = await request({
      path: "/api/auth/me",
      headers: { Authorization: `Bearer ${validLogin.data.token}` },
    });
    assert(
      meCheck.status === 200 &&
        (meCheck.data?.data?.role === "receptionist" ||
          meCheck.data?.user?.role === "receptionist"),
      "GET /api/auth/me validates token and returns active role"
    );

    // ----------------------------------------------------
    // WORKFLOW 2: Patient Registration & Access Enforcement
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 2: PATIENT MANAGEMENT WORKFLOW ---");
    const patientPayload = {
      patient_number: `P-TEST-${timestamp.toString().slice(-4)}`,
      first_name: "TestE2E",
      last_name: `Patient_${timestamp}`,
      date_of_birth: "1990-05-15",
      gender: "male",
      phone: "+1-555-0199",
      email: `patient_${timestamp}@test.com`,
      blood_group: "O+",
      allergies: "Penicillin",
      medical_history: "None",
    };

    const regPatRes = await request({
      method: "POST",
      path: "/api/patients",
      headers: { Authorization: `Bearer ${roleAccounts.receptionist.token}` },
      body: patientPayload,
    });
    assert(
      regPatRes.status === 201 && regPatRes.data?.data?.id,
      "Receptionist successfully registered new patient"
    );
    const testPatient = regPatRes.data?.data;
    if (testPatient?.id) cleanupIds.patients.push(testPatient.id);

    // Doctor can search and read patient
    const docPatSearch = await request({
      path: `/api/patients?search=TestE2E`,
      headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
    });
    assert(
      docPatSearch.status === 200 && docPatSearch.data?.count > 0,
      "Doctor can search and find registered patient"
    );

    // Staff cannot view patient list (403)
    const staffPatDenial = await request({
      path: "/api/patients",
      headers: { Authorization: `Bearer ${roleAccounts.staff.token}` },
    });
    assert(
      staffPatDenial.status === 403,
      "Staff forbidden from viewing patients (HTTP 403)"
    );

    // Doctor cannot delete patient (Admin only)
    const docPatDelDenial = await request({
      method: "DELETE",
      path: `/api/patients/${testPatient.id}`,
      headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
    });
    assert(
      docPatDelDenial.status === 403,
      "Doctor forbidden from deleting patient (Admin only, HTTP 403)"
    );

    // ----------------------------------------------------
    // WORKFLOW 3: Departments & Doctors Directory
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 3: DEPARTMENTS & DOCTORS MANAGEMENT ---");
    // All staff can read departments
    const staffDeptRead = await request({
      path: "/api/departments",
      headers: { Authorization: `Bearer ${roleAccounts.staff.token}` },
    });
    assert(
      staffDeptRead.status === 200,
      "Staff can read departments directory (HTTP 200)"
    );

    // Doctor cannot create department (403)
    const docDeptCreate = await request({
      method: "POST",
      path: "/api/departments",
      headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
      body: { name: `TestDept_${timestamp}` },
    });
    assert(
      docDeptCreate.status === 403,
      "Doctor forbidden from creating departments (HTTP 403)"
    );

    // Admin creates test department
    const adminDeptCreate = await request({
      method: "POST",
      path: "/api/departments",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: `TestDept_${timestamp}`,
        description: "Department for E2E audit testing",
      },
    });
    assert(
      adminDeptCreate.status === 201 && adminDeptCreate.data?.data?.id,
      "Admin successfully created test department"
    );
    const testDept = adminDeptCreate.data?.data;
    if (testDept?.id) cleanupIds.departments.push(testDept.id);

    // Fetch existing doctor profile from DB
    const existingDoctorQuery = await pool.query(
      "SELECT id FROM doctors WHERE is_available = true LIMIT 1"
    );
    let doctorProfileId = null;
    if (existingDoctorQuery.rows.length > 0) {
      doctorProfileId = existingDoctorQuery.rows[0].id;
    }

    // ----------------------------------------------------
    // WORKFLOW 4: Appointment Scheduling & Conflict Prevention
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 4: APPOINTMENTS & CONFLICT PREVENTION ---");
    if (doctorProfileId && testPatient?.id) {
      const randSuffix = Math.floor(Math.random() * 800) + 100;
      const aptDate = "2026-11-20";
      const h = String(8 + Math.floor(randSuffix / 100) % 10).padStart(2, "0");
      const m = String(randSuffix % 60).padStart(2, "0");
      const aptTime = `${h}:${m}:00`;

      const aptCreate = await request({
        method: "POST",
        path: "/api/appointments",
        headers: { Authorization: `Bearer ${roleAccounts.receptionist.token}` },
        body: {
          patient_id: testPatient.id,
          doctor_id: doctorProfileId,
          appointment_date: aptDate,
          appointment_time: aptTime,
          type: "consultation",
          reason: "Annual health checkup",
        },
      });
      assert(
        aptCreate.status === 201 && aptCreate.data?.data?.id,
        "Receptionist successfully scheduled new appointment"
      );
      const testApt = aptCreate.data?.data;
      if (testApt?.id) cleanupIds.appointments.push(testApt.id);

      // Conflict prevention: Attempt to double-book same doctor at exact same time
      const conflictApt = await request({
        method: "POST",
        path: "/api/appointments",
        headers: { Authorization: `Bearer ${roleAccounts.receptionist.token}` },
        body: {
          patient_id: testPatient.id,
          doctor_id: doctorProfileId,
          appointment_date: aptDate,
          appointment_time: aptTime,
          type: "follow_up",
          reason: "Double booking collision attempt",
        },
      });
      assert(
        conflictApt.status === 409 || conflictApt.status === 400,
        `Doctor schedule conflict correctly prevented (HTTP ${conflictApt.status})`
      );

      // Doctor updates appointment status
      const docAptUpdate = await request({
        method: "PUT",
        path: `/api/appointments/${testApt.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
        body: { status: "completed" },
      });
      assert(
        docAptUpdate.status === 200 &&
          docAptUpdate.data?.data?.status === "completed",
        "Doctor can update appointment status to 'completed'"
      );
    }

    // ----------------------------------------------------
    // WORKFLOW 5: Medical Records & Clinical Privacy
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 5: CLINICAL MEDICAL RECORDS & ACCESS RESTRICTION ---");
    if (doctorProfileId && testPatient?.id) {
      const medRecCreate = await request({
        method: "POST",
        path: "/api/medical-records",
        headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
        body: {
          patient_id: testPatient.id,
          doctor_id: doctorProfileId,
          chief_complaint: "Mild headache for two days",
          diagnosis: "Tension headache",
          treatment_plan: "Rest and hydration",
          vital_signs: { bp: "120/80", pulse: 72, temp: 36.8 },
        },
      });
      assert(
        medRecCreate.status === 201 && medRecCreate.data?.data?.id,
        "Doctor successfully created clinical medical record"
      );
      const testMedRec = medRecCreate.data?.data;
      if (testMedRec?.id) cleanupIds.medicalRecords.push(testMedRec.id);

      // Nurse can read medical records
      const nurseMedRead = await request({
        path: `/api/medical-records/${testMedRec.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.nurse.token}` },
      });
      assert(
        nurseMedRead.status === 200,
        "Nurse permitted to view medical record (HTTP 200)"
      );

      // Receptionist forbidden from medical records (403)
      const recepMedDenial = await request({
        path: `/api/medical-records/${testMedRec.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.receptionist.token}` },
      });
      assert(
        recepMedDenial.status === 403,
        "Receptionist forbidden from medical records (HTTP 403)"
      );

      // Accountant forbidden from medical records (403)
      const accMedDenial = await request({
        path: `/api/medical-records/${testMedRec.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
      });
      assert(
        accMedDenial.status === 403,
        "Accountant forbidden from medical records (HTTP 403)"
      );
    }

    // ----------------------------------------------------
    // WORKFLOW 6: Prescriptions & Items
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 6: PRESCRIPTIONS & CLINICAL ORDERS ---");
    if (doctorProfileId && testPatient?.id) {
      const prescCreate = await request({
        method: "POST",
        path: "/api/prescriptions",
        headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
        body: {
          patient_id: testPatient.id,
          doctor_id: doctorProfileId,
          notes: "Take after meals",
          items: [
            {
              medicine_name: "Amoxicillin 500mg",
              dosage: "500mg",
              frequency: "3 times daily",
              duration: "7 days",
            },
          ],
        },
      });
      assert(
        prescCreate.status === 201 && prescCreate.data?.data?.id,
        "Doctor created prescription with itemized medication rows"
      );
      const testPresc = prescCreate.data?.data;
      if (testPresc?.id) cleanupIds.prescriptions.push(testPresc.id);

      // Pharmacist can read prescription
      const pharmPrescRead = await request({
        path: `/api/prescriptions/${testPresc.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.pharmacist.token}` },
      });
      assert(
        pharmPrescRead.status === 200,
        "Pharmacist can access prescription details for dispensing (HTTP 200)"
      );

      // Receptionist forbidden from prescriptions (403)
      const recepPrescDenial = await request({
        path: `/api/prescriptions/${testPresc.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.receptionist.token}` },
      });
      assert(
        recepPrescDenial.status === 403,
        "Receptionist forbidden from prescriptions (HTTP 403)"
      );
    }

    // ----------------------------------------------------
    // WORKFLOW 7: Pharmacy Inventory & Atomic Dispensing
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 7: PHARMACY INVENTORY & ATOMIC DISPENSING ---");
    // Admin creates test medicine with stock = 25
    const medCreate = await request({
      method: "POST",
      path: "/api/medicines",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: `TestParacetamol_${timestamp}`,
        code: `MED-${timestamp.toString().slice(-6)}`,
        category: "Analgesic",
        unit_price: 5.5,
        stock_quantity: 25,
        reorder_level: 5,
        unit: "tablets",
      },
    });
    assert(
      medCreate.status === 201 && medCreate.data?.data?.id,
      "Created test medicine with 25 units in stock"
    );
    const testMed = medCreate.data?.data;
    if (testMed?.id) cleanupIds.medicines.push(testMed.id);

    // Pharmacist dispenses 10 units
    const dispenseRes = await request({
      method: "POST",
      path: "/api/pharmacy/dispense",
      headers: { Authorization: `Bearer ${roleAccounts.pharmacist.token}` },
      body: {
        patient_id: testPatient.id,
        items: [
          {
            medicine_id: testMed.id,
            quantity: 10,
          },
        ],
      },
    });
    assert(
      dispenseRes.status === 201,
      "Pharmacist successfully executed atomic dispensing transaction"
    );

    // Verify stock decremented from 25 to 15
    const stockCheck = await pool.query(
      "SELECT quantity_in_stock FROM medicines WHERE id = $1",
      [testMed.id]
    );
    assert(
      stockCheck.rows[0].quantity_in_stock === 15,
      `Stock accurately deducted in database: 25 -> 15 (Got: ${stockCheck.rows[0].quantity_in_stock})`
    );

    // Prevent negative stock: Dispensing 30 units when only 15 exist
    const excessDispense = await request({
      method: "POST",
      path: "/api/pharmacy/dispense",
      headers: { Authorization: `Bearer ${roleAccounts.pharmacist.token}` },
      body: {
        patient_id: testPatient.id,
        items: [
          {
            medicine_id: testMed.id,
            quantity: 30,
          },
        ],
      },
    });
    assert(
      excessDispense.status === 400,
      "Excess dispensing rejected with 400 (Negative inventory prevented)"
    );

    // ----------------------------------------------------
    // WORKFLOW 8: Laboratory Diagnostics & Results Entry
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 8: LABORATORY DIAGNOSTICS & RESULT RECORDING ---");
    // Find an existing lab test
    const labTestQuery = await pool.query("SELECT id FROM lab_tests LIMIT 1");
    let labTestId = null;
    if (labTestQuery.rows.length > 0) {
      labTestId = labTestQuery.rows[0].id;
    } else {
      // Create one if none exists
      const testCreated = await pool.query(
        "INSERT INTO lab_tests (name, category, price) VALUES ($1, $2, $3) RETURNING id",
        [`Blood Test ${timestamp}`, "Hematology", 30.0]
      );
      labTestId = testCreated.rows[0].id;
    }

    // Doctor orders lab test
    const labOrderRes = await request({
      method: "POST",
      path: "/api/lab/orders",
      headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
      body: {
        patient_id: testPatient.id,
        doctor_id: doctorProfileId,
        priority: "routine",
        items: [{ test_id: labTestId }],
      },
    });
    assert(
      labOrderRes.status === 201 && labOrderRes.data?.data?.id,
      "Doctor created lab order with test item"
    );
    const testLabOrder = labOrderRes.data?.data;
    if (testLabOrder?.id) cleanupIds.labOrders.push(testLabOrder.id);

    const testItemId = testLabOrder.items?.[0]?.id;

    // Accountant forbidden from recording lab results (403)
    if (testItemId) {
      const accLabResult = await request({
        method: "PUT",
        path: `/api/lab/items/${testItemId}/result`,
        headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
        body: { result_value: "14.2 g/dL", flags: "normal" },
      });
      assert(
        accLabResult.status === 403,
        "Accountant forbidden from recording lab results (HTTP 403)"
      );

      // Lab Technician records result
      const techLabResult = await request({
        method: "PUT",
        path: `/api/lab/items/${testItemId}/result`,
        headers: { Authorization: `Bearer ${roleAccounts.lab_technician.token}` },
        body: { result_value: "14.2 g/dL", flags: "normal", notes: "Normal range" },
      });
      assert(
        techLabResult.status === 200,
        "Lab technician successfully recorded lab result"
      );

      // Check auto-completion of lab order
      const labOrderCheck = await request({
        path: `/api/lab/orders/${testLabOrder.id}`,
        headers: { Authorization: `Bearer ${roleAccounts.lab_technician.token}` },
      });
      assert(
        labOrderCheck.data?.data?.status === "completed",
        "Lab order automatically transitions to 'completed' when all items logged"
      );
    }

    // ----------------------------------------------------
    // WORKFLOW 9: Billing Invoices & Payments Lifecycle
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 9: BILLING, PAYMENTS & BALANCE CALCULATIONS ---");
    // Accountant creates invoice ($100 consultation + $50 lab - $10 discount + $5 tax = $145)
    const invRes = await request({
      method: "POST",
      path: "/api/billing/invoices",
      headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
      body: {
        patient_id: testPatient.id,
        discount: 10,
        tax: 5,
        items: [
          { description: "Doctor Consultation", quantity: 1, unit_price: 100 },
          { description: "Diagnostic Lab Service", quantity: 1, unit_price: 50 },
        ],
      },
    });
    assert(
      invRes.status === 201 && invRes.data?.data?.id,
      "Accountant created invoice with itemized line items"
    );
    const testInvoice = invRes.data?.data;
    if (testInvoice?.id) cleanupIds.invoices.push(testInvoice.id);

    assert(
      Number(testInvoice.total_amount) === 145 &&
        Number(testInvoice.balance_due) === 145 &&
        testInvoice.status === "unpaid",
      "Invoice calculations accurate: Subtotal $150 - $10 + $5 = $145, status='unpaid'"
    );

    // Receptionist processes partial payment ($50)
    const partPayRes = await request({
      method: "POST",
      path: "/api/billing/payments",
      headers: { Authorization: `Bearer ${roleAccounts.receptionist.token}` },
      body: {
        invoice_id: testInvoice.id,
        amount: 50,
        payment_method: "cash",
      },
    });
    assert(
      partPayRes.status === 201,
      "Receptionist processed partial cash payment of $50"
    );

    // Verify invoice balance due is now $95 and status is 'partially_paid'
    const invCheck1 = await request({
      path: `/api/billing/invoices/${testInvoice.id}`,
      headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
    });
    assert(
      Number(invCheck1.data?.data?.balance_due) === 95 &&
        invCheck1.data?.data?.status === "partially_paid",
      "Invoice status updated to 'partially_paid' and balance_due is $95"
    );

    // Final settlement payment of $95
    const finalPayRes = await request({
      method: "POST",
      path: "/api/billing/payments",
      headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
      body: {
        invoice_id: testInvoice.id,
        amount: 95,
        payment_method: "card",
      },
    });
    assert(
      finalPayRes.status === 201,
      "Accountant processed settlement payment of $95"
    );

    // Verify invoice balance due is 0 and status is 'paid'
    const invCheck2 = await request({
      path: `/api/billing/invoices/${testInvoice.id}`,
      headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
    });
    assert(
      Number(invCheck2.data?.data?.balance_due) === 0 &&
        invCheck2.data?.data?.status === "paid",
      "Invoice status transitions to 'paid' with balance_due = 0"
    );

    // Reject payment exceeding balance
    const overPayRes = await request({
      method: "POST",
      path: "/api/billing/payments",
      headers: { Authorization: `Bearer ${roleAccounts.accountant.token}` },
      body: {
        invoice_id: testInvoice.id,
        amount: 20,
        payment_method: "cash",
      },
    });
    assert(
      overPayRes.status === 400,
      "Overpayment on settled invoice rejected with HTTP 400"
    );

    // ----------------------------------------------------
    // WORKFLOW 10: Executive Dashboard Aggregations
    // ----------------------------------------------------
    console.log("\n--- WORKFLOW 10: DASHBOARD STATISTICS & METRICS ---");
    const dashStats = await request({
      path: "/api/dashboard/stats",
      headers: { Authorization: `Bearer ${roleAccounts.doctor.token}` },
    });
    assert(
      dashStats.status === 200 && dashStats.data?.data !== undefined,
      "Dashboard returns real-time KPI metrics and counts (HTTP 200)"
    );

    // ----------------------------------------------------
    // CLEANUP & INTEGRITY VERIFICATION
    // ----------------------------------------------------
    console.log("\n--- SAFE CLEANUP OF TEMPORARY TEST DATA ---");
    for (const invId of cleanupIds.invoices) {
      await pool.query("DELETE FROM payments WHERE invoice_id = $1", [invId]);
      await pool.query("DELETE FROM invoice_items WHERE invoice_id = $1", [invId]);
      await pool.query("DELETE FROM invoices WHERE id = $1", [invId]);
    }
    for (const loId of cleanupIds.labOrders) {
      await pool.query("DELETE FROM lab_order_items WHERE lab_order_id = $1", [loId]);
      await pool.query("DELETE FROM lab_orders WHERE id = $1", [loId]);
    }
    for (const pId of cleanupIds.prescriptions) {
      await pool.query("DELETE FROM prescription_items WHERE prescription_id = $1", [pId]);
      await pool.query("DELETE FROM prescriptions WHERE id = $1", [pId]);
    }
    for (const mrId of cleanupIds.medicalRecords) {
      await pool.query("DELETE FROM medical_records WHERE id = $1", [mrId]);
    }
    for (const aptId of cleanupIds.appointments) {
      await pool.query("DELETE FROM appointments WHERE id = $1", [aptId]);
    }
    for (const medId of cleanupIds.medicines) {
      await pool.query("DELETE FROM pharmacy_dispensing_items WHERE medicine_id = $1", [medId]);
      await pool.query("DELETE FROM medicines WHERE id = $1", [medId]);
    }
    for (const dId of cleanupIds.departments) {
      await pool.query("DELETE FROM departments WHERE id = $1", [dId]);
    }
    for (const patId of cleanupIds.patients) {
      await pool.query("DELETE FROM pharmacy_dispensing WHERE patient_id = $1", [patId]);
      await pool.query("DELETE FROM patients WHERE id = $1", [patId]);
    }
    for (const uId of cleanupIds.users) {
      await pool.query("DELETE FROM users WHERE id = $1", [uId]);
    }
    console.log("  [INFO] All temporary test records cleaned up successfully.");

    // Integrity check for baseline patient P-0001
    const p1 = await pool.query(
      "SELECT id, patient_number, first_name, last_name, is_active FROM patients WHERE patient_number = 'P-0001'"
    );
    assert(
      p1.rows.length === 1 && p1.rows[0].first_name === "John",
      "Critical baseline patient P-0001 (John Doe) remains active and intact"
    );

    console.log("\n================================================================");
    console.log(`  E2E WORKFLOW VERIFICATION SUMMARY:`);
    console.log(`  PASSED: ${passed}`);
    console.log(`  FAILED: ${failed}`);
    console.log("================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("E2E Test Execution Error:", err);
    process.exit(1);
  }
}

runE2EWorkflowTests();
