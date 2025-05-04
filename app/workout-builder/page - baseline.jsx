// Refactored version of WorkoutBuilder using Tailwind CSS for mobile responsiveness
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { sessionData } from "../../lib/sessionData";
import MotionTip from "../../components/MotionTip";

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
  const [motionDetected, setMotionDetected] = useState(false);
  const [motionTimestamps, setMotionTimestamps] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showXpModal, setShowXpModal] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [justChangedSkill, setJustChangedSkill] = useState(false);
  const raceStartBeeps = useRef(null);
    const whistleStart = useRef(null);
  const whistleStop = useRef(null);
  const [showMotionWarnings, setShowMotionWarnings] = useState(true);

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

  useEffect(() => {
    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};
      if (x === null || y === null || z === null) return;
      const movementMagnitude = Math.sqrt(x * x + y * y + z * z);
      if (movementMagnitude > 1.2) {
        const now = Date.now();
        setMotionTimestamps((prev) => [...prev.filter(ts => now - ts < 5000), now]);
      }
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  useEffect(() => {
    if (!isRunning || mode !== "work") return;
    const interval = setInterval(() => {
      const now = Date.now();
      const recent = motionTimestamps.filter((ts) => now - ts < 3000);
      setMotionDetected(recent.length > 0);
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, mode, motionTimestamps]);

  const [current, setCurrent] = useState(null);

  useEffect(() => {
    setCurrent(workout[currentIndex] || null);
  }, [currentIndex, workout]);

  

  useEffect(() => {
    if (!videoRef.current || !current) return;

    videoRef.current.load();

    if (protocolPhase === "work" && !isPaused && isRunning) {
      videoRef.current.play().catch(() => {});
    }

    if (protocolPhase === "rest") {
      setCountdown(current.rest);
    } else if (protocolPhase === "work") {
      setCountdown(current.time);
    }
  }, [current, protocolPhase, isPaused, isRunning]);



  useEffect(() => {
    if (!isRunning || isPaused) return;
    if (countdown === 0 && protocolPhase === "countdown") {
        if (whistleStart.current) whistleStart.current.play();
    setProtocolPhase("work");
    setMode("work");
    setCountdown(current.time);
    return;
    }

    if (countdown === 0 && protocolPhase === "work") {
    if (whistleStop.current) whistleStop.current.play();
    if (currentRep < current.reps) {
      setProtocolPhase("rest");
      setMode("rest");
      setCountdown(current.rest);
    } else {
      if (currentIndex + 1 < workout.length) {
        setCurrentIndex((prev) => prev + 1);
        setJustChangedSkill(true);
      setProtocolPhase("rest");
      setMode("rest");
      setCountdown(current.rest);
      } else {
        setIsRunning(false);
        setShowXpModal(true);
        setTimeout(() => setShowXpModal(false), 5000);
        setXpEarned(workout.length * 10);
        const updateXP = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: player, error } = await supabase
    .from('players')
    .select('points')
    .eq('auth_id', user.id)
    .single();

  if (error) return console.error('Error fetching player:', error);

  const newXP = (player?.points || 0) + (workout.length * 10);

  const { error: updateError } = await supabase
    .from('players')
    .update({ points: newXP })
    .eq('auth_id', user.id);

  if (updateError) console.error('Error updating XP in players:', updateError);

  // Also insert workout_sessions entries
  const { data: playerMeta, error: idError } = await supabase
    .from('players')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (idError) return console.error('Failed to fetch player ID:', idError);

  const sessions = workout.map((w) => ({
    player_id: playerMeta.id,
    skill_name: w.key,
    reps: w.reps,
    work_time: w.time,
    rest_time: w.rest,
    xr_awarded: 10,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  }));

  const { error: sessionInsertError } = await supabase
    .from('workout_sessions')
    .insert(sessions);

  if (sessionInsertError) console.error('Error logging workout session:', sessionInsertError);
};
        updateXP();
      }
    }
    return;
    }

    if (countdown === 0 && protocolPhase === "rest") {
    if (whistleStart.current) whistleStart.current.play();

    if (justChangedSkill) {
      setCurrentRep(1);
      setJustChangedSkill(false);
      setProtocolPhase("work");
      setMode("work");
      setCountdown(current.time);
    } else if (currentRep < current.reps) {
      setCurrentRep(currentRep + 1);
      setProtocolPhase("work");
      setMode("work");
      setCountdown(current.time);
    } else {
      if (currentIndex + 1 < workout.length) {
        setCurrentIndex((prev) => prev + 1);
        setJustChangedSkill(true);
        setProtocolPhase("rest");
        setMode("rest");
        // countdown will be set by useEffect after current updates
        // Removed countdown set here to prevent premature access to outdated workout index
      } else {
        setIsRunning(false);
        setShowXpModal(true);
        setXpEarned(workout.length * 10);
      }
    }
    return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => {
        
        return c - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isRunning, isPaused, protocolPhase, current, currentRep, currentIndex, workout]);

  const generatePresetWorkout = (level) => {
    setSelectedLevel(level);
    const preset = {
      beginner: { reps: 2, time: 20, rest: 10 },
      intermediate: { reps: 3, time: 30, rest: 15 },
      advanced: { reps: 4, time: 40, rest: 20 },
    }[level];

    const unlocked = Object.entries(sessionData)
      .filter(([_, s]) => s.unlockXP <= 9999)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .map(([key, skill]) => ({ key, ...skill, ...preset }));

    setWorkout(unlocked);
    setSelected(unlocked.map((s) => s.key));
  };

  

  return (
    <div className="p-4 bg-slate-900 text-white min-h-screen">
      {showMotionWarnings && mode === "work" && isRunning && !motionDetected && (
        <div className="bg-yellow-500 text-black p-3 rounded-lg text-center mb-4">
          🕵️ We’re not detecting much movement. Keep your phone in your pocket or hand while training for best results!
          <button
            onClick={() => setShowMotionWarnings(false)}
            className="ml-4 underline text-blue-700 hover:text-blue-900"
          >
            Dismiss warning
          </button>
        </div>
      )}

      <div className="flex justify-center mb-4">
  <img src="/powerplay-logo.png" alt="PowerPlay Logo" className="h-20 w-auto" />
</div>

<h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">🏋️ Workout Builder</h2>

<div className="mb-6 flex justify-center">
  <div className="inline-flex rounded-full bg-slate-800 p-1 space-x-1">
    {["beginner", "intermediate", "advanced"].map((level) => (
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
      className={`p-4 rounded-lg w-full sm:w-[45%] md:w-[30%] ${
        selected.includes(key) ? "bg-blue-600" : "bg-slate-800"
      }`}
    >
      <h4 className="text-lg font-semibold">{s.title}</h4>
      <p className="text-sm text-slate-300">{s.description}</p>
      <button
        onClick={() =>
          setWorkout([...workout, { key, ...s, reps: 3, time: 30, rest: 15 }])
        }
        className="btn bg-teal-500 mt-2 rounded-xl px-5 py-2.5"
      >
        + Add
      </button>
    </div>
  ))}
</div>

{workout.length > 0 && (
  <div className="mb-8">
    <h3 className="text-2xl">📝 Workout Preview</h3>
    <p className="text-slate-400">
      Total time: {workout.reduce((sum, w) => sum + (w.time + w.rest) * w.reps, 0)}s
    </p>
    <ul className="list-none p-0 space-y-3">
      {workout.map((w, i) => (
        <li key={w.key} className="bg-slate-800 p-3 rounded">
          <strong>{i + 1}. {w.title}</strong><br />
          <span className="text-sm text-slate-300">
            Reps: {w.reps} | Time: {w.time}s | Rest: {w.rest}s
          </span>
        </li>
      ))}
    </ul>
  </div>
)}

<div className="flex flex-wrap gap-4 mb-8 justify-center">
  <button onClick={start} className="btn bg-green-500 rounded-xl px-5 py-2.5">▶ Start</button>
  <button onClick={stop} className="btn bg-red-500 rounded-xl px-5 py-2.5">⏹ Stop</button>
  {isRunning && !isPaused && (
    <button onClick={pause} className="btn bg-amber-500 rounded-xl px-5 py-2.5">⏸ Pause</button>
  )}
  {isPaused && (
    <button onClick={resume} className="btn bg-emerald-500 rounded-xl px-5 py-2.5">▶ Resume</button>
  )}
</div>

{current && (
  <div className="relative w-full flex flex-col items-center">
    <video
      ref={videoRef}
      loop={mode === "work"}
      controls
      muted
      playsInline
      poster={current.thumbnail}
      className="rounded-xl mb-4 w-full max-w-full h-auto"
    >
      <source src={current.video} type="video/mp4" />
    </video>

    {protocolPhase === "countdown" && workout[currentIndex - 1] && (
      <div className="absolute inset-0 flex items-center justify-center z-40">
        <div className="bg-black bg-opacity-70 text-white text-3xl px-6 py-4 rounded-xl shadow-lg animate-fade-in">
          Next Skill: {current.title}
        </div>
      </div>
    )}

    {(isPaused || protocolPhase === "countdown") && (
      <div className={`absolute inset-0 flex items-center justify-center text-white font-bold text-5xl z-10 ${
        isPaused ? "bg-black/60" : "bg-black/40"
      }`}>
        {isPaused ? "Paused" : (mode === "rest" ? "Rest" : countdown)}
      </div>
    )}

    <h4 className="text-xl mt-2">
  {protocolPhase === "countdown" && workout[currentIndex - 1] ? (
    <span className="text-yellow-300 animate-pulse">Next: {current.title} — Get Ready!</span>
  ) : protocolPhase === "countdown" ? (
    "Get Ready..."
  ) : mode === "work" ? (
    `Now: ${current.title} (Rep ${currentRep} of ${current.reps})`
  ) : (
    "Rest"
  )}
</h4>

    {countdown !== null && (
      <p className="text-3xl">{countdown}s</p>
    )}

    {workout[currentIndex + 1] && currentRep === current.reps && (
      <p className="text-slate-400">
        Next: {workout[currentIndex + 1]?.title}
      </p>
    )}
  </div>
)}    {showXpModal && (
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

      <audio ref={whistleStart} src="/sounds/whistle-start.mp3" preload="auto" />
      <audio ref={whistleStop} src="/sounds/whistle-stop.mp3" preload="auto" />
      
          
    </div>
  );
}
