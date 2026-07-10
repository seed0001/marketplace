export const friendshipStatuses = ["pending", "accepted", "declined", "blocked"] as const;

export type FriendshipStatus = (typeof friendshipStatuses)[number];

export function friendPairKey(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

export function isFriendshipStatus(value: unknown): value is FriendshipStatus {
  return typeof value === "string" && friendshipStatuses.includes(value as FriendshipStatus);
}

export function friendshipStateForViewer(
  friendship: { id: string; requesterId: string; addresseeId: string; status: string } | null,
  viewerId: string | null | undefined,
) {
  if (!friendship || !viewerId) return { state: "none" as const, friendshipId: null };
  if (friendship.status === "accepted") return { state: "accepted" as const, friendshipId: friendship.id };
  if (friendship.status === "pending" && friendship.requesterId === viewerId) {
    return { state: "pending_sent" as const, friendshipId: friendship.id };
  }
  if (friendship.status === "pending" && friendship.addresseeId === viewerId) {
    return { state: "pending_received" as const, friendshipId: friendship.id };
  }
  return { state: "none" as const, friendshipId: friendship.id };
}
