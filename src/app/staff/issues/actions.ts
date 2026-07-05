"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";

const idSchema = z.string().cuid();
const statusSchema = z.enum(["open", "investigating", "resolved", "closed"]);

export async function updateIssueStatus(id: string, status: string) {
  await requireStaff();
  await prisma.siteIssueReport.update({
    where: { id: idSchema.parse(id) },
    data: { status: statusSchema.parse(status) },
  });
  revalidatePath("/staff/issues");
}

export async function deleteIssue(id: string) {
  await requireStaff();
  await prisma.siteIssueReport.delete({ where: { id: idSchema.parse(id) } });
  revalidatePath("/staff/issues");
}
