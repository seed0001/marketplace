"use client";

import { useTransition } from "react";
import { deleteContent, setListingStatus } from "./actions";

type ContentType = "listing" | "website" | "review" | "feedback";

export function ContentActions({
  id,
  type,
  status,
  title,
}: {
  id: string;
  type: ContentType;
  status?: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Permanently delete "${title}"? This removes only this submission and its related records.`)) return;
    startTransition(() => deleteContent(type, id));
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {type === "listing" && (
        <select
          aria-label={`Status for ${title}`}
          value={status}
          disabled={pending}
          onChange={(event) => {
            const nextStatus = event.target.value;
            startTransition(() => setListingStatus(id, nextStatus));
          }}
          className="rounded-lg border border-white/10 bg-[#111516] px-2 py-1.5 text-xs text-zinc-300"
        >
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="sold">Sold</option>
        </select>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50"
      >
        {pending ? "Working…" : "Delete"}
      </button>
    </div>
  );
}
