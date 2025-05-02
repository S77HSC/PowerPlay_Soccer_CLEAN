"use client";

import { useState, useEffect, useRef } from "react";
import { sessionData } from "../../lib/sessionData";

export default function WorkoutBuilder() {
  const videoRef = useRef(null);
  const [selected, setSelected] = useState([]);
  const [workout, setWorkout] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState("work");
  const [protocolPhase, setProtocolPhase] = useState(null);
  const [currentRep, setCurrentRep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const presets = {
    beginner: { reps: 2, time: 20, rest: 10 },
    intermediate: { reps: 3, time: 30, rest: 15 },
    advanced: { reps: 4, time: 40, rest: 20 },
  };

  const addToWorkout = (key) => {
    if (selected.includes(key)) return;
    const skill = sessionData[key];
    const preset = presets["intermediate"];
    setSelected([...selected, key]);
    setWorkout([...workout, { key, ...skill, ...preset }]);
  };

  const generatePresetWorkout = (level) => {
    const preset = presets[level];
    const unlocked = Object.entries(sessionData)
      .filter(([_, s]) => s.unlockXP <= 9999)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .map(([key, skill]) => ({ key, ...skill, ...preset }));
    setWorkout(unlocked);
    setSelected(unlocked.map((s) => s.key));
  };

  const start = () => {
    if (!workout.length) return;
    setCurrentIndex(0);
    setCurrentRep(1);
    setMode("work");
    setProtocolPhase("countdown");
    setCountdown(3);
        if (videoRef.current) videoRef.current.play();
    setIsRunning(true);
    setIsPaused(false);
    if (videoRef.current) videoRef.current.play();
  };

  const stop = () => {
    setIsRunning(false);
    setCountdown(0);
    setCurrentIndex(0);
    setCurrentRep(1);
    setMode("work");
    setProtocolPhase(null);
    setIsPaused(false);
    setWorkout([]);
    setSelected([]);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const pause = () => {
    setIsPaused(true);
    setIsRunning(false);
    if (videoRef.current) videoRef.current.pause();
  };

  const resume = () => {
    setIsPaused(false);
    setIsRunning(true);
    if (videoRef.current) videoRef.current.play();
  };

  useEffect(() => {
    if (!isRunning || countdown <= 0) return;
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, countdown]);

  useEffect(() => {
    if (!videoRef.current || !current) return;
    if (protocolPhase === "countdown" && mode === "work") {
      videoRef.current.pause();
      videoRef.current.load();
    }
  }, [currentIndex, protocolPhase]);

useEffect(() => {
    if (!isRunning || countdown > 0) return;

    if (protocolPhase === "countdown") {
      setProtocolPhase(null);
      setCountdown(workout[currentIndex].time);
      if (videoRef.current) videoRef.current.play();
      return;
    }

    if (mode === "work") {
      setMode("rest");
      setCountdown(workout[currentIndex].rest);
      if (videoRef.current) videoRef.current.pause();
    } else if (mode === "rest") {
      if (currentRep < workout[currentIndex].reps) {
        setCurrentRep(currentRep + 1);
        setMode("work");
        setProtocolPhase("countdown");
        setCountdown(3);
          if (videoRef.current) videoRef.current.play();
        } else {
        const next = currentIndex + 1;
        if (next < workout.length) {
          setCurrentIndex(next);
          setCurrentRep(1);
          setMode("work");
          setProtocolPhase("countdown");
          setCountdown(3);
        } else {
          setIsRunning(false);
          alert("Workout complete!");
        }
      }
    }
  }, [countdown]);

  const totalTime = workout.reduce((sum, w) => sum + (w.time + w.rest) * w.reps, 0);
  const totalReps = workout.reduce((sum, w) => sum + w.reps, 0);
  const repsCompleted = workout.slice(0, currentIndex).reduce((sum, w) => sum + w.reps, 0) + (currentRep - 1);
  const progress = totalReps > 0 ? Math.min((repsCompleted / totalReps) * 100, 100) : 0;
  const current = workout[currentIndex];

  return (
    <div>
      <div style={{ padding: 32, background: "#0f172a", color: "white", minHeight: "100vh" }}>
        <h2 style={{ fontSize: 32, fontWeight: "bold", color: "#38bdf8", marginBottom: 24 }}>🏋️ Workout Builder</h2>

        {isRunning && totalReps > 0 && (
          <div style={{ background: '#1e293b', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                height: 10,
                backgroundColor: '#38bdf8',
                transition: 'width 0.3s ease-in-out',
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <button onClick={() => generatePresetWorkout("beginner")} style={buttonStyle("#38bdf8")}>Beginner</button>
          <button onClick={() => generatePresetWorkout("intermediate")} style={buttonStyle("#0ea5e9")}>Intermediate</button>
          <button onClick={() => generatePresetWorkout("advanced")} style={buttonStyle("#2563eb")}>Advanced</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          {Object.entries(sessionData).map(([key, s]) => (
            <div
              key={key}
              style={{ background: selected.includes(key) ? "#2563eb" : "#1e293b", padding: 16, borderRadius: 12, width: 240 }}
            >
              <h4>{s.title}</h4>
              <p style={{ fontSize: 14, color: "#cbd5e1" }}>{s.description}</p>
              <button onClick={() => addToWorkout(key)} style={buttonStyle("#14b8a6")}>+ Add</button>
            </div>
          ))}
        </div>

        {workout.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 24 }}>📝 Workout Preview</h3>
            <p style={{ color: "#94a3b8" }}>Total time: {totalTime}s</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {workout.map((w, i) => (
                <li key={w.key} style={{ background: "#1c1f2b", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <strong>{i + 1}. {w.title}</strong><br />
                  <span style={{ fontSize: 14, color: "#cbd5e1" }}>Reps: {w.reps} | Time: {w.time}s | Rest: {w.rest}s</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <button onClick={start} style={buttonStyle("#22c55e")}>▶ Start</button>
          <button onClick={stop} style={buttonStyle("#ef4444")}>⏹ Stop</button>
          {isRunning && !isPaused && <button onClick={pause} style={buttonStyle("#f59e0b")}>⏸ Pause</button>}
          {isPaused && <button onClick={resume} style={buttonStyle("#10b981")}>▶ Resume</button>}
        </div>

        {current && (
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              loop={mode === "work"}
              controls
              muted
              poster={current.thumbnail}
              style={{ borderRadius: "12px", marginBottom: "1rem", transition: "opacity 0.5s ease" }}
            >
              <source src={current.video} type="video/mp4" />
            </video>

            {(isPaused || protocolPhase === "countdown") && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: isPaused ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "64px",
                fontWeight: "bold",
                color: "#fff",
                zIndex: 10,
              }}>
                {isPaused ? "Paused" : (mode === "rest" ? "Rest" : countdown)}
              </div>
            )}

            <h4 style={{ fontSize: 20, marginTop: 8 }}>
              {protocolPhase === "countdown"
                ? "Get Ready..."
                : mode === "work"
                ? `Now: ${current.title} (Rep ${currentRep} of ${current.reps})`
                : "Rest"}
            </h4>
            <p style={{ fontSize: 32 }}>{countdown}s</p>
            {workout[currentIndex + 1] && currentRep === current.reps && (
              <p style={{ color: "#94a3b8" }}>Next: {workout[currentIndex + 1].title}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = (bg, color = "#fff") => ({
  backgroundColor: bg,
  color,
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer"
});
