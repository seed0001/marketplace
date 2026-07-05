import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encryptApiKey } from "@/lib/ai-settings";
import { auth } from "@/lib/auth";
import { DISCORD_CHANNEL_DEFAULTS, ensureDiscordChannels } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

async function administrator() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findFirst({ where: { id: session.user.id, role: "ADMIN" }, select: { id: true } });
}

const snowflake = z.string().trim().regex(/^\d{15,22}$/, "Enter a valid Discord ID.").or(z.literal(""));
const channelSchema = z.object({
  eventType: z.enum(["site_issues", "marketplace", "members", "moderation", "analytics"]),
  channelId: snowflake,
  channelName: z.string().trim().max(100),
  mentionRoleId: snowflake,
  systemPrompt: z.string().trim().min(10).max(5000),
  enabled: z.boolean(),
});
const settingsSchema = z.object({
  enabled: z.boolean(),
  guildId: snowflake,
  applicationId: snowflake,
  botToken: z.string().trim().max(500),
  openRouterKey: z.string().trim().max(500),
  openRouterModel: z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9._:/-]+$/),
  channels: z.array(channelSchema).length(DISCORD_CHANNEL_DEFAULTS.length),
});

export async function GET() {
  const admin = await administrator();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureDiscordChannels();
  const [settings, channels, deliveries] = await Promise.all([
    prisma.discordBotSettings.findUnique({ where: { id: "default" } }),
    prisma.discordChannelConfig.findMany({ orderBy: { label: "asc" } }),
    prisma.discordDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return NextResponse.json({
    settings: {
      enabled: settings?.enabled || false,
      guildId: settings?.guildId || "",
      applicationId: settings?.applicationId || "",
      openRouterModel: settings?.openRouterModel || "openrouter/auto",
      botTokenConfigured: Boolean(settings?.encryptedBotToken),
      openRouterKeyConfigured: Boolean(settings?.encryptedOpenRouterKey),
      updatedAt: settings?.updatedAt || null,
    },
    channels,
    deliveries,
  });
}

export async function PUT(request: NextRequest) {
  const admin = await administrator();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid Discord configuration." }, { status: 400 });
  const input = parsed.data;
  const current = await prisma.discordBotSettings.findUnique({ where: { id: "default" } });
  if (!input.botToken && !current?.encryptedBotToken) return NextResponse.json({ error: "Provide a Discord bot token." }, { status: 400 });
  if (!input.openRouterKey && !current?.encryptedOpenRouterKey) return NextResponse.json({ error: "Provide the Discord bot's separate OpenRouter key." }, { status: 400 });

  if (input.botToken) {
    try {
      const verify = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${input.botToken}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!verify.ok) return NextResponse.json({ error: "Discord rejected that bot token." }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "Could not verify the bot token with Discord." }, { status: 502 });
    }
  }

  if (input.openRouterKey) {
    try {
      const verify = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${input.openRouterKey}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!verify.ok) return NextResponse.json({ error: "OpenRouter rejected the Discord bot key." }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "Could not verify the Discord OpenRouter key." }, { status: 502 });
    }
  }

  const botEncrypted = input.botToken ? encryptApiKey(input.botToken) : null;
  const aiEncrypted = input.openRouterKey ? encryptApiKey(input.openRouterKey) : null;
  await prisma.$transaction([
    prisma.discordBotSettings.upsert({
      where: { id: "default" },
      update: {
        enabled: input.enabled, guildId: input.guildId || null, applicationId: input.applicationId || null,
        openRouterModel: input.openRouterModel, updatedById: admin.id,
        ...(botEncrypted ? { encryptedBotToken: botEncrypted.encryptedApiKey, botTokenIv: botEncrypted.keyIv, botTokenTag: botEncrypted.keyTag } : {}),
        ...(aiEncrypted ? { encryptedOpenRouterKey: aiEncrypted.encryptedApiKey, openRouterKeyIv: aiEncrypted.keyIv, openRouterKeyTag: aiEncrypted.keyTag } : {}),
      },
      create: {
        id: "default", enabled: input.enabled, guildId: input.guildId || null, applicationId: input.applicationId || null,
        openRouterModel: input.openRouterModel, updatedById: admin.id,
        ...(() => {
          const bot = botEncrypted!;
          const ai = aiEncrypted!;
          return {
            encryptedBotToken: bot.encryptedApiKey, botTokenIv: bot.keyIv, botTokenTag: bot.keyTag,
            encryptedOpenRouterKey: ai.encryptedApiKey, openRouterKeyIv: ai.keyIv, openRouterKeyTag: ai.keyTag,
          };
        })(),
      },
    }),
    ...input.channels.map((channel) => prisma.discordChannelConfig.update({
      where: { eventType: channel.eventType },
      data: {
        channelId: channel.channelId || null, channelName: channel.channelName || null,
        mentionRoleId: channel.mentionRoleId || null, systemPrompt: channel.systemPrompt, enabled: channel.enabled,
      },
    })),
  ]);
  return NextResponse.json({ ok: true });
}
