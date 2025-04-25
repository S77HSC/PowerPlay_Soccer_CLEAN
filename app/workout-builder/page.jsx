"use client";

import { useState, useEffect, useRef } from "react";

const availableSkills = [
  {
    key: "session_1_toetaps",
    title: "Toe Taps",
    duration: 10,
    thumbnail: "/videos/session_1_toetaps-thumbnail.jpg"
  },
  {
    key: "session_2_ticktocks",
    title: "Tick Tocks",
    duration: 12,
    thumbnail: "/videos/session_2_ticktocks-thumbnail.jpg"
  },
  {
    key: "session_3_ticktockstops",
    title: "Tick Tock Stops",
    duration: 14,
    thumbnail: "/videos/session_3_ticktockstops-thumbnail.jpg"
  }
];

export default function WorkoutBuilder() {
  const [workout, setWorkout] = useState([]);
  const [savedWorkoutDate, setSavedWorkoutDate] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const lastSaved = localStorage.getItem("lastWorkoutSaved");
    const savedWorkout = localStorage.getItem("savedWorkout");
    if (savedWorkout) setWorkout(JSON.parse(savedWorkout));
    if (lastSaved) {
      const savedDate = new Date(lastSaved);
      setSavedWorkoutDate(savedDate);
      const now = new Date();
      if (now.getMonth() === savedDate.getMonth() && now.getFullYear() === savedDate.getFullYear()) {
        setLimitReached(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isRunning && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
        setTotalTimeElapsed(prev => prev + 1);
      }, 1000);
    } else if (isRunning && countdown === 0) {
      clearInterval(intervalRef.current);
      const nextIndex = currentSkillIndex + 1;
      if (nextIndex < workout.length) {
        const audio = new Audio("/next-drill.mp3");
        audio.play().catch(() => {});
        setCurrentSkillIndex(nextIndex);
        setCountdown(workout[nextIndex].duration);
      } else {
        setIsRunning(false);
        setCurrentSkillIndex(0);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [countdown, isRunning]);

  const startWorkout = () => {
    if (workout.length > 0) {
      setCurrentSkillIndex(0);
      setCountdown(workout[0].duration);
      setIsRunning(true);
      setTotalTimeElapsed(0);
    }
  };

  const stopWorkout = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const resetWorkout = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setCurrentSkillIndex(0);
    setCountdown(0);
    setTotalTimeElapsed(0);
  };

  const addToWorkout = (skill) => {
    if (!workout.find((item) => item.key === skill.key)) {
      const newWorkout = [...workout, { ...skill, reps: 1 }];
      setWorkout(newWorkout);
      localStorage.setItem("savedWorkout", JSON.stringify(newWorkout));
    }
  };

  const removeFromWorkout = (key) => {
    const updatedWorkout = workout.filter((s) => s.key !== key);
    setWorkout(updatedWorkout);
    localStorage.setItem("savedWorkout", JSON.stringify(updatedWorkout));
  };

  const autoGenerate = () => {
    if (limitReached) return;
    let totalTime = 0;
    let generated = [];
    for (let skill of availableSkills) {
      if (totalTime + skill.duration <= 10 * 60) {
        generated.push({ ...skill, reps: 1 });
        totalTime += skill.duration;
      }
    }
    setWorkout(generated);
    localStorage.setItem("savedWorkout", JSON.stringify(generated));
    localStorage.setItem("lastWorkoutSaved", new Date().toISOString());
    setLimitReached(true);
  };

  const shareWorkout = () => {
    const workoutText = workout.map(s => `${s.title} (${s.duration}s)`).join(" | ");
    const shareData = {
      title: "My Custom Workout",
      text: `Check out this soccer workout I built on PowerPlay: ${workoutText}`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      alert("Sharing not supported on this device. Copy and share manually!");
    }
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial", color: "#fff", backgroundColor: "#0A0F24" }}>
      <h2>Create Your Workout</h2>

      <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
        {availableSkills.map((skill) => (
          <div key={skill.key} style={{ background: "#1c1f2b", padding: "1rem", borderRadius: "10px", minWidth: "200px" }}>
            <img src={skill.thumbnail} alt={skill.title} style={{ width: "100%", borderRadius: "8px" }} />
            <h4>{skill.title}</h4>
            <button onClick={() => addToWorkout(skill)} style={{ marginTop: "0.5rem" }}>+ Add</button>
          </div>
        ))}
      </div>

      <h3>Your Workout</h3>
      {workout.length === 0 ? (
        <p>No skills added yet.</p>
      ) : (
        <ul>
          {workout.map((skill) => (
            <li key={skill.key}>
              {skill.title} - {skill.duration}s
              <button onClick={() => removeFromWorkout(skill.key)} style={{ marginLeft: "10px" }}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button 
          onClick={autoGenerate} 
          style={{ padding: "10px", backgroundColor: limitReached ? "#555" : "#00b4d8", color: "white", border: "none", borderRadius: "6px" }}
          disabled={limitReached}
        >
          {limitReached ? "Monthly Limit Reached (Upgrade for more)" : "Auto Generate 10-Min Workout"}
        </button>

        <button 
          onClick={shareWorkout} 
          style={{ padding: "10px", backgroundColor: "#38bdf8", color: "white", border: "none", borderRadius: "6px" }}
        >
          Share
        </button>

        <button 
          onClick={startWorkout} 
          style={{ padding: "10px", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "6px" }}
        >
          Start
        </button>
        <button 
          onClick={stopWorkout} 
          style={{ padding: "10px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px" }}
        >
          Stop
        </button>
        <button 
          onClick={resetWorkout} 
          style={{ padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px" }}
        >
          Reset
        </button>
      </div>

      {isRunning && workout[currentSkillIndex] && (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <h3 style={{ color: "#38bdf8" }}>Now: {workout[currentSkillIndex].title}</h3>
          <h1 style={{ fontSize: "4rem", margin: 0 }}>{countdown}s</h1>
          {currentSkillIndex + 1 < workout.length && (
            <p style={{ marginTop: "0.5rem", color: "#ccc" }}>Up next: {workout[currentSkillIndex + 1].title}</p>
          )}
          <p style={{ marginTop: "1rem", color: "#999" }}>Total Time: {totalTimeElapsed}s</p>
        </div>
      )}
    </div>
  );
}
