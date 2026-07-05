import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compileBriefing, type BriefingKind } from "@/lib/briefings";

const KINDS = new Set<BriefingKind>(["owner_marketplace", "seller_business"]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await prisma.user.findFirst({
    where: { id: session.user.id, role: "ADMIN" },
    select: { id: true, name: true },
  });
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const kind = body.kind as BriefingKind;
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Unknown briefing type." }, { status: 400 });
  const report = await compileBriefing(kind, admin.id, admin.name);
  return NextResponse.json({ ...report, kind, generatedAt: new Date().toISOString() });
}
