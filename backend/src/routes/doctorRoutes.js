const express = require("express");

const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read doctors (all authenticated staff)
router.get("/", authenticate, getDoctors);
router.get("/:id", authenticate, getDoctorById);

// Admin-only management
router.post("/", authenticate, authorize("admin"), createDoctor);
router.put("/:id", authenticate, authorize("admin"), updateDoctor);
router.delete("/:id", authenticate, authorize("admin"), deleteDoctor);

module.exports = router;
