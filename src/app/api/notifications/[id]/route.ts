import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { activeNotificationWhere, setNotificationReceipt } from "@/lib/notifications";

const actionSchema = z.object({
  action: z.enum(["read", "dismiss"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid notification action" }, { status: 400 });

    const notification = await prisma.siteNotification.findFirst({
      where: { id, ...activeNotificationWhere() },
      select: { id: true },
    });
    if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    await setNotificationReceipt(
      id,
      session.user.id,
      parsed.data.action === "dismiss" ? { readAt: now, dismissedAt: now } : { readAt: now }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
