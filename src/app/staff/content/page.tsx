import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { ContentActions } from "./ContentActions";

export const dynamic = "force-dynamic";

const types = ["listings", "websites", "reviews", "feedback", "history"] as const;
type ViewType = (typeof types)[number];

export default async function ContentManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const type: ViewType = types.includes(params.type as ViewType) ? (params.type as ViewType) : "listings";
  const q = params.q?.trim().slice(0, 100) || "";
  const contains = q ? { contains: q, mode: "insensitive" as const } : undefined;

  const [counts, listings, websites, reviews, feedback, history] = await Promise.all([
    Promise.all([
      prisma.listing.count(),
      prisma.sellerWebsite.count(),
      prisma.review.count(),
      prisma.feedback.count(),
    ]),
    type === "listings" ? prisma.listing.findMany({
      where: q ? { OR: [{ title: contains }, { description: contains }, { user: { email: contains } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, title: true, status: true, price: true, createdAt: true, user: { select: { name: true, email: true } }, _count: { select: { views: true, conversations: true } } },
    }) : [],
    type === "websites" ? prisma.sellerWebsite.findMany({
      where: q ? { OR: [{ title: contains }, { description: contains }, { url: contains }, { user: { email: contains } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, title: true, url: true, createdAt: true, user: { select: { name: true, email: true } } },
    }) : [],
    type === "reviews" ? prisma.review.findMany({
      where: q ? { OR: [{ comment: contains }, { listing: { title: contains } }, { author: { email: contains } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, rating: true, comment: true, createdAt: true, listing: { select: { title: true } }, author: { select: { name: true, email: true } } },
    }) : [],
    type === "feedback" ? prisma.feedback.findMany({
      where: q ? { OR: [{ comment: contains }, { listing: { title: contains } }, { from: { email: contains } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, rating: true, comment: true, createdAt: true, listing: { select: { title: true } }, from: { select: { name: true, email: true } }, to: { select: { name: true, email: true } } },
    }) : [],
    type === "history" ? prisma.contentModerationEvent.findMany({
      where: q ? { OR: [{ contentTitle: contains }, { action: contains }, { actor: { email: contains } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { name: true, email: true } } },
    }) : [],
  ]);

  const labels: Record<ViewType, string> = { listings: "Listings", websites: "Website submissions", reviews: "Reviews", feedback: "Seller feedback", history: "Action history" };
  const totalByType: Partial<Record<ViewType, number>> = { listings: counts[0], websites: counts[1], reviews: counts[2], feedback: counts[3] };

  return (
    <div className="min-h-screen bg-[#07090a] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0e0f]">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Staff operations</div>
              <h1 className="mt-1 text-2xl font-semibold">Post & submission management</h1>
              <p className="mt-2 text-sm text-zinc-500">Moderate individual marketplace records without altering the database. Signed in as {staff.name || staff.email}.</p>
            </div>
            <Link href="/staff/analytics" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">Intelligence</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-8">
        <nav className="flex flex-wrap gap-2">
          {types.map((item) => (
            <Link key={item} href={`/staff/content?type=${item}`} className={`rounded-xl border px-4 py-2 text-xs ${type === item ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-zinc-500 hover:text-white"}`}>
              {labels[item]} {totalByType[item] !== undefined && <span className="ml-1 text-zinc-600">{totalByType[item]}</span>}
            </Link>
          ))}
        </nav>

        <form className="mt-6 flex max-w-xl gap-2">
          <input type="hidden" name="type" value={type} />
          <input name="q" defaultValue={q} placeholder={`Search ${labels[type].toLowerCase()}…`} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/40" />
          <button className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black">Search</button>
          {q && <Link href={`/staff/content?type=${type}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400">Clear</Link>}
        </form>

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
          <div className="border-b border-white/10 px-5 py-4 text-sm font-medium">{labels[type]} <span className="ml-2 text-xs font-normal text-zinc-600">latest 100 records</span></div>
          <div className="divide-y divide-white/5">
            {type === "listings" && listings.map((item) => <Row key={item.id} title={item.title} meta={`${item.user.name || item.user.email} · $${item.price.toLocaleString()} · ${item._count.views} views · ${item._count.conversations} conversations`} date={item.createdAt}><Link href={`/listings/${item.id}`} className="text-xs text-emerald-400 hover:underline">View</Link><ContentActions id={item.id} type="listing" status={item.status} title={item.title} /></Row>)}
            {type === "websites" && websites.map((item) => <Row key={item.id} title={item.title} meta={`${item.user.name || item.user.email} · ${item.url}`} date={item.createdAt}><a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">Visit</a><ContentActions id={item.id} type="website" title={item.title} /></Row>)}
            {type === "reviews" && reviews.map((item) => <Row key={item.id} title={`${item.rating}/5 review on ${item.listing.title}`} meta={`${item.author.name || item.author.email} · ${item.comment || "No written comment"}`} date={item.createdAt}><ContentActions id={item.id} type="review" title={`Review on ${item.listing.title}`} /></Row>)}
            {type === "feedback" && feedback.map((item) => <Row key={item.id} title={`${item.rating}/5 feedback on ${item.listing.title}`} meta={`${item.from.name || item.from.email} → ${item.to.name || item.to.email} · ${item.comment || "No written comment"}`} date={item.createdAt}><ContentActions id={item.id} type="feedback" title={`Feedback on ${item.listing.title}`} /></Row>)}
            {type === "history" && history.map((item) => <Row key={item.id} title={`${item.action} · ${item.contentTitle}`} meta={`${item.contentType} · by ${item.actor.name || item.actor.email} · record ${item.contentId}`} date={item.createdAt} />)}
            {((type === "listings" && !listings.length) || (type === "websites" && !websites.length) || (type === "reviews" && !reviews.length) || (type === "feedback" && !feedback.length) || (type === "history" && !history.length)) && <div className="px-5 py-16 text-center text-sm text-zinc-600">No matching records.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ title, meta, date, children }: { title: string; meta: string; date: Date; children?: React.ReactNode }) {
  return <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><div className="truncate text-sm text-zinc-200">{title}</div><div className="mt-1 truncate text-xs text-zinc-600">{meta}</div><time className="mt-1 block text-[10px] text-zinc-700">{date.toLocaleString()}</time></div>{children && <div className="flex items-center justify-end gap-3">{children}</div>}</div>;
}
