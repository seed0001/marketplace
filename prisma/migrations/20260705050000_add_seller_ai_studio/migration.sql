CREATE TABLE "SellerAiState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastVisitedAt" TIMESTAMP(3),
  "lastBriefingAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerAiState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerAiThread" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Seller copilot',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerAiThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerAiMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerAiMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SellerMemory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'conversation',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerAiState_userId_key" ON "SellerAiState"("userId");
CREATE INDEX "SellerAiThread_userId_updatedAt_idx" ON "SellerAiThread"("userId", "updatedAt");
CREATE INDEX "SellerAiMessage_threadId_createdAt_idx" ON "SellerAiMessage"("threadId", "createdAt");
CREATE UNIQUE INDEX "SellerMemory_userId_kind_content_key" ON "SellerMemory"("userId", "kind", "content");
CREATE INDEX "SellerMemory_userId_updatedAt_idx" ON "SellerMemory"("userId", "updatedAt");

ALTER TABLE "SellerAiState" ADD CONSTRAINT "SellerAiState_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerAiThread" ADD CONSTRAINT "SellerAiThread_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerAiMessage" ADD CONSTRAINT "SellerAiMessage_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "SellerAiThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerMemory" ADD CONSTRAINT "SellerMemory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
