import React, { useEffect, useState } from "react";
import { Flame, Trophy, Clock, Activity } from "lucide-react";
import { api } from "../api";

function formatDurationLong(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function levelFor(seconds) {
  if (seconds <= 0) return 0;
  if (seconds < 5 * 60) return 1;
  if (seconds < 15 * 60) return 2;
  if (seconds < 30 * 60) return 3;
  return 4;
}

export default function Streaks() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="cb-error">{error}</div>;
  if (!stats) return <div className="cb-loading">Loading…</div>;

  // group days into weeks (columns), 7 rows each, oldest first
  const weeks = [];
  for (let i = 0; i < stats.days.length; i += 7) {
    weeks.push(stats.days.slice(i, i + 7));
  }

  return (
    <>
      <div className="cb-stats-grid">
        <div className="cb-stat-card">
          <Flame size={22} color="var(--work)" />
          <div className="cb-stat-value">{stats.currentStreak}</div>
          <div className="cb-stat-label">Day streak</div>
        </div>
        <div className="cb-stat-card">
          <Trophy size={22} color="var(--brass-dark)" />
          <div className="cb-stat-value">{stats.longestStreak}</div>
          <div className="cb-stat-label">Longest streak</div>
        </div>
        <div className="cb-stat-card">
          <Clock size={22} color="var(--rest)" />
          <div className="cb-stat-value">{formatDurationLong(stats.totalDurationSeconds)}</div>
          <div className="cb-stat-label">Total time trained</div>
        </div>
        <div className="cb-stat-card">
          <Activity size={22} color="var(--ink)" />
          <div className="cb-stat-value">{stats.totalSessions}</div>
          <div className="cb-stat-label">Sessions logged</div>
        </div>
      </div>

      <div className="cb-heatmap-card">
        <div className="cb-form-title">Last 12 weeks</div>
        <div className="cb-heatmap">
          {weeks.map((week, wi) => (
            <div className="cb-heatmap-col" key={wi}>
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`cb-heatmap-cell level-${levelFor(day.durationSeconds)}`}
                  title={`${day.date} · ${formatDurationLong(day.durationSeconds)}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="cb-heatmap-legend">
          <span>Less</span>
          <div className="cb-heatmap-cell level-0" />
          <div className="cb-heatmap-cell level-1" />
          <div className="cb-heatmap-cell level-2" />
          <div className="cb-heatmap-cell level-3" />
          <div className="cb-heatmap-cell level-4" />
          <span>More</span>
        </div>
      </div>
    </>
  );
}
