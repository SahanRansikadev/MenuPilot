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
    instructions: task.instructions,
    notes: task.notes || "",
    status: task.status,
    createdAt: task.createdAt,
  };
}

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await KitchenTask.find({ assignedTo: req.userId })
      .populate({ path: "bookingId", select: "date guestCount" })
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

    task.status = status;
    await task.save();
    return res.json({ task: { id: task._id.toString(), status: task.status } });
  } catch (error) {
    console.error("Kitchen task update failed:", error);
    return res.status(500).json({ error: "Unable to update this kitchen task right now." });
  }
});

module.exports = router;
