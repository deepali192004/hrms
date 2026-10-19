
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
        message:
          "Please provide valid dates. End date must not be before start date.",
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

// HOD: View pending leaves from the assigned department
const getPendingLeaves = async (req, res) => {
  try {
    if (req.user.role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HOD can view pending department leaves.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
         lr.leave_id,
         lr.user_id,
         lr.leave_type,
         lr.start_date,
         lr.end_date,
         lr.reason,
         lr.status,
         lr.applied_on,
         faculty.name AS faculty_name,
         faculty.employee_id,
         d.department_name
       FROM leave_requests lr
       JOIN teachers faculty ON faculty.user_id = lr.user_id
       JOIN departments d ON d.department_id = faculty.department_id
       JOIN teachers hod ON hod.teacher_id = d.hod_teacher_id
       WHERE hod.user_id = ?
         AND lr.status = 'Pending'
       ORDER BY lr.applied_on ASC`,
      [req.user.userId]
    );

    return res.json({
      success: true,
      leaves: rows,
    });
  } catch (error) {
    console.error("Get pending leaves error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending leave applications.",
    });
  }
};

// HOD: Approve or reject a pending leave
const reviewLeave = async (req, res) => {
  try {
    if (req.user.role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HOD can review leave applications.",
      });
    }

    const leaveId = Number(req.params.leaveId);
    const { status, review_remarks } = req.body;

    if (!Number.isInteger(leaveId) || leaveId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID.",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected.",
      });
    }

    const remarks =
      review_remarks == null ? null : String(review_remarks).trim();

    const [result] = await pool.execute(
      `UPDATE leave_requests lr
       JOIN teachers faculty ON faculty.user_id = lr.user_id
       JOIN departments d ON d.department_id = faculty.department_id
       JOIN teachers hod ON hod.teacher_id = d.hod_teacher_id
       SET lr.status = ?,
           lr.reviewed_by = ?,
           lr.review_remarks = ?
       WHERE lr.leave_id = ?
         AND lr.status = 'Pending'
         AND hod.user_id = ?`,
      [status, req.user.userId, remarks, leaveId, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Pending leave not found in your assigned department, or it has already been reviewed.",
      });
    }

    return res.json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully.`,
      leaveId,
      status,
    });
  } catch (error) {
    console.error("Review leave error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to review leave application.",
    });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  reviewLeave,
};

