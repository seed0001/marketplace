import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

function directKeyFor(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

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
    const { listingId, recipientId } = await request.json();

    if (recipientId) {
      if (recipientId === session.user.id) {
        return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
      }

      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });
      if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

      const directKey = directKeyFor(session.user.id, recipientId);
      const existing = await prisma.conversation.findUnique({ where: { directKey } });
      if (existing) return NextResponse.json(existing);

      const conversation = await prisma.conversation.create({
        data: {
          kind: "direct",
          directKey,
          buyerId: session.user.id,
          sellerId: recipientId,
        },
        include: {
          listing: { select: { id: true, title: true, price: true, images: true } },
          buyer: { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      });

      return NextResponse.json(conversation, { status: 201 });
    }

    if (!listingId) return NextResponse.json({ error: "listingId or recipientId is required" }, { status: 400 });

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
        kind: "listing",
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
