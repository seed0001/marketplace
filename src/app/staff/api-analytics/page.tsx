import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("en-US");

function pct(part: number, whole: number) {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function statusTone(statusCode: number) {
  if (statusCode >= 500) return "text-red-300";
  if (statusCode >= 400) return "text-amber-300";
  if (statusCode >= 300) return "text-sky-300";
  return "text-emerald-300";
}

function requestKind(route: string) {
  if (route.endsWith("/me")) return "connection checks";
  if (route.startsWith("POST")) return "listing creation";
  if (route.startsWith("PUT")) return "listing updates";
  if (route.startsWith("DELETE")) return "listing deletion";
  if (route.includes("/listings")) return "listing reads";
  return "API calls";
}

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-cyan-400/30 bg-cyan-400/[.06]" : "border-white/10 bg-white/[.035]"}`}>
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
      {items.length === 0 && <div className="py-10 text-center text-sm text-zinc-600">No API activity in this period</div>}
      {items.map((item) => (
        <div key={`${item.label}-${item.sub || ""}`}>
          <div className="mb-1.5 flex items-end justify-between gap-3 text-sm">
            <div className="min-w-0 truncate text-zinc-300">
              {item.label}
              {item.sub && <span className="ml-2 text-xs text-zinc-600">{item.sub}</span>}
            </div>
            <div className="font-mono text-xs text-zinc-400">{number.format(item.value)}{total ? ` - ${pct(item.value, total)}` : ""}</div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-300" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ApiAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const staff = await requireStaff();
  const requested = Number((await searchParams).range || 30);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  // This dashboard reports a moving operational window anchored to the current request.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - days * 86400000);

  const [
    totalKeys,
    activeKeys,
    revokedKeys,
    totalOwners,
    usedKeys,
    usageCount,
    errorCount,
    routeGroups,
    statusGroups,
    keyGroups,
    recentUsage,
    keyOwners,
  ] = await Promise.all([
    prisma.sellerApiKey.count(),
    prisma.sellerApiKey.count({ where: { revokedAt: null } }),
    prisma.sellerApiKey.count({ where: { revokedAt: { not: null } } }),
    prisma.user.count({ where: { apiKeys: { some: {} } } }),
    prisma.sellerApiKey.count({ where: { usages: { some: { occurredAt: { gte: since } } } } }),
    prisma.sellerApiKeyUsage.count({ where: { occurredAt: { gte: since } } }),
    prisma.sellerApiKeyUsage.count({ where: { occurredAt: { gte: since }, statusCode: { gte: 400 } } }),
    prisma.sellerApiKeyUsage.groupBy({
      by: ["route"],
      where: { occurredAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { route: "desc" } },
      take: 10,
    }),
    prisma.sellerApiKeyUsage.groupBy({
      by: ["statusCode"],
      where: { occurredAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { statusCode: "desc" } },
      take: 10,
    }),
    prisma.sellerApiKeyUsage.groupBy({
      by: ["apiKeyId"],
      where: { occurredAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { apiKeyId: "desc" } },
      take: 8,
    }),
    prisma.sellerApiKeyUsage.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      take: 20,
      select: {
        id: true,
        route: true,
        path: true,
        method: true,
        statusCode: true,
        userAgent: true,
        occurredAt: true,
        user: { select: { id: true, name: true, email: true } },
        apiKey: { select: { id: true, name: true, prefix: true, revokedAt: true } },
      },
    }),
    prisma.user.findMany({
      where: { apiKeys: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        apiKeys: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            prefix: true,
            createdAt: true,
            lastUsedAt: true,
            revokedAt: true,
            _count: { select: { usages: true } },
          },
        },
      },
    }),
  ]);

  const keyIds = keyGroups.map((group) => group.apiKeyId);
  const keyDetails = keyIds.length
    ? await prisma.sellerApiKey.findMany({
        where: { id: { in: keyIds } },
        select: { id: true, name: true, prefix: true, revokedAt: true, user: { select: { id: true, name: true, email: true } } },
      })
    : [];
  const keyDetailMap = new Map(keyDetails.map((key) => [key.id, key]));
  const topKeys = keyGroups.map((group) => {
    const key = keyDetailMap.get(group.apiKeyId);
    return {
      label: key?.name || "Deleted key",
      sub: key ? `${key.user.name || key.user.email} - ${key.prefix}...${key.revokedAt ? " revoked" : ""}` : undefined,
      value: group._count._all,
    };
  });

  const activeOwners = keyOwners.filter((owner) => owner.apiKeys.some((key) => !key.revokedAt)).length;
  const unusedActiveKeys = Math.max(0, activeKeys - usedKeys);
  const routeItems = routeGroups.map((group) => ({ label: group.route, value: group._count._all, sub: requestKind(group.route) }));
  const statusItems = statusGroups.map((group) => ({ label: String(group.statusCode), value: group._count._all, sub: group.statusCode >= 400 ? "needs attention" : "successful" }));

  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]/95">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-start justify-between gap-4 px-6 py-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.28em] text-cyan-300">API operations</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Seller API analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Valid API-key usage by seller, key, endpoint, status, and recent request. Signed in as {staff.name || staff.email}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5">Intelligence</Link>
            <Link href="/staff/roster" className="rounded-lg border border-emerald-400/20 px-3 py-2 text-emerald-300 hover:bg-emerald-400/5">Roster</Link>
            <Link href="/staff/api-analytics" className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5">Refresh</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-cyan-200"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />Programmatic storefront telemetry</div>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              This view starts from the new request log, so historical endpoint detail begins after this deployment.
            </p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/[.03] p-1">
            {[7, 30, 90].map((range) => (
              <Link key={range} href={`/staff/api-analytics?range=${range}`} className={`rounded-lg px-4 py-2 text-xs font-medium ${days === range ? "bg-cyan-300 text-black" : "text-zinc-500 hover:text-white"}`}>{range} days</Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="API requests" value={compact.format(usageCount)} detail={`${number.format(usedKeys)} keys used in ${days} days`} accent />
          <Metric label="Error rate" value={pct(errorCount, usageCount)} detail={`${number.format(errorCount)} requests returned 4xx/5xx`} />
          <Metric label="Active keys" value={number.format(activeKeys)} detail={`${number.format(unusedActiveKeys)} unused in this window`} />
          <Metric label="Revoked keys" value={number.format(revokedKeys)} detail={`${number.format(totalKeys)} keys created all time`} />
          <Metric label="Key owners" value={number.format(totalOwners)} detail={`${number.format(activeOwners)} have active keys`} />
          <Metric label="Coverage" value={pct(activeOwners, totalOwners)} detail="Key owners with at least one active key" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Endpoint mix</h2>
            <p className="mt-1 mb-6 text-xs text-zinc-600">What sellers and agents are using keys for</p>
            <Bars items={routeItems} total={usageCount} />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Response health</h2>
            <p className="mt-1 mb-6 text-xs text-zinc-600">Status codes returned to API clients</p>
            <Bars items={statusItems} total={usageCount} />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Most active keys</h2>
            <p className="mt-1 mb-6 text-xs text-zinc-600">Keys producing the most requests</p>
            <Bars items={topKeys} total={usageCount} />
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent API request ledger</h2>
              <p className="mt-1 text-xs text-zinc-600">Latest valid-key requests, excluding request and response bodies</p>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[10px] uppercase tracking-widest text-cyan-300">Bearer-key only</span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="pb-3 font-medium">When</th>
                  <th className="pb-3 font-medium">Seller</th>
                  <th className="pb-3 font-medium">Key</th>
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Path</th>
                  <th className="pb-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsage.map((event) => (
                  <tr key={event.id} className="border-t border-white/5">
                    <td className="whitespace-nowrap py-3 font-mono text-zinc-600">{formatRelativeTime(event.occurredAt)}</td>
                    <td className="max-w-48 truncate py-3">
                      <Link href={`/users/${event.user.id}`} className="text-zinc-200 hover:text-cyan-300">{event.user.name || event.user.email}</Link>
                    </td>
                    <td className="max-w-48 truncate py-3 text-zinc-500">
                      {event.apiKey.name} <span className="font-mono text-zinc-700">{event.apiKey.prefix}...</span>
                    </td>
                    <td className="py-3 font-mono text-zinc-300">{event.route}</td>
                    <td className="max-w-64 truncate py-3 font-mono text-zinc-600">{event.path}</td>
                    <td className={`py-3 text-right font-mono ${statusTone(event.statusCode)}`}>{event.statusCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentUsage.length === 0 && <div className="py-12 text-center text-sm text-zinc-600">No API requests have been recorded in this range.</div>}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Who has API keys</h2>
              <p className="mt-1 text-xs text-zinc-600">Sellers and members who have created at least one key</p>
            </div>
            <div className="font-mono text-xs text-zinc-500">{number.format(keyOwners.length)} shown</div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 text-right font-medium">Active</th>
                  <th className="pb-3 text-right font-medium">Revoked</th>
                  <th className="pb-3 font-medium">Newest key</th>
                  <th className="pb-3 font-medium">Last used</th>
                  <th className="pb-3 text-right font-medium">All usage</th>
                </tr>
              </thead>
              <tbody>
                {keyOwners.map((owner) => {
                  const active = owner.apiKeys.filter((key) => !key.revokedAt);
                  const revoked = owner.apiKeys.length - active.length;
                  const newest = owner.apiKeys[0];
                  const lastUsed = owner.apiKeys.reduce<Date | null>(
                    (latest, key) => (!key.lastUsedAt || (latest && latest > key.lastUsedAt) ? latest : key.lastUsedAt),
                    null,
                  );
                  const allUsage = owner.apiKeys.reduce((sum, key) => sum + key._count.usages, 0);
                  return (
                    <tr key={owner.id} className="border-t border-white/5">
                      <td className="max-w-64 truncate py-3">
                        <Link href={`/users/${owner.id}`} className="text-zinc-200 hover:text-cyan-300">{owner.name || owner.email}</Link>
                        <div className="truncate text-[10px] text-zinc-600">{owner.email}</div>
                      </td>
                      <td className="py-3 text-right font-mono text-emerald-300">{number.format(active.length)}</td>
                      <td className="py-3 text-right font-mono text-zinc-600">{number.format(revoked)}</td>
                      <td className="max-w-56 truncate py-3 text-zinc-500">
                        {newest ? (
                          <>
                            {newest.name} <span className="font-mono text-zinc-700">{newest.prefix}...</span>
                          </>
                        ) : (
                          "No keys"
                        )}
                      </td>
                      <td className="py-3 text-zinc-500">{lastUsed ? formatRelativeTime(lastUsed) : "Never"}</td>
                      <td className="py-3 text-right font-mono text-zinc-300">{number.format(allUsage)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {keyOwners.length === 0 && <div className="py-12 text-center text-sm text-zinc-600">No one has created an API key yet.</div>}
          </div>
          <p className="mt-4 text-[10px] text-zinc-700">
            Showing up to 100 most recent key owners. Key usage rows store method, route, path, status, user agent, owner, and key metadata only.
          </p>
        </section>
      </main>
    </div>
  );
}
