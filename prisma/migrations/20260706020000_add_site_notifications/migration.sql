CREATE TABLE "SiteNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'update',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "audience" TEXT NOT NULL DEFAULT 'all',
    "linkLabel" TEXT,
    "linkHref" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteNotificationReceipt" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteNotificationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteNotification_startsAt_idx" ON "SiteNotification"("startsAt");
CREATE INDEX "SiteNotification_expiresAt_idx" ON "SiteNotification"("expiresAt");
CREATE INDEX "SiteNotification_archivedAt_idx" ON "SiteNotification"("archivedAt");
CREATE INDEX "SiteNotification_category_startsAt_idx" ON "SiteNotification"("category", "startsAt");
CREATE INDEX "SiteNotification_priority_startsAt_idx" ON "SiteNotification"("priority", "startsAt");
CREATE INDEX "SiteNotification_createdById_idx" ON "SiteNotification"("createdById");
CREATE UNIQUE INDEX "SiteNotificationReceipt_notificationId_userId_key" ON "SiteNotificationReceipt"("notificationId", "userId");
CREATE INDEX "SiteNotificationReceipt_userId_readAt_idx" ON "SiteNotificationReceipt"("userId", "readAt");
CREATE INDEX "SiteNotificationReceipt_userId_dismissedAt_idx" ON "SiteNotificationReceipt"("userId", "dismissedAt");
CREATE INDEX "SiteNotificationReceipt_notificationId_idx" ON "SiteNotificationReceipt"("notificationId");

ALTER TABLE "SiteNotification" ADD CONSTRAINT "SiteNotification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteNotificationReceipt" ADD CONSTRAINT "SiteNotificationReceipt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "SiteNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteNotificationReceipt" ADD CONSTRAINT "SiteNotificationReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
