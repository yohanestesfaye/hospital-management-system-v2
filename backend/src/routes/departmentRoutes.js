const express = require("express");

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read departments (all authenticated staff)
router.get("/", authenticate, getDepartments);
router.get("/:id", authenticate, getDepartmentById);

// Admin-only management
router.post("/", authenticate, authorize("admin"), createDepartment);
router.put("/:id", authenticate, authorize("admin"), updateDepartment);
router.delete("/:id", authenticate, authorize("admin"), deleteDepartment);

module.exports = router;
