import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await requireAuth();
    const purchases = await prisma.purchase.findMany({
      where: { buyerId: session.user.id },
      include: { listing: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchases);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Records a buyer's acquisition of a listing. Payment happens off-platform
 * (buyer pays the seller directly), so this is a trust-based confirmation:
 * marking it "paid" unlocks the download. Free listings unlock immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { listingId } = await request.json();
    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (listing.userId === session.user.id) {
      return NextResponse.json(
        { error: "You can't purchase your own listing" },
        { status: 400 }
      );
    }

    const purchase = await prisma.purchase.upsert({
      where: { listingId_buyerId: { listingId, buyerId: session.user.id } },
      create: { listingId, buyerId: session.user.id, status: "paid" },
      update: { status: "paid" },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
