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

const router = express.Router();

// Invoices
router.get("/invoices", getInvoices);
router.post("/invoices", createInvoice);
router.get("/invoices/:id", getInvoiceById);
router.put("/invoices/:id", updateInvoice);
router.delete("/invoices/:id", deleteInvoice);

// Payments
router.get("/payments", getPayments);
router.post("/payments", createPayment);

module.exports = router;
