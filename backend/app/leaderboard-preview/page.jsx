'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LeaderboardPreviewCard from '../../components/LeaderboardPreviewCard'; // ✅ Relative path

export default function LeaderboardPreview() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
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

      setPlayers(data || []);
    };

    fetchLeaders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <LeaderboardPreviewCard players={players} />
    </div>
  );
}
