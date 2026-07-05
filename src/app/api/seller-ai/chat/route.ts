import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildSellerSystemPrompt, getSellerBusinessContext } from "@/lib/seller-ai";
import { getOpenRouterConfiguration } from "@/lib/ai-settings";

const MAX_MESSAGE_LENGTH = 6000;
const MEMORY_PATTERN = /<!--MEMORY:(\[[\s\S]*?\])-->/;

type MemoryCandidate = { kind?: unknown; content?: unknown };

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
        messages: [
          { role: "system", content: buildSellerSystemPrompt(context) },
          ...history.reverse().map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 1400,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error", response.status, error.slice(0, 500));
      return NextResponse.json({ error: "The AI provider could not complete that request." }, { status: 502 });
    }

    const result = await response.json();
    const rawReply = result?.choices?.[0]?.message?.content;
    if (typeof rawReply !== "string" || !rawReply.trim()) {
      return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });
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
      data: { threadId: thread.id, role: "assistant", content: reply, model: result.model || model },
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
