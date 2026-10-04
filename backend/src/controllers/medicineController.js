const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (id) => UUID_REGEX.test(id);

// GET all medicines (with filters for search, category, low stock, is_active)
const getMedicines = async (req, res) => {
  try {
    const { search, category, low_stock, is_active } = req.query;

    let queryText = `
      SELECT
        id,
        name,
        generic_name,
        category,
        description,
        manufacturer,
        unit,
        quantity_in_stock,
        reorder_level,
        unit_price,
        expiry_date,
        batch_number,
        is_active,
        (quantity_in_stock <= reorder_level) AS is_low_stock,
        created_at,
        updated_at
      FROM medicines
    `;

    const conditions = [];
    const queryParams = [];

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(name ILIKE $${paramIndex} OR generic_name ILIKE $${paramIndex} OR manufacturer ILIKE $${paramIndex} OR batch_number ILIKE $${paramIndex})`
      );
    }

    if (category && category.trim() !== "") {
      queryParams.push(category.trim());
      conditions.push(`category ILIKE $${queryParams.length}`);
    }

    if (low_stock === "true") {
      conditions.push(`quantity_in_stock <= reorder_level`);
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
    console.error("Get medicines error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve medicines",
    });
  }
};

// GET low-stock medicines
const getLowStockMedicines = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        generic_name,
        category,
        unit,
        quantity_in_stock,
        reorder_level,
        unit_price,
        batch_number,
        is_active
      FROM medicines
      WHERE quantity_in_stock <= reorder_level AND is_active = TRUE
      ORDER BY quantity_in_stock ASC, name ASC`
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get low stock medicines error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve low-stock medicines",
    });
  }
};

// GET a medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        name,
        generic_name,
        category,
        description,
        manufacturer,
        unit,
        quantity_in_stock,
        reorder_level,
        unit_price,
        expiry_date,
        batch_number,
        is_active,
        (quantity_in_stock <= reorder_level) AS is_low_stock,
        created_at,
        updated_at
      FROM medicines
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get medicine by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve medicine",
    });
  }
};

// CREATE a medicine
const createMedicine = async (req, res) => {
  try {
    const {
      name,
      generic_name,
      category,
      description,
      manufacturer,
      unit,
      quantity_in_stock,
      reorder_level,
      unit_price,
      expiry_date,
      batch_number,
      is_active,
    } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Medicine name is required",
      });
    }

    const stock =
      quantity_in_stock !== undefined ? Number(quantity_in_stock) : 0;
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "quantity_in_stock must be a non-negative integer",
      });
    }

    const reorder =
      reorder_level !== undefined ? Number(reorder_level) : 10;
    if (isNaN(reorder) || reorder < 0) {
      return res.status(400).json({
        success: false,
        message: "reorder_level must be a non-negative integer",
      });
    }

    const price = unit_price !== undefined ? Number(unit_price) : 0;
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "unit_price must be a non-negative number",
      });
    }

    const result = await pool.query(
      `INSERT INTO medicines (
        name,
        generic_name,
        category,
        description,
        manufacturer,
        unit,
        quantity_in_stock,
        reorder_level,
        unit_price,
        expiry_date,
        batch_number,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *, (quantity_in_stock <= reorder_level) AS is_low_stock`,

      [
        name.trim(),
        generic_name ? generic_name.trim() : null,
        category ? category.trim() : null,
        description ? description.trim() : null,
        manufacturer ? manufacturer.trim() : null,
        unit ? unit.trim() : "unit",
        stock,
        reorder,
        price,
        expiry_date || null,
        batch_number ? batch_number.trim() : null,
        is_active !== undefined ? Boolean(is_active) : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create medicine error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create medicine",
    });
  }
};

// UPDATE a medicine
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM medicines WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const current = check.rows[0];
    const {
      name,
      generic_name,
      category,
      description,
      manufacturer,
      unit,
      quantity_in_stock,
      reorder_level,
      unit_price,
      expiry_date,
      batch_number,
      is_active,
    } = req.body;

    const targetName = name !== undefined ? name.trim() : current.name;
    if (!targetName) {
      return res.status(400).json({
        success: false,
        message: "Medicine name cannot be empty",
      });
    }

    const stock =
      quantity_in_stock !== undefined
        ? Number(quantity_in_stock)
        : current.quantity_in_stock;
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "quantity_in_stock must be a non-negative integer",
      });
    }

    const reorder =
      reorder_level !== undefined
        ? Number(reorder_level)
        : current.reorder_level;
    if (isNaN(reorder) || reorder < 0) {
      return res.status(400).json({
        success: false,
        message: "reorder_level must be a non-negative integer",
      });
    }

    const price =
      unit_price !== undefined ? Number(unit_price) : current.unit_price;
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "unit_price must be a non-negative number",
      });
    }

    const result = await pool.query(
      `UPDATE medicines SET
        name = $1,
        generic_name = $2,
        category = $3,
        description = $4,
        manufacturer = $5,
        unit = $6,
        quantity_in_stock = $7,
        reorder_level = $8,
        unit_price = $9,
        expiry_date = $10,
        batch_number = $11,
        is_active = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *, (quantity_in_stock <= reorder_level) AS is_low_stock`,

      [
        targetName,
        generic_name !== undefined ? (generic_name ? generic_name.trim() : null) : current.generic_name,
        category !== undefined ? (category ? category.trim() : null) : current.category,
        description !== undefined ? (description ? description.trim() : null) : current.description,
        manufacturer !== undefined ? (manufacturer ? manufacturer.trim() : null) : current.manufacturer,
        unit !== undefined ? unit.trim() : current.unit,
        stock,
        reorder,
        price,
        expiry_date !== undefined ? expiry_date : current.expiry_date,
        batch_number !== undefined ? (batch_number ? batch_number.trim() : null) : current.batch_number,
        is_active !== undefined ? Boolean(is_active) : current.is_active,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update medicine error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update medicine",
    });
  }
};

// DELETE a medicine
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM medicines WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    await pool.query("DELETE FROM medicines WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Delete medicine error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete medicine because pharmacy dispensing records exist for it. Deactivate the medicine instead.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete medicine",
    });
  }
};

module.exports = {
  getMedicines,
  getLowStockMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
