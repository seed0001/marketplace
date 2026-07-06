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
