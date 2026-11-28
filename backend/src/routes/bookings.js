const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Food = require("../models/Food");
const Hotel = require("../models/Hotel");
const Ingredient = require("../models/Ingredient");
const KitchenTask = require("../models/KitchenTask");
const User = require("../models/User");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");
const parseBookingPayload = require("../utils/booking-validation");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("guest"));

function serializeBooking(booking) {
  const hotel = booking.hotelId && typeof booking.hotelId === "object" && booking.hotelId.name
    ? booking.hotelId
    : null;
  return {
    id: booking._id.toString(),
    date: new Date(booking.date).toISOString().slice(0, 10),
    status: booking.status || "pending",
    hotel: {
      id: hotel ? hotel._id.toString() : booking.hotelId ? booking.hotelId.toString() : "",
      name: hotel ? hotel.name : booking.hotelName || "Select a hotel branch",
      location: hotel ? hotel.location : booking.hotelLocation || "",
    },
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
      desserts: (meal.desserts || []).map((food) => ({
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

async function buildBookingFields(value) {
  const hotel = await Hotel.findById(value.hotelId).select("name location").lean();
  if (!hotel) return { error: "The selected hotel branch is no longer available." };

  const requestedFoodIds = [...new Set(
    value.meals.flatMap((meal) => [...meal.foodIds, ...meal.dessertIds]),
  )];
  const foods = await Food.find({ _id: { $in: requestedFoodIds } }).select("name").lean();
  const foodById = new Map(foods.map((food) => [food._id.toString(), food]));
  if (foodById.size !== requestedFoodIds.length) {
    return { error: "One or more selected foods or desserts are no longer available." };
  }

  const requestedIngredientIds = [
    ...new Set(value.meals.flatMap((meal) => meal.ingredientIds)),
  ];
  let ingredients = [];
  if (requestedIngredientIds.length > 0) {
    ingredients = await Ingredient.find({ _id: { $in: requestedIngredientIds } })
      .select("name")
      .lean();
    if (ingredients.length !== requestedIngredientIds.length) {
      return { error: "One or more selected ingredients are no longer available." };
    }
  }
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient._id.toString(), ingredient]));

  return {
    value: {
      hotelId: hotel._id,
      hotelName: hotel.name,
      hotelLocation: hotel.location,
      date: new Date(`${value.date}T00:00:00.000Z`),
      guestCount: value.guestCount,
      childrenCount: value.childrenCount,
      driverCount: value.driverCount,
      guideCount: value.guideCount,
      meals: value.meals.map((meal) => ({
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
        desserts: meal.dessertIds.map((foodId) => ({
          foodId,
          name: foodById.get(foodId).name,
        })),
      })),
      isVegetarian: value.isVegetarian,
      hasAllergies: value.hasAllergies,
      allergyCount: value.allergyCount,
      notes: value.notes,
    },
  };
}

async function cancelOpenTasks(bookingId) {
  await KitchenTask.updateMany(
    { bookingId, status: { $in: ["sent", "accepted", "preparing"] } },
    { $set: { status: "cancelled", costingStatus: "cancelled" } },
  );
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

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Choose a valid booking." });
  }
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    return res.json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error("Booking detail lookup failed:", error);
    return res.status(500).json({ error: "Unable to load this booking right now." });
  }
});

router.post("/", async (req, res) => {
  const parsed = parseBookingPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const resolved = await buildBookingFields(parsed.value);
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    const user = await User.findById(req.userId).select("name email").lean();
    if (!user) return res.status(401).json({ error: "Account not found. Please sign in again." });
    const booking = await Booking.create({
      userId: req.userId,
      guestName: user.name || "",
      guestEmail: user.email || "",
      ...resolved.value,
    });
    return res.status(201).json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error("Booking creation failed:", error);
    return res.status(500).json({ error: "Unable to save your booking right now." });
  }
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Choose a valid booking." });
  }
  const parsed = parseBookingPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.userId });
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    const resolved = await buildBookingFields(parsed.value);
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    const user = await User.findById(req.userId).select("name email").lean();
    if (!user) return res.status(401).json({ error: "Account not found. Please sign in again." });
    Object.assign(booking, resolved.value, {
      guestName: user.name || "",
      guestEmail: user.email || "",
      status: "pending",
    });
    await booking.save();
    await cancelOpenTasks(booking._id);
    return res.json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error("Booking update failed:", error);
    return res.status(500).json({ error: "Unable to update your booking and its kitchen tasks right now." });
  }
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Choose a valid booking." });
  }
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.userId });
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    await cancelOpenTasks(booking._id);
    await booking.deleteOne();
    return res.json({ success: true });
  } catch (error) {
    console.error("Booking deletion failed:", error);
    return res.status(500).json({ error: "Unable to delete your booking right now." });
  }
});

module.exports = router;
