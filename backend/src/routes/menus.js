const express = require("express");
const Menu = require("../models/Menu");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");

const router = express.Router();
const mealOrder = ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"];
router.use(requireAuth, requireRole("guest"));

router.get("/", async (_req, res) => {
  try {
    const records = await Menu.find()
      .select("hotelName mealType recipeNames foods desserts name description createdAt")
      .sort({ hotelName: 1, mealType: 1, createdAt: 1 })
      .limit(1000)
      .lean();
    const grouped = new Map();
    records.forEach((record) => {
      const key = `${record.hotelName.trim().toLocaleLowerCase("en")}|${record.mealType}`;
      const group = grouped.get(key) || {
        hotelName: record.hotelName,
        mealType: record.mealType,
        foods: [],
        desserts: [],
        description: "",
      };
      const recipeNames = record.recipeNames?.length
        ? record.recipeNames
        : record.name ? [record.name] : [];
      const hasCategorizedRecipes = Boolean(record.foods?.length || record.desserts?.length);
      const foods = hasCategorizedRecipes ? record.foods || [] : recipeNames;
      const desserts = Array.isArray(record.desserts) ? record.desserts : [];
      [["foods", foods], ["desserts", desserts]].forEach(([category, names]) => {
        const existingNames = new Set(group[category].map((name) => name.toLocaleLowerCase("en")));
        names.forEach((name) => {
          const normalized = name.trim().toLocaleLowerCase("en");
          if (normalized && !existingNames.has(normalized)) {
            group[category].push(name);
            existingNames.add(normalized);
          }
        });
      });
      if (!group.description && record.description) group.description = record.description;
      grouped.set(key, group);
    });

    const menus = Array.from(grouped.values()).sort((left, right) => (
      left.hotelName.localeCompare(right.hotelName) ||
      mealOrder.indexOf(left.mealType) - mealOrder.indexOf(right.mealType)
    ));
    return res.json({ menus });
  } catch (error) {
    console.error("Guest menu lookup failed:", error);
    return res.status(500).json({ error: "Unable to load hotel menus right now." });
  }
});

module.exports = router;
