const express = require("express");
const fs = require("fs");
const path = require("path");
const Exercise = require("../models/Exercise");
const requireAuth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
router.use(requireAuth);

function parseBody(body) {
  return {
    name: (body.name || "").trim(),
    sets: body.sets ? Number(body.sets) : null,
    reps: body.reps ? Number(body.reps) : null,
    duration: Math.max(5, Number(body.duration) || 30),
    imageUrl: body.imageUrl || "",
  };
}

router.get("/", async (req, res) => {
  const exercises = await Exercise.find({ user: req.userId }).sort({ createdAt: 1 });
  res.json({ exercises });
});

// multipart/form-data: fields name, sets, reps, duration, imageUrl (optional), file field "image" (optional)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const data = parseBody(req.body);
    if (!data.name) return res.status(400).json({ error: "name is required" });

    let image = data.imageUrl;
    if (req.file) image = `/uploads/${req.file.filename}`;

    const exercise = await Exercise.create({ user: req.userId, ...data, image });
    res.status(201).json({ exercise });
  } catch (err) {
    res.status(500).json({ error: "Failed to create exercise", detail: err.message });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ _id: req.params.id, user: req.userId });
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });

    const data = parseBody(req.body);
    exercise.name = data.name || exercise.name;
    exercise.sets = data.sets;
    exercise.reps = data.reps;
    exercise.duration = data.duration;

    if (req.file) {
      // remove old local file if it was one we stored
      if (exercise.image && exercise.image.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", exercise.image);
        fs.unlink(oldPath, () => {});
      }
      exercise.image = `/uploads/${req.file.filename}`;
    } else if (data.imageUrl) {
      exercise.image = data.imageUrl;
    }

    await exercise.save();
    res.json({ exercise });
  } catch (err) {
    res.status(500).json({ error: "Failed to update exercise", detail: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const exercise = await Exercise.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });
  if (exercise.image && exercise.image.startsWith("/uploads/")) {
    const oldPath = path.join(__dirname, "..", exercise.image);
    fs.unlink(oldPath, () => {});
  }
  res.json({ success: true });
});

module.exports = router;
