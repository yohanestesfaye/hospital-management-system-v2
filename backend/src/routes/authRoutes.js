const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const { authenticate, optionalAuthenticate } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", optionalAuthenticate, authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, getMe);

module.exports = router;
