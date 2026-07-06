"use client";

import { useMemo, useState } from "react";
import { publishSiteNotification } from "./actions";

type MemberOption = {
  id: string;
  label: string;
  email: string;
  phoneReady: boolean;
  emailReady: boolean;
};

export function StaffMessageComposer({
  members,
  smsConfigured,
  emailConfigured,
}: {
  members: MemberOption[];
  smsConfigured: boolean;
  emailConfigured: boolean;
}) {
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 40);
    return members
      .filter((member) => member.label.toLowerCase().includes(q) || member.email.toLowerCase().includes(q))
      .slice(0, 40);
  }, [members, query]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <form action={publishSiteNotification} className="mt-5 space-y-4">
      <div>
        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Subject</label>
        <input id="title" name="title" required maxLength={120} placeholder="Scheduled maintenance tonight" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50" />
      </div>

      <div>
        <label htmlFor="body" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Message</label>
        <textarea id="body" name="body" required maxLength={3000} rows={7} placeholder="Write the update members should receive." className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none placeholder:text-zinc-700 focus:border-emerald-400/50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Type</label>
          <select id="category" name="category" defaultValue="update" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50">
            <option value="update">Update</option>
            <option value="feature">Feature</option>
            <option value="maintenance">Maintenance</option>
            <option value="policy">Policy</option>
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Priority</label>
          <select id="priority" name="priority" defaultValue="normal" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50">
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAudience("all")} className={`rounded-xl px-4 py-2 text-xs font-semibold ${audience === "all" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400"}`}>Everyone</button>
          <button type="button" onClick={() => setAudience("selected")} className={`rounded-xl px-4 py-2 text-xs font-semibold ${audience === "selected" ? "bg-emerald-400 text-black" : "border border-white/10 text-zinc-400"}`}>Selected members</button>
        </div>
        <input type="hidden" name="audience" value={audience} />
        {selected.map((id) => <input key={id} type="hidden" name="recipientIds" value={id} />)}

        {audience === "selected" && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="member-search" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Recipients</label>
              <span className="text-[11px] text-zinc-600">{selected.length} selected</span>
            </div>
            <input
              id="member-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members by name or email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-emerald-400/50"
            />
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/10">
              {filtered.map((member) => (
                <label key={member.id} className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2 last:border-0 hover:bg-white/[.03]">
                  <input type="checkbox" checked={selected.includes(member.id)} onChange={() => toggle(member.id)} className="h-4 w-4 accent-emerald-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-200">{member.label}</span>
                    <span className="block truncate text-[11px] text-zinc-600">{member.email}</span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {member.emailReady && <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">Email</span>}
                    {member.phoneReady && <span className="rounded-full bg-sky-400/10 px-2 py-1 text-[10px] text-sky-300">SMS</span>}
                  </span>
                </label>
              ))}
              {filtered.length === 0 && <div className="px-3 py-8 text-center text-sm text-zinc-600">No members match that search.</div>}
            </div>
          </div>
        )}
      </section>

      <div>
        <label htmlFor="expiresAt" className="text-xs font-semibold uppercase tracking-[.15em] text-zinc-500">Expires at</label>
        <input id="expiresAt" name="expiresAt" type="datetime-local" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/50" />
        <p className="mt-2 text-[11px] text-zinc-600">Leave blank if the message should stay active until staff archives it.</p>
      </div>
      <p className={`text-[11px] ${smsConfigured ? "text-sky-300" : "text-amber-300"}`}>
        {smsConfigured ? "SMS-ready members will also receive this automatically." : "SMS is not configured, so this will send as a website notification only."}
      </p>
      <p className={`text-[11px] ${emailConfigured ? "text-emerald-300" : "text-amber-300"}`}>
        {emailConfigured ? "Email-ready members will also receive this automatically." : "Email is not configured, so no email copies will send yet."}
      </p>

      <button className="w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300">
        Send message
      </button>
    </form>
  );
}
