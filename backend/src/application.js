const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const authRoutes = require("./routes/auth");

const app = express();
const frontendOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || frontendOrigins.includes(origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MenuPilot Backend is running",
    status: "OK",
  });
});

app.use("/api/auth", authRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }

  console.error("Unhandled API error:", error);
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

module.exports = app;
