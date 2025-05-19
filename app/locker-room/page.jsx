'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

import LockerRoom from '@/components/LockerRoom';
import LockerRoomStore from '@/components/LockerRoomStore';

const mockItems = {
  kits: [
    { id: 'kit1', name: 'Red Home Kit', image: '/kits/red.png', xp: 100 },
    { id: 'kit2', name: 'Blue Away Kit', image: '/kits/blue.png', xp: 150 }
  ],
  boots: [
    { id: 'boot1', name: 'Speed Boots', image: '/boots/speed.png', xp: 120 },
    { id: 'boot2', name: 'Power Boots', image: '/boots/power.png', xp: 140 }
  ],
  badges: [
    { id: 'badge1', name: 'Champion Badge', image: '/badges/champion.png', xp: 80 },
    { id: 'badge2', name: 'Veteran Badge', image: '/badges/veteran.png', xp: 90 }
  ],
  celebrations: [
    { id: 'cel1', name: 'Backflip', image: '/celebrations/backflip.png', xp: 110 },
    { id: 'cel2', name: 'Slide Tackle', image: '/celebrations/slide.png', xp: 100 }
  ]
};

export default function LockerRoomPage() {
  const [view, setView] = useState('gear');
  const [gearTab, setGearTab] = useState('kits');
  const [storeTab, setStoreTab] = useState('kits');
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data } = await supabase
        .from('players')
        .select('id, name, avatar_url, points')
        .eq('auth_id', user.id)
        .single();

      setPlayer(data);
    };

    fetchPlayer();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19] px-4 py-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Image src="/locker_room_logo.png" alt="Locker Room" width={100} height={100} />
          <h1 className="text-3xl font-bold">Locker Room</h1>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10 shadow mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setView('gear')}
              className={`px-4 py-2 rounded ${view === 'gear' ? 'bg-pink-600 text-white' : 'bg-white/10 text-white'}`}
            >
              Your Gear
            </button>
            <button
              onClick={() => setView('store')}
              className={`px-4 py-2 rounded ${view === 'store' ? 'bg-pink-600 text-white' : 'bg-white/10 text-white'}`}
            >
              Store
            </button>
          </div>
        </div>

        {player && view === 'gear' && (
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow">
            <div className="flex gap-4 mb-4">
              {['kits', 'boots', 'badges', 'celebrations'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setGearTab(tab)}
                  className={`px-3 py-1 rounded text-sm ${gearTab === tab ? 'bg-pink-500 text-white' : 'bg-white/10 text-white'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <LockerRoom playerId={player.id} activeTab={gearTab} items={mockItems[gearTab]} />
          </div>
        )}

        {player && view === 'store' && (
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow">
            <div className="flex gap-4 mb-4">
              {['kits', 'boots', 'badges', 'celebrations'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStoreTab(tab)}
                  className={`px-3 py-1 rounded text-sm ${storeTab === tab ? 'bg-pink-500 text-white' : 'bg-white/10 text-white'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <LockerRoomStore playerId={player.id} activeTab={storeTab} items={mockItems[storeTab]} />
          </div>
        )}
      </div>
    </main>
  );
}
