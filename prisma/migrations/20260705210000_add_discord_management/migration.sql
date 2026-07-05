CREATE TABLE "DiscordBotSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "guildId" TEXT,
    "applicationId" TEXT,
    "encryptedBotToken" TEXT,
    "botTokenIv" TEXT,
    "botTokenTag" TEXT,
    "openRouterModel" TEXT NOT NULL DEFAULT 'openrouter/auto',
    "encryptedOpenRouterKey" TEXT,
    "openRouterKeyIv" TEXT,
    "openRouterKeyTag" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordBotSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordChannelConfig" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "channelId" TEXT,
    "channelName" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mentionRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordChannelConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscordDelivery" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "discordMessageId" TEXT,
    "channelConfigId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscordChannelConfig_eventType_key" ON "DiscordChannelConfig"("eventType");
CREATE INDEX "DiscordDelivery_status_createdAt_idx" ON "DiscordDelivery"("status", "createdAt");
CREATE INDEX "DiscordDelivery_eventType_createdAt_idx" ON "DiscordDelivery"("eventType", "createdAt");
CREATE INDEX "DiscordDelivery_channelConfigId_idx" ON "DiscordDelivery"("channelConfigId");

ALTER TABLE "DiscordBotSettings"
ADD CONSTRAINT "DiscordBotSettings_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DiscordDelivery"
ADD CONSTRAINT "DiscordDelivery_channelConfigId_fkey"
FOREIGN KEY ("channelConfigId") REFERENCES "DiscordChannelConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
