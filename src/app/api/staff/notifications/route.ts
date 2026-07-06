import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notificationCategories, notificationPriorities } from "@/lib/notifications";
import { isEmailConfigured, sendEmailNotification } from "@/lib/email";
import { isSmsConfigured, sendSmsNotification } from "@/lib/sms";

const notificationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(3000),
  category: z.enum(notificationCategories),
  priority: z.enum(notificationPriorities),
  audience: z.enum(["all", "selected"]),
  recipientIds: z.array(z.string().cuid()).default([]),
  expiresAt: z.string().trim().optional(),
});

function staffRedirect(request: NextRequest, status: "created" | "error") {
  const url = new URL("/staff/notifications", request.url);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url, { status: 303 });
}

function signInRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/staff/notifications", request.url), { status: 303 });
}

async function getStaffUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user || !["STAFF", "ADMIN"].includes(user.role)) return null;
  return user;
}

function parseExpiresAt(value?: string) {
  if (!value) return null;
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return null;
  return expiresAt;
}

export async function POST(request: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return signInRedirect(request);

  const formData = await request.formData();
  const parsed = notificationSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    audience: formData.get("audience") === "selected" ? "selected" : "all",
    recipientIds: formData.getAll("recipientIds"),
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!parsed.success) return staffRedirect(request, "error");

  const data = parsed.data;
  const recipientIds = [...new Set(data.recipientIds)];
  if (data.audience === "selected" && recipientIds.length === 0) return staffRedirect(request, "error");

  const notification = await prisma.siteNotification.create({
    data: {
      title: data.title,
      body: data.body,
      category: data.category,
      priority: data.priority,
      audience: data.audience,
      linkLabel: null,
      linkHref: null,
      expiresAt: parseExpiresAt(data.expiresAt),
      createdById: staff.id,
      targets: data.audience === "selected" ? {
        createMany: {
          data: recipientIds.map((userId) => ({ userId })),
          skipDuplicates: true,
        },
      } : undefined,
    },
  });

  if (isSmsConfigured()) {
    const smsRecipients = await prisma.user.findMany({
      where: {
        phoneNotificationsEnabled: true,
        phoneNumber: { not: null },
        phoneCarrier: { not: null },
        ...(data.audience === "selected" ? { id: { in: recipientIds } } : {}),
      },
      select: { id: true, phoneNumber: true, phoneCarrier: true },
    });

    for (const recipient of smsRecipients) {
      const result = await sendSmsNotification(recipient.phoneNumber, recipient.phoneCarrier, data.title, data.body);
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

  if (isEmailConfigured()) {
    const emailRecipients = await prisma.user.findMany({
      where: {
        emailNotificationsEnabled: true,
        ...(data.audience === "selected" ? { id: { in: recipientIds } } : {}),
      },
      select: { id: true, email: true },
    });

    for (const recipient of emailRecipients) {
      const result = await sendEmailNotification(recipient.email, data.title, data.body);
      await prisma.siteNotificationDelivery.create({
        data: {
          notificationId: notification.id,
          userId: recipient.id,
          channel: "email",
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
  return staffRedirect(request, "created");
}
