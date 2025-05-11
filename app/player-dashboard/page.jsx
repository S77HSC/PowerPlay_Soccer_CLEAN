'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function PlayerDashboard() {
  const [player, setPlayer] = useState(null);
  const [rank, setRank] = useState(null);
  const [sessions, setSessions] = useState(0);
  const [wins, setWins] = useState(0);
  const [goals, setGoals] = useState(0);
  const [timeData, setTimeData] = useState([]);
  const [skillData, setSkillData] = useState([]);
  const [touchesData, setTouchesData] = useState([]);

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      setPlayer(playerData);

      const { data: workoutSessions } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('player_id', playerData.id);

      setSessions(workoutSessions?.length || 0);
      setWins(playerData.games_won ?? 0);
      setGoals(playerData.goals ?? 0);

      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('created_at, work_time, skill_name, touches')
        .eq('player_id', playerData.id);

      if (sessionData) {
        const groupedTime = sessionData.reduce((acc, session) => {
          const date = new Date(session.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + (session.work_time || 0);
          return acc;
        }, {});

        const chartTime = Object.entries(groupedTime).map(([date, minutes]) => ({ date, minutes }));
        setTimeData(chartTime);

        const groupedSkills = sessionData.reduce((acc, session) => {
          const skill = session.skill_name || 'Unknown';
          acc[skill] = (acc[skill] || 0) + (session.work_time || 0);
          return acc;
        }, {});

        const chartSkills = Object.entries(groupedSkills).map(([skill, minutes]) => ({ skill, minutes }));
        setSkillData(chartSkills);

        const groupedTouches = sessionData.reduce((acc, session) => {
          const date = new Date(session.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + (session.touches || 0);
          return acc;
        }, {});

        const chartTouches = Object.entries(groupedTouches).map(([date, touches]) => ({ date, touches }));
        setTouchesData(chartTouches);
      }

      const { data: allPlayers } = await supabase.from('players').select('id, points');
      if (allPlayers) {
        const sorted = allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
        const position = sorted.findIndex(p => p.id === playerData.id);
        setRank(position >= 0 ? position + 1 : null);
      }
    };

    fetchPlayer();
  }, []);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19] text-white px-4 py-8 font-sans overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }}></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">
        

        {/* Header Profile Card */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 grid md:grid-cols-3 gap-6 items-center">
          
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            {player?.avatar_url && (
              <Image
                src={player.avatar_url.startsWith('http') ? player.avatar_url : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`}
                alt="Avatar"
                width={60}
                height={60}
                className="rounded-full border-2 border-white/30 mb-3 w-[60px] h-[60px] object-cover"
              />
            )}
            <h2 className="text-2xl font-bold text-cyan-300">{player?.name}</h2>
            <p className="text-sm text-gray-400">HSC All Stars</p>
            <p className="text-xs text-sky-400 mt-1">Global Rank #{rank}</p>
            <div className="w-full max-w-sm mt-2 mx-auto md:mx-0">
              <div className="h-2 rounded-full bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-pulse"
                  style={{ width: `${Math.min(((player?.points ?? 0) % 1000) / 10, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 text-right mt-1">{player?.points ?? 0} XP</p>
            </div>
          </div>
          <div className="flex justify-center md:justify-end gap-6">
            <div className="text-center">
              <p className="text-yellow-300 text-lg font-bold">{player?.points ?? 0}</p>
              <p className="text-xs text-gray-400">XP</p>
            </div>
            <div className="text-center">
              <p className="text-green-300 text-lg font-bold">{sessions}</p>
              <p className="text-xs text-gray-400">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-pink-300 text-lg font-bold">{goals}</p>
              <p className="text-xs text-gray-400">Goals</p>
            </div>
            <div className="text-center">
              <p className="text-blue-300 text-lg font-bold">{wins}</p>
              <p className="text-xs text-gray-400">Wins</p>
            </div>
</div>
</div>

        {/* Graph Placeholder Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-5 rounded-xl shadow-md border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-3">📈 XP & Workouts Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
  <BarChart data={[{ date: '2025-04-13', xp: 400, workouts: 3 }, { date: '2025-04-20', xp: 150, workouts: 1 }, { date: '2025-04-27', xp: 950, workouts: 3 }, { date: '2025-05-04', xp: 430, workouts: 2 }]}
    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" stroke="#8884d8" />
    <YAxis stroke="#8884d8" />
    <Tooltip />
    <Legend />
    <Bar dataKey="xp" fill="#facc15" name="XP Gained" />
    <Bar dataKey="workouts" fill="#4ade80" name="Workouts" />
  </BarChart>
</ResponsiveContainer>
          </div>
          <div className="bg-white/5 p-5 rounded-xl shadow-md border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-3">⏱ Time Spent per Period</h3>
            <ResponsiveContainer width="100%" height={200}>
  <BarChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" stroke="#8884d8" />
    <YAxis stroke="#8884d8" />
    <Tooltip />
    <Legend />
    <Bar dataKey="minutes" fill="#60a5fa" name="Minutes Trained" />
  </BarChart>
</ResponsiveContainer>
          </div>
          <div className="bg-white/5 p-5 rounded-xl shadow-md border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-3">⚽ Time per Skill</h3>
            <ResponsiveContainer width="100%" height={200}>
  <BarChart data={skillData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="skill" stroke="#8884d8" interval={0} angle={-30} textAnchor="end" />
    <YAxis stroke="#8884d8" />
    <Tooltip />
    <Legend />
    <Bar dataKey="minutes" fill="#a78bfa" name="Time (min)" />
  </BarChart>
</ResponsiveContainer>
          </div>
          <div className="bg-white/5 p-5 rounded-xl shadow-md border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-3">🎯 Accuracy & Consistency</h3>
            <ResponsiveContainer width="100%" height={200}>
  <BarChart data={touchesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" stroke="#8884d8" />
    <YAxis stroke="#8884d8" />
    <Tooltip />
    <Legend />
    <Bar dataKey="touches" fill="#fb7185" name="Touches" />
  </BarChart>
</ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  </main>
  );
}
