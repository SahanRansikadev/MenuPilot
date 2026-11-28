const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");

const router = express.Router();
router.use(requireAuth);

function serializeFeedback(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    feedback: user.feedback || "",
    reply: user.feedbackReply || "",
    liked: Boolean(user.feedbackLiked),
    updatedAt: user.updatedAt,
  };
}

router.get("/", requireRole("admin", "kitchenTeam"), async (_req, res) => {
  try {
    const guests = await User.find({ role: "guest", feedback: { $nin: ["", null] } })
      .select("name email feedback feedbackReply feedbackLiked updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ feedback: guests.map(serializeFeedback) });
  } catch (error) {
    console.error("Guest feedback lookup failed:", error);
    return res.status(500).json({ error: "Unable to load guest feedback right now." });
  }
});

router.patch("/:userId/reply", requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ error: "Choose a valid guest." });
  }
  if (!req.body || typeof req.body.reply !== "string" || req.body.reply.trim().length > 1000) {
    return res.status(400).json({ error: "Reply must be 1,000 characters or fewer." });
  }

  try {
    const guest = await User.findOneAndUpdate(
      { _id: req.params.userId, role: "guest", feedback: { $nin: ["", null] } },
      { $set: { feedbackReply: req.body.reply.trim() } },
      { new: true, runValidators: true },
    )
      .select("name email feedback feedbackReply feedbackLiked updatedAt")
      .lean();
    if (!guest) return res.status(404).json({ error: "Guest feedback not found." });
    return res.json({ feedback: serializeFeedback(guest) });
  } catch (error) {
    console.error("Guest feedback reply failed:", error);
    return res.status(500).json({ error: "Unable to save this reply right now." });
  }
});

router.patch("/:userId/like", requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ error: "Choose a valid guest." });
  }
  if (!req.body || typeof req.body.liked !== "boolean") {
    return res.status(400).json({ error: "Choose whether to like this feedback." });
  }

  try {
    const guest = await User.findOneAndUpdate(
      { _id: req.params.userId, role: "guest", feedback: { $nin: ["", null] } },
      { $set: { feedbackLiked: req.body.liked } },
      { new: true, runValidators: true },
    )
      .select("name email feedback feedbackReply feedbackLiked updatedAt")
      .lean();
    if (!guest) return res.status(404).json({ error: "Guest feedback not found." });
    return res.json({ feedback: serializeFeedback(guest) });
  } catch (error) {
    console.error("Guest feedback like update failed:", error);
    return res.status(500).json({ error: "Unable to update this feedback right now." });
  }
});

module.exports = router;
