import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      user: { select: { id: true, name: true, image: true } },
      reviews: { select: { quality: true, usability: true, value: true } },
    },
  });

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-black text-white">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-block mb-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium tracking-widest text-emerald-300">
            FROM HOBBYIST TO ENTERPRISE
          </div>
          <h1 className="text-6xl font-semibold tracking-tighter">VibeMarket</h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-zinc-400">
            Sell what you make and the time it takes to make it — from weekend
            projects to enterprise systems. Every sale builds a portfolio that
            proves what you can do.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/listings"
              className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
            >
              Browse the market
            </Link>
            <Link
              href="/listings/new"
              className="rounded-full border border-white/20 px-8 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Start selling
            </Link>
          </div>
        </div>
      </div>

      {/* Positioning */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold tracking-wide text-emerald-600">
                SELL ANYTHING
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                Products <span className="text-muted">and</span> services
              </h3>
              <p className="mt-2 text-sm text-muted">
                A $5 template, a finished side project, or your time as an
                architect. List a thing you made or the expertise to build one.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-emerald-600">
                FOR EVERY MAKER
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                Hobbyist <span className="text-muted">to</span> enterprise
              </h3>
              <p className="mt-2 text-sm text-muted">
                Weekend tinkerers, indie makers, freelancers, and enterprise
                architects share one marketplace — sell at any scale, on your
                terms.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-emerald-600">
                BUILD YOUR REPUTATION
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                A portfolio that proves it
              </h3>
              <p className="mt-2 text-sm text-muted">
                Every listing, sale, and review feeds a living portfolio of who
                you are, what you&apos;ve built, and your track record with
                customers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent listings */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm text-emerald-600 font-medium tracking-wide">RECENT</div>
            <h2 className="text-3xl font-semibold tracking-tight">Just listed</h2>
          </div>
          <Link href="/listings" className="text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">Nothing listed yet. Be the first to sell something!</div>
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