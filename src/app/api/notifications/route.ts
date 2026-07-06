import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserNotifications } from "@/lib/notifications";

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
