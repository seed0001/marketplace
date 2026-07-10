import { prisma } from "@/lib/prisma";
import { friendPairKey, friendshipStateForViewer } from "@/lib/friends";

/**
 * Everything the portfolio dashboard shows is derived here from the user's real
 * activity — listings, views, reviews and feedback. Nothing on the portfolio is
 * user-editable except their profile photo; these numbers are system-produced.
 *
 * `includePrivate` adds owner-only analytics (who has been viewing their
 * listings), which is never exposed on the public profile.
 */
export async function getPortfolio(userId: string, includePrivate = false, viewerId?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      profileBio: true,
      profileStatus: true,
      profileCoverImage: true,
      profileBackgroundImage: true,
      profileAccentColor: true,
      profileTheme: true,
      phoneNumber: true,
      phoneCarrier: true,
      phoneNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      createdAt: true,
      websites: { orderBy: { createdAt: "asc" } },
      profileSongs: { orderBy: { sortOrder: "asc" } },
    },
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

  const activeViewerId = viewerId || (includePrivate ? userId : null);
  const [feedbackAgg, reviewAgg, uniqueViewerRows, recentViews, acceptedFriendships, currentFriendship, pendingFriendRequests] = await Promise.all([
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
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        requester: { select: { id: true, name: true, image: true, profileStatus: true } },
        addressee: { select: { id: true, name: true, image: true, profileStatus: true } },
      },
    }),
    activeViewerId && activeViewerId !== userId
      ? prisma.friendship.findUnique({
          where: { pairKey: friendPairKey(activeViewerId, userId) },
          select: { id: true, requesterId: true, addresseeId: true, status: true },
        })
      : Promise.resolve(null),
    includePrivate
      ? prisma.friendship.findMany({
          where: { addresseeId: userId, status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            requester: { select: { id: true, name: true, image: true, profileStatus: true } },
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
    friends: acceptedFriendships.map((friendship) => {
      const friend = friendship.requesterId === userId ? friendship.addressee : friendship.requester;
      return {
        friendshipId: friendship.id,
        id: friend.id,
        name: friend.name,
        image: friend.image,
        profileStatus: friend.profileStatus,
      };
    }),
    pendingFriendRequests: pendingFriendRequests.map((friendship) => ({
      friendshipId: friendship.id,
      id: friendship.requester.id,
      name: friendship.requester.name,
      image: friendship.requester.image,
      profileStatus: friendship.requester.profileStatus,
    })),
    currentViewerId: activeViewerId,
    friendship: friendshipStateForViewer(currentFriendship, activeViewerId),
  };
}

export type Portfolio = NonNullable<Awaited<ReturnType<typeof getPortfolio>>>;
