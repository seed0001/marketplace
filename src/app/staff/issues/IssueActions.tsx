"use client";

import { useTransition } from "react";
import { deleteIssue, updateIssueStatus } from "./actions";

export function IssueActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={pending}
        onChange={(event) => {
          const value = event.target.value;
          startTransition(() => updateIssueStatus(id, value));
        }}
        className="rounded-lg border border-white/10 bg-[#111516] px-2 py-1.5 text-xs text-zinc-300"
        aria-label="Issue status"
      >
        <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <button
        disabled={pending}
        onClick={() => {
          if (window.confirm("Delete this issue report permanently?")) startTransition(() => deleteIssue(id));
        }}
        className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
