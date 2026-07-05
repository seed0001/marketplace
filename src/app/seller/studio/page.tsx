import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSellerBusinessContext, getSellerReturnBriefing } from "@/lib/seller-ai";
import { StudioChat } from "./StudioChat";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-US");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5"><div className="text-[10px] font-bold uppercase tracking-[.17em] text-zinc-600">{label}</div><div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[11px] text-zinc-600">{detail}</div></div>;
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
    briefing.views && `${number.format(briefing.views)} new listing view${briefing.views === 1 ? "" : "s"}`,
    briefing.clicks && `${number.format(briefing.clicks)} tracked click${briefing.clicks === 1 ? "" : "s"}`,
    briefing.newInquiries && `${number.format(briefing.newInquiries)} new inquir${briefing.newInquiries === 1 ? "y" : "ies"}`,
    briefing.buyerMessages && `${number.format(briefing.buyerMessages)} buyer message${briefing.buyerMessages === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#080a0a] text-zinc-100">
      <div className="border-b border-white/[.07] bg-[#0b0e0d]/95">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between px-6 py-5">
          <div><div className="text-[10px] font-bold uppercase tracking-[.3em] text-emerald-400">Seller Studio</div><h1 className="mt-1 text-xl font-semibold tracking-tight">Your business, with a brain attached.</h1></div>
          <div className="flex items-center gap-3"><Link href="/listings/new" className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5">New listing</Link><Link href="/profile" className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-300">View portfolio</Link></div>
        </div>
      </div>

      <main className="mx-auto max-w-[1560px] px-6 py-8">
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[.11] via-[#101513] to-[#0b0d0c] px-7 py-7">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />Vibe kept watch while you were away</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Hey {name}. {activity.length ? "There’s movement." : "You’re all caught up."}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                {activity.length ? `Since your last check-in: ${activity.join(", ")}.` : "No new seller activity has landed since your previous visit. Vibe is ready to work on the next opportunity with you."}
              </p>
            </div>
            <div className="shrink-0 text-xs text-zinc-600">Watching {activeListings.length} active offer{activeListings.length === 1 ? "" : "s"} · remembered {context.memories.length} business detail{context.memories.length === 1 ? "" : "s"}</div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Lifetime views" value={number.format(totalViews)} detail={`${number.format(context.recent30Days.listingViews)} in the last 30 days`} />
              <Metric label="Buyer leads" value={number.format(totalLeads)} detail={`${context.conversations.length} recent conversations`} />
              <Metric label="Active offers" value={number.format(activeListings.length)} detail={`${context.listings.length} total listings`} />
              <Metric label="Offer value" value={money.format(inventoryValue)} detail="Combined active asking price" />
            </div>

            <section className="rounded-[26px] border border-white/[.07] bg-white/[.025] p-6">
              <div className="flex items-end justify-between"><div><h2 className="font-semibold">Your offer board</h2><p className="mt-1 text-xs text-zinc-600">What is live, what people notice, and where buyers engage</p></div><Link href="/listings/new" className="text-xs text-emerald-400 hover:text-emerald-300">Create an offer →</Link></div>
              {context.listings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center"><p className="text-sm text-zinc-400">You haven&apos;t listed anything yet.</p><p className="mt-1 text-xs text-zinc-600">Ask Vibe what you could sell based on your skills, then turn the strongest idea into your first offer.</p></div>
              ) : (
                <div className="mt-5 divide-y divide-white/[.06]">
                  {context.listings.slice(0, 8).map((listing) => {
                    const conversion = listing._count.views ? Math.round((listing._count.conversations / listing._count.views) * 100) : 0;
                    return <div key={listing.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                      <div className="min-w-0"><div className="flex items-center gap-2"><Link href={`/listings/${listing.id}`} className="truncate text-sm font-medium text-zinc-200 hover:text-emerald-300">{listing.title}</Link><span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${listing.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-700/30 text-zinc-500"}`}>{listing.status}</span></div><div className="mt-1 text-[11px] text-zinc-600">{money.format(listing.price)} · {listing.category || "Uncategorized"} · updated {listing.updatedAt.toLocaleDateString()}</div></div>
                      <div className="flex gap-6 text-right"><div><div className="font-mono text-sm text-zinc-300">{listing._count.views}</div><div className="text-[9px] uppercase tracking-wider text-zinc-700">Views</div></div><div><div className="font-mono text-sm text-emerald-400">{listing._count.conversations}</div><div className="text-[9px] uppercase tracking-wider text-zinc-700">Leads</div></div><div><div className="font-mono text-sm text-zinc-300">{conversion}%</div><div className="text-[9px] uppercase tracking-wider text-zinc-700">Intent</div></div></div>
                    </div>;
                  })}
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[26px] border border-white/[.07] bg-white/[.025] p-6">
                <div className="flex items-center justify-between"><div><h2 className="font-semibold">Customer desk</h2><p className="mt-1 text-xs text-zinc-600">Recent buyer conversations</p></div><Link href="/messages" className="text-xs text-emerald-400">All messages →</Link></div>
                <div className="mt-4 space-y-1">{context.conversations.slice(0, 5).map((conversation) => <Link href={`/messages/${conversation.id}`} key={conversation.id} className="block rounded-xl px-3 py-3 hover:bg-white/[.04]"><div className="flex justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm text-zinc-300">{conversation.buyer.name || "Buyer"} · {conversation.listing.title}</div><div className="mt-1 truncate text-[11px] text-zinc-600">{conversation.messages[0]?.content || "New inquiry"}</div></div><time className="shrink-0 font-mono text-[9px] text-zinc-700">{conversation.updatedAt.toLocaleDateString()}</time></div></Link>)}{context.conversations.length === 0 && <p className="py-10 text-center text-xs text-zinc-700">No buyer conversations yet</p>}</div>
              </section>
              <section className="rounded-[26px] border border-white/[.07] bg-white/[.025] p-6">
                <h2 className="font-semibold">What Vibe remembers</h2><p className="mt-1 text-xs text-zinc-600">Durable context carried across sessions</p>
                <div className="mt-5 flex flex-wrap gap-2">{context.memories.map((memory, index) => <span key={`${memory.kind}-${index}`} title={memory.content} className="max-w-full truncate rounded-full border border-violet-400/15 bg-violet-400/[.06] px-3 py-2 text-[10px] text-violet-200"><span className="mr-1.5 uppercase text-violet-500">{memory.kind}</span>{memory.content}</span>)}{context.memories.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-5 text-xs leading-5 text-zinc-600">As you work together, Vibe will remember useful facts such as your skills, preferred customers, goals, constraints, and how you like to work.</div>}</div>
              </section>
            </div>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <StudioChat
              initialThreadId={latestThread?.id || null}
              sellerName={name}
              initialMessages={(latestThread?.messages || []).slice().reverse().map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
