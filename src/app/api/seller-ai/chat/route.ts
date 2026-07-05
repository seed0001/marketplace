import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  buildSellerResponsePlan,
  buildSellerSystemPrompt,
  getSellerBusinessContext,
} from "@/lib/seller-ai";
import { getOpenRouterConfiguration } from "@/lib/ai-settings";

const MAX_MESSAGE_LENGTH = 6000;
const MAX_CLASSIFIER_RETRIES = 2;
const MEMORY_PATTERN = /<!--MEMORY:(\[[\s\S]*?\])-->/;

type MemoryCandidate = { kind?: unknown; content?: unknown };
type OpenRouterMessage = { role: "system" | "user" | "assistant"; content: string };
type OpenRouterResult = {
  model?: string;
  choices?: { finish_reason?: string; message?: { content?: string } }[];
};

export function isClassifierOnlyResponse(content: string) {
  if (!content.trim() || content.length > 240) return false;
  const normalized = content
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = normalized.split(" ");
  if (words.length > 12) return false;

  return (
    normalized === "user safety safe" ||
    normalized === "user safety is safe" ||
    normalized === "safety safe" ||
    normalized === "classification user safety safe" ||
    (normalized.includes("user safety") && /\bsafe\b/.test(normalized))
  );
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const threadId = new URL(request.url).searchParams.get("threadId");
    if (!threadId) return NextResponse.json({ error: "Thread required" }, { status: 400 });

    const deleted = await prisma.sellerAiThread.deleteMany({
      where: { id: threadId, userId: session.user.id },
    });
    if (!deleted.count) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    // SellerMemory is intentionally retained. Clearing a transcript should
    // reduce chat history without erasing durable goals and preferences.
    return NextResponse.json({ cleared: true });
  } catch {
    return NextResponse.json({ error: "Unable to clear chat" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const content = typeof body.message === "string" ? body.message.trim() : "";
    if (!content) return NextResponse.json({ error: "Message required" }, { status: 400 });
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const { apiKey, model } = await getOpenRouterConfiguration();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Seller AI is not configured yet. Add OPENROUTER_API_KEY to the server environment." },
        { status: 503 },
      );
    }

    let thread = body.threadId
      ? await prisma.sellerAiThread.findFirst({ where: { id: body.threadId, userId: session.user.id } })
      : null;
    if (!thread) {
      thread = await prisma.sellerAiThread.create({
        data: { userId: session.user.id, title: content.slice(0, 80) },
      });
    }

    const recentMinute = new Date(Date.now() - 60000);
    const recentRequests = await prisma.sellerAiMessage.count({
      where: { thread: { userId: session.user.id }, role: "user", createdAt: { gte: recentMinute } },
    });
    if (recentRequests >= 10) {
      return NextResponse.json({ error: "Give Vibe a moment before sending another message." }, { status: 429 });
    }

    await prisma.sellerAiMessage.create({ data: { threadId: thread.id, role: "user", content } });
    const [context, history] = await Promise.all([
      getSellerBusinessContext(session.user.id),
      prisma.sellerAiMessage.findMany({
        where: { threadId: thread.id },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: { role: true, content: true },
      }),
    ]);

    const isContinueRequest = /^(continue|keep going|next|next batch|more|go on)[.! ]*$/i.test(content);
    const hasPriorListingAudit = history.some(
      (message) =>
        message.role === "user" &&
        /\baudit\b/i.test(message.content) &&
        /\b(listing|listings|portfolio|products?)\b/i.test(message.content),
    );
    const responsePlan = buildSellerResponsePlan(content, isContinueRequest && hasPriorListingAudit);
    const providerMessages: OpenRouterMessage[] = [
      {
        role: "system",
        content: [buildSellerSystemPrompt(context), responsePlan].filter(Boolean).join("\n\n"),
      },
      ...history.reverse().map((message) => ({
        role: message.role === "assistant" ? "assistant" as const : "user" as const,
        content: message.content,
      })),
    ];
    let result: OpenRouterResult | null = null;
    let rawReply = "";
    let completeReply = "";
    let classifierRetries = 0;

    while (true) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.AUTH_URL || "https://vibemarket.app",
          "X-OpenRouter-Title": "VibeMarket Seller Studio",
        },
        body: JSON.stringify({
          model,
          messages: providerMessages,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenRouter error", response.status, error.slice(0, 500));
        return NextResponse.json({ error: "The AI provider could not complete that request." }, { status: 502 });
      }

      result = await response.json() as OpenRouterResult;
      rawReply = result.choices?.[0]?.message?.content || "";
      if (isClassifierOnlyResponse(rawReply)) {
        if (classifierRetries >= MAX_CLASSIFIER_RETRIES) break;
        classifierRetries += 1;
        console.warn(`OpenRouter returned classifier-only output; retrying seller response (${classifierRetries})`);
        providerMessages.push(
          { role: "assistant", content: rawReply },
          {
            role: "user",
            content:
              "That was only an internal safety-classifier label, not a response to my request. Do not repeat or discuss the classifier result. Continue the original conversation now and give the complete, useful seller-business answer I asked for.",
          },
        );
        continue;
      }

      completeReply += rawReply;
      if (result.choices?.[0]?.finish_reason !== "length") break;

      console.warn("OpenRouter stopped the seller response for length; requesting continuation");
      providerMessages.push(
        { role: "assistant", content: rawReply },
        {
          role: "user",
          content:
            "Continue from the exact point where the response stopped. Do not restart, repeat earlier text, summarize, or add a new introduction. Finish the answer and include the required memory comment only at the true end.",
        },
      );
    }

    rawReply = completeReply || rawReply;
    if (typeof rawReply !== "string" || !rawReply.trim()) {
      return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });
    }
    if (isClassifierOnlyResponse(rawReply)) {
      console.error("OpenRouter repeatedly returned classifier-only output", { model });
      return NextResponse.json(
        { error: "OpenRouter repeatedly routed this request to a classifier. Please try again." },
        { status: 502 },
      );
    }

    const memoryMatch = rawReply.match(MEMORY_PATTERN);
    const reply = rawReply.replace(MEMORY_PATTERN, "").trim();
    if (memoryMatch) {
      try {
        const memories = JSON.parse(memoryMatch[1]) as MemoryCandidate[];
        for (const memory of memories.slice(0, 5)) {
          const kind = typeof memory.kind === "string" ? memory.kind.slice(0, 40) : "business";
          const memoryContent = typeof memory.content === "string" ? memory.content.trim().slice(0, 500) : "";
          if (memoryContent) {
            await prisma.sellerMemory.upsert({
              where: { userId_kind_content: { userId: session.user.id, kind, content: memoryContent } },
              update: { updatedAt: new Date() },
              create: { userId: session.user.id, kind, content: memoryContent },
            });
          }
        }
      } catch {
        // A malformed optional memory block must never discard a useful reply.
      }
    }

    const saved = await prisma.sellerAiMessage.create({
      data: { threadId: thread.id, role: "assistant", content: reply, model: result?.model || model },
    });
    await prisma.sellerAiThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

    return NextResponse.json({
      threadId: thread.id,
      message: { id: saved.id, role: saved.role, content: saved.content, createdAt: saved.createdAt },
    });
  } catch (error) {
    console.error("Seller AI chat error", error);
    return NextResponse.json({ error: "Unable to reach the seller AI." }, { status: 500 });
  }
}
