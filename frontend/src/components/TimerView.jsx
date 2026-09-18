import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Play, Pause, RotateCcw, SkipForward, X, Dumbbell } from "lucide-react";
import { imageSrc, api } from "../api";

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function playBeep(freq = 880, duration = 0.12) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch (e) {
    /* ignore */
  }
}

// exercises: ordered array of exercise objects to run through (length 1 for a single exercise)
export default function TimerView({ exercises, mode, restSeconds, onClose }) {
  const [session, setSession] = useState(() => ({
    index: 0,
    phase: "work",
    remaining: exercises[0].duration,
    running: true,
    finished: false,
    elapsedWork: 0, // total work seconds actually completed, for logging
  }));
  const intervalRef = useRef(null);
  const loggedRef = useRef(false);

  function advancePhase(prev) {
    const hasNext = prev.index + 1 < exercises.length;
    const justFinishedWork = prev.phase === "work" ? exercises[prev.index].duration : 0;
    const elapsedWork = prev.elapsedWork + justFinishedWork;

    if (prev.phase === "work") {
      if (mode === "circuit" && hasNext && restSeconds > 0) {
        playBeep(660, 0.15);
        return { ...prev, phase: "rest", remaining: restSeconds, elapsedWork };
      }
      if (mode === "circuit" && hasNext) {
        playBeep(660, 0.15);
        return {
          ...prev,
          index: prev.index + 1,
          phase: "work",
          remaining: exercises[prev.index + 1].duration,
          elapsedWork,
        };
      }
      playBeep(990, 0.25);
      return { ...prev, running: false, remaining: 0, finished: true, elapsedWork };
    }
    // rest -> next work
    playBeep(880, 0.15);
    return {
      ...prev,
      index: prev.index + 1,
      phase: "work",
      remaining: exercises[prev.index + 1].duration,
      elapsedWork,
    };
  }

  useEffect(() => {
    if (!session.running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSession((prev) => {
        if (!prev.running) return prev;
        if (prev.remaining <= 1) return advancePhase(prev);
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.running, session.index, session.phase]);

  // log completion once, when finished
  useEffect(() => {
    if (session.finished && !loggedRef.current) {
      loggedRef.current = true;
      const durationSeconds = Math.max(1, Math.round(session.elapsedWork));
      api
        .recordLog({
          durationSeconds,
          type: mode,
          exerciseName: mode === "single" ? exercises[0].name : "",
        })
        .catch(() => {});
    }
  }, [session.finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePause() {
    setSession((prev) => ({ ...prev, running: !prev.running }));
  }
  function adjustTime(delta) {
    setSession((prev) => ({ ...prev, remaining: Math.max(0, prev.remaining + delta) }));
  }
  function skipPhase() {
    setSession((prev) => advancePhase(prev));
  }
  function restartPhase() {
    setSession((prev) => ({
      ...prev,
      remaining: prev.phase === "rest" ? restSeconds : exercises[prev.index].duration,
    }));
  }

  const currentEx = exercises[session.index];

  return (
    <div className="cb-timer">
      <div className="cb-timer-top">
        <button className="cb-back" onClick={onClose}>
          <ChevronLeft size={16} /> Back
        </button>
        {mode === "circuit" && (
          <div className="cb-progress-label">
            MOVE {session.index + 1} OF {exercises.length}
          </div>
        )}
      </div>

      {mode === "circuit" && (
        <div className="cb-dots">
          {exercises.map((ex, i) => (
            <div
              key={ex._id || i}
              className={"cb-dot " + (i < session.index ? "done" : i === session.index ? "current" : "")}
            />
          ))}
        </div>
      )}

      {session.phase === "work" && (
        <div className="cb-timer-img">
          {currentEx.image ? <img src={imageSrc(currentEx.image)} alt="" /> : <Dumbbell size={40} color="#a49d8a" />}
        </div>
      )}

      {session.finished ? (
        <>
          <div className="cb-timer-name">{mode === "circuit" ? "Circuit complete" : "Nice work"}</div>
          <div className="cb-phase-label done">DONE</div>
          <div className="cb-digits done">{formatTime(0)}</div>
        </>
      ) : (
        <>
          {session.phase === "work" && (
            <>
              <div className="cb-timer-name">{currentEx.name}</div>
              {(currentEx.sets || currentEx.reps) && (
                <div className="cb-timer-meta">
                  {currentEx.sets ? `${currentEx.sets} sets × ` : ""}
                  {currentEx.reps ? `${currentEx.reps} reps` : ""}
                </div>
              )}
            </>
          )}
          {session.phase === "rest" && <div className="cb-timer-name">Rest</div>}
          <div className={"cb-phase-label " + session.phase}>{session.phase === "work" ? "WORK" : "REST"}</div>
          <div className={"cb-digits " + session.phase}>{formatTime(session.remaining)}</div>
        </>
      )}

      {!session.finished && (
        <div className="cb-controls">
          <button className="cb-adjust" onClick={() => adjustTime(-10)}>
            −10s
          </button>
          <button className="cb-play" onClick={togglePause} aria-label={session.running ? "Pause" : "Play"}>
            {session.running ? <Pause size={24} fill="var(--panel)" /> : <Play size={24} fill="var(--panel)" />}
          </button>
          <button className="cb-adjust" onClick={() => adjustTime(10)}>
            +10s
          </button>
        </div>
      )}

      <div className="cb-secondary-controls">
        {!session.finished && (
          <button className="cb-text-btn" onClick={restartPhase}>
            <RotateCcw size={14} /> Restart
          </button>
        )}
        {!session.finished && (
          <button className="cb-text-btn" onClick={skipPhase}>
            <SkipForward size={14} /> Skip
          </button>
        )}
        {session.finished && (
          <button className="cb-text-btn" onClick={onClose}>
            <X size={14} /> Close
          </button>
        )}
      </div>
    </div>
  );
}
