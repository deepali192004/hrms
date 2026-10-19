
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  reviewLeave,
} = require("../controllers/leaveController");

// Faculty: Apply for leave
router.post("/", authenticateToken, applyLeave);

// Faculty: View own leave history
router.get("/my", authenticateToken, getMyLeaves);

// HOD: View pending leave applications
router.get("/pending", authenticateToken, getPendingLeaves);

// HOD: Approve or reject a leave application
router.patch("/:leaveId/review", authenticateToken, reviewLeave);

module.exports = router;
