const express = require("express");
const Hotel = require("../models/Hotel");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");

const router = express.Router();
router.use(requireAuth, requireRole("guest"));

router.get("/", async (_req, res) => {
  try {
    const hotels = await Hotel.find().select("name location").sort({ name: 1 }).limit(500).lean();
    return res.json({
      hotels: hotels.map((hotel) => ({
        id: hotel._id.toString(),
        name: hotel.name,
        location: hotel.location,
      })),
    });
  } catch (error) {
    console.error("Hotel list lookup failed:", error);
    return res.status(500).json({ error: "Unable to load hotels right now." });
  }
});

module.exports = router;
