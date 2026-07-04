"use client";

import { useEffect, useState } from "react";

type Method = { type: string; handle: string };

const TYPES: { value: string; label: string; placeholder: string }[] = [
  { value: "venmo", label: "Venmo", placeholder: "@your-handle" },
  { value: "cashapp", label: "Cash App", placeholder: "$yourcashtag" },
  { value: "paypal", label: "PayPal", placeholder: "paypal.me/you or email" },
  { value: "zelle", label: "Zelle", placeholder: "email or phone" },
  { value: "other", label: "Other", placeholder: "payment link or instructions" },
];

export function PaymentMethods() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMethods(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  function update(i: number, patch: Partial<Method>) {
    setMethods((ms) => ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
    setSaved(false);
  }

  function add() {
    setMethods((ms) => [...ms, { type: "venmo", handle: "" }]);
    setSaved(false);
  }

  function remove(i: number) {
    setMethods((ms) => ms.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/payment-methods", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ methods: methods.filter((m) => m.handle.trim()) }),
    });
    if (res.ok) {
      const data = await res.json();
      setMethods(Array.isArray(data) ? data : []);
      setSaved(true);
    }
    setSaving(false);
  }

  if (loading) return null;

  return (
    <section className="mb-10 rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Payment methods</h2>
      <p className="mt-1 text-sm text-zinc-500">
        How buyers pay you for downloadable listings. They pay you directly, then unlock the download.
      </p>

      <div className="mt-4 space-y-2">
        {methods.map((m, i) => {
          const placeholder = TYPES.find((t) => t.value === m.type)?.placeholder;
          return (
            <div key={i} className="flex gap-2">
              <select
                value={m.type}
                onChange={(e) => update(i, { type: e.target.value })}
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                value={m.handle}
                onChange={(e) => update(i, { handle: e.target.value })}
                placeholder={placeholder}
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => remove(i)}
                className="rounded-lg border px-3 text-sm text-zinc-500 hover:bg-zinc-50"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          );
        })}
        {methods.length === 0 && (
          <p className="text-sm text-zinc-400">No payment methods yet.</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={add}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          + Add method
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </section>
  );
}
