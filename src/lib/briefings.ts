import { prisma } from "@/lib/prisma";
import { getSellerBusinessContext } from "@/lib/seller-ai";

export type BriefingKind = "owner_marketplace" | "seller_business";

export async function compileBriefing(kind: BriefingKind, userId: string, name?: string | null) {
  return kind === "owner_marketplace"
    ? compileOwnerBriefing(name)
    : compileSellerBriefing(userId, name);
}

async function compileOwnerBriefing(name?: string | null) {
  const since = new Date(Date.now() - 86400000);
  const [members, newMembers, activeListings, newListings, views, inquiries, messages, topListing] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.listing.count({ where: { createdAt: { gte: since } } }),
      prisma.listingView.count({ where: { createdAt: { gte: since } } }),
      prisma.conversation.count({ where: { createdAt: { gte: since } } }),
      prisma.message.count({ where: { createdAt: { gte: since } } }),
      prisma.listing.findFirst({
        where: { status: "active" },
        orderBy: { views: { _count: "desc" } },
        select: { title: true, _count: { select: { views: true, conversations: true } } },
      }),
    ]);

  const top = topListing
    ? `The current attention leader is ${topListing.title}, with ${topListing._count.views} total views and ${topListing._count.conversations} buyer conversations.`
    : "There are no active listings to rank yet.";
  return {
    title: "Owner marketplace briefing",
    script: `Hello ${name || "Administrator"}. Here is your VibeMarket owner briefing for the last twenty-four hours. The marketplace has ${members} total members and ${activeListings} active listings. ${newMembers} new members joined, and ${newListings} new listings were created. Buyers generated ${views} listing views, ${inquiries} new inquiries, and ${messages} messages. ${top} Your next check should focus on listings attracting views without buyer conversations, followed by any new inquiries waiting for seller attention.`,
  };
}

async function compileSellerBriefing(userId: string, name?: string | null) {
  const context = await getSellerBusinessContext(userId);
  const active = context.listings.filter((listing) => listing.status === "active");
  const ranked = [...active].sort((a, b) => b._count.views - a._count.views);
  const top = ranked[0];
  const stalled = ranked.find((listing) => listing._count.views > 0 && listing._count.conversations === 0);
  const missingContent = active.find((listing) => listing.contentSource === "none");
  const priorities = [
    stalled ? `${stalled.title} has attention but no buyer conversation, so review its offer and call to action first.` : "",
    missingContent ? `${missingContent.title} has no buyer-facing content and needs a README.` : "",
    "Reply promptly to any open buyer messages and keep the strongest listing current.",
  ].filter(Boolean).slice(0, 3).join(" ");

  return {
    title: "Seller-business briefing",
    script: `Hello ${name || "Builder"}. Here is your seller-business briefing. You have ${active.length} active listings. During the last thirty days they received ${context.recent30Days.listingViews} views and ${context.recent30Days.listingClicks} tracked clicks. ${top ? `Your strongest attention signal is ${top.title}, with ${top._count.views} total views and ${top._count.conversations} buyer conversations.` : "There is not enough listing activity to identify a leader yet."} Your priorities are: ${priorities}`,
  };
}
