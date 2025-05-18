'use client';

export const dynamic = 'force-dynamic';

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
      'United Kingdom': 'gb', England: 'gb', Scotland: 'gb', Wales: 'gb',
      USA: 'us', 'United States': 'us', Spain: 'es', 'South Korea': 'kr',
    }[countryName] || countryName.toLowerCase().slice(0, 2);
    return `https://flagcdn.com/w40/${code}.png`;
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19] text-white px-4 py-8 font-sans overflow-hidden">
      <div
  className="absolute inset-0 z-0 opacity-30 bg-cover bg-cover sm:bg-[length:100%_100%] bg-no-repeat bg-center pointer-events-none"
  style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }}
></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="relative grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
    <Image src="/powerplay-logo.png" alt="PowerPlay Logo" width={100} height={100} priority style={{ height: 'auto' }} />
    {player && (
      <div className="flex flex-wrap items-center gap-4">
        <Image
          src={player.avatar_url?.startsWith('http')
            ? player.avatar_url
            : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`}
          alt="Avatar"
          width={48}
          height={48}
          className="rounded-full border border-white/30 shadow-lg w-14 h-14 object-cover"
        />
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
  {player.name}
  {player.country && (
    <Image
      src={getCountryFlag(player.country)}
      alt={player.country}
      width={20}
      height={14}
      className="inline-block"
    />
  )}
  {rank && <span className="text-xs text-sky-400 ml-2">Global Rank #{rank}</span>}
</p>
          <div className="w-32 h-2 bg-gray-700 rounded-full mt-1">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-pulse"
              style={{ width: `${Math.min((((player?.points ?? 0) % 1000) / 10), 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-right text-gray-400">{player.points ?? 0} XP</p>
        </div>
      </div>
    )}
  </div>
  <div className="absolute top-2 right-2 z-20 flex gap-3 md:gap-4 md:static md:justify-end md:flex-row md:items-center">
  <Link href="/user-settings" className="text-cyan-400 hover:text-cyan-200">⚙️ Settings</Link>
  <Link href="/logout" className="text-orange-400 hover:text-orange-200">📕 Logout</Link>
</div>
</header>

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          <Link href="/skill-session" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-orange-300 text-center mb-3">Daily Challenge</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/daily-challenge-logo.png" alt="Daily Challenge" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-blue-200 text-center">Streak: {streak} {dailyComplete ? '✅' : '⏳'}</p>
</Link>

          <Link href="/player-dashboard" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-indigo-300 text-center mb-3">Player Dashboard</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/dashboard-logo.png" alt="Player Dashboard" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-indigo-200 text-center">Track your global progress</p>
</Link>

          <Link href="/workout-builder" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-green-300 text-center mb-3">Workout Builder</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/powerplay-sessionbuilder-logo.png" alt="Workout Builder" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-green-200 text-center">Create a custom routine</p>
</Link>

          <Link href="/sacrifice-league/new" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-yellow-300 text-center mb-3">Power League</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/tournament-sparkle.png" alt="Power League" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-yellow-200 text-center">Tournament creator</p>
</Link>

          <Link href="/survivor_mode" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-red-300 text-center mb-3">Survivor Mode</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/sacrifice_logo.png" alt="Survivor Mode" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-red-200 text-center">Score and survive</p>
</Link>

          <Link href="/powerplay" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-purple-300 text-center mb-3">PowerPlay</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/powerplay-logo.png" alt="PowerPlay" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-purple-200 text-center">Build. Compete. Dominate.</p>
</Link>
        <Link href="/boostball" className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/10 hover:shadow-lg hover:scale-[1.03] transition duration-300 ease-out hover:outline hover:outline-1 hover:outline-sky-300">
  <h3 className="text-xl font-extrabold text-pink-300 text-center mb-3">Boostball</h3>
  <div className="w-full flex justify-center mb-3">
    <Image src="/boostball_logo.png" alt="Boostball" width={90} height={90} className="opacity-100" />
  </div>
  <p className="text-sm text-pink-200 text-center">Fast-paced power play mode</p>
</Link>
        </section>

        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg">
          <LeaderboardPreviewCard players={leaders} />
        </section>
      </div>
          </div>
    </main>
  );
}
