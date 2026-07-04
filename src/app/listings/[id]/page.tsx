import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ListingActions } from "./ListingActions";
import { auth } from "@/lib/auth";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="aspect-square rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="text-zinc-400 text-6xl">📸</div>
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

          <p className="text-zinc-600">{listing.description}</p>

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
