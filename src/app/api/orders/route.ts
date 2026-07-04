import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [purchases, sales] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          listing: { select: { id: true, title: true, price: true, images: true, githubUrl: true } },
          seller: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.order.findMany({
        where: { sellerId: userId },
        include: {
          listing: { select: { id: true, title: true, price: true, images: true } },
          buyer: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ purchases, sales });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Buyer requests to purchase a listing. This does NOT unlock anything — it
 * records an order (status "requested") and opens a conversation with the
 * seller so they can agree on price/scope and arrange payment. The seller later
 * releases the download once they've been paid (see PATCH /api/orders/[id]).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { listingId } = await request.json();
    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (listing.userId === session.user.id) {
      return NextResponse.json({ error: "You can't purchase your own listing" }, { status: 400 });
    }

    // Ensure a conversation exists so the request lands in the seller's inbox.
    const conversation =
      (await prisma.conversation.findUnique({
        where: { listingId_buyerId: { listingId, buyerId: session.user.id } },
      })) ??
      (await prisma.conversation.create({
        data: { listingId, buyerId: session.user.id, sellerId: listing.userId },
      }));

    const existingOrder = await prisma.order.findUnique({
      where: { listingId_buyerId: { listingId, buyerId: session.user.id } },
    });

    const order = existingOrder
      ? existingOrder.status === "declined"
        ? await prisma.order.update({
            where: { id: existingOrder.id },
            data: { status: "requested" },
          })
        : existingOrder
      : await prisma.order.create({
          data: {
            listingId,
            buyerId: session.user.id,
            sellerId: listing.userId,
            status: "requested",
          },
        });

    // Notify the seller via a chat message (only on the first request).
    if (!existingOrder) {
      await prisma.message.create({
        data: {
          content: `🛒 I'd like to purchase "${listing.title}". How would you like to be paid?`,
          conversationId: conversation.id,
          senderId: session.user.id,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ order, conversationId: conversation.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
