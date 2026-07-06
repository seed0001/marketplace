"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { notificationCategories, notificationPriorities } from "@/lib/notifications";
import { sendSmsNotification } from "@/lib/sms";

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
  audience: z.enum(["all", "selected"]),
  recipientIds: z.array(z.string().cuid()).default([]),
  sendSms: z.boolean().default(false),
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
    audience: formData.get("audience") === "selected" ? "selected" : "all",
    recipientIds: formData.getAll("recipientIds"),
    sendSms: formData.get("sendSms") === "on",
    linkLabel: formData.get("linkLabel") || undefined,
    linkHref: formData.get("linkHref") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!parsed.success) return notificationRedirect("error");

  const data = parsed.data;
  const recipientIds = [...new Set(data.recipientIds)];
  if (data.audience === "selected" && recipientIds.length === 0) return notificationRedirect("error");

  const expiresAt = parseExpiresAt(data.expiresAt);
  const notification = await prisma.siteNotification.create({
    data: {
      title: data.title,
      body: data.body,
      category: data.category,
      priority: data.priority,
      audience: data.audience,
      linkLabel: data.linkLabel || null,
      linkHref: data.linkHref || null,
      expiresAt,
      createdById: staff.id,
      targets: data.audience === "selected" ? {
        createMany: {
          data: recipientIds.map((userId) => ({ userId })),
          skipDuplicates: true,
        },
      } : undefined,
    },
  });

  if (data.sendSms) {
    const smsRecipients = await prisma.user.findMany({
      where: {
        phoneNotificationsEnabled: true,
        phoneNumber: { not: null },
        ...(data.audience === "selected" ? { id: { in: recipientIds } } : {}),
      },
      select: { id: true, phoneNumber: true },
    });

    const smsBody = `${data.title}\n\n${data.body}${data.linkHref ? `\n\n${data.linkHref}` : ""}`;
    for (const recipient of smsRecipients) {
      const result = await sendSmsNotification(recipient.phoneNumber, smsBody);
      await prisma.siteNotificationDelivery.create({
        data: {
          notificationId: notification.id,
          userId: recipient.id,
          channel: "sms",
          status: result.status,
          error: result.error?.slice(0, 1000),
          providerId: result.providerId,
          deliveredAt: result.status === "sent" ? new Date() : null,
        },
      });
    }
  }

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
