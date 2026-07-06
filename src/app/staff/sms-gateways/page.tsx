import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdministrator } from "@/lib/staff";
import { DEFAULT_SMS_GATEWAYS } from "@/lib/sms-carriers";
import { SmsGatewayManager } from "./SmsGatewayManager";

export const dynamic = "force-dynamic";

export default async function SmsGatewaysPage() {
  await requireAdministrator();
  const gateways = await prisma.smsGateway.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  const initialGateways = gateways.map((gateway) => ({
    id: gateway.id,
    label: gateway.label,
    domain: gateway.domain,
    enabled: gateway.enabled,
    sortOrder: gateway.sortOrder,
  }));

  return (
    <div className="min-h-screen bg-[#07090a] px-6 py-10 text-zinc-100">
      <main className="mx-auto max-w-3xl">
        <Link href="/staff/notifications" className="text-xs text-zinc-500 hover:text-emerald-300">← Back to broadcast desk</Link>
        <div className="mt-8">
          <div className="text-[10px] font-bold uppercase tracking-[.28em] text-[#1ed760]">Administrator control</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">SMS carriers</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            SMS notifications are delivered through each carrier&apos;s free email-to-text gateway. Add carriers here so members can pick them on their profile; they can also enter a gateway that isn&apos;t listed. When this list is empty, a built-in default set is offered instead.
          </p>
        </div>
        <section className="mt-8 rounded-[26px] border border-white/10 bg-white/[.025] p-7">
          <SmsGatewayManager initialGateways={initialGateways} defaults={DEFAULT_SMS_GATEWAYS} />
        </section>
        <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.02] p-4 text-xs leading-5 text-zinc-600">
          The gateway domain is the part after the <code className="text-zinc-400">@</code> in a carrier&apos;s email-to-text address — for example, texting Verizon uses <code className="text-zinc-400">5551234567@vtext.com</code>, so the domain is <code className="text-zinc-400">vtext.com</code>. Delivery is best-effort; carriers may throttle or filter gateway traffic.
        </div>
      </main>
    </div>
  );
}
