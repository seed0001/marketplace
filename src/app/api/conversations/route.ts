import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        listing: { select: { id: true, title: true, price: true, images: true } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { listingId } = await request.json();

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (listing.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const existing = await prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId, buyerId: session.user.id } },
    });
    if (existing) return NextResponse.json(existing);

    const conversation = await prisma.conversation.create({
      data: {
        listingId,
        buyerId: session.user.id,
        sellerId: listing.userId,
      },
      include: {
        listing: { select: { id: true, title: true, price: true, images: true } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
