import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function ListingsPage(props: {
  searchParams: Promise<{ q?: string; category?: string; minPrice?: string; maxPrice?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const where: Record<string, unknown> = { status: "active" };

  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }
  if (searchParams.category) where.category = searchParams.category;
  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {};
    if (searchParams.minPrice) (where.price as Record<string, unknown>).gte = parseFloat(searchParams.minPrice);
    if (searchParams.maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(searchParams.maxPrice);
  }

  const orderBy: Record<string, string> =
    searchParams.sort === "price_asc"
      ? { price: "asc" }
      : searchParams.sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    take: 50,
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  const categories = await prisma.listing.findMany({
    where: { status: "active", category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">Browse the market</h1>

      <div className="mb-6 space-y-4">
        <SearchBar />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => c.category).filter(Boolean).map((cat) => (
            <a
              key={cat}
              href={`/listings?category=${encodeURIComponent(cat as string)}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                searchParams.category === cat ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-zinc-100"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="text-zinc-500 text-center py-12">No listings found</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
