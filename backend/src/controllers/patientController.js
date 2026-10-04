const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


const VALID_GENDERS = ["male", "female", "other"];
const VALID_BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all patients (with optional search and filter)
const getPatients = async (req, res) => {
  try {
    const { search, is_active } = req.query;

    let queryText = `
      SELECT
        id,
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        blood_type,
        allergies,
        is_active,
        created_at,
        updated_at
      FROM patients
    `;

    const conditions = [];
    const queryParams = [];

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR patient_number ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
    }

    if (is_active !== undefined) {
      queryParams.push(is_active === "true");
      conditions.push(`is_active = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get patients error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve patients",
    });
  }
};

// GET a patient by ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        blood_type,
        allergies,
        is_active,
        created_at,
        updated_at
      FROM patients
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get patient by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient",
    });
  }
};

// CREATE a patient
const createPatient = async (req, res) => {
  try {
    const {
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      blood_type,
      allergies,
      is_active,
    } = req.body;

    if (!patient_number || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "patient_number, first_name and last_name are required",
      });
    }

    if (gender && !VALID_GENDERS.includes(gender.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `gender must be one of: ${VALID_GENDERS.join(", ")}`,
      });
    }

    if (blood_type && !VALID_BLOOD_TYPES.includes(blood_type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `blood_type must be one of: ${VALID_BLOOD_TYPES.join(", ")}`,
      });
    }

    const result = await pool.query(
      `INSERT INTO patients (
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        blood_type,
        allergies,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        patient_number.trim(),
        first_name.trim(),
        last_name.trim(),
        date_of_birth || null,
        gender ? gender.toLowerCase() : null,
        phone || null,
        email ? email.trim().toLowerCase() : null,
        address || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        blood_type ? blood_type.toUpperCase() : null,
        allergies || null,
        is_active !== undefined ? Boolean(is_active) : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create patient error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Patient with this patient_number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
};

// UPDATE a patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    // Check if patient exists
    const existing = await pool.query(
      "SELECT * FROM patients WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const current = existing.rows[0];
    const {
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      blood_type,
      allergies,
      is_active,
    } = req.body;

    const normalizedGender =
      gender !== undefined
        ? gender
          ? gender.toLowerCase()
          : null
        : current.gender;

    if (normalizedGender && !VALID_GENDERS.includes(normalizedGender)) {
      return res.status(400).json({
        success: false,
        message: `gender must be one of: ${VALID_GENDERS.join(", ")}`,
      });
    }

    const normalizedBloodType =
      blood_type !== undefined
        ? blood_type
          ? blood_type.toUpperCase()
          : null
        : current.blood_type;

    if (
      normalizedBloodType &&
      !VALID_BLOOD_TYPES.includes(normalizedBloodType)
    ) {
      return res.status(400).json({
        success: false,
        message: `blood_type must be one of: ${VALID_BLOOD_TYPES.join(", ")}`,
      });
    }

    const updatedPatientNumber =
      patient_number !== undefined
        ? patient_number.trim()
        : current.patient_number;
    const updatedFirstName =
      first_name !== undefined ? first_name.trim() : current.first_name;
    const updatedLastName =
      last_name !== undefined ? last_name.trim() : current.last_name;

    if (!updatedPatientNumber || !updatedFirstName || !updatedLastName) {
      return res.status(400).json({
        success: false,
        message: "patient_number, first_name and last_name cannot be empty",
      });
    }

    const result = await pool.query(
      `UPDATE patients SET
        patient_number = $1,
        first_name = $2,
        last_name = $3,
        date_of_birth = $4,
        gender = $5,
        phone = $6,
        email = $7,
        address = $8,
        emergency_contact_name = $9,
        emergency_contact_phone = $10,
        blood_type = $11,
        allergies = $12,
        is_active = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`,
      [
        updatedPatientNumber,
        updatedFirstName,
        updatedLastName,
        date_of_birth !== undefined ? date_of_birth : current.date_of_birth,
        normalizedGender,
        phone !== undefined ? phone : current.phone,
        email !== undefined
          ? email
            ? email.trim().toLowerCase()
            : null
          : current.email,
        address !== undefined ? address : current.address,
        emergency_contact_name !== undefined
          ? emergency_contact_name
            : current.emergency_contact_name,
        emergency_contact_phone !== undefined
          ? emergency_contact_phone
          : current.emergency_contact_phone,
        normalizedBloodType,
        allergies !== undefined ? allergies : current.allergies,
        is_active !== undefined ? Boolean(is_active) : current.is_active,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update patient error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Patient with this patient_number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};

// DELETE a patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM patients WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    await pool.query("DELETE FROM patients WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Delete patient error:", error);

    // Foreign key violation
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete patient because related clinical or financial records exist. Deactivate the patient instead.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete patient",
    });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};