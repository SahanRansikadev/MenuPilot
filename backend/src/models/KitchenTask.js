const mongoose = require("mongoose");

const supplyItemSchema = new mongoose.Schema(
  {
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    quantity: { type: Number, required: true, min: 0.001, max: 1000000 },
    unit: { type: String, required: true, trim: true, maxlength: 20 },
    received: { type: Boolean, default: false },
  },
  { _id: true },
);

const kitchenTaskSchema = new mongoose.Schema(
  {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", default: null },
    mealIndex: { type: Number, min: 0, default: null },
    hotelName: { type: String, required: true, trim: true, maxlength: 100 },
    recipeName: { type: String, required: true, trim: true, maxlength: 100 },
    mealType: { type: String, required: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    ingredients: { type: [{ type: String, trim: true, maxlength: 100 }], default: [] },
    supplies: { type: [supplyItemSchema], default: [] },
    foods: { type: [{ name: { type: String, required: true, maxlength: 100 } }], default: [] },
    desserts: { type: [{ name: { type: String, required: true, maxlength: 100 } }], default: [] },
    guestIngredients: { type: [{ name: { type: String, required: true, maxlength: 100 } }], default: [] },
    isVegetarian: { type: Boolean, default: false },
    hasAllergies: { type: Boolean, default: false },
    allergyCount: { type: Number, min: 0, default: 0 },
    instructions: { type: String, trim: true, maxlength: 5000, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    costingStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "confirmed", "cancelled"],
      default: "not_submitted",
      index: true,
    },
    actualTotalPrice: { type: Number, min: 0, max: 100000000, default: null },
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
