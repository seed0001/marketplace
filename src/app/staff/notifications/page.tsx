import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { formatRelativeTime } from "@/lib/utils";
import { isSmsConfigured } from "@/lib/sms";
import { archiveSiteNotification } from "./actions";
import { StaffMessageComposer } from "./StaffMessageComposer";

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

  const [activeCount, urgentCount, totalReceipts, notifications, members, smsReadyCount, smsDeliveryCount] = await Promise.all([
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
        _count: { select: { receipts: true, targets: true, deliveries: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, name: true, email: true, phoneNumber: true, phoneNotificationsEnabled: true },
    }),
    prisma.user.count({ where: { phoneNumber: { not: null }, phoneNotificationsEnabled: true } }),
    prisma.siteNotificationDelivery.count({ where: { channel: "sms" } }),
  ]);
  const smsConfigured = isSmsConfigured();

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Live notices" value={number.format(activeCount)} detail="Visible to signed-in users" />
          <Metric label="Urgent notices" value={number.format(urgentCount)} detail="Maintenance or high-priority items" />
          <Metric label="User actions" value={number.format(totalReceipts)} detail="Read and dismiss receipts all time" />
          <Metric label="SMS ready" value={number.format(smsReadyCount)} detail={smsConfigured ? `${smsDeliveryCount} SMS attempts logged` : "Provider not configured"} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <h2 className="font-semibold">Send a message</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-600">
              Send to every member or pick specific recipients. Web notifications always appear in Updates; SMS is attempted for opted-in phone numbers when configured.
            </p>
            <StaffMessageComposer
              smsConfigured={smsConfigured}
              members={members.map((member) => ({
                id: member.id,
                label: member.name || member.email,
                email: member.email,
                phoneReady: Boolean(member.phoneNumber && member.phoneNotificationsEnabled),
              }))}
            />
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
                          <span>{notification.audience === "all" ? "Everyone" : `${number.format(notification._count.targets)} recipients`}</span>
                          <span>{number.format(notification._count.receipts)} user actions</span>
                          <span>{number.format(notification._count.deliveries)} SMS logs</span>
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
