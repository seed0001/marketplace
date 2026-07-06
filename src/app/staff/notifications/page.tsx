import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { formatRelativeTime } from "@/lib/utils";
import { archiveSiteNotification, publishSiteNotification } from "./actions";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-US");

function statusMessage(status?: string) {
  if (status === "created") return "Notification published to the website.";
  if (status === "archived") return "Notification archived.";
  if (status === "error") return "Check the notification fields and try again.";
  return null;
}

function priorityClasses(priority: string) {
  if (priority === "urgent") return "border-red-400/30 bg-red-400/[.08] text-red-200";
  if (priority === "important") return "border-amber-400/30 bg-amber-400/[.08] text-amber-200";
  return "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200";
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

export default async function StaffNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const notice = statusMessage(params.status);
  const now = new Date();

  const [activeCount, urgentCount, totalReceipts, notifications] = await Promise.all([
    prisma.siteNotification.count({
      where: {
        archivedAt: null,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.siteNotification.count({
      where: {
        archivedAt: null,
        priority: "urgent",
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.siteNotificationReceipt.count(),
    prisma.siteNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { receipts: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]/95">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-4 px-6 py-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Staff broadcast desk</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Website notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Publish feature updates, maintenance notices, policy changes, and operational announcements to signed-in members.
              Signed in as {staff.name || staff.email}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5">Intelligence</Link>
            <Link href="/notifications" className="rounded-lg border border-emerald-400/20 px-3 py-2 text-emerald-300 hover:bg-emerald-400/5">User inbox</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {notice && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${params.status === "error" ? "border-red-400/20 bg-red-400/[.06] text-red-300" : "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300"}`}>
            {notice}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Live notices" value={number.format(activeCount)} detail="Visible to signed-in users" />
          <Metric label="Urgent notices" value={number.format(urgentCount)} detail="Maintenance or high-priority items" />
          <Metric label="User actions" value={number.format(totalReceipts)} detail="Read and dismiss receipts all time" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Publish a sitewide notification</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-600">
              New notices appear in the navbar Updates menu and the full notification inbox for every signed-in member.
            </p>

            <form action={publishSiteNotification} className="mt-5 space-y-4">
              <div>
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Title</label>
                <input id="title" name="title" required maxLength={120} placeholder="Scheduled maintenance tonight" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50" />
              </div>

              <div>
                <label htmlFor="body" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Message</label>
                <textarea id="body" name="body" required maxLength={3000} rows={7} placeholder="Tell members what changed, what they should expect, and whether any action is needed." className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none placeholder:text-zinc-700 focus:border-emerald-400/50" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Category</label>
                  <select id="category" name="category" defaultValue="update" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50">
                    <option value="update">Update</option>
                    <option value="feature">Feature</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="policy">Policy</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Priority</label>
                  <select id="priority" name="priority" defaultValue="normal" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50">
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="linkLabel" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Link label</label>
                  <input id="linkLabel" name="linkLabel" maxLength={80} placeholder="View details" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50" />
                </div>
                <div>
                  <label htmlFor="linkHref" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Link path or URL</label>
                  <input id="linkHref" name="linkHref" maxLength={500} placeholder="/seller/studio" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50" />
                </div>
              </div>

              <div>
                <label htmlFor="expiresAt" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Expires at</label>
                <input id="expiresAt" name="expiresAt" type="datetime-local" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50" />
                <p className="mt-2 text-[11px] text-zinc-600">Leave blank for a persistent announcement that staff can archive manually.</p>
              </div>

              <button className="w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300">
                Publish notification
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Recent notifications</h2>
                <p className="mt-1 text-xs text-zinc-600">Live, expired, and archived messages</p>
              </div>
              <div className="font-mono text-xs text-zinc-600">{notifications.length} shown</div>
            </div>

            <div className="mt-5 divide-y divide-white/5">
              {notifications.length === 0 && <div className="py-12 text-center text-sm text-zinc-600">No notifications have been published yet.</div>}
              {notifications.map((notification) => {
                const expired = Boolean(notification.expiresAt && notification.expiresAt <= now);
                const archived = Boolean(notification.archivedAt);
                const live = !archived && !expired && notification.startsAt <= now;
                return (
                  <article key={notification.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${priorityClasses(notification.priority)}`}>
                            {notification.category}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${live ? "bg-emerald-400/10 text-emerald-300" : archived ? "bg-zinc-700/40 text-zinc-500" : "bg-amber-400/10 text-amber-300"}`}>
                            {live ? "Live" : archived ? "Archived" : "Expired"}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-white">{notification.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{notification.body}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-700">
                          <span>Published {formatRelativeTime(notification.createdAt)}</span>
                          <span>By {notification.createdBy?.name || notification.createdBy?.email || "Staff"}</span>
                          <span>{number.format(notification._count.receipts)} user actions</span>
                          {notification.expiresAt && <span>Expires {formatRelativeTime(notification.expiresAt)}</span>}
                        </div>
                      </div>
                      {!archived && (
                        <form action={archiveSiteNotification}>
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200">
                            Archive
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
