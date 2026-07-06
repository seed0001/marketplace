import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/api-keys";

// The seller-facing shape of a key. Never includes the token or its hash.
function serializeKey(key: {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    const keys = await prisma.sellerApiKey.findMany({
      where: { userId: session.user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(keys.map(serializeKey));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "A name for the key is required" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: "Key name must be 60 characters or fewer" }, { status: 400 });
    }

    const activeCount = await prisma.sellerApiKey.count({
      where: { userId: session.user.id, revokedAt: null },
    });
    if (activeCount >= 20) {
      return NextResponse.json(
        { error: "You have reached the maximum of 20 active keys. Revoke one to create another." },
        { status: 400 }
      );
    }

    const { token, prefix, hashedKey } = generateApiKey();
    const key = await prisma.sellerApiKey.create({
      data: { userId: session.user.id, name, prefix, hashedKey },
    });

    // The plaintext token is returned exactly once, here. It is never stored
    // and cannot be recovered later.
    return NextResponse.json({ ...serializeKey(key), token }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
