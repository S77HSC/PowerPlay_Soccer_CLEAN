export const dynamic = 'force-dynamic';
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PlayerSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    country: "",
    team: "",
    age: "",
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        setForm((prev) => ({ ...prev, name: data.user.email.split("@")[0] }));
      }
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files[0]) {
      setForm((prev) => ({ ...prev, avatar: files[0] }));
      setAvatarPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);

    let avatar_url = null;
    if (form.avatar) {
      const fileExt = form.avatar.name.split(".").pop();
      const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const filePath = `${user.id}/${uniqueSuffix}.${fileExt}`;

      console.log("Uploading to:", filePath);
      console.log("User ID:", user?.id);

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, form.avatar);

      if (error) {
        console.error("Upload error:", error.message);
        setError("Failed to upload avatar: " + error.message);
        setUploading(false);
        return;
      }
      avatar_url = data.path;
    }

    let playerId = null;

    // Check if player exists using auth_id (UUID)
    const { data: existingPlayer, error: checkError } = await supabase
      .from("players")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      setError("Error checking player existence");
      setUploading(false);
      return;
    }

    if (!existingPlayer) {
      // Insert new player row
      const { data: insertData, error: insertError } = await supabase
        .from("players")
        .insert({
          auth_id: user.id,
          name: form.name,
          country: form.country,
          team: form.team,
          avatar_url,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setUploading(false);
        return;
      }
      playerId = insertData.id;
    } else {
      // Update existing player row
      const { error: updateError } = await supabase
        .from("players")
        .update({
          name: form.name,
          country: form.country,
          team: form.team,
          avatar_url,
        })
        .eq("auth_id", user.id);

      if (updateError) {
        setError(updateError.message);
        setUploading(false);
        return;
      }

      playerId = existingPlayer.id;
    }

    router.push(`/player/${playerId}`);
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md max-w-md w-full space-y-4"
      >
        <h1 className="text-xl font-bold text-blue-700">📝 Complete Your Profile</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Your display name"
          value={form.name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="text"
          name="country"
          placeholder="Country (e.g. England)"
          value={form.country}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="text"
          name="team"
          placeholder="Team name"
          value={form.team}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="file"
          accept="image/*"
          name="avatar"
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        {avatarPreview && (
          <img
            src={avatarPreview}
            alt="Avatar Preview"
            className="w-24 h-24 rounded-full object-cover mx-auto mt-2 border shadow-md"
          />
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {uploading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

