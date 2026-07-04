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

type ConvInfo = {
  id: string;
  listing: { id: string; title: string; price: number };
  buyer: { id: string; name?: string | null };
  seller: { id: string; name?: string | null };
};

export default function ChatPage(props: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<ConvInfo | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // feedback state
  const [myFeedback, setMyFeedback] = useState<{ rating: number; comment: string } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  useEffect(() => {
    props.params.then((p) => setId(p.id));
  }, [props.params]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/conversations/${id}/messages`).then((r) => r.json()),
      fetch(`/api/conversations/${id}`).then((r) => r.json()),
    ]).then(([msgs, convData]) => {
      setMessages(msgs);
      setConv(convData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !session?.user?.id || !conv) return;
    fetch(`/api/feedback?listingId=${conv.listing.id}&toUserId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        const mine = data.feedback?.find((f: any) => f.fromUserId === session.user!.id);
        if (mine) setMyFeedback({ rating: mine.rating, comment: mine.comment || "" });
      })
      .catch(() => {});
  }, [id, session, conv]);

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

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackRating || !conv) return;
    setSubmittingFeedback(true);
    setFeedbackError("");

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: conv.listing.id,
        toUserId: session?.user?.id === conv.seller.id ? conv.buyer.id : conv.seller.id,
        rating: feedbackRating,
        comment: feedbackComment,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFeedbackError(data.error || "Failed to submit");
      setSubmittingFeedback(false);
      return;
    }

    setMyFeedback({ rating: feedbackRating, comment: feedbackComment });
    setSubmittingFeedback(false);
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg mt-16 px-4 text-center">
        <p className="text-zinc-400">Sign in to view messages.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-16 text-zinc-500">Loading...</div>;

  const otherPerson = conv
    ? session.user!.id === conv.seller.id ? conv.buyer : conv.seller
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        onClick={() => router.push("/messages")}
        className="text-sm text-emerald-600 hover:underline mb-4"
      >
        &larr; Back to messages
      </button>

      {conv && (
        <p className="text-sm text-zinc-500 mb-4">
          Conversation with <span className="font-medium text-zinc-700">{otherPerson?.name || "User"}</span> about{" "}
          <span className="font-medium text-zinc-700">{conv.listing.title}</span>
        </p>
      )}

      <div className="rounded-xl border bg-white">
        <div className="h-[50vh] overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === session.user!.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe ? "bg-emerald-600 text-white" : "bg-zinc-100"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-emerald-200" : "text-zinc-400"}`}>
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
            className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Feedback */}
      {conv && (
        <div className="mt-8 rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold mb-3">Leave feedback</h3>
          {myFeedback ? (
            <div className="text-sm text-zinc-400">
              <p>You rated {otherPerson?.name || "User"}: <span className="text-amber-500">{'★'.repeat(myFeedback.rating)}</span></p>
              {myFeedback.comment && <p className="mt-1 text-zinc-500">{myFeedback.comment}</p>}
              <p className="text-xs text-zinc-400 mt-2">Feedback can only be left once per listing.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`text-xl ${star <= feedbackRating ? "text-amber-500" : "text-zinc-200"} hover:text-amber-400 transition`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={2}
                placeholder="Comment (optional)"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500 resize-y"
              />
              {feedbackError && <p className="text-xs text-red-600">{feedbackError}</p>}
              <button
                type="submit"
                disabled={!feedbackRating || submittingFeedback}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submittingFeedback ? "Submitting..." : "Submit feedback"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
