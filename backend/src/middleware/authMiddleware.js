
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [sessions] = await pool.execute(
      `SELECT session_id
       FROM auth_sessions
       WHERE user_id = ?
         AND token_hash = ?
         AND revoked_at IS NULL
         AND expires_at > NOW()`,
      [decoded.userId, tokenHash]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Session expired or revoked. Please log in again.",
      });
    }

    req.user = decoded;
    req.sessionId = sessions[0].session_id;

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication service failed",
    });
  }
};

module.exports = authenticateToken;
