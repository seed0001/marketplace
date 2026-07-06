"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DirectMessageButton({ recipientId }: { recipientId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startConversation() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start a message.");
      router.push(`/messages/${data.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start a message.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 sm:items-start">
      <button
        type="button"
        onClick={startConversation}
        disabled={busy}
        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? "Opening..." : "Message"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
