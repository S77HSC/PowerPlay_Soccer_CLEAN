'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { sessionData } from '../../lib/sessionData';
import confetti from 'canvas-confetti';
import axios from 'axios';

const WebcamDetection = dynamic(() => import('../../components/WebcamDetection'), { ssr: false });

export default function SkillPlayer() {
  const searchParams = useSearchParams();
  const sessionAKey = searchParams.get('sessionA');
  const sessionBKey = searchParams.get('sessionB');

  const sessionA = sessionData[sessionAKey];
  const sessionB = sessionData[sessionBKey];
  const sessions = [sessionA, sessionB].filter(Boolean);

  const [player, setPlayer] = useState(null);
  const [points, setPoints] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  const [touchesPerSkill, setTouchesPerSkill] = useState([0, 0]);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpModal, setShowXpModal] = useState(false);
  const [lastBackendTouchCount, setLastBackendTouchCount] = useState(0);
  const [baselineTouchCount, setBaselineTouchCount] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  const intervalRef = useRef(null);
  const XP_GOAL = 100;

  const reps = 3;
  const workTime = 20;
  const restTime = 20;
  const fixedXP = 25;

  const playAudio = (fileName) => {
    const audio = new Audio(`/sounds/${fileName}`);
    audio.play();
  };

  useEffect(() => {
    const loadPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('players').select('*').eq('auth_id', user.id).single();
      setPlayer(data);
      setPoints(data?.points || 0);
    };
    loadPlayer();
  }, []);

  useEffect(() => {
    if (!isRunning || isResting) return;
    const repVoices = [
      'VoicesAI_Sonic_Rep_one.mp3',
      'VoicesAI_Sonic_Rep_two.mp3',
      'VoicesAI_Sonic_Rep_three.mp3'
    ];
    if (currentRep < repVoices.length) {
      playAudio(repVoices[currentRep]);
    }
  }, [currentRep, isRunning, isResting]);

  useEffect(() => {
    if (isRunning && countdown > 0) {
      intervalRef.current = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      if (isRunning && countdown === 0) {
        if (isResting) {
          setTouchCount(0);
          resetBackendTouches();
          setCountdown(workTime);
          setIsResting(false);
        } else {
          if (currentRep + 1 >= reps) {
            if (currentSessionIndex + 1 >= sessions.length) {
              playAudio('VoicesAI_Sonic_session_completed.mp3');
              handleXpUpdate();
              setIsRunning(false);
              setCurrentSessionIndex(0);
              setCurrentRep(0);
            } else {
              setCurrentSessionIndex(prev => prev + 1);
              setCurrentRep(0);
              setCountdown(restTime);
              setIsResting(true);
              playAudio('VoicesAI_Sonic_next_skill.mp3');
              // Removed to avoid duplicate Rep 1
              // setTimeout(() => playAudio('VoicesAI_Sonic_Rep_one.mp3'), 1500);
            }
          } else {
            setCountdown(restTime);
            setIsResting(true);
            setCurrentRep(prev => prev + 1);
            playAudio('VoicesAI_Sonic_Take_a_break.mp3');
          }
        }
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, countdown]);

  const startTimer = () => {
    setCurrentRep(0);
    setCurrentSessionIndex(0);
    setIsResting(false);
    setTouchCount(0);
    resetBackendTouches();
    setCountdown(workTime);
    setIsRunning(true);
  };

  const resetBackendTouches = async () => {
    try {
      await axios.post('http://localhost:8000/reset-touches/');
      await new Promise(resolve => setTimeout(resolve, 500));
      const res = await axios.get("http://localhost:8000/touches/");
      const backendTouch = res.data.touches || 0;
      setTouchCount(0);
      setBaselineTouchCount(backendTouch);
      setLastBackendTouchCount(backendTouch);
    } catch (err) {
      console.warn('Backend not available — continuing without reset.');
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const pollTouches = setInterval(async () => {
      try {
        const res = await axios.get("http://localhost:8000/touches/");
        const newTouchCount = res.data.touches || 0;

        if (newTouchCount > lastBackendTouchCount) {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 300);
        }

        const relativeCount = newTouchCount - baselineTouchCount;
        setTouchCount(relativeCount);
        setTouchesPerSkill(prev => {
          const updated = [...prev];
          updated[currentSessionIndex] = relativeCount;
          return updated;
        });
        setLastBackendTouchCount(newTouchCount);
      } catch (err) {
        console.error("Failed to fetch touches:", err);
      }
    }, 500);

    return () => clearInterval(pollTouches);
  }, [isRunning, baselineTouchCount, lastBackendTouchCount]);

  const handleXpUpdate = async () => {
    if (!player || !sessionAKey || !sessionBKey) {
      console.warn('Missing required data for XP update');
      return;
    }

    const newPoints = points + fixedXP;
    setXpEarned(fixedXP);
    setShowXpModal(true);
    setTimeout(() => setShowXpModal(false), 4000);

    const now = new Date().toISOString();

    const rows = sessions.map((session, index) => ({
      player_id: player.id,
      completed_at: now,
      xr_awarded: Math.round(fixedXP / sessions.length),
      reps,
      work_time: workTime,
      rest_time: restTime,
      skill_name: index === 0 ? sessionAKey : sessionBKey,
      touches: touchesPerSkill[index] || 0
    }));

    try {
      const { error } = await supabase.from('workout_sessions').insert(rows);
      if (error) console.error("Supabase insert error:", error.message);
    } catch (err) {
      console.error("Unexpected insert failure:", err);
    }

    await supabase.from('players').update({ points: newPoints }).eq('id', player.id);
    setPoints(newPoints);

    if (Math.floor(newPoints / XP_GOAL) > Math.floor(points / XP_GOAL)) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const currentSession = sessions[currentSessionIndex];

  return (
    <main className="relative min-h-screen text-white px-4 py-6 font-sans bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19]">
      <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }} />
      <div className="relative z-10 max-w-6xl mx-auto space-y-8 px-4 md:px-8">
        <h2 className="text-center text-sky-400 font-bold text-xl">🏆 Skill Session Challenge</h2>

        {showXpModal && (
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 bg-slate-800 p-6 rounded-xl text-center z-50 shadow-lg">
            <h3 className="text-sky-400 font-bold mb-2 text-lg">🎉 XP Earned!</h3>
            <p className="text-2xl font-bold">{xpEarned} XP</p>
          </div>
        )}

        <div className="text-center mt-4 text-sm space-y-1">
          <p className="text-sky-300">XP: {points} / Level {Math.floor(points / XP_GOAL)}</p>
          <p className="text-green-400 font-extrabold text-4xl">Touches: {touchCount}</p>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-5xl font-extrabold">{countdown}s</h2>
          <p className="text-xl text-sky-400">{isResting ? 'Rest' : `Skill ${currentSessionIndex + 1}, Rep ${currentRep + 1}`}</p>

          <div className="flex justify-center gap-4 mt-2">
            <button onClick={startTimer} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded text-lg font-semibold">Start</button>
            {isRunning ? (
              <button onClick={() => setIsRunning(false)} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-1 rounded">Pause</button>
            ) : (
              <button onClick={() => setIsRunning(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded">Resume</button>
            )}
            <button onClick={() => { setIsRunning(false); setCountdown(0); setCurrentRep(0); setTouchCount(0); resetBackendTouches(); }} className="bg-red-600 hover:bg-red-500 px-4 py-1 rounded">Stop</button>
          </div>
        </div>

        <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden border border-white/10 shadow relative">
            <div className="relative w-full h-full">
              <WebcamDetection active={isRunning} />
              {showFlash && <div className="absolute inset-0 bg-green-500 opacity-30 animate-pulse" />}
            </div>
          </div>

          <div className="aspect-[4/3] bg-slate-800 p-4 rounded-xl space-y-2 border border-white/10 shadow">
            <h3 className="text-xl font-bold text-sky-400">Now Playing</h3>
            <p className="text-white font-semibold">{currentSession?.title}</p>
            <p className="text-sky-300 text-sm">{currentSession?.description}</p>
            <p className="text-sm text-gray-400">{reps} Reps × {workTime}s • Rest: {restTime}s</p>
            <video
              key={currentSessionIndex}
              controls
              autoPlay
              muted
              poster={currentSession?.thumbnail}
              className="mt-3 w-full h-[70%] rounded object-cover"
            >
              <source src={currentSession?.video} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </main>
  );
}
