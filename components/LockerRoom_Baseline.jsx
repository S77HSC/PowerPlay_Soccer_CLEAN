'use client';

import React from 'react';
import GearCard from './GearCard';

const LockerRoom = ({ playerId, activeTab, items = [
    {
      id: 'kit1',
      name: 'Red Home Kit',
      image: '/public/LockerRoom/powerplay_kit_red.png',
      xp: 100
    },
    {
      id: 'kit2',
      name: 'Blue Away Kit',
      image: '/public/LockerRoom/powerplay_kit_blue.png',
      xp: 150
    }
  ] }) => {
  const handleUnlock = (item) => {
    console.log(`Unlocking ${item.name} for ${item.xp} XP`);
    // Simulate unlocking logic here
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {items.map(item => (
        <GearCard
          key={item.id}
          item={item}
          isUnlocked={true}
          onUnlock={handleUnlock}
        />
      ))}
    </div>
  );
};

export default LockerRoom;
