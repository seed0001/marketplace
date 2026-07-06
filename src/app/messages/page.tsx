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

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="mx-auto mt-16 max-w-lg px-4 text-center">
        <p className="text-zinc-400">Sign in to view your messages.</p>
      </div>
    );
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="mt-1 text-sm text-zinc-500">Direct member chats and listing inquiries in one inbox.</p>
        </div>
      </div>
      {conversations.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No conversations yet</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = conv.buyer.id === session.user!.id ? conv.seller : conv.buyer;
            const lastMsg = conv.messages[0];
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="block rounded-xl border border-border bg-surface p-4 transition hover:bg-zinc-800"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-100">
                    {other.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{other.name || "User"}</p>
                      {lastMsg && (
                        <span className="shrink-0 text-xs text-zinc-400">
                          {formatRelativeTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {conv.listing ? `Re: ${conv.listing.title} - ${formatPrice(conv.listing.price)}` : "Direct message"}
                    </p>
                    {lastMsg ? (
                      <p className="mt-1 truncate text-sm text-zinc-300">{lastMsg.content}</p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-600">No messages yet</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
