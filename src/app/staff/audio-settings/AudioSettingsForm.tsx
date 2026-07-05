"use client";

import { useState } from "react";

export function AudioSettingsForm({
  initialEnabled,
  initialLabel,
  initialUrl,
}: {
  initialEnabled: boolean;
  initialLabel: string;
  initialUrl: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [label, setLabel] = useState(initialLabel);
  const [spotifyUrl, setSpotifyUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage({});
    try {
      const response = await fetch("/api/audio-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, label, spotifyUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save Builder Radio.");
      setSpotifyUrl(data.spotifyUrl);
      setMessage({ success: "Builder Radio was verified and saved. Listeners will receive the update within one minute." });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not save Builder Radio." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
        <div><div className="text-sm font-medium">Enable Builder Radio</div><div className="mt-1 text-xs text-zinc-600">Show the shared Spotify player throughout the site.</div></div>
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-5 w-5 accent-emerald-400" />
      </label>
      <div>
        <label htmlFor="radio-label" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Station name</label>
        <input id="radio-label" value={label} onChange={(event) => setLabel(event.target.value)} required maxLength={80} placeholder="Builder Radio" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50" />
      </div>
      <div>
        <label htmlFor="spotify-url" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Spotify channel URL</label>
        <input id="spotify-url" value={spotifyUrl} onChange={(event) => setSpotifyUrl(event.target.value)} required type="url" placeholder="https://open.spotify.com/playlist/…" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50" />
        <p className="mt-2 text-xs leading-5 text-zinc-600">Paste a direct Spotify playlist, artist, album, show, episode, or track link. Spotify verifies it before the station changes.</p>
      </div>
      {message.error && <div className="rounded-xl border border-red-400/20 bg-red-400/[.06] px-4 py-3 text-sm text-red-300">{message.error}</div>}
      {message.success && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-3 text-sm text-emerald-300">{message.success}</div>}
      <button disabled={saving} className="w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-40">{saving ? "Verifying with Spotify…" : "Verify and save station"}</button>
    </form>
  );
}
