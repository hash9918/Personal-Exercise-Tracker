const express = require("express");
const WorkoutLog = require("../models/WorkoutLog");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreaks(sortedDates) {
  // sortedDates: unique 'YYYY-MM-DD' strings, ascending
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = Math.round(
      (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000
    );
    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const dateSet = new Set(sortedDates);
  const today = todayStr();
  let cursor = new Date();
  if (!dateSet.has(today)) cursor.setDate(cursor.getDate() - 1);

  let current = 0;
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}

// Record a completed exercise or full circuit
router.post("/", async (req, res) => {
  try {
    const { durationSeconds, type, exerciseName } = req.body;
    if (!durationSeconds || durationSeconds <= 0) {
      return res.status(400).json({ error: "durationSeconds must be a positive number" });
    }
    const log = await WorkoutLog.create({
      user: req.userId,
      date: todayStr(),
      type: type === "circuit" ? "circuit" : "single",
      exerciseName: exerciseName || "",
      durationSeconds,
    });
    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ error: "Failed to record log", detail: err.message });
  }
});

// Stats: current streak, longest streak, total duration, sessions, and last 84 days for a calendar view
router.get("/stats", async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ user: req.userId }).sort({ date: 1 });

    const uniqueDates = [...new Set(logs.map((l) => l.date))];
    const { current, longest } = computeStreaks(uniqueDates);

    const totalDurationSeconds = logs.reduce((sum, l) => sum + l.durationSeconds, 0);
    const totalSessions = logs.length;

    const byDate = {};
    for (const l of logs) {
      byDate[l.date] = (byDate[l.date] || 0) + l.durationSeconds;
    }

    // last 84 days (12 weeks) including today, oldest first
    const days = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - 83);
    for (let i = 0; i < 84; i++) {
      const key = cursor.toISOString().slice(0, 10);
      days.push({ date: key, durationSeconds: byDate[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      currentStreak: current,
      longestStreak: longest,
      totalDurationSeconds,
      totalSessions,
      days,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute stats", detail: err.message });
  }
});

module.exports = router;
