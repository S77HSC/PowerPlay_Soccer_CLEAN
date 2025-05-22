'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LeaderboardPreviewCard from '../../components/LeaderboardPreviewCard';

const getFlagUrl = (country) => {
  const map = {
    england: 'gb',
    scotland: 'gb',
    wales: 'gb',
    uk: 'gb',
    unitedkingdom: 'gb',
    unitedstates: 'us',
    usa: 'us',
    ireland: 'ie',
    spain: 'es',
    germany: 'de',
    france: 'fr',
    italy: 'it',
    canada: 'ca',
    australia: 'au',
  };
  const key = country?.toLowerCase().replace(/\s+/g, '');
  const code = map[key] || key?.slice(0, 2);
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [workoutLeaders, setWorkoutLeaders] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentRank, setCurrentRank] = useState(null);
  const [sessionStats, setSessionStats] = useState({ sessions: 0, totalTime: 0, wins: 0 });
  const [activeTab, setActiveTab] = useState('points');

  const fetchWorkoutStats = async (playerId) => {
    if (!playerId) return;
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('player_id', playerId);

    if (error) {
      console.error('Error fetching session stats:', error);
      return;
    }

    const sessionsCount = sessions.length;
    const totalTime = sessions.reduce((acc, s) => acc + (s.work_time || 0), 0);
    const winCount = sessions.filter(s => s.is_win).length;

    setSessionStats({ sessions: sessionsCount, totalTime, wins: winCount });
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, team, points, country, avatar_url')
        .order('points', { ascending: false });

      if (error) {
        console.error('Error loading leaderboard:', error);
        setPlayers([]);
        return;
      }

      setPlayers(data || []);

      if (currentUser) {
        const index = data.findIndex(p => p.id === currentPlayer?.id);
        if (index !== -1) {
          setCurrentRank(index + 1);
        }
      }
    };

    const fetchWorkoutLeaders = async () => {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('player_id, work_time');

      const stats = {};
      sessions.forEach(({ player_id, work_time }) => {
        if (!stats[player_id]) stats[player_id] = { count: 0, total: 0 };
        stats[player_id].count++;
        stats[player_id].total += work_time || 0;
      });

      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, name, team, points, country, avatar_url');

      const enriched = allPlayers.map(p => ({
        ...p,
        sessions: stats[p.id]?.count || 0,
        workoutTime: stats[p.id]?.total || 0,
      }));

      const sorted = enriched.sort((a, b) => (b.workoutTime + b.sessions) - (a.workoutTime + a.sessions));
      setWorkoutLeaders(sorted);
    };

    const fetchCurrentPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) return;

      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (player) {
        setCurrentPlayer(player);
        setMyTeam(player.team);
        await fetchWorkoutStats(player.id);
      }
    };

    fetchCurrentPlayer().then(() => {
      fetchPlayers();
      fetchWorkoutLeaders();
    });
  }, []);

  return (
    <main className="relative h-screen overflow-hidden bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19] text-white px-4 py-8 font-sans">
      <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-no-repeat bg-center pointer-events-none" style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }}></div>
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col space-y-6">
        <h1 className="text-2xl font-bold text-center">🌍 Global Leaderboard</h1>

        <div className="flex justify-center space-x-4">
          <button onClick={() => setActiveTab('points')} className={`px-4 py-2 rounded-md border ${activeTab === 'points' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300'} hover:bg-cyan-700`}>
            🏆 Top by Points
          </button>
          <button onClick={() => setActiveTab('workouts')} className={`px-4 py-2 rounded-md border ${activeTab === 'workouts' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300'} hover:bg-cyan-700`}>
            🔥 Top by Workouts
          </button>
          {myTeam && (
            <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-md border ${activeTab === 'team' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300'} hover:bg-cyan-700`}>
              🛡️ My Team
            </button>
          )}
        </div>

        {currentPlayer && (
          <div className="max-w-3xl mx-auto p-4 border border-cyan-600 rounded-xl bg-gray-900 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img
                src={currentPlayer.avatar_url?.startsWith('http') ? currentPlayer.avatar_url : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${currentPlayer.avatar_url}`}
                alt="Avatar"
                className="w-20 h-20 object-cover aspect-square rounded-full border-2 border-cyan-500"
              />
              <div className="flex-1 w-full">
                <div className="flex flex-wrap justify-between items-center">
                  <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                    {currentPlayer.name}
                    {currentPlayer.country && (
                      <img
                        src={getFlagUrl(currentPlayer.country)?.toLowerCase()}
                        alt={`Flag of ${currentPlayer.country}`}
                        className="w-5 h-3 object-cover rounded-sm border border-gray-600"
                      />
                    )}
                  </h2>
                  {currentRank && (
                    <p className="text-sm text-green-400">🌟 Rank: #{currentRank}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Team: {currentPlayer.team}</p>
                <p className="text-xs text-gray-400">Country: {currentPlayer.country}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 text-xs">
                  <p className="text-yellow-400">🏆 Points: {currentPlayer.points}</p>
                  <p className="text-pink-400">🔥 Workouts: {sessionStats.sessions}</p>
                  <p className="text-blue-400">⏱️ Time: {Math.round(sessionStats.totalTime)} mins</p>
                  <p className="text-purple-400">✅ Wins: {sessionStats.wins}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto max-h-[40vh] px-2">
          {activeTab === 'points' && <LeaderboardPreviewCard players={players} />}
          {activeTab === 'workouts' && <LeaderboardPreviewCard players={workoutLeaders} showWorkouts />}
          {activeTab === 'team' && myTeam && <LeaderboardPreviewCard players={players} teamName={myTeam} />}
        </div>
      </div>
    </main>
  );
}
