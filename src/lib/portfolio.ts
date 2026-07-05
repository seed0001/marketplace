import { prisma } from "@/lib/prisma";

/**
 * Everything the portfolio dashboard shows is derived here from the user's real
 * activity — listings, views, reviews and feedback. Nothing on the portfolio is
 * user-editable except their profile photo; these numbers are system-produced.
 *
 * `includePrivate` adds owner-only analytics (who has been viewing their
 * listings), which is never exposed on the public profile.
 */
export async function getPortfolio(userId: string, includePrivate = false) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, email: true, createdAt: true },
  });
  if (!user) return null;

  const listings = await prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { views: true, reviews: true } },
    },
  });

  const [feedbackAgg, reviewAgg, uniqueViewerRows, recentViews] = await Promise.all([
    // Feedback received acts as the transaction/"sale" record and the seller's
    // reputation score.
    prisma.feedback.aggregate({
      where: { toUserId: userId },
      _avg: { rating: true },
      _count: true,
    }),
    // Reviews left on the user's listings — product quality signal.
    prisma.review.aggregate({
      where: { listing: { userId } },
      _avg: { rating: true },
      _count: true,
    }),
    // Distinct signed-in viewers across all their listings.
    prisma.listingView.findMany({
      where: { listing: { userId }, viewerId: { not: null } },
      distinct: ["viewerId"],
      select: { viewerId: true },
    }),
    // Owner-only: the most recent viewers, with identity when signed in.
    includePrivate
      ? prisma.listingView.findMany({
          where: { listing: { userId } },
          orderBy: { createdAt: "desc" },
          take: 25,
          include: {
            viewer: { select: { id: true, name: true, image: true } },
            listing: { select: { id: true, title: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const feedbackReceived = await prisma.feedback.findMany({
    where: { toUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      from: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  const totalViews = listings.reduce((sum, l) => sum + l._count.views, 0);
  const activeCount = listings.filter((l) => l.status === "active").length;

  return {
    user,
    listings,
    stats: {
      listingsCount: listings.length,
      activeCount,
      totalViews,
      uniqueViewers: uniqueViewerRows.length,
      sales: feedbackAgg._count,
      reputationAvg: feedbackAgg._avg.rating,
      reviewsCount: reviewAgg._count,
      reviewsAvg: reviewAgg._avg.rating,
      memberSince: user.createdAt,
    },
    feedbackReceived,
    recentViews,
  };
}

export type Portfolio = NonNullable<Awaited<ReturnType<typeof getPortfolio>>>;
