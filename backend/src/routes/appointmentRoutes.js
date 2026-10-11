const express = require("express");

const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read appointments
router.get(
  "/",
  authenticate,
  authorize("admin", "doctor", "nurse", "receptionist"),
  getAppointments
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "doctor", "nurse", "receptionist"),
  getAppointmentById
);

// Create appointment
router.post(
  "/",
  authenticate,
  authorize("admin", "receptionist", "doctor", "nurse"),
  createAppointment
);

// Update appointment
router.put(
  "/:id",
  authenticate,
  authorize("admin", "receptionist", "doctor", "nurse"),
  updateAppointment
);

// Delete appointment
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "receptionist"),
  deleteAppointment
);

module.exports = router;
