import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { friendPairKey } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

function friendResponse(friendship: { id: string; requesterId: string; addresseeId: string; status: string }) {
  return NextResponse.json({
    id: friendship.id,
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    status: friendship.status,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";

    if (!recipientId) return NextResponse.json({ error: "Recipient is required." }, { status: 400 });
    if (recipientId === session.user.id) {
      return NextResponse.json({ error: "You cannot add yourself as a friend." }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipient) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    const pairKey = friendPairKey(session.user.id, recipientId);
    const existing = await prisma.friendship.findUnique({ where: { pairKey } });

    if (existing?.status === "blocked") {
      return NextResponse.json({ error: "Friend request is unavailable." }, { status: 403 });
    }

    if (existing?.status === "accepted" || existing?.status === "pending") {
      return friendResponse(existing);
    }

    if (existing) {
      const renewed = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: session.user.id,
          addresseeId: recipientId,
          status: "pending",
          respondedAt: null,
        },
      });
      return friendResponse(renewed);
    }

    const friendship = await prisma.friendship.create({
      data: {
        pairKey,
        requesterId: session.user.id,
        addresseeId: recipientId,
      },
    });

    return friendResponse(friendship);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
