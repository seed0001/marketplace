"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdministrator } from "@/lib/staff";
import { queueDiscordEvent } from "@/lib/discord";
import { OWNER_EMAIL } from "@/lib/auth";

const idSchema = z.string().cuid();
const roleSchema = z.enum(["MEMBER", "STAFF", "ADMIN"]);

const roleColors: Record<string, number> = { ADMIN: 0xa78bfa, STAFF: 0x34d399, MEMBER: 0x71717a };

export type RoleActionResult = { ok: boolean; error?: string };

// Changing a member's permission level is administrator-only. Two accounts are
// deliberately un-changeable from here: the platform owner (login re-promotes
// them to ADMIN anyway, so a change would silently revert) and the acting admin
// themselves (guards against demoting your own account into a lockout).
export async function setUserRole(userId: string, role: string): Promise<RoleActionResult> {
  const admin = await requireAdministrator();

  const parsedId = idSchema.safeParse(userId);
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedId.success || !parsedRole.success) return { ok: false, error: "Invalid request." };

  if (parsedId.data === admin.id) return { ok: false, error: "You can't change your own role." };

  const target = await prisma.user.findUnique({
    where: { id: parsedId.data },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!target) return { ok: false, error: "Member not found." };
  if (target.email.toLowerCase() === OWNER_EMAIL) return { ok: false, error: "The platform owner's role is locked." };
  if (target.role === parsedRole.data) return { ok: true };

  await prisma.$transaction([
    prisma.user.update({ where: { id: parsedId.data }, data: { role: parsedRole.data } }),
    prisma.contentModerationEvent.create({
      data: {
        actorId: admin.id,
        action: `role:${target.role}->${parsedRole.data}`,
        contentType: "user",
        contentId: parsedId.data,
        contentTitle: target.name || target.email,
      },
    }),
  ]);

  await queueDiscordEvent("moderation", `Role changed · ${target.name || target.email}`, {
    description: `${admin.name || admin.email} changed ${target.name || target.email} from ${target.role} to ${parsedRole.data}.`,
    color: roleColors[parsedRole.data] ?? 0xa78bfa,
    fields: [{ name: "Member ID", value: parsedId.data }],
  });

  revalidatePath("/staff/roster");
  return { ok: true };
}

// Shared guards for the destructive member tools below. The owner and the
// acting admin are never valid targets, and ADMIN accounts must be demoted
// before they can be purged or deleted — one admin can't silently erase
// another's presence.
async function resolveDangerTarget(adminId: string, userId: string) {
  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) return { error: "Invalid request." as const };
  if (parsedId.data === adminId) return { error: "You can't run destructive actions on your own account." as const };

  const target = await prisma.user.findUnique({
    where: { id: parsedId.data },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!target) return { error: "Member not found." as const };
  if (target.email.toLowerCase() === OWNER_EMAIL) return { error: "The platform owner's account is protected." as const };
  if (target.role === "ADMIN") return { error: "Demote this administrator to member before running destructive actions." as const };
  return { target };
}

/**
 * Emergency abuse response: wipe a member's entire catalog and cut off the
 * access that produced it. Deletes every listing they own (the listing
 * cascades take conversations, reviews, feedback, and views with them) and
 * revokes all of their active API keys in the same transaction, so a script
 * holding a key can't simply repost. The account itself survives.
 */
export async function purgeUserCatalog(userId: string): Promise<RoleActionResult> {
  const admin = await requireAdministrator();
  const resolved = await resolveDangerTarget(admin.id, userId);
  if ("error" in resolved) return { ok: false, error: resolved.error };
  const { target } = resolved;

  const summary = await prisma.$transaction(async (tx) => {
    const { count: listingsDeleted } = await tx.listing.deleteMany({ where: { userId: target.id } });
    const { count: keysRevoked } = await tx.sellerApiKey.updateMany({
      where: { userId: target.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.contentModerationEvent.create({
      data: {
        actorId: admin.id,
        action: "purged_catalog",
        contentType: "user",
        contentId: target.id,
        contentTitle: `${target.name || target.email} — ${listingsDeleted} listing${listingsDeleted === 1 ? "" : "s"} deleted, ${keysRevoked} API key${keysRevoked === 1 ? "" : "s"} revoked`,
      },
    });
    return { listingsDeleted, keysRevoked };
  });

  await queueDiscordEvent("moderation", `Catalog purged · ${target.name || target.email}`, {
    description: `${admin.name || admin.email} deleted ${summary.listingsDeleted} listing${summary.listingsDeleted === 1 ? "" : "s"} and revoked ${summary.keysRevoked} API key${summary.keysRevoked === 1 ? "" : "s"}.`,
    color: 0xef4444,
    fields: [{ name: "Member ID", value: target.id }],
  });

  revalidatePath("/staff/roster");
  revalidatePath("/staff/content");
  revalidatePath("/listings");
  return { ok: true };
}

/**
 * Full account removal. Everything the member owns cascades away with the row
 * (listings and their threads, messages, reviews, feedback, websites, AI
 * history, API keys); analytics, listing views, and issue reports survive
 * anonymized (SetNull). The one hard constraint: the moderation audit log
 * references its actor with onDelete: Restrict, so an account that has ever
 * performed a moderation action cannot be deleted — we pre-check and refuse
 * with a clear reason instead of surfacing a database error.
 */
export async function deleteUserAccount(userId: string): Promise<RoleActionResult> {
  const admin = await requireAdministrator();
  const resolved = await resolveDangerTarget(admin.id, userId);
  if ("error" in resolved) return { ok: false, error: resolved.error };
  const { target } = resolved;

  const auditActions = await prisma.contentModerationEvent.count({ where: { actorId: target.id } });
  if (auditActions > 0) {
    return {
      ok: false,
      error: "This account has performed moderation actions and is retained for the audit trail. Purge their catalog and demote them instead.",
    };
  }

  await prisma.$transaction(async (tx) => {
    // Log first: the moderation event stores the target as plain text (id +
    // name), not a foreign key, so the record survives the deletion below.
    await tx.contentModerationEvent.create({
      data: {
        actorId: admin.id,
        action: "deleted_account",
        contentType: "user",
        contentId: target.id,
        contentTitle: target.name || target.email,
      },
    });
    await tx.user.delete({ where: { id: target.id } });
  });

  await queueDiscordEvent("moderation", `Account deleted · ${target.name || target.email}`, {
    description: `${admin.name || admin.email} permanently deleted this account and all of its content.`,
    color: 0xef4444,
    fields: [{ name: "Member ID", value: target.id }],
  });

  revalidatePath("/staff/roster");
  revalidatePath("/staff/content");
  revalidatePath("/listings");
  return { ok: true };
}
