const mongoose = require("mongoose");

const workoutLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD", server local date of completion
    type: { type: String, enum: ["single", "circuit"], default: "single" },
    exerciseName: { type: String, default: "" }, // set when type === 'single'
    durationSeconds: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutLog", workoutLogSchema);
