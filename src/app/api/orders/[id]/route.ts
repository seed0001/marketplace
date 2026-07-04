import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

const SELLER_STATUSES = ["released", "declined"];

/**
 * Seller updates an order's status. Releasing it ("released") is what clears the
 * buyer to download — the seller does this after they've actually received
 * payment. The buyer may cancel their own pending request.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { status } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { listing: { select: { title: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isSeller = order.sellerId === session.user.id;
    const isBuyer = order.buyerId === session.user.id;

    if (isSeller && SELLER_STATUSES.includes(status)) {
      // ok
    } else if (isBuyer && status === "cancelled") {
      // ok
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.order.update({ where: { id }, data: { status } });

    // When released, drop a note into the conversation so the buyer sees it.
    if (isSeller && status === "released") {
      const conversation = await prisma.conversation.findUnique({
        where: {
          listingId_buyerId: { listingId: order.listingId, buyerId: order.buyerId },
        },
      });
      if (conversation) {
        await prisma.message.create({
          data: {
            content: `✅ You're cleared to download "${order.listing.title}". Thanks for your purchase!`,
            conversationId: conversation.id,
            senderId: session.user.id,
          },
        });
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
