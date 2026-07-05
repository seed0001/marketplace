import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { sanitizeImages } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { queueDiscordEvent } from "@/lib/discord";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "newest";
  const userId = searchParams.get("userId");

  // A userId filter powers the profile "My listings" view, which should show
  // the owner's listings in any status; public browsing stays active-only.
  const where: Record<string, unknown> = userId
    ? { userId }
    : { status: "active" };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { readme: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, unknown>).gte = parseFloat(minPrice);
    if (maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(maxPrice);
  }

  const orderBy: Record<string, string> =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    include: { user: { select: { id: true, name: true, image: true } } },
    take: 50,
  });

  return NextResponse.json(listings);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, description, price, images, category, condition, sections, readme, adult } = body;

    if (!title || price === undefined || price === null || price === "") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description: description ?? "",
        price: parseFloat(price),
        images: sanitizeImages(images),
        category: category || null,
        condition: condition || null,
        sections: sections || undefined,
        readme: readme || undefined,
        adult: adult ?? false,
        userId: session.user.id,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    await queueDiscordEvent("marketplace", `New listing · ${listing.title}`, {
      description: listing.description || "A new marketplace listing was published.",
      color: 0x34d399,
      fields: [
        { name: "Seller", value: listing.user.name || "Marketplace member", inline: true },
        { name: "Price", value: `$${listing.price.toLocaleString()}`, inline: true },
        { name: "Category", value: listing.category || "Uncategorized", inline: true },
      ],
    });

    return NextResponse.json(listing, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
