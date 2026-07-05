"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

type EventPayload = {
  type: "page_view" | "click";
  path: string;
  title?: string;
  element?: string;
  label?: string;
  href?: string;
  listingId?: string;
};

function send(payload: EventPayload) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/collect", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

function listingIdFromPath(path: string) {
  return path.match(/^\/listings\/([^/]+)$/)?.[1];
}

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (pathname.startsWith("/staff") || pathname.startsWith("/api")) return;
    const path = query ? `${pathname}?${query}` : pathname;
    send({ type: "page_view", path, title: document.title, listingId: listingIdFromPath(pathname) });
  }, [pathname, query]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (pathname.startsWith("/staff")) return;
      const target = event.target instanceof Element
        ? event.target.closest("a,button,[role='button'],input[type='submit']")
        : null;
      if (!target) return;

      const href = target instanceof HTMLAnchorElement ? target.href : undefined;
      const label = (
        target.getAttribute("data-analytics-label") ||
        target.getAttribute("aria-label") ||
        target.textContent ||
        ""
      ).replace(/\s+/g, " ").trim().slice(0, 160);

      send({
        type: "click",
        path: `${pathname}${query ? `?${query}` : ""}`,
        element: target.tagName.toLowerCase(),
        label: label || "(unlabelled)",
        href,
        listingId: listingIdFromPath(pathname),
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname, query]);

  return null;
}

export function AnalyticsTracker() {
  return <Suspense fallback={null}><Tracker /></Suspense>;
}
