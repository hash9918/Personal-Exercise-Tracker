const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    sets: { type: Number, default: null },
    reps: { type: Number, default: null },
    duration: { type: Number, required: true, min: 5 }, // seconds
    image: { type: String, default: "" }, // "/uploads/xyz.jpg" or an external URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);
