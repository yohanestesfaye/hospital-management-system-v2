const express = require("express");

const {
  getDispensingRecords,
  getDispensingById,
  createDispensing,
  updateDispensing,
  deleteDispensing,
} = require("../controllers/pharmacyController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// List dispensings (admin, pharmacist)
router.get(
  "/dispensing",
  authenticate,
  authorize("admin", "pharmacist"),
  getDispensingRecords
);
router.get(
  "/dispensings",
  authenticate,
  authorize("admin", "pharmacist"),
  getDispensingRecords
);
router.get(
  "/",
  authenticate,
  authorize("admin", "pharmacist"),
  getDispensingRecords
);

// Create dispensing (admin, pharmacist)
router.post(
  "/dispensing",
  authenticate,
  authorize("admin", "pharmacist"),
  createDispensing
);
router.post(
  "/dispense",
  authenticate,
  authorize("admin", "pharmacist"),
  createDispensing
);
router.post(
  "/",
  authenticate,
  authorize("admin", "pharmacist"),
  createDispensing
);

// Get single dispensing
router.get(
  "/dispensing/:id",
  authenticate,
  authorize("admin", "pharmacist"),
  getDispensingById
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "pharmacist"),
  getDispensingById
);

// Update dispensing
router.put(
  "/dispensing/:id",
  authenticate,
  authorize("admin", "pharmacist"),
  updateDispensing
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "pharmacist"),
  updateDispensing
);

// Delete dispensing (admin only)
router.delete(
  "/dispensing/:id",
  authenticate,
  authorize("admin"),
  deleteDispensing
);
router.delete("/:id", authenticate, authorize("admin"), deleteDispensing);

module.exports = router;
