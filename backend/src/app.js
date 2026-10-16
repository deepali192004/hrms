const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Banasthali Faculty HRMS API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend server is healthy",
  });
});

module.exports = app;
