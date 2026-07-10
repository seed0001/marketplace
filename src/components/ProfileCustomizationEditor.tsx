"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileThemes } from "@/lib/profile-customization";

type Song = {
  id?: string;
  title: string;
  artist: string | null;
  url: string;
};

type ProfileCustomization = {
  profileBio: string | null;
  profileStatus: string | null;
  profileCoverImage: string | null;
  profileBackgroundImage: string | null;
  profileAccentColor: string;
  profileTheme: string;
  profileSongs: Song[];
};

const EMPTY_SONG: Song = { title: "", artist: "", url: "" };

export function ProfileCustomizationEditor({
  initialProfile,
}: {
  initialProfile: ProfileCustomization;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialProfile.profileBio || "");
  const [status, setStatus] = useState(initialProfile.profileStatus || "");
  const [coverImage, setCoverImage] = useState(initialProfile.profileCoverImage || "");
  const [backgroundImage, setBackgroundImage] = useState(initialProfile.profileBackgroundImage || "");
  const [accentColor, setAccentColor] = useState(initialProfile.profileAccentColor || "#34d399");
  const [theme, setTheme] = useState(initialProfile.profileTheme || "midnight");
  const [songs, setSongs] = useState<Song[]>(initialProfile.profileSongs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function updateSong(index: number, field: keyof Song, value: string) {
    setSongs((current) =>
      current.map((song, songIndex) =>
        songIndex === index ? { ...song, [field]: value } : song,
      ),
    );
  }

  function reset() {
    setBio(initialProfile.profileBio || "");
    setStatus(initialProfile.profileStatus || "");
    setCoverImage(initialProfile.profileCoverImage || "");
    setBackgroundImage(initialProfile.profileBackgroundImage || "");
    setAccentColor(initialProfile.profileAccentColor || "#34d399");
    setTheme(initialProfile.profileTheme || "midnight");
    setSongs(initialProfile.profileSongs);
    setEditing(false);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/customization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileBio: bio,
          profileStatus: status,
          profileCoverImage: coverImage,
          profileBackgroundImage: backgroundImage,
          profileAccentColor: accentColor,
          profileTheme: theme,
          songs: songs.filter((song) => song.url.trim()),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save profile.");
      setSongs(data.profileSongs || []);
      setMessage({ kind: "success", text: "Profile vibe saved." });
      setEditing(false);
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not save profile." });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <section className="mb-12 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Edit profile vibe</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Customize your cover, background, colors, bio, and up to five favorite Spotify or YouTube songs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (songs.length === 0) setSongs([{ ...EMPTY_SONG }]);
              setEditing(true);
              setMessage(null);
            }}
            className="shrink-0 rounded-full border border-emerald-500/40 px-4 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10"
          >
            Customize
          </button>
        </div>
        {message && (
          <p className={`mt-3 text-sm ${message.kind === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="mb-12 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Profile vibe</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Visual customization is controlled so profiles stay expressive without breaking the marketplace layout.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-zinc-400">
          Status line
          <input
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            maxLength={140}
            placeholder="Currently building calm tools for loud days"
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <label className="text-xs font-medium text-zinc-400">
          Theme
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {profileThemes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-400">
          Cover image URL
          <input
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            placeholder="https://..."
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <label className="text-xs font-medium text-zinc-400">
          Background image URL
          <input
            value={backgroundImage}
            onChange={(event) => setBackgroundImage(event.target.value)}
            placeholder="https://..."
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <label className="text-xs font-medium text-zinc-400">
          Accent color
          <div className="mt-1.5 flex rounded-lg border border-white/10 bg-black/20 p-1 focus-within:border-emerald-500">
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="h-9 w-12 shrink-0 border-0 bg-transparent"
            />
            <input
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              maxLength={7}
              className="min-w-0 flex-1 bg-transparent px-2 font-mono text-sm outline-none"
            />
          </div>
        </label>
        <label className="text-xs font-medium text-zinc-400 sm:col-span-2">
          Bio
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={700}
            rows={4}
            placeholder="Tell visitors what you build, what you care about, and what kind of work feels like you."
            className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Favorite songs</h3>
            <p className="mt-1 text-xs text-zinc-500">Add up to five Spotify track or YouTube video links.</p>
          </div>
          {songs.length < 5 && (
            <button
              type="button"
              onClick={() => setSongs((current) => [...current, { ...EMPTY_SONG }])}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              + Add song
            </button>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {songs.map((song, index) => (
            <div key={song.id || index} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Song {index + 1}</span>
                <button
                  type="button"
                  onClick={() => setSongs((current) => current.filter((_, songIndex) => songIndex !== index))}
                  className="text-xs text-zinc-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={song.title}
                  onChange={(event) => updateSong(index, "title", event.target.value)}
                  maxLength={90}
                  placeholder="Song title"
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <input
                  value={song.artist || ""}
                  onChange={(event) => updateSong(index, "artist", event.target.value)}
                  maxLength={90}
                  placeholder="Artist or channel"
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <input
                value={song.url}
                onChange={(event) => updateSong(index, "url", event.target.value)}
                placeholder="https://open.spotify.com/track/... or https://www.youtube.com/watch?v=..."
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          ))}
          {songs.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-600">No songs added.</p>}
        </div>
      </div>

      {message && (
        <p className={`mt-4 text-sm ${message.kind === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={saving}
          className="rounded-full border border-border px-5 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
