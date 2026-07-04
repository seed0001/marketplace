"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";

type Listing = {
  id: string;
  title: string;
  price: number;
  images: string[];
  category?: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name?: string | null; image?: string | null };
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/listings?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">Sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold">
          {session.user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{session.user?.name || "User"}</h1>
          <p className="text-sm text-zinc-500">{session.user?.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">My listings</h2>
        <Link
          href="/listings/new"
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + New listing
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-center py-12">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-zinc-500 text-center py-12">You haven&apos;t created any listings yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
