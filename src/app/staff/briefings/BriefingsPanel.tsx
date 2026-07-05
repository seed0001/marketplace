"use client";

import { useEffect, useRef, useState } from "react";

type Kind = "owner_marketplace" | "seller_business";

export function BriefingsPanel({
  initialModel,
  initialReferenceId,
  maskedKey,
  source,
}: {
  initialModel: string;
  initialReferenceId: string;
  maskedKey: string;
  source: string;
}) {
  const [model, setModel] = useState(initialModel);
  const [referenceId, setReferenceId] = useState(initialReferenceId);
  const [apiKey, setApiKey] = useState("");
  const [keyLabel, setKeyLabel] = useState(maskedKey);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState<Kind | null>(null);
  const [report, setReport] = useState<{ title: string; script: string } | null>(null);
  const [message, setMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrl = useRef("");

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/tts-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, referenceId, apiKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save Fish Audio settings.");
      setKeyLabel(data.maskedKey);
      setApiKey("");
      setMessage("Fish Audio key verified and configuration saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save Fish Audio settings.");
    } finally {
      setSaving(false);
    }
  }

  async function generate(kind: Kind) {
    setWorking(kind);
    setMessage("");
    try {
      const reportResponse = await fetch("/api/admin/briefings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const nextReport = await reportResponse.json();
      if (!reportResponse.ok) throw new Error(nextReport.error || "Could not compile the briefing.");
      setReport(nextReport);

      const speechResponse = await fetch("/api/admin/briefings/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nextReport.script }),
      });
      if (!speechResponse.ok) {
        const error = await speechResponse.json();
        throw new Error(error.error || "Could not generate speech.");
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(await speechResponse.blob());
      if (audioRef.current) {
        audioRef.current.src = objectUrl.current;
        await audioRef.current.play();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate the briefing.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-5 rounded-2xl border border-white/10 bg-white/[.025] p-6">
        <div>
          <label htmlFor="fish-model" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Fish Audio model</label>
          <input id="fish-model" required value={model} onChange={(event) => setModel(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50" />
          <p className="mt-2 text-xs text-zinc-600">Default: <code className="text-emerald-300">s2.1-pro-free</code>. This exact value is sent in Fish Audio&apos;s model header.</p>
        </div>
        <div>
          <label htmlFor="fish-voice" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Voice reference ID <span className="normal-case text-zinc-700">(optional)</span></label>
          <input id="fish-voice" value={referenceId} onChange={(event) => setReferenceId(event.target.value)} placeholder="Fish Audio voice/model ID" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50" />
        </div>
        <div>
          <div className="flex justify-between gap-4"><label htmlFor="fish-key" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Fish Audio API key</label><span className="text-[10px] text-zinc-600">{keyLabel ? `${keyLabel} · ${source}` : "Not configured"}</span></div>
          <input id="fish-key" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={keyLabel ? "Leave blank to keep current key" : "Enter Fish Audio API key"} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50" />
        </div>
        <button disabled={saving || !model.trim()} className="w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-40">{saving ? "Verifying…" : "Verify and save Fish Audio"}</button>
      </form>

      <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
        <h2 className="font-semibold">Manual spoken reports</h2>
        <p className="mt-1 text-xs leading-5 text-zinc-600">Owner-only for now. Seller access and scheduled generation are reserved but disabled.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button onClick={() => generate("owner_marketplace")} disabled={Boolean(working)} className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.05] p-4 text-left disabled:opacity-40"><span className="block text-sm font-medium text-emerald-300">{working === "owner_marketplace" ? "Compiling…" : "Play owner briefing"}</span><span className="mt-1 block text-xs text-zinc-600">Marketplace activity, members, listings, demand, and priorities.</span></button>
          <button onClick={() => generate("seller_business")} disabled={Boolean(working)} className="rounded-xl border border-violet-400/20 bg-violet-400/[.05] p-4 text-left disabled:opacity-40"><span className="block text-sm font-medium text-violet-300">{working === "seller_business" ? "Compiling…" : "Play my seller briefing"}</span><span className="mt-1 block text-xs text-zinc-600">Your listings, attention, buyer interest, and next actions.</span></button>
        </div>
        <audio ref={audioRef} controls className="mt-5 w-full" />
        {report && <div className="mt-5 rounded-xl border border-white/[.07] bg-black/20 p-4"><div className="text-xs font-semibold text-zinc-300">{report.title}</div><p className="mt-2 text-xs leading-5 text-zinc-500">{report.script}</p></div>}
      </section>
      {message && <div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-zinc-300">{message}</div>}
    </div>
  );
}
