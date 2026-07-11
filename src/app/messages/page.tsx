"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRelativeTime, formatPrice } from "@/lib/utils";

type Conversation = {
  id: string;
  kind: string;
  listing: { id: string; title: string; price: number; images: string[] } | null;
  buyer: { id: string; name?: string | null; image?: string | null };
  seller: { id: string; name?: string | null; image?: string | null };
  messages: { content: string; createdAt: string; sender: { id: string; name?: string | null } }[];
  updatedAt: string;
};

function Avatar({ user, size = "md" }: { user: { name?: string | null; image?: string | null }; size?: "md" | "lg" }) {
  const classes = size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.image} alt="" className={`${classes} shrink-0 rounded-full object-cover ring-1 ring-white/10`} />
    );
  }

  return (
    <div className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-zinc-800 font-semibold text-zinc-200 ring-1 ring-white/10`}>
      {user.name?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/conversations")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load messages.");
        return data;
      })
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Could not load messages.");
        setLoading(false);
      });
  }, [status]);

  if (status === "loading") {
    return <div className="py-16 text-center text-zinc-500">Loading messages...</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto mt-16 max-w-lg px-4 text-center">
        <p className="text-zinc-400">
          Sign in to view your messages.{" "}
          <Link href="/auth/signin?callbackUrl=/messages" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading messages...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="mt-1 text-sm text-zinc-500">Direct member chats and listing inquiries in one inbox.</p>
        </div>
        <Link href="/profile" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300">
          My profile
        </Link>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">{error}</p>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-zinc-100">No conversations yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Use the Message button on a member profile or listing page to start a direct conversation.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-xl shadow-black/20">
          {conversations.map((conv) => {
            const other = conv.buyer.id === session.user!.id ? conv.seller : conv.buyer;
            const lastMsg = conv.messages[0];
            const isDirect = conv.kind === "direct" || !conv.listing;
            return (
              <div key={conv.id} className="group border-b border-white/10 last:border-b-0">
                <Link href={`/messages/${conv.id}`} className="block p-4 transition hover:bg-white/[.04]">
                  <div className="flex items-start gap-3">
                    <Avatar user={other} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-100">{other.name || "Member"}</p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-400">
                            {isDirect ? "Direct message" : "Listing inquiry"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {lastMsg ? formatRelativeTime(lastMsg.createdAt) : formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                      {conv.listing && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-2">
                          {conv.listing.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={conv.listing.images[0]} alt="" className="h-12 w-14 rounded-lg object-cover" />
                          ) : (
                            <div className="h-12 w-14 rounded-lg bg-zinc-900" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-zinc-200">{conv.listing.title}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{formatPrice(conv.listing.price)}</p>
                          </div>
                        </div>
                      )}
                      {lastMsg ? (
                        <p className="mt-3 truncate text-sm text-zinc-300">
                          <span className="text-zinc-500">{lastMsg.sender.id === session.user!.id ? "You: " : ""}</span>
                          {lastMsg.content}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-600">No messages yet. Open the thread to start.</p>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex gap-3 px-4 pb-4 pl-[76px] text-xs">
                  <Link href={`/users/${other.id}`} className="text-zinc-500 hover:text-emerald-300">View profile</Link>
                  {conv.listing && <Link href={`/listings/${conv.listing.id}`} className="text-zinc-500 hover:text-emerald-300">View listing</Link>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
