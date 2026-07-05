import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdministrator } from "@/lib/staff";
import { AudioSettingsForm } from "./AudioSettingsForm";

export const dynamic = "force-dynamic";

export default async function AudioSettingsPage() {
  await requireAdministrator();
  const settings = await prisma.siteAudioSettings.findUnique({
    where: { id: "default" },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  return (
    <div className="min-h-screen bg-[#07090a] px-6 py-10 text-zinc-100">
      <main className="mx-auto max-w-3xl">
        <Link href="/staff/analytics" className="text-xs text-zinc-500 hover:text-emerald-300">← Back to intelligence</Link>
        <div className="mt-8">
          <div className="text-[10px] font-bold uppercase tracking-[.28em] text-[#1ed760]">Administrator control</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Builder Radio</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Choose the Spotify source offered throughout VibeMarket. Listening is optional for every visitor, and playback stays mounted while they navigate the site.</p>
        </div>
        <section className="mt-8 rounded-[26px] border border-white/10 bg-white/[.025] p-7">
          <AudioSettingsForm initialEnabled={settings?.enabled || false} initialLabel={settings?.label || "Builder Radio"} initialUrl={settings?.spotifyUrl || ""} />
        </section>
        <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.02] p-4 text-xs leading-5 text-zinc-600">
          Spotify requires each listener to press Play. The site does not rebroadcast audio, and volume remains controlled by Spotify or the listener&apos;s device.
          {settings && <span className="mt-2 block text-zinc-700">Last changed {settings.updatedAt.toLocaleString()} by {settings.updatedBy?.name || settings.updatedBy?.email || "Administrator"}.</span>}
        </div>
      </main>
    </div>
  );
}
