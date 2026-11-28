const express = require("express");
const Food = require("../models/Food");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();
router.use(requireAuth);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeFood(food) {
  return { id: food._id.toString(), name: food.name };
}

router.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";

  try {
    const filter = search ? { name: new RegExp(escapeRegex(search), "i") } : {};
    const foods = await Food.find(filter).select("name").sort({ name: 1 }).limit(12).lean();
    return res.json({ foods: foods.map(serializeFood) });
  } catch (error) {
    console.error("Food search failed:", error);
    return res.status(500).json({ error: "Unable to search foods right now." });
  }
});

router.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 100) {
    return res.status(400).json({ error: "Food names must be between 1 and 100 characters." });
  }

  const normalizedName = name.toLocaleLowerCase("en");
  try {
    const existing = await Food.findOne({ normalizedName }).lean();
    if (existing) {
      return res.json({ food: serializeFood(existing) });
    }

    const food = await Food.create({ name, normalizedName, createdBy: req.userId });
    return res.status(201).json({ food: serializeFood(food) });
  } catch (error) {
    if (error && error.code === 11000) {
      try {
        const existing = await Food.findOne({ normalizedName }).lean();
        if (existing) {
          return res.json({ food: serializeFood(existing) });
        }
      } catch (lookupError) {
        console.error("Duplicate food lookup failed:", lookupError);
        return res.status(500).json({ error: "Unable to add this food right now." });
      }
    }

    console.error("Food creation failed:", error);
    return res.status(500).json({ error: "Unable to add this food right now." });
  }
});

module.exports = router;
