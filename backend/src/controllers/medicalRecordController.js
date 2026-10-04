const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all medical records (with joins and filters)
const getMedicalRecords = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, search } = req.query;

    let queryText = `
      SELECT
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.appointment_id,
        mr.diagnosis,
        mr.symptoms,
        mr.treatment_plan,
        mr.notes,
        mr.record_date,
        mr.created_at,
        mr.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        app.appointment_date,
        app.appointment_time
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN doctors d ON mr.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments app ON mr.appointment_id = app.id
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
      conditions.push(`mr.patient_id = $${queryParams.length}`);
    }

    if (doctor_id) {
      if (!isValidUuid(doctor_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor_id format",
        });
      }
      queryParams.push(doctor_id);
      conditions.push(`mr.doctor_id = $${queryParams.length}`);
    }

    if (appointment_id) {
      if (!isValidUuid(appointment_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment_id format",
        });
      }
      queryParams.push(appointment_id);
      conditions.push(`mr.appointment_id = $${queryParams.length}`);
    }

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(mr.diagnosis ILIKE $${paramIndex} OR mr.symptoms ILIKE $${paramIndex} OR mr.treatment_plan ILIKE $${paramIndex} OR p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.patient_number ILIKE $${paramIndex})`
      );
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY mr.record_date DESC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get medical records error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve medical records",
    });
  }
};

// GET a medical record by ID
const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medical record ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.appointment_id,
        mr.diagnosis,
        mr.symptoms,
        mr.treatment_plan,
        mr.notes,
        mr.record_date,
        mr.created_at,
        mr.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.date_of_birth,
        p.gender,
        p.blood_type,
        p.allergies,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        app.appointment_date,
        app.appointment_time
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN doctors d ON mr.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments app ON mr.appointment_id = app.id
      WHERE mr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get medical record by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve medical record",
    });
  }
};

// CREATE a medical record
const createMedicalRecord = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_id,
      diagnosis,
      symptoms,
      treatment_plan,
      notes,
      record_date,
    } = req.body;

    if (!patient_id || !doctor_id || !diagnosis || diagnosis.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "patient_id, doctor_id and diagnosis are required",
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

    const patientCheck = await pool.query(
      "SELECT id FROM patients WHERE id = $1",
      [patient_id]
    );
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const doctorCheck = await pool.query(
      "SELECT id FROM doctors WHERE id = $1",
      [doctor_id]
    );
    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (appointment_id) {
      if (!isValidUuid(appointment_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment_id format",
        });
      }
      const appCheck = await pool.query(
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

    const insertResult = await pool.query(
      `INSERT INTO medical_records (
        patient_id,
        doctor_id,
        appointment_id,
        diagnosis,
        symptoms,
        treatment_plan,
        notes,
        record_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        patient_id,
        doctor_id,
        appointment_id || null,
        diagnosis.trim(),
        symptoms ? symptoms.trim() : null,
        treatment_plan ? treatment_plan.trim() : null,
        notes ? notes.trim() : null,
        record_date || new Date().toISOString(),
      ]
    );

    const fullRecord = await pool.query(
      `SELECT
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.appointment_id,
        mr.diagnosis,
        mr.symptoms,
        mr.treatment_plan,
        mr.notes,
        mr.record_date,
        mr.created_at,
        mr.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN doctors d ON mr.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE mr.id = $1`,
      [insertResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: fullRecord.rows[0],
    });
  } catch (error) {
    console.error("Create medical record error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create medical record",
    });
  }
};

// UPDATE a medical record
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medical record ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM medical_records WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    const current = check.rows[0];
    const {
      diagnosis,
      symptoms,
      treatment_plan,
      notes,
      record_date,
      appointment_id,
    } = req.body;

    const targetDiagnosis =
      diagnosis !== undefined ? diagnosis.trim() : current.diagnosis;
    if (!targetDiagnosis) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis cannot be empty",
      });
    }

    let targetAppointmentId = current.appointment_id;
    if (appointment_id !== undefined && appointment_id !== null) {
      if (!isValidUuid(appointment_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment_id format",
        });
      }
      const appCheck = await pool.query(
        "SELECT id FROM appointments WHERE id = $1",
        [appointment_id]
      );
      if (appCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
      targetAppointmentId = appointment_id;
    }

    await pool.query(
      `UPDATE medical_records SET
        diagnosis = $1,
        symptoms = $2,
        treatment_plan = $3,
        notes = $4,
        record_date = $5,
        appointment_id = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7`,
      [
        targetDiagnosis,
        symptoms !== undefined ? (symptoms ? symptoms.trim() : null) : current.symptoms,
        treatment_plan !== undefined ? (treatment_plan ? treatment_plan.trim() : null) : current.treatment_plan,
        notes !== undefined ? (notes ? notes.trim() : null) : current.notes,
        record_date !== undefined ? record_date : current.record_date,
        targetAppointmentId,
        id,
      ]
    );

    const updated = await pool.query(
      `SELECT
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.appointment_id,
        mr.diagnosis,
        mr.symptoms,
        mr.treatment_plan,
        mr.notes,
        mr.record_date,
        mr.created_at,
        mr.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN doctors d ON mr.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE mr.id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Medical record updated successfully",
      data: updated.rows[0],
    });
  } catch (error) {
    console.error("Update medical record error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update medical record",
    });
  }
};

// DELETE a medical record
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medical record ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM medical_records WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    await pool.query("DELETE FROM medical_records WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Medical record deleted successfully",
    });
  } catch (error) {
    console.error("Delete medical record error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete medical record",
    });
  }
};

module.exports = {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};
