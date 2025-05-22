import Image from 'next/image';
import Link from 'next/link';

const getFlagUrl = (country) => {
  const map = {
    england: 'gb', scotland: 'gb', wales: 'gb', uk: 'gb', unitedkingdom: 'gb',
    unitedstates: 'us', usa: 'us', ireland: 'ie', spain: 'es',
    germany: 'de', france: 'fr', italy: 'it', canada: 'ca', australia: 'au',
  };
  const key = country?.toLowerCase().replace(/\s+/g, '');
  const code = map[key] || key?.slice(0, 2);
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

export default function LeaderboardPreviewCard({ players = [], showWorkouts = false, teamName = null }) {
  const medalIcons = ['🥇', '🥈', '🥉'];
  const filteredPlayers = teamName ? players.filter(p => p.team === teamName) : players;

  return (
    <Link href="/leaderboard" className="block cursor-pointer">
      <div className="bg-[#1a1a2a] border border-purple-700 p-4 rounded-xl shadow-md hover:shadow-lg transition">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
            🌍 Global Leaderboard
          </h3>
          <select className="text-sm bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">
            <option>All Time</option>
            <option>Monthly</option>
            <option>Weekly</option>
          </select>
        </div>

        <ul className="space-y-3">
            {filteredPlayers.map((player, index) => (
              <li key={player.id} className="flex items-center justify-between py-2 gap-4">
                {/* Left Group */}
                <div className="flex items-center gap-3 w-[240px]">
                  <div className="w-6 text-center text-base font-mono text-white">
                    {medalIcons[index] || `#${index + 1}`}
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-500">
                    <Image
                      src={player.avatar_url
                        ? `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`
                        : '/default-avatar.png'}
                      alt={player.name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover aspect-square"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="block font-medium text-white leading-tight w-[120px] truncate">
                      {player.name}
                    </span>
                    {player.country && (
                      <img
                        src={getFlagUrl(player.country)}
                        alt={player.country}
                        className="w-5 h-4 ml-1 rounded-sm border border-gray-600 self-center"
                      />
                    )}
                  </div>
                </div>

                {/* Bar */}
                <div className="flex-1 min-w-0">
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full"
                      style={{ width: `${Math.min((player.points || 0) / 12.25, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* XP */}
                <div className="w-16 text-right text-xs text-gray-300">
                  {player.points} XP
                </div>
              </li>
            ))}
          </ul>
      </div>
    </Link>
  );
}
