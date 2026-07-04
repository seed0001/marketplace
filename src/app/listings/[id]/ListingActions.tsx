"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ListingActions({
  listingId,
  isOwner,
  hasDownload,
  orderStatus,
}: {
  listingId: string;
  isOwner: boolean;
  hasDownload: boolean;
  orderStatus: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function openConversation() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (res.ok) {
      const conv = await res.json();
      router.push(`/messages/${conv.id}`);
    }
  }

  async function handleMessage() {
    if (!session) return router.push("/auth/signin");
    setMessaging(true);
    await openConversation();
    setMessaging(false);
  }

  async function handleRequest() {
    if (!session) return router.push("/auth/signin");
    setRequesting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (res.ok) {
      const { conversationId } = await res.json();
      router.push(`/messages/${conversationId}`);
    } else {
      setRequesting(false);
    }
  }

  const downloadButton = (
    <a
      href={`/api/listings/${listingId}/download`}
      className="flex-1 rounded-lg bg-emerald-600 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
    >
      Download .zip
    </a>
  );

  const canDownload = hasDownload && (isOwner || orderStatus === "released");

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-3">
        {canDownload && downloadButton}

        {!isOwner && hasDownload && orderStatus !== "released" && (
          orderStatus === "requested" ? (
            <span className="flex-1 rounded-lg border border-amber-300 bg-amber-50 py-2 text-center text-sm font-medium text-amber-700">
              Requested · awaiting seller
            </span>
          ) : (
            <button
              onClick={handleRequest}
              disabled={requesting}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {requesting ? "Requesting..." : "Request to purchase"}
            </button>
          )
        )}

        {!isOwner && (
          <button
            onClick={handleMessage}
            disabled={messaging}
            className={`${hasDownload ? "" : "flex-1 "}rounded-lg border py-2 px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50`}
          >
            {messaging ? "Starting chat..." : "Message seller"}
          </button>
        )}

        {isOwner && (
          <Link
            href={`/listings/${listingId}/edit`}
            className="flex-1 rounded-lg border py-2 text-sm font-medium text-center hover:bg-zinc-50"
          >
            Edit listing
          </Link>
        )}
      </div>

      {!isOwner && hasDownload && orderStatus === "requested" && (
        <p className="text-xs text-zinc-500">
          Arrange payment with the seller in chat. They&apos;ll release your download once paid.
        </p>
      )}
    </div>
  );
}
