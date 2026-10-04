const { pool } = require("../config/database");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_ORDER_STATUSES = [
  "ordered",
  "sample_collected",
  "processing",
  "completed",
  "cancelled",
];

const VALID_ITEM_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];

const isValidUuid = (id) => UUID_REGEX.test(id);

// --- LAB TESTS ---

// GET all lab tests
const getLabTests = async (req, res) => {
  try {
    const { search, category, is_active } = req.query;

    let queryText = `
      SELECT
        id,
        name,
        category,
        description,
        price,
        normal_range,
        unit,
        is_active,
        created_at,
        updated_at
      FROM lab_tests
    `;

    const conditions = [];
    const queryParams = [];

    if (search && search.trim() !== "") {
      queryParams.push(`%${search.trim()}%`);
      const paramIndex = queryParams.length;
      conditions.push(
        `(name ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
    }

    if (category && category.trim() !== "") {
      queryParams.push(category.trim());
      conditions.push(`category ILIKE $${queryParams.length}`);
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
    console.error("Get lab tests error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve laboratory tests",
    });
  }
};

// GET a lab test by ID
const getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab test ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        name,
        category,
        description,
        price,
        normal_range,
        unit,
        is_active,
        created_at,
        updated_at
      FROM lab_tests
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory test not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get lab test by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve laboratory test",
    });
  }
};

// CREATE a lab test
const createLabTest = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      normal_range,
      unit,
      is_active,
    } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Laboratory test name is required",
      });
    }

    const testPrice = price !== undefined ? Number(price) : 0;
    if (isNaN(testPrice) || testPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "price must be a non-negative number",
      });
    }

    const result = await pool.query(
      `INSERT INTO lab_tests (
        name,
        category,
        description,
        price,
        normal_range,
        unit,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        name.trim(),
        category ? category.trim() : null,
        description ? description.trim() : null,
        testPrice,
        normal_range ? normal_range.trim() : null,
        unit ? unit.trim() : null,
        is_active !== undefined ? Boolean(is_active) : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Laboratory test created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create lab test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create laboratory test",
    });
  }
};

// UPDATE a lab test
const updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab test ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM lab_tests WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory test not found",
      });
    }

    const current = check.rows[0];
    const {
      name,
      category,
      description,
      price,
      normal_range,
      unit,
      is_active,
    } = req.body;

    const targetName = name !== undefined ? name.trim() : current.name;
    if (!targetName) {
      return res.status(400).json({
        success: false,
        message: "Laboratory test name cannot be empty",
      });
    }

    const testPrice =
      price !== undefined ? Number(price) : current.price;
    if (isNaN(testPrice) || testPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "price must be a non-negative number",
      });
    }

    const result = await pool.query(
      `UPDATE lab_tests SET
        name = $1,
        category = $2,
        description = $3,
        price = $4,
        normal_range = $5,
        unit = $6,
        is_active = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        targetName,
        category !== undefined ? (category ? category.trim() : null) : current.category,
        description !== undefined ? (description ? description.trim() : null) : current.description,
        testPrice,
        normal_range !== undefined ? (normal_range ? normal_range.trim() : null) : current.normal_range,
        unit !== undefined ? (unit ? unit.trim() : null) : current.unit,
        is_active !== undefined ? Boolean(is_active) : current.is_active,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Laboratory test updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update lab test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update laboratory test",
    });
  }
};

// DELETE a lab test
const deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab test ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM lab_tests WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory test not found",
      });
    }

    await pool.query("DELETE FROM lab_tests WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Laboratory test deleted successfully",
    });
  } catch (error) {
    console.error("Delete lab test error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete laboratory test with existing order records. Deactivate the test instead.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete laboratory test",
    });
  }
};

// --- LAB ORDERS ---

// GET all lab orders (with joined patient, doctor, and items)
const getLabOrders = async (req, res) => {
  try {
    const { patient_id, doctor_id, status } = req.query;

    let queryText = `
      SELECT
        lo.id,
        lo.patient_id,
        lo.doctor_id,
        lo.appointment_id,
        lo.order_date,
        lo.status,
        lo.clinical_notes,
        lo.created_at,
        lo.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', loi.id,
              'lab_test_id', loi.lab_test_id,
              'test_name', lt.name,
              'test_category', lt.category,
              'test_price', lt.price,
              'result', loi.result,
              'result_value', loi.result_value,
              'result_unit', loi.result_unit,
              'reference_range', loi.reference_range,
              'status', loi.status,
              'technician_notes', loi.technician_notes,
              'completed_at', loi.completed_at
            )
          ) FILTER (WHERE loi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN doctors d ON lo.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      LEFT JOIN lab_tests lt ON loi.lab_test_id = lt.id
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
      conditions.push(`lo.patient_id = $${queryParams.length}`);
    }

    if (doctor_id) {
      if (!isValidUuid(doctor_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor_id format",
        });
      }
      queryParams.push(doctor_id);
      conditions.push(`lo.doctor_id = $${queryParams.length}`);
    }

    if (status) {
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
        });
      }
      queryParams.push(status);
      conditions.push(`lo.status = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    queryText += `
      GROUP BY lo.id, p.id, d.id, u.id
      ORDER BY lo.order_date DESC
    `;

    const result = await pool.query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get lab orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve laboratory orders",
    });
  }
};

// GET a lab order by ID
const getLabOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab order ID format",
      });
    }

    const result = await pool.query(
      `SELECT
        lo.id,
        lo.patient_id,
        lo.doctor_id,
        lo.appointment_id,
        lo.order_date,
        lo.status,
        lo.clinical_notes,
        lo.created_at,
        lo.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', loi.id,
              'lab_test_id', loi.lab_test_id,
              'test_name', lt.name,
              'test_category', lt.category,
              'test_price', lt.price,
              'result', loi.result,
              'result_value', loi.result_value,
              'result_unit', loi.result_unit,
              'reference_range', loi.reference_range,
              'status', loi.status,
              'technician_notes', loi.technician_notes,
              'completed_at', loi.completed_at
            )
          ) FILTER (WHERE loi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN doctors d ON lo.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      LEFT JOIN lab_tests lt ON loi.lab_test_id = lt.id
      WHERE lo.id = $1
      GROUP BY lo.id, p.id, d.id, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get lab order by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve laboratory order",
    });
  }
};

// CREATE a lab order with items in a transaction
const createLabOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      patient_id,
      doctor_id,
      appointment_id,
      order_date,
      status,
      clinical_notes,
      tests, // array of lab_test_id strings or objects
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

    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one test is required in tests array",
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

    const orderStatus = status || "ordered";
    if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
      });
    }

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO lab_orders (
        patient_id,
        doctor_id,
        appointment_id,
        order_date,
        status,
        clinical_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        patient_id,
        doctor_id,
        appointment_id || null,
        order_date || new Date().toISOString(),
        orderStatus,
        clinical_notes ? clinical_notes.trim() : null,
      ]
    );

    const orderId = orderResult.rows[0].id;

    for (const testItem of tests) {
      const testId = typeof testItem === "object" ? testItem.lab_test_id : testItem;

      if (!testId || !isValidUuid(testId)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Valid lab_test_id is required for each test",
        });
      }

      const testCheck = await client.query(
        "SELECT id, normal_range, unit FROM lab_tests WHERE id = $1",
        [testId]
      );
      if (testCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: `Laboratory test ${testId} not found`,
        });
      }

      const testInfo = testCheck.rows[0];

      await client.query(
        `INSERT INTO lab_order_items (
          lab_order_id,
          lab_test_id,
          result_unit,
          reference_range,
          status
        )
        VALUES ($1, $2, $3, $4, 'pending')`,
        [orderId, testId, testInfo.unit, testInfo.normal_range]
      );
    }

    await client.query("COMMIT");

    const fullOrder = await pool.query(
      `SELECT
        lo.id,
        lo.patient_id,
        lo.doctor_id,
        lo.appointment_id,
        lo.order_date,
        lo.status,
        lo.clinical_notes,
        lo.created_at,
        lo.updated_at,
        p.patient_number,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        u.first_name AS doctor_first_name,
        u.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', loi.id,
              'lab_test_id', loi.lab_test_id,
              'test_name', lt.name,
              'test_price', lt.price,
              'reference_range', loi.reference_range,
              'result_unit', loi.result_unit,
              'status', loi.status
            )
          ) FILTER (WHERE loi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN doctors d ON lo.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      LEFT JOIN lab_tests lt ON loi.lab_test_id = lt.id
      WHERE lo.id = $1
      GROUP BY lo.id, p.id, d.id, u.id`,
      [orderId]
    );

    res.status(201).json({
      success: true,
      message: "Laboratory order created successfully",
      data: fullOrder.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create lab order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create laboratory order",
    });
  } finally {
    client.release();
  }
};

// UPDATE a lab order status
const updateLabOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab order ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM lab_orders WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory order not found",
      });
    }

    const current = check.rows[0];
    const { status, clinical_notes } = req.body;

    const targetStatus = status !== undefined ? status : current.status;
    if (targetStatus && !VALID_ORDER_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
      });
    }

    await pool.query(
      `UPDATE lab_orders SET
        status = $1,
        clinical_notes = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [
        targetStatus,
        clinical_notes !== undefined ? (clinical_notes ? clinical_notes.trim() : null) : current.clinical_notes,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Laboratory order updated successfully",
    });
  } catch (error) {
    console.error("Update lab order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update laboratory order",
    });
  }
};

// UPDATE a lab order item result
const updateLabOrderItemResult = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!isValidUuid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab order item ID format",
      });
    }

    const check = await pool.query(
      "SELECT * FROM lab_order_items WHERE id = $1",
      [itemId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory order item not found",
      });
    }

    const current = check.rows[0];
    const {
      result,
      result_value,
      result_unit,
      reference_range,
      technician_notes,
      status,
    } = req.body;

    const targetStatus = status || "completed";
    if (!VALID_ITEM_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_ITEM_STATUSES.join(", ")}`,
      });
    }

    const completedAt =
      targetStatus === "completed" ? new Date().toISOString() : current.completed_at;

    const updateResult = await pool.query(
      `UPDATE lab_order_items SET
        result = $1,
        result_value = $2,
        result_unit = $3,
        reference_range = $4,
        technician_notes = $5,
        status = $6,
        completed_at = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        result !== undefined ? result : current.result,
        result_value !== undefined ? result_value : current.result_value,
        result_unit !== undefined ? result_unit : current.result_unit,
        reference_range !== undefined ? reference_range : current.reference_range,
        technician_notes !== undefined ? technician_notes : current.technician_notes,
        targetStatus,
        completedAt,
        itemId,
      ]
    );

    // If all items for this order are completed, update parent order status
    const remainingPending = await pool.query(
      "SELECT id FROM lab_order_items WHERE lab_order_id = $1 AND status != 'completed'",
      [current.lab_order_id]
    );

    if (remainingPending.rows.length === 0) {
      await pool.query(
        "UPDATE lab_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [current.lab_order_id]
      );
    }

    res.status(200).json({
      success: true,
      message: "Lab test result updated successfully",
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Update lab order item result error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update lab test result",
    });
  }
};

// DELETE a lab order
const deleteLabOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab order ID format",
      });
    }

    const check = await pool.query(
      "SELECT id FROM lab_orders WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratory order not found",
      });
    }

    await pool.query("DELETE FROM lab_orders WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Laboratory order deleted successfully",
    });
  } catch (error) {
    console.error("Delete lab order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete laboratory order",
    });
  }
};

module.exports = {
  getLabTests,
  getLabTestById,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  getLabOrders,
  getLabOrderById,
  createLabOrder,
  updateLabOrder,
  updateLabOrderItemResult,
  deleteLabOrder,
};
