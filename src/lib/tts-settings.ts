import { prisma } from "@/lib/prisma";
import { decryptApiKey, encryptApiKey } from "@/lib/ai-settings";

export const DEFAULT_FISH_TTS_MODEL = "s2.1-pro-free";

export async function getFishTtsConfiguration() {
  const settings = await prisma.ttsProviderSettings.findUnique({ where: { id: "default" } });
  let apiKey = process.env.FISH_API_KEY || "";
  if (settings?.encryptedApiKey && settings.keyIv && settings.keyTag) {
    try {
      apiKey = decryptApiKey(settings.encryptedApiKey, settings.keyIv, settings.keyTag);
    } catch (error) {
      console.error("Could not decrypt stored Fish Audio key", error);
    }
  }
  return {
    apiKey,
    model: settings?.model || process.env.FISH_TTS_MODEL || DEFAULT_FISH_TTS_MODEL,
    referenceId: settings?.referenceId || process.env.FISH_TTS_REFERENCE_ID || "",
    source: settings?.encryptedApiKey ? "dashboard" : apiKey ? "environment" : "unconfigured",
  };
}

export async function saveFishTtsConfiguration(input: {
  apiKey?: string;
  model: string;
  referenceId?: string;
  updatedById: string;
}) {
  const encrypted = input.apiKey ? encryptApiKey(input.apiKey) : {};
  return prisma.ttsProviderSettings.upsert({
    where: { id: "default" },
    update: {
      model: input.model,
      referenceId: input.referenceId || null,
      updatedById: input.updatedById,
      ...encrypted,
    },
    create: {
      id: "default",
      model: input.model,
      referenceId: input.referenceId || null,
      updatedById: input.updatedById,
      ...encrypted,
    },
  });
}
