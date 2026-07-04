import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-block mb-3 rounded-full bg-white/10 px-4 py-0.5 text-sm tracking-widest">
            FOR FRIENDS ONLY
          </div>
          <h1 className="text-6xl font-semibold tracking-tighter">Marketplace</h1>
          <p className="mt-4 max-w-md mx-auto text-lg text-zinc-400">
            Buy and sell with people you actually trust. No strangers.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/listings"
              className="rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Browse everything
            </Link>
            <Link
              href="/listings/new"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-medium hover:bg-white/10"
            >
              Sell something
            </Link>
          </div>
        </div>
      </div>

      {/* Recent listings */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm text-blue-600 font-medium tracking-wide">JUST DROPPED</div>
            <h2 className="text-3xl font-semibold tracking-tight">Fresh listings</h2>
          </div>
          <Link href="/listings" className="text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">No listings yet. Be the first to sell something!</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
