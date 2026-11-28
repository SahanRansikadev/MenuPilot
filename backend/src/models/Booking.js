const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"],
      required: true,
    },
    name: { type: String, trim: true, maxlength: 100 },
    time: { type: String, required: true },
    foods: [
      {
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        name: { type: String, required: true, trim: true, maxlength: 100 },
      },
    ],
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    childrenCount: { type: Number, required: true, min: 0 },
    driverCount: { type: Number, required: true, min: 0, default: 0 },
    guideCount: { type: Number, required: true, min: 0, default: 0 },
    meals: { type: [mealSchema], required: true, validate: [(meals) => meals.length > 0, "Select at least one meal."] },
    isVegetarian: { type: Boolean, required: true },
    hasAllergies: { type: Boolean, required: true },
    allergyCount: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
