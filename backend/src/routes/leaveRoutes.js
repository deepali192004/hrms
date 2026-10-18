
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  applyLeave,
  getMyLeaves,
} = require("../controllers/leaveController");

router.post("/", authenticateToken, applyLeave);
router.get("/my", authenticateToken, getMyLeaves);

module.exports = router;
