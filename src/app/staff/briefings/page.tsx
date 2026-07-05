import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdministrator } from "@/lib/staff";
import { getFishTtsConfiguration } from "@/lib/tts-settings";
import { BriefingsPanel } from "./BriefingsPanel";

export const dynamic = "force-dynamic";

export default async function BriefingsPage() {
  await requireAdministrator();
  const [config, settings] = await Promise.all([
    getFishTtsConfiguration(),
    prisma.ttsProviderSettings.findUnique({ where: { id: "default" } }),
  ]);
  return (
    <div className="min-h-screen bg-[#07090a] px-6 py-10 text-zinc-100">
      <main className="mx-auto max-w-3xl">
        <Link href="/staff/analytics" className="text-xs text-zinc-500 hover:text-emerald-300">← Back to intelligence</Link>
        <div className="mt-8">
          <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Administrator control</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Spoken briefings</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Compile current VibeMarket reports and play them privately through Fish Audio.</p>
        </div>
        <div className="mt-8">
          <BriefingsPanel initialModel={config.model} initialReferenceId={config.referenceId} maskedKey={config.apiKey ? `••••••••${config.apiKey.slice(-4)}` : ""} source={config.source} />
        </div>
        {settings && <p className="mt-5 text-xs text-zinc-700">Scheduling: off · Seller briefing access: off · Last configuration change: {settings.updatedAt.toLocaleString()}</p>}
      </main>
    </div>
  );
}
