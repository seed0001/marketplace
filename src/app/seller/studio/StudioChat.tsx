"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

const starters = [
  "What should I sell next?",
  "Audit my listings",
  "Help me reply to buyers",
  "Where am I losing interest?",
];

export function StudioChat({
  initialThreadId,
  initialMessages,
  sellerName,
}: {
  initialThreadId: string | null;
  initialMessages: ChatMessage[];
  sellerName: string;
}) {
  const [threadId, setThreadId] = useState(initialThreadId);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const optimisticId = useRef(0);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function send(text = input) {
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    setError("");
    setSending(true);
    optimisticId.current += 1;
    const optimistic: ChatMessage = {
      id: `local-${optimisticId.current}`,
      role: "user",
      content: message,
      createdAt: "",
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const response = await fetch("/api/seller-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, threadId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Vibe could not respond.");
      setThreadId(data.threadId);
      setMessages((current) => [...current, data.message]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Vibe could not respond.");
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    if (!threadId || clearing || sending) return;
    if (!window.confirm("Clear this chat log? Vibe will keep your long-term business memories.")) return;
    setClearing(true);
    setError("");
    try {
      const response = await fetch(`/api/seller-ai/chat?threadId=${encodeURIComponent(threadId)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not clear this chat.");
      setMessages([]);
      setThreadId(null);
      setInput("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not clear this chat.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <section className="flex h-[72dvh] min-h-0 flex-col overflow-hidden rounded-[24px] border border-emerald-400/20 bg-[#0d1211] shadow-2xl shadow-black/30 xl:h-[calc(100dvh-13rem)]">
      <header className="border-b border-white/[.07] bg-gradient-to-r from-emerald-400/[.08] to-transparent px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-base font-black text-black">
              V
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-[#0d1211] bg-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-white">Vibe</h2><span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[.12em] text-emerald-300">Seller AI</span></div>
              <p className="text-[10px] text-zinc-500">Private business partner · remembers your work</p>
            </div>
          </div>
          {threadId && messages.length > 0 && (
            <button onClick={clearChat} disabled={clearing || sending} className="rounded-lg border border-white/[.07] px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-500 transition hover:border-red-400/20 hover:bg-red-400/[.05] hover:text-red-300 disabled:opacity-40" title="Delete this chat transcript but keep long-term seller memory">
              {clearing ? "Clearing…" : "↻ Clear chat"}
            </button>
          )}
        </div>
      </header>

      <div className="studio-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md pt-6 text-center">
            <div className="text-2xl">✦</div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">Let&apos;s build something that sells, {sellerName}.</h3>
            <p className="mt-1.5 text-xs leading-5 text-zinc-500">I can see your listings, performance, buyer conversations, and feedback. Tell me what you&apos;re trying to build—or ask what the market is telling us.</p>
            <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {starters.map((starter) => (
                <button key={starter} onClick={() => send(starter)} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-left text-[11px] text-zinc-400 transition hover:border-emerald-400/30 hover:text-emerald-200">
                  {starter} <span className="float-right text-zinc-700">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[84%] whitespace-pre-wrap rounded-xl px-3.5 py-2 text-[13px] leading-5 ${
              message.role === "user"
                ? "rounded-br-md bg-emerald-400 text-emerald-950"
                : "rounded-bl-md border border-white/[.07] bg-white/[.04] text-zinc-300"
            }`}>
              {message.content.replace(/\n\s*\n\s*\n+/g, "\n\n")}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start"><div className="rounded-xl rounded-bl-md border border-white/[.07] bg-white/[.04] px-3.5 py-2 text-xs text-zinc-500"><span className="animate-pulse">Vibe is thinking through your business…</span></div></div>
        )}
        {error && <div className="rounded-lg border border-red-400/20 bg-red-400/[.06] px-3 py-2 text-xs text-red-300">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-white/[.07] bg-black/20 p-3">
        {messages.length > 0 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto">
            {starters.slice(0, 3).map((starter) => <button key={starter} onClick={() => send(starter)} className="shrink-0 rounded-full border border-white/[.08] px-2.5 py-1 text-[9px] text-zinc-500 hover:text-zinc-200">{starter}</button>)}
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-xl border border-white/10 bg-white/[.04] p-1.5 focus-within:border-emerald-400/40">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask Vibe about an idea, a listing, a buyer, or what to do next…"
            className="max-h-28 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-xs leading-5 outline-none placeholder:text-zinc-700"
          />
          <button onClick={() => send()} disabled={sending || !input.trim()} aria-label="Send to Vibe" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400 text-sm font-bold text-black transition hover:bg-emerald-300 disabled:opacity-30">↑</button>
        </div>
        <p className="mt-1.5 text-center text-[8px] text-zinc-700">Vibe drafts and advises. You approve anything sent or published.</p>
      </footer>
    </section>
  );
}
