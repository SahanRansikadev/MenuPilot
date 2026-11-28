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
      .select("hotelName mealType recipeNames name description createdAt")
      .sort({ hotelName: 1, mealType: 1, createdAt: 1 })
      .limit(1000)
      .lean();
    const grouped = new Map();
    records.forEach((record) => {
      const key = `${record.hotelName.trim().toLocaleLowerCase("en")}|${record.mealType}`;
      const group = grouped.get(key) || {
        hotelName: record.hotelName,
        mealType: record.mealType,
        recipeNames: [],
        description: "",
      };
      const recipeNames = record.recipeNames?.length
        ? record.recipeNames
        : record.name ? [record.name] : [];
      const existingNames = new Set(group.recipeNames.map((name) => name.toLocaleLowerCase("en")));
      recipeNames.forEach((name) => {
        const normalized = name.trim().toLocaleLowerCase("en");
        if (normalized && !existingNames.has(normalized)) {
          group.recipeNames.push(name);
          existingNames.add(normalized);
        }
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
