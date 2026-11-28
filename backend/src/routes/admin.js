const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Food = require("../models/Food");
const Hotel = require("../models/Hotel");
const Ingredient = require("../models/Ingredient");
const KitchenTask = require("../models/KitchenTask");
const Menu = require("../models/Menu");
const User = require("../models/User");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");
const parseHotelPayload = require("../utils/hotel-validation");
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

function serializeHotel(hotel) {
  return {
    id: hotel._id.toString(),
    name: hotel.name,
    location: hotel.location,
    description: hotel.description || "",
    contactName: hotel.contactName || "",
    phone: hotel.phone || "",
    email: hotel.email || "",
  };
}

function serializeCatalogEntry(entry) {
  return { id: entry._id.toString(), name: entry.name };
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
    allergyCount: booking.allergyCount || 0,
    notes: booking.notes || "",
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCatalogName(payload) {
  const name = typeof payload?.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 100) return null;
  return { name, normalizedName: name.toLocaleLowerCase("en") };
}

function registerCatalogRoutes(resource, Model, label, bookingReference) {
  router.get(`/${resource}`, async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    try {
      const filter = search ? { name: new RegExp(escapeRegex(search), "i") } : {};
      const entries = await Model.find(filter).select("name").sort({ name: 1 }).limit(1000).lean();
      return res.json({ [resource]: entries.map(serializeCatalogEntry) });
    } catch (error) {
      console.error(`Admin ${label} lookup failed:`, error);
      return res.status(500).json({ error: `Unable to load ${label} right now.` });
    }
  });

  router.post(`/${resource}`, async (req, res) => {
    const parsed = parseCatalogName(req.body);
    if (!parsed) return res.status(400).json({ error: `${label} names must be between 1 and 100 characters.` });

    try {
      const entry = await Model.create({ ...parsed, createdBy: req.userId });
      return res.status(201).json({ [resource.slice(0, -1)]: serializeCatalogEntry(entry) });
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(409).json({ error: `That ${label.slice(0, -1)} already exists.` });
      }
      console.error(`Admin ${label} creation failed:`, error);
      return res.status(500).json({ error: `Unable to add this ${label.slice(0, -1)} right now.` });
    }
  });

  router.put(`/${resource}/:id`, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: `Choose a valid ${label.slice(0, -1)}.` });
    const parsed = parseCatalogName(req.body);
    if (!parsed) return res.status(400).json({ error: `${label} names must be between 1 and 100 characters.` });

    try {
      const entry = await Model.findByIdAndUpdate(
        req.params.id,
        { $set: parsed },
        { new: true, runValidators: true },
      ).select("name").lean();
      if (!entry) return res.status(404).json({ error: `${label.slice(0, -1)} not found.` });
      return res.json({ [resource.slice(0, -1)]: serializeCatalogEntry(entry) });
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(409).json({ error: `That ${label.slice(0, -1)} already exists.` });
      }
      console.error(`Admin ${label} update failed:`, error);
      return res.status(500).json({ error: `Unable to update this ${label.slice(0, -1)} right now.` });
    }
  });

  router.delete(`/${resource}/:id`, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: `Choose a valid ${label.slice(0, -1)}.` });
    try {
      const referencedByBooking = await Booking.exists({ [bookingReference]: req.params.id });
      if (referencedByBooking) {
        return res.status(409).json({ error: `This ${label.slice(0, -1)} is used by a booking and cannot be removed.` });
      }
      const entry = await Model.findByIdAndDelete(req.params.id);
      if (!entry) return res.status(404).json({ error: `${label.slice(0, -1)} not found.` });
      return res.json({ message: `${label.slice(0, -1)} removed.` });
    } catch (error) {
      console.error(`Admin ${label} deletion failed:`, error);
      return res.status(500).json({ error: `Unable to remove this ${label.slice(0, -1)} right now.` });
    }
  });
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

router.get("/hotels", async (_req, res) => {
  try {
    const hotels = await Hotel.find().sort({ name: 1 }).limit(500).lean();
    return res.json({ hotels: hotels.map(serializeHotel) });
  } catch (error) {
    console.error("Admin hotel lookup failed:", error);
    return res.status(500).json({ error: "Unable to load hotels right now." });
  }
});

router.post("/hotels", async (req, res) => {
  const parsed = parseHotelPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const hotel = await Hotel.create({ ...parsed.value, createdBy: req.userId });
    return res.status(201).json({ hotel: serializeHotel(hotel) });
  } catch (error) {
    if (error && error.code === 11000) return res.status(409).json({ error: "A hotel with this name already exists." });
    console.error("Admin hotel creation failed:", error);
    return res.status(500).json({ error: "Unable to create this hotel right now." });
  }
});

router.put("/hotels/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Choose a valid hotel." });
  const parsed = parseHotelPayload(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const currentHotel = await Hotel.findById(req.params.id).lean();
    if (!currentHotel) return res.status(404).json({ error: "Hotel not found." });
    if (currentHotel.name !== parsed.value.name) {
      const [menuExists, taskExists] = await Promise.all([
        Menu.exists({ hotelName: currentHotel.name }),
        KitchenTask.exists({ hotelName: currentHotel.name }),
      ]);
      if (menuExists || taskExists) {
        return res.status(409).json({ error: "This hotel is used by a menu or kitchen task; its name cannot be changed." });
      }
    }
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.value },
      { new: true, runValidators: true },
    ).lean();
    if (!hotel) return res.status(404).json({ error: "Hotel not found." });
    return res.json({ hotel: serializeHotel(hotel) });
  } catch (error) {
    if (error && error.code === 11000) return res.status(409).json({ error: "A hotel with this name already exists." });
    console.error("Admin hotel update failed:", error);
    return res.status(500).json({ error: "Unable to update this hotel right now." });
  }
});

router.delete("/hotels/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Choose a valid hotel." });
  try {
    const hotel = await Hotel.findById(req.params.id).lean();
    if (!hotel) return res.status(404).json({ error: "Hotel not found." });
    const [menuExists, taskExists] = await Promise.all([
      Menu.exists({ hotelName: hotel.name }),
      KitchenTask.exists({ hotelName: hotel.name }),
    ]);
    if (menuExists || taskExists) {
      return res.status(409).json({ error: "This hotel is used by a menu or kitchen task and cannot be deleted." });
    }
    await Hotel.findByIdAndDelete(req.params.id);
    return res.json({ message: "Hotel deleted." });
  } catch (error) {
    console.error("Admin hotel deletion failed:", error);
    return res.status(500).json({ error: "Unable to delete this hotel right now." });
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
    const hotel = await Hotel.exists({ name: parsed.value.hotelName });
    if (!hotel) return res.status(400).json({ error: "Choose a hotel from Hotel management first." });
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
    const hotel = await Hotel.exists({ name: parsed.value.hotelName });
    if (!hotel) return res.status(400).json({ error: "Choose a hotel from Hotel management first." });
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

registerCatalogRoutes("foods", Food, "foods", "meals.foods.foodId");
registerCatalogRoutes("ingredients", Ingredient, "ingredients", "meals.ingredients.ingredientId");

module.exports = router;
