"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget: records one view of a listing when its detail page mounts.
 * The API decides whether it actually counts (owner views and rapid refreshes
 * are ignored server-side).
 */
export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    // A ref-guard isn't needed: the effect runs once per mount, and the server
    // dedupes. Swallow errors — view tracking must never disrupt the page.
    fetch(`/api/listings/${listingId}/view`, { method: "POST" }).catch(() => {});
  }, [listingId]);

  return null;
}
