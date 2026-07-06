import { prisma } from "@/lib/prisma";

export const notificationCategories = ["update", "feature", "maintenance", "policy"] as const;
export const notificationPriorities = ["normal", "important", "urgent"] as const;

export type NotificationCategory = (typeof notificationCategories)[number];
export type NotificationPriority = (typeof notificationPriorities)[number];

export function activeNotificationWhere(now = new Date()) {
  return {
    audience: "all",
    archivedAt: null,
    startsAt: { lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

function priorityRank(priority: string) {
  if (priority === "urgent") return 3;
  if (priority === "important") return 2;
  return 1;
}

export async function getUserNotifications(userId: string, take = 20) {
  const notifications = await prisma.siteNotification.findMany({
    where: activeNotificationWhere(),
    orderBy: { startsAt: "desc" },
    take: Math.max(take, 100),
    include: {
      receipts: {
        where: { userId },
        take: 1,
      },
    },
  });

  return notifications
    .map((notification) => {
      const receipt = notification.receipts[0] || null;
      return {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        priority: notification.priority,
        linkLabel: notification.linkLabel,
        linkHref: notification.linkHref,
        startsAt: notification.startsAt,
        expiresAt: notification.expiresAt,
        readAt: receipt?.readAt ?? null,
        dismissedAt: receipt?.dismissedAt ?? null,
      };
    })
    .filter((notification) => !notification.dismissedAt)
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, take);
}

export async function setNotificationReceipt(
  notificationId: string,
  userId: string,
  data: { readAt?: Date | null; dismissedAt?: Date | null }
) {
  return prisma.siteNotificationReceipt.upsert({
    where: { notificationId_userId: { notificationId, userId } },
    update: data,
    create: { notificationId, userId, ...data },
  });
}
