CREATE TABLE "SellerWebsite" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SellerWebsite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerWebsite_userId_idx" ON "SellerWebsite"("userId");
CREATE INDEX "SellerWebsite_createdAt_idx" ON "SellerWebsite"("createdAt");

ALTER TABLE "SellerWebsite"
ADD CONSTRAINT "SellerWebsite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
