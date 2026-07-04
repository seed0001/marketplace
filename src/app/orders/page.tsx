"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Order = {
  id: string;
  status: string;
  listing: { id: string; title: string; price: number; githubUrl?: string | null };
  seller?: { id: string; name?: string | null };
  buyer?: { id: string; name?: string | null };
};

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  released: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-zinc-100 text-zinc-500 border-zinc-200",
  cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  released: "Cleared to download",
  declined: "Declined",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.declined}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { purchases: [], sales: [] }))
      .then((data) => {
        setPurchases(data.purchases || []);
        setSales(data.sales || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (session?.user?.id) load();
  }, [session]);

  async function updateSale(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">Sign in to view your orders.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-1">Sales</h1>
        <p className="text-sm text-zinc-500 mb-4">
          Buyers who want your products. Once you&apos;ve received payment, release the download.
        </p>
        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : sales.length === 0 ? (
          <p className="text-zinc-500">No sales yet.</p>
        ) : (
          <div className="space-y-3">
            {sales.map((o) => (
              <div key={o.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/listings/${o.listing.id}`} className="font-medium hover:underline">
                      {o.listing.title}
                    </Link>
                    <p className="text-sm text-zinc-500">
                      {formatPrice(o.listing.price)} · {o.buyer?.name || "Buyer"}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex gap-2">
                  {o.status !== "released" && (
                    <button
                      onClick={() => updateSale(o.id, "released")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Release download
                    </button>
                  )}
                  {o.status === "requested" && (
                    <button
                      onClick={() => updateSale(o.id, "declined")}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                    >
                      Decline
                    </button>
                  )}
                  <Link
                    href={`/listings/${o.listing.id}`}
                    className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Purchases</h2>
        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : purchases.length === 0 ? (
          <p className="text-zinc-500">You haven&apos;t requested any purchases yet.</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((o) => (
              <div key={o.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/listings/${o.listing.id}`} className="font-medium hover:underline">
                      {o.listing.title}
                    </Link>
                    <p className="text-sm text-zinc-500">
                      {formatPrice(o.listing.price)} · {o.seller?.name || "Seller"}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                {o.status === "released" && o.listing.githubUrl && (
                  <a
                    href={`/api/listings/${o.listing.id}/download`}
                    className="mt-3 inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Download .zip
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
