"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatRelativeTime } from "@/lib/utils";

type SiteNotification = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  linkLabel: string | null;
  linkHref: string | null;
  startsAt: string;
  readAt: string | null;
};

type NotificationsResponse = {
  unreadCount: number;
  notifications: SiteNotification[];
};

function priorityClasses(priority: string) {
  if (priority === "urgent") return "border-red-400/30 bg-red-400/[.08] text-red-200";
  if (priority === "important") return "border-amber-400/30 bg-amber-400/[.08] text-amber-200";
  return "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200";
}

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);

  async function loadNotifications(showLoading = true) {
    if (status !== "authenticated") return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as NotificationsResponse;
      setUnreadCount(data.unreadCount);
      setNotifications(data.notifications);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function updateNotification(id: string, action: "read" | "dismiss") {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadNotifications();
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = window.setTimeout(() => void loadNotifications(false), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) void loadNotifications();
        }}
        className="relative rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
        aria-label={`Updates${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        Updates
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-bold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-white">Site updates</div>
              <div className="text-[11px] text-zinc-500">{unreadCount ? `${unreadCount} unread` : "All caught up"}</div>
            </div>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-emerald-300 hover:text-emerald-200">
              Inbox
            </Link>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 && <div className="px-4 py-8 text-center text-sm text-zinc-500">Loading updates...</div>}
            {!loading && notifications.length === 0 && <div className="px-4 py-8 text-center text-sm text-zinc-500">No active site updates.</div>}
            {notifications.map((notification) => (
              <div key={notification.id} className={`border-b border-white/5 px-4 py-3 last:border-0 ${notification.readAt ? "" : "bg-white/[.025]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClasses(notification.priority)}`}>
                        {notification.category}
                      </span>
                      {!notification.readAt && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="Unread" />}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-zinc-100">{notification.title}</h3>
                  </div>
                  <time className="shrink-0 font-mono text-[10px] text-zinc-600">{formatRelativeTime(notification.startsAt)}</time>
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-400">{notification.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {notification.linkHref && (
                    <Link
                      href={notification.linkHref}
                      onClick={() => {
                        setOpen(false);
                        void updateNotification(notification.id, "read");
                      }}
                      className="rounded-lg border border-emerald-400/20 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-400/10"
                    >
                      {notification.linkLabel || "Open"}
                    </Link>
                  )}
                  {!notification.readAt && (
                    <button type="button" onClick={() => void updateNotification(notification.id, "read")} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/5">
                      Mark read
                    </button>
                  )}
                  <button type="button" onClick={() => void updateNotification(notification.id, "dismiss")} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-500 hover:bg-white/5 hover:text-zinc-300">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
