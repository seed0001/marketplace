import Link from "next/link";
import { auth } from "@/lib/auth";

const steps = [
  { number: "01", title: "Create your place", text: "Open an account and get a marketplace profile that grows with your listings, customer activity, reviews, and completed work." },
  { number: "02", title: "Show the real work", text: "Publish products, services, projects, or expertise with images and README-powered pages that explain what buyers are getting." },
  { number: "03", title: "Build with an AI partner", text: "Your private Seller AI can audit listings, read performance signals, surface priorities, and help draft thoughtful buyer replies." },
  { number: "04", title: "Turn activity into proof", text: "Views, conversations, feedback, and reviews build a living portfolio—not a profile filled with unsupported claims." },
];

export default async function Home() {
  const session = await auth();
  const primaryHref = session ? "/listings" : "/auth/signup";
  const primaryLabel = session ? "Enter the marketplace" : "Create your account";
  const apiHref = session ? "/seller/api-keys" : "/auth/signup?callbackUrl=/seller/api-keys";
  const apiSnippet = `# Your agent creates a listing on your behalf
curl -X POST https://vibemarket.app/api/v1/listings \\
  -H "Authorization: Bearer vm_live_••••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Realtime analytics dashboard",
    "price": 4900,
    "category": "Software"
  }'`;

  return (
    <div className="overflow-hidden text-zinc-100">
      <section className="relative border-b border-white/10 px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300">
              A marketplace for people who build
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[.96] tracking-[-.055em] sm:text-7xl">
              Put your work in the market. <span className="text-zinc-500">Build a reputation around it.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              VibeMarket gives builders one place to sell products, services, projects, and expertise—with a portfolio that records the work, an AI partner that helps improve it, and a personal API key so your own code or AI agent can run the whole storefront.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={primaryHref} className="rounded-full bg-emerald-400 px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-300">{primaryLabel} →</Link>
              {!session && <Link href="/auth/signin?callbackUrl=/listings" className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[.06]">Sign in to browse</Link>}
            </div>
            <p className="mt-4 text-xs text-zinc-600">The full catalog is available to signed-in members.</p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-emerald-400/15 to-violet-500/10 blur-2xl" />
            <div className="relative rounded-[30px] border border-white/10 bg-[#0b0f0e]/90 p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
                <div><div className="text-[9px] font-bold uppercase tracking-[.2em] text-emerald-400">Your builder workspace</div><div className="mt-1 text-sm text-zinc-300">Profile, market, API, intelligence</div></div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-700" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[["Listings", "Live"], ["Portfolio", "Growing"], ["API access", "Open"]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><div className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</div><div className="mt-2 text-xs font-medium text-zinc-200">{value}</div></div>)}
              </div>
              <div className="mt-3 rounded-2xl border border-violet-400/15 bg-violet-400/[.04] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-violet-300"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-400/15">✦</span> Private Seller AI</div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">“Your strongest listing has attention but no buyer conversations. Let’s tighten the offer and clarify the next step.”</p>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[.07] px-4 py-3 text-xs"><span className="text-zinc-500">Marketplace signal</span><span className="text-emerald-300">Real activity → real proof</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[.07] bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><div className="text-[10px] font-bold uppercase tracking-[.25em] text-emerald-400">How VibeMarket works</div><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A storefront is only the beginning.</h2><p className="mt-4 text-sm leading-6 text-zinc-500">The platform connects what you make, how people respond, and what you should improve next.</p></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => <div key={step.number} className="bg-[#090c0b] p-7"><div className="font-mono text-xs text-emerald-500">{step.number}</div><h3 className="mt-8 text-lg font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-500">{step.text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-emerald-400/[.08] to-transparent p-8 sm:p-10">
            <div className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-400">For builders and sellers</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Your work gets a home—and a history.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">Create rich listing pages, show your websites, talk directly with interested buyers, and let verified marketplace activity strengthen your profile over time.</p>
            <ul className="mt-7 space-y-3 text-sm text-zinc-400">{["README-powered product and service pages", "Private views, inquiry, and feedback signals", "AI-assisted audits, priorities, and reply drafting", "A personal API key to run your storefront from your own code or AI agent"].map((item) => <li key={item} className="flex gap-3"><span className="text-emerald-400">✓</span>{item}</li>)}</ul>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-violet-400/[.08] to-transparent p-8 sm:p-10">
            <div className="text-[10px] font-bold uppercase tracking-[.22em] text-violet-300">For buyers and collaborators</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Find the person behind the listing.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">Signed-in members can explore the full catalog, see the builder’s body of work, start a focused conversation, and leave feedback that means something.</p>
            <div className="mt-8"><Link href={primaryHref} className="inline-flex rounded-full border border-violet-300/25 bg-violet-400/10 px-6 py-3 text-sm font-medium text-violet-200 hover:bg-violet-400/15">{primaryLabel}</Link></div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[.07] bg-black/20 px-6 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.92fr_1.08fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300">
              Agent-native by design
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your storefront comes with an API key. <span className="text-zinc-500">Most marketplaces never hand you one.</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-400">
              Generate a personal key and point your own app—or a local AI agent—straight at the marketplace. Create listings, update prices, sync a catalog, and read performance, all programmatically. Every key is scoped to your account, hashed at rest, and revocable in one click.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-zinc-400">{["Create and manage listings from your own code", "Let a local AI agent run your storefront end to end", "Scoped to you, hashed at rest, revocable anytime"].map((item) => <li key={item} className="flex gap-3"><span className="text-emerald-400">✓</span>{item}</li>)}</ul>
            <div className="mt-8"><Link href={apiHref} className="inline-flex rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300">Generate your API key →</Link></div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-3 rounded-[30px] bg-gradient-to-br from-emerald-400/10 to-violet-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07100d]/90 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/[.07] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <span className="ml-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">POST /api/v1/listings</span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12px] leading-6 text-zinc-300"><code>{apiSnippet}</code></pre>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[.07] px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl"><div className="text-[10px] font-bold uppercase tracking-[.25em] text-emerald-400">Build in public. Operate with intelligence.</div><h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Bring the work. We’ll help you build the market around it.</h2><div className="mt-8"><Link href={primaryHref} className="inline-flex rounded-full bg-emerald-400 px-8 py-4 text-sm font-semibold text-black hover:bg-emerald-300">{primaryLabel} →</Link></div></div>
      </section>
    </div>
  );
}
