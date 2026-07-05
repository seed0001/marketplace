import Link from "next/link";
import { IssueReportForm } from "./IssueReportForm";

export const metadata = {
  title: "Report a site issue",
  description: "Tell the VibeMarket team about a problem with the website.",
};

export default async function ReportIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-14 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">Site support</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Something not working?</h1>
        <p className="mt-5 text-sm leading-7 text-zinc-400">Tell us where you ran into trouble and what happened. You do not need an account to submit a report.</p>
        <div className="mt-8 space-y-4 text-sm text-zinc-500">
          <p><span className="mr-3 text-emerald-400">01</span>Identify the page or feature.</p>
          <p><span className="mr-3 text-emerald-400">02</span>Describe what you saw.</p>
          <p><span className="mr-3 text-emerald-400">03</span>Leave a way for us to follow up.</p>
        </div>
        <Link href="/" className="mt-9 inline-block text-xs text-zinc-600 hover:text-emerald-300">← Return to VibeMarket</Link>
      </div>
      <IssueReportForm initialPage={page?.slice(0, 300)} />
    </div>
  );
}
