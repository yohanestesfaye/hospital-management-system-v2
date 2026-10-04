const express = require("express");

const {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecordController");

const router = express.Router();

router.get("/", getMedicalRecords);
router.post("/", createMedicalRecord);
router.get("/:id", getMedicalRecordById);
router.put("/:id", updateMedicalRecord);
router.delete("/:id", deleteMedicalRecord);

module.exports = router;
