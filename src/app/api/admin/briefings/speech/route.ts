import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFishTtsConfiguration } from "@/lib/tts-settings";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await prisma.user.findFirst({
    where: { id: session.user.id, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 6000) {
    return NextResponse.json({ error: "Briefing text must be between 1 and 6,000 characters." }, { status: 400 });
  }
  const config = await getFishTtsConfiguration();
  if (!config.apiKey) return NextResponse.json({ error: "Configure Fish Audio first." }, { status: 503 });

  const fishResponse = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      model: config.model,
    },
    body: JSON.stringify({
      text,
      format: "mp3",
      normalize: true,
      ...(config.referenceId ? { reference_id: config.referenceId } : {}),
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!fishResponse.ok) {
    const detail = await fishResponse.text();
    console.error("Fish Audio TTS error", fishResponse.status, detail.slice(0, 500));
    return NextResponse.json({ error: "Fish Audio could not generate this briefing." }, { status: 502 });
  }
  return new NextResponse(fishResponse.body, {
    headers: {
      "Content-Type": fishResponse.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
