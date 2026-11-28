const express = require("express");
const Ingredient = require("../models/Ingredient");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();
router.use(requireAuth);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeIngredient(ingredient) {
  return { id: ingredient._id.toString(), name: ingredient.name };
}

router.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";

  try {
    const filter = search ? { name: new RegExp(escapeRegex(search), "i") } : {};
    const ingredients = await Ingredient.find(filter).select("name").sort({ name: 1 }).limit(12).lean();
    return res.json({ ingredients: ingredients.map(serializeIngredient) });
  } catch (error) {
    console.error("Ingredient search failed:", error);
    return res.status(500).json({ error: "Unable to search ingredients right now." });
  }
});

router.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 100) {
    return res.status(400).json({ error: "Ingredient names must be between 1 and 100 characters." });
  }

  const normalizedName = name.toLocaleLowerCase("en");
  try {
    const existing = await Ingredient.findOne({ normalizedName }).lean();
    if (existing) {
      return res.json({ ingredient: serializeIngredient(existing) });
    }

    const ingredient = await Ingredient.create({ name, normalizedName, createdBy: req.userId });
    return res.status(201).json({ ingredient: serializeIngredient(ingredient) });
  } catch (error) {
    if (error && error.code === 11000) {
      try {
        const existing = await Ingredient.findOne({ normalizedName }).lean();
        if (existing) {
          return res.json({ ingredient: serializeIngredient(existing) });
        }
      } catch (lookupError) {
        console.error("Duplicate ingredient lookup failed:", lookupError);
        return res.status(500).json({ error: "Unable to add this ingredient right now." });
      }
    }

    console.error("Ingredient creation failed:", error);
    return res.status(500).json({ error: "Unable to add this ingredient right now." });
  }
});

module.exports = router;
