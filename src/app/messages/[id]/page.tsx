"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  listing: { id: string; title: string; price: number; images: string[] } | null;
  buyer: { id: string; name?: string | null; image?: string | null };
  seller: { id: string; name?: string | null; image?: string | null };
};

function Avatar({
  user,
  size = "md",
}: {
  user: { name?: string | null; image?: string | null };
  size?: "sm" | "md" | "lg";
}) {
  const classes = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

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

export default function ChatPage(props: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<ConvInfo | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
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
    if (!id || status !== "authenticated") return;
    Promise.all([
      fetch(`/api/conversations/${id}/messages`).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load messages.");
        return data;
      }),
      fetch(`/api/conversations/${id}`).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load conversation.");
        return data;
      }),
    ])
      .then(([msgs, convData]) => {
        setMessages(msgs);
        setConv(convData);
        setLoading(false);
      })
      .catch((caught) => {
        setLoadError(caught instanceof Error ? caught.message : "Could not load conversation.");
        setLoading(false);
      });
  }, [id, status]);

  useEffect(() => {
    if (!id || !session?.user?.id || !conv?.listing) return;
    const feedbackTargetId = session.user.id === conv.seller.id ? conv.buyer.id : conv.seller.id;
    fetch(`/api/feedback?listingId=${conv.listing.id}&toUserId=${feedbackTargetId}`)
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
    setSendError("");
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
    } else {
      const data = await res.json().catch(() => ({}));
      setSendError(data.error || "Could not send message.");
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

  if (status === "loading") {
    return <div className="py-16 text-center text-zinc-500">Loading conversation...</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto mt-16 max-w-lg px-4 text-center">
        <p className="text-zinc-400">
          Sign in to view messages.{" "}
          <Link href="/auth/signin?callbackUrl=/messages" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading conversation...</div>;

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button onClick={() => router.push("/messages")} className="mb-4 text-sm text-emerald-500 hover:text-emerald-300">
          Back to messages
        </button>
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">{loadError}</p>
      </div>
    );
  }

  const otherPerson = conv
    ? session.user!.id === conv.seller.id ? conv.buyer : conv.seller
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button
        onClick={() => router.push("/messages")}
        className="mb-4 text-sm text-emerald-500 hover:text-emerald-300"
      >
        Back to messages
      </button>

      {conv && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/35 p-4 shadow-xl shadow-black/20">
          <div className="flex items-start gap-4">
            {otherPerson && <Avatar user={otherPerson} size="lg" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold text-zinc-100">{otherPerson?.name || "Member"}</h1>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-400">
                    {conv.listing ? "Listing inquiry" : "Direct member message"}
                  </p>
                </div>
                {otherPerson && (
                  <Link href={`/users/${otherPerson.id}`} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300">
                    View profile
                  </Link>
                )}
              </div>
              {conv.listing && (
                <Link href={`/listings/${conv.listing.id}`} className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3 transition hover:border-emerald-400/30">
                  {conv.listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.listing.images[0]} alt="" className="h-14 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-16 rounded-lg bg-zinc-900" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-100">{conv.listing.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">Open listing</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-xl shadow-black/20">
        <div className="h-[55vh] space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-600">No messages yet. Start the conversation below.</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === session.user!.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && <Avatar user={msg.sender} size="sm" />}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2 shadow-lg shadow-black/10 ${isMe ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-100"}`}>
                  {!isMe && <p className="mb-1 text-[11px] font-medium text-zinc-400">{msg.sender.name || "Member"}</p>}
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isMe ? "text-emerald-100" : "text-zinc-500"}`}>{formatRelativeTime(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 p-4">
          {sendError && <p className="mb-2 text-xs text-red-400">{sendError}</p>}
          <div className="flex gap-2">
            <textarea
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void sendMessage())}
              rows={1}
              placeholder={`Message ${otherPerson?.name || "member"}...`}
              className="min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMsg.trim()}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? "Sending" : "Send"}
            </button>
          </div>
        </div>
      </div>

      {conv?.listing && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5 shadow-xl shadow-black/20">
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
