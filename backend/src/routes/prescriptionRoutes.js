const express = require("express");

const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.get("/", getPrescriptions);
router.post("/", createPrescription);
router.get("/:id", getPrescriptionById);
router.put("/:id", updatePrescription);
router.delete("/:id", deletePrescription);

module.exports = router;
