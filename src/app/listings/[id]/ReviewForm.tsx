"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Scores = { quality: number; usability: number; value: number };

const DIMENSIONS: { key: keyof Scores; label: string; hint: string }[] = [
  { key: "quality", label: "Quality", hint: "How well is it built?" },
  { key: "usability", label: "Usability", hint: "How easy is it to use?" },
  { key: "value", label: "Value", hint: "Worth the price?" },
];

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={`text-2xl leading-none transition ${
            star <= value ? "text-amber-500" : "text-zinc-200"
          } hover:text-amber-400`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  listingId,
  initial,
}: {
  listingId: string;
  initial: (Scores & { comment: string }) | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(initial === null);
  const [scores, setScores] = useState<Scores>({
    quality: initial?.quality ?? 0,
    usability: initial?.usability ?? 0,
    value: initial?.value ?? 0,
  });
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = scores.quality > 0 && scores.usability > 0 && scores.value > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, ...scores, comment }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="rounded-xl border bg-emerald-50/50 border-emerald-200 p-4 flex items-center justify-between gap-3">
        <p className="text-sm text-emerald-800">Thanks — your review is live.</p>
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 space-y-4">
      <h3 className="font-semibold">
        {initial ? "Edit your review" : "Rate this listing"}
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {DIMENSIONS.map(({ key, label, hint }) => (
          <div key={key}>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-zinc-400 mb-1">{hint}</div>
            <StarPicker
              value={scores[key]}
              onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Comment <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="What stood out?"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!complete || submitting}
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Saving…" : initial ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
