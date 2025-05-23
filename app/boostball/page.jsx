
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function BoostBallGame() {
  const [introShown, setIntroShown] = useState(true);
  const [teamSize, setTeamSize] = useState(3);
  const [matchTime, setMatchTime] = useState(300);
  const [timer, setTimer] = useState(300);
  const [matchRunning, setMatchRunning] = useState(false);

  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [teamAName, setTeamAName] = useState("Team A");
  const [teamBName, setTeamBName] = useState("Team B");

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [log, setLog] = useState([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [goalCount, setGoalCount] = useState({}); // session goal tracking

  const resetGame = () => {
    setTeamA([]);
    setTeamB([]);
    setScoreA(0);
    setScoreB(0);
    setLog([]);
    setPlayerSearch("");
    setSearchResults([]);
    setTimer(matchTime);
    setMatchRunning(false);
    setIntroShown(true);
    setGoalCount({});
  };

  useEffect(() => {
    if (playerSearch.length >= 2) {
      fetchPlayers(playerSearch);
    } else {
      setSearchResults([]);
    }
  }, [playerSearch]);

  const fetchPlayers = async (query) => {
    const { data } = await supabase.from("players").select("*").ilike("name", `%${query}%`);
    setSearchResults(data || []);
  };

  const assignPlayer = (player, team) => {
    const exists = (team === "A" ? teamA : teamB).some(p => p.id === player.id);
    if (exists) return;
    team === "A" ? setTeamA([...teamA, player]) : setTeamB([...teamB, player]);
  };

  const addGoal = async (player, team) => {
    const name = player.name;
    console.log("GOAL triggered:", player.id, name);

    setGoalCount(prev => ({
      ...prev,
      [player.id]: (prev[player.id] || 0) + 1
    }));

    // Updating gamesPlayed every time a goal is scored
    await supabase
      .from("players")
      .update({
        gamesPlayed: (player.gamesPlayed || 0) + 1,
      })
      .eq("id", player.id);

    if (team === "A") {
      setScoreA(prev => prev + 1);
      setLog(prev => [...prev, `⚡ ${name} scored for ${teamAName}`]);
    } else {
      setScoreB(prev => prev + 1);
      setLog(prev => [...prev, `⚡ ${name} scored for ${teamBName}`]);
    }
  };

  const awardWinXP = async (teamList, didWin = false) => {
    for (let p of teamList) {
      const goalsScored = goalCount[p.id] || 0;
      const updates = {
        points: p.points + (didWin ? 50 : 10) + goalsScored * 10,
        gamesPlayed: (p.gamesPlayed || 0) + 1,
        goals: (p.goals || 0) + goalsScored
      };
      if (didWin) updates.games_won = (p.games_won || 0) + 1;

      console.log("AWARD UPDATE:", p.id, updates);

      const { error } = await supabase.from("players").update(updates).eq("id", p.id);
      if (error) {
        console.error("Supabase update error:", error.message);
      }
    }
  };

  const saveGame = async () => {
    console.log("SAVE GAME triggered");
    const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null;
    await awardWinXP(teamA, winner === "A");
    await awardWinXP(teamB, winner === "B");
    setLog(prev => [...prev, "💾 Game saved. XP awarded."]);
    alert("Game saved & XP awarded!");
  };

  useEffect(() => {
    let interval = null;
    if (matchRunning && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && matchRunning) {
      setMatchRunning(false);
    }
    return () => clearInterval(interval);
  }, [matchRunning, timer]);

  const formatTime = (t) => `${Math.floor(t / 60)}:${t % 60 < 10 ? "0" : ""}${t % 60}`;

  return (
    <div className="relative max-w-5xl mx-auto p-4 text-white bg-gray-900 min-h-screen">
      {introShown ? (
        <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col justify-center items-center animate-fadeIn">
          <img src="/boostball_logo.png" alt="BoostBall Logo" className="h-40 mb-4 animate-scaleIn" />
          <h1 className="text-5xl font-bold mb-2">POWERPLAY BOOSTBALL</h1>
          <p className="text-lg italic text-gray-300 mb-6">Real football. Supercharged.</p>
          <button onClick={() => setIntroShown(false)} className="btn bg-blue-600 animate-pulse px-6 py-2 rounded">Start Match</button>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <img src="/boostball_logo.png" alt="BoostBall Logo" className="h-32 mx-auto mb-2" />
            <h1 className="text-4xl font-bold">POWERPLAY BOOSTBALL</h1>
            <p className="italic text-gray-400 mt-1">Real football. Supercharged.</p>
          </div>

          <div className="text-center mb-6">
            <h3 className="font-bold mb-1">👥 Team Size</h3>
            {[3, 5, 7].map(size => (
              <button
                key={size}
                onClick={() => {
                  setTeamSize(size);
                  setTeamA([]);
                  setTeamB([]);
                }}
                className={`btn mx-1 ${teamSize === size ? 'bg-orange-500' : ''}`}
              >
                {size} a-side
              </button>
            ))}
          </div>

          <div className="text-center mb-6">
            <h3 className="font-bold mb-1">⏱️ Match Timer</h3>
            {[5, 10, 15, 20].map(min => (
              <button
                key={min}
                onClick={() => {
                  setMatchTime(min * 60);
                  setTimer(min * 60);
                }}
                className={`btn mx-1 ${matchTime === min * 60 ? 'bg-orange-500' : ''}`}
              >
                {min} min
              </button>
            ))}
            <div className="text-4xl font-mono my-2">{formatTime(timer)}</div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setMatchRunning(!matchRunning)} className="btn">{matchRunning ? "Pause" : "Start"}</button>
              <button onClick={() => setTimer(matchTime)} className="btn bg-red-600">Reset</button>
            </div>
          </div>

          <div className="mb-6">
            <input type="text" value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} placeholder="Search players..." className="p-2 rounded w-full text-black" />
            {searchResults.length > 0 && (
              <ul className="mt-2 space-y-2">
                {searchResults.map(player => (
                  <li key={player.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <div>{player.name} — {player.points} XP — ⚽ {player.goals || 0} — 🏆 {player.games_won || 0} Wins — 🎮 {player.gamesPlayed || 0} Played</div>
                    <div className="flex gap-2">
                      <button onClick={() => assignPlayer(player, "A")} className="btn bg-blue-600">Team A</button>
                      <button onClick={() => assignPlayer(player, "B")} className="btn bg-green-600">Team B</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[{ team: teamA, score: scoreA, name: teamAName, setName: setTeamAName, side: "A" },
              { team: teamB, score: scoreB, name: teamBName, setName: setTeamBName, side: "B" }].map(({ team, score, name, setName, side }) => (
              <div key={side} className="bg-gray-800 p-4 rounded">
                <input className="text-xl font-bold bg-transparent border-b w-full mb-2 text-center"
                  value={name} onChange={(e) => setName(e.target.value)} />
                <p className="text-2xl text-center mb-2">({score})</p>
                <ul className="space-y-1">
                  {team.map(p => (
                    <li key={p.id} className="flex justify-between items-center">
                      <span>{side === "A" ? "⚪" : "⚫"} {p.name}</span>
                      <button onClick={() => addGoal(p, side)} className="btn bg-yellow-500 text-black text-xs">+1</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-lg mb-2">📜 Match Log</h3>
            <ul className="text-sm space-y-1 text-gray-300">
              {log.map((entry, i) => <li key={i}>• {entry}</li>)}
            </ul>
            <div className="flex flex-col items-center gap-3 mt-4">
              <button onClick={saveGame} className="btn bg-green-700">💾 Save Game + Award XP</button>
              <button onClick={resetGame} className="btn bg-red-700">🔁 New Game</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
