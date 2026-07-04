"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentMethod = { type: string; handle: string };

const PAYMENT_LABELS: Record<string, string> = {
  venmo: "Venmo",
  cashapp: "Cash App",
  paypal: "PayPal",
  zelle: "Zelle",
  other: "Other",
};

export function ListingActions({
  listingId,
  sellerId,
  isOwner,
  price,
  hasDownload,
  purchased,
  paymentMethods,
}: {
  listingId: string;
  sellerId: string;
  isOwner: boolean;
  price: number;
  hasDownload: boolean;
  purchased: boolean;
  paymentMethods: PaymentMethod[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(purchased);
  const [error, setError] = useState("");

  const isFree = price <= 0;

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

  async function handleUnlock() {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setUnlocking(true);
    setError("");
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (res.ok) {
      setUnlocked(true);
      setCheckout(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
    }
    setUnlocking(false);
  }

  const downloadButton = (
    <a
      href={`/api/listings/${listingId}/download`}
      className="flex-1 rounded-lg bg-emerald-600 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
    >
      Download .zip
    </a>
  );

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-3">
        {isOwner && hasDownload && downloadButton}
        {!isOwner && hasDownload && unlocked && downloadButton}
        {!isOwner && hasDownload && !unlocked && (
          <button
            onClick={() => {
              if (!session) {
                router.push("/auth/signin");
                return;
              }
              if (isFree) {
                handleUnlock();
              } else {
                setCheckout((v) => !v);
              }
            }}
            disabled={unlocking}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isFree ? (unlocking ? "Preparing..." : "Get download") : "Get download"}
          </button>
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

      {checkout && !isOwner && !unlocked && (
        <div className="rounded-xl border bg-white p-4 text-sm">
          <p className="font-medium">Pay the seller directly, then unlock your download.</p>
          {paymentMethods.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {paymentMethods.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="text-zinc-500">{PAYMENT_LABELS[m.type] || m.type}</span>
                  <span className="font-medium break-all text-right">{m.handle}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-zinc-600">
              This seller hasn&apos;t listed a payment method yet.{" "}
              <button onClick={handleMessage} className="text-emerald-600 underline">
                Message them
              </button>{" "}
              to arrange payment.
            </p>
          )}
          {paymentMethods.length > 0 && (
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {unlocking ? "Unlocking..." : "I've paid — unlock download"}
            </button>
          )}
          {error && <p className="mt-2 text-red-600">{error}</p>}
          <p className="mt-2 text-xs text-zinc-400">
            Payments are handled directly between you and the seller.
          </p>
        </div>
      )}
    </div>
  );
}
