import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Human-readable, greppable token prefix. Everything after it is 32 random
// bytes rendered as base64url, giving ~256 bits of entropy per key.
const TOKEN_PREFIX = "mk_live_";

// How much of the plaintext token we keep, in the clear, for display. Enough
// for a seller to recognise a key in a list without exposing anything usable.
const DISPLAY_PREFIX_LENGTH = TOKEN_PREFIX.length + 6;

export type GeneratedApiKey = {
  /** The full plaintext token. Shown to the seller once, then never again. */
  token: string;
  /** Short non-secret slice stored for display, e.g. "mk_live_a1b2c3". */
  prefix: string;
  /** SHA-256 hex digest of the token — the only form persisted. */
  hashedKey: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiKey(): GeneratedApiKey {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  return {
    token,
    prefix: token.slice(0, DISPLAY_PREFIX_LENGTH),
    hashedKey: hashToken(token),
  };
}

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export type ApiKeyPrincipal = {
  userId: string;
  keyId: string;
};

type ApiUsageRoute =
  | "GET /api/v1/me"
  | "GET /api/v1/listings"
  | "POST /api/v1/listings"
  | "GET /api/v1/listings/:id"
  | "PUT /api/v1/listings/:id"
  | "DELETE /api/v1/listings/:id";

/**
 * Authenticate a programmatic request via its `Authorization: Bearer <token>`
 * header. Returns the owning seller's identity, or null when the token is
 * missing, malformed, unknown, or revoked. On success the key's `lastUsedAt`
 * is refreshed so sellers can see which keys are active.
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyPrincipal | null> {
  const token = extractBearerToken(request);
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  const hashedKey = hashToken(token);
  const record = await prisma.sellerApiKey.findUnique({ where: { hashedKey } });
  if (!record || record.revokedAt) return null;

  // Constant-time compare on the hashes as belt-and-suspenders against timing
  // side channels, even though the DB lookup already matched on the hash.
  const provided = Buffer.from(hashedKey);
  const stored = Buffer.from(record.hashedKey);
  if (provided.length !== stored.length || !timingSafeEqual(provided, stored)) return null;

  await prisma.sellerApiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return { userId: record.userId, keyId: record.id };
}

async function recordApiKeyUsage(
  request: NextRequest,
  principal: ApiKeyPrincipal,
  route: ApiUsageRoute,
  statusCode: number
) {
  try {
    await prisma.sellerApiKeyUsage.create({
      data: {
        apiKeyId: principal.keyId,
        userId: principal.userId,
        method: request.method,
        path: request.nextUrl.pathname,
        route,
        statusCode,
        userAgent: request.headers.get("user-agent"),
      },
    });
  } catch (error) {
    console.error("Could not record API key usage", error);
  }
}

export async function jsonWithApiUsage<JsonBody>(
  request: NextRequest,
  principal: ApiKeyPrincipal,
  route: ApiUsageRoute,
  body: JsonBody,
  init?: ResponseInit
) {
  const response = NextResponse.json(body, init);
  await recordApiKeyUsage(request, principal, route, response.status);
  return response;
}
