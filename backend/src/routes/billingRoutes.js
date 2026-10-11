const express = require("express");

const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPayments,
  createPayment,
} = require("../controllers/billingController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Invoices
router.get(
  "/invoices",
  authenticate,
  authorize("admin", "accountant", "receptionist"),
  getInvoices
);
router.get(
  "/invoices/:id",
  authenticate,
  authorize("admin", "accountant", "receptionist"),
  getInvoiceById
);
router.post(
  "/invoices",
  authenticate,
  authorize("admin", "accountant", "receptionist"),
  createInvoice
);
router.put(
  "/invoices/:id",
  authenticate,
  authorize("admin", "accountant"),
  updateInvoice
);
router.delete("/invoices/:id", authenticate, authorize("admin"), deleteInvoice);

// Payments
router.get(
  "/payments",
  authenticate,
  authorize("admin", "accountant"),
  getPayments
);
router.post(
  "/payments",
  authenticate,
  authorize("admin", "accountant", "receptionist"),
  createPayment
);

module.exports = router;
