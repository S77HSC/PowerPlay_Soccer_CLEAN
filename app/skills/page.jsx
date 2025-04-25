'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sessionData } from '@/lib/sessionData';
import Image from 'next/image';
import Link from 'next/link';

export default function SkillsPage() {
  const [player, setPlayer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: playerData } = await supabase
        .from('players')
        .select('id, points')
        .eq('auth_id', user.id)
        .single();

      if (!playerData) return;
      setPlayer(playerData);
    };

    fetchPlayer();
  }, []);

  if (!player) {
    return <div className="text-white p-10">Loading player profile...</div>;
  }

  const skills = Object.entries(sessionData).map(([id, data]) => ({ id, ...data }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <h1 className="text-2xl font-bold text-white mb-6">🎯 Skills Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {skills.map((skill) => {
          const isUnlocked = player.points >= skill.unlockXP;
          const pointsNeeded = skill.unlockXP - player.points;

          return (
            <div key={skill.id} className={`border p-4 rounded-xl shadow-md ${isUnlocked ? 'border-green-500' : 'border-gray-700 opacity-60'} bg-gray-800 hover:scale-105 transition-all relative`}>
              <Image
                src={skill.thumbnail}
                alt={skill.title}
                width={400}
                height={250}
                className="rounded-md object-cover mb-4"
              />
              <h3 className="text-lg font-bold text-white mb-2">{skill.title}</h3>
              <p className="text-sm text-gray-400 mb-2">{skill.description}</p>
              <p className="text-xs text-cyan-400 mb-2">
                {isUnlocked ? '✅ Unlocked' : `🔒 ${pointsNeeded} XP needed`}
              </p>

              {isUnlocked && (
                <Link
                  href={`/skill-session?session=${skill.id}`}
                  className="inline-block mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold text-sm"
                >
                  Start Session
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}