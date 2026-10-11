const express = require("express");

const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read patients
router.get(
  "/",
  authenticate,
  authorize("admin", "doctor", "nurse", "receptionist", "accountant"),
  getPatients
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "doctor", "nurse", "receptionist", "accountant"),
  getPatientById
);

// Create patient
router.post(
  "/",
  authenticate,
  authorize("admin", "receptionist", "nurse", "doctor"),
  createPatient
);

// Update patient
router.put(
  "/:id",
  authenticate,
  authorize("admin", "receptionist", "nurse", "doctor"),
  updatePatient
);

// Delete patient (admin only)
router.delete("/:id", authenticate, authorize("admin"), deletePatient);

module.exports = router;