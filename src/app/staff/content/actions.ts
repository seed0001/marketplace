"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { queueDiscordEvent } from "@/lib/discord";

const idSchema = z.string().cuid();
const statusSchema = z.enum(["active", "hidden", "sold"]);

export async function setListingStatus(listingId: string, status: string) {
  const staff = await requireStaff();
  const parsedId = idSchema.parse(listingId);
  const parsedStatus = statusSchema.parse(status);
  const listing = await prisma.listing.findUnique({
    where: { id: parsedId },
    select: { title: true, status: true },
  });
  if (!listing) return;

  await prisma.$transaction([
    prisma.listing.update({ where: { id: parsedId }, data: { status: parsedStatus } }),
    prisma.contentModerationEvent.create({
      data: {
        actorId: staff.id,
        action: `status:${listing.status}->${parsedStatus}`,
        contentType: "listing",
        contentId: parsedId,
        contentTitle: listing.title,
      },
    }),
  ]);
  await queueDiscordEvent("moderation", `Listing status changed · ${listing.title}`, {
    description: `${staff.name || staff.email} changed a listing from ${listing.status} to ${parsedStatus}.`,
    color: 0xa78bfa,
    fields: [{ name: "Listing ID", value: parsedId }],
  });
  revalidatePath("/staff/content");
  revalidatePath("/listings");
  revalidatePath(`/listings/${parsedId}`);
}

type ContentType = "listing" | "website" | "review" | "feedback";

export async function deleteContent(contentType: ContentType, contentId: string) {
  const staff = await requireStaff();
  const parsedId = idSchema.parse(contentId);
  let deletedTitle: string | null = null;

  await prisma.$transaction(async (tx) => {
    let title: string | null = null;

    if (contentType === "listing") {
      const item = await tx.listing.findUnique({ where: { id: parsedId }, select: { title: true } });
      title = item?.title ?? null;
      if (item) await tx.listing.delete({ where: { id: parsedId } });
    } else if (contentType === "website") {
      const item = await tx.sellerWebsite.findUnique({ where: { id: parsedId }, select: { title: true } });
      title = item?.title ?? null;
      if (item) await tx.sellerWebsite.delete({ where: { id: parsedId } });
    } else if (contentType === "review") {
      const item = await tx.review.findUnique({
        where: { id: parsedId },
        select: { comment: true, listing: { select: { title: true } } },
      });
      title = item ? `Review on ${item.listing.title}${item.comment ? `: ${item.comment.slice(0, 80)}` : ""}` : null;
      if (item) await tx.review.delete({ where: { id: parsedId } });
    } else if (contentType === "feedback") {
      const item = await tx.feedback.findUnique({
        where: { id: parsedId },
        select: { comment: true, listing: { select: { title: true } } },
      });
      title = item ? `Feedback on ${item.listing.title}${item.comment ? `: ${item.comment.slice(0, 80)}` : ""}` : null;
      if (item) await tx.feedback.delete({ where: { id: parsedId } });
    }

    if (!title) return;
    deletedTitle = title;
    await tx.contentModerationEvent.create({
      data: {
        actorId: staff.id,
        action: "deleted",
        contentType,
        contentId: parsedId,
        contentTitle: title,
      },
    });
  });
  if (deletedTitle) {
    await queueDiscordEvent("moderation", `${contentType} deleted`, {
      description: `${staff.name || staff.email} deleted ${deletedTitle}.`,
      color: 0xef4444,
      fields: [{ name: "Deleted record ID", value: parsedId }],
    });
  }

  revalidatePath("/staff/content");
  revalidatePath("/listings");
}
