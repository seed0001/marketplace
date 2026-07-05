"use client";

import { useActionState } from "react";
import { submitIssue, type IssueFormState } from "./actions";

const initialState: IssueFormState = { success: false, message: "" };

export function IssueReportForm({ initialPage = "" }: { initialPage?: string }) {
  const [state, formAction, pending] = useActionState(submitIssue, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-xl font-bold text-black">✓</div>
        <h2 className="mt-5 text-xl font-semibold">Report received</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{state.message}</p>
        <p className="mt-5 font-mono text-xs text-emerald-300">Reference {state.reference}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-white/10 bg-white/[.035] p-6 sm:p-8">
      <div className="hidden" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Field label="What page or feature was affected?" error={state.errors?.affectedPage?.[0]}>
        <input name="affectedPage" defaultValue={initialPage} required maxLength={300} placeholder="Example: Listings page, messages, checkout…" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-400/40" />
      </Field>
      <Field label="What happened?" error={state.errors?.description?.[0]} hint="Describe what you expected, what actually happened, and anything you tried.">
        <textarea name="description" required minLength={10} maxLength={5000} rows={7} placeholder="Tell us what went wrong…" className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-400/40" />
      </Field>
      <Field label="How can we contact you?" error={state.errors?.contact?.[0]} hint="Email, phone number, username, or another contact method is fine.">
        <input name="contact" required maxLength={300} autoComplete="email" placeholder="Your preferred contact information" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-emerald-400/40" />
      </Field>
      {state.message && <p role="alert" className="text-sm text-red-300">{state.message}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Sending report…" : "Submit issue report"}
      </button>
      <p className="text-center text-[11px] leading-5 text-zinc-600">Browser and device information is attached automatically to help us diagnose the problem.</p>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {hint && <span className="mt-1 block text-xs text-zinc-600">{hint}</span>}
      <div className="mt-2">{children}</div>
      {error && <span className="mt-1.5 block text-xs text-red-300">{error}</span>}
    </label>
  );
}
