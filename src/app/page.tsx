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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Friends Marketplace</h1>
        <p className="mt-2 text-zinc-600">Buy and sell with people you trust</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/listings"
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse listings
          </Link>
          <Link
            href="/listings/new"
            className="rounded-full border px-6 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Sell something
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent listings</h2>
          <Link href="/listings" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">No listings yet. Be the first!</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
