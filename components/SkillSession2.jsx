// SessionList.jsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function SessionList() {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("players")
          .select("*")
          .eq("auth_id", user.id)
          .single();
        if (data) {
          setPlayer(data);
        }
      }
      setLoading(false);
    };
    fetchPlayer();
  }, []);

  const unlockSession = async () => {
    const updated = [...(player.unlocked_sessions || []), "session_2_ticktocks"];
    await supabase
      .from("players")
      .update({ unlocked_sessions: updated })
      .eq("id", player.id);
    setPlayer({ ...player, unlocked_sessions: updated });
  };

  if (loading) return <p style={{ color: "white" }}>Loading...</p>;
  if (!player) return <p style={{ color: "red" }}>No player data found.</p>;

  const canAccessSession2 =
    (player.unlocked_sessions || []).includes("session_2_ticktocks") || player.points >= 100;

  return (
    <div style={{ color: "white", padding: "2rem" }}>
      <h2 style={{ color: "#7dd3fc" }}>Skill Sessions</h2>

      <div style={cardStyle}>
        <h3>Session 1: Toe Taps</h3>
        <p>Develop quick footwork with toe taps!</p>
        <button onClick={() => router.push("/skill-session?session=session_1_toetaps")}>Start</button>
      </div>

      <div style={cardStyle}>
        <h3>Session 2: Tick Tocks</h3>
        <p>Master rhythm and control with tick tocks.</p>
        {canAccessSession2 ? (
          <button onClick={() => router.push("/skill-session?session=session_2_ticktocks")}>Start</button>
        ) : (
          <button onClick={unlockSession}>Unlock (100 XP or purchase)</button>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#1c1f2b",
  padding: "1rem",
  borderRadius: "10px",
  marginBottom: "1rem",
};
