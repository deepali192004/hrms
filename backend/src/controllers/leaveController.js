
const pool = require("../config/db");

const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    const allowedTypes = [
      "Casual Leave",
      "Medical Leave",
      "Earned Leave",
      "Other",
    ];

    if (
      !allowedTypes.includes(leave_type) ||
      !start_date ||
      !end_date ||
      !reason ||
      !String(reason).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid leave type, dates and reason.",
      });
    }

    const start = new Date(`${start_date}T00:00:00Z`);
    const end = new Date(`${end_date}T00:00:00Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.toISOString().slice(0, 10) !== start_date ||
      end.toISOString().slice(0, 10) !== end_date ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid dates. End date must not be before start date.",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO leave_requests
       (user_id, leave_type, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        leave_type,
        start_date,
        end_date,
        String(reason).trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      leaveId: result.insertId,
    });
  } catch (error) {
    console.error("Apply leave error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to submit leave application.",
    });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT leave_id, leave_type, start_date, end_date,
              reason, status, review_remarks, applied_on
       FROM leave_requests
       WHERE user_id = ?
       ORDER BY applied_on DESC`,
      [req.user.userId]
    );

    return res.json({
      success: true,
      leaves: rows,
    });
  } catch (error) {
    console.error("Get leaves error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch leave applications.",
    });
  }
};

module.exports = { applyLeave, getMyLeaves };
