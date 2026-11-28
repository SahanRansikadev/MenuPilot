const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    normalizedName: { type: String, required: true, unique: true, maxlength: 100 },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    contactName: { type: String, trim: true, maxlength: 100, default: "" },
    phone: { type: String, trim: true, maxlength: 24, default: "" },
    email: { type: String, lowercase: true, trim: true, maxlength: 254, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

hotelSchema.index({ name: 1 });

module.exports = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);
