import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { getUserNotifications } from "@/lib/notifications";
import { dismissNotification, markAllNotificationsRead, markNotificationRead } from "./actions";

export const dynamic = "force-dynamic";

function priorityClasses(priority: string) {
  if (priority === "urgent") return "border-red-400/30 bg-red-400/[.08] text-red-200";
  if (priority === "important") return "border-amber-400/30 bg-amber-400/[.08] text-amber-200";
  return "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200";
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/notifications");

  const notifications = await getUserNotifications(session.user.id, 100);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="min-h-screen bg-[#080a0a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]/95">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4 px-5 py-6 sm:px-7">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Notification center</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Site updates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Marketplace announcements, maintenance notices, feature updates, and operational messages from the VibeMarket team.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead}>
                <button className="rounded-lg border border-emerald-400/20 px-3 py-2 text-emerald-300 hover:bg-emerald-400/5">
                  Mark all read
                </button>
              </form>
            )}
            <Link href="/messages" className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5">Messages</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-500">
            {notifications.length === 0 ? "No active updates" : `${notifications.length} active update${notifications.length === 1 ? "" : "s"}`}
            {unreadCount > 0 && <span className="ml-2 text-emerald-300">{unreadCount} unread</span>}
          </div>
        </div>

        {notifications.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/10 bg-white/[.025] px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">All clear</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              There are no active announcements right now. New sitewide updates will appear here and in the Updates menu.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article key={notification.id} className={`rounded-2xl border p-5 ${notification.readAt ? "border-white/10 bg-white/[.025]" : "border-emerald-400/20 bg-emerald-400/[.045]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${priorityClasses(notification.priority)}`}>
                        {notification.category}
                      </span>
                      {!notification.readAt && <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Unread</span>}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">{notification.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{notification.body}</p>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-zinc-600">{formatRelativeTime(notification.startsAt)}</time>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {notification.linkHref && (
                    <Link href={notification.linkHref} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-300">
                      {notification.linkLabel || "Open"}
                    </Link>
                  )}
                  {!notification.readAt && (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5">Mark read</button>
                    </form>
                  )}
                  <form action={dismissNotification}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300">Dismiss</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
