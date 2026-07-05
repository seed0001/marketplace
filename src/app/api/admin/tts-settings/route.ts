import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FISH_TTS_MODEL,
  getFishTtsConfiguration,
  saveFishTtsConfiguration,
} from "@/lib/tts-settings";

async function administrator() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findFirst({
    where: { id: session.user.id, role: "ADMIN" },
    select: { id: true },
  });
}

export async function GET() {
  const admin = await administrator();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const config = await getFishTtsConfiguration();
  return NextResponse.json({
    model: config.model,
    referenceId: config.referenceId,
    maskedKey: config.apiKey ? `••••••••${config.apiKey.slice(-4)}` : "",
    source: config.source,
  });
}

export async function PUT(request: NextRequest) {
  const admin = await administrator();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const model = typeof body.model === "string" ? body.model.trim().slice(0, 80) : "";
  const referenceId = typeof body.referenceId === "string" ? body.referenceId.trim().slice(0, 100) : "";
  const newApiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!model) return NextResponse.json({ error: "Fish Audio model is required." }, { status: 400 });

  const current = await getFishTtsConfiguration();
  const apiKey = newApiKey || current.apiKey;
  if (!apiKey) return NextResponse.json({ error: "Fish Audio API key is required." }, { status: 400 });

  try {
    const validation = await fetch("https://api.fish.audio/wallet/self/api-credit", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!validation.ok) {
      return NextResponse.json({ error: "Fish Audio rejected that API key." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not verify the Fish Audio API key." }, { status: 502 });
  }

  await saveFishTtsConfiguration({
    apiKey: newApiKey || undefined,
    model: model || DEFAULT_FISH_TTS_MODEL,
    referenceId,
    updatedById: admin.id,
  });
  return NextResponse.json({
    model,
    referenceId,
    maskedKey: `••••••••${apiKey.slice(-4)}`,
    source: newApiKey ? "dashboard" : current.source,
  });
}
