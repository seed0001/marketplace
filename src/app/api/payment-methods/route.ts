import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

const TYPES = ["venmo", "cashapp", "paypal", "zelle", "other"];
const MAX_METHODS = 10;
const MAX_HANDLE = 200;

export async function GET() {
  try {
    const session = await requireAuth();
    const methods = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(methods);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Replaces the current user's set of payment methods. These are how sellers
 * tell buyers to pay them (Venmo handle, Cash App tag, PayPal link, etc.).
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = Array.isArray(body?.methods) ? body.methods : [];

    const cleaned = input
      .filter(
        (m: unknown): m is { type: string; handle: string } =>
          !!m &&
          typeof (m as { type?: unknown }).type === "string" &&
          typeof (m as { handle?: unknown }).handle === "string"
      )
      .map((m: { type: string; handle: string }) => ({
        type: TYPES.includes(m.type) ? m.type : "other",
        handle: m.handle.trim().slice(0, MAX_HANDLE),
      }))
      .filter((m: { handle: string }) => m.handle.length > 0)
      .slice(0, MAX_METHODS);

    await prisma.$transaction([
      prisma.paymentMethod.deleteMany({ where: { userId: session.user.id } }),
      prisma.paymentMethod.createMany({
        data: cleaned.map((m: { type: string; handle: string }) => ({
          ...m,
          userId: session.user.id,
        })),
      }),
    ]);

    const methods = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(methods);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
