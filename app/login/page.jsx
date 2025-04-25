"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [role, setRole] = useState('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    const user = data?.user || data?.session?.user;
    if (!user) {
      setError('No user session found.');
      setLoading(false);
      return;
    }

    const table = role === 'player' ? 'players' : 'coaches';
    const { data: profile, error: profileError } = await supabase
      .from(table)
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      router.push('/setup');
    } else {
      router.push(role === 'player' ? '/homepage' : '/coach-dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* PowerPlay Logo */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 animate-grow-shine">
        <img src="/powerplay-logo.png" alt="PowerPlay Logo" className="h-28 w-auto" />
      </div>

      {/* Video Background */}
      <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/powerplay-login-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

        {/* Login Form */}
        <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-8 bg-white bg-opacity-95 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>

          <div className="flex justify-center gap-6 mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="radio" name="role" value="player" checked={role === 'player'} onChange={() => setRole('player')} />
              Player
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="radio" name="role" value="coach" checked={role === 'coach'} onChange={() => setRole('coach')} />
              Coach
            </label>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <div className="text-red-500 text-sm text-center">❌ {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-700">
            Don’t have an account?{' '}
            <a href={`/register?role=${role}`} className="text-blue-600 hover:underline">
              Register as {role}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
