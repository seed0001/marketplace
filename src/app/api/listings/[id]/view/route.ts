import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// How long before the same viewer counts as a fresh view again. Keeps a
// refresh or quick back-and-forth from inflating the numbers.
const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Never count the owner viewing their own listing.
  if (viewerId && viewerId === listing.userId) {
    return NextResponse.json({ counted: false });
  }

  // Dedupe repeat views from the same signed-in viewer within the window.
  // Anonymous views can't be reliably attributed, so we always record them.
  if (viewerId) {
    const recent = await prisma.listingView.findFirst({
      where: {
        listingId: id,
        viewerId,
        createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (recent) return NextResponse.json({ counted: false });
  }

  await prisma.listingView.create({
    data: { listingId: id, viewerId },
  });

  return NextResponse.json({ counted: true });
}
