import type { ReactNode } from "react";
import Link from "next/link";
import { AvatarUpload } from "@/components/AvatarUpload";
import type { Portfolio as PortfolioData } from "@/lib/portfolio";
import { formatPrice, formatDate, formatRelativeTime } from "@/lib/utils";

function Stars({ value }: { value: number | null }) {
  const rounded = Math.round(value ?? 0);
  return (
    <span className="text-amber-500">
      {"★".repeat(rounded)}
      <span className="text-zinc-700">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      {sub && <div className="mt-1 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

export function Portfolio({
  data,
  isOwner,
}: {
  data: PortfolioData;
  isOwner: boolean;
}) {
  const { user, listings, stats, feedbackReceived, recentViews } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Identity */}
      <div className="flex flex-col items-center text-center gap-3 sm:flex-row sm:text-left sm:items-end sm:gap-6 mb-10">
        {isOwner ? (
          <AvatarUpload name={user.name} image={user.image} />
        ) : user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name || "Profile"}
            className="h-20 w-20 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-300">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{user.name || "Anonymous builder"}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Member since {formatDate(stats.memberSince)}
            {stats.reputationAvg != null && (
              <>
                {" · "}
                <Stars value={stats.reputationAvg} />{" "}
                <span className="text-zinc-500">
                  {stats.reputationAvg.toFixed(1)} ({stats.sales})
                </span>
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            This portfolio is generated automatically from real marketplace activity.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-12">
        <StatCard
          label="Listings"
          value={stats.listingsCount}
          sub={`${stats.activeCount} active`}
        />
        <StatCard
          label="Total views"
          value={stats.totalViews.toLocaleString()}
          sub={isOwner ? `${stats.uniqueViewers} unique viewers` : undefined}
        />
        <StatCard
          label="Sales"
          value={stats.sales}
          sub={stats.reputationAvg != null ? <><Stars value={stats.reputationAvg} /></> : "No sales yet"}
        />
        <StatCard
          label="Reviews"
          value={stats.reviewsCount}
          sub={stats.reviewsAvg != null ? `${stats.reviewsAvg.toFixed(1)} avg rating` : "No reviews yet"}
        />
      </div>

      {/* Owner-only audience analytics */}
      {isOwner && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Who&apos;s viewing your work</h2>
          {recentViews.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-500">
              No views yet. Once people start opening your listings, you&apos;ll see them here.
            </p>
          ) : (
            <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
              {recentViews.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  {v.viewer?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.viewer.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                      {v.viewer?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">
                      {v.viewer ? v.viewer.name || "A member" : "Someone"}
                    </span>{" "}
                    <span className="text-zinc-500">viewed</span>{" "}
                    <Link href={`/listings/${v.listing.id}`} className="text-emerald-400 hover:text-emerald-300">
                      {v.listing.title}
                    </Link>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">{formatRelativeTime(v.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Work */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isOwner ? "Your work" : "Work"}{" "}
            <span className="font-normal text-zinc-500">({listings.length})</span>
          </h2>
          {isOwner && (
            <Link
              href="/listings/new"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + New listing
            </Link>
          )}
        </div>

        {listings.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-500">
            No listings yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="aspect-[4/3] bg-zinc-800 overflow-hidden relative">
                  {listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-700">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                  {listing.status !== "active" && (
                    <div className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-200">
                      {listing.status}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate font-semibold text-sm">{listing.title}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-500">{formatPrice(listing.price)}</span>
                    <span className="text-xs text-zinc-500">
                      {listing._count.views.toLocaleString()} views
                      {listing._count.reviews > 0 && ` · ${listing._count.reviews} reviews`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      {feedbackReceived.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">What buyers say</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feedbackReceived.map((f) => (
              <div key={f.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-2">
                  {f.from.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.from.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                      {f.from.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{f.from.name || "A buyer"}</div>
                    <Link
                      href={`/listings/${f.listing.id}`}
                      className="truncate text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      on {f.listing.title}
                    </Link>
                  </div>
                  <Stars value={f.rating} />
                </div>
                {f.comment && <p className="text-sm text-zinc-300 leading-relaxed">{f.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
