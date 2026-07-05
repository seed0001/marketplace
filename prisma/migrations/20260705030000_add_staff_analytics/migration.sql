CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'STAFF', 'ADMIN');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

CREATE TABLE "AnalyticsVisitor" (
  "id" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsVisitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsSession" (
  "id" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "entryPath" TEXT NOT NULL,
  "exitPath" TEXT,
  "referrer" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "country" TEXT,
  "region" TEXT,
  "networkHash" TEXT,
  CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "title" TEXT,
  "element" TEXT,
  "label" TEXT,
  "href" TEXT,
  "listingId" TEXT,
  "visitorId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsVisitor_visitorKey_key" ON "AnalyticsVisitor"("visitorKey");
CREATE INDEX "AnalyticsVisitor_lastSeenAt_idx" ON "AnalyticsVisitor"("lastSeenAt");
CREATE UNIQUE INDEX "AnalyticsSession_sessionKey_key" ON "AnalyticsSession"("sessionKey");
CREATE INDEX "AnalyticsSession_visitorId_idx" ON "AnalyticsSession"("visitorId");
CREATE INDEX "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");
CREATE INDEX "AnalyticsSession_source_idx" ON "AnalyticsSession"("source");
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");
CREATE INDEX "AnalyticsEvent_type_occurredAt_idx" ON "AnalyticsEvent"("type", "occurredAt");
CREATE INDEX "AnalyticsEvent_path_occurredAt_idx" ON "AnalyticsEvent"("path", "occurredAt");
CREATE INDEX "AnalyticsEvent_listingId_occurredAt_idx" ON "AnalyticsEvent"("listingId", "occurredAt");
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_visitorId_fkey"
  FOREIGN KEY ("visitorId") REFERENCES "AnalyticsVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_visitorId_fkey"
  FOREIGN KEY ("visitorId") REFERENCES "AnalyticsVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
