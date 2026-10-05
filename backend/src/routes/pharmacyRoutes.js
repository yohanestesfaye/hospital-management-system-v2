const express = require("express");

const {
  getDispensingRecords,
  getDispensingById,
  createDispensing,
  updateDispensing,
  deleteDispensing,
} = require("../controllers/pharmacyController");

const router = express.Router();

// List dispensings
router.get("/dispensing", getDispensingRecords);
router.get("/dispensings", getDispensingRecords);
router.get("/", getDispensingRecords);

// Create dispensing
router.post("/dispensing", createDispensing);
router.post("/dispense", createDispensing);
router.post("/", createDispensing);

// Get single dispensing
router.get("/dispensing/:id", getDispensingById);
router.get("/:id", getDispensingById);

// Update dispensing
router.put("/dispensing/:id", updateDispensing);
router.put("/:id", updateDispensing);

// Delete dispensing
router.delete("/dispensing/:id", deleteDispensing);
router.delete("/:id", deleteDispensing);

module.exports = router;
