import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { activeNotificationWhere, getUserNotifications } from "@/lib/notifications";
import { publicUrl } from "@/lib/public-url";

function redirectToInbox(request: NextRequest) {
  return NextResponse.redirect(publicUrl("/notifications", request), { status: 303 });
}

export async function GET() {
  try {
    const session = await requireAuth();
    const allNotifications = await getUserNotifications(session.user.id, 100);
    const unreadCount = allNotifications.filter((notification) => !notification.readAt).length;
    const notifications = allNotifications.slice(0, 8);

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map((notification) => ({
        ...notification,
        startsAt: notification.startsAt.toISOString(),
        expiresAt: notification.expiresAt?.toISOString() ?? null,
        readAt: notification.readAt?.toISOString() ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    if (formData.get("action") !== "read_all") {
      return redirectToInbox(request);
    }

    const notifications = await prisma.siteNotification.findMany({
      where: {
        ...activeNotificationWhere(),
        AND: [
          {
            OR: [
              { audience: "all" },
              { targets: { some: { userId: session.user.id } } },
            ],
          },
        ],
      },
      select: { id: true },
    });

    if (notifications.length > 0) {
      const now = new Date();
      await prisma.$transaction(
        notifications.map((notification) =>
          prisma.siteNotificationReceipt.upsert({
            where: { notificationId_userId: { notificationId: notification.id, userId: session.user.id } },
            update: { readAt: now },
            create: { notificationId: notification.id, userId: session.user.id, readAt: now },
          })
        )
      );
    }

    revalidatePath("/notifications");
    return redirectToInbox(request);
  } catch {
    return NextResponse.redirect(publicUrl("/auth/signin?callbackUrl=/notifications", request), { status: 303 });
  }
}
