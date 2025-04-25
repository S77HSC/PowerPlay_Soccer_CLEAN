'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function CoachDashboard() {
  const [userTeam, setUserTeam] = useState('');
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamAndPlayers = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('team')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (coachError || !coach || !coach.team) {
        setUserTeam(null);
        setLoading(false);
        return;
      }

      setUserTeam(coach.team);

      const { data: teamPlayers } = await supabase
        .from('players')
        .select('id, name, country, points')
        .eq('team', coach.team);

      setPlayers(teamPlayers || []);
      setLoading(false);
    };

    fetchTeamAndPlayers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('homework').insert([{
      team: userTeam,
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      created_by: user.id,
    }]);

    if (error) {
      setStatus('Error saving homework.');
    } else {
      setStatus('✅ Homework assigned!');
      setForm({ title: '', description: '', due_date: '' });
    }
  };

  if (loading) return <p className="text-white p-4">Loading coach dashboard...</p>;
  if (!userTeam) return <p className="text-red-500 p-4">No team assigned. Please contact support.</p>;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <img src="/powerplay-logo.png" alt="Logo" width={140} height={50} />
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">🧑‍🏫 Coach Dashboard</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <input type="text" value={userTeam} disabled className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600" />
        <input type="text" placeholder="Homework Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"></textarea>
        <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600" />
        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold">Assign Homework</button>
        {status && <p className="text-sm mt-2 text-center text-green-400">{status}</p>}
      </form>

      <h2 className="text-xl font-semibold mb-4">👟 Team Players</h2>
      {players.length === 0 ? (
        <p className="text-gray-400">No players found for this team.</p>
      ) : (
        <ul className="space-y-2 mb-10">
          {players.map((p) => (
            <li key={p.id} className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{p.name}</p>
                <p className="text-sm text-gray-400">{p.country}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-300">XP: {p.points}</p>
                <button onClick={() => window.open(`/player-dashboard?id=${p.id}`, '_blank')} className="mt-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition duration-200">View Player Dashboard</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🎮 Games Section - All Clickable with Correct Paths */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">🎮 Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/sacrifice-league/new" className="bg-gray-900 p-4 rounded-lg shadow hover:bg-gray-800 transition cursor-pointer">
            <img src="tournament-sparkle.png" alt="Power League" className="h-12 mb-2" />
            <h3 className="text-lg font-semibold text-yellow-400 mb-1">🏆 Power League</h3>
            <p className="text-sm text-gray-300">Track team competition standings and rankings.</p>
          </a>
          <a href="/survivor_mode" className="bg-gray-900 p-4 rounded-lg shadow hover:bg-gray-800 transition cursor-pointer">
            <img src="/sacrifice_logo.png" alt="Survivor Mode" className="h-12 mb-2" />
            <h3 className="text-lg font-semibold text-red-400 mb-1">💀 Survivor Mode</h3>
            <p className="text-sm text-gray-300">Elimination-based challenges. Who survives the session?</p>
          </a>
          <a href="/powerplay" className="bg-gray-900 p-4 rounded-lg shadow hover:bg-gray-800 transition cursor-pointer">
            <img src="/powerplay-logo.png" alt="PowerPlay" className="h-12 mb-2" />
            <h3 className="text-lg font-semibold text-blue-400 mb-1">⚡ PowerPlay</h3>
            <p className="text-sm text-gray-300">Fast-paced team drills with scoring and live feedback.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
