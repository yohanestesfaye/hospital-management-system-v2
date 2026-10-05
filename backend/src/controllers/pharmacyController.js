const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STATUSES = ["pending", "dispensed", "cancelled"];

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all dispensing records (with joined patient, prescription, items)
const getDispensingRecords = async (req, res) => {
  try {
    const { patient_id, prescription_id, status } = req.query;

    let queryText = `
      SELECT
        pd.id,
        pd.patient_id,
        pd.prescription_id,
        pd.dispensed_by,
        pd.dispensing_date,
        pd.status,
        pd.notes,
        pd.created_at,
        pd.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        u.first_name AS dispenser_first_name,
        u.last_name AS dispenser_last_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pdi.id,
              'medicine_id', pdi.medicine_id,
              'medicine_name', m.name,
              'quantity', pdi.quantity,
              'unit_price', pdi.unit_price,
              'total_price', (pdi.quantity * pdi.unit_price),
              'created_at', pdi.created_at
            )
          ) FILTER (WHERE pdi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM pharmacy_dispensing pd
      JOIN patients p ON pd.patient_id = p.id
      LEFT JOIN users u ON pd.dispensed_by = u.id
      LEFT JOIN pharmacy_dispensing_items pdi ON pd.id = pdi.dispensing_id
      LEFT JOIN medicines m ON pdi.medicine_id = m.id
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
      conditions.push(`pd.patient_id = $${queryParams.length}`);
    }

    if (prescription_id) {
      if (!isValidUuid(prescription_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid prescription_id format",
        });
      }
      queryParams.push(prescription_id);
      conditions.push(`pd.prescription_id = $${queryParams.length}`);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }
      queryParams.push(status);
      conditions.push(`pd.status = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += `
      GROUP BY pd.id, p.id, u.id
      ORDER BY pd.dispensing_date DESC
    `;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get dispensing records error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dispensing records",
    });
  }
};

// GET a dispensing record by ID
const getDispensingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispensing record ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        pd.id,
        pd.patient_id,
        pd.prescription_id,
        pd.dispensed_by,
        pd.dispensing_date,
        pd.status,
        pd.notes,
        pd.created_at,
        pd.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        u.first_name AS dispenser_first_name,
        u.last_name AS dispenser_last_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pdi.id,
              'medicine_id', pdi.medicine_id,
              'medicine_name', m.name,
              'quantity', pdi.quantity,
              'unit_price', pdi.unit_price,
              'total_price', (pdi.quantity * pdi.unit_price),
              'created_at', pdi.created_at
            )
          ) FILTER (WHERE pdi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM pharmacy_dispensing pd
      JOIN patients p ON pd.patient_id = p.id
      LEFT JOIN users u ON pd.dispensed_by = u.id
      LEFT JOIN pharmacy_dispensing_items pdi ON pd.id = pdi.dispensing_id
      LEFT JOIN medicines m ON pdi.medicine_id = m.id
      WHERE pd.id = $1
      GROUP BY pd.id, p.id, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dispensing record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get dispensing by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dispensing record",
    });
  }
};

// CREATE a dispensing record with stock deduction inside a transaction
const createDispensing = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      patient_id,
      prescription_id,
      dispensed_by,
      dispensing_date,
      status,
      notes,
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
        message: "At least one dispensing item is required",
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

    if (prescription_id) {
      if (!isValidUuid(prescription_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid prescription_id format",
        });
      }
      const prCheck = await client.query(
        "SELECT id FROM prescriptions WHERE id = $1",
        [prescription_id]
      );
      if (prCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }
    }

    if (dispensed_by) {
      if (!isValidUuid(dispensed_by)) {
        return res.status(400).json({
          success: false,
          message: "Invalid dispensed_by user ID format",
        });
      }
      const uCheck = await client.query(
        "SELECT id FROM users WHERE id = $1",
        [dispensed_by]
      );
      if (uCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Dispenser user not found",
        });
      }
    }

    const dispensingStatus = status || "dispensed";
    if (!VALID_STATUSES.includes(dispensingStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    await client.query("BEGIN");

    // Stock verification and preparation
    const validatedItems = [];

    for (const item of items) {
      if (!item.medicine_id || !isValidUuid(item.medicine_id)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Valid medicine_id is required for every item",
        });
      }

      const rawQty = item.quantity !== undefined ? item.quantity : item.quantity_dispensed;
      const qty = Number(rawQty);
      if (isNaN(qty) || qty <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than zero",
        });
      }

      // Check medicine existence and lock row for stock update
      const medRes = await client.query(
        "SELECT id, name, quantity_in_stock, unit_price FROM medicines WHERE id = $1 FOR UPDATE",
        [item.medicine_id]
      );

      if (medRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicine_id} not found`,
        });
      }

      const medicine = medRes.rows[0];

      // If dispensing, verify available stock
      if (dispensingStatus === "dispensed") {
        if (medicine.quantity_in_stock < qty) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for medicine "${medicine.name}". Available: ${medicine.quantity_in_stock}, Requested: ${qty}`,
          });
        }

        // Deduct stock safely
        await client.query(
          `UPDATE medicines SET
            quantity_in_stock = quantity_in_stock - $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [qty, medicine.id]
        );
      }

      const unitPrice =
        item.unit_price !== undefined ? Number(item.unit_price) : medicine.unit_price;

      validatedItems.push({
        medicine_id: medicine.id,
        quantity: qty,
        unit_price: unitPrice,
      });
    }

    // Insert pharmacy_dispensing record
    const dispResult = await client.query(
      `INSERT INTO pharmacy_dispensing (
        patient_id,
        prescription_id,
        dispensed_by,
        dispensing_date,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        patient_id,
        prescription_id || null,
        dispensed_by || null,
        dispensing_date || new Date().toISOString(),
        dispensingStatus,
        notes ? notes.trim() : null,
      ]
    );

    const dispensingId = dispResult.rows[0].id;

    // Insert pharmacy_dispensing_items
    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO pharmacy_dispensing_items (
          dispensing_id,
          medicine_id,
          quantity,
          unit_price
        )
        VALUES ($1, $2, $3, $4)`,
        [dispensingId, vItem.medicine_id, vItem.quantity, vItem.unit_price]
      );
    }

    // If prescription exists and status is dispensed, mark prescription completed
    if (prescription_id && dispensingStatus === "dispensed") {
      await client.query(
        `UPDATE prescriptions SET
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [prescription_id]
      );
    }

    await client.query("COMMIT");

    // Fetch full response
    const fullDispensing = await pool.query(
      `SELECT
        pd.id,
        pd.patient_id,
        pd.prescription_id,
        pd.dispensed_by,
        pd.dispensing_date,
        pd.status,
        pd.notes,
        pd.created_at,
        pd.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pdi.id,
              'medicine_id', pdi.medicine_id,
              'medicine_name', m.name,
              'quantity', pdi.quantity,
              'unit_price', pdi.unit_price,
              'total_price', (pdi.quantity * pdi.unit_price)
            )
          ) FILTER (WHERE pdi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM pharmacy_dispensing pd
      JOIN patients p ON pd.patient_id = p.id
      LEFT JOIN pharmacy_dispensing_items pdi ON pd.id = pdi.dispensing_id
      LEFT JOIN medicines m ON pdi.medicine_id = m.id
      WHERE pd.id = $1
      GROUP BY pd.id, p.id`,
      [dispensingId]
    );

    res.status(201).json({
      success: true,
      message: "Medicine dispensed successfully",
      data: fullDispensing.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create dispensing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record dispensing",
    });
  } finally {
    client.release();
  }
};

// UPDATE a dispensing record
const updateDispensing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispensing record ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM pharmacy_dispensing WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dispensing record not found",
      });
    }

    const current = check.rows[0];
    const { status, notes } = req.body;

    const targetStatus = status !== undefined ? status : current.status;
    if (targetStatus && !VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    await pool.query(
      `UPDATE pharmacy_dispensing SET
        status = $1,
        notes = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [
        targetStatus,
        notes !== undefined ? (notes ? notes.trim() : null) : current.notes,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Dispensing record updated successfully",
    });
  } catch (error) {
    console.error("Update dispensing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update dispensing record",
    });
  }
};

// DELETE a dispensing record
const deleteDispensing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispensing record ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM pharmacy_dispensing WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dispensing record not found",
      });
    }

    await pool.query("DELETE FROM pharmacy_dispensing WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Dispensing record deleted successfully",
    });
  } catch (error) {
    console.error("Delete dispensing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete dispensing record",
    });
  }
};

module.exports = {
  getDispensingRecords,
  getDispensingById,
  createDispensing,
  updateDispensing,
  deleteDispensing,
};
