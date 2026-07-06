ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

ALTER TABLE "Conversation" ADD COLUMN "directKey" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'listing';
ALTER TABLE "Conversation" ALTER COLUMN "listingId" DROP NOT NULL;

CREATE UNIQUE INDEX "Conversation_directKey_key" ON "Conversation"("directKey");
CREATE INDEX "Conversation_directKey_idx" ON "Conversation"("directKey");
CREATE INDEX "Conversation_kind_idx" ON "Conversation"("kind");

CREATE TABLE "SiteNotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteNotificationRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteNotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "SiteNotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SiteNotificationRecipient_notificationId_userId_key" ON "SiteNotificationRecipient"("notificationId", "userId");
CREATE INDEX "SiteNotificationRecipient_userId_idx" ON "SiteNotificationRecipient"("userId");
CREATE INDEX "SiteNotificationRecipient_notificationId_idx" ON "SiteNotificationRecipient"("notificationId");
CREATE INDEX "SiteNotificationDelivery_notificationId_idx" ON "SiteNotificationDelivery"("notificationId");
CREATE INDEX "SiteNotificationDelivery_userId_createdAt_idx" ON "SiteNotificationDelivery"("userId", "createdAt");
CREATE INDEX "SiteNotificationDelivery_channel_status_idx" ON "SiteNotificationDelivery"("channel", "status");

ALTER TABLE "SiteNotificationRecipient" ADD CONSTRAINT "SiteNotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "SiteNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteNotificationRecipient" ADD CONSTRAINT "SiteNotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteNotificationDelivery" ADD CONSTRAINT "SiteNotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "SiteNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteNotificationDelivery" ADD CONSTRAINT "SiteNotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
