const express = require("express");

const {
  getMedicines,
  getLowStockMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicineController");

const router = express.Router();

router.get("/", getMedicines);
router.get("/low-stock", getLowStockMedicines);
router.post("/", createMedicine);
router.get("/:id", getMedicineById);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

module.exports = router;
