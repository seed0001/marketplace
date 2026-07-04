"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ListingActions({
  listingId,
  sellerId,
  isOwner,
}: {
  listingId: string;
  sellerId: string;
  isOwner: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);

  async function handleMessage() {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setMessaging(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (res.ok) {
      const conv = await res.json();
      router.push(`/messages/${conv.id}`);
    }
    setMessaging(false);
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex gap-3">
        {!isOwner && (
          <button
            onClick={handleMessage}
            disabled={messaging}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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
      {isOwner && (
        <Link
          href={`/listings/${listingId}/build`}
          className="block rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 text-center hover:bg-emerald-100"
        >
          Build page
        </Link>
      )}
    </div>
  );
}
