import Link from "next/link";
import { getOpenRouterConfiguration } from "@/lib/ai-settings";
import { prisma } from "@/lib/prisma";
import { requireAdministrator } from "@/lib/staff";
import { AiSettingsForm } from "./AiSettingsForm";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  await requireAdministrator();
  const [config, settings] = await Promise.all([
    getOpenRouterConfiguration(),
    prisma.aiProviderSettings.findUnique({
      where: { id: "default" },
      select: { updatedAt: true, updatedBy: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#07090a] px-6 py-10 text-zinc-100">
      <main className="mx-auto max-w-3xl">
        <Link href="/staff/analytics" className="text-xs text-zinc-500 hover:text-emerald-300">← Back to intelligence</Link>
        <div className="mt-8">
          <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Administrator control</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Seller AI configuration</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Choose the model powering Seller Studio and manage the platform OpenRouter credential. These controls are available only to administrators.</p>
        </div>

        <section className="mt-8 rounded-[26px] border border-white/10 bg-white/[.025] p-7">
          <AiSettingsForm
            initialModel={config.model}
            maskedKey={config.apiKey ? `••••••••${config.apiKey.slice(-4)}` : ""}
            source={config.source}
          />
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><div className="text-[9px] uppercase tracking-wider text-zinc-600">Access</div><div className="mt-2 text-xs text-zinc-300">Administrators only</div></div>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><div className="text-[9px] uppercase tracking-wider text-zinc-600">Key storage</div><div className="mt-2 text-xs text-zinc-300">AES-256-GCM encrypted</div></div>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><div className="text-[9px] uppercase tracking-wider text-zinc-600">Last changed</div><div className="mt-2 truncate text-xs text-zinc-300">{settings ? `${settings.updatedAt.toLocaleDateString()} · ${settings.updatedBy?.name || settings.updatedBy?.email || "Administrator"}` : "Environment defaults"}</div></div>
        </div>
      </main>
    </div>
  );
}
