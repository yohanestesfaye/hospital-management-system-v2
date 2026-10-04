const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STATUSES = ["active", "completed", "cancelled"];

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all prescriptions (with joined patient, doctor and nested items)
const getPrescriptions = async (req, res) => {
  try {
    const { patient_id, doctor_id, status } = req.query;

    let queryText = `
      SELECT
        p.id,
        p.patient_id,
        p.doctor_id,
        p.medical_record_id,
        p.prescription_date,
        p.notes,
        p.status,
        p.created_at,
        p.updated_at,
        pat.patient_number,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'medicine_name', pi.medicine_name,
              'dosage', pi.dosage,
              'frequency', pi.frequency,
              'duration', pi.duration,
              'quantity', pi.quantity,
              'instructions', pi.instructions,
              'created_at', pi.created_at
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN doctors d ON p.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
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
      conditions.push(`p.patient_id = $${queryParams.length}`);
    }

    if (doctor_id) {
      if (!isValidUuid(doctor_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor_id format",
        });
      }
      queryParams.push(doctor_id);
      conditions.push(`p.doctor_id = $${queryParams.length}`);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }
      queryParams.push(status);
      conditions.push(`p.status = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += `
      GROUP BY p.id, pat.id, d.id, u.id
      ORDER BY p.prescription_date DESC
    `;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get prescriptions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve prescriptions",
    });
  }
};

// GET a prescription by ID (with full items)
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        p.id,
        p.patient_id,
        p.doctor_id,
        p.medical_record_id,
        p.prescription_date,
        p.notes,
        p.status,
        p.created_at,
        p.updated_at,
        pat.patient_number,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name,
        pat.phone AS patient_phone,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'medicine_name', pi.medicine_name,
              'dosage', pi.dosage,
              'frequency', pi.frequency,
              'duration', pi.duration,
              'quantity', pi.quantity,
              'instructions', pi.instructions,
              'created_at', pi.created_at
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN doctors d ON p.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      WHERE p.id = $1
      GROUP BY p.id, pat.id, d.id, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get prescription by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve prescription",
    });
  }
};

// CREATE a prescription with nested items in a transaction
const createPrescription = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      patient_id,
      doctor_id,
      medical_record_id,
      prescription_date,
      notes,
      status,
      items,
    } = req.body;

    if (!patient_id || !doctor_id) {
      return res.status(400).json({
        success: false,
        message: "patient_id and doctor_id are required",
      });
    }

    if (!isValidUuid(patient_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient_id format",
      });
    }

    if (!isValidUuid(doctor_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor_id format",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one prescription item is required in items array",
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.medicine_name || item.medicine_name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "medicine_name is required for every item",
        });
      }
      if (item.quantity !== undefined && item.quantity !== null) {
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({
            success: false,
            message: "item quantity must be greater than zero",
          });
        }
      }
    }

    // Check patient existence
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

    // Check doctor existence
    const docCheck = await client.query(
      "SELECT id FROM doctors WHERE id = $1",
      [doctor_id]
    );
    if (docCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (medical_record_id) {
      if (!isValidUuid(medical_record_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid medical_record_id format",
        });
      }
      const mrCheck = await client.query(
        "SELECT id FROM medical_records WHERE id = $1",
        [medical_record_id]
      );
      if (mrCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Medical record not found",
        });
      }
    }

    const prescriptionStatus = status || "active";
    if (!VALID_STATUSES.includes(prescriptionStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    await client.query("BEGIN");

    const prescResult = await client.query(
      `INSERT INTO prescriptions (
        patient_id,
        doctor_id,
        medical_record_id,
        prescription_date,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        patient_id,
        doctor_id,
        medical_record_id || null,
        prescription_date || new Date().toISOString(),
        notes ? notes.trim() : null,
        prescriptionStatus,
      ]
    );

    const prescriptionId = prescResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO prescription_items (
          prescription_id,
          medicine_name,
          dosage,
          frequency,
          duration,
          quantity,
          instructions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          prescriptionId,
          item.medicine_name.trim(),
          item.dosage ? item.dosage.trim() : null,
          item.frequency ? item.frequency.trim() : null,
          item.duration ? item.duration.trim() : null,
          item.quantity !== undefined && item.quantity !== null
            ? Number(item.quantity)
            : null,
          item.instructions ? item.instructions.trim() : null,
        ]
      );
    }

    await client.query("COMMIT");

    // Fetch the complete created prescription with joins and items
    const fullPrescription = await pool.query(
      `SELECT
        p.id,
        p.patient_id,
        p.doctor_id,
        p.medical_record_id,
        p.prescription_date,
        p.notes,
        p.status,
        p.created_at,
        p.updated_at,
        pat.patient_number,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'medicine_name', pi.medicine_name,
              'dosage', pi.dosage,
              'frequency', pi.frequency,
              'duration', pi.duration,
              'quantity', pi.quantity,
              'instructions', pi.instructions,
              'created_at', pi.created_at
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN doctors d ON p.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      WHERE p.id = $1
      GROUP BY p.id, pat.id, d.id, u.id`,
      [prescriptionId]
    );

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: fullPrescription.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create prescription",
    });
  } finally {
    client.release();
  }
};

// UPDATE a prescription (status, notes, or items)
const updatePrescription = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID format",
      });
    }

    const check = await client.query(
      "SELECT * FROM prescriptions WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const current = check.rows[0];
    const { status, notes, items } = req.body;

    const targetStatus = status !== undefined ? status : current.status;
    if (targetStatus && !VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE prescriptions SET
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

    // If replacement items provided
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item.medicine_name || item.medicine_name.trim() === "") {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "medicine_name is required for every item",
          });
        }
      }

      await client.query(
        "DELETE FROM prescription_items WHERE prescription_id = $1",
        [id]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO prescription_items (
            prescription_id,
            medicine_name,
            dosage,
            frequency,
            duration,
            quantity,
            instructions
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            item.medicine_name.trim(),
            item.dosage ? item.dosage.trim() : null,
            item.frequency ? item.frequency.trim() : null,
            item.duration ? item.duration.trim() : null,
            item.quantity !== undefined && item.quantity !== null
              ? Number(item.quantity)
              : null,
            item.instructions ? item.instructions.trim() : null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT
        p.id,
        p.patient_id,
        p.doctor_id,
        p.medical_record_id,
        p.prescription_date,
        p.notes,
        p.status,
        p.created_at,
        p.updated_at,
        pat.patient_number,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'medicine_name', pi.medicine_name,
              'dosage', pi.dosage,
              'frequency', pi.frequency,
              'duration', pi.duration,
              'quantity', pi.quantity,
              'instructions', pi.instructions,
              'created_at', pi.created_at
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN doctors d ON p.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      WHERE p.id = $1
      GROUP BY p.id, pat.id, d.id, u.id`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update prescription",
    });
  } finally {
    client.release();
  }
};

// DELETE a prescription
const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM prescriptions WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    await pool.query("DELETE FROM prescriptions WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    console.error("Delete prescription error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete prescription",
    });
  }
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
};
