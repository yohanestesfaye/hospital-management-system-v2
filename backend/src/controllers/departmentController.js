const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all departments (with optional search and is_active filters)
const getDepartments = async (req, res) => {
  try {
    const { search, is_active } = req.query;

    let queryText = `
      SELECT
        id,
        name,
        description,
        phone,
        is_active,
        created_at,
        updated_at
      FROM departments
    `;

    const conditions = [];
    const queryParams = [];

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
    }

    if (is_active !== undefined) {
      queryParams.push(is_active === "true");
      conditions.push(`is_active = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += ` ORDER BY name ASC`;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve departments",
    });
  }
};

// GET a department by ID
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        name,
        description,
        phone,
        is_active,
        created_at,
        updated_at
      FROM departments
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get department by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve department",
    });
  }
};

// CREATE a department
const createDepartment = async (req, res) => {
  try {
    const { name, description, phone, is_active } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const trimmedName = name.trim();

    const result = await pool.query(
      `INSERT INTO departments (
        name,
        description,
        phone,
        is_active
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        trimmedName,
        description ? description.trim() : null,
        phone ? phone.trim() : null,
        is_active !== undefined ? Boolean(is_active) : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create department error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Department with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create department",
    });
  }
};

// UPDATE a department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    const existing = await pool.query(
      "SELECT * FROM departments WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const current = existing.rows[0];
    const { name, description, phone, is_active } = req.body;

    const updatedName =
      name !== undefined ? name.trim() : current.name;

    if (!updatedName) {
      return res.status(400).json({
        success: false,
        message: "Department name cannot be empty",
      });
    }

    const result = await pool.query(
      `UPDATE departments SET
        name = $1,
        description = $2,
        phone = $3,
        is_active = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [
        updatedName,
        description !== undefined ? (description ? description.trim() : null) : current.description,
        phone !== undefined ? (phone ? phone.trim() : null) : current.phone,
        is_active !== undefined ? Boolean(is_active) : current.is_active,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update department error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Department with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update department",
    });
  }
};

// DELETE a department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM departments WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    await pool.query("DELETE FROM departments WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
