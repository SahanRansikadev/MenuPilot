const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "kitchenTeam", "guest"], default: "guest", index: true },
    phone: { type: String, trim: true, maxlength: 16, default: "" },
    guestCount: { type: Number, min: 1, max: 1000, default: 1 },
    childrenCount: { type: Number, min: 0, max: 1000, default: 0 },
    countryCode: {
      type: String,
      uppercase: true,
      default: "",
      validate: (value) => !value || /^[A-Z]{2}$/.test(value),
    },
    feedback: { type: String, trim: true, maxlength: 1000, default: "" },
    feedbackReply: { type: String, trim: true, maxlength: 1000, default: "" },
    feedbackLiked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
