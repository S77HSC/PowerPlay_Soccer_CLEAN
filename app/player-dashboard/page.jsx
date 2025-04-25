"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import PlayerProgressChart from "../../components/PlayerProgressChart";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PlayerDashboard() {
  const [player, setPlayer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [xp, setXp] = useState(0);
  const [workouts, setWorkouts] = useState(0);
  const [wins, setWins] = useState(0);
  const [selectedRange, setSelectedRange] = useState("Weekly");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPlayerData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('players')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (error || !profile) {
        router.push('/setup');
        return;
      }

      setPlayer(profile);
      setLoading(false);
    };

    loadPlayerData();
  }, [router]);

  useEffect(() => {
    if (!player?.id) return;

    const fetchData = async () => {
      const { data: sessionData, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("player_id", player.id);

      if (sessionError) {
        console.error("Failed to fetch sessions", sessionError);
        return;
      }

      setSessions(sessionData || []);
      setXp(sessionData.reduce((sum, s) => sum + (s.xr_awarded || 0), 0));
      setWorkouts(sessionData.length);
      setWins(sessionData.filter(s => s.is_win).length);
    };

    fetchData();
  }, [player]);

  if (loading) {
    return <div className="text-white text-center mt-10">Loading dashboard...</div>;
  }

  const groupedData = {};
  (sessions || []).forEach((session) => {
    const date = new Date(session.completed_at);
    let key;

    if (selectedRange === "Monthly") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else if (selectedRange === "Daily") {
      key = date.toISOString().split("T")[0];
    } else {
      const firstDayOfWeek = new Date(date);
      firstDayOfWeek.setDate(date.getDate() - date.getDay());
      key = firstDayOfWeek.toISOString().split("T")[0];
    }

    if (!groupedData[key]) {
      groupedData[key] = { xp: 0, workouts: 0 };
    }

    groupedData[key].xp += session.xr_awarded || 0;
    groupedData[key].workouts += 1;
  });

  const labels = Object.keys(groupedData);
  const xpValues = labels.map((key) => groupedData[key].xp);
  const workoutCounts = labels.map((key) => groupedData[key].workouts);

  const chartData = {
    labels,
    datasets: [
      {
        label: "XP Gained",
        data: xpValues,
        backgroundColor: "#facc15",
      },
      {
        label: "Workouts",
        data: workoutCounts,
        backgroundColor: "#4ade80",
      },
    ],
  };

  const timeChartData = {
    labels,
    datasets: [
      {
        label: "Time Spent (min)",
        data: labels.map(label => {
          const sessionsOnDate = sessions.filter(s => {
            const date = new Date(s.completed_at);
            const formatted = selectedRange === "Daily" ? date.toISOString().split("T")[0] :
              selectedRange === "Monthly" ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` :
              (() => {
                const firstDayOfWeek = new Date(date);
                firstDayOfWeek.setDate(date.getDate() - date.getDay());
                return firstDayOfWeek.toISOString().split("T")[0];
              })();
            return formatted === label;
          });
          return parseFloat(sessionsOnDate.reduce((acc, s) => acc + ((s.work_time || 0) * (s.reps || 0)) / 60, 0).toFixed(1));
        }),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.3)",
        fill: true,
        tension: 0.4,
      },
    ]
  };

  const skillsGrouped = {};
  (sessions || []).forEach((s) => {
    if (!skillsGrouped[s.skill_name]) {
      skillsGrouped[s.skill_name] = 0;
    }
    skillsGrouped[s.skill_name] += ((s.work_time || 0) * (s.reps || 0)) / 60;
  });

  const skillTimeChart = {
    labels: Object.keys(skillsGrouped),
    datasets: [
      {
        label: "Time per Skill (min)",
        data: Object.values(skillsGrouped),
        backgroundColor: "#818cf8"
      }
    ]
  };

  return (
    <div style={{ background: "#0A0F24", color: "white", padding: "2rem", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => router.push('/skill-session')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded shadow transition"
          >
            ➕ Start New Workout Session
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between bg-gray-900 p-6 rounded-lg shadow mb-8">
          <div className="flex items-center gap-4">
            {player?.avatar_url ? (
              <img
                src={`https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`}
                alt={player.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
              />
            ) : (
              <img
                src="/default-avatar.png"
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-cyan-400">{player?.name}</h2>
              <p className="text-sm text-gray-400">{player?.team}</p>
            </div>
          </div>

          <div className="flex gap-6 mt-4 md:mt-0">
            <PlayerProgressChart value={xp % 1000} label="XP" color="#facc15" />
            <PlayerProgressChart value={workouts} label="Sessions" color="#4ade80" />
            <PlayerProgressChart value={wins} label="Wins" color="#60a5fa" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">📊 Player Dashboard</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-1">Select Range:</label>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="text-black px-3 py-2 rounded border border-gray-300"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">📈 XP & Workouts Over Time</h2>
          <Bar data={chartData} />
        </div>

        <div className="bg-gray-900 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">⏱ Time Spent per Period</h2>
          <Bar data={timeChartData} />
        </div>

        <div className="bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">⚽️ Time per Skill</h2>
          <Bar data={skillTimeChart} />
        </div>
      </div>
    </div>
  );
}
