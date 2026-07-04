import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const toUserId = searchParams.get("toUserId");
  const listingId = searchParams.get("listingId");

  const where: Record<string, unknown> = {};
  if (toUserId) where.toUserId = toUserId;
  if (listingId) where.listingId = listingId;

  const feedback = await prisma.feedback.findMany({
    where,
    include: {
      from: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = toUserId
    ? await prisma.feedback.aggregate({
        where: { toUserId },
        _avg: { rating: true },
        _count: true,
      })
    : null;

  return NextResponse.json({ feedback, stats });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { listingId, toUserId, rating, comment } = body;

    if (!listingId || !toUserId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (session.user.id === toUserId) {
      return NextResponse.json({ error: "Cannot leave feedback for yourself" }, { status: 400 });
    }

    const existing = await prisma.feedback.findUnique({
      where: { listingId_fromUserId: { listingId, fromUserId: session.user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already left feedback for this listing" }, { status: 409 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        listingId,
        fromUserId: session.user.id,
        toUserId,
        rating: Math.max(1, Math.min(5, rating)),
        comment: comment || null,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
