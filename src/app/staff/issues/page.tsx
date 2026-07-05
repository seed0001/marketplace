import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { IssueActions } from "./IssueActions";

export const dynamic = "force-dynamic";

const statuses = ["all", "open", "investigating", "resolved", "closed"] as const;

export default async function StaffIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number]) ? params.status! : "all";
  const q = params.q?.trim().slice(0, 100) || "";
  const contains = q ? { contains: q, mode: "insensitive" as const } : undefined;
  const reports = await prisma.siteIssueReport.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(q ? { OR: [{ affectedPage: contains }, { description: contains }, { contact: contains }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporter: { select: { name: true, email: true } } },
  });
  const counts = await prisma.siteIssueReport.groupBy({ by: ["status"], _count: { _all: true } });
  const countMap = new Map(counts.map((item) => [item.status, item._count._all]));

  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-4 px-6 py-6">
          <div><div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Staff support desk</div><h1 className="mt-1 text-2xl font-semibold">Site issue reports</h1><p className="mt-2 text-sm text-zinc-500">Public reports, diagnostics, contact details, and resolution status. Signed in as {staff.name || staff.email}.</p></div>
          <div className="flex gap-2"><Link href="/report-issue" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300">Open public form</Link><Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300">Intelligence</Link></div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => <Link key={item} href={`/staff/issues?status=${item}`} className={`rounded-xl border px-4 py-2 text-xs capitalize ${status === item ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-zinc-500"}`}>{item} {item !== "all" && <span className="ml-1 text-zinc-600">{countMap.get(item) || 0}</span>}</Link>)}
        </div>
        <form className="mt-6 flex max-w-xl gap-2"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search reports or contact information…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-400/40" /><button className="rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black">Search</button></form>
        <div className="mt-6 space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${report.status === "open" ? "bg-red-400/10 text-red-300" : report.status === "investigating" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{report.status}</span><span className="font-mono text-[10px] text-zinc-700">VM-{report.id.slice(-8).toUpperCase()}</span></div>
                  <h2 className="mt-3 text-lg font-medium">{report.affectedPage}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{report.description}</p>
                </div>
                <IssueActions id={report.id} status={report.status} />
              </div>
              <div className="mt-5 grid gap-3 border-t border-white/5 pt-4 text-xs text-zinc-600 sm:grid-cols-2">
                <div><span className="text-zinc-700">Contact</span><br /><span className="text-zinc-300">{report.contact}</span>{report.reporter && <span> · account: {report.reporter.name || report.reporter.email}</span>}</div>
                <div><span className="text-zinc-700">Submitted</span><br />{report.createdAt.toLocaleString()}</div>
                <div className="sm:col-span-2"><span className="text-zinc-700">Browser/device</span><br /><span className="break-all">{report.userAgent || "Not available"}</span></div>
              </div>
            </article>
          ))}
          {!reports.length && <div className="rounded-2xl border border-white/10 py-16 text-center text-sm text-zinc-600">No matching issue reports.</div>}
        </div>
      </main>
    </div>
  );
}
