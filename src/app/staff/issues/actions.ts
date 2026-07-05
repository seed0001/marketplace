"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { queueDiscordEvent } from "@/lib/discord";

const idSchema = z.string().cuid();
const statusSchema = z.enum(["open", "investigating", "resolved", "closed"]);

export async function updateIssueStatus(id: string, status: string) {
  const staff = await requireStaff();
  const report = await prisma.siteIssueReport.update({
    where: { id: idSchema.parse(id) },
    data: { status: statusSchema.parse(status) },
    select: { id: true, affectedPage: true },
  });
  await queueDiscordEvent("site_issues", `Issue ${status} · VM-${report.id.slice(-8).toUpperCase()}`, {
    description: `${staff.name || staff.email} changed the issue status to ${status}.`,
    color: status === "resolved" ? 0x34d399 : status === "investigating" ? 0xf59e0b : 0x71717a,
    fields: [{ name: "Affected page or feature", value: report.affectedPage }],
  });
  revalidatePath("/staff/issues");
}

export async function deleteIssue(id: string) {
  await requireStaff();
  await prisma.siteIssueReport.delete({ where: { id: idSchema.parse(id) } });
  revalidatePath("/staff/issues");
}
