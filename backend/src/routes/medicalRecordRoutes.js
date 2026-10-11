const express = require("express");

const {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecordController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read clinical records
router.get(
  "/:id",
  authenticate,
  authorize("admin", "doctor", "nurse"),
  getMedicalRecordById
);
router.get(
  "/",
  authenticate,
  authorize("admin", "doctor", "nurse"),
  getMedicalRecords
);

// Create clinical records (doctor or admin)
router.post(
  "/",
  authenticate,
  authorize("admin", "doctor"),
  createMedicalRecord
);

// Update clinical records (doctor or admin)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "doctor"),
  updateMedicalRecord
);

// Delete clinical records (admin only)
router.delete("/:id", authenticate, authorize("admin"), deleteMedicalRecord);

module.exports = router;
