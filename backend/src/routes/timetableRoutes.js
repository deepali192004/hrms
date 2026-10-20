
const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Get timetable for the logged-in faculty
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [teachers] = await db.query(
      "SELECT teacher_id, department_id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const teacher = teachers[0];

    const [classes] = await db.query(
      `SELECT
         class_id,
         subject_name,
         class_day,
         start_time,
         end_time,
         room_name,
         status
       FROM timetable
       WHERE teacher_id = ?
         AND department_id = ?
       ORDER BY FIELD(
         class_day,
         'Wednesday',
         'Thursday',
         'Friday',
         'Saturday',
         'Sunday',
         'Monday'
       ), start_time`,
      [teacher.teacher_id, teacher.department_id]
    );

    return res.status(200).json({
      success: true,
      count: classes.length,
      timetable: classes,
    });
  } catch (error) {
    console.error("Get timetable error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
});

module.exports = router;
