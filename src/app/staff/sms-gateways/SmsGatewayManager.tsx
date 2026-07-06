"use client";

import { useState } from "react";

type Gateway = {
  id: string;
  label: string;
  domain: string;
  enabled: boolean;
  sortOrder: number;
};

type GatewayDefault = { label: string; domain: string };

function sortGateways(list: Gateway[]) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function SmsGatewayManager({
  initialGateways,
  defaults,
}: {
  initialGateways: Gateway[];
  defaults: GatewayDefault[];
}) {
  const [gateways, setGateways] = useState<Gateway[]>(sortGateways(initialGateways));
  const [label, setLabel] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const missingDefaults = defaults.filter((entry) => !gateways.some((gateway) => gateway.domain === entry.domain));

  async function createGateway(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/sms-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, domain }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add carrier.");
      setGateways((current) => sortGateways([...current, data]));
      setLabel("");
      setDomain("");
      setMessage({ kind: "success", text: `Added ${data.label}.` });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not add carrier." });
    } finally {
      setBusy(false);
    }
  }

  async function toggleGateway(gateway: Gateway) {
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/sms-gateways/${gateway.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !gateway.enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update carrier.");
      setGateways((current) => current.map((entry) => (entry.id === gateway.id ? data : entry)));
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not update carrier." });
    }
  }

  async function removeGateway(gateway: Gateway) {
    if (!confirm(`Remove ${gateway.label} (${gateway.domain})? Members using it keep the value on their profile until they change it.`)) return;
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/sms-gateways/${gateway.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not remove carrier.");
      }
      setGateways((current) => current.filter((entry) => entry.id !== gateway.id));
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not remove carrier." });
    }
  }

  async function restoreDefaults() {
    setBusy(true);
    setMessage(null);
    const added: Gateway[] = [];
    try {
      for (const entry of missingDefaults) {
        const response = await fetch("/api/staff/sms-gateways", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
        const data = await response.json();
        if (response.ok) added.push(data);
      }
      if (added.length) setGateways((current) => sortGateways([...current, ...added]));
      setMessage({ kind: "success", text: `Added ${added.length} default carrier${added.length === 1 ? "" : "s"}.` });
    } catch {
      setMessage({ kind: "error", text: "Could not restore all defaults." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createGateway} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={60}
          required
          placeholder="Carrier name (e.g. Visible)"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-emerald-400/50"
        />
        <input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          required
          placeholder="gateway domain (e.g. vtext.com)"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-400/50"
        />
        <button
          disabled={busy || !label.trim() || !domain.trim()}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-40"
        >
          Add carrier
        </button>
      </form>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.kind === "success" ? "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300" : "border-red-400/20 bg-red-400/[.06] text-red-300"}`}>
          {message.text}
        </div>
      )}

      {gateways.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[13px] leading-6 text-zinc-600">
          No carriers configured. Members are offered the built-in defaults until you add some.
        </p>
      ) : (
        <div className="divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
          {gateways.map((gateway) => (
            <div key={gateway.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-200">{gateway.label}</div>
                <div className="mt-0.5 font-mono text-[11px] text-zinc-600">{gateway.domain}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleGateway(gateway)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] ${gateway.enabled ? "border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}
              >
                {gateway.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                type="button"
                onClick={() => removeGateway(gateway)}
                className="rounded-lg border border-red-400/20 px-3 py-1.5 text-[11px] text-red-300 transition hover:bg-red-400/10"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {missingDefaults.length > 0 && (
        <button
          type="button"
          onClick={restoreDefaults}
          disabled={busy}
          className="text-xs text-zinc-500 underline-offset-2 hover:text-emerald-300 hover:underline disabled:opacity-40"
        >
          Add {missingDefaults.length} built-in default carrier{missingDefaults.length === 1 ? "" : "s"} not yet in the list
        </button>
      )}
    </div>
  );
}
