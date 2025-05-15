// Updated SkillPlayer page.jsx based on dual-session support for daily challenge

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { sessionData } from '../../lib/sessionData';
import confetti from 'canvas-confetti';
import axios from 'axios';
import dynamic from 'next/dynamic';

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
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpModal, setShowXpModal] = useState(false);
    const intervalRef = useRef(null);
  const XP_GOAL = 100;

  const reps = 5;
  const workTime = 30;
  const restTime = 15;
  const fixedXP = 25;

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
              new Audio('/session-complete.mp3').play();
              handleXpUpdate();
              setIsRunning(false);
              setCurrentSessionIndex(0);
              setCurrentRep(0);
            } else {
              setCurrentSessionIndex(prev => prev + 1);
              setCurrentRep(0);
              setCountdown(restTime);
              setIsResting(true);
            }
          } else {
            new Audio('/rest-now.mp3').play();
            setCountdown(restTime);
            setIsResting(true);
            setCurrentRep(prev => prev + 1);
          }
        }
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, countdown]);

  const startTimer = () => {
    const beepDelays = [0, 1000, 2000];
    beepDelays.forEach(delay => {
      setTimeout(() => new Audio('/race-start-beeps.mp3').play(), delay);
    });
    setTimeout(() => {
      setCurrentRep(0);
      setCurrentSessionIndex(0);
      setIsResting(false);
      setTouchCount(0);
      resetBackendTouches();
      setCountdown(workTime);
      setIsRunning(true);
    }, 3000);
  };

  const resetBackendTouches = async () => {
    try {
      await axios.post('http://localhost:8000/reset-touches/');
    } catch (err) {
      console.warn('Backend not available — continuing without reset.');
    }
  };

  const handleXpUpdate = async () => {
    const newPoints = points + fixedXP;
    setXpEarned(fixedXP);
    setShowXpModal(true);
    setTimeout(() => setShowXpModal(false), 4000);

    if (player) {
      await supabase.from('workout_sessions').insert([
        {
          player_id: player.id,
          completed_at: new Date().toISOString(),
          xr_awarded: fixedXP,
          reps,
          work_time: workTime,
          rest_time: restTime,
          skill_name: `${sessionAKey},${sessionBKey}`,
          touches: touchCount
        }
      ]);

      await supabase.from('players').update({ points: newPoints }).eq('id', player.id);
      setPoints(newPoints);
      if (Math.floor(newPoints / XP_GOAL) > Math.floor(points / XP_GOAL)) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const currentSession = sessions[currentSessionIndex];

  return (
    <main className="relative min-h-screen text-white px-4 py-8 font-sans overflow-hidden bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19]">
      <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }}></div>
      <div className="relative z-10">
        {showXpModal && (
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 bg-slate-800 p-6 rounded-xl z-50 text-center shadow-xl">
            <h3 className="text-sky-400 text-xl font-bold mb-2">🎉 XP Earned!</h3>
            <p className="text-2xl font-bold">{xpEarned} XP</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-xl font-bold text-center text-sky-400">10-Minute Daily Challenge</h2>

          <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-md">
            <video
              key={currentSessionIndex}
              controls
              autoPlay
              muted
              poster={sessions[currentSessionIndex]?.thumbnail}
              className="w-full h-full object-cover"
            >
              <source src={sessions[currentSessionIndex]?.video} type="video/mp4" />
            </video>
          </div>

          <p className="text-center text-gray-300">{currentSession?.description}</p>

          <div className="rounded-xl overflow-hidden border border-white/10 shadow-md w-full aspect-video">
  <WebcamDetection onTouchDetected={() => setTouchCount(c => c + 1)} />
</div>
<div className="text-center space-y-2">
            <h2 className="text-5xl font-extrabold">{countdown}s</h2>
            <p className="text-xl text-sky-400">Touches: {touchCount}</p>
            <div className="flex justify-center gap-4">
              <button onClick={startTimer} className="bg-green-600 px-4 py-2 rounded">Start</button>
              <button onClick={() => setIsRunning(false)} className="bg-red-600 px-4 py-2 rounded">Stop</button>
              <button onClick={() => { setCountdown(0); setCurrentRep(0); setIsResting(false); setTouchCount(0); resetBackendTouches(); }} className="bg-blue-600 px-4 py-2 rounded">Reset</button>
            </div>
            <div>
              <p>Level {Math.floor(points / XP_GOAL)}</p>
              <p>{points % XP_GOAL} / {XP_GOAL} XP</p>
              <div className="w-full max-w-xs h-4 bg-gray-800 rounded-full mx-auto">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full" style={{ width: `${(points % XP_GOAL / XP_GOAL) * 100}%` }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
