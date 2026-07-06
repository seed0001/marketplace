"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { notificationCategories, notificationPriorities } from "@/lib/notifications";

const hrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value || value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://"), {
    message: "Use a site path or full URL.",
  });

const notificationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(3000),
  category: z.enum(notificationCategories),
  priority: z.enum(notificationPriorities),
  linkLabel: z.string().trim().max(80).optional(),
  linkHref: hrefSchema.optional(),
  expiresAt: z.string().trim().optional(),
});

const idSchema = z.string().cuid();

function parseExpiresAt(value?: string) {
  if (!value) return null;
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return null;
  return expiresAt;
}

function notificationRedirect(kind: "created" | "archived" | "error") {
  redirect(`/staff/notifications?status=${kind}`);
}

export async function publishSiteNotification(formData: FormData) {
  const staff = await requireStaff();
  const parsed = notificationSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    linkLabel: formData.get("linkLabel") || undefined,
    linkHref: formData.get("linkHref") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!parsed.success) return notificationRedirect("error");

  const data = parsed.data;
  const expiresAt = parseExpiresAt(data.expiresAt);
  await prisma.siteNotification.create({
    data: {
      title: data.title,
      body: data.body,
      category: data.category,
      priority: data.priority,
      linkLabel: data.linkLabel || null,
      linkHref: data.linkHref || null,
      expiresAt,
      createdById: staff.id,
    },
  });

  revalidatePath("/notifications");
  revalidatePath("/staff/notifications");
  notificationRedirect("created");
}

export async function archiveSiteNotification(formData: FormData) {
  await requireStaff();
  const id = idSchema.parse(formData.get("notificationId"));
  await prisma.siteNotification.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/notifications");
  revalidatePath("/staff/notifications");
  notificationRedirect("archived");
}
