const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all doctors (with department and user info, optional filters)
const getDoctors = async (req, res) => {
  try {
    const { department_id, specialty, is_available, search } = req.query;

    let queryText = `
      SELECT
        d.id,
        d.user_id,
        d.department_id,
        d.license_number,
        d.specialty,
        d.consultation_fee,
        d.years_of_experience,
        d.is_available,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active AS user_active,
        dept.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
    `;

    const conditions = [];
    const queryParams = [];

    if (department_id) {
      if (!isValidUuid(department_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department_id format",
        });
      }
      queryParams.push(department_id);
      conditions.push(`d.department_id = $${queryParams.length}`);
    }

    if (specialty && specialty.trim() !== "") {
      queryParams.push(`%${specialty.trim()}%`);
      conditions.push(`d.specialty ILIKE $${queryParams.length}`);
    }

    if (is_available !== undefined) {
      queryParams.push(is_available === "true");
      conditions.push(`d.is_available = $${queryParams.length}`);
    }

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR d.license_number ILIKE $${paramIndex} OR d.specialty ILIKE $${paramIndex} OR dept.name ILIKE $${paramIndex})`
      );
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY u.last_name ASC, u.first_name ASC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve doctors",
    });
  }
};

// GET a doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        d.id,
        d.user_id,
        d.department_id,
        d.license_number,
        d.specialty,
        d.consultation_fee,
        d.years_of_experience,
        d.is_available,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active AS user_active,
        dept.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get doctor by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve doctor",
    });
  }
};

// CREATE a doctor (supporting existing user_id or creating user on the fly)
const createDoctor = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      user_id,
      first_name,
      last_name,
      email,
      password,
      phone,
      department_id,
      license_number,
      specialty,
      consultation_fee,
      years_of_experience,
      is_available,
    } = req.body;

    if (!license_number || license_number.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "license_number is required",
      });
    }

    if (!specialty || specialty.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "specialty is required",
      });
    }

    const fee = consultation_fee !== undefined ? Number(consultation_fee) : 0;
    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({
        success: false,
        message: "consultation_fee must be a non-negative number",
      });
    }

    const experience =
      years_of_experience !== undefined ? Number(years_of_experience) : 0;
    if (isNaN(experience) || experience < 0) {
      return res.status(400).json({
        success: false,
        message: "years_of_experience must be a non-negative integer",
      });
    }

    if (department_id) {
      if (!isValidUuid(department_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department_id format",
        });
      }
      const deptCheck = await client.query(
        "SELECT id FROM departments WHERE id = $1",
        [department_id]
      );
      if (deptCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    await client.query("BEGIN");

    let doctorUserId = user_id;

    if (doctorUserId) {
      if (!isValidUuid(doctorUserId)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Invalid user_id format",
        });
      }

      const userCheck = await client.query(
        "SELECT id, role FROM users WHERE id = $1",
        [doctorUserId]
      );
      if (userCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    } else {
      if (!first_name || !last_name || !email) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message:
            "Either an existing user_id or user details (first_name, last_name, email) are required",
        });
      }

      const rawPassword = password || "Doctor@123";
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      const userResult = await client.query(
        `INSERT INTO users (
          first_name,
          last_name,
          email,
          password_hash,
          role,
          phone
        )
        VALUES ($1, $2, $3, $4, 'doctor', $5)
        RETURNING id`,
        [
          first_name.trim(),
          last_name.trim(),
          email.trim().toLowerCase(),
          passwordHash,
          phone ? phone.trim() : null,
        ]
      );

      doctorUserId = userResult.rows[0].id;
    }

    const doctorResult = await client.query(
      `INSERT INTO doctors (
        user_id,
        department_id,
        license_number,
        specialty,
        consultation_fee,
        years_of_experience,
        is_available
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        doctorUserId,
        department_id || null,
        license_number.trim(),
        specialty.trim(),
        fee,
        experience,
        is_available !== undefined ? Boolean(is_available) : true,
      ]
    );

    await client.query("COMMIT");

    // Fetch created doctor with joins
    const fullDoctor = await pool.query(
      `SELECT
        d.id,
        d.user_id,
        d.department_id,
        d.license_number,
        d.specialty,
        d.consultation_fee,
        d.years_of_experience,
        d.is_available,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        dept.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = $1`,
      [doctorResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: fullDoctor.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create doctor error:", error);

    if (error.code === "23505") {
      if (error.constraint === "doctors_license_number_key") {
        return res.status(409).json({
          success: false,
          message: "A doctor with this license number already exists",
        });
      }
      if (error.constraint === "doctors_user_id_key") {
        return res.status(409).json({
          success: false,
          message: "A doctor profile already exists for this user",
        });
      }
      if (error.constraint === "users_email_key") {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create doctor",
    });
  } finally {
    client.release();
  }
};

// UPDATE a doctor
const updateDoctor = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID format",
      });
    }

    const doctorCheck = await client.query(
      "SELECT * FROM doctors WHERE id = $1",
      [id]
    );

    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const current = doctorCheck.rows[0];
    const {
      license_number,
      specialty,
      consultation_fee,
      years_of_experience,
      is_available,
      department_id,
      first_name,
      last_name,
      phone,
    } = req.body;

    if (department_id !== undefined && department_id !== null) {
      if (!isValidUuid(department_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department_id format",
        });
      }
      const deptCheck = await client.query(
        "SELECT id FROM departments WHERE id = $1",
        [department_id]
      );
      if (deptCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    const fee =
      consultation_fee !== undefined
        ? Number(consultation_fee)
        : current.consultation_fee;
    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({
        success: false,
        message: "consultation_fee must be a non-negative number",
      });
    }

    const experience =
      years_of_experience !== undefined
        ? Number(years_of_experience)
        : current.years_of_experience;
    if (isNaN(experience) || experience < 0) {
      return res.status(400).json({
        success: false,
        message: "years_of_experience must be a non-negative integer",
      });
    }

    await client.query("BEGIN");

    // Optionally update user details
    if (first_name !== undefined || last_name !== undefined || phone !== undefined) {
      const userRes = await client.query(
        "SELECT first_name, last_name, phone FROM users WHERE id = $1",
        [current.user_id]
      );
      const curUser = userRes.rows[0];

      await client.query(
        `UPDATE users SET
          first_name = $1,
          last_name = $2,
          phone = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
        [
          first_name !== undefined ? first_name.trim() : curUser.first_name,
          last_name !== undefined ? last_name.trim() : curUser.last_name,
          phone !== undefined ? phone : curUser.phone,
          current.user_id,
        ]
      );
    }

    await client.query(
      `UPDATE doctors SET
        license_number = $1,
        specialty = $2,
        consultation_fee = $3,
        years_of_experience = $4,
        is_available = $5,
        department_id = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7`,
      [
        license_number !== undefined
          ? license_number.trim()
          : current.license_number,
        specialty !== undefined ? specialty.trim() : current.specialty,
        fee,
        experience,
        is_available !== undefined ? Boolean(is_available) : current.is_available,
        department_id !== undefined ? department_id : current.department_id,
        id,
      ]
    );

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT
        d.id,
        d.user_id,
        d.department_id,
        d.license_number,
        d.specialty,
        d.consultation_fee,
        d.years_of_experience,
        d.is_available,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        dept.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update doctor error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A doctor with this license number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update doctor",
    });
  } finally {
    client.release();
  }
};

// DELETE a doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID format",
      });
    }

    const check = await pool.query(
      "SELECT id, user_id FROM doctors WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    await pool.query("DELETE FROM doctors WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Delete doctor error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete doctor with existing appointments, medical records, or prescriptions. Set is_available to false instead.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
    });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
