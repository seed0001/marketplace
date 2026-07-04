import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

function clampStar(n: unknown): number | null {
  const rounded = Math.round(Number(n));
  if (!Number.isFinite(rounded) || rounded < 1) return null;
  return Math.min(5, rounded);
}

// A customer leaves (or updates) a star review on a listing they don't own.
// One review per person per listing; re-submitting edits the existing one.
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { listingId, comment } = body;

    const quality = clampStar(body.quality);
    const usability = clampStar(body.usability);
    const value = clampStar(body.value);

    if (!listingId || quality === null || usability === null || value === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId === session.user.id) {
      return NextResponse.json({ error: "You can't review your own listing" }, { status: 400 });
    }

    const rating = Math.round((quality + usability + value) / 3);
    const data = {
      rating,
      quality,
      usability,
      value,
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
    };

    const review = await prisma.review.upsert({
      where: { listingId_authorId: { listingId, authorId: session.user.id } },
      create: { listingId, authorId: session.user.id, ...data },
      update: data,
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
