const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_INVOICE_STATUSES = [
  "unpaid",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
];

const VALID_PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "mobile_money",
  "insurance",
];

const isValidUuid = (id) => UUID_REGEX.test(id);

// --- INVOICES ---

// GET all invoices (with joined patient, items and payments)
const getInvoices = async (req, res) => {
  try {
    const { patient_id, status, search } = req.query;

    let queryText = `
      SELECT
        i.id,
        i.invoice_number,
        i.patient_id,
        i.appointment_id,
        i.subtotal,
        i.discount,
        i.tax,
        i.total_amount,
        i.amount_paid,
        i.balance_due,
        i.status,
        i.due_date,
        i.notes,
        i.created_by,
        i.created_at,
        i.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ii.id,
                'description', ii.description,
                'quantity', ii.quantity,
                'unit_price', ii.unit_price,
                'total_price', ii.total_price
              )
            )
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ),
          '[]'
        ) AS items,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pay.id,
                'amount', pay.amount,
                'payment_method', pay.payment_method,
                'transaction_reference', pay.transaction_reference,
                'payment_date', pay.payment_date
              )
            )
            FROM payments pay
            WHERE pay.invoice_id = i.id
          ),
          '[]'
        ) AS payments
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
    `;

    const conditions = [];
    const queryParams = [];

    if (patient_id) {
      if (!isValidUuid(patient_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient_id format",
        });
      }
      queryParams.push(patient_id);
      conditions.push(`i.patient_id = $${queryParams.length}`);
    }

    if (status) {
      if (!VALID_INVOICE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${VALID_INVOICE_STATUSES.join(", ")}`,
        });
      }
      queryParams.push(status);
      conditions.push(`i.status = $${queryParams.length}`);
    }

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(i.invoice_number ILIKE $${paramIndex} OR p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.patient_number ILIKE $${paramIndex})`
      );
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get invoices error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve invoices",
    });
  }
};

// GET an invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        i.id,
        i.invoice_number,
        i.patient_id,
        i.appointment_id,
        i.subtotal,
        i.discount,
        i.tax,
        i.total_amount,
        i.amount_paid,
        i.balance_due,
        i.status,
        i.due_date,
        i.notes,
        i.created_by,
        i.created_at,
        i.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ii.id,
                'description', ii.description,
                'quantity', ii.quantity,
                'unit_price', ii.unit_price,
                'total_price', ii.total_price
              )
            )
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ),
          '[]'
        ) AS items,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pay.id,
                'amount', pay.amount,
                'payment_method', pay.payment_method,
                'transaction_reference', pay.transaction_reference,
                'payment_date', pay.payment_date,
                'notes', pay.notes
              )
            )
            FROM payments pay
            WHERE pay.invoice_id = i.id
          ),
          '[]'
        ) AS payments
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get invoice by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice",
    });
  }
};

// CREATE an invoice with items in a transaction
const createInvoice = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      patient_id,
      appointment_id,
      invoice_number,
      discount,
      discount_amount,
      tax,
      tax_amount,
      due_date,
      notes,
      created_by,
      items,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "patient_id is required",
      });
    }

    if (!isValidUuid(patient_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient_id format",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required in items array",
      });
    }

    const patCheck = await client.query(
      "SELECT id FROM patients WHERE id = $1",
      [patient_id]
    );
    if (patCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (appointment_id) {
      if (!isValidUuid(appointment_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment_id format",
        });
      }
      const appCheck = await client.query(
        "SELECT id FROM appointments WHERE id = $1",
        [appointment_id]
      );
      if (appCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
    }

    // Validate and compute items
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.description || item.description.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "description is required for every item",
        });
      }

      const qty = item.quantity !== undefined ? Number(item.quantity) : 1;
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "quantity must be a positive integer",
        });
      }

      const price = item.unit_price !== undefined ? Number(item.unit_price) : 0;
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "unit_price must be a non-negative number",
        });
      }

      const totalPrice = qty * price;
      subtotal += totalPrice;

      validatedItems.push({
        description: item.description.trim(),
        quantity: qty,
        unit_price: price,
        total_price: totalPrice,
      });
    }

    const rawDisc = discount !== undefined ? discount : discount_amount;
    const disc = rawDisc !== undefined ? Number(rawDisc) : 0;
    if (isNaN(disc) || disc < 0) {
      return res.status(400).json({
        success: false,
        message: "discount must be a non-negative number",
      });
    }

    const rawTax = tax !== undefined ? tax : tax_amount;
    const taxAmount = rawTax !== undefined ? Number(rawTax) : 0;
    if (isNaN(taxAmount) || taxAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "tax must be a non-negative number",
      });
    }

    const totalAmount = Math.max(0, subtotal - disc + taxAmount);
    const generatedInvoiceNumber =
      invoice_number || `INV-${Date.now().toString().slice(-6)}`;

    await client.query("BEGIN");

    const invResult = await client.query(
      `INSERT INTO invoices (
        invoice_number,
        patient_id,
        appointment_id,
        subtotal,
        discount,
        tax,
        total_amount,
        amount_paid,
        balance_due,
        status,
        due_date,
        notes,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'unpaid', $9, $10, $11)
      RETURNING *`,
      [
        generatedInvoiceNumber,
        patient_id,
        appointment_id || null,
        subtotal,
        disc,
        taxAmount,
        totalAmount,
        totalAmount,
        due_date || null,
        notes ? notes.trim() : null,
        created_by || null,
      ]
    );

    const invoiceId = invResult.rows[0].id;

    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          total_price
        )
        VALUES ($1, $2, $3, $4, $5)`,
        [
          invoiceId,
          vItem.description,
          vItem.quantity,
          vItem.unit_price,
          vItem.total_price,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: {
        ...invResult.rows[0],
        items: validatedItems,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create invoice error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An invoice with this invoice_number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });
  } finally {
    client.release();
  }
};

// UPDATE an invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM invoices WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const current = check.rows[0];
    const { status, due_date, notes } = req.body;

    const targetStatus = status !== undefined ? status : current.status;
    if (targetStatus && !VALID_INVOICE_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_INVOICE_STATUSES.join(", ")}`,
      });
    }

    const result = await pool.query(
      `UPDATE invoices SET
        status = $1,
        due_date = $2,
        notes = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
      [
        targetStatus,
        due_date !== undefined ? due_date : current.due_date,
        notes !== undefined ? (notes ? notes.trim() : null) : current.notes,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update invoice",
    });
  }
};

// DELETE an invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM invoices WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await pool.query("DELETE FROM invoices WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Delete invoice error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete invoice with recorded payments",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
    });
  }
};

// --- PAYMENTS ---

// GET all payments
const getPayments = async (req, res) => {
  try {
    const { invoice_id } = req.query;

    let queryText = `
      SELECT
        p.id,
        p.invoice_id,
        p.amount,
        p.payment_method,
        p.transaction_reference,
        p.payment_date,
        p.received_by,
        p.notes,
        p.created_at,
        i.invoice_number,
        i.status AS invoice_status,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN patients pat ON i.patient_id = pat.id
    `;

    const queryParams = [];
    if (invoice_id) {
      if (!isValidUuid(invoice_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice_id format",
        });
      }
      queryParams.push(invoice_id);
      queryText += ` WHERE p.invoice_id = $1`;
    }

    queryText += ` ORDER BY p.payment_date DESC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve payments",
    });
  }
};

// RECORD a payment against an invoice (updates amount_paid, balance_due, and status in transaction)
const createPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      invoice_id,
      amount,
      payment_method,
      transaction_reference,
      received_by,
      notes,
    } = req.body;

    if (!invoice_id || amount === undefined || !payment_method) {
      return res.status(400).json({
        success: false,
        message: "invoice_id, amount and payment_method are required",
      });
    }

    if (!isValidUuid(invoice_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice_id format",
      });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "payment amount must be greater than zero",
      });
    }

    if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
      });
    }

    await client.query("BEGIN");

    // Lock invoice for balance update
    const invRes = await client.query(
      "SELECT id, total_amount, amount_paid, balance_due, status FROM invoices WHERE id = $1 FOR UPDATE",
      [invoice_id]
    );

    if (invRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const invoice = invRes.rows[0];
    const currentBalance = Number(invoice.balance_due);

    if (payAmount > currentBalance) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Payment amount (${payAmount}) exceeds outstanding balance due (${currentBalance})`,
      });
    }

    // Insert payment record
    const payResult = await client.query(
      `INSERT INTO payments (
        invoice_id,
        amount,
        payment_method,
        transaction_reference,
        received_by,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        invoice_id,
        payAmount,
        payment_method,
        transaction_reference ? transaction_reference.trim() : null,
        received_by || null,
        notes ? notes.trim() : null,
      ]
    );

    const newAmountPaid = Number(invoice.amount_paid) + payAmount;
    const newBalanceDue = currentBalance - payAmount;
    const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid";

    await client.query(
      `UPDATE invoices SET
        amount_paid = $1,
        balance_due = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [newAmountPaid, newBalanceDue, newStatus, invoice_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment: payResult.rows[0],
        invoice_update: {
          invoice_id,
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus,
        },
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPayments,
  createPayment,
};
