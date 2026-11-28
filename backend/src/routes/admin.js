const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const KitchenTask = require("../models/KitchenTask");
const Menu = require("../models/Menu");
const User = require("../models/User");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");
const parseMenuPayload = require("../utils/menu-validation");

const router = express.Router();
const userRoles = ["admin", "kitchenTeam", "guest"];
const bookingStatuses = ["pending", "confirmed", "preparing", "completed", "cancelled"];

router.use(requireAuth, requireRole("admin"));

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || "guest",
    phone: user.phone || "",
    guestCount: user.guestCount || 1,
    childrenCount: user.childrenCount || 0,
    countryCode: user.countryCode || "",
    createdAt: user.createdAt,
  };
}

function serializeMenu(menu) {
  return {
    id: menu._id.toString(),
    hotelName: menu.hotelName,
    name: menu.name,
    mealType: menu.mealType,
    description: menu.description || "",
    ingredients: menu.ingredients || [],
    instructions: menu.instructions,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
  };
}

function serializeBooking(booking) {
  const guest = booking.userId && booking.userId.name ? booking.userId : null;
  return {
    id: booking._id.toString(),
    guest: guest
      ? { id: guest._id.toString(), name: guest.name, email: guest.email }
      : { id: booking.userId.toString(), name: "Guest", email: "" },
    date: new Date(booking.date).toISOString().slice(0, 10),
    status: booking.status || "pending",
    guestCount: booking.guestCount,
    childrenCount: booking.childrenCount,
    driverCount: booking.driverCount,
    guideCount: booking.guideCount,
    meals: (booking.meals || []).map((meal) => ({
      type: meal.type,
      ...(meal.name ? { name: meal.name } : {}),
      time: meal.time,
      foods: (meal.foods || []).map((food) => ({ id: food.foodId.toString(), name: food.name })),
      ingredients: (meal.ingredients || []).map((ingredient) => ({
        id: ingredient.ingredientId.toString(),
        name: ingredient.name,
      })),
      hasIngredients: Boolean(meal.hasIngredients),
    })),
    isVegetarian: booking.isVegetarian,
    hasAllergies: booking.hasAllergies,
    notes: booking.notes || "",
  };
}

function serializeTask(task) {
  const assignedUser = task.assignedTo && task.assignedTo.name ? task.assignedTo : null;
  const booking = task.bookingId && task.bookingId.date ? task.bookingId : null;
  return {
    id: task._id.toString(),
    assignedTo: assignedUser
      ? { id: assignedUser._id.toString(), name: assignedUser.name, email: assignedUser.email }
      : { id: task.assignedTo.toString(), name: "Kitchen team", email: "" },
    booking: booking
      ? {
          id: booking._id.toString(),
          date: new Date(booking.date).toISOString().slice(0, 10),
          guestCount: booking.guestCount,
        }
      : { id: task.bookingId.toString(), date: "", guestCount: 0 },
    hotelName: task.hotelName,
    recipeName: task.recipeName,
    mealType: task.mealType,
    description: task.description || "",
    ingredients: task.ingredients || [],
    instructions: task.instructions,
    notes: task.notes || "",
    status: task.status,
    createdAt: task.createdAt,
  };
}

router.get("/users", async (_req, res) => {
  try {
    const users = await User.find()
      .select("name email role phone guestCount childrenCount countryCode createdAt")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return res.json({ users: users.map(serializeUser) });
  } catch (error) {
    console.error("Admin user lookup failed:", error);
    return res.status(500).json({ error: "Unable to load users right now." });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body || {};
  if (!mongoose.isValidObjectId(req.params.id) || !userRoles.includes(role)) {
    return res.status(400).json({ error: "Choose a valid account and role." });
  }

  try {
    const existingUser = await User.findById(req.params.id)
      .select("name email role phone guestCount childrenCount countryCode createdAt")
      .lean();
    if (!existingUser) return res.status(404).json({ error: "User not found." });

    const currentRole = existingUser.role || "guest";
    if (currentRole === role) return res.json({ user: serializeUser(existingUser) });
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }
    if (currentRole === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(409).json({ error: "The last administrator cannot be demoted." });
      }
    }
    if (currentRole === "kitchenTeam" && role !== "kitchenTeam") {
      const activeTask = await KitchenTask.exists({
        assignedTo: req.params.id,
        status: { $in: ["sent", "accepted", "preparing"] },
      });
      if (activeTask) {
        return res.status(409).json({ error: "Complete or decline this kitchen member's active tasks before changing their role." });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true, runValidators: true },
    ).select("name email role phone guestCount childrenCount countryCode createdAt").lean();
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error("Admin role update failed:", error);
    return res.status(500).json({ error: "Unable to update this user's role right now." });
  }
});

router.get("/bookings", async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({ path: "userId", select: "name email" })
      .sort({ date: 1, createdAt: -1 })
      .limit(500)
      .lean();
    return res.json({ bookings: bookings.map(serializeBooking) });
  } catch (error) {
    console.error("Admin booking lookup failed:", error);
    return res.status(500).json({ error: "Unable to load bookings right now." });
  }
});

router.patch("/bookings/:id/status", async (req, res) => {
  const { status } = req.body || {};
  if (!mongoose.isValidObjectId(req.params.id) || !bookingStatuses.includes(status)) {
    return res.status(400).json({ error: "Choose a valid booking and status." });
  }

  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    return res.json({ booking: { id: booking._id.toString(), status: booking.status } });
  } catch (error) {
    console.error("Admin booking update failed:", error);
    return res.status(500).json({ error: "Unable to update this booking right now." });
  }
});

router.get("/menus", async (_req, res) => {
  try {
    const menus = await Menu.find().sort({ hotelName: 1, mealType: 1, name: 1 }).limit(500).lean();
    return res.json({ menus: menus.map(serializeMenu) });
  } catch (error) {
    console.error("Admin menu lookup failed:", error);
    return res.status(500).json({ error: "Unable to load menus right now." });
  }
});

router.post("/menus", async (req, res) => {
  const parsed = parseMenuPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const menu = await Menu.create({ ...parsed.value, createdBy: req.userId });
    return res.status(201).json({ menu: serializeMenu(menu) });
  } catch (error) {
    console.error("Admin menu creation failed:", error);
    return res.status(500).json({ error: "Unable to create this menu right now." });
  }
});

router.put("/menus/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Choose a valid menu." });
  }
  const parsed = parseMenuPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const menu = await Menu.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.value },
      { new: true, runValidators: true },
    ).lean();
    if (!menu) return res.status(404).json({ error: "Menu not found." });
    return res.json({ menu: serializeMenu(menu) });
  } catch (error) {
    console.error("Admin menu update failed:", error);
    return res.status(500).json({ error: "Unable to update this menu right now." });
  }
});

router.delete("/menus/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Choose a valid menu." });
  }

  try {
    const assignedTask = await KitchenTask.exists({ menuId: req.params.id });
    if (assignedTask) {
      return res.status(409).json({ error: "This menu has been sent to the kitchen and cannot be deleted." });
    }

    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return res.status(404).json({ error: "Menu not found." });
    return res.json({ message: "Menu deleted." });
  } catch (error) {
    console.error("Admin menu deletion failed:", error);
    return res.status(500).json({ error: "Unable to delete this menu right now." });
  }
});

router.get("/kitchen/tasks", async (_req, res) => {
  try {
    const tasks = await KitchenTask.find()
      .populate({ path: "assignedTo", select: "name email" })
      .populate({ path: "bookingId", select: "date guestCount" })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return res.json({ tasks: tasks.map(serializeTask) });
  } catch (error) {
    console.error("Admin kitchen task lookup failed:", error);
    return res.status(500).json({ error: "Unable to load kitchen tasks right now." });
  }
});

router.post("/kitchen/tasks", async (req, res) => {
  const { assignedTo, bookingId, menuId, notes = "" } = req.body || {};
  if (
    !mongoose.isValidObjectId(assignedTo) ||
    !mongoose.isValidObjectId(bookingId) ||
    !mongoose.isValidObjectId(menuId) ||
    typeof notes !== "string" ||
    notes.trim().length > 1000
  ) {
    return res.status(400).json({ error: "Choose a kitchen team member, booking, and menu; notes must be 1,000 characters or fewer." });
  }

  try {
    const [teamMember, booking, menu] = await Promise.all([
      User.findById(assignedTo).select("_id role"),
      Booking.findById(bookingId).select("_id status"),
      Menu.findById(menuId),
    ]);
    if (!teamMember || teamMember.role !== "kitchenTeam") {
      return res.status(400).json({ error: "Choose an active kitchen team account." });
    }
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.status === "cancelled") {
      return res.status(409).json({ error: "A kitchen task cannot be created for a cancelled booking." });
    }
    if (!menu) return res.status(404).json({ error: "Menu or recipe not found." });

    const task = await KitchenTask.create({
      assignedTo,
      bookingId,
      menuId,
      hotelName: menu.hotelName,
      recipeName: menu.name,
      mealType: menu.mealType,
      description: menu.description,
      ingredients: menu.ingredients,
      instructions: menu.instructions,
      notes: notes.trim(),
      createdBy: req.userId,
    });
    return res.status(201).json({ task: serializeTask(task) });
  } catch (error) {
    console.error("Kitchen task dispatch failed:", error);
    return res.status(500).json({ error: "Unable to send this kitchen task right now." });
  }
});

module.exports = router;
