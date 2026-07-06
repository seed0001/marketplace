import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-US");

function pct(part: number, whole: number) {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

// The roster answers a simple question: of everyone who signed up, who has
// actually put something up for sale versus who is only looking around? A
// "seller" has posted at least one listing; a "browser" has posted none.
const segments = ["all", "sellers", "browsers"] as const;
type Segment = (typeof segments)[number];

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-emerald-400/30 bg-emerald-400/[.06]" : "border-white/10 bg-white/[.035]"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

export default async function StaffRosterPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string; q?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const segment: Segment = segments.includes(params.segment as Segment) ? (params.segment as Segment) : "all";
  const q = params.q?.trim().slice(0, 100) || "";
  const contains = q ? { contains: q, mode: "insensitive" as const } : undefined;

  const search = q ? { OR: [{ name: contains }, { email: contains }] } : {};
  const segmentWhere =
    segment === "sellers"
      ? { listings: { some: {} } }
      : segment === "browsers"
        ? { listings: { none: {} } }
        : {};

  const [total, sellerCount, browserCount, activeSellerCount, members] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { listings: { some: {} } } }),
    prisma.user.count({ where: { listings: { none: {} } } }),
    prisma.user.count({ where: { listings: { some: { status: "active" } } } }),
    prisma.user.findMany({
      where: { ...segmentWhere, ...search },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        listings: { select: { status: true, createdAt: true } },
        _count: { select: { conversationsAsBuyer: true, messages: true } },
      },
    }),
  ]);

  const rows = members.map((m) => {
    const activeListings = m.listings.filter((l) => l.status === "active").length;
    const lastListingAt = m.listings.reduce<Date | null>(
      (latest, l) => (!latest || l.createdAt > latest ? l.createdAt : latest),
      null,
    );
    return {
      ...m,
      totalListings: m.listings.length,
      activeListings,
      lastListingAt,
      isSeller: m.listings.length > 0,
    };
  });

  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-4 px-6 py-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Site roster</div>
            <h1 className="mt-1 text-2xl font-semibold">Everyone who signed up</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              The full membership, split by who has actually posted something for sale versus who signed up and is only
              looking around. Signed in as {staff.name || staff.email}.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">Intelligence</Link>
            <Link href="/staff/issues" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">Issue reports</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total members" value={number.format(total)} detail="Accounts created" />
          <Metric label="Sellers" value={number.format(sellerCount)} detail={`${pct(sellerCount, total)} have posted a listing`} accent />
          <Metric label="Just looking" value={number.format(browserCount)} detail={`${pct(browserCount, total)} signed up, no listing`} />
          <Metric label="Actively selling" value={number.format(activeSellerCount)} detail="Have a live listing right now" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {segments.map((item) => {
            const label = item === "all" ? "Everyone" : item === "sellers" ? "Sellers" : "Just looking";
            const count = item === "all" ? total : item === "sellers" ? sellerCount : browserCount;
            return (
              <Link
                key={item}
                href={`/staff/roster?segment=${item}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-xl border px-4 py-2 text-xs ${segment === item ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}
              >
                {label} <span className="ml-1 text-zinc-600">{number.format(count)}</span>
              </Link>
            );
          })}
        </div>

        <form className="mt-4 flex max-w-xl gap-2">
          <input type="hidden" name="segment" value={segment} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-400/40"
          />
          <button className="rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black">Search</button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-600">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Segment</th>
                <th className="px-5 py-3 font-semibold text-right">Listings</th>
                <th className="px-5 py-3 font-semibold text-right">Inquiries sent</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Last listed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/[.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-emerald-200">
                        {(m.name || m.email)[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/users/${m.id}`} className="block truncate font-medium text-zinc-100 hover:text-emerald-300">
                          {m.name || "Unnamed member"}
                        </Link>
                        <div className="truncate text-xs text-zinc-600">{m.email}</div>
                      </div>
                      {m.role !== "MEMBER" && (
                        <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">{m.role.toLowerCase()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {m.isSeller ? (
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        {m.activeListings > 0 ? "Seller" : "Dormant seller"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Just looking</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-zinc-300">
                    {m.totalListings > 0 ? (
                      <span>
                        {number.format(m.activeListings)}<span className="text-zinc-600"> / {number.format(m.totalListings)}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-zinc-400">
                    {m._count.conversationsAsBuyer > 0 ? number.format(m._count.conversationsAsBuyer) : <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-5 py-4 text-zinc-500">{formatDate(m.createdAt)}</td>
                  <td className="px-5 py-4 text-zinc-500">{m.lastListingAt ? formatRelativeTime(m.lastListingAt) : <span className="text-zinc-700">Never</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="py-16 text-center text-sm text-zinc-600">No members match this view.</div>}
        </div>

        {members.length === 200 && (
          <p className="mt-4 text-center text-xs text-zinc-600">Showing the 200 most recent members. Narrow the list with search.</p>
        )}
      </main>
    </div>
  );
}
