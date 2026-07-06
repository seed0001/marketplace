"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileContactSettings({
  initialPhoneNumber,
  initialPhoneNotificationsEnabled,
}: {
  initialPhoneNumber?: string | null;
  initialPhoneNotificationsEnabled: boolean;
}) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  const [enabled, setEnabled] = useState(initialPhoneNotificationsEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, phoneNotificationsEnabled: enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save contact settings.");
      setPhoneNumber(data.phoneNumber || "");
      setEnabled(Boolean(data.phoneNotificationsEnabled));
      setMessage({ kind: "success", text: "Contact settings saved." });
      router.refresh();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof Error ? caught.message : "Could not save contact settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-12 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Contact and notifications</h2>
      <p className="mt-1 text-sm leading-6 text-zinc-500">
        Add a phone number if you want staff alerts by SMS when the service is configured. Your number is never shown publicly.
      </p>
      <form onSubmit={saveSettings} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="+15551234567"
          inputMode="tel"
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50"
        />
        <label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          SMS alerts
        </label>
        <button
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:col-span-2"
        >
          {saving ? "Saving..." : "Save contact settings"}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${message.kind === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
