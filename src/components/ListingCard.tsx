import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  price: number;
  images: string[];
  category?: string | null;
  createdAt: Date | string;
  user: { id: string; name?: string | null; image?: string | null };
};

export function ListingCard({ listing }: { listing: Listing }) {
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
          <div className="flex h-full w-full items-center justify-center text-6xl text-zinc-300">📸</div>
        )}
        {listing.category && (
          <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 shadow">
            {listing.category}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="font-semibold tracking-tight text-lg leading-tight truncate pr-1">{listing.title}</div>
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
