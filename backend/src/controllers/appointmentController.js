const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all appointments (with rich joins and filters)
const getAppointments = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      department_id,
      status,
      date,
      search,
    } = req.query;

    let queryText = `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.status,
        a.notes,
        a.created_by,
        a.created_at,
        a.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON a.department_id = dept.id
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
      conditions.push(`a.patient_id = $${queryParams.length}`);
    }

    if (doctor_id) {
      if (!isValidUuid(doctor_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor_id format",
        });
      }
      queryParams.push(doctor_id);
      conditions.push(`a.doctor_id = $${queryParams.length}`);
    }

    if (department_id) {
      if (!isValidUuid(department_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department_id format",
        });
      }
      queryParams.push(department_id);
      conditions.push(`a.department_id = $${queryParams.length}`);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }
      queryParams.push(status);
      conditions.push(`a.status = $${queryParams.length}`);
    }

    if (date) {
      queryParams.push(date);
      conditions.push(`a.appointment_date = $${queryParams.length}`);
    }

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.patient_number ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR a.reason ILIKE $${paramIndex})`
      );
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get appointments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

// GET an appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.status,
        a.notes,
        a.created_by,
        a.created_at,
        a.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        p.email AS patient_email,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        d.consultation_fee AS doctor_fee,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get appointment by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve appointment",
    });
  }
};

// CREATE an appointment
const createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      department_id,
      appointment_date,
      appointment_time,
      reason,
      status,
      notes,
      created_by,
    } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message:
          "patient_id, doctor_id, appointment_date and appointment_time are required",
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

    // Verify patient exists
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

    // Verify doctor exists
    const doctorCheck = await pool.query(
      "SELECT id, department_id FROM doctors WHERE id = $1",
      [doctor_id]
    );
    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    let finalDepartmentId = department_id;
    if (finalDepartmentId) {
      if (!isValidUuid(finalDepartmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department_id format",
        });
      }
      const deptCheck = await pool.query(
        "SELECT id FROM departments WHERE id = $1",
        [finalDepartmentId]
      );
      if (deptCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    } else {
      // Auto-inherit department from doctor if not explicitly supplied
      finalDepartmentId = doctorCheck.rows[0].department_id;
    }

    const appointmentStatus = status || "scheduled";
    if (!VALID_STATUSES.includes(appointmentStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    if (created_by && !isValidUuid(created_by)) {
      return res.status(400).json({
        success: false,
        message: "Invalid created_by user ID format",
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO appointments (
        patient_id,
        doctor_id,
        department_id,
        appointment_date,
        appointment_time,
        reason,
        status,
        notes,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        patient_id,
        doctor_id,
        finalDepartmentId || null,
        appointment_date,
        appointment_time,
        reason ? reason.trim() : null,
        appointmentStatus,
        notes ? notes.trim() : null,
        created_by || null,
      ]
    );

    // Fetch full appointment with joins
    const fullAppointment = await pool.query(
      `SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.status,
        a.notes,
        a.created_by,
        a.created_at,
        a.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = $1`,
      [insertResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: fullAppointment.rows[0],
    });
  } catch (error) {
    console.error("Create appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
    });
  }
};

// UPDATE an appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM appointments WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const current = check.rows[0];
    const {
      patient_id,
      doctor_id,
      department_id,
      appointment_date,
      appointment_time,
      reason,
      status,
      notes,
    } = req.body;

    let targetPatientId = current.patient_id;
    if (patient_id !== undefined) {
      if (!isValidUuid(patient_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient_id format",
        });
      }
      const patCheck = await pool.query(
        "SELECT id FROM patients WHERE id = $1",
        [patient_id]
      );
      if (patCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }
      targetPatientId = patient_id;
    }

    let targetDoctorId = current.doctor_id;
    if (doctor_id !== undefined) {
      if (!isValidUuid(doctor_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor_id format",
        });
      }
      const docCheck = await pool.query(
        "SELECT id FROM doctors WHERE id = $1",
        [doctor_id]
      );
      if (docCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
      targetDoctorId = doctor_id;
    }

    let targetDepartmentId = current.department_id;
    if (department_id !== undefined && department_id !== null) {
      if (!isValidUuid(department_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department_id format",
        });
      }
      const depCheck = await pool.query(
        "SELECT id FROM departments WHERE id = $1",
        [department_id]
      );
      if (depCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
      targetDepartmentId = department_id;
    }

    const targetStatus = status !== undefined ? status : current.status;
    if (targetStatus && !VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    await pool.query(
      `UPDATE appointments SET
        patient_id = $1,
        doctor_id = $2,
        department_id = $3,
        appointment_date = $4,
        appointment_time = $5,
        reason = $6,
        status = $7,
        notes = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9`,
      [
        targetPatientId,
        targetDoctorId,
        targetDepartmentId,
        appointment_date !== undefined ? appointment_date : current.appointment_date,
        appointment_time !== undefined ? appointment_time : current.appointment_time,
        reason !== undefined ? (reason ? reason.trim() : null) : current.reason,
        targetStatus,
        notes !== undefined ? (notes ? notes.trim() : null) : current.notes,
        id,
      ]
    );

    const updated = await pool.query(
      `SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.status,
        a.notes,
        a.created_by,
        a.created_at,
        a.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: updated.rows[0],
    });
  } catch (error) {
    console.error("Update appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
    });
  }
};

// DELETE an appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM appointments WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await pool.query("DELETE FROM appointments WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
    });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
