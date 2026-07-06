import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { encryptApiKey, getOpenRouterConfiguration } from "@/lib/ai-settings";
import { prisma } from "@/lib/prisma";

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
  const settings = await prisma.aiProviderSettings.findUnique({
    where: { id: "default" },
    select: { model: true, encryptedApiKey: true, updatedAt: true, updatedBy: { select: { name: true, email: true } } },
  });
  const config = await getOpenRouterConfiguration();
  return NextResponse.json({
    model: config.model,
    persona: config.persona,
    configured: Boolean(config.apiKey),
    source: config.source,
    maskedKey: config.apiKey ? `••••••••${config.apiKey.slice(-4)}` : "",
    updatedAt: settings?.updatedAt || null,
    updatedBy: settings?.updatedBy?.name || settings?.updatedBy?.email || null,
  });
}

export async function PUT(request: NextRequest) {
  const admin = await administrator();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const newApiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const persona = typeof body.persona === "string" ? body.persona.trim() : "";
  if (!model || model.length > 200 || !/^[a-zA-Z0-9._:/-]+$/.test(model)) {
    return NextResponse.json({ error: "Enter a valid OpenRouter model ID." }, { status: 400 });
  }
  if (persona.length > 8000) {
    return NextResponse.json({ error: "The persona statement is too long." }, { status: 400 });
  }
  if (newApiKey && !newApiKey.startsWith("sk-or-")) {
    return NextResponse.json({ error: "That does not look like an OpenRouter API key." }, { status: 400 });
  }

  const current = await getOpenRouterConfiguration();
  const keyToValidate = newApiKey || current.apiKey;
  if (!keyToValidate) {
    return NextResponse.json({ error: "Provide an OpenRouter API key." }, { status: 400 });
  }

  try {
    const modelsResponse = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${keyToValidate}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!modelsResponse.ok) {
      return NextResponse.json({ error: "OpenRouter rejected that API key." }, { status: 400 });
    }
    if (model !== "openrouter/auto") {
      const models = await modelsResponse.json();
      const exists = Array.isArray(models?.data) && models.data.some((item: { id?: string }) => item.id === model);
      if (!exists) return NextResponse.json({ error: "That model ID was not found on OpenRouter." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not verify the configuration with OpenRouter." }, { status: 502 });
  }

  const encrypted = newApiKey ? encryptApiKey(newApiKey) : {};
  const personaValue = persona || null;
  await prisma.aiProviderSettings.upsert({
    where: { id: "default" },
    update: { model, persona: personaValue, updatedById: admin.id, ...encrypted },
    create: { id: "default", model, persona: personaValue, updatedById: admin.id, ...encryptApiKey(keyToValidate) },
  });

  return NextResponse.json({ ok: true, model, persona: persona, maskedKey: `••••••••${keyToValidate.slice(-4)}` });
}
