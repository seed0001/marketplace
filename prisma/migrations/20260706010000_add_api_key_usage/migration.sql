CREATE TABLE "SellerApiKeyUsage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerApiKeyUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerApiKeyUsage_apiKeyId_occurredAt_idx" ON "SellerApiKeyUsage"("apiKeyId", "occurredAt");
CREATE INDEX "SellerApiKeyUsage_userId_occurredAt_idx" ON "SellerApiKeyUsage"("userId", "occurredAt");
CREATE INDEX "SellerApiKeyUsage_route_occurredAt_idx" ON "SellerApiKeyUsage"("route", "occurredAt");
CREATE INDEX "SellerApiKeyUsage_statusCode_occurredAt_idx" ON "SellerApiKeyUsage"("statusCode", "occurredAt");
CREATE INDEX "SellerApiKeyUsage_occurredAt_idx" ON "SellerApiKeyUsage"("occurredAt");

ALTER TABLE "SellerApiKeyUsage" ADD CONSTRAINT "SellerApiKeyUsage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "SellerApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerApiKeyUsage" ADD CONSTRAINT "SellerApiKeyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
