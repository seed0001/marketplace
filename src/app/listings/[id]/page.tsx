import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ListingActions } from "./ListingActions";
import { auth } from "@/lib/auth";
import { SectionRenderer } from "@/components/listing-sections/SectionRenderer";
import { ViewTracker } from "@/components/ViewTracker";
import { parseReadme } from "@/lib/listing-sections";
import type { Section } from "@/lib/listing-sections";

export const dynamic = "force-dynamic";

export default async function ListingPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      reviews: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing) notFound();

  const isOwner = session?.user?.id === listing.userId;
  const readmeSections = listing.readme ? parseReadme(listing.readme) : [];
  const manualSections = listing.sections as Section[] | null;
  const hasContent = readmeSections.length > 0 || (manualSections && manualSections.length > 0);

  const sellerFeedback = await prisma.feedback.aggregate({
    where: { toUserId: listing.userId },
    _avg: { rating: true },
    _count: true,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ViewTracker listingId={listing.id} />
      {/* Hero */}
      <div className="grid gap-8 sm:grid-cols-2 mb-12">
        <div className="aspect-[4/3] rounded-2xl bg-zinc-100 overflow-hidden">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-200">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center space-y-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
            <p className="text-4xl font-bold text-emerald-600 mt-2">{formatPrice(listing.price)}</p>
          </div>

          {listing.category && (
            <span className="inline-block w-fit rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium">
              {listing.category}
            </span>
          )}

          {listing.adult && (
            <span className="inline-block w-fit rounded-full bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-xs font-bold">
              18+
            </span>
          )}

          {!hasContent && (
            <p className="text-zinc-600 leading-relaxed">{listing.description}</p>
          )}

          <Link
            href={`/users/${listing.user.id}`}
            className="flex items-center gap-3 text-sm text-zinc-400 pt-2 border-t border-border hover:text-zinc-200 transition-colors"
          >
            {listing.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.user.image}
                alt={listing.user.name || "Seller"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-100">
                {listing.user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-200">{listing.user.name || "Anonymous"}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span>{formatDate(listing.createdAt)}</span>
                {sellerFeedback._count > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-500">{'★'.repeat(Math.round(sellerFeedback._avg.rating ?? 0))}</span>
                    <span className="text-zinc-500">({sellerFeedback._count})</span>
                  </>
                )}
              </div>
            </div>
          </Link>

          <ListingActions listingId={listing.id} sellerId={listing.userId} isOwner={isOwner} />
        </div>
      </div>

      {/* Content */}
      {hasContent && (
        <div className="max-w-3xl">
          {manualSections?.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
          {readmeSections.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
        </div>
      )}

      {/* Reviews */}
      {listing.reviews.length > 0 && (
        <section className="mt-14 pt-10 border-t">
          <h2 className="text-lg font-semibold mb-5">
            Reviews <span className="text-zinc-400 font-normal">({listing.reviews.length})</span>
          </h2>
          <div className="space-y-4 max-w-3xl">
            {listing.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.author.name}</span>
                  <span className="text-amber-500 text-sm">{'★'.repeat(review.rating)}</span>
                </div>
                {review.comment && <p className="text-sm text-zinc-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
