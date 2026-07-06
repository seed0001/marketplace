"use client";

import { useState, useTransition } from "react";
import { purgeUserCatalog, deleteUserAccount } from "./actions";

// Rendered per member for administrators only. Both actions are irreversible,
// so purging asks for confirmation and account deletion additionally requires
// typing the member's email — a slip of the mouse must never erase an account.
export function DangerActions({
  userId,
  name,
  email,
  listingCount,
  locked,
  lockReason,
}: {
  userId: string;
  name: string | null;
  email: string;
  listingCount: number;
  locked?: boolean;
  lockReason?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const display = name || email;

  if (locked) {
    return <span title={lockReason} className="text-[10px] text-zinc-700">Protected</span>;
  }

  function purge() {
    if (!confirm(
      `Purge ${display}'s catalog?\n\nThis permanently deletes all ${listingCount} of their listing${listingCount === 1 ? "" : "s"} (including related conversations, reviews, and feedback) and revokes every API key they hold. The account itself stays.\n\nThis cannot be undone.`
    )) return;
    setError(null);
    startTransition(async () => {
      const result = await purgeUserCatalog(userId);
      if (!result.ok) setError(result.error ?? "Could not purge catalog.");
    });
  }

  function deleteAccount() {
    if (!confirm(
      `Delete ${display}'s account entirely?\n\nThis permanently removes the account and everything it owns: listings, messages, conversations, reviews, feedback, websites, AI history, and API keys.\n\nThis cannot be undone.`
    )) return;
    const typed = prompt(`Type the member's email to confirm permanent deletion:\n${email}`);
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== email.toLowerCase()) {
      setError("Email did not match — nothing was deleted.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAccount(userId);
      if (!result.ok) setError(result.error ?? "Could not delete account.");
    });
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={purge}
          disabled={pending || listingCount === 0}
          title={listingCount === 0 ? "No listings to purge" : "Delete every listing and revoke all API keys"}
          className="rounded-lg border border-amber-400/20 px-2.5 py-1.5 text-[10px] text-amber-300 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {pending ? "Working…" : "Purge catalog"}
        </button>
        <button
          type="button"
          onClick={deleteAccount}
          disabled={pending}
          title="Permanently delete this account and all of its content"
          className="rounded-lg border border-red-400/20 px-2.5 py-1.5 text-[10px] text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Delete account
        </button>
      </div>
      {error && <p className="mt-1 max-w-[14rem] text-right text-[10px] leading-tight text-red-300">{error}</p>}
    </div>
  );
}
