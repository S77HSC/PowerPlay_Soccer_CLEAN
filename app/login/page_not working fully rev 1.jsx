"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const userId = data.session?.user?.id;

    if (!userId) {
      setError('No active session found.');
      setLoading(false);
      return;
    }

    try {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('auth_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (coachData) {
        router.push('/coach-dashboard');
        return;
      }

      const { data: playerData } = await supabase
        .from('players')
        .select('auth_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (playerData) {
        router.push('/player-dashboard');
        return;
      }

      setError('User role not recognized. Please contact support.');
    } catch (err) {
      console.error('Error during role check:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/video/powerplay-login-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute top-8 flex justify-center w-full z-20">
        <img src="/powerplay-logo.png" alt="PowerPlay Logo" width={180} height={60} />
      </div>

      <div className="relative z-10 bg-[#0f172a] bg-opacity-90 p-8 rounded-xl shadow-xl max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center text-white">Welcome to PowerPlay Soccer</h1>
        <p className="text-center text-gray-300">Log in to your account</p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">New to PowerPlay?</p>
          <button
            onClick={() => router.push('/register')}
            className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
