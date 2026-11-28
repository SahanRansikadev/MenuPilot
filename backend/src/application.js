const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const bookingRoutes = require("./routes/bookings");
const foodRoutes = require("./routes/foods");
const hotelRoutes = require("./routes/hotels");
const ingredientRoutes = require("./routes/ingredients");
const kitchenRoutes = require("./routes/kitchen");
const menuRoutes = require("./routes/menus");

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

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "MenuPilot Backend is running!",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MenuPilot Backend is running",
    status: "OK",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }

  console.error("Unhandled API error:", error);
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

module.exports = app;
