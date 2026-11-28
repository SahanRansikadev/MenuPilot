const mongoose = require("mongoose");

const kitchenTaskSchema = new mongoose.Schema(
  {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    hotelName: { type: String, required: true, trim: true, maxlength: 100 },
    recipeName: { type: String, required: true, trim: true, maxlength: 100 },
    mealType: { type: String, required: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    ingredients: { type: [{ type: String, trim: true, maxlength: 100 }], default: [] },
    instructions: { type: String, required: true, trim: true, maxlength: 5000 },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      enum: ["sent", "accepted", "preparing", "ready", "cancelled"],
      default: "sent",
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

kitchenTaskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.KitchenTask || mongoose.model("KitchenTask", kitchenTaskSchema);
