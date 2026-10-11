const patientRoutes = require("./routes/patientRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const labRoutes = require("./routes/labRoutes");
const billingRoutes = require("./routes/billingRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { testDatabaseConnection } = require("./config/database");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

const { apiLimiter } = require("./middleware/rateLimiter");

// Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Health check (always available, unthrottled)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hospital Management System API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());

// Apply API rate limiting
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/billing", billingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Centralized production-safe error handler
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message || "An unexpected error occurred",
  });
});

// Start server
const startServer = async () => {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(
      `HMS backend server running on http://localhost:${PORT}`
    );
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;