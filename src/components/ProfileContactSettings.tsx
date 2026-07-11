"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SmsGatewayOption } from "@/lib/sms-carriers";

const OTHER = "__other__";

export function ProfileContactSettings({
  initialPhoneNumber,
  initialPhoneCarrier,
  initialPhoneNotificationsEnabled,
  initialEmailNotificationsEnabled,
  gateways,
}: {
  initialPhoneNumber?: string | null;
  initialPhoneCarrier?: string | null;
  initialPhoneNotificationsEnabled: boolean;
  initialEmailNotificationsEnabled: boolean;
  gateways: SmsGatewayOption[];
}) {
  const router = useRouter();
  const initialCarrier = initialPhoneCarrier || "";
  const knownCarrier = gateways.some((gateway) => gateway.domain === initialCarrier);

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  // `selection` is the dropdown value: a known gateway domain, "" (none), or the
  // OTHER sentinel. `customDomain` holds the free-text gateway for OTHER.
  const [selection, setSelection] = useState(initialCarrier ? (knownCarrier ? initialCarrier : OTHER) : "");
  const [customDomain, setCustomDomain] = useState(knownCarrier ? "" : initialCarrier);
  const [enabled, setEnabled] = useState(initialPhoneNotificationsEnabled);
  const [emailEnabled, setEmailEnabled] = useState(initialEmailNotificationsEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const phoneCarrier = selection === OTHER ? customDomain.trim() : selection;

  function applyCarrier(value: string, list: SmsGatewayOption[]) {
    if (!value) {
      setSelection("");
      setCustomDomain("");
    } else if (list.some((gateway) => gateway.domain === value)) {
      setSelection(value);
      setCustomDomain("");
    } else {
      setSelection(OTHER);
      setCustomDomain(value);
    }
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          phoneCarrier,
          phoneNotificationsEnabled: enabled,
          emailNotificationsEnabled: emailEnabled,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save contact settings.");
      setPhoneNumber(data.phoneNumber || "");
      applyCarrier(data.phoneCarrier || "", gateways);
      setEnabled(Boolean(data.phoneNotificationsEnabled));
      setEmailEnabled(Boolean(data.emailNotificationsEnabled));
      setMessage({ kind: "success", text: "Contact settings saved." });
      router.refresh();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof Error ? caught.message : "Could not save contact settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-12 rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-6">
      <h2 className="text-lg font-semibold">Contact and notifications</h2>
      <p className="mt-1 text-sm leading-6 text-zinc-500">
        Choose how staff alerts reach you. Email alerts go to your account email so they can land on your phone&apos;s mail app. Your phone number is never shown publicly.
      </p>
      <form onSubmit={saveSettings} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+15551234567"
            inputMode="tel"
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50"
          />
          <select
            value={selection}
            onChange={(event) => setSelection(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-emerald-400/50"
          >
            <option value="">Select your carrier…</option>
            {gateways.map((gateway) => (
              <option key={gateway.domain} value={gateway.domain}>{gateway.label}</option>
            ))}
            <option value={OTHER}>Other (enter gateway)…</option>
          </select>
        </div>
        {selection === OTHER && (
          <input
            value={customDomain}
            onChange={(event) => setCustomDomain(event.target.value)}
            placeholder="carrier SMS gateway, e.g. sms.mycarrier.com"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50"
          />
        )}
        <p className="text-xs leading-5 text-zinc-600">
          SMS is delivered through your carrier&apos;s free email-to-text gateway, so we need your carrier to reach your phone. Not listed? Choose <span className="text-zinc-400">Other</span> and enter the gateway domain (the part after the <code>@</code> in your carrier&apos;s email-to-text address). Delivery is best-effort and US numbers only.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            SMS alerts
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(event) => setEmailEnabled(event.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Email alerts
          </label>
        </div>
        <button
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
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
