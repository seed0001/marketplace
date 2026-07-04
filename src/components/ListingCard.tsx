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
      className="group rounded-xl border bg-white overflow-hidden hover:shadow-md transition"
    >
      <div className="aspect-square bg-zinc-100 flex items-center justify-center overflow-hidden">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="text-zinc-400 text-4xl">📸</div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
        <p className="text-blue-600 font-bold">{formatPrice(listing.price)}</p>
        <p className="text-xs text-zinc-500">{listing.user.name || "Anonymous"}</p>
      </div>
    </Link>
  );
}
