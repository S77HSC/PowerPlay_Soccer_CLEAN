import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";
import { useSearchParams, useRouter } from "next/navigation";

const sessionData = {
  session_1_toetaps: {
    title: "Skill Session 1: Toe Taps",
    video: "/videos/session_1_toetaps.mp4",
    description: "Quick footwork drill to improve control and rhythm using alternate toe taps.",
    thumbnail: "/videos/session_1_toetaps-thumbnail.jpg",
    unlockXP: 0,
  },
  session_2_ticktocks: {
    title: "Skill Session 2: Tick Tocks",
    video: "/videos/session_2_ticktocks.mp4",
    description: "A controlled inside-outside rhythm drill to master tight ball control.",
    thumbnail: "/videos/session_2_ticktocks-thumbnail.jpg",
    unlockXP: 0,
  },
  session_3_ticktockstops: {
    title: "Skill Session 3: Tick Tock Stops",
    video: "/videos/session_3_ticktockstops.mp4",
    description: "Master control transitions with this stop-and-go variation of tick tocks.",
    thumbnail: "/videos/session_3_ticktockstops-thumbnail.jpg",
    unlockXP: 200,
  },
  session_4_outsidetakestop: {
    title: "Skill Session 4: Outside Take Stop",
    video: "/videos/session_4_outside-take-stop.mp4",
    description: "Take the ball with the outside of the foot, then stop it quickly.",
    thumbnail: "/videos/session_4_outside-take-stop.jpg",
    unlockXP: 300,
  },
  session_5_ticktocksoleroll: {
    title: "Skill Session 5: Tick Tock Sole Roll",
    video: "/videos/session_5_tick-tock-sole-roll.mp4",
    description: "Sole roll added to tick tocks for advanced ball movement.",
    thumbnail: "/videos/session_5_tick-tock-sole-roll.jpg",
    unlockXP: 400,
  },
  session_6_ticktockoutsidein: {
    title: "Skill Session 6: Tick Tock Outside-In",
    video: "/videos/session_6_tick-tock-outside-in.mp4",
    description: "Use outside-in touches to build variation into your tick tocks.",
    thumbnail: "/videos/session_6_tick-tock-outside-in.jpg",
    unlockXP: 500,
  },
};

export default function SkillSession() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionKey = searchParams.get("session") || "session_1_toetaps";
  const session = sessionData[sessionKey];

  const [player, setPlayer] = useState(null);
  const [points, setPoints] = useState(0);
  const [reps, setReps] = useState(1);
  const [time, setTime] = useState(10);
  const [rest, setRest] = useState(5);
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [showXpModal, setShowXpModal] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef(null);
  const XP_GOAL = 100;
  const XP_MULTIPLIER = 1;

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("players").select("*").eq("auth_id", user.id).single();
        if (data) {
          setPlayer(data);
          setPoints(data.points || 0);
        }
      }
    };
    fetchPlayer();
  }, []);

  useEffect(() => {
    if (isRunning && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      if (isRunning && countdown === 0) {
        if (isResting) {
          setCountdown(time);
          setIsResting(false);
        } else {
          if (currentRep + 1 >= reps) {
            new Audio("/session-complete.mp3").play().catch(() => {});
            handleXpUpdate();
            setIsRunning(false);
            setIsResting(false);
            setCurrentRep(0);
          } else {
            new Audio("/rest-now.mp3").play().catch(() => {});
            setCountdown(rest);
            setIsResting(true);
            setCurrentRep((prev) => prev + 1);
          }
        }
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, countdown]);

  const startTimer = () => {
    new Audio("/race-start-beeps-125125.mp3").play().then(() => {
      setTimeout(() => {
        setCurrentRep(0);
        setIsResting(false);
        setCountdown(time);
        setIsRunning(true);
      }, 3000);
    }).catch(() => {
      setCurrentRep(0);
      setIsResting(false);
      setCountdown(time);
      setIsRunning(true);
    });
  };

  const handleXpUpdate = async () => {
    const gained = reps * time * XP_MULTIPLIER;
    const newPoints = points + gained;
    setXpEarned(gained);
    setShowXpModal(true);
    setTimeout(() => setShowXpModal(false), 4000);

    if (player) {
      await supabase.from("workout_sessions").insert([{
        player_id: player.id,
        completed_at: new Date().toISOString(),
        xr_awarded: gained,
        reps,
        work_time: time,
        rest_time: rest,
        skill_name: sessionKey
      }]);

      await supabase.from("players").update({ points: newPoints }).eq("id", player.id);
      setPoints(newPoints);
      if (Math.floor(newPoints / XP_GOAL) > Math.floor(points / XP_GOAL)) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handleSessionSelect = (key) => {
    router.push(`/skill-session?session=${key}`);
  };

  return (
    <div key={sessionKey} style={{ backgroundColor: "#0A0F24", color: "#fff", padding: "2rem", fontFamily: "Arial, sans-serif", position: "relative" }}>
      {showXpModal && (
        <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", backgroundColor: "#1e293b", padding: "1.5rem 2rem", borderRadius: "12px", boxShadow: "0 0 10px #00b4d8", zIndex: 999, textAlign: "center" }}>
          <h3 style={{ color: "#38bdf8", marginBottom: "0.5rem" }}>🎉 XP Earned!</h3>
          <p style={{ fontSize: "20px", fontWeight: "bold" }}>{xpEarned} XP</p>
        </div>
      )}

      {player && (
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src="/powerplay-logo.png" alt="PowerPlay Logo" style={{ height: "100px", marginBottom: "10px" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src={player.avatar_url?.startsWith("http") ? player.avatar_url : `https://uitlajpnqruvvykrcyyg.supabase.co/storage/v1/object/public/avatars/${player.avatar_url}`}
              alt="avatar"
              style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid #00b4d8", objectFit: "cover" }}
            />
            <p style={{ fontWeight: "bold", fontSize: "18px", margin: 0 }}>{player.name}</p>
            <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>{player.country}</p>
          </div>
        </div>
      )}

      <h2 style={{ textAlign: "center", color: "#38bdf8" }}>{session?.title}</h2>
      <video width="100%" controls style={{ borderRadius: "10px", marginBottom: "8px" }}>
        <source src={session?.video} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <p style={{ fontSize: "14px", color: "#ddd", textAlign: "center" }}>{session?.description}</p>

      <div style={{ textAlign: "left", maxWidth: "300px", margin: "0 auto", marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ width: "60px" }}>Reps</label>
          <input type="number" value={reps} onChange={(e) => setReps(parseInt(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ width: "60px" }}>Time (s)</label>
          <input type="number" value={time} onChange={(e) => setTime(parseInt(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ width: "60px" }}>Rest (s)</label>
          <input type="number" value={rest} onChange={(e) => setRest(parseInt(e.target.value) || 0)} style={inputStyle} />
        </div>
      </div>

      <h2 style={{ fontSize: "48px", textAlign: "center", margin: "20px 0" }}>{countdown}s</h2>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "2rem" }}>
        <button onClick={startTimer} style={buttonStyle("green")}>Start</button>
        <button onClick={() => setIsRunning(false)} style={buttonStyle("red")}>Stop</button>
        <button onClick={() => { setCountdown(0); setCurrentRep(0); setIsResting(false); }} style={buttonStyle("blue")}>Reset</button>
      </div>

      <p style={{ textAlign: "center" }}>Level {Math.floor(points / XP_GOAL)}</p>
      <p style={{ textAlign: "center" }}>{points % XP_GOAL} / {XP_GOAL} XP</p>
      <div style={{ height: "16px", backgroundColor: "#333", borderRadius: "8px", overflow: "hidden", width: "300px", margin: "0 auto", boxShadow: "0 0 8px #00b4d8" }}>
        <div style={{ height: "100%", width: `${(points % XP_GOAL / XP_GOAL) * 100}%`, background: "linear-gradient(90deg, #00b4d8, #0077b6)", transition: "width 0.5s ease", borderRadius: "999px" }}></div>
      </div>

      <h3 style={{ marginTop: "2rem", marginBottom: "1rem", color: "#7dd3fc" }}>Other Skills</h3>
      <div style={{ display: "flex", overflowX: "auto", gap: "1rem", paddingBottom: "1rem" }}>
        {Object.entries(sessionData).map(([key, info]) => {
          const unlocked = points >= info.unlockXP;
          return (
            <div key={key} style={{ background: "#1c1f2b", padding: "1rem", borderRadius: "10px", width: "220px", textAlign: "center", flex: "0 0 auto" }}>
              <img src={info.thumbnail} alt={info.title} style={{ width: "100%", borderRadius: "8px", marginBottom: "0.5rem" }} />
              <h4>{info.title}</h4>
              <p style={{ fontSize: "13px", color: "#ccc" }}>{info.description}</p>
              {unlocked ? (
                <button onClick={() => handleSessionSelect(key)} style={{ marginTop: "0.5rem" }}>View</button>
              ) : (
                <p style={{ color: "#999", marginTop: "0.5rem" }}>🔒 Unlocks at {info.unlockXP} XP</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "8px 0",
  fontSize: "16px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  color: "#000",
  backgroundColor: "#fff"
};

const buttonStyle = (color) => ({
  backgroundColor: color,
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer"
});

