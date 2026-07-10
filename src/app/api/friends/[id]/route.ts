import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function responseFor(friendship: { id: string; requesterId: string; addresseeId: string; status: string }) {
  return NextResponse.json({
    id: friendship.id,
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    status: friendship.status,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
    if (friendship.addresseeId !== session.user.id) {
      return NextResponse.json({ error: "Only the recipient can answer this request." }, { status: 403 });
    }
    if (friendship.status !== "pending") {
      return NextResponse.json({ error: "This request has already been answered." }, { status: 400 });
    }

    if (action === "accept") {
      const accepted = await prisma.friendship.update({
        where: { id },
        data: { status: "accepted", respondedAt: new Date() },
      });
      return responseFor(accepted);
    }

    if (action === "decline") {
      const declined = await prisma.friendship.update({
        where: { id },
        data: { status: "declined", respondedAt: new Date() },
      });
      return responseFor(declined);
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) return NextResponse.json({ ok: true });
    if (friendship.requesterId !== session.user.id && friendship.addresseeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.friendship.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
