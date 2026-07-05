CREATE TABLE "ContentModerationEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentModerationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentModerationEvent_actorId_idx" ON "ContentModerationEvent"("actorId");
CREATE INDEX "ContentModerationEvent_createdAt_idx" ON "ContentModerationEvent"("createdAt");
CREATE INDEX "ContentModerationEvent_contentType_contentId_idx" ON "ContentModerationEvent"("contentType", "contentId");

ALTER TABLE "ContentModerationEvent"
ADD CONSTRAINT "ContentModerationEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
