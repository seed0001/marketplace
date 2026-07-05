CREATE TABLE "AiProviderSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "provider" TEXT NOT NULL DEFAULT 'openrouter',
  "model" TEXT NOT NULL DEFAULT 'openrouter/auto',
  "encryptedApiKey" TEXT,
  "keyIv" TEXT,
  "keyTag" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiProviderSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiProviderSettings" ADD CONSTRAINT "AiProviderSettings_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
