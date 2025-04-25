'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateFixtures } from '../../../powerplay-soccer/sacrifice/leagueEngine';
import BrandHeader from '../../../components/BrandHeader';
import Image from 'next/image';

function generateCupFixtures(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const round = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    if (home && away) {
      round.push({ home, away });
    }
  }
  return [{ matchday: 1, fixtures: round }];
}

export default function FixturesScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tournamentName = searchParams.get('name') || 'Unnamed Tournament';
  const tournamentType = searchParams.get('type') || 'league';
  const matchesPerTeam = tournamentType === 'league' ? parseInt(searchParams.get('matches'), 10) || 1 : 1;

  const [decodedTeams, setDecodedTeams] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    const encoded = searchParams.get('teams');
    if (encoded) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
        setDecodedTeams(decoded);
        setTeamList(decoded.map(t => t.name));
      } catch (err) {
        console.error("Failed to decode teams", err);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (teamList.length > 1) {
      if (tournamentType === 'league') {
        const result = generateFixtures([...teamList], matchesPerTeam);
        setFixtures(result);
      } else if (tournamentType === 'cup') {
        const result = generateCupFixtures([...teamList]);
        setFixtures(result);
      }
    }
  }, [teamList, tournamentType, matchesPerTeam]);

  const startTournament = () => {
    const encodedTeams = btoa(encodeURIComponent(JSON.stringify(decodedTeams)));
    const encodedFixtures = btoa(encodeURIComponent(JSON.stringify(fixtures)));
    const query = new URLSearchParams({
      name: tournamentName,
      teams: encodedTeams,
      fixtures: encodedFixtures
    }).toString();
    router.push(`/sacrifice-league/play?${query}`);
  };

  return (
    <main className="bg-gradient-to-br from-[#050A1F] to-[#0c1228] min-h-screen px-4 py-10 text-white max-w-xl mx-auto">
      <BrandHeader />
      <div className="flex justify-center mt-4 mb-6">
        <Image src="/tournament-sparkle.png" alt="Tournament Logo" width={80} height={80} />
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-500 text-center mb-2">Create Fixtures</h1>
        <div className="text-center mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">Tournament Format</label>
          <div className="flex justify-center gap-4">
            <span className="bg-blue-700 text-white py-1 px-4 rounded-full text-sm capitalize">
              {tournamentType}
            </span>
          </div>
          {tournamentType === 'league' && (
            <p className="text-sm text-gray-400 mt-2">Matches per team: {matchesPerTeam}</p>
          )}
        </div>
      </div>
      <h2 className="text-center mb-4 text-lg">{tournamentName}</h2>

      {fixtures.length === 0 && (
        <p className="text-center text-gray-400">No fixtures generated. Please check team setup.</p>
      )}

      {fixtures.map((round, i) => (
        <div key={i} className="mb-4 bg-[#1b223b] p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Matchday {round.matchday}</h3>
          <ul className="space-y-1 text-sm">
            {round.fixtures.map((match, j) => (
              <li key={j}>{match.home} vs {match.away}</li>
            ))}
          </ul>
        </div>
      ))}

      <button
        disabled={fixtures.length === 0}
        className={`w-full mt-6 font-bold py-2 rounded ${
          fixtures.length > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'
        }`}
        onClick={startTournament}
      >
        Start Tournament ➔
      </button>
    </main>
  );
}
