'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import LeaderboardPreviewCard from '../../components/LeaderboardPreviewCard';

export default function Homepage() {
  const [player, setPlayer] = useState(null);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No user found');
        return;
      }

      let { data: playerData } = await supabase
        .from('players')
        .select('id, name, points, country, avatar_url, hasWon')
        .eq('auth_id', user.id)
        .single();

      if (!playerData) {
        const { data: newPlayer, error: insertError } = await supabase
          .from('players')
          .insert([
            {
              auth_id: user.id,
              name: 'New Player',
              points: 0,
              country: 'Unknown',
              avatar_url: null,
              hasWon: 0,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating player profile:', insertError);
          return;
        }

        playerData = newPlayer;
      }

      setPlayer(playerData);

      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, points');

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

      if (error) {
        console.error('Error fetching leaderboard preview:', error);
        return;
      }

      setLeaders(data || []);
    };

    fetchPlayer();
    fetchLeaders();
  }, []);

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

  return (
    <main className="min-h-screen px-4 py-6 text-white bg-gradient-to-br from-black via-[#0a0f1c] to-black">
      <div className="flex items-center justify-between mb-6">
        <Image src="/logo.png" alt="PowerPlay Soccer" width={120} height={40} />
        <Link
          href="/logout"
          className="text-sm text-blue-300 hover:text-blue-400 font-semibold"
        >
          🚪 Logout
        </Link>
      </div>

      {player ? (
        <div className="bg-gradient-to-r from-[#1f2937] to-[#111827] border border-blue-700 p-4 rounded-lg shadow-lg mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Image
              src={
                player.avatar_url
                  ? (player.avatar_url.startsWith('http')
                      ? player.avatar_url
                      : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`)
                  : '/default-avatar.png'
              }
              alt="Avatar"
              width={96}
              height={96}
              className="object-cover aspect-square rounded-full border-2 border-cyan-500"
            />

            <div>
              <h2 className="text-xl font-bold text-white drop-shadow">{player.name}</h2>
              <p className="text-sm text-blue-300">
                {player.country && (
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
                <span className="ml-4">
                  🌍 Rank: {rank != null ? `#${rank}` : 'Calculating...'}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs uppercase text-gray-400 mb-1">XP Progress</label>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 transition-all duration-700 animate-pulse"
                style={{ width: `${Math.min((player.points % 1000) / 10, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right text-gray-400 mt-1 animate-pulse">{player.points ?? 0} XP</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#1f2937] text-blue-200 border border-blue-700 p-4 rounded-lg shadow mb-6">
          Loading player profile or profile not found...
        </div>
      )}

      <div className="bg-[#1b223b] border border-blue-700 p-4 rounded-lg shadow-md mb-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-2">🔥 Daily Challenge</h3>
        <p className="text-blue-200">
          Complete <strong>2 Skill Sessions</strong> today to keep your streak alive! 🔁
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
        <Link
          href="/skill-session"
          className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow text-center hover:bg-blue-700"
        >
          ⚽ Start Skill Session
        </Link>

        <Link
          href="/player-dashboard"
          className="bg-green-600 text-white px-6 py-4 rounded-lg shadow text-center hover:bg-green-700"
        >
          📊 Player Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto mb-10">
        <LeaderboardPreviewCard players={leaders} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
    <Link href="/sacrifice-league/new">
      <div className="bg-gradient-to-br from-[#222831] to-[#393e46] hover:scale-105 transition-transform duration-300 p-6 rounded-xl shadow-xl text-center font-bold text-xl cursor-pointer border border-blue-600 hover:shadow-glow">
        <Image src="/tournament-sparkle.png" alt="Tournament Manager Logo" width={80} height={80} className="mx-auto mb-4" />
        Power League
        <p className="text-sm font-normal text-gray-300 mt-2">Tournament creator.</p>
      </div>
    </Link>

    <Link href="/survivor_mode">
      <div className="bg-gradient-to-br from-[#2d2d2d] to-[#444] hover:scale-105 transition-transform duration-300 p-6 rounded-xl shadow-xl text-center font-bold text-xl cursor-pointer border border-red-600 hover:shadow-glow">
        <Image src="/sacrifice_logo.png" alt="Survivor Mode Logo" width={80} height={80} className="mx-auto mb-4" />
        Survivor Mode
        <p className="text-sm font-normal text-gray-300 mt-2">Score and survive!</p>
      </div>
    </Link>

    <Link href="/powerplay">
      <div className="bg-gradient-to-br from-[#141e30] to-[#243b55] hover:scale-105 transition-transform duration-300 p-6 rounded-xl shadow-xl text-center font-bold text-xl cursor-pointer border border-green-600 hover:shadow-glow">
        <Image src="/powerplay-logo.png" alt="PowerPlay Logo" width={80} height={80} className="mx-auto mb-4" />
        PowerPlay
        <p className="text-sm font-normal text-gray-300 mt-2">Build. Compete. Dominate.</p>
      </div>
    </Link>
  </div>
</main>
  );
}
