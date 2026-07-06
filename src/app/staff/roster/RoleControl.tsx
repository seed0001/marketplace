"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "./actions";

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
] as const;

function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

// Rendered per member for administrators. `locked` members (the platform owner
// and the acting admin's own account) show a static, un-editable badge.
export function RoleControl({
  userId,
  role,
  locked,
  lockReason,
}: {
  userId: string;
  role: string;
  locked?: boolean;
  lockReason?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (locked) {
    return (
      <span
        title={lockReason}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-500"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {roleLabel(role)}
      </span>
    );
  }

  return (
    <div>
      <select
        value={role}
        disabled={pending}
        aria-label="Member role"
        onChange={(event) => {
          const value = event.target.value;
          setError(null);
          startTransition(async () => {
            const result = await setUserRole(userId, value);
            if (!result.ok) setError(result.error ?? "Could not update role.");
          });
        }}
        className="rounded-lg border border-white/10 bg-[#111516] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-400/40 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 max-w-[10rem] text-[10px] leading-tight text-red-300">{error}</p>}
    </div>
  );
}
