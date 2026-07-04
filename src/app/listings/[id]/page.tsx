import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ListingActions } from "./ListingActions";
import { auth } from "@/lib/auth";
import { SectionRenderer } from "@/components/listing-sections/SectionRenderer";
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
  const sections = listing.sections as Section[] | null;
  const hasSections = sections && sections.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="aspect-square rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="text-zinc-200">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{formatPrice(listing.price)}</p>
          </div>

          {listing.category && (
            <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">
              {listing.category}
            </span>
          )}

          {!hasSections && <p className="text-zinc-600">{listing.description}</p>}

          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold">
              {listing.user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <span>{listing.user.name || "Anonymous"}</span>
            <span>·</span>
            <span>{formatDate(listing.createdAt)}</span>
          </div>

          <ListingActions listingId={listing.id} sellerId={listing.userId} isOwner={isOwner} />
        </div>
      </div>

      {hasSections && (
        <div className="mt-12">
          {sections.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
        </div>
      )}

      {listing.reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          <div className="space-y-4">
            {listing.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.author.name}</span>
                  <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
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
