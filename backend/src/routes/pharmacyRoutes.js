const express = require("express");

const {
  getDispensingRecords,
  getDispensingById,
  createDispensing,
  updateDispensing,
  deleteDispensing,
} = require("../controllers/pharmacyController");

const router = express.Router();

router.get("/dispensing", getDispensingRecords);
router.post("/dispensing", createDispensing);
router.get("/dispensing/:id", getDispensingById);
router.put("/dispensing/:id", updateDispensing);
router.delete("/dispensing/:id", deleteDispensing);

module.exports = router;
