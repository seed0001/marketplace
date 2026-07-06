import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Anti-spam cooldown for listing creation: at most LIMIT new listings per
// rolling WINDOW, per account. This exists to contain a compromised or abusive
// API key (or session) — it caps how much bad content can land before staff
// can step in with the purge/revoke tools. Applies to every role, no
// exemptions: a leaked admin key must not be able to flood the catalog either.
export const LISTING_CREATION_LIMIT = 3;
export const LISTING_CREATION_WINDOW_MS = 5 * 60 * 1000;

export type RateLimitedCreate<T> =
  | { ok: true; value: T }
  | { ok: false; retryAfterSeconds: number };

/**
 * Create a listing under the cooldown, atomically.
 *
 * The quota check, the ledger insert, and the listing insert all run inside
 * one transaction that first takes a per-user Postgres advisory lock
 * (pg_advisory_xact_lock, released automatically at commit/rollback). Without
 * the lock, N parallel requests could each read "2 in window" and all pass —
 * exactly the shape of a scripted key attack. With it, requests for the same
 * user serialize and precisely LIMIT creates get through per window.
 *
 * The ledger (ListingCreationEvent) is append-only relative to listings:
 * deleting a listing does not remove its creation event, so churn (post,
 * delete, repost) cannot reset the meter. Events older than the window are
 * pruned here, inside the same lock, keeping the table tiny.
 */
export async function createListingRateLimited<T>(
  userId: string,
  create: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<RateLimitedCreate<T>> {
  return prisma.$transaction(async (tx) => {
    // hashtext() maps the user id onto the advisory-lock keyspace. A hash
    // collision between two users merely makes them briefly share a lock —
    // harmless. The template literal is parameterized by Prisma; no injection.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint)`;

    const windowStart = new Date(Date.now() - LISTING_CREATION_WINDOW_MS);

    await tx.listingCreationEvent.deleteMany({
      where: { userId, createdAt: { lt: windowStart } },
    });

    const eventsInWindow = await tx.listingCreationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    if (eventsInWindow.length >= LISTING_CREATION_LIMIT) {
      // The next slot opens when the oldest event in the window ages out.
      const oldest = eventsInWindow[0].createdAt.getTime();
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + LISTING_CREATION_WINDOW_MS - Date.now()) / 1000)
      );
      return { ok: false as const, retryAfterSeconds };
    }

    await tx.listingCreationEvent.create({ data: { userId } });
    const value = await create(tx);
    return { ok: true as const, value };
  });
}

export function rateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `You can post up to ${LISTING_CREATION_LIMIT} listings every ${LISTING_CREATION_WINDOW_MS / 60000} minutes. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
