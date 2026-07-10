import type { ReactNode } from "react";
import Link from "next/link";
import { AvatarUpload } from "@/components/AvatarUpload";
import { DirectMessageButton } from "@/components/DirectMessageButton";
import { FriendActionButton } from "@/components/FriendActionButton";
import { ProfileContactSettings } from "@/components/ProfileContactSettings";
import { ProfileCustomizationEditor } from "@/components/ProfileCustomizationEditor";
import { WebsiteShowcaseEditor } from "@/components/WebsiteShowcaseEditor";
import type { Portfolio as PortfolioData } from "@/lib/portfolio";
import { getSmsGatewayOptions } from "@/lib/sms-gateways";
import { formatPrice, formatDate, formatRelativeTime } from "@/lib/utils";

function Stars({ value }: { value: number | null }) {
  const rounded = Math.round(value ?? 0);
  return (
    <span className="text-amber-500">
      {"★".repeat(rounded)}
      <span className="text-zinc-700">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      {sub && <div className="mt-1 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

const themeClasses: Record<string, string> = {
  midnight: "from-zinc-950 via-emerald-950/20 to-black",
  forest: "from-emerald-950 via-zinc-950 to-lime-950/40",
  sunset: "from-zinc-950 via-rose-950/30 to-amber-950/30",
  ocean: "from-slate-950 via-cyan-950/25 to-blue-950/30",
  violet: "from-zinc-950 via-violet-950/30 to-fuchsia-950/20",
};

function ProfileSongs({
  songs,
  accentColor,
}: {
  songs: PortfolioData["user"]["profileSongs"];
  accentColor: string;
}) {
  if (songs.length === 0) return null;

  return (
    <section className="mb-12 rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Favorite songs</h2>
          <p className="mt-1 text-sm text-zinc-500">A five-song profile playlist.</p>
        </div>
        <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-black" style={{ backgroundColor: accentColor }}>
          Profile radio
        </span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {songs.map((song) => (
          <article key={song.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="truncate text-sm font-semibold text-zinc-100">{song.title}</h3>
              {song.artist && <p className="mt-0.5 truncate text-xs text-zinc-500">{song.artist}</p>}
            </div>
            {song.provider === "spotify" ? (
              <iframe
                title={`${song.title} on Spotify`}
                src={song.embedUrl}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block"
              />
            ) : (
              <iframe
                title={`${song.title} on YouTube`}
                src={song.embedUrl}
                width="100%"
                height="220"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="block"
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function FriendAvatar({
  friend,
}: {
  friend: PortfolioData["friends"][number] | PortfolioData["pendingFriendRequests"][number];
}) {
  return (
    <Link href={`/users/${friend.id}`} className="group rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-emerald-400/40">
      <div className="flex items-center gap-3">
        {friend.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={friend.image} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
            {friend.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-100 group-hover:text-emerald-300">{friend.name || "A member"}</div>
          {friend.profileStatus && <div className="mt-0.5 truncate text-xs text-zinc-500">{friend.profileStatus}</div>}
        </div>
      </div>
    </Link>
  );
}

function ProfileFriends({
  friends,
  ownerName,
}: {
  friends: PortfolioData["friends"];
  ownerName: string | null;
}) {
  return (
    <section className="mb-12 rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Friends</h2>
          <p className="mt-1 text-sm text-zinc-500">{friends.length} visible connection{friends.length === 1 ? "" : "s"}.</p>
        </div>
      </div>
      {friends.length === 0 ? (
        <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
          {ownerName || "This member"} has not added friends yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => <FriendAvatar key={friend.friendshipId} friend={friend} />)}
        </div>
      )}
    </section>
  );
}

function PendingFriendRequests({
  requests,
}: {
  requests: PortfolioData["pendingFriendRequests"];
}) {
  if (requests.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-emerald-400/20 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-6">
      <h2 className="text-lg font-semibold">Friend requests</h2>
      <p className="mt-1 text-sm text-zinc-500">Open each profile to accept or decline.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {requests.map((friend) => <FriendAvatar key={friend.friendshipId} friend={friend} />)}
      </div>
    </section>
  );
}

export async function Portfolio({
  data,
  isOwner,
}: {
  data: PortfolioData;
  isOwner: boolean;
}) {
  const { user, listings, stats, feedbackReceived, recentViews } = data;
  // Only the owner sees the contact settings, so only they need the carrier list.
  const smsGateways = isOwner ? await getSmsGatewayOptions() : [];
  const accentColor = /^#[0-9a-fA-F]{6}$/.test(user.profileAccentColor) ? user.profileAccentColor : "#34d399";
  const themeClass = themeClasses[user.profileTheme] || themeClasses.midnight;
  const pageStyle = user.profileBackgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(8,10,10,.34), rgba(8,10,10,.62)), url("${user.profileBackgroundImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }
    : undefined;

  return (
    <div className={`min-h-screen ${user.profileBackgroundImage ? "" : `bg-gradient-to-br ${themeClass}`}`} style={pageStyle}>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Identity */}
      {user.profileCoverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profileCoverImage}
          alt=""
          className="mb-0 h-64 w-full rounded-t-3xl border border-b-0 border-white/15 object-cover shadow-2xl shadow-black/30 sm:h-80"
        />
      )}
      <div className={`flex flex-col items-center gap-3 rounded-b-3xl border border-white/15 bg-gradient-to-br p-5 text-center shadow-2xl shadow-black/30 backdrop-blur-md sm:flex-row sm:items-end sm:gap-6 sm:p-6 sm:text-left ${themeClass} ${user.profileCoverImage ? "mb-10 rounded-t-none" : "mb-10 rounded-t-3xl"}`} style={{ borderColor: `${accentColor}66` }}>
        {isOwner ? (
          <AvatarUpload name={user.name} image={user.image} />
        ) : user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name || "Profile"}
            className="h-20 w-20 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-300">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{user.name || "Anonymous builder"}</h1>
          {user.profileStatus && (
            <p className="mt-1 inline-flex max-w-full rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-zinc-300">
              {user.profileStatus}
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-400">
            Member since {formatDate(stats.memberSince)}
            {stats.reputationAvg != null && (
              <>
                {" · "}
                <Stars value={stats.reputationAvg} />{" "}
                <span className="text-zinc-500">
                  {stats.reputationAvg.toFixed(1)} ({stats.sales})
                </span>
              </>
            )}
          </p>
          {user.profileBio ? (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-zinc-300">{user.profileBio}</p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              This portfolio is generated automatically from real marketplace activity.
            </p>
          )}
          {!isOwner && data.currentViewerId && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <DirectMessageButton recipientId={user.id} />
              <FriendActionButton
                targetUserId={user.id}
                currentUserId={data.currentViewerId}
                initialState={data.friendship.state}
                initialFriendshipId={data.friendship.friendshipId}
              />
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mb-6 flex justify-end">
          <Link
            href={`/users/${user.id}?view=public`}
            className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300"
          >
            View as visitor
          </Link>
        </div>
      )}

      {isOwner && (
        <ProfileCustomizationEditor
          initialProfile={{
            profileBio: user.profileBio,
            profileStatus: user.profileStatus,
            profileCoverImage: user.profileCoverImage,
            profileBackgroundImage: user.profileBackgroundImage,
            profileAccentColor: user.profileAccentColor,
            profileTheme: user.profileTheme,
            profileSongs: user.profileSongs,
          }}
        />
      )}

      {isOwner && (
        <ProfileContactSettings
          initialPhoneNumber={user.phoneNumber}
          initialPhoneCarrier={user.phoneCarrier}
          initialPhoneNotificationsEnabled={user.phoneNotificationsEnabled}
          initialEmailNotificationsEnabled={user.emailNotificationsEnabled}
          gateways={smsGateways}
        />
      )}

      {isOwner && <PendingFriendRequests requests={data.pendingFriendRequests} />}

      <ProfileSongs songs={user.profileSongs} accentColor={accentColor} />

      <ProfileFriends friends={data.friends} ownerName={user.name} />

      {/* Seller websites */}
      <section className="mb-12 rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md sm:p-6">
        {isOwner ? (
          <WebsiteShowcaseEditor initialWebsites={user.websites} />
        ) : (
          <>
            <h2 className="text-lg font-semibold">Websites by {user.name || "this maker"}</h2>
            {user.websites.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No websites showcased yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {user.websites.map((website) => (
                  <a
                    key={website.id}
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-border bg-zinc-950/40 p-4 hover:border-emerald-500/50"
                  >
                    <div className="font-semibold group-hover:text-emerald-400">
                      {website.title} ↗
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{website.description}</p>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-12">
        <StatCard
          label="Listings"
          value={stats.listingsCount}
          sub={`${stats.activeCount} active`}
        />
        <StatCard
          label="Friends"
          value={data.friends.length}
          sub={isOwner && data.pendingFriendRequests.length > 0 ? `${data.pendingFriendRequests.length} pending` : "Visible on profile"}
        />
        <StatCard
          label="Total views"
          value={stats.totalViews.toLocaleString()}
          sub={isOwner ? `${stats.uniqueViewers} unique viewers` : undefined}
        />
        <StatCard
          label="Sales"
          value={stats.sales}
          sub={stats.reputationAvg != null ? <><Stars value={stats.reputationAvg} /></> : "No sales yet"}
        />
        <StatCard
          label="Reviews"
          value={stats.reviewsCount}
          sub={stats.reviewsAvg != null ? `${stats.reviewsAvg.toFixed(1)} avg rating` : "No reviews yet"}
        />
      </div>

      {/* Owner-only audience analytics */}
      {isOwner && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Who&apos;s viewing your work</h2>
          {recentViews.length === 0 ? (
            <p className="rounded-2xl border border-white/15 bg-black/45 p-6 text-sm text-zinc-500 shadow-xl shadow-black/20 backdrop-blur-md">
              No views yet. Once people start opening your listings, you&apos;ll see them here.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-white/15 bg-black/45 shadow-xl shadow-black/20 backdrop-blur-md">
              {recentViews.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  {v.viewer?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.viewer.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                      {v.viewer?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">
                      {v.viewer ? v.viewer.name || "A member" : "Someone"}
                    </span>{" "}
                    <span className="text-zinc-500">viewed</span>{" "}
                    <Link href={`/listings/${v.listing.id}`} className="text-emerald-400 hover:text-emerald-300">
                      {v.listing.title}
                    </Link>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">{formatRelativeTime(v.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Work */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isOwner ? "Your work" : "Work"}{" "}
            <span className="font-normal text-zinc-500">({listings.length})</span>
          </h2>
          {isOwner && (
            <Link
              href="/listings/new"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + New listing
            </Link>
          )}
        </div>

        {listings.length === 0 ? (
          <p className="rounded-2xl border border-white/15 bg-black/45 p-6 text-sm text-zinc-500 shadow-xl shadow-black/20 backdrop-blur-md">
            No listings yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group block overflow-hidden rounded-2xl border border-white/15 bg-black/45 shadow-xl shadow-black/20 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-emerald-400/40"
              >
                <div className="aspect-[4/3] bg-zinc-800 overflow-hidden relative">
                  {listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-700">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                  {listing.status !== "active" && (
                    <div className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-200">
                      {listing.status}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate font-semibold text-sm">{listing.title}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-500">{formatPrice(listing.price)}</span>
                    <span className="text-xs text-zinc-500">
                      {listing._count.views.toLocaleString()} views
                      {listing._count.reviews > 0 && ` · ${listing._count.reviews} reviews`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      {feedbackReceived.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">What buyers say</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feedbackReceived.map((f) => (
              <div key={f.id} className="rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  {f.from.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.from.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                      {f.from.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{f.from.name || "A buyer"}</div>
                    <Link
                      href={`/listings/${f.listing.id}`}
                      className="truncate text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      on {f.listing.title}
                    </Link>
                  </div>
                  <Stars value={f.rating} />
                </div>
                {f.comment && <p className="text-sm text-zinc-300 leading-relaxed">{f.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
    </div>
  );
}
