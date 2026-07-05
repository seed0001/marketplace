import Link from "next/link";
import { ensureDiscordChannels } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { requireAdministrator } from "@/lib/staff";
import { DiscordManagementForm } from "./DiscordManagementForm";

export const dynamic = "force-dynamic";

export default async function DiscordManagementPage() {
  await requireAdministrator();
  await ensureDiscordChannels();
  const [settings, channels, deliveries] = await Promise.all([
    prisma.discordBotSettings.findUnique({ where: { id: "default" } }),
    prisma.discordChannelConfig.findMany({ orderBy: { label: "asc" } }),
    prisma.discordDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-6 py-6">
          <div><div className="text-[10px] font-bold uppercase tracking-[.28em] text-indigo-400">Administrator control</div><h1 className="mt-1 text-2xl font-semibold">Discord operations center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Control the private staff server bot, its dedicated AI identity, event routing, reporting prompts, role alerts, and delivery health.</p></div>
          <Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300">Intelligence</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <DiscordManagementForm
          initialSettings={{
            enabled: settings?.enabled || false,
            guildId: settings?.guildId || "",
            applicationId: settings?.applicationId || "",
            openRouterModel: settings?.openRouterModel || "openrouter/auto",
            botTokenConfigured: Boolean(settings?.encryptedBotToken),
            openRouterKeyConfigured: Boolean(settings?.encryptedOpenRouterKey),
          }}
          initialChannels={channels}
          deliveries={deliveries.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), deliveredAt: item.deliveredAt?.toISOString() || null }))}
        />
      </main>
    </div>
  );
}
