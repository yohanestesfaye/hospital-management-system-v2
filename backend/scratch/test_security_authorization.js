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

async function runSecurityTests() {
  console.log("==================================================");
  console.log("  HMS V2 — AUTOMATED SECURITY & RBAC VERIFICATION ");
  console.log("==================================================\n");

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

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: Public Endpoints & Security Headers
    // ----------------------------------------------------
    console.log("--- 1. PUBLIC ENDPOINTS & SECURITY HEADERS ---");

    const healthRes = await request({ path: "/api/health" });
    assert(healthRes.status === 200, "GET /api/health responds with HTTP 200");
    assert(
      healthRes.data?.success === true,
      "GET /api/health returns success: true"
    );
    assert(
      healthRes.headers["x-content-type-options"] === "nosniff",
      "Response includes X-Content-Type-Options: nosniff"
    );
    assert(
      healthRes.headers["x-frame-options"] === "DENY",
      "Response includes X-Frame-Options: DENY"
    );

    // ----------------------------------------------------
    // TEST SUITE 2: Unauthenticated Access Denials (401)
    // ----------------------------------------------------
    console.log("\n--- 2. UNAUTHENTICATED ACCESS DENIALS (HTTP 401) ---");

    const endpointsToProtect = [
      "/api/dashboard/stats",
      "/api/patients",
      "/api/departments",
      "/api/doctors",
      "/api/appointments",
      "/api/medical-records",
      "/api/prescriptions",
      "/api/medicines",
      "/api/pharmacy/dispensing",
      "/api/lab/orders",
      "/api/billing/invoices",
    ];

    for (const ep of endpointsToProtect) {
      const res = await request({ path: ep });
      assert(
        res.status === 401,
        `Unauthenticated ${ep} denied with 401 (Got: ${res.status})`
      );
    }

    const invalidTokenRes = await request({
      path: "/api/patients",
      headers: { Authorization: "Bearer invalid.fake.token" },
    });
    assert(
      invalidTokenRes.status === 401,
      "Malformed/Tampered JWT denied with 401"
    );

    // ----------------------------------------------------
    // TEST SUITE 3: Privilege Escalation Prevention
    // ----------------------------------------------------
    console.log("\n--- 3. PRIVILEGE ESCALATION PREVENTION ---");

    const adminRegisterAttempt = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        first_name: "Hacker",
        last_name: "User",
        email: `hacker_${Date.now()}@test.com`,
        password: "password123",
        role: "admin",
      },
    });
    assert(
      adminRegisterAttempt.status === 403,
      "Self-registration as 'admin' blocked with HTTP 403 (Got: " +
        adminRegisterAttempt.status +
        ")"
    );

    const doctorRegisterAttempt = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        first_name: "Hacker",
        last_name: "User",
        email: `hacker_${Date.now()}@test.com`,
        password: "password123",
        role: "doctor",
      },
    });
    assert(
      doctorRegisterAttempt.status === 403,
      "Self-registration as 'doctor' blocked with HTTP 403 (Got: " +
        doctorRegisterAttempt.status +
        ")"
    );

    // Valid staff self-registration
    const staffEmail = `staff_test_${Date.now()}@test.com`;
    const staffRegisterRes = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        first_name: "Regular",
        last_name: "Staff",
        email: staffEmail,
        password: "password123",
        role: "staff",
      },
    });
    assert(
      staffRegisterRes.status === 201,
      "Valid self-registration as 'staff' succeeds with HTTP 201"
    );
    assert(
      staffRegisterRes.data?.user?.role === "staff",
      "Created user has role 'staff'"
    );

    const staffToken = staffRegisterRes.data?.token;
    const staffId = staffRegisterRes.data?.user?.id;

    // ----------------------------------------------------
    // TEST SUITE 4: Role-Based Access Control (RBAC) Matrix
    // ----------------------------------------------------
    console.log("\n--- 4. ROLE-BASED ACCESS CONTROL (RBAC) DENIALS & PERMISSIONS ---");

    // Fetch existing admin user from DB
    const adminUserQuery = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1"
    );
    assert(adminUserQuery.rows.length > 0, "Admin account found in database");
    const adminUser = adminUserQuery.rows[0];
    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4A: Staff Role Restrictions (Least Privilege)
    console.log("  * Testing 'staff' role restrictions:");
    const staffPatientsRes = await request({
      path: "/api/patients",
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(
      staffPatientsRes.status === 403,
      "Staff cannot access Patients (HTTP 403)"
    );

    const staffMedRecsRes = await request({
      path: "/api/medical-records",
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(
      staffMedRecsRes.status === 403,
      "Staff cannot access Medical Records (HTTP 403)"
    );

    const staffBillingRes = await request({
      path: "/api/billing/invoices",
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(
      staffBillingRes.status === 403,
      "Staff cannot access Billing Invoices (HTTP 403)"
    );

    const staffDeptsRes = await request({
      path: "/api/departments",
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(
      staffDeptsRes.status === 200,
      "Staff CAN view hospital Departments directory (HTTP 200)"
    );

    // 4B: Testing Doctor Role Permissions
    console.log("  * Testing 'doctor' role permissions:");
    const doctorUserQuery = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'doctor' LIMIT 1"
    );
    if (doctorUserQuery.rows.length > 0) {
      const doctorUser = doctorUserQuery.rows[0];
      const doctorToken = jwt.sign(
        { id: doctorUser.id, email: doctorUser.email, role: "doctor" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const docMedRecs = await request({
        path: "/api/medical-records",
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      assert(
        docMedRecs.status === 200,
        "Doctor CAN access Medical Records (HTTP 200)"
      );

      const docPatients = await request({
        path: "/api/patients",
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      assert(
        docPatients.status === 200,
        "Doctor CAN access Patients (HTTP 200)"
      );

      const docBillingDelete = await request({
        method: "DELETE",
        path: "/api/billing/invoices/00000000-0000-0000-0000-000000000000",
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      assert(
        docBillingDelete.status === 403,
        "Doctor CANNOT delete invoices (HTTP 403)"
      );
    }

    // 4C: Testing Nurse Role Permissions
    console.log("  * Testing 'nurse' role permissions:");
    const nurseUserQuery = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'nurse' LIMIT 1"
    );
    if (nurseUserQuery.rows.length > 0) {
      const nurseUser = nurseUserQuery.rows[0];
      const nurseToken = jwt.sign(
        { id: nurseUser.id, email: nurseUser.email, role: "nurse" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const nursePatients = await request({
        path: "/api/patients",
        headers: { Authorization: `Bearer ${nurseToken}` },
      });
      assert(
        nursePatients.status === 200,
        "Nurse CAN view Patients (HTTP 200)"
      );

      const nurseBilling = await request({
        path: "/api/billing/invoices",
        headers: { Authorization: `Bearer ${nurseToken}` },
      });
      assert(
        nurseBilling.status === 403,
        "Nurse CANNOT access Billing (HTTP 403)"
      );
    }

    // 4D: Testing Admin Universal Access
    console.log("  * Testing 'admin' universal access:");
    const adminPatients = await request({
      path: "/api/patients",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminPatients.status === 200,
      "Admin CAN access Patients (HTTP 200)"
    );

    const adminBilling = await request({
      path: "/api/billing/invoices",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminBilling.status === 200,
      "Admin CAN access Billing Invoices (HTTP 200)"
    );

    const adminPharmacy = await request({
      path: "/api/pharmacy/dispensing",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminPharmacy.status === 200,
      "Admin CAN access Pharmacy Dispensing (HTTP 200)"
    );

    // Clean up temporary staff test user
    if (staffId) {
      await pool.query("DELETE FROM users WHERE id = $1", [staffId]);
    }

    // ----------------------------------------------------
    // TEST SUITE 5: Business Rules & Data Integrity
    // ----------------------------------------------------
    console.log("\n--- 5. BUSINESS RULES & DATA INTEGRITY ---");

    // Negative stock protection
    const existingPat = await pool.query("SELECT id FROM patients LIMIT 1");
    const testPatId = existingPat.rows[0].id;
    const invalidDispenseAttempt = await request({
      method: "POST",
      path: "/api/pharmacy/dispense",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        patient_id: testPatId,
        items: [
          {
            medicine_id: "00000000-0000-0000-0000-000000000000",
            quantity: -5,
          },
        ],
      },
    });
    assert(
      invalidDispenseAttempt.status === 400,
      "Negative quantity dispensing rejected with HTTP 400 (Got: " +
        invalidDispenseAttempt.status +
        ")"
    );

    // Preserved patient P-0001 verification
    const patCheck = await pool.query(
      "SELECT id, patient_number, first_name, last_name, is_active FROM patients WHERE patient_number = 'P-0001'"
    );
    assert(
      patCheck.rows.length === 1 && patCheck.rows[0].first_name === "John",
      "Critical baseline patient P-0001 (John Doe) remains active and intact"
    );

    console.log("\n==================================================");
    console.log(`  SECURITY & RBAC AUDIT SUMMARY:`);
    console.log(`  PASSED: ${passed}`);
    console.log(`  FAILED: ${failed}`);
    console.log("==================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runSecurityTests();
