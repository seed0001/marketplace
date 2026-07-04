"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name?: string | null; image?: string | null };
};

export default function ChatPage(props: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.params.then((p) => setId(p.id));
  }, [props.params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/conversations/${id}/messages`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMsg.trim() || sending || !id || !session?.user?.id) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
    }
    setSending(false);
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-600">Sign in to view messages.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-16 text-zinc-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        onClick={() => router.push("/messages")}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        &larr; Back to messages
      </button>

      <div className="rounded-xl border bg-white">
        <div className="h-[60vh] overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === session.user!.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe ? "bg-blue-600 text-white" : "bg-zinc-100"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-zinc-400"}`}>
                    {formatRelativeTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4 flex gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
