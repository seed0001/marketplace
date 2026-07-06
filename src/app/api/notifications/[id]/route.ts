import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { activeNotificationWhere, setNotificationReceipt } from "@/lib/notifications";

const actionSchema = z.object({
  action: z.enum(["read", "dismiss"]),
});

function redirectToInbox(request: NextRequest) {
  return NextResponse.redirect(new URL("/notifications", request.url), { status: 303 });
}

async function updateNotification(id: string, action: "read" | "dismiss") {
  const session = await requireAuth();
  const notification = await prisma.siteNotification.findFirst({
    where: {
      id,
      ...activeNotificationWhere(),
      OR: [{ audience: "all" }, { targets: { some: { userId: session.user.id } } }],
    },
    select: { id: true },
  });
  if (!notification) {
    return { error: "Not found", status: 404 as const };
  }

  const now = new Date();
  await setNotificationReceipt(
    id,
    session.user.id,
    action === "dismiss" ? { readAt: now, dismissedAt: now } : { readAt: now }
  );
  revalidatePath("/notifications");
  return { success: true };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid notification action" }, { status: 400 });

    const result = await updateNotification(id, parsed.data.action);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const parsed = actionSchema.safeParse({ action: formData.get("action") });
    if (parsed.success) await updateNotification(id, parsed.data.action);
    return redirectToInbox(request);
  } catch {
    return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/notifications", request.url), { status: 303 });
  }
}
