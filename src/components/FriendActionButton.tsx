"use client";

import { useState } from "react";

type FriendshipState = "none" | "pending_sent" | "pending_received" | "accepted";

type FriendshipPayload = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
};

export function FriendActionButton({
  targetUserId,
  currentUserId,
  initialState,
  initialFriendshipId,
}: {
  targetUserId: string;
  currentUserId: string;
  initialState: FriendshipState | "none";
  initialFriendshipId: string | null;
}) {
  const [state, setState] = useState<FriendshipState>(initialState);
  const [friendshipId, setFriendshipId] = useState(initialFriendshipId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function applyFriendship(friendship: FriendshipPayload) {
    setFriendshipId(friendship.id);
    if (friendship.status === "accepted") {
      setState("accepted");
      return;
    }
    if (friendship.status === "pending" && friendship.requesterId === currentUserId) {
      setState("pending_sent");
      return;
    }
    if (friendship.status === "pending" && friendship.addresseeId === currentUserId) {
      setState("pending_received");
      return;
    }
    setState("none");
  }

  async function sendRequest() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: targetUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send friend request.");
      applyFriendship(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send friend request.");
    } finally {
      setBusy(false);
    }
  }

  async function answerRequest(action: "accept" | "decline") {
    if (!friendshipId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update friend request.");
      if (action === "decline") {
        setState("none");
        return;
      }
      applyFriendship(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update friend request.");
    } finally {
      setBusy(false);
    }
  }

  async function removeFriendship() {
    if (!friendshipId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update friendship.");
      setFriendshipId(null);
      setState("none");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update friendship.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 sm:items-start">
      {state === "none" && (
        <button
          type="button"
          onClick={sendRequest}
          disabled={busy}
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-50"
        >
          {busy ? "Sending..." : "Add Friend"}
        </button>
      )}

      {state === "pending_sent" && (
        <button
          type="button"
          onClick={removeFriendship}
          disabled={busy}
          className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
        >
          {busy ? "Canceling..." : "Request Sent"}
        </button>
      )}

      {state === "pending_received" && (
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => void answerRequest("accept")}
            disabled={busy}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => void answerRequest("decline")}
            disabled={busy}
            className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}

      {state === "accepted" && (
        <button
          type="button"
          onClick={removeFriendship}
          disabled={busy}
          className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
        >
          {busy ? "Updating..." : "Friends"}
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
