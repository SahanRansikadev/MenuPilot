const express = require("express");
const mongoose = require("mongoose");
const KitchenTask = require("../models/KitchenTask");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");

const router = express.Router();
const nextStatuses = {
  sent: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: [],
  cancelled: [],
};

router.use(requireAuth, requireRole("kitchenTeam"));

function serializeTask(task) {
  const booking = task.bookingId && task.bookingId.date ? task.bookingId : null;
  return {
    id: task._id.toString(),
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
    supplies: (task.supplies || []).map((supply) => ({
      id: supply._id.toString(),
      name: supply.name,
      quantity: supply.quantity,
      unit: supply.unit,
      received: Boolean(supply.received),
    })),
    foods: task.foods || [],
    desserts: task.desserts || [],
    guestIngredients: task.guestIngredients || [],
    isVegetarian: Boolean(task.isVegetarian),
    hasAllergies: Boolean(task.hasAllergies),
    allergyCount: task.allergyCount || 0,
    costingStatus: task.costingStatus || "not_submitted",
    actualTotalPrice: task.actualTotalPrice,
    mealIndex: task.mealIndex,
    instructions: task.instructions,
    notes: task.notes || "",
    status: task.status,
    createdAt: task.createdAt,
  };
}

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await KitchenTask.find({ assignedTo: req.userId })
      .populate({ path: "bookingId", select: "date guestCount hotelName" })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return res.json({ tasks: tasks.map(serializeTask) });
  } catch (error) {
    console.error("Kitchen task lookup failed:", error);
    return res.status(500).json({ error: "Unable to load your kitchen tasks right now." });
  }
});

router.patch("/tasks/:id/status", async (req, res) => {
  const { status } = req.body || {};
  if (!mongoose.isValidObjectId(req.params.id) || !Object.values(nextStatuses).flat().includes(status)) {
    return res.status(400).json({ error: "Choose a valid task status." });
  }

  try {
    const task = await KitchenTask.findOne({ _id: req.params.id, assignedTo: req.userId });
    if (!task) return res.status(404).json({ error: "Kitchen task not found." });
    if (!nextStatuses[task.status]?.includes(status)) {
      return res.status(409).json({ error: `A task in ${task.status} status cannot move to ${status}.` });
    }
    if (
      status === "ready" &&
      task.mealIndex !== null &&
      task.mealIndex !== undefined &&
      !["submitted", "confirmed"].includes(task.costingStatus)
    ) {
      return res.status(409).json({ error: "Submit the supply checklist and actual total before marking this meal ready." });
    }

    task.status = status;
    await task.save();
    return res.json({ task: { id: task._id.toString(), status: task.status } });
  } catch (error) {
    console.error("Kitchen task update failed:", error);
    return res.status(500).json({ error: "Unable to update this kitchen task right now." });
  }
});

router.patch("/tasks/:id/supply", async (req, res) => {
  const { supplies, actualTotalPrice } = req.body || {};
  if (
    !mongoose.isValidObjectId(req.params.id) ||
    !Array.isArray(supplies) ||
    !Number.isFinite(actualTotalPrice) ||
    actualTotalPrice < 0 ||
    actualTotalPrice > 100000000
  ) {
    return res.status(400).json({ error: "Provide a valid supply checklist and actual total." });
  }
  const receivedById = new Map();
  for (const item of supplies) {
    if (!item || typeof item.id !== "string" || !mongoose.isValidObjectId(item.id) || typeof item.received !== "boolean") {
      return res.status(400).json({ error: "Mark each requested ingredient as received or missing." });
    }
    if (receivedById.has(item.id)) return res.status(400).json({ error: "The supply checklist contains duplicate items." });
    receivedById.set(item.id, item.received);
  }

  try {
    const task = await KitchenTask.findOne({ _id: req.params.id, assignedTo: req.userId });
    if (!task) return res.status(404).json({ error: "Kitchen task not found." });
    if (task.status === "cancelled" || task.status === "ready") {
      return res.status(409).json({ error: "This kitchen task can no longer be updated." });
    }
    if (task.costingStatus === "confirmed") {
      return res.status(409).json({ error: "The admin has already confirmed this kitchen cost." });
    }
    if (receivedById.size !== task.supplies.length || task.supplies.some((item) => !receivedById.has(item._id.toString()))) {
      return res.status(400).json({ error: "The checklist must include every requested ingredient exactly once." });
    }
    task.supplies.forEach((item) => {
      item.received = receivedById.get(item._id.toString());
    });
    task.actualTotalPrice = actualTotalPrice;
    task.costingStatus = "submitted";
    await task.save();
    return res.json({
      task: {
        id: task._id.toString(),
        costingStatus: task.costingStatus,
        actualTotalPrice: task.actualTotalPrice,
      },
    });
  } catch (error) {
    console.error("Kitchen supply update failed:", error);
    return res.status(500).json({ error: "Unable to submit this supply checklist right now." });
  }
});

module.exports = router;
