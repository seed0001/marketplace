import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.buyerId !== session.user.id && conversation.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.buyerId !== session.user.id && conversation.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        conversationId: id,
        senderId: session.user.id,
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
