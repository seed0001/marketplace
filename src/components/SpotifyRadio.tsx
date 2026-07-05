"use client";

import { useEffect, useRef, useState } from "react";

type RadioSettings = {
  enabled: boolean;
  label: string;
  spotifyUrl: string | null;
  updatedAt?: string;
};

type SpotifyController = {
  play(): void;
  pause(): void;
  togglePlay(): void;
  loadEntity(url: string): void;
  destroy(): void;
  addListener(event: string, callback: (event: { data?: { isPaused?: boolean } }) => void): void;
};

type SpotifyIFrameApi = {
  createController(
    element: HTMLElement,
    options: { url: string; width: string; height: number },
    callback: (controller: SpotifyController) => void,
  ): void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void;
    vibemarketSpotifyApi?: SpotifyIFrameApi;
  }
}

export function SpotifyRadio() {
  const [settings, setSettings] = useState<RadioSettings | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);

  useEffect(() => {
    queueMicrotask(() => setHidden(localStorage.getItem("vm_builder_radio_hidden") === "true"));
    const load = () => fetch("/api/audio-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSettings(data))
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!settings?.enabled || !settings.spotifyUrl || !mountRef.current) return;
    if (controllerRef.current) {
      controllerRef.current.loadEntity(settings.spotifyUrl);
      return;
    }
    setPlayerStatus("loading");
    let readyTimer: number | undefined;

    const create = (api: SpotifyIFrameApi) => {
      window.vibemarketSpotifyApi = api;
      if (!mountRef.current || controllerRef.current || !settings.spotifyUrl) return;
      api.createController(
        mountRef.current,
        { url: settings.spotifyUrl, width: "100%", height: 152 },
        (controller) => {
          controllerRef.current = controller;
          readyTimer = window.setTimeout(() => setPlayerStatus("error"), 12000);
          controller.addListener("ready", () => {
            if (readyTimer) window.clearTimeout(readyTimer);
            setPlayerStatus("ready");
          });
          controller.addListener("playback_update", (event) => {
            if (typeof event.data?.isPaused === "boolean") setPlaying(!event.data.isPaused);
          });
          controller.addListener("playback_started", () => {
            setPlayerStatus("ready");
            setPlaying(true);
          });
        },
      );
    };

    if (window.vibemarketSpotifyApi) {
      create(window.vibemarketSpotifyApi);
    } else {
      window.onSpotifyIframeApiReady = create;
      if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
        const script = document.createElement("script");
        script.src = "https://open.spotify.com/embed/iframe-api/v1";
        script.async = true;
        script.addEventListener("error", () => setPlayerStatus("error"), { once: true });
        document.body.appendChild(script);
      }
    }
    return () => {
      if (readyTimer) window.clearTimeout(readyTimer);
    };
  }, [settings?.enabled, settings?.spotifyUrl, reloadKey]);

  useEffect(() => () => controllerRef.current?.destroy(), []);

  if (!settings?.enabled || !settings.spotifyUrl) return null;

  function toggleHidden() {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem("vm_builder_radio_hidden", String(next));
  }

  function resetPlayer() {
    controllerRef.current?.destroy();
    controllerRef.current = null;
    setPlaying(false);
    setPlayerStatus("loading");
    setReloadKey((value) => value + 1);
  }

  function togglePlayback() {
    if (playerStatus === "error") {
      resetPlayer();
      return;
    }
    if (playerStatus !== "ready" || !controllerRef.current) {
      setExpanded(true);
      return;
    }
    controllerRef.current.togglePlay();
  }

  return (
    <>
      {hidden && (
      <button onClick={toggleHidden} aria-label="Show Builder Radio" className="fixed bottom-4 right-4 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/30 bg-[#111513] text-lg shadow-2xl shadow-black/50 hover:border-emerald-300/60">
        ♫
      </button>
      )}
    <aside aria-hidden={hidden} className={`fixed bottom-3 left-1/2 z-[80] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#0d1110]/95 shadow-2xl shadow-black/60 backdrop-blur-xl transition ${hidden ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100"}`}>
      <div className="flex h-14 items-center gap-3 px-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1ed760] text-base font-black text-black">♫</div>
        <button onClick={togglePlayback} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm text-white transition ${playerStatus === "error" ? "border-red-400/30 bg-red-400/10" : "border-white/10 bg-white/[.05] hover:bg-white/10"}`} aria-label={playerStatus === "error" ? "Retry Builder Radio" : playing ? "Pause Builder Radio" : "Play Builder Radio"}>
          {playerStatus === "error" ? "↻" : playerStatus === "loading" ? "…" : playing ? "Ⅱ" : "▶"}
        </button>
        <button onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left">
          <div className="truncate text-xs font-semibold text-zinc-100">{settings.label}</div>
          <div className={`mt-0.5 text-[9px] uppercase tracking-[.14em] ${playerStatus === "error" ? "text-red-400" : "text-emerald-400"}`}>
            {playerStatus === "error" ? "Spotify did not initialize · tap retry" : playerStatus === "loading" ? "Connecting to Spotify…" : playing ? "Playing through Spotify" : "Ready · press play"}
          </div>
        </button>
        <button onClick={() => { controllerRef.current?.pause(); setPlaying(false); }} disabled={playerStatus !== "ready"} className="rounded-lg px-2 py-1.5 text-[10px] text-zinc-500 hover:bg-white/5 hover:text-zinc-200 disabled:opacity-30" title="Pause audio">Mute</button>
        <button onClick={() => setExpanded((value) => !value)} className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-200" aria-label={expanded ? "Collapse Spotify controls" : "Expand Spotify controls"}>{expanded ? "⌄" : "⌃"}</button>
        <button onClick={toggleHidden} className="rounded-lg px-2 py-1.5 text-xs text-zinc-600 hover:bg-white/5 hover:text-zinc-200" aria-label="Hide Builder Radio">×</button>
      </div>
      <div className={`${expanded ? "h-[166px] border-t border-white/[.06] p-2" : "h-0"} overflow-hidden transition-[height] duration-200`}>
        <div key={reloadKey} ref={mountRef} className="h-[152px] w-full overflow-hidden rounded-xl" />
        {expanded && <p className="mt-1 text-center text-[8px] text-zinc-700">Volume is controlled by Spotify or your device.</p>}
      </div>
    </aside>
    </>
  );
}
