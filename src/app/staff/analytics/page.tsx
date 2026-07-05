import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("en-US");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${34 - (value / max) * 30}`).join(" ");
  return (
    <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="h-20 w-full overflow-visible" aria-label="Traffic trend">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#34d399" stopOpacity=".35" /><stop offset="1" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,38 ${points} 100,38`} fill="url(#area)" />
      <polyline points={points} fill="none" stroke="#34d399" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-emerald-400/30 bg-emerald-400/[.06]" : "border-white/10 bg-white/[.035]"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

function Bars({ items, total }: { items: { label: string; value: number; sub?: string }[]; total?: number }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-4">
      {items.length === 0 && <div className="py-10 text-center text-sm text-zinc-600">No activity in this period</div>}
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-end justify-between gap-3 text-sm">
            <div className="min-w-0 truncate text-zinc-300">{item.label}<span className="ml-2 text-xs text-zinc-600">{item.sub}</span></div>
            <div className="font-mono text-xs text-zinc-400">{number.format(item.value)}{total ? ` · ${pct(item.value / total)}` : ""}</div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const staff = await requireStaff();
  const requested = Number((await searchParams).range || 30);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  // This is request-time reporting data, so the moving window intentionally
  // anchors to the time of the current server request.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - days * 86400000);

  const [
    events, sessions, newUsers, allUsers, activeListings, conversations, messages,
    listingViews, topListings, topSellers, recentActivity, deviceGroups, sourceGroups,
  ] = await Promise.all([
    prisma.analyticsEvent.findMany({ where: { occurredAt: { gte: since } }, select: { type: true, occurredAt: true, visitorId: true, sessionId: true, userId: true, path: true, label: true, href: true } }),
    prisma.analyticsSession.findMany({ where: { startedAt: { gte: since } }, select: { id: true, visitorId: true, startedAt: true, lastSeenAt: true, entryPath: true, referrer: true, source: true, deviceType: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count(),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.conversation.count({ where: { createdAt: { gte: since } } }),
    prisma.message.count({ where: { createdAt: { gte: since } } }),
    prisma.listingView.count({ where: { createdAt: { gte: since } } }),
    prisma.listing.findMany({
      where: { status: "active" },
      take: 8,
      orderBy: { views: { _count: "desc" } },
      select: { id: true, title: true, price: true, user: { select: { name: true } }, _count: { select: { views: true, conversations: true } } },
    }),
    prisma.user.findMany({
      where: { listings: { some: {} } },
      take: 8,
      orderBy: { listings: { _count: "desc" } },
      select: { id: true, name: true, email: true, _count: { select: { listings: true, conversationsAsSeller: true, feedbackReceived: true } } },
    }),
    prisma.analyticsEvent.findMany({ where: { occurredAt: { gte: since } }, orderBy: { occurredAt: "desc" }, take: 12, select: { id: true, type: true, path: true, label: true, occurredAt: true, user: { select: { name: true, email: true } } } }),
    prisma.analyticsSession.groupBy({ by: ["deviceType"], where: { startedAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { deviceType: "desc" } } }),
    prisma.analyticsSession.groupBy({ by: ["source"], where: { startedAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 8 }),
  ]);

  const pageViews = events.filter((event) => event.type === "page_view");
  const clicks = events.filter((event) => event.type === "click");
  const uniqueVisitors = new Set(events.map((event) => event.visitorId)).size;
  const knownVisitors = new Set(events.filter((event) => event.userId).map((event) => event.userId)).size;
  const anonymousVisitors = new Set(events.filter((event) => !event.userId).map((event) => event.visitorId)).size;
  const engagedSessions = new Set(clicks.map((event) => event.sessionId)).size;
  const bounceRate = sessions.length ? 1 - engagedSessions / sessions.length : 0;
  const avgDuration = sessions.length ? sessions.reduce((sum, item) => sum + Math.max(0, item.lastSeenAt.getTime() - item.startedAt.getTime()), 0) / sessions.length / 1000 : 0;

  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - i));
    const next = new Date(date.getTime() + 86400000);
    return pageViews.filter((event) => event.occurredAt >= date && event.occurredAt < next).length;
  });

  const countBy = <T,>(list: T[], key: (item: T) => string) => [...list.reduce((map, item) => map.set(key(item), (map.get(key(item)) || 0) + 1), new Map<string, number>())]
    .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const topPages = countBy(pageViews, (event) => event.path).slice(0, 8);
  const topClicks = countBy(clicks, (event) => event.label || event.href || "(unlabelled)").slice(0, 8);

  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <div className="border-b border-white/10 bg-[#0b0e0f]/95">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">VibeMarket Intelligence</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Marketplace command center</h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="hidden sm:inline">Signed in as {staff.name || staff.email}</span>
            {staff.role === "ADMIN" && <Link href="/staff/ai-settings" className="rounded-lg border border-violet-400/20 px-3 py-2 text-violet-300 hover:bg-violet-400/5">AI setup</Link>}
            <Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5">Refresh</Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Live first-party telemetry</div>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">Traffic, anonymous behavior, registered members, listing demand, seller activity, and marketplace communication in one operating view.</p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/[.03] p-1">
            {[7, 30, 90].map((range) => <Link key={range} href={`/staff/analytics?range=${range}`} className={`rounded-lg px-4 py-2 text-xs font-medium ${days === range ? "bg-emerald-400 text-black" : "text-zinc-500 hover:text-white"}`}>{range} days</Link>)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Page views" value={compact.format(pageViews.length)} detail={`${compact.format(uniqueVisitors)} unique visitors`} accent />
          <Metric label="Sessions" value={compact.format(sessions.length)} detail={`${pct(bounceRate)} click-free sessions`} />
          <Metric label="Anonymous" value={compact.format(anonymousVisitors)} detail={`${knownVisitors} known members active`} />
          <Metric label="All clicks" value={compact.format(clicks.length)} detail={`${sessions.length ? (clicks.length / sessions.length).toFixed(1) : "0"} per session`} />
          <Metric label="New members" value={compact.format(newUsers)} detail={`${number.format(allUsers)} total accounts`} />
          <Metric label="Avg. session" value={`${Math.floor(avgDuration / 60)}m ${Math.round(avgDuration % 60)}s`} detail={`${number.format(activeListings)} active listings`} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_.9fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <div className="flex items-center justify-between"><div><h2 className="font-semibold">Traffic pulse</h2><p className="mt-1 text-xs text-zinc-600">Daily page views across the marketplace</p></div><div className="font-mono text-xs text-emerald-400">{number.format(pageViews.length)} events</div></div>
            <div className="mt-8"><Sparkline values={daily} /></div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-700"><span>{days} days ago</span><span>Today</span></div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Marketplace demand</h2><p className="mt-1 text-xs text-zinc-600">Buyer intent and seller contact</p>
            <div className="mt-7 grid grid-cols-3 gap-3">
              <div><div className="text-2xl font-semibold">{number.format(listingViews)}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">Listing views</div></div>
              <div><div className="text-2xl font-semibold">{number.format(conversations)}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">Inquiries</div></div>
              <div><div className="text-2xl font-semibold">{number.format(messages)}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">Messages</div></div>
            </div>
            <div className="mt-7 border-t border-white/5 pt-4 text-xs leading-5 text-zinc-500">Inquiry conversion <span className="float-right font-mono text-zinc-300">{listingViews ? pct(conversations / listingViews) : "0%"}</span><br />Listed inventory value <span className="float-right font-mono text-zinc-300">{money.format(topListings.reduce((sum, item) => sum + item.price, 0))} top items</span></div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6"><h2 className="font-semibold">Most viewed pages</h2><p className="mt-1 mb-6 text-xs text-zinc-600">Where visitor attention is accumulating</p><Bars items={topPages} total={pageViews.length} /></section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6"><h2 className="font-semibold">What people click</h2><p className="mt-1 mb-6 text-xs text-zinc-600">Every meaningful link and control, known or anonymous</p><Bars items={topClicks} total={clicks.length} /></section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr_.8fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Listing performance</h2><p className="mt-1 mb-5 text-xs text-zinc-600">What is being sold and where demand is forming</p>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-zinc-600"><tr><th className="pb-3 font-medium">Listing</th><th className="pb-3 font-medium">Seller</th><th className="pb-3 text-right font-medium">Price</th><th className="pb-3 text-right font-medium">Views</th><th className="pb-3 text-right font-medium">Leads</th></tr></thead><tbody>{topListings.map((listing) => <tr key={listing.id} className="border-t border-white/5"><td className="max-w-48 truncate py-3"><Link className="text-zinc-200 hover:text-emerald-300" href={`/listings/${listing.id}`}>{listing.title}</Link></td><td className="py-3 text-zinc-500">{listing.user.name || "Anonymous"}</td><td className="py-3 text-right font-mono">{money.format(listing.price)}</td><td className="py-3 text-right font-mono">{listing._count.views}</td><td className="py-3 text-right font-mono text-emerald-400">{listing._count.conversations}</td></tr>)}</tbody></table></div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Seller desk</h2><p className="mt-1 mb-5 text-xs text-zinc-600">Inventory, inbound conversations, reputation</p>
            <div className="space-y-1">{topSellers.map((seller, index) => <Link href={`/users/${seller.id}`} key={seller.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[.04]"><span className="font-mono text-[10px] text-zinc-700">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="truncate text-sm text-zinc-300">{seller.name || seller.email}</div><div className="text-[10px] text-zinc-600">{seller._count.listings} listings · {seller._count.feedbackReceived} reviews</div></div><div className="font-mono text-xs text-emerald-400">{seller._count.conversationsAsSeller} leads</div></Link>)}</div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Acquisition</h2><p className="mt-1 mb-6 text-xs text-zinc-600">Session origin and device mix</p>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Sources</div><div className="mt-4"><Bars items={sourceGroups.map((item) => ({ label: item.source || "Direct / untagged", value: item._count._all }))} total={sessions.length} /></div>
            <div className="mt-7 border-t border-white/5 pt-5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Devices</div><div className="mt-4"><Bars items={deviceGroups.map((item) => ({ label: item.deviceType || "Unknown", value: item._count._all }))} total={sessions.length} /></div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Live activity ledger</h2><p className="mt-1 text-xs text-zinc-600">Latest observable visitor behavior</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-400">First party</span></div>
          <div className="mt-5 divide-y divide-white/5">{recentActivity.map((event) => <div key={event.id} className="grid grid-cols-[75px_1fr_auto] gap-4 py-3 text-xs"><span className={`font-mono uppercase ${event.type === "click" ? "text-amber-400" : "text-sky-400"}`}>{event.type.replace("_", " ")}</span><div className="min-w-0 truncate text-zinc-400"><span className="text-zinc-200">{event.user?.name || event.user?.email || "Anonymous visitor"}</span> · {event.label || event.path}</div><time className="font-mono text-zinc-700">{event.occurredAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>)}</div>
        </section>

        <p className="mt-6 text-center text-[10px] text-zinc-700">Anonymous IDs are first-party and pseudonymous. Raw IP addresses are never stored. Staff dashboard visits are excluded from telemetry.</p>
      </main>
    </div>
  );
}
