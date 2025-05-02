// Refactored version of WorkoutBuilder using Tailwind CSS for mobile responsiveness
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
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

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showXpModal, setShowXpModal] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

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
    setSelectedLevel(level);
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

  const logWorkoutSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: player } = await supabase.from("players").select("*").eq("auth_id", user.id).single();
      if (!player) return;

      const sessionInserts = workout.map((w) => {
        const xr_awarded = w.reps * (w.time + w.rest);
        return {
          player_id: player.id,
          completed_at: new Date().toISOString(),
          xr_awarded,
          reps: w.reps,
          work_time: w.time,
          rest_time: w.rest,
          skill_name: w.key,
        };
      });

      const { error: insertError } = await supabase.from("workout_sessions").insert(sessionInserts);
      if (insertError) console.error("Session insert error:", insertError);

      const totalXp = sessionInserts.reduce((sum, s) => sum + s.xr_awarded, 0);
      const { error: updateError } = await supabase.from("players").update({ points: (player.points || 0) + totalXp }).eq("id", player.id);
      if (updateError) console.error("XP update error:", updateError);

      setXpEarned(totalXp);
      setShowXpModal(true);
      setTimeout(() => setShowXpModal(false), 4000);
    } catch (err) {
      console.error("Failed to log session:", err);
      alert("Workout complete, but XP could not be recorded.");
    }
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
          logWorkoutSession();
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
    <>
      {showXpModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-slate-800 px-6 py-4 rounded-xl shadow-xl text-center animate-bounce">
          <h3 className="text-xl font-bold text-sky-400 mb-2">🎉 Workout Complete!</h3>
          <p className="text-lg font-semibold mb-2">You earned <span className="text-green-400">{xpEarned} XP</span>!</p>
            <div className="h-3 w-64 bg-slate-700 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-400 animate-[grow_4s_linear]" style={{ width: '100%' }}></div>
            </div>
        </div>
        </div>
      )}

      <div className="p-4 bg-slate-900 text-white min-h-screen">
      <div className="flex justify-center mb-4">
        <img src="/powerplay-logo.png" alt="PowerPlay Logo" className="h-20 w-auto" />
      </div>

      <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">🏋️ Workout Builder</h2>

      {isRunning && totalReps > 0 && (
        <div className="bg-slate-800 rounded mb-4 overflow-hidden">
          <div className="h-2 bg-sky-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-full bg-slate-800 p-1 space-x-1">
          {Object.keys(presets).map((level) => (
            <button
              key={level}
              onClick={() => generatePresetWorkout(level)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                selectedLevel === level ? "bg-sky-500 text-white" : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        {Object.entries(sessionData).map(([key, s]) => (
          <div
            key={key}
            className={`p-4 rounded-lg w-full sm:w-[45%] md:w-[30%] ${selected.includes(key) ? "bg-blue-600" : "bg-slate-800"}`}
          >
            <h4 className="text-lg font-semibold">{s.title}</h4>
            <p className="text-sm text-slate-300">{s.description}</p>
            <button onClick={() => addToWorkout(key)} className="btn bg-teal-500 mt-2 rounded-xl px-5 py-2.5">+ Add</button>
          </div>
        ))}
      </div>

      {workout.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl">📝 Workout Preview</h3>
          <p className="text-slate-400">Total time: {totalTime}s</p>
          <ul className="list-none p-0 space-y-3">
            {workout.map((w, i) => (
              <li key={w.key} className="bg-slate-800 p-3 rounded">
                <strong>{i + 1}. {w.title}</strong><br />
                <span className="text-sm text-slate-300">Reps: {w.reps} | Time: {w.time}s | Rest: {w.rest}s</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <button onClick={start} className="btn bg-green-500 rounded-xl px-5 py-2.5">▶ Start</button>
        <button onClick={stop} className="btn bg-red-500 rounded-xl px-5 py-2.5">⏹ Stop</button>
        {isRunning && !isPaused && <button onClick={pause} className="btn bg-amber-500 rounded-xl px-5 py-2.5">⏸ Pause</button>}
        {isPaused && <button onClick={resume} className="btn bg-emerald-500 rounded-xl px-5 py-2.5">▶ Resume</button>}
      </div>

      {current && (
        <div className="relative w-full">
          <video
            ref={videoRef}
            loop={mode === "work"}
            controls
            muted
            poster={current.thumbnail}
            className="rounded-xl mb-4 w-full max-w-full h-auto"
          >
            <source src={current.video} type="video/mp4" />
          </video>

          {(isPaused || protocolPhase === "countdown") && (
            <div className={`absolute inset-0 flex items-center justify-center text-white font-bold text-5xl z-10 ${isPaused ? "bg-black/60" : "bg-black/40"}`}>
              {isPaused ? "Paused" : (mode === "rest" ? "Rest" : countdown)}
            </div>
          )}

          <h4 className="text-xl mt-2">
            {protocolPhase === "countdown"
              ? "Get Ready..."
              : mode === "work"
              ? `Now: ${current.title} (Rep ${currentRep} of ${current.reps})`
              : "Rest"}
          </h4>
          <p className="text-3xl">{countdown}s</p>
          {workout[currentIndex + 1] && currentRep === current.reps && (
            <p className="text-slate-400">Next: {workout[currentIndex + 1].title}</p>
          )}
        </div>
      )}
    </div>
  )
      </>
  );
}

const buttonStyle = (bg, color = "#fff") => ({});
const btn = "text-white px-5 py-3 rounded-lg font-semibold";
