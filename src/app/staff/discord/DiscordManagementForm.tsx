"use client";

import { useState } from "react";

type Channel = {
  eventType: string;
  label: string;
  channelId: string | null;
  channelName: string | null;
  systemPrompt: string;
  enabled: boolean;
  mentionRoleId: string | null;
};

type Delivery = {
  id: string;
  eventType: string;
  title: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

export function DiscordManagementForm({
  initialSettings,
  initialChannels,
  deliveries,
}: {
  initialSettings: {
    enabled: boolean;
    guildId: string;
    applicationId: string;
    openRouterModel: string;
    botTokenConfigured: boolean;
    openRouterKeyConfigured: boolean;
  };
  initialChannels: Channel[];
  deliveries: Delivery[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [channels, setChannels] = useState(initialChannels);
  const [botToken, setBotToken] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function updateChannel(eventType: string, patch: Partial<Channel>) {
    setChannels((items) => items.map((item) => item.eventType === eventType ? { ...item, ...patch } : item));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/discord-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          botToken,
          openRouterKey,
          channels: channels.map((channel) => ({
            ...channel,
            channelId: channel.channelId || "",
            channelName: channel.channelName || "",
            mentionRoleId: channel.mentionRoleId || "",
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save Discord configuration.");
      setSettings((value) => ({
        ...value,
        botTokenConfigured: value.botTokenConfigured || Boolean(botToken),
        openRouterKeyConfigured: value.openRouterKeyConfigured || Boolean(openRouterKey),
      }));
      setBotToken("");
      setOpenRouterKey("");
      setMessage({ kind: "success", text: "Discord bot, AI, and channel configuration saved." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not save Discord configuration." });
    } finally {
      setSaving(false);
    }
  }

  async function test(eventType: string) {
    setTesting(eventType);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/discord-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Test delivery failed.");
      setMessage({ kind: "success", text: `Test delivered successfully. Discord message ${data.messageId}.` });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Test delivery failed." });
    } finally {
      setTesting(null);
    }
  }

  async function retry(deliveryId: string) {
    setRetrying(deliveryId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/discord-settings/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Retry failed.");
      setMessage({ kind: "success", text: "Discord delivery retry succeeded." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Retry failed." });
    } finally {
      setRetrying(null);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-2xl border border-indigo-400/20 bg-indigo-400/[.04] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="font-semibold text-white">Bot connection</h2><p className="mt-1 text-xs leading-5 text-zinc-500">Administrator-only credentials for the private staff Discord server.</p></div>
          <label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} className="h-4 w-4 accent-indigo-400" />Integration enabled</label>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Input label="Discord server (guild) ID" value={settings.guildId} onChange={(value) => setSettings({ ...settings, guildId: value })} placeholder="123456789012345678" />
          <Input label="Discord application ID" value={settings.applicationId} onChange={(value) => setSettings({ ...settings, applicationId: value })} placeholder="123456789012345678" />
          <SecretInput label="Discord bot token" value={botToken} onChange={setBotToken} configured={settings.botTokenConfigured} placeholder="Leave blank to keep current bot token" />
          <div />
        </div>
      </section>

      <section className="rounded-2xl border border-violet-400/20 bg-violet-400/[.04] p-6">
        <h2 className="font-semibold text-white">Dedicated Discord AI</h2>
        <p className="mt-1 text-xs leading-5 text-zinc-500">This key is separate from the marketplace AI key. OpenRouter usage can be tracked and rotated independently.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SecretInput label="Discord OpenRouter API key" value={openRouterKey} onChange={setOpenRouterKey} configured={settings.openRouterKeyConfigured} placeholder="sk-or-v1-…" />
          <Input label="Discord reporting model" value={settings.openRouterModel} onChange={(value) => setSettings({ ...settings, openRouterModel: value })} placeholder="openrouter/auto" />
        </div>
      </section>

      <section>
        <div className="mb-4"><h2 className="font-semibold text-white">Reporting channels</h2><p className="mt-1 text-xs text-zinc-500">Route each event category to a Discord channel and control how its AI reporter writes.</p></div>
        <div className="space-y-4">
          {channels.map((channel) => (
            <article key={channel.eventType} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-indigo-300">{channel.eventType.replaceAll("_", " ")}</div><h3 className="mt-1 font-medium">{channel.label}</h3></div>
                <div className="flex items-center gap-3">
                  <button type="button" disabled={testing !== null || !channel.enabled || !channel.channelId} onClick={() => test(channel.eventType)} className="rounded-lg border border-indigo-400/20 px-3 py-1.5 text-xs text-indigo-300 disabled:opacity-30">{testing === channel.eventType ? "Sending…" : "Send test"}</button>
                  <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={channel.enabled} onChange={(event) => updateChannel(channel.eventType, { enabled: event.target.checked })} className="accent-indigo-400" />Enabled</label>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Input label="Channel ID" value={channel.channelId || ""} onChange={(value) => updateChannel(channel.eventType, { channelId: value })} placeholder="123456789012345678" />
                <Input label="Internal channel label" value={channel.channelName || ""} onChange={(value) => updateChannel(channel.eventType, { channelName: value })} placeholder="#site-issues" />
                <Input label="Role ID to mention (optional)" value={channel.mentionRoleId || ""} onChange={(value) => updateChannel(channel.eventType, { mentionRoleId: value })} placeholder="Support role ID" />
              </div>
              <label className="mt-4 block">
                <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600">Channel system prompt</span>
                <textarea value={channel.systemPrompt} onChange={(event) => updateChannel(channel.eventType, { systemPrompt: event.target.value })} rows={4} maxLength={5000} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-zinc-300 outline-none focus:border-indigo-400/40" />
              </label>
            </article>
          ))}
        </div>
      </section>

      {message && <div className={`rounded-xl border px-4 py-3 text-sm ${message.kind === "success" ? "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300" : "border-red-400/20 bg-red-400/[.06] text-red-300"}`}>{message.text}</div>}
      <button disabled={saving} className="w-full rounded-xl bg-indigo-400 px-5 py-3 text-sm font-semibold text-black hover:bg-indigo-300 disabled:opacity-50">{saving ? "Verifying and saving…" : "Verify credentials and save Discord control center"}</button>

      <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
        <h2 className="font-semibold">Recent delivery ledger</h2>
        <div className="mt-4 divide-y divide-white/5">
          {deliveries.map((delivery) => <div key={delivery.id} className="grid gap-2 py-3 text-xs sm:grid-cols-[110px_1fr_auto]"><span className={`font-mono uppercase ${delivery.status === "delivered" ? "text-emerald-400" : delivery.status === "failed" ? "text-red-400" : "text-zinc-500"}`}>{delivery.status}</span><div><div className="text-zinc-300">{delivery.title}</div><div className="mt-1 text-zinc-700">{delivery.eventType.replaceAll("_", " ")} · {delivery.lastError || `${delivery.attempts} attempt(s)`}</div></div><div className="text-right"><time className="block text-zinc-700">{new Date(delivery.createdAt).toLocaleString()}</time>{delivery.status !== "delivered" && <button type="button" disabled={retrying !== null} onClick={() => retry(delivery.id)} className="mt-1 text-indigo-300 hover:underline disabled:opacity-40">{retrying === delivery.id ? "Retrying…" : "Retry"}</button>}</div></div>)}
          {!deliveries.length && <div className="py-10 text-center text-xs text-zinc-600">No Discord deliveries yet.</div>}
        </div>
      </section>
    </form>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-sm text-zinc-300 outline-none placeholder:text-zinc-800 focus:border-indigo-400/40" /></label>;
}

function SecretInput({ label, value, onChange, configured, placeholder }: { label: string; value: string; onChange: (value: string) => void; configured: boolean; placeholder: string }) {
  return <label className="block"><span className="flex justify-between text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600"><span>{label}</span><span className={configured ? "text-emerald-500" : "text-amber-500"}>{configured ? "Encrypted key stored" : "Not configured"}</span></span><input type="password" autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} placeholder={configured ? "Leave blank to keep current key" : placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-sm text-zinc-300 outline-none placeholder:text-zinc-800 focus:border-indigo-400/40" /></label>;
}
