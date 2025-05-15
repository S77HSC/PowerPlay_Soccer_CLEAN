"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { sessionData } from "../lib/sessionData";

export default function SkillSession() {
  const [player, setPlayer] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [dailySkills, setDailySkills] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (playerError) throw playerError;

        setPlayer(playerData);
        setPoints(playerData?.points || 0);
        setStreak(playerData?.streak || 0);

        const today = new Date().toISOString().split("T")[0];
        const { data: sessions, error: sessionsError } = await supabase
          .from("workout_sessions")
          .select("*")
          .eq("player_id", playerData.id)
          .gte("completed_at", today);

        if (sessionsError) throw sessionsError;

        setTodayCompleted(sessions.length > 0);
      } catch (err) {
        console.error("❌ Player fetch failed:", err.message);
      }
    };
    fetchPlayer();
  }, []);

  useEffect(() => {
    if (!player) return;
    const unlocked = Object.entries(sessionData).filter(
      ([_, info]) => player.points >= info.unlockXP
    );

    if (unlocked.length >= 2) {
      const seed = new Date().getDate();
      const shuffled = [...unlocked].sort(
        (a, b) => ((a[0] + seed).localeCompare(b[0] + seed))
      );
      const selected = shuffled.slice(0, 2).map(([key, info]) => ({
        ...info,
        sessionKey: key
      }));
      setDailySkills(selected);
    }
  }, [player]);

  const handleSessionSelect = (key) => {
    router.push(`/skill-player?session=${key}`);
  };

  return (
    <main className="relative min-h-screen text-white px-6 py-10 font-sans overflow-hidden bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19]">
      <div
        className="absolute inset-0 z-0 opacity-30 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {dailySkills.length === 2 && dailySkills[0] && dailySkills[1] && (
          <div className="bg-white/5 backdrop-blur-md border border-yellow-300 rounded-xl shadow-md p-6 space-y-4">
            <h3 className="text-2xl font-extrabold text-yellow-300 text-center">
              🔥 Daily Challenge: 10-Minute Skill Duel
            </h3>
            <p className="text-center text-gray-300">
              Complete both of today’s featured drills below and earn <span className="text-white font-semibold">25 XP</span>!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dailySkills.map((skill, idx) => (
                <div key={idx} className="flex flex-col bg-white/5 rounded-xl p-4 border border-white/10">
                  <img
                    src={skill.thumbnail}
                    alt={skill.title}
                    className="w-full h-[140px] object-cover rounded-lg mb-3"
                  />
                  <h4 className="text-lg font-semibold text-sky-200 mb-1">{skill.title}</h4>
                  <p className="text-sm text-gray-300 mb-3">{skill.description}</p>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">⏱</span> Work Time: <span className="text-white">30s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white">🔁</span> Reps: <span className="text-white">5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white">🚨</span> Rest Time: <span className="text-white">15s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              {todayCompleted ? (
                <p className="text-green-400 font-medium mt-2">✅ Completed Today</p>
              ) : (
                <p className="text-orange-400 font-medium mt-2">🏆 +2x XP Bonus</p>
              )}
              <p className="text-cyan-400 font-medium">
                🔥 Streak: {streak} day{streak === 1 ? "" : "s"}
              </p>

              <button
                onClick={() =>
                  router.push(`/skill-player?sessionA=${dailySkills[0].sessionKey}&sessionB=${dailySkills[1].sessionKey}`)
                }
                className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded shadow-md transition"
              >
                Start Challenge
              </button>
            </div>
          </div>
        )}

        
        

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
          {Object.entries(sessionData).map(([key, info]) => {
            const unlocked = points >= info.unlockXP;
            return (
              <div
                key={key}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-md p-4 flex flex-col items-center text-center"
              >
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="w-full h-[140px] object-cover rounded-lg mb-3"
                />
                <h3 className="text-lg font-semibold text-sky-200">{info.title}</h3>
                <p className="text-sm text-gray-300">{info.description}</p>
                {unlocked ? (
                  <button
                    onClick={() => handleSessionSelect(key)}
                    className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded shadow transition"
                  >
                    View
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 mt-3">🔒 Unlocks at {info.unlockXP} XP</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
</main>
  );
}
