const express = require("express");
const Booking = require("../models/Booking");
const Food = require("../models/Food");
const Ingredient = require("../models/Ingredient");
const requireAuth = require("../middleware/require-auth");
const parseBookingPayload = require("../utils/booking-validation");

const router = express.Router();
router.use(requireAuth);

function serializeBooking(booking) {
  return {
    id: booking._id.toString(),
    date: new Date(booking.date).toISOString().slice(0, 10),
    guestCount: booking.guestCount,
    childrenCount: booking.childrenCount,
    driverCount: booking.driverCount,
    guideCount: booking.guideCount,
    meals: booking.meals.map((meal) => ({
      type: meal.type,
      ...(meal.name ? { name: meal.name } : {}),
      time: meal.time,
      hasIngredients: Boolean(meal.hasIngredients),
      ingredients: (meal.ingredients || []).map((ingredient) => ({
        id: ingredient.ingredientId.toString(),
        name: ingredient.name,
      })),
      foods: meal.foods.map((food) => ({
        id: food.foodId.toString(),
        name: food.name,
      })),
    })),
    isVegetarian: booking.isVegetarian,
    hasAllergies: booking.hasAllergies,
    allergyCount: booking.allergyCount,
    notes: booking.notes || "",
    createdAt: booking.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId }).sort({ date: 1, createdAt: -1 }).lean();
    return res.json({ bookings: bookings.map(serializeBooking) });
  } catch (error) {
    console.error("Booking lookup failed:", error);
    return res.status(500).json({ error: "Unable to load your bookings right now." });
  }
});

router.post("/", async (req, res) => {
  const parsed = parseBookingPayload(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const requestedFoodIds = [...new Set(parsed.value.meals.flatMap((meal) => meal.foodIds))];
    const foods = await Food.find({ _id: { $in: requestedFoodIds } }).select("name").lean();
    const foodById = new Map(foods.map((food) => [food._id.toString(), food]));
    if (foodById.size !== requestedFoodIds.length) {
      return res.status(400).json({ error: "One or more selected foods are no longer available." });
    }

    const requestedIngredientIds = [
      ...new Set(parsed.value.meals.flatMap((meal) => meal.ingredientIds)),
    ];
    let ingredients = [];
    if (requestedIngredientIds.length > 0) {
      ingredients = await Ingredient.find({ _id: { $in: requestedIngredientIds } })
        .select("name")
        .lean();
      if (ingredients.length !== requestedIngredientIds.length) {
        return res.status(400).json({ error: "One or more selected ingredients are no longer available." });
      }
    }
    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient._id.toString(), ingredient]));

    const booking = await Booking.create({
      userId: req.userId,
      date: new Date(`${parsed.value.date}T00:00:00.000Z`),
      guestCount: parsed.value.guestCount,
      childrenCount: parsed.value.childrenCount,
      driverCount: parsed.value.driverCount,
      guideCount: parsed.value.guideCount,
      meals: parsed.value.meals.map((meal) => ({
        type: meal.type,
        ...(meal.name ? { name: meal.name } : {}),
        time: meal.time,
        hasIngredients: meal.hasIngredients,
        ingredients: meal.ingredientIds.map((ingredientId) => ({
          ingredientId,
          name: ingredientById.get(ingredientId).name,
        })),
        foods: meal.foodIds.map((foodId) => ({
          foodId,
          name: foodById.get(foodId).name,
        })),
      })),
      isVegetarian: parsed.value.isVegetarian,
      hasAllergies: parsed.value.hasAllergies,
      allergyCount: parsed.value.allergyCount,
      notes: parsed.value.notes,
    });

    return res.status(201).json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error("Booking creation failed:", error);
    return res.status(500).json({ error: "Unable to save your booking right now." });
  }
});

module.exports = router;
