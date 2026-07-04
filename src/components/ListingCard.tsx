import Link from "next/link";
import { formatPrice, summarizeReviews } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";

type Listing = {
  id: string;
  title: string;
  price: number;
  images: string[];
  category?: string | null;
  adult?: boolean | null;
  createdAt: Date | string;
  user: { id: string; name?: string | null; image?: string | null };
  reviews?: { quality: number; usability: number; value: number }[] | null;
};

export function ListingCard({ listing }: { listing: Listing }) {
  const reviews = summarizeReviews(listing.reviews);
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="aspect-[4/3] bg-zinc-100 overflow-hidden relative">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-200">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        {listing.category && (
          <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 shadow">
            {listing.category}
          </div>
        )}
        {listing.adult && (
          <div className="absolute top-3 left-3 rounded-full bg-red-600/90 px-2 py-0.5 text-[11px] font-bold text-white shadow">
            18+
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="font-semibold tracking-tight text-lg leading-tight truncate pr-1">{listing.title}</div>

        {reviews.count > 0 ? (
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <StarRating value={reviews.overall} />
              <span className="text-xs font-medium text-zinc-600">{reviews.overall.toFixed(1)}</span>
              <span className="text-xs text-zinc-400">({reviews.count})</span>
            </div>
            <div className="space-y-0.5 text-[11px] text-zinc-500">
              <div className="flex items-center justify-between gap-2">
                <span>Usability</span>
                <StarRating value={reviews.usability} size="xs" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Value</span>
                <StarRating value={reviews.value} size="xs" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-1.5 text-xs text-zinc-400">No reviews yet</div>
        )}

        <div className="mt-3 flex justify-between items-end">
          <div>
            <div className="font-bold text-[17px] text-emerald-600">{formatPrice(listing.price)}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{listing.user.name || "Anonymous"}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
