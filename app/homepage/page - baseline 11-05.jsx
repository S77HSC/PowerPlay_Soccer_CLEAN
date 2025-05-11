'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import LeaderboardPreviewCard from '../../components/LeaderboardPreviewCard';

export default function Homepage() {
  const [player, setPlayer] = useState(null);
  const [dailyComplete, setDailyComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [rank, setRank] = useState(null);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
    };

    checkAuth();

    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: playerData } = await supabase
        .from('players')
        .select('id, name, points, country, avatar_url, hasWon, last_daily_reward')
        .eq('auth_id', user.id)
        .single();

      if (!playerData) {
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert([{ auth_id: user.id, name: 'New Player', points: 0, country: 'Unknown', avatar_url: null, hasWon: 0 }])
          .select()
          .single();
        if (error) return;
        playerData = newPlayer;
      }

      setPlayer(playerData);

      const { data: allPlayers } = await supabase.from('players').select('id, points');
      if (allPlayers) {
        const sorted = allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
        const position = sorted.findIndex(p => p.id === playerData.id);
        setRank(position >= 0 ? position + 1 : null);
      }
    };

    const fetchLeaders = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, points, country')
        .order('points', { ascending: false })
        .limit(5);

      if (!error) setLeaders(data || []);
    };

    fetchPlayer();
    fetchLeaders();
  }, []);

  useEffect(() => {
    if (!player?.id) return;

    const fetchWorkoutData = async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: sessionsToday } = await supabase
        .from('workout_sessions')
        .select('created_at')
        .eq('player_id', player.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      const completedToday = sessionsToday?.length >= 2;
      setDailyComplete(completedToday);

      const { data: allSessions } = await supabase
        .from('workout_sessions')
        .select('created_at')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false });

      const days = new Map();
      allSessions?.forEach(({ created_at }) => {
        const day = new Date(created_at).toISOString().split('T')[0];
        days.set(day, (days.get(day) || 0) + 1);
      });

      let streakCount = 0;
      let date = new Date();

      while (true) {
        const key = date.toISOString().split('T')[0];
        if ((days.get(key) || 0) >= 2) {
          streakCount += 1;
          date.setDate(date.getDate() - 1);
        } else {
          break;
        }
      }

      setStreak(streakCount);

      // Grant XP reward for completing today's challenge if not yet rewarded
      const rewardKey = new Date().toISOString().split('T')[0];
      if (completedToday && player.last_daily_reward !== rewardKey) {
        const updatedXP = player.points + 50;

        await supabase
          .from('players')
          .update({ points: updatedXP, last_daily_reward: rewardKey })
          .eq('id', player.id);

        setPlayer(prev => ({ ...prev, points: updatedXP, last_daily_reward: rewardKey }));
      }
    };

    fetchWorkoutData();
  }, [player]);

  const getCountryFlag = (countryName) => {
    if (!countryName) return null;
    const code = {
      'United Kingdom': 'gb',
      England: 'gb',
      Scotland: 'gb',
      Wales: 'gb',
      USA: 'us',
      'United States': 'us',
      Spain: 'es',
      'South Korea': 'kr',
    }[countryName] || countryName.toLowerCase().slice(0, 2);
    return `https://flagcdn.com/w40/${code}.png`;
  };

  const buttonBase = "w-full sm:w-auto transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";

  return (
  <main className="px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
    <div className="max-w-4xl mx-auto flex justify-between items-center mb-4">
      <Image src="/powerplay-logo.png" alt="PowerPlay Logo" width={100} height={100} />
      <div className="flex gap-4">
        <Link href="/settings" className="text-cyan-300 hover:underline">⚙️ Settings</Link>
        <Link href="/logout" className="text-orange-400 hover:underline">📕 Logout</Link>
      </div>
    </div>
  <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#1f2937] to-[#111827] border border-blue-700 p-4 rounded-lg shadow-lg">
    <div className="flex items-center gap-4">
      {player && (
        <Image
          src={player.avatar_url?.startsWith('http')
            ? player.avatar_url
            : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`}
          alt="Avatar"
          width={60}
          height={60}
          className="object-cover aspect-square rounded-full border-2 border-cyan-500"
        />
      )}
      <div>
        <h2 className="text-lg font-bold text-white drop-shadow">{player?.name ?? '...'}</h2>
        <p className="text-xs text-blue-300">
          {player?.country && (
            <>
              <Image
                src={getCountryFlag(player.country)}
                alt={player.country}
                width={24}
                height={16}
                style={{ height: 'auto' }}
                className="inline-block mr-2"
              />
              {player.country}
            </>
          )}
          <span className="ml-2">🌍 Rank: {rank != null ? `#${rank}` : '...'}</span>
        </p>
      </div>
    </div>
    {player && (
      <div className="mt-4 w-full">
        <label className="block text-xs uppercase text-gray-400 mb-1">XP Progress</label>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 transition-all duration-700 animate-pulse"
            style={{ width: `${Math.min((player.points % 1000) / 10, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-right text-gray-400 mt-1 animate-pulse">{player.points ?? 0} XP</p>
      </div>
    )}
  </div>
      
    


        <div className="h-4 sm:h-6"></div>

        
        <Link href="/skill-session">
  <div className="bg-[#1b223b] border border-blue-700 ring-2 ring-blue-500 ring-offset-2 p-6 rounded-2xl shadow-md hover:shadow-lg hover:ring-2 hover:ring-blue-400 transition-all duration-300 cursor-pointer text-center space-y-2 animate-fade-in">
    <h3 className="text-xl font-extrabold text-orange-400 tracking-wide animate-pulse">🔥 Daily Challenge</h3>
    <p className="text-blue-200 text-base font-medium">Complete <strong>2 Skill Sessions</strong> today</p>
    <p className="text-blue-200 text-base font-medium">to keep your streak alive! 🔁</p>
    {streak === 2 && <p className="text-base text-blue-400 font-semibold animate-pulse">✨ Getting Started Streak!</p>}
    {streak >= 3 && streak < 5 && <p className="text-base text-orange-300 font-semibold animate-pulse">🥉 Bronze Streak!</p>}
    {streak >= 5 && streak < 7 && <p className="text-base text-gray-200 font-semibold animate-pulse">🥈 Silver Streak!</p>}
    {streak >= 7 && streak < 10 && <p className="text-base text-yellow-400 font-semibold animate-pulse">🥇 Gold Streak!</p>}
    {streak >= 10 && streak < 14 && <p className="text-base text-green-400 font-semibold animate-pulse">🟢 Emerald Streak!</p>}
    {streak >= 14 && streak < 21 && <p className="text-base text-purple-400 font-semibold animate-pulse">🟪 Platinum Streak!</p>}
    {streak >= 21 && <p className="text-base text-pink-400 font-semibold animate-pulse">🌟 Legendary Streak!</p>}
    <p className="text-base text-orange-300 font-bold">🔥 {streak}-day streak {dailyComplete ? '✅' : '⏳'}</p>
  </div>
</Link>

        <div className="w-full max-w-md mx-auto grid gap-6">
          <div className="bg-[#111e2e] border border-cyan-600 p-5 rounded-2xl shadow-md text-center hover:shadow-cyan-500/30 transition-shadow">
            <Link href="/skill-session" className="block font-semibold text-white text-lg">
              ⚽ Start Skill Session
            </Link>
            <p className="text-xs text-cyan-300 mt-1">Practice a quick skill</p>
          </div>

          <div className="bg-[#191937] border border-indigo-600 p-5 rounded-2xl shadow-md text-center hover:shadow-indigo-500/30 transition-shadow">
            <Link href="/player-dashboard" className="block font-semibold text-white text-lg">
              📊 Player Dashboard
            </Link>
            <p className="text-xs text-indigo-300 mt-1">Check your global rank</p>
          </div>

          <div className="bg-[#1C2951] border border-cyan-600 p-5 rounded-2xl shadow-md text-center hover:shadow-cyan-400/30 transition-shadow">
            <Link href="/workout-builder" className="block font-semibold text-white text-lg">
              🏋️ Workout Builder
            </Link>
            <p className="text-xs text-yellow-300 mt-1">Create a custom workout</p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-700 shadow-md p-5 bg-[#111827]">
          <LeaderboardPreviewCard players={leaders} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/sacrifice-league/new">
            <div className="bg-[#222831] border border-blue-600 p-5 rounded-2xl shadow-md text-center hover:shadow-blue-400/30 transition-shadow">
              <Image src="/tournament-sparkle.png" alt="Tournament Manager Logo" width={90} height={90} className="mx-auto mb-3" />
              <h4 className="font-semibold text-white text-lg">Power League</h4>
              <p className="text-sm text-gray-300 mt-1">Tournament creator.</p>
            </div>
          </Link>

          <Link href="/survivor_mode">
            <div className="bg-[#2d2d2d] border border-red-600 p-5 rounded-2xl shadow-md text-center hover:shadow-red-400/30 transition-shadow">
              <Image src="/sacrifice_logo.png" alt="Survivor Mode Logo" width={90} height={90} className="mx-auto mb-3" />
              <h4 className="font-semibold text-white text-lg">Survivor Mode</h4>
              <p className="text-sm text-gray-300 mt-1">Score and survive!</p>
            </div>
          </Link>

          <Link href="/powerplay">
            <div className="bg-[#141e30] border border-green-600 p-5 rounded-2xl shadow-md text-center hover:shadow-green-400/30 transition-shadow">
              <Image src="/powerplay-logo.png" alt="PowerPlay Logo" width={90} height={90} className="mx-auto mb-3" />
              <h4 className="font-semibold text-white text-lg">PowerPlay</h4>
              <p className="text-sm text-gray-300 mt-1">Build. Compete. Dominate.</p>
            </div>
          </Link>
</div>
</main>
  );
}
