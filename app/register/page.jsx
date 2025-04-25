"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('team')
        .neq('team', null);

      if (error) {
        console.error('Error fetching teams:', error.message);
      } else {
        const uniqueTeams = Array.from(new Set(data.map(entry => entry.team).filter(Boolean)));
        setTeams(uniqueTeams);
      }
    };

    fetchTeams();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    const finalTeam = newTeam || team;

    if (!finalTeam) {
      setError('Please select or enter a team name.');
      setLoading(false);
      return;
    }

    let insertError;
    if (role === 'player') {
      ({ error: insertError } = await supabase.from('players').insert({
        auth_id: user.id,
        name,
        age,
        country,
        email,
        role,
        team: finalTeam,
      }));
    } else if (role === 'coach') {
      ({ error: insertError } = await supabase.from('coaches').insert({
        auth_id: user.id,
        name,
        age,
        country,
        email,
        role,
        team: finalTeam,
      }));
    } else {
      setError('Invalid role selected.');
      setLoading(false);
      return;
    }

    if (insertError) {
      console.error('Insert error:', insertError.message);
      setError(insertError.message || 'Failed to create profile.');
      setLoading(false);
      return;
    }

    router.push('/login');
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 bg-[#0f172a] bg-opacity-90 p-8 rounded-xl shadow-xl max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center text-white">Create an Account</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Name" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" required value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" placeholder="Age" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" required value={age} onChange={(e) => setAge(e.target.value)} />
          <input type="text" placeholder="Country" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" required value={country} onChange={(e) => setCountry(e.target.value)} />
          <input type="email" placeholder="Email" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="Confirm Password" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          <select required className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="player">Player</option>
            <option value="coach">Coach</option>
          </select>

          <select className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">Select Existing Team</option>
            {teams.length > 0 ? (
              teams.map((teamName) => (
                <option key={teamName} value={teamName}>{teamName}</option>
              ))
            ) : (
              <option disabled>No teams found</option>
            )}
          </select>

          <input type="text" placeholder="Or enter new team name" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} />

          <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold">
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">Already have an account?</p>
          <button onClick={() => router.push('/login')} className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
