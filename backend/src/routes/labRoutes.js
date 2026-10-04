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

const router = express.Router();

// Tests catalog
router.get("/tests", getLabTests);
router.post("/tests", createLabTest);
router.get("/tests/:id", getLabTestById);
router.put("/tests/:id", updateLabTest);
router.delete("/tests/:id", deleteLabTest);

// Orders
router.get("/orders", getLabOrders);
router.post("/orders", createLabOrder);
router.get("/orders/:id", getLabOrderById);
router.put("/orders/:id", updateLabOrder);
router.delete("/orders/:id", deleteLabOrder);

// Results
router.put("/items/:itemId/result", updateLabOrderItemResult);

module.exports = router;
