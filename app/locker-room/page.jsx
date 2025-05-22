'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import LockerRoom from '@/components/LockerRoom';
import LockerRoomStore from '@/components/LockerRoomStore';

const mockItems = {
  kits: [
    { id: 'kit1', name: 'Red Home Kit', image: '/LockerRoom/kits/powerplay_kit_red.png', xp: 100 },
    { id: 'kit2', name: 'Blue Away Kit', image: '/LockerRoom/kits/powerplay_kit_blue.png', xp: 150 },
    { id: 'kit3', name: 'Legend Red and White', image: '/LockerRoom/kits/powerplay_kit_blue.png', xp: 150 }	
  ],
  boots: [
    { id: 'boot1', name: 'Power Boots', image: '/LockerRoom/boots/power_boots.png', xp: 140 },
    { id: 'boot2', name: 'Speed Boots', image: '/LockerRoom/boots/speed_boots.png', xp: 160 },
    { id: 'boot3', name: 'Precision Boots', image: '/LockerRoom/boots/power_precision.png', xp: 190 },
    { id: 'boot4', name: 'Legend Boots', image: '/LockerRoom/boots/legend_boots.png', xp: 190 },
    { id: 'boot5', name: 'Power Boots', image: '/LockerRoom/boots/star_striker.png', xp: 300},      { id: 'boot6', name: 'Power Boots', image: '/LockerRoom/boots/launching_soon.png', xp: 300 }
  ],
  badges: [
    { id: 'badge1', name: 'Champion Badge', image: '/LockerRoom/badges/champion.png', xp: 80 },
    { id: 'badge2', name: 'Veteran Badge', image: '/LockerRoom/badges/veteran.png', xp: 90 }
  ],
  celebrations: [
    { id: 'cel1', name: 'Backflip', image: '/LockerRoom/celebrations/backflip.png', xp: 110 },
    { id: 'cel2', name: 'Slide Tackle', image: '/LockerRoom/celebrations/launching_soon.png', xp: 150 }
  ]
};

export default function LockerRoomPage() {
  const [view, setView] = useState('gear');
  const [gearTab, setGearTab] = useState('kits');
  const [storeTab, setStoreTab] = useState('kits');
  const [player, setPlayer] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data } = await supabase
        .from('players')
        .select('id, name, avatar_url, points, country')
        .eq('auth_id', user.id)
        .single();

      setPlayer(data);
    };

    fetchPlayer();
  }, []);

  const getAvatarUrl = (avatar_url) => {
    return avatar_url?.startsWith("http")
      ? avatar_url
      : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${avatar_url}`;
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#0a0f19] via-[#111827] to-[#0a0f19] text-white px-4 py-8 font-sans overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-no-repeat bg-center pointer-events-none"
        style={{ backgroundImage: "url('/images/futuristic-football-bg.jpg')" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-4">
            <Image src="/locker_room_logo.png" alt="Locker Room" width={100} height={100} />
            <h1 className="text-3xl font-bold">Locker Room</h1>
          </div>

          {player && (
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <Image
                  src={getAvatarUrl(player.avatar_url)}
                  alt="Avatar"
                  fill
                  className="rounded-full border-4 border-pink-400 shadow-xl object-cover"
                />
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">{player.name}</p>
                <div className="relative w-40 h-2 bg-white/20 rounded-full mt-1">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((player?.points ?? 0) % 1000) / 10, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">{player.points ?? 0} XP</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg">
          <div className="flex gap-4">
            <button
              onClick={() => setView('gear')}
              className={`px-4 py-2 rounded transition-all duration-300 hover:scale-105 ${view === 'gear' ? 'bg-pink-600 text-white' : 'bg-white/10 text-white'}`}
            >
              Your Gear
            </button>
            <button
              onClick={() => setView('store')}
              className={`px-4 py-2 rounded transition-all duration-300 hover:scale-105 ${view === 'store' ? 'bg-pink-600 text-white' : 'bg-white/10 text-white'}`}
            >
              Store
            </button>
          </div>
        </div>

        {player && view === 'gear' && (
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-lg">
            <div className="flex gap-4 mb-4">
              {['kits', 'boots', 'badges', 'celebrations'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setGearTab(tab)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105 ${gearTab === tab ? 'bg-pink-500 text-white' : 'bg-white/10 text-white'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <LockerRoom playerId={player.id} activeTab={gearTab} items={mockItems[gearTab]} setSelectedItem={setSelectedItem} />
          </div>
        )}

        {player && view === 'store' && (
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-lg">
            <div className="flex gap-4 mb-4">
              {['kits', 'boots', 'badges', 'celebrations'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStoreTab(tab)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105 ${storeTab === tab ? 'bg-pink-500 text-white' : 'bg-white/10 text-white'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <LockerRoomStore playerId={player.id} activeTab={storeTab} items={mockItems[storeTab]} setSelectedItem={setSelectedItem} />
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white p-8 rounded-2xl text-black relative w-full max-w-3xl shadow-2xl">
              <button
                className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black transition"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="rounded-xl max-w-full h-auto object-contain w-[300px] md:w-[400px]"
                />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">{selectedItem.name}</h2>
                  <p className="text-lg text-gray-700">{selectedItem.xp} XP</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}