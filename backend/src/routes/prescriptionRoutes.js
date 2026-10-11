const express = require("express");

const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require("../controllers/prescriptionController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read prescriptions
router.get(
  "/",
  authenticate,
  authorize("admin", "doctor", "nurse", "pharmacist"),
  getPrescriptions
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "doctor", "nurse", "pharmacist"),
  getPrescriptionById
);

// Create prescription (doctor or admin)
router.post(
  "/",
  authenticate,
  authorize("admin", "doctor"),
  createPrescription
);

// Update prescription (doctor, pharmacist, admin)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "doctor", "pharmacist"),
  updatePrescription
);

// Delete prescription (doctor or admin)
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "doctor"),
  deletePrescription
);

module.exports = router;
