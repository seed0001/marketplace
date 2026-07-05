CREATE TABLE "SiteIssueReport" (
    "id" TEXT NOT NULL,
    "affectedPage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "userAgent" TEXT,
    "reporterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteIssueReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteIssueReport_status_createdAt_idx" ON "SiteIssueReport"("status", "createdAt");
CREATE INDEX "SiteIssueReport_reporterId_idx" ON "SiteIssueReport"("reporterId");

ALTER TABLE "SiteIssueReport"
ADD CONSTRAINT "SiteIssueReport_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
