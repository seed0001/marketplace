"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { activeNotificationWhere, setNotificationReceipt } from "@/lib/notifications";

const idSchema = z.string().cuid();

async function ensureActiveNotification(notificationId: string) {
  const session = await requireAuth();
  const notification = await prisma.siteNotification.findFirst({
    where: {
      id: notificationId,
      ...activeNotificationWhere(),
      OR: [{ audience: "all" }, { targets: { some: { userId: session.user.id } } }],
    },
    select: { id: true },
  });
  if (!notification) throw new Error("Notification not found");
  return session;
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = idSchema.parse(formData.get("notificationId"));
  const session = await ensureActiveNotification(notificationId);
  await setNotificationReceipt(notificationId, session.user.id, { readAt: new Date() });
  revalidatePath("/notifications");
}

export async function dismissNotification(formData: FormData) {
  const notificationId = idSchema.parse(formData.get("notificationId"));
  const session = await ensureActiveNotification(notificationId);
  const now = new Date();
  await setNotificationReceipt(notificationId, session.user.id, { readAt: now, dismissedAt: now });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const session = await requireAuth();
  const notifications = await prisma.siteNotification.findMany({
    where: {
      ...activeNotificationWhere(),
      OR: [{ audience: "all" }, { targets: { some: { userId: session.user.id } } }],
    },
    select: { id: true },
  });
  if (notifications.length === 0) return;

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
  revalidatePath("/notifications");
}
