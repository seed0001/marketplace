"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRelativeTime, formatPrice } from "@/lib/utils";

type Conversation = {
  id: string;
  listing: { id: string; title: string; price: number; images: string[] };
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
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">Sign in to view your messages.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-16 text-zinc-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-zinc-500 text-center py-12">No conversations yet</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = conv.buyer.id === session.user!.id ? conv.seller : conv.buyer;
            const lastMsg = conv.messages[0];
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="block rounded-xl border bg-white p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold">
                    {other.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{other.name || "User"}</p>
                      {lastMsg && (
                        <span className="text-xs text-zinc-400 shrink-0">
                          {formatRelativeTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      Re: {conv.listing.title} – {formatPrice(conv.listing.price)}
                    </p>
                    {lastMsg && (
                      <p className="text-sm text-zinc-600 truncate mt-1">{lastMsg.content}</p>
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
