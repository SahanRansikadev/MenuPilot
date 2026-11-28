const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    hotelName: { type: String, required: true, trim: true, maxlength: 100 },
    name: { type: String, trim: true, maxlength: 100, default: "" },
    recipeNames: { type: [{ type: String, trim: true, maxlength: 100 }], default: [] },
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"],
      required: true,
    },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    ingredients: { type: [{ type: String, trim: true, maxlength: 100 }], default: [] },
    instructions: { type: String, trim: true, maxlength: 5000, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

menuSchema.index({ hotelName: 1, mealType: 1, name: 1 });

module.exports = mongoose.models.Menu || mongoose.model("Menu", menuSchema);
