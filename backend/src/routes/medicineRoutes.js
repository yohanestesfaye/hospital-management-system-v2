const express = require("express");

const {
  getMedicines,
  getLowStockMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicineController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Read medicines (clinical & pharmacy staff)
router.get(
  "/",
  authenticate,
  authorize("admin", "pharmacist", "doctor", "nurse"),
  getMedicines
);
router.get(
  "/low-stock",
  authenticate,
  authorize("admin", "pharmacist", "doctor", "nurse"),
  getLowStockMedicines
);
router.get(
  "/:id",
  authenticate,
  authorize("admin", "pharmacist", "doctor", "nurse"),
  getMedicineById
);

// Manage medicines inventory (pharmacist, admin)
router.post("/", authenticate, authorize("admin", "pharmacist"), createMedicine);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "pharmacist"),
  updateMedicine
);
router.delete("/:id", authenticate, authorize("admin"), deleteMedicine);

module.exports = router;
