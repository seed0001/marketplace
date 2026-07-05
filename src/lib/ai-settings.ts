import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

function encryptionKey() {
  const secret = process.env.AI_SETTINGS_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or AI_SETTINGS_ENCRYPTION_KEY is required");
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  return {
    encryptedApiKey: encrypted.toString("base64"),
    keyIv: iv.toString("base64"),
    keyTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptApiKey(encryptedApiKey: string, keyIv: string, keyTag: string) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(keyIv, "base64"));
  decipher.setAuthTag(Buffer.from(keyTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedApiKey, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getOpenRouterConfiguration() {
  const settings = await prisma.aiProviderSettings.findUnique({ where: { id: "default" } });
  let apiKey = process.env.OPENROUTER_API_KEY || "";
  if (settings?.encryptedApiKey && settings.keyIv && settings.keyTag) {
    try {
      apiKey = decryptApiKey(settings.encryptedApiKey, settings.keyIv, settings.keyTag);
    } catch (error) {
      console.error("Could not decrypt stored OpenRouter key", error);
    }
  }

  return {
    apiKey,
    model: settings?.model || process.env.OPENROUTER_MODEL || "openrouter/auto",
    source: settings?.encryptedApiKey ? "dashboard" : apiKey ? "environment" : "unconfigured",
  };
}
