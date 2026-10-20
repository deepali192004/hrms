
const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const toRadians = (degrees) => (degrees * Math.PI) / 180;

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

// Start a scheduled class after timetable and GPS verification
router.post("/start-class", authMiddleware, async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    const userId = req.user.userId;
    const { class_id, latitude, longitude } = req.body;

    if (
      !Number.isInteger(Number(class_id)) ||
      Number(class_id) <= 0 ||
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) ||
      Number(latitude) < -90 ||
      Number(latitude) > 90 ||
      Number(longitude) < -180 ||
      Number(longitude) > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid class_id, latitude and longitude are required",
      });
    }

    const [teachers] = await connection.query(
      `SELECT teacher_id, department_id
       FROM teachers
       WHERE user_id = ?`,
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const teacher = teachers[0];

    const [classes] = await connection.query(
      `SELECT
         class_id,
         teacher_id,
         department_id,
         class_day,
         start_time,
         end_time,
         status
       FROM timetable
       WHERE class_id = ?
         AND teacher_id = ?
         AND department_id = ?
         AND status = 'Scheduled'`,
      [Number(class_id), teacher.teacher_id, teacher.department_id]
    );

    if (classes.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Scheduled class not found for this faculty",
      });
    }

    const scheduledClass = classes[0];
    const now = new Date();

    // Use server-local date/time for this initial demo.
    const todayName = DAY_NAMES[now.getDay()];

    if (scheduledClass.class_day !== todayName) {
      return res.status(403).json({
        success: false,
        message: "Today is not the scheduled day for this class",
        scheduled_day: scheduledClass.class_day,
        today: todayName,
      });
    }

    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    const timeString = (value) => {
      if (typeof value === "string") return value.slice(0, 8);
      return String(value).slice(16, 24);
    };

    const startTime = timeString(scheduledClass.start_time);
    const endTime = timeString(scheduledClass.end_time);

    if (currentTime < startTime || currentTime > endTime) {
      return res.status(403).json({
        success: false,
        message: "Current time is outside the scheduled class time",
        scheduled_start: startTime,
        scheduled_end: endTime,
      });
    }

    const [departments] = await connection.query(
      `SELECT location_latitude, location_longitude, geofence_radius
       FROM departments
       WHERE department_id = ?`,
      [scheduledClass.department_id]
    );

    if (
      departments.length === 0 ||
      departments[0].location_latitude == null ||
      departments[0].location_longitude == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Department GPS location is not configured",
      });
    }

    const department = departments[0];

    const distance = calculateDistanceMeters(
      Number(department.location_latitude),
      Number(department.location_longitude),
      Number(latitude),
      Number(longitude)
    );

    const radius = Number(department.geofence_radius) || 100;

    if (distance > radius) {
      return res.status(403).json({
        success: false,
        message: "You are outside the department geofence",
        distance_meters: Math.round(distance),
        allowed_radius_meters: radius,
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const [existing] = await connection.query(
      `SELECT attendance_id
       FROM attendance
       WHERE class_id = ?
         AND teacher_id = ?
         AND attendance_date = CURDATE()
       FOR UPDATE`,
      [scheduledClass.class_id, teacher.teacher_id]
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Attendance for this class has already been started today",
      });
    }

    const [insertResult] = await connection.query(
      `INSERT INTO attendance (
         class_id,
         teacher_id,
         department_id,
         attendance_date,
         check_in_time,
         attendance_status,
         verification_status,
         latitude,
         longitude,
         working_hours
       )
       VALUES (?, ?, ?, CURDATE(), NOW(), 'Present', 'Verified', ?, ?, 0.00)`,
      [
        scheduledClass.class_id,
        teacher.teacher_id,
        scheduledClass.department_id,
        Number(latitude),
        Number(longitude),
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Class started and attendance recorded",
      attendance_id: insertResult.insertId,
      class_id: scheduledClass.class_id,
      distance_meters: Math.round(distance),
      verification_status: "Verified",
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
        transactionStarted = false;
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError.message);
      }
    }

    console.error("Start class error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to start class",
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
