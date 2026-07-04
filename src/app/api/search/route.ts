import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ listings: [], categories: [] });
  }

  const listings = await prisma.listing.findMany({
    where: {
      status: "active",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const categories = await prisma.listing.findMany({
    where: { status: "active", category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  return NextResponse.json({
    listings,
    categories: categories.map((c) => c.category).filter(Boolean),
  });
}
