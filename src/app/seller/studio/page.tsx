import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSellerBusinessContext, getSellerReturnBriefing } from "@/lib/seller-ai";
import { StudioChat } from "./StudioChat";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-US");
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
      <div className="text-[9px] font-bold uppercase tracking-[.15em] text-zinc-600">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 truncate text-[10px] text-zinc-600">{detail}</div>
    </div>
  );
}

export default async function SellerStudioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/seller/studio");

  const [context, briefing, latestThread] = await Promise.all([
    getSellerBusinessContext(session.user.id),
    getSellerReturnBriefing(session.user.id),
    prisma.sellerAiThread.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 60 } },
    }),
  ]);

  const totalViews = context.listings.reduce((sum, listing) => sum + listing._count.views, 0);
  const totalLeads = context.listings.reduce((sum, listing) => sum + listing._count.conversations, 0);
  const activeListings = context.listings.filter((listing) => listing.status === "active");
  const inventoryValue = activeListings.reduce((sum, listing) => sum + listing.price, 0);
  const name = context.seller?.name?.split(" ")[0] || "seller";
  const activity = [
    briefing.views && `${number.format(briefing.views)} view${briefing.views === 1 ? "" : "s"}`,
    briefing.clicks && `${number.format(briefing.clicks)} click${briefing.clicks === 1 ? "" : "s"}`,
    briefing.newInquiries && `${number.format(briefing.newInquiries)} inquir${briefing.newInquiries === 1 ? "y" : "ies"}`,
    briefing.buyerMessages && `${number.format(briefing.buyerMessages)} buyer message${briefing.buyerMessages === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <div className="bg-[#080a0a] text-zinc-100">
      <div className="border-b border-white/[.07] bg-[#0b0e0d]/95">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-5 py-4 sm:px-7">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.3em] text-emerald-400">Seller Studio</div>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">Your business, with a brain attached.</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/listings/new" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">New listing</Link>
            <Link href="/profile" className="hidden rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-300 sm:block">Portfolio</Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <StudioChat
              initialThreadId={latestThread?.id || null}
              sellerName={name}
              initialMessages={(latestThread?.messages || []).slice().reverse().map((message) => ({
                ...message,
                createdAt: message.createdAt.toISOString(),
              }))}
            />
          </div>

          <aside className="studio-sidebar space-y-4 xl:h-[calc(100dvh-13rem)] xl:overflow-y-auto xl:pr-1">
            <section className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[.1] to-[#0d1110] p-5">
              <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  While you were away
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">
                  Hey {name}. {activity.length ? "There’s movement." : "You’re caught up."}
                </h2>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {activity.length ? activity.join(" · ") : "No new seller activity since your last visit."}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Views" value={number.format(totalViews)} detail={`${context.recent30Days.listingViews} this month`} />
              <Metric label="Leads" value={number.format(totalLeads)} detail={`${context.conversations.length} recent`} />
              <Metric label="Live offers" value={number.format(activeListings.length)} detail={`${context.listings.length} total`} />
              <Metric label="Offer value" value={money.format(inventoryValue)} detail="Active asking price" />
            </div>

            <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
              <div className="flex items-center justify-between">
                <div><h2 className="text-sm font-semibold">Offer board</h2><p className="mt-0.5 text-[10px] text-zinc-600">Attention and buyer intent</p></div>
                <Link href="/listings/new" className="text-[10px] text-emerald-400">Add →</Link>
              </div>
              {context.listings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] leading-5 text-zinc-600">Ask Vibe what you could sell, then turn the strongest idea into your first offer.</div>
              ) : (
                <div className="mt-3 divide-y divide-white/[.06]">
                  {context.listings.slice(0, 5).map((listing) => (
                    <Link href={`/listings/${listing.id}`} key={listing.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-zinc-300">{listing.title}</div>
                        <div className="mt-1 text-[9px] text-zinc-600">{money.format(listing.price)} · {listing.status}</div>
                      </div>
                      <div className="flex gap-3 text-right font-mono text-[10px]">
                        <span className="text-zinc-500">{listing._count.views} views</span>
                        <span className="text-emerald-400">{listing._count.conversations} leads</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
              <div className="flex items-center justify-between">
                <div><h2 className="text-sm font-semibold">Customer desk</h2><p className="mt-0.5 text-[10px] text-zinc-600">Recent buyer conversations</p></div>
                <Link href="/messages" className="text-[10px] text-emerald-400">All →</Link>
              </div>
              <div className="mt-3 space-y-1">
                {context.conversations.slice(0, 4).map((conversation) => (
                  <Link href={`/messages/${conversation.id}`} key={conversation.id} className="block rounded-xl px-2 py-2.5 hover:bg-white/[.04]">
                    <div className="truncate text-xs text-zinc-300">{conversation.buyer.name || "Buyer"} · {conversation.listing.title}</div>
                    <div className="mt-1 truncate text-[10px] text-zinc-600">{conversation.messages[0]?.content || "New inquiry"}</div>
                  </Link>
                ))}
                {context.conversations.length === 0 && <p className="py-5 text-center text-[10px] text-zinc-700">No buyer conversations yet</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
              <h2 className="text-sm font-semibold">Vibe remembers</h2>
              <p className="mt-0.5 text-[10px] text-zinc-600">Context that follows your business</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {context.memories.slice(0, 10).map((memory, index) => (
                  <span key={`${memory.kind}-${index}`} title={memory.content} className="max-w-full truncate rounded-full border border-violet-400/15 bg-violet-400/[.06] px-2.5 py-1.5 text-[9px] text-violet-200">
                    <span className="mr-1 uppercase text-violet-500">{memory.kind}</span>{memory.content}
                  </span>
                ))}
                {context.memories.length === 0 && <p className="text-[10px] leading-5 text-zinc-600">Vibe will remember your goals, skills, preferences, and constraints as you work together.</p>}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
