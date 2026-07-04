import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "newest";

  const where: Record<string, unknown> = { status: "active" };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
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
    const { title, description, price, images, category, condition } = body;

    if (!title || !description || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        images: images || [],
        category: category || null,
        condition: condition || null,
        userId: session.user.id,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
