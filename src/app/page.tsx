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
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-black text-white">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-block mb-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium tracking-widest text-emerald-300">
            FOR AI BUILDERS
          </div>
          <h1 className="text-6xl font-semibold tracking-tighter">VibeMarket</h1>
          <p className="mt-4 max-w-md mx-auto text-lg text-zinc-400">
            Showcase and sell what you build with AI — apps, agents, automations, and more.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/listings"
              className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
            >
              Browse builds
            </Link>
            <Link
              href="/listings/new"
              className="rounded-full border border-white/20 px-8 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Sell your build
            </Link>
          </div>
        </div>
      </div>

      {/* Recent listings */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm text-emerald-600 font-medium tracking-wide">RECENT</div>
            <h2 className="text-3xl font-semibold tracking-tight">Fresh builds</h2>
          </div>
          <Link href="/listings" className="text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">No builds yet. Be the first to ship one!</div>
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