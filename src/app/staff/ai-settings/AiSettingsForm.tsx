"use client";

import { useState } from "react";

export function AiSettingsForm({
  initialModel,
  maskedKey,
  source,
}: {
  initialModel: string;
  maskedKey: string;
  source: string;
}) {
  const [model, setModel] = useState(initialModel);
  const [apiKey, setApiKey] = useState("");
  const [currentMaskedKey, setCurrentMaskedKey] = useState(maskedKey);
  const [currentSource, setCurrentSource] = useState(source);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, apiKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save AI configuration.");
      setCurrentMaskedKey(data.maskedKey);
      setCurrentSource("dashboard");
      setApiKey("");
      setMessage({ kind: "success", text: "Configuration verified with OpenRouter and saved." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not save AI configuration." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <label htmlFor="model" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">OpenRouter model ID</label>
        <input id="model" value={model} onChange={(event) => setModel(event.target.value)} required placeholder="openrouter/auto" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50" />
        <p className="mt-2 text-xs leading-5 text-zinc-600">Use <code className="text-zinc-400">openrouter/auto</code> for automatic routing, or enter an exact OpenRouter model identifier. The model is verified before saving.</p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="api-key" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">OpenRouter API key</label>
          <span className="text-[10px] text-zinc-600">{currentMaskedKey ? `${currentMaskedKey} · ${currentSource}` : "Not configured"}</span>
        </div>
        <input id="api-key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" autoComplete="new-password" placeholder={currentMaskedKey ? "Leave blank to keep the current key" : "sk-or-v1-…"} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50" />
        <p className="mt-2 text-xs leading-5 text-zinc-600">The key is encrypted with AES-256-GCM before database storage. It is never returned to this page after saving.</p>
      </div>

      {message && <div className={`rounded-xl border px-4 py-3 text-sm ${message.kind === "success" ? "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300" : "border-red-400/20 bg-red-400/[.06] text-red-300"}`}>{message.text}</div>}

      <button disabled={saving || !model.trim()} className="w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-40">
        {saving ? "Verifying with OpenRouter…" : "Verify and save configuration"}
      </button>
    </form>
  );
}
