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

  return (
    <section className="flex h-[72dvh] min-h-0 flex-col overflow-hidden rounded-[24px] border border-emerald-400/20 bg-[#0d1211] shadow-2xl shadow-black/30 xl:h-[calc(100dvh-13rem)]">
      <header className="border-b border-white/[.07] bg-gradient-to-r from-emerald-400/[.08] to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-black text-black">
            V
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#0d1211] bg-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2"><h2 className="font-semibold text-white">Vibe</h2><span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-emerald-300">Seller AI</span></div>
            <p className="text-xs text-zinc-500">Your private business partner · remembers your work</p>
          </div>
        </div>
      </header>

      <div className="studio-chat-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md pt-12 text-center">
            <div className="text-3xl">✦</div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight">Let&apos;s build something that sells, {sellerName}.</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">I can see your listings, performance, buyer conversations, and feedback. Tell me what you&apos;re trying to build—or ask what the market is telling us.</p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {starters.map((starter) => (
                <button key={starter} onClick={() => send(starter)} className="rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-3 text-left text-xs text-zinc-400 transition hover:border-emerald-400/30 hover:text-emerald-200">
                  {starter} <span className="float-right text-zinc-700">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "rounded-br-md bg-emerald-400 text-emerald-950"
                : "rounded-bl-md border border-white/[.07] bg-white/[.04] text-zinc-300"
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md border border-white/[.07] bg-white/[.04] px-4 py-3 text-sm text-zinc-500"><span className="animate-pulse">Vibe is thinking through your business…</span></div></div>
        )}
        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/[.06] px-4 py-3 text-xs text-red-300">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-white/[.07] bg-black/20 p-4">
        {messages.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {starters.slice(0, 3).map((starter) => <button key={starter} onClick={() => send(starter)} className="shrink-0 rounded-full border border-white/[.08] px-3 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-200">{starter}</button>)}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[.04] p-2 focus-within:border-emerald-400/40">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Ask Vibe about an idea, a listing, a buyer, or what to do next…"
            className="max-h-36 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-700"
          />
          <button onClick={() => send()} disabled={sending || !input.trim()} aria-label="Send to Vibe" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 font-bold text-black transition hover:bg-emerald-300 disabled:opacity-30">↑</button>
        </div>
        <p className="mt-2 text-center text-[9px] text-zinc-700">Vibe drafts and advises. You approve anything sent or published.</p>
      </footer>
    </section>
  );
}
