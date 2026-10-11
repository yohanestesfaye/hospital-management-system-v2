const express = require("express");

const {
  getLabTests,
  getLabTestById,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  getLabOrders,
  getLabOrderById,
  createLabOrder,
  updateLabOrder,
  updateLabOrderItemResult,
  deleteLabOrder,
} = require("../controllers/labController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Tests catalog
router.get(
  "/tests",
  authenticate,
  authorize("admin", "doctor", "nurse", "lab_technician"),
  getLabTests
);
router.get(
  "/tests/:id",
  authenticate,
  authorize("admin", "doctor", "nurse", "lab_technician"),
  getLabTestById
);
router.post(
  "/tests",
  authenticate,
  authorize("admin", "lab_technician"),
  createLabTest
);
router.put(
  "/tests/:id",
  authenticate,
  authorize("admin", "lab_technician"),
  updateLabTest
);
router.delete(
  "/tests/:id",
  authenticate,
  authorize("admin", "lab_technician"),
  deleteLabTest
);

// Orders
router.get(
  "/orders",
  authenticate,
  authorize("admin", "doctor", "nurse", "lab_technician"),
  getLabOrders
);
router.get(
  "/orders/:id",
  authenticate,
  authorize("admin", "doctor", "nurse", "lab_technician"),
  getLabOrderById
);
router.post(
  "/orders",
  authenticate,
  authorize("admin", "doctor", "nurse"),
  createLabOrder
);
router.put(
  "/orders/:id",
  authenticate,
  authorize("admin", "doctor", "lab_technician"),
  updateLabOrder
);
router.delete("/orders/:id", authenticate, authorize("admin"), deleteLabOrder);

// Results (lab_technician, admin)
router.put(
  "/items/:itemId/result",
  authenticate,
  authorize("admin", "lab_technician"),
  updateLabOrderItemResult
);

module.exports = router;
