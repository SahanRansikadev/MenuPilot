const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    normalizedName: { type: String, required: true, unique: true, maxlength: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

ingredientSchema.index({ name: 1 });

module.exports = mongoose.models.Ingredient || mongoose.model("Ingredient", ingredientSchema);
