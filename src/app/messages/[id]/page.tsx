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

type Feedback = {
  fromUserId: string;
  rating: number;
  comment?: string | null;
};

type ConvInfo = {
  id: string;
  kind: string;
  listing: { id: string; title: string; price: number } | null;
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
    ])
      .then(([msgs, convData]) => {
        setMessages(msgs);
        setConv(convData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !session?.user?.id || !conv?.listing) return;
    fetch(`/api/feedback?listingId=${conv.listing.id}&toUserId=${session.user.id}`)
      .then((r) => r.json())
      .then((data: { feedback?: Feedback[] }) => {
        const mine = data.feedback?.find((item) => item.fromUserId === session.user!.id);
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
    if (!feedbackRating || !conv?.listing) return;
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
      <div className="mx-auto mt-16 max-w-lg px-4 text-center">
        <p className="text-zinc-400">Sign in to view messages.</p>
      </div>
    );
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading...</div>;

  const otherPerson = conv
    ? session.user!.id === conv.seller.id ? conv.buyer : conv.seller
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        onClick={() => router.push("/messages")}
        className="mb-4 text-sm text-emerald-600 hover:underline"
      >
        &larr; Back to messages
      </button>

      {conv && (
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-zinc-100">{otherPerson?.name || "User"}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {conv.listing ? (
              <>
                Listing conversation about <span className="font-medium text-zinc-200">{conv.listing.title}</span>
              </>
            ) : (
              "Direct member message"
            )}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface">
        <div className="h-[50vh] space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-600">No messages yet. Start the conversation below.</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === session.user!.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-100"}`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isMe ? "text-emerald-200" : "text-zinc-400"}`}>
                    {formatRelativeTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-border p-4">
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

      {conv?.listing && (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold">Leave feedback</h3>
          {myFeedback ? (
            <div className="text-sm text-zinc-400">
              <p>You rated {otherPerson?.name || "User"}: <span className="text-amber-500">{"*".repeat(myFeedback.rating)}</span></p>
              {myFeedback.comment && <p className="mt-1 text-zinc-500">{myFeedback.comment}</p>}
              <p className="mt-2 text-xs text-zinc-400">Feedback can only be left once per listing.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`text-xl ${star <= feedbackRating ? "text-amber-500" : "text-zinc-600"} transition hover:text-amber-400`}
                  >
                    *
                  </button>
                ))}
              </div>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={2}
                placeholder="Comment (optional)"
                className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
